import React, { useState, useMemo } from 'react';
import { SedeId } from '../../types/clinical';
import { DeterministicIdenticon } from '../../utils/identicon';
import { useOdontologos } from '../../hooks/useOdontologos';

export type FiltroSedeRendimiento = 'todas' | 'victoria' | 'tovar';
export type FiltroPeriodoRendimiento = 'dia' | 'semana' | 'mes';
export type FiltroTurnoRendimiento = 'todos' | 'manana' | 'tarde';

interface OdontologaRendimientoItem {
  id: string;
  nombres: string;
  especialidad: string;
  cov: string;
  cedula: string;
  sedeHabitual: string;
  sedesValidas: SedeId[];
  porcentajeHonorario: number;
  fotoUrl?: string;
  guardiaTurno: 'manana' | 'tarde' | 'ambos';
  metricasBase: {
    dia: {
      manana: { pacientes: number; totalCitas: number; procedimientos: string[]; recaudadoUsd: number; metaUsd: number; satisfaccion: number };
      tarde: { pacientes: number; totalCitas: number; procedimientos: string[]; recaudadoUsd: number; metaUsd: number; satisfaccion: number };
    };
    semana: {
      pacientes: number;
      totalCitas: number;
      procedimientos: string[];
      recaudadoUsd: number;
      metaUsd: number;
      satisfaccion: number;
    };
    mes: {
      pacientes: number;
      totalCitas: number;
      procedimientos: string[];
      recaudadoUsd: number;
      metaUsd: number;
      satisfaccion: number;
    };
  };
}

