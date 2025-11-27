// components/medico/detalles-cita-modal.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  puedeUnirseAVideollamada,
  puedeCrearReceta,
  puedeSolicitarExamenes,
  getEtiquetaCita,
  getDescripcionCita,
} from "@/lib/cita-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  User,
  Video,
  FileText,
  TestTube,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  ExternalLink,
  Play,
  X,
} from "lucide-react";

interface DetallesCitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: any;
  onCitaActualizada: () => void;
  onVerPerfil?: (pacienteId: string) => void;
  onVerHistorial?: (pacienteId: string) => void;
  onCrearReceta?: () => void; // ✨ NUEVO: Callback para crear receta
  onGestionarCita?: () => void; // ✨ NUEVO: Callback para gestionar cita
}

export function DetallesCitaModalMedico({
  isOpen,
  onClose,
  cita,
  onCitaActualizada,
  onVerPerfil,
  onVerHistorial,
  onCrearReceta, // ✨ NUEVO
  onGestionarCita, // ✨ NUEVO
}: DetallesCitaModalProps) {
  const { token } = useAuth();
  const [unirseLoading, setUnirseLoading] = useState(false);

  if (!cita) return null;

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

      const sesionesResponse = await fetch(
        `/api/telemedicina/sesiones?cita_id=${cita.id}`,
        { headers }
      );

      const sesionesData = await sesionesResponse.json();
      let sesionId;

      if (sesionesData.success && sesionesData.sesiones.length > 0) {
        sesionId = sesionesData.sesiones[0].id;
      } else {
        const programarResponse = await fetch("/api/telemedicina/programar", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            id_cita: cita.id,
            titulo: "Consulta Virtual",
            descripcion: "Sesión de telemedicina",
            fecha_programada: new Date().toISOString(),
            duracion_minutos: 30,
          }),
        });

        const programarData = await programarResponse.json();
        if (!programarData.success) {
          throw new Error(programarData.error || "Error al crear sesión");
        }

        sesionId = programarData.sesion.id;
      }

      window.open(`/telemedicina/sesion/${sesionId}`, "_blank");
    } catch (error: any) {
      alert(`Error: ${error.message || "No se pudo conectar"}`);
    }
  };

  const puedeUnirseLocal = () => {
    return puedeUnirseAVideollamada(cita);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-0">
        <DialogTitle className="sr-only">Detalles de la Cita</DialogTitle>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Detalles de la Cita
              </h2>
              <p className="text-blue-100 text-sm">
                {getDescripcionCita(cita.tipo_cita)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-lg hover:bg-white/20"
          >
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Fila 1: Paciente y Estado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Paciente */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-4 text-lg">
                  <User className="w-5 h-5" />
                  Paciente
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                      Nombre
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {cita.paciente?.nombre} {cita.paciente?.apellido}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                        Edad
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {cita.paciente?.edad} años
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-1">
                        DNI
                      </p>
                      <p className="text-sm font-mono text-gray-900">
                        {cita.paciente?.dni}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                      Teléfono
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="break-all">
                        {cita.paciente?.telefono}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                      Email
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="break-all">{cita.paciente?.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <h3 className="font-bold text-green-900 flex items-center gap-2 mb-4 text-lg">
                  <AlertCircle className="w-5 h-5" />
                  Estado
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase mb-2">
                      Estado Actual
                    </p>
                    <Badge
                      className={`w-full justify-center py-2 text-sm font-bold capitalize ${
                        cita.estado === "confirmada"
                          ? "bg-green-600 text-white"
                          : cita.estado === "programada"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-400 text-white"
                      }`}
                    >
                      {cita.estado}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase mb-2">
                      Tipo
                    </p>
                    <Badge
                      variant="outline"
                      className={`w-full justify-center border-2 py-2 text-sm font-bold ${
                        cita.tipo_cita === "virtual"
                          ? "border-blue-400 text-blue-700 bg-blue-50"
                          : cita.tipo_cita === "presencial"
                          ? "border-green-400 text-green-700 bg-green-50"
                          : cita.tipo_cita === "domicilio"
                          ? "border-purple-400 text-purple-700 bg-purple-50"
                          : "border-gray-400 text-gray-700"
                      }`}
                    >
                      {getEtiquetaCita(cita.tipo_cita)}
                    </Badge>
                  </div>

                  {cita.tipo_cita === "virtual" && puedeUnirseLocal() && (
                    <Button
                      onClick={unirseAVideollamada}
                      disabled={unirseLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-lg transition-all"
                    >
                      {unirseLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Conectando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Play className="w-4 h-4" />
                          Iniciar Videollamada
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Fila 2: Fecha y Hora */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h3 className="font-bold text-yellow-900 flex items-center gap-2 mb-4 text-lg">
                <Calendar className="w-5 h-5" />
                Información de la Cita
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div>
                  <p className="text-xs font-semibold text-yellow-700 uppercase mb-2">
                    Fecha
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(cita.fecha_cita).toLocaleDateString("es-PE", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-yellow-700 uppercase mb-2">
                    Hora
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-900">
                    {cita.hora_cita?.slice(0, 5)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-yellow-700 uppercase mb-2">
                    Duración
                  </p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    30 minutos
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-yellow-700 uppercase mb-2">
                  Motivo de Consulta
                </p>
                <div className="bg-white p-4 rounded-lg border border-yellow-300">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {cita.motivo_consulta || "No especificado"}
                  </p>
                </div>
              </div>
            </div>

            {/* Telemedicina */}
            {cita.tipo_cita === "virtual" && (
              <div className="bg-blue-50 border border-blue-300 rounded-xl p-5">
                <p className="text-blue-900 font-bold flex items-center gap-2 mb-4 text-lg">
                  <Video className="w-5 h-5" />
                  Datos de Telemedicina
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                      Sala
                    </p>
                    <p className="text-sm font-mono font-bold text-blue-900">
                      {cita.codigo_acceso || "Por generar"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                      Plataforma
                    </p>
                    <p className="text-sm font-bold text-blue-900">Daily.co</p>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Acciones</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {puedeCrearReceta(cita) && onCrearReceta && (
                  <Button
                    onClick={() => {
                      onClose();
                      onCrearReceta();
                    }}
                    variant="outline"
                    className="border-blue-400 text-blue-700 hover:bg-blue-50 font-semibold py-5 rounded-lg"
                    title="Crear nueva receta para este paciente"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Generar</span> Receta
                  </Button>
                )}

                {puedeSolicitarExamenes(cita) && (
                  <Button
                    variant="outline"
                    className="border-purple-400 text-purple-700 hover:bg-purple-50 font-semibold py-5 rounded-lg"
                    title="Solicitar exámenes de laboratorio"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    <span className="hidden xs:inline">Solicitar</span> Exámenes
                  </Button>
                )}

                {onVerPerfil && (
                  <Button
                    variant="outline"
                    className="border-indigo-400 text-indigo-700 hover:bg-indigo-50 font-semibold py-2 rounded-lg"
                    onClick={() => {
                      onClose();
                      onVerPerfil(cita.paciente?.id);
                    }}
                    title="Ver perfil completo del paciente"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Ver Perfil
                  </Button>
                )}

                {onVerHistorial && (
                  <Button
                    variant="outline"
                    className="border-orange-400 text-orange-700 hover:bg-orange-50 font-semibold py-2 rounded-lg"
                    onClick={() => {
                      onClose();
                      onVerHistorial(cita.paciente?.id);
                    }}
                    title="Ver historial clínico del paciente"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Historial
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 flex gap-3 flex-wrap flex-shrink-0">
          <Button
            variant="outline"
            className="flex-1 min-w-[120px] border-gray-400 text-gray-700 hover:bg-gray-200 font-semibold py-3 rounded-lg"
            onClick={onClose}
          >
            Cerrar
          </Button>

          {onCrearReceta && (
            <Button
              onClick={() => {
                onClose();
                onCrearReceta();
              }}
              className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              title="Crear receta electrónica para este paciente"
            >
              <FileText className="w-4 h-4" />
              Crear Receta
            </Button>
          )}

          {onGestionarCita && (
            <Button
              onClick={() => {
                onClose();
                onGestionarCita();
              }}
              className="flex-1 min-w-[120px] bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              title="Gestionar información de la cita"
            >
              <AlertCircle className="w-4 h-4" />
              Gestionar Cita
            </Button>
          )}

          {puedeUnirseLocal() && (
            <Button
              onClick={unirseAVideollamada}
              disabled={unirseLoading}
              className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {unirseLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Conectando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Unirse Ahora
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
