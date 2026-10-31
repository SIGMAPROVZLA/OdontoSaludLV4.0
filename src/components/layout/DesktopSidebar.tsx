import React, { useState } from 'react';
import { useSede, SEDES_DISPONIBLES } from '../../context/SedeContext';
import { SedeId } from '../../types/clinical';
import { TabId } from './BottomNavigation';

interface DesktopSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ activeTab, onTabChange }) => {
  const { sedeActiva, cambiarSede } = useSede();
  const [sedeDropdownOpen, setSedeDropdownOpen] = useState(false);

  const navItems: { id: TabId; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'agenda', label: 'Agenda de Citas', icon: 'calendar_today' },
    { id: 'coordinacion', label: 'Triaje & Citas Previas', icon: 'fact_check' },
    { id: 'reserva', label: 'Autoregistro Web', icon: 'add_alarm' },
    { id: 'odontograma', label: 'Pacientes y Odontograma', icon: 'dentistry' },
    { id: 'cobros', label: 'Presupuestos y Cobros', icon: 'payments' },
  ];

  return (
    <aside className="w-64 bg-dental-deep-navy text-white flex flex-col shrink-0 min-h-screen border-r border-dental-ambient-bg select-none relative z-20">
      {/* 1. Cabecera Corporativa OdontoSalud La Victoria */}
      <div className="p-4 border-b border-secondary/30 relative">
        <div className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-dental-ambient-bg border border-secondary/40 text-left">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm p-0.5">
            <img
              src="/brand/logo-odontosalud-vertical.png"
              alt="Logo OdontoSalud La Victoria"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-display font-extrabold text-white truncate leading-tight">
              OdontoSalud La Victoria
            </h1>
            <span className="text-[10px] font-bold tracking-wider text-secondary-fixed block truncate mt-0.5">
              Tecnologia SIGMA LABS
            </span>
          </div>
        </div>
      </div>

      {/* 2. Lista de Navegación Principal */}
      <nav className="flex-1 p-3 space-y-1.5 mt-2">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-outline-variant">
          Clínica & Operaciones
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                isActive
                  ? 'bg-primary text-white shadow-[0_4px_16px_rgba(23,18,29,0.4)] border border-outline-variant/40'
                  : 'text-secondary-fixed hover:bg-dental-ambient-bg hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-white' : 'text-outline-variant'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-outline-variant">
          Administración
        </div>

        <button
          type="button"
          onClick={() => onTabChange('data')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            activeTab === 'data'
              ? 'bg-primary text-white shadow-[0_4px_16px_rgba(23,18,29,0.4)] border border-outline-variant/40'
              : 'text-secondary-fixed hover:bg-dental-ambient-bg hover:text-white'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              activeTab === 'data' ? 'text-white' : 'text-outline-variant'
            }`}
          >
            database
          </span>
          <span>Control de Data</span>
        </button>
      </nav>

      {/* 3. Footer de Sede y Conectividad */}
      <div className="p-4 border-t border-secondary/30 flex items-center justify-between text-xs text-outline-variant">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span className="text-[11px] font-medium text-secondary-fixed">Cloudflare D1 Sincronizado</span>
        </div>
        <span className="text-[10px] font-mono text-outline-variant">v4.0 Pro</span>
      </div>
    </aside>
  );
};
