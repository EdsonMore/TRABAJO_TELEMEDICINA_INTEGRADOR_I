// components/paciente/SeleccionFarmaciasView.tsx - VERSIÓN MEJORADA COMO VISTA COMPLETA
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin,
  Pill,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  LoaderCircle,
  Truck,
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  Search,
  Filter,
  X,
  Package2,
  Home,
  MapPinCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Medicamento {
  medicamento_id: number;
  nombre_comercial: string;
  nombre_generico: string;
  cantidad_requerida: number;
  stock_disponible: number;
  precio_unitario: number | null;
  subtotal: number;
  disponible: boolean;
  motivo?: string;
  seleccionado?: boolean;
  cantidad_seleccionada?: number;
}

interface Farmacia {
  farmacia_id: string;
  nombre_farmacia: string;
  ruc: string;
  ubicacion: {
    direccion: string;
    departamento: string;
    provincia: string;
    distrito: string;
    codigo_postal: string;
  };
  distancia_km: number;
  delivery: {
    disponible: boolean;
    radio_km: number;
    puede_entregar: boolean;
  };
  disponibilidad: {
    todos_disponibles: boolean;
    medicamentos_disponibles: number;
    medicamentos_faltantes: number;
    porcentaje: number;
  };
  precio: {
    total: number | null;
    moneda: string;
    nota: string;
  };
  medicamentos: Medicamento[];
  calificacion: string;
}

interface CarritoItem {
  farmacia_id: string;
  nombre_farmacia: string;
  medicamentos: {
    medicamento_id: number;
    nombre_comercial: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }[];
  total: number;
}

interface SeleccionFarmaciasViewProps {
  recetaId: string;
  onClose: () => void;
  onFarmaciaSeleccionada: (farmaciaId: string, nombreFarmacia: string) => void;
  onCarritoConfirmado?: (carrito: CarritoItem[]) => void;
}

