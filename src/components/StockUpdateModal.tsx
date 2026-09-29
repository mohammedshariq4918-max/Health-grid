import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckSquare, 
  Building2, 
  Pill, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { calculateDaysOfSupply, getStockStatus } from '../utils/inventoryCalculations';

interface StockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCentreId?: string;
  initialMedicineId?: string;
}

export const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  isOpen,
  onClose,
  initialCentreId,
  initialMedicineId,
}) => {
  const { centres, medicines, inventory, updateStock, activeSurgePercent } = useInventory();

  const [centreId, setCentreId] = useState<string>(initialCentreId || centres[0]?.id || '');
  const [medicineId, setMedicineId] = useState<string>(initialMedicineId || medicines[0]?.id || '');
  const [actionType, setActionType] = useState<'CONSUMPTION' | 'RECEIPT' | 'AUDIT_ADJUSTMENT'>('CONSUMPTION');
  const [amount, setAmount] = useState<number>(50);
  const [notes, setNotes] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (initialCentreId) setCentreId(initialCentreId);
    if (initialMedicineId) setMedicineId(initialMedicineId);
  }, [initialCentreId, initialMedicineId, isOpen]);

  if (!isOpen) return null;

  // Find target inventory item
  const currentItem = inventory.find(i => i.centreId === centreId && i.medicineId === medicineId);
  const currentMedicine = medicines.find(m => m.id === medicineId);
  const currentCentre = centres.find(c => c.id === centreId);

  const currentStock = currentItem ? currentItem.currentStock : 0;
  const dailyUsage = currentItem ? currentItem.dailyUsage : 1;
  const minReserve = currentItem ? currentItem.minReserve : 100;

  // Compute preview
  let projectedStock = currentStock;
  if (actionType === 'CONSUMPTION') {
    projectedStock = Math.max(0, currentStock - (amount || 0));
  } else if (actionType === 'RECEIPT') {
    projectedStock = currentStock + (amount || 0);
  } else if (actionType === 'AUDIT_ADJUSTMENT') {
    projectedStock = Math.max(0, amount || 0);
  }

  const currentDays = calculateDaysOfSupply(currentStock, dailyUsage, activeSurgePercent);
  const projectedDays = calculateDaysOfSupply(projectedStock, dailyUsage, activeSurgePercent);
  const currentStatus = getStockStatus(currentDays, currentStock, minReserve);
  const projectedStatus = getStockStatus(projectedDays, projectedStock, minReserve);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    if (actionType === 'CONSUMPTION' && amount > currentStock) {
      alert('Consumption quantity cannot exceed current physical stock.');
      return;
    }

    updateStock(centreId, medicineId, amount, actionType, notes);
    setFeedbackSuccess(`Successfully logged ${actionType.toLowerCase()} for ${currentMedicine?.name}.`);
    setTimeout(() => {
      setFeedbackSuccess(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Update Medicine Stock</h3>
              <p className="text-xs text-slate-500">Log patient dispensing, receipts, or audit counts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedbackSuccess ? (
          <div className="my-8 text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Inventory Updated!</h4>
            <p className="text-xs text-slate-600 mt-1">{feedbackSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Health Centre Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Primary Health Centre
              </label>
              <select
                value={centreId}
                onChange={(e) => setCentreId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {centres.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.shortName} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Medicine Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Pill className="w-3.5 h-3.5 text-slate-400" />
                Select Essential Medicine
              </label>
              <select
                value={medicineId}
                onChange={(e) => setMedicineId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} [{m.unit}] - {m.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Type Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Movement Action Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('CONSUMPTION')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                    actionType === 'CONSUMPTION'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                  <span>Dispense Out</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('RECEIPT')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                    actionType === 'RECEIPT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <span>Receive Stock</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('AUDIT_ADJUSTMENT')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                    actionType === 'AUDIT_ADJUSTMENT'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Audit Count</span>
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {actionType === 'AUDIT_ADJUSTMENT' ? 'New Verified Physical Count' : 'Quantity Units'}
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  Unit: {currentMedicine?.unit}
                </span>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                placeholder="Enter unit amount"
                required
              />
            </div>

            {/* Live Calculation Preview Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>Current Stock on Hand:</span>
                <span className="font-mono text-slate-900 font-bold">{currentStock.toLocaleString()} {currentMedicine?.unit} ({currentDays} days)</span>
              </div>

              <div className="flex items-center justify-between font-bold text-blue-700 pt-1 border-t border-slate-200">
                <span>Projected Stock Post-Action:</span>
                <span className="font-mono text-sm">{projectedStock.toLocaleString()} {currentMedicine?.unit} ({projectedDays} days)</span>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span>Forecast Status:</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                  projectedStatus === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                  projectedStatus === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                  projectedStatus === 'SURPLUS' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {projectedStatus}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Audit Note / Clinical Justification
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received from District Medical Store, or Outpatient surge usage"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                Commit Stock Change
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
