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
import { compressImage } from '../../utils/imageCompression';

export interface CitaAprobadaConsulta {
  id: string;
  sedeId: string;
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
  const [filtroSede, setFiltroSede] = useState<string>('todas');
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

  // Evolución Clínica de la Cita con Foto de Prescripción/Reposo
  const [evoluciones, setEvoluciones] = useState<EvolucionClinicaItem[]>([]);
  const [modoNuevaEvolucion, setModoNuevaEvolucion] = useState(false);
  const [textoNuevaEvolucion, setTextoNuevaEvolucion] = useState('');
  const [indicacionesReceta, setIndicacionesReceta] = useState('');
  const [fotoPrescripcion, setFotoPrescripcion] = useState<string | null>(null);
  const [tipoAdjuntoEvolucion, setTipoAdjuntoEvolucion] = useState<'receta' | 'indicaciones' | 'reposo'>('receta');
  const [doctorEvolucionSeleccionado, setDoctorEvolucionSeleccionado] = useState<string>('');
  const [isSavingEvolucion, setIsSavingEvolucion] = useState(false);
  const [mensajeEvolucionExito, setMensajeEvolucionExito] = useState<string | null>(null);
  const [modalFotoAmpliada, setModalFotoAmpliada] = useState<{ url: string; titulo: string } | null>(null);

  // Radiografía Digital (Sensor RVG 2.0) - Última Tarjeta
  const [radiografias, setRadiografias] = useState<RadiografiaItem[]>([]);
  const [rxVisualizada, setRxVisualizada] = useState<string | null>(null);
  const [rxPendienteGuardar, setRxPendienteGuardar] = useState<string | null>(null);
  const [filtroAltoContraste, setFiltroAltoContraste] = useState(false);
  const [isUploadingRx, setIsUploadingRx] = useState(false);
  const [isSavingRx, setIsSavingRx] = useState(false);
  const [mensajeRxExito, setMensajeRxExito] = useState<string | null>(null);
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
              sedeId: c.sedeId || c.sede_id || 'victoria',
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

  // Citas aprobadas filtradas por sede (o todas)
  const citasPorSede = React.useMemo(() => {
    if (filtroSede === 'todas') return citasAprobadas;
    return citasAprobadas.filter((c) => c.sedeId === filtroSede);
  }, [citasAprobadas, filtroSede]);

  // Fechas disponibles para la sede seleccionada
  const fechasDisponiblesSede = React.useMemo(() => {
    return Array.from(new Set(citasPorSede.map((c) => c.fechaCita)));
  }, [citasPorSede]);

  // Auto-ajustar fechaConsulta si la fecha activa no está en la sede
  useEffect(() => {
    if (fechasDisponiblesSede.length > 0 && (!fechaConsulta || !fechasDisponiblesSede.includes(fechaConsulta))) {
      setFechaConsulta(fechasDisponiblesSede[0]);
    }
  }, [fechasDisponiblesSede, fechaConsulta]);

  // Citas aprobadas finales filtradas por sede y por fecha
  const citasFiltradas = React.useMemo(() => {
    return citasPorSede.filter((c) => !fechaConsulta || c.fechaCita === fechaConsulta);
  }, [citasPorSede, fechaConsulta]);

  // Sincronizar selectedCitaId con la lista filtrada
  useEffect(() => {
    if (citasFiltradas.length > 0) {
      const exists = citasFiltradas.some((c) => c.id === selectedCitaId);
      if (!exists) {
        setSelectedCitaId(citasFiltradas[0].id);
      }
    } else {
      setSelectedCitaId('');
    }
  }, [citasFiltradas, selectedCitaId]);

  // Cita y Paciente actualmente seleccionado en el sillón
  const selectedCita = React.useMemo(() => {
    return (
      citasFiltradas.find((c) => c.id === selectedCitaId) ||
      citasFiltradas[0] ||
      null
    );
  }, [citasFiltradas, selectedCitaId]);

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

