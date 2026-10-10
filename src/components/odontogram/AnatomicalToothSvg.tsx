import React from 'react';
import { ToothFace, ToothFaceStatus, ToothSurfaces } from '../../types/clinical';

export const COLOR_POR_ESTADO: Record<ToothFaceStatus, string> = {
  sano: '#10B981',     // Verde
  caries: '#EF4444',   // Rojo
  resina: '#0084FF',   // Azul
  corona: '#F59E0B',   // Amarillo/Naranja
  ausente: '#717786',  // Gris
};

export const NOMBRE_POR_ESTADO: Record<ToothFaceStatus, string> = {
  sano: 'Sano',
  caries: 'Caries Activa',
  resina: 'Resina / Obturado',
  corona: 'Corona / Prótesis',
  ausente: 'Ausente',
};

interface AnatomicalToothSvgProps {
  fdi: number;
  surfaces: ToothSurfaces;
  isAbsent?: boolean;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onSelectTooth?: (fdi: number) => void;
  onSelectFace?: (fdi: number, face: ToothFace) => void;
}

export const AnatomicalToothSvg: React.FC<AnatomicalToothSvgProps> = ({
  fdi,
  surfaces,
  isAbsent = false,
  isSelected = false,
  size = 'md',
  onSelectTooth,
  onSelectFace,
}) => {
  const getColor = (face: ToothFace): string => {
    if (isAbsent) return COLOR_POR_ESTADO.ausente;
    return COLOR_POR_ESTADO[surfaces[face]] || COLOR_POR_ESTADO.sano;
  };

  const hasCaries =
    surfaces.O === 'caries' ||
    surfaces.V === 'caries' ||
    surfaces.M === 'caries' ||
    surfaces.D === 'caries' ||
    surfaces.L === 'caries';

  const hasResina =
    surfaces.O === 'resina' ||
    surfaces.V === 'resina' ||
    surfaces.M === 'resina' ||
    surfaces.D === 'resina' ||
    surfaces.L === 'resina';

  const getSubLabel = () => {
    if (isAbsent) return 'Ausente';
    if (hasCaries) return 'Caries';
    if (surfaces.O === 'corona') return 'Corona';
    if (hasResina) return 'Resina';
    return 'Sano';
  };

  const getLabelColor = () => {
    if (isAbsent) return 'text-outline-variant';
    if (hasCaries) return 'text-status-danger font-bold';
    if (surfaces.O === 'corona') return 'text-status-warning font-semibold';
    if (hasResina) return 'text-electric-blue font-semibold';
    return 'text-status-success font-medium';
  };

  const dimensions =
    size === 'lg' ? 'w-24 h-24' : size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';

  return (
    <div
      onClick={() => onSelectTooth?.(fdi)}
      className={`p-1 rounded-xl flex flex-col items-center justify-between transition-all select-none cursor-pointer ${
        size === 'lg' ? 'p-3' : 'h-16'
      } ${
        isSelected
          ? 'bg-surface-clean-white/25 ring-2 ring-electric-blue shadow-[0_0_12px_rgba(0,132,255,0.6)] scale-105'
          : 'bg-surface-clean-white/10 hover:bg-surface-clean-white/20 active:scale-95'
      } ${isAbsent ? 'opacity-50' : ''}`}
      title={`Pieza FDI ${fdi} - ${getSubLabel()}`}
    >
      <span className="text-[11px] font-bold text-tertiary-fixed">{fdi}</span>

      {isAbsent ? (
        <div className="w-7 h-7 flex items-center justify-center font-bold text-outline-variant text-[15px]">
          ✕
        </div>
      ) : (
        <svg viewBox="0 0 32 32" className={`${dimensions} drop-shadow-sm`}>
          {/* Vestibular (Superior) */}
          <polygon
            points="2,2 30,2 22,10 10,10"
            fill={getColor('V')}
            stroke="#0F2B48"
            strokeWidth="0.8"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => {
              if (onSelectFace) {
                e.stopPropagation();
                onSelectFace(fdi, 'V');
              }
            }}
          />
          {/* Distal (Derecha) */}
          <polygon
            points="30,2 30,30 22,22 22,10"
            fill={getColor('D')}
            stroke="#0F2B48"
            strokeWidth="0.8"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => {
              if (onSelectFace) {
                e.stopPropagation();
                onSelectFace(fdi, 'D');
              }
            }}
          />
          {/* Palatino / Lingual (Inferior) */}
          <polygon
            points="30,30 2,30 10,22 22,22"
            fill={getColor('L')}
            stroke="#0F2B48"
            strokeWidth="0.8"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => {
              if (onSelectFace) {
                e.stopPropagation();
                onSelectFace(fdi, 'L');
              }
            }}
          />
          {/* Mesial (Izquierda) */}
          <polygon
            points="2,30 2,2 10,10 10,22"
            fill={getColor('M')}
            stroke="#0F2B48"
            strokeWidth="0.8"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => {
              if (onSelectFace) {
                e.stopPropagation();
                onSelectFace(fdi, 'M');
              }
            }}
          />
          {/* Oclusal / Incisal (Centro) */}
          <rect
            x="10"
            y="10"
            width="12"
            height="12"
            fill={getColor('O')}
            stroke="#0F2B48"
            strokeWidth="0.8"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => {
              if (onSelectFace) {
                e.stopPropagation();
                onSelectFace(fdi, 'O');
              }
            }}
          />
        </svg>
      )}

      <span className={`text-[9px] ${getLabelColor()}`}>{getSubLabel()}</span>
    </div>
  );
};
