// components/medico/modal-historial-paciente.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle } from "lucide-react";

interface HistorialCita {
  id: string;
  fecha_cita: string;
  estado: string;
  tipo_cita: string;
  motivo_consulta: string;
  diagnostico?: string;
  tratamiento?: string;
  medico: {
    nombre: string;
    apellido: string;
    especialidad: string;
  };
}

interface Receta {
  id: string;
  codigo_receta: string;
  estado: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  observaciones?: string;
  medico: {
    nombre: string;
    apellido: string;
  };
}

interface ExamenLaboratorio {
  id: string;
  codigo_solicitud: string;
  estado: string;
  fecha_solicitud: string;
  laboratorio?: string;
  observaciones?: string;
}

interface PacienteHistorial {
  paciente: {
    id?: string;
    usuario: {
      nombre: string;
      apellido: string;
      email?: string;
      telefono?: string;
    };
    informacion_personal?: {
      dni?: string;
      edad?: number;
      fecha_nacimiento?: string;
    };
    informacion_medica?: {
      alergias?: string;
      enfermedades_cronicas?: string;
      tipo_sangre?: string;
    };
    estadisticas_atencion?: {
      ultima_cita?: string;
    };
    // Propiedades de fallback (estructura alternativa)
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    dni?: string;
    alergias?: string;
    enfermedades_cronicas?: string;
    ultima_cita?: string;
  };
  historial_citas: HistorialCita[];
  recetas: Receta[];
  examenes_laboratorio: ExamenLaboratorio[];
}

interface ModalHistorialPacienteProps {
  isOpen: boolean;
  onClose: () => void;
  historial: PacienteHistorial | null;
  canAccess?: boolean;
  accessDenialReason?: string;
  citaFecha?: Date;
}

