// components/medico/detalles-cita-modal.tsx
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
}

export function DetallesCitaModalMedico({
  isOpen,
  onClose,
  cita,
  onCitaActualizada,
}: DetallesCitaModalProps) {
  const { token } = useAuth();
  const [unirseLoading, setUnirseLoading] = useState(false);

  if (!cita) return null;

  const unirseAVideollamada = async () => {
    if (!cita.id_sesion && !cita.id) {
      alert("No se encontró la sesión de videollamada.");
      return;
    }

    setUnirseLoading(true);
    try {
      const res = await fetch("/api/telemedicina/token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sesion_id: cita.id_sesion || cita.id }),
      });

      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Error al acceder a la videollamada");

      const sesionId = cita.id_sesion || cita.id;
      const nuevaVentana = window.open(
        `/telemedicina/sesion/${sesionId}`,
        "_blank"
      );
      if (nuevaVentana) onClose();
      else alert("Permite ventanas emergentes para la videollamada.");
    } catch (err: any) {
      alert(`Error: ${err.message || "No se pudo conectar a la videollamada"}`);
    } finally {
      setUnirseLoading(false);
    }
  };

  const puedeUnirseAVideollamada = () => {
    if (cita.tipo_cita !== "virtual") return false;
    const estadoValido = ["confirmada", "programada", "iniciada"].includes(
      cita.estado
    );
    const hoy = new Date();
    const fechaCita = new Date(cita.fecha_cita);
    return estadoValido && fechaCita >= new Date(hoy.setHours(0, 0, 0, 0));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-0">
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
                {cita.tipo_cita === "virtual"
                  ? "Consulta Virtual"
                  : "Consulta Presencial"}
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
                      className="w-full justify-center border-2 border-green-400 text-green-700 py-2 text-sm font-bold capitalize"
                    >
                      {cita.tipo_cita}
                    </Badge>
                  </div>

                  {cita.tipo_cita === "virtual" &&
                    puedeUnirseAVideollamada() && (
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
                <Button
                  variant="outline"
                  className="border-blue-400 text-blue-700 hover:bg-blue-50 font-semibold py-5 rounded-lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Generar</span> Receta
                </Button>

                <Button
                  variant="outline"
                  className="border-purple-400 text-purple-700 hover:bg-purple-50 font-semibold py-5 rounded-lg"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Solicitar</span> Exámenes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 flex gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-200 font-semibold py-3 rounded-lg"
            onClick={onClose}
          >
            Cerrar
          </Button>
          {cita.tipo_cita === "virtual" && puedeUnirseAVideollamada() && (
            <Button
              onClick={unirseAVideollamada}
              disabled={unirseLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
            >
              {unirseLoading ? "Conectando..." : "Unirse Ahora"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
