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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  BarChart3,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  ArrowLeft,
  MoreVertical,
  Pill,
  Calendar,
  Tag,
  Box,
  Building,
  Package2,
} from "lucide-react";

// Interfaces
interface ItemInventario {
  id: string;
  nombre_comercial: string;
  nombre_generico: string;
  forma_farmaceutica: string;
  concentracion: string;
  categoria_terapeutica: string;
  principio_activo: string;
  laboratorio: string;
  lote: string;
  stock_actual: number;
  stock_minimo: number;
  precio_venta: number;
  fecha_vencimiento: string;
  estado_stock: "normal" | "bajo" | "agotado" | "por_vencer";
  disponible: boolean;
  fecha_actualizacion: string;
}

interface MedicamentoCatalogo {
  id: number;
  nombre_comercial: string;
  nombre_generico: string;
  forma_farmaceutica: string;
  concentracion: string;
  categoria_terapeutica: string;
  principio_activo: string;
  laboratorio: string;
}

interface GestionInventarioProps {
  onVolver?: () => void;
}

export default function GestionInventario({
  onVolver,
}: GestionInventarioProps) {
  const { token } = useAuth();

  // Estados principales
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [inventarioFiltrado, setInventarioFiltrado] = useState<
    ItemInventario[]
  >([]);
  const [cargandoInventario, setCargandoInventario] = useState(true);

  // Estados para filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroStock, setFiltroStock] = useState("todos");

  // Estados para modales y formularios
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemInventario | null>(null);
  const [catalogoMedicamentos, setCatalogoMedicamentos] = useState<
    MedicamentoCatalogo[]
  >([]);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mostrarAcciones, setMostrarAcciones] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    medicamento_id: "",
    lote: "",
    stock_actual: 0,
    stock_minimo: 10,
    precio_venta: 0,
    fecha_vencimiento: "",
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    if (token) {
      cargarInventario();
      cargarCatalogoMedicamentos();
    }
  }, [token]);

  // Filtrar inventario cuando cambien los filtros
  useEffect(() => {
    filtrarInventario();
  }, [inventario, busqueda, filtroCategoria, filtroEstado, filtroStock]);

  // ========== FUNCIONES PRINCIPALES ==========

  const cargarInventario = async () => {
    if (!token) return;

    try {
      setCargandoInventario(true);

      const queryParams = new URLSearchParams();
      if (filtroCategoria && filtroCategoria !== "todas")
        queryParams.append("categoria", filtroCategoria);
      if (filtroEstado && filtroEstado !== "todos")
        queryParams.append("estado", filtroEstado);

      const response = await fetch(`/api/farmacia/inventario?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInventario(data.inventario || []);
      } else {
        console.error("Error cargando inventario:", await response.text());
      }
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setCargandoInventario(false);
    }
  };

  const cargarCatalogoMedicamentos = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/medicamentos?limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCatalogoMedicamentos(data.medicamentos || []);
      }
    } catch (error) {
      console.error("Error cargando catálogo:", error);
    }
  };

  const filtrarInventario = () => {
    let filtrados = inventario;

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(
        (item) =>
          item.nombre_comercial.toLowerCase().includes(busquedaLower) ||
          item.nombre_generico.toLowerCase().includes(busquedaLower) ||
          item.lote.toLowerCase().includes(busquedaLower) ||
          item.principio_activo.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por categoría
    if (filtroCategoria && filtroCategoria !== "todas") {
      filtrados = filtrados.filter(
        (item) => item.categoria_terapeutica === filtroCategoria
      );
    }

    // Filtro por estado de stock
    if (filtroEstado && filtroEstado !== "todos") {
      filtrados = filtrados.filter(
        (item) => item.estado_stock === filtroEstado
      );
    }

    // Filtro por nivel de stock
    if (filtroStock && filtroStock !== "todos") {
      if (filtroStock === "bajo") {
        filtrados = filtrados.filter(
          (item) => item.stock_actual <= item.stock_minimo
        );
      } else if (filtroStock === "agotado") {
        filtrados = filtrados.filter((item) => item.stock_actual === 0);
      } else if (filtroStock === "normal") {
        filtrados = filtrados.filter(
          (item) => item.stock_actual > item.stock_minimo
        );
      }
    }

    setInventarioFiltrado(filtrados);
  };

  const agregarItemInventario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setProcesando("agregando");

      const response = await fetch("/api/farmacia/inventario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await cargarInventario();
        setMostrarModalAgregar(false);
        resetForm();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al agregar medicamento");
      }
    } catch (error) {
      console.error("Error agregando medicamento:", error);
      alert("Error al agregar medicamento");
    } finally {
      setProcesando(null);
    }
  };

  const actualizarItemInventario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !itemEditando) return;

    try {
      setProcesando("editando");

      const response = await fetch(
        `/api/farmacia/inventario/${itemEditando.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        await cargarInventario();
        setMostrarModalEditar(false);
        resetForm();
        setItemEditando(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al actualizar medicamento");
      }
    } catch (error) {
      console.error("Error actualizando medicamento:", error);
      alert("Error al actualizar medicamento");
    } finally {
      setProcesando(null);
    }
  };

  const eliminarItemInventario = async (id: string) => {
    if (
      !token ||
      !confirm("¿Está seguro de que desea eliminar este item del inventario?")
    ) {
      return;
    }

    try {
      setProcesando(`eliminando-${id}`);

      const response = await fetch(`/api/farmacia/inventario/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await cargarInventario();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al eliminar medicamento");
      }
    } catch (error) {
      console.error("Error eliminando medicamento:", error);
      alert("Error al eliminar medicamento");
    } finally {
      setProcesando(null);
    }
  };

  const actualizarStock = async (id: string, nuevoStock: number) => {
    if (!token) return;

    try {
      setProcesando(`stock-${id}`);

      const response = await fetch(`/api/farmacia/inventario/${id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock_actual: nuevoStock }),
      });

      if (response.ok) {
        await cargarInventario();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al actualizar stock");
      }
    } catch (error) {
      console.error("Error actualizando stock:", error);
      alert("Error al actualizar stock");
    } finally {
      setProcesando(null);
    }
  };

  const resetForm = () => {
    setFormData({
      medicamento_id: "",
      lote: "",
      stock_actual: 0,
      stock_minimo: 10,
      precio_venta: 0,
      fecha_vencimiento: "",
    });
  };

  const abrirModalEditar = (item: ItemInventario) => {
    setItemEditando(item);
    setFormData({
      medicamento_id: item.id,
      lote: item.lote,
      stock_actual: item.stock_actual,
      stock_minimo: item.stock_minimo,
      precio_venta: item.precio_venta,
      fecha_vencimiento: item.fecha_vencimiento.split("T")[0],
    });
    setMostrarModalEditar(true);
  };

  // ========== FUNCIONES DE UTILIDAD ==========

  const getEstadoBadge = (estado: string) => {
    const configs = {
      normal: {
        label: "Normal",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 border-green-200",
      },
      bajo: {
        label: "Stock Bajo",
        icon: AlertTriangle,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      agotado: {
        label: "Agotado",
        icon: XCircle,
        className: "bg-red-100 text-red-800 border-red-200",
      },
      por_vencer: {
        label: "Por Vencer",
        icon: Clock,
        className: "bg-orange-100 text-orange-800 border-orange-200",
      },
    };

    const config = configs[estado as keyof typeof configs] || configs.normal;
    const IconComponent = config.icon;

    return (
      <Badge
        variant="outline"
        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium ${config.className}`}
      >
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const calcularDiasParaVencimiento = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAlertaVencimiento = (fechaVencimiento: string) => {
    const dias = calcularDiasParaVencimiento(fechaVencimiento);

    if (dias < 0) {
      return {
        tipo: "vencido",
        texto: "Vencido",
        clase: "bg-red-100 text-red-700",
      };
    } else if (dias <= 30) {
      return {
        tipo: "critico",
        texto: `${dias}d`,
        clase: "bg-red-50 text-red-600",
      };
    } else if (dias <= 90) {
      return {
        tipo: "advertencia",
        texto: `${dias}d`,
        clase: "bg-orange-50 text-orange-600",
      };
    } else {
      return {
        tipo: "normal",
        texto: `${dias}d`,
        clase: "bg-green-50 text-green-600",
      };
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
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const getStockColor = (actual: number, minimo: number) => {
    if (actual === 0) return "text-red-600";
    if (actual <= minimo) return "text-yellow-600";
    return "text-green-600";
  };

  // ========== ESTADÍSTICAS ==========
  const estadisticas = {
    total: inventario.length,
    agotados: inventario.filter((item) => item.estado_stock === "agotado")
      .length,
    stockBajo: inventario.filter((item) => item.estado_stock === "bajo").length,
    porVencer: inventario.filter((item) => {
      const dias = calcularDiasParaVencimiento(item.fecha_vencimiento);
      return dias <= 30 && dias >= 0;
    }).length,
    vencidos: inventario.filter((item) => {
      const dias = calcularDiasParaVencimiento(item.fecha_vencimiento);
      return dias < 0;
    }).length,
    valorTotal: inventario.reduce(
      (total, item) => total + item.stock_actual * item.precio_venta,
      0
    ),
  };

  const categoriasUnicas = [
    ...new Set(inventario.map((item) => item.categoria_terapeutica)),
  ];

  // ========== RENDERIZADO ==========
  return (
    <div className="w-full min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Inventario
            </h1>
            <p className="text-sm text-gray-600">
              Control y administración de stock de medicamentos
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
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Items
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {estadisticas.total}
                  </p>
                </div>
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Stock Bajo
                  </p>
                  <p className="text-xl font-bold text-yellow-600">
                    {estadisticas.stockBajo}
                  </p>
                </div>
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Agotados</p>
                  <p className="text-xl font-bold text-red-600">
                    {estadisticas.agotados}
                  </p>
                </div>
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Por Vencer
                  </p>
                  <p className="text-xl font-bold text-orange-600">
                    {estadisticas.porVencer}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Vencidos</p>
                  <p className="text-xl font-bold text-red-600">
                    {estadisticas.vencidos}
                  </p>
                </div>
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Valor Total
                  </p>
                  <p className="text-sm font-bold text-green-600">
                    {formatearMoneda(estadisticas.valorTotal)}
                  </p>
                </div>
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Búsqueda */}
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar medicamento, lote..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <Select
                  value={filtroCategoria}
                  onValueChange={setFiltroCategoria}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {categoriasUnicas.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="agotado">Agotado</SelectItem>
                    <SelectItem value="por_vencer">Por Vencer</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filtroStock} onValueChange={setFiltroStock}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="agotado">Agotado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-2 w-full lg:w-auto">
                <Button
                  variant="outline"
                  onClick={cargarInventario}
                  disabled={cargandoInventario}
                  className="flex items-center gap-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      cargandoInventario ? "animate-spin" : ""
                    }`}
                  />
                  Actualizar
                </Button>

                <Button
                  onClick={() => setMostrarModalAgregar(true)}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Inventario */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventario de Medicamentos</CardTitle>
                <CardDescription>
                  {inventarioFiltrado.length} items encontrados
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Última actualización: {new Date().toLocaleDateString("es-PE")}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cargandoInventario ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Cargando inventario...</p>
              </div>
            ) : inventarioFiltrado.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-500 mb-6">
                  Intenta con otros términos de búsqueda o filtros
                </p>
                <Button
                  onClick={() => {
                    setBusqueda("");
                    setFiltroCategoria("todas");
                    setFiltroEstado("todos");
                    setFiltroStock("todos");
                  }}
                  variant="outline"
                  className="mr-2"
                >
                  Limpiar filtros
                </Button>
                <Button
                  onClick={() => setMostrarModalAgregar(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {inventarioFiltrado.map((item) => {
                  const alertaVencimiento = getAlertaVencimiento(
                    item.fecha_vencimiento
                  );
                  const diasVencimiento = calcularDiasParaVencimiento(
                    item.fecha_vencimiento
                  );

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white relative overflow-hidden group"
                    >
                      {/* Estado y Acciones */}
                      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                        {getEstadoBadge(item.estado_stock)}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setMostrarAcciones(
                                mostrarAcciones === item.id ? null : item.id
                              )
                            }
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>

                          {mostrarAcciones === item.id && (
                            <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-1">
                              <button
                                onClick={() => {
                                  const nuevoStock = prompt(
                                    "Nuevo stock:",
                                    item.stock_actual.toString()
                                  );
                                  if (
                                    nuevoStock !== null &&
                                    !isNaN(parseInt(nuevoStock))
                                  ) {
                                    actualizarStock(
                                      item.id,
                                      parseInt(nuevoStock)
                                    );
                                    setMostrarAcciones(null);
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                              >
                                <Package2 className="w-4 h-4" />
                                Actualizar Stock
                              </button>
                              <button
                                onClick={() => {
                                  abrirModalEditar(item);
                                  setMostrarAcciones(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Editar Item
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      "¿Eliminar este item del inventario?"
                                    )
                                  ) {
                                    eliminarItemInventario(item.id);
                                    setMostrarAcciones(null);
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Header del Medicamento */}
                      <div className="p-4 pb-3 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {item.nombre_comercial}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {item.nombre_generico}
                            </p>
                          </div>
                          <div
                            className={`text-xs font-medium px-2 py-1 rounded-full ${alertaVencimiento.clase}`}
                          >
                            {diasVencimiento < 0
                              ? "Vencido"
                              : `${diasVencimiento}d`}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {item.categoria_terapeutica}
                        </div>
                      </div>

                      {/* Información del Medicamento */}
                      <div className="p-4">
                        {/* Fila 1: Información básica */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Pill className="w-3 h-3" />
                              Concentración
                            </div>
                            <p className="font-medium text-gray-900">
                              {item.concentracion}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Box className="w-3 h-3" />
                              Forma
                            </div>
                            <p className="font-medium text-gray-900">
                              {item.forma_farmaceutica}
                            </p>
                          </div>
                        </div>

                        {/* Fila 2: Lote y Laboratorio */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Package className="w-3 h-3" />
                              Lote
                            </div>
                            <p className="font-medium text-gray-900 font-mono text-sm">
                              {item.lote}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Building className="w-3 h-3" />
                              Laboratorio
                            </div>
                            <p className="font-medium text-gray-900">
                              {item.laboratorio}
                            </p>
                          </div>
                        </div>

                        {/* Fila 3: Stock y Precio */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Package2 className="w-3 h-3" />
                              Stock
                            </div>
                            <div className="flex items-baseline gap-2">
                              <p
                                className={`font-bold text-lg ${getStockColor(
                                  item.stock_actual,
                                  item.stock_minimo
                                )}`}
                              >
                                {item.stock_actual}
                              </p>
                              <span className="text-sm text-gray-500">
                                / {item.stock_minimo} und.
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Tag className="w-3 h-3" />
                              Precio
                            </div>
                            <p className="font-bold text-blue-600 text-lg">
                              {formatearMoneda(item.precio_venta)}
                            </p>
                          </div>
                        </div>

                        {/* Fila 4: Vencimiento */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              Vencimiento
                            </div>
                            <p className="font-medium text-gray-900">
                              {formatearFecha(item.fecha_vencimiento)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Actualizado:{" "}
                            {formatearFecha(item.fecha_actualizacion)}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => {
                                const nuevoStock = prompt(
                                  "Nuevo stock:",
                                  item.stock_actual.toString()
                                );
                                if (
                                  nuevoStock !== null &&
                                  !isNaN(parseInt(nuevoStock))
                                ) {
                                  actualizarStock(
                                    item.id,
                                    parseInt(nuevoStock)
                                  );
                                }
                              }}
                              disabled={procesando === `stock-${item.id}`}
                            >
                              {procesando === `stock-${item.id}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Stock"
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => abrirModalEditar(item)}
                            >
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modales (mantener igual que antes) */}
        <Dialog
          open={mostrarModalAgregar}
          onOpenChange={setMostrarModalAgregar}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar al Inventario</DialogTitle>
            </DialogHeader>
            <form onSubmit={agregarItemInventario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medicamento *</label>
                  <Select
                    value={formData.medicamento_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, medicamento_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar medicamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogoMedicamentos.map((med) => (
                        <SelectItem key={med.id} value={med.id.toString()}>
                          {med.nombre_comercial} - {med.nombre_generico}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Lote *</label>
                  <Input
                    value={formData.lote}
                    onChange={(e) =>
                      setFormData({ ...formData, lote: e.target.value })
                    }
                    placeholder="Número de lote"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Actual *</label>
                  <Input
                    type="number"
                    value={formData.stock_actual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_actual: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Mínimo *</label>
                  <Input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_minimo: parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Precio de Venta (S/) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_venta}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio_venta: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Fecha de Vencimiento *
                  </label>
                  <Input
                    type="date"
                    value={formData.fecha_vencimiento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fecha_vencimiento: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMostrarModalAgregar(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={procesando === "agregando"}
                >
                  {procesando === "agregando" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Agregar al Inventario
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={mostrarModalEditar} onOpenChange={setMostrarModalEditar}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Item de Inventario</DialogTitle>
            </DialogHeader>
            <form onSubmit={actualizarItemInventario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lote *</label>
                  <Input
                    value={formData.lote}
                    onChange={(e) =>
                      setFormData({ ...formData, lote: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Actual *</label>
                  <Input
                    type="number"
                    value={formData.stock_actual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_actual: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Mínimo *</label>
                  <Input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_minimo: parseInt(e.target.value) || 0,
                      })
                    }
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Precio de Venta (S/) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_venta}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio_venta: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Fecha de Vencimiento *
                  </label>
                  <Input
                    type="date"
                    value={formData.fecha_vencimiento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fecha_vencimiento: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMostrarModalEditar(false);
                    resetForm();
                    setItemEditando(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={procesando === "editando"}
                >
                  {procesando === "editando" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Actualizar Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
