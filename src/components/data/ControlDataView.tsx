import React, { useState, useEffect, useMemo } from 'react';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { useSede } from '../../context/SedeContext';
import { ApiClient } from '../../services/api';
import { normalizarFechaInput } from '../booking/BookingFlow';
import {
  OdontologoItem,
  HigienistaItem,
  TratamientoItem,
  PacienteItem,
  CondicionMedicaItem,
  TratamientoRealizadoItem,
  CierreDiarioItem,
  InventarioItem,
  LaboratorioItem,
  Cita,
  SedeId,
  SedeInfo,
  BoxInfo,
} from '../../types/clinical';

const INITIAL_INVENTARIO: InventarioItem[] = [
  {
    id: 'inv-1',
    codigo: 'MAT-RES-01',
    nombre: 'Resina Filtek Z350 XT 3M ESPE (Tono A2)',
    categoria: 'Restauración / Operatoria',
    stockActual: 14,
    stockMinimo: 5,
    unidadMedida: 'Tubo / Jeringa',
    precioCompraUsd: 38.5,
    fechaIngreso: '2026-10-15',
    fechaSalida: '2026-11-04',
    lote: '3M-88910',
    sedeId: 'victoria',
    estado: 'disponible',
    observaciones: 'Nanopartículas cerámicas para sector anterior y posterior',
  },
  {
    id: 'inv-2',
    codigo: 'MAT-ANE-02',
    nombre: 'Lidocaína 2% con Epinefrina 1:100.000 (New Sticaine)',
    categoria: 'Anestesia & Farmacia',
    stockActual: 22,
    stockMinimo: 8,
    unidadMedida: 'Caja',
    precioCompraUsd: 28.0,
    fechaIngreso: '2026-10-20',
    fechaSalida: '2026-11-06',
    lote: 'LIDO-2026-11',
    sedeId: 'victoria',
    estado: 'disponible',
    observaciones: 'Caja de 50 carpules odontológicos de vidrio',
  },
  {
    id: 'inv-3',
    codigo: 'MAT-AGU-03',
    nombre: 'Agujas Dentales Desechables Cortas 30G (Septodont)',
    categoria: 'Anestesia & Farmacia',
    stockActual: 18,
    stockMinimo: 6,
    unidadMedida: 'Caja',
    precioCompraUsd: 14.0,
    fechaIngreso: '2026-10-18',
    fechaSalida: '2026-11-05',
    lote: 'SEP-4401',
    sedeId: 'tovar',
    estado: 'disponible',
    observaciones: 'Caja de 100 unidades esterilizadas con gas EO',
  },
  {
    id: 'inv-4',
    codigo: 'MAT-BIO-04',
    nombre: 'Guantes de Nitrilo Quirúrgico Talla M (Cranberry)',
    categoria: 'Bioseguridad & Desinfección',
    stockActual: 35,
    stockMinimo: 10,
    unidadMedida: 'Caja',
    precioCompraUsd: 9.5,
    fechaIngreso: '2026-10-25',
    fechaSalida: '2026-11-07',
    lote: 'CRAN-992',
    sedeId: 'victoria',
    estado: 'disponible',
    observaciones: 'Caja de 100 unidades sin talco, hipoalergénicos',
  },
  {
    id: 'inv-5',
    codigo: 'MAT-ALG-05',
    nombre: 'Alginato Cromático Jeltrate Plus (Dentsply Sirona)',
    categoria: 'Prótesis & Impresión',
    stockActual: 4,
    stockMinimo: 5,
    unidadMedida: 'Paquete',
    precioCompraUsd: 16.5,
    fechaIngreso: '2026-10-12',
    fechaSalida: '2026-11-03',
    lote: 'DENT-3108',
    sedeId: 'victoria',
    estado: 'bajo_stock',
    observaciones: 'Bolsa de 454g polvo hidrocoloide con cambio de fase',
  },
  {
    id: 'inv-6',
    codigo: 'MAT-GUT-06',
    nombre: 'Conos de Gutapercha 0.04 Taper Surtidos 15-40 (Meta Biomed)',
    categoria: 'Endodoncia',
    stockActual: 12,
    stockMinimo: 4,
    unidadMedida: 'Caja',
    precioCompraUsd: 22.0,
    fechaIngreso: '2026-10-05',
    fechaSalida: '2026-11-02',
    lote: 'META-7721',
    sedeId: 'victoria',
    estado: 'disponible',
    observaciones: 'Caja de 60 puntas calibradas milimétricamente',
  },
  {
    id: 'inv-7',
    codigo: 'MAT-ION-07',
    nombre: 'Cemento de Ionómero de Vidrio Ionoseal (VOCO)',
    categoria: 'Restauración / Operatoria',
    stockActual: 2,
    stockMinimo: 3,
    unidadMedida: 'Tubo / Jeringa',
    precioCompraUsd: 42.0,
    fechaIngreso: '2026-10-08',
    fechaSalida: '2026-11-01',
    lote: 'VOCO-1290',
    sedeId: 'tovar',
    estado: 'bajo_stock',
    observaciones: 'Liner cavitario fotopolimerizable listo para usar',
  },
  {
    id: 'inv-8',
    codigo: 'MAT-GLU-08',
    nombre: 'Glutaraldehído 2% para Esterilización en Frío (Korsolex)',
    categoria: 'Bioseguridad & Desinfección',
    stockActual: 4,
    stockMinimo: 2,
    unidadMedida: 'Galón',
    precioCompraUsd: 35.0,
    fechaIngreso: '2026-10-01',
    fechaSalida: '2026-10-28',
    lote: 'KORS-552',
    sedeId: 'victoria',
    estado: 'disponible',
    observaciones: 'Galón de 3.8 Litros con solución activadora de esporas',
  },
];

const INITIAL_LABORATORIOS: LaboratorioItem[] = [
  {
    id: 'lab-1',
    ordenCodigo: 'LAB-2026-081',
    laboratorioNombre: 'DentalTech Protesistas La Victoria',
    tecnicoResponsable: 'T.D. Roberto Benítez',
    telefonoContacto: '+58 412-8819022',
    pacienteNombre: 'Patricia Velásquez',
    pacienteCedula: 'V-18.490.112',
    doctorTratante: 'Dra. María Alejandra Domínguez',
    tipoTrabajo: 'Corona Zirconio Monolítico',
    piezaDiente: '16',
    colorGuiaVita: 'A2 (Vita Classical)',
    costoLaboratorioUsd: 65.0,
    fechaEnvio: '2026-11-02',
    fechaPrometidaEntrega: '2026-11-09',
    fechaPruebaBoca: '2026-11-07',
    estado: 'en_prueba_bizcocho',
    sedeId: 'victoria',
    observaciones: 'Estructura ajustada en modelo digital, requiere prueba de punto de contacto',
  },
  {
    id: 'lab-2',
    ordenCodigo: 'LAB-2026-082',
    laboratorioNombre: 'Laboratorio Protésico El Ávila',
    tecnicoResponsable: 'T.D. Luisana Morales',
    telefonoContacto: '+58 414-2390119',
    pacienteNombre: 'Elena Blanco',
    pacienteCedula: 'V-15.892.401',
    doctorTratante: 'Dr. Carlos Mendoza Rivas',
    tipoTrabajo: 'Prótesis Parcial Removible',
    piezaDiente: '34-37',
    colorGuiaVita: 'A3 (Vita Classical)',
    costoLaboratorioUsd: 90.0,
    fechaEnvio: '2026-10-28',
    fechaPrometidaEntrega: '2026-11-08',
    estado: 'listo_en_clinica',
    sedeId: 'victoria',
    observaciones: 'Estructura metálica cromo-cobalto con dientes acrílicos prensados',
  },
  {
    id: 'lab-3',
    ordenCodigo: 'LAB-2026-083',
    laboratorioNombre: 'Centro Dental DentArt Caracas',
    tecnicoResponsable: 'T.D. Marcos Padrón',
    telefonoContacto: '+58 424-1198421',
    pacienteNombre: 'Carlos Mendoza',
    pacienteCedula: 'V-21.309.845',
    doctorTratante: 'Dra. Valentina Páez Gómez',
    tipoTrabajo: 'Carilla Cerámica E-Max',
    piezaDiente: '21',
    colorGuiaVita: 'BL2 (Bleach)',
    costoLaboratorioUsd: 75.0,
    fechaEnvio: '2026-11-04',
    fechaPrometidaEntrega: '2026-11-11',
    estado: 'en_laboratorio',
    sedeId: 'tovar',
    observaciones: 'Carilla estética ultra delgada 0.3mm con estratificación de esmalte',
  },
  {
    id: 'lab-4',
    ordenCodigo: 'LAB-2026-084',
    laboratorioNombre: 'OrthoLab Express Maracay',
    tecnicoResponsable: 'T.D. Jenny Rangel',
    telefonoContacto: '+58 412-5501923',
    pacienteNombre: 'Sofía Valentina Gómez',
    pacienteCedula: 'V-27.104.992',
    doctorTratante: 'Dr. Carlos Mendoza Rivas',
    tipoTrabajo: 'Retenedor Essix / Hawley',
    piezaDiente: 'Arcada Superior',
    colorGuiaVita: 'Transparente',
    costoLaboratorioUsd: 35.0,
    fechaEnvio: '2026-10-25',
    fechaPrometidaEntrega: '2026-10-31',
    fechaPruebaBoca: '2026-10-31',
    estado: 'instalado_al_paciente',
    sedeId: 'victoria',
    observaciones: 'Retenedor termoplástico 1mm post-tratamiento de ortodoncia',
  },
];

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
    id: 'pac-raymond',
    nombres: 'Raymond Gilbonio',
    cedula: 'V-16.762.319',
    telefono: '04126841381',
    email: 'raymond.gilbonio@odontosaludlv.com',
    sexo: 'Masculino',
    fechaNacimiento: '1982-10-15',
    condicionMedicaId: 'med-1',
    sedeId: 'victoria',
  },
  {
    id: 'pac-1',
    nombres: 'Patricia Velásquez',
    cedula: 'V-19.845.221',
    telefono: '+58 412-9876543',
    email: 'patricia.velasquez@gmail.com',
    sexo: 'Femenino',
    fechaNacimiento: '1989-06-14',
    condicionMedicaId: 'ninguna',
    sedeId: 'victoria',
  },
  {
    id: 'pac-2',
    nombres: 'Carlos Mendoza',
    cedula: 'V-17.902.311',
    telefono: '+58 414-5550921',
    email: 'carlos.mendoza@hotmail.com',
    sexo: 'Masculino',
    fechaNacimiento: '1986-11-20',
    condicionMedicaId: 'ninguna',
    sedeId: 'victoria',
  },
  {
    id: 'pac-3',
    nombres: 'Marcos Ramos',
    cedula: 'V-22.109.833',
    telefono: '+58 424-3341122',
    email: 'marcos.ramos@gmail.com',
    sexo: 'Masculino',
    fechaNacimiento: '1994-03-05',
    condicionMedicaId: 'ninguna',
    sedeId: 'ambas',
  },
];

const INITIAL_CITAS: Cita[] = [
  {
    id: 'cita-1',
    sedeId: 'victoria',
    pacienteId: 'pac-1',
    pacienteNombre: 'Patricia Velásquez',
    pacienteCedula: 'V-19.845.221',
    pacienteTelefono: '+58 412-9876543',
    doctorNombre: 'Dra. María Alejandra Domínguez',
    boxNumero: 1,
    fechaCita: '2024-10-24',
    horaInicio: '09:00 AM',
    motivo: 'Evaluación Inicial & Dolor molar superior',
    estado: 'pendiente',
    esUrgencia: true,
  },
  {
    id: 'cita-2',
    sedeId: 'victoria',
    pacienteId: 'pac-2',
    pacienteNombre: 'Carlos Mendoza',
    pacienteCedula: 'V-17.902.311',
    pacienteTelefono: '+58 414-5550921',
    doctorNombre: 'Dr. Carlos Mendoza Rivas',
    boxNumero: 2,
    fechaCita: '2024-10-24',
    horaInicio: '10:30 AM',
    motivo: 'Control Mensual de Ortodoncia Brackets',
    estado: 'confirmada',
    esUrgencia: false,
  },
  {
    id: 'cita-3',
    sedeId: 'victoria',
    pacienteId: 'pac-raymond',
    pacienteNombre: 'Raymond Gilbonio',
    pacienteCedula: 'V-16.762.319',
    pacienteTelefono: '04126841381',
    doctorNombre: 'Dra. María Alejandra Domínguez',
    boxNumero: 1,
    fechaCita: '2024-10-25',
    horaInicio: '09:00 AM',
    motivo: 'Evaluación Integral Odontológica',
    estado: 'confirmada',
    esUrgencia: false,
  },
  {
    id: 'cita-4',
    sedeId: 'tovar',
    pacienteId: 'pac-3',
    pacienteNombre: 'Marcos Ramos',
    pacienteCedula: 'V-22.109.833',
    pacienteTelefono: '+58 424-3341122',
    doctorNombre: 'Dra. Valentina Páez Gómez',
    boxNumero: 1,
    fechaCita: '2024-10-25',
    horaInicio: '02:00 PM',
    motivo: 'Profilaxis Ultrasónica & Pulido Coronario',
    estado: 'completada',
    esUrgencia: false,
  },
];

