// contexts/notificaciones-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";

export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: "cita" | "receta" | "resultado" | "sistema" | "farmacia" | "laboratorio" | "receta_nueva";
  estado: "nueva" | "leida";
  timestamp: string;
  idRelacionado?: string;
  leida?: boolean;
}

interface NotificacionesContextType {
  notificaciones: Notificacion[];
  agregarNotificacion: (notificacion: Notificacion) => void;
  marcarComoLeida: (id: string) => void;
  marcarTodosComoLeidos: () => void;
  eliminarNotificacion: (id: string) => void;
  limpiarTodas: () => void;
  obtenerNoLeidas: () => number;
  cargarNotificaciones: () => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

// ============= UTILIDADES DE SONIDO =============
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
    
    const oscillator2 = audioContext.createOscillator();
    oscillator2.connect(gainNode);
    oscillator2.frequency.value = 1000;
    oscillator2.start(audioContext.currentTime + 0.1);
    oscillator2.stop(audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
  } catch (error) {
    console.error("Error reproducing notification sound:", error);
  }
};

// ============= MOSTRAR TOAST VISUAL =============
const showNotificationToast = (titulo: string, mensaje: string, tipo: string) => {
  const existingContainer = document.getElementById("notification-toast-container");
  const container = existingContainer || (() => {
    const div = document.createElement("div");
    div.id = "notification-toast-container";
    div.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(div);
    return div;
  })();

  const toast = document.createElement("div");
  const bgColor = (() => {
    switch(tipo) {
      case "cita": return "#3b82f6";
      case "receta": return "#10b981";
      case "resultado": return "#f97316";
      case "farmacia": return "#8b5cf6";
      case "laboratorio": return "#ec4899";
      case "receta_nueva": return "#06b6d4"; // Cyan para nuevas recetas en farmacia
      default: return "#6b7280";
    }
  })();

  toast.style.cssText = `
    background-color: ${bgColor};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    animation: slideIn 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
    max-width: 400px;
    pointer-events: auto;
  `;

  const titleEl = document.createElement("div");
  titleEl.style.cssText = "font-weight: 600; margin-bottom: 4px; font-size: 14px;";
  titleEl.textContent = titulo;

  const msgEl = document.createElement("div");
  msgEl.style.cssText = "font-size: 13px; opacity: 0.95;";
  msgEl.textContent = mensaje;

  toast.appendChild(titleEl);
  toast.appendChild(msgEl);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
};

// ============= CSS ANIMATIONS =============
const addAnimationStyles = () => {
  if (document.getElementById("notification-animations")) return;
  
  const style = document.createElement("style");
  style.id = "notification-animations";
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
};

export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const { usuario, token } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [previousCount, setPreviousCount] = useState(0);

  // Cargar notificaciones desde la API
  const cargarNotificaciones = useCallback(async () => {
    if (!token || !usuario) return;

    try {
      console.log(`🔄 Polling notificaciones... (previousCount: ${previousCount})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // timeout 5s
      
      const res = await fetch("/api/notificaciones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const newNotificaciones = data.notificaciones || [];
        
        const currentCount = newNotificaciones.length;
        console.log(`📊 Notificaciones: ${currentCount} (anterior: ${previousCount})`);
        
        // Detectar nuevas notificaciones
        // Si es la primera carga (previousCount = 0) y hay nuevas, reproducir sonido
        // Si hay más notificaciones que antes, reproducir sonido
        if (currentCount > previousCount && currentCount > 0) {
          const newNotif = newNotificaciones[0];
          console.log(`🔔 Nueva notificación detectada:`, newNotif.titulo);
          
          playNotificationSound();
          showNotificationToast(newNotif.titulo, newNotif.mensaje, newNotif.tipo);
        }
        
        setPreviousCount(currentCount);
        setNotificaciones(newNotificaciones);
      } else if (res.status === 401) {
        console.warn(`⚠️ No autorizado. Token puede haber expirado`);
      } else {
        console.warn(`⚠️ Error GET notificaciones: ${res.status} - ${res.statusText}`);
      }
    } catch (error: any) {
      // Ignorar errores de red comunes sin loguear como error crítico
      if (error.name === "AbortError") {
        console.debug("⏱️ Timeout en fetch de notificaciones");
      } else if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.debug("⚠️ Error de red temporal (probablemente offline)");
      } else {
        console.warn("⚠️ Error cargando notificaciones:", error?.message || error);
      }
    }
  }, [token, usuario, previousCount]);

  // Cargar notificaciones al iniciar
  useEffect(() => {
    if (usuario && token) {
      addAnimationStyles();
      cargarNotificaciones();
    }
  }, [usuario, token, cargarNotificaciones]);

  // Polling cada 30 segundos
  useEffect(() => {
    if (!usuario || !token) return;

    const interval = setInterval(() => {
      cargarNotificaciones();
    }, 30000);

    return () => clearInterval(interval);
  }, [usuario, token, cargarNotificaciones]);

  // Pedir permiso para notificaciones del navegador
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const agregarNotificacion = (notificacion: Notificacion) => {
    setNotificaciones((prev) => [notificacion, ...prev]);
    
    playNotificationSound();
    showNotificationToast(notificacion.titulo, notificacion.mensaje, notificacion.tipo);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notificacion.titulo, {
        body: notificacion.mensaje,
        icon: "/images/medilink-icon.png",
        tag: `notification-${notificacion.id}`,
        requireInteraction: true,
      });
    }
  };

  const marcarComoLeida = async (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true, estado: "leida" } : n))
    );

    try {
      await fetch(`/api/notificaciones/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leida: true }),
      });
    } catch (error) {
      console.error("Error marcando como leída:", error);
    }
  };

  const marcarTodosComoLeidos = async () => {
    setNotificaciones((prev) =>
      prev.map((n) => ({ ...n, leida: true, estado: "leida" }))
    );

    try {
      await fetch("/api/notificaciones/marcar-todo-leido", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error marcando todos como leídos:", error);
    }
  };

  const eliminarNotificacion = async (id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));

    try {
      await fetch(`/api/notificaciones/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error eliminando notificación:", error);
    }
  };

  const limpiarTodas = async () => {
    setNotificaciones([]);

    try {
      await fetch("/api/notificaciones/limpiar-todas", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error limpiando notificaciones:", error);
    }
  };

  const obtenerNoLeidas = () => {
    return notificaciones.filter((n) => !n.leida && n.estado === "nueva").length;
  };

  const value: NotificacionesContextType = {
    notificaciones,
    agregarNotificacion,
    marcarComoLeida,
    marcarTodosComoLeidos,
    eliminarNotificacion,
    limpiarTodas,
    obtenerNoLeidas,
    cargarNotificaciones,
  };

  return (
    <NotificacionesContext.Provider value={value}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  const context = useContext(NotificacionesContext);
  if (context === undefined) {
    throw new Error("useNotificaciones debe estar dentro de NotificacionesProvider");
  }
  return context;
}
