import React, { createContext, useContext, useState, useEffect } from 'react';
import { SedeId, SedeInfo } from '../types/clinical';

export const SEDES_DISPONIBLES: Record<SedeId, SedeInfo> = {
  victoria: {
    id: 'victoria',
    nombre: 'OdontoSalud La Victoria',
    subtitulo: 'Sede Principal • Boxes 1 al 4 & Cirugía RVG',
    direccion: 'Av. Francisco de Miranda, Centro Profesional, La Victoria, Aragua',
    telefono: '+58 244-3214567',
    whatsapp: '584129876543',
    totalBoxes: 4,
  },
  tovar: {
    id: 'tovar',
    nombre: 'OdontoSalud La Colonia Tovar',
    subtitulo: 'Sucursal • Atención Integral & Ortodoncia',
    direccion: 'Calle Principal, Sector El Centro, Colonia Tovar, Aragua',
    telefono: '+58 244-9871234',
    whatsapp: '584145550921',
    totalBoxes: 2,
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
