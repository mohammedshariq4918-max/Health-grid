import React from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  ArrowLeftRight, 
  CheckCircle, 
  ShieldAlert, 
  Building2, 
  Pill, 
  ThermometerSnowflake, 
  ArrowUpRight, 
  Clock, 
  Truck,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { calculateDaysOfSupply, getStockStatus, getForecastedStockoutDate } from '../utils/inventoryCalculations';

interface OverviewPageProps {
  onOpenStockModal: () => void;
  onOpenCustomTransfer: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ 
  onOpenStockModal, 
  onOpenCustomTransfer 
}) => {
  const { 
    centres, 
    medicines, 
    inventory, 
    activeSurgePercent, 
    recommendations, 
    movementLogs,
    setActivePage,
    executeTransfer,
    setSelectedCentreId
  } = useInventory();

  // Calculate metrics
  const itemsWithMetrics = inventory.map(item => {
    const med = medicines.find(m => m.id === item.medicineId);
    const centre = centres.find(c => c.id === item.centreId);
    const daysLeft = calculateDaysOfSupply(item.currentStock, item.dailyUsage, activeSurgePercent);
    const status = getStockStatus(daysLeft, item.currentStock, item.minReserve);
    const forecast = getForecastedStockoutDate(daysLeft);
    return {
      ...item,
      medicine: med,
      centre,
      daysLeft,
      status,
      forecast,
    };
  });

  const criticalItems = itemsWithMetrics.filter(i => i.status === 'CRITICAL');
  const warningItems = itemsWithMetrics.filter(i => i.status === 'WARNING');
  const pendingRecommendations = recommendations.filter(r => r.status === 'RECOMMENDED');
  const completedTransfers = recommendations.filter(r => r.status === 'DISPATCHED');

  const totalStockUnits = inventory.reduce((acc, curr) => acc + curr.currentStock, 0);

  // Facility-wise health scores
  const facilityScores = centres.map(centre => {
    const facilityItems = itemsWithMetrics.filter(i => i.centreId === centre.id);
    const critCount = facilityItems.filter(i => i.status === 'CRITICAL').length;
    const warnCount = facilityItems.filter(i => i.status === 'WARNING').length;
    const totalItems = facilityItems.length;

    // Score calculation
    let score = 100;
    score -= critCount * 25;
    score -= warnCount * 10;
    score = Math.max(20, Math.min(100, score));

    return {
      centre,
      critCount,
      warnCount,
      totalItems,
      score,
      status: critCount > 0 ? 'CRITICAL RISK' : warnCount > 0 ? 'WARNING' : 'HEALTHY',
    };
  });

  return (
    <div className="space-y-6">
      {/* Welcome & District Scope Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Mysuru District Command
            </span>
            {activeSurgePercent > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Demand Surge: +{activeSurgePercent}% Active
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            District Public Health Supply Chain
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Real-time stock monitoring, consumption forecasting, and algorithmic redistribution across Mysuru, Nanjangud, and Hunsur PHCs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActivePage('forecast')}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Run Forecast Model
          </button>
          <button
            onClick={() => setActivePage('planner')}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Redistribute Stock</span>
          </button>
        </div>
      </div>

      {/* 7-Day Urgent Warning Alert Banner */}
      {criticalItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-rose-950 flex items-center gap-2">
                <span>Immediate Stock-Out Hazard: {criticalItems.length} Essential Item(s) at Risk</span>
                <span className="text-[10px] bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full font-extrabold uppercase">
                  ≤ 3 Days Remaining
                </span>
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                {criticalItems.map(i => `${i.medicine?.name} at ${i.centre?.shortName} (${i.daysLeft}d)`).join(' • ')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActivePage('planner')}
            className="shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Review {pendingRecommendations.length} Transfer Fix(es)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Units */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stock Monitored</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalStockUnits.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">units</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">8 Essential Medicines</span>
            <span>across 3 PHCs</span>
          </div>
        </div>

        {/* Card 2: Critical Stockouts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Risk (≤3d)</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${criticalItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${criticalItems.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {criticalItems.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">medicines</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-rose-600 font-semibold">{warningItems.length} additional</span>
            <span>at warning status (≤7d)</span>
          </div>
        </div>

        {/* Card 3: Pending Transfers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recommended Transfers</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono tracking-tight">
              {pendingRecommendations.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">matches</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{completedTransfers.length} executed today</span>
            <button 
              onClick={() => setActivePage('planner')} 
              className="text-blue-600 hover:underline font-semibold"
            >
              View Plan ➔
            </button>
          </div>
        </div>

        {/* Card 4: Cold-Chain Integrity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cold-Chain Status</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ThermometerSnowflake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              2°C - 8°C
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-700 font-semibold">3/3 ILR Units Operational</span>
          </div>
        </div>
      </div>

      {/* Health Centres Health & Capacity Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Health Facility Readiness Matrix</h2>
            <p className="text-xs text-slate-500">Stock health score, critical gaps, and logistics reach</p>
          </div>
          <button
            onClick={() => setActivePage('centres')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View Facility Profiles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {facilityScores.map(({ centre, critCount, warnCount, score, status }) => {
            const isCritical = critCount > 0;
            return (
              <div
                key={centre.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {centre.type.split(' ')[0]} {centre.type.split(' ')[1]}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{centre.shortName}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      isCritical ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      warnCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-1">{centre.address}</p>

                  {/* Health Score Meter */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600">Stock Readiness Index:</span>
                      <span className={score >= 80 ? 'text-emerald-700' : score >= 65 ? 'text-amber-700' : 'text-rose-700'}>
                        {score}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>

                  {/* Specific gaps */}
                  <div className="mt-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Population Served:</span>
                      <span className="font-semibold text-slate-800">{centre.populationServed.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Inpatient Capacity:</span>
                      <span className="font-semibold text-slate-800">{centre.beds} Beds • {centre.doctorCount} Doctors</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Critical Stockouts:</span>
                      <span className={`font-bold ${critCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {critCount} item(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedCentreId(centre.id);
                      setActivePage('inventory');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    Filter Inventory ➔
                  </button>

                  <span className="text-[11px] text-slate-400 font-medium">
                    ILR: 4.2°C Stable
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical Medicines & Inter-facility Intervention Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Immediate Action Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Immediate 7-Day Depletion Queue</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                  Needs Action
                </span>
              </h3>
              <p className="text-xs text-slate-500">Medicines running out within 7 days based on current daily consumption</p>
            </div>

            <button
              onClick={() => setActivePage('forecast')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              See All Forecasts ➔
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-2 font-bold">Medicine</th>
                  <th className="pb-2 font-bold">Facility</th>
                  <th className="pb-2 font-bold">Stock on Hand</th>
                  <th className="pb-2 font-bold">Days Left</th>
                  <th className="pb-2 font-bold">Depletion Date</th>
                  <th className="pb-2 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemsWithMetrics
                  .filter(i => i.daysLeft <= 7.0)
                  .sort((a, b) => a.daysLeft - b.daysLeft)
                  .map(item => {
                    const isCrit = item.daysLeft <= 3.0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pr-2">
                          <div className="font-bold text-slate-900">{item.medicine?.name}</div>
                          <div className="text-[10px] text-slate-500">{item.medicine?.category}</div>
                        </td>
                        <td className="py-3 px-2 font-medium text-slate-700">
                          {item.centre?.shortName}
                        </td>
                        <td className="py-3 px-2 font-mono font-semibold text-slate-900">
                          {item.currentStock.toLocaleString()} {item.medicine?.unit}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Use: {item.dailyUsage}/day
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold font-mono ${
                            isCrit ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.daysLeft} days
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-600 font-medium">
                          {item.forecast.formattedDate}
                        </td>
                        <td className="py-3 pl-2 text-right">
                          <button
                            onClick={() => setActivePage('planner')}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                          >
                            Resolve Transfer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: AI Quick Insights & Recent Activity */}
        <div className="space-y-4">
          {/* AI Advisor Card */}
          <div className="bg-gradient-to-br from-blue-900 via-sky-900 to-slate-900 text-white rounded-2xl p-5 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/30 border border-blue-400/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-sky-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">HEALTHGRID AI Advisor</h4>
                <p className="text-[10px] text-sky-200">Autonomous Rebalancing Heuristics</p>
              </div>
            </div>

            <p className="text-xs text-sky-100 leading-relaxed">
              "Mysuru Urban PHC maintains a safe 32-day reserve of Anti-Rabies Vaccine. Transferring 40 vials to Hunsur PHC will instantly mitigate their 1.8-day critical stock-out hazard without violating Mysuru's 18-day safe buffer."
            </p>

            <div className="mt-4 pt-3 border-t border-sky-800/80 flex items-center justify-between">
              <span className="text-[11px] text-sky-300">Transit: 46 km via SH 88</span>
              <button
                onClick={() => setActivePage('assistant')}
                className="text-xs font-bold text-white bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                Ask Assistant ➔
              </button>
            </div>
          </div>

          {/* Recent Movement Activity Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Recent Logistics Activity
              </h4>
              <button
                onClick={onOpenStockModal}
                className="text-[11px] text-blue-600 font-bold hover:underline"
              >
                + Log Entry
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {movementLogs.slice(0, 4).map((log) => {
                const med = medicines.find(m => m.id === log.medicineId);
                const centre = centres.find(c => c.id === log.centreId);
                return (
                  <div key={log.id} className="text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="truncate">{med?.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        log.type === 'TRANSFER_OUT' ? 'bg-amber-100 text-amber-800' :
                        log.type === 'TRANSFER_IN' ? 'bg-emerald-100 text-emerald-800' :
                        log.type === 'CONSUMPTION' ? 'bg-rose-100 text-rose-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {centre?.shortName} • {log.notes}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                      <span>Δ {log.quantity} units</span>
                      <span>Stock: {log.newStock}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
