// app/dashboard/citas/page.tsx
// Página completa para agendar citas con sistema de pagos integrado

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
  CreditCard,
  Smartphone,
  Building,
  QrCode,
} from "lucide-react";

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
  esPasado: boolean;
}

interface FiltrosMedicos {
  especialidad: string;
  precioMax: number;
  seguro: boolean;
  experienciaMin: number;
  calificacionMin: number;
  tipoConsulta: string;
}

interface DatosPago {
  metodo_pago: string;
  numero_tarjeta?: string;
  fecha_vencimiento?: string;
  cvv?: string;
  numero_telefono?: string;
  codigo_operacion?: string;
  banco?: string;
  numero_operacion?: string;
}

export default function AgendarCitaPage() {
  const router = useRouter();
  const { token, usuario } = useAuth();
  const { toast } = useToast();

  const [pasoActual, setPasoActual] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMedicos, setIsLoadingMedicos] = useState(false);
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
  const [isProcessingPago, setIsProcessingPago] = useState(false);

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

  const [pagoData, setPagoData] = useState<DatosPago>({
    metodo_pago: "tarjeta",
  });

  const [citaCreada, setCitaCreada] = useState<any>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [erroresPago, setErroresPago] = useState<Record<string, string>>({});
  const [costoDinamico, setCostoDinamico] = useState<number>(0);

  // Cargar médicos al montar el componente
  useEffect(() => {
    // Esperar a que el token esté disponible después de la recarga
    if (token) {
      cargarMedicos();
    }
    // Si no hay token, no hacer nada - el ProtectedRoute redirigirá o mostrará loading
  }, [token]); // ✅ Dependencia en token

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

  // Validar formulario en tiempo real
  useEffect(() => {
    validarFormulario();
  }, [formData]);

  // Validar datos de pago en tiempo real
  useEffect(() => {
    if (pasoActual === 4) {
      validarDatosPago();
    }
  }, [pagoData]);

  // ✅ NUEVO: Actualizar costo dinámico cuando cambie médico o tipo de cita
  useEffect(() => {
    const nuevosCosto = calcularPrecio();
    setCostoDinamico(nuevosCosto);
    console.log("📊 Precio actualizado:", {
      tipo_cita: formData.tipo_cita,
      medico: medicoSeleccionado?.nombre,
      tarifa_base: medicoSeleccionado?.tarifa_consulta,
      costo: nuevosCosto,
    });
  }, [formData.tipo_cita, medicoSeleccionado]);

  // Función para obtener fecha y hora actual en Lima/Perú
  const getFechaHoraActual = () => {
    // Usar la hora real del servidor o del cliente ajustada a Perú
    const ahora = new Date();

    // Obtener la zona horaria de Perú (UTC-5)
    const opciones: Intl.DateTimeFormatOptions = {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat("es-PE", opciones);
    const partes = formatter.formatToParts(ahora);

    const getParte = (type: string) =>
      partes.find((part) => part.type === type)?.value;

    // Reconstruir la fecha en zona horaria Perú
    const fechaPeru = new Date(
      parseInt(getParte("year")!),
      parseInt(getParte("month")!) - 1,
      parseInt(getParte("day")!),
      parseInt(getParte("hour")!),
      parseInt(getParte("minute")!),
      parseInt(getParte("second")!)
    );

    return fechaPeru;
  };

  // Función para formatear fecha como YYYY-MM-DD
  const formatFechaInput = (fecha: Date): string => {
    return fecha.toISOString().split("T")[0];
  };

  // Función para verificar si una fecha/hora es en el pasado
  const esFechaHoraPasada = (fecha: string, hora: number): boolean => {
    const ahora = new Date();
    
    // Parsear fecha del string YYYY-MM-DD
    const [año, mes, día] = fecha.split("-").map(Number);
    const fechaCita = new Date(año, mes - 1, día, hora, 0, 0);
    
    const MARGEN_MINUTOS = 5;
    const limite = new Date(ahora.getTime() + MARGEN_MINUTOS * 60 * 1000);

    const esPasado = fechaCita <= limite;

    console.log("🔍 Validación CORREGIDA:", {
      fecha,
      hora: `${hora}:00`,
      ahora: ahora.toLocaleString("es-PE"),
      cita: fechaCita.toLocaleString("es-PE"),
      esPasado,
    });

    return esPasado;
  };

  // 5 minutos en milisegundos
  // Solo marca como pasada si ya pasó + margen

  // MEJORA esta función en el modal:

  const cargarMedicos = async () => {
    setIsLoadingMedicos(true);
    try {
      // ✅ VERIFICAR TOKEN PRIMERO
      if (!token) {
        console.error("❌ No hay token disponible en la página");
        toast({
          title: "Error de autenticación",
          description: "Por favor inicia sesión nuevamente",
          variant: "destructive",
        });
        return;
      }

      console.log("🔐 Página: Intentando cargar médicos con token:", {
        tokenLength: token?.length,
        tokenPreview: token ? token.substring(0, 20) + "..." : "NO TOKEN",
      });

      const response = await fetch("/api/medicos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 Página: Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Página: Médicos cargados:", data.medicos?.length || 0);
        setMedicos(data.medicos || []);
      } else if (response.status === 401) {
        console.error("❌ Página: Token expirado o inválido");
        toast({
          title: "Sesión expirada",
          description: "Por favor inicia sesión nuevamente",
          variant: "destructive",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Página: Error del servidor:", errorData);
        throw new Error(errorData.error || "Error al cargar médicos");
      }
    } catch (error) {
      console.error("Error cargando médicos en página:", error);
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

    // Filtro de especialidad
    if (filtros.especialidad && filtros.especialidad !== "todas") {
      filtered = filtered.filter(
        (medico) => medico.especialidad === filtros.especialidad
      );
    }

    // Filtro de precio
    filtered = filtered.filter(
      (medico) => medico.tarifa_consulta <= filtros.precioMax
    );

    // Filtro de seguro
    if (filtros.seguro) {
      filtered = filtered.filter((medico) => medico.acepta_seguro);
    }

    // Filtro de experiencia
    filtered = filtered.filter(
      (medico) => medico.anos_experiencia >= filtros.experienciaMin
    );

    // Filtro de calificación
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

        console.log("🕒 Horarios recibidos del API:", data.data);

        const horariosFormateados = (data.data || []).map((hora: any) => ({
          ...hora,
          formato_12h: formatHora12h(hora.hora),
          formato_24h: `${hora.hora.toString().padStart(2, "0")}:00`,
        }));

        setHorariosDisponibles(horariosFormateados);

        // Debug: mostrar resumen
        const totalDisponibles = horariosFormateados.filter(
          (h: any) => h.disponible
        ).length;
        console.log(
          `📊 Resumen: ${totalDisponibles}/${horariosFormateados.length} horarios disponibles`
        );
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

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    // Validar médico seleccionado
    if (!formData.medico_id) {
      nuevosErrores.medico_id = "Debes seleccionar un médico";
    }

    // Validar fecha
    if (!formData.fecha_cita) {
      nuevosErrores.fecha_cita = "Debes seleccionar una fecha";
    } else {
      // Parsear ambas fechas de la misma forma para comparar solo el día
      const [añoSel, mesSel, díaSel] = formData.fecha_cita.split("-").map(Number);
      const fechaSeleccionada = new Date(añoSel, mesSel - 1, díaSel);
      
      const ahora = new Date();
      const [añoHoy, mesHoy, díaHoy] = [ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate()];
      const fechaHoy = new Date(añoHoy, mesHoy - 1, díaHoy);

      if (fechaSeleccionada < fechaHoy) {
        nuevosErrores.fecha_cita = "No puedes seleccionar una fecha pasada";
      }
    }

    // Validar hora
    if (!formData.hora_cita) {
      nuevosErrores.hora_cita = "Debes seleccionar una hora";
    } else if (formData.fecha_cita) {
      const horaSeleccionada = parseInt(formData.hora_cita);
      const esPasado = esFechaHoraPasada(formData.fecha_cita, horaSeleccionada);
      if (esPasado) {
        nuevosErrores.hora_cita = "No puedes seleccionar una hora pasada";
      }
    }

    // Validar motivo de consulta
    if (!formData.motivo_consulta.trim()) {
      nuevosErrores.motivo_consulta =
        "Debes describir el motivo de la consulta";
    } else if (formData.motivo_consulta.length < 10) {
      nuevosErrores.motivo_consulta =
        "La descripción debe tener al menos 10 caracteres";
    } else if (formData.motivo_consulta.length > 500) {
      nuevosErrores.motivo_consulta =
        "La descripción no puede exceder 500 caracteres";
    }

    // Validar síntomas si se proporcionan
    if (formData.sintomas && formData.sintomas.length > 1000) {
      nuevosErrores.sintomas = "Los síntomas no pueden exceder 1000 caracteres";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const validarDatosPago = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    // Validar método de pago seleccionado
    if (!pagoData.metodo_pago) {
      nuevosErrores.metodo_pago = "Debes seleccionar un método de pago";
    }

    // Validaciones específicas por método de pago
    switch (pagoData.metodo_pago) {
      case "tarjeta":
        if (
          !pagoData.numero_tarjeta ||
          pagoData.numero_tarjeta.replace(/\s/g, "").length !== 16
        ) {
          nuevosErrores.numero_tarjeta =
            "Número de tarjeta inválido (16 dígitos requeridos)";
        }
        if (
          !pagoData.fecha_vencimiento ||
          !/^\d{2}\/\d{2}$/.test(pagoData.fecha_vencimiento)
        ) {
          nuevosErrores.fecha_vencimiento =
            "Fecha de vencimiento inválida (MM/AA)";
        }
        if (!pagoData.cvv || pagoData.cvv.length !== 3) {
          nuevosErrores.cvv = "CVV inválido (3 dígitos requeridos)";
        }
        break;

      case "yape":
      case "plin":
        if (
          !pagoData.numero_telefono ||
          pagoData.numero_telefono.length !== 9
        ) {
          nuevosErrores.numero_telefono =
            "Número de teléfono inválido (9 dígitos requeridos)";
        }
        if (!pagoData.codigo_operacion) {
          nuevosErrores.codigo_operacion = "Código de operación requerido";
        }
        break;

      case "transferencia":
        if (!pagoData.banco) {
          nuevosErrores.banco = "Debes seleccionar un banco";
        }
        if (!pagoData.numero_operacion) {
          nuevosErrores.numero_operacion = "Número de operación requerido";
        }
        break;
    }

    setErroresPago(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleMedicoSeleccionado = (medico: Medico) => {
    setMedicoSeleccionado(medico);
    setFormData((prev) => ({
      ...prev,
      medico_id: medico.id,
      hora_cita: "",
      fecha_cita: "", // Resetear fecha al cambiar médico
    }));
    setPasoActual(2);
  };

  const handleFechaChange = (fecha: string) => {
    const hoy = formatFechaInput(getFechaHoraActual());

    // Si la fecha seleccionada es hoy, resetear la hora
    const nuevaHora = fecha === hoy ? "" : formData.hora_cita;

    setFormData((prev) => ({
      ...prev,
      fecha_cita: fecha,
      hora_cita: nuevaHora,
    }));
  };

  const handlePagoMethodChange = (metodo: string) => {
    setPagoData({
      metodo_pago: metodo,
      numero_tarjeta: "",
      fecha_vencimiento: "",
      cvv: "",
      numero_telefono: "",
      codigo_operacion: "",
      banco: "",
      numero_operacion: "",
    });
    setErroresPago({});
  };

  const crearCita = async (): Promise<any> => {
    const citaData = {
      medico_id: formData.medico_id,
      fecha_cita: formData.fecha_cita,
      hora_cita: formData.hora_cita,
      tipo_cita: formData.tipo_cita,
      motivo_consulta: formData.motivo_consulta.trim(),
      sintomas: formData.sintomas.trim(),
      urgencia: formData.urgencia,
      metodo_pago: pagoData.metodo_pago, // ✅ AGREGADO: Enviar método de pago
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

    if (!response.ok) {
      throw new Error(responseData.error || "Error al agendar cita");
    }

    return responseData.cita;
  };

  const procesarPago = async (citaId: string) => {
    // ✅ Usar el costo dinámico que ya está sincronizado con el tipo de cita
    const montoReal = costoDinamico > 0 ? costoDinamico : citaCreada?.costo;

    const pagoPayload = {
      tipo_pago: "cita",
      referencia_id: citaId,
      monto: montoReal, // ✅ Usar costoDinamico sincronizado
      metodo_pago: pagoData.metodo_pago,
      datos_pago: pagoData,
    };

    console.log("Payload de pago:", pagoPayload);

    // Usar la ruta sandbox para pruebas, en producción usarías "/api/pagos/procesar"
    const response = await fetch("/api/pagos/procesar-sandbox", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pagoPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || "Error al procesar pago");
    }

    return responseData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // En el paso 3, solo validar y avanzar al pago (NO crear la cita aún)
    if (pasoActual === 3) {
      if (!validarFormulario()) {
        toast({
          title: "Error de validación",
          description: "Por favor corrige los errores en el formulario",
          variant: "destructive",
        });
        return;
      }

      // Avanzar al paso de pago sin crear la cita
      setPasoActual(4);
      toast({
        title: "Detalles confirmados",
        description: "Ahora procede con el pago para crear y confirmar tu cita",
      });
      return;
    }

    // En el paso 4, crear la cita Y procesar el pago
    if (pasoActual === 4) {
      if (!validarDatosPago()) {
        toast({
          title: "Error en datos de pago",
          description: "Por favor corrige los errores en el formulario de pago",
          variant: "destructive",
        });
        return;
      }

      setIsProcessingPago(true);
      try {
        // Primero crear la cita
        const cita = await crearCita();
        setCitaCreada(cita);

        // Luego procesar el pago
        const resultadoPago = await procesarPago(cita.id);

        toast({
          title: "✅ ¡Pago procesado exitosamente!",
          description: `Tu cita ha sido confirmada. Código de pago: ${resultadoPago.pago.numero_transaccion}`,
        });

        // Redirigir al dashboard de citas
        setTimeout(() => {
          router.push("/dashboard/paciente/citas");
        }, 3000);
      } catch (error: any) {
        console.error("Error en pago o creación de cita:", error);
        toast({
          title: "Error al procesar pago",
          description:
            error.message || "No se pudo procesar el pago. Intenta nuevamente.",
          variant: "destructive",
        });
      } finally {
        setIsProcessingPago(false);
      }
      return;
    }
  };

  const especialidadesUnicas = [...new Set(medicos.map((m) => m.especialidad))];

  // Fechas límite para el calendario
  const hoy = getFechaHoraActual();
  const fechaMinima = formatFechaInput(hoy);
  const fechaMaxima = new Date(hoy);
  fechaMaxima.setMonth(fechaMaxima.getMonth() + 3);
  const fechaMaximaStr = formatFechaInput(fechaMaxima);

  const progreso = (pasoActual / 4) * 100;

  // Función para determinar si un horario está realmente disponible
  const estaHorarioDisponible = (hora: HorarioDisponible): boolean => {
    return hora.disponible;
  };

  // ✅ Función para convertir tarifa a número de forma segura
  const convertirTarifa = (tarifa: any): number => {
    const num = parseFloat(String(tarifa).replace(/[^0-9.-]/g, ""));
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  };

  // ✅ Función para formatear precio a número con 2 decimales
  const redondearPrecio = (precio: number): number => {
    return Math.round(precio * 100) / 100;
  };

  // ✅ Función para mostrar precio en UI
  const formatearPrecio = (precio: number): string => {
    return redondearPrecio(precio).toFixed(2);
  };

  // Calcular precio según tipo de consulta
  const calcularPrecio = (): number => {
    if (!medicoSeleccionado) return 0;

    const tarifaBase = convertirTarifa(medicoSeleccionado.tarifa_consulta);

    switch (formData.tipo_cita) {
      case "virtual":
        return redondearPrecio(Math.max(tarifaBase - 20, 50));
      case "domicilio":
        return redondearPrecio(tarifaBase + 50);
      default:
        return tarifaBase;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["paciente"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Page Header */}
        <div className="container mx-auto px-4 pt-6 pb-2">
          <div className="flex items-center space-x-4">
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
        </div>

        {/* Progress Bar */}
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Paso {pasoActual} de 4
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progreso)}%
              </span>
            </div>
            <Progress value={progreso} className="h-2" />

            {/* Pasos */}
            <div className="flex justify-between mt-4">
              {[
                { numero: 1, titulo: "Médico", activo: pasoActual >= 1 },
                { numero: 2, titulo: "Fecha/Hora", activo: pasoActual >= 2 },
                { numero: 3, titulo: "Confirmar", activo: pasoActual >= 3 },
                { numero: 4, titulo: "Pago", activo: pasoActual >= 4 },
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-8 h-8 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 break-words">
                              Dr. {medicoSeleccionado.nombre}{" "}
                              {medicoSeleccionado.apellido}
                            </h3>
                            <p className="text-blue-700 font-medium">
                              {medicoSeleccionado.especialidad}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-600 fill-current flex-shrink-0" />
                                <span>
                                  {medicoSeleccionado.calificacion_promedio ||
                                    "Nuevo"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Award className="w-4 h-4 flex-shrink-0" />
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
                          className="w-full sm:w-auto flex-shrink-0"
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
                          max={fechaMaximaStr}
                          value={formData.fecha_cita}
                          onChange={(e) => handleFechaChange(e.target.value)}
                          required
                          className="h-12 text-lg"
                        />
                        {errores.fecha_cita && (
                          <p className="text-red-600 text-sm mt-1">
                            {errores.fecha_cita}
                          </p>
                        )}
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
                          <>
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
                                  disabled={!estaHorarioDisponible(hora)}
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
                                      estaHorarioDisponible(hora)
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {estaHorarioDisponible(hora)
                                      ? "Disponible"
                                      : "No disponible"}
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
                            {errores.hora_cita && (
                              <p className="text-red-600 text-sm mt-2">
                                {errores.hora_cita}
                              </p>
                            )}
                          </>
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
                            calcularPrecio: () => medicoSeleccionado.tarifa_consulta,
                          },
                          {
                            value: "virtual",
                            label: "Consulta Virtual",
                            icon: Video,
                            desc: "Videollamada desde tu casa",
                            calcularPrecio: () => Math.max(
                              medicoSeleccionado.tarifa_consulta - 20,
                              50
                            ),
                            badge: "Ahorro",
                          },
                          {
                            value: "domicilio",
                            label: "Consulta a Domicilio",
                            icon: Home,
                            desc: "El médico te visita",
                            calcularPrecio: () => Number(medicoSeleccionado.tarifa_consulta) + 50,
                            badge: "+Tarifa",
                          },
                        ].map((tipo) => {
                          const IconComponent = tipo.icon;
                          const isSelected = formData.tipo_cita === tipo.value;
                          const precioActual = tipo.calcularPrecio();
                          return (
                            <Card
                              key={tipo.value}
                              className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                  : "border-gray-200 hover:border-blue-300"
                              }`}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  tipo_cita: tipo.value,
                                }))
                              }
                            >
                              <CardContent className="p-4 text-center">
                                <div className="relative mb-2">
                                  <IconComponent
                                    className={`w-8 h-8 mx-auto ${
                                      isSelected
                                        ? "text-blue-600"
                                        : "text-gray-400"
                                    }`}
                                  />
                                  {tipo.badge && (
                                    <Badge
                                      className={`absolute top-0 right-0 text-xs ${
                                        tipo.badge === "Ahorro"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-orange-100 text-orange-700"
                                      }`}
                                    >
                                      {tipo.badge}
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-bold text-gray-900">
                                  {tipo.label}
                                </h4>
                                <p className="text-sm text-gray-600 mb-3">
                                  {tipo.desc}
                                </p>
                                <div className="border-t pt-2">
                                  <p className="text-xs text-gray-500 mb-1">Costo:</p>
                                  <p className="text-lg font-bold text-green-600">
                                    S/ {formatearPrecio(precioActual)}
                                  </p>
                                </div>
                                {isSelected && (
                                  <div className="mt-2 text-xs font-semibold text-blue-600">
                                    ✓ Seleccionado
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navegación */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasoActual(1)}
                      className="w-full sm:w-auto"
                    >
                      ← Volver a Médicos
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setPasoActual(3)}
                      disabled={
                        !formData.fecha_cita ||
                        !formData.hora_cita ||
                        !!errores.fecha_cita ||
                        !!errores.hora_cita
                      }
                      className="w-full sm:w-auto"
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
                                {(() => {
                                  const [año, mes, día] = formData.fecha_cita.split("-").map(Number);
                                  const fechaLocal = new Date(año, mes - 1, día);
                                  return fechaLocal.toLocaleDateString("es-ES", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  });
                                })()}
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
                                S/ {formatearPrecio(costoDinamico)}
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
                          {errores.motivo_consulta && (
                            <p className="text-red-600 text-sm mt-1">
                              {errores.motivo_consulta}
                            </p>
                          )}
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
                          {errores.sintomas && (
                            <p className="text-red-600 text-sm mt-1">
                              {errores.sintomas}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            {formData.sintomas.length}/1000 caracteres
                          </p>
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-lg">Total a Pagar</h4>
                          <p className="text-2xl font-bold text-green-600">
                            S/ {formatearPrecio(costoDinamico)}
                          </p>
                          <p className="text-sm text-gray-600">
                            El pago se realizará en el siguiente paso
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          <Button
                            type="submit"
                            disabled={
                              isLoading || Object.keys(errores).length > 0
                            }
                            className="w-full bg-green-600 hover:bg-green-700 h-12 px-8 text-lg font-bold"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creando Cita...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Crear Cita y Pagar
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPasoActual(2)}
                            className="w-full"
                          >
                            ← Volver Atrás
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* PASO 4: PAGO */}
              {pasoActual === 4 && medicoSeleccionado && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Completa tu Pago
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Selecciona tu método de pago preferido
                    </p>
                  </div>

                  {/* Resumen de la Cita */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            Resumen de tu Cita
                          </h3>
                          <p className="text-blue-700">
                            {(() => {
                              const [año, mes, día] = formData.fecha_cita.split("-").map(Number);
                              const fechaLocal = new Date(año, mes - 1, día);
                              return fechaLocal.toLocaleDateString("es-ES");
                            })()}{" "}
                            - {formatHora12h(parseInt(formData.hora_cita))}
                          </p>
                          <p className="text-sm text-gray-600">
                            Dr. {medicoSeleccionado.nombre}{" "}
                            {medicoSeleccionado.apellido}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            S/ {costoDinamico}
                          </p>
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-800"
                          >
                            Pendiente de pago
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Métodos de Pago */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Selecciona Método de Pago</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Tarjeta de Crédito/Débito */}
                      <div className="space-y-4">
                        <div
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            pagoData.metodo_pago === "tarjeta"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handlePagoMethodChange("tarjeta")}
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                            <div>
                              <h4 className="font-semibold">
                                Tarjeta de Crédito/Débito
                              </h4>
                              <p className="text-sm text-gray-600">
                                Pago seguro con tarjeta
                              </p>
                            </div>
                          </div>
                        </div>

                        {pagoData.metodo_pago === "tarjeta" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <Label htmlFor="numero_tarjeta">
                                Número de Tarjeta
                              </Label>
                              <Input
                                id="numero_tarjeta"
                                placeholder="1234 5678 9012 3456"
                                value={pagoData.numero_tarjeta}
                                onChange={(e) =>
                                  setPagoData((prev) => ({
                                    ...prev,
                                    numero_tarjeta: e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 16),
                                  }))
                                }
                                className={
                                  erroresPago.numero_tarjeta
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                              {erroresPago.numero_tarjeta && (
                                <p className="text-red-600 text-sm mt-1">
                                  {erroresPago.numero_tarjeta}
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor="fecha_vencimiento">
                                  Vencimiento (MM/AA)
                                </Label>
                                <Input
                                  id="fecha_vencimiento"
                                  placeholder="12/25"
                                  value={pagoData.fecha_vencimiento}
                                  onChange={(e) =>
                                    setPagoData((prev) => ({
                                      ...prev,
                                      fecha_vencimiento: e.target.value,
                                    }))
                                  }
                                  className={
                                    erroresPago.fecha_vencimiento
                                      ? "border-red-500"
                                      : ""
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="cvv">CVV</Label>
                                <Input
                                  id="cvv"
                                  placeholder="123"
                                  value={pagoData.cvv}
                                  onChange={(e) =>
                                    setPagoData((prev) => ({
                                      ...prev,
                                      cvv: e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 3),
                                    }))
                                  }
                                  className={
                                    erroresPago.cvv ? "border-red-500" : ""
                                  }
                                />
                              </div>
                            </div>
                            {erroresPago.fecha_vencimiento && (
                              <p className="text-red-600 text-sm col-span-2">
                                {erroresPago.fecha_vencimiento}
                              </p>
                            )}
                            {erroresPago.cvv && (
                              <p className="text-red-600 text-sm col-span-2">
                                {erroresPago.cvv}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Yape */}
                      <div className="space-y-4">
                        <div
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            pagoData.metodo_pago === "yape"
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handlePagoMethodChange("yape")}
                        >
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-6 h-6 text-purple-600" />
                            <div>
                              <h4 className="font-semibold">Yape</h4>
                              <p className="text-sm text-gray-600">
                                Pago rápido con Yape
                              </p>
                            </div>
                          </div>
                        </div>

                        {pagoData.metodo_pago === "yape" && (
                          <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <Label htmlFor="yape_telefono">
                                Número de Teléfono
                              </Label>
                              <Input
                                id="yape_telefono"
                                placeholder="987654321"
                                value={pagoData.numero_telefono}
                                onChange={(e) =>
                                  setPagoData((prev) => ({
                                    ...prev,
                                    numero_telefono: e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 9),
                                  }))
                                }
                                className={
                                  erroresPago.numero_telefono
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                              {erroresPago.numero_telefono && (
                                <p className="text-red-600 text-sm mt-1">
                                  {erroresPago.numero_telefono}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="yape_codigo">
                                Código de Operación
                              </Label>
                              <Input
                                id="yape_codigo"
                                placeholder="ABC123"
                                value={pagoData.codigo_operacion}
                                onChange={(e) =>
                                  setPagoData((prev) => ({
                                    ...prev,
                                    codigo_operacion:
                                      e.target.value.toUpperCase(),
                                  }))
                                }
                                className={
                                  erroresPago.codigo_operacion
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                              {erroresPago.codigo_operacion && (
                                <p className="text-red-600 text-sm mt-1">
                                  {erroresPago.codigo_operacion}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Transferencia Bancaria */}
                      <div className="space-y-4">
                        <div
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            pagoData.metodo_pago === "transferencia"
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() =>
                            handlePagoMethodChange("transferencia")
                          }
                        >
                          <div className="flex items-center gap-3">
                            <Building className="w-6 h-6 text-green-600" />
                            <div>
                              <h4 className="font-semibold">
                                Transferencia Bancaria
                              </h4>
                              <p className="text-sm text-gray-600">
                                Transferencia desde tu banco
                              </p>
                            </div>
                          </div>
                        </div>

                        {pagoData.metodo_pago === "transferencia" && (
                          <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <Label htmlFor="banco">Banco</Label>
                              <Select
                                value={pagoData.banco}
                                onValueChange={(value) =>
                                  setPagoData((prev) => ({
                                    ...prev,
                                    banco: value,
                                  }))
                                }
                              >
                                <SelectTrigger
                                  className={
                                    erroresPago.banco ? "border-red-500" : ""
                                  }
                                >
                                  <SelectValue placeholder="Selecciona tu banco" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bcp">BCP</SelectItem>
                                  <SelectItem value="bbva">BBVA</SelectItem>
                                  <SelectItem value="interbank">
                                    Interbank
                                  </SelectItem>
                                  <SelectItem value="scotiabank">
                                    Scotiabank
                                  </SelectItem>
                                  <SelectItem value="banbif">BanBif</SelectItem>
                                </SelectContent>
                              </Select>
                              {erroresPago.banco && (
                                <p className="text-red-600 text-sm mt-1">
                                  {erroresPago.banco}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="transferencia_operacion">
                                Número de Operación
                              </Label>
                              <Input
                                id="transferencia_operacion"
                                placeholder="123456789"
                                value={pagoData.numero_operacion}
                                onChange={(e) =>
                                  setPagoData((prev) => ({
                                    ...prev,
                                    numero_operacion: e.target.value,
                                  }))
                                }
                                className={
                                  erroresPago.numero_operacion
                                    ? "border-red-500"
                                    : ""
                                }
                              />
                              {erroresPago.numero_operacion && (
                                <p className="text-red-600 text-sm mt-1">
                                  {erroresPago.numero_operacion}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Información de Seguridad */}
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-800">
                            Pago 100% Seguro
                          </h4>
                          <p className="text-sm text-green-700">
                            Tus datos están protegidos con encriptación de
                            última generación. No almacenamos información de tu
                            tarjeta.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Confirmación de Pago */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-lg">Total a Pagar</h4>
                          <p className="text-2xl font-bold text-green-600">
                            S/ {formatearPrecio(costoDinamico)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Método: {pagoData.metodo_pago.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          <Button
                            type="submit"
                            disabled={
                              isProcessingPago ||
                              Object.keys(erroresPago).length > 0
                            }
                            className="w-full bg-green-600 hover:bg-green-700 h-12 px-8 text-lg font-bold"
                          >
                            {isProcessingPago ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Procesando Pago...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Pagar S/ {formatearPrecio(costoDinamico)}
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPasoActual(3)}
                            className="w-full"
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