export default function SeleccionFarmaciasView({
  recetaId,
  onClose,
  onFarmaciaSeleccionada,
  onCarritoConfirmado,
}: SeleccionFarmaciasViewProps) {
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [farmaciasFiltradas, setFarmaciasFiltradas] = useState<Farmacia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [modoCompra, setModoCompra] = useState<"simple" | "avanzado">(
    "avanzado"
  );
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState({
    delivery: false,
    stockCompleto: false,
    distancia: "todas",
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const { token: authToken } = useAuth();

  // Estado para modal de entrega
  const [mostrarModalEntrega, setMostrarModalEntrega] = useState(false);
  const [tipoEntregaSeleccionado, setTipoEntregaSeleccionado] = useState<
    "recojo" | "domicilio"
  >("recojo");
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [farmaciaParaEnviar, setFarmaciaParaEnviar] = useState<{
    farmaciaId: string;
    nombreFarmacia: string;
  } | null>(null);
  const [costoEntrega, setCostoEntrega] = useState(15);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUbicacionUsuario({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    cargarFarmaciasDisponibles();
  }, [ubicacionUsuario]);

  useEffect(() => {
    aplicarFiltrosYBusqueda();
  }, [farmacias, busqueda, filtros]);

  const cargarFarmaciasDisponibles = async () => {
    try {
      setCargando(true);
      setError(null);
      const token =
        authToken ||
        localStorage.getItem("medilink_token") ||
        localStorage.getItem("token");

      const params = new URLSearchParams();
      if (ubicacionUsuario) {
        params.set("lat", ubicacionUsuario.lat.toString());
        params.set("lng", ubicacionUsuario.lng.toString());
      }
      const qs = params.toString();

      const response = await fetch(
        `/api/recetas/${recetaId}/farmacias-disponibles${qs ? `?${qs}` : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        let msg = "Error al cargar farmacias disponibles";
        try {
          const errBody = await response.json();
          msg = errBody?.error || errBody?.message || msg;
        } catch (e) {}
        throw new Error(msg);
      }

      const data = await response.json();
      const opciones = data.opciones || [];

      const opcionesConSeleccion = opciones.map((farmacia: Farmacia) => ({
        ...farmacia,
        medicamentos: farmacia.medicamentos.map((med: Medicamento) => ({
          ...med,
          seleccionado: med.disponible,
          cantidad_seleccionada: med.disponible ? med.cantidad_requerida : 0,
        })),
      }));

      setFarmacias(opcionesConSeleccion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltrosYBusqueda = () => {
    let resultado = [...farmacias];

    // Filtro de búsqueda
    if (busqueda) {
      resultado = resultado.filter(
        (farmacia) =>
          farmacia.nombre_farmacia
            .toLowerCase()
            .includes(busqueda.toLowerCase()) ||
          farmacia.ubicacion.distrito
            .toLowerCase()
            .includes(busqueda.toLowerCase())
      );
    }

    // Filtro de delivery
    if (filtros.delivery) {
      resultado = resultado.filter(
        (farmacia) => farmacia.delivery.puede_entregar
      );
    }

    // Filtro de stock completo
    if (filtros.stockCompleto) {
      resultado = resultado.filter(
        (farmacia) => farmacia.disponibilidad.todos_disponibles
      );
    }

    // Filtro de distancia
    if (filtros.distancia === "cercanas") {
      resultado = resultado.filter((farmacia) => farmacia.distancia_km <= 5);
    } else if (filtros.distancia === "muy-cercanas") {
      resultado = resultado.filter((farmacia) => farmacia.distancia_km <= 2);
    }

    setFarmaciasFiltradas(resultado);
  };

  const toggleMedicamento = (farmaciaId: string, medicamentoId: number) => {
    setFarmacias((prev) =>
      prev.map((farmacia) => {
        if (farmacia.farmacia_id === farmaciaId) {
          return {
            ...farmacia,
            medicamentos: farmacia.medicamentos.map((med) => {
              if (med.medicamento_id === medicamentoId) {
                const nuevoSeleccionado = !med.seleccionado;
                return {
                  ...med,
                  seleccionado: nuevoSeleccionado,
                  cantidad_seleccionada: nuevoSeleccionado
                    ? med.cantidad_requerida
                    : 0,
                };
              }
              return med;
            }),
          };
        }
        return farmacia;
      })
    );
  };

  const ajustarCantidad = (
    farmaciaId: string,
    medicamentoId: number,
    nuevaCantidad: number
  ) => {
    if (nuevaCantidad < 1) return;

    setFarmacias((prev) =>
      prev.map((farmacia) => {
        if (farmacia.farmacia_id === farmaciaId) {
          return {
            ...farmacia,
            medicamentos: farmacia.medicamentos.map((med) => {
              if (med.medicamento_id === medicamentoId) {
                const cantidadFinal = Math.min(
                  nuevaCantidad,
                  med.stock_disponible
                );
                return {
                  ...med,
                  seleccionado: cantidadFinal > 0,
                  cantidad_seleccionada: cantidadFinal,
                };
              }
              return med;
            }),
          };
        }
        return farmacia;
      })
    );
  };

  const calcularTotalFarmacia = (farmacia: Farmacia): number => {
    return farmacia.medicamentos
      .filter((med) => med.seleccionado && med.precio_unitario)
      .reduce(
        (total, med) =>
          total + med.precio_unitario! * (med.cantidad_seleccionada || 0),
        0
      );
  };

  const agregarAlCarrito = (farmacia: Farmacia) => {
    const medicamentosSeleccionados = farmacia.medicamentos.filter(
      (med) =>
        med.seleccionado &&
        med.cantidad_seleccionada &&
        med.cantidad_seleccionada > 0
    );

    if (medicamentosSeleccionados.length === 0) {
      setError("Selecciona al menos un medicamento");
      return;
    }

    const nuevoItem: CarritoItem = {
      farmacia_id: farmacia.farmacia_id,
      nombre_farmacia: farmacia.nombre_farmacia,
      medicamentos: medicamentosSeleccionados.map((med) => ({
        medicamento_id: med.medicamento_id,
        nombre_comercial: med.nombre_comercial,
        cantidad: med.cantidad_seleccionada!,
        precio_unitario: med.precio_unitario!,
        subtotal: med.precio_unitario! * med.cantidad_seleccionada!,
      })),
      total: calcularTotalFarmacia(farmacia),
    };

    setCarrito((prev) => {
      const sinEstaFarmacia = prev.filter(
        (item) => item.farmacia_id !== farmacia.farmacia_id
      );
      return [...sinEstaFarmacia, nuevoItem];
    });

    setError(null);
  };

  const removerDelCarrito = (farmaciaId: string) => {
    setCarrito((prev) =>
      prev.filter((item) => item.farmacia_id !== farmaciaId)
    );
  };

  const confirmarCarrito = async () => {
    if (carrito.length === 0) {
      setError("Agrega medicamentos al carrito primero");
      return;
    }

    setEnviando(true);
    try {
      const token =
        authToken ||
        localStorage.getItem("medilink_token") ||
        localStorage.getItem("token");

      for (const item of carrito) {
        const response = await fetch(
          `/api/recetas/${recetaId}/enviar-farmacia`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              farmacia_id: item.farmacia_id,
              medicamentos: item.medicamentos,
              tipo_entrega: tipoEntregaSeleccionado,
              direccion_entrega:
                tipoEntregaSeleccionado === "domicilio" ? direccionEntrega : null,
              costo_entrega: costoEntrega,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Error al enviar a ${item.nombre_farmacia}`);
        }
      }

      if (onCarritoConfirmado) {
        onCarritoConfirmado(carrito);
      } else {
        onFarmaciaSeleccionada(
          carrito[0].farmacia_id,
          carrito[0].nombre_farmacia
        );
      }

      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al confirmar pedido"
      );
    } finally {
      setEnviando(false);
    }
  };

  const enviarRecetaAFarmacia = async (
    farmaciaId: string,
    nombreFarmacia: string
  ) => {
    // Primero mostrar el modal de selección de entrega
    setFarmaciaParaEnviar({ farmaciaId, nombreFarmacia });
    setMostrarModalEntrega(true);
  };

  const confirmarEnvioConEntrega = async () => {
    if (!farmaciaParaEnviar) return;

    try {
      setEnviando(true);
      const token =
        authToken ||
        localStorage.getItem("medilink_token") ||
        localStorage.getItem("token");

      const farmacia = farmacias.find(
        (f) => f.farmacia_id === farmaciaParaEnviar.farmaciaId
      );
      const medicamentosSeleccionados =
        farmacia?.medicamentos
          .filter((med) => med.seleccionado)
          .map((med) => ({
            medicamento_id: med.medicamento_id,
            cantidad: med.cantidad_seleccionada || med.cantidad_requerida,
          })) || [];

      const response = await fetch(`/api/recetas/${recetaId}/enviar-farmacia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          farmacia_id: farmaciaParaEnviar.farmaciaId,
          medicamentos: medicamentosSeleccionados,
          tipo_entrega: tipoEntregaSeleccionado,
          direccion_entrega:
            tipoEntregaSeleccionado === "domicilio" ? direccionEntrega : null,
          costo_entrega: tipoEntregaSeleccionado === "domicilio" ? 15 : 0,
        }),
      });

      if (!response.ok) {
        let msg = "Error al enviar receta";
        try {
          const errBody = await response.json();
          msg = errBody?.error || errBody?.message || msg;
        } catch (e) {}
        throw new Error(msg);
      }

      onFarmaciaSeleccionada(
        farmaciaParaEnviar.farmaciaId,
        farmaciaParaEnviar.nombreFarmacia
      );
      setMostrarModalEntrega(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  };

  const totalCarrito = carrito.reduce((total, item) => total + item.total, 0);
  const totalMedicamentosCarrito = carrito.reduce(
    (total, item) => total + item.medicamentos.length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Title */}
      <div className="container mx-auto px-4 pt-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Seleccionar Farmacias
              </h1>
              <p className="text-sm text-gray-600">
                Envía tu receta {recetaId ? `#${recetaId}` : ""} a una o múltiples farmacias
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 mt-2 sm:mt-0">
            <Button
              variant={modoCompra === "simple" ? "default" : "outline"}
              size="sm"
              onClick={() => setModoCompra("simple")}
            >
              Una Farmacia
            </Button>
            <Button
              variant={modoCompra === "avanzado" ? "default" : "outline"}
              size="sm"
              onClick={() => setModoCompra("avanzado")}
            >
              Múltiples
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar farmacias por nombre o distrito..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
              </Button>
            </div>
          </div>

          {/* Panel de filtros */}
          {mostrarFiltros && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Filtros</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarFiltros(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filtros.delivery}
                    onCheckedChange={(checked) =>
                      setFiltros({ ...filtros, delivery: checked as boolean })
                    }
                  />
                  <label className="text-sm">Solo con delivery</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filtros.stockCompleto}
                    onCheckedChange={(checked) =>
                      setFiltros({
                        ...filtros,
                        stockCompleto: checked as boolean,
                      })
                    }
                  />
                  <label className="text-sm">Stock completo</label>
                </div>
                <div>
                  <select
                    value={filtros.distancia}
                    onChange={(e) =>
                      setFiltros({ ...filtros, distancia: e.target.value })
                    }
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="todas">Todas las distancias</option>
                    <option value="muy-cercanas">Menos de 2 km</option>
                    <option value="cercanas">Menos de 5 km</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de farmacias */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 mb-6">
                <AlertTriangle
                  className="text-red-600 flex-shrink-0"
                  size={20}
                />
                <div>
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {cargando ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <LoaderCircle
                    className="animate-spin mx-auto mb-4"
                    size={40}
                  />
                  <p className="text-gray-600">
                    Buscando farmacias disponibles...
                  </p>
                </div>
              </div>
            ) : farmaciasFiltradas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Pill className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    No hay farmacias disponibles
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {farmacias.length === 0
                      ? "Ninguna farmacia tiene los medicamentos de tu receta en este momento."
                      : "No se encontraron farmacias que coincidan con tus filtros."}
                  </p>
                  <Button
                    onClick={cargarFarmaciasDisponibles}
                    variant="outline"
                  >
                    Buscar de nuevo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">
                    {farmaciasFiltradas.length} farmacia
                    {farmaciasFiltradas.length !== 1 ? "s" : ""} encontrada
                    {farmaciasFiltradas.length !== 1 ? "s" : ""}
                  </h2>
                  <div className="text-sm text-gray-600">
                    Ordenado por: Disponibilidad y precio
                  </div>
                </div>

                {farmaciasFiltradas.map((farmacia, index) => {
                  const totalFarmacia = calcularTotalFarmacia(farmacia);
                  const medicamentosSeleccionados =
                    farmacia.medicamentos.filter(
                      (med) => med.seleccionado
                    ).length;
                  const enCarrito = carrito.some(
                    (item) => item.farmacia_id === farmacia.farmacia_id
                  );

                  return (
                    <Card
                      key={farmacia.farmacia_id}
                      className={`transition-all border-2 ${
                        enCarrito
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      <CardContent className="p-6">
                        {/* Encabezado */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {farmacia.nombre_farmacia}
                              </h3>
                              {enCarrito && (
                                <Badge className="bg-green-600">
                                  En carrito
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className="bg-yellow-100 text-yellow-800"
                              >
                                ⭐ {farmacia.calificacion}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{farmacia.ubicacion.distrito}</span>
                              </div>
                              <div>•</div>
                              <div>A {farmacia.distancia_km.toFixed(1)} km</div>
                              {farmacia.delivery.puede_entregar && (
                                <>
                                  <div>•</div>
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <Truck className="w-4 h-4" />
                                    <span>Delivery</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              S/. {totalFarmacia.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {medicamentosSeleccionados} de{" "}
                              {farmacia.medicamentos.length} medicamentos
                            </div>
                          </div>
                        </div>

                        {/* Medicamentos */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Medicamentos disponibles:
                          </h4>
                          <div className="space-y-3">
                            {farmacia.medicamentos.map((medicamento) => (
                              <div
                                key={medicamento.medicamento_id}
                                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                              >
                                <div className="flex items-center space-x-4 flex-1">
                                  <Checkbox
                                    checked={medicamento.seleccionado || false}
                                    onCheckedChange={() =>
                                      toggleMedicamento(
                                        farmacia.farmacia_id,
                                        medicamento.medicamento_id
                                      )
                                    }
                                    disabled={!medicamento.disponible}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <p className="font-medium text-gray-900">
                                        {medicamento.nombre_comercial}
                                      </p>
                                      {!medicamento.disponible && (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          No disponible
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {medicamento.nombre_generico}
                                    </p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <span>
                                        Stock: {medicamento.stock_disponible}
                                      </span>
                                      <span>•</span>
                                      <span>
                                        Precio: S/.{" "}
                                        {Number(
                                          medicamento.precio_unitario ?? 0
                                        ).toFixed(2)}{" "}
                                        c/u
                                      </span>
                                      {!medicamento.disponible &&
                                        medicamento.motivo && (
                                          <>
                                            <span>•</span>
                                            <span className="text-red-600">
                                              {medicamento.motivo}
                                            </span>
                                          </>
                                        )}
                                    </div>
                                  </div>
                                </div>

                                {medicamento.seleccionado &&
                                  medicamento.disponible && (
                                    <div className="flex items-center space-x-3">
                                      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            ajustarCantidad(
                                              farmacia.farmacia_id,
                                              medicamento.medicamento_id,
                                              (medicamento.cantidad_seleccionada ||
                                                1) - 1
                                            )
                                          }
                                          disabled={
                                            (medicamento.cantidad_seleccionada ||
                                              1) <= 1
                                          }
                                          className="h-6 w-6 p-0"
                                        >
                                          <Minus size={12} />
                                        </Button>
                                        <span className="w-8 text-center text-sm font-medium">
                                          {medicamento.cantidad_seleccionada}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            ajustarCantidad(
                                              farmacia.farmacia_id,
                                              medicamento.medicamento_id,
                                              (medicamento.cantidad_seleccionada ||
                                                1) + 1
                                            )
                                          }
                                          disabled={
                                            (medicamento.cantidad_seleccionada ||
                                              1) >= medicamento.stock_disponible
                                          }
                                          className="h-6 w-6 p-0"
                                        >
                                          <Plus size={12} />
                                        </Button>
                                      </div>
                                      <div className="text-right min-w-20">
                                        <div className="font-semibold text-gray-900">
                                          S/.{" "}
                                          {(
                                            (medicamento.precio_unitario || 0) *
                                            (medicamento.cantidad_seleccionada ||
                                              1)
                                          ).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {medicamento.cantidad_seleccionada}{" "}
                                          unidad
                                          {medicamento.cantidad_seleccionada !==
                                          1
                                            ? "es"
                                            : ""}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="text-sm text-gray-600">
                            {farmacia.disponibilidad.porcentaje}% de
                            disponibilidad •
                            {farmacia.disponibilidad.medicamentos_disponibles}{" "}
                            de {farmacia.medicamentos.length} medicamentos
                          </div>

                          <div className="flex space-x-3">
                            {modoCompra === "avanzado" ? (
                              <>
                                {!enCarrito ? (
                                  <Button
                                    onClick={() => agregarAlCarrito(farmacia)}
                                    disabled={medicamentosSeleccionados === 0}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Agregar al Carrito
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      removerDelCarrito(farmacia.farmacia_id)
                                    }
                                  >
                                    Quitar del Carrito
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Button
                                onClick={() =>
                                  enviarRecetaAFarmacia(
                                    farmacia.farmacia_id,
                                    farmacia.nombre_farmacia
                                  )
                                }
                                disabled={
                                  enviando || medicamentosSeleccionados === 0
                                }
                                className="bg-blue-600 hover:bg-blue-700"
                                size="lg"
                              >
                                {enviando ? (
                                  <>
                                    <LoaderCircle
                                      size={16}
                                      className="animate-spin mr-2"
                                    />
                                    Enviando...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={16} className="mr-2" />
                                    Enviar a esta farmacia
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel lateral - Carrito y Resumen */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Resumen del Carrito */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Resumen del Pedido</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {carrito.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Tu carrito está vacío
                    </p>
                  ) : (
                    <>
                      {carrito.map((item) => (
                        <div
                          key={item.farmacia_id}
                          className="border-b pb-3 last:border-b-0 last:pb-0"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-sm">
                                {item.nombre_farmacia}
                              </p>
                              <p className="text-xs text-gray-600">
                                {item.medicamentos.length} medicamento
                                {item.medicamentos.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removerDelCarrito(item.farmacia_id)
                              }
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            {item.medicamentos.map((med, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{med.nombre_comercial}</span>
                                <span>S/. {med.subtotal.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm font-medium">
                              Subtotal:
                            </span>
                            <span className="text-sm font-bold">
                              S/. {item.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}

                      <Separator />

                      {carrito.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Tipo de entrega</label>
                            <select
                              value={tipoEntregaSeleccionado}
                              onChange={(e) => {
                                const val = e.target.value as "recojo" | "domicilio";
                                setTipoEntregaSeleccionado(val);
                                setCostoEntrega(val === "domicilio" ? 15 : 0);
                              }}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="recojo">Recoger en farmacia</option>
                              <option value="domicilio">Envío a domicilio</option>
                            </select>
                          </div>
                          {tipoEntregaSeleccionado === "domicilio" && (
                            <Input
                              placeholder="Dirección de entrega"
                              value={direccionEntrega}
                              onChange={(e) => setDireccionEntrega(e.target.value)}
                              className="text-sm"
                            />
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total medicamentos:</span>
                          <span>{totalMedicamentosCarrito}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Farmacias:</span>
                          <span>{carrito.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Costo de envío:</span>
                          <span className="text-orange-600">
                            {tipoEntregaSeleccionado === "domicilio"
                              ? `S/ ${costoEntrega.toFixed(2)}`
                              : "Gratis"}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <span>Total a pagar:</span>
                          <span className="text-green-600">
                            S/. {(totalCarrito + costoEntrega).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={confirmarCarrito}
                        disabled={enviando}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        {enviando ? (
                          <>
                            <LoaderCircle
                              size={16}
                              className="animate-spin mr-2"
                            />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} className="mr-2" />
                            Confirmar Pedido
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Información de la receta */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Información de la Receta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Receta ID:</span>
                    <p className="font-medium">{recetaId}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Modo de compra:</span>
                    <p className="font-medium capitalize">{modoCompra}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      Farmacias encontradas:
                    </span>
                    <p className="font-medium">{farmacias.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Selección de Tipo de Entrega */}
      <Dialog open={mostrarModalEntrega} onOpenChange={setMostrarModalEntrega}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Truck className="w-5 h-5" />
              <span>Seleccionar Tipo de Entrega</span>
            </DialogTitle>
            <DialogDescription>
              Elige cómo deseas recibir tu medicamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Opción Recojo */}
            <div
              onClick={() => {
                setTipoEntregaSeleccionado("recojo");
                setDireccionEntrega("");
                setCostoEntrega(0);
              }}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                tipoEntregaSeleccionado === "recojo"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${
                    tipoEntregaSeleccionado === "recojo"
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {tipoEntregaSeleccionado === "recojo" && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Package2 className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-gray-900">
                      Recoger en Farmacia
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Recibe tu medicamento en la farmacia
                  </p>
                  <div className="mt-2 text-lg font-bold text-green-600">
                    Gratis
                  </div>
                </div>
              </div>
            </div>

            {/* Opción Domicilio */}
            <div
              onClick={() => {
                setTipoEntregaSeleccionado("domicilio");
                setCostoEntrega(15);
              }}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                tipoEntregaSeleccionado === "domicilio"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${
                    tipoEntregaSeleccionado === "domicilio"
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {tipoEntregaSeleccionado === "domicilio" && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Home className="w-4 h-4 text-orange-600" />
                    <h4 className="font-semibold text-gray-900">
                      Envío a Domicilio
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Recibe tu medicamento en casa
                  </p>
                  <div className="mt-2 text-lg font-bold text-orange-600">
                    S/ 15.00
                  </div>
                </div>
              </div>
            </div>

            {/* Input de dirección (solo si selecciona domicilio) */}
            {tipoEntregaSeleccionado === "domicilio" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Dirección de Entrega
                </label>
                <Input
                  placeholder="Ej: Calle Principal 123, Apto 4B"
                  value={direccionEntrega}
                  onChange={(e) => setDireccionEntrega(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMostrarModalEntrega(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarEnvioConEntrega}
              disabled={
                enviando ||
                (tipoEntregaSeleccionado === "domicilio" &&
                  !direccionEntrega.trim())
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {enviando ? (
                <>
                  <LoaderCircle
                    size={16}
                    className="animate-spin mr-2"
                  />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  Confirmar Entrega
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
