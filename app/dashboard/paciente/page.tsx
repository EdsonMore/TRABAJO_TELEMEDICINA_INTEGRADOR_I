// app/dashboard/paciente/page.tsx
// MediLink+ - Dashboard responsivo mejorado para pacientes adultos mayores

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { NavbarUniversal } from "@/components/layout/navbar-universal";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import DetallesCitaModal from "@/components/paciente/detalles-cita-modal";
import { EditarPerfilModal } from "@/components/paciente/editar-perfil-modal";
import { RecetasPacienteSection } from "@/components/paciente/recetas-paciente-section";
import { ResultadosLaboratorioSection } from "@/components/paciente/resultados-laboratorio-section";
import SeguimientoRecetasPaciente from "@/components/paciente/SeguimientoRecetasPaciente";
import SeguimientoRecetas from "@/components/farmacia/seguimiento-recetas";
import dynamic from "next/dynamic";

const ListaRecetasPaciente = dynamic(
  () => import("@/components/paciente/ListaRecetasPaciente"),
  { ssr: false }
);
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
import {
  Calendar,
  Heart,
  Pill,
  MapPin,
  User,
  Phone,
  Mail,
  AlertTriangle,
  Stethoscope,
  TestTube,
  Shield,
  Video,
  Eye,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface CitaPaciente {
  id: string;
  fecha_cita: string;
  hora_cita?: string;
  tipo_cita: "presencial" | "virtual";
  estado: "pendiente" | "confirmada" | "completada" | "cancelada" | "iniciada";
  motivo_consulta?: string;
  medico_nombre?: string;
  medico_apellido?: string;
  especialidad?: string;
  medico?: {
    nombre: string;
    apellido: string;
    especialidad: string;
  };
}

interface Receta {
  id: string;
  codigo_receta: string;
  estado: "activa" | "completada" | "cancelada" | "expirada";
  estado_envio?:
    | "no_enviada"
    | "enviada"
    | "recibida"
    | "rechazada"
    | "dispensada";
  fecha_creacion: string;
  medicamentos?: Array<{
    nombre: string;
    cantidad: number;
    unidad: string;
  }>;
}

export default function DashboardPacientePage() {
  const { usuario, token, logout } = useAuth();
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilPaciente | null>(null);
  const [estadisticasCitas, setEstadisticasCitas] =
    useState<EstadisticasCitas | null>(null);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [citasPaciente, setCitasPaciente] = useState<CitaPaciente[]>([]);
  const [mostrarTodasLasCitas, setMostrarTodasLasCitas] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // Estados para modales
  const [detallesCitaOpen, setDetallesCitaOpen] = useState(false);
  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaPaciente | null>(
    null
  );

  // Estado para la navegación activa - Inicializar desde URL si es posible
  const [activeTab, setActiveTab] = useState("resumen");

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      if (!token) return;

      // Detectar parámetros de URL
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab");
        const mensajeParam = params.get("mensaje");
        
        if (tabParam) {
          setActiveTab(tabParam);
        }
        
        // Mostrar notificación si hay mensaje
        if (mensajeParam === "receta_enviada") {
          try {
            toast({
              title: "Receta Enviada ✓",
              description: "Tu receta ha sido enviada a la farmacia correctamente.",
            });
          } catch (e) {}
        }
      }

      setError(null);
      try {
        // helper para fetch con timeout y parseo seguro
        const safeFetchJSON = async (
          url: string,
          options: RequestInit = {},
          timeout = 10000
        ) => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeout);
          try {
            const res = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            clearTimeout(id);
            let data: any = null;
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              try {
                data = await res.json();
              } catch (e) {
                throw new Error("Respuesta JSON inválida");
              }
            } else {
              data = await res.text();
            }

            if (!res.ok) {
              const msg =
                data && data.message ? data.message : `HTTP ${res.status}`;
              throw new Error(msg);
            }

            return data;
          } catch (err: any) {
            if (err.name === "AbortError")
              throw new Error("La petición tardó demasiado y fue cancelada");
            throw err;
          }
        };

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        // Ejecutar todas las peticiones con manejo centralizado
        const [perfilData, citasData, recetasData] = await Promise.all([
          safeFetchJSON("/api/paciente/perfil", { headers }),
          safeFetchJSON("/api/paciente/citas", { headers }),
          safeFetchJSON("/api/paciente/recetas", { headers }),
        ]);

        if (perfilData) setPerfil(perfilData as PerfilPaciente);
        if (citasData) {
          setEstadisticasCitas((citasData as any).estadisticas || null);
          setCitasPaciente((citasData as any).citas || []);
        }
        if (recetasData && (recetasData as any).recetas) {
          setRecetas((recetasData as any).recetas);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        const msg =
          (error as any)?.message || "Error desconocido al cargar datos";
        setError(msg);
        try {
          toast({ title: "Error cargando dashboard", description: msg });
        } catch (e) {}
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatosDashboard();
  }, [token]);

  const recargarDatos = async () => {
    if (!token) return;

    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const safeFetchJSON = async (
        url: string,
        options: RequestInit = {},
        timeout = 10000
      ) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
          const res = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(id);
          let data: any = null;
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            try {
              data = await res.json();
            } catch (e) {
              throw new Error("Respuesta JSON inválida");
            }
          } else {
            data = await res.text();
          }

          if (!res.ok) {
            const msg =
              data && (data as any).message
                ? (data as any).message
                : `HTTP ${res.status}`;
            throw new Error(msg);
          }

          return data;
        } catch (err: any) {
          if (err.name === "AbortError")
            throw new Error("La petición tardó demasiado y fue cancelada");
          throw err;
        }
      };

      const [perfilData, citasData, recetasData] = await Promise.all([
        safeFetchJSON("/api/paciente/perfil", { headers }),
        safeFetchJSON("/api/paciente/citas", { headers }),
        safeFetchJSON("/api/paciente/recetas", { headers }),
      ]);

      if (perfilData) setPerfil(perfilData as PerfilPaciente);
      if (citasData) {
        setCitasPaciente((citasData as any).citas || []);
        setEstadisticasCitas((citasData as any).estadisticas || null);
      }
      if (recetasData && (recetasData as any).recetas) {
        setRecetas((recetasData as any).recetas);
      }
    } catch (error) {
      console.error("Error recargando datos:", error);
      const msg =
        (error as any)?.message || "Error desconocido al recargar datos";
      setError(msg);
      try {
        toast({ title: "Error recargando datos", description: msg });
      } catch (e) {}
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/auth/login";
  };

  const verDetallesCita = (cita: CitaPaciente) => {
    setCitaSeleccionada(cita);
    setDetallesCitaOpen(true);
  };

  // Función robusta para validar si puede unirse a videollamada (acepta cita opcional)
  const puedeUnirseAVideollamada = (cita?: CitaPaciente | null): boolean => {
    if (!cita) return false;
    if (cita.tipo_cita !== "virtual") return false;
    const estadosValidos = ["confirmada", "programada", "iniciada"];
    if (!estadosValidos.includes(cita.estado)) return false;

    try {
      const ahora = new Date();
      const fechaCita = new Date(cita.fecha_cita);
      if (isNaN(fechaCita.getTime())) return false;

      if (cita.hora_cita) {
        const match = cita.hora_cita.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) return false;
        const horas = Number(match[1]);
        const minutos = Number(match[2]);
        if (isNaN(horas) || isNaN(minutos)) return false;
        fechaCita.setHours(horas, minutos, 0, 0);

        const margenAntes = 15 * 60 * 1000;
        const margenDespues = 2 * 60 * 60 * 1000;
        const tiempoCita = fechaCita.getTime();
        const tiempoActual = ahora.getTime();
        return (
          tiempoActual >= tiempoCita - margenAntes &&
          tiempoActual <= tiempoCita + margenDespues
        );
      }

      const hoy = new Date();
      return fechaCita.toDateString() === hoy.toDateString();
    } catch (e) {
      console.warn("Error validando videollamada:", e);
      return false;
    }
  };

  const unirseAVideollamada = async (cita: CitaPaciente) => {
    if (!token) {
      try {
        toast({
          title: "No autenticado",
          description: "No se encontró token de autenticación",
        });
      } catch (e) {}
      return;
    }

    if (!puedeUnirseAVideollamada(cita)) {
      try {
        toast({
          title: "No puedes unirte",
          description:
            "Verifica que la cita sea virtual, esté confirmada y sea hoy en horario válido.",
        });
      } catch (e) {}
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const safeFetchJSON = async (
        url: string,
        options: RequestInit = {},
        timeout = 10000
      ) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
          const res = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(id);
          let data: any = null;
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            try {
              data = await res.json();
            } catch (e) {
              throw new Error("Respuesta JSON inválida");
            }
          } else {
            data = await res.text();
          }
          if (!res.ok) {
            const msg =
              data && (data as any).message
                ? (data as any).message
                : `HTTP ${res.status}`;
            throw new Error(msg);
          }
          return data;
        } catch (err: any) {
          if (err.name === "AbortError")
            throw new Error("La petición tardó demasiado y fue cancelada");
          throw err;
        }
      };

      // Buscar sesiones existentes
      const sesionesData = await safeFetchJSON(
        `/api/telemedicina/sesiones?cita_id=${encodeURIComponent(cita.id)}`,
        { headers }
      );
      let sesionId: string | undefined;

      if (
        sesionesData &&
        (sesionesData as any).success &&
        Array.isArray((sesionesData as any).sesiones) &&
        (sesionesData as any).sesiones.length > 0
      ) {
        sesionId = (sesionesData as any).sesiones[0].id;
      } else {
        // Crear nueva sesión
        const titulo = `Consulta Virtual - Dr. ${cita.medico_nombre || ""} ${
          cita.medico_apellido || ""
        }`.trim();
        const payload = {
          id_cita: cita.id,
          titulo: titulo || "Consulta Virtual",
          fecha_programada: new Date().toISOString(),
          duracion_minutos: 30,
        };

        const programarData = await safeFetchJSON(
          "/api/telemedicina/programar",
          {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          }
        );

        if (!(programarData as any).success) {
          throw new Error(
            (programarData as any).message || "Error al crear sesión"
          );
        }

        sesionId = (programarData as any).sesion?.id;
      }

      if (!sesionId) throw new Error("No se obtuvo id de sesión");

      try {
        toast({
          title: "Conectando",
          description:
            "Se abrirá la sesión de telemedicina en una nueva pestaña",
        });
      } catch (e) {}
      window.open(`/telemedicina/sesion/${sesionId}`, "_blank");
    } catch (error: any) {
      console.error("Error en videollamada:", error);
      const msg =
        error?.message || "Error desconocido al unirse a la videollamada";
      try {
        toast({ title: "Error videollamada", description: msg });
      } catch (e) {}
    }
  };

  const verUbicacionConsultorio = (cita: CitaPaciente) => {
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

  // Función para obtener datos del médico de forma segura (acepta undefined/null)
  const getMedicoData = (cita?: CitaPaciente | null) => {
    if (!cita)
      return {
        nombre: "Médico",
        apellido: "",
        especialidad: "Consulta general",
      };
    if (cita.medico) {
      return {
        nombre: cita.medico.nombre || "Médico",
        apellido: cita.medico.apellido || "",
        especialidad: cita.medico.especialidad || "Medicina General",
      };
    }
    return {
      nombre: cita.medico_nombre || "Médico",
      apellido: cita.medico_apellido || "",
      especialidad: cita.especialidad || "Consulta general",
    };
  };

  // Función para formatear hora
  const formatearHora = (horaCita?: string): string => {
    if (!horaCita) return "--:--";
    return horaCita.slice(0, 5);
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
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      {" "}
      {/* Añadido padding-bottom para móvil */}
      <NavbarUniversal showNotifications notificationCount={3} />
      {/* Contenido Principal */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {error && (
          <div className="mb-4">
            <Card className="border border-red-200 bg-red-50">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-red-700">Error: {error}</div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={recargarDatos}>
                      Reintentar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setError(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
                      {formatearHora(estadisticasCitas.proxima_cita.hora_cita)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Próxima
                    </Badge>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 truncate">
                    Dr. {getMedicoData(estadisticasCitas.proxima_cita).nombre}{" "}
                    {getMedicoData(estadisticasCitas.proxima_cita).apellido}
                  </div>
                  {puedeUnirseAVideollamada(estadisticasCitas.proxima_cita) && (
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
                {recetas.filter((r) => r.estado === "activa").length}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Recetas activas
              </p>
              {recetas.filter((r) => r.estado === "activa").length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full h-8 text-xs"
                  onClick={() => setActiveTab("recetas")}
                >
                  <Pill className="w-3 h-3 mr-1" />
                  Ver Recetas
                </Button>
              )}
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
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 sm:space-y-6"
        >
          {/* Solo mostrar tabs en desktop */}
          <div className="hidden sm:block">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-12 bg-gray-100 p-1 gap-1">
              <TabsTrigger
                value="resumen"
                className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Resumen
              </TabsTrigger>
              <TabsTrigger
                value="perfil"
                className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Perfil
              </TabsTrigger>
              <TabsTrigger
                value="citas"
                className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Citas
              </TabsTrigger>
              <TabsTrigger
                value="recetas"
                className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Recetas
              </TabsTrigger>
              <TabsTrigger
                value="seguimiento"
                className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                📦 Seguimiento
              </TabsTrigger>
              <TabsTrigger
                value="resultados"
                className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Resultados
              </TabsTrigger>
            </TabsList>
          </div>

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
                      onClick={() => setActiveTab("recetas")}
                    >
                      <Pill className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-green-600" />
                      <span className="text-xs sm:text-sm">Ver Recetas</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 sm:h-16 flex flex-col bg-white hover:bg-gray-50 border-2"
                      onClick={() => setActiveTab("resultados")}
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
                      const medicoData = getMedicoData(cita);
                      const puedeUnirse = puedeUnirseAVideollamada(cita);

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
                                  {formatearHora(cita.hora_cita)}
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
                                  puedeUnirse && (
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
                  Medicamentos prescritos y envío a farmacias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ListaRecetasPaciente />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguimiento">
            <Card className="bg-white shadow-sm border-0 sm:border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  📦 Seguimiento de Recetas
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Estado de tus recetas en la farmacia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SeguimientoRecetasPaciente />
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
      {/* Navegación Inferior para Móviles */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      {/* Modales */}
      <DetallesCitaModal
        isOpen={detallesCitaOpen}
        onClose={() => setDetallesCitaOpen(false)}
        cita={citaSeleccionada}
        onCitaActualizada={recargarDatos}
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
