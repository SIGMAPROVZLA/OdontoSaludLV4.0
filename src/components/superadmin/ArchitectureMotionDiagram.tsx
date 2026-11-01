import React, { useState } from 'react';

/**
 * Diagrama Cinemático de Funcionamiento de la Arquitectura Edge Zero-Server (AGENTS.md §1 y §2)
 * Renderizado interactivo SVG con pulsos de luz, flujo de paquetes y selector de capas técnicas.
 */

type ArchLayerId = 'all' | 'client' | 'edge' | 'storage';

interface ArchNode {
  id: string;
  label: string;
  sublabel: string;
  layer: 'client' | 'edge' | 'storage';
  badge: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const NODOS_ARQUITECTURA: ArchNode[] = [
  {
    id: 'node-client',
    label: 'Cliente PWA (React 18)',
    sublabel: 'Vite + Canvas 60 FPS + WebCrypto SHA-256',
    layer: 'client',
    badge: 'Cero Servidor en RAM',
    icon: 'devices',
    color: '#38BDF8',
    x: 40,
    y: 110,
    width: 200,
    height: 90,
  },
  {
    id: 'node-edge',
    label: 'Cloudflare Global Anycast',
    sublabel: 'Workers + Hono Framework (< 10ms CPU)',
    layer: 'edge',
    badge: 'SLA Latencia < 50ms',
    icon: 'cloud',
    color: '#10B981',
    x: 310,
    y: 110,
    width: 220,
    height: 90,
  },
  {
    id: 'node-d1',
    label: 'Cloudflare D1 (SQLite Edge)',
    sublabel: 'ACID Transaccional DB.batch + Auditoría',
    layer: 'storage',
    badge: '14 Tablas Relacionales',
    icon: 'database',
    color: '#8B5CF6',
    x: 600,
    y: 20,
    width: 210,
    height: 75,
  },
  {
    id: 'node-kv',
    label: 'Cloudflare KV (CACHE)',
    sublabel: 'Tasas BCV, Sesiones, Rate-Limit & Paletas',
    layer: 'storage',
    badge: 'Lecturas < 2ms',
    icon: 'memory',
    color: '#F59E0B',
    x: 600,
    y: 115,
    width: 210,
    height: 75,
  },
  {
    id: 'node-r2',
    label: 'Cloudflare R2 (STORAGE)',
    sublabel: 'Radiografías RVG Streaming ReadableStream',
    layer: 'storage',
    badge: 'Cero Egress Fees',
    icon: 'folder_data',
    color: '#EC4899',
    x: 600,
    y: 210,
    width: 210,
    height: 75,
  },
];

export const ArchitectureMotionDiagram: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<ArchLayerId>('all');
  const [activeNodeId, setActiveNodeId] = useState<string | null>('node-edge');

  const selectedNode = NODOS_ARQUITECTURA.find((n) => n.id === activeNodeId) || NODOS_ARQUITECTURA[1];