  // Actualización de pieza en el Odontograma FDI con soporte reactivo inmediato
  const handleUpdateTooth = async (updatedTooth: ToothRecord) => {
    if (!selectedCita?.pacienteId) return;
    setTeeth((prev) => {
      const exists = prev.some((t) => t.numeroFdi === updatedTooth.numeroFdi);
      if (exists) {
        return prev.map((t) => (t.numeroFdi === updatedTooth.numeroFdi ? updatedTooth : t));
      }
      return [...prev, updatedTooth];
    });
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

  // 4. Manejo de Evolución Clínica con Foto de Prescripción / Reposo (Comprimida en Cliente)
  const handleSubirFotoPrescripcion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.75 });
      setFotoPrescripcion(compressed);
    } catch (err) {
      console.error('Error comprimiendo foto de prescripción:', err);
      const reader = new FileReader();
      reader.onload = () => setFotoPrescripcion(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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
          fotoPrescripcionData: fotoPrescripcion || undefined,
          tipoAdjunto: tipoAdjuntoEvolucion,
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
          fotoPrescripcionData: fotoPrescripcion || undefined,
          tipoAdjunto: tipoAdjuntoEvolucion,
          createdAt: new Date().toISOString(),
        };

        setEvoluciones((prev) => [nueva, ...prev]);
        setModoNuevaEvolucion(false);
        setTextoNuevaEvolucion('');
        setIndicacionesReceta('');
        setFotoPrescripcion(null);
        setMensajeEvolucionExito('¡Evolución clínica con prescripción/reposo resguardada exitosamente en D1!');
      }
    } catch (err) {
      console.error('Error guardando evolución:', err);
    } finally {
      setIsSavingEvolucion(false);
    }
  };

  // 5. Manejo de Radiografía y Captura con Cámara (Compresión + Guardado con Confirmación)
  const handleSubirRadiografia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCita?.pacienteId) return;

    setIsUploadingRx(true);
    setMensajeRxExito(null);
    try {
      // Compresión cliente optimizada (max 1280px, 0.75 calidad JPEG)
      const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.75 });
      setRxPendienteGuardar(compressed);
      setRxVisualizada(compressed);
    } catch (err) {
      console.error('Error comprimiendo radiografía:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setRxPendienteGuardar(base64);
        setRxVisualizada(base64);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingRx(false);
    }
  };

  const handleGuardarRadiografia = async () => {
    if (!rxPendienteGuardar || !selectedCita?.pacienteId) return;

    setIsSavingRx(true);
    setMensajeRxExito(null);
    try {
      const res = await ApiClient.guardarRadiografia(
        selectedCita.pacienteId,
        {
          piezaFdi: piezaRx ? parseInt(piezaRx, 10) : undefined,
          tipo: 'periapical_rvg',
          imagenData: rxPendienteGuardar,
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
          imagenData: rxPendienteGuardar,
          observaciones: notaRx,
          fechaToma: new Date().toISOString(),
        };
        setRadiografias((prev) => [nuevaRx, ...prev]);
        setRxPendienteGuardar(null);
        setMensajeRxExito('¡Radiografía digital RVG 2.0 guardada y comprimida exitosamente en D1!');
        setTimeout(() => setMensajeRxExito(null), 4000);
      }
    } catch (err) {
      console.error('Error guardando radiografía:', err);
    } finally {
      setIsSavingRx(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* =========================================================================
          1. TARJETA SUPERIOR: CONTROL DE CITA ODONTOLÓGICA (FILTRO SEDE/FECHA & DROPDOWN)
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3.5 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">event_available</span>
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy leading-tight">
                Control de Cita Odontológica
              </h2>
              <p className="text-xs text-secondary">
                Atención clínica activa en sillón por sede y fecha de consulta
              </p>
            </div>
          </div>

          {/* Filtros Superiores: Sede y Fecha */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            {/* Filtro por Sede */}
            <div className="flex items-center gap-1.5 bg-surface-subtle-ice px-2.5 py-1 rounded-xl border border-border-subtle">
              <span className="text-[11px] font-bold text-secondary">Sede:</span>
              <select
                value={filtroSede}
                onChange={(e) => setFiltroSede(e.target.value)}
                className="bg-transparent text-xs font-bold text-dental-deep-navy focus:outline-none cursor-pointer"
              >
                <option value="todas">🌐 Todas las Sedes</option>
                <option value="victoria">📍 Sede La Victoria</option>
                <option value="tovar">📍 Sede La Colonia Tovar</option>
              </select>
            </div>

            {/* Filtro por Fecha de Consulta */}
            <div className="flex items-center gap-1.5 bg-surface-subtle-ice px-2.5 py-1 rounded-xl border border-border-subtle">
              <span className="text-[11px] font-bold text-secondary">Fecha:</span>
              <select
                value={fechaConsulta}
                onChange={(e) => setFechaConsulta(e.target.value)}
                className="bg-transparent text-xs font-bold text-dental-deep-navy focus:outline-none cursor-pointer"
              >
                {fechasDisponiblesSede.length === 0 ? (
                  <option value="">Sin citas</option>
                ) : (
                  fechasDisponiblesSede.map((f) => {
                    const cant = citasPorSede.filter((c) => c.fechaCita === f).length;
                    return (
                      <option key={f} value={f}>
                        {f} ({cant} {cant === 1 ? 'cita' : 'citas'})
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Lista Desplegable de Pacientes Citados para Comodidad Visual */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-dental-deep-navy flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[17px] text-primary">person_search</span>
              <span>Paciente en Consulta (Lista de Pacientes Citados)</span>
            </span>
            <span className="text-[11px] font-semibold text-secondary">
              {citasFiltradas.length} {citasFiltradas.length === 1 ? 'paciente con cita aprobada' : 'pacientes con cita aprobada'}
            </span>
          </label>

          {loadingCitas ? (
            <div className="p-3 text-center text-xs text-secondary flex items-center justify-center gap-2 bg-surface-subtle-ice rounded-xl border border-border-subtle">
              <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
              <span>Cargando citas aprobadas desde D1...</span>
            </div>
          ) : citasFiltradas.length === 0 ? (
            <div className="p-3.5 text-center text-xs text-secondary bg-surface-subtle-ice rounded-xl border border-border-subtle">
              No se registran pacientes con cita aprobada para la sede y fecha seleccionadas.
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedCita?.id || ''}
                onChange={(e) => setSelectedCitaId(e.target.value)}
                className="w-full h-11 px-3.5 pr-10 rounded-2xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer transition-all"
              >
                {citasFiltradas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.pacienteNombre} — {c.pacienteCedula} • {c.horaInicio} (Box {c.boxNumero || 1}) [{c.estado === 'en_sillon' ? '🟢 En Sillón' : 'Confirmada'}] — {c.sedeId === 'tovar' ? 'La Colonia Tovar' : 'La Victoria'}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-secondary">
                <span className="material-symbols-outlined text-[20px]">unfold_more</span>
              </div>
            </div>
          )}
        </div>

        {/* Sección de Datos del Paciente Seleccionado: Despliegue con Animación Responsiva */}
        {selectedCita && (
          <div
            key={selectedCita.id}
            className="pt-2 border-t border-border-subtle flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 duration-300"
          >
            {/* Ficha de Identidad & Acciones */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-surface-subtle-ice/60 p-3 rounded-2xl border border-border-subtle">
              <div className="flex items-start gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={selectedCita.avatarUrl}
                    alt={selectedCita.pacienteNombre}
                    className="w-13 h-13 rounded-2xl object-cover shadow-sm ring-2 ring-primary/20"
                  />
                  {selectedCita.estado === 'en_sillon' && (
                    <span
                      className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-status-success text-white shadow-xs animate-pulse"
                      title="Paciente en Sillón"
                    >
                      En Sillón
                    </span>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                      {selectedCita.pacienteNombre}
                    </h3>
                    <span className="font-mono font-bold text-xs bg-surface-container px-2.5 py-0.5 rounded-lg text-primary">
                      {selectedCita.pacienteCedula}
                    </span>
                    <span className="text-xs text-secondary font-semibold">
                      {calcularEdad(selectedCita.pacienteFechaNacimiento)} años • {selectedCita.pacienteSexo || 'Femenino'}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        selectedCita.estado === 'en_sillon'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {selectedCita.estado === 'en_sillon' ? '🟢 En Sillón' : '✓ Confirmada'}
                    </span>
                  </div>

                  {/* Datos Logísticos y Especialista */}
                  <div className="flex items-center gap-2 text-xs text-secondary mt-1 flex-wrap">
                    <span>👨‍⚕️ Facultativo: <strong className="text-dental-deep-navy">{selectedCita.doctorNombre || doctorActivo}</strong></span>
                    <span>•</span>
                    <span>Box 0{selectedCita.boxNumero || 1} ({selectedCita.sedeId === 'tovar' ? 'La Colonia Tovar' : 'La Victoria'})</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-dental-deep-navy">⏰ {selectedCita.horaInicio}</span>
                  </div>
                </div>
              </div>

              {/* Botones de Comunicación Inmediata */}
              <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                <a
                  href={`tel:${selectedCita.pacienteTelefono}`}
                  aria-label="Llamar al paciente"
                  className="w-9 h-9 rounded-xl bg-surface-clean-white border border-border-subtle text-primary flex items-center justify-center active:scale-95 transition-all shadow-xs hover:bg-surface-container"
                  title="Llamar al paciente"
                >
                  <span className="material-symbols-outlined text-[18px]">phone</span>
                </a>
                <a
                  href={`https://wa.me/${selectedCita.pacienteTelefono.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Enviar WhatsApp"
                  className="w-9 h-9 rounded-xl bg-status-success/15 border border-status-success/20 text-status-success flex items-center justify-center active:scale-95 transition-all shadow-xs hover:bg-status-success/25"
                  title="Escribir por WhatsApp"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </a>
              </div>
            </div>

            {/* Motivo de la Cita / Tratamiento en Reserva */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-dental-deep-navy flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">assignment</span>
              <div className="flex-1">
                <span className="font-bold text-primary">Tratamiento Reportado en Reserva:</span>{' '}
                <span className="font-medium">{selectedCita.motivoConsulta}</span>
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

            {/* Adjuntar Foto de Prescripción, Indicaciones o Reposo Médico */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-surface-subtle-ice border border-border-subtle">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-dental-deep-navy flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[17px]">receipt_long</span>
                  <span>Adjuntar Foto de Prescripción, Indicaciones o Reposo Médico</span>
                </label>

                {/* Selector de Tipo de Documento Adjunto */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTipoAdjuntoEvolucion('receta')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      tipoAdjuntoEvolucion === 'receta'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white border border-border-subtle text-secondary'
                    }`}
                  >
                    💊 Receta
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoAdjuntoEvolucion('indicaciones')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      tipoAdjuntoEvolucion === 'indicaciones'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white border border-border-subtle text-secondary'
                    }`}
                  >
                    📋 Indicaciones
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoAdjuntoEvolucion('reposo')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      tipoAdjuntoEvolucion === 'reposo'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white border border-border-subtle text-secondary'
                    }`}
                  >
                    🏥 Reposo
                  </button>
                </div>
              </div>

              {/* Botón e Input de Cámara / Archivo */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="foto-prescripcion-upload"
                className="hidden"
                onChange={handleSubirFotoPrescripcion}
              />

              {fotoPrescripcion ? (
                <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={fotoPrescripcion}
                      alt="Foto Adjunta"
                      className="w-12 h-12 rounded-lg object-cover ring-2 ring-primary cursor-pointer hover:opacity-90"
                      onClick={() => setModalFotoAmpliada({
                        url: fotoPrescripcion,
                        titulo: `Vista Previa: ${tipoAdjuntoEvolucion === 'reposo' ? 'Reposo Médico' : tipoAdjuntoEvolucion === 'indicaciones' ? 'Indicaciones Clínicas' : 'Receta Médica'}`
                      })}
                    />
                    <div>
                      <span className="text-xs font-bold text-dental-deep-navy block">
                        Foto de {tipoAdjuntoEvolucion === 'reposo' ? 'Reposo Médico' : tipoAdjuntoEvolucion === 'indicaciones' ? 'Indicaciones' : 'Prescripción'} lista
                      </span>
                      <span className="text-[10px] text-status-success font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        <span>Se adjuntará al firmar la evolución</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFotoPrescripcion(null)}
                    className="p-1.5 rounded-lg text-secondary hover:text-status-danger hover:bg-rose-50 transition-all cursor-pointer"
                    title="Quitar foto"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="foto-prescripcion-upload"
                  className="py-2 px-3 rounded-xl border border-dashed border-primary/40 bg-white/70 hover:bg-white text-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                  <span>📸 Tomar Foto con Cámara o Cargar Documento</span>
                </label>
              )}
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

              {/* Foto de Prescripción / Reposo Adjunto si Existe */}
              {evoluciones[0].fotoPrescripcionData && (
                <div className="mt-1 p-2.5 rounded-xl bg-white border border-border-subtle flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={evoluciones[0].fotoPrescripcionData}
                      alt="Foto de Receta / Reposo"
                      className="w-12 h-12 rounded-lg object-cover ring-1 ring-border-subtle cursor-pointer hover:opacity-90"
                      onClick={() => setModalFotoAmpliada({
                        url: evoluciones[0].fotoPrescripcionData!,
                        titulo: `Adjunto Clínico: ${evoluciones[0].tipoAdjunto === 'reposo' ? 'Reposo Médico' : evoluciones[0].tipoAdjunto === 'indicaciones' ? 'Indicaciones' : 'Receta Médica'}`
                      })}
                    />
                    <div>
                      <span className="text-xs font-bold text-dental-deep-navy block">
                        {evoluciones[0].tipoAdjunto === 'reposo'
                          ? '🏥 Reposo Médico Adjunto'
                          : evoluciones[0].tipoAdjunto === 'indicaciones'
                          ? '📋 Indicaciones Postoperatorias Adjuntas'
                          : '💊 Receta Médica Adjunta'}
                      </span>
                      <span className="text-[10px] text-secondary">Pulsa la foto para verla ampliada en pantalla completa</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalFotoAmpliada({
                      url: evoluciones[0].fotoPrescripcionData!,
                      titulo: `Adjunto Clínico: ${evoluciones[0].tipoAdjunto === 'reposo' ? 'Reposo Médico' : evoluciones[0].tipoAdjunto === 'indicaciones' ? 'Indicaciones' : 'Receta Médica'}`
                    })}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
                  >
                    Ver Foto
                  </button>
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

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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
              <span>{isUploadingRx ? 'Comprimiendo...' : 'Tomar / Adjuntar Foto'}</span>
            </label>

            {rxPendienteGuardar && (
              <button
                type="button"
                onClick={handleGuardarRadiografia}
                disabled={isSavingRx}
                className="px-3.5 py-1.5 rounded-xl bg-status-success hover:bg-emerald-600 text-white text-xs font-extrabold transition-all active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer animate-pulse disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{isSavingRx ? 'Guardando en D1...' : '💾 Guardar Cambios'}</span>
              </button>
            )}

            {rxPendienteGuardar && (
              <button
                type="button"
                onClick={() => {
                  setRxPendienteGuardar(null);
                  if (radiografias.length > 0) {
                    setRxVisualizada(radiografias[0].imagenData || radiografias[0].r2StorageUrl || null);
                  } else {
                    setRxVisualizada(null);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-red-50 text-secondary hover:text-red-600 text-xs font-bold transition-all"
                title="Descartar foto pendiente"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {mensajeRxExito && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            <span>{mensajeRxExito}</span>
          </div>
        )}

        {rxPendienteGuardar && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">photo_size_select_large</span>
              <span>Foto comprimida en cliente lista para guardar en D1.</span>
            </div>
            <button
              type="button"
              onClick={handleGuardarRadiografia}
              disabled={isSavingRx}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shadow-xs cursor-pointer shrink-0"
            >
              Confirmar y Guardar
            </button>
          </div>
        )}

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

      {/* Modal para Visualizar Foto de Prescripción / Reposo Ampliada */}
      {modalFotoAmpliada && (
        <div
          className="fixed inset-0 z-50 bg-dental-deep-navy/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setModalFotoAmpliada(null)}
        >
          <div
            className="bg-surface-clean-white rounded-3xl max-w-2xl w-full p-4 flex flex-col gap-3 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                <h4 className="font-display font-extrabold text-sm text-dental-deep-navy">
                  {modalFotoAmpliada.titulo}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalFotoAmpliada(null)}
                className="w-8 h-8 rounded-full bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-dental-ambient-bg rounded-2xl p-2">
              <img
                src={modalFotoAmpliada.url}
                alt={modalFotoAmpliada.titulo}
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-lg"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModalFotoAmpliada(null)}
                className="py-2 px-4 rounded-xl bg-dental-deep-navy text-white font-bold text-xs hover:bg-primary transition-all cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
