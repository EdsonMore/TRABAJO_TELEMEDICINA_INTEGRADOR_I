// components/farmacia/reportes-farmacia.tsx
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Loader2,
  BarChart3,
  FileText,
  Package,
  TrendingUp,
  RefreshCw,
  Calendar,
  ArrowLeft,
  PieChart,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface ReporteProps {
  onVolver?: () => void;
}

export default function ReportesFarmacia({ onVolver }: ReporteProps) {
  const { token } = useAuth();
  const [tipoReporte, setTipoReporte] = useState("resumen");
  const [reporte, setReporte] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Fechas por defecto (últimos 30 días)
  useEffect(() => {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    setFechaInicio(hace30Dias.toISOString().split("T")[0]);
    setFechaFin(hoy.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (token && fechaInicio && fechaFin) {
      cargarReporte();
    }
  }, [token, tipoReporte, fechaInicio, fechaFin]);

  const cargarReporte = async () => {
    if (!token) return;

    try {
      setCargando(true);
      const queryParams = new URLSearchParams();
      queryParams.append("tipo", tipoReporte);
      if (fechaInicio) queryParams.append("fecha_inicio", fechaInicio);
      if (fechaFin) queryParams.append("fecha_fin", fechaFin);

      const response = await fetch(`/api/farmacia/reportes?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReporte(data.reporte || data);
      }
    } catch (error) {
      console.error("Error cargando reporte:", error);
    } finally {
      setCargando(false);
    }
  };

  const descargarCSV = () => {
    if (!reporte) return;

    let csv = "";
    let filename = `reporte_${tipoReporte}_${
      new Date().toISOString().split("T")[0]
    }`;

    if (tipoReporte === "ventas") {
      csv = "Fecha,Recetas,Medicamentos,Ingreso Total\n";
      reporte.ventas?.forEach((venta: any) => {
        csv += `${venta.fecha},${venta.recetas_dispensadas || 0},${
          venta.medicamentos_vendidos || 0
        },${venta.ingreso_total || 0}\n`;
      });
    } else if (tipoReporte === "recetas") {
      csv = "Estado,Total,Dispensadas,Canceladas,Vencidas\n";
      reporte.estadisticas?.forEach((stat: any) => {
        csv += `${stat.estado},${stat.cantidad},${stat.dispensadas || 0},${
          stat.canceladas || 0
        },${stat.vencidas || 0}\n`;
      });
    } else if (tipoReporte === "inventario") {
      csv =
        "Medicamento,Forma,Concentración,Stock Actual,Stock Mínimo,Precio,Estado,Vencimiento\n";
      reporte.items?.forEach((item: any) => {
        csv += `${item.nombre_comercial},${item.forma_farmaceutica},${
          item.concentracion
        },${item.stock_actual},${item.stock_minimo},${item.precio_venta},${
          item.estado_stock || item.estado
        },${item.fecha_vencimiento}\n`;
      });
    } else if (tipoReporte === "resumen") {
      csv = "Métrica,Valor\n";
      if (reporte.resumen) {
        Object.entries(reporte.resumen).forEach(([key, value]) => {
          csv += `${key.replace(/_/g, " ")},${value}\n`;
        });
      }
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "normal":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Normal
          </Badge>
        );
      case "bajo":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Bajo
          </Badge>
        );
      case "agotado":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Agotado
          </Badge>
        );
      case "por_vencer":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <Clock className="w-3 h-3 mr-1" /> Por Vencer
          </Badge>
        );
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getTituloReporte = () => {
    switch (tipoReporte) {
      case "resumen":
        return "📊 Resumen General";
      case "ventas":
        return "💰 Reporte de Ventas";
      case "recetas":
        return "📄 Reporte de Recetas";
      case "inventario":
        return "📦 Reporte de Inventario";
      default:
        return "Reporte";
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Reportes y Análisis
            </h1>
            <p className="text-gray-600 text-base">
              Análisis detallado de ventas, recetas e inventario
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

        {/* Filtros */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Select value={tipoReporte} onValueChange={setTipoReporte}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tipo de Reporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="resumen"
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" /> Resumen General
                    </SelectItem>
                    <SelectItem
                      value="ventas"
                      className="flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" /> Ventas
                    </SelectItem>
                    <SelectItem
                      value="recetas"
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> Recetas
                    </SelectItem>
                    <SelectItem
                      value="inventario"
                      className="flex items-center gap-2"
                    >
                      <Package className="w-4 h-4" /> Inventario
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fecha Inicio
                  </label>
                  <Input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fecha Fin
                  </label>
                  <Input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={cargarReporte}
                    disabled={cargando}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {cargando ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Generar
                  </Button>
                  <Button
                    onClick={descargarCSV}
                    disabled={!reporte || cargando}
                    variant="outline"
                    title="Descargar CSV"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenido del Reporte */}
        {cargando ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Generando Reporte
              </h3>
              <p className="text-gray-500">Por favor, espere un momento...</p>
            </CardContent>
          </Card>
        ) : reporte ? (
          <div className="space-y-6">
            {/* Header del Reporte */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {getTituloReporte()}
                </h2>
                <p className="text-gray-600 text-sm">
                  Período: {formatearFecha(fechaInicio)} -{" "}
                  {formatearFecha(fechaFin)}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Generado:{" "}
                {new Date().toLocaleDateString("es-PE", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {/* Resumen General */}
            {tipoReporte === "resumen" && reporte.resumen && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Recetas Hoy
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {reporte.resumen.recetas_dispensadas_hoy || 0}
                        </p>
                      </div>
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Ventas Hoy
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatearMoneda(reporte.resumen.ingreso_hoy || 0)}
                        </p>
                      </div>
                      <ShoppingCart className="w-6 h-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Stock Bajo
                        </p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {reporte.resumen.items_stock_bajo || 0}
                        </p>
                      </div>
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Por Vencer
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {reporte.resumen.items_por_vencer || 0}
                        </p>
                      </div>
                      <Clock className="w-6 h-6 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Recetas Pend.
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                          {reporte.resumen.recetas_pendientes || 0}
                        </p>
                      </div>
                      <FileText className="w-6 h-6 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Agotados
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {reporte.resumen.items_agotados || 0}
                        </p>
                      </div>
                      <Package className="w-6 h-6 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Reporte de Ventas */}
            {tipoReporte === "ventas" && reporte.ventas && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Reporte de Ventas
                      </CardTitle>
                      <CardDescription>
                        Desglose de ventas diarias en el período seleccionado
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Vendido</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatearMoneda(
                          reporte.ventas.reduce(
                            (sum: number, v: any) =>
                              sum + (v.ingreso_total || 0),
                            0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-4 px-4 font-bold text-gray-700">
                            Fecha
                          </th>
                          <th className="text-center py-4 px-4 font-bold text-gray-700">
                            Recetas
                          </th>
                          <th className="text-center py-4 px-4 font-bold text-gray-700">
                            Medicamentos
                          </th>
                          <th className="text-right py-4 px-4 font-bold text-gray-700">
                            Ingreso
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporte.ventas.map((venta: any, idx: number) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">
                                  {formatearFecha(venta.fecha)}
                                </span>
                              </div>
                            </td>
                            <td className="text-center py-4 px-4">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700"
                              >
                                {venta.recetas_dispensadas || 0}
                              </Badge>
                            </td>
                            <td className="text-center py-4 px-4">
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700"
                              >
                                {venta.medicamentos_vendidos || 0}
                              </Badge>
                            </td>
                            <td className="text-right py-4 px-4">
                              <div className="font-bold text-lg text-green-600">
                                {formatearMoneda(venta.ingreso_total || 0)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reporte de Recetas */}
            {tipoReporte === "recetas" && reporte && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6">
                      <div className="text-center space-y-2">
                        <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Total Recetas
                        </p>
                        <p className="text-3xl font-bold text-blue-600">
                          {reporte.total || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6">
                      <div className="text-center space-y-2">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Dispensadas
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          {reporte.dispensadas || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-6">
                      <div className="text-center space-y-2">
                        <XCircle className="w-8 h-8 text-red-600 mx-auto" />
                        <p className="text-xs text-gray-600 uppercase tracking-wider">
                          Canceladas
                        </p>
                        <p className="text-3xl font-bold text-red-600">
                          {reporte.canceladas || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PieChart className="w-5 h-5 text-purple-600" />
                      Distribución por Estado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-4 px-4 font-bold text-gray-700">
                              Estado
                            </th>
                            <th className="text-center py-4 px-4 font-bold text-gray-700">
                              Cantidad
                            </th>
                            <th className="text-center py-4 px-4 font-bold text-gray-700">
                              Dispensadas
                            </th>
                            <th className="text-center py-4 px-4 font-bold text-gray-700">
                              Canceladas
                            </th>
                            <th className="text-center py-4 px-4 font-bold text-gray-700">
                              Vencidas
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporte.estadisticas?.map(
                            (stat: any, idx: number) => (
                              <tr
                                key={idx}
                                className="border-b border-gray-100 hover:bg-purple-50 transition-colors"
                              >
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <Badge className="capitalize">
                                      {stat.estado === "pendiente"
                                        ? "⏳ Pendiente"
                                        : stat.estado === "en_proceso"
                                        ? "⚙️ En Proceso"
                                        : stat.estado === "dispensada"
                                        ? "✓ Dispensada"
                                        : stat.estado === "cancelada"
                                        ? "✗ Cancelada"
                                        : stat.estado}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="text-center py-4 px-4">
                                  <span className="font-bold text-lg">
                                    {stat.cantidad}
                                  </span>
                                </td>
                                <td className="text-center py-4 px-4">
                                  <Badge className="bg-green-100 text-green-800">
                                    {stat.dispensadas || 0}
                                  </Badge>
                                </td>
                                <td className="text-center py-4 px-4">
                                  <Badge className="bg-red-100 text-red-800">
                                    {stat.canceladas || 0}
                                  </Badge>
                                </td>
                                <td className="text-center py-4 px-4">
                                  <Badge className="bg-orange-100 text-orange-800">
                                    {stat.vencidas || 0}
                                  </Badge>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Reporte de Inventario */}
            {tipoReporte === "inventario" && reporte && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-4">
                      <div className="text-center space-y-1">
                        <Package className="w-6 h-6 text-blue-600 mx-auto" />
                        <p className="text-xs text-gray-600">Total Items</p>
                        <p className="text-xl font-bold text-blue-600">
                          {reporte.total || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-4">
                      <div className="text-center space-y-1">
                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                        <p className="text-xs text-gray-600">Normal</p>
                        <p className="text-xl font-bold text-green-600">
                          {reporte.normal || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardContent className="p-4">
                      <div className="text-center space-y-1">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 mx-auto" />
                        <p className="text-xs text-gray-600">Stock Bajo</p>
                        <p className="text-xl font-bold text-yellow-600">
                          {reporte.bajo || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="p-4">
                      <div className="text-center space-y-1">
                        <XCircle className="w-6 h-6 text-red-600 mx-auto" />
                        <p className="text-xs text-gray-600">Agotados</p>
                        <p className="text-xl font-bold text-red-600">
                          {reporte.agotado || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="p-4">
                      <div className="text-center space-y-1">
                        <Clock className="w-6 h-6 text-orange-600 mx-auto" />
                        <p className="text-xs text-gray-600">Por Vencer</p>
                        <p className="text-xl font-bold text-orange-600">
                          {reporte.por_vencer || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-4">
                      <div className="text-center space-y-1">
                        <ShoppingCart className="w-6 h-6 text-purple-600 mx-auto" />
                        <p className="text-xs text-gray-600">Valor Total</p>
                        <p className="text-sm font-bold text-purple-600">
                          {formatearMoneda(reporte.valor_total || 0)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="w-5 h-5 text-gray-600" />
                      Detalle del Inventario
                    </CardTitle>
                    <CardDescription>
                      {reporte.items?.length || 0} items en inventario
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-4 px-4 font-bold text-gray-700">
                              Medicamento
                            </th>
                            <th className="text-center py-4 px-4 font-bold text-gray-700">
                              Forma
                            </th>
                            <th className="text-center py-4 px-4 font-bold text-gray-700">
                              Stock
                            </th>
                            <th className="text-center py-4 px-4 font-bold text-gray-700">
                              Precio
                            </th>
                            <th className="text-center py-4 px-4 font-bold text-gray-700">
                              Estado
                            </th>
                            <th className="text-center py-4 px-4 font-bold text-gray-700">
                              Vencimiento
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporte.items?.map((item: any, idx: number) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {item.nombre_comercial}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.nombre_generico}
                                  </p>
                                </div>
                              </td>
                              <td className="text-center py-4 px-4 text-gray-700">
                                {item.forma_farmaceutica}
                              </td>
                              <td className="text-center py-4 px-4">
                                <div className="flex flex-col items-center">
                                  <span
                                    className={`font-bold text-lg ${
                                      item.stock_actual <= item.stock_minimo
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {item.stock_actual}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    mín: {item.stock_minimo}
                                  </span>
                                </div>
                              </td>
                              <td className="text-center py-4 px-4 font-bold text-blue-600">
                                {formatearMoneda(item.precio_venta)}
                              </td>
                              <td className="text-center py-4 px-4">
                                {getEstadoBadge(
                                  item.estado_stock || item.estado
                                )}
                              </td>
                              <td className="text-center py-4 px-4">
                                <div className="flex flex-col items-center">
                                  <span className="font-medium text-gray-900">
                                    {formatearFecha(item.fecha_vencimiento)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {calcularDiasParaVencimiento(
                                      item.fecha_vencimiento
                                    )}{" "}
                                    días
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <BarChart3 className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Selecciona un tipo de reporte
              </h3>
              <p className="text-gray-500 mb-6">
                Elige entre Resumen, Ventas, Recetas o Inventario para generar
                tu reporte
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-2xl mx-auto">
                <Button
                  variant="outline"
                  onClick={() => setTipoReporte("resumen")}
                  className="flex flex-col items-center justify-center h-24"
                >
                  <BarChart3 className="w-8 h-8 mb-2 text-blue-600" />
                  <span>Resumen</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTipoReporte("ventas")}
                  className="flex flex-col items-center justify-center h-24"
                >
                  <TrendingUp className="w-8 h-8 mb-2 text-green-600" />
                  <span>Ventas</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTipoReporte("recetas")}
                  className="flex flex-col items-center justify-center h-24"
                >
                  <FileText className="w-8 h-8 mb-2 text-purple-600" />
                  <span>Recetas</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTipoReporte("inventario")}
                  className="flex flex-col items-center justify-center h-24"
                >
                  <Package className="w-8 h-8 mb-2 text-orange-600" />
                  <span>Inventario</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // Función auxiliar para calcular días hasta vencimiento
  function calcularDiasParaVencimiento(fechaVencimiento: string) {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
