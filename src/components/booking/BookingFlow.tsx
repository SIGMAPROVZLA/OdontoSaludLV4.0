import React, { useState, useEffect, useRef } from 'react';
import { useSede, SEDES_DISPONIBLES } from '../../context/SedeContext';
import { ApiClient } from '../../services/api';
import { TabId } from '../layout/BottomNavigation';
import { CondicionMedicaItem, OdontologoItem, PacienteItem, SedeId } from '../../types/clinical';

interface DoctorOption {
  id: string;
  nombre: string;
  titulo: string;
  especialidad: string;
  box: number;
  avatar: string;
  turno?: string;
  estado?: string;
  esTitular?: boolean;
}

interface BookingFlowProps {
  onBack?: () => void;
  onNavigateTab?: (tab: TabId) => void;
}

type BookingStep = 'sede' | 'doctor' | 'treatment' | 'datetime' | 'patient';

const INITIAL_ODONTOLOGOS_FALLBACK: OdontologoItem[] = [
  {
    id: 'odo-1',
    nombres: 'Dra. María Alejandra Domínguez',
    cedula: 'V-16.482.910',
    cov: 'C.O.V. 24.891',
    especialidad: 'Directora Clínica • Odontología General & Estética',
    telefono: '+58 414-5550101',
    email: 'dra.dominguez@odontosalud.ve',
    sedeId: 'ambas',
    boxAsignado: 1,
    turno: 'Completo',
    porcentajeHonorarios: 50,
    estado: 'activo',
  },
  {
    id: 'odo-2',
    nombres: 'Dr. Carlos Mendoza Rivas',
    cedula: 'V-17.902.311',
    cov: 'C.O.V. 26.104',
    especialidad: 'Ortodoncia & Ortopedia Dentofacial',
    telefono: '+58 412-8891234',
    email: 'c.mendoza@odontosalud.ve',
    sedeId: 'victoria',
    boxAsignado: 2,
    turno: 'Mañana',
    porcentajeHonorarios: 45,
    estado: 'activo',
  },
  {
    id: 'odo-3',
    nombres: 'Dra. Valentina Páez Gómez',
    cedula: 'V-20.331.488',
    cov: 'C.O.V. 29.512',
    especialidad: 'Endodoncia Microscópica & Odontopediatría',
    telefono: '+58 424-3349011',
    email: 'v.paez@odontosalud.ve',
    sedeId: 'victoria',
    boxAsignado: 3,
    turno: 'Tarde',
    porcentajeHonorarios: 45,
    estado: 'en_guardia',
  },
];

