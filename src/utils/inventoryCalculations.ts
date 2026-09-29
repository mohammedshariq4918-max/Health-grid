import { FacilityInventoryItem, Medicine, HealthCentre, StockStatus, TransferRecommendation, TransferCalculationDetails } from '../types';

export function calculateEffectiveDailyUsage(baseDailyUsage: number, surgePercent: number): number {
  if (baseDailyUsage <= 0) return 0.1;
  const multiplier = 1 + (surgePercent / 100);
  return Number((baseDailyUsage * multiplier).toFixed(1));
}

export function calculateDaysOfSupply(currentStock: number, baseDailyUsage: number, surgePercent: number = 0): number {
  const usage = calculateEffectiveDailyUsage(baseDailyUsage, surgePercent);
  if (usage <= 0) return 999;
  return Number((currentStock / usage).toFixed(1));
}

export function calculateDaysOfSupplyWithIncoming(
  currentStock: number,
  incomingQty: number,
  baseDailyUsage: number,
  surgePercent: number = 0
): number {
  const usage = calculateEffectiveDailyUsage(baseDailyUsage, surgePercent);
  if (usage <= 0) return 999;
  return Number(((currentStock + incomingQty) / usage).toFixed(1));
}

export function getStockStatus(daysOfSupply: number, currentStock: number, minReserve: number): StockStatus {
  if (daysOfSupply <= 3.0 || currentStock < minReserve * 0.4) {
    return 'CRITICAL';
  }
  if (daysOfSupply <= 7.0 || currentStock < minReserve) {
    return 'WARNING';
  }
  if (daysOfSupply >= 25.0) {
    return 'SURPLUS';
  }
  return 'ADEQUATE';
}

export function getForecastedStockoutDate(daysOfSupply: number): { formattedDate: string; daysRemaining: number } {
  const days = Math.max(0, Math.floor(daysOfSupply));
  // Baseline simulated reference date: 2026-09-29
  const baseDate = new Date('2026-09-29T00:00:00Z');
  baseDate.setDate(baseDate.getDate() + days);

  const formatted = baseDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    formattedDate: formatted,
    daysRemaining: daysOfSupply,
  };
}

