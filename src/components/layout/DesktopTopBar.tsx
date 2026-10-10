import React from 'react';
import { useSede } from '../../context/SedeContext';
import { TabId } from './BottomNavigation';

interface DesktopTopBarProps {
  onNavigateTab: (tab: TabId) => void;
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({ onNavigateTab }) => {
  const { doctorActivo, sedeActiva } = useSede();

  // Fecha legible
  const hoyTexto = new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-border-subtle px-6 flex items-center justify-between shrink-0 shadow-sm z-30">
      {/* 1. Fecha y Estado de Jornada */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[20px] text-secondary">
          calendar_today
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-dental-deep-navy">
            {hoyTexto}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-success/10 text-status-success text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
            Jornada Activa
          </span>
        </div>
      </div>

      {/* 2. Botones de Acción Rápida (Fiel a Google Stitch Desktop) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('odontograma')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-dental-deep-navy text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">
            person_add
          </span>
          <span>+ Nuevo Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('cobros')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-dental-deep-navy text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px] text-tertiary">
            post_add
          </span>
          <span>+ Crear Presupuesto</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('reserva')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-electric-blue hover:bg-primary text-white text-xs font-bold transition-all active:scale-95 shadow-[0_4px_14px_rgba(0,132,255,0.3)]"
        >
          <span className="material-symbols-outlined text-[16px]">
            add_circle
          </span>
          <span>+ Nueva Cita</span>
        </button>

        <div className="h-6 w-px bg-border-subtle mx-1" />

        {/* Notificaciones y Perfil Doctor */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notificaciones"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice transition-colors relative"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-danger ring-2 ring-white" />
          </button>

          <div className="flex items-center gap-2 pl-1">
            <img
              alt={doctorActivo}
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80"
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-primary/20 shadow-sm"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-dental-deep-navy leading-tight">
                {doctorActivo}
              </span>
              <span className="text-[10px] text-secondary">
                {sedeActiva.nombre}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
