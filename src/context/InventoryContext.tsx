import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  HealthCentre, 
  Medicine, 
  FacilityInventoryItem, 
  TransferRecommendation, 
  StockMovementLog, 
  AIMessage, 
  StockStatus 
} from '../types';
import { HEALTH_CENTRES, MEDICINES, INITIAL_INVENTORY, DEMAND_SCENARIOS } from '../data/mockData';
import { 
  calculateDaysOfSupply, 
  calculateDaysOfSupplyWithIncoming, 
  calculateEffectiveDailyUsage, 
  getStockStatus, 
  generateTransferRecommendations,
  getForecastedStockoutDate
} from '../utils/inventoryCalculations';

export type AppPage = 'overview' | 'centres' | 'inventory' | 'forecast' | 'planner' | 'assistant';

interface InventoryContextType {
  centres: HealthCentre[];
  medicines: Medicine[];
  inventory: FacilityInventoryItem[];
  selectedCentreId: string | 'all';
  setSelectedCentreId: (id: string | 'all') => void;
  activeSurgePercent: number;
  setActiveSurgePercent: (percent: number) => void;
  selectedScenarioId: string;
  applyScenario: (scenarioId: string) => void;
  recommendations: TransferRecommendation[];
  movementLogs: StockMovementLog[];
  updateStock: (
    centreId: string, 
    medicineId: string, 
    deltaOrNewStock: number, 
    actionType: 'CONSUMPTION' | 'RECEIPT' | 'AUDIT_ADJUSTMENT', 
    notes: string
  ) => void;
  executeTransfer: (recommendationId: string) => boolean;
  executeCustomTransfer: (
    fromCentreId: string, 
    toCentreId: string, 
    medicineId: string, 
    qty: number, 
    notes: string
  ) => boolean;
  resetToSampleData: () => void;
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
  
  // AI Assistant state
  aiMessages: AIMessage[];
  isAILoading: boolean;
  aiMode: 'live' | 'demo';
  sendAIMessage: (prompt: string, queryType?: string) => Promise<void>;
  clearAIChat: () => void;

  // Helper stats
  criticalMedicinesCount: number;
  warningMedicinesCount: number;
  totalUnitsMonitored: number;
  atRiskCentresCount: number;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

const STORAGE_KEY_INVENTORY = 'healthgrid_inventory_v1';
const STORAGE_KEY_LOGS = 'healthgrid_logs_v1';
const STORAGE_KEY_TRANSFERS = 'healthgrid_transfers_v1';

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [centres] = useState<HealthCentre[]>(HEALTH_CENTRES);
  const [medicines] = useState<Medicine[]>(MEDICINES);
  const [selectedCentreId, setSelectedCentreId] = useState<string | 'all'>('all');
  const [activeSurgePercent, setActiveSurgePercent] = useState<number>(0);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('baseline');
  const [activePage, setActivePage] = useState<AppPage>('overview');

