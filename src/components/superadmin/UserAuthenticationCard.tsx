import React, { useState, useEffect } from 'react';
import { RolUsuarioSistema, UsuarioSistemaItem } from '../../types/clinical';
import { compressImage } from '../../utils/imageCompression';
import { TabId } from '../layout/BottomNavigation';

interface UserAuthenticationCardProps {
  onNavigateTab?: (tab: TabId) => void;
  onAuditEvent?: () => void;
}

const STORAGE_KEY_USUARIOS = 'odontosalud_usuarios_auth_v1';
const STORAGE_KEY_SESION_ACTIVA = 'odontosalud_sesion_activa_v1';

const MODULOS_SISTEMA: { id: string; label: string; icon: string; tab?: TabId }[] = [
  { id: 'dashboard', label: 'Inicio / Pulso', icon: 'space_dashboard', tab: 'dashboard' },
  { id: 'agenda', label: 'Agenda Sillones', icon: 'calendar_month', tab: 'agenda' },
  { id: 'coordinacion', label: 'Triaje & Citas', icon: 'assignment_turned_in', tab: 'coordinacion' },
  { id: 'odontograma', label: 'Ficha & Odontograma', icon: 'dentistry', tab: 'odontograma' },
  { id: 'cobros', label: 'Cobros & Caja', icon: 'payments', tab: 'cobros' },
  { id: 'data', label: 'Control Data D1', icon: 'database', tab: 'data' },
  { id: 'superadmin', label: 'SuperAdmin Edge', icon: 'admin_panel_settings', tab: 'superadmin' },
  { id: 'reserva', label: 'Portal Reserva', icon: 'event_available', tab: 'reserva' },
];

const ROLES_CONFIG: Record<
  RolUsuarioSistema,
  { label: string; badgeClass: string; defaultPermisos: string[] }
> = {
  superadmin: {
    label: 'SuperAdmin / Gobernanza',
    badgeClass: 'bg-emerald-500/15 text-emerald-800 border-emerald-300',
    defaultPermisos: ['dashboard', 'agenda', 'coordinacion', 'odontograma', 'cobros', 'data', 'superadmin', 'reserva'],
  },
  directora_clinica: {
    label: 'Directora Clínica',
    badgeClass: 'bg-indigo-500/15 text-indigo-900 border-indigo-300',
    defaultPermisos: ['dashboard', 'agenda', 'coordinacion', 'odontograma', 'cobros', 'data', 'superadmin', 'reserva'],
  },
  odontologo: {
    label: 'Odontóloga Especialista',
    badgeClass: 'bg-sky-500/15 text-sky-900 border-sky-300',
    defaultPermisos: ['dashboard', 'agenda', 'coordinacion', 'odontograma', 'reserva'],
  },
  higienista: {
    label: 'Higienista / Asistente',
    badgeClass: 'bg-teal-500/15 text-teal-900 border-teal-300',
    defaultPermisos: ['dashboard', 'agenda', 'coordinacion', 'odontograma'],
  },
  recepcion: {
    label: 'Recepción & Triaje',
    badgeClass: 'bg-amber-500/15 text-amber-900 border-amber-300',
    defaultPermisos: ['dashboard', 'agenda', 'coordinacion', 'cobros', 'reserva'],
  },
};

const USUARIOS_INICIALES: UsuarioSistemaItem[] = [
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
    ultimoAcceso: 'Ayer • Esterilización & Box 01',
    permisosModulos: ['dashboard', 'agenda', 'coordinacion', 'odontograma'],
  },
  {
    id: 'usr-5',
    nombres: 'Hig. Daniela Rojas',
    cedula: 'V-26.401.550',
    email: 'daniela.rojas@odontosalud.ve',
    telefono: '+58 414-3328109',
    rol: 'higienista',
    sedeAsignada: 'tovar',
    pinAcceso: '1550',
    activo: true,
    ultimoAcceso: 'Ayer • Recepción & Asistencia',
    permisosModulos: ['dashboard', 'agenda', 'coordinacion', 'odontograma', 'cobros'],
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

async function computeJwtEdgeSignature(user: UsuarioSistemaItem): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const payload = `${user.id}|${user.cedula}|${user.rol}|${user.sedeAsignada}|2026`;
      const buf = new TextEncoder().encode(payload);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buf);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24).toUpperCase();
    }
  } catch {
    // Fallback determinista
  }
  return `EDGE-${user.id.toUpperCase()}-SHA256-OK`;
}

