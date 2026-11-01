import React from 'react';

/**
 * Generador Determinista de Identicones Vectoriales SVG (AGENTS.md §4)
 * Cero llamadas a Cloudflare R2: genera avatares vectoriales únicos a partir de la cédula o correo.
 */

const IDENTICON_PALETTES = [
  { bg: '#302538', fg1: '#E8DDEB', fg2: '#B09BB8', accent: '#10B981' },
  { bg: '#11383B', fg1: '#DCF2F2', fg2: '#78B7B9', accent: '#34D399' },
  { bg: '#172A4E', fg1: '#DCE6F7', fg2: '#8CA8D3', accent: '#38BDF8' },
  { bg: '#3B1D38', fg1: '#FCE7F3', fg2: '#F472B6', accent: '#A78BFA' },
  { bg: '#1E293B', fg1: '#E2E8F0', fg2: '#94A3B8', accent: '#2DD4BF' },
];

function hashSeed(seed: string): number {
  const clean = (seed || 'ODONTOSALUD').trim().toUpperCase();
  let h = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    h ^= clean.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface DeterministicIdenticonProps {
  seed: string;
  name?: string;
  size?: number;
  className?: string;
}

export const DeterministicIdenticon: React.FC<DeterministicIdenticonProps> = ({
  seed,
  name,
  size = 44,
  className = '',
}) => {
  const hash = hashSeed(seed || name || 'V-00000000');
  const palette = IDENTICON_PALETTES[hash % IDENTICON_PALETTES.length];

  // Matriz simétrica 5x5 para patrón geométrico orgánico
  const cells: { x: number; y: number; color: string }[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      const bitIndex = row * 3 + col;
      const isFilled = ((hash >> bitIndex) & 1) === 1;
      if (isFilled) {
        const useAccent = ((hash >> (bitIndex + 8)) & 3) === 0;
        const color = useAccent ? palette.accent : bitIndex % 2 === 0 ? palette.fg1 : palette.fg2;
        cells.push({ x: col, y: row, color });
        if (col < 2) {
          cells.push({ x: 4 - col, y: row, color });
        }
      }
    }
  }

  const initials = (name || seed || 'OD')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return React.createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 60 60',
      className: `shrink-0 rounded-xl shadow-sm select-none ${className}`,
      role: 'img',
      'aria-label': `Identicon determinista de ${name || seed}`,
    },
    React.createElement('rect', { width: '60', height: '60', rx: '14', fill: palette.bg }),
    React.createElement(
      'g',
      { opacity: '0.28' },
      cells.map((cell, idx) =>
        React.createElement('rect', {
          key: idx,
          x: 8 + cell.x * 9,
          y: 8 + cell.y * 9,
          width: '7.5',
          height: '7.5',
          rx: '2.5',
          fill: cell.color,
        })
      )
    ),
    React.createElement('circle', {
      cx: '30',
      cy: '30',
      r: '17',
      fill: palette.bg,
      fillOpacity: '0.72',
      stroke: palette.fg2,
      strokeWidth: '1.2',
    }),
    React.createElement(
      'text',
      {
        x: '30',
        y: '35',
        textAnchor: 'middle',
        fill: '#FFFFFF',
        fontSize: '14',
        fontWeight: '800',
        fontFamily: 'Sora, Manrope, sans-serif',
      },
      initials || 'OD'
    )
  );
};
