// app/dashboard/telemedicina/page.tsx
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Calendar,
  Users,
  Clock,
  Play,
  Plus,
  ArrowLeft,
} from "lucide-react";

export default function TelemedicinaMedicoPage() {
  const { usuario, token } = useAuth();
  const [sesiones, setSesiones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarSesionesTelemedicina();
  }, [token]);

  const cargarSesionesTelemedicina = async () => {
    try {
      const response = await fetch("/api/telemedicina/sesiones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSesiones(data.sesiones);
      }
    } catch (error) {
      console.error("Error cargando sesiones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const unirseAVideollamada = async (sesionId: string) => {
    try {
      const response = await fetch("/api/telemedicina/token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sesion_id: sesionId }),
      });

      const data = await response.json();
      if (data.success) {
        window.open(`/telemedicina/sesion/${sesionId}`, "_blank");
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["medico"]}>
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Panel de Telemedicina</h1>
                  <p className="text-muted-foreground">
                    Gestiona tus consultas virtuales
                  </p>
                </div>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Sesión
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="proximas">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="proximas">Próximas Sesiones</TabsTrigger>
              <TabsTrigger value="activas">En Curso</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="proximas" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sesiones
                  .filter((s) => s.estado === "programada")
                  .map((sesion) => (
                    <Card key={sesion.id} className="medical-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{sesion.titulo}</span>
                          <Badge variant="outline">Programada</Badge>
                        </CardTitle>
                        <CardDescription>{sesion.descripcion}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(
                              sesion.fecha_programada
                            ).toLocaleDateString("es-PE")}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {new Date(
                              sesion.fecha_programada
                            ).toLocaleTimeString("es-PE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-2" />
                            {sesion.paciente_nombre} {sesion.paciente_apellido}
                          </div>
                          <Button
                            onClick={() => unirseAVideollamada(sesion.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Iniciar Sesión
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="activas">
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay sesiones activas en este momento
                </p>
              </div>
            </TabsContent>

            <TabsContent value="historial">
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay historial de sesiones
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
