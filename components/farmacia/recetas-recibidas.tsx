// components/farmacia/recetas-recibidas.tsx
// Componente que muestra recetas enviadas por pacientes a la farmacia
// Permite aceptar o rechazar cada receta

"use client";

import { useState, useEffect } from "react";
import {
  Pill,
  Package,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LoaderCircle,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

interface Medicamento {
  nombre_comercial: string;
  nombre_generico: string;
  cantidad_requerida: number;
  stock_disponible: number;
  estado_disponibilidad: string;
  precio_unitario: number;
}

interface Receta {
  id: string;
  codigo_receta: string;
  estado_envio: string;
  estado_respuesta?: string;
  fecha_envio: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  paciente: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  medico: {
    nombre: string;
    apellido: string;
  };
  medicamentos: Medicamento[];
  medicamentos_disponibles: number;
  medicamentos_no_disponibles: number;
  disponibilidad_completa: boolean;
  precio_estimado: number;
  dias_para_vencer?: number;
}

export default function RecetasRecibidas() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("enviada");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [estadisticas, setEstadisticas] = useState({
    enviadas: 0,
    recibidas: 0,
    rechazadas: 0,
    dispensadas: 0,
  });

  useEffect(() => {
    cargarRecetas();
  }, [filtroEstado, pagina]);

  const cargarRecetas = async () => {
    try {
      setCargando(true);

      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        estado: filtroEstado,
        ...(busqueda && { busqueda }),
        pagina: pagina.toString(),
      });

      const response = await fetch(
        `/api/farmacia/recetas-recibidas?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar recetas");
      }

      const data = await response.json();
      setRecetas(data.recetas);
      setEstadisticas(data.estadisticas);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  const responderReceta = async (
    recetaId: string,
    accion: "aceptar" | "rechazar"
  ) => {
    try {
      setProcesando(true);

      if (accion === "rechazar" && !motivoRechazo.trim()) {
        alert("Debe ingresar un motivo de rechazo");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/farmacia/recetas-recibidas/${recetaId}/responder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accion,
            motivo_rechazo: accion === "rechazar" ? motivoRechazo : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      // Recargar recetas
      cargarRecetas();
      setMotivoRechazo("");
      setMostrarDetalles(false);
      setRecetaSeleccionada(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error");
    } finally {
      setProcesando(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    const colores: Record<string, string> = {
      enviada: "bg-yellow-100 text-yellow-800",
      recibida: "bg-green-100 text-green-800",
      rechazada: "bg-red-100 text-red-800",
      dispensada: "bg-blue-100 text-blue-800",
    };
    return colores[estado] || "bg-gray-100 text-gray-800";
  };

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case "enviada":
        return "📤";
      case "recibida":
        return "✅";
      case "rechazada":
        return "❌";
      case "dispensada":
        return "🎉";
      default:
        return "📋";
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enviadas</p>
              <p className="text-3xl font-bold text-yellow-600">
                {estadisticas.enviadas}
              </p>
            </div>
            <Package className="text-yellow-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recibidas</p>
              <p className="text-3xl font-bold text-green-600">
                {estadisticas.recibidas}
              </p>
            </div>
            <CheckCircle className="text-green-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rechazadas</p>
              <p className="text-3xl font-bold text-red-600">
                {estadisticas.rechazadas}
              </p>
            </div>
            <XCircle className="text-red-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dispensadas</p>
              <p className="text-3xl font-bold text-blue-600">
                {estadisticas.dispensadas}
              </p>
            </div>
            <Pill className="text-blue-400" size={32} />
          </div>
        </Card>
      </div>

      {/* Controles de Filtro y Búsqueda */}
      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          {["enviada", "recibida", "rechazada", "dispensada"].map((estado) => (
            <Button
              key={estado}
              variant={filtroEstado === estado ? "default" : "outline"}
              onClick={() => {
                setFiltroEstado(estado);
                setPagina(1);
              }}
              size="sm"
            >
              {obtenerIconoEstado(estado)} {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Tabla de Recetas */}
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Paciente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Medicamentos
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Disponibilidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cargando ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <LoaderCircle className="inline-block animate-spin" />
                  </td>
                </tr>
              ) : recetas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No hay recetas en este estado
                  </td>
                </tr>
              ) : (
                recetas.map((receta) => (
                  <tr key={receta.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">
                      {receta.codigo_receta}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {receta.paciente.nombre} {receta.paciente.apellido}
                          </p>
                          <p className="text-xs text-gray-500">
                            {receta.paciente.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">
                          {receta.medicamentos.length}
                        </p>
                        <p className="text-xs text-gray-500">
                          {receta.medicamentos_disponibles} disponibles
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {receta.disponibilidad_completa ? (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Completa
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">
                          ⚠️ Parcial
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(receta.fecha_envio).toLocaleDateString("es-PE")}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={obtenerColorEstado(receta.estado_envio)}>
                        {obtenerIconoEstado(receta.estado_envio)}{" "}
                        {receta.estado_envio}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRecetaSeleccionada(receta);
                            setMostrarDetalles(true);
                          }}
                        >
                          <Eye size={14} />
                        </Button>

                        {receta.estado_envio === "enviada" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => responderReceta(receta.id, "aceptar")}
                              disabled={procesando}
                            >
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setRecetaSeleccionada(receta);
                                setMostrarDetalles(true);
                              }}
                              disabled={procesando}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Detalles */}
      <Dialog open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
        <DialogContent className="max-w-2xl">
          {recetaSeleccionada && (
            <>
              <DialogHeader>
                <DialogTitle>Receta {recetaSeleccionada.codigo_receta}</DialogTitle>
                <DialogDescription>
                  Detalles de la receta y medicamentos
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Información del Paciente */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Paciente</h3>
                  <p>
                    <strong>{recetaSeleccionada.paciente.nombre}{" "}
                      {recetaSeleccionada.paciente.apellido}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    {recetaSeleccionada.paciente.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    {recetaSeleccionada.paciente.telefono}
                  </p>
                </div>

                {/* Medicamentos */}
                <div>
                  <h3 className="font-semibold mb-2">Medicamentos</h3>
                  <div className="space-y-2">
                    {recetaSeleccionada.medicamentos.map((med, idx) => (
                      <div key={idx} className="border p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{med.nombre_comercial}</p>
                            <p className="text-sm text-gray-600">
                              {med.nombre_generico}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Cantidad: {med.cantidad_requerida}
                            </p>
                          </div>
                          <Badge
                            className={
                              med.estado_disponibilidad === "disponible"
                                ? "bg-green-100 text-green-800"
                                : med.estado_disponibilidad === "sin-stock"
                                ? "bg-red-100 text-red-800"
                                : med.estado_disponibilidad === "stock-insuficiente"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {med.estado_disponibilidad === "disponible"
                              ? "✓ Disponible"
                              : med.estado_disponibilidad === "sin-stock"
                              ? "Sin stock"
                              : med.estado_disponibilidad === "stock-insuficiente"
                              ? "Insuficiente"
                              : "Por vencer"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Stock disponible: {med.stock_disponible}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulario de Rechazo */}
                {recetaSeleccionada.estado_envio === "enviada" && (
                  <div className="space-y-3 bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900">Rechazar Receta</h3>
                    <textarea
                      placeholder="Motivo del rechazo..."
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      className="w-full border rounded p-2 text-sm"
                      rows={3}
                    />
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={() =>
                        responderReceta(
                          recetaSeleccionada.id,
                          "rechazar"
                        )
                      }
                      disabled={procesando || !motivoRechazo.trim()}
                    >
                      {procesando ? (
                        <>
                          <LoaderCircle className="animate-spin mr-2" size={16} />
                          Procesando...
                        </>
                      ) : (
                        "Rechazar Receta"
                      )}
                    </Button>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex gap-2">
                  {recetaSeleccionada.estado_envio === "enviada" && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        responderReceta(recetaSeleccionada.id, "aceptar")
                      }
                      disabled={procesando}
                    >
                      {procesando ? (
                        <>
                          <LoaderCircle className="animate-spin mr-2" size={16} />
                          Procesando...
                        </>
                      ) : (
                        "✓ Aceptar Receta"
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMostrarDetalles(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
