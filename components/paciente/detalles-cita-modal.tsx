// components/paciente/detalles-cita-modal.tsx - VERSIÓN REDISEÑADA
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Video,
  FileText,
  X,
  CheckCircle,
  Phone,
  Stethoscope,
  Loader2,
  Wifi,
} from "lucide-react";

interface DetallesCitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: any;
  onCitaActualizada: () => void;
}

function safeFormatDate(value: any) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "-";
  }
}

function formatHora(hora: string): string {
  if (!hora) return "--:--";
  if (hora.includes(":")) return hora.slice(0, 5);
  const horaNum = parseInt(hora);
  return `${horaNum.toString().padStart(2, "0")}:00`;
}

export default function DetallesCitaModal({
  isOpen,
  onClose,
  cita,
  onCitaActualizada,
}: DetallesCitaModalProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [unirseLoading, setUnirseLoading] = useState(false);

  // Normalizar datos de la cita
  const citaData = {
    id: cita?.id || cita?.cita_id || "",
    fecha_cita: cita?.fecha_cita || cita?.fecha || "",
    hora_cita: cita?.hora_cita || cita?.hora || "",
    tipo_cita: cita?.tipo_cita || "presencial",
    estado: cita?.estado || "programada",
    motivo_consulta:
      cita?.motivo_consulta || cita?.motivo || "Consulta médica general",
    diagnostico: cita?.diagnostico || "",
    tratamiento: cita?.tratamiento || "",
    observaciones: cita?.observaciones || "",
    consultorio_nombre: cita?.consultorio_nombre || "Consultorio MediLink+",

    // Datos del médico
    medico_nombre: cita?.medico?.nombre || cita?.medico_nombre || "",
    medico_apellido: cita?.medico?.apellido || cita?.medico_apellido || "",
    medico_especialidad:
      cita?.medico?.especialidad || cita?.especialidad || "Medicina General",
    medico_colegiatura:
      cita?.medico?.numero_colegiatura || cita?.numero_colegiatura || "",
    medico_telefono: cita?.medico?.telefono || cita?.medico_telefono || "",
    medico_direccion:
      cita?.medico?.direccion_consultorio || cita?.direccion_consultorio || "",
  };

  const medicoNombreCompleto =
    `${citaData.medico_nombre} ${citaData.medico_apellido}`.trim() ||
    "Médico no asignado";

  if (!isOpen || !cita) return null;

  const obtenerToken = (): string => {
    if (!token) {
      toast({
        title: "Error de autenticación",
        description: "Por favor, inicie sesión nuevamente",
        variant: "destructive",
      });
      return "";
    }
    return token;
  };

  const unirseAVideollamada = async () => {
    setUnirseLoading(true);
    try {
      const token = obtenerToken();
      if (!token) return;

      const response = await fetch(
        `/api/telemedicina/sesion?cita_id=${citaData.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.sesion) {
          toast({
            title: "Conectando a videollamada",
            description: "Serás redirigido a la sesión...",
          });
          window.open(`/telemedicina/sesion/${data.sesion.id}`, "_blank");
          onClose();
        } else {
          throw new Error("No se encontró sesión de videollamada");
        }
      } else {
        throw new Error("Error al obtener sesión de videollamada");
      }
    } catch (error: any) {
      console.error("Error uniéndose a videollamada:", error);
      toast({
        title: "Error de conexión",
        description: error.message || "No se pudo conectar a la videollamada",
        variant: "destructive",
      });
    } finally {
      setUnirseLoading(false);
    }
  };

  const puedeUnirseAVideollamada = (): boolean => {
    if (citaData.tipo_cita !== "virtual") return false;
    const estadoValido = ["confirmada", "programada", "iniciada"].includes(
      citaData.estado
    );
    const hoy = new Date();
    const fechaCita = new Date(citaData.fecha_cita);
    return estadoValido && fechaCita >= new Date(hoy.setHours(0, 0, 0, 0));
  };

  const cancelarCita = async () => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;

    const motivo = prompt(
      "Por favor, indica el motivo de la cancelación:",
      "Cambio de planes"
    );
    if (motivo === null) return;

    setIsLoading(true);
    try {
      const token = obtenerToken();
      if (!token) return;

      const response = await fetch(`/api/citas/${citaData.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: "cancelada",
          observaciones: `Cancelación por paciente: ${
            motivo || "Sin motivo especificado"
          }`,
        }),
      });

      if (response.ok) {
        toast({
          title: "Cita cancelada",
          description: "Tu cita ha sido cancelada exitosamente.",
        });
        onCitaActualizada();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al cancelar cita");
      }
    } catch (error: any) {
      console.error("Error cancelando cita:", error);
      toast({
        title: "Error al cancelar",
        description: error.message || "No se pudo cancelar la cita",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmarCita = async () => {
    setIsLoading(true);
    try {
      const token = obtenerToken();
      if (!token) return;

      const response = await fetch(`/api/citas/${citaData.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: "confirmada" }),
      });

      if (response.ok) {
        toast({
          title: "Cita confirmada",
          description: "Tu cita ha sido confirmada exitosamente.",
        });
        onCitaActualizada();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al confirmar cita");
      }
    } catch (error: any) {
      console.error("Error confirmando cita:", error);
      toast({
        title: "Error al confirmar",
        description: error.message || "No se pudo confirmar la cita",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verUbicacionConsultorio = () => {
    const consultorio = {
      nombre: citaData.consultorio_nombre,
      direccion: citaData.medico_direccion || "Av. La Marina 1234, Lima",
      telefono: citaData.medico_telefono || "+51 1 2345678",
    };

    const mensaje = `📍 ${consultorio.nombre}\n🏥 ${consultorio.direccion}\n📞 ${consultorio.telefono}\n\n¿Abrir en Google Maps?`;

    if (confirm(mensaje)) {
      const direccionCodificada = encodeURIComponent(consultorio.direccion);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${direccionCodificada}`,
        "_blank"
      );
    }
  };

  const getEstadoConfig = (estado: string) => {
    const configs: any = {
      programada: {
        label: "Programada",
        color: "bg-yellow-100 text-yellow-800",
      },
      confirmada: { label: "Confirmada", color: "bg-blue-100 text-blue-800" },
      completada: { label: "Completada", color: "bg-green-100 text-green-800" },
      cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800" },
      iniciada: { label: "En curso", color: "bg-orange-100 text-orange-800" },
    };
    return (
      configs[estado] || { label: estado, color: "bg-gray-100 text-gray-800" }
    );
  };

  const getTipoCitaConfig = (tipo: string) => {
    const configs: any = {
      virtual: {
        icon: Video,
        label: "Virtual",
        color: "bg-blue-100 text-blue-800",
      },
      presencial: {
        icon: MapPin,
        label: "Presencial",
        color: "bg-green-100 text-green-800",
      },
      domicilio: {
        icon: User,
        label: "Domicilio",
        color: "bg-purple-100 text-purple-800",
      },
    };
    return (
      configs[tipo] || {
        icon: User,
        label: tipo,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const estadoConfig = getEstadoConfig(citaData.estado);
  const tipoCitaConfig = getTipoCitaConfig(citaData.tipo_cita);
  const TipoCitaIcon = tipoCitaConfig.icon;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Detalles de la Cita
              </h2>
              <p className="text-gray-600">Código: {citaData.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Estado y tipo de cita */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Fecha y Hora
                  </h3>
                  <div className="flex items-center text-sm mb-1">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    {safeFormatDate(citaData.fecha_cita)}
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    {formatHora(citaData.hora_cita)} horas
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Estado y Tipo
                  </h3>
                  <div className="space-y-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${estadoConfig.color}`}
                    >
                      {estadoConfig.label}
                    </span>
                    <div className="flex items-center text-sm">
                      <TipoCitaIcon className="w-4 h-4 mr-2 text-green-600" />
                      {tipoCitaConfig.label}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del médico */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-gray-600" />
                  Información del Médico
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-lg">
                      Dr. {medicoNombreCompleto}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Stethoscope className="w-4 h-4 mr-2 text-green-600" />
                      {citaData.medico_especialidad}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {citaData.medico_colegiatura && (
                      <div>
                        <span className="text-gray-600">CMP:</span>
                        <p className="font-medium">
                          {citaData.medico_colegiatura}
                        </p>
                      </div>
                    )}
                    {citaData.medico_telefono && (
                      <div>
                        <span className="text-gray-600">Teléfono:</span>
                        <p className="font-medium">
                          {citaData.medico_telefono}
                        </p>
                      </div>
                    )}
                  </div>

                  {citaData.medico_direccion &&
                    citaData.tipo_cita === "presencial" && (
                      <div className="bg-white p-3 rounded border">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-gray-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">
                              Consultorio
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              {citaData.medico_direccion}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Detalles de la consulta */}
              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                    Detalles de la Consulta
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Motivo de Consulta
                    </h4>
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3 text-sm leading-relaxed">
                      {citaData.motivo_consulta}
                    </p>
                  </div>

                  {citaData.diagnostico && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Diagnóstico
                      </h4>
                      <p className="text-gray-900 bg-blue-50 rounded-lg p-3 text-sm leading-relaxed">
                        {citaData.diagnostico}
                      </p>
                    </div>
                  )}

                  {citaData.tratamiento && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Tratamiento
                      </h4>
                      <p className="text-gray-900 bg-green-50 rounded-lg p-3 text-sm leading-relaxed">
                        {citaData.tratamiento}
                      </p>
                    </div>
                  )}

                  {citaData.observaciones && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Observaciones
                      </h4>
                      <p className="text-gray-900 bg-yellow-50 rounded-lg p-3 text-sm leading-relaxed">
                        {citaData.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información para teleconsulta */}
              {citaData.tipo_cita === "virtual" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                    <Wifi className="w-5 h-5 mr-2 text-blue-600" />
                    Para tu Videollamada
                  </h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Conexión estable a internet</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Audio y video funcionando</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Lugar tranquilo e iluminado</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel lateral */}
            <div className="space-y-6">
              {/* Información de la cita */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Información de la Cita
                </h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-600">Estado</span>
                    <div
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${estadoConfig.color}`}
                    >
                      {estadoConfig.label}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">
                      Tipo de Consulta
                    </span>
                    <div className="flex items-center text-sm font-medium">
                      <TipoCitaIcon className="w-4 h-4 mr-2 text-gray-600" />
                      {tipoCitaConfig.label}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">Fecha</span>
                    <p className="text-sm font-medium">
                      {safeFormatDate(citaData.fecha_cita)}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">Hora</span>
                    <p className="text-sm font-medium">
                      {formatHora(citaData.hora_cita)} horas
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-600">Consultorio</span>
                    <p className="text-sm font-medium">
                      {citaData.consultorio_nombre}
                    </p>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Acciones</h3>

                <div className="space-y-2">
                  {/* Botón principal de videollamada */}
                  {citaData.tipo_cita === "virtual" &&
                    puedeUnirseAVideollamada() && (
                      <Button
                        onClick={unirseAVideollamada}
                        disabled={unirseLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
                      >
                        {unirseLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Conectando...
                          </>
                        ) : (
                          <>
                            <Video className="w-5 h-5 mr-2" />
                            Unirse a Videollamada
                          </>
                        )}
                      </Button>
                    )}

                  {/* Acciones para citas programadas */}
                  {citaData.estado === "programada" && (
                    <>
                      <Button
                        onClick={confirmarCita}
                        disabled={isLoading}
                        className="w-full h-12 text-base"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isLoading ? "Confirmando..." : "Confirmar Cita"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelarCita}
                        disabled={isLoading}
                        className="w-full h-12 text-red-600 border-red-300 hover:bg-red-50 text-base"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar Cita
                      </Button>
                    </>
                  )}

                  {/* Acciones para citas confirmadas */}
                  {citaData.estado === "confirmada" && (
                    <>
                      {citaData.tipo_cita === "presencial" && (
                        <Button
                          variant="outline"
                          onClick={verUbicacionConsultorio}
                          className="w-full h-12 text-base mb-2"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Ver Ubicación
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={cancelarCita}
                        disabled={isLoading}
                        className="w-full h-12 text-red-600 border-red-300 hover:bg-red-50 text-base"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar Cita
                      </Button>
                    </>
                  )}

                  {/* Sin acciones para otros estados */}
                  {!["programada", "confirmada"].includes(citaData.estado) &&
                    !(
                      citaData.tipo_cita === "virtual" &&
                      puedeUnirseAVideollamada()
                    ) && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">
                          No hay acciones disponibles para esta cita
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
