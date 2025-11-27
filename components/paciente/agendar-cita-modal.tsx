// components/paciente/agendar-cita-modal.tsx
// Modal responsivo para agendar citas - Conectado a base de datos real

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Calendar,
  Clock,
  User,
  MapPin,
  Video,
  Home,
  Star,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface AgendarCitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCitaCreada: () => void;
}

interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  tarifa_consulta: number;
  calificacion_promedio: number;
  numero_colegiatura: string;
  direccion_consultorio?: string;
  acepta_seguro: boolean;
  anos_experiencia: number;
}

interface HorarioDisponible {
  hora: number;
  disponible: boolean;
  formato_12h: string;
}

export function AgendarCitaModal({
  isOpen,
  onClose,
  onCitaCreada,
}: AgendarCitaModalProps) {
  const { toast } = useToast();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMedicos, setIsLoadingMedicos] = useState(false);
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState<Medico | null>(
    null
  );
  const [horariosDisponibles, setHorariosDisponibles] = useState<
    HorarioDisponible[]
  >([]);

  const [formData, setFormData] = useState({
    medico_id: "",
    fecha_cita: "",
    hora_cita: "",
    tipo_cita: "presencial",
    motivo_consulta: "",
  });

  // Resetear formulario al abrir
  useEffect(() => {
    if (isOpen) {
      console.log("🔄 Modal abierto - Debug Auth:", {
        tieneToken: !!token,
        token: token ? `${token.substring(0, 30)}...` : "NO TOKEN",
        timestamp: new Date().toISOString(),
      });

      // ✅ LLAMAR A LA FUNCIÓN CORRECTA DEL MODAL
      cargarMedicosModal();
    }
  }, [isOpen, token]);

  // Cargar horarios cuando cambie médico o fecha
  useEffect(() => {
    if (formData.medico_id && formData.fecha_cita) {
      cargarHorariosDisponibles();
    } else {
      setHorariosDisponibles([]);
    }
  }, [formData.medico_id, formData.fecha_cita]);

  const resetForm = () => {
    setFormData({
      medico_id: "",
      fecha_cita: "",
      hora_cita: "",
      tipo_cita: "presencial",
      motivo_consulta: "",
    });
    setMedicoSeleccionado(null);
    setHorariosDisponibles([]);
  };

  const cargarMedicosModal = async () => {
    setIsLoadingMedicos(true);
    try {
      // ✅ VERIFICAR TOKEN PRIMERO
      if (!token) {
        console.error("❌ Modal: No hay token disponible");
        toast({
          title: "Error de autenticación",
          description: "Por favor inicia sesión nuevamente",
          variant: "destructive",
        });
        return;
      }

      console.log("🔐 Modal: Intentando cargar médicos con token:", {
        tokenLength: token?.length,
        tokenPreview: token ? token.substring(0, 20) + "..." : "NO TOKEN",
      });

      const response = await fetch("/api/medicos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 Modal: Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Modal: Médicos cargados:", data.medicos?.length || 0);
        setMedicos(data.medicos || []);
      } else if (response.status === 401) {
        console.error("❌ Modal: Token expirado o inválido");
        toast({
          title: "Sesión expirada",
          description: "Por favor inicia sesión nuevamente",
          variant: "destructive",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Modal: Error del servidor:", errorData);
        throw new Error(errorData.error || "Error al cargar médicos");
      }
    } catch (error) {
      console.error("Error cargando médicos en modal:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los médicos disponibles",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMedicos(false);
    }
  };

  // Cargar lista de médicos desde la base de datos - ENDPOINT CORREGIDO
  const cargarMedicos = async () => {
    setIsLoadingMedicos(true);
    try {
      // ✅ VERIFICAR TOKEN PRIMERO
      if (!token) {
        console.error("❌ No hay token disponible");
        toast({
          title: "Error de autenticación",
          description: "Por favor inicia sesión nuevamente",
          variant: "destructive",
        });
        return;
      }

      console.log("🔐 Intentando cargar médicos con token:", {
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + "...",
      });

      const response = await fetch("/api/medicos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Médicos cargados:", data.medicos?.length || 0);
        setMedicos(data.medicos || []);
      } else if (response.status === 401) {
        // Token expirado
        console.error("❌ Token expirado o inválido");
        toast({
          title: "Sesión expirada",
          description: "Por favor inicia sesión nuevamente",
          variant: "destructive",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Error del servidor:", errorData);
        throw new Error(errorData.error || "Error al cargar médicos");
      }
    } catch (error) {
      console.error("Error cargando médicos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los médicos disponibles",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMedicos(false);
    }
  };

  // Cargar horarios disponibles desde la base de datos - ENDPOINT CORREGIDO
  const cargarHorariosDisponibles = async () => {
    if (!formData.medico_id || !formData.fecha_cita) return;

    setIsLoadingHorarios(true);
    try {
      const response = await fetch(
        `/api/citas/disponibilidad?medico_id=${formData.medico_id}&fecha=${formData.fecha_cita}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // ✅ DEBUG: Ver qué devuelve el backend
        console.log("🔍 DEBUG - Respuesta del backend:", {
          medico_id: formData.medico_id,
          fecha: formData.fecha_cita,
          data_completa: data.data,
          hora_actual: new Date().getHours(),
          fecha_hoy: new Date().toISOString().split("T")[0],
        });

        // ✅ FILTRAR HORAS PASADAS SI ES HOY
        const hoy = new Date().toISOString().split("T")[0];
        const esHoy = formData.fecha_cita === hoy;
        const horaActual = new Date().getHours();

        let horariosFiltrados = data.data || [];

        if (esHoy) {
          horariosFiltrados = horariosFiltrados.filter(
            (hora: any) => hora.hora > horaActual // Solo horas futuras de hoy
          );
        }

        const horariosFormateados = horariosFiltrados.map((hora: any) => ({
          ...hora,
          formato_12h: formatHora12h(hora.hora),
        }));

        console.log(
          "🕒 DEBUG - Horarios después de filtrar:",
          horariosFormateados
        );

        setHorariosDisponibles(horariosFormateados);
      } else {
        throw new Error("Error al cargar horarios");
      }
    } catch (error) {
      console.error("Error cargando horarios:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios disponibles",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHorarios(false);
    }
  };

  // Formatear hora en formato 12h
  const formatHora12h = (hora: number): string => {
    const ampm = hora >= 12 ? "PM" : "AM";
    const hora12 = hora % 12 || 12;
    return `${hora12}:00 ${ampm}`;
  };

  const handleMedicoChange = (medicoId: string) => {
    const medico = medicos.find((m) => m.id === medicoId) || null;
    setMedicoSeleccionado(medico);
    setFormData((prev) => ({ ...prev, medico_id: medicoId, hora_cita: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de campos requeridos
    if (
      !formData.medico_id ||
      !formData.fecha_cita ||
      !formData.hora_cita ||
      !formData.motivo_consulta
    ) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const citaData = {
        medico_id: formData.medico_id,
        fecha_cita: formData.fecha_cita,
        hora_cita: formData.hora_cita,
        tipo_cita: formData.tipo_cita,
        motivo_consulta: formData.motivo_consulta,
      };

      console.log("📤 Enviando datos de cita:", citaData);

      // ENDPOINT CORREGIDO
      const response = await fetch("/api/citas/paciente", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(citaData),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Cita programada",
          description: "Tu cita ha sido agendada exitosamente",
        });

        onCitaCreada();
        onClose();
      } else {
        console.error("❌ Error del servidor:", responseData);
        throw new Error(responseData.error || "Error al agendar cita");
      }
    } catch (error: any) {
      console.error("Error agendando cita:", error);
      toast({
        title: "Error al agendar cita",
        description:
          error.message || "No se pudo agendar la cita. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Fechas mínima y máxima (hoy hasta 3 meses)

  const hoy = new Date();
  const fechaMinima = hoy.toISOString().split("T")[0];

  const fechaMaxima = new Date();
  fechaMaxima.setMonth(hoy.getMonth() + 3);
  const fechaMaximaStr = fechaMaxima.toISOString().split("T")[0];

  const getTipoCitaIcon = (tipo: string) => {
    switch (tipo) {
      case "presencial":
        return <MapPin className="w-5 h-5" />;
      case "virtual":
        return <Video className="w-5 h-5" />;
      case "domicilio":
        return <Home className="w-5 h-5" />;
      default:
        return <Stethoscope className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg sm:rounded-xl">
        {/* HEADER */}
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center text-xl sm:text-2xl font-bold">
            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 mr-2 sm:mr-3 text-blue-600" />
            Agendar Cita Médica
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* PASO 1: SELECCIÓN DE MÉDICO */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <Label className="text-lg font-bold text-gray-900">
                Paso 1: Elige tu Médico
              </Label>
            </div>

            <Select
              value={formData.medico_id}
              onValueChange={handleMedicoChange}
              disabled={isLoadingMedicos}
            >
              <SelectTrigger className="w-full h-12 text-base border-2 border-gray-300">
                <SelectValue placeholder="Selecciona un médico" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {medicos.map((medico) => (
                  <SelectItem
                    key={medico.id}
                    value={medico.id}
                    className="py-3"
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm sm:text-base">
                          Dr. {medico.nombre} {medico.apellido}
                        </span>
                        <div className="flex items-center gap-1 text-amber-600">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                          <span className="text-xs sm:text-sm font-semibold">
                            {medico.calificacion_promedio || "Nuevo"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span>{medico.especialidad}</span>
                        <span className="font-bold text-green-600">
                          S/ {medico.tarifa_consulta}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium">
                          {medico.anos_experiencia} años de experiencia
                        </span>
                        {medico.acepta_seguro && (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium"
                          >
                            ✓ Con seguro
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isLoadingMedicos && (
              <div className="flex items-center justify-center gap-2 text-blue-600 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Cargando médicos...</span>
              </div>
            )}

            {/* INFO MÉDICO SELECCIONADO */}
            {medicoSeleccionado && (
              <Card className="bg-white border border-blue-300">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-blue-900 text-sm sm:text-base">
                        Dr. {medicoSeleccionado.nombre}{" "}
                        {medicoSeleccionado.apellido}
                      </h4>
                      <p className="text-blue-700 font-semibold text-sm">
                        {medicoSeleccionado.especialidad}
                      </p>
                      {medicoSeleccionado.direccion_consultorio && (
                        <p className="text-gray-600 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {medicoSeleccionado.direccion_consultorio}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-xl font-bold text-green-600">
                        S/ {medicoSeleccionado.tarifa_consulta}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-amber-600 mt-1">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-bold">
                          {medicoSeleccionado.calificacion_promedio || "Nuevo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* PASO 2: FECHA Y HORA */}
          <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <Label className="text-lg font-bold text-gray-900">
                Paso 2: Fecha y Hora
              </Label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* FECHA */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">
                  📅 Fecha
                </Label>
                <Input
                  type="date"
                  min={fechaMinima}
                  max={fechaMaximaStr}
                  value={formData.fecha_cita}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fecha_cita: e.target.value,
                      hora_cita: "",
                    }))
                  }
                  required
                  disabled={!formData.medico_id}
                  className="h-12 text-base border-2 border-gray-300"
                />
              </div>

              {/* HORA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-900">
                    🕐 Hora
                  </Label>
                  {isLoadingHorarios && (
                    <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                  )}
                </div>
                <Select
                  value={formData.hora_cita}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, hora_cita: value }))
                  }
                  disabled={
                    !formData.medico_id ||
                    !formData.fecha_cita ||
                    isLoadingHorarios
                  }
                >
                  <SelectTrigger className="h-12 text-base border-2 border-gray-300">
                    <SelectValue
                      placeholder={
                        !formData.medico_id
                          ? "Primero elige médico"
                          : !formData.fecha_cita
                          ? "Luego elige fecha"
                          : "Elige hora disponible"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {horariosDisponibles.map((hora) => (
                      <SelectItem
                        key={hora.hora}
                        value={hora.hora.toString()}
                        disabled={!hora.disponible}
                        className="py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {hora.formato_12h}
                          </span>
                          <Badge
                            variant={
                              hora.disponible ? "default" : "destructive"
                            }
                            className="text-xs"
                          >
                            {hora.disponible ? "Disponible" : "Ocupado"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                    {horariosDisponibles.length === 0 &&
                      formData.fecha_cita && (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">
                          No hay horarios disponibles para esta fecha
                        </div>
                      )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.hora_cita && (
              <p className="text-sm text-green-700 font-bold bg-green-100 p-2 rounded">
                ✅ Hora seleccionada:{" "}
                {formatHora12h(parseInt(formData.hora_cita))}
              </p>
            )}
          </div>

          {/* PASO 3: MODALIDAD */}
          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏥</span>
              <Label className="text-lg font-bold text-gray-900">
                Paso 3: Tipo de Consulta
              </Label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  value: "presencial",
                  label: "Presencial",
                  icon: MapPin,
                  desc: "En consultorio",
                },
                {
                  value: "virtual",
                  label: "Virtual",
                  icon: Video,
                  desc: "Video llamada",
                },
                {
                  value: "domicilio",
                  label: "Domicilio",
                  icon: Home,
                  desc: "A domicilio",
                },
              ].map((tipo) => {
                const IconComponent = tipo.icon;
                const isSelected = formData.tipo_cita === tipo.value;
                return (
                  <Button
                    key={tipo.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tipo_cita: tipo.value,
                      }))
                    }
                    className={`h-16 flex flex-col gap-1 border-2 text-xs sm:text-sm ${
                      isSelected
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="font-bold">{tipo.label}</span>
                    <span className="text-xs">{tipo.desc}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* PASO 4: MOTIVO */}
          <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <Label className="text-lg font-bold text-gray-900">
                Paso 4: Motivo de Consulta
              </Label>
            </div>

            <Textarea
              value={formData.motivo_consulta}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  motivo_consulta: e.target.value,
                }))
              }
              placeholder="Describe tus síntomas o motivo de consulta..."
              rows={4}
              required
              className="text-base border-2 border-gray-300 resize-none"
            />
            <p className="text-sm text-gray-600">
              {formData.motivo_consulta.length}/500 caracteres
            </p>
          </div>

          {/* RESUMEN */}
          <Card className="bg-gray-50 border border-gray-300">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-3">
                📝 Resumen de tu Cita
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Médico:</span>
                  <span className="font-bold text-gray-900">
                    {medicoSeleccionado
                      ? `Dr. ${medicoSeleccionado.nombre} ${medicoSeleccionado.apellido}`
                      : "---"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-700">Tarifa:</span>
                  <span className="font-bold text-green-600">
                    S/ {medicoSeleccionado?.tarifa_consulta || "---"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-700">Modalidad:</span>
                  <span className="font-bold text-gray-900 flex items-center gap-2 capitalize">
                    {getTipoCitaIcon(formData.tipo_cita)}
                    {formData.tipo_cita}
                  </span>
                </div>

                {formData.fecha_cita && formData.hora_cita && (
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-bold text-gray-900">
                      Fecha y Hora:
                    </span>
                    <span className="font-bold text-blue-600 text-sm">
                      {new Date(formData.fecha_cita).toLocaleDateString(
                        "es-ES",
                        {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        }
                      )}{" "}
                      {formatHora12h(parseInt(formData.hora_cita))}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="h-12 text-base font-bold border-2 flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.medico_id ||
                !formData.fecha_cita ||
                !formData.hora_cita ||
                !formData.motivo_consulta
              }
              className="h-12 text-base font-bold bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Confirmar Cita
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
