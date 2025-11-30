"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Check,
  AlertTriangle,
  Clock,
  Search,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Download,
  Calendar,
  Pill,
  User, // AÑADIDO: Importar el ícono User que faltaba
} from "lucide-react";

interface Medicamento {
  id: string;
  medicamento_id?: number;
  nombre_comercial: string;
  nombre_generico: string;
  cantidad_requerida: number;
  cantidad?: number;
  stock_disponible: number;
  stock_actual?: number;
  precio_unitario: number;
  precio_venta?: number;
  lote: string;
  disponible: boolean;
  dosis: string;
  frecuencia: string;
  duracion_dias?: number;
  via_administracion: string;
  estado_disponibilidad?: string;
}

interface Notificacion {
  tipo: "exito" | "error" | "info";
  mensaje: string;
}

interface Receta {
  id: string;
  codigo_receta: string;
  estado: "activa" | "en_proceso" | "dispensada" | "pendiente";
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  paciente_edad?: number;
  paciente_sexo?: string;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  numero_colegiatura?: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  diagnostico_principal_texto?: string;
  observaciones?: string;
  total_medicamentos: number;
  medicamentos_con_stock?: number;
  medicamentos: Medicamento[];
  tiene_stock_completo?: boolean;
  tipo_entrega?: "farmacia" | "domicilio"; // AÑADIDO
  direccion_entrega?: string; // AÑADIDO
}

interface DespachoRecetasProps {
  onVolver?: () => void;
  recetaPreseleccionada?: string | null;
}