  return (
    <div className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4">
      {/* Cabecera del Diagrama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-cyan-400">schema</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                Diagrama Cinemático de Funcionamiento Edge Zero-Server
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-100 text-cyan-800 border border-cyan-300">
                100% NATIVO CLOUDFLARE
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Flujo end-to-end con pulsos electromagnéticos en tiempo real entre capas
            </p>
          </div>
        </div>

        {/* Selector de Capas */}
        <div className="flex items-center gap-1 bg-surface-subtle-ice p-1 rounded-xl border border-border-subtle self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedLayer('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              selectedLayer === 'all'
                ? 'bg-dental-deep-navy text-white shadow-xs'
                : 'text-secondary hover:text-dental-deep-navy'
            }`}
          >
            Todo el Flujo
          </button>
          <button
            type="button"
            onClick={() => setSelectedLayer('client')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              selectedLayer === 'client'
                ? 'bg-dental-deep-navy text-white shadow-xs'
                : 'text-secondary hover:text-dental-deep-navy'
            }`}
          >
            Cliente PWA
          </button>
          <button
            type="button"
            onClick={() => setSelectedLayer('edge')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              selectedLayer === 'edge'
                ? 'bg-dental-deep-navy text-white shadow-xs'
                : 'text-secondary hover:text-dental-deep-navy'
            }`}
          >
            Borde Anycast
          </button>
          <button
            type="button"
            onClick={() => setSelectedLayer('storage')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              selectedLayer === 'storage'
                ? 'bg-dental-deep-navy text-white shadow-xs'
                : 'text-secondary hover:text-dental-deep-navy'
            }`}
          >
            Persistencia
          </button>
        </div>
      </div>

      {/* Diagrama SVG Interactivo y Cinemático */}
      <div className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-800 bg-[#090D16] p-2">
        <svg
          viewBox="0 0 850 310"
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Diagrama Cinemático de la Arquitectura Edge Zero-Server"
        >
          <defs>
            {/* Filtros de Resplandor Neón (Glow) */}
            <filter id="glow-teal" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradientes de Nodos */}
            <linearGradient id="grad-client" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="grad-edge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="100%" stopColor="#022C22" />
            </linearGradient>
            <linearGradient id="grad-d1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>
            <linearGradient id="grad-kv" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
            <linearGradient id="grad-r2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#831843" />
              <stop offset="100%" stopColor="#500724" />
            </linearGradient>
          </defs>

          {/* Líneas de Conexión Cinemáticas */}
          {/* Cliente -> Borde Anycast */}
          <path
            d="M 240 155 L 310 155"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
          {/* Partícula de pulso Client -> Edge */}
          <circle r="4" fill="#34D399" filter="url(#glow-teal)">
            <animateMotion
              path="M 240 155 L 310 155"
              dur="1.2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Borde Anycast -> D1 SQLite */}
          <path
            d="M 530 140 C 560 140, 560 55, 600 55"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          <circle r="3.5" fill="#A78BFA" filter="url(#glow-purple)">
            <animateMotion
              path="M 530 140 C 560 140, 560 55, 600 55"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Borde Anycast -> KV Cache */}
          <path
            d="M 530 155 L 600 155"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          <circle r="3.5" fill="#FBBF24">
            <animateMotion
              path="M 530 155 L 600 155"
              dur="0.9s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Borde Anycast -> R2 Streaming */}
          <path
            d="M 530 170 C 560 170, 560 245, 600 245"
            fill="none"
            stroke="#EC4899"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          <circle r="3.5" fill="#F472B6">
            <animateMotion
              path="M 530 170 C 560 170, 560 245, 600 245"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Nodos Arquitectónicos Renderizados */}
          {NODOS_ARQUITECTURA.map((n) => {
            const isDimmed = selectedLayer !== 'all' && n.layer !== selectedLayer;
            const isTarget = n.id === activeNodeId;

            return (
              <g
                key={n.id}
                onClick={() => setActiveNodeId(n.id)}
                className="cursor-pointer transition-opacity duration-300"
                opacity={isDimmed ? 0.35 : 1}
              >
                {/* Rectángulo del Nodo */}
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.width}
                  height={n.height}
                  rx="14"
                  fill={`url(#grad-${n.id.replace('node-', '')})`}
                  stroke={isTarget ? '#FFFFFF' : n.color}
                  strokeWidth={isTarget ? 2.5 : 1.5}
                  filter={isTarget ? 'url(#glow-teal)' : undefined}
                />

                {/* Badge Superior */}
                <rect
                  x={n.x + 12}
                  y={n.y + 10}
                  width={n.width - 24}
                  height="16"
                  rx="6"
                  fill="rgba(0,0,0,0.4)"
                />
                <text
                  x={n.x + 18}
                  y={n.y + 22}
                  fill={n.color}
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {n.badge}
                </text>

                {/* Título */}
                <text
                  x={n.x + 14}
                  y={n.y + 44}
                  fill="#FFFFFF"
                  fontSize="12.5"
                  fontWeight="bold"
                  fontFamily="Sora, sans-serif"
                >
                  {n.label}
                </text>

                {/* Subtítulo Técnico */}
                <text
                  x={n.x + 14}
                  y={n.y + 64}
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontWeight="500"
                  fontFamily="Manrope, sans-serif"
                >
                  {n.sublabel.slice(0, 34)}…
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tarjeta de Detalle del Nodo Seleccionado */}
      {selectedNode && (
        <div className="p-3.5 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: selectedNode.color }}
            />
            <div>
              <span className="font-extrabold text-dental-deep-navy text-sm block">
                {selectedNode.label}
              </span>
              <span className="text-secondary text-[11px]">{selectedNode.sublabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-xl bg-white border border-border-subtle font-mono text-[11px] font-bold text-dental-deep-navy shadow-2xs">
              {selectedNode.badge}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
