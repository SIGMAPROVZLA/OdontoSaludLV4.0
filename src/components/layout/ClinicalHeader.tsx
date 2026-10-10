import React, { useState } from 'react';
import { useSede, SEDES_DISPONIBLES } from '../../context/SedeContext';
import { SedeId } from '../../types/clinical';

export const ClinicalHeader: React.FC = () => {
  const { sedeActiva, cambiarSede, doctorActivo } = useSede();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const sedesList = Object.values(SEDES_DISPONIBLES);

  return (
    <header className="fixed top-0 w-full z-50 pt-[env(safe-area-inset-top,0px)] bg-surface-clean-white/90 backdrop-blur-xl shadow-[0_1px_12px_rgba(15,43,72,0.06)] border-b border-border-subtle">
      <div className="h-16 px-gutter-mobile flex items-center justify-between gap-2 max-w-5xl mx-auto">
        {/* Perfil del Doctor y Switch Multisede */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <img
              alt={doctorActivo}
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-surface-clean-white shadow-[0_2px_6px_rgba(15,43,72,0.15)]"
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-success ring-2 ring-surface-clean-white"
              title="Sesión Clínica Activa"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-display font-bold text-sm text-dental-deep-navy truncate leading-tight">
                OdontoSalud
              </span>
              <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.2 rounded-full">
                VictorIA Pro
              </span>
            </div>

            {/* Selector Desplegable de Sede */}
            <div className="relative inline-flex items-center mt-0.5">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-dental-deep-navy transition-all active:scale-95 text-left"
              >
                <span className="material-symbols-outlined text-[13px] text-electric-blue">
                  location_on
                </span>
                <span className="text-xs font-semibold truncate max-w-[170px]">
                  {sedeActiva.id === 'victoria' ? 'La Victoria' : 'La Colonia Tovar'} ⇄
                </span>
                <span className="material-symbols-outlined text-[14px] text-secondary">
                  expand_more
                </span>
              </button>

              {/* Menú Dropdown */}
              {dropdownOpen && (
                <div className="absolute top-7 left-0 z-50 bg-surface-clean-white rounded-2xl shadow-[0_8px_24px_rgba(15,43,72,0.18)] border border-border-subtle py-1.5 min-w-[210px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Seleccionar Sede Activa
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

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="Notificaciones clínicas"
            className="relative w-10 h-10 flex items-center justify-center rounded-xl text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-electric-blue" />
          </button>
          <button
            type="button"
            aria-label="WhatsApp Asistencial"
            onClick={() => window.open(`https://wa.me/${sedeActiva.whatsapp}`, '_blank')}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-status-success bg-status-success/10 hover:bg-status-success/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
