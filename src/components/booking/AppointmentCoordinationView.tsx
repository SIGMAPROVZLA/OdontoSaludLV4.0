import React, { useState, useEffect, useMemo } from 'react';
import { useSede } from '../../context/SedeContext';
import { ApiClient } from '../../services/api';
import { TabId } from '../layout/BottomNavigation';
import { SedeId } from '../../types/clinical';
import { ClinicalScheduleMatrix } from './ClinicalScheduleMatrix';
import { PatientClinicalHistoryModal } from './PatientClinicalHistoryModal';

export interface SolicitudCita {
  id: string;
  pacienteNombre: string;
  pacienteCedula: string;
  pacienteTelefono: string;
  pacienteEmail: string;
  origen: 'web' | 'chatbot' | 'whatsapp';
  tipo: 'urgencia' | 'control' | 'nuevo' | 'espera';
  motivo: string;
  fechaTexto: string; // 'Ayer' | 'Hoy' | 'Mañana' | 'YYYY-MM-DD'
  fechaIso: string;
  horaTexto: string;
  duracionMinutos: number;
  boxSugerido: number;
  doctorSugerido: string;
  estado: 'por_confirmar' | 'confirmada' | 'espera';
  tiempoTranscurrido: string;
  notaRecepcion?: string;
  pagoAnticipado?: string;
  montoReservaUsd?: number;
  referenciaReserva?: string;
  saldoPendientePrevioUsd?: number;
  // Estado de confirmación de datos con el paciente vía WhatsApp
  confirmacionPaciente?: 'pendiente' | 'enlace_enviado' | 'confirmado';
  pacienteFechaNacimiento?: string;
  pacienteEdad?: number;
  nivelRiesgo?: 'Bajo' | 'Moderado' | 'Alto' | string;
  timestampOrden?: number;
}

export function obtenerTratamientoTexto(motivo: string): string {
  if (!motivo) return 'Evaluación Odontológica';
  const partes = motivo.split('•');
  return partes[0].trim();
}

export function obtenerNivelRiesgo(sol: SolicitudCita): 'Bajo' | 'Moderado' | 'Alto' {
  if (sol.nivelRiesgo) return sol.nivelRiesgo as any;
  const texto = (sol.motivo || '').toLowerCase();
  if (sol.tipo === 'urgencia' || texto.includes('dolor') || texto.includes('urgencia')) {
    return 'Alto';
  }
  if (
    texto.includes('hipertensión') ||
    texto.includes('diabetes') ||
    texto.includes('i10') ||
    texto.includes('cardio')
  ) {
    return 'Moderado';
  }
  return 'Bajo';
}

export function obtenerEdadPaciente(sol: SolicitudCita): number {
  if (sol.pacienteEdad && sol.pacienteEdad > 0) return sol.pacienteEdad;
  const fn = (sol.pacienteFechaNacimiento || '').trim();
  if (fn) {
    const y = parseInt(fn.split('-')[0], 10);
    if (!isNaN(y) && y > 1900 && y < 2030) {
      return new Date().getFullYear() - y;
    }
  }
  const cleanDigits = (sol.pacienteCedula || '').replace(/[^0-9]/g, '');
  const num = parseInt(cleanDigits, 10);
  if (!isNaN(num)) {
    if (num > 28000000) return 22;
    if (num > 24000000) return 28;
    if (num > 19000000) return 35;
    if (num > 15000000) return 42;
    if (num > 10000000) return 54;
    return 65;
  }
  return 34;
}

interface AppointmentCoordinationViewProps {
  onNavigateTab?: (tab: TabId) => void;
}

