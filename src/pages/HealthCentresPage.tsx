import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Users, 
  Bed, 
  Stethoscope, 
  ThermometerSnowflake, 
  Navigation, 
  Pill, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { calculateDaysOfSupply, getStockStatus } from '../utils/inventoryCalculations';

interface HealthCentresPageProps {
  onOpenStockModalWithCentre: (centreId: string) => void;
  onOpenCustomTransferFrom: (centreId: string) => void;
}

export const HealthCentresPage: React.FC<HealthCentresPageProps> = ({
  onOpenStockModalWithCentre,
  onOpenCustomTransferFrom,
}) => {
  const { 
    centres, 
    medicines, 
    inventory, 
    activeSurgePercent, 
    setSelectedCentreId, 
    setActivePage 
  } = useInventory();

  const [activeTabCentreId, setActiveTabCentreId] = useState<string>(centres[0]?.id || 'mysuru-phc');

  const selectedCentre = centres.find(c => c.id === activeTabCentreId) || centres[0];

  // Specific items for selected centre
  const centreInventory = inventory.filter(i => i.centreId === selectedCentre.id).map(item => {
    const med = medicines.find(m => m.id === item.medicineId);
    const daysLeft = calculateDaysOfSupply(item.currentStock, item.dailyUsage, activeSurgePercent);
    const status = getStockStatus(daysLeft, item.currentStock, item.minReserve);
    return {
      ...item,
      medicine: med,
      daysLeft,
      status,
    };
  });

  const criticalCount = centreInventory.filter(i => i.status === 'CRITICAL').length;
  const warningCount = centreInventory.filter(i => i.status === 'WARNING').length;
  const adequateCount = centreInventory.filter(i => i.status === 'ADEQUATE' || i.status === 'SURPLUS').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              District Network
            </span>
            <span className="text-xs text-slate-500">3 Designated Public Health Centres</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Primary Health Centre Facilities
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Detailed clinical profiles, catchment populations, storage infrastructure, and inter-facility transit times.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {centres.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveTabCentreId(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTabCentreId === c.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Facility Profile Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
              <Building2 className="w-4 h-4" />
              <span>{selectedCentre.type}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">{selectedCentre.name}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedCentre.address}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {selectedCentre.contactPhone}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onOpenStockModalWithCentre(selectedCentre.id)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              + Log Stock Movement
            </button>
            <button
              onClick={() => {
                setSelectedCentreId(selectedCentre.id);
                setActivePage('inventory');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <span>View Filtered Inventory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Infrastructure Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Catchment Population</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {selectedCentre.populationServed.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Primary care coverage</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Inpatient Beds</span>
              <Bed className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {selectedCentre.beds} Beds
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Maternity & observation</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Medical Officers</span>
              <Stethoscope className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {selectedCentre.doctorCount} Doctors
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Lead: {selectedCentre.pharmacistName.split(' ')[0]}</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Cold Chain Integrity</span>
              <ThermometerSnowflake className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xl font-black text-emerald-700 font-mono flex items-center gap-1.5">
              <span>2°C - 8°C</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Active solar ILR backup</div>
          </div>
        </div>

        {/* Stock Breakdown for this PHC */}
        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>Current Medicine Stock Levels ({selectedCentre.shortName})</span>
            </h3>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-rose-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                {criticalCount} Critical (≤3d)
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {warningCount} Warning (≤7d)
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {adequateCount} Adequate
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {centreInventory.map(item => {
              const isCritical = item.status === 'CRITICAL';
              const isWarning = item.status === 'WARNING';
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border bg-white shadow-2xs transition-all ${
                    isCritical
                      ? 'border-rose-300 ring-2 ring-rose-100'
                      : isWarning
                      ? 'border-amber-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">
                      {item.medicine?.name}
                    </span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono uppercase ${
                      isCritical ? 'bg-rose-100 text-rose-800' :
                      isWarning ? 'bg-amber-100 text-amber-800' :
                      item.status === 'SURPLUS' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.daysLeft}d left
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 line-clamp-1">{item.medicine?.category}</div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-800">
                      {item.currentStock.toLocaleString()} {item.medicine?.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Safe buffer: {item.minReserve}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inter-Facility Transit Routes Matrix */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Inter-Facility Transit Routes from {selectedCentre.shortName}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(selectedCentre.distanceTo).map(([targetId, transit]) => {
              const targetCentre = centres.find(c => c.id === targetId);
              if (!targetCentre) return null;

              return (
                <div key={targetId} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                      <span>{selectedCentre.shortName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      <span>{targetCentre.shortName}</span>
                    </div>
                    <div className="text-xs text-slate-500">{transit.roadType}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-blue-700 font-mono">
                      {transit.distanceKm} km
                    </div>
                    <div className="text-xs font-semibold text-slate-600 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-400" />
                      ~{transit.transitTimeMins} mins
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
