// app/dashboard/paciente/page.tsx
// MediLink+ - Dashboard responsivo mejorado para pacientes adultos mayores

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DetallesCitaModal } from "@/components/paciente/detalles-cita-modal";
import { EditarPerfilModal } from "@/components/paciente/editar-perfil-modal";
import { RecetasPacienteSection } from "@/components/paciente/recetas-paciente-section";
import { ResultadosLaboratorioSection } from "@/components/paciente/resultados-laboratorio-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Heart,
  Pill,
  MapPin,
  User,
  Phone,
  Mail,
  AlertTriangle,
  Activity,
  Stethoscope,
  TestTube,
  Shield,
  Bell,
  Plus,
  LogOut,
  Video,
  Eye,
  ChevronDown,
  ChevronUp,
  Home,
  Menu,
  X,
} from "lucide-react";

interface PerfilPaciente {
  id: string;
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  informacion_personal: {
    dni: string;
    edad: number;
    sexo: string;
    tipo_sangre?: string;
    direccion: string;
  };
  informacion_medica: {
    peso_kg?: number;
    altura_cm?: number;
    imc?: string;
    alergias?: string;
    enfermedades_cronicas?: string;
    seguro_medico?: string;
  };
  contacto_emergencia: {
    nombre?: string;
    telefono?: string;
  };
}

interface EstadisticasCitas {
  total: number;
  completadas: number;
  programadas: number;
  canceladas: number;
  proxima_cita?: any;
}

