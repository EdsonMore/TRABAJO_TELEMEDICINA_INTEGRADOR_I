// components/medico/evaluaciones-recibidas.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";

interface Evaluacion {
  id: string;
  cita_id: string;
  paciente_nombre: string;
  paciente_apellido: string;
  calificacion: number;
  comentarios: string;
  recomendaria: boolean;
  fecha_cita: string;
  created_at: string;
}

interface EvaluacionesStats {
  total_evaluaciones: number;
  promedio_calificacion: number;
  porcentaje_recomendacion: number;
}

interface EvaluacionesRecadasProps {
  token?: string;
}

export function EvaluacionesRecibidas({ token }: EvaluacionesRecadasProps) {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [stats, setStats] = useState<EvaluacionesStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarEvaluaciones = async () => {
      if (!token) return;

      try {
        const response = await fetch("/api/evaluaciones", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setEvaluaciones(data.evaluaciones || []);
          setStats(data.estadisticas);
        }
      } catch (error) {
        console.error("Error cargando evaluaciones:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarEvaluaciones();
  }, [token]);

  const renderEstrellas = (calificacion: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= calificacion
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluaciones Recibidas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando evaluaciones...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      {stats && stats.total_evaluaciones > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Promedio Calificación */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {stats.promedio_calificacion.toFixed(1)}
                </div>
                <p className="text-xs text-yellow-700">Calificación Promedio</p>
                <div className="mt-2 flex justify-center">
                  {renderEstrellas(Math.round(stats.promedio_calificacion))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Evaluaciones */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.total_evaluaciones}
                </div>
                <p className="text-xs text-blue-700">Evaluaciones</p>
              </div>
            </CardContent>
          </Card>

          {/* Porcentaje Recomendación */}
          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600 mb-1">
                  {stats.porcentaje_recomendacion}%
                </div>
                <p className="text-xs text-pink-700">Te Recomendarían</p>
              </div>
            </CardContent>
          </Card>

          {/* Evaluaciones Positivas */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {evaluaciones.filter((e) => e.calificacion >= 4).length}
                </div>
                <p className="text-xs text-green-700">Muy Satisfechos (4-5★)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Evaluaciones */}
      {evaluaciones.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Evaluaciones Detalladas
            </CardTitle>
            <CardDescription>
              Últimas {evaluaciones.length} evaluaciones recibidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluaciones.map((evaluacion) => (
                <div
                  key={evaluacion.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Encabezado */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm md:text-base">
                        {evaluacion.paciente_nombre}{" "}
                        {evaluacion.paciente_apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(evaluacion.fecha_cita).toLocaleDateString(
                          "es-PE"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star
                        size={16}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      <span className="font-bold text-sm">
                        {evaluacion.calificacion}
                      </span>
                    </div>
                  </div>

                  {/* Calificación y Recomendación */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-yellow-50 p-2 rounded">
                      <p className="text-xs text-muted-foreground mb-1">
                        Calificación
                      </p>
                      <div className="flex gap-1">
                        {renderEstrellas(evaluacion.calificacion)}
                      </div>
                    </div>
                    <div className="text-right">
                      {evaluacion.recomendaria !== null && (
                        <Badge
                          variant={
                            evaluacion.recomendaria ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {evaluacion.recomendaria ? (
                            <div className="flex items-center gap-1">
                              <ThumbsUp size={12} />
                              Recomendaría
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <ThumbsDown size={12} />
                              No recomendaría
                            </div>
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Comentarios */}
                  {evaluacion.comentarios && (
                    <div className="bg-gray-50 p-3 rounded text-sm italic text-gray-700 border-l-4 border-yellow-400">
                      "{evaluacion.comentarios}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Aún no tienes evaluaciones. Las evaluaciones aparecerán aquí
                cuando los pacientes completen sus citas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