export function ModalHistorialPaciente({
  isOpen,
  onClose,
  historial,
  canAccess = true,
  accessDenialReason = "",
  citaFecha,
}: ModalHistorialPacienteProps) {
  if (!historial) return null;

  // Si no tiene acceso, mostrar mensaje restrictivo
  if (!canAccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center text-lg font-semibold text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              Acceso Restringido
            </DialogTitle>
            <DialogDescription className="text-gray-700 mt-2">
              {accessDenialReason ||
                "No tienes permiso para acceder al historial de este paciente en este momento."}
            </DialogDescription>
          </DialogHeader>

          {citaFecha && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
              <p className="text-sm text-amber-900">
                <strong>ℹ️ Información:</strong>
              </p>
              <p className="text-sm text-amber-800 mt-1">
                El acceso al historial está disponible desde la fecha de la cita hasta 7 días
                después.
              </p>
              <p className="text-sm text-amber-800 mt-2">
                <strong>Fecha de la cita:</strong>{" "}
                {new Date(citaFecha).toLocaleDateString("es-PE", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
            >
              Entendido
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Helpers para tolerar distintas formas del objeto paciente
  const getPacienteNombre = () => {
    return (
      historial.paciente?.usuario?.nombre ||
      historial.paciente?.nombre ||
      "Paciente"
    );
  };

  const getPacienteApellido = () => {
    return (
      historial.paciente?.usuario?.apellido ||
      historial.paciente?.apellido ||
      ""
    );
  };

  const getPacienteContacto = () => {
    return {
      telefono:
        historial.paciente?.usuario?.telefono || historial.paciente?.telefono || "",
      email: historial.paciente?.usuario?.email || historial.paciente?.email || "",
      dni:
        historial.paciente?.informacion_personal?.dni || historial.paciente?.dni || "",
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          max-w-6xl 
          max-h-[85vh] 
          w-full 
          overflow-y-auto 
          rounded-2xl 
          p-6 
          scrollbar-thin 
          scrollbar-thumb-gray-300 
          scrollbar-track-transparent
        "
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center text-xl font-semibold">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Historial Médico de {historial.paciente?.usuario?.nombre}{" "}
            {historial.paciente?.usuario?.apellido}
          </DialogTitle>
          <DialogDescription>
            Evolución clínica completa del paciente
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="resumen" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="citas">
              Citas ({historial.historial_citas?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="recetas">
              Recetas ({historial.recetas?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="examenes">
              Exámenes ({historial.examenes_laboratorio?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Resumen Clínico */}
          <TabsContent value="resumen" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-white shadow-sm">
                <h4 className="font-semibold">Paciente</h4>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Nombre:</strong> {getPacienteNombre()} {getPacienteApellido()}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>DNI:</strong> {getPacienteContacto().dni || "No especificado"}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Teléfono:</strong> {getPacienteContacto().telefono || "-"}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Email:</strong> {getPacienteContacto().email || "-"}
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-white shadow-sm md:col-span-2">
                <h4 className="font-semibold">Resumen Clínico</h4>
                <div className="mt-2 text-sm text-gray-700 space-y-2">
                  <p>
                    <strong>Alergias:</strong>{" "}
                    {historial.paciente?.informacion_medica?.alergias || historial.paciente?.alergias || "No registra"}
                  </p>
                  <p>
                    <strong>Enfermedades crónicas:</strong>{" "}
                    {historial.paciente?.informacion_medica?.enfermedades_cronicas || historial.paciente?.enfermedades_cronicas || "No registra"}
                  </p>
                  <p>
                    <strong>Última cita:</strong>{" "}
                    {historial.paciente?.estadisticas_atencion?.ultima_cita || historial.paciente?.ultima_cita || "-"}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                    onClick={() => {
                      // Descargar JSON del historial como respaldo
                      const blob = new Blob([JSON.stringify(historial, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `historial_${historial.paciente?.id || "paciente"}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Descargar JSON
                  </button>

                  <a
                    className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md text-sm border"
                    href={`tel:${getPacienteContacto().telefono || ""}`}
                    onClick={(e) => {
                      if (!getPacienteContacto().telefono) e.preventDefault();
                    }}
                  >
                    Llamar
                  </a>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 🩵 Citas */}
          <TabsContent value="citas" className="space-y-4 py-4">
            {historial.historial_citas?.length > 0 ? (
              historial.historial_citas.map((cita) => (
                <div
                  key={cita.id}
                  className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white dark:bg-gray-900"
                >
                  <div className="flex justify-between items-start flex-wrap">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-blue-700">
                        {new Date(cita.fecha_cita).toLocaleDateString("es-PE")}
                      </h4>
                      <Badge
                        variant={
                          cita.estado === "completada" ? "default" : "secondary"
                        }
                      >
                        {cita.estado}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {cita.tipo_cita}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <strong>Médico:</strong> Dr. {cita.medico.nombre}{" "}
                    {cita.medico.apellido} – {cita.medico.especialidad}
                  </p>
                  <p className="text-sm mb-1">
                    <strong>Motivo:</strong> {cita.motivo_consulta}
                  </p>
                  {cita.diagnostico && (
                    <p className="text-sm mb-1">
                      <strong>Diagnóstico:</strong> {cita.diagnostico}
                    </p>
                  )}
                  {cita.tratamiento && (
                    <p className="text-sm">
                      <strong>Tratamiento:</strong> {cita.tratamiento}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <NoData text="No hay citas registradas" />
            )}
          </TabsContent>

          {/* 💚 Recetas */}
          <TabsContent value="recetas" className="space-y-4 py-4">
            {historial.recetas?.length > 0 ? (
              historial.recetas.map((receta) => (
                <div
                  key={receta.id}
                  className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white dark:bg-gray-900"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-green-700">
                      Receta #{receta.codigo_receta}
                    </h4>
                    <Badge
                      variant={
                        receta.estado === "activa" ? "default" : "secondary"
                      }
                    >
                      {receta.estado}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Fecha:{" "}
                    {new Date(receta.fecha_emision).toLocaleDateString("es-PE")}{" "}
                    | Vence:{" "}
                    {new Date(receta.fecha_vencimiento).toLocaleDateString(
                      "es-PE"
                    )}
                  </p>
                  <p className="text-sm">
                    Médico: Dr. {receta.medico.nombre} {receta.medico.apellido}
                  </p>
                  {receta.observaciones && (
                    <p className="text-sm mt-2">
                      <strong>Observaciones:</strong> {receta.observaciones}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <NoData text="No hay recetas registradas" />
            )}
          </TabsContent>

          {/* 🧡 Exámenes */}
          <TabsContent value="examenes" className="space-y-4 py-4">
            {historial.examenes_laboratorio?.length > 0 ? (
              historial.examenes_laboratorio.map((examen) => (
                <div
                  key={examen.id}
                  className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white dark:bg-gray-900"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-orange-700">
                      Examen #{examen.codigo_solicitud}
                    </h4>
                    <Badge
                      variant={
                        examen.estado === "completado" ? "default" : "secondary"
                      }
                    >
                      {examen.estado}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Fecha:{" "}
                    {new Date(examen.fecha_solicitud).toLocaleDateString(
                      "es-PE"
                    )}
                  </p>
                  <p className="text-sm">
                    Laboratorio: {examen.laboratorio || "No especificado"}
                  </p>
                  {examen.observaciones && (
                    <p className="text-sm mt-2">
                      <strong>Observaciones:</strong> {examen.observaciones}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <NoData text="No hay exámenes registrados" />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// 🔹 Componente auxiliar para cuando no hay datos
function NoData({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-gray-500 dark:text-gray-400 italic">
      {text}
    </div>
  );
}
