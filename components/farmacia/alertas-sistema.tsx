// components/farmacia/alertas-sistema.tsx
"use client";

import { useState, useEffect } from "react";
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
  AlertCircle,
  AlertTriangle,
  Pill,
  Clock,
  XCircle,
  RefreshCw,
  Filter,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface Alerta {
  id: string;
  nombre_comercial: string;
  nombre_generico: string;
  forma_farmaceutica: string;
  concentracion: string;
  stock_actual: number;
  stock_minimo: number;
  lote: string;
  fecha_vencimiento: string;
  precio_venta: number;
  tipo_alerta: "agotado" | "stock_bajo" | "vencido" | "por_vencer" | "normal";
  severidad: "critical" | "danger" | "warning" | "info" | "success";
}

interface AlertasProps {
  onVolver?: () => void;
}

export default function AlertasSistema({ onVolver }: AlertasProps) {
  const { token } = useAuth();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [alertasAgrupadas, setAlertasAgrupadas] = useState<any>({});
  const [estadisticas, setEstadisticas] = useState<any>({});
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("todas");

  useEffect(() => {
    if (token) {
      cargarAlertas();
    }
  }, [token, filtroTipo]);

  const cargarAlertas = async () => {
    if (!token) return;

    try {
      setCargando(true);
      const queryParams = new URLSearchParams();
      if (filtroTipo && filtroTipo !== "todas") {
        queryParams.append("tipo", filtroTipo);
      }

      const response = await fetch(`/api/farmacia/alertas?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlertas(data.alertas || []);
        setAlertasAgrupadas(data.agrupadas || {});
        setEstadisticas(data.estadisticas || {});
      }
    } catch (error) {
      console.error("Error cargando alertas:", error);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(monto);
  };

  const getIconoSeveridad = (severidad: string) => {
    switch (severidad) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "danger":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "info":
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getColorSeveridad = (severidad: string) => {
    switch (severidad) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "danger":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-orange-50 border-orange-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getBadgeSeveridad = (severidad: string) => {
    switch (severidad) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "danger":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getTextoTipo = (tipo: string) => {
    switch (tipo) {
      case "agotado":
        return "Agotado";
      case "stock_bajo":
        return "Stock Bajo";
      case "vencido":
        return "Vencido";
      case "por_vencer":
        return "Por Vencer";
      default:
        return tipo;
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sistema de Alertas
          </h1>
          <p className="text-gray-600 mt-1">
            Monitoreo de stock crítico, vencimientos y medicamentos agotados
          </p>
        </div>
        {onVolver && (
          <Button variant="outline" onClick={onVolver}>
            ← Volver al Dashboard
          </Button>
        )}
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Críticas</p>
                <p className="text-3xl font-bold text-red-600">
                  {estadisticas.critical || 0}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Peligro</p>
                <p className="text-3xl font-bold text-red-500">
                  {estadisticas.danger || 0}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Advertencia</p>
                <p className="text-3xl font-bold text-orange-500">
                  {estadisticas.warning || 0}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Información</p>
                <p className="text-3xl font-bold text-blue-500">
                  {estadisticas.info || 0}
                </p>
              </div>
              <Clock className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total</p>
                <p className="text-3xl font-bold text-gray-900">
                  {estadisticas.total || 0}
                </p>
              </div>
              <Pill className="w-10 h-10 text-gray-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Acciones */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Filter className="w-5 h-5 text-gray-600 mt-1 hidden sm:block" />
            <div className="flex flex-wrap gap-2">
              {[
                { value: "todas", label: "Todas las Alertas" },
                { value: "agotado", label: "Agotados" },
                { value: "stock_bajo", label: "Stock Bajo" },
                { value: "vencimiento", label: "Vencimientos" },
              ].map((opcion) => (
                <Button
                  key={opcion.value}
                  variant={filtroTipo === opcion.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltroTipo(opcion.value)}
                >
                  {opcion.label}
                </Button>
              ))}
            </div>
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cargarAlertas()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <div className="space-y-6">
        {estadisticas.total === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">
                ¡Excelente! No hay alertas activas
              </p>
              <p className="text-gray-500 mt-2">
                Tu inventario está en óptimas condiciones
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Alertas Críticas */}
            {alertasAgrupadas.critical && alertasAgrupadas.critical.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    Alertas Críticas ({alertasAgrupadas.critical.length})
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    Requieren atención inmediata
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertasAgrupadas.critical.map((alerta: Alerta) => (
                      <AlertaItem key={alerta.id} alerta={alerta} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alertas de Peligro */}
            {alertasAgrupadas.danger && alertasAgrupadas.danger.length > 0 && (
              <Card className="border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-red-600">
                      Alertas de Peligro ({alertasAgrupadas.danger.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertasAgrupadas.danger.map((alerta: Alerta) => (
                      <AlertaItem key={alerta.id} alerta={alerta} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alertas de Advertencia */}
            {alertasAgrupadas.warning && alertasAgrupadas.warning.length > 0 && (
              <Card className="border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="text-orange-600">
                      Advertencias ({alertasAgrupadas.warning.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertasAgrupadas.warning.map((alerta: Alerta) => (
                      <AlertaItem key={alerta.id} alerta={alerta} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alertas de Información */}
            {alertasAgrupadas.info && alertasAgrupadas.info.length > 0 && (
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="text-blue-600">
                      Información ({alertasAgrupadas.info.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertasAgrupadas.info.map((alerta: Alerta) => (
                      <AlertaItem key={alerta.id} alerta={alerta} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AlertaItem({ alerta }: { alerta: Alerta }) {
  const getAccion = (tipo: string) => {
    switch (tipo) {
      case "agotado":
        return "Reordenar inmediatamente";
      case "stock_bajo":
        return "Considerar reorden";
      case "vencido":
        return "Descartar medicamento";
      case "por_vencer":
        return "Agilizar venta o descarte";
      default:
        return "Revisar";
    }
  };

  const getBadgeSeveridad = (severidad: string) => {
    switch (severidad) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "danger":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getTextoTipo = (tipo: string) => {
    switch (tipo) {
      case "agotado":
        return "Agotado";
      case "stock_bajo":
        return "Stock Bajo";
      case "vencido":
        return "Vencido";
      case "por_vencer":
        return "Por Vencer";
      default:
        return tipo;
    }
  };

  return (
    <div className="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4 flex-1">
        <div className="mt-1">
          {alerta.severidad === "critical" && (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          {alerta.severidad === "danger" && (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          {alerta.severidad === "warning" && (
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          )}
          {alerta.severidad === "info" && (
            <Clock className="w-5 h-5 text-blue-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">
              {alerta.nombre_comercial}
            </h4>
            <Badge
              variant="outline"
              className={`text-xs ${getBadgeSeveridad(alerta.severidad)}`}
            >
              {getTextoTipo(alerta.tipo_alerta)}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 mb-2">{alerta.nombre_generico}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Stock:</span>
              <p
                className={
                  alerta.stock_actual <= alerta.stock_minimo
                    ? "text-red-600 font-semibold"
                    : ""
                }
              >
                {alerta.stock_actual}/{alerta.stock_minimo}
              </p>
            </div>
            <div>
              <span className="font-medium">Lote:</span>
              <p className="font-mono">{alerta.lote}</p>
            </div>
            <div>
              <span className="font-medium">Vencimiento:</span>
              <p>{new Date(alerta.fecha_vencimiento).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium">Acción:</span>
              <p className="font-medium text-gray-700">{getAccion(alerta.tipo_alerta)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
