import React, { useState, useMemo, useCallback } from 'react';
import {
  SolicitudCita,
  parseHoraToMinutes,
  formatMinutesToHora,
  calcularHoraFin,
} from './AppointmentCoordinationView';
import { SedeId } from '../../types/clinical';
import { useSede } from '../../context/SedeContext';

interface ClinicalScheduleMatrixProps {
  solicitudes: SolicitudCita[];
  todasSolicitudes?: SolicitudCita[];
  sedeSeleccionada: SedeId;
  onCambiarSede: (sede: SedeId) => void;
  turnoSeleccionado: 'manana' | 'tarde' | 'completo';
  onCambiarTurno: (turno: 'manana' | 'tarde' | 'completo') => void;
  filtroDia: 'ayer' | 'hoy' | 'manana' | 'todos';
  onSeleccionarCita: (citaId: string) => void;
  onAsignarHuecoLibre?: (box: number, hora: string) => void;
  onAsignarCitaAHora?: (citaId: string, boxNumero: number, hora: string) => void;
  onCambiarDuracionCita?: (citaId: string, nuevaDuracion: number) => void;
  onLiberarSlotCita?: (citaId: string) => void;
  onEnviarWhatsApp?: (sol: SolicitudCita) => void;
  onToggleConfirmacion?: (sol: SolicitudCita) => void;
  onVerHistoriaClinica?: (sol: SolicitudCita) => void;
  onAplicarCascadaHorarios?: (citasActualizadas: { id: string; horaTexto: string; duracionMinutos: number }[]) => void;
}

const DURACIONES_DISPONIBLES = [15, 30, 45, 60, 90];

const HORAS_MANANA = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
];

const HORAS_TARDE = [
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
];

