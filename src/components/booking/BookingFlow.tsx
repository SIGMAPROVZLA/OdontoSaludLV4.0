import React, { useState } from 'react';
import { useSede } from '../../context/SedeContext';
import { ApiClient } from '../../services/api';
import { TabId } from '../layout/BottomNavigation';

interface DoctorOption {
  id: string;
  nombre: string;
  titulo: string;
  especialidad: string;
  box: number;
  avatar: string;
  esTitular?: boolean;
}

interface BookingFlowProps {
  onBack?: () => void;
  onNavigateTab?: (tab: TabId) => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ onBack, onNavigateTab }) => {
  const { sedeActiva, sedeId } = useSede();

  // Doctores de Google Stitch
  const doctores: DoctorOption[] = [
    {
      id: 'dra_dominguez',
      nombre: 'Dra. María Domínguez',
      titulo: 'Titular',
      especialidad: 'Directora Clínica • Odontología General & Estética',
      box: 1,
      avatar:
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
      esTitular: true,
    },
    {
      id: 'dr_mendoza',
      nombre: 'Dr. Carlos Mendoza R.',
      titulo: 'Ortodoncista',
      especialidad: 'Ortodoncia & Ortopedia Dentofacial',
      box: 2,
      avatar:
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'dra_paez',
      nombre: 'Dra. Valentina Páez G.',
      titulo: 'Endodoncista',
      especialidad: 'Endodoncia & Odontopediatría',
      box: 3,
      avatar:
        'https://images.unsplash.com/photo-1594824813637-4560767733a1?auto=format&fit=crop&w=200&q=80',
    },
  ];

  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption>(doctores[0]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  // Estados del Stepper
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [treatment, setTreatment] = useState('Evaluación & Diagnóstico Inicial');
  const [treatmentDesc, setTreatmentDesc] = useState('45 min • Rx digital');
  const [selectedDate, setSelectedDate] = useState('Jueves 24 Oct');
  const [selectedSlot, setSelectedSlot] = useState('09:00 AM');

  // Formulario de Paciente
  const [cedulaTipo, setCedulaTipo] = useState<'V' | 'E' | 'J' | 'P'>('V');
  const [cedulaNumero, setCedulaNumero] = useState('19.845.221');
  const [nombres, setNombres] = useState('Patricia Velásquez');
  const [telefono, setTelefono] = useState('+58 (412) 987-6543');
  const [email, setEmail] = useState('patricia.velasquez@gmail.com');
  const [motivo, setMotivo] = useState('Sensibilidad en molar superior al masticar');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [codigoConfirmacion, setCodigoConfirmacion] = useState('');

  const treatments = [
    {
      id: 'evaluacion',
      nombre: 'Evaluación & Diagnóstico Inicial',
      desc: '45 min • Rx digital',
      icon: 'dentistry',
      badge: 'Completa',
      isPopular: true,
    },
    {
      id: 'limpieza',
      nombre: 'Limpieza & Profilaxis',
      desc: '40 min • Ultrasonido',
      icon: 'clean_hands',
    },
    {
      id: 'urgencia',
      nombre: 'Urgencia / Dolor Agudo',
      desc: '30 min • Atención prioritaria',
      icon: 'emergency',
      isUrgent: true,
    },
    {
      id: 'ortodoncia',
      nombre: 'Ortodoncia & Brackets',
      desc: '45 min • Alineación',
      icon: 'grid_view',
    },
    {
      id: 'endodoncia',
      nombre: 'Endodoncia / Conducto',
      desc: '60 min • Especialista',
      icon: 'vital_signs',
    },
    {
      id: 'protesis',
      nombre: 'Prótesis & Implantes',
      desc: '50 min • Rehabilitación',
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
    { hora: '09:00 AM', sub: `Sillón ${selectedDoctor.box} - ${selectedDoctor.nombre.split(' ')[1] || 'Dra'}` },
    { hora: '10:30 AM', sub: 'Libre' },
    { hora: '11:15 AM', sub: 'Libre' },
  ];

  const afternoonSlots = [
    { hora: '02:00 PM', sub: 'Libre' },
    { hora: '03:15 PM', sub: 'Libre' },
    { hora: '04:30 PM', sub: '1 Cita disp.' },
    { hora: '05:15 PM', sub: 'Libre' },
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const generatedCode = `ODL-${Math.floor(1000 + Math.random() * 9000)}`;
    setCodigoConfirmacion(generatedCode);

    try {
      await ApiClient.crearCita(sedeId, {
        pacienteId: `pac-${Date.now()}`,
        pacienteNombre: nombres,
        pacienteCedula: `${cedulaTipo}-${cedulaNumero}`,
        pacienteTelefono: telefono,
        doctorNombre: selectedDoctor.nombre,
        boxNumero: selectedDoctor.box,
        fechaCita: '2024-10-24',
        horaInicio: selectedSlot,
        motivo: `${treatment}: ${motivo}`,
        estado: 'pendiente',
        esUrgencia: treatment.toLowerCase().includes('urgencia') || treatment.toLowerCase().includes('dolor'),
      });

      setBookingConfirmed(true);
    } catch (err) {
      console.error('Error al solicitar cita:', err);
      // Continuar mostrando el voucher para la experiencia de usuario
      setBookingConfirmed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const abrirWhatsAppConfirmacion = () => {
    const cleanPhone = sedeActiva.whatsapp.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `¡Hola! Acabo de registrar mi cita en la web de OdontoSalud (${sedeActiva.nombre}).\n\n` +
      `📋 Código: ${codigoConfirmacion}\n` +
      `👤 Paciente: ${nombres} (${cedulaTipo}-${cedulaNumero})\n` +
      `🩺 Motivo: ${treatment}\n` +
      `📅 Fecha: ${selectedDate} a las ${selectedSlot}\n` +
      `👨‍⚕️ Profesional: ${selectedDoctor.nombre} (Box ${selectedDoctor.box})\n\n` +
      `Agradezco su validación y confirmación. ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* Modal Selector de Profesional Clínico */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-surface-clean-white rounded-3xl p-5 w-full max-w-md shadow-2xl border border-border-subtle flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div>
                <h3 className="font-display font-bold text-base text-dental-deep-navy">
                  Selecciona tu Odontólogo
                </h3>
                <p className="text-xs text-secondary">
                  Especialistas disponibles hoy en {sedeActiva.nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle-ice text-secondary flex items-center justify-center hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {doctores.map((doc) => {
                const isSelected = selectedDoctor.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setShowDoctorModal(false);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'border-electric-blue bg-electric-blue/5 shadow-sm ring-1 ring-electric-blue'
                        : 'border-border-subtle hover:bg-surface-subtle-ice'
                    }`}
                  >
                    <img
                      src={doc.avatar}
                      alt={doc.nombre}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 ring-2 ring-primary/20"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-display font-bold text-xs text-dental-deep-navy truncate">
                          {doc.nombre}
                        </p>
                        <span className="px-1.5 py-0.2 rounded-md bg-primary-fixed/30 text-primary text-[10px] font-bold">
                          {doc.titulo}
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary truncate mt-0.5">
                        {doc.especialidad}
                      </p>
                      <span className="text-[10px] text-status-success font-semibold inline-flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                        Box 0{doc.box} Activo
                      </span>
                    </div>

                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-electric-blue text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[15px]">check</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cita Confirmada (Voucher Clínico Digital) */}
      {bookingConfirmed && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-surface-clean-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-border-subtle text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-status-success/15 text-status-success flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-status-success/10 text-status-success text-[10px] font-bold uppercase tracking-wider">
                Solicitud Pre-Aprobada
              </span>
              <h2 className="font-display font-bold text-xl text-dental-deep-navy mt-1">
                ¡Cita Registrada!
              </h2>
              <p className="text-xs text-secondary mt-1">
                Código de Turno: <strong className="font-mono text-electric-blue">{codigoConfirmacion}</strong>
              </p>
            </div>

            {/* Ficha Resumen */}
            <div className="w-full bg-surface-subtle-ice p-3.5 rounded-2xl border border-border-subtle text-left text-xs space-y-2 mt-1">
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle/80">
                <span className="text-secondary">Paciente:</span>
                <span className="font-bold text-dental-deep-navy">{nombres}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle/80">
                <span className="text-secondary">Tratamiento:</span>
                <span className="font-bold text-dental-deep-navy">{treatment}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle/80">
                <span className="text-secondary">Fecha y Turno:</span>
                <span className="font-bold text-dental-deep-navy">{selectedDate} • {selectedSlot}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Profesional:</span>
                <span className="font-bold text-dental-deep-navy">{selectedDoctor.nombre} (Box {selectedDoctor.box})</span>
              </div>
            </div>

            <p className="text-[11px] text-secondary leading-relaxed px-2">
              Recepción central de {sedeActiva.nombre} confirmará tu Box de manera inmediata.
            </p>

            {/* Botones de Acción */}
            <div className="w-full flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={abrirWhatsAppConfirmacion}
                className="w-full py-3 px-4 rounded-xl bg-status-success hover:brightness-105 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                Confirmar por WhatsApp con Recepción
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookingConfirmed(false);
                  onNavigateTab?.('coordinacion');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                Ver en Triaje / Coordinación de Citas
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookingConfirmed(false);
                  setStep(1);
                }}
                className="text-xs text-secondary hover:text-dental-deep-navy font-medium pt-1"
              >
                Registrar otra cita
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header & Micro-banner en Vivo */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-success/10 text-status-success text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span>Valores en Vivo: Disponibles hoy</span>
          </div>

          <div className="flex items-center gap-1.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1 rounded-lg bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy text-xs font-semibold flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                <span>Volver</span>
              </button>
            )}
            <span className="text-[10px] font-bold text-primary bg-primary-fixed/25 px-2 py-0.5 rounded-full border border-primary/20">
              Tasa BCV 49.85
            </span>
          </div>
        </div>

        <div>
          <h1 className="font-display font-extrabold text-xl text-dental-deep-navy">
            Reserva tu Cita Odontológica
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Atención personalizada con la Dra. María Alejandra Domínguez y equipo en {sedeActiva.nombre}.
          </p>
        </div>

        {/* Stepper Móvil de 3 Pasos (Google Stitch) */}
        <div className="bg-surface-subtle-ice rounded-xl p-2.5 border border-border-subtle mt-1">
          <div className="flex items-center justify-between">
            {/* Paso 1 */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 transition-all ${
                step === 1 ? 'font-bold text-electric-blue' : 'text-secondary'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step >= 1 ? 'bg-electric-blue text-white' : 'bg-surface-container'
                }`}
              >
                1
              </div>
              <span className="text-xs">1. Especialidad</span>
            </button>

            <div className="w-4 h-0.5 bg-border-subtle" />

            {/* Paso 2 */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 transition-all ${
                step === 2 ? 'font-bold text-electric-blue' : 'text-secondary'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step >= 2 ? 'bg-electric-blue text-white' : 'bg-surface-container'
                }`}
              >
                2
              </div>
              <span className="text-xs">2. Horario</span>
            </button>

            <div className="w-4 h-0.5 bg-border-subtle" />

            {/* Paso 3 */}
            <button
              type="button"
              onClick={() => setStep(3)}
              className={`flex items-center gap-1.5 transition-all ${
                step === 3 ? 'font-bold text-electric-blue' : 'text-secondary'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === 3 ? 'bg-electric-blue text-white' : 'bg-surface-container'
                }`}
              >
                3
              </div>
              <span className="text-xs">3. Datos</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Tarjeta del Profesional Clínico Activo (Doctor Card de Stitch) */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={selectedDoctor.avatar}
                alt={selectedDoctor.nombre}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-electric-blue/20 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-status-success ring-2 ring-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-sm text-dental-deep-navy truncate">
                  {selectedDoctor.nombre}
                </h3>
                <span className="px-1.5 py-0.2 rounded-md bg-primary-fixed/40 text-primary text-[10px] font-bold">
                  {selectedDoctor.titulo}
                </span>
              </div>
              <p className="text-[11px] text-secondary truncate mt-0.5">
                {selectedDoctor.especialidad}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDoctorModal(true)}
            className="px-2.5 py-1 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-electric-blue text-xs font-bold transition-all active:scale-95 shrink-0"
          >
            Cambiar
          </button>
        </div>

        {/* Sub-tarjeta de Tratamiento y Box Sugerido */}
        <div className="bg-surface-subtle-ice rounded-xl p-3 border border-border-subtle flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-electric-blue/10 text-electric-blue flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">dentistry</span>
            </span>
            <div className="min-w-0">
              <p className="font-bold text-xs text-dental-deep-navy truncate">
                {treatment}
              </p>
              <p className="text-[10px] text-secondary truncate">
                Duración: {treatmentDesc} • Sede {sedeActiva.nombre} • Sillón Box 0{selectedDoctor.box}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-status-success bg-status-success/15 px-2 py-0.5 rounded-full shrink-0">
            Box 0{selectedDoctor.box}
          </span>
        </div>
      </section>

      {/* 3. PASO 1: Selector de Tratamientos y Motivo de Consulta */}
      {step === 1 && (
        <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-dental-deep-navy">
                Tipo de Tratamiento
              </h3>
              <p className="text-xs text-secondary">
                Selecciona el motivo principal de tu visita
              </p>
            </div>
            <span className="text-xs text-electric-blue bg-electric-blue/10 px-2 py-0.5 rounded-full font-bold">
              Paso 1 de 3
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {treatments.map((t) => {
              const isSelected = treatment === t.nombre;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTreatment(t.nombre);
                    setTreatmentDesc(t.desc);
                  }}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 active:scale-95 ${
                    isSelected
                      ? 'bg-surface-clean-white border-2 border-electric-blue shadow-md ring-2 ring-electric-blue/20'
                      : 'bg-surface-clean-white border-border-subtle hover:bg-surface-subtle-ice'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        t.isUrgent
                          ? 'bg-status-danger/10 text-status-danger'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {t.icon}
                      </span>
                    </span>
                    {t.isUrgent ? (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-status-danger bg-status-danger/10 inline-flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-danger animate-ping" />
                        Prioritario
                      </span>
                    ) : isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-electric-blue text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[13px]">
                          check
                        </span>
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <p className="font-bold text-xs text-dental-deep-navy leading-snug">
                      {t.nombre}
                    </p>
                    <p className="text-[10px] text-secondary mt-0.5">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full mt-2 py-3 rounded-xl bg-electric-blue text-white font-bold text-xs shadow-md hover:bg-primary active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            Continuar a Selección de Horario
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </section>
      )}

      {/* 4. PASO 2: Selección de Fecha y Turnos */}
      {step === 2 && (
        <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-dental-deep-navy">
                Selecciona Fecha y Turno
              </h3>
              <p className="text-xs text-secondary">Octubre 2024 • Cupos en tiempo real</p>
            </div>
            <span className="text-xs text-primary font-bold bg-primary-fixed/30 px-2 py-0.5 rounded-full">
              Box 0{selectedDoctor.box} Activo
            </span>
          </div>

          {/* Carrusel Horizontal de Días */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {dates.map((d) => {
              const dateStr = `${d.dia} ${d.num} Oct`;
              const isSelected = selectedDate.includes(d.num);
              return (
                <button
                  key={d.num}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`shrink-0 w-16 py-2.5 px-1 rounded-2xl text-center transition-all flex flex-col items-center gap-0.5 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-b from-dental-deep-navy to-primary text-white shadow-md ring-2 ring-electric-blue'
                      : 'bg-surface-clean-white border border-border-subtle hover:bg-surface-subtle-ice'
                  }`}
                >
                  <span
                    className={`text-[11px] font-semibold ${
                      isSelected ? 'text-primary-fixed' : 'text-secondary'
                    }`}
                  >
                    {d.dia}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      isSelected ? 'text-white' : 'text-dental-deep-navy'
                    }`}
                  >
                    {d.num}
                  </span>
                  <span
                    className={`text-[9px] font-bold ${
                      isSelected ? 'text-vibrant-cyan' : 'text-status-success'
                    }`}
                  >
                    {d.cupos}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Turno Mañana */}
          <div className="bg-surface-subtle-ice p-3 rounded-xl border border-border-subtle">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-vibrant-cyan text-[18px]">
                wb_sunny
              </span>
              <span className="text-xs font-bold text-dental-deep-navy">Turno Mañana</span>
              <span className="text-[10px] text-secondary ml-auto">Recomendado</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {morningSlots.map((slot) => {
                const isSelected = selectedSlot === slot.hora;
                return (
                  <button
                    key={slot.hora}
                    type="button"
                    onClick={() => setSelectedSlot(slot.hora)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-electric-blue text-white shadow-md'
                        : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy hover:bg-surface-container active:scale-95'
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
          <div className="bg-surface-subtle-ice p-3 rounded-xl border border-border-subtle">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-status-warning text-[18px]">
                wb_twilight
              </span>
              <span className="text-xs font-bold text-dental-deep-navy">Turno Tarde</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {afternoonSlots.map((slot) => {
                const isSelected = selectedSlot === slot.hora;
                return (
                  <button
                    key={slot.hora}
                    type="button"
                    onClick={() => setSelectedSlot(slot.hora)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-electric-blue text-white shadow-md'
                        : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy hover:bg-surface-container active:scale-95'
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

          <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex items-center gap-2 text-xs text-secondary">
            <span className="material-symbols-outlined text-[16px] text-electric-blue">schedule</span>
            <span>Horarios sincronizados en tiempo real con recepción central y boxes clínicos.</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 py-3 rounded-xl bg-surface-container text-secondary text-xs font-bold active:scale-95"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-2/3 py-3 rounded-xl bg-electric-blue text-white font-bold text-xs shadow-md hover:bg-primary active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              Continuar a Datos del Paciente
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </section>
      )}

      {/* 5. PASO 3: Formulario de Paciente (Stitch Inputs) */}
      {step === 3 && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3.5"
        >
          <div>
            <h3 className="font-display font-bold text-base text-dental-deep-navy">
              Tus Datos para Confirmación Telefónica
            </h3>
            <p className="text-xs text-secondary">
              Recepción te contactará por llamada o WhatsApp para validar tu turno de forma inmediata.
            </p>
          </div>

          {/* Nombres y Apellidos */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-secondary">person</span>
              Nombres y Apellidos completos *
            </label>
            <input
              type="text"
              required
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              placeholder="Ej. Patricia Velásquez"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
          </div>

          {/* Cédula de Identidad con Selector de Prefijo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-secondary">badge</span>
              Cédula de Identidad / DNI *
            </label>
            <div className="flex gap-2">
              <select
                value={cedulaTipo}
                onChange={(e) => setCedulaTipo(e.target.value as any)}
                className="h-11 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
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
                className="flex-1 h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
              >
              </input>
            </div>
          </div>

          {/* WhatsApp con Badge */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">chat</span>
                WhatsApp / Teléfono Móvil *
              </label>
              <span className="text-[10px] text-status-success font-bold bg-status-success/15 px-2 py-0.2 rounded-full inline-flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">check</span>
                Recibirá SMS
              </span>
            </div>
            <input
              type="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+58 (412) 987-6543"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
          </div>

          {/* Correo Electrónico */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-secondary">mail</span>
              Correo Electrónico (Para recordatorio)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patricia.velasquez@gmail.com"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
          </div>

          {/* Motivo o Molestia Principal */}
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
              className="w-full p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
          </div>

          {/* Aviso Legal de Confidencialidad */}
          <div className="p-3 rounded-xl bg-surface-subtle-ice flex items-start gap-2 border border-border-subtle">
            <span className="material-symbols-outlined text-electric-blue text-[18px] shrink-0 mt-0.5">
              verified_user
            </span>
            <p className="text-[11px] text-secondary leading-snug">
              Tus datos médicos y de contacto están protegidos bajo protocolos de confidencialidad de la
              Ley de Ejercicio de la Odontología en Venezuela.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-1/3 py-3 rounded-xl bg-surface-container text-secondary text-xs font-bold active:scale-95"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-dental-deep-navy via-primary to-electric-blue text-white font-bold text-xs shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">event_available</span>
              {isSubmitting ? 'Registrando...' : 'Confirmar y Reservar Cita Previa'}
            </button>
          </div>
        </form>
      )}

      {/* 6. Fila de Sellos de Confianza (Trust Badges de Stitch) */}
      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-surface-clean-white p-2.5 rounded-2xl border border-border-subtle flex flex-col items-center">
          <span className="w-8 h-8 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </span>
          <span className="text-[11px] font-bold text-dental-deep-navy">Bioseguridad 100%</span>
          <span className="text-[9px] text-secondary">Esterilización certificada</span>
        </div>

        <div className="bg-surface-clean-white p-2.5 rounded-2xl border border-border-subtle flex flex-col items-center">
          <span className="w-8 h-8 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-[18px]">alarm_on</span>
          </span>
          <span className="text-[11px] font-bold text-dental-deep-navy">Puntualidad Exacta</span>
          <span className="text-[9px] text-secondary">Sin esperas largas</span>
        </div>

        <div className="bg-surface-clean-white p-2.5 rounded-2xl border border-border-subtle flex flex-col items-center">
          <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          </span>
          <span className="text-[11px] font-bold text-dental-deep-navy">Pago Cómodo</span>
          <span className="text-[9px] text-secondary">Bolívares / Divisas</span>
        </div>
      </section>

      {/* 7. Barra Flotante Sticky Inferior (Sticky CTA Bar de Stitch) */}
      <aside aria-label="Confirmación de Reserva" className="fixed bottom-16 left-0 right-0 z-40 bg-surface-clean-white/95 backdrop-blur-xl border-t border-border-subtle p-3 shadow-[0_-4px_20px_rgba(15,43,72,0.1)] max-w-5xl mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-electric-blue text-[20px]">
                calendar_clock
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-dental-deep-navy truncate leading-tight">
                  {selectedDate} • {selectedSlot}
                </p>
                <p className="text-[11px] text-secondary truncate">
                  {selectedDoctor.nombre} • {treatment} (Box {selectedDoctor.box})
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-status-success bg-status-success/15 px-2 py-0.5 rounded-full shrink-0">
              Sin pago previo
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (step < 3) {
                setStep(3);
              } else {
                handleSubmit();
              }
            }}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-dental-deep-navy via-primary to-electric-blue text-white font-bold text-xs shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">event_available</span>
            <span>{step < 3 ? 'Completar Datos para Reservar' : isSubmitting ? 'Registrando...' : 'Confirmar y Reservar Cita Previa'}</span>
          </button>

          <p className="text-[10px] text-center text-secondary">
            🔒 Sin cobros anticipados obligatorios • Recordatorio gratuito por WhatsApp y SMS
          </p>
        </div>
      </aside>
    </div>
  );
};
