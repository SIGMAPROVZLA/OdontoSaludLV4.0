import React, { useState, useEffect } from 'react';
import { useSede } from '../../context/SedeContext';
import { ApiClient } from '../../services/api';
import { Cita } from '../../types/clinical';
import { TabId } from '../layout/BottomNavigation';

interface SolicitudCita {
  id: string;
  pacienteNombre: string;
  pacienteCedula: string;
  pacienteTelefono: string;
  origen: 'web' | 'chatbot' | 'whatsapp';
  tipo: 'urgencia' | 'control' | 'nuevo' | 'espera';
  motivo: string;
  fechaTexto: string;
  horaTexto: string;
  boxSugerido: number;
  doctorSugerido: string;
  estado: 'por_confirmar' | 'confirmada' | 'espera';
  tiempoTranscurrido: string;
  notaRecepcion?: string;
  pagoAnticipado?: string;
}

interface AppointmentCoordinationViewProps {
  onNavigateTab?: (tab: TabId) => void;
}

export const AppointmentCoordinationView: React.FC<AppointmentCoordinationViewProps> = ({
  onNavigateTab,
}) => {
  const { sedeActiva, sedeId } = useSede();

  const [filtroTiempo, setFiltroTiempo] = useState<'hoy' | 'semana' | 'pasadas'>('hoy');
  const [filtroCategoria, setFiltroCategoria] = useState<'todos' | 'por_confirmar' | 'urgencias'>('por_confirmar');
  const [busqueda, setBusqueda] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [solicitudes, setSolicitudes] = useState<SolicitudCita[]>([
    {
      id: 'sol-1',
      pacienteNombre: 'Patricia Velásquez',
      pacienteCedula: 'V-19.845.221',
      pacienteTelefono: '+584145550921',
      origen: 'web',
      tipo: 'urgencia',
      motivo: 'Evaluación Inicial: Dolor agudo molar sup. der. al masticar',
      fechaTexto: 'Hoy',
      horaTexto: '09:30 AM',
      boxSugerido: 1,
      doctorSugerido: 'Dra. María Alejandra Domínguez',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 18m',
    },
    {
      id: 'sol-2',
      pacienteNombre: 'Marcos Rondón',
      pacienteCedula: 'V-19.463.118',
      pacienteTelefono: '+584247890123',
      origen: 'chatbot',
      tipo: 'control',
      motivo: 'Ajuste mensual de Brackets metálicos (Etapa 4)',
      fechaTexto: 'Hoy',
      horaTexto: '02:00 PM',
      boxSugerido: 2,
      doctorSugerido: 'Dr. Marcos Silva',
      estado: 'por_confirmar',
      tiempoTranscurrido: 'Hace 43m',
    },
    {
      id: 'sol-3',
      pacienteNombre: 'Elena Blanco',
      pacienteCedula: 'V-25.115.894',
      pacienteTelefono: '+584129876543',
      origen: 'web',
      tipo: 'nuevo',
      motivo: 'Profilaxis & Destartraje ultrasónico completo',
      fechaTexto: 'Mañana',
      horaTexto: '10:30 AM',
      boxSugerido: 3,
      doctorSugerido: 'Higienista Dental',
      estado: 'confirmada',
      tiempoTranscurrido: 'Ayer 18:30',
      pagoAnticipado: 'Pago Móvil pre-autorizado ($20)',
    },
    {
      id: 'sol-4',
      pacienteNombre: 'Carlos Mendoza',
      pacienteCedula: 'V-17.654.321',
      pacienteTelefono: '+584121234567',
      origen: 'whatsapp',
      tipo: 'espera',
      motivo: 'Endodoncia Molar 1.6 (Dolor moderado recurrente)',
      fechaTexto: 'Lista de Espera',
      horaTexto: 'Turno Tarde',
      boxSugerido: 1,
      doctorSugerido: 'Dra. María Alejandra Domínguez',
      estado: 'espera',
      tiempoTranscurrido: 'Hace 2h',
      notaRecepcion:
        'Paciente solicita sobrecupo preferencial en turno tarde (a partir de las 04:00 PM) por horario laboral.',
    },
  ]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const mostrarNotificacion = (texto: string) => {
    setToastMsg(texto);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const cargarCitasDesdeD1 = async () => {
    setIsRefreshing(true);
    try {
      const citasD1 = await ApiClient.getCitas(sedeId, 'all');
      if (citasD1 && citasD1.length > 0) {
        const d1Mapeadas: SolicitudCita[] = citasD1.map((c, idx) => ({
          id: c.id,
          pacienteNombre: c.pacienteNombre,
          pacienteCedula: c.pacienteCedula || 'V-19.845.221',
          pacienteTelefono: c.pacienteTelefono || '+584129876543',
          origen: c.esUrgencia ? 'web' : idx % 2 === 0 ? 'chatbot' : 'whatsapp',
          tipo: c.esUrgencia
            ? 'urgencia'
            : c.motivo.toLowerCase().includes('bracket')
            ? 'control'
            : 'nuevo',
          motivo: c.motivo,
          fechaTexto: c.fechaCita === new Date().toISOString().split('T')[0] ? 'Hoy' : c.fechaCita,
          horaTexto: c.horaInicio,
          boxSugerido: c.boxNumero || 1,
          doctorSugerido: c.doctorNombre || 'Dra. María Alejandra Domínguez',
          estado: (c.estado === 'pendiente' ? 'por_confirmar' : c.estado) as any,
          tiempoTranscurrido: 'En tiempo real',
        }));

        setSolicitudes((prev) => {
          const idsExistentes = new Set(d1Mapeadas.map((d) => d.id));
          const mockRestantes = prev.filter((p) => !idsExistentes.has(p.id));
          return [...d1Mapeadas, ...mockRestantes];
        });
      }
    } catch {
      // Fallback a registros locales
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    cargarCitasDesdeD1();
  }, [sedeId]);

  // Acción: Aprobar cita individual
  const handleAprobarCita = async (id: string, paciente: string) => {
    setSolicitudes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: 'confirmada' } : s))
    );
    await ApiClient.actualizarEstadoCita(id, 'confirmada', sedeId);
    mostrarNotificacion(`✅ Cita de ${paciente} aprobada e ingresada a Agenda.`);
  };

  // Acción: Aprobar en lote
  const handleAprobarLote = async () => {
    const pendientes = solicitudes.filter((s) => s.estado === 'por_confirmar');
    const ids = pendientes.map((s) => s.id);
    if (ids.length === 0) return;

    setSolicitudes((prev) =>
      prev.map((s) => (s.estado === 'por_confirmar' ? { ...s, estado: 'confirmada' } : s))
    );
    await ApiClient.aprobarCitasLote(ids, sedeId);
    mostrarNotificacion(`🎉 ${ids.length} citas aprobadas en bloque con éxito.`);
  };

  // Abrir WhatsApp con mensaje pre-elaborado
  const abrirWhatsApp = (sol: SolicitudCita) => {
    const cleanPhone = sol.pacienteTelefono.replace(/[^0-9]/g, '');
    const mensaje = encodeURIComponent(
      `¡Hola ${sol.pacienteNombre}! Te saludamos de OdontoSalud (${sedeActiva.nombre}). Tu cita para ${sol.motivo} el día ${sol.fechaTexto} a las ${sol.horaTexto} ha sido validada. Por favor confirma tu asistencia respondiendo a este mensaje.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${mensaje}`, '_blank');
  };

  // Filtrado reactivo
  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const coincideTexto =
      sol.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      sol.pacienteCedula.toLowerCase().includes(busqueda.toLowerCase()) ||
      sol.motivo.toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideTexto) return false;

    if (filtroCategoria === 'por_confirmar') return sol.estado === 'por_confirmar';
    if (filtroCategoria === 'urgencias') return sol.tipo === 'urgencia';
    return true;
  });

  const porConfirmarCount = solicitudes.filter((s) => s.estado === 'por_confirmar').length;

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Toast de confirmación */}
      {toastMsg && (
        <div className="fixed top-20 left-4 right-4 z-50 p-3 bg-dental-deep-navy text-white text-xs font-bold rounded-xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top">
          <span>{toastMsg}</span>
          <span className="material-symbols-outlined text-[16px] text-vibrant-cyan">check_circle</span>
        </div>
      )}

      {/* 1. Header de Recepción & Triaje Digital */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
              Recepción & Triaje Digital
            </span>
            <h1 className="font-display font-extrabold text-base text-dental-deep-navy">
              Citas Previas Web & Chat
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                cargarCitasDesdeD1();
                mostrarNotificacion('Sincronizado en vivo con Cloudflare D1');
              }}
              className="w-8 h-8 rounded-lg bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy active:scale-95"
              title="Sincronizar Citas"
            >
              <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin text-electric-blue' : ''}`}>sync</span>
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
          </div>
        </div>

        {/* 2. KPIs de Coordinación (Cards 2x2 de Stitch) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Por Confirmar */}
          <div className="p-3 rounded-xl bg-status-warning/10 border border-status-warning/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-secondary block">Por Confirmar</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-display font-bold text-status-warning leading-none">
                  {porConfirmarCount}
                </span>
                <span className="text-[10px] text-status-danger font-semibold">urgentes</span>
              </div>
            </div>
            <span className="w-8 h-8 rounded-lg bg-status-warning/20 flex items-center justify-center text-status-warning">
              <span className="material-symbols-outlined text-[18px]">notification_important</span>
            </span>
          </div>

          {/* Confirmadas Hoy */}
          <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-secondary block">Confirmadas Hoy</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-display font-bold text-status-success leading-none">
                  14
                </span>
                <span className="text-[10px] text-secondary font-semibold">en sillón</span>
              </div>
            </div>
            <span className="w-8 h-8 rounded-lg bg-status-success/20 flex items-center justify-center text-status-success">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </span>
          </div>

          {/* Reasignar */}
          <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-[10px] text-secondary block">Reasignar</span>
              <span className="text-sm font-bold text-dental-deep-navy">2 casos</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-electric-blue">swap_horiz</span>
          </div>

          {/* T. Respuesta */}
          <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-[10px] text-secondary block">T. Respuesta</span>
              <span className="text-sm font-bold text-dental-deep-navy">~12 min</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
          </div>
        </div>

        {/* 3. Buscador de Paciente */}
        <div className="mt-3 relative">
          <span className="material-symbols-outlined text-[18px] text-secondary absolute left-3 top-2.5">
            search
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar paciente, cédula o teléfono..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-subtle-ice border border-border-subtle focus:bg-white focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/15 outline-none transition-all text-dental-deep-navy placeholder:text-secondary/70"
          />
        </div>

        {/* 4. Chips de Filtro Temporal */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFiltroTiempo('hoy')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
              filtroTiempo === 'hoy'
                ? 'bg-dental-deep-navy text-white shadow-sm'
                : 'bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy'
            }`}
          >
            Hoy, 24 Oct
          </button>
          <button
            type="button"
            onClick={() => setFiltroTiempo('semana')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
              filtroTiempo === 'semana'
                ? 'bg-dental-deep-navy text-white shadow-sm'
                : 'bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy'
            }`}
          >
            Esta Semana
          </button>
          <button
            type="button"
            onClick={() => setFiltroTiempo('pasadas')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
              filtroTiempo === 'pasadas'
                ? 'bg-dental-deep-navy text-white shadow-sm'
                : 'bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy'
            }`}
          >
            Pasadas (3)
          </button>
        </div>
      </section>

      {/* 5. Selector de Pestañas de Estado */}
      <div className="flex items-center gap-1.5 px-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFiltroCategoria('todos')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            filtroCategoria === 'todos'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-secondary border border-border-subtle'
          }`}
        >
          Todos ({solicitudes.length})
        </button>
        <button
          type="button"
          onClick={() => setFiltroCategoria('por_confirmar')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
            filtroCategoria === 'por_confirmar'
              ? 'bg-electric-blue text-white shadow-sm'
              : 'bg-white text-secondary border border-border-subtle'
          }`}
        >
          <span>Por Confirmar</span>
          <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
            {porConfirmarCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFiltroCategoria('urgencias')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            filtroCategoria === 'urgencias'
              ? 'bg-status-danger text-white shadow-sm'
              : 'bg-white text-secondary border border-border-subtle'
          }`}
        >
          🚨 Dolor / Urgencias
        </button>
      </div>

      {/* 6. Lista de Tarjetas de Citas por Aprobar */}
      <div className="space-y-3">
        {solicitudesFiltradas.map((sol) => (
          <div
            key={sol.id}
            className={`bg-surface-clean-white rounded-2xl p-4 shadow-sm border relative overflow-hidden transition-all ${
              sol.tipo === 'urgencia'
                ? 'border-status-danger/30 ring-1 ring-status-danger/10'
                : 'border-border-subtle'
            }`}
          >
            {/* Barra lateral indicadora de color */}
            <div
              className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                sol.tipo === 'urgencia'
                  ? 'bg-status-danger'
                  : sol.estado === 'confirmada'
                  ? 'bg-status-success'
                  : 'bg-electric-blue'
              }`}
            />

            {/* Badges superiores: Tipo, Origen y Tiempo */}
            <div className="flex items-center justify-between gap-1 mb-2 pl-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {sol.tipo === 'urgencia' && (
                  <span className="px-2 py-0.5 rounded-full bg-status-danger/10 text-status-danger text-[10px] font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-danger animate-ping" />
                    🚨 Urgencia Dental
                  </span>
                )}
                {sol.tipo === 'control' && (
                  <span className="px-2 py-0.5 rounded-full bg-electric-blue/10 text-electric-blue text-[10px] font-bold">
                    Control Ortodoncia
                  </span>
                )}
                {sol.tipo === 'nuevo' && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    Paciente Nuevo
                  </span>
                )}
                {sol.tipo === 'espera' && (
                  <span className="px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning text-[10px] font-bold">
                    En Lista de Espera
                  </span>
                )}

                <span className="text-[10px] text-secondary">
                  {sol.tiempoTranscurrido}
                </span>
              </div>

              {/* Origen Tag */}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-subtle-ice text-secondary font-medium shrink-0 border border-border-subtle/60">
                {sol.origen === 'web' && '🌐 Web Móvil'}
                {sol.origen === 'chatbot' && '🤖 VictorIA Chat'}
                {sol.origen === 'whatsapp' && '💬 WhatsApp'}
              </span>
            </div>

            {/* Info Paciente */}
            <div className="flex items-center gap-3 pl-1">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-extrabold text-sm shrink-0 shadow-sm ${
                  sol.tipo === 'urgencia'
                    ? 'bg-status-danger/10 text-status-danger'
                    : 'bg-surface-container text-primary'
                }`}
              >
                {sol.pacienteNombre.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-dental-deep-navy truncate">
                    {sol.pacienteNombre}
                  </h3>
                  <span className="text-[11px] font-mono text-secondary shrink-0">
                    {sol.pacienteCedula}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-0.5 line-clamp-1">
                  {sol.motivo}
                </p>
              </div>
            </div>

            {/* Horario y Box Asignado */}
            <div className="mt-3 pt-2.5 border-t border-border-subtle/60 flex items-center justify-between text-xs pl-1">
              <div className="flex items-center gap-1.5 font-bold text-dental-deep-navy">
                <span className="material-symbols-outlined text-[16px] text-electric-blue">
                  schedule
                </span>
                <span>{sol.fechaTexto}, {sol.horaTexto}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-surface-subtle-ice text-dental-deep-navy font-bold text-[10px] border border-border-subtle">
                Sillón Box 0{sol.boxSugerido}
              </span>
            </div>

            {/* Profesional y Nota de Sobrecupo si aplica */}
            <div className="mt-1.5 pl-1 flex items-center justify-between text-[11px] text-secondary">
              <span>Sugerido: <strong className="text-dental-deep-navy">{sol.doctorSugerido}</strong></span>
              <span className={sol.estado === 'confirmada' ? 'text-status-success font-bold' : 'text-status-warning font-bold'}>
                {sol.estado === 'confirmada' ? 'Validada en Agenda' : 'Pendiente Validación'}
              </span>
            </div>

            {/* Nota de recepción especial */}
            {sol.notaRecepcion && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-status-warning/10 border border-status-warning/20 text-xs text-dental-deep-navy pl-1">
                <p className="font-semibold text-[11px] text-status-warning flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">edit_note</span>
                  Nota de Recepción:
                </p>
                <p className="text-[11px] text-secondary mt-0.5 leading-relaxed">
                  {sol.notaRecepcion}
                </p>
              </div>
            )}

            {/* Acciones de Operatividad Rápida (1-toque) */}
            <div className="mt-3 pt-2.5 border-t border-border-subtle/60 flex items-center gap-2 pl-1">
              {sol.estado === 'por_confirmar' ? (
                <button
                  type="button"
                  onClick={() => handleAprobarCita(sol.id, sol.pacienteNombre)}
                  className="flex-1 py-2 px-3 rounded-xl bg-electric-blue hover:bg-primary text-white text-xs font-bold transition-all shadow-[0_2px_8px_rgba(0,132,255,0.3)] active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Aprobar Cita</span>
                </button>
              ) : (
                <div className="flex-1 py-2 px-3 rounded-xl bg-status-success/10 text-status-success text-xs font-bold text-center border border-status-success/20 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Cita Confirmada</span>
                </div>
              )}

              {/* Botón WhatsApp con mensaje preparado */}
              <button
                type="button"
                onClick={() => abrirWhatsApp(sol)}
                className="py-2 px-3 rounded-xl bg-status-success/10 hover:bg-status-success/20 text-status-success text-xs font-bold transition-all border border-status-success/20 flex items-center justify-center gap-1 active:scale-95"
                title="Contactar por WhatsApp"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              {/* Botón Llamada */}
              <a
                href={`tel:${sol.pacienteTelefono}`}
                className="w-9 h-9 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-secondary hover:text-dental-deep-navy flex items-center justify-center transition-all active:scale-95 shrink-0"
                title="Llamar al paciente"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 7. Barra Flotante de Aprobación en Bloque (Bottom Floating Bar de Stitch) */}
      {porConfirmarCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-dental-deep-navy text-white rounded-2xl p-3 shadow-[0_8px_24px_rgba(15,43,72,0.35)] border border-white/10 flex items-center justify-between gap-3 animate-in slide-in-from-bottom max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-electric-blue/20 text-vibrant-cyan flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">checklist</span>
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {porConfirmarCount} citas pre-validadas
              </p>
              <p className="text-[10px] text-white/60 truncate">
                Listas para incorporar a agenda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAprobarLote}
              className="px-3.5 py-2 rounded-xl bg-electric-blue hover:bg-white hover:text-dental-deep-navy text-white text-xs font-bold transition-all active:scale-95 shadow-md flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              <span>Aprobar ({porConfirmarCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab?.('reserva')}
              title="Registrar Cita Nueva Manualmente"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95 border border-white/10"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
