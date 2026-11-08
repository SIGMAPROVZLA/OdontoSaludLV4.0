import React, { useState, useEffect, useRef } from 'react';
import { useSede } from '../../context/SedeContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { TabId } from './BottomNavigation';
import { NotificationCenterModal } from './NotificationCenterModal';
import { DeterministicIdenticon } from '../../utils/identicon';

interface DesktopTopBarProps {
  onNavigateTab: (tab: TabId) => void;
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({ onNavigateTab }) => {
  const { doctorActivo, sedeActiva } = useSede();
  const { tasaBcv, hayNoLeidas } = useTasaCambio();
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;
    const container = document.getElementById('desktop-main-scroll') || window;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY =
            container instanceof HTMLElement
              ? container.scrollTop
              : window.pageYOffset || document.documentElement.scrollTop;

          if (currentY <= 20) {
            setIsVisible(true);
          } else if (currentY > lastScrollY.current + 8) {
            setIsVisible(false);
          } else if (currentY < lastScrollY.current - 6) {
            setIsVisible(true);
          }
          lastScrollY.current = Math.max(0, currentY);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Fecha legible
  const hoyTexto = new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();

  return (
    <header
      className={`sticky top-0 h-16 bg-surface-clean-white border-b border-border-subtle px-6 flex items-center justify-between shrink-0 shadow-[0_2px_12px_rgba(23,18,29,0.05)] z-30 transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
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
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onNavigateTab('superadmin')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold transition-all active:scale-95 shadow-xs"
          title="Abrir Vista Independiente de SuperAdmin, Telemetría Edge & Motion Graphics"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="material-symbols-outlined text-[16px] text-emerald-700">shield_lock</span>
          <span>SuperAdmin Edge</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('data')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-dental-deep-navy text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">
            database
          </span>
          <span>Data</span>
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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">
            add_circle
          </span>
          <span>+ Nueva Cita</span>
        </button>

        <div className="h-6 w-px bg-border-subtle mx-1" />

        {/* Notificaciones y Perfil Doctor con Identicon Vectorial Determinista */}
        <div className="flex items-center gap-3">
          {/* Campanita de Notificación Ultra Llamativa (Tasa BCV + Avisos) */}
          <button
            type="button"
            aria-label="Avisos, Tasa BCV y Citas Pendientes"
            onClick={() => setNotificationModalOpen(true)}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-amber-400/20 hover:bg-amber-400/30 text-amber-900 border border-amber-400/60 shadow-xs ring-2 ring-amber-400/30 transition-all active:scale-90 cursor-pointer group"
            title={`Avisos OdontoSalud • Tasa BCV: ${Number(tasaBcv).toFixed(2)} Bs/$`}
          >
            <span className="material-symbols-outlined text-[22px] text-amber-700 group-hover:rotate-12 transition-transform duration-300">
              {hayNoLeidas ? 'notifications_active' : 'notifications'}
            </span>
            {hayNoLeidas ? (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-danger ring-2 ring-white shadow-xs" />
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white shadow-2xs" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('login')}
            className="flex items-center gap-2 pl-1 cursor-pointer hover:opacity-85 transition-opacity text-left"
            title="Sesión Clínica / Validar Credenciales (#login)"
          >
            <DeterministicIdenticon seed={doctorActivo} name={doctorActivo} size={36} />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-dental-deep-navy leading-tight">
                {doctorActivo}
              </span>
              <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
                <span>{sedeActiva.nombre}</span>
                <span>•</span>
                <span className="underline">Sesión</span>
              </span>
            </div>
          </button>
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
