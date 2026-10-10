import React, { useState } from 'react';
import { ToothRecord, ToothFace } from '../../types/clinical';
import { AnatomicalToothSvg } from './AnatomicalToothSvg';
import { ToothEditorModal } from './ToothEditorModal';

interface QuadrantArchViewProps {
  teeth: ToothRecord[];
  onUpdateTooth: (updatedTooth: ToothRecord) => void;
}

export const QuadrantArchView: React.FC<QuadrantArchViewProps> = ({
  teeth,
  onUpdateTooth,
}) => {
  const [selectedTooth, setSelectedTooth] = useState<ToothRecord | null>(() => {
    return teeth.find((t) => t.numeroFdi === 16) || teeth[0] || null;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTooth = (fdi: number): ToothRecord => {
    return (
      teeth.find((t) => t.numeroFdi === fdi) || {
        numeroFdi: fdi,
        nombre: `Pieza ${fdi}`,
        surfaces: { V: 'sano', M: 'sano', O: 'sano', D: 'sano', L: 'sano' },
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

  // Cuadrantes FDI
  const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const q2 = [21, 22, 23, 24, 25, 26, 27, 28];
  const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

  return (
    <div className="flex flex-col gap-4">
      {/* Contenedor Odontograma Clínico Interactivo FDI */}
      <div className="bg-surface-clean-white rounded-2xl p-space-md shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider block">
              Inspección Clínica
            </span>
            <h3 className="font-display font-bold text-lg text-dental-deep-navy">
              Odontograma FDI Activo
            </h3>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low text-secondary text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px] text-vibrant-cyan">
              touch_app
            </span>
            <span>Toque una pieza</span>
          </div>
        </div>

        {/* Leyenda clínica de estados */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 bg-surface-subtle-ice p-2.5 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-status-success shrink-0" />
            <span className="text-xs text-on-surface truncate">Sano</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-status-danger shrink-0" />
            <span className="text-xs text-on-surface truncate">Caries Activa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-electric-blue shrink-0" />
            <span className="text-xs text-on-surface truncate">Resina / Obt.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-status-warning shrink-0" />
            <span className="text-xs text-on-surface truncate">Corona / Prot.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-outline-variant shrink-0" />
            <span className="text-xs text-on-surface truncate">Ausente</span>
          </div>
        </div>

        {/* Diagrama de Arcadas FDI con Fondo Clínico */}
        <div className="bg-dental-ambient-bg rounded-2xl p-3 text-on-primary flex flex-col gap-3 shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6bf6ff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

          {/* Guía de Caras Dentales */}
          <div className="relative z-10 flex items-center justify-between px-2.5 py-1 bg-surface-clean-white/10 rounded-lg text-[10px] text-tertiary-fixed font-semibold">
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
                Q1 (Sup. Der.)
              </span>
              <span className="text-xs font-bold text-tertiary-fixed tracking-wider">
                ARCADA SUPERIOR
              </span>
              <span className="text-[10px] font-bold text-secondary-fixed-dim uppercase tracking-wider">
                Q2 (Sup. Izq.)
              </span>
            </div>

            {/* Q1 y Q2 */}
            <div className="grid grid-cols-8 gap-1 pt-1">
              {q1.map((fdi) => {
                const tooth = getTooth(fdi);
                return (
                  <AnatomicalToothSvg
                    key={fdi}
                    fdi={fdi}
                    surfaces={tooth.surfaces}
                    isAbsent={tooth.isAbsent}
                    isSelected={selectedTooth?.numeroFdi === fdi}
                    onSelectTooth={handleSelectTooth}
                    onSelectFace={handleSelectFace}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-8 gap-1 pt-1.5">
              {q2.map((fdi) => {
                const tooth = getTooth(fdi);
                return (
                  <AnatomicalToothSvg
                    key={fdi}
                    fdi={fdi}
                    surfaces={tooth.surfaces}
                    isAbsent={tooth.isAbsent}
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
                Q4 (Inf. Der.)
              </span>
              <span className="text-xs font-bold text-tertiary-fixed tracking-wider">
                ARCADA INFERIOR
              </span>
              <span className="text-[10px] font-bold text-secondary-fixed-dim uppercase tracking-wider">
                Q3 (Inf. Izq.)
              </span>
            </div>

            <div className="grid grid-cols-8 gap-1">
              {q4.map((fdi) => {
                const tooth = getTooth(fdi);
                return (
                  <AnatomicalToothSvg
                    key={fdi}
                    fdi={fdi}
                    surfaces={tooth.surfaces}
                    isAbsent={tooth.isAbsent}
                    isSelected={selectedTooth?.numeroFdi === fdi}
                    onSelectTooth={handleSelectTooth}
                    onSelectFace={handleSelectFace}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-8 gap-1 pt-1.5">
              {q3.map((fdi) => {
                const tooth = getTooth(fdi);
                return (
                  <AnatomicalToothSvg
                    key={fdi}
                    fdi={fdi}
                    surfaces={tooth.surfaces}
                    isAbsent={tooth.isAbsent}
                    isSelected={selectedTooth?.numeroFdi === fdi}
                    onSelectTooth={handleSelectTooth}
                    onSelectFace={handleSelectFace}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Tarjeta Detalle de Hallazgo Seleccionado */}
        {selectedTooth && (
          <div className="bg-surface-subtle-ice rounded-xl p-3.5 flex items-center justify-between gap-3 border border-border-subtle">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1.5 bg-surface-clean-white rounded-xl shadow-sm border border-border-subtle shrink-0">
                <AnatomicalToothSvg
                  fdi={selectedTooth.numeroFdi}
                  surfaces={selectedTooth.surfaces}
                  isAbsent={selectedTooth.isAbsent}
                  size="sm"
                />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-bold text-sm text-dental-deep-navy">
                    Pieza {selectedTooth.numeroFdi}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-semibold text-[10px]">
                    {selectedTooth.isAbsent ? 'Ausente' : 'Inspeccionada'}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-0.5 line-clamp-2">
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

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              aria-label="Editar diagnóstico por caras de la pieza"
              className="w-10 h-10 rounded-xl bg-primary text-surface-clean-white flex items-center justify-center hover:bg-primary-container transition-all shrink-0 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
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
