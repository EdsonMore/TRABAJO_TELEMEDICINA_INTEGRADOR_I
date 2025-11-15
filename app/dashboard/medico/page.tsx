// app/dashboard/medico/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NavbarUniversal } from "@/components/layout/navbar-universal";
import {
  puedeUnirseAVideollamada,
  puedeCrearReceta,
  puedeSolicitarExamenes,
  getEtiquetaCita,
} from "@/lib/cita-utils";
import { DetallesCitaModalMedico } from "@/components/medico/detalles-cita-modal";
import ModalCrearReceta from "@/components/medico/ModalCrearReceta";
import { ModalPerfilPaciente } from "@/components/medico/modal-perfil-paciente";
import { ModalHistorialPaciente } from "@/components/medico/modal-historial-paciente";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecetasMedicoSection } from "@/components/medico/recetas-medico-section";
import { AccesoRapidoCitas } from "@/components/medico/acceso-rapido-citas";
import {
  Calendar,
  Users,
  Stethoscope,
  Clock,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Award,
  Activity,
  Plus,
  Search,
  LogOut,
  Eye,
  Video,
  User,
  FileText,
  Menu,
  X,
  Home,
  ChevronDown,
  ChevronUp,
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

interface CitaAgenda {
  id: string;
  hora_cita: string;
  tipo_cita: string;
  estado: string;
  motivo_consulta: string;
  paciente: {
    nombre: string;
    apellido: string;
    edad: number;
    telefono: string;
  };
}

interface DiaAgenda {
  fecha: string;
  total_citas: number;
  citas_completadas: number;
  citas_programadas: number;
  citas: CitaAgenda[];
}

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  edad: number;
  telefono: string;
  email: string;
  dni: string;
  tipo_sangre?: string;
  alergias?: string;
  enfermedades_cronicas?: string;
  ultima_cita?: string;
}

