// components/notificaciones/sse-initializer.tsx
// Componente que inicializa SSE SOLO UNA VEZ en el app
"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function SSEInitializer() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    console.log("🔌 Inicializando SSE...");
    
    // Crear conexión SSE sin manejar notificaciones (solo es ping)
    const url = `/api/notificaciones/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener("open", () => {
      console.log("✅ SSE listo (solo ping)");
    });

    eventSource.addEventListener("error", () => {
      console.log("⚠️ SSE error, reconnecting...");
      eventSource.close();
    });

    // Cleanup
    return () => {
      eventSource.close();
    };
  }, [token]);

  return null;
}