const ODONTOLOGAS_BASE: OdontologaRendimientoItem[] = [
  {
    id: 'odo-1',
    nombres: 'Dra. María Alejandra Domínguez',
    especialidad: 'Directora Clínica • Odontología General & Estética',
    cov: 'C.O.V. 24.891',
    cedula: 'V-16.482.910',
    sedeHabitual: 'Sede La Victoria (Box 01)',
    sedesValidas: ['victoria', 'tovar'],
    porcentajeHonorario: 40,
    fotoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
    guardiaTurno: 'ambos',
    metricasBase: {
      dia: {
        manana: {
          pacientes: 4,
          totalCitas: 4,
          procedimientos: ['2 Resinas Fotocuradas', '1 Limpieza Ultrasónica', '1 Evaluación'],
          recaudadoUsd: 220,
          metaUsd: 250,
          satisfaccion: 98,
        },
        tarde: {
          pacientes: 3,
          totalCitas: 4,
          procedimientos: ['1 Resina Directa', '1 Blanqueamiento LED'],
          recaudadoUsd: 180,
          metaUsd: 200,
          satisfaccion: 99,
        },
      },
      semana: {
        pacientes: 34,
        totalCitas: 36,
        procedimientos: ['16 Resinas', '8 Profilaxis', '4 Blanqueamientos', '6 Evaluaciones'],
        recaudadoUsd: 2150,
        metaUsd: 2400,
        satisfaccion: 98.5,
      },
      mes: {
        pacientes: 142,
        totalCitas: 148,
        procedimientos: ['68 Resinas', '32 Profilaxis', '18 Blanqueamientos', '24 Fichas Integrales'],
        recaudadoUsd: 8900,
        metaUsd: 9500,
        satisfaccion: 99,
      },
    },
  },
  {
    id: 'odo-2',
    nombres: 'Dra. Carmen Elena Silva',
    especialidad: 'Ortodoncia & Ortopedia Maxilofacial',
    cov: 'C.O.V. 19.450',
    cedula: 'V-18.329.110',
    sedeHabitual: 'Sede La Victoria (Box 02)',
    sedesValidas: ['victoria'],
    porcentajeHonorario: 45,
    guardiaTurno: 'manana',
    metricasBase: {
      dia: {
        manana: {
          pacientes: 5,
          totalCitas: 5,
          procedimientos: ['3 Control Ortodoncia', '1 Instalación Arcos', '1 Cambio Brackets'],
          recaudadoUsd: 260,
          metaUsd: 250,
          satisfaccion: 97,
        },
        tarde: {
          pacientes: 0,
          totalCitas: 0,
          procedimientos: ['Sin guardia de tarde'],
          recaudadoUsd: 0,
          metaUsd: 100,
          satisfaccion: 95,
        },
      },
      semana: {
        pacientes: 28,
        totalCitas: 30,
        procedimientos: ['18 Controles Brackets', '6 Alineadores Invisibles', '4 Cementaciones'],
        recaudadoUsd: 1980,
        metaUsd: 2100,
        satisfaccion: 97.8,
      },
      mes: {
        pacientes: 118,
        totalCitas: 124,
        procedimientos: ['74 Controles Ortodoncia', '22 Retenedores', '16 Nuevas Instalaciones'],
        recaudadoUsd: 7850,
        metaUsd: 8200,
        satisfaccion: 98,
      },
    },
  },
  {
    id: 'odo-3',
    nombres: 'Dra. Valeria Hernández',
    especialidad: 'Endodoncia Avanzada & Microcirugía Apical',
    cov: 'C.O.V. 22.108',
    cedula: 'V-21.054.672',
    sedeHabitual: 'Ambas Sedes (Rotación Quirúrgica)',
    sedesValidas: ['victoria', 'tovar'],
    porcentajeHonorario: 45,
    guardiaTurno: 'tarde',
    metricasBase: {
      dia: {
        manana: {
          pacientes: 0,
          totalCitas: 0,
          procedimientos: ['Sin guardia de mañana'],
          recaudadoUsd: 0,
          metaUsd: 150,
          satisfaccion: 95,
        },
        tarde: {
          pacientes: 3,
          totalCitas: 3,
          procedimientos: ['1 Endodoncia Molar #16', '1 Desobturación Conducto', '1 Perno Fibra'],
          recaudadoUsd: 310,
          metaUsd: 300,
          satisfaccion: 99,
        },
      },
      semana: {
        pacientes: 18,
        totalCitas: 20,
        procedimientos: ['10 Endodoncias Molares', '5 Biopulpectomías', '3 Re-tratamientos'],
        recaudadoUsd: 1850,
        metaUsd: 1900,
        satisfaccion: 99.2,
      },
      mes: {
        pacientes: 74,
        totalCitas: 80,
        procedimientos: ['42 Endodoncias Molares', '20 Premolares', '12 Apicectomías'],
        recaudadoUsd: 7400,
        metaUsd: 7600,
        satisfaccion: 99.4,
      },
    },
  },
  {
    id: 'odo-4',
    nombres: 'Dra. Andrea Morales',
    especialidad: 'Periodoncia, Prótesis & Cirugía Bucal',
    cov: 'C.O.V. 25.334',
    cedula: 'V-23.891.405',
    sedeHabitual: 'Sede Colonia Tovar & La Victoria',
    sedesValidas: ['victoria', 'tovar'],
    porcentajeHonorario: 40,
    guardiaTurno: 'ambos',
    metricasBase: {
      dia: {
        manana: {
          pacientes: 3,
          totalCitas: 3,
          procedimientos: ['1 Raspado Periodontal', '1 Gingivectomía', '1 Toma Impresión'],
          recaudadoUsd: 190,
          metaUsd: 200,
          satisfaccion: 96,
        },
        tarde: {
          pacientes: 2,
          totalCitas: 2,
          procedimientos: ['1 Prueba de Prótesis', '1 Cirugía Cordal Simple'],
          recaudadoUsd: 170,
          metaUsd: 180,
          satisfaccion: 97,
        },
      },
      semana: {
        pacientes: 24,
        totalCitas: 25,
        procedimientos: ['12 Cirugías Menores', '8 Prótesis Removibles', '4 Mantenimientos'],
        recaudadoUsd: 1720,
        metaUsd: 1800,
        satisfaccion: 97.5,
      },
      mes: {
        pacientes: 98,
        totalCitas: 104,
        procedimientos: ['48 Tratamientos Periodontales', '32 Prótesis Dentales', '18 Cirugías'],
        recaudadoUsd: 6950,
        metaUsd: 7200,
        satisfaccion: 98.2,
      },
    },
  },
];

interface OdontologaPerformanceCardProps {
  sedeActualId?: SedeId;
  tasaBcv: number;
}

