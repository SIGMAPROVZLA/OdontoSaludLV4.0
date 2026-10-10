import React from 'react';

export type TabId = 'dashboard' | 'agenda' | 'coordinacion' | 'odontograma' | 'cobros' | 'reserva';

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  pendingCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  pendingCount = 4,
}) => {
  const tabs = [
    { id: 'dashboard' as TabId, label: 'Inicio', icon: 'dashboard' },
    { id: 'agenda' as TabId, label: 'Agenda', icon: 'calendar_month' },
    { id: 'coordinacion' as TabId, label: 'Triaje', icon: 'fact_check', badge: pendingCount },
    { id: 'odontograma' as TabId, label: 'Ficha', icon: 'dentistry' },
    { id: 'cobros' as TabId, label: 'Cobros', icon: 'payments' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-[env(safe-area-inset-bottom,0px)] bg-surface-clean-white/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(15,43,72,0.08)] border-t border-border-subtle">
      <div className="h-16 px-space-xs flex items-stretch justify-around max-w-5xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-1 flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-all relative ${
                isActive
                  ? 'text-electric-blue font-bold scale-105'
                  : 'text-secondary hover:text-dental-deep-navy'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-[23px]">{tab.icon}</span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-status-danger text-surface-clean-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-surface-clean-white shadow-sm animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
