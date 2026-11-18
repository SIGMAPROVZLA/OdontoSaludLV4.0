import { UsuarioSistemaItem } from '../types/clinical';

export const STORAGE_KEY_USUARIOS = 'odontosalud_usuarios_auth_v1';
export const STORAGE_KEY_SESION_ACTIVA = 'odontosalud_sesion_activa_v1';
export const EVENT_SESION_ACTUALIZADA = 'odontosalud_sesion_updated';

export const AVATAR_FALLBACK_BY_CEDULA: Record<string, string> = {
  '14376191': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
  '29882418': 'https://images.unsplash.com/photo-1594824813637-4560767733a1?auto=format&fit=crop&w=150&q=80',
  '29744716': 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=150&q=80',
};

export function getInitials(nombres: string): string {
  const clean = (nombres || 'US')
    .replace(/^(Dra\.|Dr\.|Od\.|Hig\.|Ing\.)\s*/i, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'US';
}

export function sanitizeUserAvatar(avatar: string | undefined, cedula: string): string {
  if (avatar && (avatar.startsWith('data:image/') || avatar.startsWith('https://') || avatar.startsWith('http://'))) {
    return avatar;
  }
  // Evitar rutas locales inexistentes /odontologos/*.jpg que rompen la vista
  const cleanCed = (cedula || '').replace(/[^0-9]/g, '');
  return AVATAR_FALLBACK_BY_CEDULA[cleanCed] || '';
}

export function getActiveSessionUser(): UsuarioSistemaItem | null {
  if (typeof window === 'undefined') return null;
  try {
    const activeId = localStorage.getItem(STORAGE_KEY_SESION_ACTIVA);
    if (!activeId) return null;

    const rawUsers = localStorage.getItem(STORAGE_KEY_USUARIOS);
    if (!rawUsers) return null;

    const users: UsuarioSistemaItem[] = JSON.parse(rawUsers);
    if (!Array.isArray(users)) return null;

    const found = users.find((u) => u.id === activeId);
    if (!found) return null;

    // Buscar si tiene un avatar actualizado en #data (odontólogos / higienistas)
    const cleanCed = (found.cedula || '').replace(/[^0-9]/g, '');
    let resolvedAvatar = found.avatar;

    for (const key of ['odontosalud_data_odontologos_v1', 'odontosalud_data_odontologos', 'odontosalud_data_higienistas_v1']) {
      const rawStaff = localStorage.getItem(key);
      if (rawStaff) {
        const staff = JSON.parse(rawStaff);
        if (Array.isArray(staff)) {
          const match = staff.find((s: any) => String(s.cedula || '').replace(/[^0-9]/g, '') === cleanCed);
          if (match?.avatar) {
            resolvedAvatar = match.avatar;
            break;
          }
        }
      }
    }

    return {
      ...found,
      avatar: sanitizeUserAvatar(resolvedAvatar, found.cedula),
    };
  } catch {
    return null;
  }
}

export function emitSessionUpdated(userId: string | null): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_SESION_ACTUALIZADA, { detail: { userId } }));
}

function normalizeDoctorTokens(name: string): string[] {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(dra|dr|od|hig|ing)\.?\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

/**
 * SuperAdmin / Directora Clínica (Dra. María Alejandra) tiene control global
 * sobre todas las citas y sillones. Las demás doctoras solo editan sus citas asignadas.
 */
export function isGlobalAgendaManager(user: UsuarioSistemaItem | null): boolean {
  if (!user) return false;
  if (user.rol === 'superadmin' || user.rol === 'directora_clinica') return true;
  const norm = user.nombres
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return norm.includes('maria alejandra') || norm.includes('dominguez');
}

export function canEditDoctorCita(
  user: UsuarioSistemaItem | null,
  citaDoctorNombre: string
): boolean {
  if (isGlobalAgendaManager(user)) return true;
  if (!user) return false;
  const userTokens = normalizeDoctorTokens(user.nombres);
  const docTokens = normalizeDoctorTokens(citaDoctorNombre);
  if (userTokens.length === 0 || docTokens.length === 0) return false;
  if (userTokens[0] === docTokens[0]) return true;
  const overlap = userTokens.filter((t) => docTokens.includes(t));
  return overlap.length >= 2;
}
