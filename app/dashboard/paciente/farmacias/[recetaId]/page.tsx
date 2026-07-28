// app/dashboard/paciente/farmacias/[recetaId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import ModalPago from "@/components/paciente/ModalPago";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin,
  Pill,
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

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

export default function SeleccionFarmaciasPage() {
  const params = useParams();
  const router = useRouter();
  const recetaId = params?.recetaId as string; // ✅ Agregado safe navigation

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
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [mostrarModalEntrega, setMostrarModalEntrega] = useState(false);
  const [tipoEntregaSeleccionado, setTipoEntregaSeleccionado] = useState<
    "recojo" | "domicilio"
  >("recojo");
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [direccionPacientePorDefecto, setDireccionPacientePorDefecto] = useState("");
  const [costoEntrega, setCostoEntrega] = useState(0);
  const [farmaciaSeleccionadaPago, setFarmaciaSeleccionadaPago] = useState<{
    farmacia_id: string;
    nombre: string;
    monto: number;
    subtotal: number;
  } | null>(null);
  const { token: authToken } = useAuth();

  // ✅ Validar que recetaId existe antes de cargar
  useEffect(() => {
    if (!recetaId) {
      setError("ID de receta no válido");
      setCargando(false);
      return;
    }

    cargarFarmaciasDisponibles();
  }, [recetaId]);

  useEffect(() => {
    aplicarFiltrosYBusqueda();
  }, [farmacias, busqueda, filtros]);

  useEffect(() => {
    // Cargar perfil del paciente cuando se abre el modal de entrega
    if (mostrarModalEntrega && !direccionPacientePorDefecto) {
      cargarDireccionPaciente();
    }
  }, [mostrarModalEntrega]);

  const cargarFarmaciasDisponibles = async () => {
    if (!recetaId) {
      setError("No se pudo cargar: ID de receta no disponible");
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const token =
        authToken ||
        localStorage.getItem("medilink_token") ||
        localStorage.getItem("token");

      const response = await fetch(
        `/api/recetas/${recetaId}/farmacias-disponibles`,
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

  const cargarDireccionPaciente = async () => {
    try {
      const token =
        authToken ||
        localStorage.getItem("medilink_token") ||
        localStorage.getItem("token");

      const response = await fetch("/api/paciente/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const direccion = data.informacion_personal?.direccion || "";
        setDireccionPacientePorDefecto(direccion);
        // Pre-llenar la dirección de entrega si está en modo domicilio
        if (tipoEntregaSeleccionado === "domicilio" && !direccionEntrega) {
          setDireccionEntrega(direccion);
        }
      }
    } catch (err) {
      console.error("Error cargando dirección del paciente:", err);
    }
  };

  const aplicarFiltrosYBusqueda = () => {
    let resultado = [...farmacias];

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

    if (filtros.delivery) {
      resultado = resultado.filter(
        (farmacia) => farmacia.delivery.puede_entregar
      );
    }

    if (filtros.stockCompleto) {
      resultado = resultado.filter(
        (farmacia) => farmacia.disponibilidad.todos_disponibles
      );
    }

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

  const procesarPagoExitoso = async (
    metodo: string,
    numeroReferencia: string
  ) => {
    if (!recetaId || !farmaciaSeleccionadaPago) {
      setError("Información incompleta para procesar el envío");
      return;
    }

    try {
      setEnviando(true);
      const token =
        authToken ||
        localStorage.getItem("medilink_token") ||
        localStorage.getItem("token");

      // POST a /api/recetas/pagar para registrar el pago y enviar la receta
      // AHORA INCLUYE: tipo_entrega, direccion_entrega, costo_entrega, subtotal, igv
      const response = await fetch("/api/recetas/pagar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receta_id: recetaId,
          farmacia_id: farmaciaSeleccionadaPago.farmacia_id,
          metodo_pago: metodo,
          monto: farmaciaSeleccionadaPago.monto,
          subtotal: farmaciaSeleccionadaPago.subtotal,
          igv: farmaciaSeleccionadaPago.monto - farmaciaSeleccionadaPago.subtotal,
          referencia_pago: numeroReferencia,
          tipo_entrega: tipoEntregaSeleccionado,
          direccion_entrega: tipoEntregaSeleccionado === "domicilio" ? direccionEntrega : null,
          costo_entrega: costoEntrega,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al procesar el pago"
        );
      }

      // Redirigir al dashboard del paciente con notificación
      router.push("/dashboard/paciente/?mensaje=receta_enviada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setMostrarModalPago(false);
      setFarmaciaSeleccionadaPago(null);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCarrito = async () => {
    if (!recetaId) {
      setError("ID de receta no disponible");
      return;
    }

    if (carrito.length === 0) {
      setError("Agrega medicamentos al carrito primero");
      return;
    }

    // SIEMPRE mostrar modal de entrega PRIMERO
    // Es común para 1 farmacia (con pago) o múltiples (sin pago)
    setMostrarModalEntrega(true);
  };

  const confirmarEntregaYProceder = async () => {
    if (!recetaId || carrito.length === 0) {
      setError("Información incompleta");
      return;
    }

    if (tipoEntregaSeleccionado === "domicilio" && !direccionEntrega.trim()) {
      setError("Ingresa una dirección para envío a domicilio");
      return;
    }

    setMostrarModalEntrega(false);

    // Si hay un solo item en el carrito, mostrar modal de PAGO
    if (carrito.length === 1) {
      const item = carrito[0];
      const subtotalItem = item.total; // Sin IGV
      const totalConIGV = subtotalItem * 1.18; // Con IGV 18%
      setFarmaciaSeleccionadaPago({
        farmacia_id: item.farmacia_id,
        nombre: item.nombre_farmacia,
        subtotal: subtotalItem,
        monto: totalConIGV,
      });
      setMostrarModalPago(true);
    } else {
      // Si hay múltiples items, enviar a todas las farmacias SIN pago
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
                direccion_entrega: tipoEntregaSeleccionado === "domicilio" ? direccionEntrega : null,
                costo_entrega: costoEntrega,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Error al enviar a ${item.nombre_farmacia}`);
          }
        }

        // Redirigir al dashboard con mensaje de éxito
        router.push("/dashboard/paciente/?mensaje=receta_enviada");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al confirmar pedido"
        );
      } finally {
        setEnviando(false);
      }
    }
  };

  const enviarRecetaAFarmacia = async (
    farmaciaId: string,
    nombreFarmacia: string
  ) => {
    if (!recetaId) {
      setError("ID de receta no disponible");
      return;
    }

    try {
      setEnviando(true);
      const token =
        authToken ||
        localStorage.getItem("medilink_token") ||
        localStorage.getItem("token");

      const farmacia = farmacias.find((f) => f.farmacia_id === farmaciaId);
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
          farmacia_id: farmaciaId,
          medicamentos: medicamentosSeleccionados,
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

      // Redirigir al dashboard del paciente con notificación
      router.push("/dashboard/paciente/?mensaje=receta_enviada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  };

  const subtotalCarrito = carrito.reduce((total, item) => total + item.total, 0);
  const igvCarrito = subtotalCarrito * 0.18; // IGV 18%
  const totalCarrito = subtotalCarrito + igvCarrito; // Total con IGV
  const totalMedicamentosCarrito = carrito.reduce(
    (total, item) => total + item.medicamentos.length,
    0
  );

  // ✅ Mostrar error si no hay recetaId
  if (!recetaId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Error de Receta
            </h2>
            <p className="text-gray-600 mb-6">
              No se pudo identificar la receta. Por favor, vuelve a la página
              anterior e intenta nuevamente.
            </p>
            <Button onClick={() => router.push("/dashboard/paciente")}>
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Responsive */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/paciente")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Volver</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  Seleccionar Farmacias
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Receta #{recetaId}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant={modoCompra === "simple" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModoCompra("simple")}
                  className="text-xs"
                >
                  Una Farmacia
                </Button>
                <Button
                  variant={modoCompra === "avanzado" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModoCompra("avanzado")}
                  className="text-xs"
                >
                  Múltiples
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de búsqueda y filtros - Responsive */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col space-y-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar farmacias..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center space-x-2 text-xs"
              >
                <Filter className="w-3 h-3" />
                <span>Filtros</span>
              </Button>

              {/* Modo compra para móvil */}
              <div className="sm:hidden flex items-center space-x-1">
                <Button
                  variant={modoCompra === "simple" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModoCompra("simple")}
                  className="text-xs h-8 px-2"
                >
                  1
                </Button>
                <Button
                  variant={modoCompra === "avanzado" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModoCompra("avanzado")}
                  className="text-xs h-8 px-2"
                >
                  Múltiples
                </Button>
              </div>
            </div>
          </div>

          {/* Panel de filtros responsive */}
          {mostrarFiltros && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sm">Filtros</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarFiltros(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filtros.delivery}
                    onCheckedChange={(checked) =>
                      setFiltros({ ...filtros, delivery: checked as boolean })
                    }
                    className="h-4 w-4"
                  />
                  <label className="text-xs">Solo con delivery</label>
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
                    className="h-4 w-4"
                  />
                  <label className="text-xs">Stock completo</label>
                </div>
                <div>
                  <select
                    value={filtros.distancia}
                    onChange={(e) =>
                      setFiltros({ ...filtros, distancia: e.target.value })
                    }
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1"
                  >
                    <option value="todas">Todas distancias</option>
                    <option value="muy-cercanas">{"< 2 km"}</option>
                    <option value="cercanas">{"< 5 km"}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal - Layout responsive */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Lista de farmacias - Ocupa todo en móvil, 3/4 en desktop */}
          <div className="flex-1 lg:w-3/4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 mb-4">
                <AlertTriangle
                  className="text-red-600 flex-shrink-0 mt-0.5"
                  size={16}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 text-sm">Error</h3>
                  <p className="text-red-700 text-xs">{error}</p>
                </div>
              </div>
            )}

            {cargando ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <LoaderCircle
                    className="animate-spin mx-auto mb-3 text-blue-600"
                    size={32}
                  />
                  <p className="text-gray-600 text-sm">
                    Buscando farmacias disponibles...
                  </p>
                </CardContent>
              </Card>
            ) : farmaciasFiltradas.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Pill className="mx-auto mb-3 text-gray-400" size={40} />
                  <h3 className="font-semibold text-gray-900 text-base mb-2">
                    No hay farmacias disponibles
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {farmacias.length === 0
                      ? "Ninguna farmacia tiene los medicamentos de tu receta."
                      : "No hay farmacias que coincidan con tus filtros."}
                  </p>
                  <Button
                    onClick={cargarFarmaciasDisponibles}
                    variant="outline"
                    size="sm"
                  >
                    Buscar de nuevo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-semibold">
                    {farmaciasFiltradas.length} farmacia
                    {farmaciasFiltradas.length !== 1 ? "s" : ""} encontrada
                    {farmaciasFiltradas.length !== 1 ? "s" : ""}
                  </h2>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Ordenado por disponibilidad
                  </div>
                </div>

                <div className="space-y-4">
                  {farmaciasFiltradas.map((farmacia) => {
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
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <CardContent className="p-4 sm:p-6">
                          {/* Encabezado responsive */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                  {farmacia.nombre_farmacia}
                                </h3>
                                {enCarrito && (
                                  <Badge className="bg-green-600 text-xs">
                                    En carrito
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-100 text-yellow-800 text-xs"
                                >
                                  ⭐ {farmacia.calificacion}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{farmacia.ubicacion.distrito}</span>
                                </div>
                                <span>•</span>
                                <span>
                                  {farmacia.distancia_km.toFixed(1)} km
                                </span>
                                {farmacia.delivery.puede_entregar && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1 text-green-600">
                                      <Truck className="w-3 h-3" />
                                      <span>Delivery</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-lg sm:text-xl font-bold text-green-600">
                                S/. {totalFarmacia.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-600">
                                {medicamentosSeleccionados} de{" "}
                                {farmacia.medicamentos.length}
                              </div>
                            </div>
                          </div>

                          {/* Medicamentos - Scroll horizontal en móvil */}
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 text-sm mb-3">
                              Medicamentos:
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {farmacia.medicamentos.map((medicamento) => (
                                <div
                                  key={medicamento.medicamento_id}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white border border-gray-200 rounded-lg gap-3"
                                >
                                  <div className="flex items-start gap-3 flex-1">
                                    <Checkbox
                                      checked={
                                        medicamento.seleccionado || false
                                      }
                                      onCheckedChange={() =>
                                        toggleMedicamento(
                                          farmacia.farmacia_id,
                                          medicamento.medicamento_id
                                        )
                                      }
                                      disabled={!medicamento.disponible}
                                      className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-1 mb-1">
                                        <p className="font-medium text-gray-900 text-sm truncate">
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
                                      <p className="text-gray-600 text-xs mb-2 truncate">
                                        {medicamento.nombre_generico}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                        <span>
                                          Stock: {medicamento.stock_disponible}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          S/.{" "}
                                          {Number(
                                            medicamento.precio_unitario ?? 0
                                          ).toFixed(2)}{" "}
                                          c/u
                                        </span>
                                      </div>
                                      {!medicamento.disponible &&
                                        medicamento.motivo && (
                                          <p className="text-red-600 text-xs mt-1">
                                            {medicamento.motivo}
                                          </p>
                                        )}
                                    </div>
                                  </div>

                                  {medicamento.seleccionado &&
                                    medicamento.disponible && (
                                      <div className="flex items-center justify-between sm:justify-end gap-2">
                                        <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1">
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
                                                1) >=
                                              medicamento.stock_disponible
                                            }
                                            className="h-6 w-6 p-0"
                                          >
                                            <Plus size={12} />
                                          </Button>
                                        </div>
                                        <div className="text-right min-w-16">
                                          <div className="font-semibold text-gray-900 text-sm">
                                            S/.{" "}
                                            {(
                                              (medicamento.precio_unitario ||
                                                0) *
                                              (medicamento.cantidad_seleccionada ||
                                                1)
                                            ).toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Acciones responsive */}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 border-t">
                            <div className="text-xs text-gray-600">
                              {farmacia.disponibilidad.porcentaje}% disponible •
                              {farmacia.disponibilidad.medicamentos_disponibles}
                              /{farmacia.medicamentos.length} meds
                            </div>

                            <div className="flex gap-2">
                              {modoCompra === "avanzado" ? (
                                <>
                                  {!enCarrito ? (
                                    <Button
                                      onClick={() => agregarAlCarrito(farmacia)}
                                      disabled={medicamentosSeleccionados === 0}
                                      className="bg-green-600 hover:bg-green-700 text-xs h-9"
                                      size="sm"
                                    >
                                      <ShoppingCart className="w-3 h-3 mr-1" />
                                      <span className="hidden xs:inline">
                                        Agregar
                                      </span>
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        removerDelCarrito(farmacia.farmacia_id)
                                      }
                                      className="text-xs h-9"
                                      size="sm"
                                    >
                                      Quitar
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <>
                                  {!enCarrito ? (
                                    <Button
                                      onClick={() => agregarAlCarrito(farmacia)}
                                      disabled={medicamentosSeleccionados === 0}
                                      className="bg-green-600 hover:bg-green-700 text-xs h-9"
                                      size="sm"
                                    >
                                      <ShoppingCart className="w-3 h-3 mr-1" />
                                      <span className="hidden xs:inline">
                                        Agregar
                                      </span>
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        removerDelCarrito(farmacia.farmacia_id)
                                      }
                                      className="text-xs h-9"
                                      size="sm"
                                    >
                                      Quitar
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Panel lateral del carrito - Oculto en móvil, aparece como bottom sheet o en sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 space-y-4">
              <Card className="lg:block hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Resumen del Pedido</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {carrito.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center py-3">
                      Tu carrito está vacío
                    </p>
                  ) : (
                    <>
                      {carrito.map((item) => (
                        <div
                          key={item.farmacia_id}
                          className="border-b pb-2 last:border-b-0 last:pb-0"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">
                                {item.nombre_farmacia}
                              </p>
                              <p className="text-gray-600 text-xs">
                                {item.medicamentos.length} med
                                {item.medicamentos.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removerDelCarrito(item.farmacia_id)
                              }
                              className="h-5 w-5 p-0 ml-1"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-gray-600 text-xs space-y-0.5">
                            {item.medicamentos.slice(0, 2).map((med, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="truncate flex-1">
                                  {med.nombre_comercial}
                                </span>
                                <span className="ml-2">
                                  S/. {med.subtotal.toFixed(2)}
                                </span>
                              </div>
                            ))}
                            {item.medicamentos.length > 2 && (
                              <div className="text-gray-500 text-xs">
                                +{item.medicamentos.length - 2} más...
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs font-medium">
                              Subtotal:
                            </span>
                            <span className="text-xs font-bold">
                              S/. {item.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}

                      <Separator />

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Total medicamentos:</span>
                          <span>{totalMedicamentosCarrito}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Farmacias:</span>
                          <span>{carrito.length}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 pt-1">
                          <span>Subtotal:</span>
                          <span>S/. {subtotalCarrito.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>IGV (18%):</span>
                          <span>S/. {igvCarrito.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold pt-1 border-t">
                          <span>Total:</span>
                          <span className="text-green-600">
                            S/. {totalCarrito.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={confirmarCarrito}
                        disabled={enviando}
                        className="w-full bg-green-600 hover:bg-green-700 text-xs h-9"
                        size="sm"
                      >
                        {enviando ? (
                          <>
                            <LoaderCircle
                              size={14}
                              className="animate-spin mr-1"
                            />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} className="mr-1" />
                            Confirmar Pedido
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Carrito móvil - Bottom Sheet */}
              {carrito.length > 0 && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-semibold text-sm">
                        Carrito ({carrito.length} farmacia
                        {carrito.length !== 1 ? "s" : ""})
                      </p>
                      <p className="text-xs text-gray-600">
                        Subtotal: S/. {subtotalCarrito.toFixed(2)} + IGV: S/. {igvCarrito.toFixed(2)}
                      </p>
                      <p className="text-green-600 font-bold text-sm">
                        Total: S/. {totalCarrito.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      onClick={confirmarCarrito}
                      disabled={enviando}
                      className="bg-green-600 hover:bg-green-700 text-xs h-9"
                      size="sm"
                    >
                      {enviando ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        "Confirmar"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Espacio para el carrito móvil */}
      {carrito.length > 0 && <div className="lg:hidden h-20" />}

      {/* Modal de Selección de Tipo de Entrega */}
      {mostrarModalEntrega && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="w-5 h-5" />
                <span>Seleccionar Tipo de Entrega</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <h4 className="font-semibold text-gray-900">
                      🏪 Recoger en Farmacia
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
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
                    <h4 className="font-semibold text-gray-900">
                      🚚 Envío a Domicilio
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
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
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Dirección de Entrega
                    </label>
                    {direccionPacientePorDefecto && (
                      <button
                        type="button"
                        onClick={() => setDireccionEntrega(direccionPacientePorDefecto)}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Usar dirección guardada
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder={direccionPacientePorDefecto || "Ej: Calle Principal 123, Apto 4B"}
                    value={direccionEntrega}
                    onChange={(e) => setDireccionEntrega(e.target.value)}
                    className="w-full"
                  />
                  {direccionPacientePorDefecto && !direccionEntrega && (
                    <p className="text-xs text-gray-500">
                      💾 Tu dirección guardada: {direccionPacientePorDefecto}
                    </p>
                  )}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMostrarModalEntrega(false);
                    setFarmaciaSeleccionadaPago(null);
                  }}
                  className="flex-1"
                  disabled={enviando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (tipoEntregaSeleccionado === "domicilio" && !direccionEntrega.trim()) {
                      setError("Ingresa una dirección para envío a domicilio");
                      return;
                    }
                    confirmarEntregaYProceder();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={enviando}
                >
                  Confirmar Entrega
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Pago */}
      {farmaciaSeleccionadaPago && (
        <ModalPago
          isOpen={mostrarModalPago}
          onClose={() => {
            setMostrarModalPago(false);
            setFarmaciaSeleccionadaPago(null);
          }}
          monto={farmaciaSeleccionadaPago.monto}
          subtotal={farmaciaSeleccionadaPago.subtotal}
          recetaId={recetaId}
          farmaciaId={farmaciaSeleccionadaPago.farmacia_id}
          onPagoExitoso={procesarPagoExitoso}
        />
      )}
    </div>
  );
}
