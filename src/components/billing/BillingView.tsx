import React, { useState } from 'react';
import { useSede } from '../../context/SedeContext';
import { ApiClient } from '../../services/api';

export const BillingView: React.FC = () => {
  const { sedeActiva, sedeId } = useSede();
  const tasaBcv = 49.85;

  const [montoUsd, setMontoUsd] = useState<number>(120);
  const [metodo, setMetodo] = useState<'pago_movil' | 'divisas_efectivo' | 'zelle' | 'punto_venta'>(
    'pago_movil'
  );
  const [referencia, setReferencia] = useState('PM-882910');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reciboModal, setReciboModal] = useState<string | null>(null);

  const montoBs = (montoUsd * tasaBcv).toFixed(2);

  const presupuestosMock = [
    {
      id: 'pr-1',
      codigo: 'PR-8821',
      paciente: 'Carlos Mendoza',
      procedimiento: 'Endodoncia Molar #16 + Perno y Corona',
      totalUsd: 280,
      abonadoUsd: 140,
      estado: 'aprobado_parcial',
    },
    {
      id: 'pr-2',
      codigo: 'PR-8822',
      paciente: 'Patricia Velásquez',
      procedimiento: 'Profilaxis Profunda + Resina Fotocurado #24',
      totalUsd: 120,
      abonadoUsd: 0,
      estado: 'en_espera',
    },
    {
      id: 'pr-3',
      codigo: 'PR-8823',
      paciente: 'Marcos Ramos',
      procedimiento: 'Tratamiento Ortodoncia Brackets MBT Mensualidad #4',
      totalUsd: 60,
      abonadoUsd: 60,
      estado: 'pagado',
    },
  ];

  const handleCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const res = await ApiClient.registrarCobro(
        {
          presupuestoId: 'pr-2',
          montoUsd,
          metodo,
          referencia,
          tasaBcv,
        },
        sedeId
      );

      setReciboModal(res.reciboId);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Resumen Financiero Hero */}
      <div className="bg-gradient-to-br from-dental-deep-navy to-primary rounded-2xl p-4 text-surface-clean-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-secondary-fixed-dim">
          <span>Control de Caja • {sedeActiva.nombre}</span>
          <span className="bg-surface-clean-white/20 px-2 py-0.5 rounded-full font-bold">
            Tasa BCV: {tasaBcv} Bs/$
          </span>
        </div>

        <div className="mt-3">
          <span className="text-[11px] text-tertiary-fixed uppercase tracking-wider font-bold">
            Cobrado en Jornada Hoy
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-display font-extrabold text-3xl">$680.00</span>
            <span className="text-xs text-tertiary-fixed-dim">
              ≈ {(680 * tasaBcv).toLocaleString()} Bs.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-surface-clean-white/15 text-xs">
          <div>
            <span className="text-secondary-fixed-dim block text-[10px]">Efectivo Divisas</span>
            <span className="font-bold text-sm">$350.00</span>
          </div>
          <div>
            <span className="text-secondary-fixed-dim block text-[10px]">Pago Móvil / Zelle</span>
            <span className="font-bold text-sm">$330.00</span>
          </div>
        </div>
      </div>

      {/* Formulario Deslizable de Conciliación de Cobro */}
      <form
        onSubmit={handleCobro}
        className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-dental-deep-navy">
            Registrar Cobro en Box
          </h3>
          <span className="text-xs text-primary font-bold bg-primary-fixed/30 px-2.5 py-0.5 rounded-full">
            Conciliación Inmediata
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy">Monto en Divisas (USD)</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-secondary text-sm font-bold">$</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={montoUsd}
                onChange={(e) => setMontoUsd(parseFloat(e.target.value) || 0)}
                className="w-full h-11 pl-7 pr-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dental-deep-navy">Equivalente Oficial (Bs.)</label>
            <input
              type="text"
              readOnly
              value={`${montoBs} Bs.`}
              className="w-full h-11 px-3 rounded-xl bg-surface-container border border-border-subtle text-xs font-bold text-dental-deep-navy focus:outline-none"
            />
          </div>
        </div>

        {/* Selector de Método de Pago */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-dental-deep-navy">Método de Pago</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'pago_movil', label: 'Pago Móvil', icon: 'smartphone' },
              { id: 'divisas_efectivo', label: 'Efectivo USD', icon: 'payments' },
              { id: 'zelle', label: 'Zelle', icon: 'account_balance' },
              { id: 'punto_venta', label: 'Punto de Venta', icon: 'credit_card' },
            ].map((m) => {
              const isSelected = metodo === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetodo(m.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-primary text-surface-clean-white border-primary shadow-sm'
                      : 'bg-surface-clean-white border-border-subtle text-dental-deep-navy hover:bg-surface-subtle-ice'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Referencia o Comprobante */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-dental-deep-navy">Número de Referencia</label>
          <input
            type="text"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Últimos 6 dígitos o serial..."
            className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full mt-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-status-success to-primary text-surface-clean-white font-bold text-xs shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          {isProcessing ? 'Registrando en D1...' : 'Registrar Pago y Emitir Recibo'}
        </button>
      </form>

      {/* Lista de Presupuestos Activos */}
      <div className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-dental-deep-navy">
            Presupuestos Clínicos Recientes
          </h3>
          <span className="text-xs text-secondary">{presupuestosMock.length} registrados</span>
        </div>

        <div className="space-y-2.5">
          {presupuestosMock.map((p) => {
            const porcentaje = Math.round((p.abonadoUsd / p.totalUsd) * 100);
            return (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-dental-deep-navy block">
                      {p.paciente}
                    </span>
                    <span className="text-[10px] text-secondary">{p.codigo}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-dental-deep-navy">
                      ${p.totalUsd} USD
                    </span>
                    <span className="text-[10px] text-status-success block">
                      Abonado: ${p.abonadoUsd}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-secondary line-clamp-1">{p.procedimiento}</p>

                {/* Barra de Progreso Financiero */}
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-electric-blue to-status-success rounded-full transition-all"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Recibo Generado */}
      {reciboModal && (
        <div className="fixed inset-0 z-50 bg-dental-deep-navy/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-clean-white w-full max-w-sm rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-status-success/15 text-status-success flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-dental-deep-navy">
                ¡Pago Conciliado Exitosamente!
              </h4>
              <p className="text-xs text-secondary mt-1">
                Recibo #{reciboModal} emitido para {sedeActiva.nombre}.
              </p>
            </div>

            <div className="w-full bg-surface-subtle-ice p-3 rounded-xl text-xs space-y-1 text-left border border-border-subtle">
              <div className="flex justify-between">
                <span className="text-secondary">Monto USD:</span>
                <span className="font-bold text-dental-deep-navy">${montoUsd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Monto Bs:</span>
                <span className="font-bold text-dental-deep-navy">{montoBs} Bs.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Método:</span>
                <span className="font-bold text-dental-deep-navy uppercase">{metodo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Referencia:</span>
                <span className="font-bold text-dental-deep-navy">{referencia}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReciboModal(null)}
              className="w-full py-3 rounded-xl bg-primary text-surface-clean-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              Aceptar y Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
