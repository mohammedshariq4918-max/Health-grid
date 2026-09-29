import React, { useState } from 'react';
import { 
  Activity, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Building2, 
  Menu, 
  X, 
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useInventory, AppPage } from '../context/InventoryContext';
import { DEMAND_SCENARIOS } from '../data/mockData';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onOpenStockModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  mobileMenuOpen, 
  setMobileMenuOpen,
  onOpenStockModal 
}) => {
  const { 
    centres, 
    selectedCentreId, 
    setSelectedCentreId, 
    activeSurgePercent, 
    selectedScenarioId, 
    applyScenario, 
    resetToSampleData,
    aiMode,
    criticalMedicinesCount,
    activePage,
    setActivePage
  } = useInventory();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSurgeDropdown, setShowSurgeDropdown] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        {/* Top Hackathon Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-sky-700 to-indigo-800 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-sky-400/20 text-sky-200 border border-sky-300/30 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase">
              Hackathon Track
            </span>
            <span className="hidden sm:inline">Smart Health & Supply Chain 2026</span>
            <span className="text-sky-200 hidden md:inline">• Public Health Logistics Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sky-100 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Monitoring: Mysuru District (3 PHCs)
            </span>
            <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-sky-100 font-mono hidden lg:inline">
              SIMULATED BENCHMARK DATA
            </span>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div 
              onClick={() => setActivePage('overview')} 
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">HEALTHGRID</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block font-medium -mt-0.5">
                  PHC Medicine Inventory & Redistribution
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Health Centre Filter & Surge Simulator & Reset */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action: Update Stock */}
            <button
              onClick={onOpenStockModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Update Stock</span>
            </button>

            {/* Health Centre Selector */}
            <div className="relative hidden sm:flex items-center">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-medium rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
                title="Filter by Health Centre"
              >
                <option value="all">All Centres (District Overview)</option>
                {centres.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.shortName}
                  </option>
                ))}
              </select>
            </div>

            {/* Surge Simulator Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSurgeDropdown(!showSurgeDropdown)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  activeSurgePercent > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Simulate Demand Surge"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>
                  {activeSurgePercent > 0 ? `Surge: +${activeSurgePercent}%` : 'Demand: Normal'}
                </span>
              </button>

              {showSurgeDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setShowSurgeDropdown(false)}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      Simulate Demand Increase
                    </span>
                    <span className="text-[10px] text-slate-500">Run-rate stress test</span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Multiplies daily usage across all medicines to simulate epidemics, seasonal surges, and stockout vulnerability.
                  </p>

                  <div className="space-y-1.5">
                    {DEMAND_SCENARIOS.map((sc) => (
                      <button
                        key={sc.id}
                        onClick={() => {
                          applyScenario(sc.id);
                          setShowSurgeDropdown(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          selectedScenarioId === sc.id
                            ? 'bg-blue-50 text-blue-900 border border-blue-200 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-800">{sc.name}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{sc.description}</div>
                        </div>
                        {selectedScenarioId === sc.id && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Forecast formula:</span>
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-800">
                      Usage × (1 + Surge%)
                    </code>
                  </div>
                </div>
              )}
            </div>

            {/* AI Status Badge */}
            <div 
              onClick={() => setActivePage('assistant')}
              className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium border cursor-pointer transition-colors ${
                aiMode === 'live'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-sky-50 text-sky-800 border-sky-200'
              }`}
              title="Click to open AI Supply Chain Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>{aiMode === 'live' ? 'Gemini 3.8 Flash (Live)' : 'Demo AI Engine (Simulated)'}</span>
            </div>

            {/* Reset Sample Data Button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-medium rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
              title="Reset to default sample data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Data</span>
            </button>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Reset to Sample Dataset?</h3>
            <p className="text-sm text-slate-600 mt-2">
              This will restore all default stock levels, delivery schedules, and consumption figures for Mysuru PHC, Nanjangud PHC, and Hunsur PHC. Any manual stock changes and transfers will be cleared.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToSampleData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