  // Load or initialize inventory
  const [inventory, setInventory] = useState<FacilityInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVENTORY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback to initial
    }
    return INITIAL_INVENTORY;
  });

  // Movement logs
  const [movementLogs, setMovementLogs] = useState<StockMovementLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'log-seed-1',
        timestamp: '2026-09-29T08:30:00Z',
        centreId: 'mysuru-phc',
        medicineId: 'MED-PCM-500',
        type: 'RECEIPT',
        quantity: 2000,
        previousStock: 3400,
        newStock: 5400,
        notes: 'Monthly bulk allotment received from District Medical Store (DMS Mysuru).',
        operator: 'Chief Pharmacist Prema M.',
      },
      {
        id: 'log-seed-2',
        timestamp: '2026-09-29T07:45:00Z',
        centreId: 'hunsur-phc',
        medicineId: 'MED-RAB-05',
        type: 'CONSUMPTION',
        quantity: 6,
        previousStock: 13,
        newStock: 7,
        notes: 'Dispensed for multiple stray canine bite cases in Hunsur border ward.',
        operator: 'Pharmacist Kavita Naik',
      },
    ];
  });

  // Approved or custom executed transfers
  const [transfers, setTransfers] = useState<TransferRecommendation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSFERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Persist inventory and logs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
    } catch (e) {
      console.warn('Failed to save inventory to storage', e);
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(movementLogs));
    } catch (e) {
      console.warn('Failed to save logs to storage', e);
    }
  }, [movementLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify(transfers));
    } catch (e) {
      console.warn('Failed to save transfers to storage', e);
    }
  }, [transfers]);

  // Dynamically generated recommendations based on current inventory & surge
  const generatedRecommendations = useMemo(() => {
    return generateTransferRecommendations(inventory, medicines, centres, activeSurgePercent);
  }, [inventory, medicines, centres, activeSurgePercent]);

  // Combine recommendations with executed transfer states
  const recommendations = useMemo(() => {
    const executedMap = new Map(transfers.map(t => [t.id, t]));
    return generatedRecommendations.map(rec => {
      if (executedMap.has(rec.id)) {
        return executedMap.get(rec.id)!;
      }
      return rec;
    });
  }, [generatedRecommendations, transfers]);

  // Scenario switch
  const applyScenario = useCallback((scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const scenario = DEMAND_SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      setActiveSurgePercent(scenario.surgePercent);
    }
  }, []);

  // Update Stock
  const updateStock = useCallback((
    centreId: string, 
    medicineId: string, 
    value: number, 
    actionType: 'CONSUMPTION' | 'RECEIPT' | 'AUDIT_ADJUSTMENT', 
    notes: string
  ) => {
    setInventory(prev => {
      return prev.map(item => {
        if (item.centreId === centreId && item.medicineId === medicineId) {
          const prevStock = item.currentStock;
          let newStock = prevStock;

          if (actionType === 'CONSUMPTION') {
            newStock = Math.max(0, prevStock - value);
          } else if (actionType === 'RECEIPT') {
            newStock = prevStock + value;
          } else if (actionType === 'AUDIT_ADJUSTMENT') {
            newStock = Math.max(0, value);
          }

          const log: StockMovementLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toISOString(),
            centreId,
            medicineId,
            type: actionType,
            quantity: Math.abs(newStock - prevStock),
            previousStock: prevStock,
            newStock,
            notes: notes || `Manual stock update (${actionType})`,
            operator: 'Supply Chain Officer (Interactive)',
          };

          setMovementLogs(prevLogs => [log, ...prevLogs]);

          return {
            ...item,
            currentStock: newStock,
            lastUpdated: new Date().toISOString(),
          };
        }
        return item;
      });
    });
  }, []);

  // Execute Recommended Transfer
  const executeTransfer = useCallback((recommendationId: string): boolean => {
    const rec = recommendations.find(r => r.id === recommendationId);
    if (!rec || rec.status !== 'RECOMMENDED') return false;

    const fromItem = inventory.find(i => i.centreId === rec.fromCentreId && i.medicineId === rec.medicineId);
    const toItem = inventory.find(i => i.centreId === rec.toCentreId && i.medicineId === rec.medicineId);

    if (!fromItem || !toItem) return false;
    if (fromItem.currentStock < rec.recommendedQty) return false;

    const trackingId = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    // Mutate inventory
    setInventory(prev => {
      return prev.map(item => {
        if (item.centreId === rec.fromCentreId && item.medicineId === rec.medicineId) {
          return {
            ...item,
            currentStock: item.currentStock - rec.recommendedQty,
            lastUpdated: now,
          };
        }
        if (item.centreId === rec.toCentreId && item.medicineId === rec.medicineId) {
          return {
            ...item,
            currentStock: item.currentStock + rec.recommendedQty,
            lastUpdated: now,
          };
        }
        return item;
      });
    });

    // Record movement logs
    const outLog: StockMovementLog = {
      id: `log-trx-out-${Date.now()}`,
      timestamp: now,
      centreId: rec.fromCentreId,
      medicineId: rec.medicineId,
      type: 'TRANSFER_OUT',
      quantity: rec.recommendedQty,
      previousStock: fromItem.currentStock,
      newStock: fromItem.currentStock - rec.recommendedQty,
      notes: `Dispatched redistribution consignment #${trackingId} to ${rec.toCentreId}`,
      operator: 'Redistribution Coordinator',
    };

    const inLog: StockMovementLog = {
      id: `log-trx-in-${Date.now()}`,
      timestamp: now,
      centreId: rec.toCentreId,
      medicineId: rec.medicineId,
      type: 'TRANSFER_IN',
      quantity: rec.recommendedQty,
      previousStock: toItem.currentStock,
      newStock: toItem.currentStock + rec.recommendedQty,
      notes: `Received emergency transfer consignment #${trackingId} from ${rec.fromCentreId}`,
      operator: 'Redistribution Coordinator',
    };

    setMovementLogs(prev => [inLog, outLog, ...prev]);

    // Update transfer status
    const updatedRec: TransferRecommendation = {
      ...rec,
      status: 'DISPATCHED',
      dispatchedAt: now,
      dispatchTrackingId: trackingId,
    };

    setTransfers(prev => [updatedRec, ...prev.filter(t => t.id !== rec.id)]);
    return true;
  }, [recommendations, inventory]);

  // Execute Custom Transfer
  const executeCustomTransfer = useCallback((
    fromCentreId: string, 
    toCentreId: string, 
    medicineId: string, 
    qty: number, 
    notes: string
  ): boolean => {
    if (fromCentreId === toCentreId || qty <= 0) return false;

    const fromItem = inventory.find(i => i.centreId === fromCentreId && i.medicineId === medicineId);
    const toItem = inventory.find(i => i.centreId === toCentreId && i.medicineId === medicineId);
    if (!fromItem || !toItem || fromItem.currentStock < qty) return false;

    const trackingId = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    setInventory(prev => {
      return prev.map(item => {
        if (item.centreId === fromCentreId && item.medicineId === medicineId) {
          return {
            ...item,
            currentStock: item.currentStock - qty,
            lastUpdated: now,
          };
        }
        if (item.centreId === toCentreId && item.medicineId === medicineId) {
          return {
            ...item,
            currentStock: item.currentStock + qty,
            lastUpdated: now,
          };
        }
        return item;
      });
    });

    const outLog: StockMovementLog = {
      id: `log-cust-out-${Date.now()}`,
      timestamp: now,
      centreId: fromCentreId,
      medicineId,
      type: 'TRANSFER_OUT',
      quantity: qty,
      previousStock: fromItem.currentStock,
      newStock: fromItem.currentStock - qty,
      notes: notes || `Direct manual transfer #${trackingId} to ${toCentreId}`,
      operator: 'District Operations Officer',
    };

    const inLog: StockMovementLog = {
      id: `log-cust-in-${Date.now()}`,
      timestamp: now,
      centreId: toCentreId,
      medicineId,
      type: 'TRANSFER_IN',
      quantity: qty,
      previousStock: toItem.currentStock,
      newStock: toItem.currentStock + qty,
      notes: notes || `Direct manual transfer #${trackingId} from ${fromCentreId}`,
      operator: 'District Operations Officer',
    };

    setMovementLogs(prev => [inLog, outLog, ...prev]);
    return true;
  }, [inventory]);

  // Reset to sample data
  const resetToSampleData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_INVENTORY);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_TRANSFERS);
    setInventory(INITIAL_INVENTORY);
    setTransfers([]);
    setActiveSurgePercent(0);
    setSelectedScenarioId('baseline');
    setSelectedCentreId('all');
    setMovementLogs([
      {
        id: `log-reset-${Date.now()}`,
        timestamp: new Date().toISOString(),
        centreId: 'mysuru-phc',
        medicineId: 'MED-PCM-500',
        type: 'AUDIT_ADJUSTMENT',
        quantity: 0,
        previousStock: 5400,
        newStock: 5400,
        notes: 'Pristine simulated benchmark dataset restored.',
        operator: 'System Admin',
      },
    ]);
  }, []);

  // AI Assistant state & messaging
  const [aiMode, setAiMode] = useState<'live' | 'demo'>('demo');
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I am your **HEALTHGRID AI Supply Chain Assistant** for Mysuru District Public Health Centres.

