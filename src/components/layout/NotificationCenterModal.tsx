import React, { useState } from 'react';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { TabId } from './BottomNavigation';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: TabId) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    tasaBcv,
    tasaInfo,
    isRefreshing,
    notificaciones,
    actualizarTasaEnLinea,
    fijarTasaManual,
    restaurarTasaAutomatica,
    marcarNotificacionesLeidas,
  } = useTasaCambio();

  const [modoEdicionTasa, setModoEdicionTasa] = useState(false);
  const [tasaManualInput, setTasaManualInput] = useState(tasaBcv.toString());
  const [motivoManual, setMotivoManual] = useState('Ajuste de Caja');

  if (!isOpen) return null;

  const handleGuardarManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(tasaManualInput);
    if (num > 0) {
      await fijarTasaManual(num, motivoManual);
      setModoEdicionTasa(false);
    }
  };

  const handleRestaurar = async () => {
    await restaurarTasaAutomatica();
    setModoEdicionTasa(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-dental-deep-navy/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-surface-clean-white rounded-3xl shadow-[0_20px_50px_rgba(15,43,72,0.25)] border border-border-subtle overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-center-title"
      >
        {/* Cabecera del Centro de Notificaciones */}
        <div className="px-5 py-4 bg-gradient-to-r from-surface-clean-white to-surface-subtle-ice border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div>
              <h3
                id="notification-center-title"
                className="font-display font-extrabold text-sm text-dental-deep-navy"
              >
                Avisos y Notificaciones
              </h3>
              <p className="text-[11px] text-secondary">OdontoSalud Multisede en Vivo</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={marcarNotificacionesLeidas}
              className="px-2 py-1 text-[11px] font-bold text-electric-blue hover:bg-electric-blue/10 rounded-lg transition-colors"
              title="Marcar como leídas"
            >
              Leídas
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Tarjeta Destacada: Estado en Vivo de la Tasa BCV */}
        <div className="p-4 bg-gradient-to-br from-dental-deep-navy via-primary to-dental-deep-navy text-white relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-secondary-fixed-dim">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-white">
                {tasaInfo?.esManual ? 'Tasa BCV (Manual)' : 'Tasa Oficial BCV en Línea'}
              </span>
            </div>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold text-vibrant-cyan">
              {tasaInfo?.origen === 'live_network'
                ? 'Conexión Directa'
                : tasaInfo?.origen === 'manual_override'
                  ? 'Fijada en Caja'
                  : 'Caché D1 Respaldo'}
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <span className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
                {Number(tasaBcv).toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{' '}
                <span className="text-xs font-bold text-vibrant-cyan">Bs / USD</span>
              </span>
              <p className="text-[10px] text-white/75 mt-0.5">
                Fuente: {tasaInfo?.fuente || 'Banco Central de Venezuela'}
              </p>
            </div>

            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => actualizarTasaEnLinea(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              title="Sincronizar tasa oficial en vivo con el BCV"
            >
              <span
                className={`material-symbols-outlined text-[15px] ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              >
                refresh
              </span>
              <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[10px]">
            <span className="text-white/70">
              Vigencia:{' '}
              {tasaInfo?.fechaActualizacion
                ? new Date(tasaInfo.fechaActualizacion).toLocaleDateString('es-VE')
                : 'Jornada Actual'}
            </span>

            <button
              type="button"
              onClick={() => setModoEdicionTasa(!modoEdicionTasa)}
              className="text-vibrant-cyan font-bold hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[13px]">
                {modoEdicionTasa ? 'expand_less' : 'tune'}
              </span>
              <span>{modoEdicionTasa ? 'Cerrar Ajuste' : 'Ajustar Manualmente'}</span>
            </button>
          </div>

          {/* Formulario Desplegable para Ajuste Manual de Tasa en Caja */}
          {modoEdicionTasa && (
            <form
              onSubmit={handleGuardarManual}
              className="mt-3 p-3 bg-surface-clean-white rounded-2xl text-dental-deep-navy flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold">Fijar Tasa Personalizada</span>
                {tasaInfo?.esManual && (
                  <button
                    type="button"
                    onClick={handleRestaurar}
                    className="text-[10px] text-electric-blue font-bold hover:underline"
                  >
                    Restaurar a BCV Automático
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-secondary block">
                    Nueva Tasa (Bs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={tasaManualInput}
                    onChange={(e) => setTasaManualInput(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-subtle-ice border border-border-subtle text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-secondary block">Motivo</label>
                  <input
                    type="text"
                    value={motivoManual}
                    onChange={(e) => setMotivoManual(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-subtle-ice border border-border-subtle text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setModoEdicionTasa(false)}
                  className="px-2.5 py-1 text-xs text-secondary font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-dental-deep-navy transition-colors"
                >
                  Guardar Tasa
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Lista de Notificaciones y Alertas Clínicas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-border-subtle/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-secondary px-1">
            Historial de Avisos de la Sesión
          </div>

          {notificaciones.map((n) => (
            <div
              key={n.id}
              className={`pt-2.5 first:pt-0 p-2 rounded-2xl transition-all ${
                !n.leido
                  ? 'bg-surface-subtle-ice/70 border border-electric-blue/20'
                  : 'hover:bg-surface-subtle-ice/30'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                    n.tipo === 'tasa_bcv'
                      ? 'bg-status-success/15 text-status-success'
                      : n.tipo === 'cita_triaje'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-status-warning/15 text-status-warning'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {n.tipo === 'tasa_bcv'
                      ? 'currency_exchange'
                      : n.tipo === 'cita_triaje'
                        ? 'assignment_ind'
                        : 'notifications'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-xs text-dental-deep-navy truncate leading-tight">
                      {n.titulo}
                    </h4>
                    <span className="text-[10px] text-secondary shrink-0">{n.timestamp}</span>
                  </div>

                  <p className="text-[11px] text-secondary mt-0.5 leading-relaxed">{n.mensaje}</p>

                  {n.accionTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateTab?.(n.accionTab!);
                        onClose();
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-electric-blue hover:text-dental-deep-navy transition-colors"
                    >
                      <span>
                        {n.accionTab === 'coordinacion'
                          ? '👉 Ir a Coordinación de Citas'
                          : '👉 Ir a Caja / Cobros'}
                      </span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pie de modal */}
        <div className="p-3 bg-surface-subtle-ice border-t border-border-subtle text-center">
          <p className="text-[10px] text-secondary">
            Sistema OdontoSaludLV 4.0 • Sincronización en tiempo real
          </p>
        </div>
      </div>
    </div>
  );
};
