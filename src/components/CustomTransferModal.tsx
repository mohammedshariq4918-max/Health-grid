import React, { useState } from 'react';
import { X, ArrowRight, Building2, Pill, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { calculateDaysOfSupply } from '../utils/inventoryCalculations';

interface CustomTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMedicineId?: string;
  defaultFromCentreId?: string;
  defaultToCentreId?: string;
}

export const CustomTransferModal: React.FC<CustomTransferModalProps> = ({
  isOpen,
  onClose,
  defaultMedicineId,
  defaultFromCentreId,
  defaultToCentreId,
}) => {
  const { centres, medicines, inventory, executeCustomTransfer, activeSurgePercent } = useInventory();

  const [fromCentreId, setFromCentreId] = useState<string>(defaultFromCentreId || 'mysuru-phc');
  const [toCentreId, setToCentreId] = useState<string>(defaultToCentreId || 'hunsur-phc');
  const [medicineId, setMedicineId] = useState<string>(defaultMedicineId || medicines[0]?.id || '');
  const [transferQty, setTransferQty] = useState<number>(100);
  const [notes, setNotes] = useState<string>('Emergency inter-PHC rebalancing authorization');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const senderCentre = centres.find(c => c.id === fromCentreId);
  const recipientCentre = centres.find(c => c.id === toCentreId);
  const selectedMedicine = medicines.find(m => m.id === medicineId);

  const senderItem = inventory.find(i => i.centreId === fromCentreId && i.medicineId === medicineId);
  const recipientItem = inventory.find(i => i.centreId === toCentreId && i.medicineId === medicineId);

  const senderStock = senderItem ? senderItem.currentStock : 0;
  const recipientStock = recipientItem ? recipientItem.currentStock : 0;

  const senderDaysBefore = senderItem ? calculateDaysOfSupply(senderStock, senderItem.dailyUsage, activeSurgePercent) : 0;
  const senderDaysAfter = senderItem ? calculateDaysOfSupply(Math.max(0, senderStock - transferQty), senderItem.dailyUsage, activeSurgePercent) : 0;

  const recipientDaysBefore = recipientItem ? calculateDaysOfSupply(recipientStock, recipientItem.dailyUsage, activeSurgePercent) : 0;
  const recipientDaysAfter = recipientItem ? calculateDaysOfSupply(recipientStock + transferQty, recipientItem.dailyUsage, activeSurgePercent) : 0;

  const transit = senderCentre?.distanceTo[toCentreId] || { distanceKm: 35, transitTimeMins: 50, roadType: 'Regional Road' };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromCentreId === toCentreId) {
      alert('Source and destination health centres must be different.');
      return;
    }
    if (transferQty <= 0) {
      alert('Transfer quantity must be greater than zero.');
      return;
    }
    if (transferQty > senderStock) {
      alert(`Source facility only has ${senderStock} ${selectedMedicine?.unit} in stock.`);
      return;
    }

    const success = executeCustomTransfer(fromCentreId, toCentreId, medicineId, transferQty, notes);
    if (success) {
      setSuccessMsg(`Dispatched ${transferQty} ${selectedMedicine?.unit} from ${senderCentre?.shortName} to ${recipientCentre?.shortName}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Authorize Direct PHC Transfer</h3>
              <p className="text-xs text-slate-500">Dispatch physical stock between facilities</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="my-8 text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Transfer Dispatched!</h4>
            <p className="text-xs text-slate-600 mt-1">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleDispatch} className="mt-4 space-y-4">
            {/* Medicine */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
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
                    {m.name} [{m.unit}] {m.isColdChain ? '❄️ Cold-Chain' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* From -> To */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Donor (From)
                </label>
                <select
                  value={fromCentreId}
                  onChange={(e) => setFromCentreId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500 mt-1">
                  Avail: <strong className="text-slate-800">{senderStock}</strong> {selectedMedicine?.unit}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Recipient (To)
                </label>
                <select
                  value={toCentreId}
                  onChange={(e) => setToCentreId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500 mt-1">
                  Current: <strong className="text-slate-800">{recipientStock}</strong> {selectedMedicine?.unit}
                </div>
              </div>
            </div>

            {/* Transit Metrics Badge */}
            <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-1.5 font-medium">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Transit Route: {transit.distanceKm} km ({transit.roadType})</span>
              </div>
              <span className="font-bold text-blue-700">~{transit.transitTimeMins} mins</span>
            </div>

            {/* Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Transfer Quantity ({selectedMedicine?.unit})
                </label>
                <button
                  type="button"
                  onClick={() => setTransferQty(Math.floor(senderStock / 2))}
                  className="text-[11px] text-blue-600 hover:underline font-semibold"
                >
                  Set 50% surplus
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={senderStock}
                value={transferQty || ''}
                onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                required
              />
            </div>

            {/* Impact Projection */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 mb-1">Impact Run-Rate Projections:</div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{senderCentre?.shortName} (Donor):</span>
                <span>{senderDaysBefore}d ➔ <strong className="text-slate-900">{senderDaysAfter} days</strong> supply left</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{recipientCentre?.shortName} (Recipient):</span>
                <span>{recipientDaysBefore}d ➔ <strong className="text-emerald-700 font-bold">{recipientDaysAfter} days</strong> safe buffer</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Logistics & Cold-Chain Authorization Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
              >
                Dispatch Consignment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