export default function DashboardMedicoPage() {
  const { usuario, token, logout } = useAuth();
  const [perfil, setPerfil] = useState<PerfilMedico | null>(null);
  const [agenda, setAgenda] = useState<DiaAgenda[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [mostrarPerfilPaciente, setMostrarPerfilPaciente] = useState(false);
  const [busquedaPaciente, setBusquedaPaciente] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [detallesCitaOpen, setDetallesCitaOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mostrarTodasLasCitas, setMostrarTodasLasCitas] = useState(false);

  // ESTADOS PARA MODALES - ACTUALIZADOS
  const [buscarPacientesOpen, setBuscarPacientesOpen] = useState(false);
  const [crearRecetaOpen, setCrearRecetaOpen] = useState(false);
  const [citaParaReceta, setCitaParaReceta] = useState<any>(null);
  const [pacientePerfil, setPacientePerfil] = useState<any>(null);
  const [pacienteHistorial, setPacienteHistorial] = useState<any>(null);
  const [mostrarHistorialPaciente, setMostrarHistorialPaciente] =
    useState(false);

  // NUEVO ESTADO: Paciente seleccionado desde el modal de búsqueda
  const [pacienteModalSeleccionado, setPacienteModalSeleccionado] =
    useState<any>(null);

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      if (!token) return;

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Cargar perfil del médico
        const perfilRes = await fetch("/api/medico/perfil", { headers });
        if (perfilRes.ok) {
          const perfilData = await perfilRes.json();
          setPerfil(perfilData);
        }

        // Cargar agenda de los próximos 7 días
        const agendaRes = await fetch("/api/medico/agenda?dias=7", { headers });
        if (agendaRes.ok) {
          const agendaData = await agendaRes.json();
          setAgenda(agendaData.agenda);
        }

        // Cargar pacientes del médico (lista básica)
        const pacientesRes = await fetch("/api/medico/pacientes", { headers });
        if (pacientesRes.ok) {
          const pacientesData = await pacientesRes.json();
          // Normalizar forma para compatibilidad con componentes existentes
          const pacientesNormalized = (pacientesData.pacientes || []).map((p: any) => ({
            id: p.id,
            nombre: p.usuario?.nombre || p.nombre || "",
            apellido: p.usuario?.apellido || p.apellido || "",
            edad: p.informacion_personal?.edad || p.edad || null,
            telefono: p.usuario?.telefono || p.telefono || "",
            email: p.usuario?.email || p.email || "",
            dni: p.informacion_personal?.dni || p.dni || "",
            tipo_sangre: p.informacion_personal?.tipo_sangre || p.tipo_sangre || "",
            // Mantener el objeto original por si otros modales lo necesitan
            _raw: p,
          }));
          setPacientes(pacientesNormalized);
        }
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatosDashboard();
  }, [token]);

  // NUEVA FUNCIÓN: Manejar selección de paciente desde el modal
  const handlePacienteSeleccionado = (paciente: any) => {
    console.log("✅ Paciente seleccionado desde modal:", paciente);
    setPacienteModalSeleccionado(paciente);

    // Cerrar modal de búsqueda
    setBuscarPacientesOpen(false);

    // Abrir modal de perfil del paciente seleccionado
    setPacientePerfil(paciente);
    setMostrarPerfilPaciente(true);
  };

  // FUNCIÓN PARA BUSCAR PACIENTES GLOBAL - ACTUALIZADA
  const buscarPacientesGlobal = () => {
    setBuscarPacientesOpen(true);
  };

  // FUNCIÓN: Crear receta desde cita
  const crearRecetaDesdeCita = (cita: any) => {
    setCitaParaReceta(cita);
    setCrearRecetaOpen(true);
  };

  // FUNCIÓN: Receta creada exitosamente
  const handleRecetaCreada = () => {
    setCrearRecetaOpen(false);
    setCitaParaReceta(null);
  };

  // FUNCIONES EXISTENTES (se mantienen igual)
  const handleLogout = () => {
    logout();
    window.location.href = "/auth/login";
  };

  const verPerfilPaciente = async (pacienteId: string) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      console.log("🔍 Cargando perfil del paciente:", pacienteId);

      const response = await fetch(
        `/api/medico/pacientes/${pacienteId}/perfil`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Perfil cargado:", data.paciente);
        setPacientePerfil(data.paciente);
        setMostrarPerfilPaciente(true);
      } else {
        const errorData = await response.json();
        console.error("❌ Error en la respuesta del servidor:", errorData);
        alert(`Error: ${errorData.message || "No se pudo cargar el perfil"}`);
      }
    } catch (error) {
      console.error("❌ Error cargando perfil del paciente:", error);
      alert("Error de conexión al cargar el perfil");
    }
  };

  const verHistorialPaciente = async (pacienteId: string) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      console.log("🔍 Cargando historial del paciente:", pacienteId);

      const response = await fetch(
        `/api/medico/pacientes/${pacienteId}/historial`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Historial cargado:", data);
        setPacienteHistorial(data);
        setMostrarHistorialPaciente(true);
      } else {
        const errorData = await response.json();
        console.error("❌ Error obteniendo historial del paciente:", errorData);
        alert(
          `Error: ${errorData.message || "No se pudo cargar el historial"}`
        );
      }
    } catch (error) {
      console.error("❌ Error cargando historial del paciente:", error);
      alert("Error de conexión al cargar el historial");
    }
  };

  const verDetallesCita = (cita: any) => {
    setCitaSeleccionada(cita);
    setDetallesCitaOpen(true);
  };

  // EN EL DASHBOARD DEL MÉDICO - Actualizar la función
  const unirseAVideollamada = async (cita: any) => {
    try {
      console.log("Médico iniciando proceso de videollamada para cita:", cita);

      if (cita.tipo_cita !== "virtual") {
        alert("❌ Esta cita no es de tipo virtual.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Buscar sesión existente
      const sesionesResponse = await fetch(
        `/api/telemedicina/sesiones?cita_id=${cita.id}`,
        { headers }
      );

      const sesionesData = await sesionesResponse.json();

      let sesionId;

      if (sesionesData.success && sesionesData.sesiones.length > 0) {
        // Usar sesión existente
        sesionId = sesionesData.sesiones[0].id;
        console.log("✅ Sesión encontrada:", sesionId);
      } else {
        // Crear nueva sesión
        console.log("🆕 Creando nueva sesión automáticamente...");

        const programarResponse = await fetch("/api/telemedicina/programar", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            id_cita: cita.id,
            titulo: "Consulta Virtual",
            descripcion: "Sesión de telemedicina automática",
            fecha_programada: new Date().toISOString(),
            duracion_minutos: 30,
          }),
        });

        const programarData = await programarResponse.json();

        if (!programarData.success) {
          throw new Error(programarData.error || "Error al crear sesión");
        }

        sesionId = programarData.sesion.id;
        console.log("✅ Nueva sesión creada:", sesionId);
      }

      // Redirigir
      console.log("🚀 Redirigiendo médico a videollamada...");
      window.open(`/telemedicina/sesion/${sesionId}`, "_blank");
    } catch (error: any) {
      console.error("Error médico uniéndose a videollamada:", error);
      alert(
        `❌ Error: ${error.message || "No se pudo conectar a la videollamada"}`
      );
    }
  };

  // Función para verificar disponibilidad de videollamada
  // Funciones de validación ahora centralizadas en cita-utils
  // Se importan al inicio del archivo para uso en toda la página

  // Función para iniciar sesión de telemedicina rápida
  const iniciarTelemedicina = () => {
    // Buscar la próxima cita virtual disponible de hoy
    const citasHoyVirtuales = citasHoy?.citas.filter(
      (cita) =>
        cita.tipo_cita === "virtual" &&
        ["confirmada", "programada"].includes(cita.estado)
    );

    if (citasHoyVirtuales && citasHoyVirtuales.length > 0) {
      // Tomar la primera cita virtual de hoy
      unirseAVideollamada(citasHoyVirtuales[0]);
    } else {
      // Si no hay citas virtuales hoy, mostrar dashboard de telemedicina
      window.location.href = "/dashboard/telemedicina";
    }
  };

  const citasHoy = agenda.find(
    (dia) => dia.fecha === new Date().toISOString().split("T")[0]
  );

  const pacientesFiltrados = pacientes.filter((paciente) => {
    const nombre = paciente?.nombre?.toLowerCase() || "";
    const apellido = paciente?.apellido?.toLowerCase() || "";
    const dni = paciente?.dni || "";

    const busqueda = busquedaPaciente.toLowerCase();

    return (
      nombre.includes(busqueda) ||
      apellido.includes(busqueda) ||
      dni.includes(busqueda)
    );
  });

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
        <NavbarUniversal showNotifications notificationCount={5} />

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
                  {citasHoy?.citas_completadas || 0} completadas
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

          {/* Tabs Responsivos Mejorados */}
          <Tabs defaultValue="agenda" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-10 sm:h-12 bg-gray-100 p-1">
              <TabsTrigger
                value="agenda"
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="hidden xs:inline">Agenda</span>
                <span className="xs:hidden">Hoy</span>
              </TabsTrigger>
              <TabsTrigger
                value="pacientes"
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Pacientes
              </TabsTrigger>
              <TabsTrigger
                value="recetas"
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm hidden sm:flex"
              >
                Recetas
              </TabsTrigger>
              <TabsTrigger
                value="estadisticas"
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="hidden xs:inline">Estadísticas</span>
                <span className="xs:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger
                value="perfil"
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Perfil
              </TabsTrigger>
            </TabsList>

            {/* CONTENIDO DE AGENDA */}
            <TabsContent value="agenda" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Citas de Hoy */}
                <div className="lg:col-span-2">
                  <Card className="bg-white shadow-sm border-0 sm:border">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div>
                          <CardTitle className="flex items-center text-base sm:text-lg">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                            Citas de Hoy -{" "}
                            {new Date().toLocaleDateString("es-PE")}
                          </CardTitle>
                          <CardDescription className="text-sm sm:text-base">
                            {citasHoy?.total_citas || 0} citas programadas
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 w-fit"
                        >
                          {citasHoy?.citas?.filter(
                            (c) => c.tipo_cita === "virtual"
                          ).length || 0}{" "}
                          virtuales
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {citasHoy && citasHoy.citas.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {(mostrarTodasLasCitas
                            ? citasHoy.citas
                            : citasHoy.citas.slice(0, 5)
                          ).map((cita) => (
                            <div
                              key={cita.id}
                              className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                              onClick={() => verDetallesCita(cita)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                                  {/* Hora */}
                                  <div className="text-center min-w-[70px] sm:min-w-[80px] flex-shrink-0">
                                    <div className="text-base sm:text-lg font-bold text-blue-600">
                                      {cita.hora_cita?.slice(0, 5) || "--:--"}
                                    </div>
                                    <Badge
                                      variant={
                                        cita.estado === "completada"
                                          ? "default"
                                          : cita.estado === "confirmada"
                                          ? "secondary"
                                          : cita.estado === "iniciada"
                                          ? "default"
                                          : "outline"
                                      }
                                      className="capitalize text-xs mt-1"
                                    >
                                      {cita.estado}
                                    </Badge>
                                  </div>

                                  {/* Información del Paciente */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm sm:text-base truncate">
                                      {cita.paciente.nombre}{" "}
                                      {cita.paciente.apellido}
                                    </h4>
                                    <div className="flex items-center space-x-2 mt-1 sm:mt-2 flex-wrap">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          cita.tipo_cita === "virtual"
                                            ? "bg-blue-50 text-blue-700 border-blue-300"
                                            : cita.tipo_cita === "presencial"
                                            ? "bg-green-50 text-green-700 border-green-300"
                                            : cita.tipo_cita === "domicilio"
                                            ? "bg-purple-50 text-purple-700 border-purple-300"
                                            : ""
                                        }`}
                                      >
                                        {getEtiquetaCita(cita.tipo_cita)}
                                      </Badge>
                                      <p className="text-xs sm:text-sm text-gray-600">
                                        {cita.paciente.edad} años
                                      </p>
                                    </div>
                                    {cita.motivo_consulta && (
                                      <p className="text-xs sm:text-sm text-gray-500 mt-2 truncate">
                                        {cita.motivo_consulta}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Estado y Acciones */}
                                <div className="flex flex-col items-end space-y-2 sm:space-y-3 ml-2 sm:ml-4">
                                  <div
                                    className="flex space-x-1 sm:space-x-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-blue-50"
                                      onClick={() => verDetallesCita(cita)}
                                      title="Ver detalles de la cita"
                                    >
                                      <Eye className="w-4 h-4 text-blue-600" />
                                    </Button>

                                    {puedeCrearReceta(cita) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-green-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          crearRecetaDesdeCita(cita);
                                        }}
                                        title="Crear receta"
                                      >
                                        <FileText className="w-4 h-4 text-green-600" />
                                      </Button>
                                    )}

                                    {puedeUnirseAVideollamada(cita) && (
                                      <Button
                                        size="sm"
                                        className="h-8 sm:h-9 px-2 sm:px-3 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() =>
                                          unirseAVideollamada(cita)
                                        }
                                        title="Iniciar videollamada"
                                      >
                                        <Video className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Botón "Ver más" / "Ver menos" */}
                          {citasHoy.citas.length > 5 && (
                            <div className="flex justify-center pt-4 sm:pt-6">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setMostrarTodasLasCitas(!mostrarTodasLasCitas)
                                }
                                className="flex items-center gap-2 h-10 sm:h-9"
                              >
                                {mostrarTodasLasCitas ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Ver menos
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Ver todas ({citasHoy.citas.length})
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 sm:py-12">
                          <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4 sm:mb-6" />
                          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                            No tienes citas programadas para hoy
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Resumen Semanal */}
                <div>
                  <Card className="bg-white shadow-sm border-0 sm:border">
                    <CardHeader>
                      <CardTitle className="flex items-center text-base sm:text-lg">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Próximos 7 Días
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {agenda.map((dia) => {
                          const citasVirtuales = dia.citas.filter(
                            (c) => c.tipo_cita === "virtual"
                          ).length;
                          return (
                            <div
                              key={dia.fecha}
                              className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm sm:text-base">
                                  {new Date(dia.fecha).toLocaleDateString(
                                    "es-PE",
                                    {
                                      weekday: "short",
                                      day: "numeric",
                                      month: "short",
                                    }
                                  )}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {dia.citas_completadas}/{dia.total_citas}{" "}
                                  completadas
                                </p>
                                {citasVirtuales > 0 && (
                                  <p className="text-xs text-green-600 font-medium">
                                    {citasVirtuales} virtual
                                    {citasVirtuales !== 1 ? "es" : ""}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className="mt-1 sm:mt-0 text-xs"
                              >
                                {dia.total_citas} citas
                              </Badge>
                            </div>
                          );
                        })}
                      </div>

                      {/* Estadísticas Rápidas de Telemedicina */}
                      <div className="mt-4 sm:mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                          <Video className="w-4 h-4 mr-2" />
                          Telemedicina Esta Semana
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-blue-600">Total Virtuales</p>
                            <p className="font-semibold text-blue-800">
                              {agenda.reduce(
                                (total, dia) =>
                                  total +
                                  dia.citas.filter(
                                    (c) => c.tipo_cita === "virtual"
                                  ).length,
                                0
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-600">Hoy</p>
                            <p className="font-semibold text-blue-800">
                              {citasHoy?.citas?.filter(
                                (c) => c.tipo_cita === "virtual"
                              ).length || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* CONTENIDO DE PACIENTES */}
            <TabsContent value="pacientes">
              <Card className="bg-white shadow-sm border-0 sm:border">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div>
                      <CardTitle className="text-base sm:text-lg">
                        Mis Pacientes
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        {pacientes.length} pacientes atendidos
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Buscar por nombre o DNI..."
                        value={busquedaPaciente}
                        onChange={(e) => setBusquedaPaciente(e.target.value)}
                        className="w-full sm:w-64 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={buscarPacientesGlobal}
                        className="flex-shrink-0"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {pacientesFiltrados.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {pacientesFiltrados.map((paciente) => (
                        <div
                          key={paciente.id}
                          className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                <AvatarFallback className="text-xs sm:text-sm bg-blue-100 text-blue-600">
                                  {(paciente?.nombre?.[0] || "").toUpperCase()}
                                  {(
                                    paciente?.apellido?.[0] || ""
                                  ).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base truncate">
                                  {paciente.nombre} {paciente.apellido}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1 sm:mt-2 flex-wrap">
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    {paciente.edad} años
                                  </p>
                                  <span className="text-xs text-gray-600">
                                    •
                                  </span>
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    DNI: {paciente.dni}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 truncate">
                                  {paciente.telefono} • {paciente.email}
                                </p>
                                {paciente.tipo_sangre && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Tipo de sangre: {paciente.tipo_sangre}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex flex-col space-y-2 ml-2 sm:ml-4">
                              <div className="flex space-x-1 sm:space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                                  onClick={() => verPerfilPaciente(paciente.id)}
                                >
                                  <User className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                                  onClick={() =>
                                    verHistorialPaciente(paciente.id)
                                  }
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 sm:h-9 px-2 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                >
                                  <Calendar className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Users className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4 sm:mb-6" />
                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                        {busquedaPaciente
                          ? "No se encontraron pacientes"
                          : "No tienes pacientes registrados"}
                      </p>
                      {!busquedaPaciente && (
                        <Button
                          onClick={buscarPacientesGlobal}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Buscar Pacientes
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONTENIDO DE RECETAS */}
            <TabsContent value="recetas">
              <Card className="bg-white shadow-sm border-0 sm:border">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Mis Recetas Médicas
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Recetas prescritas a pacientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecetasMedicoSection />
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONTENIDO DE ESTADÍSTICAS */}
            <TabsContent value="estadisticas">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="bg-white shadow-sm border-0 sm:border">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                      Estadísticas de Práctica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {perfil?.estadisticas?.total_citas || 0}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Total Citas
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {perfil?.estadisticas?.citas_completadas || 0}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Completadas
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          S/{" "}
                          {Number(
                            perfil?.estadisticas?.ingreso_promedio_cita || 0
                          ).toFixed(0)}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Ingreso Promedio
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {perfil?.informacion_profesional?.anos_experiencia ||
                            0}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Años Experiencia
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0 sm:border">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">
                      Información Profesional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Especialidad
                      </p>
                      <p className="font-medium text-sm sm:text-base">
                        {perfil?.informacion_profesional?.especialidad
                          ?.nombre || "No definida"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Colegiatura
                      </p>
                      <p className="font-medium text-sm sm:text-base">
                        {perfil?.informacion_profesional?.numero_colegiatura ||
                          "No definida"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Tarifa Consulta
                      </p>
                      <p className="font-medium text-sm sm:text-base">
                        {perfil?.informacion_profesional?.tarifa_consulta
                          ? `S/ ${Number(
                              perfil?.informacion_profesional.tarifa_consulta
                            ).toFixed(2)}`
                          : "No definida"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Calificación
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm sm:text-base">
                          {Number(
                            perfil?.informacion_profesional
                              ?.calificacion_promedio || 0
                          ).toFixed(1)}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {perfil?.informacion_profesional?.total_consultas ||
                            0}{" "}
                          consultas
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* CONTENIDO DE PERFIL */}
            <TabsContent value="perfil">
              <Card className="bg-white shadow-sm border-0 sm:border">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Mi Perfil Profesional
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Información personal y profesional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {perfil && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                            Información Personal
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Nombre Completo
                              </p>
                              <p className="font-medium text-sm sm:text-base">
                                Dr. {perfil.usuario.nombre}{" "}
                                {perfil.usuario.apellido}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Email
                              </p>
                              <p className="font-medium text-sm sm:text-base flex items-center">
                                <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />
                                {perfil.usuario.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Teléfono
                              </p>
                              <p className="font-medium text-sm sm:text-base flex items-center">
                                <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />
                                {perfil.usuario.telefono}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                            <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                            Información Profesional
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Especialidad
                              </p>
                              <p className="font-medium text-sm sm:text-base">
                                {
                                  perfil.informacion_profesional.especialidad
                                    .nombre
                                }
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {
                                  perfil.informacion_profesional.especialidad
                                    .descripcion
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Número de Colegiatura
                              </p>
                              <p className="font-medium text-sm sm:text-base">
                                {
                                  perfil.informacion_profesional
                                    .numero_colegiatura
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Años de Experiencia
                              </p>
                              <p className="font-medium text-sm sm:text-base">
                                {
                                  perfil.informacion_profesional
                                    .anos_experiencia
                                }{" "}
                                años
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {perfil.informacion_profesional.direccion_consultorio && (
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                            Consultorio
                          </h3>
                          <p className="font-medium text-sm sm:text-base flex items-center">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />
                            {
                              perfil.informacion_profesional
                                .direccion_consultorio
                            }
                          </p>
                        </div>
                      )}

                      {perfil.informacion_profesional.biografia && (
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                            Biografía
                          </h3>
                          <p className="text-gray-600 text-sm sm:text-base">
                            {perfil.informacion_profesional.biografia}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* MODALES */}

        {/* MODAL DE BÚSQUEDA DE PACIENTES - ACTUALIZADO */}
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
          onVerHistorial={(pacienteId: string) => verHistorialPaciente(pacienteId)}
        />
      </div>
    </ProtectedRoute>
  );
}
