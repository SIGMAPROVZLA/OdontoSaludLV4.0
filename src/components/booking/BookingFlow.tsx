import React, { useState } from 'react';
import { useSede } from '../../context/SedeContext';
import { ApiClient } from '../../services/api';

export const BookingFlow: React.FC = () => {
  const { sedeActiva, sedeId } = useSede();

  // Estados del Stepper
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [treatment, setTreatment] = useState('Evaluación Inicial');
  const [selectedDate, setSelectedDate] = useState('Martes 22 Oct');
  const [selectedSlot, setSelectedSlot] = useState('09:00 AM');

  // Formulario de Paciente
  const [formData, setFormData] = useState({
    nombres: 'Patricia Velásquez',
    cedula: 'V-19.845.221',
    telefono: '+58 (412) 987-6543',
    email: 'patricia.velasquez@gmail.com',
    motivo: 'Sensibilidad en molar superior al masticar',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const treatments = [
    {
      id: 'evaluacion',
      nombre: 'Evaluación Inicial',
      desc: '45 min • Rx digital',
      icon: 'dentistry',
      badge: 'Completa',
    },
    {
      id: 'limpieza',
      nombre: 'Limpieza & Profilaxis',
      desc: '40 min • Ultrasonido',
      icon: 'clean_hands',
    },
    {
      id: 'urgencia',
      nombre: 'Urgencia / Dolor',
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
      id: 'blanqueamiento',
      nombre: 'Blanqueamiento',
      desc: '60 min • Estética LED',
      icon: 'flare',
    },
    {
      id: 'endodoncia',
      nombre: 'Endodoncia / Conducto',
      desc: '60 min • Especialista',
      icon: 'vital_signs',
    },
  ];

  const dates = [
    { dia: 'LUN', num: '21', cupos: '2 cupos', status: 'warning' },
    { dia: 'MAR', num: '22', cupos: 'Disponible', status: 'active' },
    { dia: 'MIÉ', num: '23', cupos: '5 cupos', status: 'success' },
    { dia: 'JUE', num: '24', cupos: '4 cupos', status: 'success' },
    { dia: 'VIE', num: '25', cupos: '1 cupo', status: 'warning' },
  ];

  const morningSlots = ['09:00 AM', '10:00 AM', '11:15 AM'];
  const afternoonSlots = ['02:00 PM', '03:15 PM', '04:30 PM'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await ApiClient.crearCita(sedeId, {
        pacienteId: `pac-${Date.now()}`,
        pacienteNombre: formData.nombres,
        pacienteCedula: formData.cedula,
        pacienteTelefono: formData.telefono,
        doctorNombre: 'Dra. María Alejandra Domínguez',
        boxNumero: 1,
        fechaCita: '2024-10-22',
        horaInicio: selectedSlot,
        motivo: `${treatment}: ${formData.motivo}`,
        estado: 'pendiente',
        esUrgencia: treatment.includes('Urgencia'),
      });

      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
      }, 4500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Toast de Éxito */}
      {successToast && (
        <div className="fixed top-20 inset-x-4 z-50 bg-dental-deep-navy text-surface-clean-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
          <div className="w-10 h-10 rounded-xl bg-status-success text-surface-clean-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-surface-clean-white leading-tight">
              ¡Cita Solicitada con Éxito!
            </p>
            <p className="text-xs text-surface-variant truncate">
              Recepción de {sedeActiva.nombre} confirmará tu turno en minutos.
            </p>
          </div>
        </div>
      )}

      {/* Banner de Sincronización en Vivo */}
      <div className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-success/10 text-status-success">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success" />
            </span>
            <span className="text-xs font-bold">Boxes disponibles hoy</span>
          </div>
          <span className="text-[11px] text-secondary bg-surface-container px-2.5 py-1 rounded-full font-semibold">
            {sedeActiva.nombre}
          </span>
        </div>

        <div>
          <h2 className="font-display font-bold text-xl text-dental-deep-navy">
            Reserva tu Cita Odontológica
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Atención integral con la Dra. María Alejandra Domínguez y equipo en {sedeActiva.nombre}.
          </p>
        </div>

        {/* Stepper Móvil de 3 Pasos */}
        <div className="bg-surface-subtle-ice rounded-xl p-3 border border-border-subtle mt-1">
          <div className="flex items-center justify-between">
            {/* Paso 1 */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 ${
                step === 1 ? 'font-bold text-primary' : 'text-secondary'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= 1 ? 'bg-primary text-surface-clean-white' : 'bg-surface-container'
                }`}
              >
                1
              </div>
              <span className="text-xs">1. Tratamiento</span>
            </button>

            <div className="w-4 h-0.5 bg-border-subtle" />

            {/* Paso 2 */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 ${
                step === 2 ? 'font-bold text-primary' : 'text-secondary'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= 2 ? 'bg-primary text-surface-clean-white' : 'bg-surface-container'
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
              className={`flex items-center gap-1.5 ${
                step === 3 ? 'font-bold text-primary' : 'text-secondary'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 3 ? 'bg-primary text-surface-clean-white' : 'bg-surface-container'
                }`}
              >
                3
              </div>
              <span className="text-xs">3. Datos</span>
            </button>
          </div>
        </div>
      </div>

      {/* PASO 1: Selector de Tratamientos & Triaje */}
      {step === 1 && (
        <div className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-dental-deep-navy">
                Tipo de Tratamiento
              </h3>
              <p className="text-xs text-secondary">
                Selecciona el motivo principal de tu consulta
              </p>
            </div>
            <span className="text-xs text-primary bg-primary-fixed/30 px-2 py-0.5 rounded-full font-bold">
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
                  onClick={() => setTreatment(t.nombre)}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 active:scale-95 ${
                    isSelected
                      ? 'bg-surface-clean-white border-2 border-primary shadow-md ring-2 ring-primary-fixed/30'
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-status-danger bg-status-danger/10">
                        Prioritario
                      </span>
                    ) : isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-primary text-surface-clean-white flex items-center justify-center">
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
            className="w-full mt-2 py-3 rounded-xl bg-primary text-surface-clean-white font-bold text-xs shadow-md hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            Continuar a Selección de Horario
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      )}

      {/* PASO 2: Selección de Fecha y Turnos */}
      {step === 2 && (
        <div className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-dental-deep-navy">
                Selecciona Fecha y Turno
              </h3>
              <p className="text-xs text-secondary">Octubre 2024 • Cupos en tiempo real</p>
            </div>
            <span className="text-xs text-tertiary-container bg-tertiary-fixed/30 px-2.5 py-1 rounded-full font-bold">
              Box 1 Activo
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
                      ? 'bg-gradient-to-b from-primary to-primary-container text-surface-clean-white shadow-md ring-2 ring-primary-fixed'
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
                      isSelected ? 'text-surface-clean-white' : 'text-dental-deep-navy'
                    }`}
                  >
                    {d.num}
                  </span>
                  <span
                    className={`text-[9px] font-bold ${
                      isSelected ? 'text-tertiary-fixed' : 'text-status-success'
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
            <div className="grid grid-cols-3 gap-2">
              {morningSlots.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-primary text-surface-clean-white shadow-md'
                        : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy hover:bg-surface-container active:scale-95'
                    }`}
                  >
                    <span>{slot}</span>
                    <span
                      className={`text-[9px] ${
                        isSelected ? 'text-primary-fixed' : 'text-secondary'
                      }`}
                    >
                      Box 1
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
            <div className="grid grid-cols-3 gap-2">
              {afternoonSlots.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-primary text-surface-clean-white shadow-md'
                        : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy hover:bg-surface-container active:scale-95'
                    }`}
                  >
                    <span>{slot}</span>
                    <span
                      className={`text-[9px] ${
                        isSelected ? 'text-primary-fixed' : 'text-secondary'
                      }`}
                    >
                      Box 1
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 py-3 rounded-xl bg-surface-container text-secondary text-xs font-bold"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-2/3 py-3 rounded-xl bg-primary text-surface-clean-white font-bold text-xs shadow-md hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              Continuar a Datos del Paciente
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Formulario de Paciente */}
      {step === 3 && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3.5"
        >
          <div>
            <h3 className="font-display font-bold text-base text-dental-deep-navy">
              Datos para Confirmación Telefónica
            </h3>
            <p className="text-xs text-secondary">
              Recepción te contactará por llamada o WhatsApp para validar tu Box.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy">
              Nombres y Apellidos completos *
            </label>
            <input
              type="text"
              required
              value={formData.nombres}
              onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy">
              Cédula de Identidad / DNI *
            </label>
            <input
              type="text"
              required
              value={formData.cedula}
              onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy">
              WhatsApp / Teléfono Móvil *
            </label>
            <input
              type="tel"
              required
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy">
              Motivo o Molestia Específica
            </label>
            <textarea
              rows={2}
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2 border border-border-subtle">
            <span className="material-symbols-outlined text-vibrant-cyan text-[18px] shrink-0 mt-0.5">
              verified_user
            </span>
            <p className="text-[11px] text-secondary leading-snug">
              Tus datos médicos están resguardados bajo secreto profesional y protocolos de la
              Ley de Ejercicio de la Odontología en Venezuela.
            </p>
          </div>

          {/* Resumen Final & Botón CTA */}
          <div className="bg-surface-subtle-ice p-3 rounded-xl border border-border-subtle flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-dental-deep-navy">
                {selectedDate} • {selectedSlot}
              </p>
              <p className="text-[11px] text-secondary">
                {treatment} • {sedeActiva.nombre}
              </p>
            </div>
            <span className="text-[11px] font-bold text-status-success bg-status-success/10 px-2 py-0.5 rounded-full">
              Sin pago previo
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-1/3 py-3 rounded-xl bg-surface-container text-secondary text-xs font-bold"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary via-primary-container to-electric-blue text-surface-clean-white font-bold text-xs shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">event_available</span>
              {isSubmitting ? 'Confirmando...' : 'Confirmar Cita'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
