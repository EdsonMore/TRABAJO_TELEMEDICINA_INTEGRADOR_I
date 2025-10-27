// components/medico/gestion-cita-medico-modal.tsx
// Modal específico para médicos - Permite completar diagnóstico, tratamiento, etc.

"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Video,
  FileText,
  Stethoscope,
  Pill,
  Eye,
  Save,
  X,
  Loader2,
  AlertCircle,
  Heart,
  Thermometer,
  Weight,
  Ruler,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GestionCitaMedicoModal {
  isOpen: boolean;
  onClose: () => void;
  cita: any;
  onCitaActualizada: () => void;
}

export function GestionCitaMedicoModal({
  isOpen,
  onClose,
  cita,
  onCitaActualizada,
}: GestionCitaMedicoModal) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para los campos médicos
  const [formData, setFormData] = useState({
    diagnostico: "",
    tratamiento: "",
    observaciones_medico: "",
    costo: "",
    // Campos adicionales para signos vitales
    presion_arterial: "",
    frecuencia_cardiaca: "",
    temperatura: "",
    peso: "",
    altura: "",
    saturacion_oxigeno: "",
    // Estado de la cita
    estado: "completada",
  });

  // Cargar datos de la cita cuando se abre el modal
  useEffect(() => {
    if (cita && isOpen) {
      setFormData({
        diagnostico: cita.diagnostico || "",
        tratamiento: cita.tratamiento || "",
        observaciones_medico: cita.observaciones_medico || "",
        costo: cita.costo?.toString() || "80.00",
        presion_arterial: cita.presion_arterial || "",
        frecuencia_cardiaca: cita.frecuencia_cardiaca || "",
        temperatura: cita.temperatura || "",
        peso: cita.peso || "",
        altura: cita.altura || "",
        saturacion_oxigeno: cita.saturacion_oxigeno || "",
        estado: cita.estado || "completada",
      });
    }
  }, [cita, isOpen]);

  if (!cita) return null;

  // Función para obtener los datos del paciente desde la estructura de la BD
  const getPacienteData = () => {
    // Intentar obtener datos desde diferentes estructuras posibles
    if (cita.paciente) {
      return {
        nombre: cita.paciente.nombre || "",
        apellido: cita.paciente.apellido || "",
        dni: cita.paciente.dni || "",
        telefono: cita.paciente.telefono || "",
        fecha_nacimiento: cita.paciente.fecha_nacimiento || "",
        tipo_sangre: cita.paciente.tipo_sangre || "",
        alergias: cita.paciente.alergias || "",
      };
    } else if (cita.nombre_paciente) {
      return {
        nombre: cita.nombre_paciente.split(" ")[0] || "",
        apellido: cita.nombre_paciente.split(" ").slice(1).join(" ") || "",
        dni: cita.dni || "",
        telefono: cita.telefono_paciente || "",
        fecha_nacimiento: cita.fecha_nacimiento || "",
        tipo_sangre: cita.tipo_sangre || "",
        alergias: cita.alergias || "",
      };
    } else {
      return {
        nombre: "",
        apellido: "",
        dni: "",
        telefono: "",
        fecha_nacimiento: "",
        tipo_sangre: "",
        alergias: "",
      };
    }
  };

  // Función para obtener datos de la cita
  const getCitaData = () => {
    return {
      id: cita.id || cita.cita_id || "",
      fecha_cita: cita.fecha_cita || cita.fecha || "",
      hora_cita: cita.hora_cita || cita.hora || "",
      tipo_cita: cita.tipo_cita || "presencial",
      estado: cita.estado || "programada",
      motivo_consulta: cita.motivo_consulta || cita.motivo || "",
      observaciones_paciente:
        cita.observaciones_paciente || cita.observaciones || "",
    };
  };

  const pacienteData = getPacienteData();
  const citaData = getCitaData();

  // Calcular edad a partir de la fecha de nacimiento
  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const edad = calcularEdad(pacienteData.fecha_nacimiento);

  // Guardar datos médicos
  const guardarDatosMedicos = async () => {
    if (!formData.diagnostico.trim()) {
      toast({
        title: "Diagnóstico requerido",
        description: "Por favor ingresa un diagnóstico",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/citas/${citaData.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: formData.estado,
          diagnostico: formData.diagnostico,
          tratamiento: formData.tratamiento,
          observaciones_medico: formData.observaciones_medico,
          costo: parseFloat(formData.costo) || 80.0,
          // Signos vitales
          presion_arterial: formData.presion_arterial,
          frecuencia_cardiaca: formData.frecuencia_cardiaca,
          temperatura: formData.temperatura,
          peso: formData.peso,
          altura: formData.altura,
          saturacion_oxigeno: formData.saturacion_oxigeno,
        }),
      });

      if (response.ok) {
        toast({
          title: "✅ Datos médicos guardados",
          description:
            "La información de la consulta ha sido actualizada exitosamente.",
        });
        onCitaActualizada();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar datos médicos");
      }
    } catch (error: any) {
      console.error("Error guardando datos médicos:", error);
      toast({
        title: "Error al guardar",
        description:
          error.message || "No se pudieron guardar los datos médicos",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cambiar estado de la cita
  const cambiarEstadoCita = async (nuevoEstado: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/citas/${citaData.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: nuevoEstado,
        }),
      });

      if (response.ok) {
        toast({
          title: "Estado actualizado",
          description: `La cita ha sido marcada como ${nuevoEstado}`,
        });
        onCitaActualizada();
        setFormData((prev) => ({ ...prev, estado: nuevoEstado }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al cambiar estado");
      }
    } catch (error: any) {
      console.error("Error cambiando estado:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el estado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener configuración del estado
  const getEstadoConfig = (estado: string) => {
    const configs: any = {
      programada: {
        label: "Programada",
        color: "bg-yellow-100 text-yellow-800",
      },
      confirmada: { label: "Confirmada", color: "bg-blue-100 text-blue-800" },
      en_curso: { label: "En Curso", color: "bg-orange-100 text-orange-800" },
      completada: { label: "Completada", color: "bg-green-100 text-green-800" },
      cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800" },
      no_asistio: { label: "No Asistió", color: "bg-gray-100 text-gray-800" },
    };
    return (
      configs[estado] || { label: estado, color: "bg-gray-100 text-gray-800" }
    );
  };

  const estadoConfig = getEstadoConfig(citaData.estado);

  // Formatear hora para mostrar
  const formatHora = (hora: string) => {
    if (!hora) return "--:--";
    if (hora.includes(":")) return hora.slice(0, 5);
    const horaNum = parseInt(hora);
    return `${horaNum.toString().padStart(2, "0")}:00`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto rounded-lg sm:rounded-2xl">
        {/* HEADER */}
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center text-xl sm:text-2xl font-bold">
            <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
            Consulta Médica - Expediente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* INFORMACIÓN PRINCIPAL DE LA CITA */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Información del Paciente */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {pacienteData.nombre} {pacienteData.apellido}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {pacienteData.dni && <p>DNI: {pacienteData.dni}</p>}
                    {edad && <p>Edad: {edad} años</p>}
                    {pacienteData.tipo_sangre && (
                      <p>Grupo Sanguíneo: {pacienteData.tipo_sangre}</p>
                    )}
                  </div>
                </div>

                {/* Detalles de la Cita */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={estadoConfig.color}>
                      {estadoConfig.label}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {citaData.tipo_cita}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date(citaData.fecha_cita).toLocaleDateString("es-PE", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {formatHora(citaData.hora_cita)} horas
                  </p>
                </div>

                {/* Acciones Rápidas */}
                <div className="space-y-2">
                  <Label>Cambiar Estado:</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => cambiarEstadoCita(value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_curso">En Curso</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="no_asistio">No Asistió</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CONTENIDO PRINCIPAL */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* COLUMNA IZQUIERDA - INFORMACIÓN DEL PACIENTE */}
            <div className="xl:col-span-1 space-y-6">
              {/* HISTORIAL MÉDICO */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Historial Médico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pacienteData.alergias ? (
                    <div>
                      <Label className="text-sm font-semibold">
                        Alergias Conocidas
                      </Label>
                      <p className="text-sm text-gray-700 mt-1 bg-yellow-50 p-2 rounded">
                        {pacienteData.alergias}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No hay alergias registradas</p>
                    </div>
                  )}

                  {/* Motivo de Consulta */}
                  <div>
                    <Label className="text-sm font-semibold">
                      Motivo de Consulta
                    </Label>
                    <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                      {citaData.motivo_consulta}
                    </p>
                  </div>

                  {/* Observaciones del Paciente */}
                  {citaData.observaciones_paciente && (
                    <div>
                      <Label className="text-sm font-semibold">
                        Observaciones del Paciente
                      </Label>
                      <p className="text-sm text-gray-700 mt-1 bg-blue-50 p-2 rounded whitespace-pre-wrap">
                        {citaData.observaciones_paciente}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SIGNOS VITALES */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Heart className="w-5 h-5 mr-2 text-red-600" />
                    Signos Vitales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="presion_arterial" className="text-sm">
                        Presión Arterial
                      </Label>
                      <Input
                        id="presion_arterial"
                        value={formData.presion_arterial}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            presion_arterial: e.target.value,
                          }))
                        }
                        placeholder="120/80"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="frecuencia_cardiaca" className="text-sm">
                        Frec. Cardíaca
                      </Label>
                      <Input
                        id="frecuencia_cardiaca"
                        value={formData.frecuencia_cardiaca}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            frecuencia_cardiaca: e.target.value,
                          }))
                        }
                        placeholder="72"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="temperatura" className="text-sm">
                        Temperatura (°C)
                      </Label>
                      <Input
                        id="temperatura"
                        value={formData.temperatura}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            temperatura: e.target.value,
                          }))
                        }
                        placeholder="36.5"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saturacion_oxigeno" className="text-sm">
                        Sat. O₂ (%)
                      </Label>
                      <Input
                        id="saturacion_oxigeno"
                        value={formData.saturacion_oxigeno}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            saturacion_oxigeno: e.target.value,
                          }))
                        }
                        placeholder="98"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="peso" className="text-sm">
                        Peso (kg)
                      </Label>
                      <Input
                        id="peso"
                        value={formData.peso}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            peso: e.target.value,
                          }))
                        }
                        placeholder="70"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="altura" className="text-sm">
                        Altura (cm)
                      </Label>
                      <Input
                        id="altura"
                        value={formData.altura}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            altura: e.target.value,
                          }))
                        }
                        placeholder="170"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* COLUMNA DERECHA - FORMULARIO MÉDICO */}
            <div className="xl:col-span-2 space-y-6">
              {/* DIAGNÓSTICO */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Stethoscope className="w-5 h-5 mr-2 text-green-600" />
                    Diagnóstico
                    <span className="text-red-500 ml-1">*</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.diagnostico}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        diagnostico: e.target.value,
                      }))
                    }
                    placeholder="Ingrese el diagnóstico del paciente..."
                    rows={4}
                    className="resize-none text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.diagnostico.length}/1000 caracteres
                  </p>
                </CardContent>
              </Card>

              {/* TRATAMIENTO */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Pill className="w-5 h-5 mr-2 text-blue-600" />
                    Tratamiento y Receta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.tratamiento}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tratamiento: e.target.value,
                      }))
                    }
                    placeholder="Describa el tratamiento, medicamentos, dosis, frecuencia, duración..."
                    rows={5}
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.tratamiento.length}/1500 caracteres
                  </p>
                </CardContent>
              </Card>

              {/* OBSERVACIONES MÉDICAS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Eye className="w-5 h-5 mr-2 text-purple-600" />
                    Observaciones Médicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.observaciones_medico}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        observaciones_medico: e.target.value,
                      }))
                    }
                    placeholder="Observaciones adicionales, recomendaciones, seguimiento requerido..."
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.observaciones_medico.length}/500 caracteres
                  </p>
                </CardContent>
              </Card>

              {/* INFORMACIÓN DE COSTO */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Información de Costo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="costo" className="text-sm font-semibold">
                        Costo de la Consulta (S/)
                      </Label>
                      <Input
                        id="costo"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.costo}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            costo: e.target.value,
                          }))
                        }
                        className="h-9"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" className="w-full h-9">
                        Generar Receta
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FOOTER CON ACCIONES */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
            <div className="text-sm text-gray-500">
              <p>
                Consulta con {pacienteData.nombre} {pacienteData.apellido}
              </p>
              <p>{new Date().toLocaleDateString("es-PE")}</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="min-w-24 h-11"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>

              <Button
                onClick={guardarDatosMedicos}
                disabled={isSaving || !formData.diagnostico.trim()}
                className="min-w-24 h-11 bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Expediente
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