export default function DespachoRecetas({
  onVolver,
  recetaPreseleccionada,
}: DespachoRecetasProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [recetasFiltradas, setRecetasFiltradas] = useState<Receta[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // Helper: Deduplicar medicamentos
  const deduplicarMedicamentos = (meds: Medicamento[]) => {
    return meds.reduce((unique: Medicamento[], med: Medicamento) => {
      const existe = unique.some(
        (u) =>
          u.medicamento_id === med.medicamento_id ||
          u.nombre_comercial === med.nombre_comercial
      );
      if (!existe) {
        unique.push(med);
      }
      return unique;
    }, []);
  };

  // Despacho
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(
    null
  );
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [accionConfirmada, setAccionConfirmada] = useState<
    "preparar" | "despachar" | "rechazar" | null
  >(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);
  const [tipoEntrega, setTipoEntrega] = useState<"farmacia" | "domicilio">(
    "farmacia"
  );
  const [direccionEntrega, setDireccionEntrega] = useState("");

  // Medicamentos seleccionados para despacho - CORREGIDO: usar string como clave
  const [medicamentosDespacho, setMedicamentosDespacho] = useState<
    Record<string, number>
  >({});

  // Obtener ID de receta desde parámetro (prioritario) o query params
  const recetaParamId = recetaPreseleccionada || searchParams?.get("receta");

  useEffect(() => {
    if (token) {
      cargarRecetas();
    }
  }, [token]);

  useEffect(() => {
    filtrarRecetas();
  }, [recetas, busqueda, filtroEstado]);

  // Auto-seleccionar receta si viene de query params
  useEffect(() => {
    if (recetaParamId && recetas.length > 0) {
      const receta = recetas.find((r) => r.id === recetaParamId);
      if (receta) {
        abrirDetalles(receta);
      }
    }
  }, [recetaParamId, recetas]);

  const cargarRecetas = async (filtroEstadoParam?: string) => {
    if (!token) return [];

    try {
      setCargando(true);

      // Usar el parámetro si se proporciona, si no usar el estado local
      const estadoFiltro = filtroEstadoParam || filtroEstado;

      // Mapear estado del filtro a lo que espera la API
      let estadoAPI = "";
      if (estadoFiltro === "pendiente") {
        estadoAPI = "pendientes";
      } else if (estadoFiltro === "en_proceso") {
        estadoAPI = "en_proceso";
      } else if (estadoFiltro === "dispensadas") {
        estadoAPI = "dispensadas";
      }

      const response = await fetch(
        `/api/farmacia/recetas?estado=${estadoAPI}&page=1&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error ${response.status}`);
      }

      const data = await response.json();
      const recetasData = data.recetas || [];
      setRecetas(recetasData);
      return recetasData;
    } catch (error) {
      console.error("Error cargando recetas:", error);
      return [];
    } finally {
      setCargando(false);
    }
  };

  const filtrarRecetas = () => {
    let filtradas = recetas;

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtradas = filtradas.filter(
        (r) =>
          r.paciente_nombre.toLowerCase().includes(busquedaLower) ||
          r.paciente_apellido.toLowerCase().includes(busquedaLower) ||
          r.paciente_dni.includes(busqueda) ||
          r.codigo_receta.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por estado - Los estados de la API son: activa, en_proceso, dispensada
    // Pero los mostramos como: pendiente, en_proceso, dispensadas
    if (filtroEstado === "pendiente") {
      filtradas = filtradas.filter(
        (r) => r.estado === "activa" || r.estado === "pendiente"
      );
    } else if (filtroEstado === "en_proceso") {
      filtradas = filtradas.filter((r) => r.estado === "en_proceso");
    } else if (filtroEstado === "dispensadas") {
      filtradas = filtradas.filter((r) => r.estado === "dispensada");
    }

    setRecetasFiltradas(filtradas);
  };

  const abrirDetalles = (receta: Receta) => {
    setRecetaSeleccionada(receta);
    setMedicamentosDespacho({});
    setMotivoRechazo("");
    // Cargar datos de entrega de la receta
    setTipoEntrega(
      receta.tipo_entrega === "domicilio" ? "domicilio" : "farmacia"
    );
    setDireccionEntrega(receta.direccion_entrega || "");
    setMostrarDetalles(true);
  };

  // CORREGIDO: Función helper para obtener clave única del medicamento
  const getMedicamentoKey = (med: Medicamento): string => {
    return med.medicamento_id?.toString() || med.id;
  };

  const procesarAccion = async (
    accion: "preparar" | "despachar" | "rechazar"
  ) => {
    if (!recetaSeleccionada || !token) return;

    // Validaciones previas
    try {
      // Validar medicamentos para despacho
      if (accion === "despachar") {
        const medicamentosUnicos = deduplicarMedicamentos(
          recetaSeleccionada.medicamentos
        );
        const medicamentosValidos = medicamentosUnicos.filter(
          (m) => medicamentosDespacho[getMedicamentoKey(m)]
        );

        if (medicamentosValidos.length === 0) {
          setNotificacion({
            tipo: "error",
            mensaje: "Debe seleccionar al menos un medicamento para despachar",
          });
          return;
        }

        // Validar stock
        for (const med of medicamentosValidos) {
          const cantidad = medicamentosDespacho[getMedicamentoKey(med)];
          if (cantidad > med.stock_disponible) {
            setNotificacion({
              tipo: "error",
              mensaje: `Stock insuficiente para ${med.nombre_comercial}. Disponible: ${med.stock_disponible}, Solicitado: ${cantidad}`,
            });
            return;
          }
        }
      }

      if (accion === "rechazar" && !motivoRechazo.trim()) {
        setNotificacion({
          tipo: "error",
          mensaje: "Debe ingresar un motivo para rechazar la receta",
        });
        return;
      }

      setAccionConfirmada(accion);
      setMostrarConfirmacion(true);
      setNotificacion(null);
    } catch (error) {
      setNotificacion({
        tipo: "error",
        mensaje: error instanceof Error ? error.message : "Error en validación",
      });
    }
  };

  const confirmarAccion = async () => {
    if (!recetaSeleccionada || !token || !accionConfirmada) return;

    try {
      setProcesando(true);
      setMostrarConfirmacion(false);

      // Preparar medicamentos procesados
      let medicamentosA: Array<{
        medicamento_id: number;
        cantidad_dispensada: number;
        lote: string;
        precio_unitario: number;
      }> = [];

      if (accionConfirmada === "despachar") {
        const medicamentosUnicos = deduplicarMedicamentos(
          recetaSeleccionada.medicamentos
        );
        medicamentosA = medicamentosUnicos
          .filter((m) => medicamentosDespacho[getMedicamentoKey(m)])
          .map((m) => ({
            medicamento_id: m.medicamento_id || parseInt(m.id),
            cantidad_dispensada: medicamentosDespacho[getMedicamentoKey(m)],
            lote: m.lote || "",
            precio_unitario: m.precio_unitario,
          }));

        if (medicamentosA.length === 0) {
          setNotificacion({
            tipo: "error",
            mensaje: "Debe seleccionar medicamentos para despachar",
          });
          setProcesando(false);
          return;
        }
      }

      // Mapear acción a lo que espera la API
      const accionAPI =
        accionConfirmada === "preparar"
          ? "en_proceso"
          : accionConfirmada === "despachar"
          ? "dispensada"
          : "rechazada";

      const response = await fetch(
        `/api/farmacia/recetas/${recetaSeleccionada.id}/procesar`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accion: accionAPI,
            medicamentos_procesados: medicamentosA,
            observaciones: motivoRechazo,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.error || error.message || `Error ${response.status}`
        );
      }

      // Cerrar modal PRIMERO
      setMostrarDetalles(false);
      setRecetaSeleccionada(null);
      setMedicamentosDespacho({});
      setMotivoRechazo("");

      // Determinar el nuevo filtro
      let nuevoFiltro = filtroEstado; // Por defecto mantener el actual
      if (accionAPI === "en_proceso") {
        nuevoFiltro = "en_proceso";
      } else if (accionAPI === "dispensada") {
        nuevoFiltro = "dispensadas";
      }

      // Actualizar el filtro en el estado PRIMERO
      setFiltroEstado(nuevoFiltro);

      // Mostrar notificación de éxito
      const mensajes: Record<string, string> = {
        en_proceso: "Receta marcada como en preparación",
        dispensada: "Receta dispensada correctamente",
        rechazada: "Receta rechazada correctamente",
      };

      setNotificacion({
        tipo: "exito",
        mensaje: mensajes[accionAPI] || "Acción completada exitosamente",
      });

      // Recargar recetas con el nuevo filtro (también actualiza setRecetas)
      setTimeout(() => {
        cargarRecetas(nuevoFiltro);
      }, 800);
    } catch (error) {
      console.error("Error procesando receta:", error);
      setNotificacion({
        tipo: "error",
        mensaje:
          error instanceof Error ? error.message : "Error al procesar receta",
      });
    } finally {
      setProcesando(false);
      setAccionConfirmada(null);
    }
  };

  const calcularCostoDespacho = () => {
    if (!recetaSeleccionada) return 0;

    const medicamentosUnicos = deduplicarMedicamentos(
      recetaSeleccionada.medicamentos
    );
    return medicamentosUnicos
      .filter((m) => medicamentosDespacho[getMedicamentoKey(m)])
      .reduce(
        (total, m) =>
          total +
          medicamentosDespacho[getMedicamentoKey(m)] * m.precio_unitario,
        0
      );
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "activa":
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "en_proceso":
        return "bg-blue-100 text-blue-800";
      case "dispensada":
        return "bg-green-100 text-green-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case "activa":
      case "pendiente":
        return "Pendiente de Preparación";
      case "en_proceso":
        return "En Preparación";
      case "dispensada":
        return "Dispensada";
      case "cancelada":
        return "Cancelada/Rechazada";
      default:
        return estado;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Despacho de Recetas
            </h1>
            <p className="text-gray-600 text-base">
              Procesa y despacha recetas a pacientes de manera eficiente
            </p>
          </div>
          {onVolver && (
            <Button
              variant="outline"
              onClick={onVolver}
              className="hidden sm:flex gap-2"
            >
              ← Volver
            </Button>
          )}
        </div>

        {/* Notificaciones */}
        {notificacion && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
              notificacion.tipo === "exito"
                ? "bg-green-50 border border-green-200"
                : notificacion.tipo === "error"
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {notificacion.tipo === "exito" ? (
              <CheckCircle2
                className="text-green-600 flex-shrink-0 mt-0.5"
                size={20}
              />
            ) : notificacion.tipo === "error" ? (
              <AlertCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={20}
              />
            ) : (
              <AlertCircle
                className="text-blue-600 flex-shrink-0 mt-0.5"
                size={20}
              />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={
                  notificacion.tipo === "exito"
                    ? "text-green-800"
                    : notificacion.tipo === "error"
                    ? "text-red-800"
                    : "text-blue-800"
                }
              >
                {notificacion.mensaje}
              </p>
            </div>
            <button
              onClick={() => setNotificacion(null)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filtros mejorados */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre de paciente, DNI o código de receta..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-12 py-3 text-base border-gray-300"
                />
              </div>

              {/* Controles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button
                  variant={filtroEstado === "pendiente" ? "default" : "outline"}
                  onClick={() => setFiltroEstado("pendiente")}
                  className="w-full"
                >
                  ⏳ Pendientes
                </Button>
                <Button
                  variant={
                    filtroEstado === "en_proceso" ? "default" : "outline"
                  }
                  onClick={() => setFiltroEstado("en_proceso")}
                  className="w-full"
                >
                  ⚙️ En Proceso
                </Button>
                <Button
                  variant={
                    filtroEstado === "dispensadas" ? "default" : "outline"
                  }
                  onClick={() => setFiltroEstado("dispensadas")}
                  className="w-full"
                >
                  ✓ Dispensadas
                </Button>
                <Button
                  onClick={() => cargarRecetas()}
                  disabled={cargando}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {cargando ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recetas - Lista mejorada */}
        <div className="space-y-4">
          {recetasFiltradas.length === 0 ? (
            <Card className="shadow-sm border-0">
              <CardContent className="p-12 text-center">
                <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {cargando
                    ? "Cargando recetas..."
                    : "No hay recetas en este estado"}
                </h3>
                <p className="text-gray-500">
                  {cargando
                    ? "Por favor, espere..."
                    : "Intenta cambiar los filtros o búsqueda"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {recetasFiltradas.map((receta) => (
                <Card
                  key={receta.id}
                  className="hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer border-0 shadow-sm"
                  onClick={() => abrirDetalles(receta)}
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 items-center">
                      {/* Información del Paciente */}
                      <div className="lg:col-span-2">
                        <p className="font-bold text-gray-900 text-base mb-1">
                          {receta.paciente_nombre} {receta.paciente_apellido}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold">DNI:</span>{" "}
                          {receta.paciente_dni}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Receta:</span>{" "}
                          {receta.codigo_receta}
                        </p>
                      </div>

                      {/* Información Médica */}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold">Médico:</span>{" "}
                          {receta.medico_nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Especialidad:</span>{" "}
                          {receta.especialidad}
                        </p>
                      </div>

                      {/* Medicamentos */}
                      <div className="text-center">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5 text-sm font-medium"
                        >
                          💊{" "}
                          {deduplicarMedicamentos(receta.medicamentos).length}{" "}
                          medicamento
                          {deduplicarMedicamentos(receta.medicamentos)
                            .length !== 1
                            ? "s"
                            : ""}
                        </Badge>
                      </div>

                      {/* Estado */}
                      <div className="text-center">
                        <Badge
                          className={`${getEstadoColor(
                            receta.estado
                          )} px-3 py-1.5 text-sm font-medium`}
                        >
                          {getEstadoLabel(receta.estado)}
                        </Badge>
                      </div>

                      {/* Acción */}
                      <div className="text-right">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirDetalles(receta);
                          }}
                        >
                          Ver Detalles →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Detalles y Despacho */}
        <Dialog open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
            <DialogHeader className="sticky top-0 bg-white z-10 px-8 py-6 border-b border-gray-200">
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <FileText className="w-6 h-6 text-blue-600" />
                Detalles de Receta
              </DialogTitle>
              <DialogDescription className="text-base">
                {recetaSeleccionada?.codigo_receta} - Procesamiento y
                dispensación
              </DialogDescription>
            </DialogHeader>

            {recetaSeleccionada && (
              <div className="px-8 py-6 space-y-6">
                {/* Información de Paciente y Médico en grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Paciente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs uppercase tracking-wider">
                          Nombre Completo
                        </p>
                        <p className="font-bold text-lg text-gray-900">
                          {recetaSeleccionada.paciente_nombre}{" "}
                          {recetaSeleccionada.paciente_apellido}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs uppercase tracking-wider">
                          DNI
                        </p>
                        <p className="font-semibold text-gray-900">
                          {recetaSeleccionada.paciente_dni}
                        </p>
                      </div>
                      {recetaSeleccionada.paciente_edad && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-600 text-xs uppercase tracking-wider">
                              Edad
                            </p>
                            <p className="font-semibold text-gray-900">
                              {recetaSeleccionada.paciente_edad} años
                            </p>
                          </div>
                          {recetaSeleccionada.paciente_sexo && (
                            <div>
                              <p className="text-gray-600 text-xs uppercase tracking-wider">
                                Sexo
                              </p>
                              <p className="font-semibold text-gray-900">
                                {recetaSeleccionada.paciente_sexo}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        Información Médica
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs uppercase tracking-wider">
                          Médico
                        </p>
                        <p className="font-bold text-lg text-gray-900">
                          Dr. {recetaSeleccionada.medico_nombre}{" "}
                          {recetaSeleccionada.medico_apellido}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs uppercase tracking-wider">
                          Especialidad
                        </p>
                        <p className="font-semibold text-gray-900">
                          {recetaSeleccionada.especialidad}
                        </p>
                      </div>
                      {recetaSeleccionada.numero_colegiatura && (
                        <div>
                          <p className="text-gray-600 text-xs uppercase tracking-wider">
                            Colegiatura
                          </p>
                          <p className="font-semibold text-gray-900">
                            {recetaSeleccionada.numero_colegiatura}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Información de Fechas y Medicamentos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <Calendar className="w-6 h-6 text-green-600 mx-auto" />
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Emitida
                        </p>
                        <p className="font-bold text-lg text-gray-900">
                          {new Date(
                            recetaSeleccionada.fecha_emision
                          ).toLocaleDateString("es-PE", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(
                            recetaSeleccionada.fecha_emision
                          ).toLocaleDateString("es-PE", {
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <Calendar className="w-6 h-6 text-red-600 mx-auto" />
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Vencimiento
                        </p>
                        <p className="font-bold text-lg text-gray-900">
                          {new Date(
                            recetaSeleccionada.fecha_vencimiento
                          ).toLocaleDateString("es-PE", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(
                            recetaSeleccionada.fecha_vencimiento
                          ).toLocaleDateString("es-PE", {
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <Pill className="w-6 h-6 text-blue-600 mx-auto" />
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Medicamentos
                        </p>
                        <p className="font-bold text-2xl text-gray-900">
                          {recetaSeleccionada.total_medicamentos}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {recetaSeleccionada.diagnostico_principal_texto && (
                  <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg">📋 Diagnóstico</CardTitle>
                    </CardHeader>
                    <CardContent className="text-base text-gray-700 leading-relaxed">
                      {recetaSeleccionada.diagnostico_principal_texto}
                    </CardContent>
                  </Card>
                )}

                {/* Medicamentos - Tabla mejorada */}
                <Card className="border-0">
                  <CardHeader className="border-b bg-gray-50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Pill className="w-5 h-5 text-blue-600" />
                      Medicamentos Prescritos
                    </CardTitle>
                    <CardDescription className="text-base">
                      Total:{" "}
                      {recetaSeleccionada?.medicamentos
                        ? deduplicarMedicamentos(
                            recetaSeleccionada.medicamentos
                          ).length
                        : 0}{" "}
                      medicamentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {recetaSeleccionada?.medicamentos &&
                    recetaSeleccionada.medicamentos.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-gray-300 bg-gray-50">
                              <th className="text-left py-4 px-4 font-bold text-gray-700">
                                Medicamento
                              </th>
                              <th className="text-center py-4 px-4 font-bold text-gray-700">
                                Dosis
                              </th>
                              <th className="text-center py-4 px-4 font-bold text-gray-700">
                                Frecuencia
                              </th>
                              <th className="text-center py-4 px-4 font-bold text-gray-700">
                                Requerido
                              </th>
                              <th className="text-center py-4 px-4 font-bold text-gray-700">
                                Stock
                              </th>
                              <th className="text-center py-4 px-4 font-bold text-gray-700">
                                Precio Unit.
                              </th>
                              {recetaSeleccionada.estado === "en_proceso" && (
                                <th className="text-center py-4 px-4 font-bold text-gray-700">
                                  A Despachar
                                </th>
                              )}
                              <th className="text-center py-4 px-4 font-bold text-gray-700">
                                Estado
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // Deduplicar medicamentos
                              const medicamentosUnicos = deduplicarMedicamentos(
                                recetaSeleccionada.medicamentos
                              );
                              return medicamentosUnicos.map((med, idx) => (
                                <tr
                                  key={`med-${getMedicamentoKey(med)}-${idx}`}
                                  className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                                >
                                  <td className="py-4 px-4">
                                    <div>
                                      <p className="font-bold text-gray-900 text-base">
                                        {med.nombre_comercial}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {med.nombre_generico}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="text-center py-4 px-4 text-gray-700 font-medium">
                                    {med.dosis || "-"}
                                  </td>
                                  <td className="text-center py-4 px-4 text-gray-700 font-medium">
                                    {med.frecuencia || "-"}
                                  </td>
                                  <td className="text-center py-4 px-4 font-bold text-blue-600 text-lg">
                                    {med.cantidad_requerida}
                                  </td>
                                  <td
                                    className={`text-center py-4 px-4 font-bold text-lg ${
                                      med.stock_disponible >=
                                      med.cantidad_requerida
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {med.stock_disponible}
                                  </td>
                                  <td className="text-center py-4 px-4 font-medium">
                                    S/{" "}
                                    {Number(med.precio_unitario ?? 0).toFixed(
                                      2
                                    )}
                                  </td>
                                  {recetaSeleccionada.estado ===
                                    "en_proceso" && (
                                    <td className="text-center py-4 px-4">
                                      <Input
                                        type="number"
                                        min="0"
                                        max={med.stock_disponible}
                                        value={
                                          medicamentosDespacho[
                                            getMedicamentoKey(med)
                                          ] || ""
                                        }
                                        onChange={(e) => {
                                          const cantidad =
                                            parseInt(e.target.value) || 0;
                                          setMedicamentosDespacho({
                                            ...medicamentosDespacho,
                                            [getMedicamentoKey(med)]: cantidad,
                                          });
                                        }}
                                        placeholder="0"
                                        className="w-20 text-center font-semibold"
                                      />
                                    </td>
                                  )}
                                  <td className="text-center py-4 px-4">
                                    {med.disponible ? (
                                      <Badge className="bg-green-100 text-green-800 font-semibold mx-auto">
                                        ✓ Disponible
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-800 font-semibold mx-auto">
                                        ✗ Sin Stock
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No hay medicamentos en esta receta
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Información de Entrega (Read-Only) */}
                <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      📦 Información de Entrega
                    </CardTitle>
                    <CardDescription>
                      Opción elegida por el paciente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className={`p-4 rounded-lg border-2 transition-all ${
                          tipoEntrega === "farmacia"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white opacity-50"
                        }`}
                      >
                        <div className="font-bold text-gray-900 text-lg">
                          🏪 Recoger en Farmacia
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          El paciente retira en nuestras instalaciones
                        </p>
                        {tipoEntrega === "farmacia" && (
                          <div className="mt-3 inline-block bg-green-200 text-green-800 px-3 py-1 rounded text-xs font-semibold">
                            ✓ Seleccionado
                          </div>
                        )}
                      </div>

                      <div
                        className={`p-4 rounded-lg border-2 transition-all ${
                          tipoEntrega === "domicilio"
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 bg-white opacity-50"
                        }`}
                      >
                        <div className="font-bold text-gray-900 text-lg">
                          🚚 Envío a Domicilio
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Entrega en la dirección del paciente
                        </p>
                        {tipoEntrega === "domicilio" && (
                          <div className="mt-3 inline-block bg-orange-200 text-orange-800 px-3 py-1 rounded text-xs font-semibold">
                            ✓ Seleccionado
                          </div>
                        )}
                      </div>
                    </div>

                    {tipoEntrega === "domicilio" && direccionEntrega && (
                      <div className="space-y-2 mt-4 p-4 bg-white rounded border-2 border-orange-300">
                        <label className="text-sm font-bold text-gray-900">
                          📍 Dirección de Entrega
                        </label>
                        <p className="text-gray-700 font-medium">
                          {direccionEntrega}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Resumen de Costo */}
                <Card className="border-l-4 border-l-blue-600 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      💰 Resumen de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-base">
                    {recetaSeleccionada.estado === "en_proceso" ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">
                            Subtotal a Despachar:
                          </span>
                          <span className="font-bold text-gray-900">
                            S/{" "}
                            {(() => {
                              const medicamentosUnicos = deduplicarMedicamentos(
                                recetaSeleccionada.medicamentos
                              );
                              return medicamentosUnicos
                                .filter(
                                  (m) =>
                                    medicamentosDespacho[getMedicamentoKey(m)]
                                )
                                .reduce(
                                  (total, m) =>
                                    total +
                                    medicamentosDespacho[getMedicamentoKey(m)] *
                                      m.precio_unitario,
                                  0
                                )
                                .toFixed(2);
                            })()}
                          </span>
                        </div>
                        {tipoEntrega === "domicilio" && (
                          <div className="flex justify-between items-center text-orange-700 font-medium">
                            <span>Costo de Envío:</span>
                            <span className="font-bold">S/ 15.00</span>
                          </div>
                        )}
                        <div className="border-t-2 border-blue-300 pt-3 flex justify-between items-center">
                          <span className="font-bold text-gray-900 text-lg">
                            Total a Pagar:
                          </span>
                          <span className="text-2xl font-bold text-blue-600">
                            S/{" "}
                            {(() => {
                              const medicamentosUnicos = deduplicarMedicamentos(
                                recetaSeleccionada.medicamentos
                              );
                              const subtotal = medicamentosUnicos
                                .filter(
                                  (m) =>
                                    medicamentosDespacho[getMedicamentoKey(m)]
                                )
                                .reduce(
                                  (total, m) =>
                                    total +
                                    medicamentosDespacho[getMedicamentoKey(m)] *
                                      m.precio_unitario,
                                  0
                                );
                              return (
                                subtotal +
                                (tipoEntrega === "domicilio" ? 15 : 0)
                              ).toFixed(2);
                            })()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">
                            Subtotal Medicamentos:
                          </span>
                          <span className="font-bold text-gray-900">
                            S/{" "}
                            {(
                              deduplicarMedicamentos(
                                recetaSeleccionada.medicamentos
                              ).reduce(
                                (sum, m) =>
                                  sum +
                                  (m.precio_unitario || 0) *
                                    m.cantidad_requerida,
                                0
                              ) || 0
                            ).toFixed(2)}
                          </span>
                        </div>
                        {tipoEntrega === "domicilio" && (
                          <div className="flex justify-between items-center text-orange-700 font-medium">
                            <span>Costo de Envío:</span>
                            <span className="font-bold">S/ 15.00</span>
                          </div>
                        )}
                        <div className="border-t-2 border-blue-300 pt-3 flex justify-between items-center">
                          <span className="font-bold text-gray-900 text-lg">
                            Total a Pagar:
                          </span>
                          <span className="text-2xl font-bold text-blue-600">
                            S/{" "}
                            {(
                              (deduplicarMedicamentos(
                                recetaSeleccionada.medicamentos
                              ).reduce(
                                (sum, m) =>
                                  sum +
                                  (m.precio_unitario || 0) *
                                    m.cantidad_requerida,
                                0
                              ) || 0) + (tipoEntrega === "domicilio" ? 15 : 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Motivo de Rechazo (si aplica) */}
                {(recetaSeleccionada.estado === "pendiente" ||
                  recetaSeleccionada.estado === "activa" ||
                  recetaSeleccionada.estado === "en_proceso") && (
                  <Card className="border-l-4 border-l-red-500 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Motivo de Rechazo (Opcional)
                      </CardTitle>
                      <CardDescription>
                        Si deseas rechazar la receta, proporciona un motivo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Input
                        placeholder="Ej: Sin stock, Documentación incompleta..."
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        className="text-base"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Botones de Acción */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setMostrarDetalles(false)}
                    className="text-base h-10 font-semibold"
                  >
                    Cerrar
                  </Button>

                  {(recetaSeleccionada.estado === "activa" ||
                    recetaSeleccionada.estado === "pendiente") && (
                    <>
                      <Button
                        onClick={() => procesarAccion("preparar")}
                        disabled={procesando}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-base h-10 font-semibold"
                      >
                        {procesando ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Clock className="w-4 h-4 mr-2" />
                        )}
                        Preparar
                      </Button>

                      <Button
                        onClick={() => procesarAccion("despachar")}
                        disabled={
                          procesando ||
                          Object.values(medicamentosDespacho).every((v) => !v)
                        }
                        className="bg-green-600 hover:bg-green-700 text-white text-base h-10 font-semibold"
                      >
                        {procesando ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Despachar
                      </Button>

                      <Button
                        onClick={() => procesarAccion("rechazar")}
                        disabled={procesando}
                        variant="destructive"
                        className="text-base h-10 font-semibold"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </>
                  )}

                  {recetaSeleccionada.estado === "en_proceso" && (
                    <>
                      <Button
                        onClick={() => procesarAccion("despachar")}
                        disabled={procesando}
                        className="bg-green-600 hover:bg-green-700 text-white text-base h-10 font-semibold"
                      >
                        {procesando ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Completar Despacho
                      </Button>

                      <Button
                        onClick={() => procesarAccion("rechazar")}
                        disabled={procesando}
                        variant="destructive"
                        className="text-base h-10 font-semibold"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </>
                  )}

                  {recetaSeleccionada.estado === "dispensada" && (
                    <div className="md:col-span-2 flex items-center gap-2 text-green-700 bg-green-100 border border-green-300 p-3 rounded font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Receta ya fue dispensada</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de Confirmación */}
        <AlertDialog
          open={mostrarConfirmacion}
          onOpenChange={setMostrarConfirmacion}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {accionConfirmada === "preparar"
                  ? "¿Iniciar Preparación?"
                  : accionConfirmada === "despachar"
                  ? "¿Confirmar Despacho?"
                  : "¿Rechazar Receta?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {accionConfirmada === "preparar"
                  ? "La receta pasará a estado 'En Proceso'"
                  : accionConfirmada === "despachar"
                  ? `Se despachará por S/ ${calcularCostoDespacho().toFixed(2)}`
                  : "El paciente será notificado del rechazo"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmarAccion}
                disabled={procesando}
                className={
                  accionConfirmada === "rechazar"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
              >
                {procesando ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Confirmar
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
