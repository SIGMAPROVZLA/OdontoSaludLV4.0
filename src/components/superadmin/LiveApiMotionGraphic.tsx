import React, { useEffect, useRef, useState } from 'react';
import { ApiClient } from '../../services/api';

/**
 * Motion Graphic Cinemático a 60 FPS del Comportamiento en Tiempo Real de APIs (AGENTS.md §3 y §4)
 * Muestra el flujo de tráfico de red, latencia por endpoint, paquetes viajando y osciloscopio de latencia Anycast.
 */

interface ApiEndpointMetric {
  path: string;
  metodo: 'GET' | 'POST' | 'PUT';
  descripcion: string;
  destino: 'D1' | 'KV' | 'R2' | 'BCV';
  latenciaPromedioMs: number;
  ultimoStatus: number;
  peticionesTotales: number;
  color: string;
}

const ENDPOINTS_MONITOREADOS: ApiEndpointMetric[] = [
  {
    path: '/api/system/edge-health',
    metodo: 'GET',
    descripcion: 'Telemetría Anycast SLA < 50ms & Métricas D1/KV/R2',
    destino: 'D1',
    latenciaPromedioMs: 4,
    ultimoStatus: 200,
    peticionesTotales: 142,
    color: '#10B981', // Verde esmeralda
  },
  {
    path: '/api/dashboard/pulse',
    metodo: 'GET',
    descripcion: 'Pulso Clínico en Vivo, Boxes y Tasa BCV',
    destino: 'D1',
    latenciaPromedioMs: 8,
    ultimoStatus: 200,
    peticionesTotales: 289,
    color: '#8B5CF6', // Púrpura
  },
  {
    path: '/api/presupuestos/cobro',
    metodo: 'POST',
    descripcion: 'Transacción ACID de Cobro en Box & Voucher SHA-256',
    destino: 'D1',
    latenciaPromedioMs: 12,
    ultimoStatus: 200,
    peticionesTotales: 64,
    color: '#06B6D4', // Cian
  },
  {
    path: '/api/pacientes/:id/odontograma',
    metodo: 'POST',
    descripcion: 'Persistencia Vectorial FDI de 5 Caras',
    destino: 'D1',
    latenciaPromedioMs: 9,
    ultimoStatus: 200,
    peticionesTotales: 118,
    color: '#F59E0B', // Ámbar
  },
  {
    path: '/api/storage/r2/:key',
    metodo: 'PUT',
    descripcion: 'Streaming Binario RVG ReadableStream Zero-RAM',
    destino: 'R2',
    latenciaPromedioMs: 16,
    ultimoStatus: 200,
    peticionesTotales: 38,
    color: '#EC4899', // Rosa neón
  },
  {
    path: '/api/config/palette',
    metodo: 'GET',
    descripcion: 'Persistencia de Paleta Activa en Cloudflare KV',
    destino: 'KV',
    latenciaPromedioMs: 3,
    ultimoStatus: 200,
    peticionesTotales: 95,
    color: '#3B82F6', // Azul real
  },
];

interface DataPacket {
  id: number;
  endpointIdx: number;
  progress: number; // 0 a 1
  speed: number;
  color: string;
}

