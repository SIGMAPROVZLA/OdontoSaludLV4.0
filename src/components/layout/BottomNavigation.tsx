import React from 'react';

export type TabId = 'dashboard' | 'reserva' | 'odontograma' | 'agenda' | 'cobros';

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'dashboard' as TabId, label: 'Inicio', icon: 'dashboard' },
    { id: 'reserva' as TabId, label: 'Citas', icon: 'add_alarm' },
    { id: 'odontograma' as TabId, label: 'Odontograma', icon: 'dentistry' },
    { id: 'agenda' as TabId, label: 'Agenda', icon: 'calendar_clock' },
    { id: 'cobros' as TabId, label: 'Cobros', icon: 'payments' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-[env(safe-area-inset-bottom,0px)] bg-surface-clean-white/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,43,72,0.06)] border-t border-border-subtle">
      <div className="h-16 px-space-xs flex items-stretch justify-around max-w-5xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-1 flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-all ${
                isActive
                  ? 'text-electric-blue font-bold scale-105'
                  : 'text-secondary hover:text-dental-deep-navy'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{tab.icon}</span>
              <span className="text-[11px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
