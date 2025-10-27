// app/dashboard/citas/page.tsx
// Página completa para agendar citas - Diseño responsivo y eficiente

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  ArrowLeft,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  Award,
  Clock4,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  telefono_consultorio?: string;
  horario_atencion?: string;
  imagen_perfil?: string;
}

interface HorarioDisponible {
  hora: number;
  disponible: boolean;
  formato_12h: string;
  formato_24h: string;
}

interface FiltrosMedicos {
  especialidad: string;
  precioMax: number;
  seguro: boolean;
  experienciaMin: number;
  calificacionMin: number;
  tipoConsulta: string;
}

export default function AgendarCitaPage() {
  const router = useRouter();
  const { token, usuario } = useAuth();
  const { toast } = useToast();

  const [pasoActual, setPasoActual] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMedicos, setIsLoadingMedicos] = useState(false);
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);

  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [medicosFiltrados, setMedicosFiltrados] = useState<Medico[]>([]);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState<Medico | null>(
    null
  );
  const [horariosDisponibles, setHorariosDisponibles] = useState<
    HorarioDisponible[]
  >([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState<FiltrosMedicos>({
    especialidad: "",
    precioMax: 200,
    seguro: false,
    experienciaMin: 0,
    calificacionMin: 0,
    tipoConsulta: "todos",
  });

  const [formData, setFormData] = useState({
    medico_id: "",
    fecha_cita: "",
    hora_cita: "",
    tipo_cita: "presencial",
    motivo_consulta: "",
    sintomas: "",
    urgencia: "normal",
  });

  // Cargar médicos al montar el componente
  useEffect(() => {
    cargarMedicos();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    aplicarFiltros();
  }, [medicos, filtros, busqueda]);

  // Cargar horarios cuando cambie médico o fecha
  useEffect(() => {
    if (formData.medico_id && formData.fecha_cita) {
      cargarHorariosDisponibles();
    } else {
      setHorariosDisponibles([]);
    }
  }, [formData.medico_id, formData.fecha_cita]);

  const cargarMedicos = async () => {
    setIsLoadingMedicos(true);
    try {
      const response = await fetch("/api/medicos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMedicos(data.medicos || []);
      } else {
        throw new Error("Error al cargar médicos");
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

  const aplicarFiltros = () => {
    let filtered = medicos;

    // Filtro de búsqueda
    if (busqueda) {
      filtered = filtered.filter((medico) =>
        `${medico.nombre} ${medico.apellido} ${medico.especialidad}`
          .toLowerCase()
          .includes(busqueda.toLowerCase())
      );
    }

    // ✅ FILTRO DE ESPECIALIDAD CORREGIDO
    if (filtros.especialidad && filtros.especialidad !== "todas") {
      filtered = filtered.filter(
        (medico) => medico.especialidad === filtros.especialidad
      );
    }

    // ... resto de filtros sin cambios
    filtered = filtered.filter(
      (medico) => medico.tarifa_consulta <= filtros.precioMax
    );

    if (filtros.seguro) {
      filtered = filtered.filter((medico) => medico.acepta_seguro);
    }

    filtered = filtered.filter(
      (medico) => medico.anos_experiencia >= filtros.experienciaMin
    );

    filtered = filtered.filter(
      (medico) => medico.calificacion_promedio >= filtros.calificacionMin
    );

    setMedicosFiltrados(filtered);
  };

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
        const horariosFormateados = (data.data || []).map((hora: any) => ({
          ...hora,
          formato_12h: formatHora12h(hora.hora),
          formato_24h: `${hora.hora.toString().padStart(2, "0")}:00`,
        }));
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

  const formatHora12h = (hora: number): string => {
    const ampm = hora >= 12 ? "PM" : "AM";
    const hora12 = hora % 12 || 12;
    return `${hora12}:00 ${ampm}`;
  };

  const handleMedicoSeleccionado = (medico: Medico) => {
    setMedicoSeleccionado(medico);
    setFormData((prev) => ({ ...prev, medico_id: medico.id, hora_cita: "" }));
    setPasoActual(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        sintomas: formData.sintomas,
        urgencia: formData.urgencia,
      };

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
          title: "✅ ¡Cita agendada exitosamente!",
          description:
            "Tu cita ha sido programada. Revisa tu correo para más detalles.",
        });

        // Redirigir al dashboard de citas
        setTimeout(() => {
          router.push("/dashboard/paciente?tab=citas");
        }, 2000);
      } else {
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

  const especialidadesUnicas = [...new Set(medicos.map((m) => m.especialidad))];
  const hoy = new Date();
  const fechaMinima = hoy.toISOString().split("T")[0];
  const fechaMaxima = new Date(hoy.setMonth(hoy.getMonth() + 3))
    .toISOString()
    .split("T")[0];

  const progreso = (pasoActual / 3) * 100;

  return (
    <ProtectedRoute allowedRoles={["paciente"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard/paciente")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Volver al Dashboard</span>
                </Button>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Agendar Cita Médica
                  </h1>
                  <p className="text-sm text-gray-600">
                    Programa tu consulta médica
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {usuario?.nombre}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Paso {pasoActual} de 3
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progreso)}%
              </span>
            </div>
            <Progress value={progreso} className="h-2" />

            {/* Pasos */}
            <div className="flex justify-between mt-4">
              {[
                { numero: 1, titulo: "Elegir Médico", activo: pasoActual >= 1 },
                { numero: 2, titulo: "Fecha y Hora", activo: pasoActual >= 2 },
                { numero: 3, titulo: "Confirmar", activo: pasoActual >= 3 },
              ].map((paso) => (
                <div key={paso.numero} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      paso.activo
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {paso.activo ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      paso.numero
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      paso.activo
                        ? "text-blue-600 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {paso.titulo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <form onSubmit={handleSubmit}>
              {/* PASO 1: SELECCIÓN DE MÉDICO */}
              {pasoActual === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Elige tu Médico Especialista
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Selecciona el profesional que mejor se adapte a tus
                      necesidades
                    </p>
                  </div>

                  {/* Filtros y Búsqueda */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtros de Búsqueda
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Búsqueda por nombre */}
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar médico..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        {/* Filtro por especialidad */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="especialidad-filter"
                            className="text-sm font-medium"
                          >
                            Especialidad
                          </Label>
                          <Select
                            value={filtros.especialidad}
                            onValueChange={(value) =>
                              setFiltros((prev) => ({
                                ...prev,
                                especialidad: value,
                              }))
                            }
                          >
                            <SelectTrigger id="especialidad-filter">
                              <SelectValue placeholder="Todas las especialidades" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todas">
                                Todas las especialidades
                              </SelectItem>
                              {especialidadesUnicas.map((especialidad) => (
                                <SelectItem
                                  key={especialidad}
                                  value={especialidad}
                                >
                                  {especialidad}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Filtro por seguro */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="seguro"
                            checked={filtros.seguro}
                            onChange={(e) =>
                              setFiltros((prev) => ({
                                ...prev,
                                seguro: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300"
                          />
                          <Label
                            htmlFor="seguro"
                            className="flex items-center gap-1"
                          >
                            <Shield className="w-4 h-4 text-green-600" />
                            Acepta seguro
                          </Label>
                        </div>

                        {/* Filtro por precio */}
                        <div className="space-y-2">
                          <Label className="text-sm">
                            Precio máximo: S/ {filtros.precioMax}
                          </Label>
                          <Input
                            type="range"
                            min="50"
                            max="500"
                            step="10"
                            value={filtros.precioMax}
                            onChange={(e) =>
                              setFiltros((prev) => ({
                                ...prev,
                                precioMax: parseInt(e.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de Médicos */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">
                        {medicosFiltrados.length} médicos disponibles
                      </h3>
                      {isLoadingMedicos && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Cargando médicos...</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {medicosFiltrados.map((medico) => (
                        <Card
                          key={medico.id}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            medicoSeleccionado?.id === medico.id
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-gray-200"
                          }`}
                          onClick={() => handleMedicoSeleccionado(medico)}
                        >
                          <CardContent className="p-6">
                            {/* Header del Médico */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">
                                    Dr. {medico.nombre} {medico.apellido}
                                  </h4>
                                  <p className="text-sm text-blue-600 font-medium">
                                    {medico.especialidad}
                                  </p>
                                </div>
                              </div>
                              {medicoSeleccionado?.id === medico.id && (
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                              )}
                            </div>

                            {/* Información del Médico */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-amber-600">
                                  <Star className="w-4 h-4 fill-current" />
                                  <span className="font-bold text-sm">
                                    {medico.calificacion_promedio || "Nuevo"}
                                  </span>
                                </div>
                                <div className="text-lg font-bold text-green-600">
                                  S/ {medico.tarifa_consulta}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Award className="w-4 h-4" />
                                  <span>{medico.anos_experiencia} años</span>
                                </div>
                                {medico.acepta_seguro && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-700"
                                  >
                                    <Shield className="w-3 h-3 mr-1" />
                                    Con seguro
                                  </Badge>
                                )}
                              </div>

                              {medico.direccion_consultorio && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <MapPin className="w-4 h-4" />
                                  <span className="truncate">
                                    {medico.direccion_consultorio}
                                  </span>
                                </div>
                              )}

                              {medico.horario_atencion && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Clock4 className="w-4 h-4" />
                                  <span>{medico.horario_atencion}</span>
                                </div>
                              )}
                            </div>

                            {/* Botón de selección */}
                            <Button
                              className="w-full mt-4"
                              variant={
                                medicoSeleccionado?.id === medico.id
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {medicoSeleccionado?.id === medico.id
                                ? "Seleccionado"
                                : "Seleccionar"}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {medicosFiltrados.length === 0 && !isLoadingMedicos && (
                      <div className="text-center py-12">
                        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No se encontraron médicos
                        </h3>
                        <p className="text-gray-600">
                          Intenta ajustar los filtros de búsqueda
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 2: FECHA Y HORA */}
              {pasoActual === 2 && medicoSeleccionado && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Programa tu Cita
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Elige la fecha y hora que mejor te convenga
                    </p>
                  </div>

                  {/* Resumen del Médico Seleccionado */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              Dr. {medicoSeleccionado.nombre}{" "}
                              {medicoSeleccionado.apellido}
                            </h3>
                            <p className="text-blue-700 font-medium">
                              {medicoSeleccionado.especialidad}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-600 fill-current" />
                                <span>
                                  {medicoSeleccionado.calificacion_promedio ||
                                    "Nuevo"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Award className="w-4 h-4" />
                                <span>
                                  {medicoSeleccionado.anos_experiencia} años
                                  exp.
                                </span>
                              </div>
                              <div className="text-green-600 font-bold">
                                S/ {medicoSeleccionado.tarifa_consulta}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setPasoActual(1)}
                        >
                          Cambiar Médico
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selección de Fecha y Hora */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Fecha */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Selecciona la Fecha
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Input
                          type="date"
                          min={fechaMinima}
                          max={fechaMaxima}
                          value={formData.fecha_cita}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              fecha_cita: e.target.value,
                              hora_cita: "",
                            }))
                          }
                          required
                          className="h-12 text-lg"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Horarios disponibles para los próximos 3 meses
                        </p>
                      </CardContent>
                    </Card>

                    {/* Hora */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Selecciona la Hora
                          {isLoadingHorarios && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {formData.fecha_cita ? (
                          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {horariosDisponibles.map((hora) => (
                              <Button
                                key={hora.hora}
                                type="button"
                                variant={
                                  formData.hora_cita === hora.hora.toString()
                                    ? "default"
                                    : "outline"
                                }
                                disabled={!hora.disponible}
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    hora_cita: hora.hora.toString(),
                                  }))
                                }
                                className="h-12 flex flex-col"
                              >
                                <span className="font-bold text-sm">
                                  {hora.formato_12h}
                                </span>
                                <span
                                  className={`text-xs ${
                                    hora.disponible
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {hora.disponible ? "Disponible" : "Ocupado"}
                                </span>
                              </Button>
                            ))}

                            {horariosDisponibles.length === 0 && (
                              <div className="col-span-3 text-center py-8 text-gray-500">
                                <Clock className="w-8 h-8 mx-auto mb-2" />
                                <p>
                                  No hay horarios disponibles para esta fecha
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-8 h-8 mx-auto mb-2" />
                            <p>Selecciona una fecha primero</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tipo de Consulta */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Modalidad de Consulta</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          {
                            value: "presencial",
                            label: "Consulta Presencial",
                            icon: MapPin,
                            desc: "En el consultorio del médico",
                            precio: medicoSeleccionado.tarifa_consulta,
                          },
                          {
                            value: "virtual",
                            label: "Consulta Virtual",
                            icon: Video,
                            desc: "Videollamada desde tu casa",
                            precio: medicoSeleccionado.tarifa_consulta - 20,
                          },
                          {
                            value: "domicilio",
                            label: "Consulta a Domicilio",
                            icon: Home,
                            desc: "El médico te visita",
                            precio: medicoSeleccionado.tarifa_consulta + 50,
                          },
                        ].map((tipo) => {
                          const IconComponent = tipo.icon;
                          const isSelected = formData.tipo_cita === tipo.value;
                          return (
                            <Card
                              key={tipo.value}
                              className={`cursor-pointer border-2 transition-all ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200"
                              }`}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  tipo_cita: tipo.value,
                                }))
                              }
                            >
                              <CardContent className="p-4 text-center">
                                <IconComponent
                                  className={`w-8 h-8 mx-auto mb-2 ${
                                    isSelected
                                      ? "text-blue-600"
                                      : "text-gray-400"
                                  }`}
                                />
                                <h4 className="font-bold text-gray-900">
                                  {tipo.label}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {tipo.desc}
                                </p>
                                <div className="text-lg font-bold text-green-600">
                                  S/ {tipo.precio}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navegación */}
                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasoActual(1)}
                    >
                      ← Volver a Médicos
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setPasoActual(3)}
                      disabled={!formData.fecha_cita || !formData.hora_cita}
                    >
                      Continuar a Confirmación →
                    </Button>
                  </div>
                </div>
              )}

              {/* PASO 3: CONFIRMACIÓN */}
              {pasoActual === 3 && medicoSeleccionado && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Confirma tu Cita
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Revisa los detalles antes de confirmar
                    </p>
                  </div>

                  <Card className="border-green-200">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Encabezado */}
                        <div className="text-center mb-6">
                          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-gray-900">
                            ¡Todo listo para tu cita!
                          </h3>
                        </div>

                        {/* Detalles de la Cita */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-lg border-b pb-2">
                            Detalles de la Consulta
                          </h4>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Médico:</span>
                              <p className="font-semibold">
                                Dr. {medicoSeleccionado.nombre}{" "}
                                {medicoSeleccionado.apellido}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Especialidad:
                              </span>
                              <p className="font-semibold">
                                {medicoSeleccionado.especialidad}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Fecha:</span>
                              <p className="font-semibold">
                                {new Date(
                                  formData.fecha_cita
                                ).toLocaleDateString("es-ES", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Hora:</span>
                              <p className="font-semibold">
                                {formatHora12h(parseInt(formData.hora_cita))}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Modalidad:</span>
                              <p className="font-semibold capitalize flex items-center gap-2">
                                {formData.tipo_cita === "presencial" && (
                                  <MapPin className="w-4 h-4" />
                                )}
                                {formData.tipo_cita === "virtual" && (
                                  <Video className="w-4 h-4" />
                                )}
                                {formData.tipo_cita === "domicilio" && (
                                  <Home className="w-4 h-4" />
                                )}
                                {formData.tipo_cita}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Costo:</span>
                              <p className="font-semibold text-green-600 text-lg">
                                S/ {medicoSeleccionado.tarifa_consulta}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Información del Consultorio */}
                        {formData.tipo_cita === "presencial" &&
                          medicoSeleccionado.direccion_consultorio && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-semibold flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4" />
                                Ubicación del Consultorio
                              </h4>
                              <p className="text-sm">
                                {medicoSeleccionado.direccion_consultorio}
                              </p>
                              {medicoSeleccionado.telefono_consultorio && (
                                <p className="text-sm mt-1">
                                  📞 {medicoSeleccionado.telefono_consultorio}
                                </p>
                              )}
                            </div>
                          )}

                        {/* Instrucciones para Virtual */}
                        {formData.tipo_cita === "virtual" && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                              <Video className="w-4 h-4" />
                              Instrucciones para Consulta Virtual
                            </h4>
                            <ul className="text-sm space-y-1">
                              <li>
                                • Recibirás un enlace de acceso 15 minutos antes
                              </li>
                              <li>
                                • Asegúrate de tener buena conexión a internet
                              </li>
                              <li>• Prepara tu documento de identidad</li>
                            </ul>
                          </div>
                        )}

                        {/* Motivo de Consulta */}
                        <div>
                          <h4 className="font-semibold mb-2">
                            Motivo de Consulta
                          </h4>
                          <Textarea
                            value={formData.motivo_consulta}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                motivo_consulta: e.target.value,
                              }))
                            }
                            placeholder="Describe tus síntomas o motivo de consulta..."
                            rows={3}
                            required
                            className="resize-none"
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            {formData.motivo_consulta.length}/500 caracteres
                          </p>
                        </div>

                        {/* Síntomas Adicionales */}
                        <div>
                          <h4 className="font-semibold mb-2">
                            Síntomas Adicionales (Opcional)
                          </h4>
                          <Textarea
                            value={formData.sintomas}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                sintomas: e.target.value,
                              }))
                            }
                            placeholder="Describe cualquier síntoma adicional, medicación actual, alergias..."
                            rows={2}
                            className="resize-none"
                          />
                        </div>

                        {/* Nivel de Urgencia */}
                        <div>
                          <h4 className="font-semibold mb-2">
                            Nivel de Urgencia
                          </h4>
                          <Select
                            value={formData.urgencia}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                urgencia: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Normal - Consulta de rutina
                                </div>
                              </SelectItem>
                              <SelectItem value="moderado">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  Moderado - Necesita atención pronto
                                </div>
                              </SelectItem>
                              <SelectItem value="urgente">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  Urgente - Necesita atención inmediata
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resumen Final y Confirmación */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                          <h4 className="font-bold text-lg">Total a Pagar</h4>
                          <p className="text-2xl font-bold text-green-600">
                            S/ {medicoSeleccionado.tarifa_consulta}
                          </p>
                          <p className="text-sm text-gray-600">
                            El pago se realizará en el consultorio
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 h-12 px-8 text-lg font-bold"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Confirmando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Confirmar Cita
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPasoActual(2)}
                            className="w-full sm:w-auto"
                          >
                            ← Volver Atrás
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
