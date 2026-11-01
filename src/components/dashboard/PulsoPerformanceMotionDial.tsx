import React from 'react';
import { useSede } from '../../context/SedeContext';

interface OdontologaRankingItem {
  rank: number;
  nombreCorto: string;
  nombreCompleto: string;
  especialidad: string;
  pacientes: number;
  meta: number;
  barClass: string;
  badgeClass: string;
}

interface PulsoPerformanceMotionDialProps {
  tasaBcv?: number;
  onOpenPerformance?: () => void;
}

export const PulsoPerformanceMotionDial: React.FC<PulsoPerformanceMotionDialProps> = ({
  onOpenPerformance,
}) => {
  const { sedeActiva } = useSede();

  // Ranking ordenado de mayor a menor número de pacientes atendidos
  const rankingOdontologos: OdontologaRankingItem[] = [
    {
      rank: 1,
      nombreCorto: 'Dra. Domínguez',
      nombreCompleto: 'Dra. María Alejandra Domínguez',
      especialidad: 'General & Estética',
      pacientes: 7,
      meta: 8,
      barClass: 'from-primary to-dental-deep-navy',
      badgeClass: 'bg-amber-400/25 text-amber-900 border-amber-400/60',
    },
    {
      rank: 2,
      nombreCorto: 'Dra. Silva',
      nombreCompleto: 'Dra. Carmen Elena Silva',
      especialidad: 'Ortodoncia',
      pacientes: 5,
      meta: 5,
      barClass: 'from-sky-500 to-sky-700',
      badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    },
    {
      rank: 3,
      nombreCorto: 'Dra. Morales',
      nombreCompleto: 'Dra. Andrea Morales',
      especialidad: 'Periodoncia & Prótesis',
      pacientes: 5,
      meta: 5,
      barClass: 'from-emerald-500 to-emerald-700',
      badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    },
    {
      rank: 4,
      nombreCorto: 'Dra. Hernández',
      nombreCompleto: 'Dra. Valeria Hernández',
      especialidad: 'Endodoncia',
      pacientes: 3,
      meta: 3,
      barClass: 'from-secondary to-primary',
      badgeClass: 'bg-surface-container text-dental-deep-navy border-border-subtle',
    },
  ];

  const maxPacientes = Math.max(...rankingOdontologos.map((o) => o.pacientes), 1);
  const totalPacientes = rankingOdontologos.reduce((acc, o) => acc + o.pacientes, 0);

  return (
    <div
      onClick={onOpenPerformance}
      className="bg-surface-clean-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-border-subtle hover:border-primary/50 transition-all cursor-pointer group"
      title="Toca para ir al desglose de Rendimiento Clínico & Honorarios"
    >
      {/* Cabecera Compacta del Ranking */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-border-subtle/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-surface-container-low text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[17px]">leaderboard</span>
          </span>
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-xs sm:text-sm text-dental-deep-navy truncate leading-tight">
              Ranking de Pacientes por Odontólogo
            </h3>
            <span className="text-[10px] text-secondary font-medium block truncate">
              {sedeActiva.nombre} • Atención acumulada del día
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-surface-subtle-ice border border-border-subtle text-[10px] font-black text-dental-deep-navy">
            {totalPacientes} pac. totales
          </span>
          <span className="material-symbols-outlined text-[15px] text-secondary group-hover:text-primary group-hover:translate-x-0.5 transition-all">
            arrow_downward
          </span>
        </div>
      </div>

      {/* Gráfico Sencillo y Compacto de Barras Horizontales (2 columnas en desktop, 1 en móvil) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {rankingOdontologos.map((item) => {
          const widthPct = Math.round((item.pacientes / maxPacientes) * 100);
          const sharePct = Math.round((item.pacientes / totalPacientes) * 100);

          return (
            <div
              key={item.nombreCorto}
              className="flex items-center gap-2.5 py-1 px-2 rounded-xl bg-surface-subtle-ice/60 hover:bg-surface-container/40 border border-border-subtle/40 transition-colors"
            >
              {/* Posición en el Ranking */}
              <span
                className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 border ${item.badgeClass}`}
              >
                {item.rank}°
              </span>

              {/* Nombre + Barra Visual Compacta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-xs text-dental-deep-navy truncate">
                      {item.nombreCorto}
                    </span>
                    <span className="text-[10px] text-secondary hidden md:inline truncate">
                      • {item.especialidad}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-display font-black text-xs text-dental-deep-navy">
                      {item.pacientes} pac.
                    </span>
                    <span className="text-[9px] font-bold text-secondary">
                      ({sharePct}%)
                    </span>
                  </div>
                </div>

                {/* Barra de Ranking Proporcional */}
                <div className="w-full h-2 rounded-full bg-white border border-border-subtle/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.barClass} transition-all duration-500`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
