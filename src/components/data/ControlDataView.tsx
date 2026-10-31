import React, { useState, useEffect } from 'react';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { ApiClient } from '../../services/api';
import {
  OdontologoItem,
  HigienistaItem,
  TratamientoItem,
  PacienteItem,
  CondicionMedicaItem,
  TratamientoRealizadoItem,
  SedeId,
} from '../../types/clinical';

const INITIAL_ODONTOLOGOS: OdontologoItem[] = [
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
    boxAsignado: 1,
    turno: 'Tarde',
    porcentajeHonorarios: 45,
    estado: 'en_guardia',
  },
];

const INITIAL_HIGIENISTAS: HigienistaItem[] = [
  {
    id: 'hig-1',
    nombres: 'Lic. Gabriela Morales',
    cedula: 'V-23.410.882',
    registroMpps: 'MPPS-HD-10842',
    areaEspecialidad: 'Asistencia Quirúrgica a 4 Manos & Esterilización',
    telefono: '+58 412-4418900',
    sedeId: 'victoria',
    boxApoyo: 1,
    doctorAsignado: 'Dra. María Alejandra Domínguez',
    turno: 'Completo',
    estado: 'activo',
  },
  {
    id: 'hig-2',
    nombres: 'T.S.U. Daniela Castro',
    cedula: 'V-25.819.304',
    registroMpps: 'MPPS-HD-12490',
    areaEspecialidad: 'Profilaxis Ultrasónica & Biomateriales de Ortodoncia',
    telefono: '+58 414-7723109',
    sedeId: 'victoria',
    boxApoyo: 2,
    doctorAsignado: 'Dr. Carlos Mendoza Rivas',
    turno: 'Mañana',
    estado: 'activo',
  },
  {
    id: 'hig-3',
    nombres: 'T.S.U. Mariana Ochoa',
    cedula: 'V-26.109.775',
    registroMpps: 'MPPS-HD-13901',
    areaEspecialidad: 'Radiología Digital RVG & Control de Bioseguridad',
    telefono: '+58 424-9012233',
    sedeId: 'ambas',
    boxApoyo: 3,
    doctorAsignado: 'Dra. Valentina Páez Gómez',
    turno: 'Tarde',
    estado: 'esterilizacion',
  },
];

const INITIAL_TRATAMIENTOS: TratamientoItem[] = [
  {
    id: 'trat-1',
    codigo: 'OD-101',
    nombre: 'Evaluación Integral & Diagnóstico Digital RVG',
    categoria: 'Diagnóstico & RX',
    descripcion: 'Inspección FDI de 5 caras, odontograma digital y radiografía periapical.',
    duracionMinutos: 45,
    costoUsd: 25,
    costoInsumosUsd: 4,
    requiereRx: true,
    activo: true,
  },
  {
    id: 'trat-2',
    codigo: 'PR-102',
    nombre: 'Profilaxis Ultrasónica & Pulido Coronario',
    categoria: 'Prevención & Profilaxis',
    descripcion: 'Destartraje ultrasónico completo, eliminación de cálculo y aplicación de flúor.',
    duracionMinutos: 40,
    costoUsd: 35,
    costoInsumosUsd: 6,
    requiereRx: false,
    activo: true,
  },
  {
    id: 'trat-3',
    codigo: 'OP-201',
    nombre: 'Restauración Estética en Resina Nanohíbrida (Simple)',
    categoria: 'Operatoria & Estética',
    descripcion: 'Obturación adhesiva fotocurada 3M Z350 XT en 1 superficie.',
    duracionMinutos: 45,
    costoUsd: 40,
    costoInsumosUsd: 9,
    requiereRx: false,
    activo: true,
  },
  {
    id: 'trat-4',
    codigo: 'OP-202',
    nombre: 'Restauración Compuesta Compleja (2 o más caras)',
    categoria: 'Operatoria & Estética',
    descripcion: 'Reconstrucción anatómica mesio-ocluso-distal con aislamiento absoluto.',
    duracionMinutos: 60,
    costoUsd: 55,
    costoInsumosUsd: 13,
    requiereRx: true,
    activo: true,
  },
  {
    id: 'trat-5',
    codigo: 'EN-301',
    nombre: 'Endodoncia Birradicular / Multirradicular (Molar)',
    categoria: 'Endodoncia',
    descripcion: 'Instrumentación rotatoria, irrigación ultrasónica y obturación termoplástica.',
    duracionMinutos: 75,
    costoUsd: 160,
    costoInsumosUsd: 38,
    requiereRx: true,
    activo: true,
  },
  {
    id: 'trat-6',
    codigo: 'OR-401',
    nombre: 'Control Mensual de Ortodoncia (Brackets MBT / Autoligado)',
    categoria: 'Ortodoncia',
    descripcion: 'Cambio de arcos NiTi, ligaduras, cadenas elásticas y ajuste oclusal.',
    duracionMinutos: 30,
    costoUsd: 40,
    costoInsumosUsd: 7,
    requiereRx: false,
    activo: true,
  },
  {
    id: 'trat-7',
    codigo: 'CI-501',
    nombre: 'Exodoncia Quirúrgica / Tercer Molar Impactado',
    categoria: 'Cirugía & Exodoncia',
    descripcion: 'Cirugía menor con osteotomía, odontosección y sutura reabsorbible.',
    duracionMinutos: 60,
    costoUsd: 120,
    costoInsumosUsd: 25,
    requiereRx: true,
    activo: true,
  },
  {
    id: 'trat-8',
    codigo: 'RE-601',
    nombre: 'Corona Libre de Metal en Disilicato / Zirconio',
    categoria: 'Prótesis & Implantes',
    descripcion: 'Tallado biomecánico, escaneo/impresión en silicona y cementado adhesivo.',
    duracionMinutos: 60,
    costoUsd: 260,
    costoInsumosUsd: 95,
    requiereRx: true,
    activo: true,
  },
];

const CATEGORIAS_TRATAMIENTO: TratamientoItem['categoria'][] = [
  'Diagnóstico & RX',
  'Prevención & Profilaxis',
  'Operatoria & Estética',
  'Endodoncia',
  'Ortodoncia',
  'Cirugía & Exodoncia',
  'Prótesis & Implantes',
];

const INITIAL_PACIENTES: PacienteItem[] = [
  {
    id: 'pac-1',
    nombres: 'Patricia Velásquez',
    cedula: 'V-19.845.221',
    telefono: '+58 412-9876543',
    email: 'patricia.velasquez@gmail.com',
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
    motivo: 'Profilaxis Ultrasónica & Pulido Coronario',
    fechaCita: '2024-10-25',
    horaInicio: '02:00 PM',
    doctorNombre: 'Dra. Valentina Páez Gómez',
    sedeId: 'ambas',
    estado: 'completada',
    esUrgencia: false,
  },
];

const INITIAL_CONDICIONES_MEDICAS: CondicionMedicaItem[] = [
  {
    id: 'med-1',
    codigoCie: 'I10',
    nombre: 'Hipertensión Arterial Sistémica (HAS)',
    categoria: 'Cardiovascular',
    nivelRiesgo: 'Moderado',
    manifestacionBucal: 'Xerostomía farmacológica, hiperplasia gingival por bloqueadores de canales de Ca++ (amlodipino).',
    protocoloDental: 'Monitorear tensión arterial previa. Citas cortas matutinas. Máximo 2 carpules con epinefrina 1:100.000.',
    anestesicoContraindicado: 'Contraindicada Norepinefrina. Suspender epinefrina en crisis hipertensiva (>160/100 mmHg).',
    requiereProfilaxisAntibiotica: false,
    activo: true,
  },
  {
    id: 'med-2',
    codigoCie: 'E11.9',
    nombre: 'Diabetes Mellitus Tipo 2 (No Insulinodependiente)',
    categoria: 'Endocrina & Metabólica',
    nivelRiesgo: 'Moderado',
    manifestacionBucal: 'Periodontitis acelerada con pérdida ósea, xerostomía, cicatrización retardada y candidiasis bucal.',
    protocoloDental: 'Verificar glucemia capilar matutina y HbA1c (< 7.5%). Citas matutinas post-ingesta y medicación habitual.',
    anestesicoContraindicado: 'Sin contraindicación absoluta. Usar técnica troncular con aspiración obligatoria.',
    requiereProfilaxisAntibiotica: false,
    activo: true,
  },
  {
    id: 'med-3',
    codigoCie: 'Z88.0',
    nombre: 'Alergia Severa a Penicilinas y Betalactámicos',
    categoria: 'Alergias & Farmacología',
    nivelRiesgo: 'Crítico',
    manifestacionBucal: 'Riesgo inminente de angioedema labial, eritema mucoso generalizado y shock anafiláctico agudo.',
    protocoloDental: 'ALERTA ROJA EN FICHA CLÍNICA. Prohibido recetar amoxicilina, ampicilina o cefalosporinas. Alternativa: Azitromicina 500mg o Clindamicina.',
    anestesicoContraindicado: 'Evitar anestésicos locales que contengan sulfitos o parabenos como conservantes.',
    requiereProfilaxisAntibiotica: true,
    activo: true,
  },
  {
    id: 'med-4',
    codigoCie: 'D68.9',
    nombre: 'Paciente Anticoagulado (Warfarina / Rivaroxabán / AAS)',
    categoria: 'Hematológica & Coagulación',
    nivelRiesgo: 'Alto',
    manifestacionBucal: 'Hemorragias gingivales espontáneas, petequias en paladar y mucosa yugal, hematomas submucosos.',
    protocoloDental: 'Solicitar prueba de coagulación reciente (INR 2.0-3.0 en últimas 48h). Uso riguroso de agentes hemostáticos locales (Surgicel, sutura no reabsorbible).',
    anestesicoContraindicado: 'Evitar bloqueo anestésico troncular espinal mandibular profundo (riesgo de hematoma asfíctico). Preferir infiltrativa o intraligamentosa.',
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
    protocoloDental: 'Período óptimo para profilaxis y tratamientos conservadores. Posición semi-incorporada con inclinación ligera a la izquierda para evitar compresión de la vena cava.',
    anestesicoContraindicado: 'Lidocaína 2% con epinefrina es segura (Categoría B FDA). PROHIBIDA Prilocaína con Felipresina (riesgo oxitócico y metahemoglobinemia).',
    requiereProfilaxisAntibiotica: false,
    activo: true,
  },
  {
    id: 'med-6',
    codigoCie: 'J45',
    nombre: 'Asma Bronquial Extrínseca (Alérgica)',
    categoria: 'Infecciosa & Respiratoria',
    nivelRiesgo: 'Moderado',
    manifestacionBucal: 'Erosión del esmalte por inhaladores esteroideos, sequedad bucal y riesgo de candidiasis oral.',
    protocoloDental: 'El paciente debe traer obligatoriamente su inhalador broncodilatador (Salbutamol) al sillón. Disminuir estrés y polvo dental.',
    anestesicoContraindicado: 'Precaución extrema con carpules con bisulfitos antioxidantes (asociados a broncoespasmo). Preferir Mepivacaína al 3% pura.',
    requiereProfilaxisAntibiotica: false,
    activo: true,
  },
  {
    id: 'med-7',
    codigoCie: 'I35.0',
    nombre: 'Prótesis Valvular Cardíaca / Antecedente de Endocarditis Infecciosa',
    categoria: 'Cardiovascular',
    nivelRiesgo: 'Crítico',
    manifestacionBucal: 'Riesgo inminente de bacteriemia transitoria con anidamiento bacteriano tras sangrado gingival.',
    protocoloDental: 'PROFILAXIS ANTIBIÓTICA OBLIGATORIA (Norma AHA): Amoxicilina 2g oral 60 min previos al procedimiento; o Clindamicina 600mg si hay alergia.',
    anestesicoContraindicado: 'Sin contraindicación anestésica directa; evitar trauma quirúrgico extenso y maniobras sin aislamiento.',
    requiereProfilaxisAntibiotica: true,
    activo: true,
  },
];

const CATEGORIAS_CONDICION: CondicionMedicaItem['categoria'][] = [
  'Cardiovascular',
  'Endocrina & Metabólica',
  'Alergias & Farmacología',
  'Hematológica & Coagulación',
  'Infecciosa & Respiratoria',
  'Neurológica',
  'Especial & Gestación',
];

const NIVELES_RIESGO: CondicionMedicaItem['nivelRiesgo'][] = [
  'Bajo',
  'Moderado',
  'Alto',
  'Crítico',
];

