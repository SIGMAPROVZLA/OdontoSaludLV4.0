import React, { useState, useEffect } from 'react';
import { RolUsuarioSistema, UsuarioSistemaItem } from '../../types/clinical';
import { TabId } from '../layout/BottomNavigation';

interface LoginViewProps {
  onNavigateTab?: (tab: TabId) => void;
}

const STORAGE_KEY_USUARIOS = 'odontosalud_usuarios_auth_v1';
const STORAGE_KEY_SESION_ACTIVA = 'odontosalud_sesion_activa_v1';

const ROLES_BADGES: Record<RolUsuarioSistema, { label: string; badgeClass: string; icon: string }> = {
  superadmin: {
    label: 'SuperAdmin / Gobernanza',
    badgeClass: 'bg-emerald-500/15 text-emerald-900 border-emerald-300',
    icon: 'admin_panel_settings',
  },
  directora_clinica: {
    label: 'Directora Clínica',
    badgeClass: 'bg-indigo-500/15 text-indigo-900 border-indigo-300',
    icon: 'local_hospital',
  },
  odontologo: {
    label: 'Odontóloga Especialista',
    badgeClass: 'bg-sky-500/15 text-sky-900 border-sky-300',
    icon: 'dentistry',
  },
  higienista: {
    label: 'Higienista / Asistente Dental',
    badgeClass: 'bg-teal-500/15 text-teal-900 border-teal-300',
    icon: 'medical_services',
  },
  recepcion: {
    label: 'Recepción & Triaje',
    badgeClass: 'bg-amber-500/15 text-amber-900 border-amber-300',
    icon: 'support_agent',
  },
};

