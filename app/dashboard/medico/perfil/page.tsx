// app/dashboard/medico/perfil/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Stethoscope,
  MapPin,
  Mail,
  Phone,
  FileText,
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

export default function PerfilPage() {
  const { token } = useAuth();
  const [perfil, setPerfil] = useState<PerfilMedico | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarPerfil = async () => {
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
        console.error("Error cargando perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarPerfil();
  }, [token]);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["medico"]}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
          <p className="text-gray-600 text-sm">Cargando perfil...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["medico"]}>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mi Perfil Profesional</h1>
            <p className="text-gray-600 text-sm sm:text-base">Información personal y profesional</p>
          </div>

          <Card className="bg-white shadow-sm border-0 sm:border">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Mi Perfil Profesional</CardTitle>
              <CardDescription className="text-sm sm:text-base">Información personal y profesional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {perfil && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Información Personal
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Nombre Completo</p>
                          <p className="font-medium text-sm sm:text-base">Dr. {perfil.usuario.nombre} {perfil.usuario.apellido}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Email</p>
                          <p className="font-medium text-sm sm:text-base flex items-center">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />
                            {perfil.usuario.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Teléfono</p>
                          <p className="font-medium text-sm sm:text-base flex items-center">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />
                            {perfil.usuario.telefono}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                        <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Información Profesional
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Especialidad</p>
                          <p className="font-medium text-sm sm:text-base">{perfil.informacion_profesional.especialidad.nombre}</p>
                          <p className="text-xs sm:text-sm text-gray-500">{perfil.informacion_profesional.especialidad.descripcion}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Número de Colegiatura</p>
                          <p className="font-medium text-sm sm:text-base">{perfil.informacion_profesional.numero_colegiatura}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Años de Experiencia</p>
                          <p className="font-medium text-sm sm:text-base">{perfil.informacion_profesional.anos_experiencia} años</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {perfil.informacion_profesional.direccion_consultorio && (
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Consultorio
                      </h3>
                      <p className="font-medium text-sm sm:text-base flex items-center">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />
                        {perfil.informacion_profesional.direccion_consultorio}
                      </p>
                    </div>
                  )}

                  {perfil.informacion_profesional.biografia && (
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                        Biografía
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base">{perfil.informacion_profesional.biografia}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
