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

  useEffect(() => {
    if (token) {
      cargarReporte();
    }
  }, [token, tipoReporte]);

  const cargarReporte = async () => {
    if (!token) return;

    try {
      setCargando(true);
      const queryParams = new URLSearchParams();
      queryParams.append("tipo", tipoReporte);
      if (fechaInicio) queryParams.append("fecha_inicio", fechaInicio);
      if (fechaFin) queryParams.append("fecha_fin", fechaFin);

      const response = await fetch(`/api/farmacia/reportes?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReporte(data.reporte);
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
    let filename = `reporte_${tipoReporte}`;

    if (tipoReporte === "ventas") {
      csv =
        "Fecha,Recetas Dispensadas,Medicamentos Vendidos,Ingreso Total\n";
      reporte.ventas?.forEach((venta: any) => {
        csv += `${venta.fecha},${venta.recetas_dispensadas},${venta.medicamentos_vendidos},${venta.ingreso_total}\n`;
      });
      filename = "reporte_ventas";
    } else if (tipoReporte === "recetas") {
      csv = "Estado,Cantidad,Dispensadas,Canceladas,Vencidas\n";
      reporte.recetas?.estadisticas?.forEach((stat: any) => {
        csv += `${stat.estado},${stat.cantidad},${stat.dispensadas || 0},${stat.canceladas || 0},${stat.vencidas || 0}\n`;
      });
      filename = "reporte_recetas";
    } else if (tipoReporte === "inventario") {
      csv =
        "Nombre Comercial,Forma,Concentración,Stock,Mínimo,Precio,Estado,Vence\n";
      reporte.inventario?.items?.forEach((item: any) => {
        csv += `${item.nombre_comercial},${item.forma_farmaceutica},${item.concentracion},${item.stock_actual},${item.stock_minimo},${item.precio_venta},${item.estado},${item.fecha_vencimiento}\n`;
      });
      filename = "reporte_inventario";
    }

    const blob = new Blob([csv], { type: "text/csv" });
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
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reportes y Análisis
          </h1>
          <p className="text-gray-600 mt-1">
            Análisis detallado de ventas, recetas e inventario
          </p>
        </div>
        {onVolver && (
          <Button variant="outline" onClick={onVolver}>
            ← Volver al Dashboard
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Reporte</label>
              <Select value={tipoReporte} onValueChange={setTipoReporte}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resumen">Resumen General</SelectItem>
                  <SelectItem value="ventas">Reporte de Ventas</SelectItem>
                  <SelectItem value="recetas">Reporte de Recetas</SelectItem>
                  <SelectItem value="inventario">
                    Reporte de Inventario
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Fin</label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
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
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Reporte */}
      {cargando ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Generando reporte...</p>
          </CardContent>
        </Card>
      ) : reporte ? (
        <div className="space-y-6">
          {/* Resumen */}
          {reporte.resumen && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Resumen General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">
                      Recetas Dispensadas Hoy
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {reporte.resumen.recetas_dispensadas_hoy}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-700 font-medium">
                      Items en Alerta
                    </p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      {reporte.resumen.items_alerta}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      Fecha Generación
                    </p>
                    <p className="text-sm font-bold text-green-600 mt-1">
                      {formatearFecha(reporte.resumen.fecha_generacion)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reporte de Ventas */}
          {reporte.ventas && reporte.ventas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Reporte de Ventas
                </CardTitle>
                <CardDescription>
                  Desglose de ventas por fecha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold">
                          Fecha
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          Recetas
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          Medicamentos
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          Ingreso
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.ventas.map((venta: any, idx: number) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            {formatearFecha(venta.fecha)}
                          </td>
                          <td className="text-right py-3 px-4">
                            {venta.recetas_dispensadas}
                          </td>
                          <td className="text-right py-3 px-4">
                            {venta.medicamentos_vendidos}
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-green-600">
                            {formatearMoneda(venta.ingreso_total || 0)}
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
          {reporte.recetas && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Reporte de Recetas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(reporte.recetas.resumen).map(
                    ([key, value]: [string, any]) => (
                      <div
                        key={key}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <p className="text-sm text-gray-600 font-medium capitalize">
                          {key}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {value as number}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold">
                          Estado
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          Total
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          Dispensadas
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          Canceladas
                        </th>
                        <th className="text-right py-3 px-4 font-semibold">
                          Vencidas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.recetas.estadisticas.map(
                        (stat: any, idx: number) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 capitalize font-medium">
                              {stat.estado}
                            </td>
                            <td className="text-right py-3 px-4">
                              {stat.cantidad}
                            </td>
                            <td className="text-right py-3 px-4">
                              {stat.dispensadas || 0}
                            </td>
                            <td className="text-right py-3 px-4">
                              {stat.canceladas || 0}
                            </td>
                            <td className="text-right py-3 px-4">
                              {stat.vencidas || 0}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reporte de Inventario */}
          {reporte.inventario && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Reporte de Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  {Object.entries(reporte.inventario.resumen).map(
                    ([key, value]: [string, any]) => (
                      <div
                        key={key}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <p className="text-xs text-gray-600 font-medium uppercase">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {typeof value === "number"
                            ? key === "valor_total"
                              ? formatearMoneda(value as number)
                              : (value as number)
                            : (value as string)}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-semibold">
                          Medicamento
                        </th>
                        <th className="text-left py-3 px-2 font-semibold">
                          Forma
                        </th>
                        <th className="text-center py-3 px-2 font-semibold">
                          Stock
                        </th>
                        <th className="text-right py-3 px-2 font-semibold">
                          Precio
                        </th>
                        <th className="text-center py-3 px-2 font-semibold">
                          Estado
                        </th>
                        <th className="text-left py-3 px-2 font-semibold">
                          Vence
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.inventario.items.map(
                        (item: any, idx: number) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-2 px-2 font-medium truncate">
                              {item.nombre_comercial}
                            </td>
                            <td className="py-2 px-2 text-gray-600">
                              {item.forma_farmaceutica}
                            </td>
                            <td className="text-center py-2 px-2">
                              <Badge
                                variant={
                                  item.stock_actual <= item.stock_minimo
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {item.stock_actual}
                              </Badge>
                            </td>
                            <td className="text-right py-2 px-2">
                              {formatearMoneda(item.precio_venta)}
                            </td>
                            <td className="text-center py-2 px-2">
                              <Badge
                                className={
                                  item.estado === "normal"
                                    ? "bg-green-100 text-green-800"
                                    : item.estado === "bajo"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : item.estado === "agotado"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-orange-100 text-orange-800"
                                }
                              >
                                {item.estado}
                              </Badge>
                            </td>
                            <td className="py-2 px-2 text-gray-600">
                              {formatearFecha(item.fecha_vencimiento)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Selecciona un tipo de reporte y haz clic en Generar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
