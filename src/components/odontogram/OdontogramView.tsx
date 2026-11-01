import React, { useState, useEffect } from 'react';
import { useSede } from '../../context/SedeContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { ApiClient } from '../../services/api';
import {
  ToothRecord,
  TratamientoRealizadoItem,
  TratamientoItem,
  OdontologoItem,
  CondicionMedicaItem,
  EvolucionClinicaItem,
  RadiografiaItem,
} from '../../types/clinical';
import { QuadrantArchView } from './QuadrantArchView';
import { TabId } from '../layout/BottomNavigation';

export interface CitaAprobadaConsulta {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteCedula: string;
  pacienteTelefono: string;
  pacienteEmail?: string;
  pacienteSexo?: string;
  pacienteFechaNacimiento?: string;
  condicionMedicaId?: string;
  motivoConsulta: string;
  fechaCita: string;
  horaInicio: string;
  doctorNombre?: string;
  boxNumero?: number;
  estado: string;
  avatarUrl?: string;
}

interface ItemPresupuestoCita {
  id: string;
  tratamientoId: string;
  codigo: string;
  nombre: string;
  dienteFdi?: number;
  costoUsd: number;
}

interface OdontogramViewProps {
  onNavigateTab?: (tab: TabId) => void;
}

export const OdontogramView: React.FC<OdontogramViewProps> = ({ onNavigateTab }) => {
  const { sedeActiva, sedeId, doctorActivo } = useSede();
  const { tasaBcv } = useTasaCambio();

  // Estados de Citas Aprobadas y Selección de Paciente
  const [citasAprobadas, setCitasAprobadas] = useState<CitaAprobadaConsulta[]>([]);
  const [fechaConsulta, setFechaConsulta] = useState<string>('');
  const [fechasDisponibles, setFechasDisponibles] = useState<string[]>([]);
  const [selectedCitaId, setSelectedCitaId] = useState<string>('');
  const [loadingCitas, setLoadingCitas] = useState<boolean>(true);

  // Catálogos Clínicos de D1
  const [condicionesMedicas, setCondicionesMedicas] = useState<CondicionMedicaItem[]>([]);
  const [catalogoTratamientos, setCatalogoTratamientos] = useState<TratamientoItem[]>([]);
  const [staffOdontologos, setStaffOdontologos] = useState<OdontologoItem[]>([]);

  // Odontograma FDI
  const [teeth, setTeeth] = useState<ToothRecord[]>([]);
  const [loadingTeeth, setLoadingTeeth] = useState(true);

  // Historial Clínico de Tratamientos Realizados (D1)
  const [historialTratamientos, setHistorialTratamientos] = useState<TratamientoRealizadoItem[]>([]);
  const [showHistorialModal, setShowHistorialModal] = useState(false);

  // Presupuesto Concertado de la Cita (Debajo de Odontograma)
  const [itemsPresupuesto, setItemsPresupuesto] = useState<ItemPresupuestoCita[]>([]);
  const [showModalAddTratamientoPresupuesto, setShowModalAddTratamientoPresupuesto] = useState(false);
  const [tempTratId, setTempTratId] = useState<string>('');
  const [tempPiezaFdi, setTempPiezaFdi] = useState<string>('');
  const [tempCostoUsd, setTempCostoUsd] = useState<number>(0);
  const [isSavingPresupuesto, setIsSavingPresupuesto] = useState(false);
  const [mensajePresupuestoExito, setMensajePresupuestoExito] = useState<string | null>(null);

  // Evolución Clínica de la Cita
  const [evoluciones, setEvoluciones] = useState<EvolucionClinicaItem[]>([]);
  const [modoNuevaEvolucion, setModoNuevaEvolucion] = useState(false);
  const [textoNuevaEvolucion, setTextoNuevaEvolucion] = useState('');
  const [indicacionesReceta, setIndicacionesReceta] = useState('');
  const [doctorEvolucionSeleccionado, setDoctorEvolucionSeleccionado] = useState<string>('');
  const [isSavingEvolucion, setIsSavingEvolucion] = useState(false);
  const [mensajeEvolucionExito, setMensajeEvolucionExito] = useState<string | null>(null);

  // Radiografía Digital (Sensor RVG 2.0) - Última Tarjeta
  const [radiografias, setRadiografias] = useState<RadiografiaItem[]>([]);
  const [rxVisualizada, setRxVisualizada] = useState<string | null>(null);
  const [filtroAltoContraste, setFiltroAltoContraste] = useState(false);
  const [isUploadingRx, setIsUploadingRx] = useState(false);
  const [notaRx, setNotaRx] = useState('Inspección apical RVG 2.0 en sillón');
  const [piezaRx, setPiezaRx] = useState<string>('16');

  // 1. Cargar Datos Maestros y Citas Aprobadas desde D1
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setLoadingCitas(true);
      try {
        const data = await ApiClient.getControlData();

        if (data?.condicionesMedicas) {
          setCondicionesMedicas(data.condicionesMedicas);
        }
        if (data?.tratamientos) {
          setCatalogoTratamientos(data.tratamientos);
          if (data.tratamientos.length > 0) {
            setTempTratId(data.tratamientos[0].id);
            setTempCostoUsd(data.tratamientos[0].costoUsd);
          }
        }
        if (data?.odontologos) {
          setStaffOdontologos(data.odontologos);
          if (data.odontologos.length > 0) {
            setDoctorEvolucionSeleccionado(data.odontologos[0].nombres);
          }
        }

        // Mapear y filtrar únicamente citas aprobadas / confirmadas o en sillón
        if (data?.citas && Array.isArray(data.citas)) {
          const citasValidas = data.citas
            .filter((c: any) => c.estado === 'confirmada' || c.estado === 'en_sillon')
            .map((c: any) => ({
              id: c.id,
              pacienteId: c.pacienteId || c.paciente_id || `pac-${c.id}`,
              pacienteNombre: c.pacienteNombre || c.paciente_nombre || 'Paciente Citado',
              pacienteCedula: c.pacienteCedula || c.paciente_cedula || 'V-00.000.000',
              pacienteTelefono: c.pacienteTelefono || c.paciente_telefono || '+58 412-0000000',
              pacienteEmail: c.pacienteEmail || c.paciente_email || '',
              pacienteSexo: c.pacienteSexo || c.paciente_sexo || 'Femenino',
              pacienteFechaNacimiento: c.pacienteFechaNacimiento || c.paciente_fecha_nacimiento || '',
              condicionMedicaId: c.condicionMedicaId || c.condicion_medica_id || 'ninguna',
              motivoConsulta: c.motivo || c.motivoConsulta || 'Consulta Odontológica General',
              fechaCita: c.fechaCita || c.fecha_cita || 'Hoy',
              horaInicio: c.horaInicio || c.hora_inicio || '09:00 AM',
              doctorNombre: c.doctorNombre || c.doctor_nombre || doctorActivo,
              boxNumero: c.boxNumero || c.box_numero || 1,
              estado: c.estado || 'confirmada',
              avatarUrl:
                c.pacienteSexo === 'Masculino'
                  ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
                  : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
            }));

          setCitasAprobadas(citasValidas);

          // Extraer fechas únicas con citas aprobadas
          const fechasUnicas = Array.from(new Set(citasValidas.map((c: CitaAprobadaConsulta) => c.fechaCita)));
          setFechasDisponibles(fechasUnicas);

          if (fechasUnicas.length > 0) {
            setFechaConsulta(fechasUnicas[0]);
            const primeraCita = citasValidas.find((c: CitaAprobadaConsulta) => c.fechaCita === fechasUnicas[0]);
            if (primeraCita) {
              setSelectedCitaId(primeraCita.id);
            }
          }
        }
      } catch (err) {
        console.error('Error cargando citas de control:', err);
      } finally {
        setLoadingCitas(false);
      }
    };

    cargarDatosIniciales();
  }, [sedeId]);

  // Citas aprobadas correspondientes a la fecha seleccionada
  const citasFiltradasFecha = citasAprobadas.filter(
    (c) => !fechaConsulta || c.fechaCita === fechaConsulta
  );

  // Cita y Paciente actualmente seleccionado en el sillón
  const selectedCita =
    citasAprobadas.find((c) => c.id === selectedCitaId) ||
    citasFiltradasFecha[0] ||
    citasAprobadas[0];

  // Cálculo de edad
  const calcularEdad = (fechaNac?: string): number => {
    if (!fechaNac) return 32;
    const year = parseInt(fechaNac.split('-')[0], 10);
    if (isNaN(year)) return 32;
    return Math.max(1, new Date().getFullYear() - year);
  };

  // Buscar información médica relevante del paciente activo
  const condicionMedicaActiva = condicionesMedicas.find(
    (cm) => cm.id === selectedCita?.condicionMedicaId
  );

  // 2. Cargar Odontograma, Historial, Evoluciones y Radiografías al cambiar paciente
  useEffect(() => {
    if (!selectedCita?.pacienteId) return;

    let isMounted = true;
    setLoadingTeeth(true);

    // Cargar Odontograma
    ApiClient.getOdontograma(selectedCita.pacienteId, sedeId)
      .then((data) => {
        if (isMounted) setTeeth(data || []);
      })
      .catch(() => {
        if (isMounted) setTeeth([]);
      })
      .finally(() => {
        if (isMounted) setLoadingTeeth(false);
      });

    // Cargar Historial de Tratamientos Realizados en D1
    ApiClient.getTratamientosRealizadosPaciente(selectedCita.pacienteId).then((res) => {
      if (isMounted && res.success) {
        setHistorialTratamientos(res.tratamientos || []);
      }
    });

    // Cargar Evoluciones Clínicas
    ApiClient.getEvoluciones(selectedCita.pacienteId, sedeId).then((data) => {
      if (isMounted) {
        setEvoluciones(data || []);
        setModoNuevaEvolucion(data.length === 0);
      }
    });

    // Cargar Radiografías
    ApiClient.getRadiografias(selectedCita.pacienteId, sedeId).then((data) => {
      if (isMounted) {
        setRadiografias(data || []);
        if (data.length > 0) {
          setRxVisualizada(data[0].imagenData || data[0].r2StorageUrl || null);
        } else {
          setRxVisualizada(null);
        }
      }
    });

    // Inicializar Presupuesto Concertado de la Cita con el motivo de la reserva
    setItemsPresupuesto([
      {
        id: `it-${Date.now()}`,
        tratamientoId: 'trat-1',
        codigo: 'TRAT-INI',
        nombre: selectedCita.motivoConsulta || 'Evaluación Inicial Odontológica',
        dienteFdi: undefined,
        costoUsd: 25,
      },
    ]);
    setMensajePresupuestoExito(null);
    setMensajeEvolucionExito(null);

    return () => {
      isMounted = false;
    };
  }, [selectedCita?.pacienteId, sedeId]);

  // Actualización de pieza en el Odontograma FDI
  const handleUpdateTooth = async (updatedTooth: ToothRecord) => {
    if (!selectedCita?.pacienteId) return;
    setTeeth((prev) =>
      prev.map((t) => (t.numeroFdi === updatedTooth.numeroFdi ? updatedTooth : t))
    );
    await ApiClient.guardarPiezaOdontograma(selectedCita.pacienteId, updatedTooth, sedeId);
  };

  // Cálculo de última modificación del odontograma
  const ultimaModificacion = React.useMemo(() => {
    const teethWithDates = teeth.filter((t) => t.updatedAt);
    if (teethWithDates.length === 0) return undefined;
    const sorted = [...teethWithDates].sort((a, b) =>
      (b.updatedAt || '').localeCompare(a.updatedAt || '')
    );
    const newest = sorted[0];
    return {
      fecha: newest.updatedAt ? newest.updatedAt.split('T')[0] : 'Reciente',
      doctor: newest.actualizadoPor || doctorActivo,
    };
  }, [teeth, doctorActivo]);

  // 3. Manejo de Presupuesto Concertado de la Cita
  const handleAgregarItemPresupuesto = () => {
    const trat = catalogoTratamientos.find((t) => t.id === tempTratId);
    if (!trat) return;

    const nuevoItem: ItemPresupuestoCita = {
      id: `it-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tratamientoId: trat.id,
      codigo: trat.codigo,
      nombre: trat.nombre,
      dienteFdi: tempPiezaFdi ? parseInt(tempPiezaFdi, 10) : undefined,
      costoUsd: Number(tempCostoUsd) || trat.costoUsd,
    };

    setItemsPresupuesto((prev) => [...prev, nuevoItem]);
    setShowModalAddTratamientoPresupuesto(false);
    setTempPiezaFdi('');
  };

  const handleEliminarItemPresupuesto = (idItem: string) => {
    setItemsPresupuesto((prev) => prev.filter((it) => it.id !== idItem));
  };

  const totalPresupuestoUsd = itemsPresupuesto.reduce((acc, it) => acc + (it.costoUsd || 0), 0);
  const totalPresupuestoBs = totalPresupuestoUsd * tasaBcv;

  const handleGuardarPresupuestoDefinitivo = async () => {
    if (!selectedCita?.pacienteId || itemsPresupuesto.length === 0) return;
    setIsSavingPresupuesto(true);
    setMensajePresupuestoExito(null);

    try {
      const resumenProcedimientos = itemsPresupuesto
        .map((it) => `${it.nombre}${it.dienteFdi ? ` (#${it.dienteFdi})` : ''}`)
        .join(' + ');

      const res = await ApiClient.crearPresupuesto({
        pacienteId: selectedCita.pacienteId,
        sedeId,
        montoTotalUsd: totalPresupuestoUsd,
        tasaBcvReferencia: tasaBcv,
        procedimiento: resumenProcedimientos,
      });

      if (res.success) {
        setMensajePresupuestoExito(
          `¡Presupuesto ${res.codigo || 'definitivo'} ($${totalPresupuestoUsd.toFixed(2)} USD) fijado y guardado en D1! Quedó habilitado para cobro en recepción.`
        );
      }
    } catch (err: any) {
      console.error('Error fijando presupuesto:', err);
    } finally {
      setIsSavingPresupuesto(false);
    }
  };

  // 4. Manejo de Evolución Clínica
  const handleGuardarEvolucion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCita?.pacienteId || !textoNuevaEvolucion.trim()) return;

    setIsSavingEvolucion(true);
    setMensajeEvolucionExito(null);

    try {
      const res = await ApiClient.guardarEvolucion(
        selectedCita.pacienteId,
        {
          citaId: selectedCita.id,
          odontologoNombre: doctorEvolucionSeleccionado || doctorActivo,
          texto: textoNuevaEvolucion.trim(),
          indicacionesReceta: indicacionesReceta.trim(),
        },
        sedeId
      );

      if (res.success) {
        const nueva: EvolucionClinicaItem = {
          id: res.id,
          pacienteId: selectedCita.pacienteId,
          citaId: selectedCita.id,
          odontologoNombre: doctorEvolucionSeleccionado || doctorActivo,
          texto: textoNuevaEvolucion.trim(),
          indicacionesReceta: indicacionesReceta.trim(),
          createdAt: new Date().toISOString(),
        };

        setEvoluciones((prev) => [nueva, ...prev]);
        setModoNuevaEvolucion(false);
        setTextoNuevaEvolucion('');
        setIndicacionesReceta('');
        setMensajeEvolucionExito('¡Evolución clínica firmada y resguardada exitosamente en D1!');
      }
    } catch (err) {
      console.error('Error guardando evolución:', err);
    } finally {
      setIsSavingEvolucion(false);
    }
  };

  // 5. Manejo de Radiografía y Captura con Cámara
  const handleSubirRadiografia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCita?.pacienteId) return;

    setIsUploadingRx(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setRxVisualizada(base64Data);

      try {
        const res = await ApiClient.guardarRadiografia(
          selectedCita.pacienteId,
          {
            piezaFdi: piezaRx ? parseInt(piezaRx, 10) : undefined,
            tipo: 'periapical_rvg',
            imagenData: base64Data,
            observaciones: notaRx,
          },
          sedeId
        );

        if (res.success) {
          const nuevaRx: RadiografiaItem = {
            id: res.id,
            pacienteId: selectedCita.pacienteId,
            piezaFdi: piezaRx ? parseInt(piezaRx, 10) : undefined,
            tipo: 'periapical_rvg',
            imagenData: base64Data,
            observaciones: notaRx,
            fechaToma: new Date().toISOString(),
          };
          setRadiografias((prev) => [nuevaRx, ...prev]);
        }
      } catch (err) {
        console.error('Error subiendo radiografía:', err);
      } finally {
        setIsUploadingRx(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* =========================================================================
          1. TARJETA SUPERIOR: CONTROL DE CITA ODONTOLÓGICA (PACIENTES CITADOS APROBADOS)
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">event_available</span>
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy">
                Control de Cita Odontológica
              </h2>
              <p className="text-xs text-secondary">
                Pacientes citados y aprobados para consulta activa en sillón
              </p>
            </div>
          </div>

          {/* Selector / Indicador de Fecha de Consulta */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <span className="text-[11px] font-bold text-secondary">Fecha:</span>
            {fechasDisponibles.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFechaConsulta(f);
                  const primera = citasAprobadas.find((c) => c.fechaCita === f);
                  if (primera) setSelectedCitaId(primera.id);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  fechaConsulta === f
                    ? 'bg-dental-deep-navy text-white shadow-xs'
                    : 'bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy border border-border-subtle'
                }`}
              >
                {f} ({citasAprobadas.filter((c) => c.fechaCita === f).length})
              </button>
            ))}
          </div>
        </div>

        {/* Carrusel / Barra de Pacientes Citados y Aprobados en la Fecha */}
        {loadingCitas ? (
          <div className="p-4 text-center text-xs text-secondary flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
            <span>Cargando citas aprobadas desde Cloudflare D1...</span>
          </div>
        ) : citasFiltradasFecha.length === 0 ? (
          <div className="p-4 text-center text-xs text-secondary bg-surface-subtle-ice rounded-xl border border-border-subtle">
            No se registran citas aprobadas para esta fecha en {sedeActiva.nombre}.
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {citasFiltradasFecha.map((cita) => {
              const isSelected = selectedCita?.id === cita.id;
              const isEnSillon = cita.estado === 'en_sillon';

              return (
                <button
                  key={cita.id}
                  type="button"
                  onClick={() => setSelectedCitaId(cita.id)}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 shrink-0 text-left cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-xs'
                      : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={cita.avatarUrl}
                      alt={cita.pacienteNombre}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-border-subtle"
                    />
                    {isEnSillon && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-status-success rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-dental-deep-navy truncate max-w-[130px]">
                        {cita.pacienteNombre}
                      </span>
                      {cita.boxNumero && (
                        <span className="text-[9px] font-black bg-surface-container px-1 rounded text-primary">
                          B{cita.boxNumero}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-secondary">
                      <span className="font-mono">{cita.horaInicio}</span>
                      <span>•</span>
                      <span className="font-mono">{cita.pacienteCedula}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Ficha Principal del Paciente Activo en el Sillón */}
        {selectedCita && (
          <div className="pt-2 border-t border-border-subtle flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={selectedCita.avatarUrl}
                    alt={selectedCita.pacienteNombre}
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-primary/20"
                  />
                  <span
                    className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-status-success text-white shadow-xs"
                    title="Paciente en Sillón"
                  >
                    Activo
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                      {selectedCita.pacienteNombre}
                    </h3>
                    <span className="font-mono font-bold text-xs bg-surface-container px-2 py-0.5 rounded-lg text-primary">
                      {selectedCita.pacienteCedula}
                    </span>
                    <span className="text-xs text-secondary font-semibold">
                      {calcularEdad(selectedCita.pacienteFechaNacimiento)} años • {selectedCita.pacienteSexo || 'Femenino'}
                    </span>
                  </div>

                  {/* Motivo de la Cita / Reserva */}
                  <div className="mt-1 text-xs text-dental-deep-navy bg-primary/5 px-2.5 py-1.5 rounded-xl border border-primary/15 font-medium">
                    <span className="font-bold text-primary">Tratamiento en Reserva:</span> {selectedCita.motivoConsulta}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-secondary mt-1">
                    <span>👨‍⚕️ Atendido por: <strong>{selectedCita.doctorNombre || doctorActivo}</strong></span>
                    <span>•</span>
                    <span>Box 0{selectedCita.boxNumero || 1} ({sedeActiva.nombre})</span>
                  </div>
                </div>
              </div>

              {/* Botones de Comunicación Rápida */}
              <div className="flex items-center gap-1.5 self-end sm:self-start">
                <a
                  href={`tel:${selectedCita.pacienteTelefono}`}
                  aria-label="Llamar al paciente"
                  className="w-8 h-8 rounded-xl bg-surface-subtle-ice border border-border-subtle text-primary flex items-center justify-center active:scale-95 transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[17px]">phone</span>
                </a>
                <a
                  href={`https://wa.me/${selectedCita.pacienteTelefono.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Enviar WhatsApp"
                  className="w-8 h-8 rounded-xl bg-status-success/15 border border-status-success/20 text-status-success flex items-center justify-center active:scale-95 transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[17px]">chat</span>
                </a>
              </div>
            </div>

            {/* Información Médica Relevante (Clinical Safety Alert) - Sin Seguros */}
            <div className="p-3 rounded-2xl border text-xs flex flex-col gap-1.5 transition-all bg-surface-subtle-ice border-border-subtle">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-dental-deep-navy">
                  <span className="material-symbols-outlined text-[18px] text-primary">medical_information</span>
                  <span>Información Médica Relevante & Anamnesis</span>
                </div>

                {condicionMedicaActiva && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      condicionMedicaActiva.nivelRiesgo === 'Crítico'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                        : condicionMedicaActiva.nivelRiesgo === 'Alto'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    Riesgo {condicionMedicaActiva.nivelRiesgo}
                  </span>
                )}
              </div>

              {condicionMedicaActiva ? (
                <div className="space-y-1 text-[11px] text-secondary">
                  <div>
                    <strong className="text-dental-deep-navy">Diagnóstico Sistémico [{condicionMedicaActiva.codigoCie}]:</strong>{' '}
                    {condicionMedicaActiva.nombre}
                  </div>
                  {condicionMedicaActiva.protocoloDental && (
                    <div className="text-dental-deep-navy bg-white/80 p-2 rounded-xl border border-border-subtle/50">
                      <span className="font-bold text-primary">Protocolo Clínico en Sillón:</span>{' '}
                      {condicionMedicaActiva.protocoloDental}
                    </div>
                  )}
                  {condicionMedicaActiva.anestesicoContraindicado && (
                    <div className="text-rose-900 bg-rose-50 p-2 rounded-xl border border-rose-200">
                      <span className="font-bold">⚠️ Anestésico Contraindicado:</span>{' '}
                      {condicionMedicaActiva.anestesicoContraindicado}
                    </div>
                  )}
                  {condicionMedicaActiva.requiereProfilaxisAntibiotica && (
                    <div className="text-amber-900 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">medication</span>
                      <span>Requiere profilaxis antibiótica previa obligatoria.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-status-success font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  <span>Sin antecedentes patológicos ni contraindicaciones de anestésico reportadas.</span>
                </div>
              )}
            </div>

            {/* Botón de Historial Clínico en la Esquina Inferior Derecha */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowHistorialModal(true)}
                className="px-3.5 py-2 rounded-xl bg-dental-deep-navy hover:bg-primary text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">menu_book</span>
                <span>Historial Clínico ({historialTratamientos.length} registros)</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          2. TARJETA CENTRAL: ODONTOGRAMA FDI INTERACTIVO (ANIMADO CON ENDODONCIA Y EXODONCIA)
         ========================================================================= */}
      {loadingTeeth ? (
        <div className="p-8 text-center text-secondary text-xs bg-surface-clean-white rounded-2xl border border-border-subtle flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
          <span>Cargando odontograma anatómico sincronizado en Cloudflare D1...</span>
        </div>
      ) : (
        <QuadrantArchView
          teeth={teeth}
          onUpdateTooth={handleUpdateTooth}
          ultimaModificacion={ultimaModificacion}
          isNuevoOdontograma={teeth.length === 0}
        />
      )}

      {/* =========================================================================
          3. TARJETA INFERIOR A: PRESUPUESTO CONCERTADO DE LA CITA (DEBAJO DE ODONTOGRAMA)
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">price_change</span>
              <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                Presupuesto Concertado de la Cita
              </h3>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Establece el costo definitivo de la cita y tratamientos acordados en el sillón
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModalAddTratamientoPresupuesto(true)}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ Agregar o Modificar Tratamiento</span>
          </button>
        </div>

        {/* Notificación de Éxito al Guardar Presupuesto */}
        {mensajePresupuestoExito && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
            <span>{mensajePresupuestoExito}</span>
          </div>
        )}

        {/* Tabla / Lista de Procedimientos Acordados */}
        <div className="space-y-2">
          {itemsPresupuesto.length === 0 ? (
            <div className="p-4 text-center text-xs text-secondary bg-surface-subtle-ice rounded-xl border border-border-subtle">
              No hay tratamientos en el presupuesto actual. Presiona "+ Agregar o Modificar Tratamiento".
            </div>
          ) : (
            itemsPresupuesto.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-surface-subtle-ice border border-border-subtle flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container text-dental-deep-navy">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-dental-deep-navy block truncate">
                      {item.nombre}
                    </span>
                    <span className="text-[10px] text-secondary">
                      {item.dienteFdi ? `Pieza FDI #${item.dienteFdi} • ` : ''}Tarifa concertada
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-dental-deep-navy block">
                      ${item.costoUsd.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-secondary">
                      ≈ {(item.costoUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEliminarItemPresupuesto(item.id)}
                    className="w-7 h-7 rounded-lg bg-surface-container hover:bg-rose-100 text-secondary hover:text-rose-700 flex items-center justify-center transition-all cursor-pointer"
                    title="Remover de la cita"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Balance Bimonetario y Fijación de Costo Definitivo */}
        <div className="p-3.5 rounded-2xl bg-dental-deep-navy text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm border border-primary mt-1">
          <div>
            <span className="text-[10px] text-surface-container uppercase tracking-wider font-bold block">
              Costo Definitivo Concertado de la Cita
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-display font-extrabold text-2xl text-white">
                ${totalPresupuestoUsd.toFixed(2)} USD
              </span>
              <span className="text-xs text-surface-container font-semibold">
                ≈ {totalPresupuestoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
              </span>
            </div>
            <span className="text-[10px] text-surface-container/70 mt-0.5 block">
              Tasa Oficial BCV: {tasaBcv.toFixed(2)} Bs/$
            </span>
          </div>

          <button
            type="button"
            disabled={isSavingPresupuesto || itemsPresupuesto.length === 0}
            onClick={handleGuardarPresupuestoDefinitivo}
            className="px-4 py-3 rounded-xl bg-primary hover:bg-white hover:text-dental-deep-navy text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{isSavingPresupuesto ? 'Fijando en D1...' : 'Fijar y Guardar Presupuesto'}</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          4. TARJETA INFERIOR B: EVOLUCIÓN CLÍNICA DE LA CITA
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">assignment_turned_in</span>
              <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                Evolución Clínica de la Cita
              </h3>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Registro del acto odontológico, biomateriales y evolución del día
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setModoNuevaEvolucion(!modoNuevaEvolucion)}
              className="px-3 py-1.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-primary hover:bg-primary hover:text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {modoNuevaEvolucion ? 'visibility' : 'edit_note'}
              </span>
              <span>{modoNuevaEvolucion ? 'Ver Última Registrada' : '+ Redactar Nueva Evolución'}</span>
            </button>
          </div>
        </div>

        {mensajeEvolucionExito && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
            <span>{mensajeEvolucionExito}</span>
          </div>
        )}

        {modoNuevaEvolucion ? (
          /* Formulario para Asentar Nueva Evolución con Cambio de Odontólogo Tratante */
          <form onSubmit={handleGuardarEvolucion} className="flex flex-col gap-3">
            {/* Selector de Odontólogo Tratante */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy flex items-center justify-between">
                <span>Odontólogo Tratante que Firma la Evolución</span>
                <span className="text-[10px] text-primary">Permite relevar o interconsulta</span>
              </label>
              <select
                value={doctorEvolucionSeleccionado}
                onChange={(e) => setDoctorEvolucionSeleccionado(e.target.value)}
                className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              >
                {staffOdontologos.map((doc) => (
                  <option key={doc.id} value={doc.nombres}>
                    {doc.nombres} ({doc.especialidad})
                  </option>
                ))}
              </select>
            </div>

            {/* Texto de la Evolución */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy">
                Descripción del Acto Clínico & Hallazgos *
              </label>
              <textarea
                rows={3}
                required
                value={textoNuevaEvolucion}
                onChange={(e) => setTextoNuevaEvolucion(e.target.value)}
                placeholder="Indica cavidad tratada, biomateriales usados, aislamiento, técnica anestésica y condición final..."
                className="p-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Indicaciones / Receta */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy">
                Prescripción Farmacológica / Indicaciones al Paciente (Opcional)
              </label>
              <input
                type="text"
                value={indicacionesReceta}
                onChange={(e) => setIndicacionesReceta(e.target.value)}
                placeholder="Ej. Ibuprofeno 400mg c/8h x 3 días. Dieta blanda por 24h..."
                className="h-10 px-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingEvolucion}
              className="py-3 px-4 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">draw</span>
              <span>{isSavingEvolucion ? 'Guardando en D1...' : 'Firmar y Guardar Evolución'}</span>
            </button>
          </form>
        ) : evoluciones.length > 0 ? (
          /* Visualización de la Última Evolución Registrada */
          <div className="space-y-2">
            <div className="p-3.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-secondary">
                  📅 {evoluciones[0].createdAt ? evoluciones[0].createdAt.split('T')[0] : 'Última consulta'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-status-success">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>Firma Digital</span>
                </span>
              </div>

              <p className="text-xs text-secondary leading-relaxed bg-white/80 p-3 rounded-xl border border-border-subtle/50">
                {evoluciones[0].texto}
              </p>

              {evoluciones[0].indicacionesReceta && (
                <div className="text-[11px] text-dental-deep-navy bg-primary/5 p-2 rounded-xl border border-primary/10">
                  <strong>Indicaciones / Receta:</strong> {evoluciones[0].indicacionesReceta}
                </div>
              )}

              <div className="text-right text-[11px] text-dental-deep-navy font-bold pt-1">
                👨‍⚕️ {evoluciones[0].odontologoNombre}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-secondary bg-surface-subtle-ice rounded-xl border border-border-subtle">
            No hay evoluciones clínicas previas registradas. Pulsa "+ Redactar Nueva Evolución" para asentar la nota de hoy.
          </div>
        )}
      </section>

      {/* =========================================================================
          5. TARJETA FINAL: RADIOGRAFÍA DIGITAL (SENSOR RVG 2.0) & CAPTURA EN CONSULTA
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-electric-blue text-[22px]">radiology</span>
              <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                Radiografía Digital (Sensor RVG 2.0)
              </h3>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Captura inmediata en sillón con sensor intraoral o cámara del teléfono
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Input oculto para carga / captura de cámara */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              id="rvg-camera-input"
              onChange={handleSubirRadiografia}
              className="hidden"
            />

            <label
              htmlFor="rvg-camera-input"
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              <span>{isUploadingRx ? 'Procesando...' : 'Tomar / Adjuntar Foto RVG'}</span>
            </label>
          </div>
        </div>

        {/* Visor de Radiografía Digital con Filtros */}
        <div className="relative rounded-2xl overflow-hidden h-48 bg-dental-deep-navy flex items-center justify-center shadow-inner border border-primary">
          {rxVisualizada ? (
            <img
              src={rxVisualizada}
              alt="Radiografía digital RVG 2.0"
              className={`w-full h-full object-contain transition-all ${
                filtroAltoContraste ? 'invert contrast-200 brightness-125 grayscale' : 'opacity-90'
              }`}
            />
          ) : (
            <div className="text-center text-surface-container text-xs flex flex-col items-center gap-1.5 p-4">
              <span className="material-symbols-outlined text-[36px] text-surface-container/60">radiology</span>
              <span>No se ha adjuntado radiografía digital para esta cita.</span>
              <label
                htmlFor="rvg-camera-input"
                className="text-white underline font-bold cursor-pointer text-xs mt-1"
              >
                Toca aquí para capturar o subir desde el teléfono
              </label>
            </div>
          )}

          {rxVisualizada && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={() => setFiltroAltoContraste(!filtroAltoContraste)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md transition-all cursor-pointer ${
                  filtroAltoContraste
                    ? 'bg-primary text-white'
                    : 'bg-black/60 text-white hover:bg-black/80'
                }`}
              >
                {filtroAltoContraste ? 'Modo Normal' : 'Contraste Negativo RX'}
              </button>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dental-deep-navy via-dental-deep-navy/70 to-transparent p-3 flex items-center justify-between text-surface-clean-white text-[11px] font-semibold">
            <span>Resolución HD RVG 22 lp/mm • Dosis Ultra Baja</span>
            <span>Sensor USB 2.0 / Móvil</span>
          </div>
        </div>

        {/* Galería de Radiografías Previas */}
        {radiografias.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
            {radiografias.map((rx) => (
              <button
                key={rx.id}
                type="button"
                onClick={() => setRxVisualizada(rx.imagenData || rx.r2StorageUrl || null)}
                className="w-16 h-12 rounded-xl overflow-hidden border border-border-subtle shrink-0 hover:border-primary transition-all active:scale-95 cursor-pointer"
              >
                <img
                  src={rx.imagenData || rx.r2StorageUrl}
                  alt="Miniatura RX"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          MODAL FLOTANTE: HISTORIAL CLÍNICO RESUMIDO (DESDE TARJETA CONTROL DE CITA)
         ========================================================================= */}
      {showHistorialModal && selectedCita && (
        <div className="fixed inset-0 z-50 bg-dental-deep-navy/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-clean-white w-full max-w-lg rounded-3xl p-5 flex flex-col gap-3 shadow-2xl animate-in zoom-in-95 border border-border-subtle max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">menu_book</span>
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-base text-dental-deep-navy">
                    Historial Clínico Resumido
                  </h4>
                  <p className="text-xs text-secondary">
                    {selectedCita.pacienteNombre} ({selectedCita.pacienteCedula})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHistorialModal(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Listado de Procedimientos Realizados en D1 */}
            <div className="space-y-2 mt-1">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                Procedimientos Registrados ({historialTratamientos.length})
              </span>

              {historialTratamientos.length === 0 ? (
                <div className="p-4 text-center text-xs text-secondary bg-surface-subtle-ice rounded-xl border border-border-subtle">
                  No hay procedimientos previos asentados para este paciente.
                </div>
              ) : (
                historialTratamientos.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-dental-deep-navy">
                        <span className="font-mono text-[10px] bg-surface-container px-1.5 py-0.2 rounded">
                          {t.tratamientoCodigo || 'TRAT'}
                        </span>
                        <span>{t.tratamientoNombre}</span>
                      </div>
                      <span className="font-mono font-bold text-primary">${t.costoTotalUsd} USD</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-secondary">
                      <span>👨‍⚕️ {t.odontologoNombre}</span>
                      {t.dienteNumero && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-primary">Pieza #{t.dienteNumero}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>📅 {t.fechaRealizacion ? t.fechaRealizacion.split('T')[0] : 'Reciente'}</span>
                    </div>

                    {t.observaciones && (
                      <p className="text-[11px] text-secondary bg-white/70 p-2 rounded-lg border border-border-subtle/40 mt-0.5">
                        {t.observaciones}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowHistorialModal(false)}
              className="w-full mt-2 py-3 rounded-xl bg-primary text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Cerrar Resumen de Historial
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AGREGAR O MODIFICAR TRATAMIENTO EN PRESUPUESTO CONCERTADO
         ========================================================================= */}
      {showModalAddTratamientoPresupuesto && (
        <div className="fixed inset-0 z-50 bg-dental-deep-navy/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-clean-white w-full max-w-md rounded-3xl p-5 flex flex-col gap-3 shadow-2xl animate-in zoom-in-95 border border-border-subtle">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_task</span>
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-sm text-dental-deep-navy">
                    Agregar Procedimiento Concertado
                  </h4>
                  <p className="text-[11px] text-secondary">Fijar costo acordado con el paciente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModalAddTratamientoPresupuesto(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Selector de Catálogo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy">Tratamiento del Catálogo</label>
              <select
                value={tempTratId}
                onChange={(e) => {
                  setTempTratId(e.target.value);
                  const trat = catalogoTratamientos.find((t) => t.id === e.target.value);
                  if (trat) setTempCostoUsd(trat.costoUsd);
                }}
                className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              >
                {catalogoTratamientos.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.codigo}] {t.nombre} (${t.costoUsd} USD)
                  </option>
                ))}
              </select>
            </div>

            {/* Pieza FDI y Costo Acordado */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-dental-deep-navy">Pieza FDI (Opcional)</label>
                <input
                  type="number"
                  placeholder="Ej. 16, 24, 46..."
                  value={tempPiezaFdi}
                  onChange={(e) => setTempPiezaFdi(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-dental-deep-navy">Costo Acordado ($ USD)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={tempCostoUsd}
                  onChange={(e) => setTempCostoUsd(parseFloat(e.target.value) || 0)}
                  className="h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="text-[11px] text-secondary bg-surface-subtle-ice p-2.5 rounded-xl border border-border-subtle">
              Equivalente en Bolívares:{' '}
              <strong className="text-dental-deep-navy">
                {(tempCostoUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
              </strong>{' '}
              (Tasa BCV {tasaBcv.toFixed(2)})
            </div>

            <div className="flex gap-2 pt-1 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowModalAddTratamientoPresupuesto(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface-subtle-ice text-secondary font-bold text-xs hover:bg-border-subtle transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAgregarItemPresupuesto}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-dental-deep-navy text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Agregar al Presupuesto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón Flotante Agendar Cita */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => onNavigateTab?.('reserva')}
          className="py-3 px-5 rounded-full bg-primary hover:bg-dental-deep-navy text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 active:scale-95 ring-2 ring-surface-container cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add_alarm</span>
          <span>Agendar Cita</span>
        </button>
      </div>
    </div>
  );
};
