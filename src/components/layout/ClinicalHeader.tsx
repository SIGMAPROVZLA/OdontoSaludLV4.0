import React, { useState } from 'react';
import { useSede, SEDES_DISPONIBLES } from '../../context/SedeContext';
import { SedeId } from '../../types/clinical';
import { TabId } from './BottomNavigation';

interface ClinicalHeaderProps {
  onNavigateTab?: (tab: TabId) => void;
}

export const ClinicalHeader: React.FC<ClinicalHeaderProps> = ({ onNavigateTab }) => {
  const { sedeActiva, cambiarSede, doctorActivo } = useSede();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const sedesList = Object.values(SEDES_DISPONIBLES);

  return (
    <header className="fixed top-0 w-full z-50 pt-[env(safe-area-inset-top,0px)] bg-surface-clean-white/95 backdrop-blur-xl shadow-[0_1px_12px_rgba(15,43,72,0.06)] border-b border-border-subtle">
      <div className="h-16 px-gutter-mobile flex items-center justify-between gap-2 max-w-5xl mx-auto">
        {/* Izquierda: Logo OdontoSalud + Título OdontoSalud La Victoria + Selección Simple de Sedes como Subtítulo */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Logo OdontoSalud */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-dental-deep-navy via-primary to-electric-blue flex items-center justify-center text-white shadow-md ring-2 ring-primary/20">
              <span className="material-symbols-outlined text-[24px]">dentistry</span>
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-success ring-2 ring-surface-clean-white"
              title="Clínica Operativa en Vivo"
            />
          </div>

          <div className="flex flex-col min-w-0">
            {/* Título Principal */}
            <h1 className="font-display font-extrabold text-sm sm:text-base text-dental-deep-navy truncate leading-tight tracking-tight">
              OdontoSalud {sedeActiva.nombre}
            </h1>

            {/* Selección Simple de Sedes como Subtítulo */}
            <div className="relative inline-flex items-center mt-0.5">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:text-dental-deep-navy transition-colors text-left group"
                title="Cambiar sede de atención"
              >
                <span className="material-symbols-outlined text-[13px] text-electric-blue group-hover:scale-110 transition-transform">
                  location_on
                </span>
                <span className="truncate max-w-[160px] text-dental-deep-navy/80">
                  {sedeActiva.nombre}
                </span>
                <span className="text-[10px] text-electric-blue font-bold">⇄ Cambiar</span>
                <span className="material-symbols-outlined text-[13px] text-secondary">
                  expand_more
                </span>
              </button>

              {/* Menú Dropdown Simple de Selección de Sede */}
              {dropdownOpen && (
                <div className="absolute top-6 left-0 z-50 bg-surface-clean-white rounded-2xl shadow-[0_8px_24px_rgba(15,43,72,0.18)] border border-border-subtle py-1.5 min-w-[210px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Seleccionar Sede
                  </div>
                  {sedesList.map((sede) => (
                    <button
                      key={sede.id}
                      type="button"
                      onClick={() => {
                        cambiarSede(sede.id as SedeId);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center justify-between text-dental-deep-navy hover:bg-surface-subtle-ice transition-colors text-xs font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            sedeActiva.id === sede.id
                              ? 'bg-status-success animate-pulse'
                              : 'bg-outline-variant'
                          }`}
                        />
                        <div>
                          <p className="font-bold leading-tight">{sede.nombre}</p>
                          <p className="text-[10px] text-secondary">
                            {sede.totalBoxes} Boxes disponibles
                          </p>
                        </div>
                      </div>
                      {sedeActiva.id === sede.id && (
                        <span className="material-symbols-outlined text-[16px] text-electric-blue">
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Derecha: Campanita de Notificación + Icono de VictorIA Pro */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Campanita de Notificación (Triaje / Citas) */}
          <button
            type="button"
            aria-label="Notificaciones y Citas Pendientes"
            onClick={() => onNavigateTab?.('coordinacion')}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice transition-colors active:scale-95"
            title="Ver Citas Previas y Triaje"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-danger animate-pulse" />
          </button>

          {/* Icono de VictorIA Pro */}
          <button
            type="button"
            aria-label="Abrir Asistente VictorIA Pro"
            onClick={() => window.dispatchEvent(new CustomEvent('open-victoria-assistant'))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-dental-deep-navy via-primary to-electric-blue text-white shadow-sm hover:brightness-105 active:scale-95 transition-all group"
            title="VictorIA Pro • Asistente Clínico Inteligente"
          >
            <span className="material-symbols-outlined text-[17px] text-vibrant-cyan group-hover:rotate-12 transition-transform">
              smart_toy
            </span>
            <span className="text-[11px] font-bold tracking-tight">VictorIA</span>
            <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-white/20 uppercase tracking-wider text-vibrant-cyan">
              Pro
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
