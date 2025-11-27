// componentes/farmacia/seguimiento-recetas.tsx
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
  estado: string;
  estado_envio: string;
  farmacia_nombre?: string;
  farmacia_direccion?: string;
  farmacia_horario?: any;
  fecha_emision: string;
  fecha_dispensacion?: string;
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

  const getEstadoInfo = (estado_envio: string) => {
    switch (estado_envio) {
      case "no_enviada":
        return {
          icon: Clock,
          label: "No enviada",
          color: "bg-yellow-100 text-yellow-800",
          description: "Tu receta aún no ha sido enviada a una farmacia",
        };
      case "enviada":
        return {
          icon: Clock,
          label: "Enviada",
          color: "bg-blue-100 text-blue-800",
          description: "Tu receta fue enviada a la farmacia",
        };
      case "recibida":
        return {
          icon: CheckCircle2,
          label: "Recibida",
          color: "bg-green-100 text-green-800",
          description: "La farmacia recibió tu receta",
        };
      case "dispensada":
        return {
          icon: Package,
          label: "Dispensada",
          color: "bg-blue-100 text-blue-800",
          description: "Tu receta ha sido dispensada",
        };
      case "rechazada":
        return {
          icon: AlertCircle,
          label: "Rechazada",
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
          const estadoInfo = getEstadoInfo(despacho.estado_envio);
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
                      {formatearFecha(despacho.fecha_emision)}
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

                {/* Información de Farmacia */}
                {despacho.farmacia_nombre && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="font-semibold text-sm text-gray-900 mb-2">
                      Información de Farmacia
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600 font-medium">
                        {despacho.farmacia_nombre}
                      </p>
                      {despacho.farmacia_direccion && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {despacho.farmacia_direccion}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fecha de Dispensación */}
                {despacho.fecha_dispensacion && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="font-semibold text-sm text-gray-900 mb-2">
                      Fecha de Dispensación
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatearFecha(despacho.fecha_dispensacion)}
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
