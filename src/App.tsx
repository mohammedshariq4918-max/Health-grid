import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { HealthCentresPage } from './pages/HealthCentresPage';
import { MedicineInventoryPage } from './pages/MedicineInventoryPage';
import { ShortageForecastPage } from './pages/ShortageForecastPage';
import { RedistributionPlannerPage } from './pages/RedistributionPlannerPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { StockUpdateModal } from './components/StockUpdateModal';
import { CustomTransferModal } from './components/CustomTransferModal';

const AppContent: React.FC = () => {
  const { activePage } = useInventory();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Stock update modal state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedStockCentre, setSelectedStockCentre] = useState<string | undefined>();
  const [selectedStockMedicine, setSelectedStockMedicine] = useState<string | undefined>();

  // Custom transfer modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferMedicine, setTransferMedicine] = useState<string | undefined>();
  const [transferFromCentre, setTransferFromCentre] = useState<string | undefined>();
  const [transferToCentre, setTransferToCentre] = useState<string | undefined>();

  const handleOpenStockModal = (centreId?: string, medicineId?: string) => {
    setSelectedStockCentre(centreId);
    setSelectedStockMedicine(medicineId);
    setStockModalOpen(true);
  };

  const handleOpenTransferModal = (fromCentreId?: string, medicineId?: string, toCentreId?: string) => {
    setTransferFromCentre(fromCentreId);
    setTransferMedicine(medicineId);
    setTransferToCentre(toCentreId);
    setTransferModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenStockModal={() => handleOpenStockModal()}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activePage === 'overview' && (
            <OverviewPage
              onOpenStockModal={() => handleOpenStockModal()}
              onOpenCustomTransfer={() => handleOpenTransferModal()}
            />
          )}

          {activePage === 'centres' && (
            <HealthCentresPage
              onOpenStockModalWithCentre={(cId) => handleOpenStockModal(cId)}
              onOpenCustomTransferFrom={(cId) => handleOpenTransferModal(cId)}
            />
          )}

          {activePage === 'inventory' && (
            <MedicineInventoryPage
              onOpenStockModalWithItem={(cId, mId) => handleOpenStockModal(cId, mId)}
              onOpenTransferModalWithItem={(cId, mId) => handleOpenTransferModal(cId, mId)}
            />
          )}

          {activePage === 'forecast' && (
            <ShortageForecastPage />
          )}

          {activePage === 'planner' && (
            <RedistributionPlannerPage
              onOpenCustomTransfer={() => handleOpenTransferModal()}
            />
          )}

          {activePage === 'assistant' && (
            <AIAssistantPage />
          )}
        </main>
      </div>

      {/* Interactive Stock Update Modal */}
      <StockUpdateModal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        initialCentreId={selectedStockCentre}
        initialMedicineId={selectedStockMedicine}
      />

      {/* Interactive Custom Transfer Modal */}
      <CustomTransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        defaultMedicineId={transferMedicine}
        defaultFromCentreId={transferFromCentre}
        defaultToCentreId={transferToCentre}
      />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
