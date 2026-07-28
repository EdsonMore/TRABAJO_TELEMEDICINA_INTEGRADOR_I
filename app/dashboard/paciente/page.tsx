// app/dashboard/paciente/page.tsx
// MediLink+ - Dashboard responsivo mejorado para pacientes adultos mayores

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import DetallesCitaModal from "@/components/paciente/detalles-cita-modal";
import { EditarPerfilModal } from "@/components/paciente/editar-perfil-modal";
import { EvaluacionCitaModal } from "@/components/paciente/evaluacion-cita-modal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Heart,
  Pill,
  User,
  AlertTriangle,
  TestTube,
  Shield,
  Video,
  Package,
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
  const [evaluacionOpen, setEvaluacionOpen] = useState(false);
  const [citaAEvaluar, setCitaAEvaluar] = useState<CitaPaciente | null>(null);
  
  // 🔥 Estado para alerta de videollamada no iniciada
  const [videollamadaAlertaOpen, setVideollamadaAlertaOpen] = useState(false);
  const [videollamadaAlertaMensaje, setVideollamadaAlertaMensaje] = useState("");



  useEffect(() => {
    const cargarDatosDashboard = async () => {
      if (!token) return;

      // Detectar parámetros de URL
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const mensajeParam = params.get("mensaje");
        
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
        `/api/telemedicina/sesiones?cita_id=${encodeURIComponent(cita.id)}&_t=${Date.now()}`,
        { headers, cache: "no-store" }
      );
      let sesionId: string | undefined;
      let sesionData: any = null;

      if (
        sesionesData &&
        (sesionesData as any).success &&
        Array.isArray((sesionesData as any).sesiones) &&
        (sesionesData as any).sesiones.length > 0
      ) {
        sesionData = (sesionesData as any).sesiones[0];
        sesionId = sesionData.id;
        
        // 🔥 VALIDACIÓN CRÍTICA: Verificar si el médico ha iniciado la sesión
        if (sesionData.estado !== 'iniciada') {
          throw new Error(
            `⏳ No puedes unirte a la videollamada aún.\n\nEl médico debe iniciar la sesión primero.\n\nEstado actual: ${sesionData.estado}`
          );
        }
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
        
        // 🔥 VALIDACIÓN: Nueva sesión está en estado 'programada', no se puede unir aún
        throw new Error(
          `⏳ No puedes unirte a la videollamada aún.\n\nEl médico debe iniciar la sesión primero.\n\nEstado actual: programada`
        );
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
      
      console.log("📢 Tipo de error:", typeof error);
      console.log("📢 Mensaje:", msg);
      console.log("📢 ¿Incluye 'No puedes unirte'?", msg.includes("No puedes unirte"));
      
      // 🔥 Si es error de videollamada no iniciada, mostrar alerta especial
      if (msg.includes("No puedes unirte") || msg.includes("El médico debe iniciar")) {
        console.log("✅ Mostrando modal de alerta de videollamada no iniciada");
        setVideollamadaAlertaMensaje(msg);
        setVideollamadaAlertaOpen(true);
      } else {
        console.log("❌ Mostrando toast de error general");
        try {
          toast({ title: "Error videollamada", description: msg });
        } catch (e) {}
      }
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
    <div className="min-h-screen bg-gray-50">
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
                  onClick={() => router.push("/dashboard/paciente/recetas")}
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

        {/* Navegación a secciones */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 lg:mb-8">
          <Card
            className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md cursor-pointer"
            onClick={() => router.push("/dashboard/paciente/perfil")}
          >
            <CardContent className="flex flex-col items-center justify-center py-4 sm:py-6">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Mi Perfil</span>
            </CardContent>
          </Card>
          <Card
            className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md cursor-pointer"
            onClick={() => router.push("/dashboard/paciente/citas")}
          >
            <CardContent className="flex flex-col items-center justify-center py-4 sm:py-6">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Mis Citas</span>
            </CardContent>
          </Card>
          <Card
            className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md cursor-pointer"
            onClick={() => router.push("/dashboard/paciente/recetas")}
          >
            <CardContent className="flex flex-col items-center justify-center py-4 sm:py-6">
              <Pill className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 mb-2" />
              <span className="text-sm font-medium">Recetas</span>
            </CardContent>
          </Card>
          <Card
            className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md cursor-pointer"
            onClick={() => router.push("/dashboard/paciente/seguimiento")}
          >
            <CardContent className="flex flex-col items-center justify-center py-4 sm:py-6">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600 mb-2" />
              <span className="text-sm font-medium">Seguimiento</span>
            </CardContent>
          </Card>
          <Card
            className="bg-white shadow-sm border-0 sm:border transition-all duration-200 hover:shadow-md cursor-pointer"
            onClick={() => router.push("/dashboard/paciente/resultados")}
          >
            <CardContent className="flex flex-col items-center justify-center py-4 sm:py-6">
              <TestTube className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 mb-2" />
              <span className="text-sm font-medium">Resultados</span>
            </CardContent>
          </Card>
        </div>

        {/* Información Personal y Acciones Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 lg:mb-8">
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
                  onClick={() => router.push("/dashboard/paciente/recetas")}
                >
                  <Pill className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-green-600" />
                  <span className="text-xs sm:text-sm">Ver Recetas</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-14 sm:h-16 flex flex-col bg-white hover:bg-gray-50 border-2"
                  onClick={() => router.push("/dashboard/paciente/resultados")}
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
      </main>

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
      
      {/* 🔥 MODAL: Alerta de Videollamada no iniciada - Diseño para adultos mayores */}
      {videollamadaAlertaOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            {/* Icono */}
            <div className="flex justify-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertTriangle className="w-10 h-10 text-yellow-600" />
              </div>
            </div>

            {/* Título */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                ⏳ Videollamada<br />no disponible
              </h2>
            </div>

            {/* Mensaje principal */}
            <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-300">
              <p className="text-lg text-gray-800 font-semibold leading-relaxed text-center whitespace-pre-line">
                {videollamadaAlertaMensaje}
              </p>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-300">
              <p className="text-base text-gray-700 leading-relaxed">
                <strong className="text-blue-700">💡 El médico iniciará</strong>
                <br />
                la videollamada en la hora programada.
              </p>
            </div>

            {/* Botón de acción */}
            <div className="pt-2">
              <Button
                className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                onClick={() => setVideollamadaAlertaOpen(false)}
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Evaluación de Cita */}
      <EvaluacionCitaModal
        open={evaluacionOpen}
        onOpenChange={setEvaluacionOpen}
        citaId={citaAEvaluar?.id || ""}
        medicoNombre={citaAEvaluar?.medico_nombre || "El médico"}
        medicoApellido={citaAEvaluar?.medico_apellido || ""}
        token={token || undefined}
        onSuccess={() => {
          // Recargar citas después de una evaluación exitosa
          window.location.reload();
        }}
      />
    </div>
  );
}
