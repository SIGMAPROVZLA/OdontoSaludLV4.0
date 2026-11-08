import React, { useState, useEffect } from 'react';
import { SedeProvider } from './context/SedeContext';
import { TasaCambioProvider } from './context/TasaCambioContext';
import { ThemePaletteProvider } from './context/ThemePaletteContext';
import { ClinicalHeader } from './components/layout/ClinicalHeader';
import { BottomNavigation, TabId } from './components/layout/BottomNavigation';
import { DashboardView } from './components/dashboard/DashboardView';
import { BookingFlow } from './components/booking/BookingFlow';
import { OdontogramView } from './components/odontogram/OdontogramView';
import { AgendaView } from './components/agenda/AgendaView';
import { BillingView } from './components/billing/BillingView';
import { AppointmentCoordinationView } from './components/booking/AppointmentCoordinationView';
import { VictoriaAssistantModal } from './components/booking/VictoriaAssistantModal';
import { ControlDataView } from './components/data/ControlDataView';
import { SuperAdminView } from './components/superadmin/SuperAdminView';

import { useDeviceLayout } from './hooks/useDeviceLayout';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { DesktopTopBar } from './components/layout/DesktopTopBar';

const parseTabFromLocation = (): TabId => {
  if (typeof window === 'undefined') return 'dashboard';
  const cleanHash = window.location.hash.replace(/^#\/?/, '').split('?')[0].replace(/\/+$/, '').toLowerCase();
  const cleanPath = window.location.pathname.replace(/^\/+/, '').split('?')[0].replace(/\/+$/, '').toLowerCase();
  const target = cleanHash || cleanPath;

  if (target === 'reserva' || target === 'autoregistro' || target === 'citas' || target === 'cita') return 'reserva';
  if (target === 'coordinacion' || target === 'triaje') return 'coordinacion';
  if (target === 'agenda') return 'agenda';
  if (target === 'odontograma' || target === 'ficha') return 'odontograma';
  if (target === 'cobros') return 'cobros';
  if (target === 'data' || target === 'control-data' || target === 'controldata') return 'data';
  if (target === 'superadmin' || target === 'admin' || target === 'usuarios' || target === 'auth' || target === 'gobernanza' || target === 'citadel' || target === 'telemetria') return 'superadmin';
  if (target === 'dashboard' || target === 'inicio') return 'dashboard';

  const params = new URLSearchParams(window.location.search);
  const tabParam = (params.get('tab') || params.get('page') || '').toLowerCase();
  if (tabParam === 'reserva' || tabParam === 'autoregistro') return 'reserva';
  if (tabParam === 'coordinacion' || tabParam === 'triaje') return 'coordinacion';
  if (tabParam === 'agenda') return 'agenda';
  if (tabParam === 'odontograma') return 'odontograma';
  if (tabParam === 'cobros') return 'cobros';
  if (tabParam === 'data' || tabParam === 'control-data') return 'data';
  if (tabParam === 'superadmin' || tabParam === 'admin' || tabParam === 'usuarios' || tabParam === 'gobernanza') return 'superadmin';

  return 'dashboard';
};

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTabState] = useState<TabId>(parseTabFromLocation);
  const { isDesktop } = useDeviceLayout();

  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab === 'dashboard' ? '' : tab;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTabState(parseTabFromLocation());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-surface flex font-sans text-on-surface antialiased overflow-hidden relative">
        {/* Barra Lateral Clínica de Google Stitch */}
        <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Contenedor Principal de Escritorio */}
        <div id="desktop-main-scroll" className="flex-1 flex flex-col min-h-screen overflow-y-auto relative z-10 bg-surface">
          {activeTab !== 'reserva' && <DesktopTopBar onNavigateTab={setActiveTab} />}
          
          <main className="flex-1 w-full max-w-7xl mx-auto p-6">
            {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
            {activeTab === 'coordinacion' && <AppointmentCoordinationView onNavigateTab={setActiveTab} />}
            {activeTab === 'reserva' && <BookingFlow onBack={() => setActiveTab('dashboard')} onNavigateTab={setActiveTab} />}
            {activeTab === 'odontograma' && <OdontogramView onNavigateTab={setActiveTab} />}
            {activeTab === 'agenda' && <AgendaView onNavigateTab={setActiveTab} />}
            {activeTab === 'cobros' && <BillingView />}
            {activeTab === 'data' && <ControlDataView />}
            {activeTab === 'superadmin' && <SuperAdminView onNavigateTab={setActiveTab} />}
          </main>
        </div>

        {/* Asistente Flotante Inteligente VictorIA */}
        <VictoriaAssistantModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface antialiased relative overflow-x-hidden">
      {/* Cabecera Móvil (la vista #reserva no lleva cabecera) */}
      {activeTab !== 'reserva' && <ClinicalHeader onNavigateTab={setActiveTab} />}

      {/* Contenido Principal con Safe-Areas móviles */}
      <main
        className={`flex-1 w-full max-w-5xl mx-auto px-gutter-mobile pb-safe relative z-10 ${
          activeTab === 'reserva' ? 'pt-4' : 'pt-20'
        }`}
      >
        {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
        {activeTab === 'coordinacion' && <AppointmentCoordinationView onNavigateTab={setActiveTab} />}
        {activeTab === 'reserva' && <BookingFlow onBack={() => setActiveTab('dashboard')} onNavigateTab={setActiveTab} />}
        {activeTab === 'odontograma' && <OdontogramView onNavigateTab={setActiveTab} />}
        {activeTab === 'agenda' && <AgendaView onNavigateTab={setActiveTab} />}
        {activeTab === 'cobros' && <BillingView />}
        {activeTab === 'data' && <ControlDataView />}
        {activeTab === 'superadmin' && <SuperAdminView onNavigateTab={setActiveTab} />}
      </main>

      {/* Asistente Flotante Inteligente VictorIA */}
      <VictoriaAssistantModal />

      {/* Barra de Navegación Inferior Móvil (la vista #reserva no lleva pie de aplicaciones) */}
      {activeTab !== 'reserva' && (
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemePaletteProvider>
      <SedeProvider>
        <TasaCambioProvider>
          <AppContent />
        </TasaCambioProvider>
      </SedeProvider>
    </ThemePaletteProvider>
  );
};

export default App;