I continuously analyze stock levels, consumption run-rates, and logistics constraints across **Mysuru PHC, Nanjangud PHC, and Hunsur PHC**.

You can ask me to:
- 📊 **Summarize high-risk shortages** across the 3 health centres
- 🔄 **Explain the reasoning** behind recommended inter-facility transfers
- 📈 **Evaluate epidemic surge impact** (e.g., +25% Dengue/Fever surge)
- 📝 **Draft an urgent procurement indent** for the District Medical Officer

How can I assist your health logistics team today?`,
      timestamp: '2026-09-29T09:00:00Z',
      mode: 'demo',
    },
  ]);

  const clearAIChat = useCallback(() => {
    setAiMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'Chat refreshed. How can I help analyze inventory, stockout risks, or transfer plans?',
        timestamp: new Date().toISOString(),
        mode: aiMode,
      },
    ]);
  }, [aiMode]);

  // Core AI message sender (attempts /api/ai-explain, with seamless intelligent fallback)
  const sendAIMessage = useCallback(async (prompt: string, queryType?: string) => {
    if (!prompt.trim()) return;

    const userMsg: AIMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
      mode: aiMode,
    };

    setAiMessages(prev => [...prev, userMsg]);
    setIsAILoading(true);

    // Build context summary to feed AI
    const criticalItems = inventory
      .map(item => {
        const med = medicines.find(m => m.id === item.medicineId);
        const centre = centres.find(c => c.id === item.centreId);
        const days = calculateDaysOfSupply(item.currentStock, item.dailyUsage, activeSurgePercent);
        const status = getStockStatus(days, item.currentStock, item.minReserve);
        return {
          medicineName: med?.name,
          centreName: centre?.shortName,
          currentStock: item.currentStock,
          daysLeft: days,
          status,
          isColdChain: med?.isColdChain,
          incomingQty: item.incomingQty,
          incomingDate: item.incomingDeliveryDate,
        };
      })
      .filter(x => x.daysLeft <= 7 || x.status === 'CRITICAL');

    const transferSummary = recommendations.map(r => {
      const med = medicines.find(m => m.id === r.medicineId);
      const from = centres.find(c => c.id === r.fromCentreId);
      const to = centres.find(c => c.id === r.toCentreId);
      return {
        medicine: med?.name,
        from: from?.shortName,
        to: to?.shortName,
        qty: r.recommendedQty,
        urgency: r.urgency,
        distanceKm: r.calculations.distanceKm,
        transitTimeMins: r.calculations.transitTimeMins,
        status: r.status,
      };
    });

    const payload = {
      prompt,
      queryType,
      activeSurgePercent,
      criticalItemsCount: criticalItems.length,
      criticalItems,
      transferSummary,
      activeCentre: selectedCentreId,
    };

    try {
      const response = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setAiMode(data.mode === 'live' ? 'live' : 'demo');
        setAiMessages(prev => [
          ...prev,
          {
            id: `msg-ai-${Date.now()}`,
            role: 'assistant',
            content: data.explanation || data.text,
            timestamp: new Date().toISOString(),
            mode: data.mode === 'live' ? 'live' : 'demo',
          },
        ]);
        setIsAILoading(false);
        return;
      }
    } catch {
      // Backend route not reachable or threw error: use built-in intelligent demo engine
    }

    // Intelligent Demo Engine Fallback
    setAiMode('demo');
    await new Promise(r => setTimeout(r, 600)); // natural response feel

    let demoContent = '';
    const lower = prompt.toLowerCase();

    if (lower.includes('rabies') || lower.includes('vaccine') || lower.includes('hunsur')) {
      demoContent = `### 🚨 Urgent Clinical Assessment: Anti-Rabies Vaccine (ARV) at Hunsur PHC

