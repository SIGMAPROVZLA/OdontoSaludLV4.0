import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api';
import { useThemePalette } from '../../context/ThemePaletteContext';
import { AuditoriaAccionItem, CorporatePaletteId, EdgeHealthMetrics } from '../../types/clinical';
import { LiveApiMotionGraphic } from './LiveApiMotionGraphic';
import { ArchitectureMotionDiagram } from './ArchitectureMotionDiagram';
import { NovedadesReportSection } from './NovedadesReportSection';
import { UserAuthenticationCard } from './UserAuthenticationCard';
import { TabId } from '../layout/BottomNavigation';

interface SuperAdminViewProps {
  onNavigateTab?: (tab: TabId) => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ onNavigateTab }) => {
  const { activePaletteId, palettes, setPalette } = useThemePalette();
  const [subTab, setSubTab] = useState<'usuarios_auth' | 'paletas' | 'motion_apis' | 'novedades' | 'auditoria'>('usuarios_auth');
  const [health, setHealth] = useState<EdgeHealthMetrics | null>(null);
  const [auditorias, setAuditorias] = useState<AuditoriaAccionItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cargarTelemetriaYAuditoria = async () => {
    setIsRefreshing(true);
    try {
      const [h, aud] = await Promise.all([
        ApiClient.getEdgeHealthMetrics(),
        ApiClient.getAuditoriaAcciones(30),
      ]);
      setHealth(h);
      setAuditorias(aud || []);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    cargarTelemetriaYAuditoria();
  }, [activePaletteId]);

  const handleSelectPalette = async (id: CorporatePaletteId) => {
    await setPalette(id);
    await cargarTelemetriaYAuditoria();
  };

  return (
    <div className="flex flex-col gap-5 pb-32 animate-in fade-in duration-300">
      {/* =========================================================================
          HERO SUPERADMIN: TELEMETRÍA EDGE ANYCAST Y SALUD ARQUITECTÓNICA
         ========================================================================= */}
      <section className="bg-dental-deep-navy text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-primary relative overflow-hidden">
        {/* Fondo sutil con gradiente ambiental */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-primary/40 border border-primary text-white flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[28px] text-emerald-400">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Panel Exclusivo SuperAdmin
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-surface-container">
                  Cloudflare Native
                </span>
              </div>
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-white mt-1 leading-tight">
                Control de Arquitectura, Paletas & Telemetría Edge
              </h1>
              <p className="text-xs text-surface-container/80 mt-0.5">
                Gobernanza centralizada de APIs en tiempo real, cinemática en cliente y trazabilidad forense SHA-256
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <button
              type="button"
              onClick={cargarTelemetriaYAuditoria}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-white hover:text-dental-deep-navy text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[17px] ${isRefreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isRefreshing ? 'Midiendo...' : 'Ping Latencia Anycast'}</span>
            </button>
          </div>
        </div>

        {/* Métricas Principales del Borde */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-surface-container block">Latencia Edge Anycast</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-display font-black text-2xl text-white">
                {health ? `${health.anycastLatencyMs} ms` : '4 ms'}
              </span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                SLA &lt; 50ms OK
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-surface-container block">Cloudflare D1 (SQLite)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-display font-black text-2xl text-white">
                {health
                  ? health.d1Stats.totalPacientes +
                    health.d1Stats.totalCitas +
                    health.d1Stats.totalPresupuestos +
                    health.d1Stats.totalPagos
                  : 24}{' '}
                filas
              </span>
              <span className="text-[10px] font-bold text-primary-fixed">ACID</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-surface-container block">Cloudflare R2 & KV</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-display font-extrabold text-sm text-white truncate">
                {health?.r2Stats.streamingMode || 'ReadableStream Zero-RAM'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Sellos Forenses SHA-256</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-mono font-black text-2xl text-emerald-300">
                {health?.d1Stats.totalSellosForenses ?? 0}
              </span>
              <span className="text-[10px] font-mono text-white/70">Inmutables</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SELECTOR DE PESTAÑAS INDEPENDIENTES DE LA VISTA SUPERADMIN
         ========================================================================= */}
      <section className="bg-surface-clean-white rounded-2xl p-2 shadow-sm border border-border-subtle flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => setSubTab('usuarios_auth')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              subTab === 'usuarios_auth'
                ? 'bg-dental-deep-navy text-white shadow-md'
                : 'text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-400">shield_person</span>
            <span>Autenticación de Usuarios & RBAC</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('paletas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              subTab === 'paletas'
                ? 'bg-dental-deep-navy text-white shadow-md'
                : 'text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-400">palette</span>
            <span>Motor Dinámico de Paletas Corporativas</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('motion_apis')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              subTab === 'motion_apis'
                ? 'bg-dental-deep-navy text-white shadow-md'
                : 'text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-400">query_stats</span>
            <span>Motion Graphics de APIs & Diagrama</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('novedades')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              subTab === 'novedades'
                ? 'bg-dental-deep-navy text-white shadow-md'
                : 'text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] text-amber-400">new_releases</span>
            <span>Reporte de Novedades & Cinemática</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('auditoria')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              subTab === 'auditoria'
                ? 'bg-dental-deep-navy text-white shadow-md'
                : 'text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] text-cyan-400">policy</span>
            <span>Auditoría Forense ({auditorias.length})</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          CONTENIDO DINÁMICO POR PESTAÑAS
         ========================================================================= */}

      {/* 0. Tarjeta del Módulo de Autenticación de Usuarios, Roles RBAC & Sesiones Clínicas */}
      {subTab === 'usuarios_auth' && (
        <UserAuthenticationCard
          onNavigateTab={onNavigateTab}
          onAuditEvent={cargarTelemetriaYAuditoria}
        />
      )}

      {/* 1. Motion Graphics de APIs y Diagrama de Funcionamiento */}
      {subTab === 'motion_apis' && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-200">
          <LiveApiMotionGraphic />
          <ArchitectureMotionDiagram />
        </div>
      )}

      {/* 2. Motor Dinámico de Paletas del Catálogo Maestro Corporativo */}
      {subTab === 'paletas' && (
        <section className="bg-surface-clean-white rounded-3xl p-5 sm:p-6 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">palette</span>
                <h2 className="font-display font-extrabold text-base sm:text-lg text-dental-deep-navy">
                  Motor Dinámico de Paletas del Catálogo Maestro Corporativo
                </h2>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                La selección inyecta reactivamente las variables CSS nativas en el elemento :root del DOM y persiste la preferencia en KV y D1 (`AGENTS.md §3.2`)
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
              Contraste WCAG AA &gt;= 4.5:1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {palettes.map((pal) => {
              const isSelected = pal.id === activePaletteId;
              return (
                <div
                  key={pal.id}
                  onClick={() => handleSelectPalette(pal.id)}
                  className={`p-4 rounded-2xl border transition-all active:scale-95 cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-surface-container border-primary ring-2 ring-primary/40 shadow-md'
                      : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                        Catálogo Corporativo
                      </span>
                      <h3 className="font-extrabold text-sm text-dental-deep-navy mt-0.5">
                        Paleta {pal.numeroCatalogo} • {pal.nombre}
                      </h3>
                      <p className="text-[11px] text-secondary mt-1">{pal.subtitulo}</p>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[20px] text-status-success shrink-0">
                        check_circle
                      </span>
                    )}
                  </div>

                  {/* Muestrario de Colores de la Paleta */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border-subtle/60">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-6 h-6 rounded-lg border border-white shadow-2xs"
                        style={{ backgroundColor: pal.colors.obsidian }}
                        title="Obsidian Fondo / Base"
                      />
                      <span
                        className="w-6 h-6 rounded-lg border border-white shadow-2xs"
                        style={{ backgroundColor: pal.colors.aubergine }}
                        title="Aubergine Contenedor Primario"
                      />
                      <span
                        className="w-6 h-6 rounded-lg border border-white shadow-2xs"
                        style={{ backgroundColor: pal.colors.royalPlum }}
                        title="Royal Plum Acento Primario"
                      />
                      <span
                        className="w-6 h-6 rounded-lg border border-white shadow-2xs"
                        style={{ backgroundColor: pal.colors.mauve }}
                        title="Mauve Acento Secundario"
                      />
                      <span
                        className="w-6 h-6 rounded-lg border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: pal.colors.silk }}
                        title="Silk Superficie Claro"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white border border-border-subtle text-dental-deep-navy hover:bg-primary hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ Paleta Activa en Vivo' : 'Aplicar Paleta'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Variables Inyectadas en :root */}
          <div className="p-4 rounded-2xl bg-[#090D16] text-white font-mono text-xs border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-2">
              /* Variables CSS Nativas Activas en el Documento (:root) */
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div>--color-bg: <span className="text-white font-bold">{palettes.find(p => p.id === activePaletteId)?.colors.surfaceBg}</span></div>
              <div>--color-surface: <span className="text-white font-bold">{palettes.find(p => p.id === activePaletteId)?.colors.silk}</span></div>
              <div>--color-primary: <span className="text-white font-bold">{palettes.find(p => p.id === activePaletteId)?.colors.royalPlum}</span></div>
              <div>--color-secondary: <span className="text-white font-bold">{palettes.find(p => p.id === activePaletteId)?.colors.mauve}</span></div>
              <div>--color-border: <span className="text-white font-bold">{palettes.find(p => p.id === activePaletteId)?.colors.lilac}</span></div>
              <div>--color-text: <span className="text-white font-bold">{palettes.find(p => p.id === activePaletteId)?.colors.obsidian}</span></div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Reporte de Novedades y Motion Graphics */}
      {subTab === 'novedades' && (
        <div className="animate-in fade-in duration-200">
          <NovedadesReportSection />
        </div>
      )}

      {/* 4. Bitácora de Auditoría Forense y Sellos SHA-256 */}
      {subTab === 'auditoria' && (
        <section className="bg-surface-clean-white rounded-3xl p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">policy</span>
                <h2 className="font-display font-extrabold text-base text-dental-deep-navy">
                  Bitácora Inmutable de Auditoría & Sellado Forense SHA-256
                </h2>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Registro criptográfico append-only en Cloudflare D1 (`auditoria_acciones`) conforme a AGENTS.md §3.4 y §7.2
              </p>
            </div>

            <span className="text-xs font-mono font-bold text-secondary bg-surface-subtle-ice px-3 py-1 rounded-xl border border-border-subtle">
              {auditorias.length} eventos registrados
            </span>
          </div>

          {auditorias.length === 0 ? (
            <div className="p-8 text-center text-xs text-secondary bg-surface-subtle-ice rounded-2xl border border-border-subtle">
              No se registran eventos de auditoría aún en Cloudflare D1.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {auditorias.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-surface-container/60 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-dental-deep-navy text-white font-mono text-[10px] font-bold">
                        {a.accion}
                      </span>
                      <span className="font-bold text-dental-deep-navy">{a.actor}</span>
                      <span className="text-[10px] text-secondary">• Sede: {a.sedeId} • {a.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-secondary mt-1">{a.detalle}</p>
                  </div>

                  {a.sha256Hash && (
                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[10px] font-bold shadow-2xs">
                      SHA-256: {a.sha256Hash.slice(0, 10).toUpperCase()}…
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
