import React, { useState, useEffect } from 'react';
import { useSede } from '../../context/SedeContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { ApiClient } from '../../services/api';
import { TratamientoRealizadoItem, OdontologoItem } from '../../types/clinical';

export const BillingView: React.FC = () => {
  const { sedeActiva, sedeId } = useSede();
  const { tasaBcv, tasaInfo, isRefreshing, actualizarTasaEnLinea } = useTasaCambio();

  // Pestañas principales de la vista
  const [activeTab, setActiveTab] = useState<'cobros' | 'honorarios'>('cobros');

  // Estado para Cobros en Box
  const [montoUsd, setMontoUsd] = useState<number>(120);
  const [metodo, setMetodo] = useState<'pago_movil' | 'divisas_efectivo' | 'zelle' | 'punto_venta'>(
    'pago_movil'
  );
  const [referencia, setReferencia] = useState('PM-882910');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reciboModal, setReciboModal] = useState<string | null>(null);

  // Estado para Liquidación de Honorarios a Odontólogos
  const [odontologos, setOdontologos] = useState<OdontologoItem[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('todos');
  const [tratamientosHonorarios, setTratamientosHonorarios] = useState<TratamientoRealizadoItem[]>([]);
  const [filtroEstadoHonorarios, setFiltroEstadoHonorarios] = useState<'todos' | 'pendiente' | 'liquidado'>('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLiquidating, setIsLiquidating] = useState<boolean>(false);
  const [modalLiquidacion, setModalLiquidacion] = useState<boolean>(false);
  const [refLiquidacionInput, setRefLiquidacionInput] = useState<string>('');
  const [mensajeExitoHonorarios, setMensajeExitoHonorarios] = useState<string | null>(null);

  const montoBs = (montoUsd * tasaBcv).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Cargar datos de odontólogos y tratamientos de Cloudflare D1
  const cargarDatosHonorarios = async () => {
    try {
      const data = await ApiClient.getControlData();
      if (data?.odontologos) {
        setOdontologos(data.odontologos);
      }

      if (selectedDoctorId && selectedDoctorId !== 'todos') {
        const res = await ApiClient.getTratamientosRealizadosOdontologo(selectedDoctorId);
        if (res.success) {
          setTratamientosHonorarios(res.tratamientos);
        }
      } else {
        const res = await ApiClient.getTratamientosRealizados({ sedeId });
        if (res.success) {
          setTratamientosHonorarios(res.tratamientos);
        }
      }
    } catch (err) {
      console.error('Error cargando honorarios:', err);
    }
  };

  useEffect(() => {
    cargarDatosHonorarios();
  }, [selectedDoctorId, sedeId]);

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

  // Filtrado de tratamientos para honorarios
  const tratamientosFiltrados = tratamientosHonorarios.filter((t) => {
    if (selectedDoctorId !== 'todos' && t.odontologoId !== selectedDoctorId) return false;
    if (filtroEstadoHonorarios !== 'todos' && t.estadoPagoHonorario !== filtroEstadoHonorarios) return false;
    return true;
  });

  const totalProduccionFiltradaUsd = tratamientosFiltrados.reduce((acc, t) => acc + (t.costoTotalUsd || 0), 0);
  const totalHonorariosPendientesFiltradosUsd = tratamientosFiltrados
    .filter((t) => t.estadoPagoHonorario === 'pendiente')
    .reduce((acc, t) => acc + (t.montoHonorarioUsd || 0), 0);
  const totalHonorariosLiquidadosFiltradosUsd = tratamientosFiltrados
    .filter((t) => t.estadoPagoHonorario === 'liquidado')
    .reduce((acc, t) => acc + (t.montoHonorarioUsd || 0), 0);

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const seleccionarTodosPendientes = () => {
    const pendientes = tratamientosFiltrados
      .filter((t) => t.estadoPagoHonorario === 'pendiente')
      .map((t) => t.id);
    setSelectedIds(pendientes);
  };

  const ejecutarLiquidacionLote = async () => {
    if (selectedIds.length === 0) return;
    setIsLiquidating(true);

    const ref = refLiquidacionInput.trim() || `LIQ-${Date.now().toString().slice(-6)}`;
    try {
      const res = await ApiClient.liquidarHonorariosLote({
        ids: selectedIds,
        referencia: ref,
      });

      if (res.success) {
        setMensajeExitoHonorarios(`¡Se liquidaron exitosamente ${res.liquidados} honorarios con ref: ${res.referencia}!`);
        setSelectedIds([]);
        setModalLiquidacion(false);
        await cargarDatosHonorarios();
        setTimeout(() => setMensajeExitoHonorarios(null), 5000);
      }
    } catch (err) {
      console.error('Error al liquidar:', err);
    } finally {
      setIsLiquidating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-28">
      {/* Resumen Financiero Hero */}
      <div className="bg-dental-deep-navy rounded-2xl p-4 text-surface-clean-white shadow-md relative overflow-hidden border border-primary">
        <div className="flex items-center justify-between text-xs text-surface-container">
          <span>Control Financiero & Honorarios • {sedeActiva.nombre}</span>
          <button
            type="button"
            onClick={() => actualizarTasaEnLinea(true)}
            className="inline-flex items-center gap-1 bg-primary hover:bg-white hover:text-dental-deep-navy text-white px-2.5 py-0.5 rounded-full font-bold transition-all text-[11px] active:scale-95 border border-border-subtle/30"
            title="Actualizar tasa oficial en vivo con el BCV"
          >
            <span className={`material-symbols-outlined text-[13px] ${isRefreshing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>Tasa BCV: {Number(tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/$</span>
            <span className="text-[9px] text-surface-container uppercase font-extrabold">
              {tasaInfo?.esManual ? 'Manual' : 'Oficial'}
            </span>
          </button>
        </div>

        <div className="mt-3">
          <span className="text-[11px] text-surface-container uppercase tracking-wider font-bold">
            Cobrado en Jornada Hoy
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-display font-extrabold text-3xl text-white">$680.00</span>
            <span className="text-xs text-surface-container">
              ≈ {(680 * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-primary text-xs">
          <div>
            <span className="text-surface-container block text-[10px]">Efectivo Divisas</span>
            <span className="font-bold text-sm text-white">$350.00</span>
          </div>
          <div>
            <span className="text-surface-container block text-[10px]">Pago Móvil / Zelle</span>
            <span className="font-bold text-sm text-white">$330.00</span>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas Segmentado */}
      <div className="bg-surface-clean-white p-1.5 rounded-2xl border border-border-subtle shadow-xs grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('cobros')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
            activeTab === 'cobros'
              ? 'bg-primary text-white shadow-sm'
              : 'text-dental-deep-navy hover:bg-surface-subtle-ice'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>Cobros en Box & Recibos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('honorarios')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
            activeTab === 'honorarios'
              ? 'bg-primary text-white shadow-sm'
              : 'text-dental-deep-navy hover:bg-surface-subtle-ice'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          <span>Liquidación de Honorarios</span>
        </button>
      </div>

      {/* =========================================================================
          PESTAÑA 1: COBROS EN BOX Y PRESUPUESTOS
         ========================================================================= */}
      {activeTab === 'cobros' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Formulario Deslizable de Conciliación de Cobro */}
          <form
            onSubmit={handleCobro}
            className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-dental-deep-navy">
                Registrar Cobro en Box
              </h3>
              <span className="text-xs text-dental-deep-navy font-bold bg-surface-container px-2.5 py-0.5 rounded-full">
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
              className="w-full mt-1 py-3.5 px-4 rounded-xl bg-primary hover:bg-dental-deep-navy text-surface-clean-white font-bold text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 2: LIQUIDACIÓN DE HONORARIOS A ODONTÓLOGOS (CLOUDFLARE D1)
         ========================================================================= */}
      {activeTab === 'honorarios' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Notificación de Éxito */}
          {mensajeExitoHonorarios && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
              <span>{mensajeExitoHonorarios}</span>
            </div>
          )}

          {/* Tarjeta de Control y Selección de Odontólogo */}
          <div className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                  Honorarios Profesionales
                </h3>
                <p className="text-xs text-secondary">
                  Tratamientos realizados y comisiones calculadas en Cloudflare D1
                </p>
              </div>

              {/* Selector de Facultativo */}
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              >
                <option value="todos">Todos los Odontólogos del Staff</option>
                {odontologos.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.nombres} ({doc.porcentajeHonorarios}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Métricas de Honorarios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border-subtle">
              <div className="p-3 rounded-xl bg-surface-subtle-ice border border-border-subtle">
                <span className="text-[10px] font-bold text-secondary uppercase block">Producción Total</span>
                <span className="font-display font-extrabold text-lg text-dental-deep-navy">
                  ${totalProduccionFiltradaUsd.toFixed(2)} USD
                </span>
                <span className="text-[10px] text-secondary block mt-0.5">
                  {tratamientosFiltrados.length} procedimientos registrados
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Pendiente por Liquidar</span>
                <span className="font-display font-extrabold text-lg text-amber-900">
                  ${totalHonorariosPendientesFiltradosUsd.toFixed(2)} USD
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                  ≈ {(totalHonorariosPendientesFiltradosUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Ya Liquidado</span>
                <span className="font-display font-extrabold text-lg text-emerald-900">
                  ${totalHonorariosLiquidadosFiltradosUsd.toFixed(2)} USD
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                  Histórico conciliado en D1
                </span>
              </div>
            </div>

            {/* Barra de Filtros y Acciones por Lote */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-subtle">
              <div className="flex items-center gap-1.5">
                {(['todos', 'pendiente', 'liquidado'] as const).map((est) => (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setFiltroEstadoHonorarios(est)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all capitalize active:scale-95 ${
                      filtroEstadoHonorarios === est
                        ? 'bg-dental-deep-navy text-white shadow-xs'
                        : 'bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy'
                    }`}
                  >
                    {est === 'todos' ? 'Todos' : est === 'pendiente' ? 'Pendientes' : 'Liquidados'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={seleccionarTodosPendientes}
                  className="px-2.5 py-1 rounded-xl bg-surface-subtle-ice border border-border-subtle text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
                >
                  Seleccionar Pendientes
                </button>

                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setModalLiquidacion(true)}
                    className="px-3.5 py-1 rounded-xl bg-status-success text-white text-[11px] font-bold shadow-md hover:bg-dental-deep-navy transition-all active:scale-95 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>Liquidar ({selectedIds.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Tratamientos Realizados */}
          <div className="space-y-2.5">
            {tratamientosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-secondary text-xs bg-surface-clean-white rounded-2xl border border-border-subtle">
                No hay tratamientos registrados bajo este filtro.
              </div>
            ) : (
              tratamientosFiltrados.map((t) => {
                const isSelected = selectedIds.includes(t.id);
                const isPendiente = t.estadoPagoHonorario === 'pendiente';

                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-2xl bg-surface-clean-white border transition-all flex flex-col gap-2.5 shadow-xs ${
                      isSelected
                        ? 'border-status-success ring-1 ring-status-success/30 bg-emerald-50/20'
                        : 'border-border-subtle hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {isPendiente && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectId(t.id)}
                            className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary border-border-subtle cursor-pointer shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-surface-container text-dental-deep-navy">
                              {t.tratamientoCodigo || 'OD'}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-dental-deep-navy truncate">
                              {t.tratamientoNombre || 'Procedimiento'}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-secondary mt-1">
                            <span className="font-bold text-dental-deep-navy">
                              👤 {t.pacienteNombre || 'Paciente'}
                            </span>
                            <span>•</span>
                            <span>👨‍⚕️ {t.odontologoNombre || 'Doctor'}</span>
                            {t.dienteNumero && (
                              <>
                                <span>•</span>
                                <span className="bg-surface-subtle-ice px-1.5 py-0.2 rounded font-mono font-bold text-primary">
                                  Diente #{t.dienteNumero} {t.superficie ? `(${t.superficie})` : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-extrabold text-sm text-dental-deep-navy block">
                          ${t.montoHonorarioUsd?.toFixed(2)} USD
                        </span>
                        <span className="text-[10px] text-secondary block">
                          Comisión ({t.porcentajeHonorario}% de ${t.costoTotalUsd})
                        </span>
                      </div>
                    </div>

                    {t.observaciones && (
                      <p className="text-[11px] text-secondary bg-surface-subtle-ice px-2.5 py-1.5 rounded-xl border border-border-subtle/50">
                        {t.observaciones}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-border-subtle text-[11px]">
                      <span className="text-secondary flex items-center gap-1 font-mono text-[10px]">
                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                        {t.fechaRealizacion ? t.fechaRealizacion.split('T')[0] : 'Hoy'}
                      </span>

                      {isPendiente ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Pendiente de Liquidación
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Liquidado ({t.referenciaLiquidacion || 'Ref'})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Liquidación por Lote */}
      {modalLiquidacion && (
        <div className="fixed inset-0 z-50 bg-dental-deep-navy/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-clean-white w-full max-w-sm rounded-3xl p-5 flex flex-col gap-3.5 shadow-2xl animate-in zoom-in-95 border border-border-subtle">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">account_balance_wallet</span>
            </div>

            <div>
              <h4 className="font-display font-extrabold text-base text-dental-deep-navy">
                Liquidar Honorarios Seleccionados
              </h4>
              <p className="text-xs text-secondary mt-0.5">
                Se marcarán {selectedIds.length} procedimientos clínicos como liquidados en Cloudflare D1.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy">
                Número de Comprobante / Referencia Bancaria
              </label>
              <input
                type="text"
                value={refLiquidacionInput}
                onChange={(e) => setRefLiquidacionInput(e.target.value)}
                placeholder="Ej. LIQ-PAGOMOVIL-884910"
                className="w-full h-11 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:outline-none focus:ring-2 focus:ring-primary font-bold"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalLiquidacion(false)}
                className="flex-1 py-3 rounded-xl bg-surface-subtle-ice text-secondary font-bold text-xs hover:bg-border-subtle transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLiquidating}
                onClick={ejecutarLiquidacionLote}
                className="flex-1 py-3 rounded-xl bg-status-success hover:bg-dental-deep-navy text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>{isLiquidating ? 'Liquidando...' : 'Confirmar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
              className="w-full py-3 rounded-xl bg-primary text-surface-clean-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Aceptar y Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
