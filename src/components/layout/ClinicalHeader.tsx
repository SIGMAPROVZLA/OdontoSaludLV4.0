import React, { useState, useEffect, useRef } from 'react';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { TabId } from './BottomNavigation';
import { NotificationCenterModal } from './NotificationCenterModal';

interface ClinicalHeaderProps {
  onNavigateTab?: (tab: TabId) => void;
}

export const ClinicalHeader: React.FC<ClinicalHeaderProps> = ({ onNavigateTab }) => {
  const { tasaBcv, hayNoLeidas } = useTasaCambio();
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Ocultar cabecera suavemente al deslizar hacia arriba y mostrarla al deslizar hacia abajo (AGENTS.md Capa 4)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.pageYOffset || document.documentElement.scrollTop;
          
          if (currentY <= 20) {
            // Siempre visible en la parte superior
            setIsVisible(true);
          } else if (currentY > lastScrollY.current + 8) {
            // Scroll hacia abajo para avanzar contenido -> Ocultar suavemente
            setIsVisible(false);
          } else if (currentY < lastScrollY.current - 6) {
            // Deslizar hacia abajo (scroll hacia arriba para ver navegación) -> Revelar suavemente
            setIsVisible(true);
          }
          lastScrollY.current = Math.max(0, currentY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 pt-[env(safe-area-inset-top,0px)] bg-surface-clean-white shadow-[0_2px_16px_rgba(23,18,29,0.08)] border-b border-border-subtle transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="h-16 px-gutter-mobile flex items-center justify-between gap-2 max-w-5xl mx-auto">
        {/* Izquierda: Logo OdontoSalud + Título OdontoSalud La Victoria + Subtítulo SIGMA LABS */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src="/brand/logo-odontosalud-vertical.png"
            alt="Logo OdontoSalud La Victoria"
            className="h-11 w-11 object-contain shrink-0"
          />

          <div className="flex flex-col min-w-0">
            <h1 className="font-display font-extrabold text-sm sm:text-base text-dental-deep-navy truncate leading-tight tracking-tight">
              OdontoSalud La Victoria
            </h1>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-bold text-primary tracking-wide truncate">
                Tecnologia SIGMA LABS
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: Campanita de Notificación + Icono de VictorIA Pro */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Campanita de Notificación Ultra Llamativa (Tasa BCV + Avisos) */}
          <button
            type="button"
            aria-label="Avisos, Tasa BCV y Citas Pendientes"
            onClick={() => setNotificationModalOpen(true)}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-900 border border-amber-400/60 shadow-xs ring-2 ring-amber-400/30 transition-all active:scale-90 cursor-pointer group"
            title={`Avisos OdontoSalud • Tasa BCV: ${Number(tasaBcv).toFixed(2)} Bs/$`}
          >
            <span className="material-symbols-outlined text-[23px] text-amber-700 group-hover:rotate-12 transition-transform duration-300">
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
