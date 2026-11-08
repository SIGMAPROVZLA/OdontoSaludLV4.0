import React, { useEffect, useState, useMemo } from 'react';
import { useOdontologos } from '../../hooks/useOdontologos';
import { useSede } from '../../context/SedeContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { ApiClient } from '../../services/api';
import { DashboardPulse } from '../../types/clinical';

import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { DesktopDashboardView } from './DesktopDashboardView';
import { TabId } from '../layout/BottomNavigation';
import { PulsoDetailModal, PulsoKpiType } from './PulsoDetailModal';
import { OdontologaPerformanceCard } from './OdontologaPerformanceCard';
import { PulsoPerformanceMotionDial } from './PulsoPerformanceMotionDial';

interface DashboardViewProps {
  onNavigateTab: (tab: TabId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { sedeActiva, sedeId, doctorActivo } = useSede();
  const { tasaBcv } = useTasaCambio();
  const { isDesktop } = useDeviceLayout();
  const [pulse, setPulse] = useState<DashboardPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalKpi, setModalKpi] = useState<PulsoKpiType | null>(null);
  const { odontologos } = useOdontologos();

  // Datos del doctor activo conectado a la tabla oficial de Odontólogos
  const doctorActivoData = useMemo(() => {
    return (
      odontologos.find((o) => o.nombres === doctorActivo) ||
      odontologos.find((o) => o.boxAsignado === 1 && (o.sedeId === 'ambas' || o.sedeId === sedeId)) ||
      odontologos[0]
    );
  }, [odontologos, doctorActivo, sedeId]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    ApiClient.getDashboardPulse(sedeId)
      .then((data) => {
        if (isMounted) setPulse(data);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sedeId]);

  if (isDesktop) {
    return (
      <DesktopDashboardView
        pulse={pulse}
        loading={loading}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Saludo Clínico y Micro-banner de Guardia */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-electric-blue/5 pointer-events-none" />
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                alt={doctorActivoData?.nombres || doctorActivo}
                src={doctorActivoData?.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80"}
                className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-primary/20"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-status-success ring-2 ring-surface-clean-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-surface-clean-white animate-ping" />
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-base text-dental-deep-navy truncate">
                  Hola, {doctorActivoData ? doctorActivoData.nombres.split(' ')[0] + ' ' + (doctorActivoData.nombres.split(' ')[2] || doctorActivoData.nombres.split(' ')[1]) : 'Dra. Domínguez'}
                </span>
                <span className="text-electric-blue text-xs">✨</span>
              </div>
              <p className="text-xs text-secondary truncate">
                Box {doctorActivoData?.boxAsignado || 1} Activo • {sedeActiva.nombre}
              </p>
            </div>
          </div>

          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-surface-subtle-ice text-primary font-bold text-xs border border-border-subtle">
            {sedeActiva.totalBoxes} Boxes
          </span>
        </div>

        {/* Micro banner de guardia clínica */}
        <div className="mt-3 pt-2 bg-surface-subtle-ice rounded-xl px-3 py-2 flex items-center justify-between border border-border-subtle">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-vibrant-cyan shrink-0 animate-pulse" />
            <span className="text-xs text-dental-deep-navy truncate font-medium">
              Guardia asistencial fluida sin demoras en esterilización
            </span>
          </div>
          <span className="text-xs text-electric-blue font-bold shrink-0">
            Tasa BCV: {(pulse?.tasaBcv ?? 49.85).toFixed(2)} Bs/$
          </span>
        </div>
      </section>

      {/* Pulso del Día: Métricas 100% Responsivas & Animadas (Clickeables para Ver Resumen) */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px] animate-pulse">
              query_stats
            </span>
            <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy">
              Pulso del Día
            </h2>
          </div>
          <span className="text-[11px] text-secondary font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
            {loading ? 'Sincronizando...' : 'En vivo • Toca para ver resumen'}
          </span>
        </div>

        {/* Cuadrícula 100% Responsiva: 2 columnas en móvil, 4 en tablet y desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Citas Hoy */}
          <button
            type="button"
            onClick={() => setModalKpi('citas')}
            className="bg-surface-clean-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-border-subtle flex flex-col justify-between text-left hover:border-primary/50 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">event_available</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-primary font-black flex items-center gap-1">
                Hoy
                <span className="material-symbols-outlined text-[12px] opacity-60">open_in_new</span>
              </span>
            </div>
            <div className="mt-2.5">
              <span className="font-display font-black text-2xl sm:text-3xl text-dental-deep-navy leading-none block tracking-tight">
                {pulse?.metricas.citasTotal || 12}
              </span>
              <span className="text-xs text-secondary block mt-1 truncate font-medium">
                {pulse?.metricas.enEspera || 3} en espera
              </span>
            </div>
          </button>

          {/* Ocupación Sillones */}
          <button
            type="button"
            onClick={() => setModalKpi('ocupacion')}
            className="bg-surface-clean-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-border-subtle flex flex-col justify-between text-left hover:border-sky-500/50 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">airline_seat_recline_extra</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black flex items-center gap-1 border border-emerald-200/60">
                Óptimo
                <span className="material-symbols-outlined text-[12px] opacity-60">open_in_new</span>
              </span>
            </div>
            <div className="mt-2.5">
              <span className="font-display font-black text-2xl sm:text-3xl text-dental-deep-navy leading-none block tracking-tight">
                {pulse?.metricas.ocupacionPorcentaje || 85}%
              </span>
              <span className="text-xs text-secondary block mt-1 truncate font-medium">
                {sedeActiva.totalBoxes} sillones
              </span>
            </div>
          </button>

          {/* Presupuestos */}
          <button
            type="button"
            onClick={() => setModalKpi('presupuestos')}
            className="bg-surface-clean-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-border-subtle flex flex-col justify-between text-left hover:border-amber-500/50 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">request_quote</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black flex items-center gap-1 border border-amber-200/60">
                Activos
                <span className="material-symbols-outlined text-[12px] opacity-60">open_in_new</span>
              </span>
            </div>
            <div className="mt-2.5">
              <span className="font-display font-black text-2xl sm:text-3xl text-dental-deep-navy leading-none block tracking-tight">
                ${pulse?.metricas.presupuestosPendientesUsd || 1420}
              </span>
              <span className="text-xs text-secondary block mt-1 truncate font-medium">
                5 pacientes
              </span>
            </div>
          </button>

          {/* Ingresos Cobrados */}
          <button
            type="button"
            onClick={() => setModalKpi('cobrado')}
            className="bg-surface-clean-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-border-subtle flex flex-col justify-between text-left hover:border-emerald-500/50 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform shadow-2xs">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center gap-1 border border-emerald-200/60">
                Cobrado
                <span className="material-symbols-outlined text-[12px] opacity-60">open_in_new</span>
              </span>
            </div>
            <div className="mt-2.5">
              <span className="font-display font-black text-2xl sm:text-3xl text-dental-deep-navy leading-none block tracking-tight">
                ${pulse?.metricas.cobradoHoyUsd || 680}
              </span>
              <span className="text-xs text-secondary block mt-1 truncate font-medium">
                ≈ Bs. {((pulse?.metricas.cobradoHoyUsd || 680) * (tasaBcv || 49.85)).toLocaleString('es-VE', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </button>
        </div>

        {/* Dial de Rendimiento Clínico de Odontólogas en Vivo (Resumen del Rendimiento Facultativo) */}
        <PulsoPerformanceMotionDial
          tasaBcv={tasaBcv}
          onOpenPerformance={() => {
            const el = document.getElementById('seccion-rendimiento-facultativo');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </section>

      {/* Acciones Rápidas Táctiles (1-toque) */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-bold text-sm text-dental-deep-navy">
            Acciones Rápidas
          </span>
          <span className="text-[11px] text-secondary">Acceso 1-toque</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('reserva')}
            className="flex flex-col items-center text-center p-2 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-clean-white shadow-sm flex items-center justify-center text-electric-blue">
              <span className="material-symbols-outlined text-[20px]">add_alarm</span>
            </div>
            <span className="text-[11px] font-bold text-dental-deep-navy mt-1 leading-tight">
              Nueva Cita
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('odontograma')}
            className="flex flex-col items-center text-center p-2 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-clean-white shadow-sm flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">dentistry</span>
            </div>
            <span className="text-[11px] font-bold text-dental-deep-navy mt-1 leading-tight">
              Odontograma
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('cobros')}
            className="flex flex-col items-center text-center p-2 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-clean-white shadow-sm flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">post_add</span>
            </div>
            <span className="text-[11px] font-bold text-dental-deep-navy mt-1 leading-tight">
              Cobros
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('reserva')}
            className="flex flex-col items-center text-center p-2 rounded-xl bg-error-container/30 hover:bg-error-container/60 border border-status-danger/20 transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-clean-white shadow-sm flex items-center justify-center text-status-danger">
              <span className="material-symbols-outlined text-[20px]">medical_services</span>
            </div>
            <span className="text-[11px] font-bold text-status-danger mt-1 leading-tight">
              Urgencia
            </span>
          </button>
        </div>
      </section>

      {/* Monitor de Ocupación de Sillones Clínicos */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-electric-blue text-[18px]">
              meeting_room
            </span>
            <span className="font-display font-bold text-sm text-dental-deep-navy">
              Ocupación de Boxes
            </span>
          </div>
          <span className="text-xs text-secondary">{sedeActiva.nombre}</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {(pulse?.boxes || []).map((b) => (
            <div
              key={b.boxNumero}
              className="p-2.5 rounded-xl bg-surface-subtle-ice text-center flex flex-col items-center border border-border-subtle"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full mb-1 ${
                  b.estado === 'ocupado'
                    ? 'bg-status-success animate-pulse'
                    : b.estado === 'limpieza'
                    ? 'bg-status-warning'
                    : 'bg-outline-variant'
                }`}
              />
              <span className="font-bold text-xs text-dental-deep-navy">
                Box {b.boxNumero}
              </span>
              <span className="text-[10px] text-secondary truncate max-w-full">
                {(() => {
                  const docAsignado = odontologos.find(
                    (o) => o.boxAsignado === b.boxNumero && (o.sedeId === 'ambas' || o.sedeId === sedeId)
                  );
                  if (b.estado === 'ocupado') return b.doctorNombre || docAsignado?.nombres || 'Ocupado';
                  if (b.estado === 'limpieza') return 'Limpieza';
                  return docAsignado ? 'Libre (' + docAsignado.nombres.split(' ')[0] + ')' : 'Libre';
                })()}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Listado de Citas de Hoy */}
      <section className="flex flex-col gap-2.5">
        <div className="space-y-2.5">
          {(pulse?.citasHoy || []).map((cita) => (
            <div
              key={cita.id}
              className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle relative overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  cita.estado === 'en_sillon'
                    ? 'bg-status-success'
                    : cita.estado === 'pendiente'
                    ? 'bg-status-warning'
                    : 'bg-electric-blue'
                }`}
              />

              <div className="pl-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        cita.pacienteAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                      }
                      alt={cita.pacienteNombre}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs text-dental-deep-navy truncate">
                          {cita.pacienteNombre}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cita.estado === 'en_sillon'
                              ? 'bg-status-success/15 text-status-success'
                              : 'bg-surface-container text-secondary'
                          }`}
                        >
                          {cita.estado === 'en_sillon' ? 'En sillón' : cita.estado}
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary truncate mt-0.5">
                        {cita.motivo} • Box {cita.boxNumero}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-xs text-electric-blue shrink-0">
                    {cita.horaInicio}
                  </span>
                </div>

                <div className="mt-3 pt-2 bg-surface-subtle-ice rounded-xl p-2.5 flex items-center justify-between gap-2 border border-border-subtle">
                  <div className="flex items-center gap-1.5 text-secondary text-xs">
                    <span className="material-symbols-outlined text-[16px] text-status-success">
                      check_circle
                    </span>
                    <span>{cita.pacienteTelefono}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('odontograma')}
                      className="px-2.5 py-1 rounded-lg bg-surface-clean-white border border-border-subtle text-secondary font-bold text-xs active:scale-95"
                    >
                      Ficha
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `https://wa.me/${cita.pacienteTelefono.replace(/[^0-9]/g, '')}`,
                          '_blank'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-status-success text-surface-clean-white font-bold text-xs shadow-sm active:scale-95 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">chat</span>
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tarjeta Resumen de Rendimiento con KPIs Animados en Filas por Odontóloga */}
      <OdontologaPerformanceCard
        sedeActualId={sedeId}
        tasaBcv={tasaBcv}
      />

      {/* Modal Resumen Interactivo al Presionar los KPIs del Pulso */}
      <PulsoDetailModal
        kpiType={modalKpi}
        onClose={() => setModalKpi(null)}
        pulse={pulse}
        sedeId={sedeId}
        sedeNombre={sedeActiva.nombre}
        tasaBcv={tasaBcv}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