**Current Situation:**
- **Facility:** Hunsur Border PHC (Serving 29,100 citizens)
- **Stock on Hand:** **7 vials**
- **Daily Usage:** **4 vials/day** (at current ${activeSurgePercent > 0 ? `+${activeSurgePercent}% surge` : 'baseline'})
- **Projected Run-out:** **1.75 days** (Emergency critical stock-out by Oct 1, 2026)
- **Minimum Safe Buffer:** 25 vials (Deficit of 18 vials)

**Why this is urgent:**
Rabies Post-Exposure Prophylaxis (PEP) carries a 100% case fatality rate once clinical symptoms manifest. Hunsur borders forest fringes where canine and wildlife interactions are frequent.

**Algorithmic Redistribution Recommendation:**
- **Donor Facility:** Mysuru Urban PHC has **160 vials** (32.0 days of supply).
- **Recommended Transfer:** **40 vials** dispatched via SH 88 (46 km, ~68 minutes transit time).
- **Post-Transfer Balance:**
  - Hunsur PHC gains **10.0 days of safety** (reaches 47 vials total).
  - Mysuru PHC retains **120 vials** (24.0 days of safety), remaining well above the 18-day safe buffer threshold.
- **Logistics Note:** Mandatory active cold-chain carrier (2°C to 8°C with digital datalogger).`;
    } else if (lower.includes('surge') || lower.includes('fever') || lower.includes('dengue') || lower.includes('epidemic')) {
      demoContent = `### 📈 Predictive Surge Impact Analysis (${activeSurgePercent}% Demand Multiplier)