export const OdontologaPerformanceCard: React.FC<OdontologaPerformanceCardProps> = ({
  tasaBcv,
}) => {
  // Selector Unificado ON / OFF con lógica agregada (inicia con los 4 encendidos por defecto)
  const [sedeVictoriaOn, setSedeVictoriaOn] = useState<boolean>(true);
  const [sedeTovarOn, setSedeTovarOn] = useState<boolean>(true);
  const [turnoMananaOn, setTurnoMananaOn] = useState<boolean>(true);
  const [turnoTardeOn, setTurnoTardeOn] = useState<boolean>(true);

  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodoRendimiento>('dia');
  const [odontologaExpandidaId, setOdontologaExpandidaId] = useState<string | null>(null);

  // Conexión reactiva a la tabla oficial de Odontólogos de la clínica (ControlData / D1)
  const { odontologos: staffOdontologos } = useOdontologos();

  // Mapear los registros oficiales de OdontologoItem a OdontologaRendimientoItem
  const listaOdontologas = useMemo(() => {
    return staffOdontologos.map((doc) => {
      const sedesValidas: SedeId[] = doc.sedeId === 'ambas' 
        ? ['victoria', 'tovar'] 
        : [doc.sedeId as SedeId];
      const sedeHabitual = doc.sedeId === 'ambas'
        ? 'Ambas Sedes (La Victoria & Tovar)'
        : doc.sedeId === 'tovar'
        ? 'Sede Colonia Tovar'
        : `Sede La Victoria (Box 0${doc.boxAsignado || 1})`;

      const guardiaTurno: 'manana' | 'tarde' | 'ambos' = 
        doc.turno === 'Mañana' ? 'manana' : doc.turno === 'Tarde' ? 'tarde' : 'ambos';

      const cleanCedula = doc.cedula.replace(/[^0-9]/g, '');
      const baseExistente = ODONTOLOGAS_BASE.find(
        (b) => b.id === doc.id || b.cedula.replace(/[^0-9]/g, '') === cleanCedula
      );

      if (baseExistente) {
        return {
          ...baseExistente,
          id: doc.id,
          nombres: doc.nombres,
          especialidad: doc.especialidad,
          cov: doc.cov,
          cedula: doc.cedula,
          sedeHabitual,
          sedesValidas,
          porcentajeHonorario: doc.porcentajeHonorarios || baseExistente.porcentajeHonorario || 40,
          guardiaTurno,
          fotoUrl: doc.avatar || baseExistente.fotoUrl,
        };
      }

      // Para doctores agregados dinámicamente en Data, generar métricas base proporcionales
      const espLower = (doc.especialidad || '').toLowerCase();
      let procedimientosManana = ['2 Restauraciones Estéticas', '1 Limpieza Ultrasónica'];
      let procedimientosTarde = ['1 Evaluación Integral', '1 Pulido & Profilaxis'];
      let procedimientosSemana = ['12 Procedimientos', '6 Profilaxis', '4 Restauraciones'];
      let procedimientosMes = ['48 Procedimientos', '22 Profilaxis', '16 Restauraciones'];

      if (espLower.includes('ortodoncia') || espLower.includes('ortopedia')) {
        procedimientosManana = ['3 Controles Ortodoncia', '1 Instalación Arcos'];
        procedimientosTarde = ['2 Cambios de Brackets', '1 Evaluación Oclusal'];
        procedimientosSemana = ['18 Controles Brackets', '6 Alineadores', '4 Cementaciones'];
        procedimientosMes = ['74 Controles Ortodoncia', '22 Retenedores', '16 Nuevas Instalaciones'];
      } else if (espLower.includes('endodoncia')) {
        procedimientosManana = ['1 Endodoncia Unirradicular', '1 Desobturación'];
        procedimientosTarde = ['1 Endodoncia Molar', '1 Re-tratamiento'];
        procedimientosSemana = ['10 Endodoncias Molares', '5 Biopulpectomías', '3 Re-tratamientos'];
        procedimientosMes = ['42 Endodoncias Molares', '20 Premolares', '12 Apicectomías'];
      } else if (espLower.includes('cirugía') || espLower.includes('periodoncia')) {
        procedimientosManana = ['1 Cirugía Bucal Menor', '1 Raspado Periodontal'];
        procedimientosTarde = ['1 Extracción Quirúrgica', '1 Control Postoperatorio'];
        procedimientosSemana = ['12 Cirugías Menores', '8 Mantenimientos Periodontales'];
        procedimientosMes = ['48 Tratamientos Periodontales', '18 Cirugías Menores'];
      } else if (espLower.includes('pediatría') || espLower.includes('infantil')) {
        procedimientosManana = ['2 Pulpotomías', '2 Sellantes de Fosetas'];
        procedimientosTarde = ['1 Topicación con Flúor', '1 Restauración Infantil'];
        procedimientosSemana = ['14 Tratamientos Pediátricos', '8 Profilaxis Infantiles'];
        procedimientosMes = ['56 Tratamientos Pediátricos', '30 Limpiezas Infantiles'];
      }

      return {
        id: doc.id,
        nombres: doc.nombres,
        especialidad: doc.especialidad,
        cov: doc.cov,
        cedula: doc.cedula,
        sedeHabitual,
        sedesValidas,
        porcentajeHonorario: doc.porcentajeHonorarios || 40,
        fotoUrl: doc.avatar,
        guardiaTurno,
        metricasBase: {
          dia: {
            manana: {
              pacientes: guardiaTurno === 'tarde' ? 0 : 3,
              totalCitas: guardiaTurno === 'tarde' ? 0 : 3,
              procedimientos: guardiaTurno === 'tarde' ? ['Sin guardia de mañana'] : procedimientosManana,
              recaudadoUsd: guardiaTurno === 'tarde' ? 0 : 180,
              metaUsd: 200,
              satisfaccion: 98,
            },
            tarde: {
              pacientes: guardiaTurno === 'manana' ? 0 : 3,
              totalCitas: guardiaTurno === 'manana' ? 0 : 3,
              procedimientos: guardiaTurno === 'manana' ? ['Sin guardia de tarde'] : procedimientosTarde,
              recaudadoUsd: guardiaTurno === 'manana' ? 0 : 160,
              metaUsd: 180,
              satisfaccion: 99,
            },
          },
          semana: {
            pacientes: 22,
            totalCitas: 24,
            procedimientos: procedimientosSemana,
            recaudadoUsd: 1650,
            metaUsd: 1800,
            satisfaccion: 98.4,
          },
          mes: {
            pacientes: 92,
            totalCitas: 98,
            procedimientos: procedimientosMes,
            recaudadoUsd: 6800,
            metaUsd: 7200,
            satisfaccion: 98.8,
          },
        },
      };
    });
  }, [staffOdontologos]);

  // Conmutadores ON/OFF con protección contra apagado total
  const toggleVictoria = () => {
    if (sedeVictoriaOn && !sedeTovarOn) {
      setSedeVictoriaOn(false);
      setSedeTovarOn(true);
    } else {
      setSedeVictoriaOn(!sedeVictoriaOn);
    }
  };

  const toggleTovar = () => {
    if (sedeTovarOn && !sedeVictoriaOn) {
      setSedeTovarOn(false);
      setSedeVictoriaOn(true);
    } else {
      setSedeTovarOn(!sedeTovarOn);
    }
  };

  const toggleManana = () => {
    if (turnoMananaOn && !turnoTardeOn) {
      setTurnoMananaOn(false);
      setTurnoTardeOn(true);
    } else {
      setTurnoMananaOn(!turnoMananaOn);
    }
  };

  const toggleTarde = () => {
    if (turnoTardeOn && !turnoMananaOn) {
      setTurnoTardeOn(false);
      setTurnoMananaOn(true);
    } else {
      setTurnoTardeOn(!turnoTardeOn);
    }
  };

  // Fechas y rangos dinámicos del periodo actual (AGENTS.md)
  const fechaHoyTexto = useMemo(() => {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' });
  }, []);

  const rangoSemanaTexto = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0: Dom, 1: Lun, ..., 6: Sáb
    const diffToMon = day === 0 ? -6 : 1 - day;
    const lun = new Date(now);
    lun.setDate(now.getDate() + diffToMon);
    const sab = new Date(lun);
    sab.setDate(lun.getDate() + 5);

    const fLun = lun.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
    const fSab = sab.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
    return `${fLun} al ${fSab}`;
  }, []);

  const rangoMesTexto = useMemo(() => {
    const now = new Date();
    const mesNombre = now.toLocaleDateString('es-VE', { month: 'short' });
    return `1 al ${now.getDate()} ${mesNombre}`;
  }, []);

  // Filtrado y cálculo reactivo agregado (ON / OFF) de las métricas por odontóloga
  const odontologasCalculadas = useMemo(() => {
    return listaOdontologas.filter((odo) => {
      const matchVictoria = sedeVictoriaOn && odo.sedesValidas.includes('victoria');
      const matchTovar = sedeTovarOn && odo.sedesValidas.includes('tovar');
      return matchVictoria || matchTovar;
    }).map((odo) => {
      let pacientes = 0;
      let totalCitas = 0;
      let procedimientos: string[] = [];
      let recaudadoUsd = 0;
      let metaUsd = 100;
      let satisfaccion = 98;

      if (filtroPeriodo === 'dia') {
        if (turnoMananaOn && !turnoTardeOn) {
          const d = odo.metricasBase.dia.manana;
          pacientes = d.pacientes;
          totalCitas = d.totalCitas;
          procedimientos = d.procedimientos;
          recaudadoUsd = d.recaudadoUsd;
          metaUsd = d.metaUsd;
          satisfaccion = d.satisfaccion;
        } else if (!turnoMananaOn && turnoTardeOn) {
          const d = odo.metricasBase.dia.tarde;
          pacientes = d.pacientes;
          totalCitas = d.totalCitas;
          procedimientos = d.procedimientos;
          recaudadoUsd = d.recaudadoUsd;
          metaUsd = d.metaUsd;
          satisfaccion = d.satisfaccion;
        } else {
          // Ambos turnos en ON (agregado Mañana + Tarde)
          const m = odo.metricasBase.dia.manana;
          const t = odo.metricasBase.dia.tarde;
          pacientes = m.pacientes + t.pacientes;
          totalCitas = m.totalCitas + t.totalCitas;
          procedimientos = [...m.procedimientos, ...t.procedimientos].filter(
            (p) => !p.startsWith('Sin guardia')
          );
          recaudadoUsd = m.recaudadoUsd + t.recaudadoUsd;
          metaUsd = m.metaUsd + t.metaUsd;
          satisfaccion = Math.round((m.satisfaccion + t.satisfaccion) / 2);
        }
      } else if (filtroPeriodo === 'semana') {
        const s = odo.metricasBase.semana;
        let factorTurno = 1;
        if (turnoMananaOn && !turnoTardeOn) factorTurno = 0.58;
        if (!turnoMananaOn && turnoTardeOn) factorTurno = 0.42;

        pacientes = Math.round(s.pacientes * factorTurno);
        totalCitas = Math.round(s.totalCitas * factorTurno);
        procedimientos = s.procedimientos;
        recaudadoUsd = Math.round(s.recaudadoUsd * factorTurno);
        metaUsd = Math.round(s.metaUsd * factorTurno);
        satisfaccion = s.satisfaccion;
      } else {
        // Mes
        const m = odo.metricasBase.mes;
        let factorTurno = 1;
        if (turnoMananaOn && !turnoTardeOn) factorTurno = 0.58;
        if (!turnoMananaOn && turnoTardeOn) factorTurno = 0.42;

        pacientes = Math.round(m.pacientes * factorTurno);
        totalCitas = Math.round(m.totalCitas * factorTurno);
        procedimientos = m.procedimientos;
        recaudadoUsd = Math.round(m.recaudadoUsd * factorTurno);
        metaUsd = Math.round(m.metaUsd * factorTurno);
        satisfaccion = m.satisfaccion;
      }

      // Ajuste proporcional agregado por sede para odontólogas multisede
      const esMultisede = odo.sedesValidas.includes('victoria') && odo.sedesValidas.includes('tovar');
      if (esMultisede) {
        if (!sedeVictoriaOn && sedeTovarOn) {
          pacientes = Math.max(1, Math.round(pacientes * 0.4));
          totalCitas = Math.max(1, Math.round(totalCitas * 0.4));
          recaudadoUsd = Math.round(recaudadoUsd * 0.45);
          metaUsd = Math.round(metaUsd * 0.45);
        } else if (sedeVictoriaOn && !sedeTovarOn) {
          pacientes = Math.max(1, Math.round(pacientes * 0.6));
          totalCitas = Math.max(1, Math.round(totalCitas * 0.6));
          recaudadoUsd = Math.round(recaudadoUsd * 0.55);
          metaUsd = Math.round(metaUsd * 0.55);
        }
      }

      const honorariosUsd = (recaudadoUsd * odo.porcentajeHonorario) / 100;
      const honorariosBs = honorariosUsd * tasaBcv;
      const recaudadoBs = recaudadoUsd * tasaBcv;
      const porcentajeCumplimiento =
        metaUsd > 0 ? Math.min(100, Math.round((recaudadoUsd / metaUsd) * 100)) : 0;
      const tasaPuntualidad =
        totalCitas > 0 ? Math.min(100, Math.round((pacientes / totalCitas) * 100)) : 100;

      return {
        ...odo,
        pacientes,
        totalCitas,
        procedimientos,
        recaudadoUsd,
        recaudadoBs,
        honorariosUsd,
        honorariosBs,
        porcentajeCumplimiento,
        tasaPuntualidad,
        satisfaccion,
        metaUsd,
      };
    });
  }, [listaOdontologas, sedeVictoriaOn, sedeTovarOn, filtroPeriodo, turnoMananaOn, turnoTardeOn, tasaBcv]);

  // Totales consolidados de la barra
  const totalPacientes = odontologasCalculadas.reduce((acc, o) => acc + o.pacientes, 0);
  const totalRecaudadoUsd = odontologasCalculadas.reduce((acc, o) => acc + o.recaudadoUsd, 0);
  const totalHonorariosUsd = odontologasCalculadas.reduce((acc, o) => acc + o.honorariosUsd, 0);

  return (
    <section
      id="seccion-rendimiento-facultativo"
      className="bg-surface-clean-white rounded-3xl p-4 sm:p-6 shadow-soft-elevated border border-border-subtle relative overflow-hidden flex flex-col gap-4 animate-in fade-in duration-300"
    >
      {/* Acento superior con gradiente de la paleta activa */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-vibrant-cyan to-dental-deep-navy" />

      {/* ===================================================================
          CABECERA DE LA TARJETA
         =================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-dental-deep-navy text-white flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[26px] text-vibrant-cyan">clinical_notes</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy border border-border-subtle">
                Productividad Médica
              </span>
              <span className="text-xs text-secondary font-medium">
                • {odontologasCalculadas.length} Odontólogas en Seguimiento
              </span>
            </div>
            <h2 className="font-display font-black text-lg sm:text-xl text-dental-deep-navy mt-1 tracking-tight">
              Resumen de Rendimiento Clínico & Honorarios
            </h2>
          </div>
        </div>

        {/* Resumen rápido de totales de la selección */}
        <div className="flex items-center gap-2.5 sm:gap-3 bg-surface-subtle-ice p-2.5 sm:p-3 rounded-2xl border border-border-subtle self-start lg:self-auto shrink-0 flex-wrap">
          <div className="px-2 text-center sm:text-left">
            <span className="text-[10px] font-bold text-secondary uppercase block">Pacientes</span>
            <span className="text-base sm:text-lg font-display font-black text-dental-deep-navy leading-none">
              {totalPacientes}
            </span>
          </div>
          <div className="h-6 w-px bg-border-subtle" />
          <div className="px-2 text-center sm:text-left">
            <span className="text-[10px] font-bold text-secondary uppercase block">Recaudación</span>
            <span className="text-base sm:text-lg font-display font-black text-primary leading-none">
              ${totalRecaudadoUsd.toLocaleString()} USD
            </span>
          </div>
          <div className="h-6 w-px bg-border-subtle" />
          <div className="px-2 text-center sm:text-left">
            <span className="text-[10px] font-bold text-secondary uppercase block">Honorarios</span>
            <span className="text-base sm:text-lg font-display font-black text-status-success leading-none">
              ${totalHonorariosUsd.toLocaleString()} USD
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================
          BARRA DE FILTRADO EN 2 NIVELES:
          1. ARRIBA: Selector Unificado ON / OFF (La Victoria | Colonia Tovar | Mañana | Tarde)
          2. ABAJO: Selector de Temporalidad (Día en curso | Semana Lun-Sáb | Mes 1 a actual)
         =================================================================== */}
      <div className="bg-surface-subtle-ice/70 p-3 sm:p-3.5 rounded-2xl border border-border-subtle flex flex-col gap-2.5">
        {/* FILA 1 (ARRIBA): Campo Selector Unificado ON / OFF (Sedes + Turnos de forma agregada) */}
        <div className="bg-surface-clean-white p-1.5 rounded-xl border border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-1.5 shadow-2xs">
          {/* Interruptor ON/OFF: La Victoria */}
          <button
            type="button"
            onClick={toggleVictoria}
            className={`px-3 py-2 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-between gap-2 border ${
              sedeVictoriaOn
                ? 'bg-dental-deep-navy text-white border-dental-deep-navy shadow-xs'
                : 'bg-surface-subtle-ice/60 text-secondary border-border-subtle/50 opacity-65 hover:opacity-100'
            }`}
            title="Activar / Desactivar suma de Sede La Victoria"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  sedeVictoriaOn ? 'bg-status-success animate-pulse' : 'bg-outline-variant'
                }`}
              />
              <span className="truncate">La Victoria</span>
            </span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                sedeVictoriaOn
                  ? 'bg-status-success/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-surface-container text-secondary'
              }`}
            >
              {sedeVictoriaOn ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Interruptor ON/OFF: Colonia Tovar */}
          <button
            type="button"
            onClick={toggleTovar}
            className={`px-3 py-2 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-between gap-2 border ${
              sedeTovarOn
                ? 'bg-dental-deep-navy text-white border-dental-deep-navy shadow-xs'
                : 'bg-surface-subtle-ice/60 text-secondary border-border-subtle/50 opacity-65 hover:opacity-100'
            }`}
            title="Activar / Desactivar suma de Sede Colonia Tovar"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  sedeTovarOn ? 'bg-status-success animate-pulse' : 'bg-outline-variant'
                }`}
              />
              <span className="truncate">Colonia Tovar</span>
            </span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                sedeTovarOn
                  ? 'bg-status-success/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-surface-container text-secondary'
              }`}
            >
              {sedeTovarOn ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Interruptor ON/OFF: Turno Mañana */}
          <button
            type="button"
            onClick={toggleManana}
            className={`px-3 py-2 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-between gap-2 border ${
              turnoMananaOn
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-surface-subtle-ice/60 text-secondary border-border-subtle/50 opacity-65 hover:opacity-100'
            }`}
            title="Activar / Desactivar suma de Turno Mañana"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  turnoMananaOn ? 'bg-amber-300 animate-pulse' : 'bg-outline-variant'
                }`}
              />
              <span className="truncate">Mañana</span>
            </span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                turnoMananaOn
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-surface-container text-secondary'
              }`}
            >
              {turnoMananaOn ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Interruptor ON/OFF: Turno Tarde */}
          <button
            type="button"
            onClick={toggleTarde}
            className={`px-3 py-2 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-between gap-2 border ${
              turnoTardeOn
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-surface-subtle-ice/60 text-secondary border-border-subtle/50 opacity-65 hover:opacity-100'
            }`}
            title="Activar / Desactivar suma de Turno Tarde"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  turnoTardeOn ? 'bg-amber-300 animate-pulse' : 'bg-outline-variant'
                }`}
              />
              <span className="truncate">Tarde</span>
            </span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                turnoTardeOn
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-surface-container text-secondary'
              }`}
            >
              {turnoTardeOn ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* FILA 2 (ABAJO): Selector de Temporalidad (Día en curso, Semana Lun-Sáb, Mes día 1 a actual) */}
        <div className="bg-surface-clean-white p-1.5 rounded-xl border border-border-subtle grid grid-cols-1 sm:grid-cols-3 gap-1.5 shadow-2xs">
          {[
            { id: 'dia', label: 'Día en curso', sub: fechaHoyTexto },
            { id: 'semana', label: 'Semana en curso (Lun - Sáb)', sub: rangoSemanaTexto },
            { id: 'mes', label: 'Mes en curso (Día 1 a actual)', sub: rangoMesTexto },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setFiltroPeriodo(p.id as FiltroPeriodoRendimiento)}
              className={`px-3 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                filtroPeriodo === p.id
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-secondary hover:text-dental-deep-navy hover:bg-surface-subtle-ice'
              }`}
              title={`Periodo: ${p.label} • ${p.sub}`}
            >
              <span className="truncate">{p.label}</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                  filtroPeriodo === p.id ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'
                }`}
              >
                {p.sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-banner informativo del filtro agregado activo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs font-semibold text-secondary">
        <div className="flex items-center gap-1.5 text-primary">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span>
            Periodo Activo:{' '}
            <strong className="text-dental-deep-navy font-black">
              {filtroPeriodo === 'dia' && `Día en curso (${fechaHoyTexto})`}
              {filtroPeriodo === 'semana' && `Semana en curso de Lunes a Sábado (${rangoSemanaTexto})`}
              {filtroPeriodo === 'mes' && `Mes en curso desde el día 1 al actual (${rangoMesTexto})`}
            </strong>
          </span>
        </div>
        <span className="text-[11px] text-secondary font-medium">
          {[
            sedeVictoriaOn && sedeTovarOn
              ? 'Ambas Sedes'
              : sedeVictoriaOn
              ? 'Sede La Victoria'
              : 'Sede Colonia Tovar',
            turnoMananaOn && turnoTardeOn
              ? 'Mañana + Tarde'
              : turnoMananaOn
              ? 'Turno Mañana'
              : 'Turno Tarde',
          ].join(' • ')}
        </span>
      </div>

      {/* ===================================================================
          KPIS ANIMADOS EN FILAS POR ODONTÓLOGA
         =================================================================== */}
      <div className="space-y-3">
        {odontologasCalculadas.map((odo) => {
          const isExpanded = odontologaExpandidaId === odo.id;

          return (
            <div
              key={odo.id}
              className={`rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                isExpanded
                  ? 'bg-surface-clean-white border-primary shadow-md ring-2 ring-primary/20'
                  : 'bg-surface-clean-white border-border-subtle hover:border-primary/40 hover:shadow-sm'
              }`}
            >
              {/* Barra de progreso de cumplimiento de meta como acento de fondo */}
              <div
                className="absolute left-0 bottom-0 top-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors"
                style={{
                  height: `${odo.porcentajeCumplimiento}%`,
                }}
              />

              {/* Contenido Principal de la Fila (Fila Ejecutiva) */}
              <div
                className="p-3.5 sm:p-4.5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setOdontologaExpandidaId(isExpanded ? null : odo.id)}
              >
                {/* 1. Identidad Facultativa & Especialidad */}
                <div className="flex items-center gap-3.5 min-w-0 xl:w-72 shrink-0">
                  <div className="relative shrink-0">
                    {odo.fotoUrl ? (
                      <img
                        src={odo.fotoUrl}
                        alt={odo.nombres}
                        className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-primary/20"
                      />
                    ) : (
                      <DeterministicIdenticon
                        seed={odo.cedula}
                        name={odo.nombres}
                        size={48}
                        className="rounded-2xl shadow-sm ring-2 ring-primary/20"
                      />
                    )}
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-status-success ring-2 ring-surface-clean-white flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-surface-clean-white animate-ping" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-display font-black text-sm sm:text-base text-dental-deep-navy truncate">
                        {odo.nombres}
                      </span>
                    </div>
                    <p className="text-xs text-secondary truncate">{odo.especialidad}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">{odo.cov}</span>
                      <span className="text-[10px] text-secondary font-medium">• {odo.sedeHabitual}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Grid de KPIs Animados por Odontóloga */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1">
                  {/* KPI 1: Pacientes Atendidos */}
                  <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle/80 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-secondary flex items-center justify-between">
                      <span>Pacientes</span>
                      <span className="material-symbols-outlined text-[14px] text-primary">groups</span>
                    </span>
                    <div className="mt-1">
                      <span className="text-lg sm:text-xl font-display font-black text-dental-deep-navy leading-none">
                        {odo.pacientes} <span className="text-xs font-normal text-secondary">/ {odo.totalCitas}</span>
                      </span>
                      <span className="text-[10px] font-bold text-status-success block mt-0.5">
                        {odo.tasaPuntualidad}% Efectividad
                      </span>
                    </div>
                  </div>

                  {/* KPI 2: Procedimientos Realizados */}
                  <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle/80 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-secondary flex items-center justify-between">
                      <span>Tratamientos</span>
                      <span className="material-symbols-outlined text-[14px] text-sky-600">dentistry</span>
                    </span>
                    <div className="mt-1">
                      <span className="text-lg sm:text-xl font-display font-black text-dental-deep-navy leading-none">
                        {odo.procedimientos.length}
                      </span>
                      <span className="text-[10px] text-secondary truncate block mt-0.5">
                        {odo.procedimientos[0] || 'Procedimientos en curso'}
                      </span>
                    </div>
                  </div>

                  {/* KPI 3: Recaudación Facturada (USD / Bs) */}
                  <div className="p-2.5 rounded-xl bg-surface-subtle-ice border border-border-subtle/80 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-secondary flex items-center justify-between">
                      <span>Facturación</span>
                      <span className="material-symbols-outlined text-[14px] text-emerald-600">payments</span>
                    </span>
                    <div className="mt-1">
                      <span className="text-lg sm:text-xl font-display font-black text-primary leading-none">
                        ${odo.recaudadoUsd} <span className="text-[10px] font-bold">USD</span>
                      </span>
                      <span className="text-[10px] font-semibold text-secondary truncate block mt-0.5">
                        ≈ Bs. {odo.recaudadoBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* KPI 4: Honorarios Médicos */}
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center justify-between">
                      <span>Honorarios ({odo.porcentajeHonorario}%)</span>
                      <span className="material-symbols-outlined text-[14px] text-emerald-700">account_balance_wallet</span>
                    </span>
                    <div className="mt-1">
                      <span className="text-lg sm:text-xl font-display font-black text-emerald-800 leading-none">
                        ${odo.honorariosUsd.toFixed(0)} <span className="text-[10px] font-bold">USD</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 truncate block mt-0.5">
                        Bs. {odo.honorariosBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Rendimiento contra Meta & Botón de Expansión */}
                <div className="flex items-center gap-3 xl:w-56 justify-between xl:justify-end shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-border-subtle/60">
                  <div className="flex-1 xl:max-w-[130px]">
                    <div className="flex items-center justify-between text-[11px] font-bold text-dental-deep-navy mb-1">
                      <span>Meta:</span>
                      <span className="text-primary font-black">{odo.porcentajeCumplimiento}%</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-vibrant-cyan h-full rounded-full transition-all duration-500"
                        style={{ width: `${odo.porcentajeCumplimiento}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isExpanded
                        ? 'bg-dental-deep-navy text-white rotate-180'
                        : 'bg-surface-subtle-ice text-secondary hover:bg-surface-container'
                    }`}
                    title={isExpanded ? 'Contraer fila' : 'Ver detalle'}
                  >
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </button>
                </div>
              </div>

              {/* ===============================================================
                  SUB-TARJETA EXPANDIDA CON DETALLES DE PROCEDIMIENTOS Y CITAS
                 =============================================================== */}
              {isExpanded && (
                <div className="p-4 bg-surface-subtle-ice/80 border-t border-border-subtle animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Lista de Procedimientos Realizados en el Periodo */}
                    <div className="p-3 rounded-xl bg-white border border-border-subtle">
                      <span className="text-xs font-black uppercase tracking-wider text-dental-deep-navy block mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">format_list_bulleted</span>
                        Procedimientos Ejecutados ({odo.procedimientos.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {odo.procedimientos.map((proc, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2.5 py-1 rounded-lg bg-surface-subtle-ice text-dental-deep-navy text-xs font-semibold border border-border-subtle flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {proc}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Resumen de Liquidación & Satisfacción */}
                    <div className="p-3 rounded-xl bg-white border border-border-subtle flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-dental-deep-navy block mb-1 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-status-success">verified</span>
                          Indicadores de Calidad & Liquidación
                        </span>
                        <p className="text-xs text-secondary mt-1">
                          Honorarios calculados al <strong>{odo.porcentajeHonorario}%</strong> sobre facturación neta sin insumos.
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-subtle text-xs font-bold">
                        <span className="text-secondary flex items-center gap-1">
                          <span className="text-amber-500">★</span> Satisfacción: {odo.satisfaccion}%
                        </span>
                        <span className="text-primary font-black">
                          Total a Liquidar: ${odo.honorariosUsd.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
