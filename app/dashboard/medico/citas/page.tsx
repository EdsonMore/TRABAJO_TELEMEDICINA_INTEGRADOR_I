// app/dashboard/medico/citas/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NavbarUniversal } from "@/components/layout/navbar-universal";
import { CalendarioCitas } from "@/components/medico/calendario-citas";
import { DetallesCitaModalMedico } from "@/components/medico/detalles-cita-modal";
import ModalCrearReceta from "@/components/medico/ModalCrearReceta";
import { ModalPerfilPaciente } from "@/components/medico/modal-perfil-paciente";
import { ModalHistorialPaciente } from "@/components/medico/modal-historial-paciente";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

interface DiaAgenda {
  fecha: string;
  total_citas: number;
  citas_completadas: number;
  citas_programadas: number;
  citas: any[];
}

export default function GestionCitasPage() {
  const { usuario, token } = useAuth();
  const [agenda, setAgenda] = useState<DiaAgenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [detallesCitaOpen, setDetallesCitaOpen] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [crearRecetaOpen, setCrearRecetaOpen] = useState(false);
  const [citaParaReceta, setCitaParaReceta] = useState<any>(null);
  const [mostrarPerfilPaciente, setMostrarPerfilPaciente] = useState(false);
  const [pacientePerfil, setPacientePerfil] = useState<any>(null);
  const [mostrarHistorialPaciente, setMostrarHistorialPaciente] = useState(false);
  const [pacienteHistorial, setPacienteHistorial] = useState<any>(null);

  // Cargar agenda y citas
  const cargarAgenda = async (silencioso = false) => {
    if (!token) return;

    if (!silencioso) {
      setIsLoading(true);
    }
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Cargar agenda (próximos 30 días)
      const agendaRes = await fetch("/api/medico/agenda?dias=30", { headers });
      if (agendaRes.ok) {
        const agendaData = await agendaRes.json();
        setAgenda(agendaData.agenda || []);
        setError(null);
      } else {
        setError("No se pudo cargar la agenda");
      }
    } catch (err) {
      console.error("Error cargando agenda:", err);
      if (!silencioso) {
        setError("Error de conexión");
      }
    } finally {
      if (!silencioso) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    cargarAgenda();

    // 🔄 Auto-actualizar cada 20 segundos (silencioso)
    const intervalId = setInterval(() => {
      cargarAgenda(true);
    }, 20000);

    return () => clearInterval(intervalId);
  }, [token]);

  // Convertir agenda a array de citas plano
  const todasLasCitas = agenda.flatMap((dia) => dia.citas);

  // Funciones de acción
  const verDetallesCita = (cita: any) => {
    setCitaSeleccionada(cita);
    setDetallesCitaOpen(true);
  };

  const crearRecetaDesdeCita = (cita: any) => {
    setCitaParaReceta(cita);
    setCrearRecetaOpen(true);
  };

  const verPerfilPaciente = async (pacienteId: string) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(
        `/api/medico/pacientes/${pacienteId}/perfil`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setPacientePerfil(data.paciente);
        setMostrarPerfilPaciente(true);
      } else {
        alert("Error al cargar el perfil del paciente");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    }
  };

  const verHistorialPaciente = async (pacienteId: string) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(
        `/api/medico/pacientes/${pacienteId}/historial`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        setPacienteHistorial(data);
        setMostrarHistorialPaciente(true);
      } else {
        alert("Error al cargar el historial");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    }
  };

  const unirseAVideollamada = async (cita: any) => {
    if (cita.tipo_cita !== "virtual") {
      alert("Esta cita no es de tipo virtual.");
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const sesionesResponse = await fetch(
        `/api/telemedicina/sesiones?cita_id=${cita.id}`,
        { headers }
      );

      const sesionesData = await sesionesResponse.json();
      let sesionId;

      if (sesionesData.success && sesionesData.sesiones.length > 0) {
        sesionId = sesionesData.sesiones[0].id;
      } else {
        const programarResponse = await fetch("/api/telemedicina/programar", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            id_cita: cita.id,
            titulo: "Consulta Virtual",
            descripcion: "Sesión de telemedicina",
            fecha_programada: new Date().toISOString(),
            duracion_minutos: 30,
          }),
        });

        const programarData = await programarResponse.json();
        if (!programarData.success) {
          throw new Error(programarData.error || "Error al crear sesión");
        }

        sesionId = programarData.sesion.id;
      }

      window.open(`/telemedicina/sesion/${sesionId}`, "_blank");
    } catch (error: any) {
      alert(`Error: ${error.message || "No se pudo conectar"}`);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["medico"]}>
        <NavbarUniversal showNotifications notificationCount={5} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-600">Cargando gestión de citas...</span>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["medico"]}>
        <NavbarUniversal showNotifications notificationCount={5} />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">{error}</h3>
                <p className="text-sm text-red-700 mt-1">
                  Por favor, recarga la página e intenta nuevamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["medico"]}>
      <div className="min-h-screen bg-gray-50">
        <NavbarUniversal showNotifications notificationCount={5} />

        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Gestión de Citas
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Vista completa del calendario y administración de tus citas médicas
            </p>
          </div>

          {/* Calendario */}
          <CalendarioCitas
            citas={todasLasCitas}
            onVerDetalles={verDetallesCita}
            onCrearReceta={crearRecetaDesdeCita}
            onUnirseVideollamada={unirseAVideollamada}
          />
        </main>

        {/* MODALES */}
        <DetallesCitaModalMedico
          isOpen={detallesCitaOpen}
          onClose={() => setDetallesCitaOpen(false)}
          cita={citaSeleccionada}
          onCitaActualizada={() => window.location.reload()}
          onVerPerfil={verPerfilPaciente}
          onVerHistorial={verHistorialPaciente}
          onCrearReceta={() => {
            setDetallesCitaOpen(false);
            if (citaSeleccionada) {
              crearRecetaDesdeCita(citaSeleccionada);
            }
          }}
        />

        <ModalCrearReceta
          cita={citaParaReceta}
          isOpen={crearRecetaOpen}
          onClose={() => {
            setCrearRecetaOpen(false);
            setCitaParaReceta(null);
          }}
          onRecetaCreada={() => {
            setCrearRecetaOpen(false);
            setCitaParaReceta(null);
          }}
        />

        <ModalPerfilPaciente
          isOpen={mostrarPerfilPaciente}
          onClose={() => setMostrarPerfilPaciente(false)}
          paciente={pacientePerfil}
          onVerHistorial={() => {
            setMostrarPerfilPaciente(false);
            setTimeout(() => {
              if (pacientePerfil) {
                verHistorialPaciente(pacientePerfil.id);
              }
            }, 300);
          }}
        />

        <ModalHistorialPaciente
          isOpen={mostrarHistorialPaciente}
          onClose={() => setMostrarHistorialPaciente(false)}
          historial={pacienteHistorial}
        />
      </div>
    </ProtectedRoute>
  );
}