// Convertir hora tipo "09:30 AM" a minutos desde medianoche para orden cronológico estricto
export function parseHoraToMinutes(horaStr: string): number {
  if (!horaStr) return 9999;
  const lower = horaStr.toLowerCase().trim();
  if (lower.includes('mañana') && !lower.includes(':')) return 8 * 60; // 08:00 AM
  if (lower.includes('tarde') && !lower.includes(':')) return 13 * 60; // 01:00 PM

  const match = horaStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = (match[3] || '').toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function formatMinutesToHora(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const hStr = hours < 10 ? `0${hours}` : `${hours}`;
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hStr}:${mStr} ${meridiem}`;
}

export function calcularHoraFin(horaInicioStr: string, duracionMinutos: number): string {
  const startMins = parseHoraToMinutes(horaInicioStr);
  if (startMins >= 9999) return horaInicioStr;
  const endMins = startMins + duracionMinutos;
  return formatMinutesToHora(endMins);
}

const HORAS_DISPONIBLES = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
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

// Duraciones concisas en minutos sin texto de apoyo pesado
const DURACIONES_DISPONIBLES = [
  { min: 15, label: '15 min' },
  { min: 30, label: '30 min' },
  { min: 45, label: '45 min' },
  { min: 60, label: '60 min' },
  { min: 90, label: '90 min' },
  { min: 120, label: '120 min' },
];

export const AppointmentCoordinationView: React.FC<AppointmentCoordinationViewProps> = ({
  onNavigateTab,
}) => {
  const { sedeActiva, sedeId } = useSede();

  // Fechas relativas formateadas (Ayer, Hoy, Mañana)
  const fechasRelativas = useMemo(() => {
    const now = new Date();
    const ayer = new Date(now.getTime() - 86400000);
    const manana = new Date(now.getTime() + 86400000);

    const fShort = (d: Date) =>
      d.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' });
    const fIso = (d: Date) => d.toISOString().split('T')[0];

    return {
      ayerLabel: `Ayer (${fShort(ayer)})`,
      ayerIso: fIso(ayer),
      hoyLabel: `Hoy (${fShort(now)})`,
      hoyIso: fIso(now),
      mananaLabel: `Mañana (${fShort(manana)})`,
      mananaIso: fIso(manana),
    };
  }, []);

  // Filtros principales requeridos: Botones de Ayer, Hoy y Mañana
  const [filtroDia, setFiltroDia] = useState<'ayer' | 'hoy' | 'manana' | 'todos'>('hoy');
  const [filtroCategoria, setFiltroCategoria] = useState<'todos' | 'por_confirmar' | 'urgencias'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estado para la Matriz Horaria Clínica (Propuesta A)
  const [sedeMatriz, setSedeMatriz] = useState<SedeId>((sedeId as SedeId) || 'victoria');
  const [turnoMatriz, setTurnoMatriz] = useState<'manana' | 'tarde' | 'completo'>('manana');
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState<string | null>(null);

  // Formulario flotante preciso de cambio de horario (en modal flotante 2 columnas)
  const [modalHorario, setModalHorario] = useState<{
    id: string;
    paciente: string;
    hora: string;
    duracion: number;
  } | null>(null);

  // Modal de Historia Clínica Digital en la misma interfaz
  const [modalHistoriaPaciente, setModalHistoriaPaciente] = useState<SolicitudCita | null>(null);

  // Solicitudes de citas previas
  const [solicitudes, setSolicitudes] = useState<SolicitudCita[]>([
    // AYER
    {
      id: 'sol-ayer-1',
      pacienteNombre: 'Ricardo Gómez',
      pacienteCedula: 'V-15.342.901',
      pacienteTelefono: '+584148901234',
      pacienteEmail: 'ricardo.gomez@gmail.com',
      origen: 'web',
      tipo: 'control',
      motivo: 'Revisión periódica de carillas dentales superiores',
      fechaTexto: 'Ayer',
      fechaIso: fechasRelativas.ayerIso,
      horaTexto: '09:00 AM',
      duracionMinutos: 30,
      boxSugerido: 1,
      doctorSugerido: 'Dra. María Alejandra Domínguez',
      estado: 'confirmada',
      tiempoTranscurrido: 'Ayer',
      confirmacionPaciente: 'confirmado',
    },
    {
      id: 'sol-ayer-2',
      pacienteNombre: 'Daniela Salazar',
      pacienteCedula: 'V-24.819.204',
      pacienteTelefono: '+584126789123',
      pacienteEmail: 'daniela.salazar@hotmail.com',
      origen: 'whatsapp',
      tipo: 'nuevo',
      motivo: 'Evaluación general y presupuesto de profilaxis',
      fechaTexto: 'Ayer',
      fechaIso: fechasRelativas.ayerIso,
      horaTexto: '03:00 PM',
      duracionMinutos: 45,
      boxSugerido: 2,
      doctorSugerido: 'Od. Miriel Morillo / Od. Julianny Ramos',
      estado: 'confirmada',
      tiempoTranscurrido: 'Ayer',
      confirmacionPaciente: 'confirmado',
    },

    // HOY (Horario Clínico Consecuente según Distribución de Sillones)
    {
      id: 'sol-hoy-0',
      pacienteNombre: 'María Alejandra Domínguez Hernández',
      pacienteCedula: 'V-14.890.123',
      pacienteTelefono: '+584141234567',
      pacienteEmail: 'm.dominguez@gmail.com',
      origen: 'web',
      tipo: 'nuevo',
      motivo: 'Profilaxis Ultrasónica & Pulido Coronario • Anamnesis: [Z01.2] Examen odontológico',
      fechaTexto: 'Hoy',
      fechaIso: fechasRelativas.hoyIso,
      horaTexto: '08:00 AM',
      duracionMinutos: 30,
      boxSugerido: 2,
      doctorSugerido: 'Od. Miriel Morillo / Od. Julianny Ramos',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 8m',
      confirmacionPaciente: 'pendiente',
    },
    {
      id: 'sol-hoy-1',
      pacienteNombre: 'Patricia Velásquez',
      pacienteCedula: 'V-19.845.221',
      pacienteTelefono: '+584145550921',
      pacienteEmail: 'patricia.velasquez@email.com',
      origen: 'web',
      tipo: 'urgencia',
      motivo: 'Dolor agudo en molar superior derecho al masticar',
      fechaTexto: 'Hoy',
      fechaIso: fechasRelativas.hoyIso,
      horaTexto: '08:30 AM',
      duracionMinutos: 45,
      boxSugerido: 1,
      doctorSugerido: 'Dra. María Alejandra Domínguez',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 14m',
      confirmacionPaciente: 'pendiente',
      notaRecepcion: 'Paciente refiere dolor que no cede con analgésicos comunes.',
      montoReservaUsd: 20,
      referenciaReserva: 'PM-984210',
    },
    {
      id: 'sol-hoy-elena',
      pacienteNombre: 'Elena Blanco',
      pacienteCedula: 'V-25.115.894',
      pacienteTelefono: '+584129876543',
      pacienteEmail: 'elena.blanco@gmail.com',
      origen: 'web',
      tipo: 'nuevo',
      motivo: 'Profilaxis & Destartraje ultrasónico completo',
      fechaTexto: 'Hoy',
      fechaIso: fechasRelativas.hoyIso,
      horaTexto: '09:00 AM',
      duracionMinutos: 45,
      boxSugerido: 1,
      doctorSugerido: 'Dra. María Alejandra Domínguez',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 25m',
      confirmacionPaciente: 'pendiente',
    },
    {
      id: 'sol-hoy-3',
      pacienteNombre: 'Carlos Mendoza',
      pacienteCedula: 'V-17.654.321',
      pacienteTelefono: '+584121234567',
      pacienteEmail: 'carlos.mendoza@email.com',
      origen: 'whatsapp',
      tipo: 'urgencia',
      motivo: 'Endodoncia #16',
      fechaTexto: 'Hoy',
      fechaIso: fechasRelativas.hoyIso,
      horaTexto: '09:30 AM',
      duracionMinutos: 45,
      boxSugerido: 1,
      doctorSugerido: 'Dra. María Alejandra Domínguez',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 30m',
      confirmacionPaciente: 'pendiente',
    },
    {
      id: 'sol-hoy-2',
      pacienteNombre: 'Marcos Rondón',
      pacienteCedula: 'V-19.463.118',
      pacienteTelefono: '+584247890123',
      pacienteEmail: 'marcos.rondon@gmail.com',
      origen: 'chatbot',
      tipo: 'control',
      motivo: 'Ajuste mensual de Brackets metálicos y cambio de arcos',
      fechaTexto: 'Hoy',
      fechaIso: fechasRelativas.hoyIso,
      horaTexto: '09:30 AM',
      duracionMinutos: 30,
      boxSugerido: 2,
      doctorSugerido: 'Od. Miriel Morillo / Od. Julianny Ramos',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 35m',
      confirmacionPaciente: 'enlace_enviado',
      saldoPendientePrevioUsd: 35,
    },
    {
      id: 'sol-hoy-raymond',
      pacienteNombre: 'Raymond Gilbonio',
      pacienteCedula: 'V-16.782.901',
      pacienteTelefono: '+584149988112',
      pacienteEmail: 'raymond.gilbonio@gmail.com',
      origen: 'web',
      tipo: 'nuevo',
      motivo: 'Profilaxis Ultrasónica & Pulido Coronario • Anamnesis: [I10] Hipertensión',
      fechaTexto: 'Hoy',
      fechaIso: fechasRelativas.hoyIso,
      horaTexto: '10:00 AM',
      duracionMinutos: 30,
      boxSugerido: 1,
      doctorSugerido: 'Dra. María Alejandra Domínguez',
      estado: 'confirmada',
      tiempoTranscurrido: 'Hace 45m',
      confirmacionPaciente: 'confirmado',
    },
    {
      id: 'sol-hoy-guillermo',
      pacienteNombre: 'Guillermo Parra',
      pacienteCedula: 'V-18.234.567',
      pacienteTelefono: '+584149988776',
      pacienteEmail: 'guillermo.parra@gmail.com',
      origen: 'chatbot',
      tipo: 'control',
      motivo: 'Toma de impresión definitiva para prótesis fija',
      fechaTexto: 'Hoy',
      fechaIso: fechasRelativas.hoyIso,
      horaTexto: '10:30 AM',
      duracionMinutos: 45,
      boxSugerido: 2,
      doctorSugerido: 'Od. Miriel Morillo / Od. Julianny Ramos',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 50m',
      confirmacionPaciente: 'enlace_enviado',
    },
    {
      id: 'sol-hoy-4',
      pacienteNombre: 'Valeria Quintana',
      pacienteCedula: 'V-26.789.012',
      pacienteTelefono: '+584241122334',
      pacienteEmail: 'valeria.quintana@gmail.com',
      origen: 'web',
      tipo: 'nuevo',
      motivo: 'Profilaxis ultrasónica profunda & Blanqueamiento',
      fechaTexto: 'Hoy',
      fechaIso: fechasRelativas.hoyIso,
      horaTexto: '02:00 PM',
      duracionMinutos: 45,
      boxSugerido: 2,
      doctorSugerido: 'Od. Miriel Morillo / Od. Julianny Ramos',
      estado: 'confirmada',
      tiempoTranscurrido: 'Hace 2h',
      confirmacionPaciente: 'confirmado',
      pagoAnticipado: 'Pago Móvil ($30)',
    },
    {
      id: 'sol-hoy-5',
      pacienteNombre: 'Alejandro Bastidas',
      pacienteCedula: 'V-20.987.654',
      pacienteTelefono: '+584167890123',
      pacienteEmail: 'a.bastidas@outlook.com',
      origen: 'chatbot',
      tipo: 'control',
      motivo: 'Control de cicatrización post-exodoncia de cordal',
      fechaTexto: 'Hoy',
      fechaIso: fechasRelativas.hoyIso,
      horaTexto: '04:00 PM',
      duracionMinutos: 20,
      boxSugerido: 1,
      doctorSugerido: 'Dra. María Alejandra Domínguez',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 20m',
      confirmacionPaciente: 'pendiente',
    },

    // MAÑANA
    {
      id: 'sol-manana-1',
      pacienteNombre: 'Elena Blanco',
      pacienteCedula: 'V-25.115.894',
      pacienteTelefono: '+584129876543',
      pacienteEmail: 'elena.blanco@gmail.com',
      origen: 'web',
      tipo: 'nuevo',
      motivo: 'Profilaxis & Destartraje ultrasónico completo',
      fechaTexto: 'Mañana',
      fechaIso: fechasRelativas.mananaIso,
      horaTexto: '09:00 AM',
      duracionMinutos: 45,
      boxSugerido: 1,
      doctorSugerido: 'Dra. María Alejandra Domínguez',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Ayer 18:30',
      confirmacionPaciente: 'pendiente',
      pagoAnticipado: 'Pago Móvil ($20)',
    },
    {
      id: 'sol-manana-2',
      pacienteNombre: 'Guillermo Parra',
      pacienteCedula: 'V-18.234.567',
      pacienteTelefono: '+584149988776',
      pacienteEmail: 'guillermo.parra@gmail.com',
      origen: 'chatbot',
      tipo: 'control',
      motivo: 'Toma de impresión definitiva para prótesis fija',
      fechaTexto: 'Mañana',
      fechaIso: fechasRelativas.mananaIso,
      horaTexto: '10:30 AM',
      duracionMinutos: 45,
      boxSugerido: 2,
      doctorSugerido: 'Dra. Andrea Morales',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 3h',
      confirmacionPaciente: 'enlace_enviado',
    },
    {
      id: 'sol-manana-3',
      pacienteNombre: 'Mariana Duque',
      pacienteCedula: 'V-22.456.789',
      pacienteTelefono: '+584243344556',
      pacienteEmail: 'mariana.duque@gmail.com',
      origen: 'whatsapp',
      tipo: 'urgencia',
      motivo: 'Caída de bracket con alambre lacerando mucosa yugal',
      fechaTexto: 'Mañana',
      fechaIso: fechasRelativas.mananaIso,
      horaTexto: '03:30 PM',
      duracionMinutos: 30,
      boxSugerido: 2,
      doctorSugerido: 'Dra. Carmen Elena Silva',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 40m',
      confirmacionPaciente: 'pendiente',
    },
  ]);

  const mostrarNotificacion = (texto: string) => {
    setToastMsg(texto);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Cargar citas reales desde Cloudflare D1 y LocalStorage en estricto orden de solicitud
  const cargarCitasDesdeD1 = async () => {
    setIsRefreshing(true);
    try {
      let todasCitasCrudas: any[] = [];
      const citasD1 = await ApiClient.getCitas(sedeId, 'all');
      if (citasD1 && Array.isArray(citasD1)) {
        todasCitasCrudas = [...citasD1];
      }

      // Cargar solicitudes de reserva desde LocalStorage
      try {
        const localSaved = localStorage.getItem('odontosalud_data_citas');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) {
            parsed.forEach((lc: any) => {
              if (!todasCitasCrudas.some((rc: any) => rc.id === lc.id)) {
                todasCitasCrudas.push(lc);
              }
            });
          }
        }
      } catch {}

      if (todasCitasCrudas.length > 0) {
        const d1Mapeadas: SolicitudCita[] = todasCitasCrudas.map((c, idx) => ({
          id: c.id,
          pacienteNombre: c.pacienteNombre || c.paciente_nombre || 'Paciente',
          pacienteCedula: c.pacienteCedula || c.paciente_cedula || 'V-00.000.000',
          pacienteTelefono: c.pacienteTelefono || c.paciente_telefono || '+58 412-0000000',
          pacienteEmail: c.pacienteEmail || `${(c.pacienteNombre || 'paciente').toLowerCase().replace(/\s+/g, '.')}@email.com`,
          pacienteFechaNacimiento: c.pacienteFechaNacimiento || c.paciente_fecha_nacimiento || '',
          origen: c.esUrgencia ? 'web' : idx % 2 === 0 ? 'chatbot' : 'whatsapp',
          tipo: c.esUrgencia
            ? 'urgencia'
            : (c.motivo || '').toLowerCase().includes('bracket')
            ? 'control'
            : 'nuevo',
          motivo: c.motivo || 'Consulta Odontológica General',
          fechaTexto:
            c.fechaCita === fechasRelativas.hoyIso || c.fecha_cita === fechasRelativas.hoyIso
              ? 'Hoy'
              : c.fechaCita === fechasRelativas.ayerIso || c.fecha_cita === fechasRelativas.ayerIso
              ? 'Ayer'
              : c.fechaCita === fechasRelativas.mananaIso || c.fecha_cita === fechasRelativas.mananaIso
              ? 'Mañana'
              : c.fechaCita || c.fecha_cita || 'Hoy',
          fechaIso: c.fechaCita || c.fecha_cita || fechasRelativas.hoyIso,
          horaTexto: c.horaInicio || c.hora_inicio || '09:00 AM',
          duracionMinutos: c.duracionMinutos || 45,
          boxSugerido: c.boxNumero || c.box_numero || 1,
          doctorSugerido: c.doctorNombre || c.doctor_nombre || 'Dra. María Alejandra Domínguez',
          estado: (c.estado === 'pendiente' ? 'por_confirmar' : c.estado) as any,
          tiempoTranscurrido: c.estado === 'confirmada' ? 'Confirmada' : 'En cola de Reserva',
          confirmacionPaciente: c.estado === 'confirmada' ? 'confirmado' : 'pendiente',
          timestampOrden: idx,
        }));

        setSolicitudes((prev) => {
          // Deduplicar estrictamente por cédula y por ID para evitar duplicados en la lista
          const vistasCedula = new Set<string>();
          const listaUnificada = [...d1Mapeadas, ...prev];
          const unicos: SolicitudCita[] = [];

          for (const item of listaUnificada) {
            const clean = (item.pacienteCedula || '').replace(/[^0-9]/g, '');
            const key = clean ? `${clean}-${item.fechaIso}-${item.horaTexto}` : item.id;
            if (!vistasCedula.has(key)) {
              vistasCedula.add(key);
              unicos.push(item);
            }
          }
          return unicos;
        });
      }
    } catch {
      // Fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    cargarCitasDesdeD1();

    const handleActualizacion = () => {
      cargarCitasDesdeD1();
    };
    window.addEventListener('odontosalud_data_updated', handleActualizacion);
    window.addEventListener('storage', handleActualizacion);
    return () => {
      window.removeEventListener('odontosalud_data_updated', handleActualizacion);
      window.removeEventListener('storage', handleActualizacion);
    };
  }, [sedeId]);

  // Abrir modal flotante de cambiar horario
  const handleAbrirModalHorario = (sol: SolicitudCita) => {
    setModalHorario({
      id: sol.id,
      paciente: sol.pacienteNombre,
      hora: sol.horaTexto,
      duracion: sol.duracionMinutos,
    });
  };

  // Confirmar cambio de horario desde el botón flotante de check
  const handleConfirmarModalHorario = async () => {
    if (!modalHorario) return;
    const { id, hora, duracion } = modalHorario;

    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, horaTexto: hora, duracionMinutos: duracion } : s))
    );

    await ApiClient.actualizarEstadoCita(id, 'pendiente', sedeId, undefined, hora);
    mostrarNotificacion(`⏱ Horario actualizado: ${hora} (${duracion} min)`);
    setModalHorario(null);
  };

  // Botón 1: Enviar enlace de confirmación por WhatsApp y aprobar la cita
  const handleEnviarWhatsAppConfirmacion = async (sol: SolicitudCita) => {
    const horaFin = calcularHoraFin(sol.horaTexto, sol.duracionMinutos);
    const cleanPhone = sol.pacienteTelefono.replace(/[^0-9]/g, '');

    const enlaceConfirmacion = `https://odontosaludlv.com/#confirmar?id=${sol.id}&p=${encodeURIComponent(sol.pacienteCedula)}`;

    const mensaje = encodeURIComponent(
      `¡Hola ${sol.pacienteNombre}! Le saludamos de OdontoSalud (${sedeActiva.nombre}). Su cita para *${sol.motivo}* ha sido APROBADA para hoy a las *${sol.horaTexto} a ${horaFin}* (${sol.duracionMinutos} min) en Box 0${sol.boxSugerido} con ${sol.doctorSugerido}.\n\nPara verificar su ficha digital pulse aquí:\n👉 ${enlaceConfirmacion}\n\n¡Le esperamos con puntualidad!`
    );

    // Actualizar estado a confirmada / aprobada
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === sol.id ? { ...s, estado: 'confirmada', confirmacionPaciente: 'confirmado' } : s))
    );

    await ApiClient.actualizarEstadoCita(
      sol.id,
      'confirmada',
      sedeId,
      sol.boxSugerido,
      sol.horaTexto,
      sol.fechaIso,
      sol.doctorSugerido
    );

    // Sincronizar en localStorage para que la vista Ficha la reciba inmediatamente en su carrusel
    try {
      const saved = localStorage.getItem('odontosalud_data_citas');
      let list = saved ? JSON.parse(saved) : [];
      let found = false;
      list = list.map((c: any) => {
        if (c.id === sol.id) {
          found = true;
          return { ...c, estado: 'confirmada', horaInicio: sol.horaTexto, boxNumero: sol.boxSugerido, fechaCita: sol.fechaIso };
        }
        return c;
      });
      if (!found) {
        list.push({
          id: sol.id,
          pacienteNombre: sol.pacienteNombre,
          pacienteCedula: sol.pacienteCedula,
          pacienteTelefono: sol.pacienteTelefono,
          motivo: sol.motivo,
          fechaCita: sol.fechaIso,
          horaInicio: sol.horaTexto,
          boxNumero: sol.boxSugerido,
          doctorNombre: sol.doctorSugerido,
          sedeId,
          estado: 'confirmada',
        });
      }
      localStorage.setItem('odontosalud_data_citas', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('odontosalud_data_updated', { detail: { tipo: 'citas', data: list } }));
    } catch {}

    window.open(`https://wa.me/${cleanPhone}?text=${mensaje}`, '_blank');
    mostrarNotificacion(`💬 Cita de ${sol.pacienteNombre} aprobada y enviada vía WhatsApp.`);
  };

  // Botón Especial (Optimización 3): Notificación Proactiva de Saldo Pendiente por WhatsApp
  const handleEnviarNotificacionSaldoWhatsApp = (sol: SolicitudCita) => {
    const saldo = sol.saldoPendientePrevioUsd || 0;
    if (saldo <= 0) return;

    const cleanPhone = sol.pacienteTelefono.replace(/[^0-9]/g, '');
    const saldoBs = Math.round(saldo * 45.5); // Referencial o tasa activa

    const mensaje = encodeURIComponent(
      `Estimado(a) ${sol.pacienteNombre}, le recordamos cordialmente desde OdontoSalud (${sedeActiva.nombre}) su próxima cita de control de *${sol.motivo}* con ${sol.doctorSugerido} programada para el *${sol.fechaTexto} a las ${sol.horaTexto}*.\n\nLe recordamos que mantiene un saldo pendiente de *$${saldo.toFixed(2)} USD* (aprox. ${saldoBs.toLocaleString('es-VE')} Bs.).\n\nPuede abonar o liquidar previamente por Pago Móvil o en recepción al llegar. Para ver su estado de cuenta en línea pulse aquí:\n👉 https://odontosaludlv.com/#estado-cuenta?p=${encodeURIComponent(sol.pacienteCedula)}\n\n¡Le esperamos!`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${mensaje}`, '_blank');
    mostrarNotificacion(`📲 Recordatorio proactivo de saldo enviado por WhatsApp a ${sol.pacienteNombre}.`);
  };

  // Alternar estado de confirmación del paciente con 1 toque en el badge
  const handleToggleEstadoConfirmacion = (sol: SolicitudCita) => {
    setSolicitudes((prev) =>
      prev.map((s) => {
        if (s.id !== sol.id) return s;
        const nuevoEstado =
          s.confirmacionPaciente === 'confirmado'
            ? 'pendiente'
            : s.confirmacionPaciente === 'enlace_enviado'
            ? 'confirmado'
            : 'enlace_enviado';
        return { ...s, confirmacionPaciente: nuevoEstado };
      })
    );
  };

  // Botón 2: Enviar correo / voucher
  const handleEnviarCorreo = (sol: SolicitudCita) => {
    const horaFin = calcularHoraFin(sol.horaTexto, sol.duracionMinutos);
    const subject = encodeURIComponent(`Detalles de Cita Odontológica - OdontoSalud (${sedeActiva.nombre})`);
    const body = encodeURIComponent(
      `Estimado(a) ${sol.pacienteNombre},\n\nLe confirmamos los datos de su cita en OdontoSalud:\n\n- Fecha: ${sol.fechaTexto} (${sol.fechaIso})\n- Horario: ${sol.horaTexto} a ${horaFin} (${sol.duracionMinutos} min)\n- Especialista: ${sol.doctorSugerido}\n- Tratamiento: ${sol.motivo}\n- Sede: ${sedeActiva.nombre}\n\nOdontoSalud La Victoria & Colonia Tovar`
    );
    window.open(`mailto:${sol.pacienteEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  // Botón 4: Aprobar Cita Individual
  const handleAprobarCita = async (sol: SolicitudCita) => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === sol.id ? { ...s, estado: 'confirmada', confirmacionPaciente: 'confirmado' } : s
      )
    );

    await ApiClient.actualizarEstadoCita(
      sol.id,
      'confirmada',
      sedeId,
      sol.boxSugerido,
      sol.horaTexto,
      sol.fechaIso,
      sol.doctorSugerido
    );

    try {
      const saved = localStorage.getItem('odontosalud_data_citas');
      let list = saved ? JSON.parse(saved) : [];
      let found = false;
      list = list.map((c: any) => {
        if (c.id === sol.id) {
          found = true;
          return { ...c, estado: 'confirmada', horaInicio: sol.horaTexto, boxNumero: sol.boxSugerido };
        }
        return c;
      });
      if (!found) {
        list.push({
          id: sol.id,
          pacienteNombre: sol.pacienteNombre,
          pacienteCedula: sol.pacienteCedula,
          pacienteTelefono: sol.pacienteTelefono,
          motivo: sol.motivo,
          fechaCita: sol.fechaIso,
          horaInicio: sol.horaTexto,
          boxNumero: sol.boxSugerido,
          doctorNombre: sol.doctorSugerido,
          sedeId,
          estado: 'confirmada',
        });
      }
      localStorage.setItem('odontosalud_data_citas', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('odontosalud_data_updated', { detail: { tipo: 'citas', data: list } }));
    } catch {}

    mostrarNotificacion(`✅ Cita de ${sol.pacienteNombre} aprobada en Agenda.`);
  };

  // Manejar selección de cita desde la Matriz Horaria (Scroll suave y resalte luminoso)
  const handleSeleccionarCitaDesdeMatriz = (citaId: string) => {
    setCitaSeleccionadaId(citaId);
    const element = document.getElementById(`cita-card-${citaId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Quitar el foco tras 4 segundos
    setTimeout(() => {
      setCitaSeleccionadaId((prev) => (prev === citaId ? null : prev));
    }, 4000);
  };

  // Manejar asignación directa de cita a un Box y Hora desde la Matriz (Campo de Selección Simple)
  const handleAsignarCitaAHora = async (citaId: string, boxNumero: number, hora: string) => {
    const cita = solicitudes.find((s) => s.id === citaId);
    if (!cita) return;

    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === citaId
          ? { ...s, boxSugerido: boxNumero, horaTexto: hora }
          : s
      )
    );

    await ApiClient.actualizarEstadoCita(
      citaId,
      cita.estado === 'confirmada' ? 'confirmada' : 'pendiente',
      sedeId,
      boxNumero,
      hora
    );

    try {
      const saved = localStorage.getItem('odontosalud_data_citas');
      let list = saved ? JSON.parse(saved) : [];
      let found = false;
      list = list.map((c: any) => {
        if (c.id === citaId) {
          found = true;
          return { ...c, boxNumero, horaInicio: hora };
        }
        return c;
      });
      if (!found) {
        list.push({
          id: cita.id,
          pacienteNombre: cita.pacienteNombre,
          pacienteCedula: cita.pacienteCedula,
          pacienteTelefono: cita.pacienteTelefono,
          motivo: cita.motivo,
          fechaCita: cita.fechaIso,
          horaInicio: hora,
          boxNumero,
          doctorNombre: cita.doctorSugerido,
          sedeId,
          estado: cita.estado,
        });
      }
      localStorage.setItem('odontosalud_data_citas', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('odontosalud_data_updated', { detail: { tipo: 'citas', data: list } }));
    } catch {}

    mostrarNotificacion(`✅ Cita de ${cita.pacienteNombre} asignada al Box 0${boxNumero} a las ${hora}`);
  };

  // Manejar cambio de duración con efecto inmediato sobre el horario en la Matriz con Cascada
  const handleCambiarDuracionCita = async (citaId: string, nuevaDuracion: number) => {
    const cita = solicitudes.find((s) => s.id === citaId);
    if (!cita) return;

    const horaFin = calcularHoraFin(cita.horaTexto, nuevaDuracion);
    const startMins = parseHoraToMinutes(cita.horaTexto);

    setSolicitudes((prev) => {
      // Reajustar duración de esta cita y si se solapa con citas posteriores en el mismo box y fecha, empujarlas en cascada
      const delMismoBoxYDia = prev
        .filter(
          (s) =>
            (s.boxSugerido || 1) === (cita.boxSugerido || 1) &&
            s.fechaIso === cita.fechaIso &&
            s.horaTexto !== 'Por asignar'
        )
        .sort((a, b) => parseHoraToMinutes(a.horaTexto) - parseHoraToMinutes(b.horaTexto));

      let cursor = startMins + nuevaDuracion + 10; // con delay de bioseguridad (10 min)
      const reajustes: Record<string, string> = {};

      delMismoBoxYDia.forEach((c) => {
        if (c.id === citaId) return;
        const cStart = parseHoraToMinutes(c.horaTexto);
        // Si esta cita empezaba después o en la hora modificada y hay solapamiento
        if (cStart >= startMins && cStart < cursor) {
          reajustes[c.id] = formatMinutesToHora(cursor);
          cursor += (c.duracionMinutos || 30) + 10;
        } else if (cStart >= cursor) {
          cursor = cStart + (c.duracionMinutos || 30) + 10;
        }
      });

      return prev.map((s) => {
        if (s.id === citaId) {
          return { ...s, duracionMinutos: nuevaDuracion };
        }
        if (reajustes[s.id]) {
          return { ...s, horaTexto: reajustes[s.id] };
        }
        return s;
      });
    });

    await ApiClient.actualizarEstadoCita(
      citaId,
      cita.estado === 'confirmada' ? 'confirmada' : 'pendiente',
      sedeId,
      cita.boxSugerido,
      cita.horaTexto
    );
    mostrarNotificacion(`⏱ Duración de ${cita.pacienteNombre} ajustada a ${nuevaDuracion}m (${cita.horaTexto} a ${horaFin}) con cascada activa.`);
  };

  // Desasignar o liberar horario de una cita en la Matriz
  const handleLiberarSlotCita = async (citaId: string) => {
    const cita = solicitudes.find((s) => s.id === citaId);
    if (!cita) return;

    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === citaId
          ? { ...s, horaTexto: 'Por asignar' }
          : s
      )
    );

    mostrarNotificacion(`🔄 Espacio liberado en sillón. Cita de ${cita.pacienteNombre} disponible para reasignar.`);
  };

  // Manejar asignación de un hueco libre desde la Matriz Horaria
  const handleAsignarHuecoLibre = (box: number, hora: string) => {
    const pendiente = solicitudes.find((s) => s.estado === 'por_confirmar' || s.estado === 'espera' || s.horaTexto === 'Por asignar');
    if (pendiente) {
      handleAsignarCitaAHora(pendiente.id, box, hora);
    } else {
      mostrarNotificacion(`ℹ️ Box 0${box} disponible a las ${hora}. Seleccione una cita del desplegable.`);
    }
  };

  // Conteo por días para los botones de Ayer, Hoy y Mañana
  const countAyer = solicitudes.filter(
    (s) => s.fechaTexto === 'Ayer' || s.fechaIso === fechasRelativas.ayerIso
  ).length;
  const countHoy = solicitudes.filter(
    (s) => s.fechaTexto === 'Hoy' || s.fechaIso === fechasRelativas.hoyIso
  ).length;
  const countManana = solicitudes.filter(
    (s) => s.fechaTexto === 'Mañana' || s.fechaIso === fechasRelativas.mananaIso
  ).length;

  // Filtrado reactivo por Día, Categoría y Búsqueda
  const solicitudesFiltradas = solicitudes.filter((sol) => {
    if (filtroDia === 'ayer') {
      const matchAyer = sol.fechaTexto === 'Ayer' || sol.fechaIso === fechasRelativas.ayerIso;
      if (!matchAyer) return false;
    } else if (filtroDia === 'hoy') {
      const matchHoy = sol.fechaTexto === 'Hoy' || sol.fechaIso === fechasRelativas.hoyIso;
      if (!matchHoy) return false;
    } else if (filtroDia === 'manana') {
      const matchManana = sol.fechaTexto === 'Mañana' || sol.fechaIso === fechasRelativas.mananaIso;
      if (!matchManana) return false;
    }

    if (filtroCategoria === 'por_confirmar' && sol.estado !== 'por_confirmar') return false;
    if (filtroCategoria === 'urgencias' && sol.tipo !== 'urgencia') return false;

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const coincide =
        sol.pacienteNombre.toLowerCase().includes(q) ||
        sol.pacienteCedula.toLowerCase().includes(q) ||
        sol.pacienteTelefono.toLowerCase().includes(q) ||
        sol.motivo.toLowerCase().includes(q);
      if (!coincide) return false;
    }

    return true;
  });

  // ORDEN CRONOLÓGICO ESTRICTO: De más temprano a más tarde
  const solicitudesOrdenadas = useMemo(() => {
    return [...solicitudesFiltradas].sort((a, b) => {
      const minA = parseHoraToMinutes(a.horaTexto);
      const minB = parseHoraToMinutes(b.horaTexto);
      return minA - minB;
    });
  }, [solicitudesFiltradas]);

  return (
    <div className="flex flex-col gap-4 pb-20 animate-in fade-in duration-200">
      {/* Toast de confirmación */}
      {toastMsg && (
        <div className="fixed top-20 left-4 right-4 z-50 p-3 bg-dental-deep-navy text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center justify-between border border-primary animate-in slide-in-from-top duration-200 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-white/60 hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          1. HEADER PRINCIPAL Y BOTONES DE AYER, HOY, MAÑANA
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-vibrant-cyan">fact_check</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary block leading-none">
                Recepción & Triaje Digital
              </span>
              <h1 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy mt-1 leading-tight">
                Citas Previas Web & Chat
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              cargarCitasDesdeD1();
              mostrarNotificacion('Sincronizado en vivo con Cloudflare D1');
            }}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-dental-deep-navy text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <span className={`material-symbols-outlined text-[16px] text-primary ${isRefreshing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isRefreshing ? 'Sincronizando...' : 'Refrescar'}</span>
          </button>
        </div>

        {/* Botones de Fecha: Ayer, Hoy, Mañana */}
        <div className="p-1.5 rounded-2xl bg-surface-subtle-ice border border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-1.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setFiltroDia('ayer')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-1 border ${
              filtroDia === 'ayer'
                ? 'bg-dental-deep-navy text-white border-dental-deep-navy shadow-xs'
                : 'bg-white text-dental-deep-navy border-border-subtle hover:bg-surface-container'
            }`}
          >
            <span className="truncate">{fechasRelativas.ayerLabel}</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0 ${filtroDia === 'ayer' ? 'bg-white/20 text-white' : 'bg-surface-subtle-ice text-secondary'}`}>
              {countAyer}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroDia('hoy')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-1 border ${
              filtroDia === 'hoy'
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-white text-dental-deep-navy border-border-subtle hover:bg-surface-container'
            }`}
          >
            <span className="truncate">{fechasRelativas.hoyLabel}</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0 ${filtroDia === 'hoy' ? 'bg-white/20 text-white' : 'bg-surface-subtle-ice text-secondary'}`}>
              {countHoy}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroDia('manana')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-1 border ${
              filtroDia === 'manana'
                ? 'bg-dental-deep-navy text-white border-dental-deep-navy shadow-xs'
                : 'bg-white text-dental-deep-navy border-border-subtle hover:bg-surface-container'
            }`}
          >
            <span className="truncate">{fechasRelativas.mananaLabel}</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0 ${filtroDia === 'manana' ? 'bg-white/20 text-white' : 'bg-surface-subtle-ice text-secondary'}`}>
              {countManana}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroDia('todos')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-1 border ${
              filtroDia === 'todos'
                ? 'bg-secondary text-white border-secondary shadow-xs'
                : 'bg-white text-dental-deep-navy border-border-subtle hover:bg-surface-container'
            }`}
          >
            <span className="truncate">Todas</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0 ${filtroDia === 'todos' ? 'bg-white/20 text-white' : 'bg-surface-subtle-ice text-secondary'}`}>
              {solicitudes.length}
            </span>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div className="mt-2.5 relative">
          <span className="material-symbols-outlined text-[17px] text-secondary absolute left-3 top-2.5">
            search
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por paciente, cédula o tratamiento..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-subtle-ice border border-border-subtle focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-dental-deep-navy placeholder:text-secondary"
          />
        </div>
      </section>

      {/* =========================================================================
          2. MATRIZ HORARIA CLÍNICA POR SILLÓN / BOX POR SEDE (PROPUESTA A)
         ========================================================================= */}
      <ClinicalScheduleMatrix
        solicitudes={solicitudesFiltradas}
        todasSolicitudes={solicitudes}
        sedeSeleccionada={sedeMatriz}
        onCambiarSede={setSedeMatriz}
        turnoSeleccionado={turnoMatriz}
        onCambiarTurno={setTurnoMatriz}
        filtroDia={filtroDia}
        onSeleccionarCita={handleSeleccionarCitaDesdeMatriz}
        onAsignarHuecoLibre={handleAsignarHuecoLibre}
        onAsignarCitaAHora={handleAsignarCitaAHora}
        onCambiarDuracionCita={handleCambiarDuracionCita}
        onLiberarSlotCita={handleLiberarSlotCita}
        onEnviarWhatsApp={handleEnviarWhatsAppConfirmacion}
        onToggleConfirmacion={handleToggleEstadoConfirmacion}
        onVerHistoriaClinica={(sol) => setModalHistoriaPaciente(sol)}
      />

      {/* =========================================================================
          3. LISTA DE TARJETAS LIMPIAS (SOLO INFORMACIÓN ESENCIAL)
         ========================================================================= */}
      <div className="space-y-3">
        {solicitudesOrdenadas.map((sol) => {
          const horaFin = calcularHoraFin(sol.horaTexto, sol.duracionMinutos);
          const isConfirmada = sol.estado === 'confirmada';
          const isSelected = citaSeleccionadaId === sol.id;

          return (
            <div
              key={sol.id}
              id={`cita-card-${sol.id}`}
              className={`bg-surface-clean-white rounded-2xl p-4 shadow-sm border transition-all duration-300 relative overflow-hidden flex flex-col gap-2.5 ${
                isSelected
                  ? 'ring-2 ring-primary border-primary shadow-soft-elevated scale-[1.01]'
                  : sol.tipo === 'urgencia'
                  ? 'border-status-danger/40 ring-1 ring-status-danger/10'
                  : isConfirmada
                  ? 'border-status-success/40'
                  : 'border-border-subtle hover:border-primary/40'
              }`}
            >
              {/* Línea sutil de acento izquierdo */}
              <div
                className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  sol.tipo === 'urgencia'
                    ? 'bg-status-danger'
                    : isConfirmada
                    ? 'bg-status-success'
                    : 'bg-primary'
                }`}
              />

              {/* FILA 1: Horario + Badges Esenciales + Estado de Confirmación WhatsApp */}
              <div className="flex items-center justify-between gap-2 flex-wrap pl-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Horario Principal */}
                  <span className="px-2.5 py-0.5 rounded-lg bg-dental-deep-navy text-white text-xs font-black tracking-tight shadow-2xs">
                    {sol.horaTexto} - {horaFin}
                  </span>

                  <span className="text-[10px] font-bold text-secondary">
                    ({sol.duracionMinutos} min)
                  </span>

                  {/* Tipo */}
                  {sol.tipo === 'urgencia' ? (
                    <span className="px-2 py-0.2 rounded-md bg-status-danger/15 text-status-danger text-[10px] font-extrabold">
                      🚨 Urgencia
                    </span>
                  ) : sol.tipo === 'control' ? (
                    <span className="px-2 py-0.2 rounded-md bg-electric-blue/15 text-electric-blue text-[10px] font-bold">
                      Control
                    </span>
                  ) : (
                    <span className="px-2 py-0.2 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                      Nuevo
                    </span>
                  )}

                  <span className="text-[10px] text-secondary">• {sol.tiempoTranscurrido}</span>
                </div>

                {/* Badge de Estado de Confirmación por WhatsApp (interactivo al toque) */}
                <button
                  type="button"
                  onClick={() => handleToggleEstadoConfirmacion(sol)}
                  className="cursor-pointer select-none"
                  title="Toca para cambiar estado de confirmación del paciente"
                >
                  {sol.confirmacionPaciente === 'confirmado' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1 border border-emerald-300">
                      <span className="material-symbols-outlined text-[13px] text-emerald-600">verified</span>
                      <span>Confirmado por Paciente</span>
                    </span>
                  ) : sol.confirmacionPaciente === 'enlace_enviado' ? (
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black inline-flex items-center gap-1 border border-sky-300">
                      <span className="material-symbols-outlined text-[13px] text-sky-600">forward_to_inbox</span>
                      <span>Enlace WhatsApp Enviado</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-surface-subtle-ice text-secondary text-[10px] font-bold border border-border-subtle inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Pendiente WhatsApp</span>
                    </span>
                  )}
                </button>
              </div>

              {/* FILA 2: Información Esencial del Paciente */}
              <div className="flex items-center gap-3 pl-1">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-xs shrink-0 ${
                    sol.tipo === 'urgencia'
                      ? 'bg-status-danger/10 text-status-danger'
                      : isConfirmada
                      ? 'bg-status-success/10 text-status-success'
                      : 'bg-surface-container text-primary'
                  }`}
                >
                  {sol.pacienteNombre.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-display font-extrabold text-sm text-dental-deep-navy truncate leading-tight">
                      {sol.pacienteNombre}
                    </h3>
                    <span className="text-[11px] font-mono text-secondary shrink-0">
                      {sol.pacienteCedula}
                    </span>
                  </div>

                  <p className="text-xs text-dental-deep-navy font-medium truncate mt-0.5">
                    {sol.motivo}
                  </p>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-secondary">
                    <span>{sol.pacienteTelefono}</span>
                    <span>•</span>
                    <span className="font-bold text-primary truncate">{sol.doctorSugerido}</span>
                  </div>
                </div>
              </div>

              {/* Indicadores Financieros / Conciliación de Citas */}
              {(sol.montoReservaUsd || sol.saldoPendientePrevioUsd) && (
                <div className="flex items-center gap-2 flex-wrap pl-1 text-[11px]">
                  {sol.montoReservaUsd && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1 shadow-2xs">
                      <span className="material-symbols-outlined text-[13px] text-emerald-600">payments</span>
                      <span>Abono Reserva: <strong>${sol.montoReservaUsd} USD</strong></span>
                      {sol.referenciaReserva && (
                        <span className="text-[10px] text-emerald-700 font-mono">({sol.referenciaReserva})</span>
                      )}
                    </span>
                  )}
                  {sol.saldoPendientePrevioUsd && (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold flex items-center gap-1 shadow-2xs">
                        <span className="material-symbols-outlined text-[13px] text-amber-600">warning</span>
                        <span>Deuda previa: <strong>${sol.saldoPendientePrevioUsd} USD</strong></span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEnviarNotificacionSaldoWhatsApp(sol)}
                        className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        title="Enviar recordatorio cordial de saldo pendiente por WhatsApp"
                      >
                        <span className="material-symbols-outlined text-[12px]">send</span>
                        <span>Cobro WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Nota de recepción compacta si existe */}
              {sol.notaRecepcion && (
                <div className="px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 flex items-center gap-1.5 pl-1.5">
                  <span className="material-symbols-outlined text-[14px] text-amber-700 shrink-0">info</span>
                  <span className="truncate">{sol.notaRecepcion}</span>
                </div>
              )}

              {/* ===================================================================
                  FILA 3: EXACTAMENTE CUATRO BOTONES EN EL PIE DE LA TARJETA
                  1. WhatsApp (con enlace de confirmación)
                  2. Correo
                  3. Cambiar Horario (a la izquierda de Aprobar)
                  4. Aprobar Cita
                 =================================================================== */}
              <div className="pt-2 border-t border-border-subtle/70 flex items-center justify-between gap-1.5 pl-1">
                {/* Botón 1, 2 y 3: Canales de contacto & Historia Clínica */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Botón 1: WhatsApp con Enlace de Confirmación al Paciente */}
                  <button
                    type="button"
                    onClick={() => handleEnviarWhatsAppConfirmacion(sol)}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                    title="Enviar enlace de confirmación por WhatsApp"
                  >
                    <span className="material-symbols-outlined text-[17px] text-emerald-600">chat</span>
                    <span className="hidden sm:inline text-[11px]">WhatsApp</span>
                  </button>

                  {/* Botón 2: Historia Clínica Digital en esta misma interfaz */}
                  <button
                    type="button"
                    onClick={() => setModalHistoriaPaciente(sol)}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-dental-deep-navy hover:bg-primary text-white border border-dental-deep-navy text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                    title="Ver Historia Clínica Digital del paciente"
                  >
                    <span className="material-symbols-outlined text-[17px] text-vibrant-cyan">clinical_notes</span>
                    <span className="hidden sm:inline text-[11px]">Historia</span>
                  </button>

                  {/* Botón 3: Correo Directo */}
                  <button
                    type="button"
                    onClick={() => handleEnviarCorreo(sol)}
                    className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-surface-container text-dental-deep-navy border border-border-subtle text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                    title="Enviar confirmación por correo electrónico"
                  >
                    <span className="material-symbols-outlined text-[17px] text-primary">mail</span>
                    <span className="hidden sm:inline text-[11px]">Correo</span>
                  </button>
                </div>

                {/* Botón 3 y 4: Gestión Odontológica */}
                <div className="flex items-center gap-1.5">
                  {/* Botón 3: Cambiar Horario (va al lado izquierdo de Aprobar Cita) */}
                  <button
                    type="button"
                    onClick={() => handleAbrirModalHorario(sol)}
                    className="px-2.5 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-dental-deep-navy text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                    title="Ajustar hora y duración en tiempo real"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">edit_calendar</span>
                    <span className="text-[11px]">Cambiar Horario</span>
                  </button>

                  {/* Botón 4: Aprobar Cita */}
                  {!isConfirmada ? (
                    <button
                      type="button"
                      onClick={() => handleAprobarCita(sol)}
                      className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-vibrant-cyan">verified</span>
                      <span className="text-[11px]">Aprobar Cita</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-status-success/15 text-status-success border border-status-success/30 text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span className="text-[11px]">Aprobada</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          3. FORMULARIO FLOTANTE DE CAMBIAR HORARIO (MODAL EN 2 COLUMNAS + CHECK FLOTANTE)
             - 2 Columnas precisas: Selección de Hora & Duración en minutos
             - Sin texto de apoyo
             - Sin campo sillón
             - Botón flotante con icono de check para confirmar
         ========================================================================= */}
      {modalHorario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dental-deep-navy/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-clean-white rounded-3xl p-5 shadow-2xl border border-border-subtle max-w-sm w-full relative animate-in zoom-in-95 duration-150">
            {/* Cabecera del modal flotante */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </span>
                <div>
                  <h3 className="font-display font-extrabold text-xs text-dental-deep-navy">
                    Cambiar Horario
                  </h3>
                  <p className="text-[11px] text-secondary truncate max-w-[190px]">
                    {modalHorario.paciente}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalHorario(null)}
                className="w-7 h-7 rounded-lg bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* 02 Columnas precisas: Selección de Hora y Duración en minutos sin texto de apoyo */}
            <div className="grid grid-cols-2 gap-3 my-4">
              {/* Columna 1: Hora de Inicio */}
              <div>
                <label className="text-[10px] font-black uppercase text-secondary block mb-1">
                  Hora:
                </label>
                <select
                  value={modalHorario.hora}
                  onChange={(e) => setModalHorario({ ...modalHorario, hora: e.target.value })}
                  className="w-full p-2.5 text-xs font-bold rounded-xl bg-surface-subtle-ice border border-border-subtle text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {HORAS_DISPONIBLES.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Columna 2: Duración en minutos sin texto de apoyo */}
              <div>
                <label className="text-[10px] font-black uppercase text-secondary block mb-1">
                  Duración:
                </label>
                <select
                  value={modalHorario.duracion}
                  onChange={(e) =>
                    setModalHorario({ ...modalHorario, duracion: Number(e.target.value) })
                  }
                  className="w-full p-2.5 text-xs font-bold rounded-xl bg-surface-subtle-ice border border-border-subtle text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {DURACIONES_DISPONIBLES.map((d) => (
                    <option key={d.min} value={d.min}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resumen dinámico compacto */}
            <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                <span>
                  {modalHorario.hora} a {calcularHoraFin(modalHorario.hora, modalHorario.duracion)}
                </span>
              </span>
              <span className="text-[11px] text-primary font-black">
                {modalHorario.duracion} min
              </span>
            </div>

            {/* Botón flotante ergonómico de check para confirmar sin afectar la visualización */}
            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleConfirmarModalHorario}
                className="h-10 px-4 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                title="Confirmar y aplicar horario"
              >
                <span className="material-symbols-outlined text-[18px] text-vibrant-cyan">check</span>
                <span>Confirmar Horario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MODAL DE HISTORIA CLÍNICA DIGITAL EN LA MISMA INTERFAZ
             (ACCESO DIRECTO DESDE LA MATRIZ HORARIA Y DESDE LAS TARJETAS)
         ========================================================================= */}
      <PatientClinicalHistoryModal
        solicitud={modalHistoriaPaciente}
        onClose={() => setModalHistoriaPaciente(null)}
        onIrAFichaCompleta={(pacienteId) => {
          setModalHistoriaPaciente(null);
          if (onNavigateTab) {
            onNavigateTab('odontograma');
          }
        }}
      />
    </div>
  );
};
