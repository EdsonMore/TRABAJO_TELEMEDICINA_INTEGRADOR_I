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
import {
  Clock,
  CheckCircle2,
  Package,
  MapPin,
  AlertCircle,
  PhoneCall,
  Loader2,
} from "lucide-react";

interface DespachoReceta {
  id: string;
  codigo_receta: string;
  estado: "en_preparacion" | "listo_para_retirar" | "retirado" | "rechazado";
  farmacia_nombre: string;
  farmacia_direccion: string;
  farmacia_telefono: string;
  fecha_despacho: string;
  medicamentos: Array<{
    nombre: string;
    cantidad: number;
  }>;
  costo_total: number;
  observaciones?: string;
}

interface SeguimientoRecetasProps {
  recetaId?: string;
}

export default function SeguimientoRecetas({
  recetaId,
}: SeguimientoRecetasProps) {
  const { token } = useAuth();
  const [despachos, setDespachos] = useState<DespachoReceta[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (token) {
      cargarDespachos();
    }
  }, [token, recetaId]);

  const cargarDespachos = async () => {
    if (!token) return;

    try {
      setCargando(true);
      const url = recetaId
        ? `/api/paciente/despachos?receta_id=${recetaId}`
        : "/api/paciente/despachos";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDespachos(data.despachos || []);
      }
    } catch (error) {
      console.error("Error cargando despachos:", error);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case "en_preparacion":
        return {
          icon: Clock,
          label: "En Preparación",
          color: "bg-yellow-100 text-yellow-800",
          description: "Tu receta se está preparando en la farmacia",
        };
      case "listo_para_retirar":
        return {
          icon: CheckCircle2,
          label: "Listo para Retirar",
          color: "bg-green-100 text-green-800",
          description: "Tu receta está lista. Puedes retirarla en la farmacia",
        };
      case "retirado":
        return {
          icon: Package,
          label: "Retirado",
          color: "bg-blue-100 text-blue-800",
          description: "Ya has retirado tu receta",
        };
      case "rechazado":
        return {
          icon: AlertCircle,
          label: "Rechazado",
          color: "bg-red-100 text-red-800",
          description: "Tu receta fue rechazada por la farmacia",
        };
      default:
        return {
          icon: Clock,
          label: "Pendiente",
          color: "bg-gray-100 text-gray-800",
          description: "Estado desconocido",
        };
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {despachos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No tienes recetas en despacho en este momento
            </p>
          </CardContent>
        </Card>
      ) : (
        despachos.map((despacho) => {
          const estadoInfo = getEstadoInfo(despacho.estado);
          const IconComponent = estadoInfo.icon;

          return (
            <Card key={despacho.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="w-5 h-5" />
                      Receta {despacho.codigo_receta}
                    </CardTitle>
                    <CardDescription>
                      {formatearFecha(despacho.fecha_despacho)}
                    </CardDescription>
                  </div>
                  <Badge className={estadoInfo.color}>
                    {estadoInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Estado y Descripción */}
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  {estadoInfo.description}
                </div>

                {/* Medicamentos */}
                <div>
                  <p className="font-semibold text-sm text-gray-900 mb-2">
                    Medicamentos
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {despacho.medicamentos.map((med, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        {med.nombre} x {med.cantidad}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Información de Farmacia */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-semibold text-sm text-gray-900 mb-2">
                    Información de Farmacia
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 font-medium">
                      {despacho.farmacia_nombre}
                    </p>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {despacho.farmacia_direccion}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <PhoneCall className="w-4 h-4" />
                      {despacho.farmacia_telefono}
                    </div>
                  </div>
                </div>

                {/* Costo */}
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-medium text-gray-900">Costo Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    S/ {despacho.costo_total.toFixed(2)}
                  </span>
                </div>

                {/* Observaciones */}
                {despacho.observaciones && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="font-semibold text-sm text-gray-900 mb-2">
                      Notas
                    </p>
                    <p className="text-sm text-gray-600">
                      {despacho.observaciones}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
