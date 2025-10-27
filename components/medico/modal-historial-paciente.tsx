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
import { FileText } from "lucide-react";

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
    usuario: {
      nombre: string;
      apellido: string;
    };
  };
  historial_citas: HistorialCita[];
  recetas: Receta[];
  examenes_laboratorio: ExamenLaboratorio[];
}

interface ModalHistorialPacienteProps {
  isOpen: boolean;
  onClose: () => void;
  historial: PacienteHistorial | null;
}

export function ModalHistorialPaciente({
  isOpen,
  onClose,
  historial,
}: ModalHistorialPacienteProps) {
  if (!historial) return null;

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

        <Tabs defaultValue="citas" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
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