const INITIAL_PACIENTES_FALLBACK: PacienteItem[] = [
  {
    id: 'pac-1',
    nombres: 'Patricia Velásquez',
    cedula: 'V-19.845.221',
    telefono: '+58 412-9876543',
    email: 'patricia.velasquez@gmail.com',
    sexo: 'Femenino',
    fechaNacimiento: '1989-06-14',
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
    telefono: '+58 414-5550921',
    email: 'carlos.mendoza@hotmail.com',
    sexo: 'Masculino',
    fechaNacimiento: '1986-11-20',
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
    telefono: '+58 424-3341122',
    email: 'marcos.ramos@gmail.com',
    sexo: 'Masculino',
    fechaNacimiento: '1994-03-05',
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

const getDoctorAvatar = (nombre: string, box: number) => {
  const n = nombre.toLowerCase();
  if (n.includes('domínguez') || n.includes('maría') || n.includes('alejandra')) {
    return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80';
  }
  if (n.includes('mendoza') || n.includes('carlos') || n.includes('rivas')) {
    return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80';
  }
  if (n.includes('páez') || n.includes('valentina') || n.includes('gómez')) {
    return 'https://images.unsplash.com/photo-1594824813637-4560767733a1?auto=format&fit=crop&w=200&q=80';
  }
  return box % 2 === 0
    ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80'
    : 'https://images.unsplash.com/photo-1594824813637-4560767733a1?auto=format&fit=crop&w=200&q=80';
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
      return saved ? JSON.parse(saved) : INITIAL_ODONTOLOGOS_FALLBACK;
    } catch {
      return INITIAL_ODONTOLOGOS_FALLBACK;
    }
  });

  const [dataPacientes, setDataPacientes] = useState<PacienteItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_pacientes');
      return saved ? JSON.parse(saved) : INITIAL_PACIENTES_FALLBACK;
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

  useEffect(() => {
    ApiClient.getControlData().then((remote) => {
      if (!remote) return;
      if (remote.odontologos && remote.odontologos.length > 0) {
        setDataOdontologos(remote.odontologos);
      }
      if (remote.pacientes && remote.pacientes.length > 0) {
        setDataPacientes(remote.pacientes);
      }
      if (remote.condicionesMedicas && remote.condicionesMedicas.length > 0) {
        setCondicionesMedicas(remote.condicionesMedicas);
      }
    });
  }, []);

  const doctoresEmpadronados: DoctorOption[] = dataOdontologos.map((odo) => ({
    id: odo.id,
    nombre: odo.nombres,
    titulo: odo.nombres.toLowerCase().includes('domínguez') ? 'Directora Clínica' : 'Especialista',
    especialidad: odo.especialidad,
    box: odo.boxAsignado || 1,
    avatar: getDoctorAvatar(odo.nombres, odo.boxAsignado || 1),
    turno: odo.turno,
    estado: odo.estado,
    esTitular: odo.nombres.toLowerCase().includes('domínguez'),
  }));

  // 2. Estado Inicial Cero (Campos Vacíos en Posición Inicial Cero)
  const [selectedSedeId, setSelectedSedeId] = useState<SedeId | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [treatment, setTreatment] = useState<string>('');
  const [treatmentDesc, setTreatmentDesc] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const [cedulaTipo, setCedulaTipo] = useState<'V' | 'E' | 'J' | 'P'>('V');
  const [cedulaNumero, setCedulaNumero] = useState<string>('');
  const [nombres, setNombres] = useState<string>('');
  const [sexo, setSexo] = useState<'Femenino' | 'Masculino' | 'Otro' | ''>('');
  const [fechaNacimiento, setFechaNacimiento] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [selectedCondicionId, setSelectedCondicionId] = useState<string>('ninguna');

  // Estado del flujo secuencial (inicia en 'sede' como Tarjeta Nro 1)
  const [openStep, setOpenStep] = useState<BookingStep | null>('sede');

  // 3. Modal Login Emergente con Validación de Cédula y Delay de 2 Segundos
  const [showAuthModal, setShowAuthModal] = useState<boolean>(true);
  const [authCedulaTipo, setAuthCedulaTipo] = useState<'V' | 'E' | 'J' | 'P'>('V');
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
        // 1. Buscar en lista local de pacientes
        let match: PacienteItem | undefined = dataPacientes.find((p) => {
          const cleanP = (p.cedula || '').replace(/[^0-9]/g, '');
          return cleanP === cleanInput;
        });

        // 2. Si no está en pacientes, buscar en doctores/odontólogos empadronados
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

        // 3. Si aún no está, consultar la base de datos D1 del servidor
        if (!match) {
          try {
            const remote = await ApiClient.getControlData();
            if (remote?.pacientes && remote.pacientes.length > 0) {
              setDataPacientes(remote.pacientes);
              match = remote.pacientes.find(
                (p) => (p.cedula || '').replace(/[^0-9]/g, '') === cleanInput
              );
            }
          } catch {
            // fallback silencioso
          }
        }

        if (match) {
          setPacienteEncontrado(match);
          setAuthStatus('verified');
        } else {
          setPacienteEncontrado(null);
          setAuthStatus('not_found');
        }
      }, 1000); // 1 segundo para validación rápida
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

    // Parsear cédula: si viene con guión ej "V-16.762.319" o sólo números
    const rawCedula = pacienteEncontrado.cedula || '';
    if (rawCedula.includes('-')) {
      const [tipo, num] = rawCedula.split('-');
      if (['V', 'E', 'J', 'P'].includes(tipo.toUpperCase())) {
        setCedulaTipo(tipo.toUpperCase() as any);
      }
      setCedulaNumero(num.trim());
    } else {
      setCedulaTipo(authCedulaTipo);
      setCedulaNumero(rawCedula.trim() || authCedulaInput.trim());
    }

    setNombres(pacienteEncontrado.nombres || '');
    setTelefono(pacienteEncontrado.telefono || '');
    setEmail(pacienteEncontrado.email || '');
    setSexo((pacienteEncontrado.sexo as any) || 'Femenino');
    setFechaNacimiento(pacienteEncontrado.fechaNacimiento || '');

    // Precargar motivo clínico previo o predeterminado
    if (pacienteEncontrado.motivo) {
      setMotivo(pacienteEncontrado.motivo);
    }

    // Precargar patología o anamnesis si está registrada en el expediente clínico
    if ((pacienteEncontrado as any).condicionMedicaId) {
      setSelectedCondicionId((pacienteEncontrado as any).condicionMedicaId);
    }

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

    const nuevoPac: PacienteItem = {
      id: `pac-${Date.now()}`,
      nombres: nuevoNombres.trim(),
      cedula: fullCedula,
      telefono: nuevoTelefono.trim() || '+58 412-0000000',
      sexo: nuevoSexo,
      fechaNacimiento: nuevoFechaNacimiento,
      sedeId: 'victoria',
      estado: 'pendiente',
      motivo: 'Evaluación Inicial Odontológica',
      fechaCita: 'Primera Consulta',
      horaInicio: '09:00 AM',
      doctorNombre: 'Por Asignar',
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

  // 4. Catálogos Clínicos y Opciones
  const treatments = [
    {
      id: 'evaluacion',
      nombre: 'Evaluación & Diagnóstico Digital RVG',
      desc: '45 min • Inspección FDI y radiografía periapical',
      icon: 'dentistry',
      badge: 'Completa',
      isPopular: true,
    },
    {
      id: 'limpieza',
      nombre: 'Profilaxis Ultrasónica & Pulido Coronario',
      desc: '40 min • Destartraje ultrasónico y flúor',
      icon: 'clean_hands',
    },
    {
      id: 'urgencia',
      nombre: 'Urgencia Odontológica / Dolor Agudo',
      desc: '30 min • Alivio inmediato y atención prioritaria',
      icon: 'emergency',
      isUrgent: true,
    },
    {
      id: 'ortodoncia',
      nombre: 'Control / Inicio de Ortodoncia',
      desc: '45 min • Brackets estéticos / autoligado',
      icon: 'grid_view',
    },
    {
      id: 'endodoncia',
      nombre: 'Endodoncia Microscópica',
      desc: '60 min • Terapia de conducto especializada',
      icon: 'vital_signs',
    },
    {
      id: 'estetica',
      nombre: 'Restauración Estética en Resina Nanohíbrida',
      desc: '45 min • Fotocurado estético y reconstrucción',
      icon: 'masks',
    },
  ];

  const dates = [
    { dia: 'JUE', num: '24', cupos: '5 cupos', status: 'active' },
    { dia: 'VIE', num: '25', cupos: '1 cupo', status: 'warning' },
    { dia: 'SÁB', num: '26', cupos: 'Disponible', status: 'success' },
    { dia: 'LUN', num: '28', cupos: '4 cupos', status: 'success' },
    { dia: 'MAR', num: '29', cupos: '3 cupos', status: 'success' },
  ];

  const morningSlots = [
    { hora: '08:30 AM', sub: 'Libre' },
    { hora: '09:00 AM', sub: selectedDoctor ? `Box 0${selectedDoctor.box}` : 'Libre' },
    { hora: '10:30 AM', sub: 'Libre' },
    { hora: '11:15 AM', sub: 'Libre' },
  ];

  const afternoonSlots = [
    { hora: '01:00 PM', sub: 'Nueva hora' },
    { hora: '02:00 PM', sub: 'Libre' },
    { hora: '03:15 PM', sub: 'Libre' },
    { hora: '04:30 PM', sub: '1 Cita disp.' },
  ];

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

    const motivoCompleto = condicionSeleccionada
      ? `${treatment} • Anamnesis: [${condicionSeleccionada.codigoCie}] ${condicionSeleccionada.nombre} • Motivo: ${motivo || 'Evaluación'}`
      : `${treatment} • Motivo: ${motivo || 'Evaluación inicial'}`;

    const targetSede = selectedSedeId || sedeId;
    const sedeFinal = selectedSedeId ? SEDES_DISPONIBLES[selectedSedeId] : sedeActiva;

    try {
      await ApiClient.crearCita(targetSede, {
        pacienteId: `pac-${Date.now()}`,
        pacienteNombre: nombres,
        pacienteCedula: `${cedulaTipo}-${cedulaNumero}`,
        pacienteTelefono: telefono,
        doctorNombre: selectedDoctor ? selectedDoctor.nombre : 'Por asignar',
        boxNumero: selectedDoctor ? selectedDoctor.box : 1,
        fechaCita: selectedDate || '2024-10-24',
        horaInicio: selectedSlot || '09:00 AM',
        motivo: motivoCompleto,
        estado: 'pendiente',
        esUrgencia:
          treatment.toLowerCase().includes('urgencia') ||
          treatment.toLowerCase().includes('dolor'),
      });
      setBookingConfirmed(true);
    } catch (err) {
      console.error('Error al solicitar cita:', err);
      setBookingConfirmed(true);
    } finally {
      setIsSubmitting(false);
    }
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
                  <span>📍 Sedes en La Victoria y La Colonia Tovar con equipamiento digital RVG 2.0 y bioseguridad certificada</span>
                  <span className="text-primary font-black">✦</span>
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-white px-2 py-0.5 rounded-lg border border-border-subtle/60 shadow-2xs">
                    <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                    <span className="tabular-nums">{currentTime}</span>
                  </span>
                  <span>✨ Bienvenidos a OdontoSalud La Victoria y Colonia Tovar · La Clínica Odontológica de la familia victoriana y coloniera ✨</span>
                  <span className="text-primary font-black">✦</span>
                  <span>📍 Sedes en La Victoria y La Colonia Tovar con equipamiento digital RVG 2.0 y bioseguridad certificada</span>
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
                  Valida tú Identidad 😊👍
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
                  <option value="P">P-</option>
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
          <div className="bg-surface-clean-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-border-subtle text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-0.5 border border-emerald-100 shadow-xs">
              <span className="material-symbols-outlined text-[32px]">verified</span>
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
              <div className="flex items-start gap-3 pt-0 pb-1">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">person</span>
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
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-surface-subtle-ice text-primary font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-border-subtle shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Registrar Otra Cita</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          HEADER COMPACTO CON LOGO
         ===================================================================== */}
      <section className="bg-surface-clean-white rounded-3xl p-4 shadow-soft-elevated border border-border-subtle flex items-center justify-between gap-3 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-dental-deep-navy to-status-success" />

        <div className="flex items-center gap-3">
          <img
            src="/brand/logo-odontosalud-vertical.png"
            alt="Logo OdontoSalud La Victoria"
            className="h-14 w-14 sm:h-16 sm:w-16 object-contain shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-lg sm:text-xl text-dental-deep-navy leading-tight tracking-tight">
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
            <span>📍 Atención Integral en Sede La Victoria (C.C. Márquez del Toro) y Sede La Colonia Tovar (C.C. Manantial)</span>
            <span className="text-primary font-black">✦</span>
            <span className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-white px-2 py-0.5 rounded-lg border border-border-subtle/60 shadow-2xs">
              <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
              <span className="tabular-nums">{currentTime}</span>
            </span>
            <span>✨ Bienvenidos a OdontoSalud La Victoria y Colonia Tovar · La Clínica Odontológica de la familia victoriana y coloniera ✨</span>
            <span className="text-primary font-black">✦</span>
            <span>📍 Atención Integral en Sede La Victoria (C.C. Márquez del Toro) y Sede La Colonia Tovar (C.C. Manantial)</span>
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
                  Sede Principal • Boxes 1 al 4 & Cirugía RVG
                </p>
                <p className="text-[11px] text-secondary mt-1 flex items-start gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary shrink-0 mt-0.5">pin_drop</span>
                  <span>C. C. Márquez del Toro, Planta Baja, Local 18, La Victoria, Aragua</span>
                </p>
              </div>

              <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[11px]">
                <span className="text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-status-success">medical_services</span>
                  <span>4 Boxes Clínicos & RVG 2.0</span>
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
                  Sucursal • Atención Integral & Ortodoncia
                </p>
                <p className="text-[11px] text-secondary mt-1 flex items-start gap-1">
                  <span className="material-symbols-outlined text-[15px] text-status-success shrink-0 mt-0.5">pin_drop</span>
                  <span>C. C. Manantial, Sector La Ballesta, Colonia Tovar, Aragua</span>
                </p>
              </div>

              <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[11px]">
                <span className="text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-status-success">forest</span>
                  <span>2 Boxes Clínicos & Montaña</span>
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
          PASO 2: ELIGE TU ODONTÓLOGO FAVORITO ⭐❤️ (CONECTADO A #DATA)
         ===================================================================== */}
      {openStep === 'doctor' && (
        <section
          ref={doctorCardRef}
          className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-3 duration-300 scroll-mt-4"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy">
                  Paso 2 de 5
                </span>
                <span className="text-xs text-secondary">• {doctoresEmpadronados.length} odontólogos en plantilla</span>
              </div>
              <h2 className="font-display font-extrabold text-lg text-dental-deep-navy mt-1">
                Elige tu odontólogo favorito ⭐❤️
              </h2>
            </div>
            <span className="w-8 h-8 rounded-full bg-status-success/15 text-status-success flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </span>
          </div>

          <p className="text-xs text-secondary">
            Selecciona el profesional para tu consulta. Al tocar su tarjeta, se guardará y se desplegará el tipo de tratamiento.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {doctoresEmpadronados.map((doc) => {
              const isSelected = selectedDoctor?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setOpenStep('treatment');
                    setTimeout(() => {
                      treatmentCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 80);
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-surface-container border-2 border-primary shadow-md ring-2 ring-primary/20'
                      : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={doc.avatar}
                        alt={doc.nombre}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20 shadow-sm"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-status-success ring-2 ring-white flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-extrabold uppercase">
                          {doc.titulo}
                        </span>
                        <span className="text-[10px] text-amber-500 font-bold">⭐ 5.0</span>
                      </div>
                      <h3 className="font-display font-bold text-xs sm:text-sm text-dental-deep-navy mt-1 truncate">
                        {doc.nombre}
                      </h3>
                      <p className="text-[11px] text-secondary truncate mt-0.5">
                        {doc.especialidad}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle/80 text-[11px]">
                    <span className="font-bold text-status-success flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-status-success" />
                      Sillón Box 0{doc.box} • {doc.turno || 'Completo'}
                    </span>
                    <span className="font-bold text-primary flex items-center gap-1">
                      <span>Seleccionar</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
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
            <span className="text-xs text-primary font-bold bg-surface-container px-2.5 py-1 rounded-full">
              Paso 3
            </span>
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
            <span className="text-xs text-primary font-bold bg-surface-container px-2.5 py-1 rounded-full">
              Box 0{selectedDoctor ? selectedDoctor.box : 1}
            </span>
          </div>

          <p className="text-xs text-secondary">
            Selecciona el día y la hora que prefieras. Al tocar un horario, avanzarás directamente al paso final.
          </p>

          {/* Carrusel Horizontal de Días */}
          <div>
            <span className="text-xs font-bold text-dental-deep-navy block mb-2">1. Selecciona el Día:</span>
            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {dates.map((d) => {
                const dateStr = `${d.dia} ${d.num} Oct`;
                const isSelected = selectedDate.includes(d.num);
                return (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`shrink-0 w-16 py-3 px-1 rounded-2xl text-center transition-all flex flex-col items-center gap-0.5 active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-dental-deep-navy text-white shadow-md ring-2 ring-primary/40'
                        : 'bg-surface-subtle-ice border border-border-subtle hover:bg-surface-container'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-semibold ${
                        isSelected ? 'text-surface-container' : 'text-secondary'
                      }`}
                    >
                      {d.dia}
                    </span>
                    <span
                      className={`text-lg font-extrabold ${
                        isSelected ? 'text-white' : 'text-dental-deep-navy'
                      }`}
                    >
                      {d.num}
                    </span>
                    <span
                      className={`text-[9px] font-bold ${
                        isSelected ? 'text-status-success' : 'text-status-success'
                      }`}
                    >
                      {d.cupos}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Turno Mañana */}
          <div className="bg-surface-subtle-ice p-3.5 rounded-2xl border border-border-subtle">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">
                wb_sunny
              </span>
              <span className="text-xs font-bold text-dental-deep-navy">Turno Mañana</span>
              <span className="text-[10px] text-secondary ml-auto">Recomendado</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {morningSlots.map((slot) => {
                const isSelected = selectedSlot === slot.hora;
                return (
                  <button
                    key={slot.hora}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot.hora);
                      if (!selectedDate) setSelectedDate('JUE 24 Oct');
                      if (pacienteEncontrado && nombres.trim()) {
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
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-dental-deep-navy text-white shadow-md ring-2 ring-primary/30'
                        : 'bg-white border border-border-subtle text-dental-deep-navy hover:bg-surface-container'
                    }`}
                  >
                    <span>{slot.hora}</span>
                    <span
                      className={`text-[9px] truncate max-w-full ${
                        isSelected ? 'text-white/80' : 'text-secondary'
                      }`}
                    >
                      {slot.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Turno Tarde */}
          <div className="bg-surface-subtle-ice p-3.5 rounded-2xl border border-border-subtle">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="material-symbols-outlined text-indigo-500 text-[18px]">
                wb_twilight
              </span>
              <span className="text-xs font-bold text-dental-deep-navy">Turno Tarde</span>
              <span className="text-[10px] text-primary font-bold ml-auto">1:00 PM Disponible</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {afternoonSlots.map((slot) => {
                const isSelected = selectedSlot === slot.hora;
                return (
                  <button
                    key={slot.hora}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot.hora);
                      if (!selectedDate) setSelectedDate('JUE 24 Oct');
                      if (pacienteEncontrado && nombres.trim()) {
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
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-dental-deep-navy text-white shadow-md ring-2 ring-primary/30'
                        : 'bg-white border border-border-subtle text-dental-deep-navy hover:bg-surface-container'
                    }`}
                  >
                    <span>{slot.hora}</span>
                    <span
                      className={`text-[9px] truncate max-w-full ${
                        isSelected ? 'text-white/80' : 'text-secondary'
                      }`}
                    >
                      {slot.sub}
                    </span>
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
          onSubmit={(e) => {
            e.preventDefault();
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
            <span className="text-xs text-primary font-bold bg-surface-container px-2.5 py-1 rounded-full">
              Paso Final
            </span>
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

          {/* Nombres y Apellidos */}
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
              className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Cédula */}
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
                className="h-11 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="V">V-</option>
                <option value="E">E-</option>
                <option value="J">J-</option>
                <option value="P">P-</option>
              </select>
              <input
                type="text"
                required
                value={cedulaNumero}
                onChange={(e) => setCedulaNumero(e.target.value)}
                placeholder="19.845.221"
                className="flex-1 h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Sexo y Fecha de Nacimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-dental-deep-navy block mb-1">
                Sexo Biológico
              </label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Seleccionar sexo</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-dental-deep-navy block mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* WhatsApp */}
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
              className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Correo Electrónico */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-secondary">mail</span>
              Correo Electrónico (Para comprobante digital)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Selección de Patologías */}
          <div className="flex flex-col gap-1.5 p-3.5 bg-surface-subtle-ice rounded-2xl border border-border-subtle">
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

          {/* Motivo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-secondary">medical_services</span>
              Motivo de consulta o molestia principal
            </label>
            <textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Indica brevemente si presentas dolor o el tratamiento deseado..."
              className="w-full p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
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
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
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
            <span className="px-2.5 py-1 rounded-full bg-status-success/15 text-status-success font-black text-xs">
              100% Completado
            </span>
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
                    {selectedSedeId === 'tovar' ? 'Sector La Ballesta' : 'C.C. Márquez del Toro'}
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
                <div className="w-10 h-10 rounded-xl bg-dental-deep-navy text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {nombres.trim().length > 0 ? nombres.slice(0, 2).toUpperCase() : 'ID'}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-secondary block">Paciente</span>
                  <p className="font-bold text-xs text-dental-deep-navy truncate">
                    {nombres || 'Datos pendientes'}
                  </p>
                  <span className="text-[10px] text-secondary truncate block">
                    {cedulaNumero ? `${cedulaTipo}-${cedulaNumero}` : 'Sin validar'}
                  </span>
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

              <span className="text-[10px] font-black text-status-success bg-status-success/15 px-2.5 py-1 rounded-full shrink-0">
                Listo para Confirmar
              </span>
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
