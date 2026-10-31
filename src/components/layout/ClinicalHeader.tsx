import React, { useState } from 'react';
import { useSede, SEDES_DISPONIBLES } from '../../context/SedeContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { SedeId } from '../../types/clinical';
import { TabId } from './BottomNavigation';
import { NotificationCenterModal } from './NotificationCenterModal';

interface ClinicalHeaderProps {
  onNavigateTab?: (tab: TabId) => void;
}

export const ClinicalHeader: React.FC<ClinicalHeaderProps> = ({ onNavigateTab }) => {
  const { sedeActiva, cambiarSede, doctorActivo } = useSede();
  const { tasaBcv, hayNoLeidas } = useTasaCambio();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  const sedesList = Object.values(SEDES_DISPONIBLES);

  return (
    <header className="fixed top-0 w-full z-50 pt-[env(safe-area-inset-top,0px)] bg-surface-clean-white shadow-[0_2px_16px_rgba(23,18,29,0.08)] border-b border-border-subtle">
      <div className="h-16 px-gutter-mobile flex items-center justify-between gap-2 max-w-5xl mx-auto">
        {/* Izquierda: Logo OdontoSalud + Título OdontoSalud La Victoria + Selección Simple de Sedes como Subtítulo */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Logo OdontoSalud La Victoria (versión vertical a color) */}
          <img
            src="/brand/logo-odontosalud-vertical.png"
            alt="Logo OdontoSalud La Victoria"
            className="h-11 w-11 object-contain shrink-0"
          />

          <div className="flex flex-col min-w-0">
            {/* Título Principal unificado en todas las vistas */}
            <h1 className="font-display font-extrabold text-sm sm:text-base text-dental-deep-navy truncate leading-tight tracking-tight">
              OdontoSalud La Victoria
            </h1>

            {/* Subtítulo corporativo SIGMA LABS */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-bold text-primary tracking-wide truncate">
                Tecnologia SIGMA LABS
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: Campanita de Notificación + Icono de VictorIA Pro */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Campanita de Notificación (Tasa BCV + Triaje / Citas) */}
          <button
            type="button"
            aria-label="Avisos, Tasa BCV y Citas Pendientes"
            onClick={() => setNotificationModalOpen(true)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice transition-colors active:scale-95"
            title={`Avisos OdontoSalud • Tasa BCV: ${Number(tasaBcv).toFixed(2)} Bs/$`}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {hayNoLeidas && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-danger animate-pulse" />
            )}
          </button>

          {/* Icono de VictorIA Pro */}
          <button
            type="button"
            aria-label="Abrir Asistente VictorIA Pro"
            onClick={() => window.dispatchEvent(new CustomEvent('open-victoria-assistant'))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary bg-gradient-to-r from-dental-ambient-bg via-dental-deep-navy to-primary text-white shadow-sm hover:brightness-105 active:scale-95 transition-all group"
            title="VictorIA Pro • Asistente Clínico Inteligente"
          >
            <span className="material-symbols-outlined text-[17px] text-secondary-fixed group-hover:rotate-12 transition-transform">
              smart_toy
            </span>
            <span className="text-[11px] font-bold tracking-tight">VictorIA</span>
            <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-dental-ambient-bg uppercase tracking-wider text-secondary-fixed">
              Pro
            </span>
          </button>
        </div>
      </div>

      {/* Modal / Panel Flotante del Centro de Notificaciones */}
      <NotificationCenterModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        onNavigateTab={onNavigateTab}
      />
    </header>
  );
};
