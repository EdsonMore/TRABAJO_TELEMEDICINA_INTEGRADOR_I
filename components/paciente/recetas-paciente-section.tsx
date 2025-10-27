// components/paciente/recetas-paciente-section.tsx
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Pill,
  Download,
  Search,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";

interface Receta {
  id: number;
  fecha_emision: string;
  medicamentos: any;
  instrucciones: string;
  estado: string;
  medico_nombre: string;
  especialidad: string;
  fecha_vencimiento: string;
  qr_code?: string;
  pdf_url?: string;
}

export function RecetasPacienteSection() {
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [filtroRecetas, setFiltroRecetas] = useState("");
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState("activas");

  useEffect(() => {
    cargarRecetas();
  }, []);

  const cargarRecetas = async () => {
    try {
      const response = await fetch("/api/paciente/recetas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecetas(data.recetas || []);
      }
    } catch (error) {
      console.error("Error cargando recetas:", error);
    } finally {
      setCargando(false);
    }
  };

  const descargarReceta = async (recetaId: number) => {
    try {
      const response = await fetch(`/api/recetas-digitales/${recetaId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receta_${recetaId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error descargando receta:", error);
    }
  };

  const recetasFiltradas = recetas.filter((receta) => {
    const coincideBusqueda =
      receta.medico_nombre
        .toLowerCase()
        .includes(filtroRecetas.toLowerCase()) ||
      receta.especialidad.toLowerCase().includes(filtroRecetas.toLowerCase()) ||
      (typeof receta.medicamentos === "string" &&
        receta.medicamentos
          .toLowerCase()
          .includes(filtroRecetas.toLowerCase()));

    if (tabActiva === "activas") {
      return coincideBusqueda && receta.estado === "activa";
    } else if (tabActiva === "dispensadas") {
      return coincideBusqueda && receta.estado === "dispensada";
    } else if (tabActiva === "vencidas") {
      return coincideBusqueda && receta.estado === "vencida";
    }
    return coincideBusqueda;
  });

  if (cargando) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando recetas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por médico, especialidad o medicamento..."
            value={filtroRecetas}
            onChange={(e) => setFiltroRecetas(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs de estado */}
      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="activas">Activas</TabsTrigger>
          <TabsTrigger value="dispensadas">Dispensadas</TabsTrigger>
          <TabsTrigger value="vencidas">Vencidas</TabsTrigger>
        </TabsList>

        <TabsContent value={tabActiva} className="space-y-4">
          {recetasFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filtroRecetas
                  ? "No se encontraron recetas con ese criterio"
                  : "No tienes recetas en esta categoría"}
              </p>
            </div>
          ) : (
            recetasFiltradas.map((receta) => (
              <Card key={receta.id} className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Receta #{receta.id}
                        </CardTitle>
                        <CardDescription>
                          Emitida el{" "}
                          {new Date(receta.fecha_emision).toLocaleDateString(
                            "es-PE"
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          receta.estado === "activa"
                            ? "default"
                            : receta.estado === "dispensada"
                            ? "secondary"
                            : "destructive"
                        }
                        className="capitalize"
                      >
                        {receta.estado}
                      </Badge>
                      {receta.estado === "vencida" && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Médico Prescriptor
                      </h4>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Dr(a):</span>{" "}
                          {receta.medico_nombre}
                        </p>
                        <p>
                          <span className="font-medium">Especialidad:</span>{" "}
                          {receta.especialidad}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fechas Importantes
                      </h4>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Emitida:</span>{" "}
                          {new Date(receta.fecha_emision).toLocaleDateString(
                            "es-PE"
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Vence:</span>{" "}
                          {new Date(
                            receta.fecha_vencimiento
                          ).toLocaleDateString("es-PE")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Medicamentos Prescritos
                    </h4>
                    <div className="bg-muted p-3 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap">
                        {typeof receta.medicamentos === "string"
                          ? receta.medicamentos
                          : JSON.stringify(receta.medicamentos, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {receta.instrucciones && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">
                        Instrucciones Especiales
                      </h4>
                      <p className="text-sm bg-muted p-3 rounded-lg">
                        {receta.instrucciones}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      onClick={() => descargarReceta(receta.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>
                    {receta.qr_code && (
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Ver QR
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
