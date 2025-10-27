// components/paciente/resultados-laboratorio-section.tsx
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
  TestTube,
  Download,
  Search,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface ResultadoLaboratorio {
  id: number;
  solicitud_id: number;
  fecha_solicitud: string;
  fecha_resultado?: string;
  tipo_examen: string;
  laboratorio_nombre: string;
  medico_solicitante: string;
  estado: string;
  resultados?: any;
  observaciones?: string;
  valores_referencia?: any;
  pdf_url?: string;
}

export function ResultadosLaboratorioSection() {
  const { token } = useAuth();
  const [resultados, setResultados] = useState<ResultadoLaboratorio[]>([]);
  const [filtroResultados, setFiltroResultados] = useState("");
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState("todos");

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    try {
      const response = await fetch("/api/paciente/resultados-laboratorio", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResultados(data.resultados || []);
      }
    } catch (error) {
      console.error("Error cargando resultados:", error);
    } finally {
      setCargando(false);
    }
  };

  const descargarResultado = async (resultadoId: number) => {
    try {
      const response = await fetch(
        `/api/resultados-laboratorio/${resultadoId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resultado_${resultadoId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error descargando resultado:", error);
    }
  };

  const resultadosFiltrados = resultados.filter((resultado) => {
    const coincideBusqueda =
      resultado.tipo_examen
        .toLowerCase()
        .includes(filtroResultados.toLowerCase()) ||
      resultado.laboratorio_nombre
        .toLowerCase()
        .includes(filtroResultados.toLowerCase()) ||
      resultado.medico_solicitante
        .toLowerCase()
        .includes(filtroResultados.toLowerCase());

    if (tabActiva === "completados") {
      return coincideBusqueda && resultado.estado === "completado";
    } else if (tabActiva === "pendientes") {
      return coincideBusqueda && resultado.estado === "pendiente";
    } else if (tabActiva === "anormales") {
      return (
        coincideBusqueda &&
        resultado.estado === "completado" &&
        resultado.observaciones?.includes("anormal")
      );
    }
    return coincideBusqueda;
  });

  if (cargando) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando resultados...</p>
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
            placeholder="Buscar por tipo de examen, laboratorio o médico..."
            value={filtroResultados}
            onChange={(e) => setFiltroResultados(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs de estado */}
      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="completados">Completados</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="anormales">Anormales</TabsTrigger>
        </TabsList>

        <TabsContent value={tabActiva} className="space-y-4">
          {resultadosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filtroResultados
                  ? "No se encontraron resultados con ese criterio"
                  : "No tienes resultados en esta categoría"}
              </p>
            </div>
          ) : (
            resultadosFiltrados.map((resultado) => (
              <Card key={resultado.id} className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <TestTube className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {resultado.tipo_examen}
                        </CardTitle>
                        <CardDescription>
                          Solicitado el{" "}
                          {new Date(
                            resultado.fecha_solicitud
                          ).toLocaleDateString("es-PE")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          resultado.estado === "completado"
                            ? "default"
                            : resultado.estado === "pendiente"
                            ? "secondary"
                            : "outline"
                        }
                        className="capitalize"
                      >
                        {resultado.estado}
                      </Badge>
                      {resultado.estado === "completado" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {resultado.observaciones?.includes("anormal") && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Información del Examen
                      </h4>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Laboratorio:</span>{" "}
                          {resultado.laboratorio_nombre}
                        </p>
                        <p>
                          <span className="font-medium">
                            Médico solicitante:
                          </span>{" "}
                          {resultado.medico_solicitante}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fechas
                      </h4>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Solicitado:</span>{" "}
                          {new Date(
                            resultado.fecha_solicitud
                          ).toLocaleDateString("es-PE")}
                        </p>
                        {resultado.fecha_resultado && (
                          <p>
                            <span className="font-medium">Resultado:</span>{" "}
                            {new Date(
                              resultado.fecha_resultado
                            ).toLocaleDateString("es-PE")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {resultado.resultados && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <TestTube className="h-4 w-4" />
                        Resultados
                      </h4>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap">
                          {typeof resultado.resultados === "string"
                            ? resultado.resultados
                            : JSON.stringify(resultado.resultados, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {resultado.observaciones && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground">
                        Observaciones
                      </h4>
                      <p className="text-sm bg-muted p-3 rounded-lg">
                        {resultado.observaciones}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-border">
                    {resultado.estado === "completado" && (
                      <Button
                        onClick={() => descargarResultado(resultado.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar PDF
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
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
