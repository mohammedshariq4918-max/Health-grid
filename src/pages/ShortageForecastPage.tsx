import React, { useState } from 'react';
import { 
  TrendingDown, 
  Sliders, 
  AlertTriangle, 
  Clock, 
  Info, 
  ShieldAlert, 
  ArrowRight, 
  Calculator, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  HelpCircle,
  Truck
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { DEMAND_SCENARIOS } from '../data/mockData';
import { 
  calculateDaysOfSupply, 
  calculateEffectiveDailyUsage, 
  getStockStatus, 
  getForecastedStockoutDate 
} from '../utils/inventoryCalculations';

export const ShortageForecastPage: React.FC = () => {
  const { 
    centres, 
    medicines, 
    inventory, 
    activeSurgePercent, 
    setActiveSurgePercent,
    selectedScenarioId,
    applyScenario,
    setActivePage,
    recommendations
  } = useInventory();

  const [filterHorizon, setFilterHorizon] = useState<'7DAYS' | '3DAYS' | 'ALL_RISK'>('7DAYS');

  // Enriched items with forecast
  const forecastedItems = inventory.map(item => {
    const med = medicines.find(m => m.id === item.medicineId);
    const centre = centres.find(c => c.id === item.centreId);
    const effectiveUsage = calculateEffectiveDailyUsage(item.dailyUsage, activeSurgePercent);
    const daysLeft = calculateDaysOfSupply(item.currentStock, item.dailyUsage, activeSurgePercent);
    const status = getStockStatus(daysLeft, item.currentStock, item.minReserve);
    const forecast = getForecastedStockoutDate(daysLeft);
    const deficitUnits = Math.max(0, item.minReserve - item.currentStock);

    return {
      ...item,
      medicine: med,
      centre,
      effectiveUsage,
      daysLeft,
      status,
      forecast,
      deficitUnits,
    };
  });

  // Filter based on horizon
  const atRiskWithin7Days = forecastedItems
    .filter(i => {
      if (filterHorizon === '3DAYS') return i.daysLeft <= 3.0;
      if (filterHorizon === '7DAYS') return i.daysLeft <= 7.0;
      return i.daysLeft <= 14.0 || i.status === 'CRITICAL' || i.status === 'WARNING';
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const criticalCount = forecastedItems.filter(i => i.daysLeft <= 3.0).length;
  const warningCount = forecastedItems.filter(i => i.daysLeft > 3.0 && i.daysLeft <= 7.0).length;

  return (
    <div className="space-y-6">
      {/* Top Title & Transparent Model Disclaimer */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Predictive Risk Model
              </span>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                SIMULATED DATA & PROJECTIONS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Shortage Forecast & Depletion Radar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Anticipate drug stock-outs within 7 days using transparent consumption run-rate formulas. Stress test with epidemiological surges.
            </p>
          </div>

          <button
            onClick={() => setActivePage('planner')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Open Redistribution Planner</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Transparent Formula Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-600" />
              Transparent Forecasting Heuristic & Mathematical Formulation
            </span>
            <span className="text-[11px] text-blue-700 font-mono">No black-box models</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-600">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 mb-0.5">1. Effective Daily Usage</div>
              <code className="text-blue-700 font-mono text-[10px]">
                Usage = BaseUsage × (1 + Surge% / 100)
              </code>
              <p className="mt-1 text-slate-500 text-[10px]">
                Accounts for seasonal outbreaks, monsoon disease peaks, and sudden surges in footfall.
              </p>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 mb-0.5">2. Days of Supply Remaining</div>
              <code className="text-blue-700 font-mono text-[10px]">
                DaysLeft = CurrentPhysicalStock / EffectiveDailyUsage
              </code>
              <p className="mt-1 text-slate-500 text-[10px]">
                Threshold: ≤3.0 days = Critical Hazard; ≤7.0 days = Severe Warning Risk.
              </p>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 mb-0.5">3. Projected Stockout Date</div>
              <code className="text-blue-700 font-mono text-[10px]">
                StockoutDate = Today + DaysLeft
              </code>
              <p className="mt-1 text-slate-500 text-[10px]">
                Trigger automatic inter-facility redistribution before pipeline deliveries lapse.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Demand Surge Simulator Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <span>Simulate Demand Increase (Epidemiological Stress Test)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate outbreak scenarios to see how fragile the supply chain becomes under pressure.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Multiplier:</span>
            <span className="font-mono text-base font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
              +{activeSurgePercent}%
            </span>
          </div>
        </div>

        {/* Preset scenario buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {DEMAND_SCENARIOS.map((sc) => {
            const isSelected = selectedScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => applyScenario(sc.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200 text-blue-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{sc.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{sc.description}</div>
              </button>
            );
          })}
        </div>

        {/* Custom Slider */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span>Custom Surge Multiplier: 0% (Normal) to +150% (Extreme Epidemic Peak)</span>
            <span className="font-mono font-bold text-blue-700">+{activeSurgePercent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            step="5"
            value={activeSurgePercent}
            onChange={(e) => setActiveSurgePercent(parseInt(e.target.value) || 0)}
            className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* 7-Day Stockout Risk Table & Explanations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Medicines at Risk of Stock-Out (Horizon: ≤ 7 Days)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Ranked in order of earliest depletion date. Immediate redistribution or emergency indent recommended.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterHorizon('3DAYS')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterHorizon === '3DAYS' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ≤ 3 Days ({criticalCount})
            </button>
            <button
              onClick={() => setFilterHorizon('7DAYS')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterHorizon === '7DAYS' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ≤ 7 Days ({atRiskWithin7Days.length})
            </button>
            <button
              onClick={() => setFilterHorizon('ALL_RISK')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterHorizon === 'ALL_RISK' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Gaps
            </button>
          </div>
        </div>

        {atRiskWithin7Days.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Critical Shortages in this Horizon!</h4>
            <p className="text-xs text-slate-500 mt-1">All monitored health facilities have safe stock reserves above the threshold.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {atRiskWithin7Days.map(item => {
              const isCritical = item.daysLeft <= 3.0;
              // Check if there is an active recommendation for this item
              const rec = recommendations.find(r => r.medicineId === item.medicineId && r.toCentreId === item.centreId);
              const donorCentre = rec ? centres.find(c => c.id === rec.fromCentreId) : null;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCritical
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-amber-50/30 border-amber-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Medicine & Facility */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider font-mono ${
                          isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {isCritical ? 'CRITICAL HAZARD' : 'WARNING RISK'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{item.medicine?.name}</h4>
                        <span className="text-xs text-slate-500 font-medium">({item.centre?.shortName})</span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                        <span>Current Stock: <strong className="font-mono text-slate-900">{item.currentStock} {item.medicine?.unit}</strong></span>
                        <span>•</span>
                        <span>Daily Run-rate: <strong className="font-mono text-slate-900">{item.effectiveUsage} {item.medicine?.unit}/day</strong></span>
                        <span>•</span>
                        <span>Buffer Deficit: <strong className="font-mono text-rose-700">{item.deficitUnits} {item.medicine?.unit}</strong></span>
                      </div>
                    </div>

                    {/* Stockout Timeline Badge */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-slate-500 font-medium">Depletion in:</div>
                        <div className={`text-base font-black font-mono ${
                          isCritical ? 'text-rose-700' : 'text-amber-700'
                        }`}>
                          {item.daysLeft} Days
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {item.forecast.formattedDate}
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => setActivePage('planner')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs ${
                          isCritical
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Fix via Transfer</span>
                      </button>
                    </div>
                  </div>

                  {/* Mathematical Explanation Callout */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        <strong>Calculation:</strong> {item.currentStock} units ÷ {item.effectiveUsage}/day = <strong>{item.daysLeft} days of therapy left</strong>.
                      </span>
                    </div>

                    {donorCentre && (
                      <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        Surplus Hub Available: {donorCentre.shortName} has available transfer stock
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
