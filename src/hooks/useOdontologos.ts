import { useState, useEffect, useCallback } from 'react';
import { OdontologoItem } from '../types/clinical';
import { ApiClient } from '../services/api';

export const LOCAL_STORAGE_ODONTOLOGOS_KEY = 'odontosalud_data_odontologos';

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
  },
  {
    id: 'odo-3',
    nombres: 'Dra. Valeria Hernández',
    cedula: 'V-21.054.672',
    cov: 'C.O.V. 22.108',
    especialidad: 'Endodoncia Avanzada & Microcirugía Apical',
    telefono: '+58 424-3349011',
    email: 'v.hernandez@odontosalud.ve',
    sedeId: 'ambas',
    boxAsignado: 1,
    turno: 'Tarde',
    porcentajeHonorarios: 45,
    estado: 'en_guardia',
  },
  {
    id: 'odo-4',
    nombres: 'Dra. Andrea Morales',
    cedula: 'V-23.891.405',
    cov: 'C.O.V. 25.334',
    especialidad: 'Periodoncia, Prótesis & Cirugía Bucal',
    telefono: '+58 414-9988112',
    email: 'a.morales@odontosalud.ve',
    sedeId: 'ambas',
    boxAsignado: 2,
    turno: 'Completo',
    porcentajeHonorarios: 40,
    estado: 'activo',
  },
];

export function useOdontologos() {
  const [odontologos, setOdontologos] = useState<OdontologoItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_ODONTOLOGOS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
        setOdontologos(data.odontologos);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_ODONTOLOGOS_KEY, JSON.stringify(data.odontologos));
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
        setOdontologos(e.detail.data);
      } else {
        try {
          const saved = localStorage.getItem(LOCAL_STORAGE_ODONTOLOGOS_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) setOdontologos(parsed);
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
