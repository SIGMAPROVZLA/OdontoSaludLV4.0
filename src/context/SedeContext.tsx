import React, { createContext, useContext, useState, useEffect } from 'react';
import { SedeId, SedeInfo } from '../types/clinical';

export const SEDES_DISPONIBLES: Record<SedeId, SedeInfo> = {
  victoria: {
    id: 'victoria',
    nombre: 'OdontoSalud La Victoria',
    subtitulo: 'Sede Principal • Boxes 1 y 2 & Cirugía RVG',
    direccion: 'C. C. Márquez del Toro, Planta Baja, Local 18, La Victoria, Aragua',
    telefono: '+58 412-8365687',
    whatsapp: '584128365687',
    email: 'Clínica@OdontosaludLV.com',
    totalBoxes: 2,
  },
  tovar: {
    id: 'tovar',
    nombre: 'OdontoSalud La Colonia Tovar',
    subtitulo: 'Sucursal • Box Clínico & Atención Integral',
    direccion: 'Casco Central, Av. Codazzi, C. C San Martín de Tours, Planta Alta, Local N° 7',
    telefono: '+58 412-8365687',
    whatsapp: '584128365687',
    email: 'Clínica@OdontosaludLV.com',
    totalBoxes: 1,
  },
};

interface SedeContextType {
  sedeActiva: SedeInfo;
  sedeId: SedeId;
  cambiarSede: (id: SedeId) => void;
  alternarSede: () => void;
  doctorActivo: string;
}

const SedeContext = createContext<SedeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'odontosalud_sede_activa';

export const SedeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sedeId, setSedeId] = useState<SedeId>(() => {
    if (typeof window !== 'undefined') {
      const guardada = localStorage.getItem(LOCAL_STORAGE_KEY) as SedeId;
      if (guardada && (guardada === 'victoria' || guardada === 'tovar')) {
        return guardada;
      }
    }
    return 'victoria';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, sedeId);
    }
  }, [sedeId]);

  const cambiarSede = (id: SedeId) => {
    setSedeId(id);
  };

  const alternarSede = () => {
    setSedeId((prev) => (prev === 'victoria' ? 'tovar' : 'victoria'));
  };

  const sedeActiva = SEDES_DISPONIBLES[sedeId];
  const doctorActivo = 'Dra. María Alejandra Domínguez';

  return (
    <SedeContext.Provider
      value={{
        sedeActiva,
        sedeId,
        cambiarSede,
        alternarSede,
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
