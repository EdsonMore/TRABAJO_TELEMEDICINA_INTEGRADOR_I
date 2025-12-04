// components/farmacia/gestion-boletas.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Eye, Trash2, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Boleta {
  id: string;
  numero_boleta: string;
  fecha_despacho: string;
  subtotal: number;
  igv: number;
  total: number;
  tipo_entrega: string;
  estado: string;
  boleta_pdf_path: string;
  nota_venta_pdf_path: string;
  codigo_receta: string;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
}

interface PaginacionInfo {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

interface Estadisticas {
  total_boletas: number;
  total_ventas: number;
  subtotal_total: number;
  igv_total: number;
  boletas_generadas: number;
  boletas_impresas: number;
  boletas_entregadas: number;
}

export function GestionBoletas() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [boletas, setBoletas] = useState<Boleta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [paginacion, setPaginacion] = useState<PaginacionInfo | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>("");
  const [descargando, setDescargando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  // Cargar boletas
  useEffect(() => {
    if (token) {
      cargarBoletas();
      cargarEstadisticas();
    }
  }, [token, pagina, filtroEstado, filtroFechaDesde, filtroFechaHasta]);

  const cargarBoletas = async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: "20",
      });

      if (filtroEstado) params.append("estado", filtroEstado);
      if (filtroFechaDesde) params.append("fecha_desde", filtroFechaDesde);
      if (filtroFechaHasta) params.append("fecha_hasta", filtroFechaHasta);

      const response = await fetch(`/api/farmacia/boletas/listar?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBoletas(data.boletas);
        setPaginacion(data.paginacion);
        console.log("✅ Boletas cargadas:", data.boletas.length);
      } else {
        throw new Error("Error cargando boletas");
      }
    } catch (error) {
      console.error("Error:", error);
      toast?.({
        title: "Error",
        description: "No se pudieron cargar las boletas",
        variant: "destructive",
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(`/api/farmacia/boletas/listar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accion: "estadisticas" }),
      });

      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data.estadisticas);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const descargarPDF = async (rutaPDF: string, nombreArchivo: string) => {
    try {
      // Validar que la ruta no sea nula o vacía
      if (!rutaPDF) {
        throw new Error("Ruta de archivo no disponible");
      }

      setDescargando(nombreArchivo);
      
      // Construir URL completa si es una ruta relativa
      let urlCompleta = rutaPDF;
      if (!rutaPDF.startsWith('http')) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        urlCompleta = `${origin}${rutaPDF}`;
      }
      
      const response = await fetch(urlCompleta);
      if (!response.ok) throw new Error("No se pudo descargar el archivo");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast?.({
        title: "✅ Descarga completada",
        description: `${nombreArchivo} descargado exitosamente`,
      });
    } catch (error) {
      console.error("Error descargando:", error);
      toast?.({
        title: "Error",
        description: "No se pudo descargar el archivo",
        variant: "destructive",
      });
    } finally {
      setDescargando(null);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(valor);
  };

  const getEstadoBadge = (estado: string) => {
    const clases: Record<string, string> = {
      generada: "bg-blue-100 text-blue-800",
      impresa: "bg-purple-100 text-purple-800",
      entregada: "bg-green-100 text-green-800",
    };
    return clases[estado] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Boletas</p>
            <p className="text-2xl font-bold text-gray-800">
              {estadisticas.total_boletas}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Ventas</p>
            <p className="text-2xl font-bold text-green-600">
              {formatearMoneda(estadisticas.total_ventas || 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">IGV Acumulado</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatearMoneda(estadisticas.igv_total || 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Boletas Entregadas</p>
            <p className="text-2xl font-bold text-purple-600">
              {estadisticas.boletas_entregadas}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPagina(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="generada">Generada</option>
              <option value="impresa">Impresa</option>
              <option value="entregada">Entregada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => {
                setFiltroFechaDesde(e.target.value);
                setPagina(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => {
                setFiltroFechaHasta(e.target.value);
                setPagina(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setFiltroEstado("");
            setFiltroFechaDesde("");
            setFiltroFechaHasta("");
            setPagina(1);
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Tabla de Boletas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2">Cargando boletas...</span>
          </div>
        ) : boletas.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No hay boletas disponibles
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      N° Boleta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Receta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Entrega
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {boletas.map((boleta) => (
                    <tr
                      key={boleta.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-900">
                        {boleta.numero_boleta}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="font-medium">
                          {boleta.paciente_nombre} {boleta.paciente_apellido}
                        </div>
                        <div className="text-xs text-gray-500">
                          DNI: {boleta.paciente_dni}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {boleta.codigo_receta}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatearMoneda(boleta.total)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="capitalize">
                          {boleta.tipo_entrega === "recojo"
                            ? "Recojo"
                            : "Domicilio"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatearFecha(boleta.fecha_despacho)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(
                            boleta.estado
                          )}`}
                        >
                          {boleta.estado.charAt(0).toUpperCase() +
                            boleta.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button
                          onClick={() =>
                            descargarPDF(
                              boleta.boleta_pdf_path,
                              `boleta-${boleta.numero_boleta}.pdf`
                            )
                          }
                          disabled={descargando === boleta.id || !boleta.boleta_pdf_path}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!boleta.boleta_pdf_path ? "PDF no disponible aún" : "Descargar boleta formal"}
                        >
                          {descargando === boleta.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">Boleta</span>
                        </button>

                        <button
                          onClick={() =>
                            descargarPDF(
                              boleta.nota_venta_pdf_path,
                              `nota-${boleta.numero_boleta}.pdf`
                            )
                          }
                          disabled={descargando === boleta.id + "-nota" || !boleta.nota_venta_pdf_path}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!boleta.nota_venta_pdf_path ? "PDF no disponible aún" : "Descargar nota de venta"}
                        >
                          {descargando === boleta.id + "-nota" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">Nota</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {paginacion && paginacion.totalPaginas > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Página {paginacion.pagina} de {paginacion.totalPaginas} (
                  {paginacion.total} boletas)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagina(Math.max(1, pagina - 1))}
                    disabled={pagina === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      setPagina(
                        Math.min(paginacion.totalPaginas, pagina + 1)
                      )
                    }
                    disabled={pagina === paginacion.totalPaginas}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
