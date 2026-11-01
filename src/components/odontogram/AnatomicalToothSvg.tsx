import React from 'react';
import { ToothFace, ToothFaceStatus, ToothSurfaces } from '../../types/clinical';

export const COLOR_POR_ESTADO: Record<ToothFaceStatus, string> = {
  sano: '#10B981',     // Verde
  caries: '#EF4444',   // Rojo
  resina: '#796487',   // Malva Amatista (Restauración Estética)
  corona: '#F59E0B',   // Amarillo/Naranja
  ausente: '#64748B',  // Gris / Slate
};

export const COLOR_PROCEDIMIENTOS = {
  endodoncia: '#9333EA', // Púrpura eléctrico / Violeta
  exodoncia: '#E11D48',  // Rojo Carmesí / Extracción
  protesis: '#F59E0B',   // Ámbar Dorado / Corona o Prótesis
  implante: '#06B6D4',   // Cian Eléctrico / Perno de Titanio
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
  procedimientoGeneral?: 'ninguno' | 'endodoncia' | 'exodoncia' | 'protesis' | 'implante' | 'corona';
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onSelectTooth?: (fdi: number) => void;
  onSelectFace?: (fdi: number, face: ToothFace) => void;
}

export const AnatomicalToothSvg: React.FC<AnatomicalToothSvgProps> = ({
  fdi,
  surfaces,
  isAbsent = false,
  procedimientoGeneral = 'ninguno',
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
    if (procedimientoGeneral === 'endodoncia') return '⚡ Endo';
    if (procedimientoGeneral === 'exodoncia') return '✕ Exo';
    if (procedimientoGeneral === 'protesis') return '👑 Prótesis';
    if (procedimientoGeneral === 'implante') return '🔩 Implante';
    if (hasCaries) return 'Caries';
    if (surfaces.O === 'corona' || procedimientoGeneral === 'corona') return 'Corona';
    if (hasResina) return 'Resina';
    return 'Sano';
  };

  const getLabelColor = () => {
    if (isAbsent) return 'text-slate-400';
    if (procedimientoGeneral === 'endodoncia') return 'text-purple-300 font-extrabold';
    if (procedimientoGeneral === 'exodoncia') return 'text-rose-400 font-extrabold';
    if (procedimientoGeneral === 'protesis') return 'text-amber-300 font-extrabold';
    if (procedimientoGeneral === 'implante') return 'text-cyan-300 font-extrabold';
    if (hasCaries) return 'text-status-danger font-bold';
    if (surfaces.O === 'corona' || procedimientoGeneral === 'corona') return 'text-status-warning font-semibold';
    if (hasResina) return 'text-electric-blue font-semibold';
    return 'text-status-success font-medium';
  };

  const dimensions =
    size === 'lg' ? 'w-24 h-24' : size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';

  // Halo e iluminación según procedimiento general
  const getCardBorder = () => {
    if (procedimientoGeneral === 'endodoncia') {
      return isSelected
        ? 'bg-purple-950/80 ring-4 ring-purple-400 shadow-[0_0_16px_rgba(147,51,234,0.75)] scale-105 z-20'
        : 'bg-purple-950/60 ring-2 ring-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.45)] hover:bg-purple-900/60';
    }
    if (procedimientoGeneral === 'exodoncia') {
      return isSelected
        ? 'bg-rose-950/80 ring-4 ring-rose-400 shadow-[0_0_16px_rgba(225,29,72,0.75)] scale-105 z-20'
        : 'bg-rose-950/60 ring-2 ring-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.45)] hover:bg-rose-900/60';
    }
    if (procedimientoGeneral === 'protesis') {
      return isSelected
        ? 'bg-amber-950/80 ring-4 ring-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.75)] scale-105 z-20'
        : 'bg-amber-950/60 ring-2 ring-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.45)] hover:bg-amber-900/60';
    }
    if (procedimientoGeneral === 'implante') {
      return isSelected
        ? 'bg-cyan-950/80 ring-4 ring-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.75)] scale-105 z-20'
        : 'bg-cyan-950/60 ring-2 ring-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.45)] hover:bg-cyan-900/60';
    }
    if (isSelected) {
      return 'bg-primary ring-2 ring-white shadow-lg scale-105 z-20';
    }
    return 'bg-dental-ambient-bg hover:bg-primary/60 active:scale-95';
  };

  return (
    <div
      onClick={() => onSelectTooth?.(fdi)}
      className={`p-1 rounded-xl flex flex-col items-center justify-between transition-all select-none cursor-pointer relative ${
        size === 'lg' ? 'p-3' : 'h-16'
      } ${getCardBorder()} ${isAbsent ? 'opacity-40' : ''}`}
      title={`Pieza FDI ${fdi} - ${getSubLabel()}`}
    >
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-black text-tertiary-fixed">{fdi}</span>
        {procedimientoGeneral === 'endodoncia' && (
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" title="Endodoncia Indicada / Realizada" />
        )}
        {procedimientoGeneral === 'exodoncia' && (
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Exodoncia Indicada" />
        )}
        {procedimientoGeneral === 'protesis' && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Prótesis / Corona" />
        )}
        {procedimientoGeneral === 'implante' && (
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" title="Implante Dental" />
        )}
      </div>

      {isAbsent ? (
        <div className="w-7 h-7 flex items-center justify-center font-bold text-outline-variant text-[15px]">
          ✕
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          <svg viewBox="0 0 32 32" className={`${dimensions} drop-shadow-sm`}>
            {/* Vestibular (Superior) */}
            <polygon
              points="2,2 30,2 22,10 10,10"
              fill={getColor('V')}
              stroke="#17121D"
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
              stroke="#17121D"
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
              stroke="#17121D"
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
              stroke="#17121D"
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
              stroke="#17121D"
              strokeWidth="0.8"
              className="hover:opacity-80 transition-opacity"
              onClick={(e) => {
                if (onSelectFace) {
                  e.stopPropagation();
                  onSelectFace(fdi, 'O');
                }
              }}
            />

            {/* Overlays Clínicos Específicos */}
            {procedimientoGeneral === 'exodoncia' && (
              <g stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="3" x2="29" y2="29" />
                <line x1="29" y1="3" x2="3" y2="29" />
              </g>
            )}
            {procedimientoGeneral === 'endodoncia' && (
              <g stroke="#9333EA" strokeWidth="2" strokeLinecap="round">
                <line x1="16" y1="2" x2="16" y2="30" strokeDasharray="3 2" />
                <circle cx="16" cy="16" r="3" fill="#9333EA" />
              </g>
            )}
            {procedimientoGeneral === 'protesis' && (
              <rect
                x="6"
                y="6"
                width="20"
                height="20"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                rx="3"
                strokeDasharray="2 1"
              />
            )}
            {procedimientoGeneral === 'implante' && (
              <g stroke="#06B6D4" strokeWidth="2" strokeLinecap="round">
                <line x1="16" y1="6" x2="16" y2="26" />
                <line x1="12" y1="12" x2="20" y2="12" />
                <line x1="13" y1="17" x2="19" y2="17" />
                <line x1="14" y1="22" x2="18" y2="22" />
              </g>
            )}
          </svg>
        </div>
      )}

      <span className={`text-[9px] ${getLabelColor()}`}>{getSubLabel()}</span>
    </div>
  );
};
