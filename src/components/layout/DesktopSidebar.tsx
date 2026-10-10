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
    { id: 'odontograma', label: 'Pacientes y Odontograma', icon: 'dentistry' },
    { id: 'cobros', label: 'Presupuestos y Cobros', icon: 'payments' },
  ];

  return (
    <aside className="w-64 bg-dental-deep-navy text-white flex flex-col shrink-0 min-h-screen border-r border-dental-ambient-bg select-none">
      {/* 1. Header de Sede Activa (Dropdown de Stitch) */}
      <div className="p-4 border-b border-white/10 relative">
        <button
          type="button"
          onClick={() => setSedeDropdownOpen(!sedeDropdownOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-electric-blue/20 flex items-center justify-center text-vibrant-cyan shrink-0">
              <span className="material-symbols-outlined text-[18px]">domain</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-white/50 block">
                Sede Activa
              </span>
              <p className="text-xs font-bold text-white truncate">
                {sedeActiva.nombre}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-white/60">
            unfold_more
          </span>
        </button>

        {/* Dropdown de Sedes */}
        {sedeDropdownOpen && (
          <div className="absolute top-20 left-4 right-4 z-50 bg-[#163657] border border-white/15 rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
            <span className="text-[10px] uppercase font-bold text-white/50 px-3 py-1 block">
              Cambiar Sucursal
            </span>
            {Object.values(SEDES_DISPONIBLES).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  cambiarSede(s.id as SedeId);
                  setSedeDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                  sedeActiva.id === s.id
                    ? 'bg-electric-blue text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span>{s.nombre}</span>
                {sedeActiva.id === s.id && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Lista de Navegación Principal */}
      <nav className="flex-1 p-3 space-y-1.5 mt-2">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
          Clínica & Operaciones
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-electric-blue text-white shadow-[0_4px_16px_rgba(0,132,255,0.35)]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-white' : 'text-white/60'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
          Administración
        </div>

        <button
          type="button"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-all"
        >
          <span className="material-symbols-outlined text-[20px] text-white/60">
            settings
          </span>
          <span>Configuración de Clínica</span>
        </button>
      </nav>

      {/* 3. Footer de Sede y Conectividad */}
      <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span className="text-[11px] font-medium">Cloudflare D1 Sincronizado</span>
        </div>
        <span className="text-[10px] font-mono text-white/40">v4.0 Pro</span>
      </div>
    </aside>
  );
};
