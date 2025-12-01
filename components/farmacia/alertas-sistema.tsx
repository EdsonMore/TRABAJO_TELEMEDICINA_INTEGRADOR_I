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
  ArrowLeft,
  Package,
  Calendar,
  Tag,
  Box,
  AlertOctagon,
  AlertOctagon as AlertHexagon,
  AlertTriangle as AlertSquare,
  BellRing,
  Info,
  Flame,
  Skull,
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

  const calcularDiasParaVencimiento = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getIconoSeveridad = (severidad: string) => {
    switch (severidad) {
      case "critical":
        return <Flame className="w-5 h-5 text-red-600" />;
      case "danger":
        return <Skull className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getColorSeveridad = (severidad: string) => {
    switch (severidad) {
      case "critical":
        return "bg-gradient-to-br from-red-50 to-red-100 border-red-300";
      case "danger":
        return "bg-gradient-to-br from-red-50 to-orange-100 border-red-200";
      case "warning":
        return "bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200";
      case "info":
        return "bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200";
      default:
        return "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200";
    }
  };

  const getBadgeSeveridad = (severidad: string) => {
    switch (severidad) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300 shadow-sm";
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
        return "❌ Agotado";
      case "stock_bajo":
        return "⚠️ Stock Bajo";
      case "vencido":
        return "💀 Vencido";
      case "por_vencer":
        return "⏳ Por Vencer";
      default:
        return tipo;
    }
  };

  const getTipoDescripcion = (tipo: string) => {
    switch (tipo) {
      case "agotado":
        return "Stock completamente agotado";
      case "stock_bajo":
        return "Stock por debajo del mínimo establecido";
      case "vencido":
        return "Medicamento vencido";
      case "por_vencer":
        return "Por vencer en menos de 30 días";
      default:
        return "Estado normal";
    }
  };

  const getAccionRecomendada = (tipo: string) => {
    switch (tipo) {
      case "agotado":
        return "🚨 Reordenar inmediatamente";
      case "stock_bajo":
        return "📦 Considerar reorden próxima";
      case "vencido":
        return "🗑️ Descartar de inventario";
      case "por_vencer":
        return "⚡ Agilizar venta o descarte";
      default:
        return "✅ Revisar periódicamente";
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Sistema de Alertas
            </h1>
            <p className="text-gray-600 text-base">
              Monitoreo de stock crítico, vencimientos y medicamentos agotados
            </p>
          </div>
          {onVolver && (
            <Button
              variant="outline"
              onClick={onVolver}
              className="hidden sm:flex gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          )}
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700 uppercase tracking-wider">
                    Críticas
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {estadisticas.critical || 0}
                  </p>
                </div>
                <Flame className="w-8 h-8 text-red-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-700 uppercase tracking-wider">
                    Peligro
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {estadisticas.danger || 0}
                  </p>
                </div>
                <Skull className="w-8 h-8 text-orange-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-700 uppercase tracking-wider">
                    Advertencia
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {estadisticas.warning || 0}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">
                    Información
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {estadisticas.info || 0}
                  </p>
                </div>
                <Info className="w-8 h-8 text-blue-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wider">
                    Resueltas
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {estadisticas.resueltas || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {estadisticas.total || 0}
                  </p>
                </div>
                <BellRing className="w-8 h-8 text-gray-600 opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Acciones */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <p className="text-sm font-medium text-gray-700">
                  Filtrar por tipo:
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <Button
                  variant={filtroTipo === "todas" ? "default" : "outline"}
                  onClick={() => setFiltroTipo("todas")}
                  className="justify-start"
                >
                  <AlertHexagon className="w-4 h-4 mr-2" />
                  Todas
                </Button>
                <Button
                  variant={filtroTipo === "agotado" ? "default" : "outline"}
                  onClick={() => setFiltroTipo("agotado")}
                  className="justify-start bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Agotados
                </Button>
                <Button
                  variant={filtroTipo === "stock_bajo" ? "default" : "outline"}
                  onClick={() => setFiltroTipo("stock_bajo")}
                  className="justify-start bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Stock Bajo
                </Button>
                <Button
                  variant={filtroTipo === "vencido" ? "default" : "outline"}
                  onClick={() => setFiltroTipo("vencido")}
                  className="justify-start bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                >
                  <Skull className="w-4 h-4 mr-2" />
                  Vencidos
                </Button>
                <Button
                  variant={filtroTipo === "por_vencer" ? "default" : "outline"}
                  onClick={() => setFiltroTipo("por_vencer")}
                  className="justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Por Vencer
                </Button>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {estadisticas.total || 0} alertas encontradas
                </div>
                <Button
                  variant="outline"
                  onClick={cargarAlertas}
                  disabled={cargando}
                  className="gap-2"
                >
                  {cargando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido Principal */}
        {cargando ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Cargando alertas
              </h3>
              <p className="text-gray-500">Analizando inventario...</p>
            </CardContent>
          </Card>
        ) : estadisticas.total === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Excelente! 🎉
              </h3>
              <p className="text-gray-600 text-lg mb-2">
                No hay alertas activas en este momento
              </p>
              <p className="text-gray-500">
                Tu inventario está en óptimas condiciones
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Alertas Críticas */}
            {alertasAgrupadas.critical &&
              alertasAgrupadas.critical.length > 0 && (
                <Card className="border-0 shadow-sm border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-red-25">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Flame className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-red-700">
                            Alertas Críticas ({alertasAgrupadas.critical.length}
                            )
                          </CardTitle>
                          <CardDescription className="text-red-600 font-medium">
                            🚨 Requieren atención inmediata
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-red-600 text-white px-3 py-1">
                        Urgente
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {alertasAgrupadas.critical.map((alerta: Alerta) => (
                        <AlertaItemCard key={alerta.id} alerta={alerta} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Alertas de Peligro */}
            {alertasAgrupadas.danger && alertasAgrupadas.danger.length > 0 && (
              <Card className="border-0 shadow-sm border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-orange-25">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Skull className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-orange-700">
                          Alertas de Peligro ({alertasAgrupadas.danger.length})
                        </CardTitle>
                        <CardDescription className="text-orange-600 font-medium">
                          ⚠️ Atención requerida hoy
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-orange-600 text-white px-3 py-1">
                      Alta Prioridad
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {alertasAgrupadas.danger.map((alerta: Alerta) => (
                      <AlertaItemCard key={alerta.id} alerta={alerta} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alertas de Advertencia */}
            {alertasAgrupadas.warning &&
              alertasAgrupadas.warning.length > 0 && (
                <Card className="border-0 shadow-sm border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-25">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-yellow-700">
                            Advertencias ({alertasAgrupadas.warning.length})
                          </CardTitle>
                          <CardDescription className="text-yellow-600 font-medium">
                            📋 Revisar en próximos días
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-yellow-600 text-white px-3 py-1">
                        Media Prioridad
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {alertasAgrupadas.warning.map((alerta: Alerta) => (
                        <AlertaItemCard key={alerta.id} alerta={alerta} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Alertas de Información */}
            {alertasAgrupadas.info && alertasAgrupadas.info.length > 0 && (
              <Card className="border-0 shadow-sm border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-25">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Info className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-blue-700">
                          Información ({alertasAgrupadas.info.length})
                        </CardTitle>
                        <CardDescription className="text-blue-600 font-medium">
                          ℹ️ Para conocimiento y seguimiento
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-blue-600 text-white px-3 py-1">
                      Baja Prioridad
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {alertasAgrupadas.info.map((alerta: Alerta) => (
                      <AlertaItemCard key={alerta.id} alerta={alerta} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AlertaItemCard({ alerta }: { alerta: Alerta }) {
  const diasVencimiento = calcularDiasParaVencimiento(alerta.fecha_vencimiento);

  const getIconoAlerta = (tipo: string) => {
    switch (tipo) {
      case "agotado":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "stock_bajo":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "vencido":
        return <Skull className="w-5 h-5 text-red-600" />;
      case "por_vencer":
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case "agotado":
        return "bg-red-100 text-red-800 border-red-300";
      case "stock_bajo":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "vencido":
        return "bg-red-100 text-red-800 border-red-300";
      case "por_vencer":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getDescripcionTipo = (tipo: string) => {
    switch (tipo) {
      case "agotado":
        return "Stock completamente agotado";
      case "stock_bajo":
        return `Stock por debajo del mínimo (${alerta.stock_actual}/${alerta.stock_minimo})`;
      case "vencido":
        return "Medicamento vencido";
      case "por_vencer":
        return `Por vencer en ${diasVencimiento} días`;
      default:
        return "Estado normal";
    }
  };

  const getAccionRecomendada = (tipo: string) => {
    switch (tipo) {
      case "agotado":
        return "🚨 Reordenar inmediatamente";
      case "stock_bajo":
        return "📦 Considerar reorden próxima";
      case "vencido":
        return "🗑️ Descartar de inventario";
      case "por_vencer":
        return "⚡ Agilizar venta o descarte";
      default:
        return "✅ Revisar periódicamente";
    }
  };

  function calcularDiasParaVencimiento(fechaVencimiento: string) {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div
      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
        alerta.severidad === "critical"
          ? "border-red-300 bg-red-50"
          : alerta.severidad === "danger"
          ? "border-orange-300 bg-orange-50"
          : alerta.severidad === "warning"
          ? "border-yellow-300 bg-yellow-50"
          : "border-blue-300 bg-blue-50"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="mt-1">{getIconoAlerta(alerta.tipo_alerta)}</div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {alerta.nombre_comercial}
            </h3>
            <p className="text-sm text-gray-600">{alerta.nombre_generico}</p>
          </div>
        </div>
        <Badge className={`font-medium ${getColorTipo(alerta.tipo_alerta)}`}>
          {alerta.tipo_alerta === "agotado"
            ? "❌ Agotado"
            : alerta.tipo_alerta === "stock_bajo"
            ? "⚠️ Bajo"
            : alerta.tipo_alerta === "vencido"
            ? "💀 Vencido"
            : alerta.tipo_alerta === "por_vencer"
            ? "⏳ Por Vencer"
            : "Normal"}
        </Badge>
      </div>

      {/* Descripción */}
      <p className="text-sm text-gray-700 mb-4">
        {getDescripcionTipo(alerta.tipo_alerta)}
      </p>

      {/* Detalles Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Package className="w-3 h-3" />
            Stock
          </div>
          <div
            className={`font-bold text-lg ${
              alerta.stock_actual === 0
                ? "text-red-600"
                : alerta.stock_actual <= alerta.stock_minimo
                ? "text-orange-600"
                : "text-green-600"
            }`}
          >
            {alerta.stock_actual}
            <span className="text-sm text-gray-500 ml-2">
              / {alerta.stock_minimo}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            Vencimiento
          </div>
          <div className="font-medium text-gray-900">
            {formatearFecha(alerta.fecha_vencimiento)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Tag className="w-3 h-3" />
            Lote
          </div>
          <div className="font-medium text-gray-900 font-mono">
            {alerta.lote}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Box className="w-3 h-3" />
            Precio
          </div>
          <div className="font-bold text-blue-600">
            {formatearMoneda(alerta.precio_venta)}
          </div>
        </div>
      </div>

      {/* Acción Recomendada */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">
              Acción Recomendada
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {getAccionRecomendada(alerta.tipo_alerta)}
            </p>
          </div>
          <div className="text-xs text-gray-500">
            {alerta.severidad === "critical"
              ? "URGENTE"
              : alerta.severidad === "danger"
              ? "ALTA PRIORIDAD"
              : alerta.severidad === "warning"
              ? "MEDIA PRIORIDAD"
              : "BAJA PRIORIDAD"}
          </div>
        </div>
      </div>
    </div>
  );

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatearMoneda(monto: number) {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(monto);
  }
}
