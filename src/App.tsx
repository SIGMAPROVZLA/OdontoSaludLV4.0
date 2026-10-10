import React, { useState } from 'react';
import { SedeProvider } from './context/SedeContext';
import { ClinicalHeader } from './components/layout/ClinicalHeader';
import { BottomNavigation, TabId } from './components/layout/BottomNavigation';
import { DashboardView } from './components/dashboard/DashboardView';
import { BookingFlow } from './components/booking/BookingFlow';
import { OdontogramView } from './components/odontogram/OdontogramView';
import { AgendaView } from './components/agenda/AgendaView';
import { BillingView } from './components/billing/BillingView';
import { VictoriaAssistantModal } from './components/booking/VictoriaAssistantModal';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface antialiased">
      {/* Cabecera con selector multisede */}
      <ClinicalHeader />

      {/* Contenido Principal con Safe-Areas móviles */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-gutter-mobile pt-20 pb-safe">
        {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
        {activeTab === 'reserva' && <BookingFlow />}
        {activeTab === 'odontograma' && <OdontogramView />}
        {activeTab === 'agenda' && <AgendaView />}
        {activeTab === 'cobros' && <BillingView />}
      </main>

      {/* Asistente Flotante Inteligente VictorIA */}
      <VictoriaAssistantModal />

      {/* Barra de Navegación Inferior Móvil */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SedeProvider>
      <AppContent />
    </SedeProvider>
  );
};

export default App;
