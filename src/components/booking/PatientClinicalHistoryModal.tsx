import React, { useState, useEffect } from 'react';
import { SolicitudCita } from './AppointmentCoordinationView';
import { ApiClient } from '../../services/api';
import { EvolucionClinicaItem, RadiografiaItem, TratamientoRealizadoItem, ToothRecord } from '../../types/clinical';
import { useSede } from '../../context/SedeContext';

interface PatientClinicalHistoryModalProps {
  solicitud: SolicitudCita | null;
  onClose: () => void;
  onIrAFichaCompleta?: (pacienteId: string) => void;
}

export const PatientClinicalHistoryModal: React.FC<PatientClinicalHistoryModalProps> = ({
  solicitud,
  onClose,
  onIrAFichaCompleta,
}) => {
  const { sedeActiva } = useSede();
  const [activeTab, setActiveTab] = useState<'evoluciones' | 'tratamientos' | 'odontograma' | 'radiografias'>('evoluciones');
  const [isLoading, setIsLoading] = useState(false);

  const [evoluciones, setEvoluciones] = useState<EvolucionClinicaItem[]>([]);
  const [tratamientos, setTratamientos] = useState<TratamientoRealizadoItem[]>([]);
  const [piezasDentales, setPiezasDentales] = useState<ToothRecord[]>([]);
  const [radiografias, setRadiografias] = useState<RadiografiaItem[]>([]);

  // Cargar datos clínicos del paciente
  useEffect(() => {
    if (!solicitud) return;

    // Normalizar ID de paciente o cédula para consulta
    const pacienteId = solicitud.id.startsWith('pac-') ? solicitud.id : `pac-${solicitud.pacienteCedula.replace(/[^0-9]/g, '')}`;

    setIsLoading(true);
    Promise.all([
      ApiClient.getEvoluciones(pacienteId),
      ApiClient.getTratamientosRealizadosPaciente(pacienteId),
      ApiClient.getOdontograma(pacienteId),
      ApiClient.getRadiografias(pacienteId),
    ])
      .then(([evos, tratsRes, teeth, rxs]) => {
        setEvoluciones(evos || []);
        setTratamientos(tratsRes?.tratamientos || []);
        setPiezasDentales(teeth || []);
        setRadiografias(rxs || []);
      })
      .catch((err) => {
        console.warn('Carga clínica en modal fallback:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [solicitud]);

  if (!solicitud) return null;

  // Filtrar piezas con alguna patología o tratamiento
  const piezasConHallazgos = piezasDentales.filter(
    (p) =>
      p.isAbsent ||
      p.diagnostico?.toLowerCase().includes('caries') ||
      p.diagnostico?.toLowerCase().includes('resina') ||
      p.diagnostico?.toLowerCase().includes('corona') ||
      p.diagnostico?.toLowerCase().includes('endodoncia') ||
      Object.values(p.surfaces).some((s) => s !== 'sano')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-dental-deep-navy/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-clean-white w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-soft-elevated border border-border-subtle flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 1. Header con Datos del Paciente & Alerta Médica */}
        <div className="p-4 sm:p-5 bg-dental-deep-navy text-white relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-vibrant-cyan flex items-center justify-center font-display font-black text-lg shrink-0">
                {solicitud.pacienteNombre.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white">
                    Historia Clínica Digital
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Sede {sedeActiva.nombre.split('•')[0]}
                  </span>
                </div>
                <h3 className="font-display font-black text-lg sm:text-xl mt-1 leading-tight text-white">
                  {solicitud.pacienteNombre}
                </h3>
                <div className="flex items-center gap-2 text-xs text-white/80 mt-0.5 flex-wrap font-mono">
                  <span>{solicitud.pacienteCedula}</span>
                  <span>•</span>
                  <span>{solicitud.pacienteTelefono}</span>
                </div>
              </div>
            </div>

            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Alerta Médica Preexistente */}
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
              <span>Motivo Cita Actual: {solicitud.motivo}</span>
            </div>
            <span className="text-[11px] font-semibold text-white/70">
              Doctor(a): {solicitud.doctorSugerido || 'Dra. María Alejandra Domínguez'}
            </span>
          </div>
        </div>

        {/* 2. Pestañas de Navegación Rápida */}
        <div className="flex items-center gap-1 p-2 bg-surface-subtle-ice border-b border-border-subtle overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('evoluciones')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'evoluciones'
                ? 'bg-dental-deep-navy text-white shadow-2xs'
                : 'text-dental-deep-navy hover:bg-white/70'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">clinical_notes</span>
            <span>Evoluciones ({evoluciones.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tratamientos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'tratamientos'
                ? 'bg-dental-deep-navy text-white shadow-2xs'
                : 'text-dental-deep-navy hover:bg-white/70'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">dentistry</span>
            <span>Tratamientos ({tratamientos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('odontograma')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'odontograma'
                ? 'bg-dental-deep-navy text-white shadow-2xs'
                : 'text-dental-deep-navy hover:bg-white/70'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">table_chart</span>
            <span>Odontograma ({piezasConHallazgos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('radiografias')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'radiografias'
                ? 'bg-dental-deep-navy text-white shadow-2xs'
                : 'text-dental-deep-navy hover:bg-white/70'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">radiology</span>
            <span>Radiografías RVG ({radiografias.length})</span>
          </button>
        </div>

        {/* 3. Contenido Dinámico con Scroll Suave */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-3 scrollbar-thin">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
                progress_activity
              </span>
              <p className="text-xs font-bold">Cargando expediente clínico digital...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: Evoluciones Clínicas */}
              {activeTab === 'evoluciones' && (
                <div className="flex flex-col gap-3">
                  {evoluciones.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-surface-subtle-ice border border-border-subtle text-secondary">
                      <span className="material-symbols-outlined text-[28px] opacity-40">clinical_notes</span>
                      <p className="text-xs font-bold text-dental-deep-navy mt-1">Sin evoluciones previas registradas</p>
                      <p className="text-[11px] opacity-75 mt-0.5">El paciente asistirá a su primera evolución en sillón.</p>
                    </div>
                  ) : (
                    evoluciones.map((evo) => (
                      <div
                        key={evo.id}
                        className="p-3.5 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-dental-deep-navy">
                            {evo.odontologoNombre || 'Dra. María Alejandra Domínguez'}
                          </span>
                          <span className="text-[10px] font-mono text-secondary">
                            {evo.selladoUtc || evo.createdAt || 'Fecha registrada'}
                          </span>
                        </div>
                        <p className="text-xs text-dental-deep-navy leading-relaxed bg-white p-2.5 rounded-xl border border-border-subtle">
                          {evo.texto}
                        </p>
                        {evo.indicacionesReceta && (
                          <div className="text-[11px] bg-sky-50 text-sky-950 p-2 rounded-xl border border-sky-200">
                            <strong>Indicaciones / Receta:</strong> {evo.indicacionesReceta}
                          </div>
                        )}
                        {evo.sha256Hash && (
                          <div className="text-[9px] font-mono text-secondary/60 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-emerald-600">verified</span>
                            <span>Sellado Forense SHA-256: {evo.sha256Hash.slice(0, 20)}...</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: Tratamientos Realizados */}
              {activeTab === 'tratamientos' && (
                <div className="flex flex-col gap-2.5">
                  {tratamientos.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-surface-subtle-ice border border-border-subtle text-secondary">
                      <span className="material-symbols-outlined text-[28px] opacity-40">dentistry</span>
                      <p className="text-xs font-bold text-dental-deep-navy mt-1">Sin tratamientos previos facturados</p>
                      <p className="text-[11px] opacity-75 mt-0.5">Se liquidarán en caja al culminar la atención.</p>
                    </div>
                  ) : (
                    tratamientos.map((trat) => (
                      <div
                        key={trat.id}
                        className="p-3 rounded-2xl bg-white border border-border-subtle flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.2 rounded bg-dental-deep-navy text-white text-[10px] font-black">
                              {trat.dienteNumero ? `Pieza ${trat.dienteNumero}` : 'General'}
                            </span>
                            <span className="text-xs font-black text-dental-deep-navy">
                              {trat.tratamientoNombre || 'Procedimiento Clínico'}
                            </span>
                          </div>
                          <p className="text-[10px] text-secondary mt-0.5 truncate max-w-sm">
                            {trat.observaciones || `Superficie: ${trat.superficie || 'Oclusal'}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-700 block">
                            ${trat.costoTotalUsd.toFixed(2)} USD
                          </span>
                          <span className="text-[9px] font-bold text-secondary">
                            {trat.fechaRealizacion ? trat.fechaRealizacion.split(' ')[0] : 'Completado'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: Odontograma Resumido */}
              {activeTab === 'odontograma' && (
                <div className="flex flex-col gap-2.5">
                  {piezasConHallazgos.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-surface-subtle-ice border border-border-subtle text-secondary">
                      <span className="material-symbols-outlined text-[28px] opacity-40">table_chart</span>
                      <p className="text-xs font-bold text-dental-deep-navy mt-1">Esmalte íntegro en todas las piezas</p>
                      <p className="text-[11px] opacity-75 mt-0.5">No se registran caries ni prótesis activas en el odontograma.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {piezasConHallazgos.map((p) => (
                        <div
                          key={p.numeroFdi}
                          className="p-2.5 rounded-xl bg-white border border-border-subtle flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-dental-deep-navy text-white text-xs font-black flex items-center justify-center">
                              {p.numeroFdi}
                            </span>
                            <div>
                              <p className="text-xs font-extrabold text-dental-deep-navy">{p.nombre}</p>
                              <p className="text-[10px] text-secondary truncate max-w-[170px]">{p.diagnostico}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              p.isAbsent
                                ? 'bg-zinc-100 text-zinc-700'
                                : p.diagnostico?.includes('caries')
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {p.isAbsent ? 'Ausente' : p.diagnostico?.includes('caries') ? 'Caries' : 'Tratada'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Radiografías RVG */}
              {activeTab === 'radiografias' && (
                <div className="flex flex-col gap-2.5">
                  {radiografias.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-surface-subtle-ice border border-border-subtle text-secondary">
                      <span className="material-symbols-outlined text-[28px] opacity-40">radiology</span>
                      <p className="text-xs font-bold text-dental-deep-navy mt-1">Sin radiografías periapicales RVG</p>
                      <p className="text-[11px] opacity-75 mt-0.5">Puede realizar la captura radiológica en el Box 01.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {radiografias.map((rx) => (
                        <div
                          key={rx.id}
                          className="p-3 rounded-2xl bg-white border border-border-subtle flex flex-col gap-2 shadow-2xs"
                        >
                          <div className="w-full h-32 rounded-xl bg-dental-deep-navy flex items-center justify-center overflow-hidden border">
                            {rx.imagenData || rx.r2StorageUrl ? (
                              <img
                                src={rx.imagenData || rx.r2StorageUrl}
                                alt="Radiografía"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center text-white/60 gap-1">
                                <span className="material-symbols-outlined text-[28px]">radiology</span>
                                <span className="text-[10px]">RVG Digital</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-dental-deep-navy">
                              {rx.piezaFdi ? `Pieza FDI ${rx.piezaFdi}` : 'Serie Periapical'}
                            </span>
                            <span className="text-[10px] text-secondary">{rx.selladoUtc?.split('T')[0] || 'RVG'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Footer con Acciones */}
        <div className="p-3.5 sm:p-4 bg-surface-subtle-ice border-t border-border-subtle flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border-subtle bg-white text-secondary hover:text-dental-deep-navy font-bold text-xs transition-all cursor-pointer"
          >
            Cerrar Ficha
          </button>

          {onIrAFichaCompleta && (
            <button
              type="button"
              onClick={() => {
                onIrAFichaCompleta(solicitud.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-dental-deep-navy hover:bg-primary text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-vibrant-cyan">open_in_new</span>
              <span>Abrir Odontograma Completo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
