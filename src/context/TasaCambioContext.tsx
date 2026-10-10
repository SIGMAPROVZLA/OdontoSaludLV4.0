import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TasaCambioInfo, NotificacionItem } from '../types/clinical';
import { ApiClient } from '../services/api';

interface TasaCambioContextType {
  tasaBcv: number;
  tasaInfo: TasaCambioInfo | null;
  isLoading: boolean;
  isRefreshing: boolean;
  notificaciones: NotificacionItem[];
  hayNoLeidas: boolean;
  actualizarTasaEnLinea: (forzar?: boolean) => Promise<TasaCambioInfo>;
  fijarTasaManual: (tasa: number, motivo?: string) => Promise<void>;
  restaurarTasaAutomatica: () => Promise<void>;
  marcarNotificacionesLeidas: () => void;
  eliminarNotificacion: (id: string) => void;
}

const TasaCambioContext = createContext<TasaCambioContextType | undefined>(undefined);

export const TasaCambioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasaBcv, setTasaBcv] = useState<number>(875.65);
  const [tasaInfo, setTasaInfo] = useState<TasaCambioInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);

  const formatHora = () => {
    return new Date().toLocaleTimeString('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const actualizarTasaEnLinea = useCallback(
    async (forzar = false): Promise<TasaCambioInfo> => {
      setIsRefreshing(true);
      try {
        const info = await ApiClient.getTasaBcv(forzar);
        setTasaBcv(info.tasa);
        setTasaInfo(info);

        // Notificar en la campanita
        const formattedRate = Number(info.tasa).toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        });

        const nuevaNotificacion: NotificacionItem = {
          id: `tasa-${Date.now()}`,
          tipo: 'tasa_bcv',
          titulo: `Tasa Oficial BCV: ${formattedRate} Bs/$`,
          mensaje: info.esManual
            ? `Tasa fijada manualmente por administración (${info.fuente}). Vigente para caja.`
            : `Sincronizada en línea con el BCV (${info.fuente}). Válida para cobros y presupuestos de la jornada.`,
          timestamp: formatHora(),
          leido: false,
          accionTab: 'cobros',
          meta: info,
        };

        setNotificaciones((prev) => {
          // Reemplazar la notificación de tasa anterior si existe para evitar spam
          const filtradas = prev.filter((n) => n.tipo !== 'tasa_bcv');
          return [nuevaNotificacion, ...filtradas];
        });

        return info;
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  const fijarTasaManual = async (tasa: number, motivo?: string) => {
    setIsRefreshing(true);
    try {
      const info = await ApiClient.fijarTasaManual({
        tasa,
        motivo: motivo || 'Ajuste administrativo en caja',
      });
      setTasaBcv(info.tasa);
      setTasaInfo(info);

      const formattedRate = Number(info.tasa).toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const nuevaNotif: NotificacionItem = {
        id: `tasa-manual-${Date.now()}`,
        tipo: 'tasa_bcv',
        titulo: `Tasa Manual Establecida: ${formattedRate} Bs/$`,
        mensaje: `La administración fijó una tasa personalizada (${motivo || 'Manual'}).`,
        timestamp: formatHora(),
        leido: false,
        accionTab: 'cobros',
        meta: info,
      };

      setNotificaciones((prev) => [nuevaNotif, ...prev.filter((n) => n.tipo !== 'tasa_bcv')]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const restaurarTasaAutomatica = async () => {
    setIsRefreshing(true);
    try {
      const info = await ApiClient.resetearTasaAutomatica();
      setTasaBcv(info.tasa);
      setTasaInfo(info);

      const formattedRate = Number(info.tasa).toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });

      const nuevaNotif: NotificacionItem = {
        id: `tasa-auto-${Date.now()}`,
        tipo: 'tasa_bcv',
        titulo: `Modo Automático Restaurado: ${formattedRate} Bs/$`,
        mensaje: 'La tasa volvió a sincronizarse automáticamente en línea con el BCV.',
        timestamp: formatHora(),
        leido: false,
        accionTab: 'cobros',
        meta: info,
      };

      setNotificaciones((prev) => [nuevaNotif, ...prev.filter((n) => n.tipo !== 'tasa_bcv')]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const marcarNotificacionesLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
  };

  const eliminarNotificacion = (id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  };

  // Carga inicial y configuración de notificaciones clínicas
  useEffect(() => {
    // 1. Cargar tasa inicial
    actualizarTasaEnLinea();

    // 2. Notificación clínica de triaje / citas inicial
    const triajeNotif: NotificacionItem = {
      id: 'notif-triaje-citas',
      tipo: 'cita_triaje',
      titulo: 'Triaje: 2 Citas Pendientes',
      mensaje: 'Existen solicitudes de citas web en espera de asignación de sillón y confirmación.',
      timestamp: 'Hoy',
      leido: false,
      accionTab: 'coordinacion',
    };

    setNotificaciones((prev) => {
      if (prev.some((n) => n.id === triajeNotif.id)) return prev;
      return [...prev, triajeNotif];
    });

    // 3. Polling suave cada 30 minutos
    const interval = setInterval(() => {
      actualizarTasaEnLinea();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [actualizarTasaEnLinea]);

  const hayNoLeidas = notificaciones.some((n) => !n.leido);

  return (
    <TasaCambioContext.Provider
      value={{
        tasaBcv,
        tasaInfo,
        isLoading,
        isRefreshing,
        notificaciones,
        hayNoLeidas,
        actualizarTasaEnLinea,
        fijarTasaManual,
        restaurarTasaAutomatica,
        marcarNotificacionesLeidas,
        eliminarNotificacion,
      }}
    >
      {children}
    </TasaCambioContext.Provider>
  );
};

export const useTasaCambio = () => {
  const context = useContext(TasaCambioContext);
  if (!context) {
    throw new Error('useTasaCambio debe utilizarse dentro de un TasaCambioProvider');
  }
  return context;
};
