import React, { useState, useEffect, useRef } from 'react';
import { useSede, SEDES_DISPONIBLES } from '../../context/SedeContext';
import { ApiClient } from '../../services/api';
import { TabId } from '../layout/BottomNavigation';
import {
  Cita,
  CondicionMedicaItem,
  DiaSemanaClinico,
  OdontologoItem,
  PacienteItem,
  SedeId,
} from '../../types/clinical';
import {
  DIAS_SEMANA_CLINICOS,
  INITIAL_ODONTOLOGOS as INITIAL_ODONTOLOGOS_MASTER,
  normalizarDisponibilidadOdontologo,
  normalizarListaOdontologos,
} from '../../hooks/useOdontologos';
import { compressImage } from '../../utils/imageCompression';

interface DoctorOption {
  id: string;
  nombre: string;
  titulo: string;
  especialidad: string;
  box: number;
  avatar: string;
  turno?: 'Mañana' | 'Tarde' | 'Completo' | string;
  estado?: string;
  esTitular?: boolean;
  sedeId?: SedeId | 'ambas';
  diasVictoria?: DiaSemanaClinico[];
  diasTovar?: DiaSemanaClinico[];
}

interface BookingFlowProps {
  onBack?: () => void;
  onNavigateTab?: (tab: TabId) => void;
}

type BookingStep = 'sede' | 'doctor' | 'treatment' | 'datetime' | 'patient';

/**
 * Normaliza cualquier formato de fecha (DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD)
 * al estándar ISO requerido por el navegador para <input type="date">: YYYY-MM-DD
 */
function normalizarFechaInput(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return trimmed;
}

const INITIAL_ODONTOLOGOS_FALLBACK: OdontologoItem[] = INITIAL_ODONTOLOGOS_MASTER;

const INITIAL_PACIENTES_FALLBACK: PacienteItem[] = [
  {
    id: 'pac-raymond',
    nombres: 'Raymond Gilbonio',
    cedula: 'V-16.762.319',
    telefono: '04126841381',
    email: 'raymond.gilbonio@odontosaludlv.com',
    sexo: 'Masculino',
    fechaNacimiento: '1982-10-15',
    condicionMedicaId: 'med-1',
    motivo: 'Evaluación Integral Odontológica',
    fechaCita: '2024-10-25',
    horaInicio: '09:00 AM',
    doctorNombre: 'Dra. Maria Alejandra Dominguez Hernández',
    sedeId: 'victoria',
    estado: 'confirmada',
    esUrgencia: false,
  },
  {
    id: 'pac-1',
    nombres: 'Patricia Velásquez',
    cedula: 'V-19.845.221',
    telefono: '04128365687',
    email: 'patricia.velasquez@gmail.com',
    sexo: 'Femenino',
    fechaNacimiento: '1989-06-14',
    condicionMedicaId: 'ninguna',
    motivo: 'Evaluación Inicial & Dolor molar superior',
    fechaCita: '2024-10-24',
    horaInicio: '09:00 AM',
    doctorNombre: 'Dra. María Alejandra Domínguez',
    sedeId: 'victoria',
    estado: 'pendiente',
    esUrgencia: true,
  },
  {
    id: 'pac-2',
    nombres: 'Carlos Mendoza',
    cedula: 'V-17.902.311',
    telefono: '04128365687',
    email: 'carlos.mendoza@hotmail.com',
    sexo: 'Masculino',
    fechaNacimiento: '1986-11-20',
    condicionMedicaId: 'ninguna',
    motivo: 'Control Mensual de Ortodoncia Brackets',
    fechaCita: '2024-10-24',
    horaInicio: '10:30 AM',
    doctorNombre: 'Dr. Carlos Mendoza Rivas',
    sedeId: 'victoria',
    estado: 'confirmada',
    esUrgencia: false,
  },
  {
    id: 'pac-3',
    nombres: 'Marcos Ramos',
    cedula: 'V-22.109.833',
    telefono: '04128365687',
    email: 'marcos.ramos@gmail.com',
    sexo: 'Masculino',
    fechaNacimiento: '1994-03-05',
    condicionMedicaId: 'ninguna',
    motivo: 'Profilaxis Ultrasónica & Pulido Coronario',
    fechaCita: '2024-10-25',
    horaInicio: '02:00 PM',
    doctorNombre: 'Dra. Valentina Páez Gómez',
    sedeId: 'ambas',
    estado: 'completada',
    esUrgencia: false,
  },
];

const INITIAL_CONDICIONES_FALLBACK: CondicionMedicaItem[] = [
  {
    id: 'med-1',
    codigoCie: 'I10',
    nombre: 'Hipertensión Arterial Sistémica (HAS)',
    categoria: 'Cardiovascular',
    nivelRiesgo: 'Moderado',
    manifestacionBucal: 'Xerostomía farmacológica, hiperplasia gingival por nifedipino/amlodipino.',
    protocoloDental: 'Monitorear tensión arterial previa. Citas cortas matutinas. Máx. 2 carpules con epinefrina 1:100.000.',
    anestesicoContraindicado: 'Contraindicada Norepinefrina. Evitar epinefrina en crisis (>160/100 mmHg).',
    requiereProfilaxisAntibiotica: false,
    activo: true,
  },
  {
    id: 'med-2',
    codigoCie: 'E11.9',
    nombre: 'Diabetes Mellitus Tipo 2 (No Insulinodependiente)',
    categoria: 'Endocrina & Metabólica',
    nivelRiesgo: 'Moderado',
    manifestacionBucal: 'Periodontitis acelerada con pérdida ósea, cicatrización retardada y candidiasis bucal.',
    protocoloDental: 'Verificar glucemia capilar y HbA1c (< 7.5%). Citas matutinas post-ingesta y medicación.',
    anestesicoContraindicado: 'Técnica troncular con aspiración obligatoria.',
    requiereProfilaxisAntibiotica: false,
    activo: true,
  },
  {
    id: 'med-3',
    codigoCie: 'Z88.0',
    nombre: 'Alergia Severa a Penicilinas y Betalactámicos',
    categoria: 'Alergias & Farmacología',
    nivelRiesgo: 'Crítico',
    manifestacionBucal: 'Riesgo de angioedema de labios, lengua y shock anafiláctico agudo.',
    protocoloDental: 'ALERTA ROJA EN FICHA. Prohibido amoxicilina o ampicilina. Usar Azitromicina o Clindamicina.',
    anestesicoContraindicado: 'Evitar anestésicos con sulfitos o parabenos.',
    requiereProfilaxisAntibiotica: true,
    activo: true,
  },
  {
    id: 'med-4',
    codigoCie: 'D68.9',
    nombre: 'Paciente Anticoagulado (Warfarina / Rivaroxabán / AAS)',
    categoria: 'Hematológica & Coagulación',
    nivelRiesgo: 'Alto',
    manifestacionBucal: 'Hemorragias gingivales espontáneas, petequias en mucosa yugal, hematomas submucosos.',
    protocoloDental: 'Solicitar INR reciente (< 72 hrs, ideal 2.0-3.0). Hemostáticos locales obligatorios.',
    anestesicoContraindicado: 'Evitar bloqueo troncular profundo sin hemostasia previa.',
    requiereProfilaxisAntibiotica: false,
    activo: true,
  },
  {
    id: 'med-5',
    codigoCie: 'O00-O9A',
    nombre: 'Embarazo en Segundo Trimestre (Semanas 14 a 28)',
    categoria: 'Especial & Gestación',
    nivelRiesgo: 'Bajo',
    manifestacionBucal: 'Gingivitis gravídica hormonal, tumor del embarazo (épulis angiomatoso sangrante).',
    protocoloDental: 'Período idóneo para profilaxis y tratamientos. Posición semi-sentada con almohada derecha.',
    anestesicoContraindicado: 'PROHIBIDA Prilocaína con Felipresina (induce contracciones uterinas).',
    requiereProfilaxisAntibiotica: false,
    activo: true,
  },
  {
    id: 'med-6',
    codigoCie: 'J45',
    nombre: 'Asma Bronquial Extrínseca (Alérgica)',
    categoria: 'Infecciosa & Respiratoria',
    nivelRiesgo: 'Moderado',
    manifestacionBucal: 'Erosión dental por inhaladores de esteroides, sequedad bucal.',
    protocoloDental: 'El paciente debe traer su inhalador broncodilatador (Salbutamol) al sillón.',
    anestesicoContraindicado: 'Evitar carpules con bisulfitos antioxidantes.',
    requiereProfilaxisAntibiotica: false,
    activo: true,
  },
  {
    id: 'med-7',
    codigoCie: 'I35.0',
    nombre: 'Prótesis Valvular Cardíaca / Antecedente de Endocarditis',
    categoria: 'Cardiovascular',
    nivelRiesgo: 'Crítico',
    manifestacionBucal: 'Riesgo inminente de bacteriemia transitoria tras manipulación gingival.',
    protocoloDental: 'PROFILAXIS ANTIBIÓTICA OBLIGATORIA (Amoxicilina 2g 1h antes o Clindamicina 600mg).',
    anestesicoContraindicado: 'Sin contraindicación anestésica directa.',
    requiereProfilaxisAntibiotica: true,
    activo: true,
  },
];

const getDoctorAvatar = (nombre: string = '', box: number = 1): string => {
  const n = (nombre || '').toLowerCase();
  if (n.includes('domínguez') || n.includes('dominguez') || n.includes('maría') || n.includes('maria') || n.includes('alejandra')) {
    return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80';
  }
  if (n.includes('julianny') || n.includes('rebolledo') || n.includes('ramos')) {
    return 'https://images.unsplash.com/photo-1594824813637-4560767733a1?auto=format&fit=crop&w=200&q=80';
  }
  if (n.includes('sandra') || n.includes('carreño') || n.includes('carreno')) {
    return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80';
  }
  if (n.includes('carmen') || n.includes('silva')) {
    return 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=200&q=80';
  }
  if (n.includes('valeria') || n.includes('hernández') || n.includes('hernandez')) {
    return 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=200&q=80';
  }
  if (n.includes('mendoza') || n.includes('carlos') || n.includes('rivas')) {
    return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80';
  }
  if (n.includes('páez') || n.includes('paez') || n.includes('valentina') || n.includes('gómez') || n.includes('gomez')) {
    return 'https://images.unsplash.com/photo-1594824813637-4560767733a1?auto=format&fit=crop&w=200&q=80';
  }
  return box % 2 === 0
    ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80'
    : 'https://images.unsplash.com/photo-1594824813637-4560767733a1?auto=format&fit=crop&w=200&q=80';
};

const cleanAvatar = (rawAvatar?: string, nombre: string = '', box: number = 1): string => {
  if (rawAvatar && (rawAvatar.startsWith('http://') || rawAvatar.startsWith('https://') || rawAvatar.startsWith('data:image/'))) {
    return rawAvatar;
  }
  return getDoctorAvatar(nombre, box);
};

