import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SedeId, SedeInfo } from '../types/clinical';
import { ApiClient } from '../services/api';

export const SEDES_DEFAULT: Record<SedeId, SedeInfo> = {
  victoria: {
    id: 'victoria',
    nombre: 'OdontoSalud La Victoria',
    subtitulo: 'Sede Principal • Boxes 1 y 2 & Cirugía RVG',
    ciudad: 'La Victoria',
    estadoVzla: 'Estado Aragua',
    direccion: 'C. C. Márquez del Toro, Planta Baja, Local 18, La Victoria, Aragua',
    googleMapsUrl: 'https://maps.google.com/?q=La+Victoria+Aragua+OdontoSalud',
    telefono: '+58 244-3221144',
    whatsapp: '+58 412-8365687',
    email: 'Clinica@OdontosaludLV.com',
    horarioApertura: '08:00',
    horarioCierre: '17:00',
    turnoManana: '08:00 - 12:00',
    turnoTarde: '13:00 - 17:00',
    diasAtencion: 'Lunes a Sábado',
    totalBoxes: 2,
    boxes: [
      {
        numero: 1,
        nombre: 'Box 01 (Principal / Rx)',
        especialidad: 'Operatoria, Diagnóstico & Radiología RVG',
        doctorDefault: 'Dra. María Alejandra Domínguez',
      },
      {
        numero: 2,
        nombre: 'Box 02 (Ortodoncia & Integral)',
        especialidad: 'Ortodoncia, Prótesis & Estética',
        doctorDefault: 'Dra. Carmen Elena Silva',
      },
    ],
    instagramUrl: 'https://instagram.com/odontosaludlv',
    facebookUrl: 'https://facebook.com/odontosaludlv',
    tiktokUrl: 'https://tiktok.com/@odontosaludlv',
    webUrl: 'https://odontosaludlv.com',
  },
  tovar: {
    id: 'tovar',
    nombre: 'OdontoSalud La Colonia Tovar',
    subtitulo: 'Sucursal • Box Clínico & Atención Integral',
    ciudad: 'Colonia Tovar',
    estadoVzla: 'Estado Aragua',
    direccion: 'Casco Central, Av. Codazzi, C. C San Martín de Tours, Planta Alta, Local N° 7',
    googleMapsUrl: 'https://maps.google.com/?q=Colonia+Tovar+OdontoSalud',
    telefono: '+58 244-9876543',
    whatsapp: '+58 414-7654321',
    email: 'Clinica@OdontosaludLV.com',
    horarioApertura: '08:30',
    horarioCierre: '16:00',
    turnoManana: '08:30 - 12:00',
    turnoTarde: '13:00 - 16:00',
    diasAtencion: 'Lunes a Viernes',
    totalBoxes: 1,
    boxes: [
      {
        numero: 1,
        nombre: 'Box 01 (Atención Integral)',
        especialidad: 'Odontología General, Prótesis & Operatoria',
        doctorDefault: 'Dra. María Alejandra Domínguez',
      },
    ],
    instagramUrl: 'https://instagram.com/odontosaludtovar',
    facebookUrl: 'https://facebook.com/odontosaludtovar',
    tiktokUrl: 'https://tiktok.com/@odontosaludtovar',
    webUrl: 'https://odontosaludlv.com',
  },
};

export const SEDES_DISPONIBLES = SEDES_DEFAULT;

interface SedeContextType {
  sedeActiva: SedeInfo;
  sedeId: SedeId;
  sedesDisponibles: Record<SedeId, SedeInfo>;
  cambiarSede: (id: SedeId) => void;
  alternarSede: () => void;
  actualizarConfigSede: (id: SedeId, config: Partial<SedeInfo>) => Promise<{ success: boolean; message?: string }>;
  recargarConfigSedes: () => Promise<void>;
  doctorActivo: string;
}

const SedeContext = createContext<SedeContextType | undefined>(undefined);

const LOCAL_STORAGE_SEDE_KEY = 'odontosalud_sede_activa';
const LOCAL_STORAGE_CONFIG_KEY = 'odontosalud_sedes_config_cache';

export const SedeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sedeId, setSedeId] = useState<SedeId>(() => {
    if (typeof window !== 'undefined') {
      const guardada = localStorage.getItem(LOCAL_STORAGE_SEDE_KEY) as SedeId;
      if (guardada && (guardada === 'victoria' || guardada === 'tovar')) {
        return guardada;
      }
    }
    return 'victoria';
  });

  const [sedes, setSedes] = useState<Record<SedeId, SedeInfo>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.victoria && parsed.tovar) {
            return parsed;
          }
        }
      } catch (_) {}
    }
    return SEDES_DEFAULT;
  });

  const recargarConfigSedes = useCallback(async () => {
    try {
      const res = await ApiClient.getSedesConfig();
      if (res.success && res.sedes && res.sedes.length > 0) {
        const map: Record<SedeId, SedeInfo> = { ...SEDES_DEFAULT };
        res.sedes.forEach((s) => {
          if (s.id === 'victoria' || s.id === 'tovar') {
            map[s.id] = {
              ...map[s.id],
              ...s,
              totalBoxes: s.id === 'victoria' ? 2 : 1, // Garantía de consistencia
            };
          }
        });
        setSedes(map);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(map));
        }
      }
    } catch (err) {
      console.warn('Uso de configuración fallback de sedes:', err);
    }
  }, []);

  useEffect(() => {
    recargarConfigSedes();
  }, [recargarConfigSedes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_SEDE_KEY, sedeId);
    }
  }, [sedeId]);

  const cambiarSede = (id: SedeId) => {
    setSedeId(id);
  };

  const alternarSede = () => {
    setSedeId((prev) => (prev === 'victoria' ? 'tovar' : 'victoria'));
  };

  const actualizarConfigSede = async (id: SedeId, config: Partial<SedeInfo>) => {
    // 1. Actualización optimista local
    setSedes((prev) => {
      const updated = {
        ...prev,
        [id]: {
          ...prev[id],
          ...config,
          totalBoxes: id === 'victoria' ? 2 : 1, // Capacidad estricta
        },
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    // 2. Persistencia en Cloudflare D1
    const res = await ApiClient.guardarSedeConfig(id, config);
    if (!res.success) {
      console.error('Error guardando sede en D1:', res.message);
    }
    return res;
  };

  const sedeActiva = sedes[sedeId] || SEDES_DEFAULT[sedeId];
  const doctorActivo = 'Dra. María Alejandra Domínguez';

  return (
    <SedeContext.Provider
      value={{
        sedeActiva,
        sedeId,
        sedesDisponibles: sedes,
        cambiarSede,
        alternarSede,
        actualizarConfigSede,
        recargarConfigSedes,
        doctorActivo,
      }}
    >
      {children}
    </SedeContext.Provider>
  );
};

export const useSede = (): SedeContextType => {
  const context = useContext(SedeContext);
  if (!context) {
    throw new Error('useSede debe ser utilizado dentro de un SedeProvider');
  }
  return context;
};
