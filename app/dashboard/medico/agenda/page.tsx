// app/dashboard/medico/agenda/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DetallesCitaModalMedico } from "@/components/medico/detalles-cita-modal";
import GestionCitaMedicoModal from "@/components/medico/gestion-cita-medico-modal";
import ModalCrearReceta from "@/components/medico/ModalCrearReceta";
import { ModalPerfilPaciente } from "@/components/medico/modal-perfil-paciente";
import { ModalHistorialPaciente } from "@/components/medico/modal-historial-paciente";
import {
  puedeUnirseAVideollamada,
  puedeCrearReceta,
  getEtiquetaCita,
} from "@/lib/cita-utils";
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
  Activity,
  Video,
  Eye,
  ClipboardList,
  FileText,
  ChevronDown,
  ChevronUp,
  Stethoscope,
} from "lucide-react";

interface DiaAgenda {
  fecha: string;
  total_citas: number;
  citas_completadas: number;
  citas_programadas: number;
  citas: CitaAgenda[];
}

interface CitaAgenda {
  id: string;
  id_paciente?: string;
  fecha_cita?: string;
  hora_cita: string;
  tipo_cita: string;
  estado: string;
  motivo_consulta: string;
  paciente_nombre?: string;
  paciente?: {
    id?: string;
    nombre: string;
    apellido: string;
    edad: number;
    telefono: string;
    email?: string;
  };
}

