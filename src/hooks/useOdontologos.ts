import { useState, useEffect, useCallback } from 'react';
import { OdontologoItem, DiaSemanaClinico } from '../types/clinical';
import { ApiClient } from '../services/api';

export const LOCAL_STORAGE_ODONTOLOGOS_KEY = 'odontosalud_data_odontologos';

export const DIAS_SEMANA_CLINICOS: DiaSemanaClinico[] = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

export const INITIAL_ODONTOLOGOS: OdontologoItem[] = [
  {
    id: 'odo-1',
    nombres: 'Dra. María Alejandra Domínguez',
    cedula: 'V-16.482.910',
    cov: 'C.O.V. 24.891',
    especialidad: 'Directora Clínica • Odontología General & Estética',
    telefono: '+58 414-5550101',
    email: 'dra.dominguez@odontosalud.ve',
    sedeId: 'ambas',
    boxAsignado: 1,
    turno: 'Completo',
    porcentajeHonorarios: 50,
    estado: 'activo',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
    diasVictoria: ['LUN', 'MAR', 'MIÉ', 'JUE'],
    diasTovar: ['VIE', 'SÁB'],
  },
  {
    id: 'odo-julianny',
    nombres: 'Dra. Julianny Ramos',
    cedula: 'V-20.418.920',
    cov: 'C.O.V. 27.310',
    especialidad: 'Odontología Integral, Estética & Rehabilitación Oral',
    telefono: '+58 414-7782310',
    email: 'j.ramos@odontosalud.ve',
    sedeId: 'ambas',
    boxAsignado: 2,
    turno: 'Completo',
    porcentajeHonorarios: 45,
    estado: 'activo',
    avatar: 'https://images.unsplash.com/photo-1594824813637-4560767733a1?auto=format&fit=crop&w=150&q=80',
    diasVictoria: ['MAR', 'JUE', 'SÁB'],
    diasTovar: ['LUN', 'MIÉ', 'VIE'],
  },
  {
    id: 'odo-2',
    nombres: 'Dra. Carmen Elena Silva',
    cedula: 'V-18.329.110',
    cov: 'C.O.V. 19.450',
    especialidad: 'Ortodoncia & Ortopedia Dentofacial',
    telefono: '+58 412-8891234',
    email: 'c.silva@odontosalud.ve',
    sedeId: 'victoria',
    boxAsignado: 2,
    turno: 'Mañana',
    porcentajeHonorarios: 45,
    estado: 'activo',
    avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=150&q=80',
    diasVictoria: ['LUN', 'MIÉ', 'VIE'],
    diasTovar: [],
  },
  {
    id: 'odo-3',
    nombres: 'Dra. Valeria Hernández',
    cedula: 'V-21.054.672',
    cov: 'C.O.V. 22.108',
    especialidad: 'Endodoncia Avanzada & Microcirugía Apical',
    telefono: '+58 424-3349011',
    email: 'v.hernandez@odontosalud.ve',
    sedeId: 'victoria',
    boxAsignado: 1,
    turno: 'Tarde',
    porcentajeHonorarios: 45,
    estado: 'en_guardia',
    avatar: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=150&q=80',
    diasVictoria: ['MAR', 'JUE', 'SÁB'],
    diasTovar: [],
  },
];

export function normalizarDisponibilidadOdontologo(o: OdontologoItem): OdontologoItem {
  const nombreLower = (o.nombres || '').toLowerCase();
  const esMaria = nombreLower.includes('maría') || nombreLower.includes('maria') || nombreLower.includes('domínguez') || nombreLower.includes('dominguez');
  const esJulianny = nombreLower.includes('julianny');

  let diasVictoria = Array.isArray(o.diasVictoria) ? (o.diasVictoria.filter(Boolean) as DiaSemanaClinico[]) : undefined;
  let diasTovar = Array.isArray(o.diasTovar) ? (o.diasTovar.filter(Boolean) as DiaSemanaClinico[]) : undefined;

  if (!diasVictoria || (diasVictoria.length === 0 && (!diasTovar || diasTovar.length === 0))) {
    if (esMaria) {
      diasVictoria = ['LUN', 'MAR', 'MIÉ', 'JUE'];
      diasTovar = ['VIE', 'SÁB'];
    } else if (esJulianny) {
      diasVictoria = ['MAR', 'JUE', 'SÁB'];
      diasTovar = ['LUN', 'MIÉ', 'VIE'];
    } else if (o.sedeId === 'victoria') {
      diasVictoria = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
      diasTovar = [];
    } else if (o.sedeId === 'tovar') {
      diasVictoria = [];
      diasTovar = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    } else {
      // 'ambas'
      diasVictoria = ['LUN', 'MAR', 'MIÉ', 'JUE'];
      diasTovar = ['VIE', 'SÁB'];
    }
  } else {
    if (o.sedeId === 'victoria') {
      diasTovar = [];
    } else if (o.sedeId === 'tovar') {
      diasVictoria = [];
    }
  }

  return {
    ...o,
    sedeId: (esMaria || esJulianny) && (!o.sedeId || o.sedeId === 'ambas') ? 'ambas' : o.sedeId,
    diasVictoria: diasVictoria || [],
    diasTovar: diasTovar || [],
  };
}

export function normalizarListaOdontologos(lista: OdontologoItem[]): OdontologoItem[] {
  if (!Array.isArray(lista) || lista.length === 0) {
    return INITIAL_ODONTOLOGOS.map(normalizarDisponibilidadOdontologo);
  }
  return lista.map(normalizarDisponibilidadOdontologo);
}

export function useOdontologos() {
  const [odontologos, setOdontologos] = useState<OdontologoItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_ODONTOLOGOS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return normalizarListaOdontologos(parsed);
        }
      } catch (_) {}
    }
    return INITIAL_ODONTOLOGOS;
  });
  const [loading, setLoading] = useState(false);

  const recargarOdontologos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getControlData();
      if (data?.odontologos && Array.isArray(data.odontologos) && data.odontologos.length > 0) {
        const norm = normalizarListaOdontologos(data.odontologos);
        setOdontologos(norm);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_ODONTOLOGOS_KEY, JSON.stringify(norm));
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('Uso de odontólogos en caché local:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recargarOdontologos();

    // Sincronización reactiva entre pestañas y vistas al modificar la tabla en Data
    const handleUpdate = (e: any) => {
      if (e?.detail?.tipo === 'odontologos' && Array.isArray(e.detail.data)) {
        setOdontologos(e.detail.data.map(normalizarDisponibilidadOdontologo));
      } else {
        try {
          const saved = localStorage.getItem(LOCAL_STORAGE_ODONTOLOGOS_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setOdontologos(parsed.map(normalizarDisponibilidadOdontologo));
            }
          }
        } catch (_) {}
      }
    };

    window.addEventListener('odontosalud_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('odontosalud_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [recargarOdontologos]);

  return { odontologos, loading, recargarOdontologos };
}
