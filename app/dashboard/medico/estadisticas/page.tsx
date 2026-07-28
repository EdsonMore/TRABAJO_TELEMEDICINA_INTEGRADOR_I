// app/dashboard/medico/estadisticas/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Stethoscope,
  Loader2,
} from "lucide-react";

interface PerfilMedico {
  id: string;
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    avatar_url?: string;
  };
  informacion_profesional: {
    numero_colegiatura: string;
    anos_experiencia: number;
    especialidad: {
      nombre: string;
      descripcion: string;
    };
    direccion_consultorio?: string;
    tarifa_consulta?: number;
    calificacion_promedio: number;
    total_consultas: number;
    biografia?: string;
  };
  estadisticas: {
    total_citas: number;
    citas_completadas: number;
    citas_programadas: number;
    citas_hoy: number;
    citas_futuras: number;
    total_pacientes: number;
    ingreso_promedio_cita: number;
  };
}

export default function EstadisticasPage() {
  const { token } = useAuth();
  const [perfil, setPerfil] = useState<PerfilMedico | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!token) return;
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const perfilRes = await fetch("/api/medico/perfil", { headers });
        if (perfilRes.ok) {
          const perfilData = await perfilRes.json();
          setPerfil(perfilData);
        }
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarDatos();
  }, [token]);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["medico"]}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <p className="text-gray-600 text-sm">Cargando estadísticas...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["medico"]}>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Estadísticas</h1>
            <p className="text-gray-600 text-sm sm:text-base">Métricas de tu práctica médica</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-white shadow-sm border-0 sm:border">
              <CardHeader>
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                  Estadísticas de Práctica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {perfil?.estadisticas?.total_citas || 0}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Total Citas</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {perfil?.estadisticas?.citas_completadas || 0}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Completadas</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      S/ {Number(perfil?.estadisticas?.ingreso_promedio_cita || 0).toFixed(0)}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Ingreso Promedio</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {perfil?.informacion_profesional?.anos_experiencia || 0}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Años Experiencia</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0 sm:border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Información Profesional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Especialidad</p>
                  <p className="font-medium text-sm sm:text-base">
                    {perfil?.informacion_profesional?.especialidad?.nombre || "No definida"}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Colegiatura</p>
                  <p className="font-medium text-sm sm:text-base">
                    {perfil?.informacion_profesional?.numero_colegiatura || "No definida"}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Tarifa Consulta</p>
                  <p className="font-medium text-sm sm:text-base">
                    {perfil?.informacion_profesional?.tarifa_consulta
                      ? `S/ ${Number(perfil?.informacion_profesional.tarifa_consulta).toFixed(2)}`
                      : "No definida"}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Calificación</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-sm sm:text-base">
                      {Number(perfil?.informacion_profesional?.calificacion_promedio || 0).toFixed(1)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {perfil?.informacion_profesional?.total_consultas || 0} consultas
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