export default function AgendaPage() {
  const { usuario, token } = useAuth();
  const [agenda, setAgenda] = useState<DiaAgenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [detallesCitaOpen, setDetallesCitaOpen] = useState(false);
  const [mostrarTodasLasCitas, setMostrarTodasLasCitas] = useState(false);
  const [gestionCitaOpen, setGestionCitaOpen] = useState(false);
  const [crearRecetaOpen, setCrearRecetaOpen] = useState(false);
  const [citaParaReceta, setCitaParaReceta] = useState<any>(null);
  const [pacientePerfil, setPacientePerfil] = useState<any>(null);
  const [mostrarPerfilPaciente, setMostrarPerfilPaciente] = useState(false);
  const [pacienteHistorial, setPacienteHistorial] = useState<any>(null);
  const [mostrarHistorialPaciente, setMostrarHistorialPaciente] = useState(false);

  useEffect(() => {
    const cargarAgenda = async () => {
      if (!token) return;
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const agendaRes = await fetch("/api/medico/agenda?dias=7", { headers });
        if (agendaRes.ok) {
          const agendaData = await agendaRes.json();
          setAgenda(agendaData.agenda || []);
        }
      } catch (error) {
        console.error("Error cargando agenda:", error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarAgenda();
  }, [token]);

  const obtenerCitasHoy = () => {
    const hoy = new Date();
    const fechaHoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    return agenda.find((dia) => {
      let fechaDiaStr = dia.fecha;
      if (fechaDiaStr.includes("T")) fechaDiaStr = fechaDiaStr.split("T")[0];
      return fechaDiaStr === fechaHoyStr;
    });
  };

  const citasHoy = obtenerCitasHoy();

  const enriquecerCita = (cita: CitaAgenda, fechaDia: string): CitaAgenda => {
    const paciente_id = cita.id_paciente;
    const fecha_cita = cita.fecha_cita || fechaDia;
    return {
      ...cita,
      id_paciente: paciente_id,
      fecha_cita: fecha_cita,
      paciente_nombre:
        cita.paciente_nombre ||
        `${cita.paciente?.nombre} ${cita.paciente?.apellido}`,
    };
  };

  const puedeUnirseAVideollamadaConLogs = (cita: any): boolean => {
    if (!cita) return false;
    const esVirtual = cita.tipo_cita === "virtual";
    const estadoValido = ["confirmada", "programada", "iniciada"].includes(cita.estado);
    const hoyDate = new Date();
    hoyDate.setHours(0, 0, 0, 0);
    const [año, mes, día] = (cita.fecha_cita || "").split("-");
    if (!año || !mes || !día) return esVirtual && estadoValido;
    const fechaCitaDate = new Date(parseInt(año), parseInt(mes) - 1, parseInt(día));
    fechaCitaDate.setHours(0, 0, 0, 0);
    const esFechaValida = fechaCitaDate >= hoyDate;
    return esVirtual && estadoValido && esFechaValida;
  };

  const verDetallesCita = (cita: any) => {
    setCitaSeleccionada(cita);
    setDetallesCitaOpen(true);
  };

  const gestionarCita = (cita: any) => {
    setCitaSeleccionada(cita);
    setGestionCitaOpen(true);
  };

  const crearRecetaDesdeCita = (cita: any) => {
    setCitaParaReceta(cita);
    setCrearRecetaOpen(true);
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

  const verPerfilPaciente = async (pacienteId: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const response = await fetch(`/api/medico/pacientes/${pacienteId}/perfil`, { headers });
      if (response.ok) {
        const data = await response.json();
        setPacientePerfil(data.paciente);
        setMostrarPerfilPaciente(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const verHistorialPaciente = async (pacienteId: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const url = `/api/medico/pacientes/${pacienteId}/historial?cita_id=temp-${Date.now()}`;
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setPacienteHistorial(data);
        setMostrarHistorialPaciente(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleRecetaCreada = () => {
    setCrearRecetaOpen(false);
    setCitaParaReceta(null);
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["medico"]}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 text-sm">Cargando agenda...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["medico"]}>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Agenda</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Citas de hoy y próximos 7 días
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-white shadow-sm border-0 sm:border">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center text-base sm:text-lg gap-2">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <span className="truncate">Citas de Hoy</span>
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          {new Date().toLocaleDateString("es-PE")}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-base mt-1">
                        {citasHoy?.total_citas || 0} citas programadas
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 w-fit text-xs sm:text-sm flex-shrink-0"
                    >
                      {citasHoy?.citas?.filter((c) => c.tipo_cita === "virtual").length || 0} virtuales
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {citasHoy && citasHoy.citas.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {(mostrarTodasLasCitas ? citasHoy.citas : citasHoy.citas.slice(0, 5)).map((citaBase, index) => {
                        const cita = enriquecerCita(citaBase, citasHoy.fecha);
                        return (
                          <div
                            key={`${cita.id}-${index}`}
                            className="p-2 sm:p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                            onClick={() => verDetallesCita(cita)}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className="text-center min-w-[60px] sm:min-w-[80px] flex-shrink-0">
                                  <div className="text-sm sm:text-lg font-bold text-blue-600">
                                    {cita.hora_cita?.slice(0, 5) || "--:--"}
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`capitalize text-xs mt-1 w-full justify-center ${
                                      cita.estado === "confirmada" ? "bg-blue-100 text-blue-800 border-blue-200"
                                        : cita.estado === "programada" ? "bg-amber-100 text-amber-800 border-amber-200"
                                        : cita.estado === "en_curso" || cita.estado === "iniciada" ? "bg-green-100 text-green-800 border-green-200"
                                        : cita.estado === "completada" ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                                        : cita.estado === "cancelada" ? "bg-red-100 text-red-800 border-red-200"
                                        : cita.estado === "no_asistio" ? "bg-orange-100 text-orange-800 border-orange-200"
                                        : "bg-gray-100 text-gray-800 border-gray-200"
                                    }`}
                                  >
                                    {cita.estado}
                                  </Badge>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-xs sm:text-base truncate">
                                    {cita.paciente?.nombre || ""} {cita.paciente?.apellido || ""}
                                  </h4>
                                  <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs py-0.5 px-2 ${
                                        cita.tipo_cita === "virtual" ? "bg-blue-50 text-blue-700 border-blue-300"
                                          : cita.tipo_cita === "presencial" ? "bg-green-50 text-green-700 border-green-300"
                                          : cita.tipo_cita === "domicilio" ? "bg-purple-50 text-purple-700 border-purple-300"
                                          : ""
                                      }`}
                                    >
                                      {getEtiquetaCita(cita.tipo_cita)}
                                    </Badge>
                                    <p className="text-xs text-gray-600">{cita.paciente?.edad || 0} años</p>
                                  </div>
                                  {cita.motivo_consulta && (
                                    <p className="text-xs text-gray-500 mt-1 truncate">{cita.motivo_consulta}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center sm:flex-col sm:items-end gap-1 sm:gap-2 ml-0 flex-shrink-0">
                                <div className="flex gap-1 sm:gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-purple-50"
                                    onClick={() => gestionarCita(cita)} title="Gestionar cita completa">
                                    <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-blue-50"
                                    onClick={() => verDetallesCita(cita)} title="Ver detalles de la cita">
                                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                  </Button>
                                  {puedeCrearReceta(cita as any) && (
                                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-green-50"
                                      onClick={(e) => { e.stopPropagation(); crearRecetaDesdeCita(cita); }} title="Crear receta">
                                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                                    </Button>
                                  )}
                                  {puedeUnirseAVideollamadaConLogs(cita) && (
                                    <Button size="sm" className="h-7 sm:h-9 px-2 sm:px-3 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                                      onClick={() => unirseAVideollamada(cita)} title="Iniciar videollamada">
                                      <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {citasHoy.citas.length > 5 && (
                        <div className="flex justify-center pt-4 sm:pt-6">
                          <Button variant="outline" size="sm"
                            onClick={() => setMostrarTodasLasCitas(!mostrarTodasLasCitas)}
                            className="flex items-center gap-2 h-10 sm:h-9">
                            {mostrarTodasLasCitas ? (<><ChevronUp className="w-4 h-4" /> Ver menos</>) : (<><ChevronDown className="w-4 h-4" /> Ver todas ({citasHoy.citas.length})</>)}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4 sm:mb-6" />
                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">No tienes citas programadas para hoy</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-white shadow-sm border-0 sm:border">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center text-base sm:text-lg gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                    <span className="truncate">Próximos 7 Días</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {agenda.map((dia, index) => {
                      const citasVirtuales = dia.citas.filter((c) => c.tipo_cita === "virtual").length;
                      return (
                        <div key={`${dia.fecha}-${index}`}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">
                              {new Date(dia.fecha).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <p className="text-xs text-gray-600">{dia.citas_completadas}/{dia.total_citas} completadas</p>
                              {citasVirtuales > 0 && (
                                <p className="text-xs text-green-600 font-medium">{citasVirtuales} virtual{citasVirtuales !== 1 ? "es" : ""}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs w-fit flex-shrink-0">{dia.total_citas} citas</Badge>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 sm:mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                      <Video className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">Telemedicina Esta Semana</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-blue-600 text-xs">Total Virtuales</p>
                        <p className="font-semibold text-blue-800 text-sm">
                          {agenda.reduce((total, dia) => total + dia.citas.filter((c) => c.tipo_cita === "virtual").length, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600 text-xs">Hoy</p>
                        <p className="font-semibold text-blue-800 text-sm">{citasHoy?.citas?.filter((c) => c.tipo_cita === "virtual").length || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <GestionCitaMedicoModal
          isOpen={gestionCitaOpen}
          onClose={() => { setGestionCitaOpen(false); setCitaSeleccionada(null); }}
          cita={citaSeleccionada}
          onCitaActualizada={() => window.location.reload()}
        />
        <ModalPerfilPaciente
          isOpen={mostrarPerfilPaciente}
          onClose={() => setMostrarPerfilPaciente(false)}
          paciente={pacientePerfil}
          onVerHistorial={() => {
            setMostrarPerfilPaciente(false);
            setTimeout(() => { if (pacientePerfil) verHistorialPaciente(pacientePerfil.id); }, 300);
          }}
        />
        <ModalHistorialPaciente
          isOpen={mostrarHistorialPaciente}
          onClose={() => setMostrarHistorialPaciente(false)}
          historial={pacienteHistorial}
        />
        <ModalCrearReceta
          cita={citaParaReceta}
          isOpen={crearRecetaOpen}
          onClose={() => { setCrearRecetaOpen(false); setCitaParaReceta(null); }}
          onRecetaCreada={handleRecetaCreada}
        />
        <DetallesCitaModalMedico
          isOpen={detallesCitaOpen}
          onClose={() => setDetallesCitaOpen(false)}
          cita={citaSeleccionada}
          onCitaActualizada={() => window.location.reload()}
          onVerPerfil={(pacienteId: string) => verPerfilPaciente(pacienteId)}
          onVerHistorial={(pacienteId: string) => verHistorialPaciente(pacienteId)}
          onCrearReceta={() => { if (citaSeleccionada) crearRecetaDesdeCita(citaSeleccionada); }}
          onGestionarCita={() => alert("Función de gestionar cita - Próximamente")}
        />
      </div>
    </ProtectedRoute>
  );
}