export const ClinicalScheduleMatrix: React.FC<ClinicalScheduleMatrixProps> = ({
  solicitudes,
  todasSolicitudes,
  sedeSeleccionada,
  onCambiarSede,
  turnoSeleccionado,
  onCambiarTurno,
  onSeleccionarCita,
  onAsignarCitaAHora,
  onCambiarDuracionCita,
  onLiberarSlotCita,
  onEnviarWhatsApp,
  onToggleConfirmacion,
  onVerHistoriaClinica,
}) => {
  const { sedesDisponibles } = useSede();

  // 1. Configuración de Bioseguridad y Almuerzo Flexible
  const [delayBioseguridad, setDelayBioseguridad] = useState<number>(10); // 5 o 10 min
  const [almuerzoInicioMinutos, setAlmuerzoInicioMinutos] = useState<number>(12 * 60 + 30); // 12:30 PM (750m)
  const duracionAlmuerzoMinutos = 30; // 30 min fijos/estimados

  // 2. Filtro de Box para La Victoria (Permite ver Box 01, Box 02 a ancho completo en móviles o ambos)
  const [filtroBoxVictoria, setFiltroBoxVictoria] = useState<'todos' | 1 | 2>(1);

  // Configuración de boxes según sede (La Victoria 2 Boxes, Colonia Tovar 1 Box)
  const allBoxes = useMemo(() => {
    if (sedeSeleccionada === 'tovar') {
      return [
        {
          numero: 1,
          nombre: 'Box 01',
          pill: 'Box 01 (Integral / Urgencias)',
          especialidad: 'Atención Integral & Urgencias',
          doctorDefault: 'Dra. María Alejandra Domínguez',
        },
      ];
    }
    return [
      {
        numero: 1,
        nombre: 'Box 01',
        pill: 'Box 01 (Principal / Rx)',
        especialidad: 'Operatoria, Diagnóstico & Radiología RVG',
        doctorDefault: 'Dra. María Alejandra Domínguez',
      },
      {
        numero: 2,
        nombre: 'Box 02',
        pill: 'Box 02 (Ortodoncia & Integrada)',
        especialidad: 'Ortodoncia, Prótesis & Estética',
        doctorDefault: 'Od. Miriel Morillo / Od. Julianny Ramos',
      },
    ];
  }, [sedeSeleccionada]);

  // Boxes visibles según el filtro seleccionado
  const boxesVisibles = useMemo(() => {
    if (sedeSeleccionada === 'tovar') {
      return allBoxes;
    }
    if (filtroBoxVictoria === 1) {
      return allBoxes.filter((b) => b.numero === 1);
    }
    if (filtroBoxVictoria === 2) {
      return allBoxes.filter((b) => b.numero === 2);
    }
    return allBoxes; // 'todos'
  }, [allBoxes, sedeSeleccionada, filtroBoxVictoria]);

  // Lista de horas activas según turno
  const horasActivas = useMemo(() => {
    if (turnoSeleccionado === 'manana') return HORAS_MANANA;
    if (turnoSeleccionado === 'tarde') return HORAS_TARDE;
    return [...HORAS_MANANA, ...HORAS_TARDE];
  }, [turnoSeleccionado]);

  // Citas disponibles pendientes de asignación de horario para el desplegable simple
  const citasDisponiblesParaAsignar = useMemo(() => {
    const listado = todasSolicitudes || solicitudes;
    return listado.filter(
      (s) => s.horaTexto === 'Por asignar' || s.estado === 'por_confirmar' || s.estado === 'espera'
    );
  }, [todasSolicitudes, solicitudes]);

  // Manejar cambio de duración con cascada
  const handleCambiarDuracion = useCallback(
    (citaId: string, duracion: number) => {
      if (onCambiarDuracionCita) {
        onCambiarDuracionCita(citaId, duracion);
      }
    },
    [onCambiarDuracionCita]
  );

  return (
    <section className="bg-surface-clean-white rounded-3xl p-3 sm:p-5 shadow-soft-elevated border border-border-subtle relative overflow-hidden flex flex-col gap-3">
      {/* =========================================================================
          1. CABECERA: TÍTULO, SELECTOR DE SEDES Y CONTROLES DE BIOSEGURIDAD
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-dental-deep-navy text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[18px] text-vibrant-cyan">view_column</span>
          </div>
          <div>
            <h2 className="font-display font-black text-sm sm:text-base text-dental-deep-navy leading-tight">
              Distribución de Sillones Clínicos
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-secondary">
                {sedeSeleccionada === 'victoria' ? 'La Victoria (2 Boxes)' : 'Colonia Tovar (1 Box)'}
              </span>
              <span className="w-1 h-1 rounded-full bg-secondary/40" />
              <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                Limpieza: {delayBioseguridad}m
              </span>
            </div>
          </div>
        </div>

        {/* Conmutador de Sede con Capacidad Exacta */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-subtle-ice border border-border-subtle self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => onCambiarSede('victoria')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              sedeSeleccionada === 'victoria'
                ? 'bg-dental-deep-navy text-white shadow-xs'
                : 'text-dental-deep-navy hover:bg-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
            <span>La Victoria</span>
          </button>

          <button
            type="button"
            onClick={() => onCambiarSede('tovar')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              sedeSeleccionada === 'tovar'
                ? 'bg-dental-deep-navy text-white shadow-xs'
                : 'text-dental-deep-navy hover:bg-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] text-amber-500">terrain</span>
            <span>Colonia Tovar</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. FILTRO DE BOXES PARA LA VICTORIA (RESPONSIVIDAD MÓVIL ÓPTIMA)
         ========================================================================= */}
      {sedeSeleccionada === 'victoria' && (
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-surface-subtle-ice border border-border-subtle">
          <div className="flex items-center gap-1 text-[11px] font-black text-dental-deep-navy pl-1">
            <span className="material-symbols-outlined text-[16px] text-primary">chair</span>
            <span className="hidden xs:inline">Vista de Sillón:</span>
          </div>

          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-border-subtle">
            <button
              type="button"
              onClick={() => setFiltroBoxVictoria(1)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                filtroBoxVictoria === 1
                  ? 'bg-dental-deep-navy text-white shadow-xs'
                  : 'text-dental-deep-navy hover:bg-surface-subtle-ice'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-vibrant-cyan" />
              <span>Box 01 (Principal)</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroBoxVictoria(2)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                filtroBoxVictoria === 2
                  ? 'bg-dental-deep-navy text-white shadow-xs'
                  : 'text-dental-deep-navy hover:bg-surface-subtle-ice'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Box 02 (Ortodoncia)</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroBoxVictoria('todos')}
              className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                filtroBoxVictoria === 'todos'
                  ? 'bg-dental-deep-navy text-white shadow-xs'
                  : 'text-secondary hover:bg-surface-subtle-ice'
              }`}
              title="Comparativa de ambos sillones lado a lado"
            >
              <span className="material-symbols-outlined text-[14px]">view_column</span>
              <span className="hidden sm:inline">Ambos</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. BARRA DE TURNOS (MAÑANA / TARDE / DÍA COMPLETO) + AJUSTES
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 p-2 rounded-2xl bg-surface-subtle-ice border border-border-subtle">
        {/* Selector de Turnos */}
        <div className="flex items-center gap-1 p-0.5 bg-white rounded-xl border border-border-subtle self-start">
          <button
            type="button"
            onClick={() => onCambiarTurno('manana')}
            className={`px-2 py-1 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              turnoSeleccionado === 'manana'
                ? 'bg-dental-deep-navy text-white shadow-2xs'
                : 'text-dental-deep-navy hover:bg-surface-subtle-ice'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">wb_sunny</span>
            <span>Mañana (08:00 AM - 01:00 PM)</span>
          </button>

          <button
            type="button"
            onClick={() => onCambiarTurno('tarde')}
            className={`px-2 py-1 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              turnoSeleccionado === 'tarde'
                ? 'bg-dental-deep-navy text-white shadow-2xs'
                : 'text-dental-deep-navy hover:bg-surface-subtle-ice'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">wb_twilight</span>
            <span>Tarde (01:00 PM - 05:00 PM)</span>
          </button>

          <button
            type="button"
            onClick={() => onCambiarTurno('completo')}
            className={`px-2 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
              turnoSeleccionado === 'completo'
                ? 'bg-dental-deep-navy text-white shadow-2xs'
                : 'text-dental-deep-navy hover:bg-surface-subtle-ice'
            }`}
          >
            Día
          </button>
        </div>

        {/* Controles de Bioseguridad y Almuerzo Flexible */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Selector de Bioseguridad */}
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-xl border border-border-subtle">
            <span className="material-symbols-outlined text-teal-600 text-[13px]">sanitizer</span>
            <span className="text-[10px] font-bold text-secondary">Bio:</span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setDelayBioseguridad(5)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  delayBioseguridad === 5
                    ? 'bg-teal-600 text-white'
                    : 'text-secondary hover:bg-surface-subtle-ice'
                }`}
              >
                5m
              </button>
              <button
                type="button"
                onClick={() => setDelayBioseguridad(10)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                  delayBioseguridad === 10
                    ? 'bg-teal-600 text-white'
                    : 'text-secondary hover:bg-surface-subtle-ice'
                }`}
              >
                10m
              </button>
            </div>
          </div>

          {/* Selector de Almuerzo Flexible */}
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-xl border border-border-subtle">
            <span className="material-symbols-outlined text-amber-600 text-[13px]">restaurant</span>
            <span className="text-[10px] font-bold text-secondary">Almuerzo:</span>
            <select
              value={almuerzoInicioMinutos}
              onChange={(e) => setAlmuerzoInicioMinutos(Number(e.target.value))}
              className="text-[10px] font-black text-dental-deep-navy bg-transparent outline-none cursor-pointer"
            >
              <option value={12 * 60}>12:00 PM</option>
              <option value={12 * 60 + 30}>12:30 PM (Habitual)</option>
              <option value={13 * 60}>01:00 PM</option>
              <option value={13 * 60 + 30}>01:30 PM</option>
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. LEYENDA VISUAL SEGÚN EL DISEÑO DEL SISTEMA
         ========================================================================= */}
      <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap px-1 text-[10px] sm:text-[11px] font-black text-secondary">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Urgencia</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span>Control / Ortod.</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Confirmada</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border border-dashed border-emerald-400 bg-emerald-50/50" />
          <span>Disponible</span>
        </span>
      </div>

      {/* =========================================================================
          5. TABLA HORARIA MATRICIAL CON INDICADOR DE HORARIO VERTICAL 90°
             (ULTRA-COMPACTA PARA MÁXIMA LEGIBILIDAD EN TELÉFONOS MÓVILES)
         ========================================================================= */}
      <div className="w-full overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
        <table className="w-full border-collapse text-left">
          {/* Cabecera de la Tabla: HORA VERTICAL + Headers de Boxes */}
          <thead>
            <tr className="border-b border-border-subtle bg-surface-subtle-ice">
              {/* Columna 1: Indicador de HORA en vertical rotado a 90° (Ocupa mínimo ancho ~28px) */}
              <th className="p-1 sm:p-2 text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-secondary border-r border-border-subtle w-7 sm:w-10 text-center shrink-0">
                <span className="[writing-mode:vertical-rl] rotate-180 inline-block py-1">
                  HORA
                </span>
              </th>

              {/* Columnas de los Boxes Visibles */}
              {boxesVisibles.map((box) => (
                <th
                  key={box.numero}
                  className="p-2 sm:p-3 border-r last:border-r-0 border-border-subtle"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-dental-deep-navy text-white text-[9px] sm:text-[10px] font-black w-fit">
                        {box.pill}
                      </span>
                      {sedeSeleccionada === 'victoria' && boxesVisibles.length === 1 && (
                        <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                          Vista Completa
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs font-black text-dental-deep-navy truncate leading-snug mt-0.5">
                      {box.especialidad}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-semibold text-secondary truncate">
                      {box.doctorDefault}
                    </p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Cuerpo de la Tabla */}
          <tbody className="divide-y divide-border-subtle/70">
            {horasActivas.map((hora) => {
              const minutosHora = parseHoraToMinutes(hora);
              const isAlmuerzo =
                minutosHora >= almuerzoInicioMinutos &&
                minutosHora < almuerzoInicioMinutos + duracionAlmuerzoMinutos;

              // Franja de almuerzo
              if (isAlmuerzo && minutosHora === almuerzoInicioMinutos) {
                return (
                  <tr key={`row-almuerzo-${hora}`} className="bg-amber-50/80 border-y border-amber-300">
                    <td className="p-1 text-center border-r border-amber-200 w-7 sm:w-10 shrink-0">
                      <span className="[writing-mode:vertical-rl] rotate-180 font-mono font-black text-[9px] sm:text-[10px] text-amber-900 py-1">
                        {hora}
                      </span>
                    </td>
                    <td
                      colSpan={boxesVisibles.length}
                      className="p-2 sm:p-2.5 text-center text-amber-950 font-black text-[10px] sm:text-xs"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-amber-700">restaurant</span>
                        <span>
                          Almuerzo & Bioseguridad ({duracionAlmuerzoMinutos}m) •{' '}
                          {formatMinutesToHora(almuerzoInicioMinutos)} a{' '}
                          {formatMinutesToHora(almuerzoInicioMinutos + duracionAlmuerzoMinutos)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              }

              if (isAlmuerzo) {
                return null;
              }

              return (
                <tr key={`row-${hora}`} className="hover:bg-slate-50/50 transition-colors">
                  {/* Celda de Horario Vertical a 90°: Ocupa apenas 28px de ancho */}
                  <td className="p-1 text-center border-r border-border-subtle bg-surface-subtle-ice/60 align-middle w-7 sm:w-10 shrink-0">
                    <div className="flex flex-col items-center justify-center h-full py-1">
                      <span className="[writing-mode:vertical-rl] rotate-180 font-mono font-black text-[10px] sm:text-xs text-dental-deep-navy tracking-tight whitespace-nowrap select-none">
                        {hora}
                      </span>
                    </div>
                  </td>

                  {/* Celdas de los Boxes Visibles */}
                  {boxesVisibles.map((box) => {
                    const citaEnEsteSlot = solicitudes.find((s) => {
                      const bNum = s.boxSugerido || 1;
                      return bNum === box.numero && s.horaTexto === hora;
                    });

                    const citaEnCurso = !citaEnEsteSlot
                      ? solicitudes.find((s) => {
                          const bNum = s.boxSugerido || 1;
                          if (bNum !== box.numero || s.horaTexto === 'Por asignar') return false;
                          const start = parseHoraToMinutes(s.horaTexto);
                          const duracion = s.duracionMinutos || 30;
                          const endWithDelay = start + duracion + delayBioseguridad;
                          return start < minutosHora && minutosHora < endWithDelay;
                        })
                      : null;

                    return (
                      <td
                        key={`cell-${box.numero}-${hora}`}
                        className="p-1.5 sm:p-2 border-r last:border-r-0 border-border-subtle align-top"
                      >
                        {/* CASO A: Cita Asignada en este Horario */}
                        {citaEnEsteSlot ? (
                          (() => {
                            const sol = citaEnEsteSlot;
                            const isUrgencia = sol.tipo === 'urgencia';
                            const isControl = sol.tipo === 'control';
                            const isConfirmada =
                              sol.estado === 'confirmada' || sol.confirmacionPaciente === 'confirmado';
                            const isPendiente = sol.confirmacionPaciente === 'pendiente';

                            return (
                              <div
                                className={`rounded-xl p-2 sm:p-2.5 border transition-all text-left flex flex-col gap-1.5 shadow-2xs ${
                                  isUrgencia
                                    ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                                    : isControl
                                    ? 'bg-sky-50/90 border-sky-300 text-sky-950'
                                    : isConfirmada
                                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                                }`}
                              >
                                {/* Fila 1: Badges & Duración & Desasignar */}
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                      isUrgencia
                                        ? 'bg-rose-200 text-rose-900'
                                        : isControl
                                        ? 'bg-sky-200 text-sky-900'
                                        : isConfirmada
                                        ? 'bg-emerald-200 text-emerald-900'
                                        : 'bg-amber-200 text-amber-900'
                                    }`}
                                  >
                                    {isUrgencia ? '🚨 URGENCIA' : isControl ? 'CONTROL' : isConfirmada ? 'CONFIRMADA' : 'CITA'}
                                  </span>

                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] sm:text-[10px] font-black font-mono opacity-85">
                                      {sol.duracionMinutos || 30}m
                                    </span>
                                    {onLiberarSlotCita && (
                                      <button
                                        type="button"
                                        onClick={() => onLiberarSlotCita(sol.id)}
                                        className="w-4 h-4 rounded-full hover:bg-black/10 text-secondary hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                        title="Liberar slot para reasignar"
                                      >
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Fila 2: Nombre del Paciente & Motivo */}
                                <div
                                  onClick={() => onSeleccionarCita(sol.id)}
                                  className="cursor-pointer"
                                  title="Toca para ver detalle del paciente"
                                >
                                  <p className="font-display font-black text-xs sm:text-sm leading-tight truncate hover:underline">
                                    {sol.pacienteNombre}
                                  </p>
                                  <p className="text-[9px] sm:text-[10px] opacity-85 truncate mt-0.5 font-medium">
                                    {sol.motivo}
                                  </p>
                                </div>

                                {/* Fila 3: Botones Rápidos de Duración con Cascada */}
                                <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-black/5">
                                  <span className="text-[8px] font-black uppercase opacity-70 shrink-0">
                                    Duración:
                                  </span>
                                  <div className="flex items-center gap-0.5 flex-wrap justify-end">
                                    {DURACIONES_DISPONIBLES.map((dur) => {
                                      const isCur = (sol.duracionMinutos || 30) === dur;
                                      return (
                                        <button
                                          key={dur}
                                          type="button"
                                          onClick={() => handleCambiarDuracion(sol.id, dur)}
                                          className={`px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-black transition-all cursor-pointer ${
                                            isCur
                                              ? 'bg-dental-deep-navy text-white shadow-2xs scale-105'
                                              : 'bg-white/70 hover:bg-white text-dental-deep-navy border border-black/10'
                                          }`}
                                          title={`Ajustar a ${dur} min (recalcula citas siguientes)`}
                                        >
                                          {dur}m
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Fila 4: 03 BOTONES RÁPIDOS 100% RESPONSIVOS SIN TRUNCAMIENTO */}
                                <div className="flex items-center gap-1 pt-0.5">
                                  {/* Botón 1: WhatsApp Directo */}
                                  <button
                                    type="button"
                                    onClick={() => onEnviarWhatsApp && onEnviarWhatsApp(sol)}
                                    className="flex-1 min-w-0 px-1 py-1 sm:px-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] sm:text-[9px] transition-all flex items-center justify-center gap-0.5 shadow-2xs active:scale-95 cursor-pointer"
                                    title="Enviar horario exacto y enlace de confirmación por WhatsApp directo sin agregar a contactos"
                                  >
                                    <span className="material-symbols-outlined text-[11px] shrink-0">chat</span>
                                    <span className="truncate">WhatsApp</span>
                                  </button>

                                  {/* Botón 2: Historia Clínica en la Misma Interfaz */}
                                  <button
                                    type="button"
                                    onClick={() => onVerHistoriaClinica && onVerHistoriaClinica(sol)}
                                    className="flex-1 min-w-0 px-1 py-1 sm:px-1.5 rounded-lg bg-dental-deep-navy hover:bg-primary text-white font-black text-[8px] sm:text-[9px] transition-all flex items-center justify-center gap-0.5 shadow-2xs active:scale-95 cursor-pointer"
                                    title="Ver Historia Clínica Digital del paciente en esta misma interfaz"
                                  >
                                    <span className="material-symbols-outlined text-[11px] text-vibrant-cyan shrink-0">clinical_notes</span>
                                    <span className="truncate">Historia</span>
                                  </button>

                                  {/* Botón 3: Confirmar con Colores de Estado */}
                                  <button
                                    type="button"
                                    onClick={() => onToggleConfirmacion && onToggleConfirmacion(sol)}
                                    className={`flex-1 min-w-0 px-1 py-1 sm:px-1.5 rounded-lg font-black text-[8px] sm:text-[9px] transition-all flex items-center justify-center gap-0.5 shadow-2xs active:scale-95 cursor-pointer border ${
                                      isConfirmada
                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                        : isPendiente
                                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                        : 'bg-sky-100 text-sky-900 border-sky-300 hover:bg-sky-200'
                                    }`}
                                    title={`Estado: ${isConfirmada ? 'Confirmado' : isPendiente ? 'Pendiente' : 'Por Confirmar'}. Toca para alternar.`}
                                  >
                                    <span className="material-symbols-outlined text-[11px] shrink-0">
                                      {isConfirmada ? 'check_circle' : isPendiente ? 'hourglass_empty' : 'send'}
                                    </span>
                                    <span className="truncate">
                                      {isConfirmada ? 'Conf.' : isPendiente ? 'Pend.' : 'Por C.'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            );
                          })()
                        ) : citaEnCurso ? (
                          /* CASO B: Cita en Curso */
                          <div className="p-1.5 rounded-xl bg-surface-subtle-ice border border-border-subtle/80 flex flex-col gap-0.5 text-[9px] text-secondary">
                            <div className="flex items-center gap-1 font-bold text-dental-deep-navy truncate">
                              <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                              <span className="truncate">En atención: {citaEnCurso.pacienteNombre}</span>
                            </div>
                            <span className="text-[8px] font-mono text-secondary">
                              Hasta {calcularHoraFin(citaEnCurso.horaTexto, citaEnCurso.duracionMinutos)} (+{delayBioseguridad}m bio)
                            </span>
                          </div>
                        ) : (
                          /* CASO C: Disponible con Selector Simple */
                          <div className="p-1.5 sm:p-2 rounded-xl border border-dashed border-emerald-300/80 bg-emerald-50/20 hover:bg-emerald-50/50 transition-colors flex flex-col gap-1 text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] sm:text-xs font-black text-emerald-800 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-emerald-600">add_circle</span>
                                <span>Disponible</span>
                              </span>
                              <span className="text-[9px] font-mono text-emerald-700 font-bold">{hora}</span>
                            </div>

                            <select
                              defaultValue=""
                              onChange={(e) => {
                                const citaId = e.target.value;
                                if (citaId && onAsignarCitaAHora) {
                                  onAsignarCitaAHora(citaId, box.numero, hora);
                                }
                              }}
                              className="w-full text-[9px] sm:text-[10px] font-bold py-1 px-1.5 rounded-lg bg-white border border-emerald-300 text-dental-deep-navy outline-none cursor-pointer hover:border-emerald-500 transition-colors shadow-2xs"
                            >
                              <option value="" disabled>
                                ➕ Asignar Cita a las {hora}...
                              </option>
                              {citasDisponiblesParaAsignar.length > 0 ? (
                                citasDisponiblesParaAsignar.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.pacienteNombre} ({c.duracionMinutos || 30}m)
                                  </option>
                                ))
                              ) : (
                                <option value="" disabled>
                                  (Sin citas pendientes de horario)
                                </option>
                              )}
                            </select>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
