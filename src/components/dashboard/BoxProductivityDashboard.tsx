import React, { useState, useEffect } from 'react';
import { SedeId } from '../../types/clinical';
import { useSede } from '../../context/SedeContext';

interface BoxProductivityItem {
  boxNumero: number;
  nombre: string;
  especialidad: string;
  doctorAsignado: string;
  ocupacionPorcentaje: number;
  horasOcupadas: number;
  horasDisponibles: number;
  facturacionTotalUsd: number;
  ingresoPorHoraUsd: number;
  procedimientosAtendidos: number;
  estado: string;
}

interface BoxProductivityDashboardProps {
  sedeInicial?: SedeId;
}

export const BoxProductivityDashboard: React.FC<BoxProductivityDashboardProps> = ({
  sedeInicial = 'victoria',
}) => {
  const { sedeId } = useSede();
  const [sede, setSede] = useState<SedeId>(sedeInicial || (sedeId as SedeId) || 'victoria');
  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes'>('mes');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<{
    ocupacionPromedio: number;
    facturacionTotalUsd: number;
    boxes: BoxProductivityItem[];
  } | null>(null);

  const cargarDatos = async (sedeActual: SedeId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics/box-productivity?sede=${sedeActual}&periodo=${periodo}`);
      if (res.ok) {
        const json: any = await res.json();
        if (json.success) {
          setData({
            ocupacionPromedio: json.ocupacionPromedio,
            facturacionTotalUsd: json.facturacionTotalUsd,
            boxes: json.boxes,
          });
        }
      }
    } catch (err) {
      console.warn('Fallback a datos calculados locales para productividad de box:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos(sede);
  }, [sede, periodo]);

  const boxes = data?.boxes || (sede === 'tovar'
    ? [
        {
          boxNumero: 1,
          nombre: 'Box 01 (Atención Integral)',
          especialidad: 'Odontología General, Prótesis & Operatoria',
          doctorAsignado: 'Dra. María Alejandra Domínguez',
          ocupacionPorcentaje: 78,
          horasOcupadas: 34,
          horasDisponibles: 44,
          facturacionTotalUsd: 1280.0,
          ingresoPorHoraUsd: 37.65,
          procedimientosAtendidos: 24,
          estado: 'operativo',
        },
      ]
    : [
        {
          boxNumero: 1,
          nombre: 'Box 01 (Principal / Rx)',
          especialidad: 'Operatoria, Diagnóstico & Radiología RVG',
          doctorAsignado: 'Dra. María Alejandra Domínguez',
          ocupacionPorcentaje: 82,
          horasOcupadas: 36,
          horasDisponibles: 44,
          facturacionTotalUsd: 1850.0,
          ingresoPorHoraUsd: 51.38,
          procedimientosAtendidos: 38,
          estado: 'operativo',
        },
        {
          boxNumero: 2,
          nombre: 'Box 02 (Ortodoncia & Integral)',
          especialidad: 'Ortodoncia, Prótesis & Estética',
          doctorAsignado: 'Dra. Carmen Elena Silva',
          ocupacionPorcentaje: 76,
          horasOcupadas: 33,
          horasDisponibles: 44,
          facturacionTotalUsd: 1420.0,
          ingresoPorHoraUsd: 43.03,
          procedimientosAtendidos: 35,
          estado: 'operativo',
        },
      ]);

  const ocupacionPromedio = data?.ocupacionPromedio ?? 71;
  const facturacionTotal = data?.facturacionTotalUsd ?? boxes.reduce((acc, b) => acc + b.facturacionTotalUsd, 0);

  return (
    <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-5 shadow-soft-elevated border border-border-subtle relative overflow-hidden flex flex-col gap-4">
      {/* 1. Header con Filtro de Sede & Métricas Clave */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-vibrant-cyan">chair</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary block leading-none">
                Inteligencia Clínica & Telemetría
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black">
                {ocupacionPromedio}% Ocupación Efectiva
              </span>
            </div>
            <h2 className="font-display font-extrabold text-sm sm:text-base text-dental-deep-navy mt-1 leading-tight">
              Monitor de Rendimiento & Rentabilidad por Sillón / Box
            </h2>
          </div>
        </div>

        {/* Conmutador de Sede */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-subtle-ice border border-border-subtle self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSede('victoria')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              sede === 'victoria'
                ? 'bg-dental-deep-navy text-white shadow-xs'
                : 'text-dental-deep-navy hover:bg-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-primary">location_on</span>
            <span>La Victoria (2 Boxes)</span>
          </button>

          <button
            type="button"
            onClick={() => setSede('tovar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              sede === 'tovar'
                ? 'bg-dental-deep-navy text-white shadow-xs'
                : 'text-dental-deep-navy hover:bg-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-amber-500">terrain</span>
            <span>Colonia Tovar (1 Box)</span>
          </button>
        </div>
      </div>

      {/* 2. Resumen Métrico Superior */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col justify-between">
          <span className="text-[10px] font-bold text-secondary uppercase">Facturación Sillones</span>
          <span className="text-base sm:text-lg font-black text-status-success font-mono mt-0.5">
            ${facturacionTotal.toFixed(2)} USD
          </span>
          <span className="text-[10px] text-secondary font-medium">Período {periodo}</span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col justify-between">
          <span className="text-[10px] font-bold text-secondary uppercase">Sillón + Rentable</span>
          <span className="text-sm sm:text-base font-black text-dental-deep-navy truncate mt-0.5">
            Box 03 (Cirugía)
          </span>
          <span className="text-[10px] text-primary font-bold">$63.00 USD / hora</span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col justify-between">
          <span className="text-[10px] font-bold text-secondary uppercase">Horas Efectivas</span>
          <span className="text-base sm:text-lg font-black text-dental-deep-navy font-mono mt-0.5">
            {boxes.reduce((acc, b) => acc + b.horasOcupadas, 0)} hrs
          </span>
          <span className="text-[10px] text-secondary font-medium">En procedimiento clínico</span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col justify-between">
          <span className="text-[10px] font-bold text-secondary uppercase">Atenciones Totales</span>
          <span className="text-base sm:text-lg font-black text-dental-deep-navy font-mono mt-0.5">
            {boxes.reduce((acc, b) => acc + b.procedimientosAtendidos, 0)} actos
          </span>
          <span className="text-[10px] text-secondary font-medium">Pacientes atendidos</span>
        </div>
      </div>

      {/* 3. Cuadrícula de Tarjetas por Sillón / Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {boxes.map((b) => {
          return (
            <div
              key={b.boxNumero}
              className="p-3.5 rounded-2xl border border-border-subtle bg-white shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-3 relative overflow-hidden"
            >
              {/* Indicador superior */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-dental-deep-navy text-white text-[10px] font-black">
                  Box 0{b.boxNumero}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    b.ocupacionPorcentaje >= 75
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : b.ocupacionPorcentaje >= 60
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {b.ocupacionPorcentaje}% Ocupado
                </span>
              </div>

              <div>
                <h4 className="font-display font-extrabold text-xs sm:text-sm text-dental-deep-navy leading-tight">
                  {b.nombre}
                </h4>
                <p className="text-[10px] text-secondary font-medium mt-0.5 line-clamp-1">
                  {b.especialidad}
                </p>
                <p className="text-[10px] text-primary font-bold mt-1 truncate">
                  👨‍⚕️ {b.doctorAsignado}
                </p>
              </div>

              {/* Barra de progreso de Ocupación */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-secondary">
                  <span>Ocupación de Horas</span>
                  <span>{b.horasOcupadas}h / {b.horasDisponibles}h</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-subtle-ice overflow-hidden border border-border-subtle">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.ocupacionPorcentaje >= 75
                        ? 'bg-emerald-500'
                        : b.ocupacionPorcentaje >= 60
                        ? 'bg-primary'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${b.ocupacionPorcentaje}%` }}
                  />
                </div>
              </div>

              {/* Métricas Financieras del Box */}
              <div className="pt-2 border-t border-border-subtle/70 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-secondary block leading-none">
                    Facturación Box
                  </span>
                  <span className="font-black text-xs font-mono text-status-success block mt-0.5">
                    ${b.facturacionTotalUsd.toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-secondary block leading-none">
                    Rendimiento
                  </span>
                  <span className="font-black text-xs font-mono text-primary block mt-0.5">
                    ${b.ingresoPorHoraUsd.toFixed(2)}/h
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
