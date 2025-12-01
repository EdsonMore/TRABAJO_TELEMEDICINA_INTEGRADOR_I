import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package2,
  Home,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Bell,
  History,
} from "lucide-react";

interface Medicamento {
  id: string;
  medicamento?: {
    nombre_comercial?: string;
    nombre_generico?: string;
  };
  nombre_comercial?: string;
  nombre_generico?: string;
  cantidad?: number;
  dosis?: string;
}

interface HistorialEvento {
  id: number;
  fecha: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  descripcion: string;
  farmacia?: string;
  notificado: boolean;
}

interface RecetaTracking {
  id: string;
  codigo_receta: string;
  estado: string;
  estado_envio: string;
  farmacia_nombre?: string;
  tipo_entrega: "recojo" | "domicilio";
  direccion_entrega?: string;
  costo_entrega: number;
  fecha_envio_farmacia?: string;
  total_estimado?: number;
  medico_nombre?: string;
  medico_apellido?: string;
  ultima_actualizacion?: string;
  medicamentos?: Medicamento[];
}

interface Notificacion {
  tipo: "info" | "exito" | "error";
  mensaje: string;
}

export default function SeguimientoRecetasPaciente() {
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<RecetaTracking[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recetaSeleccionada, setRecetaSeleccionada] =
    useState<RecetaTracking | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historialReceta, setHistorialReceta] = useState<HistorialEvento[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);
  const [recetasActualizadas, setRecetasActualizadas] = useState<Set<string>>(
    new Set()
  );
  const recetasAnterioresRef = useRef<RecetaTracking[]>([]);

  // 🔄 Auto-actualización cada 30 segundos
  useEffect(() => {
    if (token) {
      cargarRecetas();

      const interval = setInterval(() => {
        cargarRecetas(true); // Carga silenciosa
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [token]);

  const cargarRecetas = async (silent = false) => {
    try {
      if (!silent) {
        setCargando(true);
      }
      const authToken =
        token ||
        localStorage.getItem("medilink_token") ||
        localStorage.getItem("token");

      const response = await fetch("/api/paciente/recetas", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) throw new Error("Error al cargar recetas");

      const data = await response.json();
      const rawRecetas = Array.isArray(data.recetas)
        ? data.recetas
        : data.recetas?.rows || [];

      // Filtrar solo las que han sido enviadas a farmacia
      const recetasEnviadas = rawRecetas.filter(
        (r: any) => r.estado_envio && r.estado_envio !== "no_enviada"
      );

      // 🔔 Detectar cambios de estado para mostrar notificaciones
      if (silent && recetasAnterioresRef.current.length > 0) {
        recetasEnviadas.forEach((receta: RecetaTracking) => {
          const recetaAnterior = recetasAnterioresRef.current.find(
            (r) => r.id === receta.id
          );

          if (
            recetaAnterior &&
            recetaAnterior.estado_envio !== receta.estado_envio
          ) {
            // Nuevo cambio detectado
            setRecetasActualizadas((prev) => new Set([...prev, receta.id]));

            // Mostrar notificación
            setNotificacion({
              tipo: "info",
              mensaje: `📬 ${receta.codigo_receta}: ${getEstadoLabel(
                receta.estado_envio
              )}`,
            });

            // Auto-ocultar notificación después de 5 segundos
            setTimeout(() => setNotificacion(null), 5000);
          }
        });
      }

      // Actualizar referencia de recetas anteriores
      recetasAnterioresRef.current = recetasEnviadas;

      setRecetas(recetasEnviadas);
    } catch (error) {
      console.error("Error:", error);
      if (!silent) {
        setNotificacion({
          tipo: "error",
          mensaje: "Error al cargar recetas",
        });
      }
    } finally {
      if (!silent) {
        setCargando(false);
      }
    }
  };

  const cargarHistorial = async (recetaId: string) => {
    try {
      setCargandoHistorial(true);
      const authToken =
        token ||
        localStorage.getItem("medilink_token") ||
        localStorage.getItem("token");

      const response = await fetch(
        `/api/paciente/recetas/${recetaId}/historial`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (!response.ok) throw new Error("Error al cargar historial");

      const data = await response.json();
      setHistorialReceta(data.historial || []);
      setMostrarHistorial(true);
    } catch (error) {
      console.error("Error:", error);
      setNotificacion({
        tipo: "error",
        mensaje: "Error al cargar el historial",
      });
    } finally {
      setCargandoHistorial(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Hace un momento";
    if (diffMinutes < 60)
      return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? "s" : ""}`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24)
      return `Hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? "s" : ""}`;

    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const esActualizacionReciente = (fecha?: string) => {
    if (!fecha) return false;
    const fec = new Date(fecha);
    const ahora = new Date();
    const diffMinutes = (ahora.getTime() - fec.getTime()) / 60000;
    return diffMinutes < 5; // Menos de 5 minutos
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "enviada":
        return "bg-yellow-100 text-yellow-800";
      case "recibida":
        return "bg-blue-100 text-blue-800";
      case "en_proceso":
        return "bg-purple-100 text-purple-800";
      case "dispensada":
        return "bg-green-100 text-green-800";
      case "rechazada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      enviada: "Enviada a Farmacia",
      recibida: "Recibida en Farmacia",
      en_proceso: "En Preparación",
      dispensada: "Lista para Retiro",
      rechazada: "Rechazada",
      no_enviada: "No Enviada",
    };
    return labels[estado] || estado;
  };

  const getTipoEntregaLabel = (tipo: string) => {
    return tipo === "domicilio"
      ? "🚚 Envío a Domicilio"
      : "🏪 Recojo en Farmacia";
  };

  if (cargando) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin mb-4">
            <RefreshCw className="w-8 h-8 mx-auto text-gray-400" />
          </div>
          <p className="text-gray-600">Cargando seguimiento de recetas...</p>
        </CardContent>
      </Card>
    );
  }

  if (recetas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Package2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 mb-2">
            No hay recetas en seguimiento
          </h3>
          <p className="text-gray-600 text-sm">
            Aquí aparecerán tus recetas una vez las envíes a la farmacia
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notificación de actualizaciones */}
      {notificacion && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top ${
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
            <Bell className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          )}
          <div className="flex-1">
            <p
              className={
                notificacion.tipo === "exito"
                  ? "text-green-800 font-medium"
                  : notificacion.tipo === "error"
                  ? "text-red-800 font-medium"
                  : "text-blue-800 font-medium"
              }
            >
              {notificacion.mensaje}
            </p>
          </div>
          <button
            onClick={() => setNotificacion(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            📦 Seguimiento de Recetas
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {recetas.length} receta{recetas.length !== 1 ? "s" : ""} en proceso
            • Auto-actualización cada 30s
          </p>
        </div>
        <Button
          onClick={() => cargarRecetas(false)}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </Button>
      </div>

      <div className="grid gap-4">
        {recetas.map((receta) => (
          <Card
            key={receta.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-900">
                      Receta #{receta.codigo_receta}
                    </h3>
                    {/* Indicador de actualización reciente */}
                    {esActualizacionReciente(receta.ultima_actualizacion) && (
                      <Badge className="bg-blue-500 text-white animate-pulse">
                        Actualizado
                      </Badge>
                    )}
                    {recetasActualizadas.has(receta.id) && (
                      <span className="text-blue-600 animate-bounce">🔔</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {receta.medico_nombre} {receta.medico_apellido}
                  </p>
                  {receta.farmacia_nombre && (
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {receta.farmacia_nombre}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <Badge className={getEstadoColor(receta.estado_envio)}>
                    {getEstadoLabel(receta.estado_envio)}
                  </Badge>
                  {receta.estado_envio === "dispensada" && (
                    <div>
                      <Badge className="bg-green-600">✓ Lista</Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Información de Entrega */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-semibold mb-2">
                    MODALIDAD DE ENTREGA
                  </p>
                  <div className="text-sm font-medium text-gray-900">
                    {getTipoEntregaLabel(receta.tipo_entrega)}
                  </div>

                  {receta.tipo_entrega === "domicilio" &&
                    receta.direccion_entrega && (
                      <div className="mt-2 p-2 bg-white rounded border border-orange-200">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-600">
                              Dirección de entrega:
                            </p>
                            <p className="text-sm text-gray-800">
                              {receta.direccion_entrega}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {receta.tipo_entrega === "recojo" && (
                    <div className="mt-2 p-2 bg-white rounded border border-green-200">
                      <p className="text-xs text-gray-600">
                        ✓ Puedes pasar a recoger en cualquier momento
                      </p>
                    </div>
                  )}
                </div>

                {/* Información de Costo */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-semibold mb-2">
                    DETALLES
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="text-gray-600">Medicamentos:</span>
                        <div className="mt-1 space-y-1">
                          {receta.medicamentos &&
                          receta.medicamentos.length > 0 ? (
                            receta.medicamentos.map((med, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-gray-700 font-medium"
                              >
                                •{" "}
                                {med?.medicamento?.nombre_comercial ||
                                  med?.nombre_comercial ||
                                  "Medicamento"}
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-500">
                              Sin medicamentos
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="font-medium ml-2">
                        {receta.medicamentos?.length || 0} producto
                        {receta.medicamentos && receta.medicamentos.length !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>
                    {receta.tipo_entrega === "domicilio" && (
                      <div className="flex justify-between text-orange-700">
                        <span className="text-gray-600">Envío:</span>
                        <span className="font-medium">
                          S/ {Number(receta.costo_entrega ?? 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Estado Timeline */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 font-semibold mb-3">
                  ESTADO DEL PROCESO
                </p>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        receta.estado_envio !== "no_enviada"
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-xs">Enviada</span>
                  </div>

                  <div className="flex-1 h-0.5 bg-gray-300"></div>

                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ["recibida", "en_proceso", "dispensada"].includes(
                          receta.estado_envio
                        )
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-xs">Recibida</span>
                  </div>

                  <div className="flex-1 h-0.5 bg-gray-300"></div>

                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        ["en_proceso", "dispensada"].includes(
                          receta.estado_envio
                        )
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-xs">Preparando</span>
                  </div>

                  <div className="flex-1 h-0.5 bg-gray-300"></div>

                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        receta.estado_envio === "dispensada"
                          ? "bg-green-600"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    <span className="text-xs">
                      {receta.tipo_entrega === "domicilio"
                        ? "En Camino"
                        : "Lista"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setRecetaSeleccionada(receta);
                    setMostrarDetalles(true);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Ver Detalles
                </Button>
                <Button
                  onClick={() => {
                    setRecetaSeleccionada(receta);
                    cargarHistorial(receta.id);
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={cargandoHistorial}
                >
                  <History className="w-4 h-4" />
                  Historial
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Detalles */}
      <Dialog open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalles de Receta #{recetaSeleccionada?.codigo_receta}
            </DialogTitle>
            <DialogDescription>
              Estado: {getEstadoLabel(recetaSeleccionada?.estado_envio || "")}
            </DialogDescription>
          </DialogHeader>

          {recetaSeleccionada && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Información de Entrega */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  📦 Información de Entrega
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Tipo:</span>
                    <Badge variant="outline">
                      {getTipoEntregaLabel(recetaSeleccionada.tipo_entrega)}
                    </Badge>
                  </div>
                  {recetaSeleccionada.tipo_entrega === "domicilio" &&
                    recetaSeleccionada.direccion_entrega && (
                      <div>
                        <span className="font-medium">Dirección:</span>
                        <p className="text-gray-700">
                          {recetaSeleccionada.direccion_entrega}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Medicamentos */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">
                  💊 Medicamentos (
                  {recetaSeleccionada.medicamentos?.length || 0})
                </h4>
                <div className="space-y-2">
                  {recetaSeleccionada.medicamentos?.map((med, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start p-2 bg-white rounded border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {med?.medicamento?.nombre_comercial ||
                            med?.nombre_comercial ||
                            "Medicamento"}
                        </p>
                        <p className="text-xs text-gray-600">
                          {med?.medicamento?.nombre_generico ||
                            med?.nombre_generico ||
                            "Sin especificar"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Cantidad: {med?.cantidad || 0} unidades
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información de Costo y Envío */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  💰 Costo de Envío
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Modalidad:</span>
                    <span className="font-medium">
                      {recetaSeleccionada.tipo_entrega === "domicilio"
                        ? "🚚 Envío a Domicilio"
                        : "🏪 Recojo en Farmacia"}
                    </span>
                  </div>
                  {recetaSeleccionada.tipo_entrega === "domicilio" && (
                    <div className="flex justify-between text-orange-700">
                      <span>Costo de Envío:</span>
                      <span className="font-medium">
                        S/{" "}
                        {Number(recetaSeleccionada.costo_entrega ?? 0).toFixed(
                          2
                        )}
                      </span>
                    </div>
                  )}
                  {recetaSeleccionada.tipo_entrega === "recojo" && (
                    <div className="text-green-700">
                      <span className="font-medium">✓ Sin costo de envío</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Historial Detallado */}
      <Dialog open={mostrarHistorial} onOpenChange={setMostrarHistorial}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial de Receta #{recetaSeleccionada?.codigo_receta}
            </DialogTitle>
            <DialogDescription>
              Seguimiento completo de todos los cambios de estado
            </DialogDescription>
          </DialogHeader>

          {recetaSeleccionada && (
            <div className="space-y-6">
              {/* Estado Actual */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Estado Actual
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {getEstadoLabel(recetaSeleccionada.estado_envio)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {recetaSeleccionada.farmacia_nombre &&
                          `📍 ${recetaSeleccionada.farmacia_nombre}`}
                      </p>
                    </div>
                    <Badge
                      className={`${getEstadoColor(
                        recetaSeleccionada.estado_envio
                      )} text-lg px-4 py-2`}
                    >
                      {recetaSeleccionada.estado_envio}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline de Historial */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Línea de Tiempo ({historialReceta.length} evento
                    {historialReceta.length !== 1 ? "s" : ""})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cargandoHistorial ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-600">
                        Cargando historial...
                      </span>
                    </div>
                  ) : historialReceta.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay historial disponible
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historialReceta.map((evento, idx) => (
                        <div key={evento.id} className="flex items-start gap-4">
                          {/* Línea vertical y punto */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                idx === historialReceta.length - 1
                                  ? "bg-blue-600 border-blue-600 ring-4 ring-blue-100"
                                  : "bg-white border-gray-300"
                              }`}
                            />
                            {idx < historialReceta.length - 1 && (
                              <div className="w-0.5 h-full min-h-[40px] bg-gray-300 mt-1" />
                            )}
                          </div>

                          {/* Contenido del evento */}
                          <div className="flex-1 pb-6">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {evento.descripcion}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-gray-500">
                                    {formatearFecha(evento.fecha)}
                                  </p>
                                  {evento.farmacia && (
                                    <span className="text-xs text-gray-400">
                                      • {evento.farmacia}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  className={getEstadoColor(
                                    evento.estado_nuevo
                                  )}
                                  variant="outline"
                                >
                                  {evento.estado_nuevo}
                                </Badge>
                                {idx === historialReceta.length - 1 && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    Actual
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Transición de estados */}
                            {evento.estado_anterior && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0"
                                >
                                  {evento.estado_anterior}
                                </Badge>
                                <span>→</span>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0"
                                >
                                  {evento.estado_nuevo}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Información de Entrega */}
              {recetaSeleccionada.tipo_entrega && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-sm mb-3">
                      📦 Modalidad de Entrega
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <Badge variant="outline">
                          {recetaSeleccionada.tipo_entrega === "domicilio"
                            ? "🚚 Envío a Domicilio"
                            : "🏪 Recojo en Farmacia"}
                        </Badge>
                      </div>
                      {recetaSeleccionada.tipo_entrega === "domicilio" &&
                        recetaSeleccionada.direccion_entrega && (
                          <div>
                            <span className="text-gray-600 text-xs">
                              Dirección:
                            </span>
                            <p className="text-gray-800 mt-1">
                              {recetaSeleccionada.direccion_entrega}
                            </p>
                          </div>
                        )}
                      {recetaSeleccionada.tipo_entrega === "domicilio" && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-gray-600">Costo de envío:</span>
                          <span className="font-semibold text-orange-700">
                            S/{" "}
                            {Number(
                              recetaSeleccionada.costo_entrega ?? 0
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