type DataTabKey = 'odontologos' | 'higienistas' | 'pacientes' | 'tratamientos' | 'condiciones';

// Clase utilitaria para iluminar bordes de campos cuando se están llenando o ya contienen valor
const getIlluminatedFieldClass = (isFilled: boolean) =>
  `w-full px-3 rounded-xl text-xs font-semibold text-dental-deep-navy transition-all duration-200 outline-none ${
    isFilled
      ? 'bg-white border-2 border-primary ring-2 ring-primary/20 shadow-[0_0_12px_rgba(81,64,95,0.22)]'
      : 'bg-surface-subtle-ice border border-border-subtle focus:bg-white focus:border-2 focus:border-primary focus:ring-4 focus:ring-primary/25 focus:shadow-[0_0_16px_rgba(81,64,95,0.32)]'
  }`;

export const ControlDataView: React.FC = () => {
  const { tasaBcv } = useTasaCambio();

  // Pestaña activa del selector animado
  const [activeTab, setActiveTab] = useState<DataTabKey>('odontologos');

  // Estados de listas principales (con respaldo en localStorage + Cloudflare D1)
  const [odontologos, setOdontologos] = useState<OdontologoItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_odontologos');
      return saved ? JSON.parse(saved) : INITIAL_ODONTOLOGOS;
    } catch {
      return INITIAL_ODONTOLOGOS;
    }
  });

  const [higienistas, setHigienistas] = useState<HigienistaItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_higienistas');
      return saved ? JSON.parse(saved) : INITIAL_HIGIENISTAS;
    } catch {
      return INITIAL_HIGIENISTAS;
    }
  });

  const [tratamientos, setTratamientos] = useState<TratamientoItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_tratamientos');
      return saved ? JSON.parse(saved) : INITIAL_TRATAMIENTOS;
    } catch {
      return INITIAL_TRATAMIENTOS;
    }
  });

  const [pacientes, setPacientes] = useState<PacienteItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_pacientes');
      return saved ? JSON.parse(saved) : INITIAL_PACIENTES;
    } catch {
      return INITIAL_PACIENTES;
    }
  });

  const [condicionesMedicas, setCondicionesMedicas] = useState<CondicionMedicaItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_condiciones_medicas');
      return saved ? JSON.parse(saved) : INITIAL_CONDICIONES_MEDICAS;
    } catch {
      return INITIAL_CONDICIONES_MEDICAS;
    }
  });

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Sincronización con Cloudflare D1 al montar
  useEffect(() => {
    ApiClient.getControlData().then((remote) => {
      if (!remote) return;
      if (remote.odontologos && remote.odontologos.length > 0) {
        setOdontologos(remote.odontologos);
      }
      if (remote.higienistas && remote.higienistas.length > 0) {
        setHigienistas(remote.higienistas);
      }
      if (remote.tratamientos && remote.tratamientos.length > 0) {
        setTratamientos(remote.tratamientos);
      }
      if (remote.pacientes && remote.pacientes.length > 0) {
        setPacientes(remote.pacientes);
      }
      if (remote.condicionesMedicas && remote.condicionesMedicas.length > 0) {
        setCondicionesMedicas(remote.condicionesMedicas);
      }
    });
  }, []);

  // Guardar automáticamente en localStorage cuando cambian
  useEffect(() => {
    try {
      localStorage.setItem('odontosalud_data_odontologos', JSON.stringify(odontologos));
    } catch {
      // ignore
    }
  }, [odontologos]);

  useEffect(() => {
    try {
      localStorage.setItem('odontosalud_data_higienistas', JSON.stringify(higienistas));
    } catch {
      // ignore
    }
  }, [higienistas]);

  useEffect(() => {
    try {
      localStorage.setItem('odontosalud_data_tratamientos', JSON.stringify(tratamientos));
    } catch {
      // ignore
    }
  }, [tratamientos]);

  useEffect(() => {
    try {
      localStorage.setItem('odontosalud_data_pacientes', JSON.stringify(pacientes));
    } catch {
      // ignore
    }
  }, [pacientes]);

  useEffect(() => {
    try {
      localStorage.setItem('odontosalud_data_condiciones_medicas', JSON.stringify(condicionesMedicas));
    } catch {
      // ignore
    }
  }, [condicionesMedicas]);

  // =========================================================================
  // ESTADO FORMULARIO TARJETA 1: ODONTÓLOGOS
  // =========================================================================
  const [showOdoForm, setShowOdoForm] = useState<boolean>(false);
  const [editOdoId, setEditOdoId] = useState<string | null>(null);
  const [odoNombres, setOdoNombres] = useState('');
  const [odoCedula, setOdoCedula] = useState('');
  const [odoCov, setOdoCov] = useState('');
  const [odoEspecialidad, setOdoEspecialidad] = useState('Odontología General & Estética');
  const [odoTelefono, setOdoTelefono] = useState('');
  const [odoEmail, setOdoEmail] = useState('');
  const [odoSede, setOdoSede] = useState<SedeId | 'ambas'>('victoria');
  const [odoBox, setOdoBox] = useState<number>(1);
  const [odoTurno, setOdoTurno] = useState<'Mañana' | 'Tarde' | 'Completo'>('Completo');
  const [odoHonorarios, setOdoHonorarios] = useState<number>(45);
  const [odoEstado, setOdoEstado] = useState<'activo' | 'en_guardia' | 'descanso'>('activo');

  const isOdoFormComplete =
    odoNombres.trim().length > 0 &&
    odoCedula.trim().length > 0 &&
    odoCov.trim().length > 0 &&
    odoEspecialidad.trim().length > 0 &&
    odoTelefono.trim().length > 0 &&
    odoEmail.trim().length > 0 &&
    odoHonorarios > 0;

  const limpiarFormOdontologo = () => {
    setEditOdoId(null);
    setOdoNombres('');
    setOdoCedula('');
    setOdoCov('');
    setOdoEspecialidad('Odontología General & Estética');
    setOdoTelefono('');
    setOdoEmail('');
    setOdoSede('victoria');
    setOdoBox(1);
    setOdoTurno('Completo');
    setOdoHonorarios(45);
    setOdoEstado('activo');
  };

  const handleEditarOdontologo = (o: OdontologoItem) => {
    setEditOdoId(o.id);
    setOdoNombres(o.nombres);
    setOdoCedula(o.cedula);
    setOdoCov(o.cov);
    setOdoEspecialidad(o.especialidad);
    setOdoTelefono(o.telefono);
    setOdoEmail(o.email);
    setOdoSede(o.sedeId);
    setOdoBox(o.boxAsignado);
    setOdoTurno(o.turno);
    setOdoHonorarios(o.porcentajeHonorarios);
    setOdoEstado(o.estado);
    setShowOdoForm(true);
  };

  const [doctorModalHonorarios, setDoctorModalHonorarios] = useState<OdontologoItem | null>(null);
  const [doctorHonorariosData, setDoctorHonorariosData] = useState<{
    resumen: any;
    tratamientos: TratamientoRealizadoItem[];
  } | null>(null);
  const [loadingDoctorHonorarios, setLoadingDoctorHonorarios] = useState(false);

  const abrirHistorialHonorariosDoctor = async (doc: OdontologoItem) => {
    setDoctorModalHonorarios(doc);
    setLoadingDoctorHonorarios(true);
    try {
      const res = await ApiClient.getTratamientosRealizadosOdontologo(doc.id);
      if (res.success) {
        setDoctorHonorariosData({ resumen: res.resumen, tratamientos: res.tratamientos });
      }
    } catch (err) {
      console.error('Error cargando honorarios:', err);
    } finally {
      setLoadingDoctorHonorarios(false);
    }
  };

  const handleGuardarOdontologo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odoNombres.trim() || !odoCedula.trim()) return;

    const nuevo: OdontologoItem = {
      id: editOdoId || `odo-${Date.now()}`,
      nombres: odoNombres.trim(),
      cedula: odoCedula.trim(),
      cov: odoCov.trim() || 'C.O.V. En Trámite',
      especialidad: odoEspecialidad,
      telefono: odoTelefono.trim(),
      email: odoEmail.trim(),
      sedeId: odoSede,
      boxAsignado: Number(odoBox),
      turno: odoTurno,
      porcentajeHonorarios: Number(odoHonorarios),
      estado: odoEstado,
    };

    if (editOdoId) {
      setOdontologos((prev) => prev.map((item) => (item.id === editOdoId ? nuevo : item)));
      showToast(`✅ Datos de ${nuevo.nombres} confirmados y actualizados.`);
    } else {
      setOdontologos((prev) => [nuevo, ...prev]);
      showToast(`🦷 Odontólogo(a) ${nuevo.nombres} confirmado(a) en plantilla.`);
    }

    await ApiClient.guardarOdontologo(nuevo);
    limpiarFormOdontologo();
    setShowOdoForm(false);
  };

  const handleEliminarOdontologo = async (id: string, nombre: string) => {
    setOdontologos((prev) => prev.filter((item) => item.id !== id));
    if (editOdoId === id) {
      limpiarFormOdontologo();
      setShowOdoForm(false);
    }
    await ApiClient.eliminarOdontologo(id);
    showToast(`🗑️ Odontólogo(a) ${nombre} eliminado(a) de plantilla.`);
  };

  const handleToggleOdontologoEstado = async (o: OdontologoItem) => {
    const nextEstado: OdontologoItem['estado'] =
      o.estado === 'activo' ? 'en_guardia' : o.estado === 'en_guardia' ? 'descanso' : 'activo';
    const actualizado = { ...o, estado: nextEstado };
    setOdontologos((prev) => prev.map((item) => (item.id === o.id ? actualizado : item)));
    await ApiClient.guardarOdontologo(actualizado);
    showToast(`🔄 Estado de ${o.nombres}: ${nextEstado.toUpperCase()}`);
  };

  // =========================================================================
  // ESTADO FORMULARIO TARJETA 2: HIGIENISTAS DENTALES
  // =========================================================================
  const [showHigForm, setShowHigForm] = useState<boolean>(false);
  const [editHigId, setEditHigId] = useState<string | null>(null);
  const [higNombres, setHigNombres] = useState('');
  const [higCedula, setHigCedula] = useState('');
  const [higMpps, setHigMpps] = useState('');
  const [higEspecialidad, setHigEspecialidad] = useState('Profilaxis Ultrasónica & Esterilización');
  const [higTelefono, setHigTelefono] = useState('');
  const [higSede, setHigSede] = useState<SedeId | 'ambas'>('victoria');
  const [higBox, setHigBox] = useState<number>(1);
  const [higDoctor, setHigDoctor] = useState<string>(
    odontologos[0]?.nombres || 'Dra. María Alejandra Domínguez'
  );
  const [higTurno, setHigTurno] = useState<'Mañana' | 'Tarde' | 'Completo'>('Completo');
  const [higEstado, setHigEstado] = useState<'activo' | 'esterilizacion' | 'descanso'>('activo');

  const isHigFormComplete =
    higNombres.trim().length > 0 &&
    higCedula.trim().length > 0 &&
    higMpps.trim().length > 0 &&
    higEspecialidad.trim().length > 0 &&
    higTelefono.trim().length > 0 &&
    higDoctor.trim().length > 0;

  const limpiarFormHigienista = () => {
    setEditHigId(null);
    setHigNombres('');
    setHigCedula('');
    setHigMpps('');
    setHigEspecialidad('Profilaxis Ultrasónica & Esterilización');
    setHigTelefono('');
    setHigSede('victoria');
    setHigBox(1);
    setHigDoctor(odontologos[0]?.nombres || 'Dra. María Alejandra Domínguez');
    setHigTurno('Completo');
    setHigEstado('activo');
  };

  const handleEditarHigienista = (h: HigienistaItem) => {
    setEditHigId(h.id);
    setHigNombres(h.nombres);
    setHigCedula(h.cedula);
    setHigMpps(h.registroMpps);
    setHigEspecialidad(h.areaEspecialidad);
    setHigTelefono(h.telefono);
    setHigSede(h.sedeId);
    setHigBox(h.boxApoyo);
    setHigDoctor(h.doctorAsignado);
    setHigTurno(h.turno);
    setHigEstado(h.estado);
    setShowHigForm(true);
  };

  const handleGuardarHigienista = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!higNombres.trim() || !higCedula.trim()) return;

    const nuevo: HigienistaItem = {
      id: editHigId || `hig-${Date.now()}`,
      nombres: higNombres.trim(),
      cedula: higCedula.trim(),
      registroMpps: higMpps.trim() || 'MPPS-HD-EnTrámite',
      areaEspecialidad: higEspecialidad,
      telefono: higTelefono.trim(),
      sedeId: higSede,
      boxApoyo: Number(higBox),
      doctorAsignado: higDoctor,
      turno: higTurno,
      estado: higEstado,
    };

    if (editHigId) {
      setHigienistas((prev) => prev.map((item) => (item.id === editHigId ? nuevo : item)));
      showToast(`✅ Datos de ${nuevo.nombres} confirmados y actualizados.`);
    } else {
      setHigienistas((prev) => [nuevo, ...prev]);
      showToast(`✨ Higienista ${nuevo.nombres} confirmado(a) en equipo clínico.`);
    }

    await ApiClient.guardarHigienista(nuevo);
    limpiarFormHigienista();
    setShowHigForm(false);
  };

  const handleEliminarHigienista = async (id: string, nombre: string) => {
    setHigienistas((prev) => prev.filter((item) => item.id !== id));
    if (editHigId === id) {
      limpiarFormHigienista();
      setShowHigForm(false);
    }
    await ApiClient.eliminarHigienista(id);
    showToast(`🗑️ Registro de ${nombre} eliminado.`);
  };

  const handleToggleHigienistaEstado = async (h: HigienistaItem) => {
    const nextEstado: HigienistaItem['estado'] =
      h.estado === 'activo' ? 'esterilizacion' : h.estado === 'esterilizacion' ? 'descanso' : 'activo';
    const actualizado = { ...h, estado: nextEstado };
    setHigienistas((prev) => prev.map((item) => (item.id === h.id ? actualizado : item)));
    await ApiClient.guardarHigienista(actualizado);
    showToast(`🔄 Estado de ${h.nombres}: ${nextEstado.toUpperCase()}`);
  };

  // =========================================================================
  // ESTADO FORMULARIO TARJETA 3: PACIENTES EN RESERVA DE CITAS
  // =========================================================================
  const [showPacForm, setShowPacForm] = useState<boolean>(false);
  const [editPacId, setEditPacId] = useState<string | null>(null);
  const [pacNombres, setPacNombres] = useState('');
  const [pacCedula, setPacCedula] = useState('');
  const [pacTelefono, setPacTelefono] = useState('');
  const [pacEmail, setPacEmail] = useState('');
  const [pacMotivo, setPacMotivo] = useState('Evaluación Integral Odontológica');
  const [pacFechaCita, setPacFechaCita] = useState('2024-10-25');
  const [pacHoraInicio, setPacHoraInicio] = useState('09:00 AM');
  const [pacDoctorNombre, setPacDoctorNombre] = useState(
    odontologos[0]?.nombres || 'Dra. María Alejandra Domínguez'
  );
  const [pacSedeId, setPacSedeId] = useState<SedeId | 'ambas'>('victoria');
  const [pacEstado, setPacEstado] = useState<
    'pendiente' | 'confirmada' | 'en_sillon' | 'completada' | 'cancelada'
  >('confirmada');
  const [pacEsUrgencia, setPacEsUrgencia] = useState<boolean>(false);

  const isPacFormComplete =
    pacNombres.trim().length > 0 &&
    pacCedula.trim().length > 0 &&
    pacTelefono.trim().length > 0 &&
    pacMotivo.trim().length > 0 &&
    pacFechaCita.trim().length > 0 &&
    pacDoctorNombre.trim().length > 0;

  const limpiarFormPaciente = () => {
    setEditPacId(null);
    setPacNombres('');
    setPacCedula('');
    setPacTelefono('');
    setPacEmail('');
    setPacMotivo('Evaluación Integral Odontológica');
    setPacFechaCita('2024-10-25');
    setPacHoraInicio('09:00 AM');
    setPacDoctorNombre(odontologos[0]?.nombres || 'Dra. María Alejandra Domínguez');
    setPacSedeId('victoria');
    setPacEstado('confirmada');
    setPacEsUrgencia(false);
  };

  const handleEditarPaciente = (p: PacienteItem) => {
    setEditPacId(p.id);
    setPacNombres(p.nombres);
    setPacCedula(p.cedula);
    setPacTelefono(p.telefono);
    setPacEmail(p.email || '');
    setPacMotivo(p.motivo || 'Evaluación Odontológica');
    setPacFechaCita(p.fechaCita || '2024-10-25');
    setPacHoraInicio(p.horaInicio || '09:00 AM');
    setPacDoctorNombre(p.doctorNombre || odontologos[0]?.nombres || 'Dra. María Alejandra Domínguez');
    setPacSedeId(p.sedeId || 'victoria');
    setPacEstado(p.estado || 'confirmada');
    setPacEsUrgencia(Boolean(p.esUrgencia));
    setShowPacForm(true);
  };

  const handleGuardarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacNombres.trim() || !pacCedula.trim()) return;

    const nuevo: PacienteItem = {
      id: editPacId || `pac-${Date.now()}`,
      nombres: pacNombres.trim(),
      cedula: pacCedula.trim(),
      telefono: pacTelefono.trim(),
      email: pacEmail.trim(),
      motivo: pacMotivo.trim(),
      fechaCita: pacFechaCita,
      horaInicio: pacHoraInicio,
      doctorNombre: pacDoctorNombre,
      sedeId: pacSedeId,
      estado: pacEstado,
      esUrgencia: pacEsUrgencia,
    };

    if (editPacId) {
      setPacientes((prev) => prev.map((item) => (item.id === editPacId ? nuevo : item)));
      showToast(`✅ Paciente ${nuevo.nombres} actualizado correctamente.`);
    } else {
      setPacientes((prev) => [nuevo, ...prev]);
      showToast(`👤 Paciente ${nuevo.nombres} registrado en Reserva de Citas.`);
    }

    await ApiClient.guardarPaciente(nuevo);
    limpiarFormPaciente();
    setShowPacForm(false);
  };

  const handleEliminarPaciente = async (id: string, nombre: string) => {
    setPacientes((prev) => prev.filter((item) => item.id !== id));
    if (editPacId === id) {
      limpiarFormPaciente();
      setShowPacForm(false);
    }
    await ApiClient.eliminarPaciente(id);
    showToast(`🗑️ Registro de ${nombre} eliminado.`);
  };

  // =========================================================================
  // ESTADO FORMULARIO TARJETA 4: TRATAMIENTOS, DATOS CLÍNICOS Y COSTOS
  // =========================================================================
  const [showTratForm, setShowTratForm] = useState<boolean>(false);
  const [editTratId, setEditTratId] = useState<string | null>(null);
  const [tratCodigo, setTratCodigo] = useState('');
  const [tratNombre, setTratNombre] = useState('');
  const [tratCategoria, setTratCategoria] =
    useState<TratamientoItem['categoria']>('Operatoria & Estética');
  const [tratDescripcion, setTratDescripcion] = useState('');
  const [tratDuracion, setTratDuracion] = useState<string>('');
  const [tratCostoUsd, setTratCostoUsd] = useState<string>('');
  const [tratInsumosUsd, setTratInsumosUsd] = useState<string>('');
  const [tratRequiereRx, setTratRequiereRx] = useState<boolean>(false);
  const [tratActivo, setTratActivo] = useState<boolean>(true);

  const [busquedaTrat, setBusquedaTrat] = useState('');
  const [filtroCategoriaTrat, setFiltroCategoriaTrat] = useState<string>('Todas');

  const isTratFormComplete =
    tratCodigo.trim().length > 0 &&
    tratNombre.trim().length > 0 &&
    tratDescripcion.trim().length > 0 &&
    Number(tratDuracion) > 0 &&
    Number(tratCostoUsd) > 0 &&
    tratInsumosUsd.trim().length > 0 &&
    Number(tratInsumosUsd) >= 0;

  const limpiarFormTratamiento = () => {
    setEditTratId(null);
    setTratCodigo('');
    setTratNombre('');
    setTratCategoria('Operatoria & Estética');
    setTratDescripcion('');
    setTratDuracion('');
    setTratCostoUsd('');
    setTratInsumosUsd('');
    setTratRequiereRx(false);
    setTratActivo(true);
  };

  const handleEditarTratamiento = (t: TratamientoItem) => {
    setEditTratId(t.id);
    setTratCodigo(t.codigo);
    setTratNombre(t.nombre);
    setTratCategoria(t.categoria);
    setTratDescripcion(t.descripcion);
    setTratDuracion(String(t.duracionMinutos));
    setTratCostoUsd(String(t.costoUsd));
    setTratInsumosUsd(String(t.costoInsumosUsd));
    setTratRequiereRx(t.requiereRx);
    setTratActivo(t.activo);
    setShowTratForm(true);
  };

  const handleGuardarTratamiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tratNombre.trim() || !tratCodigo.trim()) return;

    const item: TratamientoItem = {
      id: editTratId || `trat-${Date.now()}`,
      codigo: tratCodigo.trim().toUpperCase(),
      nombre: tratNombre.trim(),
      categoria: tratCategoria,
      descripcion: tratDescripcion.trim() || 'Procedimiento clínico estandarizado',
      duracionMinutos: Number(tratDuracion) || 30,
      costoUsd: Number(tratCostoUsd) || 0,
      costoInsumosUsd: Number(tratInsumosUsd) || 0,
      requiereRx: tratRequiereRx,
      activo: tratActivo,
    };

    if (editTratId) {
      setTratamientos((prev) => prev.map((t) => (t.id === editTratId ? item : t)));
      showToast(`✅ Tratamiento "${item.nombre}" confirmado ($${item.costoUsd} USD).`);
    } else {
      setTratamientos((prev) => [item, ...prev]);
      showToast(`📋 Nuevo tratamiento "${item.nombre}" confirmado en catálogo.`);
    }

    await ApiClient.guardarTratamiento(item);
    limpiarFormTratamiento();
    setShowTratForm(false);
  };

  const handleEliminarTratamiento = async (id: string, nombre: string) => {
    setTratamientos((prev) => prev.filter((t) => t.id !== id));
    if (editTratId === id) {
      limpiarFormTratamiento();
      setShowTratForm(false);
    }
    await ApiClient.eliminarTratamiento(id);
    showToast(`🗑️ Tratamiento "${nombre}" eliminado del arancel.`);
  };

  const handleToggleTratamientoActivo = async (t: TratamientoItem) => {
    const actualizado = { ...t, activo: !t.activo };
    setTratamientos((prev) => prev.map((item) => (item.id === t.id ? actualizado : item)));
    await ApiClient.guardarTratamiento(actualizado);
    showToast(
      `🔄 Estado de "${t.nombre}": ${actualizado.activo ? 'Activo en Caja' : 'Pausado'}`
    );
  };

  const tratamientosFiltrados = tratamientos.filter((t) => {
    const matchText =
      t.nombre.toLowerCase().includes(busquedaTrat.toLowerCase()) ||
      t.codigo.toLowerCase().includes(busquedaTrat.toLowerCase()) ||
      t.descripcion.toLowerCase().includes(busquedaTrat.toLowerCase());
    if (!matchText) return false;
    if (filtroCategoriaTrat !== 'Todas' && t.categoria !== filtroCategoriaTrat) return false;
    return true;
  });

  const promedioArancelUsd =
    tratamientos.length > 0
      ? tratamientos.reduce((acc, t) => acc + t.costoUsd, 0) / tratamientos.length
      : 0;

  // =========================================================================
  // ESTADO FORMULARIO TARJETA 5: CONDICIONES MÉDICAS Y ENFERMEDADES ESPECIALES
  // =========================================================================
  const [showMedForm, setShowMedForm] = useState<boolean>(false);
  const [editMedId, setEditMedId] = useState<string | null>(null);
  const [medCodigoCie, setMedCodigoCie] = useState('');
  const [medNombre, setMedNombre] = useState('');
  const [medCategoria, setMedCategoria] =
    useState<CondicionMedicaItem['categoria']>('Cardiovascular');
  const [medNivelRiesgo, setMedNivelRiesgo] =
    useState<CondicionMedicaItem['nivelRiesgo']>('Moderado');
  const [medManifestacionBucal, setMedManifestacionBucal] = useState('');
  const [medProtocoloDental, setMedProtocoloDental] = useState('');
  const [medAnestesicoContraindicado, setMedAnestesicoContraindicado] = useState('');
  const [medRequiereProfilaxis, setMedRequiereProfilaxis] = useState<boolean>(false);
  const [medActivo, setMedActivo] = useState<boolean>(true);

  const [busquedaMed, setBusquedaMed] = useState('');
  const [filtroRiesgoMed, setFiltroRiesgoMed] = useState<string>('Todos');
  const [filtroCategoriaMed, setFiltroCategoriaMed] = useState<string>('Todas');

  const isMedFormComplete =
    medCodigoCie.trim().length > 0 &&
    medNombre.trim().length > 0 &&
    medManifestacionBucal.trim().length > 0 &&
    medProtocoloDental.trim().length > 0;

  const limpiarFormCondicionMedica = () => {
    setEditMedId(null);
    setMedCodigoCie('');
    setMedNombre('');
    setMedCategoria('Cardiovascular');
    setMedNivelRiesgo('Moderado');
    setMedManifestacionBucal('');
    setMedProtocoloDental('');
    setMedAnestesicoContraindicado('');
    setMedRequiereProfilaxis(false);
    setMedActivo(true);
  };

  const handleEditarCondicionMedica = (item: CondicionMedicaItem) => {
    setEditMedId(item.id);
    setMedCodigoCie(item.codigoCie);
    setMedNombre(item.nombre);
    setMedCategoria(item.categoria);
    setMedNivelRiesgo(item.nivelRiesgo);
    setMedManifestacionBucal(item.manifestacionBucal);
    setMedProtocoloDental(item.protocoloDental);
    setMedAnestesicoContraindicado(item.anestesicoContraindicado || '');
    setMedRequiereProfilaxis(item.requiereProfilaxisAntibiotica);
    setMedActivo(item.activo);
    setShowMedForm(true);
  };

  const handleGuardarCondicionMedica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medCodigoCie.trim() || !medNombre.trim()) return;

    const nuevo: CondicionMedicaItem = {
      id: editMedId || `med-${Date.now()}`,
      codigoCie: medCodigoCie.trim().toUpperCase(),
      nombre: medNombre.trim(),
      categoria: medCategoria,
      nivelRiesgo: medNivelRiesgo,
      manifestacionBucal: medManifestacionBucal.trim(),
      protocoloDental: medProtocoloDental.trim(),
      anestesicoContraindicado: medAnestesicoContraindicado.trim() || undefined,
      requiereProfilaxisAntibiotica: medRequiereProfilaxis,
      activo: medActivo,
    };

    if (editMedId) {
      setCondicionesMedicas((prev) => prev.map((c) => (c.id === editMedId ? nuevo : c)));
      showToast(`✅ Condición médica "${nuevo.nombre}" confirmada y actualizada.`);
    } else {
      setCondicionesMedicas((prev) => [nuevo, ...prev]);
      showToast(`🩺 Condición médica "${nuevo.nombre}" registrada para caracterización.`);
    }

    await ApiClient.guardarCondicionMedica(nuevo);
    limpiarFormCondicionMedica();
    setShowMedForm(false);
  };

  const handleEliminarCondicionMedica = async (id: string, nombre: string) => {
    setCondicionesMedicas((prev) => prev.filter((c) => c.id !== id));
    if (editMedId === id) {
      limpiarFormCondicionMedica();
      setShowMedForm(false);
    }
    await ApiClient.eliminarCondicionMedica(id);
    showToast(`🗑️ Condición médica "${nombre}" eliminada del catálogo.`);
  };

  const handleToggleCondicionActiva = async (item: CondicionMedicaItem) => {
    const actualizado = { ...item, activo: !item.activo };
    setCondicionesMedicas((prev) => prev.map((c) => (c.id === item.id ? actualizado : c)));
    await ApiClient.guardarCondicionMedica(actualizado);
    showToast(
      `🔄 Estado de "${item.nombre}": ${actualizado.activo ? 'Habilitada en Ficha' : 'Deshabilitada'}`
    );
  };

  const condicionesFiltradas = condicionesMedicas.filter((c) => {
    const query = busquedaMed.toLowerCase();
    const matchText =
      c.nombre.toLowerCase().includes(query) ||
      c.codigoCie.toLowerCase().includes(query) ||
      c.manifestacionBucal.toLowerCase().includes(query) ||
      c.protocoloDental.toLowerCase().includes(query) ||
      (c.anestesicoContraindicado && c.anestesicoContraindicado.toLowerCase().includes(query));
    if (!matchText) return false;
    if (filtroRiesgoMed !== 'Todos' && c.nivelRiesgo !== filtroRiesgoMed) return false;
    if (filtroCategoriaMed !== 'Todas' && c.categoria !== filtroCategoriaMed) return false;
    return true;
  });

  const getRiesgoBadgeClass = (riesgo: CondicionMedicaItem['nivelRiesgo']) => {
    switch (riesgo) {
      case 'Crítico':
        return 'bg-status-danger/15 text-status-danger border-status-danger/40 ring-1 ring-status-danger/20';
      case 'Alto':
        return 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-200';
      case 'Moderado':
        return 'bg-sky-100 text-sky-900 border-sky-300 ring-1 ring-sky-200';
      case 'Bajo':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-emerald-200';
      default:
        return 'bg-surface-container text-dental-deep-navy border-border-subtle';
    }
  };

  // Configuración de las pestañas del selector animado
  const tabs: { key: DataTabKey; label: string; shortLabel: string; icon: string; count: number }[] = [
    {
      key: 'odontologos',
      label: 'Ingesta • Odontólogos',
      shortLabel: 'Odontólogos',
      icon: 'clinical_notes',
      count: odontologos.length,
    },
    {
      key: 'higienistas',
      label: 'Ingesta • Higienistas',
      shortLabel: 'Higienistas',
      icon: 'clean_hands',
      count: higienistas.length,
    },
    {
      key: 'pacientes',
      label: 'Control Pacientes en Reserva',
      shortLabel: 'Pacientes',
      icon: 'calendar_month',
      count: pacientes.length,
    },
    {
      key: 'tratamientos',
      label: 'Catálogo Tratamientos & Costos',
      shortLabel: 'Tratamientos',
      icon: 'table_chart',
      count: tratamientos.length,
    },
    {
      key: 'condiciones',
      label: 'Enfermedades & Condiciones Médicas',
      shortLabel: 'Condiciones Médicas',
      icon: 'health_and_safety',
      count: condicionesMedicas.length,
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-32">
      {/* Notificación flotante de confirmación */}
      {toast && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-dental-deep-navy text-white px-4 py-3 rounded-2xl shadow-[0_12px_32px_rgba(23,18,29,0.35)] border border-border-subtle flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="text-xs font-bold">{toast}</span>
          <span className="material-symbols-outlined text-surface-container text-[18px]">verified</span>
        </div>
      )}

      {/* =====================================================================
          CABECERA HERO DE CONTROL DE DATA (Limpia + 5 KPIs Animados Clickeables)
         ===================================================================== */}
      <section className="bg-dental-deep-navy bg-gradient-to-r from-dental-ambient-bg via-dental-deep-navy to-primary rounded-3xl p-5 text-white shadow-[0_10px_30px_rgba(23,18,29,0.22)] border border-primary relative overflow-hidden">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary border border-border-subtle/40 flex items-center justify-center text-white shrink-0 shadow-md">
              <span className="material-symbols-outlined text-[26px] animate-pulse">database</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary text-surface-container border border-border-subtle/40">
                  Administración & Maestros D1
                </span>
              </div>
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-white mt-1 tracking-tight">
                Control de Data Clínica
              </h1>
            </div>
          </div>

          {/* 5 KPIs Animados de Alto Impacto Visual (Clickeables para cambiar de pestaña) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 shrink-0">
            {/* KPI 1: Pacientes en Reserva */}
            <button
              type="button"
              onClick={() => setActiveTab('pacientes')}
              className={`group p-2.5 rounded-2xl text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer relative overflow-hidden ${
                activeTab === 'pacientes'
                  ? 'bg-primary ring-2 ring-surface-container border-surface-container'
                  : 'bg-primary/80 hover:bg-primary border border-border-subtle/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
                <span className="material-symbols-outlined text-[15px] text-surface-container group-hover:rotate-12 transition-transform">
                  person
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-display font-black text-white block leading-none tracking-tight">
                {pacientes.length}
              </span>
              <span className="text-[10px] text-surface-container font-bold block mt-1">
                Pacientes Citas
              </span>
              <div className="w-full h-1 bg-white/20 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-status-success w-full rounded-full animate-pulse" />
              </div>
            </button>

            {/* KPI 2: Odontólogos */}
            <button
              type="button"
              onClick={() => setActiveTab('odontologos')}
              className={`group p-2.5 rounded-2xl text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer relative overflow-hidden ${
                activeTab === 'odontologos'
                  ? 'bg-dental-ambient-bg ring-2 ring-surface-container border-surface-container'
                  : 'bg-dental-ambient-bg/80 hover:bg-dental-ambient-bg border border-border-subtle/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
                <span className="material-symbols-outlined text-[15px] text-surface-container group-hover:rotate-12 transition-transform">
                  clinical_notes
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-display font-black text-white block leading-none tracking-tight">
                {odontologos.length}
              </span>
              <span className="text-[10px] text-surface-container font-bold block mt-1">
                Odontólogos
              </span>
              <div className="w-full h-1 bg-white/15 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-status-success w-4/5 rounded-full animate-pulse" />
              </div>
            </button>

            {/* KPI 3: Higienistas */}
            <button
              type="button"
              onClick={() => setActiveTab('higienistas')}
              className={`group p-2.5 rounded-2xl text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer relative overflow-hidden ${
                activeTab === 'higienistas'
                  ? 'bg-dental-ambient-bg ring-2 ring-surface-container border-surface-container'
                  : 'bg-dental-ambient-bg/80 hover:bg-dental-ambient-bg border border-border-subtle/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-vibrant-cyan animate-ping" />
                <span className="material-symbols-outlined text-[15px] text-surface-container group-hover:rotate-12 transition-transform">
                  clean_hands
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-display font-black text-white block leading-none tracking-tight">
                {higienistas.length}
              </span>
              <span className="text-[10px] text-surface-container font-bold block mt-1">
                Higienistas
              </span>
              <div className="w-full h-1 bg-white/15 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-surface-container w-3/4 rounded-full animate-pulse" />
              </div>
            </button>

            {/* KPI 4: Tratamientos */}
            <button
              type="button"
              onClick={() => setActiveTab('tratamientos')}
              className={`group p-2.5 rounded-2xl text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer relative overflow-hidden ${
                activeTab === 'tratamientos'
                  ? 'bg-primary ring-2 ring-surface-container border-surface-container'
                  : 'bg-primary/80 hover:bg-primary border border-border-subtle/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span className="material-symbols-outlined text-[15px] text-surface-container group-hover:scale-110 transition-transform">
                  medical_information
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-display font-black text-white block leading-none tracking-tight">
                {tratamientos.length}
              </span>
              <span className="text-[10px] text-surface-container font-bold block mt-1">
                Tratamientos
              </span>
              <div className="w-full h-1 bg-white/20 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-white w-full rounded-full animate-pulse" />
              </div>
            </button>

            {/* KPI 5: Condiciones Médicas Especiales */}
            <button
              type="button"
              onClick={() => setActiveTab('condiciones')}
              className={`col-span-2 sm:col-span-1 group p-2.5 rounded-2xl text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer relative overflow-hidden ${
                activeTab === 'condiciones'
                  ? 'bg-dental-deep-navy ring-2 ring-status-danger border-status-danger'
                  : 'bg-dental-deep-navy/90 hover:bg-dental-deep-navy border border-border-subtle/40'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-status-danger animate-ping" />
                <span className="material-symbols-outlined text-[15px] text-surface-container group-hover:rotate-12 transition-transform">
                  health_and_safety
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-display font-black text-white block leading-none tracking-tight">
                {condicionesMedicas.length}
              </span>
              <span className="text-[10px] text-surface-container font-bold block mt-1">
                Condiciones CIE
              </span>
              <div className="w-full h-1 bg-white/20 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-status-danger w-full rounded-full animate-pulse" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          TARJETA SELECTOR ANIMADA DE PESTAÑAS (SEGMENTACIÓN MODERNA Y FLUIDA)
         ===================================================================== */}
      <section className="bg-surface-clean-white rounded-3xl p-3 sm:p-3.5 shadow-soft-elevated border border-border-subtle relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-dental-deep-navy to-primary" />
        
        <div className="flex items-center justify-between gap-3 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">view_carousel</span>
            <span className="text-xs font-black uppercase tracking-wider text-dental-deep-navy">
              Módulos de Segmentación de Datos
            </span>
          </div>
          <span className="text-[11px] font-semibold text-secondary hidden sm:inline">
            Selecciona una tarjeta para gestionar
          </span>
        </div>

        {/* Barra de pestañas responsiva con scroll horizontal y feedback táctil */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 active:scale-95 shrink-0 select-none cursor-pointer border ${
                  isActive
                    ? 'bg-dental-deep-navy text-white shadow-lg border-dental-deep-navy ring-2 ring-primary/30'
                    : 'bg-surface-subtle-ice text-dental-deep-navy hover:bg-surface-container border-border-subtle'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'bg-primary text-white' : 'bg-surface-container text-dental-deep-navy'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                </div>
                <div className="text-left">
                  <span className="hidden md:inline block leading-tight">{tab.label}</span>
                  <span className="md:hidden block leading-tight">{tab.shortLabel}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                    isActive
                      ? 'bg-surface-container text-dental-deep-navy shadow-inner'
                      : 'bg-border-subtle/50 text-secondary'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          RENDERIZADO SEGMENTADO POR PESTAÑAS (MÁXIMA CLARIDAD Y RESPONSIVIDAD)
         ===================================================================== */}

      {/* ---------------------------------------------------------------------
          SECCIÓN 01: INGESTA DE DATOS • ODONTÓLOGOS
         --------------------------------------------------------------------- */}
      {activeTab === 'odontologos' && (
        <section className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-primary" />

          {/* Header Tarjeta 01 */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[22px]">clinical_notes</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy">
                    Tarjeta 01
                  </span>
                  <span className="text-[11px] text-secondary font-semibold">
                    • Staff Facultativo
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy mt-0.5">
                  Ingesta de Datos • Odontólogos
                </h2>
              </div>
            </div>

            {showOdoForm && (
              <button
                type="button"
                onClick={() => {
                  limpiarFormOdontologo();
                  setShowOdoForm(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white text-xs font-bold border border-border-subtle active:scale-95 transition-all"
              >
                Ocultar formulario
              </button>
            )}
          </div>

          {/* 1. Directorio Activo de Odontólogos Registrados (Arriba) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-secondary px-1">
              <span>ODONTÓLOGOS REGISTRADOS ({odontologos.length})</span>
              <span>Toque para editar o eliminar</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {odontologos.map((o) => (
                <div
                  key={o.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    editOdoId === o.id
                      ? 'bg-surface-container border-primary ring-2 ring-primary/30'
                      : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-dental-deep-navy text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                      {o.nombres
                        .replace(/Dra?\.?\s*/i, '')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-dental-deep-navy truncate">
                          {o.nombres}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            o.estado === 'activo'
                              ? 'bg-status-success/15 text-status-success'
                              : o.estado === 'en_guardia'
                              ? 'bg-primary/20 text-dental-deep-navy'
                              : 'bg-secondary/15 text-secondary'
                          }`}
                        >
                          {o.estado === 'activo'
                            ? 'Activo'
                            : o.estado === 'en_guardia'
                            ? 'En Guardia'
                            : 'Descanso'}
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary truncate mt-0.5">{o.especialidad}</p>
                      <div className="flex items-center gap-2 text-[10px] text-secondary mt-1 flex-wrap">
                        <span className="font-mono font-bold text-dental-deep-navy">{o.cedula}</span>
                        <span>•</span>
                        <span>{o.cov}</span>
                        <span>•</span>
                        <span>Box {o.boxAsignado} ({o.turno})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle/60">
                    <span className="text-[10px] font-bold text-secondary">
                      Honorarios: <strong className="text-dental-deep-navy">{o.porcentajeHonorarios}%</strong>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => abrirHistorialHonorariosDoctor(o)}
                        title="Ver Procedimientos y Honorarios en D1"
                        className="h-7 px-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-1 text-[11px] font-bold text-primary hover:bg-primary hover:text-white active:scale-90 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                        <span>Honorarios</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleOdontologoEstado(o)}
                        title="Cambiar estado"
                        className="w-7 h-7 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-secondary hover:text-dental-deep-navy active:scale-90 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">sync_alt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditarOdontologo(o)}
                        title="Editar datos"
                        className="w-7 h-7 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-secondary hover:text-dental-deep-navy active:scale-90 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarOdontologo(o.id, o.nombres)}
                        title="Eliminar de plantilla"
                        className="w-7 h-7 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-status-danger/70 hover:text-status-danger active:scale-90 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón para Desplegar Formulario */}
            {!showOdoForm && (
              <button
                type="button"
                onClick={() => {
                  limpiarFormOdontologo();
                  setShowOdoForm(true);
                }}
                className="w-full mt-3 py-3 px-4 rounded-2xl bg-primary hover:bg-dental-deep-navy text-white font-bold text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Registrar Odontólogo</span>
              </button>
            )}
          </div>

          {/* 2. Formulario Desplegable de Ingesta (Oculto debajo de la lista) */}
          {showOdoForm && (
            <form
              onSubmit={handleGuardarOdontologo}
              className="mt-3 pt-4 border-t-2 border-dashed border-border-subtle flex flex-col gap-3 bg-surface-subtle-ice/60 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-dental-deep-navy flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
                  {editOdoId ? 'Modificar Odontólogo Seleccionado' : 'Nuevo Registro de Odontólogo'}
                </span>
                <span className="text-[10px] text-secondary font-semibold">
                  * Campos requeridos se iluminan al escribir
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Nombres y Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={odoNombres}
                    onChange={(e) => setOdoNombres(e.target.value)}
                    placeholder="Ej. Dra. Carmen Elena Silva"
                    className={`h-10 ${getIlluminatedFieldClass(odoNombres.trim().length > 0)}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={odoCedula}
                    onChange={(e) => setOdoCedula(e.target.value)}
                    placeholder="V-18.234.567"
                    className={`h-10 ${getIlluminatedFieldClass(odoCedula.trim().length > 0)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Colegio Odontológico (C.O.V.) *
                  </label>
                  <input
                    type="text"
                    required
                    value={odoCov}
                    onChange={(e) => setOdoCov(e.target.value)}
                    placeholder="C.O.V. 28.401"
                    className={`h-10 ${getIlluminatedFieldClass(odoCov.trim().length > 0)}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Especialidad Odontológica *
                  </label>
                  <input
                    type="text"
                    required
                    value={odoEspecialidad}
                    onChange={(e) => setOdoEspecialidad(e.target.value)}
                    placeholder="Ej. Periodoncia e Implantología"
                    className={`h-10 ${getIlluminatedFieldClass(odoEspecialidad.trim().length > 0)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Teléfono Móvil (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={odoTelefono}
                    onChange={(e) => setOdoTelefono(e.target.value)}
                    placeholder="+58 412-0000000"
                    className={`h-10 ${getIlluminatedFieldClass(odoTelefono.trim().length > 0)}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={odoEmail}
                    onChange={(e) => setOdoEmail(e.target.value)}
                    placeholder="doctor@odontosalud.ve"
                    className={`h-10 ${getIlluminatedFieldClass(odoEmail.trim().length > 0)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Sede</label>
                  <select
                    value={odoSede}
                    onChange={(e) => setOdoSede(e.target.value as any)}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(odoSede))}`}
                  >
                    <option value="victoria">La Victoria</option>
                    <option value="tovar">Colonia Tovar</option>
                    <option value="ambas">Ambas Sedes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Box Sillón</label>
                  <select
                    value={odoBox}
                    onChange={(e) => setOdoBox(Number(e.target.value))}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(odoBox))}`}
                  >
                    <option value={1}>Box 01</option>
                    <option value={2}>Box 02</option>
                    <option value={3}>Box 03</option>
                    <option value={4}>Box 04</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Turno</label>
                  <select
                    value={odoTurno}
                    onChange={(e) => setOdoTurno(e.target.value as any)}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(odoTurno))}`}
                  >
                    <option value="Completo">Completo</option>
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">% Honorarios</label>
                  <input
                    type="number"
                    min={10}
                    max={90}
                    value={odoHonorarios}
                    onChange={(e) => setOdoHonorarios(Number(e.target.value))}
                    className={`h-9 ${getIlluminatedFieldClass(Number(odoHonorarios) > 0)}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isOdoFormComplete
                    ? 'bg-status-success hover:bg-dental-deep-navy shadow-[0_0_20px_rgba(27,109,59,0.4)] ring-2 ring-status-success/40'
                    : 'bg-primary hover:bg-dental-deep-navy shadow-md'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isOdoFormComplete ? 'verified' : 'person_add'}
                </span>
                <span>
                  {isOdoFormComplete ? 'Confirmar Odontólogo' : 'Registrar Odontólogo'}
                </span>
              </button>
            </form>
          )}
        </section>
      )}

      {/* ---------------------------------------------------------------------
          SECCIÓN 02: INGESTA DE DATOS • HIGIENISTAS DENTALES
         --------------------------------------------------------------------- */}
      {activeTab === 'higienistas' && (
        <section className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-dental-deep-navy" />

          {/* Header Tarjeta 02 */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[22px]">clean_hands</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy">
                    Tarjeta 02
                  </span>
                  <span className="text-[11px] text-secondary font-semibold">
                    • Soporte Clínico
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy mt-0.5">
                  Ingesta de Datos • Higienistas Dentales
                </h2>
              </div>
            </div>

            {showHigForm && (
              <button
                type="button"
                onClick={() => {
                  limpiarFormHigienista();
                  setShowHigForm(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white text-xs font-bold border border-border-subtle active:scale-95 transition-all"
              >
                Ocultar formulario
              </button>
            )}
          </div>

          {/* 1. Lista de Higienistas Registradas (Arriba) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-secondary px-1">
              <span>HIGIENISTAS REGISTRADAS ({higienistas.length})</span>
              <span>Toque para editar o eliminar</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {higienistas.map((h) => (
                <div
                  key={h.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    editHigId === h.id
                      ? 'bg-surface-container border-primary ring-2 ring-primary/30'
                      : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                      {h.nombres
                        .replace(/(Lic|T\.S\.U\.)\.?\s*/i, '')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-dental-deep-navy truncate">
                          {h.nombres}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            h.estado === 'activo'
                              ? 'bg-status-success/15 text-status-success'
                              : h.estado === 'esterilizacion'
                              ? 'bg-primary/20 text-dental-deep-navy'
                              : 'bg-secondary/15 text-secondary'
                          }`}
                        >
                          {h.estado === 'activo'
                            ? 'En Sillón'
                            : h.estado === 'esterilizacion'
                            ? 'Esterilización'
                            : 'Descanso'}
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary truncate mt-0.5">{h.areaEspecialidad}</p>
                      <div className="flex items-center gap-2 text-[10px] text-secondary mt-1 flex-wrap">
                        <span className="font-mono font-bold text-dental-deep-navy">{h.cedula}</span>
                        <span>•</span>
                        <span>{h.registroMpps}</span>
                        <span>•</span>
                        <span>Box {h.boxApoyo}</span>
                      </div>
                      <p className="text-[10px] font-semibold text-primary truncate mt-1">
                        Doc: {h.doctorAsignado}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle/60">
                    <span className="text-[10px] font-bold text-secondary">
                      Turno: <strong className="text-dental-deep-navy">{h.turno}</strong>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleHigienistaEstado(h)}
                        title="Cambiar estado"
                        className="w-7 h-7 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-secondary hover:text-dental-deep-navy active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[15px]">sync_alt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditarHigienista(h)}
                        title="Editar datos"
                        className="w-7 h-7 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-secondary hover:text-dental-deep-navy active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarHigienista(h.id, h.nombres)}
                        title="Eliminar registro"
                        className="w-7 h-7 rounded-lg bg-white border border-border-subtle flex items-center justify-center text-status-danger/70 hover:text-status-danger active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón para Desplegar Formulario */}
            {!showHigForm && (
              <button
                type="button"
                onClick={() => {
                  limpiarFormHigienista();
                  setShowHigForm(true);
                }}
                className="w-full mt-3 py-3 px-4 rounded-2xl bg-dental-deep-navy hover:bg-primary text-white font-bold text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">group_add</span>
                <span>Registrar Higienista</span>
              </button>
            )}
          </div>

          {/* 2. Formulario Desplegable de Higienistas */}
          {showHigForm && (
            <form
              onSubmit={handleGuardarHigienista}
              className="mt-3 pt-4 border-t-2 border-dashed border-border-subtle flex flex-col gap-3 bg-surface-subtle-ice/60 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-dental-deep-navy flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
                  {editHigId ? 'Modificar Higienista Seleccionada' : 'Nuevo Registro de Higienista'}
                </span>
                <span className="text-[10px] text-secondary font-semibold">
                  * Campos requeridos se iluminan al escribir
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Nombres y Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={higNombres}
                    onChange={(e) => setHigNombres(e.target.value)}
                    placeholder="Ej. T.S.U. Andrea Rangel"
                    className={`h-10 ${getIlluminatedFieldClass(higNombres.trim().length > 0)}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={higCedula}
                    onChange={(e) => setHigCedula(e.target.value)}
                    placeholder="V-24.901.883"
                    className={`h-10 ${getIlluminatedFieldClass(higCedula.trim().length > 0)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Registro Sanitario MPPS *
                  </label>
                  <input
                    type="text"
                    required
                    value={higMpps}
                    onChange={(e) => setHigMpps(e.target.value)}
                    placeholder="MPPS-HD-14205"
                    className={`h-10 ${getIlluminatedFieldClass(higMpps.trim().length > 0)}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Área Clínica & Especialidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={higEspecialidad}
                    onChange={(e) => setHigEspecialidad(e.target.value)}
                    placeholder="Profilaxis & Cirugía a 4 Manos"
                    className={`h-10 ${getIlluminatedFieldClass(higEspecialidad.trim().length > 0)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Teléfono Móvil (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={higTelefono}
                    onChange={(e) => setHigTelefono(e.target.value)}
                    placeholder="+58 412-0000000"
                    className={`h-10 ${getIlluminatedFieldClass(higTelefono.trim().length > 0)}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Odontólogo Asignado *
                  </label>
                  <select
                    value={higDoctor}
                    onChange={(e) => setHigDoctor(e.target.value)}
                    className={`h-10 ${getIlluminatedFieldClass(higDoctor.trim().length > 0)}`}
                  >
                    {odontologos.map((doc) => (
                      <option key={doc.id} value={doc.nombres}>
                        {doc.nombres}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Sede</label>
                  <select
                    value={higSede}
                    onChange={(e) => setHigSede(e.target.value as any)}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(higSede))}`}
                  >
                    <option value="victoria">La Victoria</option>
                    <option value="tovar">Colonia Tovar</option>
                    <option value="ambas">Ambas Sedes</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Box Apoyo</label>
                  <select
                    value={higBox}
                    onChange={(e) => setHigBox(Number(e.target.value))}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(higBox))}`}
                  >
                    <option value={1}>Box 01</option>
                    <option value={2}>Box 02</option>
                    <option value={3}>Box 03</option>
                    <option value={4}>Box 04</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Turno</label>
                  <select
                    value={higTurno}
                    onChange={(e) => setHigTurno(e.target.value as any)}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(higTurno))}`}
                  >
                    <option value="Completo">Completo</option>
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Estado</label>
                  <select
                    value={higEstado}
                    onChange={(e) => setHigEstado(e.target.value as any)}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(higEstado))}`}
                  >
                    <option value="activo">En Sillón</option>
                    <option value="esterilizacion">Esterilización</option>
                    <option value="descanso">Descanso</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isHigFormComplete
                    ? 'bg-status-success hover:bg-dental-deep-navy shadow-[0_0_20px_rgba(27,109,59,0.4)] ring-2 ring-status-success/40'
                    : 'bg-dental-deep-navy hover:bg-primary shadow-md'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isHigFormComplete ? 'verified' : 'group_add'}
                </span>
                <span>
                  {isHigFormComplete ? 'Confirmar Higienista' : 'Registrar Higienista'}
                </span>
              </button>
            </form>
          )}
        </section>
      )}

      {/* ---------------------------------------------------------------------
          SECCIÓN 03: CONTROL DE PACIENTES EN RESERVA DE CITAS
         --------------------------------------------------------------------- */}
      {activeTab === 'pacientes' && (
        <section className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-primary" />

          {/* Header Tarjeta Pacientes */}
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy">
                    Tarjeta 03
                  </span>
                  <span className="text-[11px] text-secondary font-semibold">
                    • Citas Web & Recepción ({pacientes.length})
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy mt-0.5">
                  Control de Pacientes en Reserva de Citas
                </h2>
              </div>
            </div>

            {showPacForm && (
              <button
                type="button"
                onClick={() => {
                  limpiarFormPaciente();
                  setShowPacForm(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white text-xs font-bold border border-border-subtle active:scale-95 transition-all"
              >
                Ocultar formulario
              </button>
            )}
          </div>

          {/* 1. Lista de Pacientes en Reserva de Citas (Arriba) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-secondary px-1">
              <span>PACIENTES REGISTRADOS ({pacientes.length})</span>
              <span>Toque para editar o cancelar</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {pacientes.map((p) => {
                const getEstadoBadge = (estado?: string) => {
                  switch (estado) {
                    case 'confirmada':
                      return 'bg-status-success/15 text-status-success';
                    case 'en_sillon':
                      return 'bg-primary/20 text-dental-deep-navy';
                    case 'completada':
                      return 'bg-secondary/15 text-secondary';
                    case 'cancelada':
                      return 'bg-status-danger/15 text-status-danger';
                    default:
                      return 'bg-status-warning/15 text-status-warning';
                  }
                };

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      editPacId === p.id
                        ? 'bg-surface-container border-primary ring-2 ring-primary/30'
                        : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-dental-deep-navy text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                        {p.nombres.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-dental-deep-navy truncate">
                            {p.nombres}
                          </span>
                          {p.esUrgencia && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-status-danger text-white">
                              Urgencia
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${getEstadoBadge(
                              p.estado
                            )}`}
                          >
                            {p.estado || 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-primary truncate mt-0.5">
                          {p.motivo || 'Evaluación General'}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-secondary mt-1 flex-wrap">
                          <span className="font-mono font-bold text-dental-deep-navy">{p.cedula}</span>
                          <span>•</span>
                          <span>{p.telefono}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-secondary mt-0.5 flex-wrap">
                          <span className="font-bold text-dental-deep-navy">
                            📅 {p.fechaCita || 'Hoy'}
                          </span>
                          <span>•</span>
                          <span>⏰ {p.horaInicio || '09:00 AM'}</span>
                          <span>•</span>
                          <span>Sede: {p.sedeId === 'victoria' ? 'La Victoria' : 'Tovar'}</span>
                        </div>
                        {p.doctorNombre && (
                          <p className="text-[10px] font-semibold text-secondary truncate mt-1">
                            Dr(a): {p.doctorNombre}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-border-subtle/60">
                      <button
                        type="button"
                        onClick={() => handleEditarPaciente(p)}
                        title="Editar datos del paciente"
                        className="px-2.5 py-1 rounded-lg bg-white border border-border-subtle flex items-center gap-1 text-[11px] font-bold text-secondary hover:text-dental-deep-navy active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarPaciente(p.id, p.nombres)}
                        title="Eliminar de reserva"
                        className="px-2.5 py-1 rounded-lg bg-white border border-border-subtle flex items-center gap-1 text-[11px] font-bold text-status-danger/80 hover:text-status-danger active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón para Desplegar Formulario */}
            {!showPacForm && (
              <button
                type="button"
                onClick={() => {
                  limpiarFormPaciente();
                  setShowPacForm(true);
                }}
                className="w-full mt-3 py-3 px-4 rounded-2xl bg-primary hover:bg-dental-deep-navy text-white font-bold text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Registrar Nuevo Paciente</span>
              </button>
            )}
          </div>

          {/* 2. Formulario Desplegable de Ingesta de Pacientes */}
          {showPacForm && (
            <form
              onSubmit={handleGuardarPaciente}
              className="mt-3 pt-4 border-t-2 border-dashed border-border-subtle flex flex-col gap-3 bg-surface-subtle-ice/60 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-dental-deep-navy flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
                  {editPacId ? 'Modificar Datos de Reserva' : 'Registrar Nuevo Paciente en Citas'}
                </span>
                <span className="text-[10px] text-secondary font-semibold">
                  * Campos requeridos se iluminan al escribir
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Nombres y Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={pacNombres}
                    onChange={(e) => setPacNombres(e.target.value)}
                    placeholder="Ej. María Elena Delgado"
                    className={`h-10 ${getIlluminatedFieldClass(pacNombres.trim().length > 0)}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={pacCedula}
                    onChange={(e) => setPacCedula(e.target.value)}
                    placeholder="V-21.345.678"
                    className={`h-10 ${getIlluminatedFieldClass(pacCedula.trim().length > 0)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Teléfono Móvil (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={pacTelefono}
                    onChange={(e) => setPacTelefono(e.target.value)}
                    placeholder="+58 412-9876543"
                    className={`h-10 ${getIlluminatedFieldClass(pacTelefono.trim().length > 0)}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={pacEmail}
                    onChange={(e) => setPacEmail(e.target.value)}
                    placeholder="paciente@gmail.com"
                    className={`h-10 ${getIlluminatedFieldClass(pacEmail.trim().length > 0)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Motivo de Consulta / Tratamiento *
                  </label>
                  <input
                    type="text"
                    required
                    value={pacMotivo}
                    onChange={(e) => setPacMotivo(e.target.value)}
                    placeholder="Ej. Evaluación Integral / Dolor Molar"
                    className={`h-10 ${getIlluminatedFieldClass(pacMotivo.trim().length > 0)}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Doctor(a) Tratante *
                  </label>
                  <select
                    value={pacDoctorNombre}
                    onChange={(e) => setPacDoctorNombre(e.target.value)}
                    className={`h-10 ${getIlluminatedFieldClass(pacDoctorNombre.trim().length > 0)}`}
                  >
                    {odontologos.map((doc) => (
                      <option key={doc.id} value={doc.nombres}>
                        {doc.nombres}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Fecha Cita</label>
                  <input
                    type="date"
                    required
                    value={pacFechaCita}
                    onChange={(e) => setPacFechaCita(e.target.value)}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(pacFechaCita))}`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Hora Inicio</label>
                  <select
                    value={pacHoraInicio}
                    onChange={(e) => setPacHoraInicio(e.target.value)}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(pacHoraInicio))}`}
                  >
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Sede</label>
                  <select
                    value={pacSedeId}
                    onChange={(e) => setPacSedeId(e.target.value as any)}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(pacSedeId))}`}
                  >
                    <option value="victoria">La Victoria</option>
                    <option value="tovar">Colonia Tovar</option>
                    <option value="ambas">Ambas Sedes</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">Estado</label>
                  <select
                    value={pacEstado}
                    onChange={(e) => setPacEstado(e.target.value as any)}
                    className={`h-9 ${getIlluminatedFieldClass(Boolean(pacEstado))}`}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="en_sillon">En Sillón</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-bold text-dental-deep-navy bg-white px-3 h-9 rounded-xl border border-border-subtle w-full justify-center mt-3 sm:mt-0">
                    <input
                      type="checkbox"
                      checked={pacEsUrgencia}
                      onChange={(e) => setPacEsUrgencia(e.target.checked)}
                      className="w-4 h-4 accent-status-danger rounded"
                    />
                    <span>Es Urgencia</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isPacFormComplete
                    ? 'bg-status-success hover:bg-dental-deep-navy shadow-[0_0_20px_rgba(27,109,59,0.4)] ring-2 ring-status-success/40'
                    : 'bg-primary hover:bg-dental-deep-navy shadow-md'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPacFormComplete ? 'verified' : 'person_add'}
                </span>
                <span>
                  {isPacFormComplete ? 'Confirmar Paciente' : 'Registrar Nuevo Paciente'}
                </span>
              </button>
            </form>
          )}
        </section>
      )}

      {/* ---------------------------------------------------------------------
          SECCIÓN 04: CATÁLOGO DE TRATAMIENTOS, DATOS CLÍNICOS Y COSTOS
         --------------------------------------------------------------------- */}
      {activeTab === 'tratamientos' && (
        <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-dental-deep-navy" />

          {/* Cabecera de la Tarjeta Tabla */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[24px]">table_chart</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy">
                    Tarjeta 04
                  </span>
                  <span className="text-[11px] text-secondary font-semibold">
                    • Arancel Promedio: ${promedioArancelUsd.toFixed(0)} USD
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy mt-0.5">
                  Catálogo de Tratamientos, Datos Clínicos y Costos
                </h2>
              </div>
            </div>

            {showTratForm && (
              <button
                type="button"
                onClick={() => {
                  limpiarFormTratamiento();
                  setShowTratForm(false);
                }}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white font-bold text-xs border border-border-subtle transition-all active:scale-95"
              >
                Ocultar formulario
              </button>
            )}
          </div>

          {/* Controles de Filtro y Búsqueda de la Tabla */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined text-[18px] text-secondary absolute left-3 top-2.5">
                search
              </span>
              <input
                type="text"
                value={busquedaTrat}
                onChange={(e) => setBusquedaTrat(e.target.value)}
                placeholder="Buscar tratamiento por código, nombre o insumo..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-subtle-ice border border-border-subtle focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-dental-deep-navy"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {['Todas', ...CATEGORIAS_TRATAMIENTO].map((cat) => {
                const active = filtroCategoriaTrat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFiltroCategoriaTrat(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-all active:scale-95 ${
                      active
                        ? 'bg-dental-deep-navy text-white shadow-sm'
                        : 'bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy border border-border-subtle'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1A. VISTA MÓVIL Y TABLET 100% RESPONSIVA (Tarjetas Estructuradas sin Scroll Horizontal) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
            {tratamientosFiltrados.map((t) => {
              const margenUsd = t.costoUsd - t.costoInsumosUsd;
              const margenPct = t.costoUsd > 0 ? Math.round((margenUsd / t.costoUsd) * 100) : 0;
              const montoBs = (t.costoUsd * tasaBcv).toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              const isEditingThis = editTratId === t.id;

              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isEditingThis
                      ? 'bg-surface-container border-primary ring-2 ring-primary/30'
                      : 'bg-surface-subtle-ice border-border-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-dental-deep-navy text-white font-mono text-[10px] font-extrabold">
                          {t.codigo}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-dental-deep-navy font-bold text-[10px]">
                          {t.categoria}
                        </span>
                        <span className="text-[10px] font-bold text-secondary">
                          • {t.duracionMinutos} min {t.requiereRx ? '• +RX' : ''}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-dental-deep-navy mt-1.5 leading-snug">
                        {t.nombre}
                      </h4>
                      <p className="text-[11px] text-secondary mt-0.5 line-clamp-2">
                        {t.descripcion}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleTratamientoActivo(t)}
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        t.activo
                          ? 'bg-status-success/15 text-status-success'
                          : 'bg-secondary/15 text-secondary'
                      }`}
                    >
                      {t.activo ? 'Activo' : 'Pausado'}
                    </button>
                  </div>

                  {/* Detalle Financiero Responsivo */}
                  <div className="bg-white p-2.5 rounded-xl border border-border-subtle flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-secondary block font-semibold">Precio / Caja</span>
                      <span className="font-display font-extrabold text-dental-deep-navy text-sm">
                        ${t.costoUsd}{' '}
                        <span className="text-[10px] font-normal text-secondary">USD</span>
                      </span>
                      <span className="text-[10px] text-secondary block font-mono">
                        ~{montoBs} Bs.
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-secondary block font-semibold">
                        Insumos: ${t.costoInsumosUsd}
                      </span>
                      <span className="font-bold text-status-success text-[11px]">
                        Margen: ${margenUsd} ({margenPct}%)
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border-subtle">
                    <button
                      type="button"
                      onClick={() => handleEditarTratamiento(t)}
                      className="px-3 py-1.5 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Modificar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarTratamiento(t.id, t.nombre)}
                      className="px-3 py-1.5 rounded-xl bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 1B. VISTA DE ESCRITORIO (Tabla Completa con Columnas Clínicas y Financieras) */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border-subtle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-subtle-ice border-b border-border-subtle text-[11px] font-extrabold text-dental-deep-navy uppercase tracking-wider">
                  <th className="py-3 px-3">Cód.</th>
                  <th className="py-3 px-3">Tratamiento & Descripción Clínica</th>
                  <th className="py-3 px-3">Especialidad</th>
                  <th className="py-3 px-2 text-center">Duración</th>
                  <th className="py-3 px-2 text-center">RX</th>
                  <th className="py-3 px-3 text-right">Insumos</th>
                  <th className="py-3 px-3 text-right">Arancel USD</th>
                  <th className="py-3 px-3 text-right">Ref. Bs. BCV</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs text-dental-deep-navy font-medium">
                {tratamientosFiltrados.map((t) => {
                  const montoBs = (t.costoUsd * tasaBcv).toLocaleString('es-VE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  const isEditingThis = editTratId === t.id;

                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors ${
                        isEditingThis ? 'bg-surface-container font-semibold' : 'hover:bg-surface-subtle-ice/60'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-primary">{t.codigo}</td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-bold text-dental-deep-navy">{t.nombre}</div>
                        <div className="text-[11px] text-secondary truncate">{t.descripcion}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-dental-deep-navy text-[10px] font-bold">
                          {t.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-semibold text-secondary">
                        {t.duracionMinutos} min
                      </td>
                      <td className="py-3 px-2 text-center">
                        {t.requiereRx ? (
                          <span className="material-symbols-outlined text-primary text-[17px]" title="Requiere Radiografía">
                            radiology
                          </span>
                        ) : (
                          <span className="text-secondary/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-secondary font-mono">
                        ${t.costoInsumosUsd}
                      </td>
                      <td className="py-3 px-3 text-right font-display font-extrabold text-sm text-dental-deep-navy">
                        ${t.costoUsd}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-secondary font-bold">
                        {montoBs} Bs.
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleTratamientoActivo(t)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase transition-all active:scale-90 ${
                            t.activo
                              ? 'bg-status-success/15 text-status-success hover:bg-status-success hover:text-white'
                              : 'bg-secondary/15 text-secondary hover:bg-secondary hover:text-white'
                          }`}
                        >
                          {t.activo ? 'Activo' : 'Pausado'}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditarTratamiento(t)}
                            title="Modificar tratamiento"
                            className="w-7 h-7 rounded-lg bg-surface-subtle-ice hover:bg-primary hover:text-white flex items-center justify-center text-secondary transition-all active:scale-90"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarTratamiento(t.id, t.nombre)}
                            title="Eliminar del arancel"
                            className="w-7 h-7 rounded-lg bg-surface-subtle-ice hover:bg-status-danger hover:text-white flex items-center justify-center text-status-danger/70 transition-all active:scale-90"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Botón para Desplegar Formulario */}
          {!showTratForm && (
            <button
              type="button"
              onClick={() => {
                limpiarFormTratamiento();
                setShowTratForm(true);
              }}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-dental-deep-navy hover:bg-primary text-white font-bold text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Registrar Tratamiento</span>
            </button>
          )}

          {/* 2. Formulario Desplegable de Tratamientos */}
          {showTratForm && (
            <form
              onSubmit={handleGuardarTratamiento}
              className="mt-3 pt-4 border-t-2 border-dashed border-border-subtle flex flex-col gap-3 bg-surface-subtle-ice/60 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-dental-deep-navy flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
                  {editTratId ? 'Modificar Tratamiento de Arancel' : 'Nuevo Tratamiento Clínico'}
                </span>
                <span className="text-[10px] text-secondary font-semibold">
                  * Campos requeridos se iluminan al escribir
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={tratCodigo}
                    onChange={(e) => setTratCodigo(e.target.value)}
                    placeholder="OD-205"
                    className={`h-10 font-mono ${getIlluminatedFieldClass(tratCodigo.trim().length > 0)}`}
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Nombre del Procedimiento *
                  </label>
                  <input
                    type="text"
                    required
                    value={tratNombre}
                    onChange={(e) => setTratNombre(e.target.value)}
                    placeholder="Ej. Blanqueamiento Dental LED Zoom"
                    className={`h-10 ${getIlluminatedFieldClass(tratNombre.trim().length > 0)}`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Especialidad / Categoría *
                  </label>
                  <select
                    value={tratCategoria}
                    onChange={(e) =>
                      setTratCategoria(e.target.value as TratamientoItem['categoria'])
                    }
                    className={`h-10 ${getIlluminatedFieldClass(Boolean(tratCategoria))}`}
                  >
                    {CATEGORIAS_TRATAMIENTO.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Duración Estimada (Min) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    required
                    value={tratDuracion}
                    onChange={(e) => setTratDuracion(e.target.value)}
                    placeholder="Ej. 45"
                    className={`h-10 ${getIlluminatedFieldClass(Number(tratDuracion) > 0)}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Descripción Clínica / Materiales *
                  </label>
                  <input
                    type="text"
                    required
                    value={tratDescripcion}
                    onChange={(e) => setTratDescripcion(e.target.value)}
                    placeholder="Detalle de insumos, protocolo y alcance..."
                    className={`h-10 ${getIlluminatedFieldClass(tratDescripcion.trim().length > 0)}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Precio Arancel (USD $) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.5"
                    required
                    value={tratCostoUsd}
                    onChange={(e) => setTratCostoUsd(e.target.value)}
                    placeholder="Ej. 45"
                    className={`h-10 ${getIlluminatedFieldClass(Number(tratCostoUsd) > 0)}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Costo Insumos (USD $) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    required
                    value={tratInsumosUsd}
                    onChange={(e) => setTratInsumosUsd(e.target.value)}
                    placeholder="Ej. 10"
                    className={`h-10 ${getIlluminatedFieldClass(tratInsumosUsd.trim().length > 0)}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Equivalente Bs. BCV
                  </label>
                  <div className="h-10 px-3 rounded-xl bg-surface-container border border-border-subtle flex items-center text-xs font-extrabold text-dental-deep-navy">
                    {((Number(tratCostoUsd) || 0) * tasaBcv).toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    Bs.
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-bold text-dental-deep-navy bg-white px-3 h-10 rounded-xl border border-border-subtle w-full justify-center">
                    <input
                      type="checkbox"
                      checked={tratRequiereRx}
                      onChange={(e) => setTratRequiereRx(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <span>Requiere RX</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isTratFormComplete
                      ? 'bg-status-success hover:bg-dental-deep-navy shadow-[0_0_20px_rgba(27,109,59,0.4)] ring-2 ring-status-success/40'
                    : 'bg-primary hover:bg-dental-deep-navy shadow-md'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isTratFormComplete ? 'verified' : 'add_task'}
                  </span>
                  <span>
                    {isTratFormComplete ? 'Confirmar Tratamiento' : 'Registrar Tratamiento'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* ---------------------------------------------------------------------
          SECCIÓN 05 (NUEVA): INGESTA DE ENFERMEDADES Y CONDICIONES MÉDICAS ESPECIALES
         --------------------------------------------------------------------- */}
      {activeTab === 'condiciones' && (
        <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-status-danger via-primary to-dental-deep-navy" />

          {/* Cabecera Tarjeta 05 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[24px]">health_and_safety</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-status-danger/10 text-status-danger border border-status-danger/20">
                    Tarjeta 05 • Bioseguridad & Anamnesis
                  </span>
                  <span className="text-[11px] text-secondary font-semibold">
                    • Catálogo Activo: {condicionesMedicas.length} condiciones registradas
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy mt-0.5">
                  Ingesta de Enfermedades y Condiciones Médicas Especiales
                </h2>
              </div>
            </div>

            {showMedForm && (
              <button
                type="button"
                onClick={() => {
                  limpiarFormCondicionMedica();
                  setShowMedForm(false);
                }}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white font-bold text-xs border border-border-subtle transition-all active:scale-95"
              >
                Ocultar formulario
              </button>
            )}
          </div>

          {/* Controles de Búsqueda y Filtros de Riesgo */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined text-[18px] text-secondary absolute left-3 top-2.5">
                search
              </span>
              <input
                type="text"
                value={busquedaMed}
                onChange={(e) => setBusquedaMed(e.target.value)}
                placeholder="Buscar por CIE-10, patología, anestésico o protocolo..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-subtle-ice border border-border-subtle focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-dental-deep-navy"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro por Nivel de Riesgo */}
              <div className="flex items-center gap-1 bg-surface-subtle-ice p-1 rounded-2xl border border-border-subtle">
                <span className="text-[10px] font-bold text-secondary px-2">Riesgo:</span>
                {['Todos', ...NIVELES_RIESGO].map((r) => {
                  const active = filtroRiesgoMed === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFiltroRiesgoMed(r)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all active:scale-95 ${
                        active
                          ? 'bg-dental-deep-navy text-white shadow-sm'
                          : 'text-secondary hover:text-dental-deep-navy'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>

              {/* Filtro por Categoría */}
              <select
                value={filtroCategoriaMed}
                onChange={(e) => setFiltroCategoriaMed(e.target.value)}
                className="h-8 px-2 rounded-xl text-xs font-bold text-dental-deep-navy bg-surface-subtle-ice border border-border-subtle outline-none"
              >
                <option value="Todas">Todas las Especialidades</option>
                {CATEGORIAS_CONDICION.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Condiciones Médicas Registradas (Tarjetas Detalladas para Caracterización Clínica) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-secondary px-1">
              <span>CATÁLOGO CLÍNICO ({condicionesFiltradas.length} encontradas)</span>
              <span>Caracterización y precauciones en sillón</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[32rem] overflow-y-auto pr-1">
              {condicionesFiltradas.map((cond) => {
                const isEditingThis = editMedId === cond.id;

                return (
                  <div
                    key={cond.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isEditingThis
                        ? 'bg-surface-container border-primary ring-2 ring-primary/30'
                        : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container'
                    }`}
                  >
                    <div>
                      {/* Cabecera de la Condición */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-dental-deep-navy text-white font-mono text-[11px] font-black tracking-wide">
                            {cond.codigoCie}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getRiesgoBadgeClass(
                              cond.nivelRiesgo
                            )}`}
                          >
                            Riesgo {cond.nivelRiesgo}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-dental-deep-navy font-bold text-[10px]">
                            {cond.categoria}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleCondicionActiva(cond)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            cond.activo
                              ? 'bg-status-success/15 text-status-success'
                              : 'bg-secondary/15 text-secondary'
                          }`}
                        >
                          {cond.activo ? 'Activa' : 'Inactiva'}
                        </button>
                      </div>

                      {/* Nombre Principal */}
                      <h3 className="font-display font-extrabold text-sm sm:text-base text-dental-deep-navy mt-2">
                        {cond.nombre}
                      </h3>

                      {/* Alerta de Profilaxis Antibiótica Previa */}
                      {cond.requiereProfilaxisAntibiotica && (
                        <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-status-danger/10 border border-status-danger/30 flex items-center gap-2 text-status-danger">
                          <span className="material-symbols-outlined text-[16px] shrink-0">
                            vaccines
                          </span>
                          <span className="text-[11px] font-black">
                            ¡Requiere Profilaxis Antibiótica Previa al Procedimiento!
                          </span>
                        </div>
                      )}

                      {/* Manifestación Bucal */}
                      <div className="mt-2.5 bg-white p-2.5 rounded-xl border border-border-subtle/80">
                        <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[15px]">dentistry</span>
                          <span>Manifestación Bucal / Signos:</span>
                        </div>
                        <p className="text-xs text-secondary mt-1 leading-relaxed">
                          {cond.manifestacionBucal}
                        </p>
                      </div>

                      {/* Protocolo Dental en Sillón */}
                      <div className="mt-2 bg-white p-2.5 rounded-xl border border-border-subtle/80">
                        <div className="flex items-center gap-1.5 text-dental-deep-navy text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[15px] text-status-success">
                            assignment_turned_in
                          </span>
                          <span>Protocolo Clínico & Recomendación:</span>
                        </div>
                        <p className="text-xs text-dental-deep-navy font-medium mt-1 leading-relaxed">
                          {cond.protocoloDental}
                        </p>
                      </div>

                      {/* Advertencia Anestésica */}
                      {cond.anestesicoContraindicado && (
                        <div className="mt-2 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                          <div className="flex items-center gap-1.5 text-amber-900 text-[11px] font-extrabold">
                            <span className="material-symbols-outlined text-[15px] text-amber-600">
                              warning
                            </span>
                            <span>Anestésico / Fármaco Contraindicado:</span>
                          </div>
                          <p className="text-xs text-amber-950 font-semibold mt-1">
                            {cond.anestesicoContraindicado}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Barra de Acciones */}
                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle/70">
                      <span className="text-[10px] font-mono text-secondary">
                        ID: {cond.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditarCondicionMedica(cond)}
                          className="px-2.5 py-1 rounded-lg bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          <span>Modificar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarCondicionMedica(cond.id, cond.nombre)}
                          className="px-2.5 py-1 rounded-lg bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón para Desplegar Formulario */}
            {!showMedForm && (
              <button
                type="button"
                onClick={() => {
                  limpiarFormCondicionMedica();
                  setShowMedForm(true);
                }}
                className="w-full mt-2 py-3 px-4 rounded-2xl bg-dental-deep-navy hover:bg-primary text-white font-bold text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Registrar Condición Médica</span>
              </button>
            )}
          </div>

          {/* 2. Formulario Desplegable de Ingesta de Condiciones Médicas */}
          {showMedForm && (
            <form
              onSubmit={handleGuardarCondicionMedica}
              className="mt-3 pt-4 border-t-2 border-dashed border-border-subtle flex flex-col gap-3.5 bg-surface-subtle-ice/60 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-dental-deep-navy flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
                  {editMedId
                    ? 'Modificar Condición Médica Seleccionada'
                    : 'Nueva Ingesta de Condición Médica / Patología'}
                </span>
                <span className="text-[10px] text-secondary font-semibold">
                  * Campos requeridos se iluminan al escribir
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Código CIE-10 *
                  </label>
                  <input
                    type="text"
                    required
                    value={medCodigoCie}
                    onChange={(e) => setMedCodigoCie(e.target.value)}
                    placeholder="Ej. I10, E11.9, Z88.0"
                    className={`h-10 font-mono font-bold ${getIlluminatedFieldClass(
                      medCodigoCie.trim().length > 0
                    )}`}
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Nombre de la Patología o Condición *
                  </label>
                  <input
                    type="text"
                    required
                    value={medNombre}
                    onChange={(e) => setMedNombre(e.target.value)}
                    placeholder="Ej. Hipertensión Arterial Sistémica Grado 2"
                    className={`h-10 ${getIlluminatedFieldClass(medNombre.trim().length > 0)}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Categoría *
                  </label>
                  <select
                    value={medCategoria}
                    onChange={(e) =>
                      setMedCategoria(e.target.value as CondicionMedicaItem['categoria'])
                    }
                    className={`h-10 ${getIlluminatedFieldClass(Boolean(medCategoria))}`}
                  >
                    {CATEGORIAS_CONDICION.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Nivel de Riesgo *
                  </label>
                  <select
                    value={medNivelRiesgo}
                    onChange={(e) =>
                      setMedNivelRiesgo(e.target.value as CondicionMedicaItem['nivelRiesgo'])
                    }
                    className={`h-10 ${getIlluminatedFieldClass(Boolean(medNivelRiesgo))}`}
                  >
                    {NIVELES_RIESGO.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Manifestación Bucal & Signos Odontológicos *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={medManifestacionBucal}
                    onChange={(e) => setMedManifestacionBucal(e.target.value)}
                    placeholder="Ej. Xerostomía, hiperplasia gingival, sangrado fácil, aftas..."
                    className={`py-2 resize-none ${getIlluminatedFieldClass(
                      medManifestacionBucal.trim().length > 0
                    )}`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Protocolo Dental & Consideraciones Clínicas *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={medProtocoloDental}
                    onChange={(e) => setMedProtocoloDental(e.target.value)}
                    placeholder="Ej. Toma de presión previa, citas cortas matutinas, hemostáticos locales..."
                    className={`py-2 resize-none ${getIlluminatedFieldClass(
                      medProtocoloDental.trim().length > 0
                    )}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                    Anestésicos o Fármacos Contraindicados (Opcional)
                  </label>
                  <input
                    type="text"
                    value={medAnestesicoContraindicado}
                    onChange={(e) => setMedAnestesicoContraindicado(e.target.value)}
                    placeholder="Ej. Evitar epinefrina/norepinefrina, mepivacaína recomendada..."
                    className={`h-10 ${getIlluminatedFieldClass(
                      medAnestesicoContraindicado.trim().length > 0
                    )}`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-dental-deep-navy bg-white px-3 h-10 rounded-xl border border-border-subtle w-full">
                    <input
                      type="checkbox"
                      checked={medRequiereProfilaxis}
                      onChange={(e) => setMedRequiereProfilaxis(e.target.checked)}
                      className="w-4 h-4 accent-status-danger rounded"
                    />
                    <span>Profilaxis Antibiótica</span>
                  </label>
                </div>

                <div className="sm:col-span-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-dental-deep-navy bg-white px-3 h-10 rounded-xl border border-border-subtle w-full">
                    <input
                      type="checkbox"
                      checked={medActivo}
                      onChange={(e) => setMedActivo(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <span>Habilitada en Ficha</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isMedFormComplete
                      ? 'bg-status-success hover:bg-dental-deep-navy shadow-[0_0_20px_rgba(27,109,59,0.4)] ring-2 ring-status-success/40'
                      : 'bg-primary hover:bg-dental-deep-navy shadow-md'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isMedFormComplete ? 'verified' : 'add_circle'}
                  </span>
                  <span>
                    {isMedFormComplete ? 'Confirmar Condición Médica' : 'Registrar Condición Médica'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Modal de Historial de Tratamientos y Honorarios por Odontólogo */}
      {doctorModalHonorarios && (
        <div className="fixed inset-0 z-50 bg-dental-deep-navy/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-surface-clean-white w-full max-w-lg rounded-3xl p-5 flex flex-col gap-3.5 shadow-2xl animate-in zoom-in-95 border border-border-subtle max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-sm sm:text-base text-dental-deep-navy">
                    {doctorModalHonorarios.nombres}
                  </h4>
                  <p className="text-xs text-secondary">
                    {doctorModalHonorarios.especialidad} • {doctorModalHonorarios.cov}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDoctorModalHonorarios(null)}
                className="w-8 h-8 rounded-full bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {loadingDoctorHonorarios ? (
              <div className="py-8 text-center text-xs text-secondary animate-pulse">
                Consultando producción y honorarios en Cloudflare D1...
              </div>
            ) : doctorHonorariosData ? (
              <div className="flex flex-col gap-3">
                {/* Métricas del Doctor */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle">
                    <span className="text-[9px] uppercase font-bold text-secondary block">Producción</span>
                    <span className="font-bold text-xs text-dental-deep-navy block mt-0.5">
                      ${doctorHonorariosData.resumen.totalProduccionUsd?.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80">
                    <span className="text-[9px] uppercase font-bold text-amber-800 block">Pendiente</span>
                    <span className="font-bold text-xs text-amber-900 block mt-0.5">
                      ${doctorHonorariosData.resumen.totalHonorariosPendientesUsd?.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80">
                    <span className="text-[9px] uppercase font-bold text-emerald-800 block">Liquidado</span>
                    <span className="font-bold text-xs text-emerald-900 block mt-0.5">
                      ${doctorHonorariosData.resumen.totalHonorariosLiquidadosUsd?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-bold text-dental-deep-navy flex items-center justify-between">
                  <span>Procedimientos Registrados</span>
                  <span className="text-[10px] text-secondary">
                    Comisión: {doctorModalHonorarios.porcentajeHonorarios}%
                  </span>
                </div>

                {doctorHonorariosData.tratamientos.length === 0 ? (
                  <div className="py-6 text-center text-xs text-secondary bg-surface-subtle-ice rounded-xl border border-border-subtle">
                    No registra procedimientos asentados en el sistema aún.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {doctorHonorariosData.tratamientos.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-dental-deep-navy truncate">
                            {t.tratamientoNombre}
                          </span>
                          <span className="font-mono font-bold text-primary shrink-0">
                            +${t.montoHonorarioUsd?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-secondary">
                          <span>👤 {t.pacienteNombre}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full font-bold text-[9px] ${
                              t.estadoPagoHonorario === 'liquidado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.estadoPagoHonorario === 'liquidado' ? 'Liquidado' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setDoctorModalHonorarios(null)}
              className="w-full py-2.5 rounded-xl bg-surface-subtle-ice hover:bg-border-subtle text-secondary font-bold text-xs transition-all active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
