import React, { useState } from 'react';
import { useSede } from '../../context/SedeContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { TabId } from './BottomNavigation';
import { NotificationCenterModal } from './NotificationCenterModal';

interface DesktopTopBarProps {
  onNavigateTab: (tab: TabId) => void;
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({ onNavigateTab }) => {
  const { doctorActivo, sedeActiva } = useSede();
  const { tasaBcv, hayNoLeidas } = useTasaCambio();
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  // Fecha legible
  const hoyTexto = new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  return (
    <header className="h-16 bg-surface-clean-white border-b border-border-subtle px-6 flex items-center justify-between shrink-0 shadow-[0_2px_12px_rgba(23,18,29,0.05)] z-30">
      {/* 1. Cabecera Unificada: OdontoSalud La Victoria • Tecnologia SIGMA LABS */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/brand/logo-odontosalud-vertical.png"
            alt="Logo OdontoSalud La Victoria"
            className="h-11 w-11 object-contain shrink-0"
          />
          <div>
            <h1 className="font-display font-extrabold text-sm text-dental-deep-navy leading-tight">
              OdontoSalud La Victoria
            </h1>
            <p className="text-[11px] font-bold text-primary tracking-wide leading-tight">
              Tecnologia SIGMA LABS
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-border-subtle">
          <span className="text-[11px] font-bold tracking-wider text-secondary">
            {hoyTexto}
          </span>
        </div>
      </div>

      {/* 2. Botones de Acción Rápida (Fiel a Google Stitch Desktop) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('data')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-dental-deep-navy text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">
            database
          </span>
          <span>Control de Data</span>
        </button>

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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold transition-all active:scale-95 shadow-[0_4px_14px_rgba(81,64,95,0.35)]"
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
            aria-label="Avisos, Tasa BCV y Citas Pendientes"
            onClick={() => setNotificationModalOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice transition-colors relative"
            title={`Avisos OdontoSalud • Tasa BCV: ${Number(tasaBcv).toFixed(2)} Bs/$`}
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {hayNoLeidas && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-danger ring-2 ring-white animate-pulse" />
            )}
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

      <NotificationCenterModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        onNavigateTab={onNavigateTab}
      />
    </header>
  );
};