const USUARIOS_DEFAULT: UsuarioSistemaItem[] = [
  {
    id: 'usr-1',
    nombres: 'Dra. María Alejandra Domínguez Hernández',
    cedula: 'V-14.376.191',
    email: 'mariadominguez1911@gmail.com',
    telefono: '+58 424-3119937',
    rol: 'directora_clinica',
    sedeAsignada: 'ambas',
    pinAcceso: '1911',
    avatar: '/odontologos/dra-maria-alejandra.jpg',
    activo: true,
    ultimoAcceso: 'Hoy • Sesión Activa',
    permisosModulos: ['dashboard', 'agenda', 'coordinacion', 'odontograma', 'cobros', 'data', 'superadmin', 'reserva'],
  },
  {
    id: 'usr-2',
    nombres: 'Od. Julianny Rebolledo',
    cedula: 'V-29.882.418',
    email: 'rebolledojulianny@gmail.com',
    telefono: '+58 412-8941313',
    rol: 'odontologo',
    sedeAsignada: 'ambas',
    pinAcceso: '2418',
    avatar: '/odontologos/od-julianny-rebolledo.jpg',
    activo: true,
    ultimoAcceso: 'Hoy • Sede La Victoria',
    permisosModulos: ['dashboard', 'agenda', 'coordinacion', 'odontograma', 'reserva'],
  },
  {
    id: 'usr-3',
    nombres: 'Od. Sandra Carreño',
    cedula: 'V-29.744.716',
    email: 'carrenosandra254@gmail.com',
    telefono: '+58 412-0396608',
    rol: 'odontologo',
    sedeAsignada: 'tovar',
    pinAcceso: '4716',
    avatar: '/odontologos/od-sandra-carreno.jpg',
    activo: true,
    ultimoAcceso: 'Hoy • Sede Colonia Tovar',
    permisosModulos: ['dashboard', 'agenda', 'coordinacion', 'odontograma', 'reserva'],
  },
  {
    id: 'usr-4',
    nombres: 'Hig. Karla Méndez',
    cedula: 'V-24.119.832',
    email: 'karla.mendez@odontosalud.ve',
    telefono: '+58 412-4419021',
    rol: 'higienista',
    sedeAsignada: 'victoria',
    pinAcceso: '9832',
    activo: true,
    ultimoAcceso: 'Ayer • Box 01',
    permisosModulos: ['dashboard', 'agenda', 'coordinacion', 'odontograma'],
  },
  {
    id: 'usr-6',
    nombres: 'Ing. Gobernanza SIGMA (SuperAdmin)',
    cedula: 'V-15.880.001',
    email: 'admin@odontosalud.ve',
    telefono: '+58 412-3445491',
    rol: 'superadmin',
    sedeAsignada: 'ambas',
    pinAcceso: '2026',
    activo: true,
    ultimoAcceso: 'Hoy • Telemetría Edge',
    permisosModulos: ['dashboard', 'agenda', 'coordinacion', 'odontograma', 'cobros', 'data', 'superadmin', 'reserva'],
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onNavigateTab }) => {
  const [usuarios, setUsuarios] = useState<UsuarioSistemaItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USUARIOS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return USUARIOS_DEFAULT;
  });

  const [sesionActivaId, setSesionActivaId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SESION_ACTIVA) || null;
    } catch {
      return null;
    }
  });

  const usuarioActivo = usuarios.find((u) => u.id === sesionActivaId) || null;

  const [identificador, setIdentificador] = useState('');
  const [pin, setPin] = useState('');
  const [mostrarPin, setMostrarPin] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState<{
    tipo: 'success' | 'error';
    texto: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Escuchar si hay usuarios actualizados en localStorage
  useEffect(() => {
    const handleStorage = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_USUARIOS);
        if (raw) setUsuarios(JSON.parse(raw));
        const active = localStorage.getItem(STORAGE_KEY_SESION_ACTIVA);
        setSesionActivaId(active || null);
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleValidarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeFeedback(null);
    setIsLoading(true);

    const cleanInput = identificador.trim().toLowerCase();
    const cleanCedula = identificador.replace(/[^0-9]/g, '');

    setTimeout(() => {
      const encontrado = usuarios.find((u) => {
        const matchEmail = u.email.toLowerCase() === cleanInput;
        const matchNombre = u.nombres.toLowerCase().includes(cleanInput) && cleanInput.length >= 4;
        const matchCedula =
          cleanCedula.length >= 5 && u.cedula.replace(/[^0-9]/g, '').includes(cleanCedula);
        return matchEmail || matchCedula || matchNombre;
      });

      if (!encontrado) {
        setIsLoading(false);
        setMensajeFeedback({
          tipo: 'error',
          texto: 'Usuario no registrado. Verifica la cédula o correo institucional ingresado.',
        });
        return;
      }

      if (!encontrado.activo) {
        setIsLoading(false);
        setMensajeFeedback({
          tipo: 'error',
          texto: `El acceso clínico para ${encontrado.nombres} se encuentra suspendido.`,
        });
        return;
      }

      if (encontrado.pinAcceso !== pin.trim()) {
        setIsLoading(false);
        setMensajeFeedback({
          tipo: 'error',
          texto: 'PIN o contraseña clínica incorrecta. Inténtalo de nuevo.',
        });
        return;
      }

      // Login exitoso
      setSesionActivaId(encontrado.id);
      localStorage.setItem(STORAGE_KEY_SESION_ACTIVA, encontrado.id);
      setIsLoading(false);
      setMensajeFeedback({
        tipo: 'success',
        texto: `¡Bienvenido(a), ${encontrado.nombres}! Credenciales validadas con éxito.`,
      });

      // Redirigir al cabo de 600ms
      setTimeout(() => {
        if (onNavigateTab) {
          onNavigateTab('dashboard');
        } else {
          window.location.hash = 'dashboard';
        }
      }, 700);
    }, 400);
  };

  const handleSeleccionarUsuarioRapido = (u: UsuarioSistemaItem) => {
    setIdentificador(u.cedula);
    setPin(u.pinAcceso);
    setMensajeFeedback({
      tipo: 'success',
      texto: `Credenciales de ${u.nombres} preparadas. Pulsa "Iniciar Sesión" para validar.`,
    });
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem(STORAGE_KEY_SESION_ACTIVA);
    setSesionActivaId(null);
    setMensajeFeedback({
      tipo: 'success',
      texto: 'Sesión finalizada de forma segura.',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Fondo estético con orbes y gradiente ambiental de AGENTS.md */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Cabecera de la Vista de Login */}
      <header className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <img
            src="/brand/logo-odontosalud-vertical.png"
            alt="Logo OdontoSalud La Victoria"
            className="w-11 h-11 sm:w-13 sm:h-13 object-contain drop-shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm sm:text-base text-white tracking-tight">
                OdontoSalud La Victoria
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                4.0 Cloudflare Edge
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tecnología SIGMA LABS • Sistema de Autenticación & Control RBAC
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => (onNavigateTab ? onNavigateTab('reserva') : (window.location.hash = 'reserva'))}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Ir al Portal de Reserva de Citas para Pacientes"
        >
          <span className="material-symbols-outlined text-[16px] text-emerald-400">event_available</span>
          <span className="hidden sm:inline">Portal Pacientes (Reserva)</span>
        </button>
      </header>

      {/* Contenedor Central: Panel de Validación de Credenciales */}
      <main className="relative z-10 w-full max-w-4xl mx-auto my-auto py-4 flex flex-col lg:flex-row items-stretch gap-6">
        {/* Columna Izquierda: Formulario Principal de Login */}
        <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">lock</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">
                  Acceso Seguro al Sistema
                </span>
                <h1 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                  Iniciar Sesión Clínica
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Ingresa tus credenciales autorizadas (cédula o correo) y tu PIN institucional para validar tu acceso en el borde global de Cloudflare.
            </p>

            {/* Formulario */}
            <form onSubmit={handleValidarLogin} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center justify-between">
                  <span>Cédula o Correo Institucional</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ej. V-14.376.191</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3.5 top-3">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="V-14.376.191 o mariadominguez1911@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-xs sm:text-sm font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5 flex items-center justify-between">
                  <span>PIN o Contraseña Clínica</span>
                  <span className="text-[10px] text-slate-400 font-normal">PIN de 4 dígitos</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3.5 top-3">
                    key
                  </span>
                  <input
                    type={mostrarPin ? 'text' : 'password'}
                    required
                    maxLength={16}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-xs sm:text-sm font-mono font-black text-white tracking-widest placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPin(!mostrarPin)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      {mostrarPin ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {mensajeFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                    mensajeFeedback.tipo === 'success'
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200'
                      : 'bg-rose-500/20 border border-rose-400/40 text-rose-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">
                      {mensajeFeedback.tipo === 'success' ? 'verified' : 'error'}
                    </span>
                    <span>{mensajeFeedback.texto}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMensajeFeedback(null)}
                    className="text-xs font-black opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display font-black text-sm shadow-lg shadow-emerald-950/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
                  {isLoading ? 'progress_activity' : 'login'}
                </span>
                <span>{isLoading ? 'Validando en Cloudflare Edge...' : 'Validar Credenciales & Entrar'}</span>
              </button>
            </form>
          </div>

          {/* Información de Protección y Soporte */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-400">shield</span>
              <span>Tokens Criptográficos SHA-256</span>
            </span>
            <span>Sede La Victoria & Colonia Tovar</span>
          </div>
        </div>

        {/* Columna Derecha: Sesión Actual o Selector Rápido Facultativo */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Si ya hay un usuario logueado */}
          {usuarioActivo ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-emerald-400/30 shadow-xl flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Sesión Clínica Activa</span>
                </span>

                <div className="flex items-center gap-3 mt-3">
                  {usuarioActivo.avatar ? (
                    <img
                      src={usuarioActivo.avatar}
                      alt={usuarioActivo.nombres}
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-400 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-2xl bg-emerald-600 text-white font-display font-black text-sm flex items-center justify-center shrink-0">
                      {usuarioActivo.nombres.replace(/^Dr[a]?\.\s*/i, '').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-display font-extrabold text-sm text-white truncate">
                      {usuarioActivo.nombres}
                    </h3>
                    <span className="text-[11px] text-emerald-300 font-bold block">
                      {ROLES_BADGES[usuarioActivo.rol]?.label || usuarioActivo.rol}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {usuarioActivo.cedula}
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-black/30 border border-white/10 text-[10px] text-slate-300 font-mono space-y-0.5">
                  <div>Sede: <strong className="text-white">{usuarioActivo.sedeAsignada === 'ambas' ? 'Ambas Sedes' : usuarioActivo.sedeAsignada === 'victoria' ? 'La Victoria' : 'Colonia Tovar'}</strong></div>
                  <div>Permisos: <strong className="text-emerald-400">{usuarioActivo.permisosModulos.length} módulos habilitados</strong></div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => (onNavigateTab ? onNavigateTab('dashboard') : (window.location.hash = 'dashboard'))}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  <span>Continuar a la Plataforma</span>
                </button>

                <button
                  type="button"
                  onClick={handleCerrarSesion}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">logout</span>
                  <span>Cerrar Sesión / Cambiar Usuario</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Selector de Acceso Rápido por Perfil (Entorno de Clínica) */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/15 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                Acceso Rápido Facultativo
              </span>
              <span className="text-[9px] text-emerald-400 font-mono">1 toque</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Toca tu perfil para precargar tus credenciales de forma inmediata en el consultorio:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {usuarios.map((u) => {
                const infoRol = ROLES_BADGES[u.rol] || ROLES_BADGES.odontologo;
                const isSelected = identificador === u.cedula;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSeleccionarUsuarioRapido(u)}
                    className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-500/25 border-emerald-400 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.nombres}
                          className="w-9 h-9 rounded-xl object-cover border border-white/20 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {u.nombres.replace(/^Dr[a]?\.\s*/i, '').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-white truncate block">
                          {u.nombres}
                        </span>
                        <span className="text-[10px] text-emerald-300 truncate block">
                          {infoRol.label}
                        </span>
                      </div>
                    </div>

                    <span className="material-symbols-outlined text-[17px] text-slate-400 shrink-0">
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Pie de Página Institucional */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <div>
          Copyright 2026 • <strong>OdontoSalud La Victoria</strong> — Venezolana de Proyectos SIGMA C.A.
        </div>
        <div className="flex items-center gap-3">
          <span>Sede Principal: C. C. Márquez del Toro</span>
          <span>•</span>
          <span>Sede Tovar: C. C. San Martín de Tours</span>
        </div>
      </footer>
    </div>
  );
};
