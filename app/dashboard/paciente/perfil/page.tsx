"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { EditarPerfilModal } from "@/components/paciente/editar-perfil-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PerfilPaciente {
  id: string;
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  informacion_personal: {
    dni: string;
    edad: number;
    sexo: string;
    tipo_sangre?: string;
    direccion: string;
  };
  informacion_medica: {
    peso_kg?: number;
    altura_cm?: number;
    imc?: string;
    alergias?: string;
    enfermedades_cronicas?: string;
    seguro_medico?: string;
  };
  contacto_emergencia: {
    nombre?: string;
    telefono?: string;
  };
}

export default function PerfilPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [perfil, setPerfil] = useState<PerfilPaciente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false);

  const fetchPerfil = async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch("/api/paciente/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar perfil");
      const data = await res.json();
      setPerfil(data as PerfilPaciente);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
      try {
        toast({ title: "Error", description: err.message });
      } catch (e) {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfil();
  }, [token]);

  const getIMCStatus = (imc?: string) => {
    if (!imc) return { status: "Sin datos", color: "secondary" };
    const imcNum = Number.parseFloat(imc);
    if (imcNum < 18.5) return { status: "Bajo peso", color: "destructive" };
    if (imcNum < 25) return { status: "Normal", color: "default" };
    if (imcNum < 30) return { status: "Sobrepeso", color: "secondary" };
    return { status: "Obesidad", color: "destructive" };
  };

  const imcStatus = getIMCStatus(perfil?.informacion_medica.imc);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <User className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600 text-sm">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {error && (
          <div className="mb-4">
            <Card className="border border-red-200 bg-red-50">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-red-700">Error: {error}</div>
                  <Button size="sm" onClick={fetchPerfil}>
                    Reintentar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-white shadow-sm border-0 sm:border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Mi Perfil Médico
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Información personal y médica
                </CardDescription>
              </div>
              <Button
                onClick={() => setEditarPerfilOpen(true)}
                size="sm"
                className="w-full sm:w-auto h-10 sm:h-9"
              >
                <User className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8">
            {perfil && (
              <>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Nombre Completo</p>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {perfil.usuario.nombre} {perfil.usuario.apellido}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">DNI</p>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {perfil.informacion_personal.dni}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Email</p>
                      <p className="font-medium text-sm sm:text-base mt-1 flex items-center">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />
                        {perfil.usuario.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium text-sm sm:text-base mt-1 flex items-center">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500" />
                        {perfil.usuario.telefono || "No registrado"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                    <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                    Información Médica
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Tipo de Sangre</p>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {perfil.informacion_personal.tipo_sangre || "No registrado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Peso</p>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {perfil.informacion_medica.peso_kg ? `${perfil.informacion_medica.peso_kg} kg` : "No registrado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Altura</p>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {perfil.informacion_medica.altura_cm ? `${perfil.informacion_medica.altura_cm} cm` : "No registrado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">IMC</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="font-medium text-sm sm:text-base">
                          {perfil.informacion_medica.imc || "N/A"}
                        </p>
                        <Badge variant={imcStatus.color as any} className="text-xs">
                          {imcStatus.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs sm:text-sm text-gray-600">Alergias</p>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {perfil.informacion_medica.alergias || "Ninguna registrada"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                    Contacto de Emergencia
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Nombre</p>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {perfil.contacto_emergencia.nombre || "No registrado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {perfil.contacto_emergencia.telefono || "No registrado"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <EditarPerfilModal
          isOpen={editarPerfilOpen}
          onClose={() => setEditarPerfilOpen(false)}
          perfil={perfil}
          onPerfilActualizado={fetchPerfil}
        />
      </main>
    </div>
  );
}
