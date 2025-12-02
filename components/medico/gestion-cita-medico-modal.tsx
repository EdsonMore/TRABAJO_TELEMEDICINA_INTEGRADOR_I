// components/medico/gestion-cita-medico-modal.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
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
  X,
  Loader2,
  AlertCircle,
  Heart,
  BadgeCheck,
  Phone,
} from "lucide-react";
import { ModalHistorialPaciente } from "./modal-historial-paciente";
import {
  validarTransicion,
  obtenerEstadosPermitidos,
  describirEstado,
  esEstadoTerminal,
  type EstadoCita,
} from "@/lib/cita-state-machine";

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
  edad?: number; // Cambiado a opcional en lugar de number | undefined
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

function safeFormatDate(value: any) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "-";
  }
}

function calcularEdad(fechaNacimiento: string | undefined): number | undefined {
  if (!fechaNacimiento) return undefined;

  try {
    const fecha = new Date(fechaNacimiento);
    const hoy = new Date();

    if (isNaN(fecha.getTime())) return undefined;

    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }

    return edad > 0 ? edad : undefined;
  } catch (e) {
    console.error("Error calculando edad:", e);
    return undefined;
  }
}

function formatHora(hora: string): string {
  if (!hora) return "--:--";

  console.log("🕒 Procesando hora original de BD:", hora);

  // Si ya está en formato HH:MM (24 horas), devolver directamente
  if (
    hora.includes(":") &&
    hora.length >= 5 &&
    !hora.includes("a. m.") &&
    !hora.includes("p. m.") &&
    !hora.includes("AM") &&
    !hora.includes("PM")
  ) {
    const horaFormateada = hora.slice(0, 5);
    console.log("✅ Hora formateada (24h):", horaFormateada);
    return horaFormateada;
  }

  // Si está en formato 12 horas (ej: "8:00 AM", "01:54 p. m.")
  if (
    hora.includes("a. m.") ||
    hora.includes("p. m.") ||
    hora.includes("AM") ||
    hora.includes("PM")
  ) {
    try {
      // Normalizar la cadena
      const horaNormalizada = hora
        .replace("a. m.", "AM")
        .replace("p. m.", "PM");

      // Extraer hora, minutos y periodo
      const [horaPart, periodo] = horaNormalizada.split(" ");
      const [horasStr, minutosStr] = horaPart.split(":");

      let horas = parseInt(horasStr);
      const minutos = minutosStr?.padStart(2, "0") || "00";

      console.log("🔍 Analizando hora:", { horas, minutos, periodo });

      // Convertir a formato 24 horas
      if (periodo?.toUpperCase().includes("PM") && horas < 12) {
        horas += 12;
      } else if (periodo?.toUpperCase().includes("AM") && horas === 12) {
        horas = 0;
      }

      const hora24 = `${horas.toString().padStart(2, "0")}:${minutos}`;
      console.log("✅ Hora convertida (12h→24h):", hora24);
      return hora24;
    } catch (e) {
      console.error("Error formateando hora 12h:", e);
    }
  }

  // Si es un número simple (ej: "8" para 8:00 AM)
  const horaNum = parseInt(hora);
  if (!isNaN(horaNum)) {
    const horaFormateada = `${horaNum.toString().padStart(2, "0")}:00`;
    console.log("✅ Hora formateada (número):", horaFormateada);
    return horaFormateada;
  }

  console.warn("⚠️ Formato de hora no reconocido:", hora);
  return hora;
}