export const BookingFlow: React.FC<BookingFlowProps> = ({ onBack, onNavigateTab }) => {
  const { sedeActiva, sedeId, cambiarSede } = useSede();

  // Referencias para desplazamiento suave a la posición inicial de cada tarjeta
  const sedeCardRef = useRef<HTMLDivElement>(null);
  const doctorCardRef = useRef<HTMLDivElement>(null);
  const treatmentCardRef = useRef<HTMLDivElement>(null);
  const datetimeCardRef = useRef<HTMLDivElement>(null);
  const patientCardRef = useRef<HTMLFormElement>(null);
  const summaryCardRef = useRef<HTMLDivElement>(null);

  // Reloj en tiempo real para la marquesina animada tipo Wall Street
  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleString('es-VE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleString('es-VE', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Conexión con Data: Odontólogos, Pacientes y Condiciones Médicas de #DATA
  const [dataOdontologos, setDataOdontologos] = useState<OdontologoItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_odontologos');
      return saved ? normalizarListaOdontologos(JSON.parse(saved)) : INITIAL_ODONTOLOGOS_FALLBACK;
    } catch {
      return INITIAL_ODONTOLOGOS_FALLBACK;
    }
  });

  const [dataPacientes, setDataPacientes] = useState<PacienteItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_pacientes');
      const list: PacienteItem[] = saved ? JSON.parse(saved) : INITIAL_PACIENTES_FALLBACK;
      return list.map((p) => {
        const clean = (p.cedula || '').replace(/[^0-9]/g, '');
        if (clean.includes('16762319')) {
          return {
            ...p,
            nombres: 'Raymond Gilbonio',
            cedula: 'V-16.762.319',
            telefono: '04126841381',
            email: 'raymond.gilbonio@odontosaludlv.com',
            sexo: 'Masculino' as const,
            fechaNacimiento: '1982-10-15',
            condicionMedicaId: 'med-1',
          };
        }
        return {
          ...p,
          fechaNacimiento: normalizarFechaInput(p.fechaNacimiento),
        };
      });
    } catch {
      return INITIAL_PACIENTES_FALLBACK;
    }
  });

  const [condicionesMedicas, setCondicionesMedicas] = useState<CondicionMedicaItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_condiciones_medicas');
      return saved ? JSON.parse(saved) : INITIAL_CONDICIONES_FALLBACK;
    } catch {
      return INITIAL_CONDICIONES_FALLBACK;
    }
  });

  const [dataCitas, setDataCitas] = useState<Cita[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_citas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    ApiClient.getControlData().then((remote) => {
      if (!remote) return;
      if (remote.odontologos && remote.odontologos.length > 0) {
        setDataOdontologos(normalizarListaOdontologos(remote.odontologos));
      }
      if (remote.citas && Array.isArray(remote.citas)) {
        setDataCitas(remote.citas);
      }
      if (remote.pacientes && remote.pacientes.length > 0) {
        const sanitized = remote.pacientes.map((p) => {
          const clean = (p.cedula || '').replace(/[^0-9]/g, '');
          if (clean.includes('16762319')) {
            return {
              ...p,
              nombres: 'Raymond Gilbonio',
              cedula: 'V-16.762.319',
              telefono: '04126841381',
              email: 'raymond.gilbonio@odontosaludlv.com',
              sexo: 'Masculino' as const,
              fechaNacimiento: '1982-10-15',
              condicionMedicaId: 'med-1',
            };
          }
          return {
            ...p,
            fechaNacimiento: normalizarFechaInput(p.fechaNacimiento),
          };
        });
        setDataPacientes(sanitized);
      }
      if (remote.condicionesMedicas && remote.condicionesMedicas.length > 0) {
        setCondicionesMedicas(remote.condicionesMedicas);
      }
    });

    const handleDataUpdated = (e: any) => {
      if (e?.detail?.tipo === 'citas' && Array.isArray(e.detail.data)) {
        setDataCitas(e.detail.data);
      } else if (e?.detail?.tipo === 'odontologos' && Array.isArray(e.detail.data)) {
        setDataOdontologos(e.detail.data.map(normalizarDisponibilidadOdontologo));
      } else {
        try {
          const savedO = localStorage.getItem('odontosalud_data_odontologos');
          if (savedO) {
            setDataOdontologos(JSON.parse(savedO).map(normalizarDisponibilidadOdontologo));
          }
          const savedC = localStorage.getItem('odontosalud_data_citas');
          if (savedC) {
            setDataCitas(JSON.parse(savedC));
          }
        } catch {}
      }
    };

    window.addEventListener('odontosalud_data_updated', handleDataUpdated);
    window.addEventListener('storage', handleDataUpdated);
    return () => {
      window.removeEventListener('odontosalud_data_updated', handleDataUpdated);
      window.removeEventListener('storage', handleDataUpdated);
    };
  }, []);

  // 2. Estado Inicial Cero (Campos Vacíos en Posición Inicial Cero)
  const [selectedSedeId, setSelectedSedeId] = useState<SedeId | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [treatment, setTreatment] = useState<string>('');
  const [treatmentDesc, setTreatmentDesc] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const sedeEfectiva: SedeId = selectedSedeId || sedeId;

  const todosDoctoresData: DoctorOption[] = dataOdontologos.map((raw) => {
    const odo = normalizarDisponibilidadOdontologo(raw);
    return {
      id: odo.id,
      nombre: odo.nombres,
      titulo: odo.nombres.toLowerCase().includes('domínguez') ? 'Directora Clínica' : 'Especialista',
      especialidad: odo.especialidad,
      box: odo.boxAsignado || 1,
      avatar: cleanAvatar(odo.avatar, odo.nombres, odo.boxAsignado || 1),
      turno: odo.turno,
      estado: odo.estado,
      esTitular: odo.nombres.toLowerCase().includes('domínguez'),
      sedeId: odo.sedeId,
      diasVictoria: odo.diasVictoria || [],
      diasTovar: odo.diasTovar || [],
    };
  });

  // Filtrar odontólogos disponibles para la sede seleccionada según #Data
  const doctoresEmpadronados: DoctorOption[] = todosDoctoresData.filter((doc) => {
    if (sedeEfectiva === 'tovar') {
      return (doc.sedeId === 'tovar' || doc.sedeId === 'ambas') && (doc.diasTovar?.length || 0) > 0;
    } else {
      return (doc.sedeId === 'victoria' || doc.sedeId === 'ambas') && (doc.diasVictoria?.length || 0) > 0;
    }
  });

  const [cedulaTipo, setCedulaTipo] = useState<'V' | 'E' | 'J' | 'G' | 'P'>('V');
  const [cedulaNumero, setCedulaNumero] = useState<string>('');
  const [nombres, setNombres] = useState<string>('');
  const [sexo, setSexo] = useState<'Femenino' | 'Masculino' | 'Otro' | ''>('');
  const [fechaNacimiento, setFechaNacimiento] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [selectedCondicionId, setSelectedCondicionId] = useState<string>('ninguna');
  const [fotoSelfie, setFotoSelfie] = useState<string>('');
  const [isCompressingSelfie, setIsCompressingSelfie] = useState<boolean>(false);

  // Estado del flujo secuencial (inicia en 'sede' como Tarjeta Nro 1)
  const [openStep, setOpenStep] = useState<BookingStep | null>('sede');

  // 3. Modal Login Emergente con Validación de Cédula y Delay de 2 Segundos
  const [showAuthModal, setShowAuthModal] = useState<boolean>(true);
  const [authCedulaTipo, setAuthCedulaTipo] = useState<'V' | 'E' | 'J' | 'G' | 'P'>('V');
  const [authCedulaInput, setAuthCedulaInput] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<'idle' | 'validating' | 'verified' | 'not_found'>('idle');
  const [pacienteEncontrado, setPacienteEncontrado] = useState<PacienteItem | null>(null);

  const [nuevoNombres, setNuevoNombres] = useState<string>('');
  const [nuevoSexo, setNuevoSexo] = useState<'Femenino' | 'Masculino' | 'Otro'>('Femenino');
  const [nuevoFechaNacimiento, setNuevoFechaNacimiento] = useState<string>('');
  const [nuevoTelefono, setNuevoTelefono] = useState<string>('');

  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const cleanInput = authCedulaInput.replace(/[^0-9]/g, '');

    if (cleanInput.length >= 6) {
      setAuthStatus('validating');

      debounceTimerRef.current = setTimeout(async () => {
        // 1. Intentar consultar directamente la base de datos D1 en la nube
        let match: PacienteItem | null | undefined = null;
        try {
          const directD1 = await ApiClient.buscarPacientePorCedula(cleanInput);
          if (directD1) {
            match = directD1;
          }
        } catch {
          // continuar a local
        }

        // 2. Si no respondió D1 o no encontró, buscar en dataPacientes local
        if (!match) {
          match = dataPacientes.find((p) => {
            const cleanP = (p.cedula || '').replace(/[^0-9]/g, '');
            return cleanP === cleanInput;
          });
        }

        // 3. Si no está en pacientes, buscar en doctores/odontólogos empadronados
        if (!match) {
          const docMatch = dataOdontologos.find((o) => {
            const cleanO = (o.cedula || '').replace(/[^0-9]/g, '');
            return cleanO === cleanInput;
          });
          if (docMatch) {
            match = {
              id: `pac-${docMatch.id}`,
              nombres: docMatch.nombres,
              cedula: docMatch.cedula,
              telefono: docMatch.telefono,
              email: docMatch.email,
              sexo: 'Femenino',
              sedeId: docMatch.sedeId,
              estado: 'confirmada',
              motivo: 'Evaluación Odontológica y Control Profesional',
              fechaCita: 'Reciente',
              horaInicio: '09:00 AM',
              doctorNombre: docMatch.nombres,
            };
          }
        }

        // 4. Si aún no está, consultar la base de datos D1 completa
        if (!match) {
          try {
            const remote = await ApiClient.getControlData();
            if (remote?.pacientes && remote.pacientes.length > 0) {
              const sanitized = remote.pacientes.map((p) => {
                const clean = (p.cedula || '').replace(/[^0-9]/g, '');
                if (clean.includes('16762319')) {
                  return {
                    ...p,
                    nombres: 'Raymond Gilbonio',
                    cedula: 'V-16.762.319',
                    telefono: '04126841381',
                    email: 'raymond.gilbonio@odontosaludlv.com',
                    sexo: 'Masculino' as const,
                    fechaNacimiento: '1982-10-15',
                    condicionMedicaId: 'med-1',
                  };
                }
                return {
                  ...p,
                  fechaNacimiento: normalizarFechaInput(p.fechaNacimiento),
                };
              });
              setDataPacientes(sanitized);
              match = sanitized.find(
                (p) => (p.cedula || '').replace(/[^0-9]/g, '') === cleanInput
              );
            }
          } catch {
            // fallback silencioso
          }
        }

        if (match) {
          const cleanM = (match.cedula || '').replace(/[^0-9]/g, '');
          if (cleanM.includes('16762319') || cleanInput === '16762319') {
            match = {
              ...match,
              nombres: 'Raymond Gilbonio',
              cedula: 'V-16.762.319',
              telefono: '04126841381',
              email: 'raymond.gilbonio@odontosaludlv.com',
              sexo: 'Masculino' as const,
              fechaNacimiento: '1982-10-15',
              condicionMedicaId: 'med-1',
            };
          } else {
            match = {
              ...match,
              fechaNacimiento: normalizarFechaInput(match.fechaNacimiento),
            };
          }
          setPacienteEncontrado(match);
          setAuthStatus('verified');
        } else {
          setPacienteEncontrado(null);
          setAuthStatus('not_found');
        }
      }, 700); // 700ms para validación rápida y sensible
    } else {
      setAuthStatus('idle');
      setPacienteEncontrado(null);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [authCedulaInput, dataPacientes, dataOdontologos]);

  const handleContinuarPacienteRegistrado = () => {
    if (!pacienteEncontrado) return;

    const cleanFound = (pacienteEncontrado.cedula || '').replace(/[^0-9]/g, '');
    const isRaymond = cleanFound.includes('16762319');

    // Parsear cédula: si viene con guión ej "V-16.762.319" o sólo números
    const rawCedula = pacienteEncontrado.cedula || '';
    if (rawCedula.includes('-')) {
      const [tipo, num] = rawCedula.split('-');
      if (['V', 'E', 'J', 'G', 'P'].includes(tipo.toUpperCase())) {
        setCedulaTipo(tipo.toUpperCase() as any);
      }
      setCedulaNumero(num.trim());
    } else {
      setCedulaTipo(authCedulaTipo);
      setCedulaNumero(rawCedula.trim() || authCedulaInput.trim());
    }

    setNombres(isRaymond ? 'Raymond Gilbonio' : (pacienteEncontrado.nombres || ''));
    setTelefono(isRaymond ? '04126841381' : (pacienteEncontrado.telefono || ''));
    setEmail(isRaymond ? 'raymond.gilbonio@odontosaludlv.com' : (pacienteEncontrado.email || ''));
    setSexo(isRaymond ? 'Masculino' : ((pacienteEncontrado.sexo as any) || 'Femenino'));
    setFechaNacimiento(isRaymond ? '1982-10-15' : normalizarFechaInput(pacienteEncontrado.fechaNacimiento));

    // Precargar motivo clínico previo o predeterminado
    if (pacienteEncontrado.motivo) {
      setMotivo(pacienteEncontrado.motivo);
    }

    // Precargar patología o anamnesis si está registrada en el expediente clínico
    if (isRaymond) {
      setSelectedCondicionId('med-1');
    } else if ((pacienteEncontrado as any).condicionMedicaId) {
      setSelectedCondicionId((pacienteEncontrado as any).condicionMedicaId);
    }

    // Cargar foto selfie o avatar si ya está registrada en el expediente o en caché local
    const savedAvatar =
      pacienteEncontrado.avatarUrl ||
      localStorage.getItem(`paciente_avatar_${rawCedula}`) ||
      localStorage.getItem(`paciente_avatar_${authCedulaTipo}-${authCedulaInput.trim()}`) ||
      '';
    setFotoSelfie(savedAvatar || '');

    setShowAuthModal(false);
    setOpenStep('sede');
  };

  const handleContinuarPacienteNuevo = async () => {
    if (!nuevoNombres.trim()) return;

    const fullCedula = `${authCedulaTipo}-${authCedulaInput.trim()}`;
    setCedulaTipo(authCedulaTipo);
    setCedulaNumero(authCedulaInput.trim());
    setNombres(nuevoNombres.trim());
    setSexo(nuevoSexo);
    setFechaNacimiento(nuevoFechaNacimiento);
    setTelefono(nuevoTelefono.trim());

    const storedSelfie = localStorage.getItem(`paciente_avatar_${fullCedula}`);
    setFotoSelfie(storedSelfie || '');

    const nuevoPac: PacienteItem = {
      id: `pac-${Date.now()}`,
      nombres: nuevoNombres.trim(),
      cedula: fullCedula,
      telefono: nuevoTelefono.trim() || '+58 412-0000000',
      email: '',
      sexo: nuevoSexo,
      fechaNacimiento: nuevoFechaNacimiento,
      condicionMedicaId: 'ninguna',
      sedeId: 'victoria',
      estado: 'pendiente',
      motivo: 'Evaluación Inicial Odontológica',
      fechaCita: 'Primera Consulta',
      horaInicio: '09:00 AM',
      doctorNombre: 'Por Asignar',
      avatarUrl: storedSelfie || undefined,
    };

    setPacienteEncontrado(nuevoPac);
    setDataPacientes((prev) => [nuevoPac, ...prev]);

    try {
      const saved = localStorage.getItem('odontosalud_data_pacientes');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('odontosalud_data_pacientes', JSON.stringify([nuevoPac, ...list]));
    } catch {
      // ignore
    }

    try {
      await ApiClient.guardarPaciente(nuevoPac);
    } catch {
      // ignore
    }

    setShowAuthModal(false);
    setOpenStep('sede');
  };

  // Handler para captar y comprimir la foto selfie del paciente con HTML5 Canvas en cliente
  const handleSubirSelfie = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingSelfie(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.82 });
      setFotoSelfie(compressed);
      const fullCed = `${cedulaTipo}-${cedulaNumero.trim()}`;
      if (cedulaNumero.trim().length > 2) {
        localStorage.setItem(`paciente_avatar_${fullCed}`, compressed);
      }
    } catch (err) {
      console.error('Error al comprimir foto selfie:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        setFotoSelfie(res);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingSelfie(false);
      e.target.value = '';
    }
  };

  // Helper para persistir todos los datos personales y médicos (sexo, nacimiento, email, patología, selfie) tanto en D1 como local
  const persistirDatosPaciente = async (override?: Partial<PacienteItem>) => {
    const fullCedula = `${cedulaTipo}-${cedulaNumero.trim()}`;
    const cleanNum = cedulaNumero.trim();
    if (!cleanNum || !nombres.trim()) return;

    const isRaymond = cleanNum.replace(/[^0-9]/g, '').includes('16762319');
    const finalFechaNacimiento = isRaymond
      ? '1982-10-15'
      : (normalizarFechaInput(fechaNacimiento) || '');
    const finalSexo = isRaymond ? 'Masculino' : ((sexo as any) || 'Femenino');
    const finalEmail = isRaymond ? 'raymond.gilbonio@odontosaludlv.com' : email.trim();
    const finalCondicion = isRaymond ? 'med-1' : (selectedCondicionId || 'ninguna');

    const pacientePayload: PacienteItem = {
      id: pacienteEncontrado?.id || `pac-${Date.now()}`,
      nombres: isRaymond ? 'Raymond Gilbonio' : nombres.trim(),
      cedula: fullCedula,
      telefono: isRaymond ? '04126841381' : (telefono.trim() || '+58 412-0000000'),
      email: finalEmail,
      sexo: finalSexo,
      fechaNacimiento: finalFechaNacimiento,
      condicionMedicaId: finalCondicion,
      motivo: motivo.trim() || treatment || 'Evaluación Odontológica',
      fechaCita: selectedDate || new Date().toISOString().split('T')[0],
      horaInicio: selectedSlot || '09:00 AM',
      doctorNombre: selectedDoctor ? selectedDoctor.nombre : 'Por Asignar',
      sedeId: selectedSedeId || sedeId || 'victoria',
      estado: 'confirmada',
      esUrgencia: treatment.toLowerCase().includes('urgencia') || treatment.toLowerCase().includes('dolor'),
      avatarUrl: fotoSelfie || undefined,
      ...override,
    };

    setPacienteEncontrado(pacientePayload);
    setDataPacientes((prev) => {
      const idx = prev.findIndex(
        (p) => (p.cedula || '').replace(/[^0-9]/g, '') === cleanNum.replace(/[^0-9]/g, '')
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...pacientePayload };
        return copy;
      }
      return [pacientePayload, ...prev];
    });

    try {
      const saved = localStorage.getItem('odontosalud_data_pacientes');
      const list: PacienteItem[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex(
        (p) => (p.cedula || '').replace(/[^0-9]/g, '') === cleanNum.replace(/[^0-9]/g, '')
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...pacientePayload };
      } else {
        list.unshift(pacientePayload);
      }
      localStorage.setItem('odontosalud_data_pacientes', JSON.stringify(list));
    } catch {
      // ignore
    }

    try {
      await ApiClient.guardarPaciente(pacientePayload);
    } catch (err) {
      console.warn('Error sincronizando paciente con D1:', err);
    }
  };

  // Función para abrir un paso y desplazarse suavemente a su posición inicial
  const irAPaso = (paso: BookingStep) => {
    setOpenStep(paso);
    setTimeout(() => {
      let targetEl: HTMLElement | null = null;
      if (paso === 'sede') targetEl = sedeCardRef.current;
      else if (paso === 'doctor') targetEl = doctorCardRef.current;
      else if (paso === 'treatment') targetEl = treatmentCardRef.current;
      else if (paso === 'datetime') targetEl = datetimeCardRef.current;
      else if (paso === 'patient') targetEl = patientCardRef.current;

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    }, 80);
  };

  // Función para retroceder al paso anterior de forma limpia y ordenada
  const retrocederPaso = () => {
    if (openStep === 'doctor') {
      irAPaso('sede');
    } else if (openStep === 'treatment') {
      irAPaso('doctor');
    } else if (openStep === 'datetime') {
      irAPaso('treatment');
    } else if (openStep === 'patient') {
      irAPaso('datetime');
    } else if (openStep === null) {
      irAPaso('patient');
    } else if (openStep === 'sede') {
      if (onNavigateTab) {
        onNavigateTab('dashboard');
      } else if (onBack) {
        onBack();
      }
    }
  };

  const getTextoRetroceso = (): string => {
    switch (openStep) {
      case 'doctor':
        return 'Cambiar Sede';
      case 'treatment':
        return 'Cambiar Odontólogo';
      case 'datetime':
        return 'Cambiar Tratamiento';
      case 'patient':
        return 'Cambiar Horario';
      case null:
        return 'Modificar Cita';
      case 'sede':
      default:
        return 'Volver al Inicio';
    }
  };

  // 4. Catálogos Clínicos y Opciones
  const treatments = [
    {
      id: 'evaluacion',
      nombre: 'Evaluación & Diagnóstico Digital RVG',
      desc: '45 min • Inspección FDI y radiografía periapical',
      duracionMin: 45,
      icon: 'dentistry',
      badge: 'Completa',
      isPopular: true,
    },
    {
      id: 'limpieza',
      nombre: 'Profilaxis Ultrasónica & Pulido Coronario',
      desc: '40 min • Destartraje ultrasónico y flúor',
      duracionMin: 40,
      icon: 'clean_hands',
    },
    {
      id: 'urgencia',
      nombre: 'Urgencia Odontológica / Dolor Agudo',
      desc: '30 min • Alivio inmediato y atención prioritaria',
      duracionMin: 30,
      icon: 'emergency',
      isUrgent: true,
    },
    {
      id: 'ortodoncia',
      nombre: 'Control / Inicio de Ortodoncia',
      desc: '45 min • Brackets estéticos / autoligado',
      duracionMin: 45,
      icon: 'grid_view',
    },
    {
      id: 'endodoncia',
      nombre: 'Endodoncia Microscópica',
      desc: '60 min • Terapia de conducto especializada',
      duracionMin: 60,
      icon: 'vital_signs',
    },
    {
      id: 'estetica',
      nombre: 'Restauración Estética en Resina Nanohíbrida',
      desc: '45 min • Fotocurado estético y reconstrucción',
      duracionMin: 45,
      icon: 'masks',
    },
  ];

  // Vista y Navegación de Fecha (Semanal de 6 días o Mensual con navegación de meses)
  const [dateViewMode, setDateViewMode] = useState<'semanal' | 'mensual'>('semanal');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date()); // Fecha actual contemporánea del usuario

  // Detección de duración según tratamiento seleccionado (o 45 min por defecto)
  const selectedTreatmentObj = treatments.find(
    (t) => t.nombre.toLowerCase() === treatment.toLowerCase() || t.id === treatment
  );
  const duracionTratamientoMin = selectedTreatmentObj?.duracionMin || 45;

  const calcularHoraFin = (horaInicio: string, minutos: number): string => {
    try {
      const [horaParte, ampm] = horaInicio.trim().split(' ');
      const [hStr, mStr] = horaParte.split(':');
      let h = parseInt(hStr, 10);
      let m = parseInt(mStr, 10);
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;

      const totalMin = h * 60 + m + minutos;
      let finH = Math.floor(totalMin / 60) % 24;
      const finM = totalMin % 60;
      const finAmpm = finH >= 12 ? 'PM' : 'AM';
      if (finH > 12) finH -= 12;
      if (finH === 0) finH = 12;

      const padH = finH < 10 ? `0${finH}` : `${finH}`;
      const padM = finM < 10 ? `0${finM}` : `${finM}`;
      return `${padH}:${padM} ${finAmpm}`;
    } catch {
      return horaInicio;
    }
  };

  // Turno Mañana Oficial Solicitado: 8:30 AM, 9:15 AM, 10:00 AM, 11:00 AM
  const morningSlots = [
    { hora: '08:30 AM', sub: 'Inicio matutino' },
    { hora: '09:15 AM', sub: selectedDoctor ? `Box 0${selectedDoctor.box}` : 'Libre' },
    { hora: '10:00 AM', sub: 'Libre' },
    { hora: '11:00 AM', sub: 'Cierre matutino' },
  ];

  // Turno Tarde Oficial Solicitado: 1:15 PM, 2:00 PM, 3:00 PM, 3:45 PM
  const afternoonSlots = [
    { hora: '01:15 PM', sub: 'Inicio vespertino' },
    { hora: '02:00 PM', sub: selectedDoctor ? `Box 0${selectedDoctor.box}` : 'Libre' },
    { hora: '03:00 PM', sub: 'Libre' },
    { hora: '03:45 PM', sub: 'Cierre vespertino' },
  ];

  const DIAS_SEMANA_6: DiaSemanaClinico[] = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const MESES_NOMBRES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const MESES_ABR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Resolver disponibilidad en vivo desde #Data para el doctor y sede seleccionados
  const doctorVivoEnData: DoctorOption | null = selectedDoctor
    ? todosDoctoresData.find(
        (d) =>
          d.id === selectedDoctor.id ||
          d.nombre.trim().toLowerCase() === selectedDoctor.nombre.trim().toLowerCase()
      ) || selectedDoctor
    : null;

  const diasPermitidosEnSede: DiaSemanaClinico[] = (() => {
    if (doctorVivoEnData) {
      return sedeEfectiva === 'tovar'
        ? doctorVivoEnData.diasTovar || []
        : doctorVivoEnData.diasVictoria || [];
    }
    const union = new Set<DiaSemanaClinico>();
    doctoresEmpadronados.forEach((doc) => {
      const lista = sedeEfectiva === 'tovar' ? doc.diasTovar || [] : doc.diasVictoria || [];
      lista.forEach((d) => union.add(d));
    });
    return union.size > 0 ? DIAS_SEMANA_CLINICOS.filter((d) => union.has(d)) : DIAS_SEMANA_CLINICOS;
  })();

  const diasDoctorEnOtraSede: DiaSemanaClinico[] = (() => {
    if (!doctorVivoEnData) return [];
    return sedeEfectiva === 'tovar'
      ? doctorVivoEnData.diasVictoria || []
      : doctorVivoEnData.diasTovar || [];
  })();

  const turnoDoctorEnData = doctorVivoEnData?.turno || 'Completo';
  const mananaHabilitado = turnoDoctorEnData === 'Completo' || turnoDoctorEnData === 'Mañana';
  const tardeHabilitado = turnoDoctorEnData === 'Completo' || turnoDoctorEnData === 'Tarde';

  // Obtiene los 6 días hábiles de la semana activa (LUN a SÁB) filtrados por disponibilidad en #Data y fecha actual
  const getSemana6Dias = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const base = new Date(currentMonthDate);
    base.setDate(base.getDate() + weekOffset * 7);

    const day = base.getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mié, 4: Jue, 5: Vie, 6: Sáb
    // Si hoy es domingo (0) y weekOffset === 0, mostramos la semana entrante que comienza mañana lunes (+1)
    const diff = base.getDate() - day + (day === 0 ? 1 : 1);
    const lunes = new Date(base.getFullYear(), base.getMonth(), diff);
    lunes.setHours(0, 0, 0, 0);

    const semana = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      d.setHours(0, 0, 0, 0);

      const diaSemana = DIAS_SEMANA_6[i];
      const esPasado = d < hoy;
      const esHoy = d.getTime() === hoy.getTime();

      const disponibleEnSede = !esPasado && diasPermitidosEnSede.includes(diaSemana);
      const atiendeEnOtraSede = !disponibleEnSede && !esPasado && diasDoctorEnOtraSede.includes(diaSemana);

      const diaNum = d.getDate();
      const cuposOcupados = [5, 3, 7, 2, 6, 4][(diaNum + i) % 6];
      const cuposLibres = disponibleEnSede ? Math.max(1, 8 - cuposOcupados) : 0;
      const porcentajeOcupacion = disponibleEnSede ? Math.round((cuposOcupados / 8) * 100) : 100;

      let estado: 'disponible' | 'moderado' | 'critico' | 'cerrado' = 'disponible';
      if (!disponibleEnSede || esPasado) estado = 'cerrado';
      else if (cuposLibres === 1) estado = 'critico';
      else if (cuposLibres <= 3) estado = 'moderado';

      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;

      semana.push({
        dateObj: d,
        diaSemana,
        numero: diaNum < 10 ? `0${diaNum}` : `${diaNum}`,
        mesCorto: MESES_ABR[d.getMonth()],
        fullString: `${diaSemana} ${diaNum} ${MESES_ABR[d.getMonth()]}`,
        isoDate,
        cuposLibres,
        cuposOcupados,
        porcentajeOcupacion,
        estado,
        esPasado,
        esHoy,
        noDisponibleEnSede: !disponibleEnSede,
        atiendeEnOtraSede,
      });
    }
    return semana;
  };

  // Obtiene la matriz completa del mes con indicador de cupos filtrada por disponibilidad en #Data
  const getDiasDelMes = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasEnMes = ultimoDia.getDate();

    let startDayOfWeek = primerDia.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const celdas = [];
    for (let e = 0; e < startDayOfWeek; e++) {
      celdas.push({ esVacio: true, id: `empty-${e}` } as any);
    }

    for (let d = 1; d <= diasEnMes; d++) {
      const dateObj = new Date(year, month, d);
      dateObj.setHours(0, 0, 0, 0);
      const dayOfWeek = dateObj.getDay();
      const esDomingo = dayOfWeek === 0;
      const esPasado = dateObj < hoy;
      const esHoy = dateObj.getTime() === hoy.getTime();

      const diaSemanaStr = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][dayOfWeek];
      const disponibleEnSede =
        !esDomingo && !esPasado && diasPermitidosEnSede.includes(diaSemanaStr as DiaSemanaClinico);
      const atiendeEnOtraSede =
        !esDomingo &&
        !disponibleEnSede &&
        !esPasado &&
        diasDoctorEnOtraSede.includes(diaSemanaStr as DiaSemanaClinico);

      const mesCorto = MESES_ABR[month];
      const fullString = `${diaSemanaStr} ${d} ${mesCorto}`;
      const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const cuposOcupados = [5, 3, 7, 2, 6, 4][(d + dayOfWeek) % 6];
      const cuposLibres = disponibleEnSede ? Math.max(1, 8 - cuposOcupados) : 0;
      const porcentajeOcupacion = disponibleEnSede ? Math.round((cuposOcupados / 8) * 100) : 100;

      let estado: 'disponible' | 'moderado' | 'critico' | 'cerrado' = 'disponible';
      if (esDomingo || !disponibleEnSede || esPasado) estado = 'cerrado';
      else if (cuposLibres === 1) estado = 'critico';
      else if (cuposLibres <= 3) estado = 'moderado';

      celdas.push({
        esVacio: false,
        id: `day-${d}`,
        numero: d < 10 ? `0${d}` : `${d}`,
        diaSemana: diaSemanaStr,
        mesCorto,
        fullString,
        isoDate,
        esDomingo,
        esPasado,
        esHoy,
        noDisponibleEnSede: !disponibleEnSede,
        atiendeEnOtraSede,
        cuposLibres,
        cuposOcupados,
        porcentajeOcupacion,
        estado,
      });
    }

    return celdas;
  };

  const puedeIrMesAnterior = (() => {
    const hoy = new Date();
    return (
      currentMonthDate.getFullYear() > hoy.getFullYear() ||
      (currentMonthDate.getFullYear() === hoy.getFullYear() && currentMonthDate.getMonth() > hoy.getMonth())
    );
  })();

  const irMesAnterior = () => {
    const hoy = new Date();
    setCurrentMonthDate((prev) => {
      const nuevo = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      if (
        nuevo.getFullYear() < hoy.getFullYear() ||
        (nuevo.getFullYear() === hoy.getFullYear() && nuevo.getMonth() < hoy.getMonth())
      ) {
        return prev;
      }
      return nuevo;
    });
  };

  const irMesSiguiente = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Escala de afluencia proporcional a las citas y solicitudes reales registradas
  // Orientación positiva para guiar al paciente a horarios más ágiles sin alarmismos ni bloqueos
  // Nivel 1 (0 citas): Atención Ágil (Mayor holgura) -> Esmeralda
  // Nivel 2 (1 cita): Demanda Habitual (Espacio regular) -> Azul médico (Sky)
  // Nivel 3 (2+ citas): Franja Popular (Mayor preferencia) -> Ámbar cálido
  const getDemandaTurno = (hora: string, fechaElegida: string) => {
    const horaNorm = (hora || '').trim().toUpperCase();

    // Contar citas reales activas en esa hora y sede
    const citasEnHora = dataCitas.filter((c) => {
      if (c.estado === 'cancelada') return false;
      if (c.sedeId && c.sedeId !== sedeEfectiva) return false;
      const hInicio = (c.horaInicio || '').trim().toUpperCase();
      return hInicio === horaNorm || hInicio.startsWith(horaNorm.slice(0, 5));
    });

    const solicitudes = citasEnHora.length;

    if (solicitudes === 0) {
      return {
        nivel: 'baja',
        etiqueta: 'Atención Ágil',
        subtitulo: 'Mayor holgura',
        grosorClase: 'border-t-[3px]',
        bordeColor: 'border-t-emerald-500',
        badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
        dotColor: 'bg-emerald-500',
      };
    } else if (solicitudes === 1) {
      return {
        nivel: 'media',
        etiqueta: 'Demanda Habitual',
        subtitulo: 'Espacio regular',
        grosorClase: 'border-t-[3px]',
        bordeColor: 'border-t-sky-500',
        badgeBg: 'bg-sky-50 text-sky-900 border-sky-300',
        dotColor: 'bg-sky-500',
      };
    } else {
      return {
        nivel: 'alta',
        etiqueta: 'Franja Popular',
        subtitulo: 'Alta preferencia',
        grosorClase: 'border-t-[3px]',
        bordeColor: 'border-t-amber-500',
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
        dotColor: 'bg-amber-500',
      };
    }
  };

  // Cálculo de Completitud en Vivo (5 Pasos: Sede 20% + Doctor 20% + Tratamiento 20% + Horario 20% + Paciente 20% = 100%)
  const calculateProgress = () => {
    let p = 0;
    if (selectedSedeId) p += 20;
    if (selectedDoctor) p += 20;
    if (treatment && treatment.trim().length > 0) p += 20;
    if (selectedDate && selectedDate.trim().length > 0 && selectedSlot && selectedSlot.trim().length > 0) p += 20;
    if (nombres.trim().length > 2 && cedulaNumero.trim().length > 3 && telefono.trim().length > 5) {
      p += 20;
    }
    return p;
  };
  const progressPercentage = calculateProgress();

  const condicionSeleccionada = condicionesMedicas.find((c) => c.id === selectedCondicionId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [codigoConfirmacion, setCodigoConfirmacion] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (progressPercentage < 100) return;

    setIsSubmitting(true);
    const generatedCode = `ODL-${Math.floor(1000 + Math.random() * 9000)}`;
    setCodigoConfirmacion(generatedCode);

    // Persistir integralmente en D1 y estado local (sexo, fecha nacimiento, email, condición médica)
    await persistirDatosPaciente();

    const motivoCompleto = condicionSeleccionada
      ? `${treatment} • Anamnesis: [${condicionSeleccionada.codigoCie}] ${condicionSeleccionada.nombre} • Motivo: ${motivo || 'Evaluación'}`
      : `${treatment} • Motivo: ${motivo || 'Evaluación inicial'}`;

    const targetSede = selectedSedeId || sedeId;
    const sedeFinal = selectedSedeId ? SEDES_DISPONIBLES[selectedSedeId] : sedeActiva;

    const citaIdGenerada = `cita-${Date.now()}`;
    const payloadCita: Cita = {
      id: citaIdGenerada,
      sedeId: targetSede as SedeId,
      pacienteId: pacienteEncontrado?.id || `pac-${Date.now()}`,
      pacienteNombre: nombres,
      pacienteCedula: `${cedulaTipo}-${cedulaNumero}`,
      pacienteTelefono: telefono,
      pacienteEmail: email,
      pacienteSexo: sexo,
      pacienteFechaNacimiento: fechaNacimiento,
      pacienteAvatar: fotoSelfie || undefined,
      condicionMedicaId: selectedCondicionId,
      doctorNombre: selectedDoctor ? selectedDoctor.nombre : 'Por asignar',
      boxNumero: selectedDoctor ? selectedDoctor.box : 1,
      fechaCita: selectedDate || new Date().toISOString().split('T')[0],
      horaInicio: selectedSlot || '09:00 AM',
      motivo: motivoCompleto,
      estado: 'pendiente',
      esUrgencia:
        treatment.toLowerCase().includes('urgencia') ||
        treatment.toLowerCase().includes('dolor'),
    };

    try {
      await ApiClient.crearCita(targetSede, payloadCita);
    } catch (err) {
      console.error('Error al solicitar cita en API:', err);
    }

    try {
      const saved = localStorage.getItem('odontosalud_data_citas');
      const list = saved ? JSON.parse(saved) : [];
      list.push(payloadCita);
      localStorage.setItem('odontosalud_data_citas', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('odontosalud_data_updated', { detail: { tipo: 'citas', data: list } }));
    } catch {}

    setBookingConfirmed(true);
    setIsSubmitting(false);
  };

  const compartirPorWhatsApp = () => {
    const sedeFinal = selectedSedeId ? SEDES_DISPONIBLES[selectedSedeId] : sedeActiva;
    const textoCondicion =
      selectedCondicionId !== 'ninguna' && condicionSeleccionada
        ? `\n⚠️ *Condición Anamnesis:* [${condicionSeleccionada.codigoCie}] ${condicionSeleccionada.nombre}`
        : '';

    const msg = encodeURIComponent(
      `🦷 *COMPROBANTE DE CITA ODONTOLÓGICA - ${sedeFinal.nombre.toUpperCase()}*\n\n` +
      `📋 *Código de Reserva:* ${codigoConfirmacion}\n` +
      `👤 *Paciente:* ${nombres} (${cedulaTipo}-${cedulaNumero})\n` +
      `🩺 *Tratamiento:* ${treatment}\n` +
      `📅 *Fecha:* ${selectedDate}\n` +
      `⏰ *Hora:* ${selectedSlot}\n` +
      `👨‍⚕️ *Facultativo:* ${selectedDoctor ? selectedDoctor.nombre : 'Por asignar'} (Box 0${selectedDoctor ? selectedDoctor.box : 1})\n` +
      `📍 *Sede:* ${sedeFinal.nombre} - ${sedeFinal.direccion}` +
      textoCondicion +
      `\n\n_Presentar este comprobante en recepción 10 minutos antes de su cita._`
    );
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const abrirWhatsAppConfirmacion = () => {
    const sedeFinal = selectedSedeId ? SEDES_DISPONIBLES[selectedSedeId] : sedeActiva;
    const cleanPhone = sedeFinal.whatsapp.replace(/[^0-9]/g, '');
    const textoCondicion =
      selectedCondicionId !== 'ninguna' && condicionSeleccionada
        ? `\n⚠️ *Antecedente / Patología:* [${condicionSeleccionada.codigoCie}] ${condicionSeleccionada.nombre}`
        : '';

    const msg = encodeURIComponent(
      `¡Hola Recepción OdontoSalud! Acabo de registrar mi cita en la plataforma:\n\n` +
      `📋 *Código:* ${codigoConfirmacion}\n` +
      `👤 *Paciente:* ${nombres} (${cedulaTipo}-${cedulaNumero})\n` +
      `🩺 *Tratamiento:* ${treatment}\n` +
      `📅 *Fecha y Hora:* ${selectedDate} a las ${selectedSlot}\n` +
      `👨‍⚕️ *Doctor(a):* ${selectedDoctor ? selectedDoctor.nombre : 'Por asignar'}\n` +
      `📍 *Sede Solicitada:* ${sedeFinal.nombre}\n` +
      textoCondicion +
      `\n\n¿Podrían por favor confirmarme la disponibilidad del Box? ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const semana6Dias = getSemana6Dias();
  const diasDelMes = getDiasDelMes();

  // Garantizar que la fecha y turno elegidos siempre respeten la disponibilidad en #Data para la sede y odontólogo activos
  useEffect(() => {
    if (selectedDoctor) {
      const docEnSede = doctoresEmpadronados.find(
        (d) =>
          d.id === selectedDoctor.id ||
          d.nombre.trim().toLowerCase() === selectedDoctor.nombre.trim().toLowerCase()
      );
      if (!docEnSede) {
        setSelectedDoctor(null);
        setSelectedDate('');
        setSelectedSlot('');
        return;
      }
    }

    if (selectedDate) {
      const diaActualStr = selectedDate.trim().split(' ')[0] as DiaSemanaClinico;
      if (!diasPermitidosEnSede.includes(diaActualStr)) {
        const primerDiaDisponible = semana6Dias.find((d) => !d.noDisponibleEnSede);
        setSelectedDate(primerDiaDisponible ? primerDiaDisponible.fullString : '');
      }
    }

    if (selectedSlot) {
      const esSlotManana = morningSlots.some((s) => s.hora === selectedSlot);
      const esSlotTarde = afternoonSlots.some((s) => s.hora === selectedSlot);
      if ((esSlotManana && !mananaHabilitado) || (esSlotTarde && !tardeHabilitado)) {
        setSelectedSlot('');
      }
    }
  }, [
    sedeEfectiva,
    selectedDoctor?.id,
    diasPermitidosEnSede.join(','),
    mananaHabilitado,
    tardeHabilitado,
  ]);

  return (
    <div className="flex flex-col gap-4 pb-44">
      {/* =====================================================================
          VENTANA EMERGENTE (MODAL) DE LOGIN Y VALIDACIÓN DE CÉDULA
         ===================================================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-surface-clean-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-[0_20px_50px_rgba(23,18,29,0.35)] border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-dental-deep-navy to-status-success" />

            {/* MARQUEZINA ANIMADA 100% DINÁMICA EN MOVIMIENTO (SIN ELEMENTOS FIJOS) */}
            <div className="w-full bg-surface-subtle-ice border border-border-subtle/80 py-2 px-3 rounded-2xl overflow-hidden relative shadow-xs">
              <div className="overflow-hidden whitespace-nowrap w-full relative">
                <div className="animate-marquee inline-flex items-center gap-6 text-[11px] font-semibold text-dental-deep-navy tracking-wide">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-white px-2 py-0.5 rounded-lg border border-border-subtle/60 shadow-2xs">
                    <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                    <span className="tabular-nums">{currentTime}</span>
                  </span>
                  <span>✨ Bienvenidos a OdontoSalud La Victoria y Colonia Tovar · La Clínica Odontológica de la familia victoriana y coloniera ✨</span>
                  <span className="text-primary font-black">✦</span>
                  <span>📍 Sedes en La Victoria (C.C. Márquez del Toro) y La Colonia Tovar (C. C San Martín de Tours) con equipamiento digital RVG 2.0 y bioseguridad certificada</span>
                  <span className="text-primary font-black">✦</span>
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-white px-2 py-0.5 rounded-lg border border-border-subtle/60 shadow-2xs">
                    <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                    <span className="tabular-nums">{currentTime}</span>
                  </span>
                  <span>✨ Bienvenidos a OdontoSalud La Victoria y Colonia Tovar · La Clínica Odontológica de la familia victoriana y coloniera ✨</span>
                  <span className="text-primary font-black">✦</span>
                  <span>📍 Sedes en La Victoria (C.C. Márquez del Toro) y La Colonia Tovar (C. C San Martín de Tours) con equipamiento digital RVG 2.0 y bioseguridad certificada</span>
                </div>
              </div>
            </div>

            {/* Cabecera del Modal con Logo Vertical */}
            <div className="flex items-center gap-3.5 border-b border-border-subtle pb-3">
              <img
                src="/brand/logo-odontosalud-vertical.png"
                alt="Logo OdontoSalud La Victoria"
                className="h-16 w-16 object-contain shrink-0"
              />
              <div className="min-w-0">
                <h2 className="font-display font-extrabold text-lg sm:text-xl text-dental-deep-navy leading-snug">
                  Registrate y Valida tu Identidad 😊👍
                </h2>
                <p className="text-xs text-secondary mt-0.5">
                  Ingresa tu cédula para consultar tu historial clínico y agilizar tu turno.
                </p>
              </div>
            </div>

            {/* Campo de Validación de Cédula con Feedback */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-dental-deep-navy flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                  Número de Cédula de Identidad *
                </span>
                <span className="text-[10px] text-secondary font-semibold">
                  Validación automática (2 seg)
                </span>
              </label>

              <div className="flex gap-2">
                <select
                  value={authCedulaTipo}
                  onChange={(e) => setAuthCedulaTipo(e.target.value as any)}
                  className="h-12 px-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle text-xs font-black text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                >
                  <option value="V">V-</option>
                  <option value="E">E-</option>
                  <option value="J">J-</option>
                  <option value="G">G-</option>
                </select>

                <div className="relative flex-1">
                  <input
                    type="text"
                    autoFocus
                    value={authCedulaInput}
                    onChange={(e) => setAuthCedulaInput(e.target.value)}
                    placeholder="Ej. 19.845.221"
                    className="w-full h-12 pl-3.5 pr-10 rounded-2xl bg-surface-subtle-ice border border-border-subtle text-sm font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner tracking-wide"
                  />

                  {/* Icono de Estado en el Campo */}
                  <div className="absolute right-3 top-3.5 flex items-center">
                    {authStatus === 'validating' && (
                      <span className="material-symbols-outlined text-[20px] text-primary animate-spin">
                        progress_activity
                      </span>
                    )}
                    {authStatus === 'verified' && (
                      <span className="material-symbols-outlined text-[22px] text-status-success animate-in zoom-in-75">
                        check_circle
                      </span>
                    )}
                    {authStatus === 'not_found' && (
                      <span className="material-symbols-outlined text-[20px] text-primary/70 animate-in zoom-in-75">
                        person_add
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensajes de Validación */}
              {authStatus === 'validating' && (
                <p className="text-[11px] text-primary font-semibold flex items-center gap-1.5 animate-pulse mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">database</span>
                  <span>Consultando disponibilidad en la base de datos clínica...</span>
                </p>
              )}

              {/* CASO A: PACIENTE EN DATA (NOTIFICACIÓN CHECK DE VERIFICADO) */}
              {authStatus === 'verified' && pacienteEncontrado && (
                <div className="mt-2 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
                    <span className="text-xs font-black uppercase tracking-wider">
                      Paciente Verificado en Base de Datos
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-border-subtle/80 text-left shadow-xs">
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-dental-deep-navy">
                      ¡Bienvenido(a), {pacienteEncontrado.nombres}!
                    </h3>

                    <div className="mt-2.5 pt-2 border-t border-border-subtle/70 space-y-2 text-xs">
                      <div className="flex items-start gap-2.5 pb-1.5 border-b border-border-subtle/40">
                        <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">event</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Última Cita Registrada</span>
                          <span className="font-bold text-dental-deep-navy block">
                            {pacienteEncontrado.fechaCita || 'Reciente'} {pacienteEncontrado.horaInicio ? `• ${pacienteEncontrado.horaInicio}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 pb-1.5 border-b border-border-subtle/40">
                        <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">stethoscope</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Doctor Tratante</span>
                          <span className="font-bold text-dental-deep-navy block">
                            {pacienteEncontrado.doctorNombre || 'Dra. María Alejandra Domínguez'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">clinical_notes</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Motivo Previo</span>
                            <span className="font-bold text-dental-deep-navy block truncate">
                              {pacienteEncontrado.motivo || 'Evaluación Integral'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">call</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Teléfono Registrado</span>
                            <span className="font-bold text-dental-deep-navy block">
                              {pacienteEncontrado.telefono}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Datos demográficos y clínicos consultados */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border-subtle/50 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">wc</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Sexo / Nacimiento</span>
                            <span className="font-bold text-dental-deep-navy block">
                              {pacienteEncontrado.sexo || 'No especificado'} {pacienteEncontrado.fechaNacimiento ? `• ${pacienteEncontrado.fechaNacimiento}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">mail</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Correo Registrado</span>
                            <span className="font-bold text-dental-deep-navy truncate block">
                              {pacienteEncontrado.email || 'No registrado'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleContinuarPacienteRegistrado}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Confirmar Datos y Continuar</span>
                  </button>
                </div>
              )}

              {/* CASO B: PACIENTE NO REGISTRADO TRAS EL DELAY DE 2 SEGUNDOS */}
              {authStatus === 'not_found' && (
                <div className="mt-2 p-3.5 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    <span className="text-xs font-black uppercase tracking-wider">
                      Registro de Nuevo Paciente en Data Clínica
                    </span>
                  </div>

                  <p className="text-xs text-secondary leading-snug">
                    No encontramos citas previas con esta cédula. Por favor completa los siguientes campos iniciales para registrar tu expediente y continuar con la reserva:
                  </p>

                  <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-border-subtle text-left">
                    <div>
                      <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                        Nombres y Apellidos Completos *
                      </label>
                      <input
                        type="text"
                        required
                        value={nuevoNombres}
                        onChange={(e) => setNuevoNombres(e.target.value)}
                        placeholder="Ej. Roberto Carlos Gómez"
                        className="w-full h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                          Sexo *
                        </label>
                        <select
                          value={nuevoSexo}
                          onChange={(e) => setNuevoSexo(e.target.value as any)}
                          className="w-full h-10 px-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="Femenino">Femenino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                          Fecha de Nacimiento *
                        </label>
                        <input
                          type="date"
                          required
                          value={nuevoFechaNacimiento}
                          onChange={(e) => setNuevoFechaNacimiento(e.target.value)}
                          className="w-full h-10 px-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                        Teléfono Móvil (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={nuevoTelefono}
                        onChange={(e) => setNuevoTelefono(e.target.value)}
                        placeholder="+58 412-0000000"
                        className="w-full h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!nuevoNombres.trim()}
                    onClick={handleContinuarPacienteNuevo}
                    className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-dental-deep-navy disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuar con la Reserva de Cita</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>

            {/* PIE DE PÁGINA DEL MODAL LOGIN: COPYRIGHT 2026 */}
            <div className="pt-3 border-t border-border-subtle flex items-center justify-center">
              <p className="text-[11px] text-center text-secondary font-medium tracking-wide">
                Copyright 2026 - OdontoSalud La Victoria
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL DE CITA CONFIRMADA (VOUCHER CLÍNICO DIGITAL)
         ===================================================================== */}
      {bookingConfirmed && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-surface-clean-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-border-subtle text-center flex flex-col items-center gap-3 max-h-[92vh] overflow-y-auto">
            {/* Logo Horizontal Institucional del Consultorio para Reforzar Identidad */}
            <div className="flex items-center justify-center gap-2.5 pb-2.5 border-b border-border-subtle/80 w-full">
              <img
                src="/brand/logo-odontosalud-vertical.png"
                alt="Logo OdontoSalud La Victoria"
                className="h-10 w-10 sm:h-11 sm:w-11 object-contain shrink-0"
              />
              <div className="text-left min-w-0">
                <div className="font-display font-black text-sm sm:text-base text-dental-deep-navy leading-tight tracking-tight truncate">
                  OdontoSalud <span className="text-primary font-bold">La Victoria</span>
                </div>
                <div className="text-[10px] text-secondary font-semibold tracking-wide truncate">
                  Centro de Especialidades Odontológicas
                </div>
              </div>
            </div>

            <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-0.5 border border-emerald-100 shadow-xs">
              <span className="material-symbols-outlined text-[30px]">verified</span>
            </div>

            <div>
              <span className="px-3 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                Solicitud Pre-Aprobada
              </span>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-dental-deep-navy mt-1">
                ¡Cita Registrada!
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-subtle-ice border border-border-subtle/80 text-xs text-secondary mt-1.5">
                <span>Código de Turno:</span>
                <strong className="font-mono text-primary font-black tracking-wider text-sm">{codigoConfirmacion}</strong>
              </div>
            </div>

            {/* TABLA / TARJETA CLÍNICA DE DATOS 100% LEGIBLE Y ESTRUCTURADA */}
            <div className="w-full bg-[#FAF8FB] rounded-2xl border border-border-subtle/80 p-3.5 sm:p-4 text-left divide-y divide-border-subtle/60 space-y-2.5">
              {/* Paciente */}
              <div className="flex items-center gap-3 pt-0 pb-1">
                {fotoSelfie ? (
                  <img
                    src={fotoSelfie}
                    alt={nombres}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/25 shrink-0 shadow-xs"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">person</span>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Paciente</span>
                  <span className="text-sm font-bold text-dental-deep-navy leading-snug block">{nombres}</span>
                </div>
              </div>

              {/* Tratamiento Clínico */}
              <div className="flex items-start gap-3 pt-2.5 pb-1">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">medical_services</span>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Tratamiento Clínico</span>
                  <span className="text-xs sm:text-sm font-bold text-dental-deep-navy leading-snug block">{treatment}</span>
                </div>
              </div>

              {/* Fecha y Turno */}
              <div className="flex items-start gap-3 pt-2.5 pb-1">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">calendar_month</span>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Fecha y Turno</span>
                  <span className="text-xs sm:text-sm font-bold text-dental-deep-navy leading-snug block">
                    {selectedDate} <span className="text-primary font-black">•</span> {selectedSlot}
                  </span>
                </div>
              </div>

              {/* Profesional Asignado */}
              <div className="flex items-start gap-3 pt-2.5 pb-1">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">stethoscope</span>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Profesional Asignado</span>
                  <span className="text-xs sm:text-sm font-bold text-dental-deep-navy leading-snug block">
                    {selectedDoctor ? selectedDoctor.nombre : 'Asignado'} <span className="text-secondary font-medium text-xs">(Box 0{selectedDoctor ? selectedDoctor.box : 1})</span>
                  </span>
                </div>
              </div>

              {/* Sede OdontoSalud */}
              <div className="flex items-start gap-3 pt-2.5 pb-1">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">location_on</span>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Sede OdontoSalud</span>
                  <span className="text-xs sm:text-sm font-bold text-dental-deep-navy leading-snug block">
                    {selectedSedeId ? SEDES_DISPONIBLES[selectedSedeId].nombre : sedeActiva.nombre}
                  </span>
                  <span className="text-[10px] text-secondary block">
                    {selectedSedeId ? SEDES_DISPONIBLES[selectedSedeId].direccion : sedeActiva.direccion}
                  </span>
                </div>
              </div>

              {/* Condición / Observación Médica */}
              {condicionSeleccionada && (
                <div className="flex items-start gap-3 pt-2.5">
                  <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">health_and_safety</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">Condición / Observación Médica</span>
                    <span className="text-xs font-bold text-primary leading-snug block">{condicionSeleccionada.nombre}</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-secondary leading-relaxed px-2 text-center">
              Recepción central de <strong className="text-dental-deep-navy font-semibold">{selectedSedeId ? SEDES_DISPONIBLES[selectedSedeId].nombre : sedeActiva.nombre}</strong> reservará tu Box clínico de forma inmediata.
            </p>

            <div className="w-full flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={compartirPorWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Compartir Cita vía WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={abrirWhatsAppConfirmacion}
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-plum-royal text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">chat</span>
                <span>Confirmar con Recepción por WhatsApp</span>
              </button>

              {/* Botón dividido en 2: "Otra Cita" y "Cerrar" */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setBookingConfirmed(false);
                    setSelectedSedeId(null);
                    setSelectedDoctor(null);
                    setTreatment('');
                    setSelectedDate('');
                    setSelectedSlot('');
                    setNombres('');
                    setCedulaNumero('');
                    setTelefono('');
                    setMotivo('');
                    setOpenStep('sede');
                    setShowAuthModal(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-surface-subtle-ice text-primary font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-border-subtle shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Otra Cita</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBookingConfirmed(false);
                    if (onNavigateTab) {
                      onNavigateTab('dashboard');
                    } else if (onBack) {
                      onBack();
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-surface-subtle-ice hover:bg-surface-container text-dental-deep-navy font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-border-subtle shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  <span>Cerrar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          HEADER COMPACTO CON LOGO Y BOTÓN DE RETROCESO PROFESIONAL
         ===================================================================== */}
      <section className="bg-surface-clean-white rounded-3xl p-4 shadow-soft-elevated border border-border-subtle flex items-center justify-between gap-3 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-dental-deep-navy to-status-success" />

        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Botón Atrás Profesional y Ergonómico */}
          <button
            type="button"
            onClick={retrocederPaso}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-xs font-bold text-dental-deep-navy transition-all active:scale-95 shrink-0 shadow-2xs group cursor-pointer"
            title={openStep === 'sede' ? 'Volver al Inicio' : 'Volver al paso anterior'}
          >
            <span className="material-symbols-outlined text-[18px] text-primary group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span className="hidden sm:inline">{getTextoRetroceso()}</span>
          </button>

          <img
            src="/brand/logo-odontosalud-vertical.png"
            alt="Logo OdontoSalud La Victoria"
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-base sm:text-xl text-dental-deep-navy leading-tight tracking-tight truncate">
              Reserva tu Cita Odontológica
            </h1>
            <p className="text-xs text-secondary mt-0.5 truncate">
              {selectedSedeId ? SEDES_DISPONIBLES[selectedSedeId].nombre : sedeActiva.nombre} • Dra. María Alejandra Domínguez y equipo
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-xs font-bold text-dental-deep-navy transition-all active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
          <span className="hidden sm:inline">
            {cedulaNumero ? `${cedulaTipo}-${cedulaNumero}` : 'Validar Cédula'}
          </span>
        </button>
      </section>

      {/* =====================================================================
          MARQUESINA ANIMADA TIPO WALL STREET (100% EN MOVIMIENTO Y NADA FIJO)
         ===================================================================== */}
      <div className="w-full bg-surface-subtle-ice border border-border-subtle/80 py-2 px-3 rounded-2xl overflow-hidden relative shadow-xs">
        <div className="overflow-hidden whitespace-nowrap w-full relative">
          <div className="animate-marquee inline-flex items-center gap-6 text-[11px] font-semibold text-dental-deep-navy tracking-wide">
            <span className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-white px-2 py-0.5 rounded-lg border border-border-subtle/60 shadow-2xs">
              <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
              <span className="tabular-nums">{currentTime}</span>
            </span>
            <span>✨ Bienvenidos a OdontoSalud La Victoria y Colonia Tovar · La Clínica Odontológica de la familia victoriana y coloniera ✨</span>
            <span className="text-primary font-black">✦</span>
            <span>📍 Atención Integral en Sede La Victoria (C.C. Márquez del Toro) y Sede La Colonia Tovar (C. C San Martín de Tours)</span>
            <span className="text-primary font-black">✦</span>
            <span className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-white px-2 py-0.5 rounded-lg border border-border-subtle/60 shadow-2xs">
              <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
              <span className="tabular-nums">{currentTime}</span>
            </span>
            <span>✨ Bienvenidos a OdontoSalud La Victoria y Colonia Tovar · La Clínica Odontológica de la familia victoriana y coloniera ✨</span>
            <span className="text-primary font-black">✦</span>
            <span>📍 Atención Integral en Sede La Victoria (C.C. Márquez del Toro) y Sede La Colonia Tovar (C. C San Martín de Tours)</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          PASO 1: ELIGE TU SEDE ODONTOSALUD 🏢 🌲 (TARJETA NRO 1 DE #RESERVA)
         ===================================================================== */}
      {openStep === 'sede' && (
        <section
          ref={sedeCardRef}
          className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-3 duration-300 scroll-mt-4"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy">
                  Paso 1 de 5
                </span>
                <span className="text-xs text-secondary">• 02 Sedes Clínicas Disponibles</span>
              </div>
              <h2 className="font-display font-extrabold text-lg text-dental-deep-navy mt-1">
                Elige tu Sede OdontoSalud 🏢 🌲
              </h2>
            </div>
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
            </span>
          </div>

          <p className="text-xs text-secondary">
            Selecciona la sede clínica donde deseas agendar tu consulta y tratamiento dental:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Sede 1: La Victoria */}
            <button
              type="button"
              onClick={() => {
                setSelectedSedeId('victoria');
                cambiarSede('victoria');
                setOpenStep('doctor');
                setTimeout(() => {
                  doctorCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-2.5 transition-all active:scale-95 cursor-pointer relative overflow-hidden group ${
                selectedSedeId === 'victoria'
                  ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-md'
                  : 'border-border-subtle hover:border-primary/50 bg-surface-clean-white shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[26px]">apartment</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  Sede Principal
                </span>
              </div>

              <div>
                <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                  OdontoSalud La Victoria
                </h3>
                <p className="text-xs text-primary font-bold mt-0.5">
                  Sede Principal • Boxes 1 y 2 & Cirugía RVG
                </p>
                <p className="text-[11px] text-secondary mt-1 flex items-start gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary shrink-0 mt-0.5">pin_drop</span>
                  <span>C. C. Márquez del Toro, Planta Baja, Local 18, La Victoria, Aragua</span>
                </p>
              </div>

              <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[11px]">
                <span className="text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-status-success">medical_services</span>
                  <span>2 Boxes Clínicos & RVG 2.0</span>
                </span>
                <span className="font-bold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  <span>Seleccionar</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </button>

            {/* Sede 2: Colonia Tovar */}
            <button
              type="button"
              onClick={() => {
                setSelectedSedeId('tovar');
                cambiarSede('tovar');
                setOpenStep('doctor');
                setTimeout(() => {
                  doctorCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col gap-2.5 transition-all active:scale-95 cursor-pointer relative overflow-hidden group ${
                selectedSedeId === 'tovar'
                  ? 'border-status-success ring-2 ring-status-success/30 bg-emerald-50/30 shadow-md'
                  : 'border-border-subtle hover:border-status-success/50 bg-surface-clean-white shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[26px]">cottage</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Sucursal Montaña
                </span>
              </div>

              <div>
                <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                  OdontoSalud La Colonia Tovar
                </h3>
                <p className="text-xs text-status-success font-bold mt-0.5">
                  Sucursal • Box Clínico & Atención Integral
                </p>
                <p className="text-[11px] text-secondary mt-1 flex items-start gap-1">
                  <span className="material-symbols-outlined text-[15px] text-status-success shrink-0 mt-0.5">pin_drop</span>
                  <span>Casco Central, Av. Codazzi, C. C San Martín de Tours, Planta Alta, Local N° 7</span>
                </p>
              </div>

              <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[11px]">
                <span className="text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-status-success">forest</span>
                  <span>1 Box Clínico & Montaña</span>
                </span>
                <span className="font-bold text-status-success group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  <span>Seleccionar</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* =====================================================================
          PASO 2: ELIGE TU ODONTÓLOGO DISPONIBLE POR SEDE (DIRECTO Y SIN FRICCIÓN)
         ===================================================================== */}
      {openStep === 'doctor' && (
        <section
          ref={doctorCardRef}
          className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 animate-in fade-in slide-in-from-top-3 duration-300 scroll-mt-4"
        >
          {/* Cabecera del Paso 2 */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy">
                  Paso 2 de 5
                </span>
                <span className="text-xs text-secondary">
                  • {doctoresEmpadronados.length} {doctoresEmpadronados.length === 1 ? 'facultativo disponible' : 'facultativos disponibles'}
                </span>
              </div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy mt-1">
                Elige tu Odontólogo en {sedeEfectiva === 'tovar' ? 'La Colonia Tovar' : 'La Victoria'} ⭐❤️
              </h2>
            </div>

            <button
              type="button"
              onClick={retrocederPaso}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-xs font-bold text-dental-deep-navy shadow-2xs transition-all active:scale-95 group shrink-0 cursor-pointer"
              title="Cambiar Sede"
            >
              <span className="material-symbols-outlined text-[16px] text-primary group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              <span>Cambiar Sede</span>
            </button>
          </div>

          <p className="text-xs text-secondary">
            Profesionales disponibles según horario cargado para <strong>{sedeEfectiva === 'tovar' ? 'La Colonia Tovar' : 'La Victoria'}</strong>. Al tocar su tarjeta, se guardará y avanzará a la elección del tratamiento.
          </p>

          {/* Grilla Directa y Fluida de Odontólogos Disponibles (Sin fricción ni botones extras) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {doctoresEmpadronados.map((doc) => {
              const isSelected = selectedDoctor?.id === doc.id;
              const diasEnSedeActiva =
                sedeEfectiva === 'tovar' ? doc.diasTovar || [] : doc.diasVictoria || [];

              const horarioTurnoTexto =
                doc.turno === 'Mañana'
                  ? '🌅 Turno Mañana (08:30 AM – 12:30 PM)'
                  : doc.turno === 'Tarde'
                  ? '🌇 Turno Tarde (01:15 PM – 05:00 PM)'
                  : '⭐ Jornada Completa (08:30 AM – 05:00 PM)';

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setSelectedDoctor(doc);
                    irAPaso('treatment');
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3.5 transition-all cursor-pointer active:scale-[0.98] relative overflow-hidden group ${
                    isSelected
                      ? 'bg-surface-clean-white border-2 border-primary shadow-lg ring-4 ring-primary/15'
                      : 'bg-surface-subtle-ice border-border-subtle hover:bg-white hover:border-primary/40 hover:shadow-sm'
                  }`}
                >
                  {/* Etiqueta de Doctor Seleccionado */}
                  {isSelected && (
                    <span className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                      <span className="absolute transform rotate-45 bg-primary text-white text-[8.5px] font-black py-0.5 right-[-24px] top-[14px] w-[90px] text-center shadow-xs">
                        ELEGIDO
                      </span>
                    </span>
                  )}

                  {/* Cabecera del Doctor con Avatar Protegido */}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={cleanAvatar(doc.avatar, doc.nombre, doc.box)}
                        alt={doc.nombre}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getDoctorAvatar(doc.nombre, doc.box);
                        }}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20 shadow-sm bg-white"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-status-success ring-2 ring-white flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 pr-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-extrabold uppercase tracking-wide">
                          {doc.titulo}
                        </span>
                        <span className="font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[9.5px]">
                          Box 0{doc.box}
                        </span>
                      </div>
                      <h3 className="font-display font-black text-sm text-dental-deep-navy mt-1 leading-snug group-hover:text-primary transition-colors">
                        {doc.nombre}
                      </h3>
                      <p className="text-[11px] text-secondary truncate mt-0.5">
                        {doc.especialidad}
                      </p>
                    </div>
                  </div>

                  {/* Disponibilidad Semanal en Resumen Ejecutivo (Chips de Días Clínicos) */}
                  <div className="bg-white rounded-xl p-2.5 border border-border-subtle/80 flex flex-col gap-2 shadow-2xs">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-extrabold text-dental-deep-navy flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-primary">event_available</span>
                        <span>Días de guardia en {sedeEfectiva === 'tovar' ? 'Colonia Tovar' : 'La Victoria'}:</span>
                      </span>
                      <span className="text-[10px] font-bold text-primary">
                        {diasEnSedeActiva.length} {diasEnSedeActiva.length === 1 ? 'día' : 'días'}
                      </span>
                    </div>

                    {/* Matriz de Chips Semanales Exclusivos de esta Sede */}
                    <div className="grid grid-cols-6 gap-1">
                      {DIAS_SEMANA_CLINICOS.map((dia) => {
                        const enEstaSede = diasEnSedeActiva.includes(dia);

                        return (
                          <div
                            key={dia}
                            className={`py-1 rounded-lg text-center font-black text-[9.5px] transition-all flex flex-col items-center justify-center ${
                              enEstaSede
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-slate-100 text-slate-350 opacity-40 line-through'
                            }`}
                            title={
                              enEstaSede
                                ? `Atiende en ${sedeEfectiva === 'tovar' ? 'Colonia Tovar' : 'La Victoria'}`
                                : 'Sin guardia este día'
                            }
                          >
                            <span>{dia}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Días Explícitos de esta sede */}
                    <div className="pt-1.5 border-t border-border-subtle/60 flex items-center justify-between text-[10.5px] text-dental-deep-navy">
                      <span className="text-secondary font-medium">Atención:</span>
                      <strong className="text-primary font-bold">
                        {diasEnSedeActiva.join(' · ') || 'Sin guardia asignada'}
                      </strong>
                    </div>
                  </div>

                  {/* Franja de Horario / Turno Clínico */}
                  <div className="flex items-center justify-between bg-surface-container/40 px-2.5 py-1.5 rounded-xl border border-border-subtle/60 text-[10.5px]">
                    <span className="font-bold text-dental-deep-navy flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">schedule</span>
                      <span>{horarioTurnoTexto}</span>
                    </span>
                    <span className="text-[10px] font-bold text-status-success flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                      <span>{doc.turno || 'Jornada Completa'}</span>
                    </span>
                  </div>

                  {/* Botón de Acción Directo */}
                  <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50 text-[11px]">
                    <span className="text-secondary text-[10px]">
                      Toca para elegir este profesional
                    </span>
                    <span className={`font-extrabold flex items-center gap-1 ${isSelected ? 'text-primary' : 'text-dental-deep-navy group-hover:text-primary'}`}>
                      <span>{isSelected ? '✓ Seleccionado' : 'Elegir'}</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {isSelected ? 'check' : 'arrow_forward'}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================================
          PASO 3: TIPO DE TRATAMIENTO (02 COLUMNAS EN MÓVIL)
         ===================================================================== */}
      {openStep === 'treatment' && (
        <section
          ref={treatmentCardRef}
          className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-3 duration-300 scroll-mt-4"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy">
                  Paso 3 de 5
                </span>
                <span className="text-xs text-secondary">• Procedimiento clínico</span>
              </div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy mt-1">
                Tipo de Tratamiento
              </h2>
            </div>
            <button
              type="button"
              onClick={retrocederPaso}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-xs font-bold text-dental-deep-navy shadow-2xs transition-all active:scale-95 group shrink-0 cursor-pointer"
              title="Volver a elegir Odontólogo"
            >
              <span className="material-symbols-outlined text-[16px] text-primary group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              <span>Cambiar Odontólogo</span>
            </button>
          </div>

          <p className="text-xs text-secondary">
            Toca el tratamiento deseado. La tarjeta se cerrará sola y avanzará a la selección de horario.
          </p>

          {/* ORGANIZADO EN 02 COLUMNAS EN MÓVIL SEGÚN SOLICITUD */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {treatments.map((t) => {
              const isSelected = treatment === t.nombre;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTreatment(t.nombre);
                    setTreatmentDesc(t.desc);
                    setOpenStep('datetime');
                    setTimeout(() => {
                      datetimeCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 80);
                  }}
                  className={`text-left p-3 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-surface-container border-2 border-primary shadow-md ring-2 ring-primary/20'
                      : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
                        t.isUrgent
                          ? 'bg-status-danger/10 text-status-danger'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[22px]">
                        {t.icon}
                      </span>
                    </span>
                    {t.isUrgent ? (
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold text-status-danger bg-status-danger/10 inline-flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-danger animate-ping" />
                        Urgente
                      </span>
                    ) : isSelected ? (
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[12px] sm:text-[14px]">check</span>
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <p className="font-bold text-xs sm:text-sm text-dental-deep-navy leading-snug line-clamp-2">
                      {t.nombre}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-secondary mt-0.5 line-clamp-2">
                      {t.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border-subtle/80 flex items-center justify-between text-[10px] sm:text-[11px] text-primary font-bold">
                    <span>Elegir</span>
                    <span className="material-symbols-outlined text-[14px]">touch_app</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================================
          PASO 4: SELECCIONA FECHA Y TURNO
         ===================================================================== */}
      {openStep === 'datetime' && (
        <section
          ref={datetimeCardRef}
          className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 animate-in fade-in slide-in-from-top-3 duration-300 scroll-mt-4"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy">
                  Paso 4 de 5
                </span>
                <span className="text-xs text-secondary">• Cupos en tiempo real</span>
              </div>
              <h2 className="font-display font-extrabold text-lg text-dental-deep-navy mt-1">
                Selecciona Fecha y Turno
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs text-primary font-bold bg-surface-container px-2.5 py-1 rounded-full">
                Box 0{selectedDoctor ? selectedDoctor.box : 1}
              </span>
              <button
                type="button"
                onClick={retrocederPaso}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-xs font-bold text-dental-deep-navy shadow-2xs transition-all active:scale-95 group shrink-0 cursor-pointer"
                title="Volver a seleccionar Tratamiento"
              >
                <span className="material-symbols-outlined text-[16px] text-primary group-hover:-translate-x-0.5 transition-transform">
                  arrow_back
                </span>
                <span>Cambiar Tratamiento</span>
              </button>
            </div>
          </div>

          {/* Banner Informativo de Ajuste de Horarios y Disponibilidad por Sede sujeta a #Data */}
          <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col gap-2 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <span className="material-symbols-outlined text-[19px]">schedule</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-black tracking-wider text-primary bg-white px-2 py-0.5 rounded-md border border-primary/30 shadow-2xs">
                    ⏱️ Duración Estimada: {duracionTratamientoMin} min
                  </span>
                  <span className="text-xs font-bold text-dental-deep-navy truncate">
                    {treatment || 'Evaluación Odontológica Integral'}
                  </span>
                </div>
                <p className="text-[11px] text-secondary mt-1 leading-snug">
                  Atención con <strong className="text-dental-deep-navy">{doctorVivoEnData ? doctorVivoEnData.nombre : 'Odontólogo Asignado'}</strong> en{' '}
                  <strong className="text-primary">
                    {sedeEfectiva === 'tovar' ? 'Sede Colonia Tovar' : 'Sede La Victoria'}
                  </strong>{' '}
                  (Box 0{doctorVivoEnData ? doctorVivoEnData.box : 1}).
                </p>
              </div>
            </div>

            {/* Píldora de Regla de Disponibilidad Sincronizada con #Data */}
            <div className="pt-2 border-t border-primary/15 flex items-center justify-between flex-wrap gap-2 text-[10.5px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-dental-deep-navy flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-status-success">event_available</span>
                  Días habilitados en {sedeEfectiva === 'tovar' ? 'Colonia Tovar' : 'La Victoria'} (#Data):
                </span>
                {diasPermitidosEnSede.map((dia) => (
                  <span
                    key={`badge-disp-${dia}`}
                    className="px-1.5 py-0.5 rounded-md bg-primary text-white font-black text-[9.5px]"
                  >
                    {dia}
                  </span>
                ))}
                <span className="text-[10px] font-bold text-secondary ml-1">
                  • Turno: <strong className="text-dental-deep-navy">{turnoDoctorEnData}</strong>
                </span>
              </div>

              {diasDoctorEnOtraSede.length > 0 && (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {sedeEfectiva === 'tovar' ? '🏢 En La Victoria:' : '🌲 En Col. Tovar:'}{' '}
                  <strong>{diasDoctorEnOtraSede.join(', ')}</strong>
                </span>
              )}
            </div>
          </div>

          {/* ===================================================================
              SECCIÓN 1: SELECCIONA EL DÍA (VISIÓN SEMANAL DE 6 DÍAS / MENSUAL)
             =================================================================== */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-dental-deep-navy flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
                1. Selecciona el Día:
              </span>

              {/* Conmutador de Vistas: Visión Semanal de 6 Días vs Cupos del Mes */}
              <div className="inline-flex p-1 bg-surface-subtle-ice border border-border-subtle rounded-2xl text-[11px] font-bold shadow-inner">
                <button
                  type="button"
                  onClick={() => setDateViewMode('semanal')}
                  className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    dateViewMode === 'semanal'
                      ? 'bg-dental-deep-navy text-white shadow-xs'
                      : 'text-secondary hover:text-dental-deep-navy'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">view_week</span>
                  <span>Semana (6 Días)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDateViewMode('mensual')}
                  className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    dateViewMode === 'mensual'
                      ? 'bg-dental-deep-navy text-white shadow-xs'
                      : 'text-secondary hover:text-dental-deep-navy'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">calendar_view_month</span>
                  <span>Cupos del Mes</span>
                </button>
              </div>
            </div>

            {/* VISTA 1: VISIÓN SEMANAL DE 6 DÍAS CON INDICADOR VISUAL DE COMPLETITUD */}
            {dateViewMode === 'semanal' && (
              <div className="flex flex-col gap-2">
                {/* Barra de Navegación de Semanas */}
                <div className="flex items-center justify-between bg-surface-subtle-ice px-3 py-2 rounded-2xl border border-border-subtle text-xs">
                  <button
                    type="button"
                    disabled={weekOffset <= 0}
                    onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                    className={`px-2.5 py-1 rounded-xl border font-bold text-dental-deep-navy flex items-center gap-1 transition-all text-[11px] shadow-2xs ${
                      weekOffset <= 0
                        ? 'bg-slate-100 text-slate-350 border-slate-200 cursor-not-allowed opacity-50'
                        : 'bg-white border-border-subtle hover:bg-surface-container active:scale-95 cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                    <span>Anterior</span>
                  </button>

                  <div className="text-center font-bold text-dental-deep-navy text-xs">
                    <span className="text-secondary text-[11px] font-normal mr-1">Rango Semanal:</span>
                    <strong className="text-dental-deep-navy">
                      {semana6Dias[0]?.numero} {semana6Dias[0]?.mesCorto} — {semana6Dias[5]?.numero} {semana6Dias[5]?.mesCorto} {semana6Dias[0]?.dateObj.getFullYear()}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {weekOffset !== 0 && (
                      <button
                        type="button"
                        onClick={() => setWeekOffset(0)}
                        className="px-2 py-1 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary hover:text-white transition-all text-[10px] cursor-pointer"
                      >
                        Semana Base
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setWeekOffset((prev) => prev + 1)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-border-subtle hover:bg-surface-container font-bold text-dental-deep-navy flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-[11px] shadow-2xs"
                    >
                      <span>Siguiente</span>
                      <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Grilla de los 6 Días Hábiles: 2 filas x 3 columnas en móvil (grid-cols-3) y 6 columnas en desktop (sm:grid-cols-6) */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
                  {semana6Dias.map((d) => {
                    const isSelected =
                      !d.noDisponibleEnSede &&
                      !d.esPasado &&
                      (selectedDate === d.fullString ||
                        (selectedDate.includes(d.numero) && selectedDate.includes(d.diaSemana)));

                    if (d.noDisponibleEnSede || d.esPasado) {
                      return (
                        <div
                          key={d.fullString}
                          title={
                            d.esPasado
                              ? 'Fecha pasada no disponible para reserva'
                              : d.atiendeEnOtraSede
                              ? `El especialista atiende este día en ${
                                  sedeEfectiva === 'tovar' ? 'Sede La Victoria' : 'Sede Colonia Tovar'
                                }`
                              : 'Día sin guardia registrada para esta sede en #Data'
                          }
                          className="p-2 sm:p-2.5 rounded-2xl text-center flex flex-col items-center justify-between relative overflow-hidden border border-slate-200 bg-slate-100/80 text-slate-400 select-none opacity-75"
                        >
                          <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-300 rounded-l-2xl" />
                          <div className="w-full pl-2 flex flex-col items-center justify-center">
                            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-slate-400">
                              {d.diaSemana}
                            </span>
                            <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight leading-none my-0.5 text-slate-400 line-through decoration-slate-400/60">
                              {d.numero}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              {d.mesCorto}
                            </span>
                            <div className="w-full pt-1.5 border-t border-slate-200/80 mt-1 flex flex-col items-center gap-0.5">
                              <span className="text-[8px] sm:text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600 inline-flex items-center gap-0.5 leading-tight text-center">
                                <span className="material-symbols-outlined text-[10px]">
                                  {d.esPasado ? 'history' : 'block'}
                                </span>
                                <span className="truncate">
                                  {d.esPasado
                                    ? 'Pasado'
                                    : d.atiendeEnOtraSede
                                    ? sedeEfectiva === 'tovar'
                                      ? 'En La Victoria'
                                      : 'En Col. Tovar'
                                    : 'No atiende'}
                                </span>
                              </span>
                              <span className="text-[8px] font-bold text-slate-400">
                                {d.esPasado ? 'No disponible' : 'Según #Data'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={d.fullString}
                        type="button"
                        onClick={() => setSelectedDate(d.fullString)}
                        className={`p-2 sm:p-2.5 rounded-2xl text-center transition-all flex flex-col items-center justify-between active:scale-95 cursor-pointer relative overflow-hidden border ${
                          isSelected
                            ? 'bg-dental-deep-navy text-white shadow-lg ring-2 ring-primary border-primary'
                            : 'bg-white border-border-subtle hover:border-primary/40 hover:bg-surface-subtle-ice text-dental-deep-navy shadow-2xs'
                        }`}
                      >
                        {/* Barra indicadora vertical en sentido de borde izquierdo: grosor representa la completitud/ocupación (Verde fino, Amarillo medio, Rojo grueso) */}
                        <span
                          className={`absolute left-0 top-0 bottom-0 rounded-l-2xl transition-all duration-300 ${
                            d.estado === 'critico'
                              ? 'w-3.5 sm:w-4 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)] animate-pulse'
                              : d.estado === 'moderado'
                              ? 'w-2 sm:w-2.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                              : 'w-1 sm:w-1.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                          }`}
                        />

                        {/* Contenido de alta legibilidad */}
                        <div className="w-full pl-2.5 sm:pl-3 flex flex-col items-center justify-center">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[11px] sm:text-xs font-black tracking-wider uppercase ${
                                isSelected ? 'text-primary' : 'text-secondary'
                              }`}
                            >
                              {d.diaSemana}
                            </span>
                            {d.esHoy && (
                              <span className="text-[7.5px] font-black uppercase px-1 py-0.2 rounded-full bg-status-success text-white">
                                Hoy
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight leading-none my-0.5 ${
                              isSelected ? 'text-white' : 'text-dental-deep-navy'
                            }`}
                          >
                            {d.numero}
                          </span>
                          <span
                            className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                              isSelected ? 'text-white/80' : 'text-secondary'
                            }`}
                          >
                            {d.mesCorto}
                          </span>

                          {/* Etiqueta explícita de citas libres con alto contraste */}
                          <div className="w-full pt-1.5 border-t border-border-subtle/50 mt-1 flex flex-col items-center gap-0.5">
                            <span
                              className={`text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 leading-tight text-center ${
                                d.estado === 'critico'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : d.estado === 'moderado'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              } ${isSelected ? '!bg-white/20 !text-white !border-white/30' : ''}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  d.estado === 'critico'
                                    ? 'bg-rose-500 animate-pulse'
                                    : d.estado === 'moderado'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              <span className="truncate">
                                {d.cuposLibres} {d.cuposLibres === 1 ? 'cita libre' : 'citas libres'}
                              </span>
                            </span>
                            <span className={`text-[8px] font-bold ${isSelected ? 'text-white/70' : 'text-secondary'}`}>
                              {d.porcentajeOcupacion}% ocupado
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VISTA 2: CUPOS DEL MES CON FLECHAS DE NAVEGACIÓN (MES ANTERIOR / FUTURO) */}
            {dateViewMode === 'mensual' && (
              <div className="bg-surface-subtle-ice p-3.5 sm:p-4 rounded-2xl border border-border-subtle flex flex-col gap-3">
                {/* Cabecera del Mes con Flechas */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={!puedeIrMesAnterior}
                    onClick={irMesAnterior}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold transition-all ${
                      !puedeIrMesAnterior
                        ? 'bg-slate-100 text-slate-350 border-slate-200 cursor-not-allowed opacity-40'
                        : 'bg-white border-border-subtle text-dental-deep-navy hover:bg-surface-container active:scale-95 cursor-pointer shadow-xs'
                    }`}
                    title={puedeIrMesAnterior ? 'Mes Anterior' : 'Meses anteriores no disponibles'}
                  >
                    <span className="material-symbols-outlined text-[19px]">chevron_left</span>
                  </button>

                  <div className="text-center">
                    <span className="font-display font-extrabold text-sm sm:text-base text-dental-deep-navy block">
                      {MESES_NOMBRES[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
                    </span>
                    <span className="text-[10px] text-secondary">
                      Toca un día para revisar cupos y turnos disponibles
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={irMesSiguiente}
                    className="w-9 h-9 rounded-xl bg-white border border-border-subtle flex items-center justify-center text-dental-deep-navy hover:bg-surface-container font-bold active:scale-95 cursor-pointer shadow-xs transition-all"
                    title="Mes Siguiente"
                  >
                    <span className="material-symbols-outlined text-[19px]">chevron_right</span>
                  </button>
                </div>

                {/* Leyenda de Disponibilidad Mensual */}
                <div className="flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap text-[10px] border-y border-border-subtle/80 py-1.5 bg-white/70 rounded-xl">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Alta Disp. ({'>'}4 cupos)
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Pocos Cupos (2-3)
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-800">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Último Cupo (1)
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    Domingo / Pasado
                  </span>
                </div>

                {/* Cuadrícula de 7 Columnas del Mes */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
                  {/* Días Cabecera */}
                  {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((nom) => (
                    <div key={nom} className="text-[10px] font-black text-secondary py-1">
                      {nom}
                    </div>
                  ))}

                  {/* Celdas del Calendario Mensual */}
                  {diasDelMes.map((c: any) => {
                    if (c.esVacio) {
                      return <div key={c.id} className="h-12 rounded-xl" />;
                    }

                    const isSelected =
                      !c.noDisponibleEnSede &&
                      !c.esPasado &&
                      (selectedDate === c.fullString ||
                        (selectedDate.includes(c.numero) && selectedDate.includes(c.diaSemana)));

                    if (c.esDomingo || c.noDisponibleEnSede || c.esPasado) {
                      return (
                        <div
                          key={c.id}
                          className="h-12 rounded-xl bg-slate-100/70 border border-slate-200/50 flex flex-col items-center justify-center text-slate-400 select-none"
                          title={
                            c.esPasado
                              ? 'Fecha pasada'
                              : c.esDomingo
                              ? 'Domingo cerrado'
                              : c.atiendeEnOtraSede
                              ? `Atiende en ${sedeEfectiva === 'tovar' ? 'La Victoria' : 'Colonia Tovar'}`
                              : 'Sin guardia en esta sede según #Data'
                          }
                        >
                          <span className="text-[11px] font-bold line-through decoration-slate-400/50">
                            {c.numero}
                          </span>
                          <span className="text-[7.5px] font-semibold truncate max-w-full px-1">
                            {c.esPasado
                              ? 'Pasado'
                              : c.esDomingo
                              ? 'Cerrado'
                              : c.atiendeEnOtraSede
                              ? sedeEfectiva === 'tovar'
                                ? 'En LV'
                                : 'En Tovar'
                              : 'Sin guardia'}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedDate(c.fullString)}
                        className={`h-12 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 border ${
                          isSelected
                            ? 'bg-dental-deep-navy text-white shadow-md ring-2 ring-primary border-primary'
                            : 'bg-white border-border-subtle hover:bg-surface-container text-dental-deep-navy'
                        }`}
                      >
                        <span className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-dental-deep-navy'}`}>
                          {c.numero}
                        </span>
                        <span
                          className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${
                            c.estado === 'critico'
                              ? 'bg-rose-100 text-rose-800'
                              : c.estado === 'moderado'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          } ${isSelected ? '!bg-white/20 !text-white' : ''}`}
                        >
                          {c.cuposLibres} {c.cuposLibres === 1 ? 'cita libre' : 'citas libres'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================
              SECCIÓN 2: TURNOS MATUTINOS Y VESPERTINOS CON ESCALA DE COLOR
             =================================================================== */}

          {/* Leyenda Orientativa en Escala de Afluencia Armónica y Positiva */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] sm:text-[11px] text-secondary bg-surface-subtle-ice px-3.5 py-2.5 rounded-2xl border border-border-subtle shadow-2xs">
            <span className="font-extrabold text-dental-deep-navy flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[17px] text-primary">schedule</span>
              Guía de Afluencia ({selectedDate || 'Día seleccionado'}):
            </span>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Atención Ágil (Mayor holgura)
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-sky-900 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Demanda Habitual (Espacio regular)
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Franja Popular (Mayor preferencia)
              </span>
            </div>
          </div>

          {/* Turno Mañana: 08:30 AM, 09:15 AM, 10:00 AM, 11:00 AM */}
          <div className={`bg-surface-subtle-ice p-3.5 rounded-2xl border border-border-subtle ${!mananaHabilitado ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">
                wb_sunny
              </span>
              <span className="text-xs font-bold text-dental-deep-navy">Turno Mañana</span>
              <span className="text-[10px] text-secondary ml-auto">
                {mananaHabilitado ? '08:30 AM — 11:00 AM' : 'No habilitado en #Data (Solo Tarde)'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {morningSlots.map((slot) => {
                const isSelected = selectedSlot === slot.hora;
                const horaFinEstimada = calcularHoraFin(slot.hora, duracionTratamientoMin);
                const demanda = getDemandaTurno(slot.hora, selectedDate);
                return (
                  <button
                    key={slot.hora}
                    type="button"
                    disabled={!mananaHabilitado}
                    onClick={() => {
                      if (!mananaHabilitado) return;
                      setSelectedSlot(slot.hora);
                      if (!selectedDate) {
                        const disp = semana6Dias.find((d) => !d.noDisponibleEnSede && !d.esPasado);
                        setSelectedDate(disp?.fullString || semana6Dias[0]?.fullString || 'Fecha seleccionada');
                      }
                      const debeCaptarSelfie = !fotoSelfie;
                      if (pacienteEncontrado && nombres.trim() && !debeCaptarSelfie) {
                        setOpenStep(null);
                        setTimeout(() => {
                          summaryCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 80);
                      } else {
                        setOpenStep('patient');
                        setTimeout(() => {
                          patientCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 80);
                      }
                    }}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col justify-between border-x border-b relative ${
                      !mananaHabilitado
                        ? 'cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                        : `${demanda.grosorClase} ${demanda.bordeColor} cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-dental-deep-navy text-white shadow-md ring-2 ring-primary/30 border-primary'
                              : 'bg-white border-border-subtle text-dental-deep-navy hover:bg-surface-container'
                          }`
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-black tabular-nums">{slot.hora}</span>
                      <span
                        className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          !mananaHabilitado
                            ? 'bg-slate-200 text-slate-500 border-slate-300'
                            : isSelected
                            ? '!bg-white/20 !text-white !border-white/30'
                            : demanda.badgeBg
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${!mananaHabilitado ? 'bg-slate-400' : demanda.dotColor}`} />
                        {!mananaHabilitado ? 'Cerrado' : demanda.etiqueta}
                      </span>
                    </div>

                    <div className="w-full flex items-center justify-between text-[10px] pt-1.5 border-t border-border-subtle/50 gap-1">
                      <span className={`font-semibold whitespace-nowrap text-[9.5px] ${isSelected ? 'text-white/90' : 'text-primary'}`}>
                        Hasta {horaFinEstimada} • {duracionTratamientoMin}m
                      </span>
                      <span className={`text-[9px] font-bold shrink-0 ${isSelected ? 'text-white/80' : 'text-secondary'}`}>
                        {demanda.subtitulo}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Turno Tarde: 01:15 PM, 02:00 PM, 03:00 PM, 03:45 PM */}
          <div className={`bg-surface-subtle-ice p-3.5 rounded-2xl border border-border-subtle ${!tardeHabilitado ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="material-symbols-outlined text-indigo-500 text-[18px]">
                wb_twilight
              </span>
              <span className="text-xs font-bold text-dental-deep-navy">Turno Tarde</span>
              <span className="text-[10px] text-primary font-bold ml-auto">
                {tardeHabilitado ? '01:15 PM — 03:45 PM' : 'No habilitado en #Data (Solo Mañana)'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {afternoonSlots.map((slot) => {
                const isSelected = selectedSlot === slot.hora;
                const horaFinEstimada = calcularHoraFin(slot.hora, duracionTratamientoMin);
                const demanda = getDemandaTurno(slot.hora, selectedDate);
                return (
                  <button
                    key={slot.hora}
                    type="button"
                    disabled={!tardeHabilitado}
                    onClick={() => {
                      if (!tardeHabilitado) return;
                      setSelectedSlot(slot.hora);
                      if (!selectedDate) {
                        const disp = semana6Dias.find((d) => !d.noDisponibleEnSede && !d.esPasado);
                        setSelectedDate(disp?.fullString || semana6Dias[0]?.fullString || 'Fecha seleccionada');
                      }
                      const debeCaptarSelfie = !fotoSelfie;
                      if (pacienteEncontrado && nombres.trim() && !debeCaptarSelfie) {
                        setOpenStep(null);
                        setTimeout(() => {
                          summaryCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 80);
                      } else {
                        setOpenStep('patient');
                        setTimeout(() => {
                          patientCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 80);
                      }
                    }}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col justify-between border-x border-b relative ${
                      !tardeHabilitado
                        ? 'cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                        : `${demanda.grosorClase} ${demanda.bordeColor} cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-dental-deep-navy text-white shadow-md ring-2 ring-primary/30 border-primary'
                              : 'bg-white border-border-subtle text-dental-deep-navy hover:bg-surface-container'
                          }`
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-black tabular-nums">{slot.hora}</span>
                      <span
                        className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          !tardeHabilitado
                            ? 'bg-slate-200 text-slate-500 border-slate-300'
                            : isSelected
                            ? '!bg-white/20 !text-white !border-white/30'
                            : demanda.badgeBg
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${!tardeHabilitado ? 'bg-slate-400' : demanda.dotColor}`} />
                        {!tardeHabilitado ? 'Cerrado' : demanda.etiqueta}
                      </span>
                    </div>

                    <div className="w-full flex items-center justify-between text-[10px] pt-1.5 border-t border-border-subtle/50 gap-1">
                      <span className={`font-semibold whitespace-nowrap text-[9.5px] ${isSelected ? 'text-white/90' : 'text-primary'}`}>
                        Hasta {horaFinEstimada} • {duracionTratamientoMin}m
                      </span>
                      <span className={`text-[9px] font-bold shrink-0 ${isSelected ? 'text-white/80' : 'text-secondary'}`}>
                        {demanda.subtitulo}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          PASO 4: DATOS PERSONALES Y MÉDICOS (EDITABLES)
         ===================================================================== */}
      {openStep === 'patient' && (
        <form
          ref={patientCardRef}
          onSubmit={async (e) => {
            e.preventDefault();
            await persistirDatosPaciente();
            setOpenStep(null);
            setTimeout(() => {
              summaryCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
          }}
          className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 animate-in fade-in slide-in-from-top-3 duration-300 scroll-mt-4"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy">
                  Paso 5 de 5
                </span>
                <span className="text-xs text-secondary">• Anamnesis y Validación</span>
              </div>
              <h2 className="font-display font-extrabold text-lg text-dental-deep-navy mt-1">
                Datos personales y Médicos
              </h2>
            </div>
            <button
              type="button"
              onClick={retrocederPaso}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-xs font-bold text-dental-deep-navy shadow-2xs transition-all active:scale-95 group shrink-0 cursor-pointer"
              title="Volver a seleccionar Horario"
            >
              <span className="material-symbols-outlined text-[16px] text-primary group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              <span>Cambiar Horario</span>
            </button>
          </div>

          <p className="text-xs text-secondary">
            Verifica tus datos. Puedes editar cualquier campo libremente en caso de corrección ortográfica o cambio de contacto.
          </p>

          {/* Banner de Verificación si el paciente ya existe en la data clínica */}
          {pacienteEncontrado && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex items-start gap-2.5 text-xs text-emerald-950 shadow-xs">
              <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0 mt-0.5">verified</span>
              <div className="flex-1 min-w-0">
                <span className="font-extrabold block text-emerald-950 text-xs">
                  Expediente Clínico Verificado en Base de Datos
                </span>
                <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">
                  Tus datos personales y médicos han sido precargados automáticamente. Solo verifica que la información esté correcta o edita cualquier campo si lo necesitas.
                </p>
              </div>
            </div>
          )}

          {/* Notificación amigable si ya tiene data cargada pero falta la imagen selfie */}
          {(pacienteEncontrado || nombres.trim().length > 2) && !fotoSelfie && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3 text-xs text-amber-950 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-amber-950 text-xs">
                    Expediente Activo • ¡Falta tu Foto Selfie!
                  </span>
                  <span className="text-[9px] bg-amber-200/80 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                    Recomendado para Ficha Clínica
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug mt-1">
                  Hola <strong className="text-amber-950">{nombres.split(' ')[0] || 'Estimado Paciente'}</strong>, tus datos están precargados pero aún no cuentas con foto selfie de perfil. Tómate una selfie rápida o sube una imagen para que el odontólogo te reconozca inmediatamente al pasar al Box clínico.
                </p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <label
                    htmlFor="input-selfie-paciente-camera"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-xl cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                    <span>Tomar Selfie Ahora</span>
                  </label>
                  <label
                    htmlFor="input-selfie-paciente-file"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-xl cursor-pointer shadow-2xs active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">upload</span>
                    <span>Elegir de Galería</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tarjeta de Captación y Previsualización de Foto Selfie del Paciente */}
          <div className="p-4 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
            <div className="relative shrink-0">
              {fotoSelfie ? (
                <div className="relative">
                  <img
                    src={fotoSelfie}
                    alt={nombres || 'Selfie Paciente'}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-primary/20 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFotoSelfie('');
                      const fullCed = `${cedulaTipo}-${cedulaNumero.trim()}`;
                      if (fullCed.length > 2) {
                        localStorage.removeItem(`paciente_avatar_${fullCed}`);
                      }
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs hover:bg-rose-600 active:scale-90 transition-all cursor-pointer"
                    title="Eliminar selfie"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-primary/40 bg-white flex flex-col items-center justify-center text-secondary gap-1 shadow-inner">
                  <span className="material-symbols-outlined text-[30px] text-primary">face</span>
                  <span className="text-[9px] font-extrabold text-center px-1 text-dental-deep-navy">Sin Selfie</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h4 className="font-display font-extrabold text-xs sm:text-sm text-dental-deep-navy">
                  Foto Selfie del Paciente
                </h4>
                {fotoSelfie ? (
                  <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Selfie Vinculada
                  </span>
                ) : (
                  <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Pendiente de Captura
                  </span>
                )}
              </div>
              <p className="text-[11px] text-secondary mt-1 leading-snug">
                {fotoSelfie
                  ? 'Foto procesada y optimizada en tu navegador. Aparecerá en tu ficha clínica y expediente digital.'
                  : 'Tómate una selfie rápida o selecciona una foto desde tu galería para registrar tu rostro en el expediente digital.'}
              </p>

              {/* Botones de Acción */}
              <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <input
                  type="file"
                  id="input-selfie-paciente-camera"
                  accept="image/*"
                  capture="user"
                  onChange={handleSubirSelfie}
                  className="hidden"
                />
                <input
                  type="file"
                  id="input-selfie-paciente-file"
                  accept="image/*"
                  onChange={handleSubirSelfie}
                  className="hidden"
                />
                <label
                  htmlFor="input-selfie-paciente-camera"
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  <span>{isCompressingSelfie ? 'Optimizando...' : fotoSelfie ? 'Cambiar Selfie' : 'Tomar Selfie'}</span>
                </label>
                <label
                  htmlFor="input-selfie-paciente-file"
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-surface-container text-dental-deep-navy border border-border-subtle text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">upload</span>
                  <span>Subir de Galería</span>
                </label>
              </div>
            </div>
          </div>

          {/* Grid de 2 columnas para optimizar espacio y eliminar vacíos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Columna 1: Nombres y Apellidos */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">person</span>
                  Nombres y Apellidos completos *
                </span>
                <span className="text-[10px] text-primary font-semibold">Editable</span>
              </label>
              <input
                type="text"
                required
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Ej. Patricia Velásquez"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
              />
            </div>

            {/* Columna 2: Cédula de Identidad / DNI */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">badge</span>
                  Cédula de Identidad / DNI *
                </span>
                <span className="text-[10px] text-primary font-semibold">Editable</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={cedulaTipo}
                  onChange={(e) => setCedulaTipo(e.target.value as any)}
                  className="h-11 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                >
                  <option value="V">V-</option>
                  <option value="E">E-</option>
                  <option value="J">J-</option>
                  <option value="G">G-</option>
                </select>
                <input
                  type="text"
                  required
                  value={cedulaNumero}
                  onChange={(e) => setCedulaNumero(e.target.value)}
                  placeholder="19.845.221"
                  className="flex-1 h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                />
              </div>
            </div>

            {/* Columna 1: Sexo Biológico */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">wc</span>
                Sexo Biológico *
              </label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value as any)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
              >
                <option value="">Seleccionar sexo</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Columna 2: Fecha de Nacimiento */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">calendar_today</span>
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                value={normalizarFechaInput(fechaNacimiento)}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
              />
            </div>

            {/* Columna 1: WhatsApp / Teléfono Móvil */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">chat</span>
                  WhatsApp / Teléfono Móvil *
                </label>
                <span className="text-[10px] text-status-success font-bold bg-status-success/15 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">check</span>
                  SMS / WhatsApp
                </span>
              </div>
              <input
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+58 (412) 987-6543"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
              />
            </div>

            {/* Columna 2: Correo Electrónico */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">mail</span>
                Correo Electrónico (Comprobante digital)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
              />
            </div>

            {/* Ancho completo: Selección de Patologías */}
            <div className="md:col-span-2 flex flex-col gap-1.5 p-3.5 bg-surface-subtle-ice rounded-2xl border border-border-subtle shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">health_and_safety</span>
                  Condición Médica o Patología Especial (Anamnesis)
                </label>
                <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-white border border-border-subtle">
                  Catálogo #DATA
                </span>
              </div>

              <select
                value={selectedCondicionId}
                onChange={(e) => setSelectedCondicionId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white border border-border-subtle text-xs font-bold text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ninguna">
                  Ninguna condición médica previa (Paciente Sano)
                </option>
                {condicionesMedicas.map((cond) => (
                  <option key={cond.id} value={cond.id}>
                    [{cond.codigoCie}] {cond.nombre} — Riesgo {cond.nivelRiesgo} ({cond.categoria})
                  </option>
                ))}
              </select>

              {condicionSeleccionada && (
                <div className="mt-1 space-y-1.5">
                  {condicionSeleccionada.requiereProfilaxisAntibiotica && (
                    <div className="p-2.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] shrink-0">vaccines</span>
                      <span>¡Alerta Clínica! Esta condición requiere Profilaxis Antibiótica Previa.</span>
                    </div>
                  )}
                  {condicionSeleccionada.anestesicoContraindicado && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">warning</span>
                      <span>Restricción Farmacológica: {condicionSeleccionada.anestesicoContraindicado}</span>
                    </div>
                  )}
                  <div className="p-2 rounded-xl bg-white text-[11px] text-secondary border border-border-subtle">
                    <strong>Protocolo:</strong> {condicionSeleccionada.protocoloDental}
                  </div>
                </div>
              )}
            </div>

            {/* Ancho completo: Motivo */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">medical_services</span>
                Motivo de consulta o molestia principal
              </label>
              <textarea
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indica brevemente si presentas dolor o el tratamiento deseado..."
                className="w-full p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-primary hover:bg-dental-deep-navy text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Confirmar Datos</span>
          </button>
        </form>
      )}

      {/* =====================================================================
          TARJETA RESUMEN: SE MUESTRA AL TERMINAR LAS TARJETAS DEL FORMULARIO
          (Al tocar Cambiar o Editar te lleva a la posición inicial de esa tarjeta)
         ===================================================================== */}
      {!openStep && (
        <section
          ref={summaryCardRef}
          className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border-2 border-primary/20 flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 duration-300 scroll-mt-4"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <h2 className="font-display font-extrabold text-base text-dental-deep-navy">
                  Resumen de tu Reserva Clínica
                </h2>
                <p className="text-[11px] text-secondary">
                  Toca "Cambiar" o "Editar" para revisar o modificar cualquier dato
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => irAPaso('patient')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-xs font-bold text-dental-deep-navy shadow-2xs transition-all active:scale-95 group shrink-0 cursor-pointer"
                title="Modificar datos o citas"
              >
                <span className="material-symbols-outlined text-[16px] text-primary group-hover:-translate-x-0.5 transition-transform">
                  arrow_back
                </span>
                <span>Modificar Datos</span>
              </button>
              <span className="px-2.5 py-1 rounded-full bg-status-success/15 text-status-success font-black text-xs shrink-0">
                100% Completado
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Sub-tarjeta 1: Sede Clínica */}
            <div className="bg-surface-subtle-ice p-3 rounded-2xl border border-border-subtle flex items-center justify-between gap-2 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    {selectedSedeId === 'tovar' ? 'cottage' : 'apartment'}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-secondary block">Sede Clínica</span>
                  <p className="font-bold text-xs text-dental-deep-navy truncate">
                    {selectedSedeId === 'tovar' ? 'La Colonia Tovar' : 'La Victoria'}
                  </p>
                  <span className="text-[10px] text-secondary truncate block">
                    {selectedSedeId === 'tovar' ? 'C. C San Martín de Tours, P.A. Local 7' : 'C.C. Márquez del Toro, PB Local 18'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => irAPaso('sede')}
                className="px-2 py-1 rounded-xl bg-white border border-border-subtle text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Sub-tarjeta 2: Odontólogo Asignado */}
            <div className="bg-surface-subtle-ice p-3 rounded-2xl border border-border-subtle flex items-center justify-between gap-2.5 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedDoctor ? (
                  <img
                    src={selectedDoctor.avatar}
                    alt={selectedDoctor.nombre}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-surface-container text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-secondary block">Odontólogo</span>
                  <p className="font-bold text-xs text-dental-deep-navy truncate">
                    {selectedDoctor ? selectedDoctor.nombre : 'Por seleccionar'}
                  </p>
                  <span className="text-[10px] text-primary font-semibold truncate block">
                    {selectedDoctor ? `Box 0${selectedDoctor.box} • ${selectedDoctor.titulo}` : 'Pendiente'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => irAPaso('doctor')}
                className="px-2 py-1 rounded-xl bg-white border border-border-subtle text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Sub-tarjeta 2: Tratamiento */}
            <div className="bg-surface-subtle-ice p-3 rounded-2xl border border-border-subtle flex items-center justify-between gap-2.5 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">dentistry</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-secondary block">Tratamiento</span>
                  <p className="font-bold text-xs text-dental-deep-navy truncate">
                    {treatment || 'Por seleccionar'}
                  </p>
                  <span className="text-[10px] text-secondary truncate block">
                    {treatmentDesc || 'Catálogo de procedimientos'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => irAPaso('treatment')}
                className="px-2 py-1 rounded-xl bg-white border border-border-subtle text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Sub-tarjeta 3: Fecha y Turno */}
            <div className="bg-surface-subtle-ice p-3 rounded-2xl border border-border-subtle flex items-center justify-between gap-2.5 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">calendar_clock</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-secondary block">Horario</span>
                  <p className="font-bold text-xs text-dental-deep-navy truncate">
                    {selectedDate || 'Fecha pendiente'}
                  </p>
                  <span className="text-[10px] text-status-success font-extrabold truncate block">
                    {selectedSlot ? `${selectedSlot} (Confirmado)` : 'Turno pendiente'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => irAPaso('datetime')}
                className="px-2 py-1 rounded-xl bg-white border border-border-subtle text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Sub-tarjeta 4: Paciente y Anamnesis */}
            <div className="bg-surface-subtle-ice p-3 rounded-2xl border border-border-subtle flex items-center justify-between gap-2.5 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                {fotoSelfie ? (
                  <img
                    src={fotoSelfie}
                    alt={nombres}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/25 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-dental-deep-navy text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {nombres.trim().length > 0 ? nombres.slice(0, 2).toUpperCase() : 'ID'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] uppercase font-bold text-secondary block">Paciente & Anamnesis</span>
                    {!fotoSelfie && (
                      <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        📸 Sin Selfie
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-xs text-dental-deep-navy truncate">
                    {nombres || 'Datos pendientes'}
                  </p>
                  <span className="text-[10px] text-secondary truncate block">
                    {cedulaNumero ? `${cedulaTipo}-${cedulaNumero}` : 'Sin validar'}
                    {sexo ? ` • ${sexo}` : ''}
                    {fechaNacimiento ? ` • ${fechaNacimiento}` : ''}
                  </span>
                  {selectedCondicionId !== 'ninguna' && condicionSeleccionada && (
                    <span className="text-[9px] text-status-danger font-bold truncate block">
                      ⚠️ [{condicionSeleccionada.codigoCie}] {condicionSeleccionada.nombre}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => irAPaso('patient')}
                className="px-2 py-1 rounded-xl bg-white border border-border-subtle text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Editar
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          FILA DE SELLOS DE CONFIANZA
         ===================================================================== */}
      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-surface-clean-white p-3 rounded-2xl border border-border-subtle flex flex-col items-center">
          <span className="w-8 h-8 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </span>
          <span className="text-[11px] font-bold text-dental-deep-navy">Bioseguridad 100%</span>
          <span className="text-[9px] text-secondary">Esterilización certificada</span>
        </div>

        <div className="bg-surface-clean-white p-3 rounded-2xl border border-border-subtle flex flex-col items-center">
          <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-[18px]">alarm_on</span>
          </span>
          <span className="text-[11px] font-bold text-dental-deep-navy">Puntualidad Exacta</span>
          <span className="text-[9px] text-secondary">Sin esperas largas</span>
        </div>

        <div className="bg-surface-clean-white p-3 rounded-2xl border border-border-subtle flex flex-col items-center">
          <span className="w-8 h-8 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          </span>
          <span className="text-[11px] font-bold text-dental-deep-navy">Pago Cómodo</span>
          <span className="text-[9px] text-secondary">Bolívares / Divisas</span>
        </div>
      </section>

      {/* =====================================================================
          PIE DE PÁGINA FIJO:
          - LA TARJETA AVANCE DE RESERVA ES EL PIE DE PÁGINA FIJO
          - HASTA QUE ES SUSTITUIDO POR EL DE CONFIRMAR Y RESERVAR (AL 100%)
         ===================================================================== */}
      <aside
        aria-label="Avance y Confirmación de Reserva"
        className="fixed bottom-3 left-0 right-0 z-40 bg-surface-clean-white/95 backdrop-blur-md border border-border-subtle p-3 sm:p-3.5 shadow-[0_-8px_32px_rgba(23,18,29,0.18)] max-w-5xl mx-auto rounded-3xl sm:bottom-5 sm:inset-x-4 transition-all duration-300"
      >
        {/* CASO 1: AVANCE DE RESERVA FIJO (MIENTRAS HAYA UN PASO ABIERTO O EL PROGRESO SEA MENOR A 100%) */}
        {openStep !== null || progressPercentage < 100 ? (
          <div className="flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[18px] text-primary animate-pulse shrink-0">
                  trending_up
                </span>
                <span className="font-extrabold text-dental-deep-navy truncate">
                  Avance de Reserva
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-bold text-primary truncate">
                  {openStep === 'sede' && 'Paso 1: Sede Clínica'}
                  {openStep === 'doctor' && 'Paso 2: Odontólogo'}
                  {openStep === 'treatment' && 'Paso 3: Tratamiento'}
                  {openStep === 'datetime' && 'Paso 4: Horario'}
                  {openStep === 'patient' && 'Paso 5: Datos Médicos'}
                  {!openStep && 'Completa el formulario'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono font-black text-xs text-primary">
                  {progressPercentage}%
                </span>
                <span className="text-[10px] text-secondary font-semibold">completado</span>
              </div>
            </div>

            {/* Barra de progreso interactiva en tiempo real */}
            <div className="w-full h-2 bg-border-subtle/60 rounded-full overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-primary via-dental-deep-navy to-status-success rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Copyright requerido en pie de página */}
            <p className="text-[10px] text-center text-secondary font-medium tracking-wide pt-0.5">
              Copyright 2026 - OdontoSalud La Victoria
            </p>
          </div>
        ) : (
          /* CASO 2: SUSTITUIDO POR EL DE CONFIRMAR Y RESERVAR (AL LLEGAR AL 100%) */
          <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-status-success text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">event_available</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-dental-deep-navy truncate leading-tight">
                    {selectedDate} • {selectedSlot}
                  </p>
                  <p className="text-[11px] text-secondary truncate">
                    {selectedDoctor ? selectedDoctor.nombre : 'Doctor asignado'} • {treatment}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => irAPaso('patient')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-subtle-ice hover:bg-surface-container text-[11px] font-extrabold text-dental-deep-navy border border-border-subtle transition-all active:scale-95 cursor-pointer"
                  title="Modificar antes de confirmar"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                  <span>Modificar</span>
                </button>
                <span className="text-[10px] font-black text-status-success bg-status-success/15 px-2.5 py-1 rounded-full">
                  Listo para Confirmar
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer bg-status-success hover:bg-dental-deep-navy shadow-[0_0_20px_rgba(27,109,59,0.35)]"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSubmitting ? 'sync' : 'verified'}
              </span>
              <span>
                {isSubmitting
                  ? 'Registrando en Agenda...'
                  : 'Confirmar y Reservar Cita Previa'}
              </span>
            </button>

            <p className="text-[10px] text-center text-secondary font-medium tracking-wide">
              Copyright 2026 - OdontoSalud La Victoria
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
