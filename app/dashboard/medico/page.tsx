// app/dashboard/medico/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DetallesCitaModalMedico } from "@/components/medico/detalles-cita-modal";
import GestionCitaMedicoModal from "@/components/medico/gestion-cita-medico-modal";
import ModalCrearReceta from "@/components/medico/ModalCrearReceta";
import { ModalPerfilPaciente } from "@/components/medico/modal-perfil-paciente";
import { ModalHistorialPaciente } from "@/components/medico/modal-historial-paciente";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AccesoRapidoCitas } from "@/components/medico/acceso-rapido-citas";
import {
  Calendar,
  Users,
  Stethoscope,
  Clock,
  Award,
  FileText,
  Star,
  User,
  Activity,
} from "lucide-react";

interface PerfilMedico {
  id: string;
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    avatar_url?: string;
  };
  informacion_profesional: {
    numero_colegiatura: string;
    anos_experiencia: number;
    especialidad: {
      nombre: string;
      descripcion: string;
    };
    direccion_consultorio?: string;
    tarifa_consulta?: number;
    calificacion_promedio: number;
    total_consultas: number;
    biografia?: string;
  };
  estadisticas: {
    total_citas: number;
    citas_completadas: number;
    citas_programadas: number;
    citas_hoy: number;
    citas_futuras: number;
    total_pacientes: number;
    ingreso_promedio_cita: number;
  };
}

