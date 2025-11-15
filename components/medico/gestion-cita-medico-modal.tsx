// components/medico/gestion-cita-medico-modal.tsx
// VERSIÓN CORREGIDA CON ESTILOS CONSISTENTES

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  puedeUnirseAVideollamada,
  puedeCrearReceta,
  puedeSolicitarExamenes,
  getEtiquetaCita,
  getDescripcionCita,
} from "@/lib/cita-utils";
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
  BadgeCheck,
} from "lucide-react";
import { ModalHistorialPaciente } from "./modal-historial-paciente";

interface GestionCitaMedicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: any;
  onCitaActualizada: () => void;
}

interface PacienteData {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  fecha_nacimiento: string;
  tipo_sangre: string;
  alergias: string;
  edad?: number;
}

interface CitaData {
  id: string;
  fecha_cita: string;
  hora_cita: string;
  tipo_cita: string;
  estado: string;
  motivo_consulta: string;
  observaciones_paciente: string;
}

export function GestionCitaMedicoModal({
  isOpen,
  onClose,
  cita,
  onCitaActualizada,
}: GestionCitaMedicoModalProps) {
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

  const [pacienteData, setPacienteData] = useState<PacienteData>({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    fecha_nacimiento: "",
    tipo_sangre: "",
    alergias: "",
  });

  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialData, setHistorialData] = useState<any | null>(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const [citaData, setCitaData] = useState<CitaData>({
    id: "",
    fecha_cita: "",
    hora_cita: "",
    tipo_cita: "presencial",
    estado: "programada",
    motivo_consulta: "",
    observaciones_paciente: "",
  });

  // Cargar datos de la cita cuando se abre el modal
  useEffect(() => {
    if (cita && isOpen) {
      // Cargar datos del formulario
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

      // Cargar datos del paciente
      const pacienteInfo = getPacienteData(cita);
      setPacienteData(pacienteInfo);

      // Cargar datos de la cita
      const citaInfo = getCitaData(cita);
      setCitaData(citaInfo);
    }
  }, [cita, isOpen]);

  // Función para obtener los datos del paciente
  const getPacienteData = (cita: any): PacienteData => {
    if (cita.paciente) {
      return {
        // si existe id del paciente, lo podemos mantener en el objeto
        ...(cita.paciente.id ? { id: cita.paciente.id } : {}),
        nombre: cita.paciente.nombre || "",
        apellido: cita.paciente.apellido || "",
        dni: cita.paciente.dni || "",
        telefono: cita.paciente.telefono || "",
        fecha_nacimiento: cita.paciente.fecha_nacimiento || "",
        tipo_sangre: cita.paciente.tipo_sangre || "",
        alergias: cita.paciente.alergias || "",
        edad: calcularEdad(cita.paciente.fecha_nacimiento),
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
        edad: calcularEdad(cita.fecha_nacimiento),
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

  // Solicitar historial al backend usando la cita actual como comprobante de acceso
  const verHistorialCompleto = async () => {
    const pacienteId = cita?.paciente?.id || cita?.id_paciente || null;
    const citaId = citaData.id || cita?.cita_id || null;

    if (!pacienteId || !citaId) {
      toast({
        title: "No se puede obtener historial",
        description: "Faltan datos de paciente o cita",
        variant: "destructive",
      });
      return;
    }

    setLoadingHistorial(true);
    try {
      const res = await fetch(
        `/api/medico/pacientes/${pacienteId}/historial?cita_id=${citaId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error" }));
        throw new Error(err.error || "No autorizado");
      }

      const data = await res.json();
      setHistorialData(data);
      setHistorialOpen(true);
    } catch (error: any) {
      console.error("Error cargando historial:", error);
      toast({
        title: "Error al cargar historial",
        description: error.message || "No se pudo obtener el historial",
        variant: "destructive",
      });
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Función para obtener datos de la cita
  const getCitaData = (cita: any): CitaData => {
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

  // Calcular edad a partir de la fecha de nacimiento
  const calcularEdad = (fechaNacimiento: string): number | null => {
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
          title: "✅ Expediente médico guardado",
          description:
            "La información de la consulta ha sido actualizada exitosamente.",
        });
        onCitaActualizada();
        handleClose();
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
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      confirmada: {
        label: "Confirmada",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      en_curso: {
        label: "En Curso",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
      completada: {
        label: "Completada",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      cancelada: {
        label: "Cancelada",
        color: "bg-red-100 text-red-800 border-red-200",
      },
      no_asistio: {
        label: "No Asistió",
        color: "bg-gray-100 text-gray-800 border-gray-200",
      },
    };
    return (
      configs[estado] || {
        label: estado,
        color: "bg-gray-100 text-gray-800 border-gray-200",
      }
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

  // Permiso local: permitir ver historial solo si la cita ya ocurrió y está dentro de los 7 días posteriores
  const canViewHistorial = (() => {
    try {
      if (!citaData?.fecha_cita) return false;
      const fecha = new Date(citaData.fecha_cita);
      const ahora = new Date();
      const diff = ahora.getTime() - fecha.getTime();
      const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;
      return fecha <= ahora && diff <= sieteDiasMs;
    } catch (e) {
      return false;
    }
  })();

  const handleClose = () => {
    setFormData({
      diagnostico: "",
      tratamiento: "",
      observaciones_medico: "",
      costo: "80.00",
      presion_arterial: "",
      frecuencia_cardiaca: "",
      temperatura: "",
      peso: "",
      altura: "",
      saturacion_oxigeno: "",
      estado: "completada",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Stethoscope className="w-6 h-6 mr-3 text-blue-600" />
              Gestión de Consulta Médica
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
              disabled={isSaving}
            >
              ✕
            </button>
          </div>

          {/* INFORMACIÓN DEL PACIENTE - ESTILO MEJORADO */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <span className="mr-2">👤</span>
              Información del Paciente
            </h3>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="font-medium text-blue-900 text-lg">
                    {pacienteData.nombre} {pacienteData.apellido}
                  </span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <span>DNI: {pacienteData.dni || "No disponible"}</span>
                    <span>
                      Edad:{" "}
                      {pacienteData.edad
                        ? `${pacienteData.edad} años`
                        : "No disponible"}
                    </span>
                    {pacienteData.tipo_sangre && (
                      <span>Grupo: {pacienteData.tipo_sangre}</span>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${estadoConfig.color} border`}
                    >
                      {estadoConfig.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <strong>Cita:</strong>{" "}
                    {new Date(citaData.fecha_cita).toLocaleDateString("es-PE", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div>
                    <strong>Hora:</strong> {formatHora(citaData.hora_cita)}{" "}
                    horas
                  </div>
                  <div>
                    <strong>Tipo:</strong> {getEtiquetaCita(citaData.tipo_cita)}
                  </div>
                </div>
                {citaData.motivo_consulta && (
                  <div className="mt-1">
                    <strong>Motivo:</strong> {citaData.motivo_consulta}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="space-y-6">
            {/* SELECTOR DE ESTADO */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cambiar Estado de la Cita
              </label>
              <select
                value={formData.estado}
                onChange={(e) => cambiarEstadoCita(e.target.value)}
                disabled={isLoading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="en_curso">En Curso</option>
                <option value="completada">Completada</option>
                <option value="no_asistio">No Asistió</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            {/* GRID PRINCIPAL */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* COLUMNA IZQUIERDA - INFORMACIÓN CLÍNICA */}
              <div className="xl:col-span-1 space-y-6">
                {/* HISTORIAL MÉDICO */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Historial Médico
                    <button
                      type="button"
                      onClick={verHistorialCompleto}
                      disabled={loadingHistorial || !canViewHistorial}
                      title={
                        !canViewHistorial
                          ? "Acceso disponible solo durante 7 días después de la cita"
                          : undefined
                      }
                      className="ml-3 text-sm px-2 py-1 border rounded-md text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      {loadingHistorial
                        ? "Cargando..."
                        : canViewHistorial
                        ? "Ver historial"
                        : "Acceso expirado"}
                    </button>
                  </h4>

                  {pacienteData.alergias ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alergias Conocidas
                      </label>
                      <div className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                        {pacienteData.alergias}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded border">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No hay alergias registradas</p>
                    </div>
                  )}

                  {/* Motivo de Consulta */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo de Consulta
                    </label>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap">
                      {citaData.motivo_consulta || "No especificado"}
                    </div>
                  </div>

                  {/* Observaciones del Paciente */}
                  {citaData.observaciones_paciente && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observaciones del Paciente
                      </label>
                      <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200 whitespace-pre-wrap">
                        {citaData.observaciones_paciente}
                      </div>
                    </div>
                  )}
                </div>

                {/* SIGNOS VITALES - ESTILOS CORREGIDOS */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-red-600" />
                    Signos Vitales
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Presión Arterial
                      </label>
                      <input
                        type="text"
                        value={formData.presion_arterial}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            presion_arterial: e.target.value,
                          }))
                        }
                        placeholder="120/80"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frec. Cardíaca
                      </label>
                      <input
                        type="text"
                        value={formData.frecuencia_cardiaca}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            frecuencia_cardiaca: e.target.value,
                          }))
                        }
                        placeholder="72 lpm"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temperatura (°C)
                      </label>
                      <input
                        type="text"
                        value={formData.temperatura}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            temperatura: e.target.value,
                          }))
                        }
                        placeholder="36.5"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sat. O₂ (%)
                      </label>
                      <input
                        type="text"
                        value={formData.saturacion_oxigeno}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            saturacion_oxigeno: e.target.value,
                          }))
                        }
                        placeholder="98"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="text"
                        value={formData.peso}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            peso: e.target.value,
                          }))
                        }
                        placeholder="70"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Altura (cm)
                      </label>
                      <input
                        type="text"
                        value={formData.altura}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            altura: e.target.value,
                          }))
                        }
                        placeholder="170"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA - FORMULARIO MÉDICO */}
              <div className="xl:col-span-2 space-y-6">
                {/* DIAGNÓSTICO */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Stethoscope className="w-5 h-5 mr-2 text-green-600" />
                    Diagnóstico Principal
                    <span className="text-red-500 ml-1">*</span>
                  </h4>
                  <textarea
                    value={formData.diagnostico}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        diagnostico: e.target.value,
                      }))
                    }
                    placeholder="Ingrese el diagnóstico del paciente..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.diagnostico.length}/1000 caracteres
                  </p>
                </div>

                {/* TRATAMIENTO */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-blue-600" />
                    Tratamiento y Receta Médica
                  </h4>
                  <textarea
                    value={formData.tratamiento}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tratamiento: e.target.value,
                      }))
                    }
                    placeholder="Describa el tratamiento, medicamentos, dosis, frecuencia, duración..."
                    rows={5}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.tratamiento.length}/1500 caracteres
                  </p>
                </div>

                {/* OBSERVACIONES MÉDICAS */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-purple-600" />
                    Observaciones Médicas
                  </h4>
                  <textarea
                    value={formData.observaciones_medico}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        observaciones_medico: e.target.value,
                      }))
                    }
                    placeholder="Observaciones adicionales, recomendaciones, seguimiento requerido..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.observaciones_medico.length}/500 caracteres
                  </p>
                </div>

                {/* INFORMACIÓN DE COSTO */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Información de Costo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Costo de la Consulta (S/)
                      </label>
                      <input
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base 
text-gray-800 placeholder:text-gray-500 placeholder:opacity-100 
focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center text-base"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Generar Receta Formal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors text-base"
              >
                Cancelar
              </button>
              <button
                onClick={guardarDatosMedicos}
                disabled={isSaving || !formData.diagnostico.trim()}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-base"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4 mr-2" />
                    Guardar Expediente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {historialOpen && (
        <ModalHistorialPaciente
          isOpen={historialOpen}
          onClose={() => setHistorialOpen(false)}
          historial={historialData}
        />
      )}
    </div>
  );
}
