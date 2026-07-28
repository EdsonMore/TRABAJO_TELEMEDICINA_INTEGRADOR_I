"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import DetallesCitaModal from "@/components/paciente/detalles-cita-modal";
import { EvaluacionCitaModal } from "@/components/paciente/evaluacion-cita-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Eye,
  Plus,
  Video,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function CitasPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [citasPaciente, setCitasPaciente] = useState<CitaPaciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarTodasLasCitas, setMostrarTodasLasCitas] = useState(false);

  const [detallesCitaOpen, setDetallesCitaOpen] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaPaciente | null>(null);
  const [evaluacionOpen, setEvaluacionOpen] = useState(false);
  const [citaAEvaluar, setCitaAEvaluar] = useState<CitaPaciente | null>(null);
  const [videollamadaAlertaOpen, setVideollamadaAlertaOpen] = useState(false);
  const [videollamadaAlertaMensaje, setVideollamadaAlertaMensaje] = useState("");

  const fetchCitas = async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch("/api/paciente/citas", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error al cargar citas");
      const data = await res.json();
      setCitasPaciente(data.citas || []);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      try {
        toast({ title: "Error", description: err.message });
      } catch (e) {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, [token]);

  const verDetallesCita = (cita: CitaPaciente) => {
    setCitaSeleccionada(cita);
    setDetallesCitaOpen(true);
  };

  const formatearHora = (horaCita?: string): string => {
    if (!horaCita) return "--:--";
    return horaCita.slice(0, 5);
  };

  const getMedicoData = (cita?: CitaPaciente | null) => {
    if (!cita) return { nombre: "Médico", apellido: "", especialidad: "Consulta general" };
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
      return fechaCita.toDateString() === ahora.toDateString();
    } catch (e) {
      return false;
    }
  };

  const unirseAVideollamada = async (cita: CitaPaciente) => {
    if (!token) {
      try { toast({ title: "No autenticado", description: "No se encontró token de autenticación" }); } catch (e) {}
      return;
    }
    if (!puedeUnirseAVideollamada(cita)) {
      try { toast({ title: "No puedes unirte", description: "Verifica que la cita sea virtual, esté confirmada y sea hoy en horario válido." }); } catch (e) {}
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const sesionesRes = await fetch(`/api/telemedicina/sesiones?cita_id=${encodeURIComponent(cita.id)}&_t=${Date.now()}`, { headers, cache: "no-store" });
      const sesionesData = await sesionesRes.json();
      let sesionId: string | undefined;
      if (sesionesData?.success && Array.isArray(sesionesData.sesiones) && sesionesData.sesiones.length > 0) {
        const sesionData = sesionesData.sesiones[0];
        sesionId = sesionData.id;
        if (sesionData.estado !== "iniciada") {
          throw new Error(`⏳ No puedes unirte a la videollamada aún.\n\nEl médico debe iniciar la sesión primero.\n\nEstado actual: ${sesionData.estado}`);
        }
      } else {
        throw new Error("⏳ No puedes unirte a la videollamada aún.\n\nEl médico debe iniciar la sesión primero.\n\nEstado actual: programada");
      }
      if (!sesionId) throw new Error("No se obtuvo id de sesión");
      try { toast({ title: "Conectando", description: "Se abrirá la sesión de telemedicina en una nueva pestaña" }); } catch (e) {}
      window.open(`/telemedicina/sesion/${sesionId}`, "_blank");
    } catch (error: any) {
      const msg = error?.message || "Error desconocido al unirse a la videollamada";
      if (msg.includes("No puedes unirte") || msg.includes("El médico debe iniciar")) {
        setVideollamadaAlertaMensaje(msg);
        setVideollamadaAlertaOpen(true);
      } else {
        try { toast({ title: "Error videollamada", description: msg }); } catch (e) {}
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
    if (confirm(`📍 ${consultorio.nombre}\n🏥 ${consultorio.direccion}\n📞 ${consultorio.telefono}\n\n¿Abrir en Google Maps?`)) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${consultorio.coordenadas}`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600 text-sm">Cargando citas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {error && (
          <div className="mb-4">
            <Card className="border border-red-200 bg-red-50">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-red-700">Error: {error}</div>
                  <Button size="sm" onClick={fetchCitas}>Reintentar</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-white shadow-sm border-0 sm:border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <CardTitle className="text-base sm:text-lg">Mis Citas Médicas</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {citasPaciente.length > 0 ? `${citasPaciente.length} citas encontradas` : "Historial de consultas"}
                </CardDescription>
              </div>
              <Button onClick={() => router.push("/dashboard/citas")} size="sm" className="w-full sm:w-auto h-10 sm:h-9 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Agendar Cita
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {citasPaciente.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {(mostrarTodasLasCitas ? citasPaciente : citasPaciente.slice(0, 5)).map((cita) => {
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
                          <div className="text-center min-w-[70px] sm:min-w-[80px] flex-shrink-0">
                            <div className="text-xs font-medium text-gray-600 uppercase">
                              {new Date(cita.fecha_cita).toLocaleDateString("es-PE", { month: "short", day: "numeric" })}
                            </div>
                            <div className="text-base sm:text-lg font-bold text-blue-600 mt-1">
                              {new Date(cita.fecha_cita).toLocaleDateString("es-PE", { weekday: "short" })}
                            </div>
                            <div className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded mt-1">
                              {formatearHora(cita.hora_cita)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base truncate">
                              Dr. {medicoData.nombre} {medicoData.apellido}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1 sm:mt-2 flex-wrap">
                              <Badge variant="outline" className="text-xs capitalize">{cita.tipo_cita || "presencial"}</Badge>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{medicoData.especialidad}</p>
                            </div>
                            {cita.motivo_consulta && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-2 truncate">{cita.motivo_consulta}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2 sm:space-y-3 ml-2 sm:ml-4">
                          <Badge
                            variant={cita.estado === "completada" ? "default" : cita.estado === "confirmada" ? "secondary" : cita.estado === "cancelada" ? "destructive" : "outline"}
                            className="text-xs capitalize"
                          >
                            {cita.estado || "pendiente"}
                          </Badge>
                          <div className="flex space-x-1 sm:space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0" onClick={() => verDetallesCita(cita)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {cita.estado === "completada" && (
                              <Button variant="default" size="sm" className="h-8 sm:h-9 px-2 sm:px-3 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => { setCitaAEvaluar(cita); setEvaluacionOpen(true); }}>
                                <span className="hidden sm:inline">⭐</span>
                                <span className="sm:hidden">Evaluar</span>
                              </Button>
                            )}
                            {cita.tipo_cita === "virtual" && puedeUnirse && (
                              <Button size="sm" className="h-8 sm:h-9 px-2 sm:px-3 bg-green-600 hover:bg-green-700 text-white" onClick={() => unirseAVideollamada(cita)}>
                                <Video className="w-4 h-4" />
                              </Button>
                            )}
                            {cita.tipo_cita === "presencial" && (
                              <Button variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0" onClick={(e) => { e.stopPropagation(); verUbicacionConsultorio(cita); }}>
                                <MapPin className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {citasPaciente.length > 5 && (
                  <div className="flex justify-center pt-4 sm:pt-6">
                    <Button variant="outline" size="sm" onClick={() => setMostrarTodasLasCitas(!mostrarTodasLasCitas)} className="flex items-center gap-2 h-10 sm:h-9">
                      {mostrarTodasLasCitas ? <><ChevronUp className="w-4 h-4" /> Ver menos</> : <><ChevronDown className="w-4 h-4" /> Ver todas ({citasPaciente.length})</>}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4 sm:mb-6" />
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">No hay citas programadas</p>
                <Button onClick={() => router.push("/dashboard/citas")} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Agendar Primera Cita
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <DetallesCitaModal
          isOpen={detallesCitaOpen}
          onClose={() => setDetallesCitaOpen(false)}
          cita={citaSeleccionada}
          onCitaActualizada={fetchCitas}
        />
        <EvaluacionCitaModal
          open={evaluacionOpen}
          onOpenChange={setEvaluacionOpen}
          citaId={citaAEvaluar?.id || ""}
          medicoNombre={citaAEvaluar?.medico_nombre || "El médico"}
          medicoApellido={citaAEvaluar?.medico_apellido || ""}
          token={token || undefined}
          onSuccess={() => { window.location.reload(); }}
        />

        {videollamadaAlertaOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex justify-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <AlertTriangle className="w-10 h-10 text-yellow-600" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">⏳ Videollamada<br />no disponible</h2>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-300">
                <p className="text-lg text-gray-800 font-semibold leading-relaxed text-center whitespace-pre-line">{videollamadaAlertaMensaje}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-300">
                <p className="text-base text-gray-700 leading-relaxed">
                  <strong className="text-blue-700">💡 El médico iniciará</strong><br />la videollamada en la hora programada.
                </p>
              </div>
              <div className="pt-2">
                <Button className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={() => setVideollamadaAlertaOpen(false)}>
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
