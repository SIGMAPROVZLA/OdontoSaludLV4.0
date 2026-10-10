import React from 'react';
import { useSede } from '../../context/SedeContext';
import { DashboardPulse } from '../../types/clinical';
import { TabId } from '../layout/BottomNavigation';

interface DesktopDashboardViewProps {
  pulse: DashboardPulse | null;
  loading: boolean;
  onNavigateTab: (tab: TabId) => void;
}

export const DesktopDashboardView: React.FC<DesktopDashboardViewProps> = ({
  pulse,
  loading,
  onNavigateTab,
}) => {
  const { sedeActiva, doctorActivo } = useSede();

  const citas = pulse?.citasHoy || [];
  const boxes = pulse?.boxes || [];
  const metricas = pulse?.metricas || {
    citasTotal: 12,
    enEspera: 3,
    ocupacionPorcentaje: 85,
    presupuestosPendientesUsd: 1420,
    cobradoHoyUsd: 680,
  };

  return (
    <div className="space-y-6">
      {/* 1. Header de Sección */}
      <div>
        <h1 className="text-xl font-display font-extrabold text-dental-deep-navy">
          Dashboard Clínico & Control Asistencial
        </h1>
        <p className="text-xs text-secondary mt-0.5">
          Resumen operativo y flujo de pacientes en {sedeActiva.nombre} ({sedeActiva.id === 'victoria' ? 'Sede Principal' : 'Sucursal Integral'}).
        </p>
      </div>

      {/* 2. Cuatro Tarjetas Métricas Superiores (Fiel a Stitch Desktop) */}
      <div className="grid grid-cols-4 gap-4">
        {/* Card 1: Pacientes Hoy */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Pacientes Hoy
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-black text-dental-deep-navy">
                {metricas.citasTotal}
              </span>
              <span className="text-[10px] font-bold text-status-success bg-status-success/10 px-1.5 py-0.5 rounded-full">
                +12% vs ayer
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-secondary mt-3 pt-2 border-t border-border-subtle/60">
              <span><strong>{citas.filter((c) => c.estado === 'completada').length || 8}</strong> Atendidos</span>
              <span><strong>{metricas.enEspera}</strong> En sala</span>
              <span><strong>{citas.filter((c) => c.estado === 'pendiente').length || 4}</strong> Pendientes</span>
            </div>
          </div>
        </div>

        {/* Card 2: Ingresos del Día / Recaudación */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Cobrado Hoy (USD)
            </span>
            <span className="w-7 h-7 rounded-lg bg-status-success/10 flex items-center justify-center text-status-success">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-black text-dental-deep-navy">
                ${metricas.cobradoHoyUsd}
              </span>
              <span className="text-[10px] font-bold text-status-success bg-status-success/10 px-1.5 py-0.5 rounded-full">
                Tasa: {(pulse?.tasaBcv ?? 49.85).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-secondary mt-3 pt-2 border-t border-border-subtle/60">
              <span>Bs. {((metricas.cobradoHoyUsd || 680) * (pulse?.tasaBcv || 49.85)).toLocaleString('es-VE', { maximumFractionDigits: 2 })}</span>
              <span className="text-primary font-semibold">Meta 82%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Tratamientos Activos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Tratamientos Activos
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[18px]">dentistry</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-black text-dental-deep-navy">
                46
              </span>
              <span className="text-[10px] text-secondary">
                En seguimiento
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-secondary mt-3 pt-2 border-t border-border-subtle/60">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-electric-blue" /> Ortodoncia</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-vibrant-cyan" /> Implantes</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> Endo</span>
            </div>
          </div>
        </div>

        {/* Card 4: Ocupación de Boxes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              Ocupación Boxes
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-subtle-ice flex items-center justify-center text-electric-blue">
              <span className="material-symbols-outlined text-[18px]">airline_seat_recline_extra</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-black text-dental-deep-navy">
                {metricas.ocupacionPorcentaje}%
              </span>
              <span className="text-[10px] font-semibold text-secondary">
                {sedeActiva.totalBoxes} sillones
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border-subtle/60">
              {boxes.map((b) => (
                <span
                  key={b.boxNumero}
                  className={`flex-1 py-0.5 rounded text-[10px] font-bold text-center ${
                    b.estado === 'ocupado'
                      ? 'bg-status-danger/10 text-status-danger'
                      : b.estado === 'limpieza'
                      ? 'bg-status-warning/15 text-status-warning'
                      : 'bg-status-success/10 text-status-success'
                  }`}
                  title={`Box ${b.boxNumero}: ${b.estado}`}
                >
                  B{b.boxNumero}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Estructura Principal en 2 Columnas (8 cols + 4 cols) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Columna Izquierda (8 de 12) */}
        <div className="col-span-8 space-y-6">
          {/* Agenda en Tiempo Real */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle/60">
              <div>
                <h3 className="font-display font-bold text-sm text-dental-deep-navy flex items-center gap-2">
                  <span className="material-symbols-outlined text-electric-blue text-[18px]">calendar_clock</span>
                  Agenda en Tiempo Real
                </h3>
                <p className="text-[11px] text-secondary mt-0.5">
                  Turno Mañana y Tarde • {citas.length} citas sincronizadas en Cloudflare D1
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('agenda')}
                  className="px-3 py-1.5 rounded-lg bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-xs font-bold text-dental-deep-navy transition-all"
                >
                  Ver Todo
                </button>
              </div>
            </div>

            {/* Lista de Citas Desktop con Tabla/Cards */}
            <div className="divide-y divide-border-subtle/40 mt-2">
              {citas.map((cita) => (
                <div key={cita.id} className="py-3 flex items-center justify-between gap-4 hover:bg-surface-bright/80 px-2 rounded-xl transition-colors">
                  {/* Hora y Tiempo */}
                  <div className="w-16 shrink-0">
                    <span className="font-display font-bold text-xs text-dental-deep-navy block">
                      {cita.horaInicio}
                    </span>
                    <span className="text-[10px] text-secondary">
                      {cita.minutosTranscurridos ? `${cita.minutosTranscurridos} min` : 'Programada'}
                    </span>
                  </div>

                  {/* Paciente y Doctor */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center font-bold text-primary text-xs shrink-0">
                      {cita.pacienteNombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-dental-deep-navy truncate">
                        {cita.pacienteNombre}
                      </p>
                      <p className="text-[11px] text-secondary truncate">
                        {cita.motivo} • <span className="text-primary font-medium">{cita.doctorNombre}</span>
                      </p>
                    </div>
                  </div>

                  {/* Box */}
                  <div className="shrink-0 text-center px-3 py-1 rounded-lg bg-surface-subtle-ice border border-border-subtle">
                    <span className="text-[10px] font-bold text-dental-deep-navy uppercase">
                      Box {cita.boxNumero}
                    </span>
                  </div>

                  {/* Estado Badge */}
                  <div className="shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                        cita.estado === 'en_sillon'
                          ? 'bg-status-success/10 text-status-success'
                          : cita.estado === 'pendiente'
                          ? 'bg-status-warning/15 text-status-warning'
                          : 'bg-electric-blue/10 text-electric-blue'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {cita.estado === 'en_sillon' ? 'En Consulta' : cita.estado === 'pendiente' ? 'En Espera' : 'Confirmado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tratamientos Más Solicitados */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border-subtle">
            <h3 className="font-display font-bold text-sm text-dental-deep-navy mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">bar_chart</span>
              Tratamientos Más Solicitados
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-dental-deep-navy mb-1">
                    <span>Limpieza Ultrasónica y Profilaxis</span>
                    <span className="text-secondary">38% (112 casos)</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-electric-blue h-full rounded-full" style={{ width: '38%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-dental-deep-navy mb-1">
                    <span>Ortodoncia & Alineadores</span>
                    <span className="text-secondary">26% (76 casos)</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-vibrant-cyan h-full rounded-full" style={{ width: '26%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-dental-deep-navy mb-1">
                    <span>Restauraciones en Resina</span>
                    <span className="text-secondary">21% (62 casos)</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-tertiary h-full rounded-full" style={{ width: '21%' }} />
                  </div>
                </div>
              </div>

              {/* Tarjeta de Rendimiento Clínico */}
              <div className="bg-surface-subtle-ice rounded-xl p-4 border border-border-subtle flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Rendimiento Clínico Global
                  </div>
                  <p className="text-[11px] text-secondary leading-relaxed">
                    Flujo de citas optimizado con triaje de urgencias y confirmación automática vía WhatsApp.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-bold">
                  <span className="text-secondary">Tasa de Fidelización:</span>
                  <span className="text-status-success font-display">94.8% Excelente</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (4 de 12): Sala de Espera, Stock y Nota de Guardia */}
        <div className="col-span-4 space-y-6">
          {/* 1. Sala de Espera */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-subtle/60">
              <span className="font-display font-bold text-xs text-dental-deep-navy flex items-center gap-1.5">
                <span className="material-symbols-outlined text-status-warning text-[18px]">airline_seat_recline_normal</span>
                Sala de Espera
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning">
                2 en espera
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary text-white font-bold text-xs flex items-center justify-center">
                    PV
                  </div>
                  <div>
                    <p className="font-bold text-xs text-dental-deep-navy leading-tight">Patricia Velásquez</p>
                    <p className="text-[10px] text-secondary">C.I: V-19.845.221 • Box 01</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-electric-blue text-white text-[10px] font-bold hover:bg-primary transition-colors"
                >
                  Llamar
                </button>
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-secondary text-white font-bold text-xs flex items-center justify-center">
                    MR
                  </div>
                  <div>
                    <p className="font-bold text-xs text-dental-deep-navy leading-tight">Marcos Ramos</p>
                    <p className="text-[10px] text-secondary">Ortodoncia • Box 02</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-electric-blue text-white text-[10px] font-bold hover:bg-primary transition-colors"
                >
                  Llamar
                </button>
              </div>
            </div>
          </div>

          {/* 2. Alertas y Stock */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-subtle/60">
              <span className="font-display font-bold text-xs text-dental-deep-navy flex items-center gap-1.5">
                <span className="material-symbols-outlined text-status-danger text-[18px]">warning</span>
                Alertas y Materiales
              </span>
              <span className="text-[10px] font-bold text-status-danger">3 notas</span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-error-container/20 border border-status-danger/20 text-xs">
                <p className="font-bold text-status-danger text-[11px]">Anestesia Lidocaína 2%</p>
                <p className="text-[10px] text-secondary mt-0.5">Stock en recepción: 14 cárpules restantes.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary-fixed/20 border border-primary/20 text-xs">
                <p className="font-bold text-primary text-[11px]">Laboratorio Dental Pro</p>
                <p className="text-[10px] text-secondary mt-0.5">Corona zirconio paciente C. Mendoza lista para cementar.</p>
              </div>
            </div>
          </div>

          {/* 3. Nota de Guardia Clínica */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-xs text-dental-deep-navy flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">edit_note</span>
                Nota de Guardia
              </span>
              <span className="text-[10px] text-primary font-bold cursor-pointer hover:underline">Editar</span>
            </div>
            <p className="text-xs text-secondary italic bg-surface-subtle-ice p-3 rounded-xl border border-border-subtle leading-relaxed">
              "Esterilización y autoclave de Box 01 calibrados a primera hora. Dra. María Alejandra Domínguez en turno de atención quirúrgica."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
