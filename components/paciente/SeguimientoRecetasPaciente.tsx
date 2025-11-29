// components/paciente/SeguimientoRecetasPaciente.tsx
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
} from "lucide-react";

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
  medicamentos?: Array<{
    id: string;
    medicamento: {
      nombre_comercial: string;
      nombre_generico: string;
    };
    cantidad: number;
  }>;
}

export default function SeguimientoRecetasPaciente() {
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<RecetaTracking[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recetaSeleccionada, setRecetaSeleccionada] =
    useState<RecetaTracking | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  useEffect(() => {
    if (token) {
      cargarRecetas();
    }
  }, [token]);

  const cargarRecetas = async () => {
    try {
      setCargando(true);
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

      setRecetas(recetasEnviadas);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            📦 Seguimiento de Recetas
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {recetas.length} receta{recetas.length !== 1 ? "s" : ""} en proceso
          </p>
        </div>
        <Button
          onClick={cargarRecetas}
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
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Receta #{receta.codigo_receta}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {receta.medico_nombre} {receta.medico_apellido}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getEstadoColor(receta.estado_envio)}>
                    {getEstadoLabel(receta.estado_envio)}
                  </Badge>
                  {receta.estado_envio === "dispensada" && (
                    <div className="mt-2">
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medicamentos:</span>
                      <span className="font-medium">
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

              <Button
                onClick={() => {
                  setRecetaSeleccionada(receta);
                  setMostrarDetalles(true);
                }}
                variant="outline"
                className="w-full"
              >
                Ver Detalles Completos
              </Button>
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
                          {med.medicamento.nombre_comercial}
                        </p>
                        <p className="text-xs text-gray-600">
                          {med.medicamento.nombre_generico}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Cantidad: {med.cantidad} unidades
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
    </div>
  );
}
