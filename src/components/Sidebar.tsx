import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Pill, 
  TrendingDown, 
  ArrowLeftRight, 
  Bot, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { useInventory, AppPage } from '../context/InventoryContext';

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { 
    activePage, 
    setActivePage, 
    criticalMedicinesCount,
    recommendations,
    centres,
    selectedCentreId,
    setSelectedCentreId
  } = useInventory();

  const pendingTransfersCount = recommendations.filter(r => r.status === 'RECOMMENDED').length;

  const navItems: { id: AppPage; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'centres', label: 'Health Centres', icon: Building2 },
    { id: 'inventory', label: 'Medicine Inventory', icon: Pill },
    { 
      id: 'forecast', 
      label: 'Shortage Forecast', 
      icon: TrendingDown, 
      badge: criticalMedicinesCount > 0 ? criticalMedicinesCount : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { 
      id: 'planner', 
      label: 'Redistribution Planner', 
      icon: ArrowLeftRight,
      badge: pendingTransfersCount > 0 ? pendingTransfersCount : undefined,
      badgeColor: 'bg-blue-600 text-white'
    },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
  ];

  const handleNavClick = (id: AppPage) => {
    setActivePage(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-6 overflow-y-auto">
          {/* Main Navigation Links */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Platform Modules
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Facility Filter Selector */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Health Facilities</span>
              <span className="text-[10px] text-slate-500 lowercase">3 centres</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCentreId('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  selectedCentreId === 'all'
                    ? 'bg-white text-blue-700 shadow-xs border border-blue-200 font-bold'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="truncate">All Facilities (District)</span>
                </div>
              </button>

              {centres.map((c) => {
                const isSelected = selectedCentreId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCentreId(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-white text-blue-700 shadow-xs border border-blue-200 font-bold'
                        : 'text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      <span className="truncate">{c.shortName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {c.beds} beds
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* System & Compliance Card */}
        <div className="mt-4 pt-4 border-t border-slate-200/80">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-800 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Simulated Prototype</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              All forecasting run-rates and transfer matches are generated from transparent synthetic test data. No patient personal data required.
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
              <span>Mysuru District Hub</span>
              <span className="font-mono">v1.2-hackathon</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
