// hooks/useNotificacionesRealtime.ts
// DEPRECATED: Usar SSEInitializer en su lugar
// Este hook se mantiene por compatibilidad retroactiva

import { useEffect, useRef } from "react";

export function useNotificacionesRealtime(_onNotificacion?: any) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    isConnected: false,
    desconectar: () => {},
  };
}
