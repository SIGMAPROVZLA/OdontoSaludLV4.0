import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CorporatePaletteConfig, CorporatePaletteId } from '../types/clinical';
import { ApiClient } from '../services/api';

export const CORPORATE_PALETTES: CorporatePaletteConfig[] = [
  {
    id: 'palette-14-luxury-plum',
    numeroCatalogo: '#14',
    nombre: 'Founder Purple / Luxury Plum',
    subtitulo: 'Ciruela Real & Lavanda Seda (Predeterminada)',
    colors: {
      obsidian: '#17121D',
      aubergine: '#302538',
      royalPlum: '#51405F',
      mauve: '#796487',
      lilac: '#B09BB8',
      silk: '#E8DDEB',
      surfaceBg: '#F4EEF7',
    },
  },
  {
    id: 'palette-13-deep-teal',
    numeroCatalogo: '#13',
    nombre: 'Deep Teal Quirúrgico',
    subtitulo: 'Verde Azulado Clínico & Cristal Menta',
    colors: {
      obsidian: '#062022',
      aubergine: '#0D3B3E',
      royalPlum: '#0D7478',
      mauve: '#268E92',
      lilac: '#72BFC2',
      silk: '#D6F3F3',
      surfaceBg: '#EBF9F9',
    },
  },
  {
    id: 'palette-12-trust-navy',
    numeroCatalogo: '#12',
    nombre: 'Trust Navy Corporativo',
    subtitulo: 'Azul Naval Profundo & Hielo Clínico',
    colors: {
      obsidian: '#09152B',
      aubergine: '#132A54',
      royalPlum: '#1D4ED8',
      mauve: '#3B69B8',
      lilac: '#88ACE0',
      silk: '#D8E6FA',
      surfaceBg: '#EDF3FC',
    },
  },
  {
    id: 'palette-15-enterprise-navy',
    numeroCatalogo: '#15',
    nombre: 'Enterprise Navy Pizarra',
    subtitulo: 'Acero Ejecutivo & Plata Satinada',
    colors: {
      obsidian: '#0F172A',
      aubergine: '#1E293B',
      royalPlum: '#334155',
      mauve: '#64748B',
      lilac: '#94A3B8',
      silk: '#E2E8F0',
      surfaceBg: '#F1F5F9',
    },
  },
];

function hexToRgbChannels(hex: string): string {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return '81 64 95';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

interface ThemePaletteContextType {
  activePaletteId: CorporatePaletteId;
  activePalette: CorporatePaletteConfig;
  palettes: CorporatePaletteConfig[];
  setPalette: (id: CorporatePaletteId) => Promise<void>;
}

const ThemePaletteContext = createContext<ThemePaletteContextType | undefined>(undefined);

export function applyPaletteToRoot(palette: CorporatePaletteConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Variables HEX del Catálogo Maestro Corporativo
  root.style.setProperty('--palette-obsidian', palette.colors.obsidian);
  root.style.setProperty('--palette-aubergine', palette.colors.aubergine);
  root.style.setProperty('--palette-royal-plum', palette.colors.royalPlum);
  root.style.setProperty('--palette-mauve', palette.colors.mauve);
  root.style.setProperty('--palette-lilac', palette.colors.lilac);
  root.style.setProperty('--palette-silk', palette.colors.silk);

  // Variables CSS nativas requeridas por AGENTS.md §3.2
  root.style.setProperty('--color-bg', palette.colors.surfaceBg);
  root.style.setProperty('--color-surface', palette.colors.silk);
  root.style.setProperty('--color-primary', palette.colors.royalPlum);
  root.style.setProperty('--color-secondary', palette.colors.mauve);
  root.style.setProperty('--color-border', palette.colors.lilac);
  root.style.setProperty('--color-text', palette.colors.obsidian);

  // Canales RGB separados por espacio para soporte 100% reactivo de opacidades y gradientes en Tailwind CSS
  root.style.setProperty('--palette-obsidian-rgb', hexToRgbChannels(palette.colors.obsidian));
  root.style.setProperty('--palette-aubergine-rgb', hexToRgbChannels(palette.colors.aubergine));
  root.style.setProperty('--palette-royal-plum-rgb', hexToRgbChannels(palette.colors.royalPlum));
  root.style.setProperty('--palette-mauve-rgb', hexToRgbChannels(palette.colors.mauve));
  root.style.setProperty('--palette-lilac-rgb', hexToRgbChannels(palette.colors.lilac));
  root.style.setProperty('--palette-silk-rgb', hexToRgbChannels(palette.colors.silk));

  root.style.setProperty('--color-bg-rgb', hexToRgbChannels(palette.colors.surfaceBg));
  root.style.setProperty('--color-surface-rgb', hexToRgbChannels(palette.colors.silk));
  root.style.setProperty('--color-primary-rgb', hexToRgbChannels(palette.colors.royalPlum));
  root.style.setProperty('--color-secondary-rgb', hexToRgbChannels(palette.colors.mauve));
  root.style.setProperty('--color-border-rgb', hexToRgbChannels(palette.colors.lilac));
  root.style.setProperty('--color-text-rgb', hexToRgbChannels(palette.colors.obsidian));

  root.setAttribute('data-palette', palette.id);
}

export const ThemePaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userChangedRef = useRef(false);
  const [activePaletteId, setActivePaletteId] = useState<CorporatePaletteId>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('odontosalud_palette_id') as CorporatePaletteId | null;
      if (saved && CORPORATE_PALETTES.some((p) => p.id === saved)) {
        const initialPal = CORPORATE_PALETTES.find((p) => p.id === saved);
        if (initialPal) applyPaletteToRoot(initialPal);
        return saved;
      }
    }
    applyPaletteToRoot(CORPORATE_PALETTES[0]);
    return 'palette-14-luxury-plum';
  });

  const activePalette =
    CORPORATE_PALETTES.find((p) => p.id === activePaletteId) || CORPORATE_PALETTES[0];

  useEffect(() => {
    applyPaletteToRoot(activePalette);
  }, [activePalette]);

  useEffect(() => {
    let mounted = true;
    ApiClient.getActivePalette().then((remotePaletteId) => {
      if (!mounted || userChangedRef.current) return;
      const hasLocal = typeof window !== 'undefined' && window.localStorage.getItem('odontosalud_palette_id');
      if (!hasLocal && remotePaletteId && CORPORATE_PALETTES.some((p) => p.id === remotePaletteId)) {
        setActivePaletteId(remotePaletteId);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('odontosalud_palette_id', remotePaletteId);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setPalette = async (id: CorporatePaletteId) => {
    const found = CORPORATE_PALETTES.find((p) => p.id === id);
    if (!found) return;
    userChangedRef.current = true;
    setActivePaletteId(id);
    applyPaletteToRoot(found);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('odontosalud_palette_id', id);
    }
    // Persistir en Cloudflare KV + D1 en segundo plano sin bloquear la UI
    ApiClient.saveActivePalette(id, 'SuperAdmin / Dirección Médica').catch(() => {});
  };

  return (
    <ThemePaletteContext.Provider
      value={{
        activePaletteId,
        activePalette,
        palettes: CORPORATE_PALETTES,
        setPalette,
      }}
    >
      {children}
    </ThemePaletteContext.Provider>
  );
};

export const useThemePalette = (): ThemePaletteContextType => {
  const ctx = useContext(ThemePaletteContext);
  if (!ctx) {
    throw new Error('useThemePalette debe usarse dentro de un ThemePaletteProvider');
  }
  return ctx;
};
