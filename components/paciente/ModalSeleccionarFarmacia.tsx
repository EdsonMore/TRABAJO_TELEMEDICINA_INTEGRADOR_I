// components/paciente/ModalSeleccionarFarmacia.tsx
// Modal para que el paciente elija a qué farmacia enviar su receta
// Muestra disponibilidad, precio y distancia de cada opción

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Pill,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  LoaderCircle,
  Truck,
} from "lucide-react";
import { Card } from "@/components/ui/card";

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

interface ModalSeleccionarFarmaciaProps {
  isOpen: boolean;
  recetaId: string;
  onClose: () => void;
  onFarmaciaSeleccionada: (farmaciaId: string, nombreFarmacia: string) => void;
}

export default function ModalSeleccionarFarmacia({
  isOpen,
  recetaId,
  onClose,
  onFarmaciaSeleccionada,
}: ModalSeleccionarFarmaciaProps) {
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [farmaciaSeleccionada, setFarmaciaSeleccionada] = useState<string | null>(null);
  const { token: authToken } = useAuth();

  useEffect(() => {
    if (isOpen) {
      cargarFarmaciasDisponibles();
    }
  }, [isOpen]);

  const cargarFarmaciasDisponibles = async () => {
    try {
      setCargando(true);
      setError(null);
      // Preferir token desde contexto; fallback a claves legacy
      const token = authToken || localStorage.getItem("medilink_token") || localStorage.getItem("token");
      const response = await fetch(`/api/recetas/${recetaId}/farmacias-disponibles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Intentar parsear mensaje de error del servidor
        let msg = "Error al cargar farmacias disponibles";
        try {
          const errBody = await response.json();
          msg = errBody?.error || errBody?.message || msg;
        } catch (e) {
          // ignore
        }
        throw new Error(msg);
      }

      const data = await response.json();
      // Normalizar claves (api devuelve 'opciones')
      const opciones = data.opciones || data.opciones || [];

      // Si no hay opciones completas, mostrar alternativas parciales ordenadas por porcentaje
      if (Array.isArray(opciones) && opciones.length === 0 && data.mensaje) {
        // Dejar mensaje en UI, pero no bloquear: intentar mostrar farmacias si hay alguna otra clave
        setFarmacias([]);
      } else if (Array.isArray(opciones)) {
        // Ordenar por disponibilidad y porcentaje (ya viene ordenado en backend, pero garantizamos)
        opciones.sort((a: any, b: any) => b.disponibilidad.porcentaje - a.disponibilidad.porcentaje);
        setFarmacias(opciones);
      } else {
        setFarmacias([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  const enviarRecetaAFarmacia = async (farmaciaId: string, nombreFarmacia: string) => {
    try {
      setEnviando(true);
      const token = authToken || localStorage.getItem("medilink_token") || localStorage.getItem("token");
      const response = await fetch(`/api/recetas/${recetaId}/enviar-farmacia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ farmacia_id: farmaciaId }),
      });

      if (!response.ok) {
        let msg = "Error al enviar receta";
        try {
          const errBody = await response.json();
          msg = errBody?.error || errBody?.message || msg;
        } catch (e) {}
        throw new Error(msg);
      }

      const data = await response.json();
      onFarmaciaSeleccionada(farmaciaId, nombreFarmacia);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-4 sm:p-6 w-[95vw]">
        <DialogHeader>
          <DialogTitle>Selecciona una Farmacia</DialogTitle>
          <DialogDescription>
            Elige la farmacia que mejor se adapte a tus necesidades considerando
            disponibilidad, precio y ubicación
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {cargando ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <LoaderCircle className="animate-spin mx-auto mb-4" size={40} />
              <p className="text-gray-600">Buscando farmacias disponibles...</p>
            </div>
          </div>
        ) : farmacias.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="mx-auto mb-4 text-gray-400" size={40} />
            <h3 className="font-semibold text-gray-900">No hay farmacias disponibles</h3>
            <p className="text-sm text-gray-600 mt-2">
              Ninguna farmacia tiene todos los medicamentos de tu receta en este momento.
              Puedes intentar buscar de nuevo o enviar la receta para que la farmacia confirme disponibilidad.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button onClick={cargarFarmaciasDisponibles} variant="outline">Buscar de nuevo</Button>
              <Button
                onClick={() => {
                  // abrir igualmente la lista vacía para selección manual (si corresponde)
                }}
              >
                Volver
              </Button>
            </div>
            {/** Mostrar mensaje de detalle del servidor si existe */}
            {error && (
              <p className="text-xs text-red-600 mt-3">Detalle: {error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
            {farmacias.map((farmacia, index) => (
              <Card
                key={farmacia.farmacia_id}
                className={`p-4 cursor-pointer transition-all border-2 ${
                  farmaciaSeleccionada === farmacia.farmacia_id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() =>
                  setFarmaciaSeleccionada(farmacia.farmacia_id)
                }
              >
                {/* Encabezado: Nombre y Calificación */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {index + 1}. {farmacia.nombre_farmacia}
                    </h3>
                    <p className="text-xs text-gray-500">RUC: {farmacia.ruc}</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs font-medium">
                    {farmacia.calificacion}
                  </Badge>
                </div>

                {/* Información de Ubicación */}
                <div className="mb-3 pb-3 border-b">
                  <div className="flex gap-2 text-sm text-gray-700">
                    <MapPin size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{farmacia.ubicacion.direccion}</p>
                      <p className="text-xs text-gray-500">
                        {farmacia.ubicacion.distrito},{" "}
                        {farmacia.ubicacion.provincia}
                      </p>
                      {farmacia.distancia_km > 0 && (
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          📍 A {farmacia.distancia_km} km de distancia
                        </p>
                      )}
                      {farmacia.delivery.puede_entregar && (
                        <p className="text-xs text-green-600 font-medium mt-1 flex gap-1">
                          <Truck size={12} /> Delivery disponible
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid de Información */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {/* Disponibilidad */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Package size={16} className="text-blue-600" />
                      <span className="text-xs font-semibold text-gray-700">
                        Disponibilidad
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {farmacia.disponibilidad.porcentaje}%
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {farmacia.disponibilidad.medicamentos_disponibles} de{" "}
                      {farmacia.disponibilidad.medicamentos_disponibles +
                        farmacia.disponibilidad.medicamentos_faltantes}{" "}
                      medicamentos
                    </p>
                    {farmacia.disponibilidad.todos_disponibles && (
                      <div className="flex items-center gap-1 mt-2 text-green-600 text-xs font-medium">
                        <CheckCircle size={14} /> Todo disponible
                      </div>
                    )}
                  </div>

                  {/* Precio */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-green-600" />
                      <span className="text-xs font-semibold text-gray-700">
                        Precio Total
                      </span>
                    </div>
                    {farmacia.precio.total !== null ? (
                      <>
                        <div className="text-2xl font-bold text-gray-900">
                          S/. {farmacia.precio.total.toFixed(2)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {farmacia.precio.moneda}
                        </p>
                      </>
                    ) : (
                      <div className="text-sm text-red-600 font-medium">
                        N/A
                      </div>
                    )}
                  </div>

                  {/* Distancia */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={16} className="text-orange-600" />
                      <span className="text-xs font-semibold text-gray-700">
                        Distancia
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {farmacia.distancia_km.toFixed(1)} km
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {farmacia.distancia_km < 2
                        ? "Muy cercana"
                        : farmacia.distancia_km < 5
                        ? "Cercana"
                        : "Algo lejana"}
                    </p>
                  </div>
                </div>

                {/* Detalles de Medicamentos */}
                {farmacia.disponibilidad.medicamentos_faltantes > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <div className="flex gap-2">
                      <AlertTriangle
                        size={16}
                        className="text-yellow-600 flex-shrink-0 mt-0.5"
                      />
                      <div className="text-sm text-yellow-800">
                        <strong>⚠️ Faltantes:</strong>
                        <div className="mt-1">
                          {farmacia.medicamentos
                            .filter((m) => !m.disponible)
                            .map((m, idx) => (
                              <p key={idx} className="text-xs">
                                • {m.nombre_comercial}: {m.motivo}
                              </p>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón de Selección */}
                <Button
                  onClick={() =>
                    enviarRecetaAFarmacia(
                      farmacia.farmacia_id,
                      farmacia.nombre_farmacia
                    )
                  }
                  disabled={enviando}
                  className={`w-full ${
                    farmaciaSeleccionada === farmacia.farmacia_id
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  {enviando ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      {farmaciaSeleccionada === farmacia.farmacia_id
                        ? "✓ Enviar a esta farmacia"
                        : "Seleccionar"}
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Pie del Modal */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