export default function DashboardMedicoPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [perfil, setPerfil] = useState<PerfilMedico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [detallesCitaOpen, setDetallesCitaOpen] = useState(false);
  const [gestionCitaOpen, setGestionCitaOpen] = useState(false);
  const [crearRecetaOpen, setCrearRecetaOpen] = useState(false);
  const [citaParaReceta, setCitaParaReceta] = useState<any>(null);
  const [pacientePerfil, setPacientePerfil] = useState<any>(null);
  const [mostrarPerfilPaciente, setMostrarPerfilPaciente] = useState(false);
  const [pacienteHistorial, setPacienteHistorial] = useState<any>(null);
  const [mostrarHistorialPaciente, setMostrarHistorialPaciente] = useState(false);

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      if (!token) return;
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const perfilRes = await fetch("/api/medico/perfil", { headers });
        if (perfilRes.ok) {
          const perfilData = await perfilRes.json();
          setPerfil(perfilData);
        }
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarDatosDashboard();
  }, [token]);

  const handleLogout = () => {
    logout();
    window.location.href = "/auth/login";
  };

  const verPerfilPaciente = async (pacienteId: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const response = await fetch(`/api/medico/pacientes/${pacienteId}/perfil`, { headers });
      if (response.ok) {
        const data = await response.json();
        setPacientePerfil(data.paciente);
        setMostrarPerfilPaciente(true);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "No se pudo cargar el perfil"}`);
      }
    } catch (error) {
      console.error("Error cargando perfil del paciente:", error);
      alert("Error de conexión al cargar el perfil");
    }
  };

  const verHistorialPaciente = async (pacienteId: string) => {
    if (!pacienteId) { alert("Error: ID de paciente no válido"); return; }
    if (!token) { alert("Error: No estás autenticado"); return; }
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const url = `/api/medico/pacientes/${pacienteId}/historial?cita_id=temp-${Date.now()}`;
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setPacienteHistorial(data);
        setMostrarHistorialPaciente(true);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "No se pudo cargar el historial"}`);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
      alert("Error de conexión al cargar el historial");
    }
  };

  const crearRecetaDesdeCita = (cita: any) => {
    setCitaParaReceta(cita);
    setCrearRecetaOpen(true);
  };

  const handleRecetaCreada = () => {
    setCrearRecetaOpen(false);
    setCitaParaReceta(null);
  };

  const unirseAVideollamada = async (cita: any) => {
    if (cita.tipo_cita !== "virtual") {
      alert("Esta cita no es de tipo virtual.");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const sesionesResponse = await fetch(`/api/telemedicina/sesiones?cita_id=${cita.id}`, { headers });
      const sesionesData = await sesionesResponse.json();
      let sesionId;
      if (sesionesData.success && sesionesData.sesiones.length > 0) {
        sesionId = sesionesData.sesiones[0].id;
      } else {
        const programarResponse = await fetch("/api/telemedicina/programar", {
          method: "POST",
          headers,
          body: JSON.stringify({
            id_cita: cita.id,
            titulo: "Consulta Virtual",
            descripcion: "Sesión de telemedicina",
            fecha_programada: new Date().toISOString(),
            duracion_minutos: 30,
          }),
        });
        const programarData = await programarResponse.json();
        if (!programarData.success) throw new Error(programarData.error || "Error al crear sesión");
        sesionId = programarData.sesion.id;
      }
      window.open(`/telemedicina/sesion/${sesionId}`, "_blank");
    } catch (error: any) {
      alert(`Error: ${error.message || "No se pudo conectar"}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 text-sm">
            Cargando tu información profesional...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["medico"]}>
      <div className="min-h-screen bg-gray-50">
        {/* Contenido Principal */}
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* Tarjetas de Resumen - Grid Responsivo Mejorado */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
            {/* Citas Hoy */}
            <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base font-semibold">
                    Citas Hoy
                  </CardTitle>
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl font-bold text-blue-600">
                  {perfil?.estadisticas.citas_hoy || 0}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {perfil?.estadisticas.citas_completadas || 0} completadas hoy
                </p>
              </CardContent>
            </Card>

            {/* Total Pacientes */}
            <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base font-semibold">
                    Total Pacientes
                  </CardTitle>
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {perfil?.estadisticas.total_pacientes || 0}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Pacientes atendidos
                </p>
              </CardContent>
            </Card>

            {/* Citas Programadas */}
            <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base font-semibold">
                    Citas Programadas
                  </CardTitle>
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {perfil?.estadisticas.citas_programadas || 0}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Próximas citas
                </p>
              </CardContent>
            </Card>

            {/* Calificación */}
            <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm sm:text-base font-semibold">
                    Calificación
                  </CardTitle>
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {Number(
                    perfil?.informacion_profesional?.calificacion_promedio || 0
                  ).toFixed(1)}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {perfil?.informacion_profesional?.total_consultas || 0}{" "}
                  consultas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Acceso Rápido a Gestión de Citas */}
          <div className="mb-6">
            <AccesoRapidoCitas />
          </div>

          {/* Acceso Rápido a Módulos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 mb-6">
            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 sm:border bg-gradient-to-br from-blue-50 to-blue-100"
              onClick={() => router.push("/dashboard/medico/agenda")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Agenda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Citas de hoy y próximos 7 días</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 sm:border bg-gradient-to-br from-green-50 to-green-100"
              onClick={() => router.push("/dashboard/medico/pacientes")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  Pacientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Lista y búsqueda de pacientes</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 sm:border bg-gradient-to-br from-purple-50 to-purple-100"
              onClick={() => router.push("/dashboard/medico/recetas")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Recetas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Recetas médicas prescritas</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 sm:border bg-gradient-to-br from-amber-50 to-amber-100"
              onClick={() => router.push("/dashboard/medico/evaluaciones")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-600" />
                  Evaluaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Opiniones y calificaciones</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 sm:border bg-gradient-to-br from-indigo-50 to-indigo-100"
              onClick={() => router.push("/dashboard/medico/estadisticas")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Métricas de tu práctica</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-0 sm:border bg-gradient-to-br from-sky-50 to-sky-100"
              onClick={() => router.push("/dashboard/medico/perfil")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-600" />
                  Perfil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">Información profesional</p>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* MODALES */}

        <GestionCitaMedicoModal
          isOpen={gestionCitaOpen}
          onClose={() => {
            setGestionCitaOpen(false);
            setCitaSeleccionada(null);
          }}
          cita={citaSeleccionada}
          onCitaActualizada={() => {
            window.location.reload();
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

        {/* MODAL CREAR RECETA */}
        <ModalCrearReceta
          cita={citaParaReceta}
          isOpen={crearRecetaOpen}
          onClose={() => {
            setCrearRecetaOpen(false);
            setCitaParaReceta(null);
          }}
          onRecetaCreada={handleRecetaCreada}
        />

        {/* MODAL DETALLES CITA */}
        <DetallesCitaModalMedico
          isOpen={detallesCitaOpen}
          onClose={() => setDetallesCitaOpen(false)}
          cita={citaSeleccionada}
          onCitaActualizada={() => window.location.reload()}
          onVerPerfil={(pacienteId: string) => verPerfilPaciente(pacienteId)}
          onVerHistorial={(pacienteId: string) =>
            verHistorialPaciente(pacienteId)
          }
          onCrearReceta={() => {
            // Abrir modal de crear receta con la cita seleccionada
            if (citaSeleccionada) {
              crearRecetaDesdeCita(citaSeleccionada);
            }
          }}
          onGestionarCita={() => {
            // Placeholder para futura implementación
            alert("Función de gestionar cita - Próximamente");
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
