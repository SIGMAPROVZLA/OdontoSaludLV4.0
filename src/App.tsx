import React, { useState } from 'react';
import { SedeProvider } from './context/SedeContext';
import { ClinicalHeader } from './components/layout/ClinicalHeader';
import { BottomNavigation, TabId } from './components/layout/BottomNavigation';
import { DashboardView } from './components/dashboard/DashboardView';
import { BookingFlow } from './components/booking/BookingFlow';
import { OdontogramView } from './components/odontogram/OdontogramView';
import { AgendaView } from './components/agenda/AgendaView';
import { BillingView } from './components/billing/BillingView';
import { AppointmentCoordinationView } from './components/booking/AppointmentCoordinationView';
import { VictoriaAssistantModal } from './components/booking/VictoriaAssistantModal';

import { useDeviceLayout } from './hooks/useDeviceLayout';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { DesktopTopBar } from './components/layout/DesktopTopBar';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { isDesktop } = useDeviceLayout();

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-surface flex font-sans text-on-surface antialiased overflow-hidden">
        {/* Barra Lateral Clínica de Google Stitch */}
        <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Contenedor Principal de Escritorio */}
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          <DesktopTopBar onNavigateTab={setActiveTab} />
          
          <main className="flex-1 w-full max-w-7xl mx-auto p-6">
            {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
            {activeTab === 'coordinacion' && <AppointmentCoordinationView onNavigateTab={setActiveTab} />}
            {activeTab === 'reserva' && <BookingFlow onBack={() => setActiveTab('dashboard')} onNavigateTab={setActiveTab} />}
            {activeTab === 'odontograma' && <OdontogramView />}
            {activeTab === 'agenda' && <AgendaView onNavigateTab={setActiveTab} />}
            {activeTab === 'cobros' && <BillingView />}
          </main>
        </div>

        {/* Asistente Flotante Inteligente VictorIA */}
        <VictoriaAssistantModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface antialiased">
      {/* Cabecera Móvil con selector multisede */}
      <ClinicalHeader onNavigateTab={setActiveTab} />

      {/* Contenido Principal con Safe-Areas móviles */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-gutter-mobile pt-20 pb-safe">
        {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
        {activeTab === 'coordinacion' && <AppointmentCoordinationView onNavigateTab={setActiveTab} />}
        {activeTab === 'reserva' && <BookingFlow onBack={() => setActiveTab('dashboard')} onNavigateTab={setActiveTab} />}
        {activeTab === 'odontograma' && <OdontogramView />}
        {activeTab === 'agenda' && <AgendaView onNavigateTab={setActiveTab} />}
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
