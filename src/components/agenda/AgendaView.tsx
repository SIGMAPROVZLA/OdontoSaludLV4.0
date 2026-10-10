import React, { useState } from 'react';
import { useSede } from '../../context/SedeContext';
import { Cita } from '../../types/clinical';

export const AgendaView: React.FC = () => {
  const { sedeActiva } = useSede();
  const [selectedBox, setSelectedBox] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState('23');

  const days = [
    { dia: 'LUN', num: '21', dots: 1 },
    { dia: 'MAR', num: '22', dots: 2 },
    { dia: 'MIÉ', num: '23', dots: 3, isActive: true },
    { dia: 'JUE', num: '24', dots: 2 },
    { dia: 'VIE', num: '25', dots: 1 },
    { dia: 'SÁB', num: '26', dots: 0 },
  ];

  const citasMock: Cita[] = [
    {
      id: 'ag-1',
      sedeId: sedeActiva.id,
      pacienteId: 'p-1',
      pacienteNombre: 'Roberto Gil',
      pacienteCedula: 'V-15.340.119',
      pacienteTelefono: '+58 412-5551234',
      doctorNombre: 'Dra. María Alejandra Domínguez',
      boxNumero: 1,
      fechaCita: '2024-10-23',
      horaInicio: '08:30 AM',
      motivo: 'Limpieza & Profilaxis Completa',
      estado: 'completada',
      esUrgencia: false,
    },
    {
      id: 'ag-2',
      sedeId: sedeActiva.id,
      pacienteId: 'p-2',
      pacienteNombre: 'Patricia Velásquez',
      pacienteCedula: 'V-19.845.221',
      pacienteTelefono: '+58 414-5550921',
      doctorNombre: 'Dra. María Alejandra Domínguez',
      boxNumero: 1,
      fechaCita: '2024-10-23',
      horaInicio: '09:15 AM',
      motivo: 'Evaluación Inicial Integral & RX',
      estado: 'en_sillon',
      esUrgencia: false,
      pacienteAvatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBRXYjfamoV_aUlqbIMEBKdsh9YFwgLzf-ru3PEihAYV_t5uDcmgyKw0xaNI4cX0N9OIrm7cfsmc3I3eWGwk1X3wg7wI52y07yE8X6gcki6RxC4IUklN3m3q-OvCWvgExmJ0bOkYXebx171YsKVtRvPSjYftSSqjWrK8I9FUl45_u9xLFuPZY25UFTo10_yogGiIa1wpwpxgJViiDysivsjySS8Ip_G-ji_jyz-VZ0',
    },
    {
      id: 'ag-3',
      sedeId: sedeActiva.id,
      pacienteId: 'p-3',
      pacienteNombre: 'Sofía Rivas',
      pacienteCedula: 'V-26.901.442',
      pacienteTelefono: '+58 424-3338899',
      doctorNombre: 'Dra. Valentina Páez',
      boxNumero: 2,
      fechaCita: '2024-10-23',
      horaInicio: '10:30 AM',
      motivo: 'Ortodoncia: Control Mensual #4',
      estado: 'confirmada',
      esUrgencia: false,
    },
    {
      id: 'ag-4',
      sedeId: sedeActiva.id,
      pacienteId: 'p-4',
      pacienteNombre: 'Carlos Morales',
      pacienteCedula: 'V-18.776.321',
      pacienteTelefono: '+58 412-7771122',
      doctorNombre: 'Dr. Silva',
      boxNumero: 3,
      fechaCita: '2024-10-23',
      horaInicio: '11:45 AM',
      motivo: 'Exodoncia Simple Molar #38',
      estado: 'pendiente',
      esUrgencia: true,
    },
  ];

  const filteredCitas = citasMock.filter((c) => {
    if (selectedBox === 'all') return true;
    if (selectedBox === 'box1') return c.boxNumero === 1;
    if (selectedBox === 'box2') return c.boxNumero === 2;
    if (selectedBox === 'box3') return c.boxNumero === 3;
    return true;
  });

  return (
    <div className="flex flex-col gap-3.5 pb-28">
      {/* Estado y Pulso Rápido */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-status-success animate-ping" />
          <span className="text-[11px] font-bold text-dental-deep-navy tracking-wider uppercase">
            Jornada Clínica Activa
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold">
          <span className="material-symbols-outlined text-[14px]">chair</span>
          <span>3/4 Sillones Ocupados</span>
        </div>
      </div>

      {/* Carrusel Semanal de Días */}
      <div className="bg-surface-clean-white rounded-2xl p-3.5 shadow-sm border border-border-subtle flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display font-bold text-base text-dental-deep-navy">
              Octubre 2024
            </h3>
            <span className="text-xs text-secondary">• {sedeActiva.nombre}</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDay('23')}
            className="text-xs text-electric-blue font-bold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">today</span>
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {days.map((d) => {
            const isSelected = selectedDay === d.num;
            return (
              <button
                key={d.num}
                type="button"
                onClick={() => setSelectedDay(d.num)}
                className={`shrink-0 w-12 py-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-electric-blue text-surface-clean-white shadow-md scale-105'
                    : 'bg-surface-subtle-ice border border-border-subtle text-secondary'
                }`}
              >
                <span className="text-[10px] uppercase font-bold">{d.dia}</span>
                <span className="text-base font-bold mt-0.5">{d.num}</span>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: d.dots }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-surface-clean-white' : 'bg-status-success'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros Horizontales por Box */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedBox('all')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            selectedBox === 'all'
              ? 'bg-dental-deep-navy text-surface-clean-white shadow-sm'
              : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy'
          }`}
        >
          Todos ({citasMock.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedBox('box1')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            selectedBox === 'box1'
              ? 'bg-primary text-surface-clean-white shadow-sm'
              : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-vibrant-cyan" />
          Box 1 (Dra. Domínguez)
        </button>

        <button
          type="button"
          onClick={() => setSelectedBox('box2')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            selectedBox === 'box2'
              ? 'bg-primary text-surface-clean-white shadow-sm'
              : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-status-success" />
          Box 2 (Ortodoncia)
        </button>

        <button
          type="button"
          onClick={() => setSelectedBox('box3')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
            selectedBox === 'box3'
              ? 'bg-primary text-surface-clean-white shadow-sm'
              : 'bg-surface-clean-white border border-border-subtle text-dental-deep-navy'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-status-warning" />
          Box 3 (Cirugía)
        </button>
      </div>

      {/* Timeline Stream de Citas del Día */}
      <div className="flex flex-col gap-3">
        {filteredCitas.map((cita) => {
          const isEnSillon = cita.estado === 'en_sillon';
          const isCompletada = cita.estado === 'completada';

          return (
            <div
              key={cita.id}
              className={`rounded-2xl bg-surface-clean-white p-4 shadow-sm border border-border-subtle relative overflow-hidden transition-all ${
                isEnSillon ? 'ring-2 ring-electric-blue/40 scale-[1.01]' : ''
              }`}
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isEnSillon
                    ? 'bg-electric-blue'
                    : isCompletada
                    ? 'bg-status-success'
                    : cita.esUrgencia
                    ? 'bg-status-danger'
                    : 'bg-vibrant-cyan'
                }`}
              />

              <div className="pl-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {cita.pacienteAvatar ? (
                      <img
                        src={cita.pacienteAvatar}
                        alt={cita.pacienteNombre}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-xs text-secondary shrink-0">
                        {cita.pacienteNombre.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-dental-deep-navy truncate">
                          {cita.pacienteNombre}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs text-secondary font-semibold">
                          Box {cita.boxNumero}
                        </span>
                        {cita.esUrgencia && (
                          <span className="px-1.5 py-0.2 rounded-full bg-status-danger/10 text-status-danger text-[10px] font-bold">
                            Urgencia
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary truncate mt-0.5">{cita.motivo}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-xs text-dental-deep-navy">
                      {cita.horaInicio}
                    </span>
                    <div
                      className={`flex items-center justify-end gap-1 mt-0.5 text-xs font-bold ${
                        isEnSillon
                          ? 'text-electric-blue'
                          : isCompletada
                          ? 'text-status-success'
                          : 'text-secondary'
                      }`}
                    >
                      {isEnSillon ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-electric-blue animate-ping" />
                          <span>En Atención</span>
                        </>
                      ) : isCompletada ? (
                        <>
                          <span className="material-symbols-outlined text-[14px]">
                            check_circle
                          </span>
                          <span>Completada</span>
                        </>
                      ) : (
                        <span>{cita.estado}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 flex items-center justify-between bg-surface-subtle-ice rounded-xl px-3 py-2 border border-border-subtle text-xs">
                  <span className="text-secondary">{cita.doctorNombre}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `https://wa.me/${cita.pacienteTelefono.replace(/[^0-9]/g, '')}`,
                          '_blank'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-surface-clean-white border border-border-subtle text-status-success font-bold flex items-center gap-1 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[14px]">chat</span>
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `tel:${cita.pacienteTelefono.replace(/[^0-9]/g, '')}`,
                          '_self'
                        )
                      }
                      className="w-8 h-8 rounded-lg bg-surface-clean-white border border-border-subtle text-primary flex items-center justify-center active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
