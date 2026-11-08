import React, { useState, useEffect } from 'react';
import { useSede } from '../../context/SedeContext';
import { useTasaCambio } from '../../context/TasaCambioContext';
import { ApiClient } from '../../services/api';
import {
  ToothRecord,
  TratamientoRealizadoItem,
  TratamientoItem,
  OdontologoItem,
  HigienistaItem,
  CondicionMedicaItem,
  EvolucionClinicaItem,
  RadiografiaItem,
} from '../../types/clinical';
import { QuadrantArchView } from './QuadrantArchView';
import { TabId } from '../layout/BottomNavigation';
import { compressImage } from '../../utils/imageCompression';
import { generateForensicSeal } from '../../utils/forensicHash';
import { DeterministicIdenticon } from '../../utils/identicon';
import { triggerClinicalConfetti } from '../../utils/confetti';
import { exportClinicalEvolutionVideo } from '../../utils/clinicalVideoExporter';

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

  // Higienistas y Asistentes Clínicos de Data Oficial
  const [staffHigienistas, setStaffHigienistas] = useState<HigienistaItem[]>([]);
  const [asistenteSeleccionadoId, setAsistenteSeleccionadoId] = useState<string>('hig-1');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);

  // Estados y Funcionalidad para Cierre y Confirmación del Formulario con Resumen Emergente
  const [showModalConfirmarCierre, setShowModalConfirmarCierre] = useState(false);
  const [isGuardandoTodo, setIsGuardandoTodo] = useState(false);
  const [mensajeCierreExito, setMensajeCierreExito] = useState<string | null>(null);

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

  // Radiografía Digital (Sensor RVG 2.0) - Tarjeta RVG
  const [radiografias, setRadiografias] = useState<RadiografiaItem[]>([]);
  const [rxVisualizada, setRxVisualizada] = useState<string | null>(null);
  const [rxPendienteGuardar, setRxPendienteGuardar] = useState<string | null>(null);
  const [filtroAltoContraste, setFiltroAltoContraste] = useState(false);
  const [isUploadingRx, setIsUploadingRx] = useState(false);
  const [isSavingRx, setIsSavingRx] = useState(false);
  const [mensajeRxExito, setMensajeRxExito] = useState<string | null>(null);
  const [notaRx, setNotaRx] = useState('Inspección apical RVG 2.0 en sillón');
  const [piezaRx, setPiezaRx] = useState<string>('16');

  // Subida y compresión cliente de foto de perfil del paciente
  const handleSubirAvatarPaciente = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCita) return;
    setIsCompressingAvatar(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 300, maxHeight: 300, quality: 0.8 });
      const cedulaKey = `paciente_avatar_${selectedCita.pacienteCedula || selectedCita.pacienteId}`;
      localStorage.setItem(cedulaKey, compressed);
      setCitasAprobadas((prev) =>
        prev.map((c) => (c.id === selectedCita.id ? { ...c, avatarUrl: compressed } : c))
      );
    } catch (err) {
      console.error('Error al comprimir foto de perfil:', err);
    } finally {
      setIsCompressingAvatar(false);
      e.target.value = '';
    }
  };

  // Guardado manual del Odontograma FDI
  const handleGuardarOdontogramaManual = async () => {
    if (!selectedCita) return;
    try {
      const nowIso = new Date().toISOString();
      for (const t of teeth) {
        await ApiClient.guardarPiezaOdontograma(
          selectedCita.pacienteId,
          {
            ...t,
            updatedAt: nowIso,
            actualizadoPor: doctorActivo,
          },
          sedeId
        );
      }
    } catch (err) {
      console.error('Error al guardar odontograma manual:', err);
    }
  };

  // Piezas con procedimientos o patologías marcadas en el odontograma
  const piezasModificadas = React.useMemo(() => {
    return teeth.filter((t) => {
      const tieneCaras = t.surfaces && Object.values(t.surfaces).some((s) => s !== 'sano');
      const tieneProc = t.procedimientoGeneral && t.procedimientoGeneral !== 'ninguno';
      return tieneCaras || tieneProc || t.isAbsent;
    });
  }, [teeth]);

  // Cierre Integral del Formulario con Guardado en D1
  const handleConfirmarYGuardarTodo = async () => {
    if (!selectedCita) return;
    setIsGuardandoTodo(true);
    try {
      const nowIso = new Date().toISOString();
      // 1. Guardar piezas del odontograma
      for (const t of teeth) {
        await ApiClient.guardarPiezaOdontograma(
          selectedCita.pacienteId,
          {
            ...t,
            updatedAt: nowIso,
            actualizadoPor: doctorActivo,
          },
          sedeId
        );
      }

      // 2. Guardar Presupuesto Concertado en D1 si hay items
      if (itemsPresupuesto.length > 0) {
        const resumenProcedimientos = itemsPresupuesto
          .map((it) => `${it.nombre}${it.dienteFdi ? ` (#${it.dienteFdi})` : ''}`)
          .join(' + ');

        await ApiClient.crearPresupuesto({
          pacienteId: selectedCita.pacienteId,
          sedeId,
          montoTotalUsd: totalPresupuestoUsd,
          tasaBcvReferencia: tasaBcv,
          procedimiento: resumenProcedimientos,
        });
      }

      // 3. Persistir Asistente asignado
      localStorage.setItem(`asistente_cita_${selectedCita.id}`, asistenteSeleccionadoId);

      // 4. Actualizar estado de la cita a "completada"
      setCitasAprobadas((prev) =>
        prev.map((c) => (c.id === selectedCita.id ? { ...c, estado: 'completada' } : c))
      );

      triggerClinicalConfetti();
      setShowModalConfirmarCierre(false);
      setMensajeCierreExito(
        `¡Atención clínica de ${selectedCita.pacienteNombre} cerrada y archivada en Cloudflare D1 exitosamente!`
      );
      setTimeout(() => setMensajeCierreExito(null), 6000);
    } catch (err) {
      console.error('Error al guardar y cerrar formulario:', err);
    } finally {
      setIsGuardandoTodo(false);
    }
  };

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

        // Cargar Higienistas desde D1 o LocalStorage
        if (data?.higienistas && Array.isArray(data.higienistas) && data.higienistas.length > 0) {
          setStaffHigienistas(data.higienistas);
          setAsistenteSeleccionadoId(data.higienistas[0].id);
        } else {
          try {
            const saved = localStorage.getItem('odontosalud_data_higienistas');
            if (saved) {
              const parsed = JSON.parse(saved);
              setStaffHigienistas(parsed);
              if (parsed.length > 0) setAsistenteSeleccionadoId(parsed[0].id);
            }
          } catch {}
        }

        // Mapear todas las citas pre-aprobadas y generadas en reservas
        let rawCitas: any[] = [];
        if (data?.citas && Array.isArray(data.citas)) {
          rawCitas = [...data.citas];
        }
        try {
          const localSaved = localStorage.getItem('odontosalud_data_citas');
          if (localSaved) {
            const parsedLocal = JSON.parse(localSaved);
            if (Array.isArray(parsedLocal)) {
              parsedLocal.forEach((lc: any) => {
                if (!rawCitas.some((rc: any) => rc.id === lc.id)) {
                  rawCitas.push(lc);
                }
              });
            }
          }
        } catch {}

        if (rawCitas.length > 0) {
          const citasValidas = rawCitas
            .filter((c: any) => c.estado !== 'cancelada')
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
                (typeof window !== 'undefined'
                  ? localStorage.getItem(`paciente_avatar_${c.pacienteCedula || c.paciente_cedula || c.pacienteId || c.id}`)
                  : null) ||
                c.avatarUrl ||
                c.avatar_url ||
                (c.pacienteSexo === 'Masculino'
                  ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
                  : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'),
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

    const handleDataChange = () => {
      cargarDatosIniciales();
    };
    window.addEventListener('odontosalud_data_updated', handleDataChange);
    window.addEventListener('storage', handleDataChange);
    return () => {
      window.removeEventListener('odontosalud_data_updated', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [sedeId]);

  // Citas aprobadas y generadas en reservas filtradas por sede (manteniendo únicamente el filtro de sedes)
  const citasFiltradas = React.useMemo(() => {
    if (filtroSede === 'todas') return citasAprobadas;
    return citasAprobadas.filter((c) => c.sedeId === filtroSede);
  }, [citasAprobadas, filtroSede]);

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
        if (data && data.length > 0) {
          setRxVisualizada(data[0].imagenData || data[0].r2StorageUrl || null);
        } else {
          setRxVisualizada(null);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCita?.pacienteId, sedeId]);

  // Manejo de modificación en tiempo real de una pieza dental del odontograma FDI
  const handleUpdateTooth = (updatedTooth: ToothRecord) => {
    setTeeth((prev) =>
      prev.map((t) => (t.numeroFdi === updatedTooth.numeroFdi ? updatedTooth : t))
    );
  };

  // 3. Manejo de Presupuesto Concertado en Consulta
  const handleAgregarItemPresupuesto = () => {
    const trat = catalogoTratamientos.find((t) => t.id === tempTratId);
    if (!trat) return;

    const newItem: ItemPresupuestoCita = {
      id: `item-${Date.now()}`,
      tratamientoId: trat.id,
      codigo: trat.codigo,
      nombre: trat.nombre,
      dienteFdi: tempPiezaFdi ? parseInt(tempPiezaFdi, 10) : undefined,
      costoUsd: tempCostoUsd,
    };

    setItemsPresupuesto((prev) => [...prev, newItem]);
    setShowModalAddTratamientoPresupuesto(false);
    setTempPiezaFdi('');
  };

  const handleEliminarItemPresupuesto = (id: string) => {
    setItemsPresupuesto((prev) => prev.filter((i) => i.id !== id));
  };

  const totalPresupuestoUsd = itemsPresupuesto.reduce((acc, curr) => acc + curr.costoUsd, 0);

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
        triggerClinicalConfetti();
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
      const doctorFirmante = doctorEvolucionSeleccionado || doctorActivo;
      const seal = await generateForensicSeal(
        `${textoNuevaEvolucion.trim()}|${indicacionesReceta.trim()}|${fotoPrescripcion || ''}`,
        {
          pacienteId: selectedCita.pacienteId,
          doctorNombre: doctorFirmante,
          tipoDocumento: 'evolucion_clinica',
        }
      );

      const res = await ApiClient.guardarEvolucion(
        selectedCita.pacienteId,
        {
          citaId: selectedCita.id,
          odontologoNombre: doctorFirmante,
          texto: textoNuevaEvolucion.trim(),
          indicacionesReceta: indicacionesReceta.trim(),
          fotoPrescripcionData: fotoPrescripcion || undefined,
          tipoAdjunto: tipoAdjuntoEvolucion,
          sha256Hash: seal.sha256Hash,
          selladoUtc: seal.selladoUtc,
          esNotaComplementaria: evoluciones.length > 0,
          evolucionPadreId: evoluciones[0]?.id,
        },
        sedeId
      );

      if (res.success) {
        const nueva: EvolucionClinicaItem = {
          id: res.id,
          pacienteId: selectedCita.pacienteId,
          citaId: selectedCita.id,
          odontologoNombre: doctorFirmante,
          texto: textoNuevaEvolucion.trim(),
          indicacionesReceta: indicacionesReceta.trim(),
          fotoPrescripcionData: fotoPrescripcion || undefined,
          tipoAdjunto: tipoAdjuntoEvolucion,
          sha256Hash: seal.sha256Hash,
          selladoUtc: seal.selladoUtc,
          esNotaComplementaria: evoluciones.length > 0,
        };

        setEvoluciones((prev) => [nueva, ...prev]);
        setTextoNuevaEvolucion('');
        setIndicacionesReceta('');
        setFotoPrescripcion(null);
        setModoNuevaEvolucion(false);
        setMensajeEvolucionExito('¡Evolución clínica y prescripción selladas forensemente en D1 con éxito!');
      }
    } catch (err: any) {
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
      const doctorFirmante = selectedCita.doctorNombre || doctorActivo;
      const seal = await generateForensicSeal(rxPendienteGuardar, {
        pacienteId: selectedCita.pacienteId,
        doctorNombre: doctorFirmante,
        tipoDocumento: 'radiografia_rvg',
      });

      const res = await ApiClient.guardarRadiografia(
        selectedCita.pacienteId,
        {
          piezaFdi: piezaRx ? parseInt(piezaRx, 10) : undefined,
          tipo: 'periapical_rvg',
          imagenData: rxPendienteGuardar,
          observaciones: notaRx,
          sha256Hash: seal.sha256Hash,
          selladoUtc: seal.selladoUtc,
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
          sha256Hash: seal.sha256Hash,
          selladoUtc: seal.selladoUtc,
          fechaToma: new Date().toISOString(),
        };

        setRadiografias((prev) => [nuevaRx, ...prev]);
        setRxPendienteGuardar(null);
        setMensajeRxExito('¡Radiografía digital RVG 2.0 guardada y sellada con hash forense en D1!');
      }
    } catch (err: any) {
      console.error('Error guardando radiografía:', err);
    } finally {
      setIsSavingRx(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* =========================================================================
          1. TARJETA SUPERIOR: CONTROL DE CITA ODONTOLÓGICA (CARRUSEL TÁCTIL)
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3.5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">event_available</span>
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy leading-tight">
                Control de Cita Odontológica
              </h2>
              <p className="text-xs text-secondary">
                Atención clínica activa en sillón por sede de consulta
              </p>
            </div>
          </div>

          {/* Filtro Superior: Solo Sede (La Victoria / Colonia Tovar / Todas) */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 bg-surface-subtle-ice px-3 h-8 rounded-xl border border-border-subtle shadow-2xs">
              <span className="text-[11px] font-bold text-secondary">Sede:</span>
              <select
                value={filtroSede}
                onChange={(e) => setFiltroSede(e.target.value)}
                className="bg-transparent text-xs font-bold text-dental-deep-navy focus:outline-none cursor-pointer"
              >
                <option value="todas">🌐 Todas las Sedes</option>
                <option value="victoria">🏢 Sede La Victoria</option>
                <option value="tovar">🌲 Sede Colonia Tovar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Carrusel Táctil de Tarjetas de Citas Pre-Aprobadas y de Reservas */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-dental-deep-navy flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[17px] text-primary">view_carousel</span>
              <span>Citas Pre-Aprobadas & Reservas ({citasFiltradas.length})</span>
            </span>
            <span className="text-[11px] text-secondary font-medium">
              Desliza horizontalmente y toca una tarjeta para cargar paciente
            </span>
          </div>

          {loadingCitas ? (
            <div className="p-4 text-center text-xs text-secondary flex items-center justify-center gap-2 bg-surface-subtle-ice rounded-2xl border border-border-subtle">
              <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
              <span>Cargando citas pre-aprobadas...</span>
            </div>
          ) : citasFiltradas.length === 0 ? (
            <div className="p-6 text-center text-xs text-secondary bg-surface-subtle-ice rounded-2xl border border-dashed border-border-subtle">
              No se registran citas pre-aprobadas para la sede seleccionada.
            </div>
          ) : (
            <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin scroll-smooth snap-x">
              {citasFiltradas.map((c) => {
                const isSelected = c.id === selectedCitaId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCitaId(c.id)}
                    className={`min-w-[250px] sm:min-w-[275px] max-w-[290px] snap-start rounded-2xl p-3 border transition-all text-left flex flex-col justify-between active:scale-95 cursor-pointer relative ${
                      isSelected
                        ? 'bg-dental-deep-navy text-white border-primary shadow-md ring-2 ring-primary/40'
                        : 'bg-white hover:bg-surface-subtle-ice border-border-subtle text-dental-deep-navy hover:border-primary/40 shadow-2xs'
                    }`}
                  >
                    {/* Header de la Tarjeta del Carrusel */}
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-black tabular-nums ${isSelected ? 'text-amber-300' : 'text-primary'}`}>
                          {c.horaInicio}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'
                        }`}>
                          Box 0{c.boxNumero || 1}
                        </span>
                      </div>

                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                        c.estado === 'en_sillon'
                          ? isSelected
                            ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isSelected
                          ? 'bg-white/15 text-white/90 border-white/20'
                          : 'bg-sky-50 text-sky-800 border-sky-200'
                      }`}>
                        {c.estado === 'en_sillon' ? '🟢 En Sillón' : '✓ Pre-Aprobada'}
                      </span>
                    </div>

                    {/* Paciente y Metadatos */}
                    <div className="flex items-center gap-2.5 my-1">
                      <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-border-subtle/60">
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt={c.pacienteNombre} className="w-full h-full object-cover" />
                        ) : (
                          <DeterministicIdenticon seed={c.pacienteCedula} name={c.pacienteNombre} size={36} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-white' : 'text-dental-deep-navy'}`}>
                          {c.pacienteNombre}
                        </h4>
                        <p className={`text-[10px] font-mono mt-0.5 truncate ${isSelected ? 'text-white/70' : 'text-secondary'}`}>
                          {c.pacienteCedula} • {c.fechaCita}
                        </p>
                      </div>
                    </div>

                    {/* Footer de la Tarjeta del Carrusel: Motivo & Sede */}
                    <div className={`mt-2 pt-1.5 border-t text-[10px] flex items-center justify-between gap-1 ${
                      isSelected ? 'border-white/15 text-white/80' : 'border-border-subtle/60 text-secondary'
                    }`}>
                      <span className="truncate font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] shrink-0 opacity-70">dentistry</span>
                        <span className="truncate">{c.motivoConsulta}</span>
                      </span>
                      <span className="shrink-0 font-semibold text-[9.5px]">
                        {c.sedeId === 'tovar' ? 'Col. Tovar' : 'La Victoria'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sección de Datos del Paciente Seleccionado - Orden Profesional Clínico */}
        {selectedCita && (
          <div
            key={selectedCita.id}
            className="pt-3 border-t border-border-subtle flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 duration-300"
          >
            {/* 1. Tarjeta Principal de Identidad y Expediente */}
            <div className="bg-surface-subtle-ice/60 p-3.5 sm:p-4 rounded-2xl border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar Clínico con Botón Foto Sincronizado al Ancho Exacto */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="relative">
                    {selectedCita.avatarUrl ? (
                      <img
                        src={selectedCita.avatarUrl}
                        alt={selectedCita.pacienteNombre}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/30 shadow-xs"
                      />
                    ) : (
                      <DeterministicIdenticon
                        seed={selectedCita.pacienteCedula || selectedCita.pacienteId}
                        name={selectedCita.pacienteNombre}
                        size={56}
                      />
                    )}
                    {selectedCita.estado === 'en_sillon' && (
                      <span
                        className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-black bg-status-success text-white shadow-xs animate-pulse"
                        title="Paciente activo en sillón dental"
                      >
                        En Sillón
                      </span>
                    )}
                  </div>

                  <label
                    htmlFor="paciente-avatar-input"
                    className="w-14 py-1 px-1 rounded-lg bg-surface-clean-white hover:bg-surface-container border border-border-subtle text-[9px] font-black text-dental-deep-navy text-center cursor-pointer shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1"
                    title="Actualizar foto de perfil del paciente"
                  >
                    <span className="material-symbols-outlined text-[11px] text-primary">add_a_photo</span>
                    <span>{isCompressingAvatar ? '...' : 'Foto'}</span>
                  </label>
                  <input
                    type="file"
                    id="paciente-avatar-input"
                    accept="image/*"
                    onChange={handleSubirAvatarPaciente}
                    className="hidden"
                  />
                </div>

                {/* Datos Clínicos y Demográficos */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-black text-base sm:text-lg text-dental-deep-navy leading-tight truncate">
                      {selectedCita.pacienteNombre}
                    </h3>
                    <span className="font-mono font-bold text-xs bg-surface-container px-2 py-0.5 rounded-lg text-primary border border-border-subtle">
                      {selectedCita.pacienteCedula}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        selectedCita.estado === 'en_sillon'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {selectedCita.estado === 'en_sillon' ? '🟢 En Sillón' : '✓ Cita Aprobada'}
                    </span>
                  </div>

                  {/* Fila de Metadatos: Edad, Sexo, Sede, Box y Horario */}
                  <div className="flex items-center gap-2 text-xs text-secondary mt-1 flex-wrap font-medium">
                    <span>{calcularEdad(selectedCita.pacienteFechaNacimiento)} años • {selectedCita.pacienteSexo || 'Femenino'}</span>
                    <span>•</span>
                    <span className="text-dental-deep-navy font-bold">Box 0{selectedCita.boxNumero || 1}</span>
                    <span>•</span>
                    <span>{selectedCita.sedeId === 'tovar' ? 'Sede Colonia Tovar' : 'Sede La Victoria'}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-primary">⏰ {selectedCita.horaInicio}</span>
                  </div>

                  <div className="text-[11px] text-secondary mt-1 flex items-center gap-1 truncate">
                    <span>👨‍⚕️ Facultativo Tratante:</span>
                    <strong className="text-dental-deep-navy">{selectedCita.doctorNombre || doctorActivo}</strong>
                  </div>
                </div>
              </div>

              {/* Botón Único y Limpio: Historial Clínico Completo */}
              <button
                type="button"
                onClick={() => setShowHistorialModal(true)}
                className="h-9 px-3.5 rounded-xl bg-dental-deep-navy hover:bg-primary text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-center shrink-0"
                title="Consultar historial clínico completo y notas previas del paciente"
              >
                <span className="material-symbols-outlined text-[17px]">menu_book</span>
                <span>Historial Clínico ({historialTratamientos.length})</span>
              </button>
            </div>

            {/* 2. Cuadrícula de Información Médica y Diagnóstico en 2 Columnas Equilibradas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Motivo de la Cita / Tratamiento en Reserva */}
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/15 text-xs text-dental-deep-navy flex flex-col justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <span className="material-symbols-outlined text-[18px]">assignment</span>
                  <span>Tratamiento Concertado en Reserva</span>
                </div>
                <p className="font-semibold text-dental-deep-navy text-xs leading-relaxed">
                  {selectedCita.motivoConsulta}
                </p>
                <span className="text-[10px] text-secondary font-medium">
                  Atención agendada para la fecha: {selectedCita.fechaCita}
                </span>
              </div>

              {/* Información Médica Relevante (Clinical Safety Alert) */}
              <div className="p-3.5 rounded-2xl border text-xs flex flex-col justify-between gap-1.5 bg-surface-subtle-ice border-border-subtle">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-dental-deep-navy">
                    <span className="material-symbols-outlined text-[18px] text-primary">medical_information</span>
                    <span>Anamnesis & Seguridad Médica</span>
                  </div>

                  {condicionMedicaActiva && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase ${
                        condicionMedicaActiva.nivelRiesgo === 'Crítico'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : condicionMedicaActiva.nivelRiesgo === 'Alto'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      Riesgo {condicionMedicaActiva.nivelRiesgo}
                    </span>
                  )}
                </div>

                {condicionMedicaActiva ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-dental-deep-navy">
                      Condición: <span className="text-primary font-bold">{condicionMedicaActiva.nombre}</span> ({condicionMedicaActiva.codigoCie})
                    </p>
                    <p className="text-secondary text-[11px] leading-relaxed">
                      <strong>Protocolo:</strong> {condicionMedicaActiva.protocoloDental}
                    </p>
                    {condicionMedicaActiva.requiereProfilaxisAntibiotica && (
                      <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                        ⚠️ Requiere Profilaxis Antibiótica Previa
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-secondary text-[11px] italic">
                    Sin patologías de alerta sistémica reportadas. Anamnesis basal dentro de límites normales.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          2. TARJETA: HIGIENISTA / ASISTENTE EN CITA
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">clean_hands</span>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-dental-deep-navy leading-tight">
                Higienista / Asistente en Cita
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Personal de bioseguridad y soporte clínico a cuatro manos asignado a esta atención
              </p>
            </div>
          </div>
        </div>

        {/* Desplegable con Data Oficial de Higienistas */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-dental-deep-navy flex items-center justify-between">
            <span>Seleccionar Asistente Odontológico Oficial</span>
            <span className="text-[11px] text-secondary font-medium">
              {staffHigienistas.length} disponibles en plantilla
            </span>
          </label>

          <div className="relative">
            <select
              value={asistenteSeleccionadoId}
              onChange={(e) => setAsistenteSeleccionadoId(e.target.value)}
              className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-xs appearance-none cursor-pointer"
            >
              {staffHigienistas.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombres}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary">
              <span className="material-symbols-outlined text-[20px]">unfold_more</span>
            </div>
          </div>

          {/* Ficha Informativa del Asistente Seleccionado */}
          {(() => {
            const hSel = staffHigienistas.find((h) => h.id === asistenteSeleccionadoId) || staffHigienistas[0];
            if (!hSel) return null;
            return (
              <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-[18px]">badge</span>
                  <span className="font-bold text-indigo-950">{hSel.nombres}</span>
                  <span className="text-[11px] text-indigo-700 font-mono">({hSel.registroMpps})</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-indigo-900 font-medium">
                  <span>Área: <strong>{hSel.areaEspecialidad}</strong></span>
                  <span>•</span>
                  <span>Turno: <strong>{hSel.turno}</strong></span>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* =========================================================================
          3. TARJETA: ODONTOGRAMA FDI INTERACTIVO (PASO 3 DE 5)
         ========================================================================= */}
      {loadingTeeth ? (
        <div className="p-8 text-center text-secondary text-xs bg-surface-clean-white rounded-2xl border border-border-subtle flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
          <span>Sincronizando Odontograma con Cloudflare D1...</span>
        </div>
      ) : (
        <QuadrantArchView
          teeth={teeth}
          onUpdateTooth={handleUpdateTooth}
          onSaveOdontograma={handleGuardarOdontogramaManual}
          ultimaModificacion={
            teeth.length > 0 && teeth[0].updatedAt
              ? {
                  fecha: new Date(teeth[0].updatedAt).toLocaleDateString('es-VE', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  doctor: teeth[0].actualizadoPor || doctorActivo,
                }
              : undefined
          }
          isNuevoOdontograma={teeth.every((t) => !t.updatedAt)}
        />
      )}

      {/* =========================================================================
          4. TARJETA: PRESUPUESTO CONCERTADO DE LA CITA (PASO 4 DE 5)
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-dental-deep-navy leading-tight">
                Presupuesto Concertado de la Cita
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Arancel convenido en sillón sincronizado bimonetariamente a tasa oficial BCV ({tasaBcv.toFixed(2)} Bs/USD)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowModalAddTratamientoPresupuesto(true)}
              className="h-8 px-3 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>+ Agregar Procedimiento</span>
            </button>
          </div>
        </div>

        {/* Notificación de Éxito al Fijar Presupuesto */}
        {mensajePresupuestoExito && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            <span>{mensajePresupuestoExito}</span>
          </div>
        )}

        {/* Tabla de Procedimientos Presupuestados */}
        {itemsPresupuesto.length === 0 ? (
          <div className="p-6 text-center text-xs text-secondary bg-surface-subtle-ice rounded-xl border border-dashed border-border-subtle flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">receipt_long</span>
            <p>No se han añadido procedimientos al presupuesto de esta consulta.</p>
            <button
              type="button"
              onClick={() => setShowModalAddTratamientoPresupuesto(true)}
              className="text-primary font-bold hover:underline"
            >
              + Agregar primer tratamiento desde el catálogo
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle text-secondary font-bold">
                    <th className="pb-2">Código</th>
                    <th className="pb-2">Procedimiento Odontológico</th>
                    <th className="pb-2">Pieza FDI</th>
                    <th className="pb-2 text-right">Monto ($ USD)</th>
                    <th className="pb-2 text-right">Equivalente (Bs.)</th>
                    <th className="pb-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {itemsPresupuesto.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-subtle-ice/50">
                      <td className="py-2.5 font-mono text-primary font-bold">{item.codigo}</td>
                      <td className="py-2.5 font-semibold text-dental-deep-navy">{item.nombre}</td>
                      <td className="py-2.5 font-mono text-secondary">
                        {item.dienteFdi ? `#${item.dienteFdi}` : 'General / Arcada'}
                      </td>
                      <td className="py-2.5 text-right font-bold text-dental-deep-navy">
                        ${item.costoUsd.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-secondary">
                        {(item.costoUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarItemPresupuesto(item.id)}
                          className="text-secondary hover:text-rose-600 transition-colors p-1"
                          title="Eliminar ítem"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totalizador Bimonetario y Botón de Fijación */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-subtle-ice p-3 rounded-xl border border-border-subtle mt-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-secondary">Total Acordado:</span>
                <span className="font-display font-black text-lg text-emerald-600">
                  ${totalPresupuestoUsd.toFixed(2)} USD
                </span>
                <span className="text-xs font-mono font-bold text-secondary">
                  ~ {(totalPresupuestoUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                </span>
              </div>

              <button
                type="button"
                onClick={handleGuardarPresupuestoDefinitivo}
                disabled={isSavingPresupuesto}
                className="px-4 py-2 rounded-xl bg-status-success hover:bg-emerald-600 text-white text-xs font-extrabold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{isSavingPresupuesto ? 'Fijando en D1...' : 'Fijar Presupuesto Definitivo'}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          5. TARJETA: EVOLUCIÓN CLÍNICA DE LA CITA & RECETA (PASO 5 DE 5)
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-dental-deep-navy leading-tight">
                Evolución Clínica de la Cita
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Sellado forense SHA-256 e indicaciones postoperatorias inmutables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setModoNuevaEvolucion(!modoNuevaEvolucion)}
              className="h-8 px-3 rounded-xl bg-surface-subtle-ice hover:bg-primary hover:text-white border border-border-subtle text-primary text-xs font-extrabold transition-all active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {modoNuevaEvolucion ? 'visibility' : 'edit_note'}
              </span>
              <span>{modoNuevaEvolucion ? 'Ver Última Nota' : '+ Redactar Nueva Evolución'}</span>
            </button>
          </div>
        </div>

        {/* Notificación de Éxito al Guardar Evolución */}
        {mensajeEvolucionExito && (
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-teal-600 text-[18px]">verified</span>
            <span>{mensajeEvolucionExito}</span>
          </div>
        )}

        {modoNuevaEvolucion ? (
          /* Formulario de Redacción de Nueva Evolución */
          <form onSubmit={handleGuardarEvolucion} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-subtle-ice p-2.5 rounded-xl border border-border-subtle">
              <span className="text-xs font-bold text-dental-deep-navy">
                Doctor Tratante / Firmante:
              </span>
              <select
                value={doctorEvolucionSeleccionado}
                onChange={(e) => setDoctorEvolucionSeleccionado(e.target.value)}
                className="bg-surface-clean-white px-2.5 py-1 rounded-lg border border-border-subtle text-xs font-bold text-dental-deep-navy focus:outline-none cursor-pointer"
              >
                {staffOdontologos.map((doc) => (
                  <option key={doc.id} value={doc.nombres}>
                    {doc.nombres} ({doc.cov})
                  </option>
                ))}
              </select>
            </div>

            {/* Texto de la Evolución Clínica */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy">
                Nota de Evolución Odontológica del Día:
              </label>
              <textarea
                rows={3}
                required
                value={textoNuevaEvolucion}
                onChange={(e) => setTextoNuevaEvolucion(e.target.value)}
                placeholder="Describa el procedimiento ejecutado, anestesia empleada, aislamiento y conducta clínica..."
                className="w-full p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Indicaciones y Prescripción Médica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-dental-deep-navy">
                  Indicaciones Postoperatorias & Farmacoterapia:
                </label>
                <textarea
                  rows={2}
                  value={indicacionesReceta}
                  onChange={(e) => setIndicacionesReceta(e.target.value)}
                  placeholder="Ej. Ibuprofeno 400mg cada 8 horas por 3 días. Hielo local las primeras 24 horas..."
                  className="w-full p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs text-dental-deep-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Foto Adjunta de la Receta / Reposo Médico */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-dental-deep-navy flex items-center justify-between">
                  <span>Foto de Prescripción o Reposo Médico:</span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setTipoAdjuntoEvolucion('receta')}
                      className={`px-1.5 py-0.5 rounded ${tipoAdjuntoEvolucion === 'receta' ? 'bg-primary text-white font-bold' : 'text-secondary'}`}
                    >
                      Receta
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoAdjuntoEvolucion('reposo')}
                      className={`px-1.5 py-0.5 rounded ${tipoAdjuntoEvolucion === 'reposo' ? 'bg-primary text-white font-bold' : 'text-secondary'}`}
                    >
                      Reposo
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoAdjuntoEvolucion('indicaciones')}
                      className={`px-1.5 py-0.5 rounded ${tipoAdjuntoEvolucion === 'indicaciones' ? 'bg-primary text-white font-bold' : 'text-secondary'}`}
                    >
                      Indicaciones
                    </button>
                  </div>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="foto-prescripcion-input"
                    onChange={handleSubirFotoPrescripcion}
                    className="hidden"
                  />
                  <label
                    htmlFor="foto-prescripcion-input"
                    className="flex-1 py-2 px-3 rounded-xl bg-surface-subtle-ice border border-dashed border-border-subtle hover:border-primary text-xs text-secondary flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">add_photo_alternate</span>
                    <span>{fotoPrescripcion ? 'Cambiar Foto Adjunta' : 'Adjuntar Foto de Receta / Reposo'}</span>
                  </label>
                  {fotoPrescripcion && (
                    <button
                      type="button"
                      onClick={() => setFotoPrescripcion(null)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-rose-200 text-xs"
                      title="Quitar foto"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {fotoPrescripcion && (
                  <div className="mt-1 flex items-center gap-2 bg-surface-subtle-ice p-1.5 rounded-xl border border-border-subtle">
                    <img
                      src={fotoPrescripcion}
                      alt="Miniatura Receta"
                      className="w-10 h-10 object-cover rounded-lg border border-border-subtle"
                    />
                    <span className="text-[11px] text-dental-deep-navy font-semibold truncate flex-1">
                      Foto de {tipoAdjuntoEvolucion === 'reposo' ? 'Reposo Médico' : tipoAdjuntoEvolucion === 'indicaciones' ? 'Indicaciones' : 'Receta'} comprimida (~100 KB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Botón de Guardado y Sellado Forense */}
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingEvolucion}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-extrabold transition-all active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{isSavingEvolucion ? 'Sellando en D1...' : 'Firmar y Asentar Evolución'}</span>
              </button>
            </div>
          </form>
        ) : evoluciones.length > 0 ? (
          /* Vista de la Última Evolución Asentada */
          <div className="flex flex-col gap-2">
            <div className="bg-surface-subtle-ice p-3 rounded-xl border border-border-subtle flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs border-b border-border-subtle pb-1">
                <span className="font-bold text-dental-deep-navy">
                  Última Nota Clínica ({evoluciones[0].selladoUtc ? new Date(evoluciones[0].selladoUtc).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Hoy'})
                </span>
                <span className="font-mono text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded">
                  SHA-256: {evoluciones[0].sha256Hash?.slice(0, 10)}...
                </span>
              </div>

              <p className="text-xs text-dental-deep-navy leading-relaxed font-medium">
                {evoluciones[0].texto}
              </p>

              {evoluciones[0].indicacionesReceta && (
                <div className="mt-1 pt-1 border-t border-border-subtle/60 text-xs">
                  <span className="font-bold text-teal-800 block text-[11px]">💊 Indicaciones y Receta:</span>
                  <p className="text-secondary text-[11px] mt-0.5">{evoluciones[0].indicacionesReceta}</p>
                </div>
              )}

              {evoluciones[0].fotoPrescripcionData && (
                <div className="mt-2 p-2 rounded-xl bg-white border border-border-subtle flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={evoluciones[0].fotoPrescripcionData}
                      alt="Foto Receta"
                      className="w-12 h-12 object-cover rounded-lg border border-border-subtle cursor-pointer hover:opacity-90"
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
          6. TARJETA: RADIOGRAFÍA DIGITAL (SENSOR RVG 2.0)
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">radiology</span>
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-dental-deep-navy leading-tight">
                Radiografía Digital Intraoral
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Captura inmediata en sillón con sensor intraoral o cámara del teléfono
              </p>
            </div>
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
              className="h-8 px-3 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              <span>{isUploadingRx ? 'Comprimiendo...' : 'Tomar / Adjuntar Foto'}</span>
            </label>

            <span className="h-8 px-3 rounded-xl text-xs font-black bg-indigo-50 text-indigo-900 border border-indigo-200 flex items-center gap-1.5 shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[15px]">sensors</span>
              <span>Sensor RVG 2.0</span>
            </span>

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
                className="px-3 py-1.5 rounded-xl bg-surface-subtle-ice border border-border-subtle text-secondary hover:text-dental-deep-navy text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Notificación de Éxito al Guardar Radiografía */}
        {mensajeRxExito && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-indigo-600 text-[18px]">verified</span>
            <span>{mensajeRxExito}</span>
          </div>
        )}

        {/* Panel de Metadatos si hay radiografía pendiente de asentar */}
        {rxPendienteGuardar && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
              <span className="font-bold text-amber-900">
                Radiografía capturada en espera de sellado forense:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Pieza FDI (Ej. 16)"
                value={piezaRx}
                onChange={(e) => setPiezaRx(e.target.value)}
                className="w-28 px-2 py-1 rounded-lg bg-white border border-amber-300 text-xs font-bold text-dental-deep-navy focus:outline-none"
              />
              <input
                type="text"
                placeholder="Diagnóstico / Nota clínica..."
                value={notaRx}
                onChange={(e) => setNotaRx(e.target.value)}
                className="flex-1 sm:w-64 px-2 py-1 rounded-lg bg-white border border-amber-300 text-xs text-dental-deep-navy focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Visor Radiográfico RVG con Alto Contraste */}
        <div className="relative w-full h-[320px] sm:h-[400px] bg-dental-deep-navy rounded-2xl overflow-hidden flex items-center justify-center border border-border-subtle shadow-inner">
          {rxVisualizada ? (
            <img
              src={rxVisualizada}
              alt="Radiografía Intraoral RVG 2.0"
              className={`max-h-full max-w-full object-contain transition-all duration-300 ${
                filtroAltoContraste ? 'invert contrast-200 brightness-110' : ''
              }`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-surface-clean-white/60 p-4 text-center">
              <span className="material-symbols-outlined text-[48px] opacity-40">radiology</span>
              <span className="text-xs font-semibold">
                No hay radiografías periapicales asentadas para este paciente en D1.
              </span>
              <span className="text-[11px] opacity-70">
                Pulse "Tomar / Adjuntar Foto" para capturar una radiografía intraoral en sillón.
              </span>
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
          7. TARJETA: CONCLUSIÓN DE CONSULTA & GUARDADO FORENSE D1 (CIERRE FORMULARIO)
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle relative overflow-hidden flex flex-col gap-4">
        {/* Borde Superior Distintivo */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-dental-deep-navy" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
            </div>
            <div>
              <h3 className="font-display font-black text-base text-dental-deep-navy leading-tight">
                Conclusión de Consulta & Guardado Forense D1
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Valida el resumen integral de la cita antes de asentar los registros en la base de datos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-black text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1 shadow-2xs">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">task_alt</span>
              <span>{piezasModificadas.length > 0 ? 'Con Hallazgos FDI' : 'Consulta Lista'}</span>
            </span>
          </div>
        </div>

        {/* Resumen Compacto de Indicadores Clínicos Clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Paciente Activo</span>
            <span className="font-black text-dental-deep-navy truncate">
              {selectedCita ? selectedCita.pacienteNombre : 'No seleccionado'}
            </span>
            <span className="text-[10px] text-secondary">
              {selectedCita ? selectedCita.pacienteCedula : '—'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Higienista / Asistente</span>
            <span className="font-black text-dental-deep-navy truncate">
              {staffHigienistas.find((h) => h.id === asistenteSeleccionadoId)?.nombres || 'Por asignar'}
            </span>
            <span className="text-[10px] text-teal-700 font-semibold truncate">
              {staffHigienistas.find((h) => h.id === asistenteSeleccionadoId)?.areaEspecialidad?.slice(0, 22) || 'Asistencia clínica'}...
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Odontograma FDI</span>
            <span className="font-black text-dental-deep-navy">
              {piezasModificadas.length} {piezasModificadas.length === 1 ? 'pieza marcada' : 'piezas marcadas'}
            </span>
            <span className="text-[10px] text-secondary">
              {piezasModificadas.length > 0 ? 'Con hallazgos registrados' : 'Dentición sana / Sin cambios'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Presupuesto</span>
            <span className="font-black text-emerald-700">
              ${totalPresupuestoUsd.toFixed(2)} USD
            </span>
            <span className="text-[10px] text-secondary truncate">
              {(totalPresupuestoUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
            </span>
          </div>
        </div>

        {/* Notificación de Éxito al Guardar */}
        {mensajeCierreExito && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            <span>{mensajeCierreExito}</span>
          </div>
        )}

        {/* Botón Principal para Desplegar el Resumen y Guardar */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowModalConfirmarCierre(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-dental-deep-navy hover:from-emerald-700 hover:to-dental-deep-navy text-white font-display font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>Cerrar Formulario & Guardar Consulta</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          MODAL EMERGENTE: CONFIRMACIÓN CON RESUMEN CLÍNICO CONSOLIDADO
         ========================================================================= */}
      {showModalConfirmarCierre && selectedCita && (
        <div
          className="fixed inset-0 z-50 bg-dental-deep-navy/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowModalConfirmarCierre(false)}
        >
          <div
            className="bg-surface-clean-white w-full max-w-xl rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl border border-border-subtle max-h-[90vh] overflow-y-auto animate-in zoom-in-95 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-base text-dental-deep-navy">
                    Resumen Clínico de la Consulta
                  </h4>
                  <p className="text-xs text-secondary">
                    Revisa los datos consolidados antes de archivar permanentemente en Cloudflare D1
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModalConfirmarCierre(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* 5 Bloques Visuales Simplificados del Resumen Clínico */}
            <div className="flex flex-col gap-2.5 text-xs">
              {/* Bloque 1: Paciente y Cita */}
              <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-secondary uppercase text-[10px] tracking-wider">
                    1. Paciente & Box Clínico
                  </span>
                  <span className="font-mono font-bold text-primary text-[10px]">
                    {selectedCita.pacienteCedula}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-dental-deep-navy">
                    {selectedCita.pacienteNombre}
                  </span>
                  <span className="text-xs font-semibold text-secondary">
                    Box 0{selectedCita.boxNumero || 1} • {selectedCita.horaInicio}
                  </span>
                </div>
                <p className="text-[11px] text-secondary">
                  Motivo: <strong className="text-dental-deep-navy">{selectedCita.motivoConsulta}</strong>
                </p>
              </div>

              {/* Bloque 2: Higienista Asignado */}
              <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-indigo-700 uppercase text-[10px] tracking-wider block">
                    2. Higienista en Cita
                  </span>
                  <span className="font-black text-indigo-950 text-xs">
                    {staffHigienistas.find((h) => h.id === asistenteSeleccionadoId)?.nombres || 'No asignado'}
                  </span>
                  <span className="text-[11px] text-indigo-800 block">
                    {staffHigienistas.find((h) => h.id === asistenteSeleccionadoId)?.areaEspecialidad}
                  </span>
                </div>
                <span className="material-symbols-outlined text-indigo-600 text-[24px]">clean_hands</span>
              </div>

              {/* Bloque 3: Odontograma FDI Activo */}
              <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800 uppercase text-[10px] tracking-wider">
                    3. Odontograma FDI Sincronizado
                  </span>
                  <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    {piezasModificadas.length} {piezasModificadas.length === 1 ? 'Pieza' : 'Piezas'}
                  </span>
                </div>
                {piezasModificadas.length === 0 ? (
                  <p className="text-[11px] text-blue-900 italic">
                    Sin patologías ni tratamientos marcados en esta sesión (Dentición sana / Sin cambios).
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {piezasModificadas.map((t) => (
                      <span
                        key={t.numeroFdi}
                        className="px-2 py-0.5 rounded-lg bg-blue-100/90 text-blue-950 font-mono font-bold text-[11px] border border-blue-200"
                      >
                        #{t.numeroFdi} {t.procedimientoGeneral && t.procedimientoGeneral !== 'ninguno' ? `(${t.procedimientoGeneral})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bloque 4: Presupuesto Concertado */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider block">
                    4. Presupuesto Concertado ({itemsPresupuesto.length} items)
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-base font-black text-emerald-700">
                      ${totalPresupuestoUsd.toFixed(2)} USD
                    </span>
                    <span className="text-xs font-bold text-secondary">
                      ~ {(totalPresupuestoUsd * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-emerald-600 text-[26px]">payments</span>
              </div>

              {/* Bloque 5: Evolución & Sensor RVG */}
              <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-teal-800 uppercase text-[10px] tracking-wider block">
                    5. Evolución Médica & Rayos X RVG
                  </span>
                  <span className="text-xs font-bold text-teal-950 block">
                    {textoNuevaEvolucion.trim()
                      ? 'Nueva nota clínica redactada y lista para firmar'
                      : evoluciones.length > 0
                      ? 'Última nota asentada en el expediente'
                      : 'Sin evoluciones registradas en esta cita'}
                  </span>
                  <span className="text-[11px] text-teal-800">
                    {radiografias.length} {radiografias.length === 1 ? 'radiografía RVG en sillón' : 'radiografías RVG en sillón'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-teal-600 text-[24px]">clinical_notes</span>
              </div>
            </div>

            {/* Acciones del Modal: Modificar o Guardar y Concluir */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowModalConfirmarCierre(false)}
                className="px-4 py-2.5 rounded-xl bg-surface-subtle-ice hover:bg-border-subtle text-dental-deep-navy font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Modificar</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmarYGuardarTodo}
                disabled={isGuardandoTodo}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isGuardandoTodo ? 'sync' : 'save'}
                </span>
                <span>{isGuardandoTodo ? 'Guardando en D1...' : 'Guardar y Concluir Consulta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                      <span className="font-bold text-dental-deep-navy">{t.tratamientoNombre}</span>
                      <span className="font-bold text-primary">${t.costoTotalUsd} USD</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-secondary">
                      <span>{t.fechaRealizacion} • {t.odontologoNombre}</span>
                      {t.dienteNumero && <span className="font-mono">Pieza #{t.dienteNumero}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowHistorialModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-subtle-ice hover:bg-border-subtle text-dental-deep-navy font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Agregar Tratamiento al Presupuesto */}
      {showModalAddTratamientoPresupuesto && (
        <div className="fixed inset-0 z-50 bg-dental-deep-navy/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-clean-white w-full max-w-md rounded-3xl p-5 flex flex-col gap-3.5 shadow-2xl animate-in zoom-in-95 border border-border-subtle">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">add_circle</span>
                <h4 className="font-display font-extrabold text-sm text-dental-deep-navy">
                  Agregar Procedimiento al Presupuesto
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowModalAddTratamientoPresupuesto(false)}
                className="w-7 h-7 rounded-full bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Selector de Tratamiento */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dental-deep-navy">Seleccionar Tratamiento del Catálogo</label>
              <select
                value={tempTratId}
                onChange={(e) => {
                  setTempTratId(e.target.value);
                  const selected = catalogoTratamientos.find((t) => t.id === e.target.value);
                  if (selected) setTempCostoUsd(selected.costoUsd);
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
