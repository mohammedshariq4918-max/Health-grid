import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Building2, 
  Pill, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  Info,
  Calendar,
  ThermometerSnowflake
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface RedistributionPlannerPageProps {
  onOpenCustomTransfer: () => void;
}

export const RedistributionPlannerPage: React.FC<RedistributionPlannerPageProps> = ({
  onOpenCustomTransfer,
}) => {
  const { 
    centres, 
    medicines, 
    recommendations, 
    executeTransfer,
    activeSurgePercent 
  } = useInventory();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'RECOMMENDED' | 'DISPATCHED'>('ALL');
  const [executingId, setExecutingId] = useState<string | null>(null);

  const filteredRecommendations = recommendations.filter(rec => {
    if (filterStatus === 'RECOMMENDED') return rec.status === 'RECOMMENDED';
    if (filterStatus === 'DISPATCHED') return rec.status === 'DISPATCHED';
    return true;
  });

  const pendingCount = recommendations.filter(r => r.status === 'RECOMMENDED').length;
  const dispatchedCount = recommendations.filter(r => r.status === 'DISPATCHED').length;

  const handleExecute = (recId: string) => {
    setExecutingId(recId);
    setTimeout(() => {
      executeTransfer(recId);
      setExecutingId(null);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Heuristic Rebalancing Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">Inter-facility transfers</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Inter-Facility Redistribution Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Algorithmic matches transfer stock from surplus facilities to deficit centres. Every recommendation displays its exact arithmetic justification.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCustomTransfer}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Authorise Custom Transfer</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Bar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Pending Proposals: <strong className="text-slate-900 font-bold">{pendingCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Completed Dispatches: <strong className="text-slate-900 font-bold">{dispatchedCount}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'ALL' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Transfers ({recommendations.length})
          </button>
          <button
            onClick={() => setFilterStatus('RECOMMENDED')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'RECOMMENDED' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Approval ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('DISPATCHED')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === 'DISPATCHED' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dispatched ({dispatchedCount})
          </button>
        </div>
      </div>

      {/* Recommendations List */}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Matching Transfer Proposals</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All facilities currently have balanced stock, or all recommended transfers have already been dispatched.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec) => {
            const med = medicines.find(m => m.id === rec.medicineId);
            const donorCentre = centres.find(c => c.id === rec.fromCentreId);
            const recipientCentre = centres.find(c => c.id === rec.toCentreId);
            const isDispatched = rec.status === 'DISPATCHED';
            const isCritical = rec.urgency === 'CRITICAL';

            return (
              <div
                key={rec.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${
                  isDispatched
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : isCritical
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : 'border-slate-200'
                }`}
              >
                {/* Top Badge & Urgency */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                      isDispatched
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isCritical
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {isDispatched ? 'DISPATCHED & IN TRANSIT' : `${rec.urgency} REDISTRIBUTION`}
                    </span>

                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{med?.name}</span>
                      {med?.isColdChain && (
                        <span className="text-sky-600 text-xs font-semibold flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          <ThermometerSnowflake className="w-3.5 h-3.5" />
                          Cold Chain (2°C-8°C)
                        </span>
                      )}
                    </h3>
                  </div>

                  {isDispatched ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Tracking ID: {rec.dispatchTrackingId}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      Generated Heuristic Match
                    </span>
                  )}
                </div>

                {/* Facilities Flow (Donor -> Quantity -> Recipient) */}
                <div className="py-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Origin Facility (Donor) */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Origin Facility (Surplus Hub)
                    </div>
                    <div className="font-bold text-sm text-slate-900">{donorCentre?.shortName}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Stock: <strong className="text-slate-800">{rec.calculations.donorCurrentStock}</strong> {med?.unit}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-600 font-medium">
                      Coverage: {rec.calculations.donorDaysLeftBefore} days ➔{' '}
                      <span className="text-emerald-700 font-bold">{rec.calculations.donorDaysLeftAfter} days</span> safe post-transfer
                    </div>
                  </div>

                  {/* Flow / Transfer Quantity Middle */}
                  <div className="text-center py-2 px-3 bg-blue-50/70 rounded-xl border border-blue-100 flex flex-col items-center justify-center space-y-1">
                    <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Recommended Transfer</span>
                    </div>

                    <div className="text-2xl font-black text-blue-700 font-mono">
                      {rec.recommendedQty.toLocaleString()} {med?.unit}
                    </div>

                    <div className="text-[11px] text-blue-900/80 font-medium flex items-center gap-2">
                      <span>{rec.calculations.distanceKm} km</span>
                      <span>•</span>
                      <span>~{rec.calculations.transitTimeMins} mins transit</span>
                    </div>
                  </div>

                  {/* Destination Facility (Recipient) */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Destination Facility (Shortage Center)
                    </div>
                    <div className="font-bold text-sm text-slate-900">{recipientCentre?.shortName}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Current: <strong className="text-rose-600">{rec.calculations.recipientCurrentStock}</strong> {med?.unit} ({rec.calculations.recipientDaysLeftBefore}d left)
                    </div>
                    <div className="mt-2 text-[11px] text-slate-600 font-medium">
                      Buffer Target: {rec.calculations.recipientDaysLeftBefore}d ➔{' '}
                      <span className="text-emerald-700 font-bold">{rec.calculations.recipientDaysLeftAfter} days</span> safe stock
                    </div>
                  </div>
                </div>

                {/* Transparent Calculation Breakdown Box */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 text-xs text-slate-600 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mathematical Explanation & Safety Constraints:</span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                    {rec.reason}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-[10px] font-mono text-slate-500">
                    <div>Recipient Deficit: {rec.recommendedQty} {med?.unit} to reach 14 days</div>
                    <div>Donor Safety Baseline: {rec.calculations.donorSafeReserveThreshold} units retained (&gt;18d)</div>
                    <div>Net Health Gain: Prevents 0-stockout hazard</div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Road corridor: {donorCentre?.distanceTo[rec.toCentreId]?.roadType || 'State Highway'}
                  </div>

                  {isDispatched ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Consignment Dispatched • In Transit</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleExecute(rec.id)}
                      disabled={executingId === rec.id}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                      <Truck className="w-4 h-4" />
                      <span>
                        {executingId === rec.id ? 'Processing Dispatch...' : 'Approve & Execute Transfer'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
