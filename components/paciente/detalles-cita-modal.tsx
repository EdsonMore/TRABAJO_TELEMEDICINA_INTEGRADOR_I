// components/paciente/detalles-cita-modal.tsx - VERSIÓN MEJORADA CON ACCIONES EN INFERIOR
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Shield,
  Wifi,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DetallesCitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: any;
  onCitaActualizada: () => void;
}

interface MedicoData {
  nombre: string;
  apellido: string;
  especialidad: string;
  numero_colegiatura: string;
  telefono: string;
  direccion_consultorio: string;
}

interface CitaData {
  id: string;
  fecha_cita: string;
  hora_cita: string;
  tipo_cita: string;
  estado: string;
  motivo_consulta: string;
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
  consultorio_nombre: string;
}

export function DetallesCitaModal({
  isOpen,
  onClose,
  cita,
  onCitaActualizada,
}: DetallesCitaModalProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [unirseLoading, setUnirseLoading] = useState(false);

  if (!cita) return null;

  const getMedicoData = (): MedicoData => {
    if (cita.medico) {
      return {
        nombre: cita.medico.nombre || "",
        apellido: cita.medico.apellido || "",
        especialidad: cita.medico.especialidad || "Medicina General",
        numero_colegiatura: cita.medico.numero_colegiatura || "",
        telefono: cita.medico.telefono || "",
        direccion_consultorio: cita.medico.direccion_consultorio || "",
      };
    } else if (cita.medico_nombre || cita.medico_apellido) {
      return {
        nombre: cita.medico_nombre || "",
        apellido: cita.medico_apellido || "",
        especialidad: cita.especialidad || "Medicina General",
        numero_colegiatura: cita.numero_colegiatura || "",
        telefono: cita.medico_telefono || "",
        direccion_consultorio: cita.direccion_consultorio || "",
      };
    } else {
      return {
        nombre: "",
        apellido: "",
        especialidad: "Medicina General",
        numero_colegiatura: "",
        telefono: "",
        direccion_consultorio: "",
      };
    }
  };

  const getCitaData = (): CitaData => {
    return {
      id: cita.id || cita.cita_id || "",
      fecha_cita: cita.fecha_cita || cita.fecha || "",
      hora_cita: cita.hora_cita || cita.hora || "",
      tipo_cita: cita.tipo_cita || "presencial",
      estado: cita.estado || "programada",
      motivo_consulta:
        cita.motivo_consulta || cita.motivo || "Consulta médica general",
      diagnostico: cita.diagnostico || "",
      tratamiento: cita.tratamiento || "",
      observaciones: cita.observaciones || "",
      consultorio_nombre: cita.consultorio_nombre || "Consultorio MediLink+",
    };
  };

  const medicoData = getMedicoData();
  const citaData = getCitaData();

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
      direccion: medicoData.direccion_consultorio || "Av. La Marina 1234, Lima",
      telefono: medicoData.telefono || "+51 1 2345678",
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
        color: "text-yellow-600 bg-yellow-50",
      },
      confirmada: { label: "Confirmada", color: "text-blue-600 bg-blue-50" },
      completada: { label: "Completada", color: "text-green-600 bg-green-50" },
      cancelada: { label: "Cancelada", color: "text-red-600 bg-red-50" },
      iniciada: { label: "En curso", color: "text-orange-600 bg-orange-50" },
    };
    return (
      configs[estado] || { label: estado, color: "text-gray-600 bg-gray-50" }
    );
  };

  const getTipoCitaConfig = (tipo: string) => {
    const configs: any = {
      virtual: { icon: Video, color: "text-blue-600 bg-blue-50" },
      presencial: { icon: MapPin, color: "text-green-600 bg-green-50" },
      domicilio: { icon: User, color: "text-purple-600 bg-purple-50" },
    };
    return configs[tipo] || { icon: User, color: "text-gray-600 bg-gray-50" };
  };

  const formatHora = (hora: string): string => {
    if (!hora) return "--:--";
    if (hora.includes(":")) return hora.slice(0, 5);
    const horaNum = parseInt(hora);
    return `${horaNum.toString().padStart(2, "0")}:00`;
  };

  const estadoConfig = getEstadoConfig(citaData.estado);
  const tipoCitaConfig = getTipoCitaConfig(citaData.tipo_cita);
  const TipoCitaIcon = tipoCitaConfig.icon;

  // Renderizar acciones principales
  const renderAccionesPrincipales = () => {
    // Botón principal de videollamada
    if (citaData.tipo_cita === "virtual" && puedeUnirseAVideollamada()) {
      return (
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
      );
    }

    // Acciones para citas programadas
    if (citaData.estado === "programada") {
      return (
        <div className="flex gap-3">
          <Button
            onClick={confirmarCita}
            disabled={isLoading}
            className="flex-1 h-12 text-base"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isLoading ? "Confirmando..." : "Confirmar Cita"}
          </Button>
          <Button
            variant="outline"
            onClick={cancelarCita}
            disabled={isLoading}
            className="flex-1 h-12 text-red-600 border-red-300 hover:bg-red-50 text-base"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      );
    }

    // Acciones para citas confirmadas
    if (citaData.estado === "confirmada") {
      return (
        <div className="flex gap-3">
          {citaData.tipo_cita === "presencial" && (
            <Button
              variant="outline"
              onClick={verUbicacionConsultorio}
              className="flex-1 h-12 text-base"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Ver Ubicación
            </Button>
          )}
          <Button
            variant="outline"
            onClick={cancelarCita}
            disabled={isLoading}
            className="flex-1 h-12 text-red-600 border-red-300 hover:bg-red-50 text-base"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      );
    }

    // Sin acciones para otros estados
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">
          No hay acciones disponibles para esta cita
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center text-xl font-bold">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Detalles de la Consulta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* TARJETA PRINCIPAL */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={`${estadoConfig.color} border-0 font-semibold`}
                  >
                    {estadoConfig.label}
                  </Badge>
                  <Badge
                    className={`${tipoCitaConfig.color} border-0 font-semibold`}
                  >
                    <TipoCitaIcon className="w-4 h-4 mr-1" />
                    {citaData.tipo_cita}
                  </Badge>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {new Date(citaData.fecha_cita).toLocaleDateString("es-PE", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h2>
                  <p className="text-lg text-gray-600 flex items-center mt-1">
                    <Clock className="w-5 h-5 mr-2" />
                    {formatHora(citaData.hora_cita)} horas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CONTENIDO PRINCIPAL - UNA SOLA COLUMNA */}
          <div className="space-y-6">
            {/* INFORMACIÓN DEL MÉDICO */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Información del Médico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      Dr. {medicoData.nombre} {medicoData.apellido}
                    </h3>
                    <p className="text-gray-600 mt-1 flex items-center">
                      <Stethoscope className="w-4 h-4 mr-2 text-green-600" />
                      {medicoData.especialidad}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-2">
                      {medicoData.numero_colegiatura && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Shield className="w-4 h-4" />
                          <span>CMP: {medicoData.numero_colegiatura}</span>
                        </div>
                      )}
                      {medicoData.telefono && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          <span>{medicoData.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {medicoData.direccion_consultorio &&
                  citaData.tipo_cita === "presencial" && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Consultorio
                          </p>
                          <p className="text-gray-600 mt-1">
                            {medicoData.direccion_consultorio}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* DETALLES DE LA CONSULTA */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Detalles de la Consulta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            {/* INFORMACIÓN DE TELECONSULTA */}
            {citaData.tipo_cita === "virtual" && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-blue-900 text-sm font-semibold">
                    <Wifi className="w-4 h-4 mr-2" />
                    Para tu Videollamada
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* SECCIÓN DE ACCIONES - EN LA PARTE INFERIOR */}
          <div className="border-t pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Acciones de la Cita
              </h3>
              {renderAccionesPrincipales()}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="min-w-24 h-11 text-base"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
