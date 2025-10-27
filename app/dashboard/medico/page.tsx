// app/dashboard/medico/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
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
          setPacientes(pacientesData.pacientes);
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
  const puedeUnirseAVideollamada = (cita: any) => {
    // Verificar si es cita virtual y está en estado válido
    const esVirtual = cita.tipo_cita === "virtual";
    const estadoValido = ["confirmada", "programada", "iniciada"].includes(
      cita.estado
    );

    // Verificar que la fecha de la cita sea hoy o futura
    const hoy = new Date();
    const fechaCita = new Date(cita.fecha_cita);
    const esFechaValida = fechaCita >= new Date(hoy.setHours(0, 0, 0, 0));

    return esVirtual && estadoValido && esFechaValida;
  };

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
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
        {/* Header Mejorado - Totalmente Responsivo */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo y Nombre */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Avatar className="w-10 h-10 border-2 border-primary/20 flex-shrink-0">
                  <AvatarImage
                    src={perfil?.usuario.avatar_url || ""}
                    alt={`${perfil?.usuario.nombre || ""} ${
                      perfil?.usuario.apellido || ""
                    }`}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                    {(() => {
                      const nombre =
                        perfil?.usuario.nombre?.trim().split(" ") || [];
                      const apellido =
                        perfil?.usuario.apellido?.trim().split(" ") || [];
                      const inicialNombre = nombre[0]?.[0]?.toUpperCase() || "";
                      const inicialApellido =
                        apellido[apellido.length - 1]?.[0]?.toUpperCase() || "";
                      return inicialNombre + inicialApellido || "ML";
                    })()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold text-foreground truncate">
                    Dr. {perfil?.usuario.nombre}
                  </h1>
                  <p className="text-sm text-muted-foreground truncate">
                    {perfil?.informacion_profesional.especialidad.nombre}
                  </p>
                </div>
              </div>

              {/* Botones de Acción - Desktop */}
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={iniciarTelemedicina}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <Video className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Telemedicina</span>
                </Button>


                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Nueva Cita</span>
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden md:flex"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Cerrar Sesión
                </Button>
              </div>

              {/* Botón Menú Móvil */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden ml-2"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Menú Móvil Mejorado */}
            {mobileMenuOpen && (
              <div className="sm:hidden border-t border-gray-200 pt-4 pb-2 space-y-2 bg-white mt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start text-base h-12"
                  onClick={() => {
                    iniciarTelemedicina();
                    setMobileMenuOpen(false);
                  }}
                >
                  <Video className="w-5 h-5 mr-3" />
                  Iniciar Telemedicina
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-base h-12"
                  onClick={() => {
                    buscarPacientesGlobal();
                    setMobileMenuOpen(false);
                  }}
                >
                  <Search className="w-5 h-5 mr-3" />
                  Buscar Pacientes
                </Button>

                <Button
                  className="w-full justify-start text-base h-12 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    // Nueva cita
                    setMobileMenuOpen(false);
                  }}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Nueva Cita
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-base h-12 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Cerrar Sesión
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* Tarjetas de Resumen - Grid Responsivo Mejorado */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
            <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {perfil?.estadisticas.citas_hoy || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {citasHoy?.citas_completadas || 0} completadas de{" "}
                  {citasHoy?.total_citas || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pacientes
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {perfil?.estadisticas.total_pacientes || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pacientes atendidos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Citas Programadas
                </CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {perfil?.estadisticas.citas_programadas || 0}
                </div>
                <p className="text-xs text-muted-foreground">Próximas citas</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Calificación
                </CardTitle>
                <Award className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {Number(
                    perfil?.informacion_profesional?.calificacion_promedio || 0
                  ).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {perfil?.informacion_profesional?.total_consultas || 0}{" "}
                  consultas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contenido Principal con Tabs */}
          <Tabs defaultValue="agenda" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-10 sm:h-12 bg-gray-100 p-1">
              <TabsTrigger
                value="agenda"
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Agenda
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

            <TabsContent value="agenda" className="space-y-4 sm:space-y-6">
              {/* ... (mismo contenido de agenda) ... */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Citas de Hoy */}
                <div className="lg:col-span-2">
                  <Card className="bg-white shadow-sm border-0 sm:border">
                    <CardHeader>
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-primary" />
                          Citas de Hoy -{" "}
                          {new Date().toLocaleDateString("es-PE")}
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
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {citasHoy && citasHoy.citas.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {citasHoy.citas.map((cita) => (
                            <div
                              key={cita.id}
                              className="flex flex-col sm:flex-row items-start justify-between p-3 sm:p-4 border border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                            >
                              <div className="flex items-start space-x-3 sm:space-x-4 w-full sm:w-auto mb-3 sm:mb-0">
                                <div className="text-center min-w-[70px] sm:min-w-[80px] flex-shrink-0">
                                  <div className="text-base sm:text-lg font-bold">
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
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm sm:text-base">
                                    {cita.paciente.nombre}{" "}
                                    {cita.paciente.apellido}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                    {cita.motivo_consulta}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <p className="text-xs text-muted-foreground">
                                      {cita.paciente.edad} años
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      •
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs capitalize"
                                    >
                                      {cita.tipo_cita}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* ACCIONES MEJORADAS PARA MÓVIL */}
                              <div className="flex flex-col xs:flex-row items-stretch xs:items-center w-full sm:w-auto space-y-2 xs:space-y-0 xs:space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => verDetallesCita(cita)}
                                  className="flex-1 xs:flex-none h-8 sm:h-9 text-xs"
                                >
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  Detalles
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => crearRecetaDesdeCita(cita)}
                                  className="flex-1 xs:flex-none h-8 sm:h-9 text-xs"
                                >
                                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  Receta
                                </Button>

                                {cita.tipo_cita === "virtual" &&
                                  puedeUnirseAVideollamada(cita) && (
                                    <Button
                                      size="sm"
                                      className="flex-1 xs:flex-none h-8 sm:h-9 text-xs bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => unirseAVideollamada(cita)}
                                    >
                                      <Video className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                      Unirse
                                    </Button>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 sm:py-8">
                          <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                          <p className="text-muted-foreground text-sm sm:text-base">
                            No tienes citas programadas para hoy
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Resumen Semanal MEJORADO */}
                <div>
                  <Card className="bg-white shadow-sm border-0 sm:border">
                    <CardHeader>
                      <CardTitle className="flex items-center text-base sm:text-lg">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
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
                              className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
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
                                <p className="text-xs text-muted-foreground">
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

            <TabsContent value="pacientes">
              <Card className="bg-white shadow-sm border-0 sm:border">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="w-full sm:w-auto">
                      <CardTitle className="flex items-center text-base sm:text-lg">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                        Mis Pacientes ({pacientes.length})
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        Lista de pacientes que has atendido
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
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
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                        >
                          {/* Info del paciente */}
                          <div className="flex items-start space-x-3 sm:space-x-4 w-full sm:w-auto mb-3 sm:mb-0">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarFallback className="text-xs sm:text-sm bg-blue-100 text-blue-600">
                                {(paciente?.nombre?.[0] || "").toUpperCase()}
                                {(paciente?.apellido?.[0] || "").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm sm:text-base truncate">
                                {paciente.nombre} {paciente.apellido}
                              </h4>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {paciente.edad} años • DNI: {paciente.dni}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {paciente.telefono} • {paciente.email}
                              </p>
                              {paciente.tipo_sangre && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Tipo de sangre: {paciente.tipo_sangre}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* ACCIONES MEJORADAS - CON FUNCIONES CORRECTAS */}
                          <div className="flex flex-col xs:flex-row items-stretch xs:items-center w-full sm:w-auto space-y-2 xs:space-y-0 xs:space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verPerfilPaciente(paciente.id)}
                              className="flex-1 xs:flex-none h-8 sm:h-9 text-xs"
                            >
                              <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Perfil
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verHistorialPaciente(paciente.id)}
                              className="flex-1 xs:flex-none h-8 sm:h-9 text-xs"
                            >
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Historial
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 xs:flex-none h-8 sm:h-9 text-xs bg-blue-600 hover:bg-blue-700"
                            >
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Cita
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                      <p className="text-muted-foreground text-sm sm:text-base">
                        {busquedaPaciente
                          ? "No se encontraron pacientes"
                          : "No tienes pacientes registrados"}
                      </p>
                      {!busquedaPaciente && (
                        <Button
                          onClick={buscarPacientesGlobal}
                          className="mt-4"
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

            {/* NUEVA PESTAÑA RECETAS */}
            <TabsContent value="recetas">
              <RecetasMedicoSection />
            </TabsContent>

            <TabsContent value="estadisticas">
              {/* ... (mismo contenido de estadísticas) ... */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="bg-white shadow-sm border-0 sm:border">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                      Estadísticas de Práctica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-card/50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          {perfil?.estadisticas?.total_citas || 0}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Total Citas
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-card/50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          {perfil?.estadisticas?.citas_completadas || 0}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Completadas
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-card/50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          S/{" "}
                          {Number(
                            perfil?.estadisticas?.ingreso_promedio_cita || 0
                          ).toFixed(0)}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Ingreso Promedio
                        </p>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-card/50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          {perfil?.informacion_profesional?.anos_experiencia ||
                            0}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
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
                      <label className="text-xs sm:text-sm text-muted-foreground">
                        Especialidad
                      </label>
                      <p className="font-medium text-sm sm:text-base">
                        {perfil?.informacion_profesional?.especialidad
                          ?.nombre || "No definida"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm text-muted-foreground">
                        Colegiatura
                      </label>
                      <p className="font-medium text-sm sm:text-base">
                        {perfil?.informacion_profesional?.numero_colegiatura ||
                          "No definida"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm text-muted-foreground">
                        Tarifa Consulta
                      </label>
                      <p className="font-medium text-sm sm:text-base">
                        {perfil?.informacion_profesional?.tarifa_consulta
                          ? `S/ ${Number(
                              perfil?.informacion_profesional.tarifa_consulta
                            ).toFixed(2)}`
                          : "No definida"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm text-muted-foreground">
                        Calificación
                      </label>
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

            <TabsContent value="perfil">
              {/* ... (mismo contenido de perfil) ... */}
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
                          <h3 className="text-base sm:text-lg font-semibold mb-4">
                            Información Personal
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs sm:text-sm text-muted-foreground">
                                Nombre Completo
                              </label>
                              <p className="font-medium text-sm sm:text-base">
                                Dr. {perfil.usuario.nombre}{" "}
                                {perfil.usuario.apellido}
                              </p>
                            </div>
                            <div>
                              <label className="text-xs sm:text-sm text-muted-foreground">
                                Email
                              </label>
                              <p className="font-medium text-sm sm:text-base flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                {perfil.usuario.email}
                              </p>
                            </div>
                            <div>
                              <label className="text-xs sm:text-sm text-muted-foreground">
                                Teléfono
                              </label>
                              <p className="font-medium text-sm sm:text-base flex items-center">
                                <Phone className="w-4 h-4 mr-2" />
                                {perfil.usuario.telefono}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base sm:text-lg font-semibold mb-4">
                            Información Profesional
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs sm:text-sm text-muted-foreground">
                                Especialidad
                              </label>
                              <p className="font-medium text-sm sm:text-base">
                                {
                                  perfil.informacion_profesional.especialidad
                                    .nombre
                                }
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {
                                  perfil.informacion_profesional.especialidad
                                    .descripcion
                                }
                              </p>
                            </div>
                            <div>
                              <label className="text-xs sm:text-sm text-muted-foreground">
                                Número de Colegiatura
                              </label>
                              <p className="font-medium text-sm sm:text-base">
                                {
                                  perfil.informacion_profesional
                                    .numero_colegiatura
                                }
                              </p>
                            </div>
                            <div>
                              <label className="text-xs sm:text-sm text-muted-foreground">
                                Años de Experiencia
                              </label>
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
                          <h3 className="text-base sm:text-lg font-semibold mb-4">
                            Consultorio
                          </h3>
                          <p className="font-medium text-sm sm:text-base flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {
                              perfil.informacion_profesional
                                .direccion_consultorio
                            }
                          </p>
                        </div>
                      )}

                      {perfil.informacion_profesional.biografia && (
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold mb-4">
                            Biografía
                          </h3>
                          <p className="text-muted-foreground text-sm sm:text-base">
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
        />
      </div>
    </ProtectedRoute>
  );
}