export function generateTransferRecommendations(
  inventory: FacilityInventoryItem[],
  medicines: Medicine[],
  centres: HealthCentre[],
  surgePercent: number = 0
): TransferRecommendation[] {
  const recommendations: TransferRecommendation[] = [];
  const medicineMap = new Map(medicines.map(m => [m.id, m]));
  const centreMap = new Map(centres.map(c => [c.id, c]));

  // Group inventory items by medicine
  const itemsByMedicine = new Map<string, FacilityInventoryItem[]>();
  for (const item of inventory) {
    const list = itemsByMedicine.get(item.medicineId) || [];
    list.push(item);
    itemsByMedicine.set(item.medicineId, list);
  }

  for (const [medId, facilityItems] of itemsByMedicine.entries()) {
    const med = medicineMap.get(medId);
    if (!med) continue;

    // Identify facilities facing shortage (<= 7 days or under safe threshold)
    const shortageItems = facilityItems
      .map(item => {
        const usage = calculateEffectiveDailyUsage(item.dailyUsage, surgePercent);
        const daysLeft = calculateDaysOfSupply(item.currentStock, item.dailyUsage, surgePercent);
        return { item, usage, daysLeft };
      })
      .filter(x => x.daysLeft <= 7.0 || x.item.currentStock < x.item.minReserve)
      .sort((a, b) => a.daysLeft - b.daysLeft); // Most urgent first

    // Identify candidate donors (>= 18 days left and stock > safe donor reserve)
    const surplusCandidates = facilityItems
      .map(item => {
        const usage = calculateEffectiveDailyUsage(item.dailyUsage, surgePercent);
        const daysLeft = calculateDaysOfSupply(item.currentStock, item.dailyUsage, surgePercent);
        // Donor must retain at least 18 days buffer of consumption
        const donorMinSafetyThreshold = Math.ceil(usage * 18);
        const availableSurplus = Math.max(0, item.currentStock - donorMinSafetyThreshold);
        return { item, usage, daysLeft, donorMinSafetyThreshold, availableSurplus };
      })
      .filter(x => x.daysLeft >= 18.0 && x.availableSurplus > 0)
      .sort((a, b) => b.availableSurplus - a.availableSurplus); // Largest surplus first

    for (const recipient of shortageItems) {
      if (surplusCandidates.length === 0) continue;

      // Match with the best candidate donor (prioritize closest distance if available)
      const recipientCentre = centreMap.get(recipient.item.centreId);
      if (!recipientCentre) continue;

      // Find best donor
      const donor = surplusCandidates.find(d => d.item.centreId !== recipient.item.centreId && d.availableSurplus > 0);
      if (!donor) continue;

      const donorCentre = centreMap.get(donor.item.centreId);
      if (!donorCentre) continue;

      // How many units needed for recipient to reach 14 days of safety?
      const target14DaysUnits = Math.ceil(recipient.usage * 14);
      const recipientDeficit = Math.max(0, target14DaysUnits - recipient.item.currentStock);
      if (recipientDeficit <= 0) continue;

      // Transfer quantity is capped by donor surplus and recipient deficit
      let transferQty = Math.min(recipientDeficit, donor.availableSurplus);

      // Round to neat packaging units if possible (e.g. 10s or 5s for tablets/capsules/vials)
      if (transferQty > 20) {
        transferQty = Math.floor(transferQty / 10) * 10;
      }
      if (transferQty <= 0) continue;

      // Calculate post-transfer projections
      const recipientDaysAfter = Number(((recipient.item.currentStock + transferQty) / recipient.usage).toFixed(1));
      const donorDaysAfter = Number(((donor.item.currentStock - transferQty) / donor.usage).toFixed(1));

      // Transit info
      const transit = recipientCentre.distanceTo[donor.item.centreId] || { distanceKm: 30, transitTimeMins: 45, roadType: 'State Highway' };

      const urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' = 
        recipient.daysLeft <= 3.0 || med.isColdChain ? 'CRITICAL' : recipient.daysLeft <= 5.0 ? 'HIGH' : 'MODERATE';

      const calculations: TransferCalculationDetails = {
        recipientCurrentStock: recipient.item.currentStock,
        recipientDailyUsage: recipient.usage,
        recipientDaysLeftBefore: recipient.daysLeft,
        recipientDaysLeftAfter: recipientDaysAfter,
        donorCurrentStock: donor.item.currentStock,
        donorDailyUsage: donor.usage,
        donorDaysLeftBefore: donor.daysLeft,
        donorDaysLeftAfter: donorDaysAfter,
        donorSafeReserveThreshold: donor.donorMinSafetyThreshold,
        targetRecipientDays: 14,
        distanceKm: transit.distanceKm,
        transitTimeMins: transit.transitTimeMins,
      };

      const reason = `Urgent Stock-Out Mitigation: ${recipientCentre.shortName} has only ${recipient.daysLeft} days (${recipient.item.currentStock} ${med.unit}) remaining at daily run-rate ${recipient.usage} ${med.unit}/day. ${donorCentre.shortName} has healthy ${donor.daysLeft} days surplus. Transferring ${transferQty} ${med.unit} restores ${recipientCentre.shortName} to ${recipientDaysAfter} days safe operating buffer while leaving ${donorCentre.shortName} with protected ${donorDaysAfter} days stock (>18-day safe baseline).`;

      recommendations.push({
        id: `rec-${donor.item.centreId}-to-${recipient.item.centreId}-${med.id}`,
        medicineId: med.id,
        fromCentreId: donor.item.centreId,
        toCentreId: recipient.item.centreId,
        recommendedQty: transferQty,
        urgency,
        reason,
        calculations,
        status: 'RECOMMENDED',
      });

      // Update donor available surplus for subsequent recommendations in this loop
      donor.availableSurplus -= transferQty;
    }
  }

  return recommendations;
}
