import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSede } from '../../context/SedeContext';
import { useOdontologos } from '../../hooks/useOdontologos';
import { ApiClient } from '../../services/api';
import { Cita, PacienteItem, SedeId, TratamientoItem } from '../../types/clinical';
import { TabId } from '../layout/BottomNavigation';
import { getInitials, EVENT_SESION_ACTUALIZADA, getActiveSessionUser, isGlobalAgendaManager, canEditDoctorCita } from '../../utils/userSession';

interface AgendaViewProps {
  onNavigateTab?: (tab: TabId) => void;
}

const STORAGE_KEY_CITAS = 'odontosalud_data_citas';
const STORAGE_KEY_PACIENTES = 'odontosalud_data_pacientes';
const STORAGE_KEY_TRATAMIENTOS = 'odontosalud_data_tratamientos';

const FALLBACK_TRATAMIENTOS: TratamientoItem[] = [
  { id: 'trat-1', codigo: 'OD-101', nombre: 'Evaluación Integral & Diagnóstico Digital RVG', categoria: 'Diagnóstico & RX', descripcion: '', duracionMinutos: 45, costoUsd: 25, costoInsumosUsd: 4, requiereRx: true, activo: true },
  { id: 'trat-2', codigo: 'PR-102', nombre: 'Profilaxis Ultrasónica & Pulido Coronario', categoria: 'Prevención & Profilaxis', descripcion: '', duracionMinutos: 40, costoUsd: 35, costoInsumosUsd: 6, requiereRx: false, activo: true },
  { id: 'trat-3', codigo: 'OP-201', nombre: 'Restauración Estética en Resina Nanohíbrida (Simple)', categoria: 'Operatoria & Estética', descripcion: '', duracionMinutos: 45, costoUsd: 40, costoInsumosUsd: 9, requiereRx: false, activo: true },
  { id: 'trat-4', codigo: 'OP-202', nombre: 'Restauración Compuesta Compleja (2 o más caras)', categoria: 'Operatoria & Estética', descripcion: '', duracionMinutos: 60, costoUsd: 55, costoInsumosUsd: 13, requiereRx: true, activo: true },
  { id: 'trat-5', codigo: 'EN-301', nombre: 'Endodoncia Unirradicular / Multirradicular', categoria: 'Endodoncia', descripcion: '', duracionMinutos: 60, costoUsd: 90, costoInsumosUsd: 18, requiereRx: true, activo: true },
  { id: 'trat-6', codigo: 'OR-401', nombre: 'Ortodoncia: Control Mensual', categoria: 'Ortodoncia', descripcion: '', duracionMinutos: 30, costoUsd: 30, costoInsumosUsd: 5, requiereRx: false, activo: true },
];

const HORARIOS_BLOQUE = [
  '08:30 AM',
  '09:15 AM',
  '10:00 AM',
  '10:45 AM',
  '11:30 AM',
  '01:30 PM',
  '02:15 PM',
  '03:00 PM',
  '03:45 PM',
  '04:30 PM',
];

const ESTADO_META: Record<
  Cita['estado'],
  { label: string; badgeClass: string; barClass: string; icon: string }
> = {
  en_sillon: {
    label: 'En Sillón',
    badgeClass: 'bg-electric-blue/15 text-electric-blue border-electric-blue/30',
    barClass: 'bg-electric-blue',
    icon: 'dentistry',
  },
  confirmada: {
    label: 'Confirmada',
    badgeClass: 'bg-primary/10 text-primary border-primary/25',
    barClass: 'bg-primary',
    icon: 'verified',
  },
  pendiente: {
    label: 'Por Confirmar',
    badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-300',
    barClass: 'bg-amber-500',
    icon: 'schedule',
  },
  completada: {
    label: 'Completada',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-300',
    barClass: 'bg-status-success',
    icon: 'check_circle',
  },
  cancelada: {
    label: 'Cancelada',
    badgeClass: 'bg-slate-200/70 text-slate-600 border-slate-300',
    barClass: 'bg-slate-400',
    icon: 'cancel',
  },
};

function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCurrentClinicalWeek(baseDate: Date) {
  const dayOfWeek = baseDate.getDay(); // 0=Dom .. 6=Sáb
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diffToMonday);

  const labels = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const todayIso = toLocalIso(baseDate);

  return labels.map((dia, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const iso = toLocalIso(d);
    return {
      dia,
      num: String(d.getDate()).padStart(2, '0'),
      iso,
      isToday: iso === todayIso,
    };
  });
}

