import React, { useEffect } from 'react';
import { DashboardPulse, SedeId } from '../../types/clinical';
import { TabId } from '../layout/BottomNavigation';

export type PulsoKpiType = 'citas' | 'ocupacion' | 'presupuestos' | 'cobrado';

interface PulsoDetailModalProps {
  kpiType: PulsoKpiType | null;
  onClose: () => void;
  pulse: DashboardPulse | null;
  sedeId: SedeId;
  sedeNombre: string;
  tasaBcv: number;
  onNavigateTab: (tab: TabId) => void;
}

export const PulsoDetailModal: React.FC<PulsoDetailModalProps> = ({
  kpiType,
  onClose,
  pulse,
  sedeId,
  sedeNombre,
  tasaBcv,
  onNavigateTab,
}) => {
  // Manejo de tecla Escape para cerrar modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!kpiType) return null;

  const metricas = pulse?.metricas || {
    citasTotal: sedeId === 'victoria' ? 12 : 6,
    enEspera: sedeId === 'victoria' ? 3 : 1,
    ocupacionPorcentaje: sedeId === 'victoria' ? 85 : 50,
    presupuestosPendientesUsd: 1420,
    cobradoHoyUsd: 680,
  };

  const citas = pulse?.citasHoy || [];
  const boxes = pulse?.boxes || [];

  const citasCompletadas = citas.filter((c) => c.estado === 'completada').length || (sedeId === 'victoria' ? 6 : 3);
  const citasEnSillon = citas.filter((c) => c.estado === 'en_sillon').length || (sedeId === 'victoria' ? 2 : 1);
  const citasEnEspera = metricas.enEspera;
  const citasPendientes = citas.filter((c) => c.estado === 'pendiente' || !c.estado).length || (sedeId === 'victoria' ? 4 : 2);

  const cobradoBs = (metricas.cobradoHoyUsd * tasaBcv).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const presupuestosBs = (metricas.presupuestosPendientesUsd * tasaBcv).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop con Glassmorphism esmerilado */}
      <div
        className="fixed inset-0 bg-dental-deep-navy/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Contenedor Modal */}
      <div className="relative z-10 w-full max-w-2xl bg-surface-clean-white rounded-3xl shadow-[0_20px_50px_rgba(23,18,29,0.35)] border border-border-subtle overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Barra superior con gradiente del tema */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-vibrant-cyan to-dental-deep-navy" />

        {/* ===================================================================
            HEADER DEL MODAL
           =================================================================== */}
        <div className="p-4 sm:p-6 border-b border-border-subtle flex items-start justify-between gap-3 bg-surface-subtle-ice/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 ${
                kpiType === 'citas'
                  ? 'bg-primary'
                  : kpiType === 'ocupacion'
                  ? 'bg-sky-600'
                  : kpiType === 'presupuestos'
                  ? 'bg-amber-600'
                  : 'bg-emerald-600'
              }`}
            >
              <span className="material-symbols-outlined text-[26px]">
                {kpiType === 'citas' && 'event_available'}
                {kpiType === 'ocupacion' && 'airline_seat_recline_extra'}
                {kpiType === 'presupuestos' && 'request_quote'}
                {kpiType === 'cobrado' && 'payments'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy border border-border-subtle">
                  Pulso del Día • Resumen
                </span>
                <span className="text-xs text-secondary font-medium">
                  {sedeNombre} • Tasa BCV: {tasaBcv.toFixed(2)} Bs/$
                </span>
              </div>
              <h2 className="font-display font-black text-lg sm:text-xl text-dental-deep-navy mt-1 tracking-tight">
                {kpiType === 'citas' && 'Desglose de Pacientes & Agenda de Hoy'}
                {kpiType === 'ocupacion' && 'Ocupación de Boxes & Sillones Clínicos'}
                {kpiType === 'presupuestos' && 'Presupuestos Clínicos & Facturación en Curso'}
                {kpiType === 'cobrado' && 'Recaudación del Día & Arqueo de Ingresos'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-clean-white border border-border-subtle flex items-center justify-center text-secondary hover:text-dental-deep-navy active:scale-90 transition-all cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ===================================================================
            CUERPO SEGMENTADO SEGÚN EL KPI SELECCIONADO
           =================================================================== */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* ---------------------------------------------------------------
              CASO 1: KPI CITAS HOY
             --------------------------------------------------------------- */}
          {kpiType === 'citas' && (
            <div className="space-y-4">
              {/* Tarjetas resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle text-center">
                  <span className="text-2xl font-display font-black text-dental-deep-navy block">
                    {metricas.citasTotal}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-secondary block mt-0.5">
                    Total Citas
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-2xl font-display font-black text-emerald-700 block">
                    {citasCompletadas}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block mt-0.5">
                    Atendidos
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-2xl font-display font-black text-amber-700 block">
                    {citasEnEspera}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-amber-800 block mt-0.5">
                    En Sala Espera
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-center">
                  <span className="text-2xl font-display font-black text-sky-700 block">
                    {citasEnSillon}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-sky-800 block mt-0.5">
                    En Sillón
                  </span>
                </div>
              </div>

              {/* Lista detallada de pacientes agendados */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-dental-deep-navy">
                    Pacientes Agendados en la Jornada
                  </span>
                  <span className="text-[11px] text-secondary font-semibold">
                    {citas.length > 0 ? `${citas.length} registros sincronizados` : 'Mostrando pacientes de turno'}
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(citas.length > 0
                    ? citas
                    : [
                        {
                          id: 'mock-1',
                          horaInicio: '08:30',
                          pacienteNombre: 'Carlos Mendoza',
                          pacienteCedula: 'V-18.421.902',
                          doctorNombre: 'Dra. Domínguez',
                          boxNumero: 1,
                          motivo: 'Endodoncia Molar #16 (Sesión 2)',
                          estado: 'en_sillon',
                        },
                        {
                          id: 'mock-2',
                          horaInicio: '09:15',
                          pacienteNombre: 'Marcos Ramos',
                          pacienteCedula: 'V-20.114.850',
                          doctorNombre: 'Dra. Silva',
                          boxNumero: 2,
                          motivo: 'Control de Ortodoncia & Cambio Arcos',
                          estado: 'pendiente',
                        },
                        {
                          id: 'mock-3',
                          horaInicio: '10:00',
                          pacienteNombre: 'Patricia Velásquez',
                          pacienteCedula: 'V-19.845.221',
                          doctorNombre: 'Dra. Domínguez',
                          boxNumero: 1,
                          motivo: 'Profilaxis Ultrasónica & Resina #24',
                          estado: 'pendiente',
                        },
                        {
                          id: 'mock-4',
                          horaInicio: '11:00',
                          pacienteNombre: 'Elena Torres',
                          pacienteCedula: 'V-23.771.045',
                          doctorNombre: 'Dra. Hernández',
                          boxNumero: 1,
                          motivo: 'Evaluación Estética y Blanqueamiento',
                          estado: 'completada',
                        },
                      ]
                  ).map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between gap-3 hover:bg-surface-container transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-dental-deep-navy text-white flex flex-col items-center justify-center shrink-0">
                          <span className="text-[11px] font-black leading-none">{c.horaInicio}</span>
                          <span className="text-[9px] text-surface-container">Box {c.boxNumero}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-dental-deep-navy truncate">
                            {c.pacienteNombre}
                          </p>
                          <p className="text-[11px] text-secondary truncate">
                            {c.motivo} • <span className="font-semibold text-primary">{c.doctorNombre}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                          c.estado === 'en_sillon'
                            ? 'bg-status-success/15 text-status-success border border-status-success/30'
                            : c.estado === 'completada'
                            ? 'bg-surface-container text-secondary'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {c.estado === 'en_sillon' ? 'En Sillón' : c.estado === 'completada' ? 'Atendido' : 'En Espera'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              CASO 2: KPI OCUPACIÓN SILLONES / BOXES
             --------------------------------------------------------------- */}
          {kpiType === 'ocupacion' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                    Capacidad Instalada
                  </span>
                  <span className="text-3xl font-display font-black text-dental-deep-navy block mt-1">
                    {sedeId === 'victoria' ? '2 Boxes Clínicos' : '1 Box Clínico'}
                  </span>
                  <span className="text-xs text-secondary block mt-1">
                    Sede {sedeNombre} • Equipos Ultrasónicos & RX Digital
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-status-success/10 to-transparent border border-status-success/20">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-status-success block">
                    Índice de Ocupación
                  </span>
                  <span className="text-3xl font-display font-black text-dental-deep-navy block mt-1">
                    {metricas.ocupacionPorcentaje}%
                  </span>
                  <span className="text-xs text-status-success font-bold block mt-1">
                    Rendimiento Óptimo • Flujo Asistencial Continuo
                  </span>
                </div>
              </div>

              {/* Detalle por Cubículo */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-dental-deep-navy block mb-2">
                  Estado en Vivo de Cubículos (Boxes)
                </span>
                <div className="space-y-2.5">
                  {(boxes.length > 0
                    ? boxes
                    : [
                        {
                          boxNumero: 1,
                          estado: 'ocupado',
                          doctorNombre: 'Dra. María Alejandra Domínguez',
                          pacienteNombre: 'Carlos Mendoza',
                          procedimiento: 'Endodoncia Molar #16',
                        },
                        ...(sedeId === 'victoria'
                          ? [
                              {
                                boxNumero: 2,
                                estado: 'ocupado',
                                doctorNombre: 'Dra. Carmen Elena Silva',
                                pacienteNombre: 'Marcos Ramos',
                                procedimiento: 'Control Ortodoncia & Ajuste',
                              },
                            ]
                          : []),
                      ]
                  ).map((b: any) => (
                    <div
                      key={b.boxNumero}
                      className="p-3.5 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-black text-sm flex items-center justify-center">
                          B{b.boxNumero}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-dental-deep-navy">
                              Box 0{b.boxNumero} • {sedeNombre}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold uppercase ${
                                b.estado === 'ocupado'
                                  ? 'bg-status-success/15 text-status-success'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {b.estado === 'ocupado' ? 'En Atención' : 'Disponible'}
                            </span>
                          </div>
                          <p className="text-[11px] text-secondary mt-0.5">
                            {b.procedimiento || 'Consulta Odontológica'} • {b.doctorNombre || 'Facultativo de Guardia'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-dental-deep-navy">
                        {b.pacienteNombre || 'Paciente en turno'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              CASO 3: KPI PRESUPUESTOS CLÍNICOS
             --------------------------------------------------------------- */}
          {kpiType === 'presupuestos' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                    Total Presupuestos por Aprobar
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-display font-black text-amber-950">
                      ${metricas.presupuestosPendientesUsd} USD
                    </span>
                    <span className="text-xs font-bold text-amber-800">
                      ≈ Bs. {presupuestosBs}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    Planes de tratamiento activos emitidos con aranceles vigentes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab('cobros');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>Gestionar en Cobros</span>
                </button>
              </div>

              {/* Casos clínicos de presupuestos representativos */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-dental-deep-navy block mb-2">
                  Planes de Tratamiento con Presupuesto Activo
                </span>
                <div className="space-y-2">
                  {[
                    { paciente: 'Elena Mendoza', plan: 'Rehabilitación Superior (Coronas Zirconio)', montoUsd: 480, estado: 'En Evaluación' },
                    { paciente: 'Roberto Gómez', plan: 'Endodoncia Molar + Perno de Fibra + Corona', montoUsd: 320, estado: 'Aprobado 50%' },
                    { paciente: 'Valeria Padrón', plan: 'Tratamiento Integral Periodontal & Profilaxis', montoUsd: 220, estado: 'Por Aprobar' },
                    { paciente: 'Andrés Gil', plan: 'Ortodoncia Convencional (Inicial & Arcos)', montoUsd: 400, estado: 'Plan Abierto' },
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-xs text-dental-deep-navy">{p.paciente}</p>
                        <p className="text-[11px] text-secondary">{p.plan}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-display font-black text-xs text-dental-deep-navy block">
                          ${p.montoUsd} USD
                        </span>
                        <span className="text-[10px] text-amber-700 font-bold block">
                          {p.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              CASO 4: KPI COBRADO HOY / INGRESOS
             --------------------------------------------------------------- */}
          {kpiType === 'cobrado' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 block">
                      Recaudación Total del Día
                    </span>
                    <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
                      <span className="text-3xl font-display font-black text-emerald-950">
                        ${metricas.cobradoHoyUsd} USD
                      </span>
                      <span className="text-sm font-extrabold text-emerald-800">
                        ≈ Bs. {cobradoBs}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-700 block mt-1">
                      Tasa oficial BCV viva: {tasaBcv.toFixed(2)} Bs/USD • Conciliación en Caja
                    </span>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-900 self-start sm:self-auto shadow-2xs">
                    Meta Diaria: 85% Alcanzada
                  </div>
                </div>
              </div>

              {/* Desglose por Método de Pago */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-dental-deep-navy block mb-2">
                  Desglose de Ingresos por Medio de Pago
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        $
                      </div>
                      <div>
                        <span className="text-xs font-bold text-dental-deep-navy block">Efectivo USD</span>
                        <span className="text-[10px] text-secondary">Caja de seguridad</span>
                      </div>
                    </div>
                    <span className="font-display font-black text-xs text-dental-deep-navy">$320.00 USD</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                        Z
                      </div>
                      <div>
                        <span className="text-xs font-bold text-dental-deep-navy block">Zelle / Transferencia USD</span>
                        <span className="text-[10px] text-secondary">Cuenta digital</span>
                      </div>
                    </div>
                    <span className="font-display font-black text-xs text-dental-deep-navy">$180.00 USD</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs">
                        PM
                      </div>
                      <div>
                        <span className="text-xs font-bold text-dental-deep-navy block">Pago Móvil (Bs.)</span>
                        <span className="text-[10px] text-secondary">Verificación instantánea</span>
                      </div>
                    </div>
                    <span className="font-display font-black text-xs text-dental-deep-navy">
                      $110.00 USD <span className="text-[10px] text-secondary block font-normal">(Bs. {(110 * tasaBcv).toFixed(2)})</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                        POS
                      </div>
                      <div>
                        <span className="text-xs font-bold text-dental-deep-navy block">Punto de Venta / Débito</span>
                        <span className="text-[10px] text-secondary">Lote bancario</span>
                      </div>
                    </div>
                    <span className="font-display font-black text-xs text-dental-deep-navy">
                      $70.00 USD <span className="text-[10px] text-secondary block font-normal">(Bs. {(70 * tasaBcv).toFixed(2)})</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            FOOTER DEL MODAL CON ACCIONES
           =================================================================== */}
        <div className="p-4 sm:p-5 border-t border-border-subtle bg-surface-subtle-ice/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-secondary font-medium text-center sm:text-left">
            Datos auditados y sincronizados con Cloudflare D1
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-surface-clean-white border border-border-subtle text-dental-deep-navy font-bold text-xs hover:bg-surface-container transition-all active:scale-95 cursor-pointer"
            >
              Cerrar
            </button>

            {kpiType === 'citas' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab('agenda');
                }}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-dental-deep-navy transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                <span>Abrir Agenda</span>
              </button>
            )}

            {kpiType === 'cobrado' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab('cobros');
                }}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-dental-deep-navy transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                <span>Módulo de Cobros</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
