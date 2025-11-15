// app/recetas/verificar/[codigo]/page.tsx - VERSIÓN CORREGIDA
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  User,
  Pill,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface RecetaVerificada {
  id: string;
  codigo_receta: string;
  diagnostico_principal_texto: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  observaciones?: string;
  estado: "activa" | "dispensada" | "vencida" | "cancelada";
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  total_medicamentos: number;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  medicamentos: any[];
  valida: boolean;
  mensaje: string;
}

export default function VerificarRecetaPage() {
  const params = useParams();
  const codigo = params?.codigo as string; // ✅ Agregado el optional chaining

  const [receta, setReceta] = useState<RecetaVerificada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (codigo) {
      verificarReceta(codigo);
    } else {
      setError("Código de receta no válido");
      setCargando(false);
    }
  }, [codigo]);

  const verificarReceta = async (codigoReceta: string) => {
    try {
      setCargando(true);
      const response = await fetch(`/api/recetas/verificar/${codigoReceta}`);

      if (response.ok) {
        const data = await response.json();
        setReceta(data.receta);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al verificar receta");
      }
    } catch (error) {
      setError("Error de conexión al verificar receta");
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const getEstadoBadge = (estado: string, valida: boolean) => {
    if (!valida) {
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 border-red-200"
        >
          <XCircle className="w-3 h-3 mr-1" />
          Inválida
        </Badge>
      );
    }

    const configs = {
      activa: {
        label: "Activa",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 border-green-200",
      },
      dispensada: {
        label: "Dispensada",
        icon: CheckCircle,
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      vencida: {
        label: "Vencida",
        icon: AlertCircle,
        className: "bg-red-100 text-red-800 border-red-200",
      },
      cancelada: {
        label: "Cancelada",
        icon: XCircle,
        className: "bg-gray-100 text-gray-800 border-gray-200",
      },
    };

    const config = configs[estado as keyof typeof configs] || {
      label: estado,
      icon: AlertCircle,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const IconComponent = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Estado: Sin código
  if (!codigo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Código no válido
            </h2>
            <p className="text-gray-600 mb-4">
              El código de receta no es válido o no fue proporcionado
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando receta médica...</p>
            <p className="text-sm text-gray-500 mt-2">Código: {codigo}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !receta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Receta no encontrada
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "La receta solicitada no existe o ha sido eliminada"}
            </p>
            <p className="text-sm text-gray-500">Código: {codigo}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header de verificación */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className={`p-3 rounded-full ${
                    receta.valida
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {receta.valida ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {receta.valida ? "Receta Válida" : "Receta Inválida"}
                  </h1>
                  <p className="text-gray-600">{receta.mensaje}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Código</p>
                <p className="font-mono text-lg font-bold">
                  {receta.codigo_receta}
                </p>
                {getEstadoBadge(receta.estado, receta.valida)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de la receta */}
        <div className="grid gap-6">
          {/* Información del médico */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2" />
                Médico Prescriptor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-800">
                    Dr. {receta.medico_nombre} {receta.medico_apellido}
                  </p>
                  <p className="text-sm text-gray-600">{receta.especialidad}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <strong>Paciente:</strong> {receta.paciente_nombre}{" "}
                    {receta.paciente_apellido}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>DNI:</strong> {receta.paciente_dni}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la receta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <FileText className="w-5 h-5 mr-2" />
                Información de la Receta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-gray-700">
                  Diagnóstico Principal
                </p>
                <p className="bg-gray-100 p-3 rounded border text-gray-800">
                  {receta.diagnostico_principal_texto}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Emisión: {formatearFecha(receta.fecha_emision)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Vence: {formatearFecha(receta.fecha_vencimiento)}</span>
                </div>
              </div>

              {receta.observaciones && (
                <div>
                  <p className="font-medium text-gray-700">Observaciones</p>
                  <p className="bg-gray-100 p-3 rounded border text-gray-800">
                    {receta.observaciones}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medicamentos */}
          {receta.medicamentos && receta.medicamentos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Pill className="w-5 h-5 mr-2" />
                  Medicamentos ({receta.medicamentos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {receta.medicamentos.map((med: any, index: number) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {med.nombre_comercial ||
                              "Medicamento no especificado"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {med.nombre_generico || ""}
                          </p>
                        </div>
                        <Badge
                          variant={med.dispensado ? "default" : "outline"}
                          className={
                            med.dispensado
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {med.dispensado ? "Dispensado" : "Pendiente"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Dosis:
                          </span>
                          <p>{med.dosis || "No especificada"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Frecuencia:
                          </span>
                          <p>{med.frecuencia || "No especificada"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Duración:
                          </span>
                          <p>{med.duracion_dias || 0} días</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Cantidad:
                          </span>
                          <p>{med.cantidad || 0} unidades</p>
                        </div>
                      </div>

                      {med.instrucciones_especiales && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-700">
                            Instrucciones:
                          </span>
                          <p className="text-gray-800">
                            {med.instrucciones_especiales}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => window.print()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Imprimir Verificación
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Volver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
