export type SedeId = 'victoria' | 'tovar';

export interface SedeInfo {
  id: SedeId;
  nombre: string;
  subtitulo: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  totalBoxes: number;
}

export type ToothFace = 'V' | 'M' | 'O' | 'D' | 'L';

export type ToothFaceStatus = 'sano' | 'caries' | 'resina' | 'corona' | 'ausente';

export interface ToothSurfaces {
  V: ToothFaceStatus;
  M: ToothFaceStatus;
  O: ToothFaceStatus;
  D: ToothFaceStatus;
  L: ToothFaceStatus;
}

export interface ToothRecord {
  numeroFdi: number;
  nombre: string;
  surfaces: ToothSurfaces;
  isAbsent?: boolean;
  diagnostico?: string;
  actualizadoPor?: string;
  updatedAt?: string;
}

export interface Paciente {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email?: string;
  alergias?: string;
  seguroNombre?: string;
  fechaNacimiento?: string;
  avatarUrl?: string;
}

export interface Cita {
  id: string;
  sedeId: SedeId;
  pacienteId: string;
  pacienteNombre: string;
  pacienteCedula: string;
  pacienteTelefono: string;
  pacienteAvatar?: string;
  doctorNombre: string;
  boxNumero: number;
  fechaCita: string;
  horaInicio: string;
  motivo: string;
  estado: 'pendiente' | 'confirmada' | 'en_sillon' | 'completada' | 'cancelada';
  esUrgencia: boolean;
  minutosTranscurridos?: number;
  montoEstimado?: number;
}

export interface BoxStatus {
  boxNumero: number;
  estado: 'ocupado' | 'disponible' | 'limpieza';
  doctorNombre?: string;
  pacienteNombre?: string;
  procedimiento?: string;
}

export interface DashboardPulse {
  sede: SedeId;
  citasHoy: Cita[];
  boxes: BoxStatus[];
  metricas: {
    citasTotal: number;
    enEspera: number;
    ocupacionPorcentaje: number;
    presupuestosPendientesUsd: number;
    cobradoHoyUsd: number;
  };
  tasaBcv: number;
  timestamp: string;
}

export interface Presupuesto {
  id: string;
  codigo: string;
  pacienteId: string;
  pacienteNombre: string;
  sedeId: SedeId;
  montoTotalUsd: number;
  montoAbonadoUsd: number;
  tasaBcvReferencia: number;
  estado: 'borrador' | 'en_espera' | 'aprobado_parcial' | 'pagado' | 'anulado';
  createdAt: string;
}

export interface PagoRegistroRequest {
  presupuestoId: string;
  montoUsd: number;
  metodo: 'pago_movil' | 'divisas_efectivo' | 'zelle' | 'punto_venta';
  referencia?: string;
  tasaBcv?: number;
}

export interface TasaCambioInfo {
  moneda: string;
  tasa: number;
  fuente: string;
  fechaActualizacion: string;
  esManual: boolean;
  origen?: 'live_network' | 'manual_override' | 'fallback_d1' | 'contingency';
}

export interface NotificacionItem {
  id: string;
  tipo: 'tasa_bcv' | 'cita_triaje' | 'alerta_clinica';
  titulo: string;
  mensaje: string;
  timestamp: string;
  leido: boolean;
  accionTab?: 'coordinacion' | 'cobros' | 'agenda' | 'odontograma';
  meta?: any;
}
