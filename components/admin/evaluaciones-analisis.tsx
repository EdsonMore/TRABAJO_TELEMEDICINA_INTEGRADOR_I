// components/admin/evaluaciones-analisis.tsx
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
import { Star, TrendingUp, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface EvaluacionesAnalisisProps {
  token?: string;
}

interface EvaluacionesPorMedico {
  medico_id: string;
  medico_nombre: string;
  medico_apellido: string;
  calificacion_promedio: number;
  total_evaluaciones: number;
  evaluaciones_positivas: number;
  evaluaciones_negativas: number;
}

interface DistribucionCalificaciones {
  calificacion: number;
  cantidad: number;
  porcentaje: number;
}

export function EvaluacionesAnalisis({ token }: EvaluacionesAnalisisProps) {
  const [evaluacionesPorMedico, setEvaluacionesPorMedico] = useState<
    EvaluacionesPorMedico[]
  >([]);
  const [distribucion, setDistribucion] =
    useState<DistribucionCalificaciones[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEvaluaciones, setTotalEvaluaciones] = useState(0);
  const [promedioGeneral, setPromedioGeneral] = useState(0);

  useEffect(() => {
    const cargarEvaluaciones = async () => {
      if (!token) return;

      try {
        const response = await fetch(
          "/api/admin/evaluaciones?tipo=analisis",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (response.ok) {
          setEvaluacionesPorMedico(data.por_medico || []);
          setDistribucion(data.distribucion || []);
          setTotalEvaluaciones(data.total || 0);
          setPromedioGeneral(data.promedio || 0);
        }
      } catch (error) {
        console.error("Error cargando evaluaciones:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarEvaluaciones();
  }, [token]);

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

  const renderEstrellas = (calificacion: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={
              star <= Math.round(calificacion)
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Evaluaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Cargando datos...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Generales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-semibold">
                  Satisfacción General
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {promedioGeneral.toFixed(1)}
                </p>
                <p className="text-xs text-yellow-700 mt-1">de 5 estrellas</p>
              </div>
              <div className="flex gap-1 mt-1">
                {renderEstrellas(promedioGeneral)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-blue-700 font-semibold">
                  Total de Evaluaciones
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {totalEvaluaciones}
                </p>
                <p className="text-xs text-blue-700 mt-1">registradas</p>
              </div>
              <Star className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-green-700 font-semibold">
                  Médicos Evaluados
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {evaluacionesPorMedico.length}
                </p>
                <p className="text-xs text-green-700 mt-1">con evaluaciones</p>
              </div>
              <Users className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Distribución de Calificaciones */}
      {distribucion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Distribución de Calificaciones
            </CardTitle>
            <CardDescription>
              Cantidad de evaluaciones por rango de calificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribucion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="calificacion"
                    label={{ value: "Calificación", position: "insideBottomRight", offset: -5 }}
                  />
                  <YAxis label={{ value: "Cantidad", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#3b82f6" name="Evaluaciones" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Evaluaciones por Médico */}
      {evaluacionesPorMedico.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Desempeño por Médico
            </CardTitle>
            <CardDescription>
              Resumen de evaluaciones recibidas por cada médico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evaluacionesPorMedico
                .sort((a, b) => b.calificacion_promedio - a.calificacion_promedio)
                .map((medico) => (
                  <div
                    key={medico.medico_id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base truncate">
                          Dr. {medico.medico_nombre} {medico.medico_apellido}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {medico.total_evaluaciones} evaluaciones
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="font-bold text-lg text-yellow-600">
                          {medico.calificacion_promedio.toFixed(1)}
                        </span>
                        <div className="flex gap-1">
                          {renderEstrellas(medico.calificacion_promedio)}
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso con evaluaciones positivas y negativas */}
                    <div className="flex gap-2 items-center mt-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${
                              (medico.evaluaciones_positivas /
                                medico.total_evaluaciones) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-green-700">
                        {medico.evaluaciones_positivas}
                      </span>
                    </div>

                    <div className="flex gap-2 items-center mt-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{
                            width: `${
                              (medico.evaluaciones_negativas /
                                medico.total_evaluaciones) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-red-700">
                        {medico.evaluaciones_negativas}
                      </span>
                    </div>
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
                No hay evaluaciones disponibles aún
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