export default function DashboardPacientePage() {
  const { usuario, token, logout } = useAuth();
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilPaciente | null>(null);
  const [estadisticasCitas, setEstadisticasCitas] =
    useState<EstadisticasCitas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [citasPaciente, setCitasPaciente] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mostrarTodasLasCitas, setMostrarTodasLasCitas] = useState(false);

  // Estados para modales
  const [detallesCitaOpen, setDetallesCitaOpen] = useState(false);
  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      if (!token) return;

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [perfilRes, citasRes] = await Promise.all([
          fetch("/api/paciente/perfil", { headers }),
          fetch("/api/paciente/citas", { headers }),
        ]);

        if (perfilRes.ok) {
          const perfilData = await perfilRes.json();
          setPerfil(perfilData);
        }

        if (citasRes.ok) {
          const citasData = await citasRes.json();
          setEstadisticasCitas(citasData.estadisticas);
          setCitasPaciente(citasData.citas || []);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatosDashboard();
  }, [token]);

  const recargarDatos = async () => {
    if (!token) return;

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [perfilRes, citasRes] = await Promise.all([
        fetch("/api/paciente/perfil", { headers }),
        fetch("/api/paciente/citas", { headers }),
      ]);

      if (perfilRes.ok) {
        const perfilData = await perfilRes.json();
        setPerfil(perfilData);
      }

      if (citasRes.ok) {
        const citasData = await citasRes.json();
        setCitasPaciente(citasData.citas || []);
        setEstadisticasCitas(citasData.estadisticas);
      }
    } catch (error) {
      console.error("Error recargando datos:", error);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/auth/login";
  };

  const verDetallesCita = (cita: any) => {
    setCitaSeleccionada(cita);
    setDetallesCitaOpen(true);
  };

  const unirseAVideollamada = async (cita: any) => {
    try {
      if (cita.tipo_cita !== "virtual") {
        alert("❌ Esta cita no es virtual.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const sesionesResponse = await fetch(
        `/api/telemedicina/sesiones?cita_id=${cita.id}`,
        { headers }
      );

      if (!sesionesResponse.ok) throw new Error("Error al buscar sesión");

      const sesionesData = await sesionesResponse.json();
      let sesionId;

      if (sesionesData.success && sesionesData.sesiones.length > 0) {
        sesionId = sesionesData.sesiones[0].id;
        window.open(`/telemedicina/sesion/${sesionId}`, "_blank");
      } else {
        const programarResponse = await fetch("/api/telemedicina/programar", {
          method: "POST",
          headers,
          body: JSON.stringify({
            id_cita: cita.id,
            titulo: "Consulta Virtual",
            fecha_programada: new Date().toISOString(),
            duracion_minutos: 30,
          }),
        });

        const programarData = await programarResponse.json();
        if (!programarData.success) throw new Error("Error al crear sesión");

        sesionId = programarData.sesion.id;
        window.open(`/telemedicina/sesion/${sesionId}`, "_blank");
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const puedeUnirseAVideollamada = (cita: any) => {
    const esVirtual = cita.tipo_cita === "virtual";
    const estadoValido = ["confirmada", "programada", "iniciada"].includes(
      cita.estado
    );
    const hoy = new Date();
    const fechaCita = new Date(cita.fecha_cita);
    const esFechaValida = fechaCita >= new Date(hoy.setHours(0, 0, 0, 0));

    return esVirtual && estadoValido && esFechaValida;
  };

  const verUbicacionConsultorio = (cita: any) => {
    const consultorio = {
      nombre: "Consultorio Principal MediLink+",
      direccion: "Av. La Marina 1234, Lima",
      coordenadas: "-12.0464,-77.0428",
      telefono: "+51 1 2345678",
    };

    const mensaje = `📍 ${consultorio.nombre}\n🏥 ${consultorio.direccion}\n📞 ${consultorio.telefono}\n\n¿Abrir en Google Maps?`;

    if (confirm(mensaje)) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${consultorio.coordenadas}`,
        "_blank"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 text-sm">
            Cargando tu información médica...
          </p>
        </div>
      </div>
    );
  }

  const getIMCStatus = (imc?: string) => {
    if (!imc) return { status: "Sin datos", color: "secondary" };
    const imcNum = Number.parseFloat(imc);
    if (imcNum < 18.5) return { status: "Bajo peso", color: "destructive" };
    if (imcNum < 25) return { status: "Normal", color: "default" };
    if (imcNum < 30) return { status: "Sobrepeso", color: "secondary" };
    return { status: "Obesidad", color: "destructive" };
  };

  const imcStatus = getIMCStatus(perfil?.informacion_medica.imc);

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 text-sm">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (usuario.rol !== "paciente") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 text-sm">
            No tienes permisos para acceder a esta página.
          </p>
          <Button onClick={handleLogout}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mejorado - Totalmente Responsivo */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y Nombre */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  Hola, {perfil?.usuario.nombre}
                </h1>
                <p className="text-sm text-gray-600 hidden xs:block truncate">
                  Panel de salud personal
                </p>
                <p className="text-sm text-gray-600 xs:hidden truncate">
                  {perfil?.usuario.nombre} {perfil?.usuario.apellido}
                </p>
              </div>
            </div>

            {/* Botones de Acción - Desktop */}
            <div className="hidden sm:flex items-center space-x-2 ml-4">
              <Button
                onClick={() => router.push("/dashboard/citas")}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">Nueva Cita</span>
                <span className="md:hidden">Cita</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditarPerfilOpen(true)}
                className="hidden lg:flex"
              >
                <User className="w-4 h-4 mr-1" />
                Perfil
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">Cerrar Sesión</span>
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
            <div className="sm:hidden border-t border-gray-200 pt-4 pb-4 space-y-2 bg-white">
              <Button
                variant="outline"
                className="w-full justify-start text-base h-12"
                onClick={() => {
                  router.push("/dashboard/citas");
                  setMobileMenuOpen(false);
                }}
              >
                <Plus className="w-5 h-5 mr-3" />
                Nueva Cita
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-base h-12"
                onClick={() => {
                  setEditarPerfilOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                <User className="w-5 h-5 mr-3" />
                Editar Perfil
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
          {/* Próxima Cita */}
          <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-semibold">
                  Próxima Cita
                </CardTitle>
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {estadisticasCitas?.proxima_cita ? (
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-lg sm:text-xl font-bold text-blue-600">
                    {new Date(
                      estadisticasCitas.proxima_cita.fecha_cita
                    ).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {estadisticasCitas.proxima_cita.hora_cita?.slice(0, 5) ||
                        "Por confirmar"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Próxima
                    </Badge>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 truncate">
                    Dr. {estadisticasCitas.proxima_cita.medico_nombre}
                  </div>
                  {estadisticasCitas.proxima_cita.tipo_cita === "virtual" && (
                    <Button
                      size="sm"
                      className="w-full h-7 sm:h-8 text-xs bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        unirseAVideollamada(estadisticasCitas.proxima_cita)
                      }
                    >
                      <Video className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Unirse
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    Sin citas
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Programa tu consulta
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seguro Médico */}
          <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-semibold">
                  Seguro Médico
                </CardTitle>
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {perfil?.informacion_medica.seguro_medico ? "Activo" : "No"}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                {perfil?.informacion_medica.seguro_medico || "Sin seguro"}
              </p>
            </CardContent>
          </Card>

          {/* Medicamentos */}
          <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-semibold">
                  Medicamentos
                </CardTitle>
                <Pill className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                0
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Recetas activas
              </p>
            </CardContent>
          </Card>

          {/* Exámenes */}
          <Card className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-semibold">
                  Exámenes
                </CardTitle>
                <TestTube className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                0
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Pendientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Responsivos Mejorados */}
        <Tabs defaultValue="resumen" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-10 sm:h-12 bg-gray-100 p-1">
            <TabsTrigger
              value="resumen"
              className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <span className="hidden xs:inline">Resumen</span>
              <span className="xs:hidden">Inicio</span>
            </TabsTrigger>
            <TabsTrigger
              value="perfil"
              className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Perfil
            </TabsTrigger>
            <TabsTrigger
              value="citas"
              className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Citas
            </TabsTrigger>
            <TabsTrigger
              value="recetas"
              className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm hidden sm:flex"
            >
              Recetas
            </TabsTrigger>
            <TabsTrigger
              value="resultados"
              className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm hidden sm:flex"
            >
              Resultados
            </TabsTrigger>
          </TabsList>

          {/* Contenido de Tabs */}
          <TabsContent value="resumen" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Información Personal */}
              <Card className="bg-white shadow-sm border-0 sm:border">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Edad</p>
                      <p className="font-medium text-sm sm:text-base">
                        {perfil?.informacion_personal.edad} años
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Tipo de Sangre
                      </p>
                      <p className="font-medium text-sm sm:text-base">
                        {perfil?.informacion_personal.tipo_sangre ||
                          "No registrado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">IMC</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm sm:text-base">
                          {perfil?.informacion_medica.imc || "N/A"}
                        </p>
                        <Badge
                          variant={imcStatus.color as any}
                          className="text-xs"
                        >
                          {imcStatus.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Seguro</p>
                      <p className="font-medium text-sm sm:text-base">
                        {perfil?.informacion_medica.seguro_medico ? "Sí" : "No"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones Rápidas */}
              <Card className="bg-white shadow-sm border-0 sm:border">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    Acciones Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Button
                      variant="outline"
                      className="h-14 sm:h-16 flex flex-col bg-white hover:bg-gray-50 border-2"
                      onClick={() => router.push("/dashboard/citas")}
                    >
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-blue-600" />
                      <span className="text-xs sm:text-sm">Agendar Cita</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 sm:h-16 flex flex-col bg-white hover:bg-gray-50 border-2"
                      onClick={() => {
                        const trigger = document.querySelector(
                          '[value="recetas"]'
                        ) as HTMLElement;
                        if (trigger) trigger.click();
                      }}
                    >
                      <Pill className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-green-600" />
                      <span className="text-xs sm:text-sm">Ver Recetas</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 sm:h-16 flex flex-col bg-white hover:bg-gray-50 border-2"
                      onClick={() => {
                        const trigger = document.querySelector(
                          '[value="resultados"]'
                        ) as HTMLElement;
                        if (trigger) trigger.click();
                      }}
                    >
                      <TestTube className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-purple-600" />
                      <span className="text-xs sm:text-sm">Resultados</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 sm:h-16 flex flex-col bg-white hover:bg-gray-50 border-2"
                      onClick={() => setEditarPerfilOpen(true)}
                    >
                      <User className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-orange-600" />
                      <span className="text-xs sm:text-sm">Editar Perfil</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="perfil">
            <Card className="bg-white shadow-sm border-0 sm:border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div>
                    <CardTitle className="text-base sm:text-lg">
                      Mi Perfil Médico
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Información personal y médica
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setEditarPerfilOpen(true)}
                    size="sm"
                    className="w-full sm:w-auto h-10 sm:h-9"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 sm:space-y-8">
                {perfil && (
                  <>
                    {/* Información Personal */}
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Información Personal
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Nombre Completo
                          </p>
                          <p className="font-medium text-sm sm:text-base mt-1">
                            {perfil.usuario.nombre} {perfil.usuario.apellido}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            DNI
                          </p>
                          <p className="font-medium text-sm sm:text-base mt-1">
                            {perfil.informacion_personal.dni}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Email
                          </p>
                          <p className="font-medium text-sm sm:text-base mt-1 flex items-center">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />
                            {perfil.usuario.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Teléfono
                          </p>
                          <p className="font-medium text-sm sm:text-base mt-1 flex items-center">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />
                            {perfil.usuario.telefono || "No registrado"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Información Médica */}
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                        <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Información Médica
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Tipo de Sangre
                          </p>
                          <p className="font-medium text-sm sm:text-base mt-1">
                            {perfil.informacion_personal.tipo_sangre ||
                              "No registrado"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Peso
                          </p>
                          <p className="font-medium text-sm sm:text-base mt-1">
                            {perfil.informacion_medica.peso_kg
                              ? `${perfil.informacion_medica.peso_kg} kg`
                              : "No registrado"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Altura
                          </p>
                          <p className="font-medium text-sm sm:text-base mt-1">
                            {perfil.informacion_medica.altura_cm
                              ? `${perfil.informacion_medica.altura_cm} cm`
                              : "No registrado"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            IMC
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="font-medium text-sm sm:text-base">
                              {perfil.informacion_medica.imc || "N/A"}
                            </p>
                            <Badge
                              variant={imcStatus.color as any}
                              className="text-xs"
                            >
                              {imcStatus.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs sm:text-sm text-gray-600">
                            Alergias
                          </p>
                          <p className="font-medium text-sm sm:text-base mt-1">
                            {perfil.informacion_medica.alergias ||
                              "Ninguna registrada"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contacto de Emergencia */}
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Contacto de Emergencia
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Nombre
                          </p>
                          <p className="font-medium text-sm sm:text-base mt-1">
                            {perfil.contacto_emergencia.nombre ||
                              "No registrado"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Teléfono
                          </p>
                          <p className="font-medium text-sm sm:text-base mt-1">
                            {perfil.contacto_emergencia.telefono ||
                              "No registrado"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="citas">
            <Card className="bg-white shadow-sm border-0 sm:border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div>
                    <CardTitle className="text-base sm:text-lg">
                      Mis Citas Médicas
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      {citasPaciente.length > 0
                        ? `${citasPaciente.length} citas encontradas`
                        : "Historial de consultas"}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard/citas")}
                    size="sm"
                    className="w-full sm:w-auto h-10 sm:h-9 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agendar Cita
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {citasPaciente.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {(mostrarTodasLasCitas
                      ? citasPaciente
                      : citasPaciente.slice(0, 5)
                    ).map((cita) => {
                      const getMedicoData = () => {
                        if (cita.medico) {
                          return {
                            nombre: cita.medico.nombre || "",
                            apellido: cita.medico.apellido || "",
                            especialidad:
                              cita.medico.especialidad || "Medicina General",
                          };
                        } else {
                          return {
                            nombre: cita.medico_nombre || "Médico",
                            apellido: cita.medico_apellido || "",
                            especialidad:
                              cita.especialidad || "Consulta general",
                          };
                        }
                      };

                      const medicoData = getMedicoData();

                      return (
                        <div
                          key={cita.id}
                          className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                          onClick={() => verDetallesCita(cita)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                              {/* Fecha y Hora */}
                              <div className="text-center min-w-[70px] sm:min-w-[80px] flex-shrink-0">
                                <div className="text-xs font-medium text-gray-600 uppercase">
                                  {new Date(cita.fecha_cita).toLocaleDateString(
                                    "es-PE",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </div>
                                <div className="text-base sm:text-lg font-bold text-blue-600 mt-1">
                                  {new Date(cita.fecha_cita).toLocaleDateString(
                                    "es-PE",
                                    {
                                      weekday: "short",
                                    }
                                  )}
                                </div>
                                <div className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded mt-1">
                                  {cita.hora_cita
                                    ? typeof cita.hora_cita === "string"
                                      ? cita.hora_cita.slice(0, 5)
                                      : `${cita.hora_cita
                                          .toString()
                                          .padStart(2, "0")}:00`
                                    : "--:--"}
                                </div>
                              </div>

                              {/* Información del Médico y Cita */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base truncate">
                                  Dr. {medicoData.nombre} {medicoData.apellido}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1 sm:mt-2 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className="text-xs capitalize"
                                  >
                                    {cita.tipo_cita || "presencial"}
                                  </Badge>
                                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                                    {medicoData.especialidad}
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
                              <Badge
                                variant={
                                  cita.estado === "completada"
                                    ? "default"
                                    : cita.estado === "confirmada"
                                    ? "secondary"
                                    : cita.estado === "cancelada"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-xs capitalize"
                              >
                                {cita.estado || "pendiente"}
                              </Badge>

                              <div
                                className="flex space-x-1 sm:space-x-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                                  onClick={() => verDetallesCita(cita)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>

                                {cita.tipo_cita === "virtual" &&
                                  puedeUnirseAVideollamada(cita) && (
                                    <Button
                                      size="sm"
                                      className="h-8 sm:h-9 px-2 sm:px-3 bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => unirseAVideollamada(cita)}
                                    >
                                      <Video className="w-4 h-4" />
                                    </Button>
                                  )}

                                {cita.tipo_cita === "presencial" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      verUbicacionConsultorio(cita);
                                    }}
                                  >
                                    <MapPin className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Botón "Ver más" / "Ver menos" */}
                    {citasPaciente.length > 5 && (
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
                              Ver todas ({citasPaciente.length})
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
                      No hay citas programadas
                    </p>
                    <Button
                      onClick={() => router.push("/dashboard/citas")}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Agendar Primera Cita
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recetas">
            <Card className="bg-white shadow-sm border-0 sm:border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Mis Recetas Médicas
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Medicamentos prescritos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecetasPacienteSection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultados">
            <Card className="bg-white shadow-sm border-0 sm:border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Resultados de Laboratorio
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Exámenes y resultados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResultadosLaboratorioSection />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modales */}
      <DetallesCitaModal
        isOpen={detallesCitaOpen}
        onClose={() => setDetallesCitaOpen(false)}
        cita={citaSeleccionada}
        onCitaActualizada={recargarDatos}
        onUnirseVideollamada={unirseAVideollamada}
      />
      <EditarPerfilModal
        isOpen={editarPerfilOpen}
        onClose={() => setEditarPerfilOpen(false)}
        perfil={perfil}
        onPerfilActualizado={recargarDatos}
      />
    </div>
  );
}