function parseTimeToMinutes(timeStr: string): number {
  const match = String(timeStr || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = (match[3] || '').toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

function normalizeFechaCita(rawFecha: string | undefined, todayIso: string): string {
  const val = String(rawFecha || '').trim();
  if (!val || val.toLowerCase() === 'hoy') return todayIso;
  if (val.toLowerCase() === 'mañana' || val.toLowerCase() === 'manana') {
    const d = new Date(`${todayIso}T12:00:00`);
    d.setDate(d.getDate() + 1);
    return toLocalIso(d);
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  return todayIso;
}

function normalizeCitaRecord(raw: any, fallbackSede: SedeId, todayIso: string): Cita {
  const rawEstado = String(raw.estado || 'pendiente').toLowerCase();
  const estado: Cita['estado'] =
    rawEstado === 'aprobada' || rawEstado === 'confirmada'
      ? 'confirmada'
      : rawEstado === 'en_sillon'
      ? 'en_sillon'
      : rawEstado === 'completada'
      ? 'completada'
      : rawEstado === 'cancelada'
      ? 'cancelada'
      : 'pendiente';

  return {
    id: String(raw.id || `cita-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    sedeId: (raw.sedeId || raw.sede_id || fallbackSede) as SedeId,
    pacienteId: String(raw.pacienteId || raw.paciente_id || `pac-${raw.id || Date.now()}`),
    pacienteNombre: String(raw.pacienteNombre || raw.paciente_nombre || 'Paciente'),
    pacienteCedula: String(raw.pacienteCedula || raw.paciente_cedula || 'V-00.000.000'),
    pacienteTelefono: String(raw.pacienteTelefono || raw.paciente_telefono || '+58 412-0000000'),
    pacienteAvatar: raw.pacienteAvatar || raw.avatar_url || raw.avatarUrl || undefined,
    pacienteEmail: raw.pacienteEmail || raw.paciente_email || undefined,
    doctorNombre: String(raw.doctorNombre || raw.doctor_nombre || 'Dra. María Alejandra Domínguez'),
    boxNumero: Number(raw.boxNumero || raw.box_numero || 1),
    fechaCita: normalizeFechaCita(raw.fechaCita || raw.fecha_cita, todayIso),
    horaInicio: String(raw.horaInicio || raw.hora_inicio || '09:00 AM'),
    motivo: String(raw.motivo || raw.motivoConsulta || 'Consulta Odontológica General'),
    estado,
    esUrgencia: Boolean(raw.esUrgencia ?? raw.es_urgencia),
  };
}

export const AgendaView: React.FC<AgendaViewProps> = ({ onNavigateTab }) => {
  const { sedeActiva, sedeId, sedesDisponibles, cambiarSede } = useSede();
  const { odontologos } = useOdontologos();

  const todayIso = useMemo(() => toLocalIso(new Date()), []);
  const weekDays = useMemo(() => getCurrentClinicalWeek(new Date()), []);

  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIso, setSelectedDayIso] = useState<string>(todayIso);
  const [calendarMode, setCalendarMode] = useState<'semana' | 'mes'>('semana');
  const [calendarMonthDate, setCalendarMonthDate] = useState<Date>(() => new Date());
  const [showAllDates, setShowAllDates] = useState(false);
  const [selectedBox, setSelectedBox] = useState<number | 'all'>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedEstado, setSelectedEstado] = useState<Cita['estado'] | 'all'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<ReturnType<typeof getActiveSessionUser>>(() =>
    getActiveSessionUser()
  );

  useEffect(() => {
    const syncSession = () => setActiveUser(getActiveSessionUser());
    window.addEventListener(EVENT_SESION_ACTUALIZADA, syncSession);
    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener(EVENT_SESION_ACTUALIZADA, syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  const isSuperAdminView = isGlobalAgendaManager(activeUser);

  // Estado del formulario rápido "+ Nueva Cita"
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [pacientesCatalogo, setPacientesCatalogo] = useState<PacienteItem[]>([]);
  const [tratamientosCatalogo, setTratamientosCatalogo] = useState<TratamientoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRATAMIENTOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return FALLBACK_TRATAMIENTOS;
  });
  const [quickPacNombre, setQuickPacNombre] = useState('');
  const [quickPacCedula, setQuickPacCedula] = useState('V-');
  const [quickPacTelefono, setQuickPacTelefono] = useState('+58 414-');
  const [quickDoctor, setQuickDoctor] = useState('');
  const [quickBox, setQuickBox] = useState<number>(1);
  const [quickHora, setQuickHora] = useState('09:15 AM');
  const [quickMotivo, setQuickMotivo] = useState(
    () => FALLBACK_TRATAMIENTOS[0].nombre
  );
  const [isCustomMotivo, setIsCustomMotivo] = useState(false);
  const [quickUrgencia, setQuickUrgencia] = useState(false);

  const tratamientosActivos = useMemo(
    () => tratamientosCatalogo.filter((t) => t.activo !== false),
    [tratamientosCatalogo]
  );

  const monthTitle = useMemo(() => {
    const label = calendarMonthDate.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [calendarMonthDate]);

  const monthlyCalendar = useMemo(() => {
    const year = calendarMonthDate.getFullYear();
    const month = calendarMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lunes=0 .. Domingo=6
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    const countsByIso: Record<string, number> = {};
    citas.forEach((c) => {
      if (c.estado !== 'cancelada' && c.fechaCita.startsWith(monthPrefix)) {
        countsByIso[c.fechaCita] = (countsByIso[c.fechaCita] || 0) + 1;
      }
    });

    const cells: ({ num: number; iso: string; count: number; isToday: boolean } | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const iso = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      cells.push({ num: d, iso, count: countsByIso[iso] || 0, isToday: iso === todayIso });
    }

    const totalCitasMes = Object.values(countsByIso).reduce((acc, n) => acc + n, 0);
    const diasConAgenda = Object.keys(countsByIso).length;

    return { cells, totalCitasMes, diasConAgenda };
  }, [calendarMonthDate, citas, todayIso]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Staff disponible en la sede activa
  const staffSede = useMemo(() => {
    return odontologos.filter((o) => {
      if (o.sedeId === 'ambas') return true;
      return o.sedeId === sedeId;
    });
  }, [odontologos, sedeId]);

  useEffect(() => {
    if (staffSede.length > 0 && !staffSede.some((s) => s.nombres === quickDoctor)) {
      setQuickDoctor(staffSede[0].nombres);
      setQuickBox(Math.min(staffSede[0].boxAsignado || 1, sedeActiva.totalBoxes));
    }
  }, [staffSede, quickDoctor, sedeActiva.totalBoxes]);

  const cargarAgendaReal = useCallback(async () => {
    setLoading(true);
    try {
      const [remotas] = await Promise.all([ApiClient.getCitas(sedeId, 'all')]);
      const combined: Cita[] = [];
      const seenKeys = new Set<string>();

      const pushNormalized = (raw: any) => {
        const norm = normalizeCitaRecord(raw, sedeId, todayIso);
        if (norm.sedeId !== sedeId) return;
        const cleanCed = norm.pacienteCedula.replace(/[^0-9]/g, '');
        const dedupKey = cleanCed
          ? `${cleanCed}-${norm.fechaCita}-${norm.horaInicio}`
          : norm.id;
        if (!seenKeys.has(norm.id) && !seenKeys.has(dedupKey)) {
          seenKeys.add(norm.id);
          seenKeys.add(dedupKey);
          combined.push(norm);
        }
      };

      // Priorizar cambios locales más recientes sobre mock/D1
      try {
        const localRaw = localStorage.getItem(STORAGE_KEY_CITAS);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach(pushNormalized);
          }
        }
      } catch {}

      if (Array.isArray(remotas)) {
        remotas.forEach(pushNormalized);
      }

      combined.sort((a, b) => {
        if (a.fechaCita !== b.fechaCita) return a.fechaCita.localeCompare(b.fechaCita);
        return parseTimeToMinutes(a.horaInicio) - parseTimeToMinutes(b.horaInicio);
      });

      setCitas(combined);
    } finally {
      setLoading(false);
    }
  }, [sedeId, todayIso]);

  useEffect(() => {
    cargarAgendaReal();
    try {
      const savedPac = localStorage.getItem(STORAGE_KEY_PACIENTES);
      if (savedPac) {
        const parsed = JSON.parse(savedPac);
        if (Array.isArray(parsed)) setPacientesCatalogo(parsed);
      }
      const savedTrat = localStorage.getItem(STORAGE_KEY_TRATAMIENTOS);
      if (savedTrat) {
        const parsedT = JSON.parse(savedTrat);
        if (Array.isArray(parsedT) && parsedT.length > 0) {
          setTratamientosCatalogo(parsedT);
        }
      }
    } catch {}

    ApiClient.getControlData().then((remote) => {
      if (remote?.tratamientos && remote.tratamientos.length > 0) {
        setTratamientosCatalogo(remote.tratamientos);
      }
      if (remote?.pacientes && remote.pacientes.length > 0) {
        setPacientesCatalogo(remote.pacientes);
      }
    });

    const handleSync = () => {
      cargarAgendaReal();
      try {
        const savedTrat = localStorage.getItem(STORAGE_KEY_TRATAMIENTOS);
        if (savedTrat) {
          const parsedT = JSON.parse(savedTrat);
          if (Array.isArray(parsedT) && parsedT.length > 0) setTratamientosCatalogo(parsedT);
        }
      } catch {}
    };
    window.addEventListener('odontosalud_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('odontosalud_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [cargarAgendaReal]);

  // Citas del día seleccionado (o todas si showAllDates)
  const citasPorFecha = useMemo(() => {
    if (showAllDates) return citas;
    return citas.filter((c) => c.fechaCita === selectedDayIso);
  }, [citas, showAllDates, selectedDayIso]);

  // Detector de colisiones por (fecha + hora + box) o (fecha + hora + doctor)
  const collisionIds = useMemo(() => {
    const conflicts = new Set<string>();
    const activas = citasPorFecha.filter((c) => c.estado !== 'cancelada' && c.estado !== 'completada');
    for (let i = 0; i < activas.length; i++) {
      for (let j = i + 1; j < activas.length; j++) {
        const a = activas[i];
        const b = activas[j];
        const mismaHora = a.fechaCita === b.fechaCita && a.horaInicio === b.horaInicio;
        if (!mismaHora) continue;
        if (a.boxNumero === b.boxNumero || a.doctorNombre === b.doctorNombre) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
    return conflicts;
  }, [citasPorFecha]);

  // Lista filtrada final
  const filteredCitas = useMemo(() => {
    return citasPorFecha
      .filter((c) => c.boxNumero <= sedeActiva.totalBoxes)
      .filter((c) => (selectedBox === 'all' ? true : c.boxNumero === selectedBox))
      .filter((c) =>
        selectedDoctor === 'all'
          ? true
          : c.doctorNombre.toLowerCase().includes(selectedDoctor.toLowerCase())
      )
      .filter((c) => (selectedEstado === 'all' ? true : c.estado === selectedEstado));
  }, [citasPorFecha, sedeActiva.totalBoxes, selectedBox, selectedDoctor, selectedEstado]);

  // Ocupación en vivo de los sillones de la sede
  const sillonesEstado = useMemo(() => {
    const boxes = Array.from({ length: sedeActiva.totalBoxes }, (_, i) => i + 1);
    return boxes.map((boxNum) => {
      const enAtencion = citasPorFecha.find(
        (c) => c.boxNumero === boxNum && c.estado === 'en_sillon'
      );
      const siguiente = citasPorFecha.find(
        (c) => c.boxNumero === boxNum && (c.estado === 'confirmada' || c.estado === 'pendiente')
      );
      return { boxNum, enAtencion, siguiente };
    });
  }, [sedeActiva.totalBoxes, citasPorFecha]);

  const sillonesOcupadosCount = sillonesEstado.filter((b) => Boolean(b.enAtencion)).length;

  // Cambiar estado de una cita (persistiendo en D1 + localStorage)
  const handleCambiarEstado = async (cita: Cita, nuevoEstado: Cita['estado']) => {
    if (!canEditDoctorCita(activeUser, cita.doctorNombre)) {
      showToast('Acceso segmentado: solo puedes editar las citas asignadas a ti.');
      return;
    }

    setCitas((prev) =>
      prev.map((c) => (c.id === cita.id ? { ...c, estado: nuevoEstado } : c))
    );

    await ApiClient.actualizarEstadoCita(
      cita.id,
      nuevoEstado,
      sedeId,
      cita.boxNumero,
      cita.horaInicio,
      cita.fechaCita,
      cita.doctorNombre
    );

    try {
      const raw = localStorage.getItem(STORAGE_KEY_CITAS);
      const list: any[] = raw ? JSON.parse(raw) : [];
      let found = false;
      const updated = list.map((item) => {
        if (item.id === cita.id) {
          found = true;
          return { ...item, estado: nuevoEstado };
        }
        return item;
      });
      if (!found) {
        updated.push({ ...cita, estado: nuevoEstado });
      }
      localStorage.setItem(STORAGE_KEY_CITAS, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('odontosalud_data_updated', { detail: { tipo: 'citas', data: updated } })
      );
    } catch {}

    showToast(`Cita de ${cita.pacienteNombre}: ${ESTADO_META[nuevoEstado].label}`);
  };

  const handleAbrirFicha = (cita: Cita) => {
    try {
      localStorage.setItem('odontosalud_selected_cita_id', cita.id);
    } catch {}
    onNavigateTab?.('odontograma');
  };

  // Horarios ocupados para el formulario rápido
  const horariosOcupadosQuick = useMemo(() => {
    return new Set(
      citas
        .filter(
          (c) =>
            c.fechaCita === selectedDayIso &&
            c.estado !== 'cancelada' &&
            (c.boxNumero === quickBox || c.doctorNombre === quickDoctor)
        )
        .map((c) => c.horaInicio)
    );
  }, [citas, selectedDayIso, quickBox, quickDoctor]);

  const handleCrearCitaRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPacNombre.trim()) return;

    const nuevaCita: Cita = {
      id: `ag-${Date.now()}`,
      sedeId,
      pacienteId: `pac-${Date.now()}`,
      pacienteNombre: quickPacNombre.trim(),
      pacienteCedula: quickPacCedula.trim() || 'V-00.000.000',
      pacienteTelefono: quickPacTelefono.trim() || '+58 412-0000000',
      doctorNombre: quickDoctor || staffSede[0]?.nombres || 'Dra. María Alejandra Domínguez',
      boxNumero: quickBox,
      fechaCita: selectedDayIso,
      horaInicio: quickHora,
      motivo: quickMotivo.trim() || 'Consulta Odontológica',
      estado: 'confirmada',
      esUrgencia: quickUrgencia,
    };

    try {
      await ApiClient.crearCita(sedeId, nuevaCita);
    } catch {}

    try {
      const raw = localStorage.getItem(STORAGE_KEY_CITAS);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(nuevaCita);
      localStorage.setItem(STORAGE_KEY_CITAS, JSON.stringify(list));
      window.dispatchEvent(
        new CustomEvent('odontosalud_data_updated', { detail: { tipo: 'citas', data: list } })
      );
    } catch {}

    setCitas((prev) =>
      [nuevaCita, ...prev].sort(
        (a, b) => parseTimeToMinutes(a.horaInicio) - parseTimeToMinutes(b.horaInicio)
      )
    );
    setShowQuickCreate(false);
    setQuickPacNombre('');
    setQuickPacCedula('V-');
    setQuickUrgencia(false);
    showToast(`Cita confirmada para ${nuevaCita.pacienteNombre} a las ${nuevaCita.horaInicio}`);
  };

  return (
    <div className="flex flex-col gap-3.5 pb-28">
      {toastMsg && (
        <div className="fixed bottom-20 right-4 z-50 px-4 py-2.5 rounded-xl bg-dental-deep-navy text-white text-xs font-bold shadow-lg border border-primary/40 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Tarjeta de Cabecera Coherente + Selector de Sede + Nueva Cita */}
      <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-3.5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-vibrant-cyan">
                calendar_month
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary leading-none">
                  Control Clínico & Sillones
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    isSuperAdminView
                      ? 'bg-emerald-500/15 text-emerald-800 border-emerald-300'
                      : 'bg-sky-500/15 text-sky-900 border-sky-300'
                  }`}
                >
                  {isSuperAdminView ? 'SuperAdmin • Control General' : 'Solo tus citas editables'}
                </span>
              </div>
              <h1 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy mt-1 leading-tight flex items-center gap-2">
                <span>Agenda Operativa en Vivo</span>
                <span className="w-2 h-2 rounded-full bg-status-success animate-ping shrink-0" />
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowQuickCreate((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-dental-deep-navy hover:brightness-110 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[17px]">
              {showQuickCreate ? 'close' : 'add_circle'}
            </span>
            <span>{showQuickCreate ? 'Cerrar Formulario' : 'Nueva Cita'}</span>
          </button>
        </div>

        {/* Selector Segmentado de Sede (Evita colisiones y filtra boxes/staff por clínica) */}
        <div className="p-1.5 rounded-2xl bg-surface-subtle-ice border border-border-subtle grid grid-cols-2 gap-1.5 shadow-2xs">
          {(['victoria', 'tovar'] as SedeId[]).map((id) => {
            const sedeInfo = sedesDisponibles[id];
            const active = sedeId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (sedeId !== id) {
                    cambiarSede(id);
                    setSelectedBox('all');
                    setSelectedDoctor('all');
                  }
                }}
                className={`px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  active
                    ? 'bg-dental-deep-navy text-white shadow-sm'
                    : 'bg-transparent text-dental-deep-navy hover:bg-white/70'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-xs font-extrabold block truncate">
                    {id === 'victoria' ? 'La Victoria' : 'Colonia Tovar'}
                  </span>
                  <span
                    className={`text-[10px] block truncate ${
                      active ? 'text-slate-300' : 'text-secondary'
                    }`}
                  >
                    {sedeInfo.totalBoxes} {sedeInfo.totalBoxes === 1 ? 'Sillón Activo' : 'Sillones Activos'}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] shrink-0 ${
                    active ? 'text-vibrant-cyan' : 'text-primary/60'
                  }`}
                >
                  {active ? 'location_on' : 'apartment'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Formulario Rápido Cercano (+ Nueva Cita sin fricción) */}
      {showQuickCreate && (
        <form
          onSubmit={handleCrearCitaRapida}
          className="bg-surface-clean-white rounded-2xl p-4 shadow-md border border-primary/30 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-sm text-dental-deep-navy flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">event_available</span>
              Agendar Cita Rápida ({selectedDayIso})
            </h4>
            {pacientesCatalogo.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  const found = pacientesCatalogo.find((p) => p.id === e.target.value);
                  if (found) {
                    setQuickPacNombre(found.nombres);
                    setQuickPacCedula(found.cedula);
                    setQuickPacTelefono(found.telefono);
                  }
                }}
                className="text-[11px] rounded-lg border border-border-subtle bg-surface-subtle-ice px-2 py-1 text-dental-deep-navy font-semibold max-w-[180px]"
              >
                <option value="">Autocompletar paciente...</option>
                {pacientesCatalogo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombres} ({p.cedula})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              required
              placeholder="Nombre completo del paciente"
              value={quickPacNombre}
              onChange={(e) => setQuickPacNombre(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-subtle-ice text-xs text-dental-deep-navy font-medium"
            />
            <input
              type="text"
              placeholder="Cédula (Ej. V-18.540.112)"
              value={quickPacCedula}
              onChange={(e) => setQuickPacCedula(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-subtle-ice text-xs text-dental-deep-navy font-medium"
            />
            <input
              type="text"
              placeholder="Teléfono WhatsApp"
              value={quickPacTelefono}
              onChange={(e) => setQuickPacTelefono(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-subtle-ice text-xs text-dental-deep-navy font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select
              value={quickDoctor}
              onChange={(e) => {
                setQuickDoctor(e.target.value);
                const doc = staffSede.find((s) => s.nombres === e.target.value);
                if (doc) setQuickBox(Math.min(doc.boxAsignado || 1, sedeActiva.totalBoxes));
              }}
              className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-subtle-ice text-xs text-dental-deep-navy font-semibold"
            >
              {staffSede.map((s) => (
                <option key={s.id} value={s.nombres}>
                  {s.nombres} (Box {s.boxAsignado})
                </option>
              ))}
            </select>

            <select
              value={quickBox}
              onChange={(e) => setQuickBox(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-subtle-ice text-xs text-dental-deep-navy font-semibold"
            >
              {Array.from({ length: sedeActiva.totalBoxes }, (_, i) => i + 1).map((b) => (
                <option key={b} value={b}>
                  Sillón / Box {b}
                </option>
              ))}
            </select>

            <div className="flex flex-col gap-1.5">
              <select
                value={isCustomMotivo ? '__custom__' : quickMotivo}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom__') {
                    setIsCustomMotivo(true);
                    setQuickMotivo('');
                  } else {
                    setIsCustomMotivo(false);
                    setQuickMotivo(val);
                  }
                }}
                className="px-3 py-2 rounded-xl border border-border-subtle bg-surface-subtle-ice text-xs text-dental-deep-navy font-semibold"
              >
                {tratamientosActivos.map((t) => (
                  <option key={t.id} value={t.nombre}>
                    {t.nombre} ({t.duracionMinutos}m • ${t.costoUsd})
                  </option>
                ))}
                <option value="__custom__">Otro procedimiento personalizado...</option>
              </select>
              {isCustomMotivo && (
                <input
                  type="text"
                  required
                  placeholder="Especifica el tratamiento o motivo"
                  value={quickMotivo}
                  onChange={(e) => setQuickMotivo(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-primary/40 bg-white text-xs text-dental-deep-navy font-medium"
                />
              )}
            </div>
          </div>

          <div className="bg-surface-subtle-ice rounded-2xl p-3 border border-border-subtle flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold text-dental-deep-navy uppercase tracking-wider">
                  Cupos Disponibles
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 text-[10px] font-bold">
                  {HORARIOS_BLOQUE.length - horariosOcupadosQuick.size} libres
                </span>
                {horariosOcupadosQuick.size > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 text-[10px] font-bold">
                    {horariosOcupadosQuick.size} ocupados
                  </span>
                )}
              </div>
              <input
                type="date"
                value={selectedDayIso}
                onChange={(e) => {
                  if (e.target.value) {
                    setShowAllDates(false);
                    setSelectedDayIso(e.target.value);
                  }
                }}
                className="px-2 py-1 rounded-lg border border-border-subtle bg-white text-[11px] font-bold text-dental-deep-navy"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {HORARIOS_BLOQUE.map((hora) => {
                const ocupado = horariosOcupadosQuick.has(hora);
                const activo = quickHora === hora;
                return (
                  <button
                    key={hora}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setQuickHora(hora)}
                    className={`px-2.5 py-2 rounded-xl text-left transition-all border flex items-center justify-between gap-1 ${
                      ocupado
                        ? 'bg-rose-50 border-rose-200 text-rose-400 cursor-not-allowed'
                        : activo
                        ? 'bg-primary border-primary text-white shadow-xs cursor-pointer'
                        : 'bg-white border-border-subtle text-dental-deep-navy hover:border-primary cursor-pointer'
                    }`}
                  >
                    <span className={`text-[11px] font-extrabold tabular-nums ${ocupado ? 'line-through' : ''}`}>
                      {hora}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase ${
                        ocupado
                          ? 'text-rose-500'
                          : activo
                          ? 'text-white/90'
                          : 'text-emerald-700'
                      }`}
                    >
                      {ocupado ? 'Ocup.' : 'Libre'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-xs font-bold text-status-danger cursor-pointer">
              <input
                type="checkbox"
                checked={quickUrgencia}
                onChange={(e) => setQuickUrgencia(e.target.checked)}
                className="rounded border-border-subtle"
              />
              Marcar como Urgencia
            </label>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              Confirmar en Agenda
            </button>
          </div>
        </form>
      )}

      {/* Bloque 3: Resumen de Ocupación por Sillón en Tiempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {sillonesEstado.map(({ boxNum, enAtencion, siguiente }) => (
          <div
            key={boxNum}
            className={`rounded-2xl p-3 border shadow-2xs flex items-center justify-between gap-2 ${
              enAtencion
                ? 'bg-electric-blue/5 border-electric-blue/35'
                : 'bg-surface-clean-white border-border-subtle'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">chair</span>
                <span className="text-xs font-extrabold text-dental-deep-navy">
                  Sillón {boxNum}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    enAtencion
                      ? 'bg-electric-blue text-white'
                      : 'bg-emerald-500/15 text-emerald-800'
                  }`}
                >
                  {enAtencion ? 'En Atención' : 'Libre'}
                </span>
              </div>
              <p className="text-[11px] text-secondary truncate mt-1">
                {enAtencion
                  ? `${enAtencion.pacienteNombre} • ${enAtencion.doctorNombre}`
                  : siguiente
                  ? `Próximo: ${siguiente.horaInicio} (${siguiente.pacienteNombre})`
                  : 'Sin pacientes en cola'}
              </p>
            </div>
            {enAtencion && (
              <button
                type="button"
                onClick={() => handleAbrirFicha(enAtencion)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-electric-blue text-white text-[10px] font-bold shadow-2xs active:scale-95 cursor-pointer"
              >
                Abrir Ficha
              </button>
            )}
          </div>
        ))}

        {/* KPI Consolidado de Jornada */}
        <div className="rounded-2xl p-3 bg-surface-clean-white border border-border-subtle shadow-2xs flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase text-secondary block">
              Pulso de Agenda
            </span>
            <span className="text-sm font-display font-black text-dental-deep-navy">
              {citasPorFecha.length} Citas • {sillonesOcupadosCount}/{sedeActiva.totalBoxes} Sillones
            </span>
          </div>
          {collisionIds.size > 0 ? (
            <span className="px-2 py-1 rounded-xl bg-status-danger/10 text-status-danger border border-status-danger/30 text-[10px] font-black flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              {Math.ceil(collisionIds.size / 2)} Colisión
            </span>
          ) : (
            <span className="px-2 py-1 rounded-xl bg-emerald-500/10 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Sin Choques
            </span>
          )}
        </div>
      </div>

      {/* Tarjeta de Calendario Dinámico: Vista Semanal de Cupos & Calendario Mensual */}
      <div className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {calendarMode === 'mes' && (
              <button
                type="button"
                onClick={() =>
                  setCalendarMonthDate(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  )
                }
                className="w-7 h-7 rounded-lg bg-surface-subtle-ice border border-border-subtle flex items-center justify-center text-dental-deep-navy hover:border-primary cursor-pointer"
                title="Mes anterior"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
            )}
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base text-dental-deep-navy truncate">
                {monthTitle}
              </h3>
              <span className="text-[11px] text-secondary block truncate">
                {sedeActiva.nombre} • {sedeActiva.totalBoxes}{' '}
                {sedeActiva.totalBoxes === 1 ? 'Sillón' : 'Sillones'}
              </span>
            </div>
            {calendarMode === 'mes' && (
              <button
                type="button"
                onClick={() =>
                  setCalendarMonthDate(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  )
                }
                className="w-7 h-7 rounded-lg bg-surface-subtle-ice border border-border-subtle flex items-center justify-center text-dental-deep-navy hover:border-primary cursor-pointer"
                title="Mes siguiente"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {/* Conmutador Semana / Mes */}
            <div className="p-0.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex items-center">
              <button
                type="button"
                onClick={() => setCalendarMode('semana')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  calendarMode === 'semana'
                    ? 'bg-dental-deep-navy text-white shadow-2xs'
                    : 'text-secondary hover:text-dental-deep-navy'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode('mes')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  calendarMode === 'mes'
                    ? 'bg-dental-deep-navy text-white shadow-2xs'
                    : 'text-secondary hover:text-dental-deep-navy'
                }`}
              >
                Mes
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAllDates((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                showAllDates
                  ? 'bg-dental-deep-navy text-white border-dental-deep-navy'
                  : 'bg-surface-subtle-ice text-secondary border-border-subtle'
              }`}
            >
              {showAllDates ? 'Viendo Todas' : 'Ver Todas'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAllDates(false);
                setSelectedDayIso(todayIso);
                setCalendarMonthDate(new Date());
              }}
              className="px-2 py-1 rounded-lg bg-electric-blue/10 text-xs text-electric-blue font-bold flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">today</span>
              Hoy
            </button>
          </div>
        </div>

        {calendarMode === 'semana' ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {weekDays.map((d) => {
                const isSelected = !showAllDates && selectedDayIso === d.iso;
                const dayCitas = citas.filter(
                  (c) => c.fechaCita === d.iso && c.estado !== 'cancelada'
                );
                const dayCount = dayCitas.length;
                const capacidadDia = HORARIOS_BLOQUE.length * Math.max(1, sedeActiva.totalBoxes);
                const cuposLibresDia = Math.max(0, capacidadDia - dayCount);

                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => {
                      setShowAllDates(false);
                      setSelectedDayIso(d.iso);
                    }}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-between gap-1 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-electric-blue text-surface-clean-white border-electric-blue shadow-md scale-[1.02]'
                        : d.isToday
                        ? 'bg-primary/10 border-primary/40 text-dental-deep-navy'
                        : 'bg-surface-subtle-ice border-border-subtle text-dental-deep-navy hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-[10px] uppercase font-extrabold ${
                          isSelected ? 'text-white/90' : 'text-secondary'
                        }`}
                      >
                        {d.dia}
                      </span>
                      {d.isToday && (
                        <span
                          className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-primary text-white'
                          }`}
                        >
                          Hoy
                        </span>
                      )}
                    </div>

                    <span className="text-lg font-display font-black leading-none my-0.5">
                      {d.num}
                    </span>

                    <div className="w-full flex flex-col items-center gap-0.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold w-full text-center ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : dayCount > 0
                            ? 'bg-primary/15 text-primary'
                            : 'bg-emerald-500/15 text-emerald-800'
                        }`}
                      >
                        {dayCount > 0 ? `${dayCount} ${dayCount === 1 ? 'cita' : 'citas'}` : 'Disponible'}
                      </span>
                      <span
                        className={`text-[9px] font-semibold ${
                          isSelected ? 'text-white/80' : 'text-secondary'
                        }`}
                      >
                        {cuposLibresDia} cupos libres
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-bold text-dental-deep-navy">
                Día seleccionado: <span className="text-primary">{selectedDayIso}</span>
              </span>
              <span className="text-secondary font-semibold">
                {citasPorFecha.length} {citasPorFecha.length === 1 ? 'cita programada' : 'citas programadas'} •{' '}
                <strong className="text-emerald-700">
                  {Math.max(0, HORARIOS_BLOQUE.length * Math.max(1, sedeActiva.totalBoxes) - citasPorFecha.length)} cupos libres
                </strong>
              </span>
            </div>
          </>
        ) : (
          /* Tarjeta de Visualización en Formato Calendario Mes */
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-7 gap-1 text-center">
              {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d) => (
                <span key={d} className="text-[10px] font-extrabold text-secondary py-1">
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthlyCalendar.cells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="h-14 rounded-xl bg-surface-subtle-ice/40" />;
                }
                const isSelected = !showAllDates && selectedDayIso === cell.iso;
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => {
                      setShowAllDates(false);
                      setSelectedDayIso(cell.iso);
                    }}
                    className={`h-14 p-1.5 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-electric-blue text-white border-electric-blue shadow-sm'
                        : cell.isToday
                        ? 'bg-primary/10 border-primary text-dental-deep-navy'
                        : cell.count > 0
                        ? 'bg-surface-subtle-ice border-primary/30 text-dental-deep-navy hover:border-primary'
                        : 'bg-white border-border-subtle text-secondary hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xs font-extrabold leading-none">{cell.num}</span>
                    {cell.count > 0 ? (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-black leading-tight ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {cell.count} {cell.count === 1 ? 'cita' : 'citas'}
                      </span>
                    ) : (
                      <span
                        className={`text-[8px] font-semibold ${
                          isSelected ? 'text-white/75' : 'text-slate-400'
                        }`}
                      >
                        Libre
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-bold text-dental-deep-navy">
                Resumen del Mes: <strong className="text-primary">{monthlyCalendar.totalCitasMes} citas</strong> en{' '}
                {monthlyCalendar.diasConAgenda} {monthlyCalendar.diasConAgenda === 1 ? 'día' : 'días'}
              </span>
              <span className="text-secondary font-semibold">
                Toca un día para ver o agendar citas
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filtros Inteligentes: Sillón + Odontólogo + Estado */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedBox('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedBox === 'all'
                ? 'bg-dental-deep-navy text-surface-clean-white shadow-sm'
                : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy'
            }`}
          >
            Todos ({citasPorFecha.length})
          </button>

          {Array.from({ length: sedeActiva.totalBoxes }, (_, i) => i + 1).map((boxNum) => (
            <button
              key={boxNum}
              type="button"
              onClick={() => setSelectedBox(boxNum)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedBox === boxNum
                  ? 'bg-primary text-surface-clean-white shadow-sm'
                  : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-vibrant-cyan" />
              Box {boxNum}
            </button>
          ))}

          {(['en_sillon', 'confirmada', 'pendiente', 'completada'] as Cita['estado'][]).map(
            (est) => (
              <button
                key={est}
                type="button"
                onClick={() => setSelectedEstado(selectedEstado === est ? 'all' : est)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedEstado === est
                    ? 'bg-electric-blue text-white shadow-sm'
                    : 'bg-surface-clean-white border border-border-subtle text-secondary'
                }`}
              >
                {ESTADO_META[est].label}
              </button>
            )
          )}
        </div>

        {/* Filtro rápido por Odontólogo del Staff */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedDoctor('all')}
            className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              selectedDoctor === 'all'
                ? 'bg-primary/15 text-primary border border-primary/40'
                : 'bg-surface-clean-white border border-border-subtle text-secondary'
            }`}
          >
            Todo el Staff ({staffSede.length})
          </button>
          {staffSede.map((doc) => {
            const active = selectedDoctor === doc.nombres;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedDoctor(active ? 'all' : doc.nombres)}
                className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-dental-deep-navy text-white shadow-2xs'
                    : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy'
                }`}
              >
                {doc.avatar && (
                  <img
                    src={doc.avatar}
                    alt={doc.nombres}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                )}
                <span>{doc.nombres.split(' ').slice(0, 2).join(' ')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerta de Colisiones si existen */}
      {collisionIds.size > 0 && (
        <div className="p-3 rounded-2xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>
            Atención: Se detectaron citas solapadas en el mismo horario/sillón o con el mismo odontólogo. Revisa las tarjetas marcadas.
          </span>
        </div>
      )}

      {/* Timeline Stream de Citas */}
      <div className="flex flex-col gap-3">
        {loading && filteredCitas.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-clean-white border border-border-subtle text-center text-xs text-secondary">
            Sincronizando agenda clínica desde el borde...
          </div>
        ) : filteredCitas.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-clean-white border border-border-subtle text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-secondary/50">event_busy</span>
            <p className="text-xs font-bold text-dental-deep-navy">
              No hay citas para los filtros seleccionados
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedBox('all');
                setSelectedDoctor('all');
                setSelectedEstado('all');
                setShowAllDates(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-primary cursor-pointer"
            >
              Mostrar todas las citas de la sede
            </button>
          </div>
        ) : (
          filteredCitas.map((cita) => {
            const meta = ESTADO_META[cita.estado];
            const isEnSillon = cita.estado === 'en_sillon';
            const hasCollision = collisionIds.has(cita.id);
            const canEdit = canEditDoctorCita(activeUser, cita.doctorNombre);
            const waText = encodeURIComponent(
              `Hola ${cita.pacienteNombre}, le recordamos su cita en ${sedeActiva.nombre} el ${cita.fechaCita} a las ${cita.horaInicio} con ${cita.doctorNombre}.`
            );

            return (
              <div
                key={cita.id}
                className={`rounded-2xl bg-surface-clean-white p-4 shadow-sm border relative overflow-hidden transition-all ${
                  hasCollision
                    ? 'border-status-danger ring-2 ring-status-danger/25'
                    : isEnSillon
                    ? 'border-electric-blue/50 ring-2 ring-electric-blue/25'
                    : 'border-border-subtle'
                }`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    cita.esUrgencia && cita.estado !== 'completada'
                      ? 'bg-status-danger'
                      : meta.barClass
                  }`}
                />

                <div className="pl-1.5 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {cita.pacienteAvatar ? (
                        <img
                          src={cita.pacienteAvatar}
                          alt={cita.pacienteNombre}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-border-subtle"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-xs text-dental-deep-navy shrink-0">
                          {getInitials(cita.pacienteNombre)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-dental-deep-navy truncate">
                            {cita.pacienteNombre}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-[11px] text-secondary font-semibold">
                            Box {cita.boxNumero}
                          </span>
                          {cita.esUrgencia && (
                            <span className="px-1.5 py-0.5 rounded-full bg-status-danger/10 text-status-danger text-[10px] font-bold">
                              Urgencia
                            </span>
                          )}
                          {hasCollision && (
                            <span className="px-1.5 py-0.5 rounded-full bg-status-danger text-white text-[10px] font-bold">
                              Horario Solapado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary truncate mt-0.5">{cita.motivo}</p>
                        <p className="text-[11px] text-primary font-medium truncate">
                          {cita.doctorNombre} • {cita.pacienteCedula}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-dental-deep-navy block">
                        {cita.horaInicio}
                      </span>
                      <span className="text-[10px] text-secondary block">{cita.fechaCita}</span>
                      <span
                        className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.badgeClass}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">{meta.icon}</span>
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Acciones Directas 1-Toque (Segmentada por RBAC) */}
                  <div className="pt-2 border-t border-border-subtle/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {canEdit ? (
                        <>
                          {cita.estado === 'pendiente' && (
                            <button
                              type="button"
                              onClick={() => handleCambiarEstado(cita, 'confirmada')}
                              className="px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">verified</span>
                              Confirmar
                            </button>
                          )}
                          {cita.estado === 'confirmada' && (
                            <button
                              type="button"
                              onClick={() => handleCambiarEstado(cita, 'en_sillon')}
                              className="px-2.5 py-1 rounded-lg bg-electric-blue text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">chair</span>
                              Pasar a Sillón
                            </button>
                          )}
                          {cita.estado === 'en_sillon' && (
                            <button
                              type="button"
                              onClick={() => handleCambiarEstado(cita, 'completada')}
                              className="px-2.5 py-1 rounded-lg bg-status-success text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">task_alt</span>
                              Finalizar
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                          Solo lectura
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAbrirFicha(cita)}
                        className="px-2.5 py-1 rounded-lg bg-surface-subtle-ice border border-border-subtle text-dental-deep-navy text-[11px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          dentistry
                        </span>
                        Ficha
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateTab?.('cobros')}
                        className="px-2.5 py-1 rounded-lg bg-surface-subtle-ice border border-border-subtle text-dental-deep-navy text-[11px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px] text-emerald-700">
                          payments
                        </span>
                        Cobrar
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            `https://wa.me/${cita.pacienteTelefono.replace(/[^0-9]/g, '')}?text=${waText}`,
                            '_blank'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-surface-clean-white border border-border-subtle text-status-success text-[11px] font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">chat</span>
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            `tel:${cita.pacienteTelefono.replace(/[^0-9]/g, '')}`,
                            '_self'
                          )
                        }
                        title="Llamar paciente"
                        className="w-7 h-7 rounded-lg bg-surface-clean-white border border-border-subtle text-primary flex items-center justify-center active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">call</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
