export type SedeId = 'victoria' | 'tovar';

export interface BoxInfo {
  numero: number;
  nombre: string;
  especialidad: string;
  doctorDefault?: string;
}

export interface SedeInfo {
  id: SedeId;
  nombre: string;
  subtitulo: string;
  direccion: string;
  ciudad?: string;
  estadoVzla?: string;
  googleMapsUrl?: string;
  telefono: string;
  whatsapp: string;
  email: string;
  totalBoxes: number;
  boxes?: BoxInfo[];
  horarioApertura?: string;
  horarioCierre?: string;
  turnoManana?: string;
  turnoTarde?: string;
  diasAtencion?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  webUrl?: string;
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

export type ProcedimientoGeneralOdontograma =
  | 'ninguno'
  | 'endodoncia'
  | 'exodoncia'
  | 'protesis'
  | 'implante'
  | 'corona';

export interface ToothRecord {
  numeroFdi: number;
  nombre: string;
  surfaces: ToothSurfaces;
  isAbsent?: boolean;
  procedimientoGeneral?: ProcedimientoGeneralOdontograma;
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
  sexo?: 'Femenino' | 'Masculino' | 'Otro' | string;
  condicionMedicaId?: string;
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
  pacienteEmail?: string;
  pacienteSexo?: string;
  pacienteFechaNacimiento?: string;
  condicionMedicaId?: string;
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
  pacienteCedula?: string;
  pacienteTelefono?: string;
  pacienteEmail?: string;
  sedeId: SedeId;
  montoTotalUsd: number;
  montoAbonadoUsd: number;
  saldoPendienteUsd?: number;
  tasaBcvReferencia: number;
  procedimiento?: string;
  estado: 'borrador' | 'en_espera' | 'aprobado_parcial' | 'pagado' | 'anulado';
  createdAt: string;
  abonoReservaCitaUsd?: number;
  referenciaReservaCita?: string;
  esCitaHoy?: boolean;
  doctorTratante?: string;
}

export type MetodoPago =
  | 'pago_movil'
  | 'efectivo_usd'
  | 'efectivo_bs'
  | 'punto_venta'
  | 'transferencia'
  | 'divisas_efectivo'
  | 'zelle';

export interface PagoRegistroRequest {
  presupuestoId: string;
  montoUsd: number;
  metodo: MetodoPago;
  referencia?: string;
  tasaBcv?: number;
  tipoPago?: 'completo' | 'abono';
  fotoComprobanteData?: string;
  sha256Hash?: string;
  selladoUtc?: string;
  sedeId?: SedeId;
}

export interface PagoItem {
  id: string;
  presupuestoId: string;
  presupuestoCodigo?: string;
  pacienteNombre?: string;
  pacienteCedula?: string;
  procedimiento?: string;
  sedeId?: SedeId;
  montoUsd: number;
  montoBs?: number;
  tasaBcv: number;
  metodo: MetodoPago | string;
  referencia?: string;
  tipoPago?: 'completo' | 'abono';
  fotoComprobanteData?: string;
  sha256Hash?: string;
  selladoUtc?: string;
  estado?: 'confirmado' | 'pendiente_ocr' | 'conciliado';
  fechaPago: string;
}

export interface CierreDiarioItem {
  id: string;
  sedeId: SedeId | 'ambas';
  fecha: string;
  totalUsd: number;
  totalBs: number;
  tasaBcv: number;
  totalVictoriaUsd?: number;
  totalVictoriaBs?: number;
  totalTovarUsd?: number;
  totalTovarBs?: number;
  totalEfectivoUsd: number;
  totalEfectivoBs: number;
  totalPagoMovilBs: number;
  totalPuntoVentaBs: number;
  totalTransferenciaBs: number;
  cantidadPagos: number;
  cerradoPor?: string;
  observaciones?: string;
  createdAt: string;
}

export interface RegistrarCierreDiarioRequest {
  sedeId: SedeId | 'ambas';
  fecha?: string;
  tasaBcv: number;
  cerradoPor?: string;
  observaciones?: string;
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
  accionTab?: 'coordinacion' | 'cobros' | 'agenda' | 'odontograma' | 'data';
  meta?: any;
}

export type DiaSemanaClinico = 'LUN' | 'MAR' | 'MIÉ' | 'JUE' | 'VIE' | 'SÁB';

export interface OdontologoItem {
  id: string;
  nombres: string;
  cedula: string;
  cov: string;
  especialidad: string;
  telefono: string;
  email: string;
  sedeId: SedeId | 'ambas';
  boxAsignado: number;
  turno: 'Mañana' | 'Tarde' | 'Completo';
  porcentajeHonorarios: number;
  estado: 'activo' | 'en_guardia' | 'descanso';
  avatar?: string;
  diasVictoria?: DiaSemanaClinico[];
  diasTovar?: DiaSemanaClinico[];
}

export interface HigienistaItem {
  id: string;
  nombres: string;
  cedula: string;
  registroMpps: string;
  areaEspecialidad: string;
  telefono: string;
  sedeId: SedeId | 'ambas';
  boxApoyo: number;
  doctorAsignado: string;
  turno: 'Mañana' | 'Tarde' | 'Completo';
  estado: 'activo' | 'esterilizacion' | 'descanso';
}

export interface TratamientoItem {
  id: string;
  codigo: string;
  nombre: string;
  categoria:
    | 'Prevención & Profilaxis'
    | 'Operatoria & Estética'
    | 'Endodoncia'
    | 'Ortodoncia'
    | 'Cirugía & Exodoncia'
    | 'Prótesis & Implantes'
    | 'Diagnóstico & RX';
  descripcion: string;
  duracionMinutos: number;
  costoUsd: number;
  costoInsumosUsd: number;
  requiereRx: boolean;
  activo: boolean;
}

export interface PacienteItem {
  id: string;
  nombres: string;
  cedula: string;
  telefono: string;
  email?: string;
  sexo?: 'Femenino' | 'Masculino' | 'Otro';
  fechaNacimiento?: string;
  condicionMedicaId?: string;
  motivo?: string;
  fechaCita?: string;
  horaInicio?: string;
  doctorNombre?: string;
  sedeId: SedeId | 'ambas';
  estado?: 'pendiente' | 'confirmada' | 'en_sillon' | 'completada' | 'cancelada';
  esUrgencia?: boolean;
  avatarUrl?: string;
}

export interface CondicionMedicaItem {
  id: string;
  codigoCie: string;
  nombre: string;
  categoria: 'Cardiovascular' | 'Endocrina & Metabólica' | 'Alergias & Farmacología' | 'Hematológica & Coagulación' | 'Infecciosa & Respiratoria' | 'Neurológica' | 'Especial & Gestación';
  nivelRiesgo: 'Bajo' | 'Moderado' | 'Alto' | 'Crítico';
  manifestacionBucal: string;
  protocoloDental: string;
  anestesicoContraindicado?: string;
  requiereProfilaxisAntibiotica: boolean;
  activo: boolean;
}

export interface TratamientoRealizadoItem {
  id: string;
  pacienteId: string;
  pacienteNombre?: string;
  pacienteCedula?: string;
  odontologoId: string;
  odontologoNombre?: string;
  tratamientoId: string;
  tratamientoCodigo?: string;
  tratamientoNombre?: string;
  presupuestoId?: string;
  citaId?: string;
  dienteNumero?: number;
  superficie?: string;
  diagnosticoCie?: string;
  observaciones?: string;
  costoTotalUsd: number;
  porcentajeHonorario: number;
  montoHonorarioUsd: number;
  tasaBcvAplicada?: number;
  montoHonorarioBs?: number;
  estadoPagoHonorario: 'pendiente' | 'liquidado';
  fechaLiquidacion?: string;
  referenciaLiquidacion?: string;
  comprobanteLiquidacion?: string;
  sha256HashLiquidacion?: string;
  boxNumero?: number;
  sedeId: SedeId;
  fechaRealizacion: string;
  createdAt?: string;
}

export interface LiquidarHonorariosRequest {
  ids: string[];
  referencia: string;
  fechaLiquidacion?: string;
  comprobanteData?: string;
  sha256Hash?: string;
}

export interface EvolucionClinicaItem {
  id: string;
  pacienteId: string;
  citaId?: string;
  odontologoId?: string;
  odontologoNombre: string;
  piezaFdi?: number;
  texto: string;
  indicacionesReceta?: string;
  fotoPrescripcionData?: string;
  tipoAdjunto?: 'receta' | 'indicaciones' | 'reposo';
  sha256Hash?: string;
  selladoUtc?: string;
  esNotaComplementaria?: boolean;
  evolucionPadreId?: string;
  fecha?: string;
  createdAt?: string;
}

export interface RadiografiaItem {
  id: string;
  pacienteId: string;
  piezaFdi?: number;
  tipo: 'periapical_rvg' | 'panoramica' | 'foto_intraoral';
  r2StorageUrl?: string;
  imagenData?: string;
  observaciones?: string;
  sha256Hash?: string;
  selladoUtc?: string;
  doctorFirmante?: string;
  fechaToma: string;
}

export type CorporatePaletteId =
  | 'palette-14-luxury-plum'
  | 'palette-13-deep-teal'
  | 'palette-12-trust-navy'
  | 'palette-15-enterprise-navy';

export interface CorporatePaletteConfig {
  id: CorporatePaletteId;
  numeroCatalogo: string;
  nombre: string;
  subtitulo: string;
  colors: {
    obsidian: string;
    aubergine: string;
    royalPlum: string;
    mauve: string;
    lilac: string;
    silk: string;
    surfaceBg: string;
  };
}

export interface AuditoriaAccionItem {
  id: string;
  modulo: 'odontograma' | 'presupuesto' | 'cobros' | 'cierre_caja' | 'paleta_corporativa' | 'seguridad_forense';
  accion: string;
  actor: string;
  sedeId: SedeId | 'ambas';
  entidadId?: string;
  detalle: string;
  sha256Hash?: string;
  ipCliente?: string;
  createdAt: string;
}

export interface EdgeHealthMetrics {
  status: 'healthy' | 'degraded';
  anycastLatencyMs: number;
  slaTargetMs: number;
  slaCompliant: boolean;
  d1Stats: {
    connected: boolean;
    totalPacientes: number;
    totalCitas: number;
    totalPresupuestos: number;
    totalPagos: number;
    totalCierresDiarios: number;
    totalAuditorias: number;
    totalSellosForenses: number;
  };
  kvStats: {
    available: boolean;
    activePalette: CorporatePaletteId;
    bcvCached: boolean;
    rateLimiterActive: boolean;
  };
  r2Stats: {
    available: boolean;
    streamingMode: 'ReadableStream Zero-RAM' | 'D1 Hybrid Fallback';
    totalRadiografias: number;
  };
  timestamp: string;
}

export interface InventarioItem {
  id: string;
  codigo: string;
  nombre: string;
  categoria:
    | 'Restauración / Operatoria'
    | 'Endodoncia'
    | 'Bioseguridad & Desinfección'
    | 'Cirugía & Periodoncia'
    | 'Ortodoncia'
    | 'Prótesis & Impresión'
    | 'Anestesia & Farmacia';
  stockActual: number;
  stockMinimo: number;
  unidadMedida: 'Caja' | 'Tubo / Jeringa' | 'Frasco' | 'Paquete' | 'Unidad' | 'Cartucho (Carpule)' | 'Galón';
  precioCompraUsd: number;
  fechaIngreso: string;
  fechaSalida?: string;
  lote: string;
  sedeId: SedeId | 'ambas';
  estado: 'disponible' | 'bajo_stock' | 'agotado';
  observaciones?: string;
}

export interface LaboratorioItem {
  id: string;
  ordenCodigo: string;
  laboratorioNombre: string;
  tecnicoResponsable: string;
  telefonoContacto: string;
  pacienteNombre: string;
  pacienteCedula: string;
  doctorTratante: string;
  tipoTrabajo:
    | 'Corona Zirconio Monolítico'
    | 'Corona Metal-Porcelana'
    | 'Prótesis Parcial Removible'
    | 'Prótesis Total Acrílica'
    | 'Carilla Cerámica E-Max'
    | 'Incrustación Onlay / Inlay'
    | 'Retenedor Essix / Hawley'
    | 'Guía Quirúrgica Implantología';
  piezaDiente?: string;
  colorGuiaVita: string;
  costoLaboratorioUsd: number;
  fechaEnvio: string;
  fechaPrometidaEntrega: string;
  fechaPruebaBoca?: string;
  estado: 'en_laboratorio' | 'en_prueba_bizcocho' | 'listo_en_clinica' | 'instalado_al_paciente';
  sedeId: SedeId;
  observaciones?: string;
}


