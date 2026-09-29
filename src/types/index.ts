export type StockStatus = 'CRITICAL' | 'WARNING' | 'ADEQUATE' | 'SURPLUS';

export type MedicineCategory = 
  | 'Analgesics / Antipyretic'
  | 'Antibiotics'
  | 'Electrolytes / Dehydration'
  | 'Chronic / NCD'
  | 'Cardiovascular'
  | 'Vaccines & Immunoglobulins'
  | 'Maternal & Child Health'
  | 'Emergency & Anti-Malarial';

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: MedicineCategory;
  form: string;
  unit: string;
  storageCondition: string;
  isColdChain: boolean;
  essentialDrugListCode: string;
  description: string;
}

export interface TransitInfo {
  distanceKm: number;
  transitTimeMins: number;
  roadType: string;
}

export interface HealthCentre {
  id: string;
  name: string;
  shortName: string;
  type: string;
  district: string;
  state: string;
  populationServed: number;
  beds: number;
  doctorCount: number;
  pharmacistName: string;
  contactPhone: string;
  address: string;
  coldChainWorking: boolean;
  distanceTo: Record<string, TransitInfo>;
}

export interface FacilityInventoryItem {
  id: string;
  centreId: string;
  medicineId: string;
  currentStock: number;
  dailyUsage: number;
  minReserve: number; // Safe buffer threshold
  incomingQty: number; // Scheduled incoming supplies
  incomingDeliveryDate: string | null; // e.g. "2026-10-04"
  batchNumber: string;
  expiryDate: string;
  lastUpdated: string;
}

export interface DemandScenario {
  id: string;
  name: string;
  surgePercent: number; // e.g. 0, 25, 50, 100
  description: string;
}

export interface TransferCalculationDetails {
  recipientCurrentStock: number;
  recipientDailyUsage: number;
  recipientDaysLeftBefore: number;
  recipientDaysLeftAfter: number;
  donorCurrentStock: number;
  donorDailyUsage: number;
  donorDaysLeftBefore: number;
  donorDaysLeftAfter: number;
  donorSafeReserveThreshold: number;
  targetRecipientDays: number;
  distanceKm: number;
  transitTimeMins: number;
}

export interface TransferRecommendation {
  id: string;
  medicineId: string;
  fromCentreId: string;
  toCentreId: string;
  recommendedQty: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE';
  reason: string;
  calculations: TransferCalculationDetails;
  status: 'RECOMMENDED' | 'APPROVED' | 'DISPATCHED' | 'CANCELLED';
  dispatchedAt?: string;
  dispatchTrackingId?: string;
}

export interface StockMovementLog {
  id: string;
  timestamp: string;
  centreId: string;
  medicineId: string;
  type: 'CONSUMPTION' | 'RECEIPT' | 'AUDIT_ADJUSTMENT' | 'TRANSFER_OUT' | 'TRANSFER_IN';
  quantity: number;
  previousStock: number;
  newStock: number;
  notes: string;
  operator: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode: 'live' | 'demo';
  metadata?: {
    medicineName?: string;
    centreName?: string;
    criticalCount?: number;
    recommendedTransfers?: number;
  };
}
