import React, { useState, useEffect, useMemo } from 'react';
import { useSede, SEDES_DISPONIBLES } from '../../context/SedeContext';
import { SedeId } from '../../types/clinical';

interface PortalReservaAdminCardProps {
  className?: string;
}

export const PortalReservaAdminCard: React.FC<PortalReservaAdminCardProps> = ({ className = '' }) => {
  const { sedeActiva, sedeId } = useSede();

  // Sede objetivo seleccionada para la difusión del portal
  const [targetSede, setTargetSede] = useState<SedeId | 'todas'>((sedeId as SedeId) || 'victoria');

  // Control de visibilidad del visualizador del Código QR
  const [mostrarQrGrande, setMostrarQrGrande] = useState<boolean>(false);

  // Estados de retroalimentación de copiado
  const [copiadoTexto, setCopiadoTexto] = useState<boolean>(false);
  const [copiadoEnlace, setCopiadoEnlace] = useState<boolean>(false);

  // URL del portal de reserva calculada dinámicamente según el host y la sede seleccionada
  const urlReserva = useMemo(() => {
    if (typeof window === 'undefined') return 'https://odontosaludlv.com/#reserva';
    const origin = window.location.origin || 'http://localhost:3000';
    const pathname = window.location.pathname || '/';
    const baseUrl = `${origin}${pathname}#reserva`;
    const params = new URLSearchParams();
    if (targetSede !== 'todas') {
      params.set('sede', targetSede);
    }
    params.set('src', 'wa');
    return `${baseUrl}?${params.toString()}`;
  }, [targetSede]);

  // Plantilla predeterminada según la sede
  const getPlantillaPredeterminada = (sede: SedeId | 'todas', url: string): string => {
    const sedeTexto =
      sede === 'victoria'
        ? 'Sede La Victoria (C.C. Márquez del Toro)'
        : sede === 'tovar'
        ? 'Sede La Colonia Tovar (C.C. San Martín de Tours)'
        : 'Sedes La Victoria y Colonia Tovar';

    return (
      `🦷 *ODONTOSALUD - RESERVA TU CITA ODONTOLÓGICA EN LÍNEA*\n\n` +
      `¡Hola! Te compartimos el portal oficial para agendar tu consulta y tratamiento dental en ${sedeTexto} sin intermediarios:\n\n` +
      `👉 *Ingresa y reserva aquí:* ${url}\n\n` +
      `✨ *Elige tu odontólogo favorito, procedimiento y turno en menos de 2 minutos.* Al finalizar recibirás tu Comprobante Digital con Código QR para recepción inmediata.`
    );
  };

  // Mensaje editable por el odontólogo o recepcionista
  const [mensajePersonalizado, setMensajePersonalizado] = useState<string>(() =>
    getPlantillaPredeterminada(targetSede, urlReserva)
  );

  // Al cambiar la sede objetivo, actualizar el enlace dentro del mensaje manteniendo la coherencia
  useEffect(() => {
    setMensajePersonalizado(getPlantillaPredeterminada(targetSede, urlReserva));
  }, [targetSede, urlReserva]);

  // Restablecer el mensaje a su plantilla base
  const handleRestablecerMensaje = () => {
    setMensajePersonalizado(getPlantillaPredeterminada(targetSede, urlReserva));
  };

  // Copiar el mensaje completo al portapapeles
  const handleCopiarMensaje = async () => {
    try {
      await navigator.clipboard.writeText(mensajePersonalizado);
      setCopiadoTexto(true);
      setTimeout(() => setCopiadoTexto(false), 3000);
    } catch {
      prompt('Copia el mensaje para WhatsApp:', mensajePersonalizado);
    }
  };

  // Copiar solo el enlace de reserva al portapapeles
  const handleCopiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(urlReserva);
      setCopiadoEnlace(true);
      setTimeout(() => setCopiadoEnlace(false), 3000);
    } catch {
      prompt('Copia el enlace de reserva oficial:', urlReserva);
    }
  };

  // Enviar el mensaje editado por WhatsApp
  const handleEnviarWhatsApp = () => {
    const textoCodificado = encodeURIComponent(mensajePersonalizado);
    window.open(`https://api.whatsapp.com/send?text=${textoCodificado}`, '_blank');
  };

  // Generador de imagen QR nítida en cliente
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    urlReserva
  )}&margin=6`;

  return (
    <section
      className={`bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-3.5 relative overflow-hidden ${className}`}
    >
      {/* Barra superior con gradiente de identidad institucional */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-dental-deep-navy" />

      {/* Cabecera del Panel Administrativo de Difusión */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border-subtle/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-2xs shrink-0">
            <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.2 rounded-md bg-emerald-100/80 text-emerald-900 font-extrabold text-[9px] uppercase tracking-wider">
                Control de Difusión
              </span>
              <span className="text-[10px] text-secondary font-semibold">• Solo Odontólogos</span>
            </div>
            <h3 className="font-display font-extrabold text-sm sm:text-base text-dental-deep-navy leading-tight truncate mt-0.5">
              Portal Oficial de Reserva (QR & WhatsApp)
            </h3>
          </div>
        </div>

        {/* Pestañas de Selección de Sede para Difusión */}
        <div className="flex items-center gap-1 bg-surface-subtle-ice p-1 rounded-xl border border-border-subtle/80 text-[10px] font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTargetSede('victoria')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              targetSede === 'victoria'
                ? 'bg-dental-deep-navy text-white shadow-2xs'
                : 'text-secondary hover:text-dental-deep-navy'
            }`}
          >
            La Victoria
          </button>
          <button
            type="button"
            onClick={() => setTargetSede('tovar')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              targetSede === 'tovar'
                ? 'bg-dental-deep-navy text-white shadow-2xs'
                : 'text-secondary hover:text-dental-deep-navy'
            }`}
          >
            Colonia Tovar
          </button>
          <button
            type="button"
            onClick={() => setTargetSede('todas')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              targetSede === 'todas'
                ? 'bg-dental-deep-navy text-white shadow-2xs'
                : 'text-secondary hover:text-dental-deep-navy'
            }`}
          >
            Ambas Sedes
          </button>
        </div>
      </div>

      <p className="text-[11px] text-secondary leading-snug">
        Administra y envía el enlace oficial o muestra el código QR a los pacientes en consultorio para que agenden sus citas sin llamadas ni demoras.
      </p>

      {/* Visor Interactivo y Editable del Mensaje de WhatsApp */}
      <div className="flex flex-col gap-1.5 bg-[#FAF8FB] rounded-2xl border border-border-subtle/90 p-3 shadow-inner">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-wider text-dental-deep-navy flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-emerald-600">edit_note</span>
            <span>Mensaje de WhatsApp a Enviar (Editable)</span>
          </label>
          <button
            type="button"
            onClick={handleRestablecerMensaje}
            className="text-[9.5px] font-bold text-secondary hover:text-primary transition-colors flex items-center gap-0.5 cursor-pointer"
            title="Restablecer al formato predeterminado"
          >
            <span className="material-symbols-outlined text-[11px]">restart_alt</span>
            <span>Restablecer</span>
          </button>
        </div>

        <textarea
          rows={5}
          value={mensajePersonalizado}
          onChange={(e) => setMensajePersonalizado(e.target.value)}
          className="w-full text-xs font-sans text-dental-deep-navy bg-white border border-border-subtle rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-y leading-relaxed shadow-2xs"
          placeholder="Escribe o personaliza el mensaje de WhatsApp..."
        />

        {/* Barra de enlace directo y copiado rápido */}
        <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-secondary">
          <span className="truncate font-mono text-[9.5px] text-secondary/80 select-all">
            {urlReserva}
          </span>
          <button
            type="button"
            onClick={handleCopiarEnlace}
            className="text-[9.5px] font-bold text-primary hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[12px]">link</span>
            <span>{copiadoEnlace ? '¡Enlace copiado!' : 'Copiar sólo enlace'}</span>
          </button>
        </div>
      </div>

      {/* Visualizador Desplegable del Código QR Oficial */}
      {mostrarQrGrande && (
        <div className="w-full bg-white rounded-2xl border-2 border-dashed border-emerald-400/80 p-3.5 flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between w-full px-1 border-b border-border-subtle/60 pb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Código QR para Pantalla o Mostrador
            </span>
            <span className="text-[9px] font-mono text-secondary">
              {targetSede === 'victoria' ? 'Sede La Victoria' : targetSede === 'tovar' ? 'Sede Colonia Tovar' : 'Red General'}
            </span>
          </div>

          <div className="p-2.5 bg-white rounded-2xl border border-border-subtle shadow-xs">
            <img
              src={qrImageUrl}
              alt="Código QR de Reserva OdontoSalud"
              className="w-44 h-44 object-contain"
            />
          </div>

          <p className="text-[10px] text-secondary text-center px-4 leading-tight">
            Indica al paciente que apunte con la cámara de su teléfono móvil a este código para ingresar directamente al portal de reserva.
          </p>
        </div>
      )}

      {/* Fila de Botones de Acción de Alto Rendimiento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
        {/* Botón 1: Enviar por WhatsApp con el mensaje editado */}
        <button
          type="button"
          onClick={handleEnviarWhatsApp}
          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          title="Abrir WhatsApp para enviar este mensaje editado a un paciente"
        >
          <span className="material-symbols-outlined text-[17px]">send</span>
          <span className="truncate">Enviar por WhatsApp</span>
        </button>

        {/* Botón 2: Copiar Mensaje Completo */}
        <button
          type="button"
          onClick={handleCopiarMensaje}
          className="py-2.5 px-3 rounded-xl bg-surface-subtle-ice hover:bg-surface-container text-dental-deep-navy font-bold text-xs border border-border-subtle shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          title="Copiar todo el texto editado para pegarlo en WhatsApp Web u otra app"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">
            {copiadoTexto ? 'done' : 'content_copy'}
          </span>
          <span className="truncate">{copiadoTexto ? '¡Mensaje Copiado!' : 'Copiar Mensaje'}</span>
        </button>

        {/* Botón 3: Alternar Visualización del Código QR */}
        <button
          type="button"
          onClick={() => setMostrarQrGrande((prev) => !prev)}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs border shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
            mostrarQrGrande
              ? 'bg-dental-deep-navy text-white border-dental-deep-navy'
              : 'bg-white hover:bg-slate-50 text-dental-deep-navy border-emerald-300'
          }`}
          title="Mostrar u ocultar el código QR oficial en pantalla"
        >
          <span className="material-symbols-outlined text-[16px] text-emerald-600">
            {mostrarQrGrande ? 'visibility_off' : 'qr_code'}
          </span>
          <span className="truncate">{mostrarQrGrande ? 'Ocultar QR' : 'Visualizar QR'}</span>
        </button>
      </div>
    </section>
  );
};
