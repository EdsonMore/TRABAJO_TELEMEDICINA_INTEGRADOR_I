// app/telemedicina/sesion/[sesionId]/page.tsx - VERSIÓN CORREGIDA
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import VideoCallRoom from "@/components/VideoCallRoom";

export default function SesionTelemedicinaPage() {
  const params = useParams();
  const router = useRouter();
  const { usuario, token } = useAuth();
  const sesionId = params.sesionId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [sesionData, setSesionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarSesion = async () => {
      if (!token || !sesionId) return;

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Buscar sesión por ID
        const response = await fetch(
          `/api/telemedicina/sesiones?sesion_id=${sesionId}`,
          {
            headers,
          }
        );

        if (!response.ok) {
          throw new Error("Error al cargar la sesión");
        }

        const data = await response.json();

        if (data.success && data.sesiones.length > 0) {
          const sesion = data.sesiones[0];

          console.log("🔍 Datos de sesión cargados:", {
            sesion,
            usuario,
            // IDs importantes para debug
            usuario_paciente_id: sesion.usuario_paciente_id,
            usuario_medico_id: sesion.usuario_medico_id,
            id_usuario_actual: usuario?.id,
            rol_usuario: usuario?.rol,
          });

          // 🔥 VERIFICACIÓN CORREGIDA - usar los IDs de usuario correctos
          let tienePermiso = false;

          if (usuario?.rol === "paciente") {
            // Comparar con usuario_paciente_id (ID de usuario del paciente)
            tienePermiso = sesion.usuario_paciente_id === usuario.id;
            console.log(
              `👤 Permiso paciente: ${tienePermiso} (sesion.usuario_paciente_id: ${sesion.usuario_paciente_id}, usuario.id: ${usuario.id})`
            );
          } else if (usuario?.rol === "medico") {
            // Comparar con usuario_medico_id (ID de usuario del médico)
            tienePermiso = sesion.usuario_medico_id === usuario.id;
            console.log(
              `👨‍⚕️ Permiso médico: ${tienePermiso} (sesion.usuario_medico_id: ${sesion.usuario_medico_id}, usuario.id: ${usuario.id})`
            );
          }

          if (!tienePermiso) {
            setError("No tienes permisos para acceder a esta sesión");
            return;
          }

          setSesionData(sesion);
        } else {
          setError("Sesión no encontrada");
        }
      } catch (error) {
        console.error("Error cargando sesión:", error);
        setError("Error al cargar la sesión");
      } finally {
        setIsLoading(false);
      }
    };

    cargarSesion();
  }, [token, sesionId, usuario]);

  const handleLeaveCall = () => {
    if (usuario?.rol === "medico") {
      router.push("/dashboard/medico");
    } else {
      router.push("/dashboard/paciente");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando sesión de telemedicina...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white bg-red-600 p-8 rounded-lg max-w-md">
          <h2 className="text-2xl font-bold mb-4">❌ Error</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={handleLeaveCall}
            className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!sesionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <p>No se pudo cargar la sesión</p>
          <button
            onClick={handleLeaveCall}
            className="mt-4 bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const userData = {
    id: usuario?.id,
    nombre: usuario?.nombre,
    apellido: usuario?.apellido,
    rol: usuario?.rol,
    email: usuario?.email,
  };

  // Usar el código de acceso como roomId para WebRTC
  const roomId = `medilink-${sesionData.codigo_acceso}`;

  console.log("🎬 Iniciando videollamada:", {
    roomId,
    userData,
    sesionData,
  });

  return (
    <VideoCallRoom
      roomId={roomId}
      userData={userData}
      onLeave={handleLeaveCall}
      citaId={sesionData?.id_cita}
    />
  );
}
