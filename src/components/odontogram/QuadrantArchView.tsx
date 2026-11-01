import React, { useState, useEffect } from 'react';
import { ToothRecord, ToothFace, ProcedimientoGeneralOdontograma } from '../../types/clinical';
import { AnatomicalToothSvg } from './AnatomicalToothSvg';
import { ToothEditorModal } from './ToothEditorModal';

interface QuadrantArchViewProps {
  teeth: ToothRecord[];
  onUpdateTooth: (updatedTooth: ToothRecord) => void;
  ultimaModificacion?: {
    fecha?: string;
    doctor?: string;
  };
  isNuevoOdontograma?: boolean;
}

export const QuadrantArchView: React.FC<QuadrantArchViewProps> = ({
  teeth,
  onUpdateTooth,
  ultimaModificacion,
  isNuevoOdontograma = false,
}) => {
  const [selectedTooth, setSelectedTooth] = useState<ToothRecord | null>(() => {
    return teeth.find((t) => t.numeroFdi === 16) || teeth[0] || null;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [denticionModo, setDenticionModo] = useState<'adulto' | 'pediatrico'>('adulto');

  // Sincronizar selectedTooth cuando teeth cambia externamente
  useEffect(() => {
    if (selectedTooth) {
      const match = teeth.find((t) => t.numeroFdi === selectedTooth.numeroFdi);
      if (match) {
        setSelectedTooth(match);
      }
    } else if (teeth.length > 0) {
      setSelectedTooth(teeth.find((t) => t.numeroFdi === 16) || teeth[0]);
    }
  }, [teeth]);

  const getTooth = (fdi: number): ToothRecord => {
    return (
      teeth.find((t) => t.numeroFdi === fdi) || {
        numeroFdi: fdi,
        nombre: `Pieza ${fdi}`,
        surfaces: { V: 'sano', M: 'sano', O: 'sano', D: 'sano', L: 'sano' },
        procedimientoGeneral: 'ninguno',
      }
    );
  };

  const handleSelectTooth = (fdi: number) => {
    const t = getTooth(fdi);
    setSelectedTooth(t);
  };

  const handleSelectFace = (fdi: number, _face: ToothFace) => {
    const t = getTooth(fdi);
    setSelectedTooth(t);
    setIsModalOpen(true);
  };

  const handleSaveModal = (updatedTooth: ToothRecord) => {
    setSelectedTooth(updatedTooth);
    onUpdateTooth(updatedTooth);
  };

  const toggleProcedimientoGeneral = (tipo: ProcedimientoGeneralOdontograma) => {
    if (!selectedTooth) return;
    const nuevo = selectedTooth.procedimientoGeneral === tipo ? 'ninguno' : tipo;
    const updated: ToothRecord = {
      ...selectedTooth,
      procedimientoGeneral: nuevo,
      updatedAt: new Date().toISOString(),
    };
    setSelectedTooth(updated);
    onUpdateTooth(updated);
  };

  const toggleAusente = () => {
    if (!selectedTooth) return;
    const updated: ToothRecord = {
      ...selectedTooth,
      isAbsent: !selectedTooth.isAbsent,
      updatedAt: new Date().toISOString(),
    };
    setSelectedTooth(updated);
    onUpdateTooth(updated);
  };

  // Cuadrantes FDI: Adulto (11-48) y Pediátrico/Temporal (51-85) según AGENTS.md §7.1
  const q1 = denticionModo === 'adulto' ? [18, 17, 16, 15, 14, 13, 12, 11] : [55, 54, 53, 52, 51];
  const q2 = denticionModo === 'adulto' ? [21, 22, 23, 24, 25, 26, 27, 28] : [61, 62, 63, 64, 65];
  const q4 = denticionModo === 'adulto' ? [48, 47, 46, 45, 44, 43, 42, 41] : [85, 84, 83, 82, 81];
  const q3 = denticionModo === 'adulto' ? [31, 32, 33, 34, 35, 36, 37, 38] : [71, 72, 73, 74, 75];
  const gridColsClass = denticionModo === 'adulto' ? 'grid-cols-8' : 'grid-cols-5 max-w-md mx-auto';

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Contenedor Odontograma Clínico Interactivo FDI */}
      <div className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="material-symbols-outlined text-primary text-[22px]">dentistry</span>
              <h3 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy">
                Odontograma FDI Activo
              </h3>
              {/* Conmutador Dentición Adulto (11-48) / Pediátrico (51-85) */}
              <div className="inline-flex items-center bg-surface-subtle-ice p-0.5 rounded-xl border border-border-subtle ml-1">
                <button
                  type="button"
                  onClick={() => {
                    setDenticionModo('adulto');
                    handleSelectTooth(16);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all active:scale-95 ${
                    denticionModo === 'adulto'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-dental-deep-navy hover:bg-white/60'
                  }`}
                >
                  Adulto (11–48)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDenticionModo('pediatrico');
                    handleSelectTooth(55);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all active:scale-95 ${
                    denticionModo === 'pediatrico'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-dental-deep-navy hover:bg-white/60'
                  }`}
                >
                  Pediátrico (51–85)
                </button>
              </div>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Inspección vectorial SVG de 5 caras con Endodoncia, Exodoncia, Prótesis e Implante ({denticionModo === 'adulto' ? '32 piezas permanentes' : '20 piezas temporales FDI 51–85'})
            </p>
          </div>

          {/* Badge de Última Modificación */}
          <div className="shrink-0 flex items-center gap-1.5">
            {ultimaModificacion?.fecha ? (
              <span className="text-[11px] font-bold text-dental-deep-navy bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[14px] text-primary">history</span>
                <span>Últ. Modificación: {ultimaModificacion.fecha}</span>
                {ultimaModificacion.doctor && (
                  <span className="text-secondary font-medium">({ultimaModificacion.doctor})</span>
                )}
              </span>
            ) : isNuevoOdontograma ? (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs animate-pulse">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">new_releases</span>
                <span>Odontograma Inicial en Blanco</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold text-secondary bg-surface-subtle-ice px-2.5 py-1 rounded-full border border-border-subtle">
                Sincronizado con D1
              </span>
            )}
          </div>
        </div>

        {/* Leyenda clínica de estados enriquecida con Endodoncia, Exodoncia, Prótesis e Implante */}
        <div className="flex flex-wrap items-center gap-2 bg-surface-subtle-ice p-2.5 rounded-xl border border-border-subtle text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success shrink-0" />
            <span className="text-[11px] font-semibold text-dental-deep-navy">Sano</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-danger shrink-0" />
            <span className="text-[11px] font-semibold text-dental-deep-navy">Caries</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-electric-blue shrink-0" />
            <span className="text-[11px] font-semibold text-dental-deep-navy">Resina / Obt.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-warning shrink-0" />
            <span className="text-[11px] font-semibold text-dental-deep-navy">Corona / Prot.</span>
          </div>
          {/* Selector Especial: Endodoncia */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-100 border border-purple-300 text-purple-900 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0 ring-1 ring-white" />
            <span className="text-[11px] font-bold">⚡ Endodoncia (Conducto)</span>
          </div>
          {/* Selector Especial: Exodoncia */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0 ring-1 ring-white" />
            <span className="text-[11px] font-bold">✕ Exodoncia (Extracción)</span>
          </div>
          {/* Selector Especial: Prótesis */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 ring-1 ring-white" />
            <span className="text-[11px] font-bold">👑 Prótesis / Corona</span>
          </div>
          {/* Selector Especial: Implante */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-100 border border-cyan-300 text-cyan-900 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 shrink-0 ring-1 ring-white" />
            <span className="text-[11px] font-bold">🔩 Implante (Titanio)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
            <span className="text-[11px] font-semibold text-secondary">Ausente</span>
          </div>
        </div>

        {/* Diagrama de Arcadas FDI con Fondo Clínico */}
        <div className="bg-dental-deep-navy rounded-2xl p-3 text-white flex flex-col gap-3 shadow-inner relative overflow-hidden border border-primary">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E8DDEB_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

          {/* Guía de Caras Dentales */}
          <div className="relative z-10 flex items-center justify-between px-2.5 py-1.5 bg-dental-ambient-bg rounded-lg text-[10px] text-surface-container font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-status-danger inline-block" /> Centro: Oclusal (O)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-electric-blue inline-block" /> Arriba: Vestibular (V)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-status-warning inline-block" /> Abajo: Pal/Ling (P/L)
            </span>
            <span className="text-secondary-fixed-dim">Lados: M / D</span>
          </div>

          {/* Arcada Superior */}
          <div className="relative z-10">
            <div className="flex items-center justify-between pb-1 px-1">
              <span className="text-[10px] font-bold text-secondary-fixed-dim uppercase tracking-wider">
                {denticionModo === 'adulto' ? 'Q1 (Sup. Der. 18–11)' : 'Q5 (Temp. Sup. Der. 55–51)'}
              </span>
              <span className="text-xs font-bold text-tertiary-fixed tracking-wider">
                ARCADA SUPERIOR {denticionModo === 'pediatrico' ? '• INFANTIL' : ''}
              </span>
              <span className="text-[10px] font-bold text-secondary-fixed-dim uppercase tracking-wider">
                {denticionModo === 'adulto' ? 'Q2 (Sup. Izq. 21–28)' : 'Q6 (Temp. Sup. Izq. 61–65)'}
              </span>
            </div>

            {/* Q1/Q5 y Q2/Q6 */}
            <div className={`grid ${gridColsClass} gap-1 pt-1`}>
              {q1.map((fdi) => {
                const tooth = getTooth(fdi);
                return (
                  <AnatomicalToothSvg
                    key={fdi}
                    fdi={fdi}
                    surfaces={tooth.surfaces}
                    isAbsent={tooth.isAbsent}
                    procedimientoGeneral={tooth.procedimientoGeneral}
                    isSelected={selectedTooth?.numeroFdi === fdi}
                    onSelectTooth={handleSelectTooth}
                    onSelectFace={handleSelectFace}
                  />
                );
              })}
            </div>
            <div className={`grid ${gridColsClass} gap-1 pt-1.5`}>
              {q2.map((fdi) => {
                const tooth = getTooth(fdi);
                return (
                  <AnatomicalToothSvg
                    key={fdi}
                    fdi={fdi}
                    surfaces={tooth.surfaces}
                    isAbsent={tooth.isAbsent}
                    procedimientoGeneral={tooth.procedimientoGeneral}
                    isSelected={selectedTooth?.numeroFdi === fdi}
                    onSelectTooth={handleSelectTooth}
                    onSelectFace={handleSelectFace}
                  />
                );
              })}
            </div>
          </div>

          <div className="h-px bg-surface-clean-white/15 my-0.5" />

          {/* Arcada Inferior */}
          <div className="relative z-10">
            <div className="flex items-center justify-between pb-1 px-1">
              <span className="text-[10px] font-bold text-secondary-fixed-dim uppercase tracking-wider">
                {denticionModo === 'adulto' ? 'Q4 (Inf. Der. 48–41)' : 'Q8 (Temp. Inf. Der. 85–81)'}
              </span>
              <span className="text-xs font-bold text-tertiary-fixed tracking-wider">
                ARCADA INFERIOR {denticionModo === 'pediatrico' ? '• INFANTIL' : ''}
              </span>
              <span className="text-[10px] font-bold text-secondary-fixed-dim uppercase tracking-wider">
                {denticionModo === 'adulto' ? 'Q3 (Inf. Izq. 31–38)' : 'Q7 (Temp. Inf. Izq. 71–75)'}
              </span>
            </div>

            <div className={`grid ${gridColsClass} gap-1`}>
              {q4.map((fdi) => {
                const tooth = getTooth(fdi);
                return (
                  <AnatomicalToothSvg
                    key={fdi}
                    fdi={fdi}
                    surfaces={tooth.surfaces}
                    isAbsent={tooth.isAbsent}
                    procedimientoGeneral={tooth.procedimientoGeneral}
                    isSelected={selectedTooth?.numeroFdi === fdi}
                    onSelectTooth={handleSelectTooth}
                    onSelectFace={handleSelectFace}
                  />
                );
              })}
            </div>
            <div className={`grid ${gridColsClass} gap-1 pt-1.5`}>
              {q3.map((fdi) => {
                const tooth = getTooth(fdi);
                return (
                  <AnatomicalToothSvg
                    key={fdi}
                    fdi={fdi}
                    surfaces={tooth.surfaces}
                    isAbsent={tooth.isAbsent}
                    procedimientoGeneral={tooth.procedimientoGeneral}
                    isSelected={selectedTooth?.numeroFdi === fdi}
                    onSelectTooth={handleSelectTooth}
                    onSelectFace={handleSelectFace}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Tarjeta Detalle de Hallazgo Seleccionado con Botones Rápidos */}
        {selectedTooth && (
          <div className="bg-surface-subtle-ice rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border-subtle">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 bg-surface-clean-white rounded-xl shadow-sm border border-border-subtle shrink-0">
                <AnatomicalToothSvg
                  fdi={selectedTooth.numeroFdi}
                  surfaces={selectedTooth.surfaces}
                  isAbsent={selectedTooth.isAbsent}
                  procedimientoGeneral={selectedTooth.procedimientoGeneral}
                  size="sm"
                />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-extrabold text-sm text-dental-deep-navy">
                    Pieza FDI {selectedTooth.numeroFdi}
                  </span>
                  {selectedTooth.procedimientoGeneral === 'endodoncia' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 font-bold text-[10px]">
                      ⚡ Endodoncia Indicada
                    </span>
                  )}
                  {selectedTooth.procedimientoGeneral === 'exodoncia' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[10px]">
                      ✕ Exodoncia Indicada
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-semibold text-[10px]">
                    {selectedTooth.isAbsent ? 'Ausente' : 'Inspeccionada'}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-0.5 line-clamp-1">
                  {selectedTooth.diagnostico || 'Esmalte íntegro, sin signos patológicos'}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-primary mt-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px]">palette</span>
                  <span>
                    V: {selectedTooth.surfaces.V} • O: {selectedTooth.surfaces.O} • M:{' '}
                    {selectedTooth.surfaces.M} • D: {selectedTooth.surfaces.D} • L:{' '}
                    {selectedTooth.surfaces.L}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de Acción Rápida para la Pieza */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
              <button
                type="button"
                onClick={() => toggleProcedimientoGeneral('endodoncia')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                  selectedTooth.procedimientoGeneral === 'endodoncia'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-surface-clean-white border border-purple-300 text-purple-800 hover:bg-purple-50'
                }`}
                title="Marcar o desmarcar Endodoncia en esta pieza"
              >
                <span>⚡ Endo</span>
              </button>

              <button
                type="button"
                onClick={() => toggleProcedimientoGeneral('exodoncia')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                  selectedTooth.procedimientoGeneral === 'exodoncia'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-surface-clean-white border border-rose-300 text-rose-800 hover:bg-rose-50'
                }`}
                title="Marcar o desmarcar Exodoncia en esta pieza"
              >
                <span>✕ Exo</span>
              </button>

              <button
                type="button"
                onClick={() => toggleProcedimientoGeneral('protesis')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                  selectedTooth.procedimientoGeneral === 'protesis'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-surface-clean-white border border-amber-300 text-amber-800 hover:bg-amber-50'
                }`}
                title="Marcar o desmarcar Prótesis / Corona en esta pieza"
              >
                <span>👑 Prótesis</span>
              </button>

              <button
                type="button"
                onClick={() => toggleProcedimientoGeneral('implante')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                  selectedTooth.procedimientoGeneral === 'implante'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-surface-clean-white border border-cyan-300 text-cyan-800 hover:bg-cyan-50'
                }`}
                title="Marcar o desmarcar Implante Dental en esta pieza"
              >
                <span>🔩 Implante</span>
              </button>

              <button
                type="button"
                onClick={toggleAusente}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
                  selectedTooth.isAbsent
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-surface-clean-white border border-border-subtle text-secondary hover:bg-surface-container'
                }`}
                title="Marcar como ausente o presente"
              >
                <span>Ausente</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                aria-label="Editar diagnóstico por caras de la pieza"
                className="px-3 py-1.5 rounded-xl bg-primary hover:bg-dental-deep-navy text-surface-clean-white text-xs font-bold transition-all shrink-0 shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Editar Caras</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edición de Caras */}
      <ToothEditorModal
        isOpen={isModalOpen}
        tooth={selectedTooth}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
      />
    </div>
  );
};
