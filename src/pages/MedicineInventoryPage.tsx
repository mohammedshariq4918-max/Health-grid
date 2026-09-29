import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Pill, 
  Building2, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeftRight, 
  Clock, 
  Edit3, 
  Truck,
  ThermometerSnowflake,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StockStatus } from '../types';
import { 
  calculateDaysOfSupply, 
  calculateDaysOfSupplyWithIncoming, 
  calculateEffectiveDailyUsage, 
  getStockStatus, 
  getForecastedStockoutDate 
} from '../utils/inventoryCalculations';

interface MedicineInventoryPageProps {
  onOpenStockModalWithItem: (centreId: string, medicineId: string) => void;
  onOpenTransferModalWithItem: (centreId: string, medicineId: string) => void;
}

export const MedicineInventoryPage: React.FC<MedicineInventoryPageProps> = ({
  onOpenStockModalWithItem,
  onOpenTransferModalWithItem,
}) => {
  const { 
    centres, 
    medicines, 
    inventory, 
    selectedCentreId, 
    setSelectedCentreId, 
    activeSurgePercent 
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Categories list
  const categories = useMemo(() => {
    return Array.from(new Set(medicines.map(m => m.category)));
  }, [medicines]);

  // Compute enriched inventory list
  const enrichedItems = useMemo(() => {
    return inventory.map(item => {
      const med = medicines.find(m => m.id === item.medicineId);
      const centre = centres.find(c => c.id === item.centreId);
      const effectiveUsage = calculateEffectiveDailyUsage(item.dailyUsage, activeSurgePercent);
      const daysOfSupply = calculateDaysOfSupply(item.currentStock, item.dailyUsage, activeSurgePercent);
      const daysWithIncoming = calculateDaysOfSupplyWithIncoming(
        item.currentStock,
        item.incomingQty,
        item.dailyUsage,
        activeSurgePercent
      );
      const status = getStockStatus(daysOfSupply, item.currentStock, item.minReserve);
      const forecast = getForecastedStockoutDate(daysOfSupply);

      return {
        ...item,
        medicine: med,
        centre,
        effectiveUsage,
        daysOfSupply,
        daysWithIncoming,
        status,
        forecast,
      };
    });
  }, [inventory, medicines, centres, activeSurgePercent]);

  // Filter items
  const filteredItems = useMemo(() => {
    return enrichedItems.filter(item => {
      // Centre filter
      if (selectedCentreId !== 'all' && item.centreId !== selectedCentreId) return false;

      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && item.medicine?.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const medName = item.medicine?.name.toLowerCase() || '';
        const genName = item.medicine?.genericName.toLowerCase() || '';
        const centreName = item.centre?.name.toLowerCase() || '';
        const batch = item.batchNumber.toLowerCase();
        if (!medName.includes(q) && !genName.includes(q) && !centreName.includes(q) && !batch.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedItems, selectedCentreId, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                District Pharmacy Catalog
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {enrichedItems.length} facility inventory records
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Medicine Inventory & Supply Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Inspect current buffer stocks, consumption run-rates, scheduled pipeline deliveries, and stockout horizons.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenStockModalWithItem(centres[0].id, medicines[0].id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>Update Stock</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicine, generic, batch..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Facility Filter */}
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Health Centres</option>
              {centres.map(c => (
                <option key={c.id} value={c.id}>
                  {c.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StockStatus | 'ALL')}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="CRITICAL">Critical Hazard (≤3 Days)</option>
              <option value="WARNING">Warning Risk (≤7 Days)</option>
              <option value="ADEQUATE">Adequate (8 - 25 Days)</option>
              <option value="SURPLUS">Surplus Hub (&gt;25 Days)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Drug Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between text-xs">
          <div className="font-bold text-slate-700">
            Displaying {filteredItems.length} matching inventory records
          </div>
          {activeSurgePercent > 0 && (
            <div className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Effective Run-Rate boosted by +{activeSurgePercent}%
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                <th className="py-3 px-4">Medicine & Class</th>
                <th className="py-3 px-3">PHC Facility</th>
                <th className="py-3 px-3">Stock on Hand</th>
                <th className="py-3 px-3">Daily Run-Rate</th>
                <th className="py-3 px-3">Buffer Reserve</th>
                <th className="py-3 px-3">Days of Supply</th>
                <th className="py-3 px-3">Pipeline Delivery</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No medicines match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isCrit = item.status === 'CRITICAL';
                  const isWarn = item.status === 'WARNING';
                  const isSurplus = item.status === 'SURPLUS';

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCrit ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Medicine */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.medicine?.name}</span>
                          {item.medicine?.isColdChain && (
                            <span title="Cold Chain (2-8°C)" className="text-sky-600">
                              <ThermometerSnowflake className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {item.medicine?.genericName} • <span className="font-mono">{item.batchNumber}</span>
                        </div>
                      </td>

                      {/* PHC Facility */}
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {item.centre?.shortName}
                      </td>

                      {/* Stock on Hand */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {item.currentStock.toLocaleString()}
                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                          {item.medicine?.unit}
                        </span>
                      </td>

                      {/* Daily Run Rate */}
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {item.effectiveUsage}
                        <span className="text-[10px] text-slate-400 ml-1">/day</span>
                        {activeSurgePercent > 0 && (
                          <div className="text-[9px] text-amber-700 font-sans">
                            base {item.dailyUsage}
                          </div>
                        )}
                      </td>

                      {/* Buffer Reserve */}
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {item.minReserve.toLocaleString()}
                      </td>

                      {/* Days of Supply */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-black font-mono ${
                            isCrit ? 'bg-rose-100 text-rose-800' :
                            isWarn ? 'bg-amber-100 text-amber-800' :
                            isSurplus ? 'bg-indigo-100 text-indigo-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.daysOfSupply}d
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Runs out: {item.forecast.formattedDate}
                        </div>
                      </td>

                      {/* Pipeline Delivery */}
                      <td className="py-3 px-3">
                        {item.incomingQty > 0 ? (
                          <div>
                            <span className="font-mono font-bold text-blue-700 text-xs">
                              +{item.incomingQty} {item.medicine?.unit}
                            </span>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>ETA: {item.incomingDeliveryDate}</span>
                            </div>
                            <div className="text-[9px] text-slate-400">
                              (Expands to {item.daysWithIncoming}d)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">— None —</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          isCrit ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          isWarn ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          isSurplus ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenStockModalWithItem(item.centreId, item.medicineId)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Update stock count or log consumption"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenTransferModalWithItem(item.centreId, item.medicineId)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Propose inter-PHC stock transfer"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