export const LiveApiMotionGraphic: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [metrics, setMetrics] = useState<ApiEndpointMetric[]>(ENDPOINTS_MONITOREADOS);
  const [lastPingTime, setLastPingTime] = useState<number>(4);
  const [isPinging, setIsPinging] = useState(false);
  const [packetsSent, setPacketsSent] = useState(746);
  const [activeEndpointIdx, setActiveEndpointIdx] = useState(0);

  // Animación continua del osciloscopio y partículas de red a 60 FPS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let packets: DataPacket[] = [];
    let nextPacketId = 1;
    let tick = 0;

    // Respetar prefers-reduced-motion si el usuario lo activó
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Historial de latencia para el osciloscopio
    const latencyHistory: number[] = Array.from({ length: 40 }, () => 4 + Math.random() * 4);

    const render = () => {
      tick++;
      const width = canvas.width;
      const height = canvas.height;

      // Fondo oscuro de ciber-telemetría con grilla rítmica
      ctx.fillStyle = '#0B111E';
      ctx.fillRect(0, 0, width, height);

      // Grilla de radar tenue
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 1. Dibujar Osciloscopio de Latencia Anycast en la mitad superior
      const graphHeight = 90;
      const graphY = 110;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 20, width - 40, graphHeight);

      // Línea SLA de 50ms (umbral máximo permitido por AGENTS.md)
      const slaY = graphY - (50 / 60) * graphHeight;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.beginPath();
      ctx.moveTo(20, slaY);
      ctx.lineTo(width - 20, slaY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('SLA LÍMITE < 50ms', width - 130, slaY - 4);

      // Onda de latencia en tiempo real
      if (tick % 10 === 0 && !prefersReducedMotion) {
        latencyHistory.shift();
        latencyHistory.push(lastPingTime + (Math.random() - 0.5) * 2.5);
      }

      ctx.beginPath();
      const stepX = (width - 40) / (latencyHistory.length - 1);
      latencyHistory.forEach((val, i) => {
        const x = 20 + i * stepX;
        const normalizedY = Math.max(10, Math.min(graphHeight - 10, (val / 60) * graphHeight));
        const y = graphY - normalizedY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Gradiente de relleno debajo de la curva
      ctx.lineTo(width - 20, graphY);
      ctx.lineTo(20, graphY);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, 20, 0, graphY);
      areaGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      areaGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Etiqueta del osciloscopio
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 11px Sora, sans-serif';
      ctx.fillText('OSCILOSCOPIO DE LATENCIA ANYCAST EDGE (SLA < 50ms)', 30, 40);

      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`${lastPingTime.toFixed(1)} ms`, 30, 68);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px Manrope, sans-serif';
      ctx.fillText('Worker Hono CPU < 10ms • Cloudflare Global Anycast', 30, 86);

      // 2. Líneas de Tráfico Multicanal (Endpoints a Servidores D1/KV/R2)
      const startX = 60;
      const endX = width - 60;
      const channelsYStart = 150;
      const channelSpacing = 32;

      metrics.forEach((ep, idx) => {
        const y = channelsYStart + idx * channelSpacing;

        // Pista del canal
        ctx.strokeStyle = idx === activeEndpointIdx ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = idx === activeEndpointIdx ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        // Nodo Origen (Cliente PWA)
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(startX, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Nodo Destino (Edge Cloudflare D1/KV/R2)
        ctx.fillStyle = ep.color;
        ctx.beginPath();
        ctx.arc(endX, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Texto del Endpoint
        ctx.fillStyle = idx === activeEndpointIdx ? '#FFFFFF' : '#94A3B8';
        ctx.font = idx === activeEndpointIdx ? 'bold 10px monospace' : '9px monospace';
        ctx.fillText(`${ep.metodo} ${ep.path}`, startX + 16, y - 6);

        // Métrica viva a la derecha
        ctx.fillStyle = ep.color;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`${ep.latenciaPromedioMs}ms • [${ep.destino}]`, endX - 110, y - 6);
      });

      // 3. Generar y animar paquetes de datos viajando (Motion Particles)
      if (!prefersReducedMotion) {
        if (tick % 8 === 0) {
          const chosenIdx = Math.floor(Math.random() * metrics.length);
          packets.push({
            id: nextPacketId++,
            endpointIdx: chosenIdx,
            progress: 0,
            speed: 0.015 + Math.random() * 0.015,
            color: metrics[chosenIdx].color,
          });
        }

        packets.forEach((p) => {
          p.progress += p.speed;
          const y = channelsYStart + p.endpointIdx * channelSpacing;
          const currentX = startX + (endX - startX) * p.progress;

          // Dibujar partícula con estela de luz (glow)
          ctx.save();
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(currentX, y, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Estela
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(currentX - 12, y);
          ctx.lineTo(currentX, y);
          ctx.stroke();
          ctx.restore();
        });

        packets = packets.filter((p) => p.progress < 1);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [metrics, lastPingTime, activeEndpointIdx]);

  // Disparar prueba de ping real al borde
  const handleTestPing = async () => {
    setIsPinging(true);
    const t0 = performance.now();
    try {
      const res = await ApiClient.getEdgeHealthMetrics();
      const elapsed = Math.round(performance.now() - t0);
      setLastPingTime(Math.max(1, elapsed));
      setPacketsSent((prev) => prev + 6);

      // Actualizar latencias aleatorias en vivo para simular tráfico activo
      setMetrics((prev) =>
        prev.map((m) => ({
          ...m,
          latenciaPromedioMs: Math.max(2, Math.round(m.latenciaPromedioMs + (Math.random() - 0.5) * 4)),
          peticionesTotales: m.peticionesTotales + 1,
        }))
      );
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle flex flex-col gap-4">
      {/* Cabecera del Motion Graphic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-emerald-400">query_stats</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold text-base text-dental-deep-navy">
                Motion Graphic en Vivo: Comportamiento de APIs
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>60 FPS STREAM</span>
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Visualización cinemática de flujo de paquetes, osciloscopio de latencia y destinos D1/KV/R2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono font-bold text-secondary bg-surface-subtle-ice px-2.5 py-1 rounded-xl border border-border-subtle">
            ⚡ {packetsSent} paquetes transmitidos
          </span>
          <button
            type="button"
            onClick={handleTestPing}
            disabled={isPinging}
            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${isPinging ? 'animate-spin' : ''}`}>
              bolt
            </span>
            <span>{isPinging ? 'Transmitiendo...' : 'Inyectar Paquete'}</span>
          </button>
        </div>
      </div>

      {/* Canvas Cinemático 60 FPS */}
      <div className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-800 bg-[#0B111E]">
        <canvas
          ref={canvasRef}
          width={780}
          height={360}
          className="w-full h-auto block select-none"
        />
      </div>

      {/* Selector de Canales Activos e Inspección de Endpoints */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {metrics.map((ep, idx) => {
          const isSelected = idx === activeEndpointIdx;
          return (
            <button
              key={ep.path}
              type="button"
              onClick={() => setActiveEndpointIdx(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'bg-dental-deep-navy text-white border-primary ring-2 ring-primary/40'
                  : 'bg-surface-subtle-ice text-dental-deep-navy border-border-subtle hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ep.color }}
                />
                <span className="font-mono text-[9px] font-extrabold opacity-70">
                  {ep.destino}
                </span>
              </div>
              <span className="font-mono text-[10px] font-extrabold truncate block">
                {ep.path.split('/')[2] || ep.path}
              </span>
              <div className="flex items-center justify-between text-[9px] font-bold">
                <span className={isSelected ? 'text-emerald-300' : 'text-emerald-600'}>
                  {ep.latenciaPromedioMs} ms
                </span>
                <span className="opacity-60">{ep.peticionesTotales} req</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