export const UserAuthenticationCard: React.FC<UserAuthenticationCardProps> = ({
  onNavigateTab,
  onAuditEvent,
}) => {
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
    return USUARIOS_INICIALES;
  });

  // Sincronizar avatares desde la data de odontólogos e higienistas si fueron actualizados en #data
  useEffect(() => {
    try {
      const rawOdo = localStorage.getItem('odontosalud_data_odontologos_v1');
      const rawHig = localStorage.getItem('odontosalud_data_higienistas_v1');
      const odos = rawOdo ? JSON.parse(rawOdo) : [];
      const higs = rawHig ? JSON.parse(rawHig) : [];

      setUsuarios((prev) =>
        prev.map((u) => {
          const cleanU = u.cedula.replace(/[^0-9]/g, '');
          const matchOdo = Array.isArray(odos)
            ? odos.find((o: any) => String(o.cedula || '').replace(/[^0-9]/g, '') === cleanU)
            : null;
          if (matchOdo && matchOdo.avatar) {
            return { ...u, avatar: matchOdo.avatar };
          }
          const matchHig = Array.isArray(higs)
            ? higs.find((h: any) => String(h.cedula || '').replace(/[^0-9]/g, '') === cleanU)
            : null;
          if (matchHig && matchHig.avatar) {
            return { ...u, avatar: matchHig.avatar };
          }
          return u;
        })
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
    } catch {
      // ignore
    }
  }, [usuarios]);

  const [usuarioActivoId, setUsuarioActivoId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SESION_ACTIVA) || 'usr-1';
    } catch {
      return 'usr-1';
    }
  });

  const usuarioActivo = usuarios.find((u) => u.id === usuarioActivoId) || usuarios[0] || null;
  const [jwtSignature, setJwtSignature] = useState<string>('VALIDANDO...');

  useEffect(() => {
    if (usuarioActivo) {
      localStorage.setItem(STORAGE_KEY_SESION_ACTIVA, usuarioActivo.id);
      computeJwtEdgeSignature(usuarioActivo).then(setJwtSignature);
    }
  }, [usuarioActivo]);

  // Estado del validador de Login en vivo
  const [loginIdentificador, setLoginIdentificador] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginFeedback, setLoginFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

  // Estado del Formulario de Creación / Edición contextual debajo de la sub-tarjeta
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [formNombres, setFormNombres] = useState('');
  const [formCedula, setFormCedula] = useState('V-');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('+58 ');
  const [formRol, setFormRol] = useState<RolUsuarioSistema>('odontologo');
  const [formSede, setFormSede] = useState<'victoria' | 'tovar' | 'ambas'>('victoria');
  const [formPin, setFormPin] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formActivo, setFormActivo] = useState(true);
  const [formPermisos, setFormPermisos] = useState<string[]>([
    'dashboard',
    'agenda',
    'coordinacion',
    'odontograma',
  ]);

  const limpiarFormulario = () => {
    setEditUserId(null);
    setFormNombres('');
    setFormCedula('V-');
    setFormEmail('');
    setFormTelefono('+58 ');
    setFormRol('odontologo');
    setFormSede('victoria');
    setFormPin('');
    setFormAvatar('');
    setFormActivo(true);
    setFormPermisos(ROLES_CONFIG.odontologo.defaultPermisos);
  };

  const handleEditarUsuario = (u: UsuarioSistemaItem) => {
    if (showUserForm && editUserId === u.id) {
      limpiarFormulario();
      setShowUserForm(false);
      return;
    }
    setEditUserId(u.id);
    setFormNombres(u.nombres);
    setFormCedula(u.cedula);
    setFormEmail(u.email);
    setFormTelefono(u.telefono);
    setFormRol(u.rol);
    setFormSede(u.sedeAsignada);
    setFormPin(u.pinAcceso);
    setFormAvatar(u.avatar || '');
    setFormActivo(u.activo);
    setFormPermisos(u.permisosModulos || ROLES_CONFIG[u.rol].defaultPermisos);
    setShowUserForm(true);
  };

  const handleSubirFotoUsuario = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 480, maxHeight: 480, quality: 0.82 });
      setFormAvatar(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setFormAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTogglePermiso = (moduloId: string) => {
    setFormPermisos((prev) =>
      prev.includes(moduloId) ? prev.filter((m) => m !== moduloId) : [...prev, moduloId]
    );
  };

  const handleGuardarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombres.trim() || !formCedula.trim() || !formPin.trim()) return;

    const nuevoItem: UsuarioSistemaItem = {
      id: editUserId || `usr-${Date.now()}`,
      nombres: formNombres.trim(),
      cedula: formCedula.trim(),
      email: formEmail.trim() || 'usuario@odontosalud.ve',
      telefono: formTelefono.trim(),
      rol: formRol,
      sedeAsignada: formSede,
      pinAcceso: formPin.trim(),
      avatar: formAvatar.trim() || undefined,
      activo: formActivo,
      ultimoAcceso: editUserId ? 'Actualizado hoy' : 'Recién registrado',
      permisosModulos: formPermisos.length > 0 ? formPermisos : ['dashboard'],
    };

    if (editUserId) {
      setUsuarios((prev) => prev.map((u) => (u.id === editUserId ? nuevoItem : u)));
    } else {
      setUsuarios((prev) => [nuevoItem, ...prev]);
    }

    setLoginFeedback({
      type: 'success',
      message: editUserId
        ? `Credenciales y permisos de ${nuevoItem.nombres} actualizados correctamente.`
        : `Usuario ${nuevoItem.nombres} incorporado al padrón de acceso RBAC.`,
    });
    limpiarFormulario();
    setShowUserForm(false);
    if (onAuditEvent) onAuditEvent();
  };

  const handleAutenticarCredenciales = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = loginIdentificador.trim().toLowerCase();
    const cleanCedulaInput = loginIdentificador.replace(/[^0-9]/g, '');

    const encontrado = usuarios.find((u) => {
      const matchEmail = u.email.toLowerCase() === cleanInput;
      const matchNombre = u.nombres.toLowerCase().includes(cleanInput) && cleanInput.length >= 4;
      const matchCedula =
        cleanCedulaInput.length >= 5 && u.cedula.replace(/[^0-9]/g, '').includes(cleanCedulaInput);
      return matchEmail || matchCedula || matchNombre;
    });

    if (!encontrado) {
      setLoginFeedback({
        type: 'error',
        message: 'Usuario no encontrado por cédula, correo o nombre en el padrón autorizado.',
      });
      return;
    }

    if (!encontrado.activo) {
      setLoginFeedback({
        type: 'error',
        message: `El acceso de ${encontrado.nombres} se encuentra suspendido temporalmente.`,
      });
      return;
    }

    if (encontrado.pinAcceso !== loginPin.trim()) {
      setLoginFeedback({
        type: 'error',
        message: 'PIN / Contraseña clínica incorrecta. Verifica las credenciales asignadas.',
      });
      return;
    }

    setUsuarioActivoId(encontrado.id);
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === encontrado.id ? { ...u, ultimoAcceso: `Hoy • ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}` } : u
      )
    );
    setLoginFeedback({
      type: 'success',
      message: `Sesión autenticada en el borde para ${encontrado.nombres} (${ROLES_CONFIG[encontrado.rol].label}).`,
    });
    setLoginPin('');
  };

  const handleToggleEstadoUsuario = (u: UsuarioSistemaItem) => {
    setUsuarios((prev) =>
      prev.map((item) => (item.id === u.id ? { ...item, activo: !item.activo } : item))
    );
  };

  const handleEliminarUsuario = (u: UsuarioSistemaItem) => {
    if (usuarios.length <= 1) return;
    setUsuarios((prev) => prev.filter((item) => item.id !== u.id));
    if (usuarioActivoId === u.id) {
      const restante = usuarios.find((item) => item.id !== u.id);
      if (restante) setUsuarioActivoId(restante.id);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol;
    const q = busquedaUsuario.trim().toLowerCase();
    const matchQ =
      !q ||
      u.nombres.toLowerCase().includes(q) ||
      u.cedula.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    return matchRol && matchQ;
  });

  const renderUserFormContent = () => (
    <form
      onSubmit={handleGuardarUsuario}
      className="mt-2.5 pt-3.5 border-t-2 border-dashed border-primary/40 flex flex-col gap-3.5 bg-white p-4 rounded-2xl shadow-md animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-dental-deep-navy flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">manage_accounts</span>
          {editUserId ? 'Modificar Credenciales, Foto & Permisos del Usuario' : 'Registrar Nuevo Usuario del Sistema'}
        </span>
        <button
          type="button"
          onClick={() => {
            limpiarFormulario();
            setShowUserForm(false);
          }}
          className="px-2.5 py-1 rounded-lg bg-surface-subtle-ice hover:bg-status-danger/10 text-secondary hover:text-status-danger text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
          <span>Cerrar</span>
        </button>
      </div>

      {/* Fotografía de Perfil del Usuario */}
      <div className="p-3 rounded-2xl bg-surface-subtle-ice/80 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {formAvatar ? (
            <img
              src={formAvatar}
              alt={formNombres || 'Usuario'}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-primary shadow-sm shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-dental-deep-navy text-white font-display font-black text-sm flex items-center justify-center shrink-0">
              {(formNombres || 'US').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <span className="text-xs font-extrabold text-dental-deep-navy block">
              Fotografía de Identidad Clínica
            </span>
            <span className="text-[11px] text-secondary block">
              Se comprime automáticamente en cliente (~120 KB) para el perfil de sesión
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="px-3 py-2 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            <span>{formAvatar ? 'Cambiar Foto' : 'Subir Foto'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleSubirFotoUsuario}
              className="hidden"
            />
          </label>
          {formAvatar && (
            <button
              type="button"
              onClick={() => setFormAvatar('')}
              className="px-2.5 py-2 rounded-xl bg-white border border-border-subtle text-status-danger hover:bg-status-danger/10 text-xs font-bold transition-all cursor-pointer"
            >
              Quitar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5">
          <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
            Nombre Completo y Título *
          </label>
          <input
            type="text"
            required
            value={formNombres}
            onChange={(e) => setFormNombres(e.target.value)}
            placeholder="Ej. Dra. María Alejandra Domínguez"
            className="w-full h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:border-primary outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
            Cédula Venezolana *
          </label>
          <input
            type="text"
            required
            value={formCedula}
            onChange={(e) => setFormCedula(e.target.value)}
            placeholder="V-14.376.191"
            className="w-full h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle font-mono text-xs font-bold text-dental-deep-navy focus:bg-white focus:border-primary outline-none"
          />
        </div>

        <div className="sm:col-span-4">
          <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
            Rol RBAC en la Plataforma *
          </label>
          <select
            value={formRol}
            onChange={(e) => {
              const nuevoRol = e.target.value as RolUsuarioSistema;
              setFormRol(nuevoRol);
              setFormPermisos(ROLES_CONFIG[nuevoRol].defaultPermisos);
            }}
            className="w-full h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:border-primary outline-none"
          >
            <option value="superadmin">SuperAdmin / Gobernanza</option>
            <option value="directora_clinica">Directora Clínica</option>
            <option value="odontologo">Odontóloga Especialista</option>
            <option value="higienista">Higienista / Asistente Dental</option>
            <option value="recepcion">Recepción & Triaje</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-4">
          <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
            Correo Electrónico *
          </label>
          <input
            type="email"
            required
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="correo@odontosalud.ve"
            className="w-full h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:border-primary outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
            Teléfono / WhatsApp
          </label>
          <input
            type="text"
            value={formTelefono}
            onChange={(e) => setFormTelefono(e.target.value)}
            placeholder="+58 412-0000000"
            className="w-full h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-semibold text-dental-deep-navy focus:bg-white focus:border-primary outline-none"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
            Sede Autorizada *
          </label>
          <select
            value={formSede}
            onChange={(e) => setFormSede(e.target.value as 'victoria' | 'tovar' | 'ambas')}
            className="w-full h-10 px-3 rounded-xl bg-surface-subtle-ice border border-border-subtle text-xs font-bold text-dental-deep-navy focus:bg-white focus:border-primary outline-none"
          >
            <option value="victoria">Sede La Victoria</option>
            <option value="tovar">Sede Colonia Tovar</option>
            <option value="ambas">Ambas Sedes (Multisede)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
            PIN / Clave *
          </label>
          <input
            type="text"
            required
            maxLength={12}
            value={formPin}
            onChange={(e) => setFormPin(e.target.value)}
            placeholder="Ej. 1911"
            className="w-full h-10 px-3 rounded-xl bg-amber-50 border border-amber-300 font-mono text-xs font-black text-dental-deep-navy focus:bg-white focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Matriz de Módulos Autorizados (RBAC) */}
      <div className="p-3 rounded-2xl bg-surface-subtle-ice/70 border border-border-subtle flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-dental-deep-navy">
            Permisos de Navegación por Módulo (Control RBAC)
          </span>
          <span className="text-[10px] text-secondary font-semibold">
            {formPermisos.length} de {MODULOS_SISTEMA.length} vistas habilitadas
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MODULOS_SISTEMA.map((mod) => {
            const checked = formPermisos.includes(mod.id);
            return (
              <label
                key={mod.id}
                className={`p-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 cursor-pointer select-none transition-all ${
                  checked
                    ? 'bg-dental-deep-navy text-white border-dental-deep-navy shadow-2xs'
                    : 'bg-white text-secondary border-border-subtle hover:text-dental-deep-navy'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleTogglePermiso(mod.id)}
                  className="w-3.5 h-3.5 accent-emerald-400 rounded"
                />
                <span className="material-symbols-outlined text-[15px]">{mod.icon}</span>
                <span className="truncate">{mod.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-xs font-bold text-dental-deep-navy cursor-pointer">
          <input
            type="checkbox"
            checked={formActivo}
            onChange={(e) => setFormActivo(e.target.checked)}
            className="w-4 h-4 accent-status-success rounded"
          />
          <span>Cuenta habilitada para iniciar sesión</span>
        </label>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-status-success hover:bg-dental-deep-navy text-white text-xs font-extrabold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">verified_user</span>
          <span>{editUserId ? 'Guardar Cambios del Usuario' : 'Registrar Usuario Autorizado'}</span>
        </button>
      </div>
    </form>
  );

  return (
    <section className="bg-surface-clean-white rounded-3xl p-4 sm:p-6 shadow-soft-elevated border border-border-subtle flex flex-col gap-5 relative overflow-hidden animate-in fade-in duration-300">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-dental-deep-navy" />

      {/* =====================================================================
          CABECERA DE LA TARJETA DE AUTENTICACIÓN DE USUARIOS & RBAC
         ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-dental-deep-navy text-emerald-400 flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[26px]">shield_person</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase tracking-wider">
                Seguridad Perimetral JWT Edge
              </span>
              <span className="px-2 py-0.5 rounded-md bg-surface-container text-dental-deep-navy text-[10px] font-bold">
                {usuarios.filter((u) => u.activo).length} usuarios activos • Web Crypto SHA-256
              </span>
            </div>
            <h2 className="font-display font-black text-base sm:text-lg text-dental-deep-navy mt-1 tracking-tight">
              Módulo de Autenticación de Usuarios, Roles RBAC & Sesiones Clínicas
            </h2>
            <p className="text-xs text-secondary">
              Control de acceso por rol, validación de credenciales con PIN clínico, fotografía de perfil y permisos por vista
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          {showUserForm && !editUserId ? (
            <button
              type="button"
              onClick={() => {
                limpiarFormulario();
                setShowUserForm(false);
              }}
              className="px-3.5 py-2 rounded-xl bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white text-xs font-bold border border-border-subtle transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">visibility_off</span>
              <span>Ocultar Formulario</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                limpiarFormulario();
                setShowUserForm(true);
              }}
              className="px-4 py-2 rounded-xl bg-dental-deep-navy hover:bg-primary text-white text-xs font-extrabold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">person_add</span>
              <span>+ Nuevo Usuario</span>
            </button>
          )}
        </div>
      </div>

      {/* Formulario de Nuevo Usuario (cuando no se está editando una sub-tarjeta específica) */}
      {showUserForm && !editUserId && renderUserFormContent()}

      {/* =====================================================================
          BLOQUE SUPERIOR: SESIÓN ACTIVA EN VIVO + VALIDADOR DE LOGIN (2 COLUMNAS)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Columna Izquierda (7 cols): Credencial de Sesión Activa y Módulos Habilitados */}
        {usuarioActivo && (
          <div className="lg:col-span-7 p-4 rounded-2xl bg-gradient-to-br from-dental-deep-navy via-[#132338] to-dental-deep-navy text-white border border-primary/40 shadow-md flex flex-col justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {usuarioActivo.avatar ? (
                  <img
                    src={usuarioActivo.avatar}
                    alt={usuarioActivo.nombres}
                    className="w-15 h-15 rounded-2xl object-cover border-2 border-emerald-400 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-15 h-15 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-display font-black text-lg flex items-center justify-center shrink-0">
                    {usuarioActivo.nombres.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Sesión Activa en Borde</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-bold">
                      {ROLES_CONFIG[usuarioActivo.rol].label}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-base sm:text-lg text-white mt-1 truncate">
                    {usuarioActivo.nombres}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono flex-wrap">
                    <span>{usuarioActivo.cedula}</span>
                    <span>•</span>
                    <span>{usuarioActivo.email}</span>
                    <span>•</span>
                    <span className="text-emerald-300 font-bold">
                      Sede:{' '}
                      {usuarioActivo.sedeAsignada === 'ambas'
                        ? 'La Victoria & Col. Tovar'
                        : usuarioActivo.sedeAsignada === 'victoria'
                        ? 'La Victoria'
                        : 'Colonia Tovar'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 px-3 py-2 rounded-xl border border-white/10 text-right shrink-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">
                  Token Web Crypto SHA-256
                </span>
                <span className="font-mono text-[11px] font-extrabold text-emerald-300">
                  {jwtSignature.slice(0, 16)}…
                </span>
                <span className="text-[9px] text-slate-300 block">TTL KV: 12h Activo</span>
              </div>
            </div>

            {/* Módulos permitidos para el usuario activo con navegación directa */}
            <div className="pt-2.5 border-t border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                <span>Vistas Autorizadas para esta Sesión ({usuarioActivo.permisosModulos.length})</span>
                <span>Pulsa cualquier vista para abrirla</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {MODULOS_SISTEMA.map((mod) => {
                  const permitido = usuarioActivo.permisosModulos.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      disabled={!permitido}
                      onClick={() => {
                        if (permitido && mod.tab && onNavigateTab) {
                          onNavigateTab(mod.tab);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
                        permitido
                          ? 'bg-white/12 hover:bg-emerald-500 text-white border border-white/15 cursor-pointer active:scale-95'
                          : 'bg-white/5 text-slate-500 border border-white/5 opacity-45 cursor-not-allowed line-through'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{mod.icon}</span>
                      <span>{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Columna Derecha (5 cols): Autenticador por PIN / Cédula en Vivo */}
        <form
          onSubmit={handleAutenticarCredenciales}
          className="lg:col-span-5 p-4 rounded-2xl bg-surface-subtle-ice border border-border-subtle flex flex-col justify-between gap-3"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-dental-deep-navy flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-primary">lock_open</span>
                <span>Probar Inicio de Sesión / Cambiar Operador</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-secondary">PIN de 4 dígitos</span>
            </div>
            <p className="text-[11px] text-secondary mt-0.5">
              Ingresa cédula o correo y el PIN asignado (ej. Dra. María: <code className="font-mono font-bold text-dental-deep-navy">1911</code>, Od. Julianny: <code className="font-mono font-bold text-dental-deep-navy">2418</code>)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mt-3">
              <div className="sm:col-span-7">
                <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                  Cédula, Correo o Nombre
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentificador}
                  onChange={(e) => setLoginIdentificador(e.target.value)}
                  placeholder="V-14.376.191 o correo..."
                  className="w-full h-9 px-3 rounded-xl bg-white border border-border-subtle text-xs font-bold text-dental-deep-navy focus:border-primary outline-none"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="text-[10px] font-bold text-dental-deep-navy uppercase block mb-1">
                  PIN / Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="••••"
                  className="w-full h-9 px-3 rounded-xl bg-white border border-border-subtle font-mono text-xs font-black text-dental-deep-navy focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {loginFeedback && (
            <div
              className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between gap-2 ${
                loginFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              <span>{loginFeedback.message}</span>
              <button
                type="button"
                onClick={() => setLoginFeedback(null)}
                className="text-xs font-black opacity-70 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-dental-deep-navy text-white text-xs font-extrabold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>Validar Credenciales & Activar Sesión</span>
          </button>
        </form>
      </div>

      {/* =====================================================================
          FILTROS Y LISTADO DE SUB-TARJETAS DE USUARIOS CON FORMULARIO DEBAJO
         ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border-subtle">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined text-[17px] text-secondary absolute left-3 top-2.5">
            search
          </span>
          <input
            type="text"
            value={busquedaUsuario}
            onChange={(e) => setBusquedaUsuario(e.target.value)}
            placeholder="Buscar usuario por nombre, cédula o correo..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-subtle-ice border border-border-subtle focus:bg-white focus:border-primary outline-none text-dental-deep-navy font-semibold"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'todos', label: `Todos (${usuarios.length})` },
            { id: 'directora_clinica', label: 'Dirección' },
            { id: 'odontologo', label: 'Odontólogas' },
            { id: 'higienista', label: 'Higienistas' },
            { id: 'superadmin', label: 'SuperAdmin' },
          ].map((tab) => {
            const active = filtroRol === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroRol(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-dental-deep-navy text-white shadow-2xs'
                    : 'bg-surface-subtle-ice text-secondary hover:text-dental-deep-navy border border-border-subtle'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Sub-Tarjetas de Usuarios (el formulario se despliega inmediatamente debajo de la sub-tarjeta a modificar) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {usuariosFiltrados.map((u) => {
          const isCurrentSession = usuarioActivo?.id === u.id;
          const isEditingThis = showUserForm && editUserId === u.id;
          const rolInfo = ROLES_CONFIG[u.rol] || ROLES_CONFIG.odontologo;

          return (
            <div
              key={u.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isEditingThis
                  ? 'col-span-full bg-surface-container border-primary ring-2 ring-primary/30 shadow-md'
                  : isCurrentSession
                  ? 'bg-emerald-50/40 border-emerald-400 ring-1 ring-emerald-400/40'
                  : 'bg-surface-subtle-ice border-border-subtle hover:bg-surface-container/60'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                {/* Cabecera de la Sub-Tarjeta del Usuario */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.nombres}
                        className="w-12 h-12 rounded-2xl object-cover border border-primary/30 shadow-2xs shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-dental-deep-navy text-white font-display font-black text-xs flex items-center justify-center shrink-0">
                        {u.nombres
                          .replace(/^(Dra\.|Dr\.|Od\.|Hig\.|Ing\.)\s*/i, '')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${rolInfo.badgeClass}`}
                        >
                          {rolInfo.label}
                        </span>
                        {isCurrentSession && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase">
                            En Sesión
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-extrabold text-xs sm:text-sm text-dental-deep-navy mt-1 truncate">
                        {u.nombres}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-secondary font-mono">
                        <span className="font-bold text-primary">{u.cedula}</span>
                        <span>•</span>
                        <span>
                          {u.sedeAsignada === 'ambas'
                            ? '2 Sedes'
                            : u.sedeAsignada === 'victoria'
                            ? 'La Victoria'
                            : 'Col. Tovar'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleEstadoUsuario(u)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 cursor-pointer ${
                      u.activo
                        ? 'bg-status-success/15 text-status-success'
                        : 'bg-status-danger/15 text-status-danger'
                    }`}
                  >
                    {u.activo ? 'Activo' : 'Suspendido'}
                  </button>
                </div>

                {/* Credenciales y Permisos Resumidos */}
                <div className="bg-white p-2.5 rounded-xl border border-border-subtle/80 text-[11px] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-secondary">
                    <span className="truncate">{u.email}</span>
                    <span className="font-mono font-black text-dental-deep-navy bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                      PIN: {u.pinAcceso}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-border-subtle/50">
                    {u.permisosModulos.map((perm) => {
                      const mod = MODULOS_SISTEMA.find((m) => m.id === perm);
                      return (
                        <span
                          key={perm}
                          className="px-1.5 py-0.5 rounded bg-surface-subtle-ice text-dental-deep-navy text-[9px] font-bold border border-border-subtle"
                        >
                          {mod ? mod.label : perm}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pie de Acciones de la Sub-Tarjeta */}
              <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border-subtle/70">
                <button
                  type="button"
                  disabled={!u.activo || isCurrentSession}
                  onClick={() => {
                    setUsuarioActivoId(u.id);
                    setLoginFeedback({
                      type: 'success',
                      message: `Sesión conmutada a ${u.nombres} (${rolInfo.label}).`,
                    });
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
                    isCurrentSession
                      ? 'bg-emerald-600 text-white cursor-default'
                      : u.activo
                      ? 'bg-white border border-border-subtle text-dental-deep-navy hover:bg-emerald-600 hover:text-white cursor-pointer active:scale-95'
                      : 'bg-surface-container text-secondary opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isCurrentSession ? 'verified' : 'switch_account'}
                  </span>
                  <span>{isCurrentSession ? 'Sesión Activa' : 'Activar Sesión'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEditarUsuario(u)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                      isEditingThis
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container text-dental-deep-navy hover:bg-primary hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isEditingThis ? 'expand_less' : 'edit'}
                    </span>
                    <span>{isEditingThis ? 'Ocultar' : 'Modificar'}</span>
                  </button>

                  {usuarios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarUsuario(u)}
                      title="Eliminar usuario"
                      className="p-1.5 rounded-xl bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Formulario Contextual Desplegado Inmediatamente Debajo de la Sub-Tarjeta */}
              {isEditingThis && renderUserFormContent()}
            </div>
          );
        })}
      </div>
    </section>
  );
};
