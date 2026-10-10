import React, { useState, useEffect } from 'react';
import { useSede } from '../../context/SedeContext';
import { ApiClient } from '../../services/api';
import { ToothRecord } from '../../types/clinical';
import { QuadrantArchView } from './QuadrantArchView';
import { TabId } from '../layout/BottomNavigation';

export interface PacienteRegistrado {
  id: string;
  nombres: string;
  cedula: string;
  edad: number;
  telefono: string;
  email?: string;
  avatar: string;
  alergias?: string;
  seguro?: string;
  estadoSillon: 'en_sillon' | 'espera' | 'atendido' | 'programado';
  boxNumero?: number;
  ultimaEvolucion?: {
    fecha: string;
    texto: string;
    pieza: number;
  };
  rxImgUrl?: string;
}

interface OdontogramViewProps {
  onNavigateTab?: (tab: TabId) => void;
}

export const OdontogramView: React.FC<OdontogramViewProps> = ({ onNavigateTab }) => {
  const { sedeActiva, sedeId, doctorActivo } = useSede();

  // Directorio de Pacientes Registrados en la Clínica
  const [pacientesRegistrados] = useState<PacienteRegistrado[]>([
    {
      id: 'pac-patricia',
      nombres: 'Patricia Velásquez',
      cedula: 'V-19.845.221',
      edad: 34,
      telefono: '+584145550921',
      email: 'patricia.velasquez@gmail.com',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAPeZ-uFSA20-Op8mp8d22UXBPJ4mrJYuKQSVCWC9iI_9_t2JEmnittLQqLwnj_cBN-65gua22VrWA03DY4pLaiYWXzVklQnHTKMDQ7T8xskLKCknZvlS8aZZ5BJM1GW8J62sB3tZGbbq2XWogsn6cXAy__4XoGfwr-pVRMQC8fRTHGrdA9esTkkMyJG_KrQhniXPG8A4GiskyvFCRI5p533g6wf4Bh0gDMm6C_4hI',
      alergias: 'Alergia a Penicilina',
      seguro: 'Seguros Mercantil (Titular)',
      estadoSillon: 'en_sillon',
      boxNumero: 1,
      ultimaEvolucion: {
        fecha: '12 Mar 2025',
        texto:
          'Paciente acude refiriendo molestia al frío en cuadrante superior derecho. A la inspección clínica y secado con aire se visualiza lesión de caries en surco oclusal de pieza 16. Se toma Rx periapical descartando afectación pulpar directa. Se planifica operatoria directa con resina 3M Z350 XT en próxima sesión. Profilaxis general realizada.',
        pieza: 16,
      },
      rxImgUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCzNk8J9R3jS7mj8Ng5pX9XV8bes8wETBgJV6fQji5otUo1hgOYPy0RYFf6WcIWSB6obBOeELD5zsOlkbR9KZKmgJQl1pn_AcfknQzVy2w-qZYHMSIKtP4Y5RisRT3f3Mlces75xcKJ171AEt_t6jFZh5yp024E0PfZwlOKy_Ilt1Z1X4vwQGJuOKrl0dwFBKa-2Hx51SrsKYBes-O1lsF25x2vXyE5j5ZuJzWu_LI',
    },
    {
      id: 'pac-carlos',
      nombres: 'Carlos Mendoza',
      cedula: 'V-17.654.321',
      edad: 42,
      telefono: '+584121234567',
      email: 'carlos.mendoza@cantv.net',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      seguro: 'Particular • Pago Móvil',
      estadoSillon: 'en_sillon',
      boxNumero: 1,
      ultimaEvolucion: {
        fecha: '10 Oct 2026',
        texto:
          'Conductometría y biomecánica en pieza 16 (Primer Molar Sup. Der.). Se irriga con hipoclorito de sodio al 2.5% y se coloca medicación intraconducto de hidróxido de calcio. Paciente asintomático.',
        pieza: 16,
      },
      rxImgUrl:
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'pac-marcos',
      nombres: 'Marcos Ramos',
      cedula: 'V-22.113.890',
      edad: 28,
      telefono: '+584247890123',
      email: 'marcos.ramos@outlook.com',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      alergias: 'Alergia a Látex (Uso obligatorio de Nitrilo)',
      seguro: 'Mapfre Dental',
      estadoSillon: 'espera',
      boxNumero: 2,
      ultimaEvolucion: {
        fecha: '02 Oct 2026',
        texto:
          'Control mensual de Ortodoncia Etapa 4. Cambio de arco NiTi 0.016 superior e inferior. Se colocan cadenas elásticas en cuadrante 1 para cierre de diastema. Higiene bucal aceptable.',
        pieza: 11,
      },
    },
    {
      id: 'pac-elena',
      nombres: 'Elena Blanco',
      cedula: 'V-25.115.894',
      edad: 24,
      telefono: '+584129876543',
      email: 'elena.blanco@gmail.com',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      seguro: 'Particular • Pre-autorizado',
      estadoSillon: 'programado',
      boxNumero: 3,
      ultimaEvolucion: {
        fecha: '20 Sep 2026',
        texto:
          'Evaluación inicial completa y destartraje ultrasónico de arco superior e inferior. Se realiza pulido coronario con pasta profiláctica y aplicación de flúor barniz.',
        pieza: 31,
      },
    },
    {
      id: 'pac-roberto',
      nombres: 'Roberto Gil',
      cedula: 'V-15.340.119',
      edad: 45,
      telefono: '+584125551234',
      email: 'roberto.gil@sigmapro.com',
      avatar:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
      alergias: 'Hipertensión arterial leve controlada',
      seguro: 'Banesco Seguros',
      estadoSillon: 'atendido',
      boxNumero: 1,
      ultimaEvolucion: {
        fecha: '15 Ago 2026',
        texto:
          'Restauración clase II en pieza 26 con resina nanohíbrida. Contacto proximal óptimo y pulido final con discos Sof-Lex. Se indica no masticar sólidos por 2 horas.',
        pieza: 26,
      },
    },
    {
      id: 'pac-sofia',
      nombres: 'Sofía Rivas',
      cedula: 'V-26.901.442',
      edad: 21,
      telefono: '+584243338899',
      email: 'sofia.rivas@gmail.com',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      seguro: 'Plan OdontoSalud Joven',
      estadoSillon: 'programado',
      boxNumero: 2,
      ultimaEvolucion: {
        fecha: '18 Jul 2026',
        texto:
          'Cementación de tubos en primeros molares y reposición de bracket en pieza 12. Se entregan ceras de alivio para roce en mucosa yugoslavo.',
        pieza: 12,
      },
    },
  ]);

  const [selectedPaciente, setSelectedPaciente] = useState<PacienteRegistrado>(pacientesRegistrados[0]);
  const [showModalPacientes, setShowModalPacientes] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'en_sillon' | 'con_alergias'>('todos');

  const [teeth, setTeeth] = useState<ToothRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar Odontograma cuando cambia el paciente o la sede
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    ApiClient.getOdontograma(selectedPaciente.id, sedeId)
      .then((data) => {
        if (isMounted) setTeeth(data);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPaciente.id, sedeId]);

  const handleUpdateTooth = async (updatedTooth: ToothRecord) => {
    setTeeth((prev) =>
      prev.map((t) => (t.numeroFdi === updatedTooth.numeroFdi ? updatedTooth : t))
    );
    await ApiClient.guardarPiezaOdontograma(selectedPaciente.id, updatedTooth, sedeId);
  };

  // Filtrado de pacientes en el modal
  const pacientesFiltrados = pacientesRegistrados.filter((p) => {
    const coincideTexto =
      p.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.cedula.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.telefono.includes(busqueda);

    if (!coincideTexto) return false;

    if (filtroEstado === 'en_sillon') return p.estadoSillon === 'en_sillon';
    if (filtroEstado === 'con_alergias') return Boolean(p.alergias);

    return true;
  });

  return (
    <div className="flex flex-col gap-4 pb-32">
      {/* Modal / Ventana de Selección de Pacientes Registrados */}
      {showModalPacientes && (
        <div className="fixed inset-0 z-50 bg-dental-deep-navy/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-surface-clean-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-border-subtle flex flex-col gap-3.5 max-h-[85vh] h-[600px] animate-in slide-in-from-bottom duration-250">
            {/* Cabecera del Directorio */}
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-electric-blue/15 text-electric-blue flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">patient_list</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-dental-deep-navy">
                    Pacientes Registrados
                  </h3>
                  <p className="text-xs text-secondary">
                    Selecciona una ficha para abrir su odontograma e historial
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModalPacientes(false)}
                className="w-8 h-8 rounded-full bg-surface-subtle-ice flex items-center justify-center text-secondary hover:text-dental-deep-navy transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Buscador de Paciente */}
            <div className="relative shrink-0">
              <span className="material-symbols-outlined text-[18px] text-secondary absolute left-3 top-2.5">
                search
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, cédula o teléfono..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-subtle-ice border border-border-subtle focus:bg-white focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/15 outline-none transition-all text-dental-deep-navy placeholder:text-secondary/70"
              />
            </div>

            {/* Chips de Filtro */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setFiltroEstado('todos')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  filtroEstado === 'todos'
                    ? 'bg-dental-deep-navy text-white shadow-sm'
                    : 'bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy'
                }`}
              >
                Todos ({pacientesRegistrados.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('en_sillon')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                  filtroEstado === 'en_sillon'
                    ? 'bg-status-success text-white shadow-sm'
                    : 'bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                En Sillón
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado('con_alergias')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  filtroEstado === 'con_alergias'
                    ? 'bg-status-danger text-white shadow-sm'
                    : 'bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy'
                }`}
              >
                ⚠️ Con Alergias
              </button>
            </div>

            {/* Lista Scrollable de Pacientes */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {pacientesFiltrados.map((pac) => {
                const isSelected = selectedPaciente.id === pac.id;
                return (
                  <button
                    key={pac.id}
                    type="button"
                    onClick={() => {
                      setSelectedPaciente(pac);
                      setShowModalPacientes(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 active:scale-[0.99] ${
                      isSelected
                        ? 'border-electric-blue bg-electric-blue/5 ring-1 ring-electric-blue shadow-sm'
                        : 'border-border-subtle hover:bg-surface-subtle-ice'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={pac.avatar}
                        alt={pac.nombres}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary/20 shadow-sm"
                      />
                      {pac.estadoSillon === 'en_sillon' && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-status-success ring-2 ring-white flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-display font-bold text-xs text-dental-deep-navy truncate">
                          {pac.nombres}
                        </h4>
                        <span className="text-[10px] font-mono text-secondary shrink-0">
                          {pac.cedula}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-secondary mt-0.5">
                        <span>{pac.edad} años</span>
                        <span>•</span>
                        <span>{pac.telefono}</span>
                        {pac.boxNumero && (
                          <span className="px-1.5 py-0.2 rounded bg-surface-container font-bold text-[9px] text-dental-deep-navy">
                            Box 0{pac.boxNumero}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {pac.alergias && (
                          <span className="px-1.5 py-0.2 rounded-md bg-status-danger/10 text-status-danger text-[9px] font-bold">
                            ⚠️ {pac.alergias}
                          </span>
                        )}
                        {pac.seguro && (
                          <span className="px-1.5 py-0.2 rounded-md bg-surface-subtle-ice border border-border-subtle text-secondary text-[9px] font-medium">
                            {pac.seguro}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-electric-blue text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[15px]">check</span>
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px] text-secondary/60 shrink-0">
                        chevron_right
                      </span>
                    )}
                  </button>
                );
              })}

              {pacientesFiltrados.length === 0 && (
                <div className="py-8 text-center text-secondary text-xs">
                  No se encontraron pacientes con ese criterio de búsqueda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. Tarjeta Resumen del Paciente Activo (con Botón Cambiar Paciente) */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={selectedPaciente.avatar}
                alt={selectedPaciente.nombres}
                className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-2 ring-primary/20"
              />
              {selectedPaciente.estadoSillon === 'en_sillon' && (
                <span
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-status-success rounded-full ring-2 ring-surface-clean-white"
                  title="Paciente Activo en Sillón"
                />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-display font-bold text-base text-dental-deep-navy truncate">
                  {selectedPaciente.nombres}
                </h2>
                {selectedPaciente.boxNumero && (
                  <span className="px-1.5 py-0.2 rounded-md bg-status-success/15 text-status-success font-bold text-[10px]">
                    Box 0{selectedPaciente.boxNumero}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-secondary text-xs mt-0.5">
                <span className="font-mono">{selectedPaciente.cedula}</span>
                <span>•</span>
                <span>{selectedPaciente.edad} años</span>
              </div>
              <span className="text-[11px] text-tertiary font-bold flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                {sedeActiva.nombre}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {/* Botón Destacado: Cambiar / Seleccionar Paciente */}
            <button
              type="button"
              onClick={() => setShowModalPacientes(true)}
              className="px-2.5 py-1.5 rounded-xl bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue font-bold text-xs flex items-center gap-1 transition-all active:scale-95 border border-electric-blue/20"
              title="Seleccionar otro paciente"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              <span>Cambiar</span>
            </button>

            <div className="flex gap-1">
              <a
                href={`tel:${selectedPaciente.telefono}`}
                aria-label="Llamar al paciente"
                className="w-8 h-8 rounded-lg bg-surface-subtle-ice border border-border-subtle text-primary flex items-center justify-center active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">phone</span>
              </a>
              <a
                href={`https://wa.me/${selectedPaciente.telefono.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Enviar WhatsApp"
                className="w-8 h-8 rounded-lg bg-status-success/15 border border-status-success/20 text-status-success flex items-center justify-center active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">chat</span>
              </a>
            </div>
          </div>
        </div>

        {/* Alertas Médicas y Seguro */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border-subtle">
          {selectedPaciente.alergias ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-xs font-bold animate-pulse">
              <span className="material-symbols-outlined text-[14px] text-error">warning</span>
              <span>{selectedPaciente.alergias}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-status-success/10 text-status-success text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px]">check</span>
              <span>Sin alergias reportadas</span>
            </div>
          )}

          {selectedPaciente.seguro && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-subtle-ice text-secondary text-xs border border-border-subtle">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span>{selectedPaciente.seguro}</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Visor de Radiografía Periapical Digital (Sensor RVG 2.0) */}
      <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-bold text-sm text-dental-deep-navy flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-electric-blue">
              radiology
            </span>
            <span>Radiografía Digital (Sensor RVG 2.0)</span>
          </h4>
          <span className="text-[11px] font-bold text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            Dosis Ultra Baja
          </span>
        </div>

        <div className="relative rounded-2xl overflow-hidden h-36 bg-dental-deep-navy flex items-center justify-center shadow-inner">
          <img
            src={
              selectedPaciente.rxImgUrl ||
              'https://lh3.googleusercontent.com/aida-public/AB6AXuCzNk8J9R3jS7mj8Ng5pX9XV8bes8wETBgJV6fQji5otUo1hgOYPy0RYFf6WcIWSB6obBOeELD5zsOlkbR9KZKmgJQl1pn_AcfknQzVy2w-qZYHMSIKtP4Y5RisRT3f3Mlces75xcKJ171AEt_t6jFZh5yp024E0PfZwlOKy_Ilt1Z1X4vwQGJuOKrl0dwFBKa-2Hx51SrsKYBes-O1lsF25x2vXyE5j5ZuJzWu_LI'
            }
            alt="Radiografía dental periapical"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dental-deep-navy/90 via-transparent to-transparent flex items-end p-3">
            <div className="flex items-center justify-between w-full text-surface-clean-white text-[11px] font-semibold">
              <span>Resolución HD RVG 22 lp/mm • Pieza {selectedPaciente.ultimaEvolucion?.pieza || 16}</span>
              <span className="bg-surface-clean-white/20 px-2 py-0.5 rounded backdrop-blur-md">
                {selectedPaciente.ultimaEvolucion?.fecha || 'Reciente'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Odontograma FDI de 5 Caras */}
      {loading ? (
        <div className="p-8 text-center text-secondary text-xs bg-surface-clean-white rounded-2xl border border-border-subtle">
          Cargando odontograma anatómico de {selectedPaciente.nombres}...
        </div>
      ) : (
        <QuadrantArchView teeth={teeth} onUpdateTooth={handleUpdateTooth} />
      )}

      {/* 4. Última Nota de Evolución Clínica Firmada */}
      {selectedPaciente.ultimaEvolucion && (
        <section className="bg-surface-clean-white rounded-2xl p-4 shadow-sm border border-border-subtle flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                Nota de Progreso
              </span>
              <h4 className="font-display font-bold text-sm text-dental-deep-navy">
                Última Evolución Registrada
              </h4>
            </div>
            <span className="text-[10px] font-bold text-secondary bg-surface-container px-2 py-0.5 rounded-full">
              {selectedPaciente.ultimaEvolucion.fecha}
            </span>
          </div>

          <p className="text-xs text-secondary leading-relaxed bg-surface-subtle-ice p-3 rounded-xl border border-border-subtle">
            {selectedPaciente.ultimaEvolucion.texto}
          </p>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80"
                alt={doctorActivo}
                className="w-9 h-9 rounded-full object-cover shadow-sm"
              />
              <div>
                <span className="text-xs font-bold text-dental-deep-navy block leading-tight">
                  {doctorActivo}
                </span>
                <span className="text-[10px] text-secondary">
                  C.O.V 24.891 • Odontología Integral
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-status-success">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Firma Digital
              </span>
              <span className="text-[10px] text-secondary">10:45 AM</span>
            </div>
          </div>
        </section>
      )}

      {/* 5. Botón Flotante Agendar Cita (Stitch Mobile Ficha) */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => onNavigateTab?.('reserva')}
          className="py-3 px-5 rounded-full bg-gradient-to-r from-dental-deep-navy via-primary to-electric-blue hover:brightness-105 text-white font-bold text-xs shadow-[0_8px_24px_rgba(0,132,255,0.4)] transition-all flex items-center gap-2 active:scale-95 ring-2 ring-white"
        >
          <span className="material-symbols-outlined text-[20px]">add_alarm</span>
          <span>Agendar Cita</span>
        </button>
      </div>
    </div>
  );
};