export default function GestionCitaMedicoModal({
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
    presion_arterial: "",
    frecuencia_cardiaca: "",
    temperatura: "",
    peso: "",
    altura: "",
    saturacion_oxigeno: "",
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

  const [pacienteIdLocal, setPacienteIdLocal] = useState<string>("");

  // Cargar datos de la cita cuando se abre el modal
  useEffect(() => {
    if (cita && isOpen) {
      console.log("🩺 Abriendo modal con cita:", cita);

      const cargarDatosReales = async () => {
        // Buscar cita real si es temporal
        const citaReal = await buscarCitaReal(cita);
        console.log("📋 Cita a usar:", citaReal);

        // Primero establecer datos básicos del formulario
        setFormData({
          diagnostico: citaReal.diagnostico || "",
          tratamiento: citaReal.tratamiento || "",
          observaciones_medico: citaReal.observaciones_medico || "",
          costo: citaReal.costo?.toString() || "80.00",
          presion_arterial: citaReal.presion_arterial || "",
          frecuencia_cardiaca: citaReal.frecuencia_cardiaca || "",
          temperatura: citaReal.temperatura || "",
          peso: citaReal.peso || "",
          altura: citaReal.altura || "",
          saturacion_oxigeno: citaReal.saturacion_oxigeno || "",
          estado: citaReal.estado || "completada",
        });

        // Obtener datos de la cita
        const citaInfo = getCitaData(citaReal);
        console.log("📋 Datos extraídos de la cita:", citaInfo);
        setCitaData(citaInfo);

        // 🔥 SIEMPRE cargar datos del paciente desde BD si tenemos ID
        const pacienteId = citaReal.id_paciente || citaReal.paciente?.id;
        setPacienteIdLocal(pacienteId || "");
        if (pacienteId && !pacienteId.startsWith("temp-")) {
          console.log("🔄 Cargando datos del paciente desde BD con ID:", pacienteId);
          await cargarDatosPacienteCompletos(pacienteId);
        } else {
          // Si no hay ID válido, usar datos básicos de la cita
          const pacienteInfo = getPacienteData(citaReal);
          console.log("👤 Usando datos básicos del paciente:", pacienteInfo);
          setPacienteData(pacienteInfo);
        }
      };

      cargarDatosReales();
    }
  }, [cita, isOpen, token]);

  const cargarDatosPacienteCompletos = async (pacienteId: string) => {
    if (!pacienteId || pacienteId.startsWith("temp-")) {
      console.log("⏭️ Saltando carga de paciente temporal:", pacienteId);
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔍 Cargando datos completos del paciente desde BD:", pacienteId);

      // ✅ PRIMERO: Intentar con API de pacientes específica
      let response = await fetch(`/api/pacientes/${pacienteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Datos desde /api/pacientes:", data);

        // Manejar respuesta con estructura 'cita' o directa
        const paciente = data.cita?.paciente || data.paciente || data;

        // Construir datos del paciente de forma robusta
        const pacienteCompleto: PacienteData = {
          nombre:
            paciente.usuario?.nombre ||
            paciente.nombre_paciente ||
            paciente.nombre ||
            "",
          apellido:
            paciente.usuario?.apellido ||
            paciente.apellido_paciente ||
            paciente.apellido ||
            "",
          dni:
            paciente.informacion_personal?.dni ||
            paciente.dni_paciente ||
            paciente.dni ||
            "",
          telefono:
            paciente.usuario?.telefono ||
            paciente.telefono_paciente ||
            paciente.telefono ||
            "",
          fecha_nacimiento:
            paciente.informacion_personal?.fecha_nacimiento ||
            paciente.fecha_nacimiento ||
            "",
          tipo_sangre:
            paciente.informacion_medica?.tipo_sangre ||
            paciente.tipo_sangre ||
            "",
          alergias:
            paciente.informacion_medica?.alergias || paciente.alergias || "",
          edad:
            paciente.informacion_personal?.edad ||
            paciente.edad ||
            calcularEdad(
              paciente.informacion_personal?.fecha_nacimiento ||
                paciente.fecha_nacimiento
            ) ||
            undefined,
        };

        console.log("✅ Paciente completo obtenido:", pacienteCompleto);
        setPacienteData(pacienteCompleto);
        return;
      }

      // ✅ SEGUNDO: Si falla, intentar con API de perfil del paciente logueado
      if (response.status === 404 || !response.ok) {
        console.log(
          "🔄 Intentando con /api/paciente/perfil (paciente logueado)..."
        );
        response = await fetch(`/api/paciente/perfil`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Datos desde /api/paciente/perfil:", data);

          const paciente = data.paciente || data;

          setPacienteData({
            nombre: paciente.usuario?.nombre || paciente.nombre || "",
            apellido: paciente.usuario?.apellido || paciente.apellido || "",
            dni:
              paciente.informacion_personal?.dni ||
              paciente.dni ||
              paciente.dni_paciente ||
              "",
            telefono: paciente.usuario?.telefono || paciente.telefono || "",
            fecha_nacimiento:
              paciente.informacion_personal?.fecha_nacimiento ||
              paciente.fecha_nacimiento ||
              "",
            tipo_sangre:
              paciente.informacion_medica?.tipo_sangre ||
              paciente.tipo_sangre ||
              "",
            alergias:
              paciente.informacion_medica?.alergias || paciente.alergias || "",
            edad:
              paciente.informacion_personal?.edad ||
              paciente.edad ||
              calcularEdad(
                paciente.informacion_personal?.fecha_nacimiento ||
                  paciente.fecha_nacimiento
              ) ||
              undefined,
          });
          return;
        }
      }

      // ✅ TERCERO: Si todo falla, intentar cargar desde cita actual y enriquecer
      console.warn(
        "⚠️ No se pudieron obtener datos completos del paciente, usando parciales"
      );

      // Aunque no tengamos todos los datos, al menos retornar lo que tenemos
      // para que el modal funcione (aunque sea con datos incompletos)
    } catch (error) {
      console.error("❌ Error cargando datos del paciente:", error);
      // No fallar completamente, permitir que siga con datos parciales
    } finally {
      setIsLoading(false);
    }
  };

  const buscarCitaReal = async (citaTemporal: any) => {
    try {
      console.log("🔍 Buscando cita en BD para:", {
        id: citaTemporal.id,
        es_temporal: citaTemporal.id?.startsWith("temp-"),
      });

      // Si ya es una cita real de BD (no empieza con temp), usarla directamente
      if (citaTemporal.id && !citaTemporal.id.startsWith("temp-")) {
        console.log("✅ Ya es cita real de BD:", citaTemporal.id);
        return citaTemporal;
      }

      // Si es temporal, intentar buscar por codigo_acceso
      if (citaTemporal.roomId || citaTemporal.sesionId) {
        const codigoAcceso = citaTemporal.roomId || citaTemporal.sesionId;
        
        // Extraer el código limpio si está en formato "medilink-XXXXX"
        const codigo = codigoAcceso.includes("medilink-") 
          ? codigoAcceso.split("medilink-")[1] 
          : codigoAcceso;

        console.log("🔍 Intentando buscar por codigo_acceso:", codigo);

        const sesionResponse = await fetch(
          `/api/telemedicina/sesiones?codigo_acceso=${codigo}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (sesionResponse.ok) {
          const sesionData = await sesionResponse.json();
          if (sesionData.sesiones && sesionData.sesiones.length > 0) {
            const sesion = sesionData.sesiones[0];
            const citaRealId = sesion.id_cita;
            console.log("✅ Sesión encontrada, obteniendo cita:", citaRealId);

            const citaResponse = await fetch(`/api/citas/${citaRealId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (citaResponse.ok) {
              const citaData = await citaResponse.json();
              const citaCompleta = citaData.cita || citaData;
              console.log("✅ CITA REAL ENCONTRADA:", {
                id: citaCompleta.id,
                fecha: citaCompleta.fecha_cita,
                hora: citaCompleta.hora_cita,
              });
              citaCompleta.id_sesion = sesion.id;
              citaCompleta.codigo_acceso = sesion.codigo_acceso;
              return citaCompleta;
            }
          }
        }
      }

      // Si no encontró en BD, usar la temporal tal como está
      console.log("⚠️ No se encontró en BD, usando cita temporal");
      return citaTemporal;
    } catch (error) {
      console.error("❌ Error buscando cita real:", error);
      return citaTemporal;
    }
  };

  const getPacienteData = (cita: any): PacienteData => {
    console.log("📋 Datos de cita recibidos para paciente:", cita);

    // Caso 1: Estructura completa desde BD (con usuario e informacion_personal)
    if (cita.paciente && cita.paciente.usuario) {
      console.log("✅ Usando estructura completa de BD");
      const fechaNacimiento =
        cita.paciente.informacion_personal?.fecha_nacimiento;
      const edad = calcularEdad(fechaNacimiento);

      return {
        nombre: cita.paciente.usuario.nombre || "",
        apellido: cita.paciente.usuario.apellido || "",
        dni: cita.paciente.informacion_personal?.dni || "",
        telefono: cita.paciente.usuario.telefono || "",
        fecha_nacimiento: fechaNacimiento || "",
        tipo_sangre: cita.paciente.informacion_medica?.tipo_sangre || "",
        alergias: cita.paciente.informacion_medica?.alergias || "",
        edad: edad !== null ? edad : undefined,
      };
    }

    // Caso 2: Estructura simplificada (datos planos en cita.paciente)
    if (cita.paciente) {
      console.log("✅ Usando estructura simplificada");
      const edad = calcularEdad(cita.paciente.fecha_nacimiento);
      return {
        nombre: cita.paciente.nombre || cita.paciente.nombre_paciente || "",
        apellido: cita.paciente.apellido || "",
        dni: cita.paciente.dni || "",
        telefono:
          cita.paciente.telefono || cita.paciente.telefono_paciente || "",
        fecha_nacimiento: cita.paciente.fecha_nacimiento || "",
        tipo_sangre: cita.paciente.tipo_sangre || "",
        alergias: cita.paciente.alergias || "",
        edad: edad !== null ? edad : undefined,
      };
    }

    // Caso 3: Datos desde lista de citas (campos planos en la cita)
    if (cita.nombre_paciente) {
      console.log("✅ Usando datos desde lista de citas");
      const edad = calcularEdad(cita.fecha_nacimiento);
      return {
        nombre: cita.nombre_paciente.split(" ")[0] || "",
        apellido: cita.nombre_paciente.split(" ").slice(1).join(" ") || "",
        dni: cita.dni || "",
        telefono: cita.telefono_paciente || "",
        fecha_nacimiento: cita.fecha_nacimiento || "",
        tipo_sangre: cita.tipo_sangre || "",
        alergias: cita.alergias || "",
        edad: edad !== null ? edad : undefined,
      };
    }

    // Caso 4: Extraer datos de campos directos en la cita
    console.log("🔍 Buscando datos en campos directos de la cita");
    const edad = calcularEdad(
      cita.fecha_nacimiento_paciente || cita.fecha_nacimiento
    );
    return {
      nombre: cita.nombre_paciente || cita.nombre || "",
      apellido: cita.apellido_paciente || cita.apellido || "",
      dni: cita.dni_paciente || cita.dni || "",
      telefono: cita.telefono_paciente || cita.telefono || "",
      fecha_nacimiento:
        cita.fecha_nacimiento_paciente || cita.fecha_nacimiento || "",
      tipo_sangre: cita.tipo_sangre || "",
      alergias: cita.alergias || "",
      edad: edad !== null ? edad : undefined,
    };
  };

  const getCitaData = (cita: any): CitaData => {
    console.log("📅 Procesando datos de cita:", cita);

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

  const calcularEdad = (fechaNacimiento: string): number | null => {
    if (!fechaNacimiento) return null;
    try {
      const nacimiento = new Date(fechaNacimiento);
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    } catch (e) {
      return null;
    }
  };

  const verHistorialCompleto = async () => {
    // Validar acceso temporal primero
    if (!canViewHistorial) {
      toast({
        title: "⏰ Acceso Restringido",
        description: historialAccess.reason,
        variant: "destructive",
      });
      return;
    }

    const pacienteId = cita?.paciente?.id || cita?.id_paciente || null;
    const citaId = citaData.id || cita?.cita_id || null;

    if (!pacienteId || !citaId) {
      toast({
        title: "❌ Datos Incompletos",
        description:
          "No se encontraron los datos necesarios del paciente o cita",
        variant: "destructive",
      });
      return;
    }

    setLoadingHistorial(true);
    try {
      console.log(
        "📋 Solicitando historial para paciente:",
        pacienteId,
        "con cita:",
        citaId
      );

      const res = await fetch(
        `/api/medico/pacientes/${pacienteId}/historial?cita_id=${citaId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        console.error("Error de API:", res.status, err);
        throw new Error(
          err.error || `Error ${res.status}: No se pudo obtener el historial`
        );
      }

      const data = await res.json();
      console.log("✅ Historial cargado:", data);
      setHistorialData(data);
      setHistorialOpen(true);

      toast({
        title: "✅ Historial Médico",
        description: "Se cargó el historial completo del paciente",
      });
    } catch (error: any) {
      console.error("❌ Error cargando historial:", error);
      toast({
        title: "Error al Cargar Historial",
        description:
          error.message ||
          "No se pudo obtener el historial médico. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingHistorial(false);
    }
  };

  const guardarDatosMedicos = async () => {
    if (!formData.diagnostico.trim()) {
      toast({
        title: "Diagnóstico requerido",
        description: "Por favor ingresa un diagnóstico",
        variant: "destructive",
      });
      return;
    }

    // Validar que tengamos un ID de cita válido
    if (!citaData.id || citaData.id.startsWith("temp-")) {
      toast({
        title: "Cita no válida",
        description: "No se puede guardar para una cita temporal",
        variant: "destructive",
      });
      return;
    }

    // ⏰ VALIDAR VENTANA DE EDICIÓN (7 DÍAS)
    const editAccess = calculateEditAccess();
    if (!editAccess.canEdit) {
      toast({
        title: "⏰ Edición Expirada",
        description: editAccess.reason,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log("💾 Guardando datos médicos para cita:", citaData.id);

      const payload = {
        estado: formData.estado,
        diagnostico: formData.diagnostico,
        tratamiento: formData.tratamiento,
        observaciones_medico: formData.observaciones_medico,
        costo: parseFloat(formData.costo) || 80.0,
        presion_arterial: formData.presion_arterial,
        frecuencia_cardiaca: formData.frecuencia_cardiaca,
        temperatura: formData.temperatura,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        saturacion_oxigeno: formData.saturacion_oxigeno,
      };

      console.log("📤 Payload a enviar:", payload);

      const response = await fetch(`/api/citas/${citaData.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Respuesta del servidor:", result);

        toast({
          title: "✅ Expediente médico guardado",
          description:
            "La información de la consulta ha sido actualizada exitosamente.",
        });
        onCitaActualizada();
        handleClose();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Error desconocido" }));
        console.error("❌ Error del servidor:", errorData);
        throw new Error(errorData.error || "Error al guardar datos médicos");
      }
    } catch (error: any) {
      console.error("❌ Error guardando datos médicos:", error);
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

  // ⚠️ DEPRECATED: El cambio de estado ahora se maneja en guardarDatosMedicos()
  // El estado se actualiza localmente en formData y se envía a la BD solo cuando
  // el usuario presiona "Guardar Expediente"
  // const cambiarEstadoCita = async (nuevoEstado: string) => {
  //   ... código removido ...
  // };

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

  const getTipoCitaConfig = (tipo: string) => {
    const configs: any = {
      virtual: {
        icon: Video,
        label: "Virtual",
        color: "bg-blue-100 text-blue-800",
      },
      presencial: {
        icon: MapPin,
        label: "Presencial",
        color: "bg-green-100 text-green-800",
      },
      domicilio: {
        icon: User,
        label: "Domicilio",
        color: "bg-purple-100 text-purple-800",
      },
    };
    return (
      configs[tipo] || {
        icon: User,
        label: tipo,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const estadoConfig = getEstadoConfig(citaData.estado);
  const tipoCitaConfig = getTipoCitaConfig(citaData.tipo_cita);
  const TipoCitaIcon = tipoCitaConfig.icon;

  // Calcular acceso al historial con ventana de 7 días
  const calculateHistorialAccess = (): {
    canAccess: boolean;
    reason: string;
    daysRemaining: number | null;
    expiryDate: Date | null;
  } => {
    try {
      if (!citaData?.fecha_cita) {
        return {
          canAccess: false,
          reason: "Datos de cita no disponibles",
          daysRemaining: null,
          expiryDate: null,
        };
      }

      const fechaCita = new Date(citaData.fecha_cita);
      fechaCita.setHours(0, 0, 0, 0);
      const ahora = new Date();
      ahora.setHours(0, 0, 0, 0);

      // Si la cita es en el futuro, no permitir acceso
      if (fechaCita > ahora) {
        return {
          canAccess: false,
          reason: `La cita es el ${fechaCita.toLocaleDateString("es-PE")}. El historial estará disponible después de esta fecha.`,
          daysRemaining: null,
          expiryDate: null,
        };
      }

      const diffMs = ahora.getTime() - fechaCita.getTime();
      const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;
      const daysPassedMs = diffMs;
      const daysRemaining = Math.max(
        0,
        Math.ceil((sieteDiasMs - daysPassedMs) / (24 * 60 * 60 * 1000))
      );

      // Calcular fecha de expiración
      const expiryDate = new Date(fechaCita.getTime() + sieteDiasMs);

      // Si pasó la ventana de 7 días
      if (diffMs > sieteDiasMs) {
        return {
          canAccess: false,
          reason: `El acceso al historial expiró el ${expiryDate.toLocaleDateString(
            "es-PE"
          )}. Solo puedes acceder durante 7 días después de la cita.`,
          daysRemaining: 0,
          expiryDate,
        };
      }

      return {
        canAccess: true,
        reason: `Acceso disponible por ${daysRemaining} ${daysRemaining === 1 ? "día" : "días"} más (hasta ${expiryDate.toLocaleDateString("es-PE")})`,
        daysRemaining,
        expiryDate,
      };
    } catch (e) {
      console.error("Error calculando acceso al historial:", e);
      return {
        canAccess: false,
        reason: "Error al validar acceso",
        daysRemaining: null,
        expiryDate: null,
      };
    }
  };

  const historialAccess = calculateHistorialAccess();
  const canViewHistorial = historialAccess.canAccess;

  // ⏰ CALCULAR ACCESO A EDICIÓN (VENTANA DE 7 DÍAS)
  const calculateEditAccess = (): {
    canEdit: boolean;
    reason: string;
    daysRemaining: number | null;
    expiryDate: Date | null;
  } => {
    try {
      if (!citaData?.fecha_cita) {
        return {
          canEdit: false,
          reason: "Datos de cita no disponibles",
          daysRemaining: null,
          expiryDate: null,
        };
      }

      const fechaCita = new Date(citaData.fecha_cita);
      fechaCita.setHours(0, 0, 0, 0);
      const ahora = new Date();
      ahora.setHours(0, 0, 0, 0);

      // Si la cita es en el futuro, sí se puede editar (aún no ha ocurrido)
      if (fechaCita > ahora) {
        return {
          canEdit: true,
          reason: "Cita futura - edición permitida",
          daysRemaining: null,
          expiryDate: null,
        };
      }

      // Si la cita ya pasó, calcular ventana de 7 días
      const diffMs = ahora.getTime() - fechaCita.getTime();
      const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;
      const daysPassedMs = diffMs;
      const daysRemaining = Math.max(
        0,
        Math.ceil((sieteDiasMs - daysPassedMs) / (24 * 60 * 60 * 1000))
      );

      // Calcular fecha de expiración
      const expiryDate = new Date(fechaCita.getTime() + sieteDiasMs);

      // Si pasó la ventana de 7 días
      if (diffMs > sieteDiasMs) {
        return {
          canEdit: false,
          reason: `El plazo para editar expiró el ${expiryDate.toLocaleDateString(
            "es-PE"
          )}. Solo puedes editar durante 7 días después de la cita.`,
          daysRemaining: 0,
          expiryDate,
        };
      }

      return {
        canEdit: true,
        reason: `Puedes editar hasta el ${expiryDate.toLocaleDateString("es-PE")} (${daysRemaining} ${daysRemaining === 1 ? "día" : "días"} restantes)`,
        daysRemaining,
        expiryDate,
      };
    } catch (e) {
      console.error("Error calculando acceso a edición:", e);
      return {
        canEdit: false,
        reason: "Error al validar acceso",
        daysRemaining: null,
        expiryDate: null,
      };
    }
  };

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

  if (!isOpen || !cita) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Gestión de Consulta Médica
              </h2>
              <p className="text-gray-600">Código: {citaData.id}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Datos del paciente y cita */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Paciente</h3>
                  <p className="text-sm font-medium text-blue-800">
                    {pacienteData.nombre} {pacienteData.apellido}
                  </p>
                  <p className="text-xs text-blue-600">
                    DNI: {pacienteData.dni}
                  </p>
                  <p className="text-xs text-blue-600">
                    Edad:{" "}
                    {pacienteData.edad
                      ? `${pacienteData.edad} años`
                      : "No disponible"}
                  </p>
                  {pacienteData.tipo_sangre && (
                    <p className="text-xs text-blue-600">
                      Grupo: {pacienteData.tipo_sangre}
                    </p>
                  )}
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Cita</h3>
                  <div className="flex items-center text-sm mb-1 text-gray-900">
                    <Calendar className="w-4 h-4 mr-2 text-green-600 " />
                    {safeFormatDate(citaData.fecha_cita)}
                  </div>
                  <div className="flex items-center text-sm mb-1 text-gray-900">
                    <Clock className="w-4 h-4 mr-2 text-green-600" />
                    {formatHora(citaData.hora_cita)} horas
                  </div>
                  <div className="flex items-center text-sm text-gray-900">
                    <TipoCitaIcon className="w-4 h-4 mr-2 text-green-600" />
                    {tipoCitaConfig.label}
                  </div>
                </div>
              </div>

              {/* Estado de la cita */}
              <div className="bg-gray-50 p-4 rounded-lg text-gray-900">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Estado de la Cita
                </h3>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getEstadoConfig(formData.estado).color}`}
                    >
                      {getEstadoConfig(formData.estado).label}
                    </span>
                    {citaData.estado !== formData.estado && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium animate-pulse">
                        ⚠ Cambio pendiente
                      </span>
                    )}
                  </div>
                  
                  {/* SELECT MEJORADO CON MÁQUINA DE ESTADOS */}
                  <select
                    value={formData.estado}
                    onChange={(e) => {
                      const nuevoEstado = e.target.value as EstadoCita;
                      const validacion = validarTransicion(
                        citaData.estado as EstadoCita,
                        nuevoEstado,
                        citaData.tipo_cita as any // Pasar tipo de cita
                      );
                      
                      if (validacion.esValida) {
                        setFormData((prev) => ({
                          ...prev,
                          estado: nuevoEstado,
                        }));
                        console.log(`✅ [STATE-MACHINE] Transición válida: ${citaData.estado} → ${nuevoEstado}`);
                      } else {
                        console.warn(`❌ [STATE-MACHINE] Transición inválida: ${validacion.razon}`);
                        toast?.({
                          title: "Transición no permitida",
                          description: validacion.motivo_rechazo || validacion.razon,
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={esEstadoTerminal(citaData.estado as EstadoCita)}
                    className={`border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 ${
                      esEstadoTerminal(citaData.estado as EstadoCita)
                        ? 'border-gray-200 opacity-50 cursor-not-allowed'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value={formData.estado} disabled>
                      Estado actual: {describirEstado(formData.estado as EstadoCita)}
                    </option>
                    
                    {/* Mostrar SOLO transiciones válidas según tipo de cita */}
                    {obtenerEstadosPermitidos(citaData.estado as EstadoCita, citaData.tipo_cita as any).map(
                      (estado) => (
                        <option key={estado} value={estado}>
                          → {describirEstado(estado as EstadoCita)}
                        </option>
                      )
                    )}
                  </select>
                </div>
                
                {/* AYUDA Y RESTRICCIONES */}
                {esEstadoTerminal(citaData.estado as EstadoCita) ? (
                  <p className="text-xs text-red-600 mt-2 font-medium">
                    🔒 Esta cita está en estado terminal y no puede cambiar
                  </p>
                ) : obtenerEstadosPermitidos(citaData.estado as EstadoCita).length === 0 ? (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ No hay transiciones válidas disponibles desde este estado
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Selecciona el nuevo estado y haz clic en "Guardar Expediente" para actualizar
                  </p>
                )}
              </div>

              {/* Información del paciente */}
              <div className="border border-gray-200 rounded-lg text-gray-900">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                    Información del Paciente
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">
                        Cargando datos completos del paciente...
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Datos personales */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Datos Personales
                        </h4>
                        <div className="bg-blue-50 p-3 rounded border border-blue-200 space-y-2">
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">
                              Nombre:
                            </span>{" "}
                            {pacienteData.nombre}{" "}
                            {pacienteData.apellido || (
                              <span className="text-gray-500 italic">
                                No disponible
                              </span>
                            )}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">
                              DNI:
                            </span>{" "}
                            {pacienteData.dni || (
                              <span className="text-gray-500 italic">
                                No disponible
                              </span>
                            )}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">
                              Edad:
                            </span>{" "}
                            {pacienteData.edad ? (
                              `${pacienteData.edad} años`
                            ) : (
                              <span className="text-gray-500 italic">
                                No disponible
                              </span>
                            )}
                          </p>
                          {pacienteData.fecha_nacimiento && (
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">
                                Nacimiento:
                              </span>{" "}
                              {new Date(
                                pacienteData.fecha_nacimiento
                              ).toLocaleDateString("es-PE")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Información médica */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Información Médica
                        </h4>
                        <div className="bg-purple-50 p-3 rounded border border-purple-200 space-y-2">
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">
                              Tipo de Sangre:
                            </span>{" "}
                            {pacienteData.tipo_sangre || "No disponible"}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">
                              Fecha de Nacimiento:
                            </span>{" "}
                            {pacienteData.fecha_nacimiento
                              ? new Date(
                                  pacienteData.fecha_nacimiento
                                ).toLocaleDateString("es-PE")
                              : "No disponible"}
                          </p>
                        </div>
                      </div>

                      {/* Contacto */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Contacto
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            {pacienteData.telefono || "No disponible"}
                          </p>
                        </div>
                      </div>

                      {/* Sección de Historial con Control de Acceso Temporal */}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                            📋 Historial Médico
                          </h4>
                          {canViewHistorial && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Disponible
                            </span>
                          )}
                        </div>

                        {/* Botón de Historial */}
                        <button
                          onClick={verHistorialCompleto}
                          disabled={loadingHistorial || !canViewHistorial}
                          className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                            canViewHistorial
                              ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                              : "bg-gray-100 text-gray-500 cursor-not-allowed"
                          } flex items-center justify-center gap-2`}
                        >
                          {loadingHistorial ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Cargando historial...
                            </>
                          ) : canViewHistorial ? (
                            <>
                              <FileText className="w-4 h-4" />
                              Ver Historial Completo
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4" />
                              Acceso Restringido
                            </>
                          )}
                        </button>

                        {/* Información sobre acceso temporal */}
                        <div
                          className={`mt-2 p-2 rounded text-xs ${
                            canViewHistorial
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                          }`}
                        >
                          {canViewHistorial ? (
                            <p>
                              ✅ <strong>{historialAccess.reason}</strong>
                            </p>
                          ) : (
                            <>
                              <p>
                                <strong>⏰ Restricción Temporal:</strong>
                              </p>
                              <p className="mt-1">{historialAccess.reason}</p>
                            </>
                          )}
                        </div>
                      </div>

                      {pacienteData.alergias && (
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                            ⚠ Alergias Conocidas
                          </h4>
                          <p className="text-sm text-yellow-700">
                            {pacienteData.alergias}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Motivo de Consulta
                        </h4>
                        <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 break-words overflow-x-hidden">
                          {citaData.motivo_consulta || "No especificado"}
                        </p>
                      </div>

                      {citaData.observaciones_paciente && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Observaciones del Paciente
                          </h4>
                          <p className="text-sm text-gray-900 bg-blue-50 rounded-lg p-3 break-words overflow-x-hidden">
                            {citaData.observaciones_paciente}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Formulario médico */}
              <div className="border border-gray-200 rounded-lg text-gray-900">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Stethoscope className="w-5 h-5 mr-2 text-gray-600" />
                    Evaluación Médica
                  </h3>
                </div>
                
                {/* ⏰ INDICADOR DE VENTANA DE EDICIÓN */}
                {(() => {
                  const editAccess = calculateEditAccess();
                  return (
                    <div className={`px-4 py-3 border-b ${
                      editAccess.canEdit 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm">
                          {editAccess.canEdit ? (
                            <div>
                              <p className="font-medium text-green-800">
                                ✅ Edición Permitida
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                {editAccess.reason}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-red-800">
                                🔒 Edición Bloqueada
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                {editAccess.reason}
                              </p>
                            </div>
                          )}
                        </div>
                        {editAccess.daysRemaining !== null && editAccess.canEdit && editAccess.daysRemaining <= 3 && (
                          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                            ⏰ {editAccess.daysRemaining} {editAccess.daysRemaining === 1 ? "día" : "días"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                <div className="p-4 space-y-6">
                  {/* Diagnóstico */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
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
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.diagnostico.length}/1000 caracteres
                    </p>
                  </div>

                  {/* Tratamiento */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Pill className="w-4 h-4 mr-2 text-blue-600" />
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
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.tratamiento.length}/1500 caracteres
                    </p>
                  </div>

                  {/* Observaciones médicas */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Eye className="w-4 h-4 mr-2 text-purple-600" />
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.observaciones_medico.length}/500 caracteres
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel lateral */}
            <div className="space-y-6 text-gray-900">
              {/* Signos vitales */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-600" />
                  Signos Vitales
                </h3>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-gray-600">
                        Presión Arterial
                      </span>
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
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">
                        Frec. Cardíaca
                      </span>
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
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-gray-600">Temperatura</span>
                      <input
                        type="text"
                        value={formData.temperatura}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            temperatura: e.target.value,
                          }))
                        }
                        placeholder="36.5 °C"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Sat. O₂</span>
                      <input
                        type="text"
                        value={formData.saturacion_oxigeno}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            saturacion_oxigeno: e.target.value,
                          }))
                        }
                        placeholder="98%"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-gray-600">Peso</span>
                      <input
                        type="text"
                        value={formData.peso}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            peso: e.target.value,
                          }))
                        }
                        placeholder="70 kg"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Altura</span>
                      <input
                        type="text"
                        value={formData.altura}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            altura: e.target.value,
                          }))
                        }
                        placeholder="170 cm"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de costo */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Información de Costo
                </h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-600">
                      Costo de la Consulta (S/)
                    </span>
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
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="button"
                    className="w-full border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generar Receta Formal
                  </button>
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Acciones</h3>

                <div className="space-y-2">
                  <button
                    onClick={guardarDatosMedicos}
                    disabled={isSaving || !formData.diagnostico.trim()}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

                  <button
                    onClick={handleClose}
                    disabled={isSaving}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {historialOpen && (
        <ModalHistorialPaciente
          isOpen={historialOpen}
          onClose={() => setHistorialOpen(false)}
          historial={historialData}
          canAccess={canViewHistorial}
          accessDenialReason={historialAccess.reason}
          citaFecha={citaData?.fecha_cita}
          pacienteId={pacienteIdLocal}
        />
      )}
    </div>
  );
}