function calcularEdad(fechaNac?: string): string {
  if (!fechaNac) return '';
  const iso = normalizarFechaInput(fechaNac);
  const birth = new Date(iso);
  if (isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? `${age} años` : 'Menor de 1 año';
}

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

type DataTabKey = 'sedes' | 'odontologos' | 'higienistas' | 'pacientes' | 'citas' | 'tratamientos' | 'condiciones' | 'cierres' | 'inventario' | 'laboratorios';

// Clase utilitaria para iluminar bordes de campos cuando se están llenando o ya contienen valor
const getIlluminatedFieldClass = (isFilled: boolean) =>
  `w-full px-3 rounded-xl text-xs font-semibold text-dental-deep-navy transition-all duration-200 outline-none ${
    isFilled
      ? 'bg-white border-2 border-primary ring-2 ring-primary/20 shadow-[0_0_12px_rgba(81,64,95,0.22)]'
      : 'bg-surface-subtle-ice border border-border-subtle focus:bg-white focus:border-2 focus:border-primary focus:ring-4 focus:ring-primary/25 focus:shadow-[0_0_16px_rgba(81,64,95,0.32)]'
  }`;

export const ControlDataView: React.FC = () => {
  const { tasaBcv } = useTasaCambio();
  const { sedesDisponibles, actualizarConfigSede, recargarConfigSedes } = useSede();

  // Pestaña activa del selector animado
  const [activeTab, setActiveTab] = useState<DataTabKey>('sedes');

  // Estado del Módulo 00: Configuración Maestra de Sedes (Fuente de la Verdad)
  const [sedeEditandoId, setSedeEditandoId] = useState<SedeId>('victoria');
  const [sedeFormData, setSedeFormData] = useState<SedeInfo>(() => sedesDisponibles.victoria);
  const [guardandoSede, setGuardandoSede] = useState(false);

  // Sincronizar formulario al cambiar de sede seleccionada
  const seleccionarSedeParaEditar = (id: SedeId) => {
    setSedeEditandoId(id);
    if (sedesDisponibles[id]) {
      setSedeFormData({ ...sedesDisponibles[id] });
    }
  };

  useEffect(() => {
    if (sedesDisponibles[sedeEditandoId]) {
      setSedeFormData({ ...sedesDisponibles[sedeEditandoId] });
    }
  }, [sedesDisponibles, sedeEditandoId]);

  // Estados Módulo 08: Inventario de Insumos & Materiales Odontológicos
  const [inventario, setInventario] = useState<InventarioItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_inventario');
      return saved ? JSON.parse(saved) : INITIAL_INVENTARIO;
    } catch {
      return INITIAL_INVENTARIO;
    }
  });
  const [filtroCategoriaInventario, setFiltroCategoriaInventario] = useState<string>('todas');
  const [filtroSedeInventario, setFiltroSedeInventario] = useState<string>('todas');
  const [busquedaInventario, setBusquedaInventario] = useState<string>('');
  const [showModalInsumo, setShowModalInsumo] = useState<boolean>(false);
  const [insumoEditando, setInsumoEditando] = useState<InventarioItem | null>(null);
  const [formInsumo, setFormInsumo] = useState<Partial<InventarioItem>>({
    codigo: '',
    nombre: '',
    categoria: 'Restauración / Operatoria',
    stockActual: 10,
    stockMinimo: 3,
    unidadMedida: 'Tubo / Jeringa',
    precioCompraUsd: 25,
    fechaIngreso: new Date().toISOString().slice(0, 10),
    fechaSalida: '',
    lote: '',
    sedeId: 'victoria',
    estado: 'disponible',
    observaciones: '',
  });

  // Guardar inventario en localStorage
  useEffect(() => {
    localStorage.setItem('odontosalud_data_inventario', JSON.stringify(inventario));
  }, [inventario]);

  // Estados Módulo 09: Laboratorios Dentales & Prótesis Externas (10ª Pestaña)
  const [laboratorios, setLaboratorios] = useState<LaboratorioItem[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_laboratorios');
      return saved ? JSON.parse(saved) : INITIAL_LABORATORIOS;
    } catch {
      return INITIAL_LABORATORIOS;
    }
  });
  const [filtroEstadoLab, setFiltroEstadoLab] = useState<string>('todos');
  const [busquedaLab, setBusquedaLab] = useState<string>('');
  const [showModalLab, setShowModalLab] = useState<boolean>(false);
  const [labEditando, setLabEditando] = useState<LaboratorioItem | null>(null);
  const [formLab, setFormLab] = useState<Partial<LaboratorioItem>>({
    ordenCodigo: `LAB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    laboratorioNombre: '',
    tecnicoResponsable: '',
    telefonoContacto: '+58 ',
    pacienteNombre: '',
    pacienteCedula: 'V-',
    doctorTratante: 'Dra. María Alejandra Domínguez',
    tipoTrabajo: 'Corona Zirconio Monolítico',
    piezaDiente: '',
    colorGuiaVita: 'A2 (Vita Classical)',
    costoLaboratorioUsd: 50,
    fechaEnvio: new Date().toISOString().slice(0, 10),
    fechaPrometidaEntrega: '',
    fechaPruebaBoca: '',
    estado: 'en_laboratorio',
    sedeId: 'victoria',
    observaciones: '',
  });

  // Guardar laboratorios en localStorage
  useEffect(() => {
    localStorage.setItem('odontosalud_data_laboratorios', JSON.stringify(laboratorios));
  }, [laboratorios]);

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
      const list: PacienteItem[] = saved ? JSON.parse(saved) : INITIAL_PACIENTES;
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
      return INITIAL_PACIENTES;
    }
  });

  const [citas, setCitas] = useState<Cita[]>(() => {
    try {
      const saved = localStorage.getItem('odontosalud_data_citas');
      return saved ? JSON.parse(saved) : INITIAL_CITAS;
    } catch {
      return INITIAL_CITAS;
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

  const [cierresDiarios, setCierresDiarios] = useState<CierreDiarioItem[]>([]);
  const [isLoadingCierres, setIsLoadingCierres] = useState(false);

  const cargarCierresDiarios = async () => {
    setIsLoadingCierres(true);
    try {
      const data = await ApiClient.getCierresDiarios();
      setCierresDiarios(data || []);
    } catch (err) {
      console.error('Error al cargar cierres diarios:', err);
    } finally {
      setIsLoadingCierres(false);
    }
  };

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Sincronización con Cloudflare D1 al montar
  useEffect(() => {
    cargarCierresDiarios();
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
        setPacientes(sanitized);
      }
      if (remote.citas && remote.citas.length > 0) {
        setCitas(remote.citas);
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('odontosalud_data_updated', {
            detail: { tipo: 'odontologos', data: odontologos },
          })
        );
      }
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
      localStorage.setItem('odontosalud_data_citas', JSON.stringify(citas));
    } catch {
      // ignore
    }
  }, [citas]);

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
  const [fotoComprobanteModal, setFotoComprobanteModal] = useState<string | null>(null);

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
  // ESTADO FORMULARIO TARJETA 3: PADRÓN EXCLUSIVO DE PACIENTES (CRUD)
  // =========================================================================
  const [showPacForm, setShowPacForm] = useState<boolean>(false);
  const [editPacId, setEditPacId] = useState<string | null>(null);
  const [pacNombres, setPacNombres] = useState('');
  const [pacCedulaTipo, setPacCedulaTipo] = useState<'V' | 'E' | 'J' | 'G'>('V');
  const [pacCedulaNumero, setPacCedulaNumero] = useState('');
  const [pacSexo, setPacSexo] = useState<'Femenino' | 'Masculino' | 'Otro'>('Femenino');
  const [pacFechaNacimiento, setPacFechaNacimiento] = useState('');
  const [pacTelefono, setPacTelefono] = useState('');
  const [pacEmail, setPacEmail] = useState('');
  const [pacCondicionId, setPacCondicionId] = useState('ninguna');
  const [pacSedeId, setPacSedeId] = useState<SedeId | 'ambas'>('victoria');
  const [pacSearchQuery, setPacSearchQuery] = useState('');

  const isPacFormComplete =
    pacNombres.trim().length > 0 &&
    pacCedulaNumero.trim().length > 0 &&
    pacTelefono.trim().length > 0;

  const limpiarFormPaciente = () => {
    setEditPacId(null);
    setPacNombres('');
    setPacCedulaTipo('V');
    setPacCedulaNumero('');
    setPacSexo('Femenino');
    setPacFechaNacimiento('');
    setPacTelefono('');
    setPacEmail('');
    setPacCondicionId('ninguna');
    setPacSedeId('victoria');
  };

  const handleEditarPaciente = (p: PacienteItem) => {
    setEditPacId(p.id);
    setPacNombres(p.nombres);

    // Descomponer tipo de cédula y número
    const rawCedula = p.cedula || '';
    const match = rawCedula.match(/^([VEJG])[-.]?\s*(\d.*)$/i);
    if (match) {
      setPacCedulaTipo(match[1].toUpperCase() as 'V' | 'E' | 'J' | 'G');
      setPacCedulaNumero(match[2].replace(/[^0-9]/g, ''));
    } else {
      setPacCedulaTipo('V');
      setPacCedulaNumero(rawCedula.replace(/[^0-9]/g, ''));
    }

    setPacSexo(p.sexo || 'Femenino');
    setPacFechaNacimiento(normalizarFechaInput(p.fechaNacimiento));
    setPacTelefono(p.telefono);
    setPacEmail(p.email || '');
    setPacCondicionId(p.condicionMedicaId || 'ninguna');
    setPacSedeId(p.sedeId || 'victoria');
    setShowPacForm(true);
  };

  const handleGuardarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacNombres.trim() || !pacCedulaNumero.trim()) return;

    // Formatear cédula canónica: V-XX.XXX.XXX
    const cleanNum = pacCedulaNumero.replace(/[^0-9]/g, '');
    const formattedCedula = `${pacCedulaTipo}-${cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

    const nuevo: PacienteItem = {
      id: editPacId || `pac-${Date.now()}`,
      nombres: pacNombres.trim(),
      cedula: formattedCedula,
      telefono: pacTelefono.trim(),
      email: pacEmail.trim(),
      sexo: pacSexo,
      fechaNacimiento: normalizarFechaInput(pacFechaNacimiento),
      condicionMedicaId: pacCondicionId,
      sedeId: pacSedeId,
    };

    if (editPacId) {
      setPacientes((prev) => prev.map((item) => (item.id === editPacId ? nuevo : item)));
      showToast(`✅ Paciente ${nuevo.nombres} actualizado en el Padrón.`);
    } else {
      setPacientes((prev) => [nuevo, ...prev]);
      showToast(`👤 Paciente ${nuevo.nombres} incorporado al Padrón.`);
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
    showToast(`🗑️ Paciente ${nombre} eliminado del Padrón.`);
  };

  // Filtrado de pacientes en búsqueda en vivo
  const pacientesFiltrados = pacientes.filter((p) => {
    const q = pacSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nombres.toLowerCase().includes(q) ||
      (p.cedula || '').toLowerCase().includes(q) ||
      (p.telefono || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    );
  });

  // =========================================================================
  // ESTADO Y FILTROS TARJETA 4: CONTROL DE CITAS PROGRAMADAS
  // =========================================================================
  const [citasFiltroDoctor, setCitasFiltroDoctor] = useState<string>('todos');
  const [citasFiltroPaciente, setCitasFiltroPaciente] = useState<string>('');
  const [citasFiltroFecha, setCitasFiltroFecha] = useState<'todas' | 'hoy' | 'semana' | 'especifica'>('todas');
  const [citasFechaEspecifica, setCitasFechaEspecifica] = useState<string>('');
  const [citasFiltroTratamiento, setCitasFiltroTratamiento] = useState<string>('todos');
  const [citasFiltroEstado, setCitasFiltroEstado] = useState<string>('todos');

  const hoyStr = new Date().toISOString().split('T')[0];

  const citasFiltradas = citas.filter((c) => {
    // Filtro Doctor
    if (citasFiltroDoctor !== 'todos' && c.doctorNombre !== citasFiltroDoctor) {
      return false;
    }
    // Filtro Paciente (nombre o cédula)
    if (citasFiltroPaciente.trim()) {
      const q = citasFiltroPaciente.trim().toLowerCase();
      const matchPac =
        (c.pacienteNombre || '').toLowerCase().includes(q) ||
        (c.pacienteCedula || '').toLowerCase().includes(q);
      if (!matchPac) return false;
    }
    // Filtro Fecha
    if (citasFiltroFecha === 'hoy') {
      if (c.fechaCita !== hoyStr) return false;
    } else if (citasFiltroFecha === 'semana') {
      const fechaC = new Date(c.fechaCita);
      const hoy = new Date();
      const diffDays = (fechaC.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
      if (diffDays < -1 || diffDays > 7) return false;
    } else if (citasFiltroFecha === 'especifica' && citasFechaEspecifica) {
      if (c.fechaCita !== citasFechaEspecifica) return false;
    }
    // Filtro Tratamiento
    if (citasFiltroTratamiento !== 'todos') {
      if (!c.motivo.toLowerCase().includes(citasFiltroTratamiento.toLowerCase())) {
        return false;
      }
    }
    // Filtro Estado
    if (citasFiltroEstado !== 'todos' && c.estado !== citasFiltroEstado) {
      return false;
    }
    return true;
  });

  const citasPendientesCount = citas.filter((c) => c.estado === 'pendiente').length;

  const handleAprobarCita = async (cita: Cita) => {
    const actualizada: Cita = { ...cita, estado: 'confirmada' };
    setCitas((prev) => prev.map((item) => (item.id === cita.id ? actualizada : item)));
    await ApiClient.actualizarEstadoCita(cita.id, 'confirmada', cita.sedeId, cita.boxNumero);
    showToast(`✅ Cita de ${cita.pacienteNombre} APROBADA y confirmada.`);
  };

  const handleCambiarEstadoCita = async (cita: Cita, nuevoEstado: Cita['estado']) => {
    const actualizada: Cita = { ...cita, estado: nuevoEstado };
    setCitas((prev) => prev.map((item) => (item.id === cita.id ? actualizada : item)));
    await ApiClient.actualizarEstadoCita(cita.id, nuevoEstado, cita.sedeId, cita.boxNumero);
    const nombresEstado: Record<string, string> = {
      pendiente: '🟡 PENDIENTE',
      confirmada: '🟢 CONFIRMADA',
      en_sillon: '🔵 EN SILLÓN',
      completada: '⚪ COMPLETADA',
      cancelada: '🔴 CANCELADA',
    };
    showToast(`🔄 Estado de cita (${cita.pacienteNombre}): ${nombresEstado[nuevoEstado] || nuevoEstado}`);
  };

  const handleAprobarTodasPendientes = async () => {
    const pendientes = citas.filter((c) => c.estado === 'pendiente');
    if (pendientes.length === 0) return;

    setCitas((prev) =>
      prev.map((c) => (c.estado === 'pendiente' ? { ...c, estado: 'confirmada' } : c))
    );

    const ids = pendientes.map((c) => c.id);
    await ApiClient.aprobarCitasLote(ids, 'victoria');
    showToast(`🎉 ¡${pendientes.length} citas pendientes aprobadas en bloque con éxito!`);
  };

  const handleEliminarCita = async (id: string, pacienteNombre: string) => {
    setCitas((prev) => prev.filter((c) => c.id !== id));
    await ApiClient.eliminarCita(id);
    showToast(`🗑️ Cita de ${pacienteNombre} eliminada del control.`);
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

  // Métricas calculadas para la cabecera ejecutiva y badges
  const condicionesCriticasCount = useMemo(() => {
    return condicionesMedicas.filter((c) => c.nivelRiesgo === 'Crítico' || c.nivelRiesgo === 'Alto').length;
  }, [condicionesMedicas]);

  // Manejadores de cambios para el Módulo 00 (Datos OdontoSalud La Victoria)
  const handleSedeFieldChange = (field: keyof SedeInfo, value: any) => {
    setSedeFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBoxFieldChange = (boxIndex: number, field: keyof BoxInfo, value: any) => {
    setSedeFormData((prev) => {
      const currentBoxes = prev.boxes ? [...prev.boxes] : [];
      if (!currentBoxes[boxIndex]) return prev;
      currentBoxes[boxIndex] = {
        ...currentBoxes[boxIndex],
        [field]: value,
      };
      return {
        ...prev,
        boxes: currentBoxes,
      };
    });
  };

  const handleGuardarConfigSede = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGuardandoSede(true);
    try {
      const totalBoxes = sedeEditandoId === 'victoria' ? 2 : 1;
      const res = await actualizarConfigSede(sedeEditandoId, {
        ...sedeFormData,
        totalBoxes,
      });
      if (res.success) {
        showToast(`¡Configuración de ${sedeFormData.nombre || sedeEditandoId} guardada exitosamente en Cloudflare D1!`);
        await recargarConfigSedes();
      } else {
        showToast(`Error al guardar: ${res.message || 'Intente nuevamente'}`);
      }
    } catch (err: any) {
      showToast('Error de conexión con Cloudflare D1');
    } finally {
      setGuardandoSede(false);
    }
  };

  // Configuración estandarizada de los 8 módulos de segmentación de datos
  const tabs: { key: DataTabKey; label: string; shortLabel: string; icon: string; count: number; badgeExtra?: string }[] = [
    {
      key: 'sedes',
      label: 'Módulo 00 • Datos OdontoSalud La Victoria',
      shortLabel: 'Datos OdontoSalud',
      icon: 'domain',
      count: 2,
      badgeExtra: 'Fuente Verdad',
    },
    {
      key: 'odontologos',
      label: 'Módulo 01 • Odontólogos',
      shortLabel: 'Odontólogos',
      icon: 'clinical_notes',
      count: odontologos.length,
    },
    {
      key: 'higienistas',
      label: 'Módulo 02 • Higienistas',
      shortLabel: 'Higienistas',
      icon: 'clean_hands',
      count: higienistas.length,
    },
    {
      key: 'pacientes',
      label: 'Módulo 03 • Padrón Pacientes',
      shortLabel: 'Pacientes',
      icon: 'groups',
      count: pacientes.length,
    },
    {
      key: 'citas',
      label: 'Módulo 04 • Agenda de Citas',
      shortLabel: 'Citas',
      icon: 'event_available',
      count: citas.length,
      badgeExtra: citasPendientesCount > 0 ? `${citasPendientesCount} pend.` : undefined,
    },
    {
      key: 'tratamientos',
      label: 'Módulo 05 • Tratamientos & Aranceles',
      shortLabel: 'Tratamientos',
      icon: 'table_chart',
      count: tratamientos.length,
    },
    {
      key: 'condiciones',
      label: 'Módulo 06 • Condiciones Médicas CIE',
      shortLabel: 'Condiciones CIE',
      icon: 'health_and_safety',
      count: condicionesMedicas.length,
    },
    {
      key: 'cierres',
      label: 'Módulo 07 • Cierres Diarios de Caja',
      shortLabel: 'Cierres de Caja',
      icon: 'point_of_sale',
      count: cierresDiarios.length,
    },
    {
      key: 'inventario',
      label: 'Módulo 08 • Inventario de Insumos & Materiales',
      shortLabel: 'Inventario',
      icon: 'inventory_2',
      count: inventario.length,
      badgeExtra: inventario.filter((i) => i.stockActual <= i.stockMinimo).length > 0 ? `${inventario.filter((i) => i.stockActual <= i.stockMinimo).length} alerta` : undefined,
    },
    {
      key: 'laboratorios',
      label: 'Módulo 09 • Laboratorios Dentales & Prótesis',
      shortLabel: 'Laboratorios',
      icon: 'precision_manufacturing',
      count: laboratorios.length,
      badgeExtra: laboratorios.filter((l) => l.estado === 'listo_en_clinica').length > 0 ? `${laboratorios.filter((l) => l.estado === 'listo_en_clinica').length} en clínica` : undefined,
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
          CABECERA HERO • CONTROL DE DATA & GOBERNANZA MAESTRA
         ===================================================================== */}
      <section className="bg-gradient-to-r from-dental-deep-navy via-primary to-dental-deep-navy rounded-3xl p-5 sm:p-6 text-white shadow-soft-elevated border border-primary/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md">
              <span className="material-symbols-outlined text-[28px] text-vibrant-cyan">database</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                  Administración & Maestros D1
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Cloudflare Edge Activo
                </span>
              </div>
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-white mt-1 tracking-tight">
                Control de Data Clínica
              </h1>
              <p className="text-xs text-white/80 mt-0.5">
                Gestión centralizada de expedientes, staff médico, aranceles y auditoría de cierres en Edge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-vibrant-cyan">layers</span>
              <span>8 Módulos Sincronizados</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          PANEL DE KPIS EJECUTIVOS • MÁXIMA LEGIBILIDAD Y ALTO CONTRASTE
         ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
        {/* KPI 0: Datos OdontoSalud La Victoria (Fuente de la Verdad) */}
        <button
          type="button"
          onClick={() => setActiveTab('sedes')}
          className={`p-3.5 rounded-2xl text-left transition-all duration-200 border cursor-pointer group relative overflow-hidden ${
            activeTab === 'sedes'
              ? 'bg-surface-clean-white border-primary ring-2 ring-primary/40 shadow-md -translate-y-0.5'
              : 'bg-surface-clean-white border-border-subtle hover:border-primary/50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
              Sedes & Boxes
            </span>
            <div className="w-7 h-7 rounded-lg bg-dental-deep-navy text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-vibrant-cyan">domain</span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-display font-black text-dental-deep-navy block tracking-tight">
            2 / 3
          </span>
          <span className="text-[11px] font-semibold text-primary block mt-1 truncate">
            Sedes / Sillones
          </span>
        </button>

        {/* KPI 1: Padrón de Pacientes */}
        <button
          type="button"
          onClick={() => setActiveTab('pacientes')}
          className={`p-3.5 rounded-2xl text-left transition-all duration-200 border cursor-pointer group relative overflow-hidden ${
            activeTab === 'pacientes'
              ? 'bg-surface-clean-white border-primary ring-2 ring-primary/40 shadow-md -translate-y-0.5'
              : 'bg-surface-clean-white border-border-subtle hover:border-primary/50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
              Pacientes
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">groups</span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-display font-black text-dental-deep-navy block tracking-tight">
            {pacientes.length}
          </span>
          <span className="text-[11px] font-semibold text-secondary block mt-1 truncate">
            Expedientes en padrón
          </span>
        </button>

        {/* KPI 2: Citas Programadas */}
        <button
          type="button"
          onClick={() => setActiveTab('citas')}
          className={`p-3.5 rounded-2xl text-left transition-all duration-200 border cursor-pointer group relative overflow-hidden ${
            activeTab === 'citas'
              ? 'bg-surface-clean-white border-sky-600 ring-2 ring-sky-500/40 shadow-md -translate-y-0.5'
              : 'bg-surface-clean-white border-border-subtle hover:border-sky-400 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
              Agenda Citas
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">event_available</span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-display font-black text-dental-deep-navy block tracking-tight">
            {citas.length}
          </span>
          <div className="flex items-center gap-1 mt-1">
            {citasPendientesCount > 0 ? (
              <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                {citasPendientesCount} por confirmar
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-600 truncate">
                Todas confirmadas
              </span>
            )}
          </div>
        </button>

        {/* KPI 3: Odontólogos */}
        <button
          type="button"
          onClick={() => setActiveTab('odontologos')}
          className={`p-3.5 rounded-2xl text-left transition-all duration-200 border cursor-pointer group relative overflow-hidden ${
            activeTab === 'odontologos'
              ? 'bg-surface-clean-white border-emerald-600 ring-2 ring-emerald-500/40 shadow-md -translate-y-0.5'
              : 'bg-surface-clean-white border-border-subtle hover:border-emerald-500/50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
              Odontólogos
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-display font-black text-dental-deep-navy block tracking-tight">
            {odontologos.length}
          </span>
          <span className="text-[11px] font-semibold text-secondary block mt-1 truncate">
            Especialistas en staff
          </span>
        </button>

        {/* KPI 4: Higienistas */}
        <button
          type="button"
          onClick={() => setActiveTab('higienistas')}
          className={`p-3.5 rounded-2xl text-left transition-all duration-200 border cursor-pointer group relative overflow-hidden ${
            activeTab === 'higienistas'
              ? 'bg-surface-clean-white border-indigo-600 ring-2 ring-indigo-500/40 shadow-md -translate-y-0.5'
              : 'bg-surface-clean-white border-border-subtle hover:border-indigo-400 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
              Higienistas
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">clean_hands</span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-display font-black text-dental-deep-navy block tracking-tight">
            {higienistas.length}
          </span>
          <span className="text-[11px] font-semibold text-secondary block mt-1 truncate">
            Soporte clínico activo
          </span>
        </button>

        {/* KPI 5: Catálogo Tratamientos */}
        <button
          type="button"
          onClick={() => setActiveTab('tratamientos')}
          className={`p-3.5 rounded-2xl text-left transition-all duration-200 border cursor-pointer group relative overflow-hidden ${
            activeTab === 'tratamientos'
              ? 'bg-surface-clean-white border-amber-600 ring-2 ring-amber-500/40 shadow-md -translate-y-0.5'
              : 'bg-surface-clean-white border-border-subtle hover:border-amber-400 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
              Tratamientos
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-display font-black text-dental-deep-navy block tracking-tight">
            {tratamientos.length}
          </span>
          <span className="text-[11px] font-semibold text-secondary block mt-1 truncate">
            Promedio: ${promedioArancelUsd.toFixed(0)} USD
          </span>
        </button>

        {/* KPI 6: Condiciones Médicas */}
        <button
          type="button"
          onClick={() => setActiveTab('condiciones')}
          className={`p-3.5 rounded-2xl text-left transition-all duration-200 border cursor-pointer group relative overflow-hidden ${
            activeTab === 'condiciones'
              ? 'bg-surface-clean-white border-rose-600 ring-2 ring-rose-500/40 shadow-md -translate-y-0.5'
              : 'bg-surface-clean-white border-border-subtle hover:border-rose-400 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
              Condiciones CIE
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-display font-black text-dental-deep-navy block tracking-tight">
            {condicionesMedicas.length}
          </span>
          <span className="text-[11px] font-semibold text-rose-700 block mt-1 truncate">
            {condicionesCriticasCount} alertas de riesgo
          </span>
        </button>

        {/* KPI 7: Cierres Diarios */}
        <button
          type="button"
          onClick={() => setActiveTab('cierres')}
          className={`p-3.5 rounded-2xl text-left transition-all duration-200 border cursor-pointer group relative overflow-hidden ${
            activeTab === 'cierres'
              ? 'bg-surface-clean-white border-emerald-600 ring-2 ring-emerald-500/40 shadow-md -translate-y-0.5'
              : 'bg-surface-clean-white border-border-subtle hover:border-emerald-400 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
              Cierres Caja
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-display font-black text-dental-deep-navy block tracking-tight">
            {cierresDiarios.length}
          </span>
          <span className="text-[11px] font-semibold text-secondary block mt-1 truncate">
            Arqueos D1 guardados
          </span>
        </button>
      </div>

      {/* =====================================================================
          TARJETA SELECTOR ANIMADO DE PESTAÑAS (COMPACTA Y DE ALTA VISIBILIDAD)
         ===================================================================== */}
      <section className="bg-surface-clean-white rounded-2xl p-2.5 sm:p-3 shadow-soft-elevated border border-border-subtle relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">view_quilt</span>
            <span className="text-xs font-black uppercase tracking-wider text-dental-deep-navy">
              Módulos de Segmentación de Datos
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-dental-deep-navy">
              10 Módulos de Gestión
            </span>
          </div>
          <span className="text-[11px] font-medium text-secondary hidden md:inline">
            Selecciona un módulo para visualizar y gestionar
          </span>
        </div>

        {/* Selector unificado de 10 pestañas en grid responsivo: 2 en móvil, 5 en tablet/desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer border text-left min-w-0 ${
                  isActive
                    ? 'bg-dental-deep-navy text-white shadow-md border-dental-deep-navy ring-2 ring-primary/40'
                    : 'bg-surface-subtle-ice text-dental-deep-navy hover:bg-surface-container border-border-subtle'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'bg-primary text-white' : 'bg-surface-container text-dental-deep-navy'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <span className="block text-[11px] font-extrabold truncate leading-tight">
                    {tab.shortLabel}
                  </span>
                  {tab.badgeExtra ? (
                    <span className="block text-[9px] font-extrabold text-amber-500 truncate">
                      {tab.badgeExtra}
                    </span>
                  ) : (
                    <span className={`block text-[9px] font-medium truncate ${isActive ? 'text-surface-container' : 'text-secondary'}`}>
                      {tab.count} reg.
                    </span>
                  )}
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-black shrink-0 transition-colors ${
                    isActive
                      ? 'bg-surface-container text-dental-deep-navy shadow-inner'
                      : 'bg-white text-secondary border border-border-subtle'
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
          MÓDULO 00: DATOS ODONTOSALUD LA VICTORIA (FUENTE DE LA VERDAD D1)
         --------------------------------------------------------------------- */}
      {activeTab === 'sedes' && (
        <section className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-6 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-vibrant-cyan to-dental-deep-navy" />

          {/* Header Módulo 00 • Datos OdontoSalud La Victoria */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[26px] text-vibrant-cyan">domain</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-dental-deep-navy text-white">
                    Módulo 00
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Fuente Única de la Verdad (Cloudflare D1)
                  </span>
                  <span className="text-xs text-secondary font-medium">
                    • Ingesta y Parámetros Operativos
                  </span>
                </div>
                <h2 className="font-display font-black text-lg sm:text-xl text-dental-deep-navy mt-1 tracking-tight">
                  Datos OdontoSalud La Victoria • Sedes, Horarios, Boxes & Redes
                </h2>
                <p className="text-xs text-secondary mt-0.5 font-medium">
                  Estos datos alimentan reactivamente la coordinación de citas, asignación de sillones, encabezados, presupuestos y geolocalización.
                </p>
              </div>
            </div>

            {/* Selector de Sede para Edición */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-subtle-ice border border-border-subtle self-start lg:self-auto shrink-0">
              <button
                type="button"
                onClick={() => seleccionarSedeParaEditar('victoria')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  sedeEditandoId === 'victoria'
                    ? 'bg-dental-deep-navy text-white shadow-xs'
                    : 'text-dental-deep-navy hover:bg-white/80'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                <span>La Victoria (2 Boxes)</span>
              </button>

              <button
                type="button"
                onClick={() => seleccionarSedeParaEditar('tovar')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                  sedeEditandoId === 'tovar'
                    ? 'bg-dental-deep-navy text-white shadow-xs'
                    : 'text-dental-deep-navy hover:bg-white/80'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-amber-500">terrain</span>
                <span>Colonia Tovar (1 Box)</span>
              </button>
            </div>
          </div>

          {/* Formulario Principal de Configuración */}
          <form onSubmit={handleGuardarConfigSede} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Bloque 1: Identidad & Ubicación Física */}
              <div className="bg-surface-subtle-ice rounded-2xl p-4 sm:p-5 border border-border-subtle flex flex-col gap-3.5">
                <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">pin_drop</span>
                  <h3 className="font-display font-extrabold text-sm text-dental-deep-navy">
                    1. Identidad & Ubicación Física
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-secondary mb-1">
                      Nombre Comercial de la Sede
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.nombre || ''}
                      onChange={(e) => handleSedeFieldChange('nombre', e.target.value)}
                      placeholder="Ej: OdontoSalud La Victoria"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.nombre))}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-secondary mb-1">
                      Subtítulo o Especialidad de la Sede
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.subtitulo || ''}
                      onChange={(e) => handleSedeFieldChange('subtitulo', e.target.value)}
                      placeholder="Ej: Sede Principal • Boxes 1 y 2 & Cirugía RVG"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.subtitulo))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-secondary mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.ciudad || (sedeEditandoId === 'victoria' ? 'La Victoria' : 'Colonia Tovar')}
                      onChange={(e) => handleSedeFieldChange('ciudad', e.target.value)}
                      placeholder="Ej: La Victoria"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.ciudad))}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-secondary mb-1">
                      Estado / Entidad Federal
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.estadoVzla || 'Estado Aragua'}
                      onChange={(e) => handleSedeFieldChange('estadoVzla', e.target.value)}
                      placeholder="Ej: Estado Aragua"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.estadoVzla))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">
                    Dirección Física Completa
                  </label>
                  <textarea
                    rows={2}
                    value={sedeFormData.direccion || ''}
                    onChange={(e) => handleSedeFieldChange('direccion', e.target.value)}
                    placeholder="Av. Francisco de Miranda, Centro Profesional La Victoria, Piso 2, Consultorio 2-A..."
                    className={getIlluminatedFieldClass(Boolean(sedeFormData.direccion))}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-secondary">
                      Enlace Google Maps (Para Ubicación de Pacientes)
                    </label>
                    {sedeFormData.googleMapsUrl && (
                      <a
                        href={sedeFormData.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                      >
                        <span>Abrir mapa</span>
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={sedeFormData.googleMapsUrl || ''}
                    onChange={(e) => handleSedeFieldChange('googleMapsUrl', e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className={getIlluminatedFieldClass(Boolean(sedeFormData.googleMapsUrl))}
                  />
                </div>
              </div>

              {/* Bloque 2: Horarios de Atención & Turnos */}
              <div className="bg-surface-subtle-ice rounded-2xl p-4 sm:p-5 border border-border-subtle flex flex-col gap-3.5">
                <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                  <h3 className="font-display font-extrabold text-sm text-dental-deep-navy">
                    2. Horarios de Atención & Turnos Clínicos
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-secondary mb-1">
                      Hora de Apertura General
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.horarioApertura || '08:00'}
                      onChange={(e) => handleSedeFieldChange('horarioApertura', e.target.value)}
                      placeholder="08:00 AM"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.horarioApertura))}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-secondary mb-1">
                      Hora de Cierre General
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.horarioCierre || '17:00'}
                      onChange={(e) => handleSedeFieldChange('horarioCierre', e.target.value)}
                      placeholder="05:00 PM"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.horarioCierre))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-secondary mb-1">
                      Franja Turno Mañana
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.turnoManana || '08:00 - 12:00'}
                      onChange={(e) => handleSedeFieldChange('turnoManana', e.target.value)}
                      placeholder="08:00 AM - 12:00 PM"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.turnoManana))}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-secondary mb-1">
                      Franja Turno Tarde
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.turnoTarde || '13:00 - 17:00'}
                      onChange={(e) => handleSedeFieldChange('turnoTarde', e.target.value)}
                      placeholder="01:00 PM - 05:00 PM"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.turnoTarde))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">
                    Días de Atención Clínica
                  </label>
                  <input
                    type="text"
                    value={sedeFormData.diasAtencion || 'Lunes a Sábado'}
                    onChange={(e) => handleSedeFieldChange('diasAtencion', e.target.value)}
                    placeholder="Lunes a Sábado (Previa Cita)"
                    className={getIlluminatedFieldClass(Boolean(sedeFormData.diasAtencion))}
                  />
                </div>

                <div className="p-3 rounded-xl bg-white border border-border-subtle flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0 mt-0.5">info</span>
                  <p className="text-[11px] text-secondary leading-snug">
                    Los turnos configurados aquí determinan automáticamente las franjas horarias y la disponibilidad en el módulo de coordinación de citas <strong className="text-dental-deep-navy">#coordinacion</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Bloque 3: Cantidad & Configuración de Sillones Clínicos (Boxes) */}
            <div className="bg-surface-subtle-ice rounded-2xl p-4 sm:p-5 border border-border-subtle flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">chair</span>
                  <h3 className="font-display font-extrabold text-sm text-dental-deep-navy">
                    3. Capacidad & Configuración de Sillones Clínicos (Boxes)
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-dental-deep-navy text-white text-[11px] font-black self-start sm:self-auto">
                  <span className="material-symbols-outlined text-[14px] text-vibrant-cyan">check_circle</span>
                  <span>
                    {sedeEditandoId === 'victoria' ? 'Capacidad Estricta: 2 Boxes' : 'Capacidad Estricta: 1 Box'}
                  </span>
                </div>
              </div>

              {/* Grid de Boxes según la capacidad estricta de la sede */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Box 01 (Disponible en ambas sedes) */}
                <div className="p-4 rounded-xl bg-white border-2 border-primary/20 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-dental-deep-navy text-white text-xs font-black">
                      Sillón Box 01
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Operativo 100%
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-secondary mb-1">
                      Nombre o Identificador del Box
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.boxes?.[0]?.nombre || 'Box 01 (Principal / Rx)'}
                      onChange={(e) => handleBoxFieldChange(0, 'nombre', e.target.value)}
                      placeholder="Ej: Box 01 (Principal / Rx)"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.boxes?.[0]?.nombre))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-secondary mb-1">
                      Especialidad / Equipamiento Principal
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.boxes?.[0]?.especialidad || 'Operatoria, Diagnóstico & Radiología RVG'}
                      onChange={(e) => handleBoxFieldChange(0, 'especialidad', e.target.value)}
                      placeholder="Ej: Operatoria, Diagnóstico & Radiología RVG"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.boxes?.[0]?.especialidad))}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-secondary mb-1">
                      Doctor Responsable Predeterminado
                    </label>
                    <input
                      type="text"
                      value={sedeFormData.boxes?.[0]?.doctorDefault || 'Dra. María Alejandra Domínguez'}
                      onChange={(e) => handleBoxFieldChange(0, 'doctorDefault', e.target.value)}
                      placeholder="Ej: Dra. María Alejandra Domínguez"
                      className={getIlluminatedFieldClass(Boolean(sedeFormData.boxes?.[0]?.doctorDefault))}
                    />
                  </div>
                </div>

                {/* Box 02 (Solo aplica para La Victoria) */}
                {sedeEditandoId === 'victoria' ? (
                  <div className="p-4 rounded-xl bg-white border-2 border-primary/20 shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-dental-deep-navy text-white text-xs font-black">
                        Sillón Box 02
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Operativo 100%
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-secondary mb-1">
                        Nombre o Identificador del Box
                      </label>
                      <input
                        type="text"
                        value={sedeFormData.boxes?.[1]?.nombre || 'Box 02 (Ortodoncia & Integral)'}
                        onChange={(e) => handleBoxFieldChange(1, 'nombre', e.target.value)}
                        placeholder="Ej: Box 02 (Ortodoncia & Integral)"
                        className={getIlluminatedFieldClass(Boolean(sedeFormData.boxes?.[1]?.nombre))}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-secondary mb-1">
                        Especialidad / Equipamiento Principal
                      </label>
                      <input
                        type="text"
                        value={sedeFormData.boxes?.[1]?.especialidad || 'Ortodoncia, Prótesis & Estética'}
                        onChange={(e) => handleBoxFieldChange(1, 'especialidad', e.target.value)}
                        placeholder="Ej: Ortodoncia, Prótesis & Estética"
                        className={getIlluminatedFieldClass(Boolean(sedeFormData.boxes?.[1]?.especialidad))}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-secondary mb-1">
                        Doctor Responsable Predeterminado
                      </label>
                      <input
                        type="text"
                        value={sedeFormData.boxes?.[1]?.doctorDefault || 'Dra. Carmen Elena Silva'}
                        onChange={(e) => handleBoxFieldChange(1, 'doctorDefault', e.target.value)}
                        placeholder="Ej: Dra. Carmen Elena Silva"
                        className={getIlluminatedFieldClass(Boolean(sedeFormData.boxes?.[1]?.doctorDefault))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-surface-clean-white border border-dashed border-border-subtle flex flex-col items-center justify-center text-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-[32px] text-secondary/40">meeting_room</span>
                    <p className="text-xs font-bold text-dental-deep-navy">Capacidad Limitada a 1 Box</p>
                    <p className="text-[11px] max-w-xs text-secondary/80">
                      La sede de Colonia Tovar opera actualmente con 1 Box de atención clínica integral de montaña.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bloque 4: Canales de Comunicación & Redes Sociales */}
            <div className="bg-surface-subtle-ice rounded-2xl p-4 sm:p-5 border border-border-subtle flex flex-col gap-3.5">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-2.5">
                <span className="material-symbols-outlined text-primary text-[20px]">contact_support</span>
                <h3 className="font-display font-extrabold text-sm text-dental-deep-navy">
                  4. Canales de Contacto & Redes Sociales Oficiales
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">
                    Teléfono Máster / Fijo
                  </label>
                  <input
                    type="text"
                    value={sedeFormData.telefono || ''}
                    onChange={(e) => handleSedeFieldChange('telefono', e.target.value)}
                    placeholder="+58 244-3221144"
                    className={getIlluminatedFieldClass(Boolean(sedeFormData.telefono))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">
                    WhatsApp Oficial de Citas
                  </label>
                  <input
                    type="text"
                    value={sedeFormData.whatsapp || ''}
                    onChange={(e) => handleSedeFieldChange('whatsapp', e.target.value)}
                    placeholder="+58 412-8365687"
                    className={getIlluminatedFieldClass(Boolean(sedeFormData.whatsapp))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">
                    Correo Electrónico de la Sede
                  </label>
                  <input
                    type="email"
                    value={sedeFormData.email || ''}
                    onChange={(e) => handleSedeFieldChange('email', e.target.value)}
                    placeholder="Clinica@OdontosaludLV.com"
                    className={getIlluminatedFieldClass(Boolean(sedeFormData.email))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={sedeFormData.instagramUrl || ''}
                    onChange={(e) => handleSedeFieldChange('instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/odontosaludlv"
                    className={getIlluminatedFieldClass(Boolean(sedeFormData.instagramUrl))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={sedeFormData.facebookUrl || ''}
                    onChange={(e) => handleSedeFieldChange('facebookUrl', e.target.value)}
                    placeholder="https://facebook.com/odontosaludlv"
                    className={getIlluminatedFieldClass(Boolean(sedeFormData.facebookUrl))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">
                    TikTok URL
                  </label>
                  <input
                    type="url"
                    value={sedeFormData.tiktokUrl || ''}
                    onChange={(e) => handleSedeFieldChange('tiktokUrl', e.target.value)}
                    placeholder="https://tiktok.com/@odontosaludlv"
                    className={getIlluminatedFieldClass(Boolean(sedeFormData.tiktokUrl))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">
                    Sitio Web Oficial
                  </label>
                  <input
                    type="url"
                    value={sedeFormData.webUrl || ''}
                    onChange={(e) => handleSedeFieldChange('webUrl', e.target.value)}
                    placeholder="https://odontosaludlv.com"
                    className={getIlluminatedFieldClass(Boolean(sedeFormData.webUrl))}
                  />
                </div>
              </div>
            </div>

            {/* Barra de Acciones y Guardado en D1 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border-subtle">
              <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">verified_user</span>
                <span>Al guardar, los datos se sincronizan con Cloudflare D1 y el almacenamiento local.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => seleccionarSedeParaEditar(sedeEditandoId)}
                  className="px-4 py-2.5 rounded-xl border border-border-subtle bg-white text-secondary hover:text-dental-deep-navy font-bold text-xs transition-all cursor-pointer flex-1 sm:flex-none"
                >
                  Restablecer
                </button>

                <button
                  type="submit"
                  disabled={guardandoSede}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50"
                >
                  {guardandoSede ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Guardando en Edge D1...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Guardar Datos de la Sede en Cloudflare D1</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* ---------------------------------------------------------------------
          SECCIÓN 01: INGESTA DE DATOS • ODONTÓLOGOS
         --------------------------------------------------------------------- */}
      {activeTab === 'odontologos' && (
        <section className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-primary" />

          {/* Header Módulo 01 • Odontólogos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy border border-border-subtle">
                    Módulo 01
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    Staff Facultativo
                  </span>
                  <span className="text-xs text-secondary font-medium">
                    • {odontologos.length} especialistas registrados
                  </span>
                </div>
                <h2 className="font-display font-black text-base sm:text-lg text-dental-deep-navy mt-1 tracking-tight">
                  Directorio Facultativo • Odontólogos & Especialistas
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {showOdoForm ? (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormOdontologo();
                    setShowOdoForm(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white text-xs font-bold border border-border-subtle active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                  <span>Ocultar formulario</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormOdontologo();
                    setShowOdoForm(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>Registrar Odontólogo</span>
                </button>
              )}
            </div>
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

          {/* Header Módulo 02 • Higienistas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[24px]">clean_hands</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy border border-border-subtle">
                    Módulo 02
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Asistencia Clínica
                  </span>
                  <span className="text-xs text-secondary font-medium">
                    • {higienistas.length} higienistas en plantilla
                  </span>
                </div>
                <h2 className="font-display font-black text-base sm:text-lg text-dental-deep-navy mt-1 tracking-tight">
                  Directorio Clínico • Higienistas Dentales
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {showHigForm ? (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormHigienista();
                    setShowHigForm(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white text-xs font-bold border border-border-subtle active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                  <span>Ocultar formulario</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormHigienista();
                    setShowHigForm(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-dental-deep-navy hover:bg-primary text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">group_add</span>
                  <span>Registrar Higienista</span>
                </button>
              )}
            </div>
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
          SECCIÓN 03: PADRÓN EXCLUSIVO DE PACIENTES (CRUD MAESTRO)
         --------------------------------------------------------------------- */}
      {activeTab === 'pacientes' && (
        <section className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-primary" />

          {/* Header Módulo 03 • Pacientes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[24px]">groups</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy border border-border-subtle">
                    Módulo 03
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    Maestro Clínico
                  </span>
                  <span className="text-xs text-secondary font-medium">
                    • {pacientes.length} expedientes en padrón
                  </span>
                </div>
                <h2 className="font-display font-black text-base sm:text-lg text-dental-deep-navy mt-1 tracking-tight">
                  Padrón General de Pacientes & Expedientes
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  limpiarFormPaciente();
                  setShowPacForm(!showPacForm);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showPacForm ? 'visibility_off' : 'person_add'}
                </span>
                <span>{showPacForm ? 'Ocultar Formulario' : 'Nuevo Paciente'}</span>
              </button>
            </div>
          </div>

          {/* Barra de Búsqueda Rápida de Pacientes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-subtle-ice p-3 rounded-2xl border border-border-subtle">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">
                search
              </span>
              <input
                type="text"
                value={pacSearchQuery}
                onChange={(e) => setPacSearchQuery(e.target.value)}
                placeholder="Buscar por cédula, nombre, teléfono o correo..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-border-subtle bg-white text-xs font-medium text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {pacSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPacSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-dental-deep-navy text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-secondary px-1">
              <span>Mostrando {pacientesFiltrados.length} de {pacientes.length}</span>
            </div>
          </div>

          {/* 1. Lista de Tarjetas de Pacientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {pacientesFiltrados.length === 0 ? (
              <div className="col-span-full py-10 text-center text-secondary text-xs">
                <span className="material-symbols-outlined text-4xl block mb-2 text-secondary/50">person_search</span>
                No se encontraron pacientes con el término "{pacSearchQuery}".
              </div>
            ) : (
              pacientesFiltrados.map((p) => {
                const edadStr = calcularEdad(p.fechaNacimiento);
                const condicionEncontrada = condicionesMedicas.find((c) => c.id === p.condicionMedicaId);
                const isSelected = editPacId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-surface-container border-primary ring-2 ring-primary/30 shadow-md'
                        : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container/70 hover:border-primary/40'
                    }`}
                  >
                    <div>
                      {/* Top Header con Avatar y Sexo */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-dental-deep-navy text-white font-display font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                            {p.nombres.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-xs text-dental-deep-navy truncate">
                              {p.nombres}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] font-extrabold text-primary">
                                {p.cedula}
                              </span>
                              <span className="text-[10px] text-secondary">•</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                p.sexo === 'Masculino'
                                  ? 'bg-sky-100 text-sky-800'
                                  : p.sexo === 'Femenino'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {p.sexo || 'Femenino'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badge de Sede */}
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white border border-border-subtle text-dental-deep-navy shrink-0">
                          {p.sedeId === 'tovar' ? 'Sede Tovar' : p.sedeId === 'ambas' ? 'Ambas Sedes' : 'La Victoria'}
                        </span>
                      </div>

                      {/* Datos Demográficos y de Contacto */}
                      <div className="space-y-1.5 text-[11px] text-secondary mt-2 bg-white/70 p-2.5 rounded-xl border border-border-subtle/50">
                        {p.fechaNacimiento && (
                          <div className="flex items-center justify-between">
                            <span className="text-secondary font-medium">Nacimiento & Edad:</span>
                            <span className="font-bold text-dental-deep-navy">
                              {p.fechaNacimiento} {edadStr ? `(${edadStr})` : ''}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-secondary font-medium">WhatsApp / Móvil:</span>
                          <a
                            href={`https://wa.me/${(p.telefono || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <span>{p.telefono}</span>
                            <span className="material-symbols-outlined text-[13px] text-status-success">chat</span>
                          </a>
                        </div>
                        {p.email && (
                          <div className="flex items-center justify-between">
                            <span className="text-secondary font-medium">Correo:</span>
                            <span className="font-semibold text-dental-deep-navy truncate max-w-[160px]">
                              {p.email}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Condición Médica / Alerta Anamnesis */}
                      {p.condicionMedicaId && p.condicionMedicaId !== 'ninguna' && (
                        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-status-danger/10 text-status-danger border border-status-danger/30 text-[10px] font-bold">
                          <span className="material-symbols-outlined text-[14px]">medical_services</span>
                          <span className="truncate">
                            Alerta Médica: {condicionEncontrada ? `${condicionEncontrada.nombre} (${condicionEncontrada.codigoCie})` : p.condicionMedicaId}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border-subtle/70">
                      <button
                        type="button"
                        onClick={() => handleEditarPaciente(p)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-border-subtle flex items-center gap-1 text-[11px] font-bold text-dental-deep-navy hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px] text-primary">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarPaciente(p.id, p.nombres)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-border-subtle flex items-center gap-1 text-[11px] font-bold text-status-danger hover:bg-status-danger/10 active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 2. Formulario Desplegable de Ingesta/Edición de Paciente */}
          {showPacForm && (
            <form
              onSubmit={handleGuardarPaciente}
              className="mt-3 pt-4 border-t-2 border-dashed border-border-subtle flex flex-col gap-3 bg-surface-subtle-ice p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-dental-deep-navy flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                  {editPacId ? 'Modificar Registro de Paciente' : 'Registrar Nuevo Paciente en Padrón'}
                </span>
                <span className="text-[10px] text-secondary font-semibold">
                  * Datos clínicos y de filiación canónicos
                </span>
              </div>

              {/* Fila 1: Nombres y Cédula */}
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
                    placeholder="Ej. Raymond Gilbonio"
                    className={`h-10 ${getIlluminatedFieldClass(pacNombres.trim().length > 0)}`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Cédula de Identidad *
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={pacCedulaTipo}
                      onChange={(e) => setPacCedulaTipo(e.target.value as any)}
                      className="w-20 h-10 rounded-xl border border-border-subtle bg-white text-xs font-black text-dental-deep-navy"
                    >
                      <option value="V">V-</option>
                      <option value="E">E-</option>
                      <option value="J">J-</option>
                      <option value="G">G-</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={pacCedulaNumero}
                      onChange={(e) => setPacCedulaNumero(e.target.value)}
                      placeholder="16762319"
                      className={`flex-1 h-10 ${getIlluminatedFieldClass(pacCedulaNumero.trim().length > 0)}`}
                    />
                  </div>
                </div>
              </div>

              {/* Fila 2: Sexo Biológico y Fecha de Nacimiento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Sexo Biológico *
                  </label>
                  <select
                    value={pacSexo}
                    onChange={(e) => setPacSexo(e.target.value as any)}
                    className={`h-10 ${getIlluminatedFieldClass(Boolean(pacSexo))}`}
                  >
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-dental-deep-navy">
                      Fecha de Nacimiento *
                    </label>
                    {pacFechaNacimiento && (
                      <span className="text-[10px] font-bold text-primary">
                        {calcularEdad(pacFechaNacimiento)}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    required
                    value={pacFechaNacimiento}
                    onChange={(e) => setPacFechaNacimiento(e.target.value)}
                    className={`h-10 ${getIlluminatedFieldClass(Boolean(pacFechaNacimiento))}`}
                  />
                </div>
              </div>

              {/* Fila 3: Teléfono y Correo */}
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
                    placeholder="04126841381"
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
                    placeholder="raymond.gilbonio@odontosaludlv.com"
                    className={`h-10 ${getIlluminatedFieldClass(pacEmail.trim().length > 0)}`}
                  />
                </div>
              </div>

              {/* Fila 4: Condición Médica y Sede Habitual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Condición Médica / Alerta Clínica (CIE)
                  </label>
                  <select
                    value={pacCondicionId}
                    onChange={(e) => setPacCondicionId(e.target.value)}
                    className={`h-10 ${getIlluminatedFieldClass(Boolean(pacCondicionId))}`}
                  >
                    <option value="ninguna">Ninguna Condición Conocida</option>
                    {condicionesMedicas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.codigoCie}) - Riesgo {c.nivelRiesgo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-dental-deep-navy block mb-1">
                    Sede Habitual de Atención
                  </label>
                  <select
                    value={pacSedeId}
                    onChange={(e) => setPacSedeId(e.target.value as any)}
                    className={`h-10 ${getIlluminatedFieldClass(Boolean(pacSedeId))}`}
                  >
                    <option value="victoria">Sede La Victoria (Boxes 01 y 02)</option>
                    <option value="tovar">Sede Colonia Tovar (Box 01)</option>
                    <option value="ambas">Ambas Sedes</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                  isPacFormComplete
                    ? 'bg-status-success hover:bg-dental-deep-navy shadow-[0_0_20px_rgba(27,109,59,0.4)] ring-2 ring-status-success/40'
                    : 'bg-primary hover:bg-dental-deep-navy shadow-md'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPacFormComplete ? 'verified' : 'person_add'}
                </span>
                <span>
                  {editPacId ? 'Confirmar Actualización de Paciente' : 'Guardar Paciente en Padrón'}
                </span>
              </button>
            </form>
          )}
        </section>
      )}

      {/* ---------------------------------------------------------------------
          SECCIÓN 04: CONTROL DE CITAS PROGRAMADAS (APROBACIONES & MULTI-FILTRO)
         --------------------------------------------------------------------- */}
      {activeTab === 'citas' && (
        <section className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-vibrant-cyan" />

          {/* Header Módulo 04 • Citas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[24px]">event_available</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy border border-border-subtle">
                    Módulo 04
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                    Control de Agenda
                  </span>
                  <span className="text-xs text-secondary font-medium">
                    • {citas.length} citas ({citasPendientesCount} por confirmar)
                  </span>
                </div>
                <h2 className="font-display font-black text-base sm:text-lg text-dental-deep-navy mt-1 tracking-tight">
                  Agenda Operativa & Control de Citas
                </h2>
              </div>
            </div>

            {/* Acción de Aprobación en Lote */}
            {citasPendientesCount > 0 && (
              <button
                type="button"
                onClick={handleAprobarTodasPendientes}
                className="px-3.5 py-1.5 rounded-xl bg-status-success hover:bg-dental-deep-navy text-white text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                <span>Aprobar {citasPendientesCount} Pendientes</span>
              </button>
            )}
          </div>

          {/* Multi-Filtro Avanzado (Doctor, Paciente, Fecha, Tratamiento, Estado) */}
          <div className="bg-surface-subtle-ice p-3.5 rounded-2xl border border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-dental-deep-navy flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">filter_list</span>
                Filtros Multicriterio de Citas
              </span>
              <button
                type="button"
                onClick={() => {
                  setCitasFiltroDoctor('todos');
                  setCitasFiltroPaciente('');
                  setCitasFiltroFecha('todas');
                  setCitasFechaEspecifica('');
                  setCitasFiltroTratamiento('todos');
                  setCitasFiltroEstado('todos');
                }}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                Restablecer Filtros
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Filtro 1: Doctor */}
              <div>
                <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">
                  Filtrar por Odontólogo
                </label>
                <select
                  value={citasFiltroDoctor}
                  onChange={(e) => setCitasFiltroDoctor(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border-subtle bg-white text-xs font-semibold text-dental-deep-navy px-2"
                >
                  <option value="todos">Todos los Odontólogos</option>
                  {odontologos.map((doc) => (
                    <option key={doc.id} value={doc.nombres}>
                      {doc.nombres}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro 2: Paciente */}
              <div>
                <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">
                  Paciente (Nombre o Cédula)
                </label>
                <input
                  type="text"
                  value={citasFiltroPaciente}
                  onChange={(e) => setCitasFiltroPaciente(e.target.value)}
                  placeholder="Ej. Raymond o 16.762..."
                  className="w-full h-9 rounded-xl border border-border-subtle bg-white text-xs font-medium text-dental-deep-navy px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Filtro 3: Fecha */}
              <div>
                <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">
                  Rango de Fecha
                </label>
                <select
                  value={citasFiltroFecha}
                  onChange={(e) => setCitasFiltroFecha(e.target.value as any)}
                  className="w-full h-9 rounded-xl border border-border-subtle bg-white text-xs font-semibold text-dental-deep-navy px-2"
                >
                  <option value="todas">Todas las Fechas</option>
                  <option value="hoy">Citas de Hoy</option>
                  <option value="semana">Esta Semana</option>
                  <option value="especifica">Fecha Específica...</option>
                </select>
              </div>

              {/* Filtro 4: Tratamiento */}
              <div>
                <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">
                  Tratamiento / Motivo
                </label>
                <select
                  value={citasFiltroTratamiento}
                  onChange={(e) => setCitasFiltroTratamiento(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border-subtle bg-white text-xs font-semibold text-dental-deep-navy px-2"
                >
                  <option value="todos">Todos los Tratamientos</option>
                  {tratamientos.map((t) => (
                    <option key={t.id} value={t.nombre}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro 5: Estado de Aprobación */}
              <div>
                <label className="text-[10px] font-bold text-dental-deep-navy block mb-1">
                  Estado de Cita
                </label>
                <select
                  value={citasFiltroEstado}
                  onChange={(e) => setCitasFiltroEstado(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border-subtle bg-white text-xs font-bold text-dental-deep-navy px-2"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="pendiente">🟡 Pendiente de Aprobación</option>
                  <option value="confirmada">🟢 Confirmada / Aprobada</option>
                  <option value="en_sillon">🔵 En Sillón</option>
                  <option value="completada">⚪ Completada</option>
                  <option value="cancelada">🔴 Cancelada</option>
                </select>
              </div>
            </div>

            {/* Input complementario si seleccionó Fecha Específica */}
            {citasFiltroFecha === 'especifica' && (
              <div className="flex items-center gap-2 pt-2 border-t border-border-subtle/50">
                <span className="text-xs font-bold text-dental-deep-navy">Seleccionar fecha:</span>
                <input
                  type="date"
                  value={citasFechaEspecifica}
                  onChange={(e) => setCitasFechaEspecifica(e.target.value)}
                  className="h-8 px-2.5 rounded-lg border border-border-subtle bg-white text-xs font-bold text-dental-deep-navy"
                />
              </div>
            )}
          </div>

          {/* Listado de Citas Programadas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-secondary px-1">
              <span>CITAS ENCONTRADAS ({citasFiltradas.length})</span>
              <span>Aprobación rápida & gestión de sillón</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto pr-1">
              {citasFiltradas.length === 0 ? (
                <div className="col-span-full py-12 text-center text-secondary text-xs">
                  <span className="material-symbols-outlined text-4xl block mb-2 text-secondary/40">event_busy</span>
                  No se encontraron citas con los filtros seleccionados.
                </div>
              ) : (
                citasFiltradas.map((c) => {
                  const isPendiente = c.estado === 'pendiente';
                  const isConfirmada = c.estado === 'confirmada';
                  const isEnSillon = c.estado === 'en_sillon';

                  const badgeClass =
                    c.estado === 'confirmada'
                      ? 'bg-status-success/15 text-status-success border-status-success/30'
                      : c.estado === 'en_sillon'
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : c.estado === 'completada'
                      ? 'bg-neutral-100 text-neutral-700 border-neutral-300'
                      : c.estado === 'cancelada'
                      ? 'bg-status-danger/15 text-status-danger border-status-danger/30'
                      : 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-300/50';

                  const labelEstado =
                    c.estado === 'confirmada'
                      ? '🟢 Aprobada / Confirmada'
                      : c.estado === 'en_sillon'
                      ? '🔵 En Sillón'
                      : c.estado === 'completada'
                      ? '⚪ Completada'
                      : c.estado === 'cancelada'
                      ? '🔴 Cancelada'
                      : '🟡 Pendiente de Aprobación';

                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isPendiente
                          ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                          : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container'
                      }`}
                    >
                      <div>
                        {/* Cabecera de la Cita */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${badgeClass}`}>
                            {labelEstado}
                          </span>
                          <div className="flex items-center gap-1">
                            {c.esUrgencia && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-status-danger text-white">
                                Urgencia
                              </span>
                            )}
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-border-subtle text-dental-deep-navy">
                              {c.sedeId === 'tovar' ? 'Tovar (Box 01)' : `Victoria (Box 0${c.boxNumero || 1})`}
                            </span>
                          </div>
                        </div>

                        {/* Paciente y Cédula */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-8 h-8 rounded-lg bg-dental-deep-navy text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {c.pacienteNombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-dental-deep-navy truncate">
                              {c.pacienteNombre}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-secondary">
                              <span className="font-mono font-bold text-primary">{c.pacienteCedula}</span>
                              {c.pacienteTelefono && (
                                <>
                                  <span>•</span>
                                  <span>{c.pacienteTelefono}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Ficha de la Cita (Fecha, Hora, Doctor, Motivo) */}
                        <div className="bg-white/80 p-2.5 rounded-xl border border-border-subtle/50 text-[11px] space-y-1 mt-2">
                          <div className="flex items-center justify-between font-bold text-dental-deep-navy">
                            <span>📅 {c.fechaCita}</span>
                            <span>⏰ {c.horaInicio}</span>
                          </div>
                          <div className="text-secondary font-medium truncate">
                            👨‍⚕️ <span className="font-semibold text-dental-deep-navy">{c.doctorNombre}</span>
                          </div>
                          <div className="text-primary font-bold truncate">
                            🦷 {c.motivo}
                          </div>
                        </div>
                      </div>

                      {/* Footer de Acciones y Aprobación */}
                      <div className="pt-2 border-t border-border-subtle/60 flex flex-col gap-2">
                        {isPendiente && (
                          <button
                            type="button"
                            onClick={() => handleAprobarCita(c)}
                            className="w-full py-2 px-3 rounded-xl bg-status-success hover:bg-dental-deep-navy text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Aprobar Cita</span>
                          </button>
                        )}

                        <div className="flex items-center justify-between gap-1.5">
                          <select
                            value={c.estado}
                            onChange={(e) => handleCambiarEstadoCita(c, e.target.value as any)}
                            className="flex-1 h-8 px-2 rounded-lg border border-border-subtle bg-white text-[11px] font-bold text-dental-deep-navy"
                          >
                            <option value="pendiente">🟡 Pendiente</option>
                            <option value="confirmada">🟢 Confirmada</option>
                            <option value="en_sillon">🔵 En Sillón</option>
                            <option value="completada">⚪ Completada</option>
                            <option value="cancelada">🔴 Cancelada</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleEliminarCita(c.id, c.pacienteNombre)}
                            title="Eliminar cita"
                            className="h-8 px-2.5 rounded-lg bg-white border border-border-subtle text-status-danger hover:bg-status-danger/10 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------------
          SECCIÓN 04: CATÁLOGO DE TRATAMIENTOS, DATOS CLÍNICOS Y COSTOS
         --------------------------------------------------------------------- */}
      {activeTab === 'tratamientos' && (
        <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-dental-deep-navy" />

          {/* Header Módulo 05 • Tratamientos */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[24px]">table_chart</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy border border-border-subtle">
                    Módulo 05
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    Catálogo de Procedimientos
                  </span>
                  <span className="text-xs text-secondary font-medium">
                    • {tratamientos.length} tratamientos • Arancel prom: ${promedioArancelUsd.toFixed(0)} USD
                  </span>
                </div>
                <h2 className="font-display font-black text-base sm:text-lg text-dental-deep-navy mt-1 tracking-tight">
                  Catálogo Maestro de Tratamientos & Aranceles
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {showTratForm ? (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormTratamiento();
                    setShowTratForm(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white text-xs font-bold border border-border-subtle active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                  <span>Ocultar formulario</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormTratamiento();
                    setShowTratForm(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-dental-deep-navy text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Nuevo Tratamiento</span>
                </button>
              )}
            </div>
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

          {/* Header Módulo 06 • Condiciones Médicas CIE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[24px]">health_and_safety</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy border border-border-subtle">
                    Módulo 06
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                    Bioseguridad & Anamnesis
                  </span>
                  <span className="text-xs text-secondary font-medium">
                    • {condicionesMedicas.length} condiciones registradas ({condicionesCriticasCount} alertas de riesgo)
                  </span>
                </div>
                <h2 className="font-display font-black text-base sm:text-lg text-dental-deep-navy mt-1 tracking-tight">
                  Catálogo de Condiciones Médicas Especiales (CIE)
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {showMedForm ? (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormCondicionMedica();
                    setShowMedForm(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white text-xs font-bold border border-border-subtle active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                  <span>Ocultar formulario</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormCondicionMedica();
                    setShowMedForm(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-dental-deep-navy text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add_moderator</span>
                  <span>Nueva Condición</span>
                </button>
              )}
            </div>
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

      {/* =====================================================================
          TARJETA 07: CIERRES DIARIOS DE CAJA (HISTÓRICO D1)
         ===================================================================== */}
      {activeTab === 'cierres' && (
        <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-status-success to-dental-deep-navy" />

          {/* Header Módulo 07 • Cierres Diarios */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy border border-border-subtle">
                    Módulo 07
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Auditoría Financiera D1
                  </span>
                  <span className="text-xs text-secondary font-medium">
                    • {cierresDiarios.length} arqueos históricos en Cloudflare D1
                  </span>
                </div>
                <h2 className="font-display font-black text-base sm:text-lg text-dental-deep-navy mt-1 tracking-tight">
                  Arqueo y Cierres Diarios de Caja
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={cargarCierresDiarios}
                className="px-3.5 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-border-subtle text-dental-deep-navy text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className={`material-symbols-outlined text-[15px] ${isLoadingCierres ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span>Actualizar Cierres</span>
              </button>
            </div>
          </div>

          {/* Tabla de Cierres Diarios */}
          {isLoadingCierres ? (
            <div className="p-12 text-center text-secondary text-xs flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              <span>Consultando histórico de cierres en Cloudflare D1...</span>
            </div>
          ) : cierresDiarios.length === 0 ? (
            <div className="p-8 text-center text-secondary text-xs bg-surface-subtle-ice rounded-2xl border border-border-subtle">
              No hay cierres de caja registrados todavía. Realiza un cierre desde el módulo de Cobros.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle text-[11px] text-secondary font-bold">
                    <th className="py-2.5 px-3">Fecha & Código</th>
                    <th className="py-2.5 px-3">Sede</th>
                    <th className="py-2.5 px-3 text-right">Total Cobrado (USD / Bs)</th>
                    <th className="py-2.5 px-3">Desglose por Sedes</th>
                    <th className="py-2.5 px-3">Desglose por Instrumento</th>
                    <th className="py-2.5 px-3 text-center">Pagos</th>
                    <th className="py-2.5 px-3">Responsable</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-medium">
                  {cierresDiarios.map((cierre) => {
                    return (
                      <tr key={cierre.id} className="hover:bg-surface-subtle-ice/60 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono text-[10px] bg-surface-container text-dental-deep-navy font-bold px-1.5 py-0.5 rounded block w-fit">
                            {cierre.id}
                          </span>
                          <span className="text-[11px] font-bold text-dental-deep-navy block mt-0.5">
                            📅 {cierre.fecha}
                          </span>
                          <span className="text-[10px] text-secondary font-mono">
                            Tasa: {cierre.tasaBcv.toFixed(2)} Bs/$
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            cierre.sedeId === 'ambas'
                              ? 'bg-primary text-white'
                              : cierre.sedeId === 'victoria'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {cierre.sedeId === 'ambas' ? 'Ambas Sedes' : cierre.sedeId === 'victoria' ? 'La Victoria' : 'Colonia Tovar'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-extrabold text-sm text-status-success block">
                            ${cierre.totalUsd.toFixed(2)} USD
                          </span>
                          <span className="text-[10px] text-secondary block">
                            ≈ {cierre.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          <div className="flex flex-col gap-0.5 text-secondary">
                            <span>📍 Victoria: <strong>${(cierre.totalVictoriaUsd || 0).toFixed(2)} USD</strong></span>
                            <span>📍 Tovar: <strong>${(cierre.totalTovarUsd || 0).toFixed(2)} USD</strong></span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          <div className="flex flex-col gap-0.5 text-secondary">
                            <span>💵 Efectivo USD: <strong>${(cierre.totalEfectivoUsd || 0).toFixed(2)}</strong></span>
                            <span>🇻🇪 Efectivo Bs: <strong>{(cierre.totalEfectivoBs || 0).toLocaleString('es-VE')} Bs.</strong></span>
                            <span>📱 Pago Móvil: <strong>{(cierre.totalPagoMovilBs || 0).toLocaleString('es-VE')} Bs.</strong></span>
                            <span>💳 Punto Venta: <strong>{(cierre.totalPuntoVentaBs || 0).toLocaleString('es-VE')} Bs.</strong></span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-xs bg-surface-subtle-ice px-2 py-0.5 rounded-md text-dental-deep-navy">
                            {cierre.cantidadPagos}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-dental-deep-navy block text-[11px]">
                            {cierre.cerradoPor || 'Caja Central'}
                          </span>
                          {cierre.observaciones && (
                            <span className="text-[10px] text-secondary line-clamp-1 italic">
                              {cierre.observaciones}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1 border border-emerald-200">
                            <span className="material-symbols-outlined text-[11px]">lock</span>
                            <span>Cerrado D1</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                        <div className="flex items-center justify-between text-[11px] text-secondary flex-wrap gap-1">
                          <span>👤 {t.pacienteNombre}</span>
                          <div className="flex items-center gap-1.5">
                            {t.estadoPagoHonorario === 'liquidado' ? (
                              <>
                                <span className="px-1.5 py-0.2 rounded-full font-bold text-[9px] bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[11px]">verified</span>
                                  <span>Ref: {t.referenciaLiquidacion || 'LIQ'}</span>
                                </span>
                                {t.comprobanteLiquidacion ? (
                                  <button
                                    type="button"
                                    onClick={() => setFotoComprobanteModal(t.comprobanteLiquidacion!)}
                                    className="px-1.5 py-0.2 rounded-md bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold text-[9px] flex items-center gap-0.5 border border-primary/20 transition-all cursor-pointer"
                                    title="Ver foto del comprobante de liquidación"
                                  >
                                    <span className="material-symbols-outlined text-[11px]">receipt_long</span>
                                    <span>Comprobante</span>
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-secondary italic">Sin foto</span>
                                )}
                              </>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded-full font-bold text-[9px] bg-amber-100 text-amber-800">
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                        {t.fechaLiquidacion && (
                          <span className="text-[10px] text-secondary font-mono">
                            Liquidado el: {t.fechaLiquidacion}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setDoctorModalHonorarios(null)}
              className="w-full py-2.5 rounded-xl bg-surface-subtle-ice hover:bg-border-subtle text-secondary font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}


      {/* ---------------------------------------------------------------------
          MÓDULO 08: INVENTARIO DE INSUMOS & MATERIALES ODONTOLÓGICOS (D1)
         --------------------------------------------------------------------- */}
      {activeTab === 'inventario' && (
        <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-500 via-primary to-emerald-500" />

          {/* Cabecera del Módulo 08 */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[22px]">inventory_2</span>
              </div>
              <div>
                <h3 className="font-display font-black text-base text-dental-deep-navy leading-tight">
                  Inventario de Materiales & Insumos Odontológicos
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Control de existencias, precios de compra en divisas, fechas de ingreso y salidas a sillón
                </p>
              </div>
            </div>

            {/* Acciones y Métricas Resumidas */}
            <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
              <div className="px-3 py-1.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs flex items-center gap-2">
                <span className="text-secondary font-semibold">Valor Total Stock:</span>
                <strong className="text-dental-deep-navy font-black">
                  ${inventario.reduce((acc, i) => acc + (i.precioCompraUsd * i.stockActual), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </strong>
                <span className="text-[10px] text-teal-700 font-mono">
                  (~ {(inventario.reduce((acc, i) => acc + (i.precioCompraUsd * i.stockActual), 0) * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInsumoEditando(null);
                  setFormInsumo({
                    codigo: `MAT-OD-${Math.floor(100 + Math.random() * 900)}`,
                    nombre: '',
                    categoria: 'Restauración / Operatoria',
                    stockActual: 10,
                    stockMinimo: 3,
                    unidadMedida: 'Tubo / Jeringa',
                    precioCompraUsd: 25,
                    fechaIngreso: new Date().toISOString().slice(0, 10),
                    fechaSalida: '',
                    lote: '',
                    sedeId: 'victoria',
                    estado: 'disponible',
                    observaciones: '',
                  });
                  setShowModalInsumo(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>+ Registrar Insumo</span>
              </button>
            </div>
          </div>

          {/* Filtros de Búsqueda, Categoría y Sede */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-surface-subtle-ice/60 p-2.5 rounded-2xl border border-border-subtle">
            {/* Buscador */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[17px]">search</span>
              <input
                type="text"
                placeholder="Buscar por nombre, código o lote..."
                value={busquedaInventario}
                onChange={(e) => setBusquedaInventario(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
              />
            </div>

            {/* Filtro por Categoría */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-border-subtle shadow-2xs">
              <span className="text-[11px] font-bold text-secondary">Categoría:</span>
              <select
                value={filtroCategoriaInventario}
                onChange={(e) => setFiltroCategoriaInventario(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-dental-deep-navy focus:outline-none cursor-pointer"
              >
                <option value="todas">Todas las Categorías</option>
                <option value="Restauración / Operatoria">Restauración / Operatoria</option>
                <option value="Endodoncia">Endodoncia</option>
                <option value="Bioseguridad & Desinfección">Bioseguridad & Desinfección</option>
                <option value="Cirugía & Periodoncia">Cirugía & Periodoncia</option>
                <option value="Ortodoncia">Ortodoncia</option>
                <option value="Prótesis & Impresión">Prótesis & Impresión</option>
                <option value="Anestesia & Farmacia">Anestesia & Farmacia</option>
              </select>
            </div>

            {/* Filtro por Sede */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-border-subtle shadow-2xs">
              <span className="text-[11px] font-bold text-secondary">Sede:</span>
              <select
                value={filtroSedeInventario}
                onChange={(e) => setFiltroSedeInventario(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-dental-deep-navy focus:outline-none cursor-pointer"
              >
                <option value="todas">Todas las Sedes</option>
                <option value="victoria">Sede La Victoria</option>
                <option value="tovar">Sede Colonia Tovar</option>
              </select>
            </div>
          </div>

          {/* Tabla de Insumos y Materiales */}
          <div className="w-full overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-surface-subtle-ice border-b border-border-subtle text-[10px] font-black uppercase text-secondary tracking-wider">
                  <th className="p-2.5">Código / Insumo</th>
                  <th className="p-2.5">Categoría</th>
                  <th className="p-2.5 text-center">Stock Actual</th>
                  <th className="p-2.5 text-center">Mínimo</th>
                  <th className="p-2.5 text-right">Precio Compra ($ USD / Bs.)</th>
                  <th className="p-2.5">Fecha Ingreso</th>
                  <th className="p-2.5">Fecha Salida</th>
                  <th className="p-2.5">Lote / Sede</th>
                  <th className="p-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/70">
                {inventario
                  .filter((item) => {
                    const matchBusqueda =
                      !busquedaInventario ||
                      item.nombre.toLowerCase().includes(busquedaInventario.toLowerCase()) ||
                      item.codigo.toLowerCase().includes(busquedaInventario.toLowerCase()) ||
                      item.lote.toLowerCase().includes(busquedaInventario.toLowerCase());
                    const matchCat =
                      filtroCategoriaInventario === 'todas' || item.categoria === filtroCategoriaInventario;
                    const matchSede =
                      filtroSedeInventario === 'todas' || item.sedeId === filtroSedeInventario || item.sedeId === 'ambas';
                    return matchBusqueda && matchCat && matchSede;
                  })
                  .map((item) => {
                    const isBajoStock = item.stockActual <= item.stockMinimo;
                    const isAgotado = item.stockActual === 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-2.5 font-bold text-dental-deep-navy">
                          <div className="flex flex-col">
                            <span className="font-mono text-[10px] text-primary">{item.codigo}</span>
                            <span className="font-display font-black text-xs text-dental-deep-navy">{item.nombre}</span>
                            {item.observaciones && (
                              <span className="text-[10px] text-secondary line-clamp-1">{item.observaciones}</span>
                            )}
                          </div>
                        </td>

                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-subtle-ice border border-border-subtle text-secondary whitespace-nowrap">
                            {item.categoria}
                          </span>
                        </td>

                        <td className="p-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs ${
                              isAgotado
                                ? 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse'
                                : isBajoStock
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            <span>{item.stockActual}</span>
                            <span className="text-[9px] font-semibold opacity-80">{item.unidadMedida}</span>
                          </span>
                        </td>

                        <td className="p-2.5 text-center font-mono font-bold text-secondary text-[11px]">
                          {item.stockMinimo}
                        </td>

                        <td className="p-2.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-teal-700">${item.precioCompraUsd.toFixed(2)} USD</span>
                            <span className="text-[10px] font-mono text-secondary">
                              {(item.precioCompraUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                            </span>
                          </div>
                        </td>

                        <td className="p-2.5 font-mono text-[11px] text-dental-deep-navy whitespace-nowrap">
                          {item.fechaIngreso || '—'}
                        </td>

                        <td className="p-2.5 font-mono text-[11px] text-secondary whitespace-nowrap">
                          {item.fechaSalida ? (
                            <span className="text-amber-700 font-bold">{item.fechaSalida}</span>
                          ) : (
                            <span className="text-slate-400 italic">Sin salida</span>
                          )}
                        </td>

                        <td className="p-2.5 text-[11px]">
                          <div className="flex flex-col">
                            <span className="font-mono text-secondary">Lote: {item.lote || 'N/A'}</span>
                            <span className="font-semibold text-dental-deep-navy capitalize">
                              {item.sedeId === 'victoria' ? 'La Victoria' : item.sedeId === 'tovar' ? 'Colonia Tovar' : 'Ambas Sedes'}
                            </span>
                          </div>
                        </td>

                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Botón Salida Rápida a Sillón (-1) */}
                            <button
                              type="button"
                              onClick={() => {
                                if (item.stockActual > 0) {
                                  const todayIso = new Date().toISOString().slice(0, 10);
                                  setInventario((prev) =>
                                    prev.map((i) =>
                                      i.id === item.id
                                        ? {
                                            ...i,
                                            stockActual: i.stockActual - 1,
                                            fechaSalida: todayIso,
                                            estado: i.stockActual - 1 <= i.stockMinimo ? 'bajo_stock' : 'disponible',
                                          }
                                        : i
                                    )
                                  );
                                }
                              }}
                              disabled={item.stockActual <= 0}
                              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                              title="Registrar salida de 1 unidad al sillón clínico (actualiza fecha de salida a hoy)"
                            >
                              -1 Salida
                            </button>

                            {/* Botón Entrada Rápida (+1) */}
                            <button
                              type="button"
                              onClick={() => {
                                const todayIso = new Date().toISOString().slice(0, 10);
                                setInventario((prev) =>
                                  prev.map((i) =>
                                    i.id === item.id
                                      ? {
                                          ...i,
                                          stockActual: i.stockActual + 1,
                                          fechaIngreso: todayIso,
                                          estado: i.stockActual + 1 > i.stockMinimo ? 'disponible' : 'bajo_stock',
                                        }
                                      : i
                                  )
                                );
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-black transition-all active:scale-95 cursor-pointer"
                              title="Registrar entrada de 1 unidad al almacén (actualiza fecha de ingreso a hoy)"
                            >
                              +1 Entrada
                            </button>

                            {/* Botón Editar Insumo */}
                            <button
                              type="button"
                              onClick={() => {
                                setInsumoEditando(item);
                                setFormInsumo({ ...item });
                                setShowModalInsumo(true);
                              }}
                              className="p-1 rounded-lg bg-surface-subtle-ice hover:bg-border-subtle text-secondary hover:text-dental-deep-navy cursor-pointer"
                              title="Editar ficha completa del insumo"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------------
          MÓDULO 09: LABORATORIOS DENTALES & PRÓTESIS EXTERNAS (10ª PESTAÑA)
         --------------------------------------------------------------------- */}
      {activeTab === 'laboratorios' && (
        <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-600 to-dental-deep-navy" />

          {/* Cabecera del Módulo 09 */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[22px]">precision_manufacturing</span>
              </div>
              <div>
                <h3 className="font-display font-black text-base text-dental-deep-navy leading-tight">
                  Laboratorios Dentales & Trabajos Protésicos Externos
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Control de órdenes protésicas, fechas de envío, pruebas en boca, costos de laboratorio y entrega al paciente
                </p>
              </div>
            </div>

            {/* Acciones y Métricas Resumidas */}
            <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
              <div className="px-3 py-1.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs flex items-center gap-2">
                <span className="text-secondary font-semibold">Costo en Proceso:</span>
                <strong className="text-dental-deep-navy font-black">
                  ${laboratorios.filter((l) => l.estado !== 'instalado_al_paciente').reduce((acc, l) => acc + l.costoLaboratorioUsd, 0).toFixed(2)} USD
                </strong>
                <span className="text-[10px] text-purple-800 font-mono">
                  (~ {(laboratorios.filter((l) => l.estado !== 'instalado_al_paciente').reduce((acc, l) => acc + l.costoLaboratorioUsd, 0) * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLabEditando(null);
                  setFormLab({
                    ordenCodigo: `LAB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                    laboratorioNombre: '',
                    tecnicoResponsable: '',
                    telefonoContacto: '+58 ',
                    pacienteNombre: '',
                    pacienteCedula: 'V-',
                    doctorTratante: 'Dra. María Alejandra Domínguez',
                    tipoTrabajo: 'Corona Zirconio Monolítico',
                    piezaDiente: '',
                    colorGuiaVita: 'A2 (Vita Classical)',
                    costoLaboratorioUsd: 50,
                    fechaEnvio: new Date().toISOString().slice(0, 10),
                    fechaPrometidaEntrega: '',
                    fechaPruebaBoca: '',
                    estado: 'en_laboratorio',
                    sedeId: 'victoria',
                    observaciones: '',
                  });
                  setShowModalLab(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>+ Nueva Orden de Lab</span>
              </button>
            </div>
          </div>

          {/* Filtros de Búsqueda y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-surface-subtle-ice/60 p-2.5 rounded-2xl border border-border-subtle">
            {/* Buscador */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[17px]">search</span>
              <input
                type="text"
                placeholder="Buscar por paciente, laboratorio, orden o técnico..."
                value={busquedaLab}
                onChange={(e) => setBusquedaLab(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
              />
            </div>

            {/* Filtro por Estado */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-border-subtle shadow-2xs">
              <span className="text-[11px] font-bold text-secondary">Estado de Orden:</span>
              <select
                value={filtroEstadoLab}
                onChange={(e) => setFiltroEstadoLab(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-dental-deep-navy focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="en_laboratorio">En Confección (Laboratorio)</option>
                <option value="en_prueba_bizcocho">En Prueba en Boca / Bizcocho</option>
                <option value="listo_en_clinica">Listo en Clínica (Por Instalar)</option>
                <option value="instalado_al_paciente">Instalado al Paciente</option>
              </select>
            </div>
          </div>

          {/* Tabla de Órdenes de Laboratorio */}
          <div className="w-full overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-surface-subtle-ice border-b border-border-subtle text-[10px] font-black uppercase text-secondary tracking-wider">
                  <th className="p-2.5">Orden # / Paciente</th>
                  <th className="p-2.5">Laboratorio & Técnico</th>
                  <th className="p-2.5">Trabajo Protésico & Color</th>
                  <th className="p-2.5">Doctor Tratante</th>
                  <th className="p-2.5 text-right">Costo Lab ($ / Bs.)</th>
                  <th className="p-2.5">Envío / Entrega Prometida</th>
                  <th className="p-2.5">Prueba en Boca</th>
                  <th className="p-2.5 text-center">Estado</th>
                  <th className="p-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/70">
                {laboratorios
                  .filter((item) => {
                    const matchBusqueda =
                      !busquedaLab ||
                      item.pacienteNombre.toLowerCase().includes(busquedaLab.toLowerCase()) ||
                      item.pacienteCedula.toLowerCase().includes(busquedaLab.toLowerCase()) ||
                      item.ordenCodigo.toLowerCase().includes(busquedaLab.toLowerCase()) ||
                      item.laboratorioNombre.toLowerCase().includes(busquedaLab.toLowerCase()) ||
                      item.tecnicoResponsable.toLowerCase().includes(busquedaLab.toLowerCase());
                    const matchEstado = filtroEstadoLab === 'todos' || item.estado === filtroEstadoLab;
                    return matchBusqueda && matchEstado;
                  })
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-2.5 font-bold text-dental-deep-navy">
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] text-purple-700 font-extrabold">{item.ordenCodigo}</span>
                          <span className="font-display font-black text-xs text-dental-deep-navy">{item.pacienteNombre}</span>
                          <span className="font-mono text-[10px] text-secondary">{item.pacienteCedula}</span>
                        </div>
                      </td>

                      <td className="p-2.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-dental-deep-navy">{item.laboratorioNombre}</span>
                          <span className="text-[10px] text-secondary">Téc. {item.tecnicoResponsable}</span>
                          <span className="text-[10px] text-primary font-mono">{item.telefonoContacto}</span>
                        </div>
                      </td>

                      <td className="p-2.5">
                        <div className="flex flex-col">
                          <span className="font-black text-dental-deep-navy text-xs">
                            {item.tipoTrabajo} {item.piezaDiente ? `(#${item.piezaDiente})` : ''}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-700">Guía: {item.colorGuiaVita}</span>
                          {item.observaciones && (
                            <span className="text-[9px] text-secondary line-clamp-1">{item.observaciones}</span>
                          )}
                        </div>
                      </td>

                      <td className="p-2.5 font-medium text-secondary text-[11px]">
                        {item.doctorTratante}
                      </td>

                      <td className="p-2.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-purple-800">${item.costoLaboratorioUsd.toFixed(2)} USD</span>
                          <span className="text-[10px] font-mono text-secondary">
                            {(item.costoLaboratorioUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                          </span>
                        </div>
                      </td>

                      <td className="p-2.5 text-[11px] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-secondary font-mono">Env: {item.fechaEnvio}</span>
                          <span className="font-bold text-dental-deep-navy font-mono">Entr: {item.fechaPrometidaEntrega || '—'}</span>
                        </div>
                      </td>

                      <td className="p-2.5 text-[11px] font-mono whitespace-nowrap">
                        {item.fechaPruebaBoca ? (
                          <span className="text-teal-700 font-bold">{item.fechaPruebaBoca}</span>
                        ) : (
                          <span className="text-slate-400 italic">Pendiente</span>
                        )}
                      </td>

                      <td className="p-2.5 text-center">
                        <select
                          value={item.estado}
                          onChange={(e) => {
                            const nuevoEstado = e.target.value as any;
                            setLaboratorios((prev) =>
                              prev.map((l) => (l.id === item.id ? { ...l, estado: nuevoEstado } : l))
                            );
                          }}
                          className={`px-2 py-1 rounded-xl text-[10px] font-black border cursor-pointer outline-none shadow-2xs ${
                            item.estado === 'listo_en_clinica'
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                              : item.estado === 'en_prueba_bizcocho'
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : item.estado === 'instalado_al_paciente'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-purple-100 text-purple-950 border-purple-300'
                          }`}
                        >
                          <option value="en_laboratorio">En Confección</option>
                          <option value="en_prueba_bizcocho">Prueba Bizcocho</option>
                          <option value="listo_en_clinica">Listo en Clínica</option>
                          <option value="instalado_al_paciente">Instalado</option>
                        </select>
                      </td>

                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setLabEditando(item);
                            setFormLab({ ...item });
                            setShowModalLab(true);
                          }}
                          className="p-1.5 rounded-lg bg-surface-subtle-ice hover:bg-border-subtle text-secondary hover:text-dental-deep-navy cursor-pointer"
                          title="Editar orden de laboratorio"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =====================================================================
          MODAL: REGISTRAR / EDITAR INSUMO DE INVENTARIO (MÓDULO 08)
         ===================================================================== */}
      {showModalInsumo && (
        <div
          className="fixed inset-0 z-50 bg-dental-deep-navy/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowModalInsumo(false)}
        >
          <div
            className="bg-surface-clean-white w-full max-w-lg rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl border border-border-subtle max-h-[90vh] overflow-y-auto animate-in zoom-in-95 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-base text-dental-deep-navy">
                    {insumoEditando ? 'Editar Insumo Odontológico' : 'Registrar Nuevo Insumo'}
                  </h4>
                  <p className="text-xs text-secondary">
                    Gestión de existencias, precios de compra y trazabilidad de ingresos/salidas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModalInsumo(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!formInsumo.nombre || !formInsumo.codigo) return;

                const stock = Number(formInsumo.stockActual) || 0;
                const min = Number(formInsumo.stockMinimo) || 1;
                const estadoCalculado: 'disponible' | 'bajo_stock' | 'agotado' =
                  stock === 0 ? 'agotado' : stock <= min ? 'bajo_stock' : 'disponible';

                if (insumoEditando) {
                  setInventario((prev) =>
                    prev.map((i) =>
                      i.id === insumoEditando.id
                        ? ({
                            ...i,
                            ...formInsumo,
                            stockActual: stock,
                            stockMinimo: min,
                            precioCompraUsd: Number(formInsumo.precioCompraUsd) || 0,
                            estado: estadoCalculado,
                          } as InventarioItem)
                        : i
                    )
                  );
                } else {
                  const nuevo: InventarioItem = {
                    id: `inv-${Date.now()}`,
                    codigo: formInsumo.codigo!,
                    nombre: formInsumo.nombre!,
                    categoria: formInsumo.categoria as any,
                    stockActual: stock,
                    stockMinimo: min,
                    unidadMedida: formInsumo.unidadMedida as any,
                    precioCompraUsd: Number(formInsumo.precioCompraUsd) || 0,
                    fechaIngreso: formInsumo.fechaIngreso || new Date().toISOString().slice(0, 10),
                    fechaSalida: formInsumo.fechaSalida || undefined,
                    lote: formInsumo.lote || 'LOTE-GEN',
                    sedeId: formInsumo.sedeId as any,
                    estado: estadoCalculado,
                    observaciones: formInsumo.observaciones,
                  };
                  setInventario((prev) => [nuevo, ...prev]);
                }
                setShowModalInsumo(false);
              }}
              className="flex flex-col gap-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Código Insumo</label>
                  <input
                    type="text"
                    required
                    value={formInsumo.codigo || ''}
                    onChange={(e) => setFormInsumo({ ...formInsumo, codigo: e.target.value })}
                    placeholder="Ej. MAT-RES-01"
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Categoría</label>
                  <select
                    value={formInsumo.categoria}
                    onChange={(e) => setFormInsumo({ ...formInsumo, categoria: e.target.value as any })}
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Restauración / Operatoria">Restauración / Operatoria</option>
                    <option value="Endodoncia">Endodoncia</option>
                    <option value="Bioseguridad & Desinfección">Bioseguridad & Desinfección</option>
                    <option value="Cirugía & Periodoncia">Cirugía & Periodoncia</option>
                    <option value="Ortodoncia">Ortodoncia</option>
                    <option value="Prótesis & Impresión">Prótesis & Impresión</option>
                    <option value="Anestesia & Farmacia">Anestesia & Farmacia</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-dental-deep-navy">Nombre Comercial del Material</label>
                <input
                  type="text"
                  required
                  value={formInsumo.nombre || ''}
                  onChange={(e) => setFormInsumo({ ...formInsumo, nombre: e.target.value })}
                  placeholder="Ej. Resina Filtek Z350 XT 3M ESPE (Tono A2)"
                  className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formInsumo.stockActual}
                    onChange={(e) => setFormInsumo({ ...formInsumo, stockActual: Number(e.target.value) })}
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-black text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Stock Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formInsumo.stockMinimo}
                    onChange={(e) => setFormInsumo({ ...formInsumo, stockMinimo: Number(e.target.value) })}
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Unidad Medida</label>
                  <select
                    value={formInsumo.unidadMedida}
                    onChange={(e) => setFormInsumo({ ...formInsumo, unidadMedida: e.target.value as any })}
                    className="h-10 px-2 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Caja">Caja</option>
                    <option value="Tubo / Jeringa">Tubo / Jeringa</option>
                    <option value="Frasco">Frasco</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Unidad">Unidad</option>
                    <option value="Cartucho (Carpule)">Carpule</option>
                    <option value="Galón">Galón</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Precio Compra ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formInsumo.precioCompraUsd}
                    onChange={(e) => setFormInsumo({ ...formInsumo, precioCompraUsd: Number(e.target.value) })}
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-teal-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Lote de Fabricación</label>
                  <input
                    type="text"
                    value={formInsumo.lote || ''}
                    onChange={(e) => setFormInsumo({ ...formInsumo, lote: e.target.value })}
                    placeholder="Ej. 3M-88910"
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Fechas de Ingreso y Fecha de Salida (Requerimiento explícito) */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-surface-subtle-ice/70 border border-border-subtle">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-teal-600">login</span>
                    <span>Fecha de Ingreso</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formInsumo.fechaIngreso || ''}
                    onChange={(e) => setFormInsumo({ ...formInsumo, fechaIngreso: e.target.value })}
                    className="h-9 px-2.5 rounded-xl bg-white border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-amber-600">logout</span>
                    <span>Fecha de Salida (Opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={formInsumo.fechaSalida || ''}
                    onChange={(e) => setFormInsumo({ ...formInsumo, fechaSalida: e.target.value })}
                    className="h-9 px-2.5 rounded-xl bg-white border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Sede Asignada</label>
                  <select
                    value={formInsumo.sedeId}
                    onChange={(e) => setFormInsumo({ ...formInsumo, sedeId: e.target.value as any })}
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="victoria">Sede La Victoria</option>
                    <option value="tovar">Sede Colonia Tovar</option>
                    <option value="ambas">Almacén Central (Ambas)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Observaciones</label>
                  <input
                    type="text"
                    value={formInsumo.observaciones || ''}
                    onChange={(e) => setFormInsumo({ ...formInsumo, observaciones: e.target.value })}
                    placeholder="Instrucciones o especificaciones..."
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-medium text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowModalInsumo(false)}
                  className="px-4 py-2 rounded-xl bg-surface-subtle-ice hover:bg-border-subtle text-secondary font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  {insumoEditando ? 'Actualizar Insumo' : 'Guardar en Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: REGISTRAR / EDITAR ORDEN DE LABORATORIO (MÓDULO 09)
         ===================================================================== */}
      {showModalLab && (
        <div
          className="fixed inset-0 z-50 bg-dental-deep-navy/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowModalLab(false)}
        >
          <div
            className="bg-surface-clean-white w-full max-w-xl rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl border border-border-subtle max-h-[90vh] overflow-y-auto animate-in zoom-in-95 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-base text-dental-deep-navy">
                    {labEditando ? 'Editar Orden de Laboratorio' : 'Nueva Orden Protésica de Laboratorio'}
                  </h4>
                  <p className="text-xs text-secondary">
                    Gestión de trabajos externos, fechas de prueba y costos de técnico dental
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModalLab(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!formLab.pacienteNombre || !formLab.laboratorioNombre) return;

                if (labEditando) {
                  setLaboratorios((prev) =>
                    prev.map((l) =>
                      l.id === labEditando.id
                        ? ({
                            ...l,
                            ...formLab,
                            costoLaboratorioUsd: Number(formLab.costoLaboratorioUsd) || 0,
                          } as LaboratorioItem)
                        : l
                    )
                  );
                } else {
                  const nuevo: LaboratorioItem = {
                    id: `lab-${Date.now()}`,
                    ordenCodigo: formLab.ordenCodigo || `LAB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                    laboratorioNombre: formLab.laboratorioNombre!,
                    tecnicoResponsable: formLab.tecnicoResponsable || 'T.D. Encargado',
                    telefonoContacto: formLab.telefonoContacto || '+58 412-0000000',
                    pacienteNombre: formLab.pacienteNombre!,
                    pacienteCedula: formLab.pacienteCedula || 'V-00.000.000',
                    doctorTratante: formLab.doctorTratante || 'Dra. María Alejandra Domínguez',
                    tipoTrabajo: formLab.tipoTrabajo as any,
                    piezaDiente: formLab.piezaDiente,
                    colorGuiaVita: formLab.colorGuiaVita || 'A2',
                    costoLaboratorioUsd: Number(formLab.costoLaboratorioUsd) || 0,
                    fechaEnvio: formLab.fechaEnvio || new Date().toISOString().slice(0, 10),
                    fechaPrometidaEntrega: formLab.fechaPrometidaEntrega || '',
                    fechaPruebaBoca: formLab.fechaPruebaBoca || undefined,
                    estado: formLab.estado as any,
                    sedeId: formLab.sedeId as any,
                    observaciones: formLab.observaciones,
                  };
                  setLaboratorios((prev) => [nuevo, ...prev]);
                }
                setShowModalLab(false);
              }}
              className="flex flex-col gap-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Orden Código</label>
                  <input
                    type="text"
                    required
                    value={formLab.ordenCodigo || ''}
                    onChange={(e) => setFormLab({ ...formLab, ordenCodigo: e.target.value })}
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-purple-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Doctor Tratante</label>
                  <input
                    type="text"
                    required
                    value={formLab.doctorTratante || ''}
                    onChange={(e) => setFormLab({ ...formLab, doctorTratante: e.target.value })}
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Nombre del Paciente</label>
                  <input
                    type="text"
                    required
                    value={formLab.pacienteNombre || ''}
                    onChange={(e) => setFormLab({ ...formLab, pacienteNombre: e.target.value })}
                    placeholder="Ej. Patricia Velásquez"
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Cédula del Paciente</label>
                  <input
                    type="text"
                    required
                    value={formLab.pacienteCedula || ''}
                    onChange={(e) => setFormLab({ ...formLab, pacienteCedula: e.target.value })}
                    placeholder="V-18.490.112"
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Laboratorio Dental</label>
                  <input
                    type="text"
                    required
                    value={formLab.laboratorioNombre || ''}
                    onChange={(e) => setFormLab({ ...formLab, laboratorioNombre: e.target.value })}
                    placeholder="Ej. DentalTech Protesistas La Victoria"
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Técnico / Teléfono</label>
                  <input
                    type="text"
                    value={formLab.tecnicoResponsable || ''}
                    onChange={(e) => setFormLab({ ...formLab, tecnicoResponsable: e.target.value })}
                    placeholder="T.D. Roberto Benítez (+58 412...)"
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Tipo de Trabajo</label>
                  <select
                    value={formLab.tipoTrabajo}
                    onChange={(e) => setFormLab({ ...formLab, tipoTrabajo: e.target.value as any })}
                    className="h-10 px-2 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Corona Zirconio Monolítico">Corona Zirconio Monolítico</option>
                    <option value="Corona Metal-Porcelana">Corona Metal-Porcelana</option>
                    <option value="Prótesis Parcial Removible">Prótesis Removible</option>
                    <option value="Prótesis Total Acrílica">Prótesis Total</option>
                    <option value="Carilla Cerámica E-Max">Carilla Cerámica E-Max</option>
                    <option value="Incrustación Onlay / Inlay">Incrustación Onlay / Inlay</option>
                    <option value="Retenedor Essix / Hawley">Retenedor Essix / Hawley</option>
                    <option value="Guía Quirúrgica Implantología">Guía Quirúrgica</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Pieza FDI</label>
                  <input
                    type="text"
                    value={formLab.piezaDiente || ''}
                    onChange={(e) => setFormLab({ ...formLab, piezaDiente: e.target.value })}
                    placeholder="Ej. 16, 21, 34-37"
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Guía de Color Vita</label>
                  <input
                    type="text"
                    value={formLab.colorGuiaVita || ''}
                    onChange={(e) => setFormLab({ ...formLab, colorGuiaVita: e.target.value })}
                    placeholder="Ej. A1, A2, BL2"
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Costo Lab ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formLab.costoLaboratorioUsd}
                    onChange={(e) => setFormLab({ ...formLab, costoLaboratorioUsd: Number(e.target.value) })}
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-black text-purple-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Fecha Envío</label>
                  <input
                    type="date"
                    required
                    value={formLab.fechaEnvio || ''}
                    onChange={(e) => setFormLab({ ...formLab, fechaEnvio: e.target.value })}
                    className="h-10 px-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Entrega Prometida</label>
                  <input
                    type="date"
                    required
                    value={formLab.fechaPrometidaEntrega || ''}
                    onChange={(e) => setFormLab({ ...formLab, fechaPrometidaEntrega: e.target.value })}
                    className="h-10 px-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Estado de la Orden</label>
                  <select
                    value={formLab.estado}
                    onChange={(e) => setFormLab({ ...formLab, estado: e.target.value as any })}
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="en_laboratorio">En Confección (Laboratorio)</option>
                    <option value="en_prueba_bizcocho">En Prueba en Boca / Bizcocho</option>
                    <option value="listo_en_clinica">Listo en Clínica (Por Instalar)</option>
                    <option value="instalado_al_paciente">Instalado al Paciente</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-dental-deep-navy">Sede</label>
                  <select
                    value={formLab.sedeId}
                    onChange={(e) => setFormLab({ ...formLab, sedeId: e.target.value as any })}
                    className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="victoria">Sede La Victoria</option>
                    <option value="tovar">Sede Colonia Tovar</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowModalLab(false)}
                  className="px-4 py-2 rounded-xl bg-surface-subtle-ice hover:bg-border-subtle text-secondary font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  {labEditando ? 'Actualizar Orden' : 'Guardar Orden de Laboratorio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Comprobante Ampliado */}
      {fotoComprobanteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setFotoComprobanteModal(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-surface-clean-white p-3 rounded-3xl shadow-2xl flex flex-col items-center">
            <button
              type="button"
              onClick={() => setFotoComprobanteModal(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <img
              src={fotoComprobanteModal}
              alt="Comprobante de Liquidación"
              className="max-h-[75vh] object-contain rounded-2xl"
            />
            <span className="text-xs font-mono text-secondary mt-2">
              Comprobante de Liquidación de Honorarios Profesionales • D1 Edge
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
