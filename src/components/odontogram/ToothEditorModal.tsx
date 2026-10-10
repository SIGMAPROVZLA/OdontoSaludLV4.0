import React, { useState } from 'react';
import { ToothRecord, ToothFace, ToothFaceStatus } from '../../types/clinical';
import { COLOR_POR_ESTADO, NOMBRE_POR_ESTADO } from './AnatomicalToothSvg';

interface ToothEditorModalProps {
  isOpen: boolean;
  tooth: ToothRecord | null;
  onClose: () => void;
  onSave: (updatedTooth: ToothRecord) => void;
}

export const ToothEditorModal: React.FC<ToothEditorModalProps> = ({
  isOpen,
  tooth,
  onClose,
  onSave,
}) => {
  if (!isOpen || !tooth) return null;

  const [activeFace, setActiveFace] = useState<ToothFace>('O');
  const [currentSurfaces, setCurrentSurfaces] = useState(tooth.surfaces);
  const [isAbsent, setIsAbsent] = useState(Boolean(tooth.isAbsent));
  const [notaClinica, setNotaClinica] = useState(
    tooth.diagnostico || 'Evolución clínica en box operativo'
  );

  const faceNombres: Record<ToothFace, string> = {
    V: 'Vestibular (Arriba)',
    D: 'Distal (Lateral)',
    L: 'Palatino / Lingual (Abajo)',
    M: 'Mesial (Lateral)',
    O: 'Oclusal / Incisal (Centro)',
  };

  const handleApplyStatus = (status: ToothFaceStatus) => {
    setCurrentSurfaces((prev) => ({
      ...prev,
      [activeFace]: status,
    }));
  };

  const handleSave = () => {
    onSave({
      ...tooth,
      surfaces: currentSurfaces,
      isAbsent,
      diagnostico: notaClinica,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const getColor = (face: ToothFace): string => {
    if (isAbsent) return COLOR_POR_ESTADO.ausente;
    return COLOR_POR_ESTADO[currentSurfaces[face]];
  };

  return (
    <div className="fixed inset-0 z-50 bg-dental-deep-navy/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-surface-clean-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-space-md flex flex-col gap-space-sm shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b pb-3 border-border-subtle">
          <div className="flex items-center gap-space-xs">
            <div className="w-9 h-9 rounded-xl bg-primary text-surface-clean-white flex items-center justify-center font-bold text-headline-sm">
              {tooth.numeroFdi}
            </div>
            <div>
              <h3 className="font-display font-bold text-[17px] text-dental-deep-navy leading-tight">
                Editor de Pieza FDI {tooth.numeroFdi}
              </h3>
              <span className="text-[12px] text-secondary">
                {tooth.nombre || `Pieza ${tooth.numeroFdi}`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-secondary hover:text-dental-deep-navy transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Switch Pieza Ausente */}
        <div className="flex items-center justify-between bg-surface-subtle-ice p-3 rounded-xl border border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              remove_circle_outline
            </span>
            <span className="text-sm font-semibold text-dental-deep-navy">
              ¿Pieza ausente / exodoncia previa?
            </span>
          </div>
          <input
            type="checkbox"
            checked={isAbsent}
            onChange={(e) => setIsAbsent(e.target.checked)}
            className="w-5 h-5 accent-primary rounded cursor-pointer"
          />
        </div>

        {!isAbsent && (
          <>
            {/* Visualizador Anatómico 5 Caras Interactivo Grande */}
            <div className="flex flex-col gap-1.5 bg-surface-subtle-ice p-3 rounded-xl border border-border-subtle">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-dental-deep-navy uppercase tracking-wider">
                  1. Seleccionar Superficie Dental
                </label>
                <span className="text-xs font-semibold text-primary">
                  Activa: {faceNombres[activeFace]}
                </span>
              </div>

              <div className="flex items-center justify-center py-2">
                <div className="relative w-44 h-44 p-3 bg-dental-ambient-bg rounded-2xl shadow-inner flex items-center justify-center">
                  <svg className="w-36 h-36 drop-shadow-md select-none" viewBox="0 0 100 100">
                    {/* Vestibular (Arriba) */}
                    <polygon
                      points="5,5 95,5 70,30 30,30"
                      fill={getColor('V')}
                      stroke={activeFace === 'V' ? '#FFFFFF' : '#0F2B48'}
                      strokeWidth={activeFace === 'V' ? 2.5 : 1.5}
                      className="cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => setActiveFace('V')}
                    />
                    <text
                      x="50"
                      y="21"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      V
                    </text>

                    {/* Distal (Derecha) */}
                    <polygon
                      points="95,5 95,95 70,70 70,30"
                      fill={getColor('D')}
                      stroke={activeFace === 'D' ? '#FFFFFF' : '#0F2B48'}
                      strokeWidth={activeFace === 'D' ? 2.5 : 1.5}
                      className="cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => setActiveFace('D')}
                    />
                    <text
                      x="81"
                      y="54"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      D
                    </text>

                    {/* Palatino / Lingual (Abajo) */}
                    <polygon
                      points="95,95 5,95 30,70 70,70"
                      fill={getColor('L')}
                      stroke={activeFace === 'L' ? '#FFFFFF' : '#0F2B48'}
                      strokeWidth={activeFace === 'L' ? 2.5 : 1.5}
                      className="cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => setActiveFace('L')}
                    />
                    <text
                      x="50"
                      y="86"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      P/L
                    </text>

                    {/* Mesial (Izquierda) */}
                    <polygon
                      points="5,95 5,5 30,30 30,70"
                      fill={getColor('M')}
                      stroke={activeFace === 'M' ? '#FFFFFF' : '#0F2B48'}
                      strokeWidth={activeFace === 'M' ? 2.5 : 1.5}
                      className="cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => setActiveFace('M')}
                    />
                    <text
                      x="19"
                      y="54"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      M
                    </text>

                    {/* Oclusal (Centro) */}
                    <rect
                      x="30"
                      y="30"
                      width="40"
                      height="40"
                      fill={getColor('O')}
                      stroke={activeFace === 'O' ? '#FFFFFF' : '#0F2B48'}
                      strokeWidth={activeFace === 'O' ? 2.5 : 1.5}
                      className="cursor-pointer hover:opacity-80 transition-all"
                      onClick={() => setActiveFace('O')}
                    />
                    <text
                      x="50"
                      y="54"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="12"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      O
                    </text>
                  </svg>
                </div>
              </div>
              <p className="text-center text-[11px] text-secondary">
                Toque una cara anatómica (V, D, P/L, M u O) para asignarle hallazgo.
              </p>
            </div>

            {/* Asignación Rápida de Diagnóstico a la Cara Seleccionada */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-dental-deep-navy uppercase tracking-wider">
                2. Diagnóstico para Cara {activeFace}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyStatus('caries')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all active:scale-95 ${
                    currentSurfaces[activeFace] === 'caries'
                      ? 'bg-status-danger/10 border-status-danger ring-2 ring-status-danger/30'
                      : 'bg-surface-clean-white border-border-subtle hover:bg-surface-subtle-ice'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-status-danger shrink-0 ring-1 ring-surface-clean-white" />
                  <div>
                    <span className="font-bold text-xs text-status-danger block leading-tight">
                      Caries Activa
                    </span>
                    <span className="text-[10px] text-secondary">Lesión cavitada</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyStatus('resina')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all active:scale-95 ${
                    currentSurfaces[activeFace] === 'resina'
                      ? 'bg-electric-blue/10 border-electric-blue ring-2 ring-electric-blue/30'
                      : 'bg-surface-clean-white border-border-subtle hover:bg-surface-subtle-ice'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-electric-blue shrink-0 ring-1 ring-surface-clean-white" />
                  <div>
                    <span className="font-bold text-xs text-electric-blue block leading-tight">
                      Resina / Obturado
                    </span>
                    <span className="text-[10px] text-secondary">Restauración estética</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyStatus('sano')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all active:scale-95 ${
                    currentSurfaces[activeFace] === 'sano'
                      ? 'bg-status-success/10 border-status-success ring-2 ring-status-success/30'
                      : 'bg-surface-clean-white border-border-subtle hover:bg-surface-subtle-ice'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-status-success shrink-0 ring-1 ring-surface-clean-white" />
                  <div>
                    <span className="font-bold text-xs text-status-success block leading-tight">
                      Esmalte Sano
                    </span>
                    <span className="text-[10px] text-secondary">Sin patología</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyStatus('corona')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all active:scale-95 ${
                    currentSurfaces[activeFace] === 'corona'
                      ? 'bg-status-warning/10 border-status-warning ring-2 ring-status-warning/30'
                      : 'bg-surface-clean-white border-border-subtle hover:bg-surface-subtle-ice'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-status-warning shrink-0 ring-1 ring-surface-clean-white" />
                  <div>
                    <span className="font-bold text-xs text-status-warning block leading-tight">
                      Corona / Prótesis
                    </span>
                    <span className="text-[10px] text-secondary">Rehabilitación protésica</span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Nota Clínica */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-dental-deep-navy uppercase tracking-wider">
            3. Evolución Clínica / Procedimiento
          </label>
          <textarea
            value={notaClinica}
            onChange={(e) => setNotaClinica(e.target.value)}
            rows={2}
            className="w-full p-2.5 rounded-xl bg-surface-subtle-ice text-dental-deep-navy text-xs border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Aislamiento absoluto con dique y resina nanohíbrida..."
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-xl bg-surface-container text-secondary text-xs font-bold hover:bg-surface-container-high transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-primary to-electric-blue text-surface-clean-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Guardar en Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
