"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import {
  TestTube,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Microscope,
} from "lucide-react";

interface ExamenPendiente {
  id: string;
  tipo_examen: string;
  fecha_solicitud: string;
  prioridad: string;
  paciente: {
    nombre: string;
    apellido: string;
    dni: string;
    edad: number;
  };
  medico: {
    nombre: string;
    apellido: string;
    especialidad: string;
  };
  indicaciones?: string;
}

interface ResultadoSubido {
  id: string;
  examen_id: string;
  archivo_pdf: string;
  fecha_subida: string;
  observaciones: string;
  valores_referencia: string;
}

export function SubirResultadosForm() {
  const { token } = useAuth();
  const [examenesPendientes, setExamenesPendientes] = useState<
    ExamenPendiente[]
  >([]);
  const [examenSeleccionado, setExamenSeleccionado] =
    useState<ExamenPendiente | null>(null);
  const [archivoPDF, setArchivoPDF] = useState<File | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [valoresReferencia, setValoresReferencia] = useState("");
  const [resultadoSubido, setResultadoSubido] =
    useState<ResultadoSubido | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cargandoExamenes, setCargandoExamenes] = useState(false);

  const cargarExamenesPendientes = async () => {
    setCargandoExamenes(true);
    try {
      const response = await fetch("/api/laboratorio/examenes-pendientes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExamenesPendientes(data.examenes || []);
      }
    } catch (error) {
      console.error("Error cargando exámenes:", error);
    } finally {
      setCargandoExamenes(false);
    }
  };

  const manejarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (archivo && archivo.type === "application/pdf") {
      setArchivoPDF(archivo);
    } else {
      alert("Por favor seleccione un archivo PDF válido");
      event.target.value = "";
    }
  };

  const subirResultado = async () => {
    if (!examenSeleccionado || !archivoPDF) {
      alert("Por favor seleccione un examen y un archivo PDF");
      return;
    }

    setCargando(true);

    try {
      // Simular subida de archivo (en producción usaría FormData y multer)
      const archivoBase64 = await convertirArchivoABase64(archivoPDF);

      const resultadoData = {
        examen_id: examenSeleccionado.id,
        archivo_pdf: archivoBase64,
        observaciones,
        valores_referencia:
          valoresReferencia ||
          "Valores normales según protocolo del laboratorio",
      };

      const response = await fetch("/api/laboratorio/subir-resultado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resultadoData),
      });

      if (response.ok) {
        const data = await response.json();
        setResultadoSubido(data.resultado);
        setMostrarResultado(true);

        // Limpiar formulario
        setExamenSeleccionado(null);
        setArchivoPDF(null);
        setObservaciones("");
        setValoresReferencia("");

        // Recargar exámenes pendientes
        cargarExamenesPendientes();
      } else {
        alert("Error al subir el resultado");
      }
    } catch (error) {
      console.error("Error subiendo resultado:", error);
      alert("Error al subir el resultado");
    } finally {
      setCargando(false);
    }
  };

  const convertirArchivoABase64 = (archivo: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "urgente":
        return "bg-red-100 text-red-800 border-red-200";
      case "alta":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="medical-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="w-5 h-5 mr-2 text-primary" />
            Subir Resultados de Laboratorio
          </CardTitle>
          <CardDescription>
            Sube resultados de exámenes en formato PDF para que los pacientes
            puedan acceder a ellos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cargar Exámenes Pendientes */}
          <div className="flex justify-between items-center">
            <Label>Exámenes Pendientes</Label>
            <Button
              variant="outline"
              onClick={cargarExamenesPendientes}
              disabled={cargandoExamenes}
            >
              {cargandoExamenes ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Cargando...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Cargar Exámenes
                </>
              )}
            </Button>
          </div>

          {/* Lista de Exámenes Pendientes */}
          {examenesPendientes.length > 0 && (
            <div className="space-y-4">
              <Label>
                Seleccionar Examen ({examenesPendientes.length} pendientes)
              </Label>
              <div className="grid grid-cols-1 gap-4 max-h-60 overflow-y-auto">
                {examenesPendientes.map((examen) => (
                  <div
                    key={examen.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      examenSeleccionado?.id === examen.id
                        ? "ring-2 ring-primary border-primary bg-primary/5"
                        : "border-border bg-card/50"
                    }`}
                    onClick={() => setExamenSeleccionado(examen)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Microscope className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{examen.tipo_examen}</h4>
                          <p className="text-sm text-muted-foreground">
                            {examen.paciente.nombre} {examen.paciente.apellido}{" "}
                            • {examen.paciente.edad} años
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Solicitado:{" "}
                            {new Date(
                              examen.fecha_solicitud
                            ).toLocaleDateString("es-PE")}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge
                          className={getPrioridadColor(examen.prioridad)}
                          variant="outline"
                        >
                          {examen.prioridad}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Dr. {examen.medico.nombre} {examen.medico.apellido}
                        </p>
                      </div>
                    </div>

                    {examen.indicaciones && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <strong>Indicaciones:</strong> {examen.indicaciones}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información del Examen Seleccionado */}
          {examenSeleccionado && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-medium text-primary mb-2">
                Examen Seleccionado:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Tipo:</strong> {examenSeleccionado.tipo_examen}
                  </p>
                  <p>
                    <strong>Paciente:</strong>{" "}
                    {examenSeleccionado.paciente.nombre}{" "}
                    {examenSeleccionado.paciente.apellido}
                  </p>
                  <p>
                    <strong>DNI:</strong> {examenSeleccionado.paciente.dni}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Médico:</strong> Dr.{" "}
                    {examenSeleccionado.medico.nombre}{" "}
                    {examenSeleccionado.medico.apellido}
                  </p>
                  <p>
                    <strong>Especialidad:</strong>{" "}
                    {examenSeleccionado.medico.especialidad}
                  </p>
                  <p>
                    <strong>Prioridad:</strong> {examenSeleccionado.prioridad}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subir Archivo PDF */}
          <div className="space-y-4">
            <Label htmlFor="archivo">Archivo PDF del Resultado *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Arrastra y suelta tu archivo PDF aquí, o haz clic para
                  seleccionar
                </p>
                <Input
                  id="archivo"
                  type="file"
                  accept=".pdf"
                  onChange={manejarArchivo}
                  className="max-w-xs mx-auto"
                />
              </div>
              {archivoPDF && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {archivoPDF.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {(archivoPDF.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Valores de Referencia */}
          <div className="space-y-2">
            <Label htmlFor="valores">Valores de Referencia</Label>
            <Textarea
              id="valores"
              placeholder="Ingrese los valores de referencia normales para este tipo de examen..."
              value={valoresReferencia}
              onChange={(e) => setValoresReferencia(e.target.value)}
              rows={3}
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones del Laboratorio</Label>
            <Textarea
              id="observaciones"
              placeholder="Observaciones, recomendaciones o notas adicionales sobre el resultado..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
            />
          </div>

          {/* Botón Subir Resultado */}
          <div className="flex justify-end">
            <Button
              onClick={subirResultado}
              disabled={!examenSeleccionado || !archivoPDF || cargando}
              className="bg-primary hover:bg-primary/90"
            >
              {cargando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Resultado
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Resultado Subido */}
      <Dialog open={mostrarResultado} onOpenChange={setMostrarResultado}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Resultado Subido Exitosamente
            </DialogTitle>
            <DialogDescription>
              El resultado ha sido subido y está disponible para el paciente y
              médico
            </DialogDescription>
          </DialogHeader>

          {resultadoSubido && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800">
                      Resultado Procesado
                    </h3>
                    <p className="text-sm text-green-600">
                      ID: {resultadoSubido.id}
                    </p>
                    <p className="text-sm text-green-600">
                      Fecha:{" "}
                      {new Date(
                        resultadoSubido.fecha_subida
                      ).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    PDF Disponible
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Observaciones:</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resultadoSubido.observaciones ||
                      "Sin observaciones adicionales"}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Valores de Referencia:
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resultadoSubido.valores_referencia}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">
                      Notificación Automática
                    </h4>
                    <p className="text-sm text-blue-600 mt-1">
                      El paciente y el médico solicitante han sido notificados
                      automáticamente sobre la disponibilidad del resultado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setMostrarResultado(false)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setMostrarResultado(false);
                    cargarExamenesPendientes();
                  }}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Procesar Otro Examen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