**Demand Stress Testing Summary:**
When patient footfall and daily consumption rise by **${activeSurgePercent}%**:

1. **Paracetamol 500mg:**
   - **Mysuru PHC:** Baseline usage (120/day) rises to **${calculateEffectiveDailyUsage(120, activeSurgePercent)}/day**. Stock remains resilient at ${calculateDaysOfSupply(5400, 120, activeSurgePercent)} days.
   - **Nanjangud PHC:** Usage rises to **${calculateEffectiveDailyUsage(95, activeSurgePercent)}/day**. Days of supply shrink to **${calculateDaysOfSupply(950, 95, activeSurgePercent)} days**.
   - **Hunsur PHC:** Stock drops to **${calculateDaysOfSupply(680, 80, activeSurgePercent)} days**.

2. **Antibiotics (Amoxicillin 500mg):**
   - Nanjangud PHC enters acute distress with only **${calculateDaysOfSupply(170, 55, activeSurgePercent)} days** of antibiotic coverage remaining.

3. **Strategic Action:**
   - Initiate immediate pre-emptive transfer of 800 Paracetamol and 400 Amoxicillin from Mysuru hub.
   - Dispatch an expedited replenishment indent to the District Medical Store (DMS).`;
    } else if (lower.includes('transfer') || lower.includes('redistribution') || lower.includes('recommend')) {
      demoContent = `### 🔄 Inter-Facility Redistribution Plan (Summary of Algorithmic Matches)

The HEALTHGRID AI rebalancing engine has evaluated stock run-rates across all 3 PHCs:

1. **Anti-Rabies Vaccine (Inj. 0.5ml) — [CRITICAL PRIORITY]**
   - **Route:** Mysuru PHC ➔ Hunsur PHC
   - **Quantity:** **40 Vials** (Cold Chain 2-8°C required)
   - **Transit:** 46 km via SH 88 (Est. 68 mins)
   - **Mathematical Justification:** Elevates Hunsur from 1.75 days to 11.7 days supply; leaves Mysuru with 24 safe operating days.

2. **Amoxicillin 500mg Capsules — [HIGH PRIORITY]**
   - **Route:** Mysuru PHC ➔ Nanjangud PHC
   - **Quantity:** **600 Capsules**
   - **Transit:** 24 km via NH 766 (Est. 42 mins)
   - **Mathematical Justification:** Eliminates stockout risk at Nanjangud (currently 3.1 days remaining) by restoring a 14-day operational safety net.

3. **ORS 20.5g Sachets — [HIGH PRIORITY]**
   - **Route:** Mysuru PHC ➔ Hunsur PHC
   - **Quantity:** **400 Sachets**
   - **Mathematical Justification:** Hunsur has only 2.4 days stock of ORS. Transfer provides immediate protection for pediatric gastroenteritis cases.`;
    } else if (lower.includes('indent') || lower.includes('procurement') || lower.includes('order')) {
      demoContent = `### 📋 Automated District Medical Indent Request
