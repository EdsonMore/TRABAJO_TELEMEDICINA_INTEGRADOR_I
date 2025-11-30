// EJEMPLOS DE USO DEL NAVBAR UNIVERSAL EN DASHBOARDS
// NOTA: Este es un archivo de referencia, NO use en producción

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { NavbarUniversal } from "@/components/layout/navbar-universal";

// ============================================
// EJEMPLO 1: Dashboard Paciente
// ============================================

function DashboardPacienteExample() {
  const { usuario, token } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  // El navbar se renderiza así:
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar con notificaciones dinámicas */}
      <NavbarUniversal 
        showNotifications={true}
        notificationCount={notificationCount}  // Actualizar según API
      />

      {/* Resto del contenido */}
      <main>
        {/* ... */}
      </main>
    </div>
  );
}

// ============================================
// EJEMPLO 2: Dashboard Médico
// ============================================

function DashboardMedicoExample() {
  const { usuario } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar adaptado automáticamente para médico */}
      <NavbarUniversal 
        showNotifications={true}
        notificationCount={5}  // Citas o mensajes pendientes
      />

      {/* El navbar mostrará:
          - Botón "Telemedicina" (verde)
          - Botón "Nueva Receta" (azul)
          - Quick Links: Agenda, Pacientes, Recetas
      */}

      <main>
        {/* ... */}
      </main>
    </div>
  );
}

// ============================================
// EJEMPLO 3: Dashboard Farmacia
// ============================================

function DashboardFarmaciaExample() {
  const { usuario } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar adaptado para farmacia */}
      <NavbarUniversal 
        showNotifications={true}
        notificationCount={12}  // Recetas pendientes
      />

      {/* El navbar mostrará:
          - Botón "Recetas" (azul)
          - Botón "Búsqueda" (outline)
          - Quick Links: Recetas Pendientes, Inventario, Despachos
          - Logo: Píldora púrpura
      */}

      <main>
        {/* ... */}
      </main>
    </div>
  );
}

// ============================================
// EJEMPLO 4: Actualizar Notificaciones Dinámicamente
// ============================================

function ActualizarNotificacionesExample() {
  const { token } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        const res = await fetch('/api/notificaciones', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        // Actualizar count en navbar
        setNotificationCount(data.notificaciones?.length || 0);
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      }
    };

    if (token) {
      cargarNotificaciones();
      
      // Recargar cada 30 segundos
      const interval = setInterval(cargarNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  return null;
}

// ============================================
// EJEMPLO 5: Escuchar Eventos Personalizados
// ============================================
// EJEMPLO 6: Customizar Badge por Rol
// ============================================

interface EnhancedNavbarProps {
  showNotifications?: boolean;
  notificationCount?: number;
  badgeConfig?: {
    label: string;
    count: number;
  }[];
}

// Ejemplo de uso:
/*
<NavbarUniversal 
  showNotifications={true}
  notificationCount={5}
  // badgeConfig={[
  //   { label: 'Citas', count: 3 },
  //   { label: 'Recetas', count: 5 }
  // ]}
/>
*/

// ============================================
// EJEMPLO 7: Estados de Notificación
// ============================================

function EstadosNotificacionExample() {
  const { usuario } = useAuth();
  
  // Paciente: notificaciones de citas confirmadas
  const [citasConfirmadas, setCitasConfirmadas] = useState(0);

  // Médico: notificaciones de nuevas citas
  const [citasPendientes, setCitasPendientes] = useState(0);

  // Farmacia: recetas pendientes por despachar
  const [recetasPendientes, setRecetasPendientes] = useState(0);

  const getNotificationCount = () => {
    switch (usuario?.rol) {
      case 'paciente':
        return citasConfirmadas;
      case 'medico':
        return citasPendientes;
      case 'farmacia':
        return recetasPendientes;
      default:
        return 0;
    }
  };

  // En el navbar:
  return (
    <NavbarUniversal 
      showNotifications={true}
      notificationCount={getNotificationCount()}
    />
  );
}
