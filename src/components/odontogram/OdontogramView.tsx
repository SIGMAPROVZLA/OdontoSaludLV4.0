import React, { useState, useEffect } from 'react';
import { useSede } from '../../context/SedeContext';
import { ApiClient } from '../../services/api';
import { ToothRecord } from '../../types/clinical';
import { QuadrantArchView } from './QuadrantArchView';

export const OdontogramView: React.FC = () => {
  const { sedeActiva, sedeId, doctorActivo } = useSede();
  const [teeth, setTeeth] = useState<ToothRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Paciente de ejemplo para la sesión
  const pacienteId = 'pac-patricia';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    ApiClient.getOdontograma(pacienteId, sedeId)
      .then((data) => {
        if (isMounted) setTeeth(data);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pacienteId, sedeId]);

  const handleUpdateTooth = async (updatedTooth: ToothRecord) => {
    setTeeth((prev) =>
      prev.map((t) => (t.numeroFdi === updatedTooth.numeroFdi ? updatedTooth : t))
    );
    await ApiClient.guardarPiezaOdontograma(pacienteId, updatedTooth, sedeId);
  };

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Tarjeta Resumen del Paciente Activo */}
      <div className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPeZ-uFSA20-Op8mp8d22UXBPJ4mrJYuKQSVCWC9iI_9_t2JEmnittLQqLwnj_cBN-65gua22VrWA03DY4pLaiYWXzVklQnHTKMDQ7T8xskLKCknZvlS8aZZ5BJM1GW8J62sB3tZGbbq2XWogsn6cXAy__4XoGfwr-pVRMQC8fRTHGrdA9esTkkMyJG_KrQhniXPG8A4GiskyvFCRI5p533g6wf4Bh0gDMm6C_4hI"
                alt="Patricia Velásquez"
                className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
              />
              <span
                className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-status-success rounded-full ring-2 ring-surface-clean-white"
                title="Paciente Activo en Sillón"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="font-display font-bold text-base text-dental-deep-navy truncate">
                Patricia Velásquez
              </h2>
              <div className="flex items-center gap-1.5 text-secondary text-xs">
                <span>C.I: V-19.845.221</span>
                <span>•</span>
                <span>34 años</span>
              </div>
              <span className="text-[11px] text-tertiary font-bold flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                Atención en {sedeActiva.nombre}
              </span>
            </div>
          </div>

          <div className="flex gap-1.5 shrink-0">
            <a
              href="tel:+584145550921"
              aria-label="Llamar al paciente"
              className="w-10 h-10 rounded-xl bg-surface-subtle-ice border border-border-subtle text-primary flex items-center justify-center active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">phone</span>
            </a>
            <a
              href="https://wa.me/584145550921"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Enviar WhatsApp"
              className="w-10 h-10 rounded-xl bg-status-success/15 border border-status-success/20 text-status-success flex items-center justify-center active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </a>
          </div>
        </div>

        {/* Alertas Médicas y Seguro */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border-subtle">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-xs font-bold animate-pulse">
            <span className="material-symbols-outlined text-[14px] text-error">warning</span>
            <span>Alergia a Penicilina</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-subtle-ice text-secondary text-xs border border-border-subtle">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            <span>Seguros Mercantil</span>
          </div>
        </div>
      </div>

      {/* Visor de Radiografía Periapical RVG */}
      <div className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-bold text-sm text-dental-deep-navy">
            Radiografía Digital Pieza 16 (Sensor RVG 2.0)
          </h4>
          <span className="text-[11px] font-bold text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            Dosis Ultra Baja
          </span>
        </div>

        <div className="relative rounded-2xl overflow-hidden h-36 bg-dental-deep-navy flex items-center justify-center shadow-inner">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzNk8J9R3jS7mj8Ng5pX9XV8bes8wETBgJV6fQji5otUo1hgOYPy0RYFf6WcIWSB6obBOeELD5zsOlkbR9KZKmgJQl1pn_AcfknQzVy2w-qZYHMSIKtP4Y5RisRT3f3Mlces75xcKJ171AEt_t6jFZh5yp024E0PfZwlOKy_Ilt1Z1X4vwQGJuOKrl0dwFBKa-2Hx51SrsKYBes-O1lsF25x2vXyE5j5ZuJzWu_LI"
            alt="Radiografía dental periapical"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dental-deep-navy/90 via-transparent to-transparent flex items-end p-3">
            <div className="flex items-center justify-between w-full text-surface-clean-white text-[11px] font-semibold">
              <span>Resolución HD RVG 22 lp/mm</span>
              <span className="bg-surface-clean-white/20 px-2 py-0.5 rounded backdrop-blur-md">
                12 Mar 2025
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Odontograma FDI de 5 Caras */}
      {loading ? (
        <div className="p-8 text-center text-secondary text-xs">
          Cargando odontograma anatómico...
        </div>
      ) : (
        <QuadrantArchView teeth={teeth} onUpdateTooth={handleUpdateTooth} />
      )}

      {/* Última Nota de Evolución Clínica Firmada */}
      <div className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
              Nota de Progreso
            </span>
            <h4 className="font-display font-bold text-sm text-dental-deep-navy">
              Última Evolución Registrada
            </h4>
          </div>
          <span className="text-[10px] font-bold text-secondary bg-surface-container px-2 py-0.5 rounded-full">
            12 Mar 2025
          </span>
        </div>

        <p className="text-xs text-secondary leading-relaxed bg-surface-subtle-ice p-3 rounded-xl border border-border-subtle">
          Paciente acude refiriendo molestia al frío en cuadrante superior derecho. A la inspección
          clínica y secado con aire se visualiza lesión de caries en surco oclusal de pieza 16. Se
          toma Rx periapical descartando afectación pulpar directa. Se planifica operatoria directa
          con resina 3M Z350 XT en próxima sesión. Profilaxis general realizada.
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80"
              alt={doctorActivo}
              className="w-9 h-9 rounded-full object-cover shadow-sm"
            />
            <div>
              <span className="text-xs font-bold text-dental-deep-navy block leading-tight">
                {doctorActivo}
              </span>
              <span className="text-[10px] text-secondary">
                C.O.V 24.891 • Odontología Integral
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-status-success">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Firma Digital
            </span>
            <span className="text-[10px] text-secondary">12/03/2025 10:45 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