**To:** District Health & Family Welfare Officer (DHO), Mysuru District  
**From:** HealthGrid AI Logistics Coordinator  
**Subject:** Emergency Indent & Buffer Replenishment Protocol  
**Date:** 29-Sep-2026 (Simulated)

**Urgent Consignments Required:**
1. **Anti-Rabies Vaccine 0.5ml:** 100 Vials (Target: Hunsur PHC & District Buffer)
2. **Amoxicillin 500mg Capsules:** 3,000 Capsules (Target: Nanjangud PHC)
3. **Oral Rehydration Salts (ORS):** 2,500 Sachets (Target: Hunsur & Nanjangud)
4. **Metformin 500mg Tablets:** 2,000 Tablets (Target: Nanjangud PHC)

**Logistics Route Planning:**
- Central DMS delivery truck can route along Mysore ➔ Nanjangud (NH 766) on morning shift, and Mysore ➔ Hunsur (SH 88) on afternoon shift.
- Inter-facility transfers have been executed to maintain patient care until primary depot delivery arrives.`;
    } else {
      demoContent = `### 📊 Real-Time Inventory & Supply Chain Overview

**Active Scenario:** ${DEMAND_SCENARIOS.find(s => s.id === selectedScenarioId)?.name || 'Normal Baseline'}
- **Surge Rate:** +${activeSurgePercent}% Daily Consumption Multiplier
- **Facilities Monitored:** 3 (Mysuru Urban PHC, Nanjangud Rural PHC, Hunsur Border PHC)
- **Active Critical Stock-outs (≤3 days):** 2 items (Rabies Vaccine at Hunsur, ORS at Hunsur, Amoxicillin at Nanjangud)
- **Facilities at Risk:** 2 of 3 PHCs require urgent stock balancing.
- **Redistribution Status:** ${recommendations.filter(r => r.status === 'RECOMMENDED').length} pending transfer recommendation(s) generated.

*Notice: This system operates in transparent AI simulation mode. All predictions are generated via the transparent consumption run-rate formula.*`;
    }

    setAiMessages(prev => [
      ...prev,
      {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: demoContent,
        timestamp: new Date().toISOString(),
        mode: 'demo',
      },
    ]);
    setIsAILoading(false);
  }, [inventory, medicines, centres, activeSurgePercent, selectedScenarioId, recommendations, selectedCentreId, aiMode]);

  // Quick stats
  const { criticalMedicinesCount, warningMedicinesCount, totalUnitsMonitored, atRiskCentresCount } = useMemo(() => {
    let crit = 0;
    let warn = 0;
    let total = 0;
    const centresAtRisk = new Set<string>();

    for (const item of inventory) {
      total += item.currentStock;
      const days = calculateDaysOfSupply(item.currentStock, item.dailyUsage, activeSurgePercent);
      const status = getStockStatus(days, item.currentStock, item.minReserve);
      if (status === 'CRITICAL') {
        crit++;
        centresAtRisk.add(item.centreId);
      } else if (status === 'WARNING') {
        warn++;
        centresAtRisk.add(item.centreId);
      }
    }

    return {
      criticalMedicinesCount: crit,
      warningMedicinesCount: warn,
      totalUnitsMonitored: total,
      atRiskCentresCount: centresAtRisk.size,
    };
  }, [inventory, activeSurgePercent]);

  return (
    <InventoryContext.Provider
      value={{
        centres,
        medicines,
        inventory,
        selectedCentreId,
        setSelectedCentreId,
        activeSurgePercent,
        setActiveSurgePercent,
        selectedScenarioId,
        applyScenario,
        recommendations,
        movementLogs,
        updateStock,
        executeTransfer,
        executeCustomTransfer,
        resetToSampleData,
        activePage,
        setActivePage,
        aiMessages,
        isAILoading,
        aiMode,
        sendAIMessage,
        clearAIChat,
        criticalMedicinesCount,
        warningMedicinesCount,
        totalUnitsMonitored,
        atRiskCentresCount,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
