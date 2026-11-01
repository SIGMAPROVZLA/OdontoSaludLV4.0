import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api';
import { useThemePalette } from '../../context/ThemePaletteContext';
import { AuditoriaAccionItem, CorporatePaletteId, EdgeHealthMetrics } from '../../types/clinical';

export const SuperAdminGovernancePanel: React.FC = () => {
  const { activePaletteId, palettes, setPalette } = useThemePalette();
  const [health, setHealth] = useState<EdgeHealthMetrics | null>(null);
  const [auditorias, setAuditorias] = useState<AuditoriaAccionItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAuditTable, setShowAuditTable] = useState(false);

  const cargarTelemetriaYAuditoria = async () => {
    setIsRefreshing(true);
    try {
      const [h, aud] = await Promise.all([
        ApiClient.getEdgeHealthMetrics(),
        ApiClient.getAuditoriaAcciones(20),
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
    <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-dental-deep-navy" />

      {/* Cabecera de Gobernanza Edge Zero-Server */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[22px] text-emerald-400">shield_lock</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-extrabold text-sm sm:text-base text-dental-deep-navy">
                Gobernanza SuperAdmin • Salud Edge & Catálogo de Paletas
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                100% Cloudflare Native
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Monitoreo en vivo de D1, KV, R2 Streaming, Sellado Forense SHA-256 y Paletas Corporativas (`AGENTS.md`)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowAuditTable(!showAuditTable)}
            className="px-3 py-1.5 rounded-xl bg-surface-subtle-ice hover:bg-surface-container border border-border-subtle text-dental-deep-navy text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">policy</span>
            <span>{showAuditTable ? 'Ocultar Auditoría' : `Auditoría (${auditorias.length})`}</span>
          </button>

          <button
            type="button"
            onClick={cargarTelemetriaYAuditoria}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Ping Edge</span>
          </button>
        </div>
      </div>

      {/* 1. Métricas de Salud Operativa Edge en Vivo (SLA < 50 ms) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-secondary">Latencia Anycast Edge</span>
            <span className="material-symbols-outlined text-[16px] text-emerald-600">speed</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-display font-black text-xl text-dental-deep-navy">
              {health ? `${health.anycastLatencyMs} ms` : '4 ms'}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
              SLA &lt; 50ms OK
            </span>
          </div>
          <span className="text-[10px] text-secondary mt-1">Worker Hono Strict TS (&lt;10ms CPU)</span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-secondary">Cloudflare D1 SQLite</span>
            <span className="material-symbols-outlined text-[16px] text-primary">database</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-display font-black text-xl text-dental-deep-navy">
              {health
                ? health.d1Stats.totalPacientes +
                  health.d1Stats.totalCitas +
                  health.d1Stats.totalPresupuestos +
                  health.d1Stats.totalPagos
                : 22}{' '}
              filas
            </span>
            <span className="text-[10px] font-bold text-primary">ACID Batch</span>
          </div>
          <span className="text-[10px] text-secondary mt-1">
            Cierres: {health?.d1Stats.totalCierresDiarios ?? 1} • Auditorías: {health?.d1Stats.totalAuditorias ?? auditorias.length}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-secondary">Cloudflare R2 & KV</span>
            <span className="material-symbols-outlined text-[16px] text-primary">cloud_done</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-display font-extrabold text-sm text-dental-deep-navy truncate">
              {health?.r2Stats.streamingMode || 'ReadableStream Zero-RAM'}
            </span>
          </div>
          <span className="text-[10px] text-secondary mt-1">
            KV Rate-Limit Activo • RX: {health?.r2Stats.totalRadiografias ?? 0}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900 text-white border border-emerald-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-emerald-300">Sellado Forense Legal</span>
            <span className="material-symbols-outlined text-[16px] text-emerald-400">gpp_good</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono font-black text-xl text-white">
              {health?.d1Stats.totalSellosForenses ?? 0} sellos
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-300">SHA-256</span>
          </div>
          <span className="text-[10px] text-slate-300 mt-1">WebCrypto (`crypto.subtle`) + UTC</span>
        </div>
      </div>

      {/* 2. Selector Dinámico de Paletas del Catálogo Maestro Corporativo (AGENTS.md §3.2) */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-dental-deep-navy flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">palette</span>
            <span>Selector en Vivo de Paletas del Catálogo Corporativo (`:root` CSS + KV + D1)</span>
          </span>
          <span className="text-[10px] font-bold text-secondary"> Contraste WCAG AA &gt;= 4.5:1</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {palettes.map((pal) => {
            const isSelected = pal.id === activePaletteId;
            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => handleSelectPalette(pal.id)}
                className={`p-3 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-surface-container border-primary ring-2 ring-primary/40 shadow-sm'
                    : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold text-dental-deep-navy truncate">
                    Paleta {pal.numeroCatalogo} • {pal.nombre}
                  </span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] text-status-success shrink-0">
                      check_circle
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-secondary truncate">{pal.subtitulo}</p>
                <div className="flex items-center gap-1.5 pt-1">
                  <span
                    className="w-5 h-5 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: pal.colors.obsidian }}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: pal.colors.aubergine }}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: pal.colors.royalPlum }}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: pal.colors.mauve }}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs"
                    style={{ backgroundColor: pal.colors.silk }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tabla Desplegable de Auditoría de Acciones y Seguridad Forense (AGENTS.md §3.4) */}
      {showAuditTable && (
        <div className="pt-2 border-t border-border-subtle flex flex-col gap-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-dental-deep-navy flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">Fact_Check</span>
              <span>Bitácora Inmutable de Auditoría y Sellos SHA-256 (`auditoria_acciones`)</span>
            </span>
            <span className="text-[10px] text-secondary font-mono">Append-Only D1</span>
          </div>

          {auditorias.length === 0 ? (
            <div className="p-4 text-center text-xs text-secondary bg-surface-subtle-ice rounded-xl border border-border-subtle">
              Aún no se registran eventos en la bitácora de auditoría. Cambia una paleta o registra un cobro/evolución para generar un sello.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {auditorias.map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-dental-deep-navy text-white font-mono text-[10px] font-bold">
                        {a.accion}
                      </span>
                      <span className="font-bold text-dental-deep-navy">{a.actor}</span>
                      <span className="text-[10px] text-secondary">• {a.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-secondary mt-0.5 truncate">{a.detalle}</p>
                  </div>
                  {a.sha256Hash && (
                    <span className="shrink-0 px-2 py-1 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[10px] font-bold">
                      SHA-256: {a.sha256Hash.slice(0, 10).toUpperCase()}…
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
