// components/farmacia/despacho-recetas
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
  const [tipoEntrega, setTipoEntrega] = useState<"farmacia" | "domicilio">(
    "farmacia"
  );
  const [direccionEntrega, setDireccionEntrega] = useState("");

  // Medicamentos seleccionados para despacho
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
      (receta as any).tipo_entrega === "domicilio" ? "domicilio" : "farmacia"
    );
    setDireccionEntrega((receta as any).direccion_entrega || "");
    setMostrarDetalles(true);
  };

  const procesarAccion = async (
    accion: "preparar" | "despachar" | "rechazar"
  ) => {
    if (!recetaSeleccionada || !token) return;

    // Validar medicamentos para despacho
    if (accion === "despachar") {
      const medicamentosValidos = recetaSeleccionada.medicamentos.filter(
        (m) => medicamentosDespacho[m.id]
      );

      if (medicamentosValidos.length === 0) {
        alert("Debe seleccionar al menos un medicamento para despachar");
        return;
      }

      for (const med of medicamentosValidos) {
        const cantidad = medicamentosDespacho[med.id];
        if (cantidad > med.stock_disponible) {
          alert(
            `Stock insuficiente para ${med.nombre_comercial}. Disponible: ${med.stock_disponible}`
          );
          return;
        }
      }
    }

    if (accion === "rechazar" && !motivoRechazo.trim()) {
      alert("Debe ingresar un motivo para rechazar");
      return;
    }

    setAccionConfirmada(accion);
    setMostrarConfirmacion(true);
  };

  const confirmarAccion = async () => {
    if (!recetaSeleccionada || !token || !accionConfirmada) return;

    try {
      setProcesando(true);

      // Preparar medicamentos procesados
      let medicamentosA: Array<{
        medicamento_id: number;
        cantidad_dispensada: number;
        lote: string;
        precio_unitario: number;
      }> = [];

      if (accionConfirmada === "despachar") {
        medicamentosA = recetaSeleccionada.medicamentos
          .filter((m) => medicamentosDespacho[m.id])
          .map((m) => ({
            medicamento_id: m.medicamento_id || parseInt(m.id),
            cantidad_dispensada: medicamentosDespacho[m.id],
            lote: m.lote || "",
            precio_unitario: m.precio_unitario,
          }));

        if (medicamentosA.length === 0) {
          alert("Debe seleccionar medicamentos para despachar");
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

      const resultado = await response.json();

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

      // Recargar recetas con el nuevo filtro (también actualiza setRecetas)
      await cargarRecetas(nuevoFiltro);

      // Mostrar mensaje de éxito
      const mensajes: Record<string, string> = {
        en_proceso: "Receta en preparación correctamente",
        dispensada: "Receta dispensada correctamente",
        rechazada: "Receta rechazada correctamente",
      };
      alert(mensajes[accionAPI] || "Acción completada");
    } catch (error) {
      console.error("Error procesando receta:", error);
      alert(
        error instanceof Error ? error.message : "Error al procesar receta"
      );
    } finally {
      setProcesando(false);
      setMostrarConfirmacion(false);
      setAccionConfirmada(null);
    }
  };

  const calcularCostoDespacho = () => {
    if (!recetaSeleccionada) return 0;

    return recetaSeleccionada.medicamentos
      .filter((m) => medicamentosDespacho[m.id])
      .reduce(
        (total, m) => total + medicamentosDespacho[m.id] * m.precio_unitario,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Despacho de Recetas
          </h1>
          <p className="text-gray-600 text-sm">
            Procesa y despacha recetas a pacientes
          </p>
        </div>
        {onVolver && (
          <Button variant="outline" onClick={onVolver}>
            ← Volver
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente, DNI o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filtroEstado === "pendiente" ? "default" : "outline"}
                onClick={() => setFiltroEstado("pendiente")}
                size="sm"
              >
                Pendientes
              </Button>
              <Button
                variant={filtroEstado === "en_proceso" ? "default" : "outline"}
                onClick={() => setFiltroEstado("en_proceso")}
                size="sm"
              >
                En Proceso
              </Button>
              <Button
                variant={filtroEstado === "dispensadas" ? "default" : "outline"}
                onClick={() => setFiltroEstado("dispensadas")}
                size="sm"
              >
                Dispensadas
              </Button>
            </div>

            <Button
              onClick={() => cargarRecetas()}
              disabled={cargando}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {cargando ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recetas */}
      <div className="space-y-3">
        {recetasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {cargando
                  ? "Cargando recetas..."
                  : "No hay recetas en este estado"}
              </p>
            </CardContent>
          </Card>
        ) : (
          recetasFiltradas.map((receta) => (
            <Card
              key={receta.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => abrirDetalles(receta)}
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* Información del Paciente */}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {receta.paciente_nombre} {receta.paciente_apellido}
                    </p>
                    <p className="text-xs text-gray-600">
                      DNI: {receta.paciente_dni}
                    </p>
                    <p className="text-xs text-gray-600">
                      Receta: {receta.codigo_receta}
                    </p>
                  </div>

                  {/* Información Médica */}
                  <div>
                    <p className="text-xs text-gray-600">
                      <strong>Médico:</strong> Dr. {receta.medico_nombre}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Especialidad:</strong> {receta.especialidad}
                    </p>
                  </div>

                  {/* Medicamentos */}
                  <div>
                    <Badge variant="outline" className="bg-blue-50">
                      {receta.total_medicamentos} medicamento
                      {receta.total_medicamentos !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Estado */}
                  <div>
                    <Badge className={getEstadoColor(receta.estado)}>
                      {getEstadoLabel(receta.estado)}
                    </Badge>
                  </div>

                  {/* Acción */}
                  <div className="text-right">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirDetalles(receta);
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Detalles y Despacho */}
      <Dialog open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalles de Receta - {recetaSeleccionada?.codigo_receta}
            </DialogTitle>
          </DialogHeader>

          {recetaSeleccionada && (
            <div className="space-y-6">
              {/* Información de Paciente y Médico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Información del Paciente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>Nombre:</strong>{" "}
                      {recetaSeleccionada.paciente_nombre}{" "}
                      {recetaSeleccionada.paciente_apellido}
                    </p>
                    <p>
                      <strong>DNI:</strong> {recetaSeleccionada.paciente_dni}
                    </p>
                    {recetaSeleccionada.paciente_edad && (
                      <p>
                        <strong>Edad:</strong>{" "}
                        {recetaSeleccionada.paciente_edad} años
                      </p>
                    )}
                    {recetaSeleccionada.paciente_sexo && (
                      <p>
                        <strong>Sexo:</strong>{" "}
                        {recetaSeleccionada.paciente_sexo}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Información Médica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>Médico:</strong> Dr.{" "}
                      {recetaSeleccionada.medico_nombre}{" "}
                      {recetaSeleccionada.medico_apellido}
                    </p>
                    <p>
                      <strong>Especialidad:</strong>{" "}
                      {recetaSeleccionada.especialidad}
                    </p>
                    {recetaSeleccionada.numero_colegiatura && (
                      <p>
                        <strong>Colegiatura:</strong>{" "}
                        {recetaSeleccionada.numero_colegiatura}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Información de la Receta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">Fecha Emisión</p>
                      <p className="font-semibold text-sm">
                        {new Date(
                          recetaSeleccionada.fecha_emision
                        ).toLocaleDateString("es-PE")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Calendar className="w-5 h-5 text-red-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">Fecha Vencimiento</p>
                      <p className="font-semibold text-sm">
                        {new Date(
                          recetaSeleccionada.fecha_vencimiento
                        ).toLocaleDateString("es-PE")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Pill className="w-5 h-5 text-green-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">Medicamentos</p>
                      <p className="font-semibold text-sm">
                        {recetaSeleccionada.total_medicamentos}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {recetaSeleccionada.diagnostico_principal_texto && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Diagnóstico</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {recetaSeleccionada.diagnostico_principal_texto}
                  </CardContent>
                </Card>
              )}

              {/* Medicamentos - Tabla mejorada */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5" />
                    Medicamentos Prescritos
                  </CardTitle>
                  <CardDescription>
                    Total: {recetaSeleccionada?.medicamentos?.length || 0}{" "}
                    medicamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recetaSeleccionada?.medicamentos &&
                  recetaSeleccionada.medicamentos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-3 px-2 font-semibold">
                              Medicamento
                            </th>
                            <th className="text-center py-3 px-2 font-semibold">
                              Dosis
                            </th>
                            <th className="text-center py-3 px-2 font-semibold">
                              Frecuencia
                            </th>
                            <th className="text-center py-3 px-2 font-semibold">
                              Requerido
                            </th>
                            <th className="text-center py-3 px-2 font-semibold">
                              Stock
                            </th>
                            <th className="text-center py-3 px-2 font-semibold">
                              Precio Unit.
                            </th>
                            <th className="text-center py-3 px-2 font-semibold">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recetaSeleccionada.medicamentos.map((med, idx) => (
                            <tr
                              key={`${med.id}-${idx}`}
                              className="border-b border-gray-200 hover:bg-gray-50"
                            >
                              <td className="py-3 px-2">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {med.nombre_comercial}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {med.nombre_generico}
                                  </p>
                                </div>
                              </td>
                              <td className="text-center py-3 px-2 text-gray-700">
                                {med.dosis || "-"}
                              </td>
                              <td className="text-center py-3 px-2 text-gray-700">
                                {med.frecuencia || "-"}
                              </td>
                              <td className="text-center py-3 px-2 font-semibold text-blue-600">
                                {med.cantidad_requerida}
                              </td>
                              <td
                                className={`text-center py-3 px-2 font-semibold ${
                                  med.stock_disponible >= med.cantidad_requerida
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {med.stock_disponible}
                              </td>
                              <td className="text-center py-3 px-2">
                                S/ {Number(med.precio_unitario ?? 0).toFixed(2)}
                              </td>
                              <td className="text-center py-3 px-2">
                                {med.disponible ? (
                                  <Badge className="bg-green-100 text-green-800 mx-auto">
                                    ✓ OK
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 mx-auto">
                                    ✗ Sin Stock
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No hay medicamentos en esta receta
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Información de Entrega (Read-Only) */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-base">
                    📦 Información de Entrega
                  </CardTitle>
                  <CardDescription>
                    Opción elegida por el paciente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        tipoEntrega === "farmacia"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white opacity-50"
                      }`}
                    >
                      <div className="font-semibold text-gray-900">
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
                      className={`p-4 rounded-lg border-2 ${
                        tipoEntrega === "domicilio"
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 bg-white opacity-50"
                      }`}
                    >
                      <div className="font-semibold text-gray-900">
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
                    <div className="space-y-2 mt-4 p-3 bg-white rounded border border-orange-300">
                      <label className="text-sm font-medium text-gray-900">
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
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        Subtotal Medicamentos:
                      </span>
                      <span className="font-semibold">
                        S/{" "}
                        {(
                          recetaSeleccionada.medicamentos?.reduce(
                            (sum, m) =>
                              sum +
                              (m.precio_unitario || 0) * m.cantidad_requerida,
                            0
                          ) || 0
                        ).toFixed(2)}
                      </span>
                    </div>
                    {tipoEntrega === "domicilio" && (
                      <div className="flex justify-between items-center text-orange-700">
                        <span className="text-gray-700">Costo de Envío:</span>
                        <span className="font-semibold">S/ 15.00</span>
                      </div>
                    )}
                    <div className="border-t-2 border-blue-300 pt-2 flex justify-between items-center">
                      <span className="font-bold text-gray-900">
                        Total a Pagar:
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        S/{" "}
                        {(
                          (recetaSeleccionada.medicamentos?.reduce(
                            (sum, m) =>
                              sum +
                              (m.precio_unitario || 0) * m.cantidad_requerida,
                            0
                          ) || 0) + (tipoEntrega === "domicilio" ? 15 : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Motivo de Rechazo (si aplica) */}
              {recetaSeleccionada.estado === "pendiente" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Motivo de Rechazo (opcional)
                  </label>
                  <Input
                    placeholder="Ingrese el motivo si desea rechazar la receta"
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                  />
                </div>
              )}

              {/* Botones de Acción */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => setMostrarDetalles(false)}
                >
                  Cerrar
                </Button>

                {(recetaSeleccionada.estado === "activa" ||
                  recetaSeleccionada.estado === "pendiente") && (
                  <>
                    <Button
                      onClick={() => procesarAccion("preparar")}
                      disabled={procesando}
                      className="bg-yellow-600 hover:bg-yellow-700"
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
                      className="bg-green-600 hover:bg-green-700"
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
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                  </>
                )}

                {recetaSeleccionada.estado === "en_proceso" && (
                  <Button
                    onClick={() => procesarAccion("despachar")}
                    disabled={
                      procesando ||
                      Object.values(medicamentosDespacho).every((v) => !v)
                    }
                    className="bg-green-600 hover:bg-green-700 md:col-span-2"
                  >
                    {procesando ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Completar Despacho
                  </Button>
                )}

                {recetaSeleccionada.estado === "dispensada" && (
                  <div className="md:col-span-2 flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">
                      Receta ya fue dispensada
                    </span>
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
  );
}
