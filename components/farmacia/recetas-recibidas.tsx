// components/farmacia/recetas-recibidas.tsx
// Componente que muestra recetas enviadas por pacientes a la farmacia
// Permite aceptar o rechazar cada receta con flujo dinámico

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
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
  AlertCircle,
  Search,
  FileText,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";

interface Medicamento {
  nombre_comercial: string;
  nombre_generico: string;
  cantidad_requerida: number;
  stock_disponible: number;
  estado_disponibilidad: string;
  precio_unitario: number;
  dosis?: string;
  frecuencia?: string;
  medicamento_id?: string;
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

interface Notificacion {
  tipo: "exito" | "error" | "info";
  mensaje: string;
}

interface RecetasRecibidaProps {
  onAceptarReceta?: () => void;
}

export default function RecetasRecibidas({ onAceptarReceta }: RecetasRecibidaProps) {
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("enviada");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(
    null
  );
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [accionConfirmada, setAccionConfirmada] = useState<
    "aceptar" | "rechazar" | null
  >(null);
  const [estadisticas, setEstadisticas] = useState({
    enviadas: 0,
    recibidas: 0,
    rechazadas: 0,
    dispensadas: 0,
  });

  useEffect(() => {
    if (token) {
      cargarRecetas();
    }
  }, [filtroEstado, pagina, busqueda, token]);

  const cargarRecetas = async () => {
    try {
      setCargando(true);

      if (!token) {
        console.error("Token no disponible");
        return;
      }

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.detalle ||
            `Error ${response.status} al cargar recetas`
        );
      }

      const data = await response.json();
      setRecetas(data.recetas || []);
      setEstadisticas(
        data.estadisticas || {
          enviadas: 0,
          recibidas: 0,
          rechazadas: 0,
          dispensadas: 0,
        }
      );
    } catch (error) {
      console.error("Error cargando recetas:", error);
      // No lancar alerta, solo registrar el error
    } finally {
      setCargando(false);
    }
  };

  const responderReceta = async (
    recetaId: string,
    accion: "aceptar" | "rechazar"
  ) => {
    try {
      // Validar requisitos
      if (accion === "rechazar" && !motivoRechazo.trim()) {
        setNotificacion({
          tipo: "error",
          mensaje: "Debe ingresar un motivo de rechazo",
        });
        return;
      }

      if (!token) {
        setNotificacion({
          tipo: "error",
          mensaje: "Token no disponible",
        });
        return;
      }

      setProcesando(true);
      setMostrarConfirmacion(false);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al responder receta");
      }

      // Actualizar lista local inmediatamente
      setRecetas((prevRecetas) =>
        prevRecetas.map((r) =>
          r.id === recetaId
            ? {
                ...r,
                estado_envio: accion === "aceptar" ? "recibida" : "rechazada",
              }
            : r
        )
      );

      // Limpiar formulario
      setMotivoRechazo("");
      setRecetaSeleccionada(null);
      setMostrarDetalles(false);

      // Mostrar notificación de éxito
      const mensaje =
        accion === "aceptar"
          ? "Receta aceptada correctamente. Redireccionando a despacho..."
          : "Receta rechazada correctamente";

      setNotificacion({
        tipo: "exito",
        mensaje,
      });

      // Recargar datos
      setTimeout(() => {
        cargarRecetas();
      }, 800);

      // Si fue aceptada, llamar al callback para cambiar de módulo
      if (accion === "aceptar" && onAceptarReceta) {
        setTimeout(() => {
          onAceptarReceta();
        }, 1500);
      }
    } catch (error) {
      setNotificacion({
        tipo: "error",
        mensaje:
          error instanceof Error ? error.message : "Error al procesar receta",
      });
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

  const handleBusqueda = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setPagina(1); // Reiniciar paginación al buscar
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Recetas Recibidas
          </h1>
          <p className="text-gray-600 text-base">
            Gestiona las recetas enviadas por pacientes, acepta o rechaza según
            disponibilidad
          </p>
        </div>

        {/* Notificaciones */}
        {notificacion && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
              notificacion.tipo === "exito"
                ? "bg-green-50 border border-green-200"
                : notificacion.tipo === "error"
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {notificacion.tipo === "exito" ? (
              <CheckCircle
                className="text-green-600 flex-shrink-0 mt-0.5"
                size={20}
              />
            ) : notificacion.tipo === "error" ? (
              <AlertCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={20}
              />
            ) : (
              <AlertCircle
                className="text-blue-600 flex-shrink-0 mt-0.5"
                size={20}
              />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={
                  notificacion.tipo === "exito"
                    ? "text-green-800"
                    : notificacion.tipo === "error"
                    ? "text-red-800"
                    : "text-blue-800"
                }
              >
                {notificacion.mensaje}
              </p>
            </div>
            <button
              onClick={() => setNotificacion(null)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-3">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Enviadas</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {estadisticas.enviadas}
                  </p>
                </div>
                <Package className="text-yellow-400" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-3">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Recibidas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {estadisticas.recibidas}
                  </p>
                </div>
                <CheckCircle className="text-green-400" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-3">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Rechazadas
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {estadisticas.rechazadas}
                  </p>
                </div>
                <XCircle className="text-red-400" size={40} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-3">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Dispensadas
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {estadisticas.dispensadas}
                  </p>
                </div>
                <Pill className="text-blue-400" size={40} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles de Filtro y Búsqueda */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            {/* Filtros por estado */}
            <div className="flex flex-wrap gap-2">
              {["enviada", "recibida", "rechazada", "dispensada"].map(
                (estado) => (
                  <Button
                    key={estado}
                    variant={filtroEstado === estado ? "default" : "outline"}
                    onClick={() => {
                      setFiltroEstado(estado);
                      setPagina(1);
                    }}
                    className="font-medium"
                  >
                    {obtenerIconoEstado(estado)}{" "}
                    {estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </Button>
                )
              )}
            </div>

            {/* Input de búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código de receta, nombre de paciente o DNI..."
                value={busqueda}
                onChange={handleBusqueda}
                className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Recetas */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Medicamentos
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Disponibilidad
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Enviada
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Vence
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cargando ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <LoaderCircle
                        className="inline-block animate-spin text-blue-600 mr-3"
                        size={24}
                      />
                      <span className="text-gray-600">Cargando recetas...</span>
                    </td>
                  </tr>
                ) : recetas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Package
                        className="inline-block text-gray-300 mb-3"
                        size={40}
                      />
                      <p className="text-gray-500 text-base">
                        No hay recetas en este estado
                      </p>
                    </td>
                  </tr>
                ) : (
                  recetas.map((receta) => (
                    <tr
                      key={receta.id}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900 text-base">
                          {receta.codigo_receta}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <User
                            size={18}
                            className="text-gray-400 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">
                              {receta.paciente.nombre}{" "}
                              {receta.paciente.apellido}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {receta.paciente.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center">
                          <p className="font-bold text-gray-900 text-lg">
                            {receta.medicamentos.length}
                          </p>
                          <p className="text-xs text-gray-600">
                            {receta.medicamentos_disponibles} ✓
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {receta.disponibilidad_completa ? (
                          <Badge className="bg-green-100 text-green-800 font-semibold text-xs px-3 py-1">
                            ✓ Completa
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800 font-semibold text-xs px-3 py-1">
                            ⚠️ {receta.medicamentos_disponibles}/
                            {receta.medicamentos.length}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        <span className="font-medium">
                          {new Date(receta.fecha_envio).toLocaleDateString(
                            "es-PE",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`font-semibold text-sm ${
                            new Date(receta.fecha_vencimiento) < new Date()
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {new Date(
                            receta.fecha_vencimiento
                          ).toLocaleDateString("es-PE", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge
                          className={`${obtenerColorEstado(
                            receta.estado_envio
                          )} font-semibold text-xs px-3 py-1`}
                        >
                          {obtenerIconoEstado(receta.estado_envio)}{" "}
                          {receta.estado_envio}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRecetaSeleccionada(receta);
                              setMostrarDetalles(true);
                            }}
                            className="text-xs h-8 px-2"
                          >
                            <Eye size={14} />
                          </Button>

                          {receta.estado_envio === "enviada" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-8 px-2"
                                onClick={() => {
                                  setRecetaSeleccionada(receta);
                                  setAccionConfirmada("aceptar");
                                  setMostrarConfirmacion(true);
                                }}
                                disabled={procesando}
                              >
                                {procesando ? (
                                  <LoaderCircle
                                    className="animate-spin mr-1"
                                    size={14}
                                  />
                                ) : (
                                  <>✓ Aceptar</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setRecetaSeleccionada(receta);
                                  setMostrarDetalles(true);
                                }}
                                disabled={procesando}
                                className="text-xs h-8 px-2 font-semibold"
                              >
                                ✕ Rechazar
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
          <DialogContent className="w-full max-w-3xl max-h-[95vh] overflow-y-auto p-0">
            {recetaSeleccionada && (
              <>
                <DialogHeader className="sticky top-0 bg-white z-10 px-8 py-6 border-b border-gray-200">
                  <DialogTitle className="flex items-center gap-2 text-2xl">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Receta {recetaSeleccionada.codigo_receta}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Detalles completos de la receta y medicamentos prescritos
                  </DialogDescription>
                </DialogHeader>

                <div className="px-8 py-6 space-y-6">
                  {/* Información del Paciente y Médico */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <User className="w-5 h-5 text-blue-600" />
                          <h3 className="font-bold text-gray-900">Paciente</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-gray-600 text-xs uppercase tracking-wider">
                              Nombre
                            </p>
                            <p className="font-bold text-lg text-gray-900">
                              {recetaSeleccionada.paciente.nombre}{" "}
                              {recetaSeleccionada.paciente.apellido}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs uppercase tracking-wider">
                              Email
                            </p>
                            <p className="text-gray-900 font-medium break-all">
                              {recetaSeleccionada.paciente.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs uppercase tracking-wider">
                              Teléfono
                            </p>
                            <p className="text-gray-900 font-medium">
                              {recetaSeleccionada.paciente.telefono}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <h3 className="font-bold text-gray-900">
                            Médico Prescriptor
                          </h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-gray-600 text-xs uppercase tracking-wider">
                              Nombre
                            </p>
                            <p className="font-bold text-lg text-gray-900">
                              Dr. {recetaSeleccionada.medico.nombre}{" "}
                              {recetaSeleccionada.medico.apellido}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs uppercase tracking-wider">
                              Fechas
                            </p>
                            <p className="text-gray-900 text-sm">
                              Emitida:{" "}
                              <span className="font-semibold">
                                {new Date(
                                  recetaSeleccionada.fecha_emision
                                ).toLocaleDateString("es-PE")}
                              </span>
                            </p>
                            <p className="text-gray-900 text-sm">
                              Vence:{" "}
                              <span className="font-semibold">
                                {new Date(
                                  recetaSeleccionada.fecha_vencimiento
                                ).toLocaleDateString("es-PE")}
                              </span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Medicamentos */}
                  <Card className="border-0">
                    <CardHeader className="border-b bg-gray-50">
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-600" />
                        Medicamentos (
                        {recetaSeleccionada.medicamentos?.length || 0})
                      </CardTitle>
                      <CardDescription className="text-base">
                        {recetaSeleccionada.medicamentos_disponibles}{" "}
                        disponibles / {recetaSeleccionada.medicamentos.length}{" "}
                        totales
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {recetaSeleccionada.medicamentos &&
                        recetaSeleccionada.medicamentos.length > 0 ? (
                          recetaSeleccionada.medicamentos.map((med, idx) => (
                              <div
                                key={`med-${
                                  med.medicamento_id || med.nombre_comercial
                                }-${idx}`}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 transition-colors"
                              >
                                <div className="flex justify-between items-start gap-3 mb-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-base">
                                      {med.nombre_comercial}
                                    </p>
                                    <p className="text-gray-600 text-sm italic">
                                      {med.nombre_generico}
                                    </p>
                                  </div>
                                  <Badge
                                    className={`flex-shrink-0 text-xs font-semibold whitespace-nowrap ${
                                      med.estado_disponibilidad === "disponible"
                                        ? "bg-green-100 text-green-800"
                                        : med.estado_disponibilidad ===
                                          "sin-stock"
                                        ? "bg-red-100 text-red-800"
                                        : med.estado_disponibilidad ===
                                          "stock-insuficiente"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {med.estado_disponibilidad === "disponible"
                                      ? "✓ OK"
                                      : med.estado_disponibilidad ===
                                        "sin-stock"
                                      ? "Sin stock"
                                      : med.estado_disponibilidad ===
                                        "stock-insuficiente"
                                      ? "Insuficiente"
                                      : "Por vencer"}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div className="bg-blue-50 p-2 rounded">
                                    <p className="text-gray-600 text-xs font-semibold mb-1">
                                      Cantidad
                                    </p>
                                    <p className="font-bold text-gray-900">
                                      {med.cantidad_requerida}
                                    </p>
                                  </div>
                                  <div className="bg-green-50 p-2 rounded">
                                    <p className="text-gray-600 text-xs font-semibold mb-1">
                                      Stock
                                    </p>
                                    <p className="font-bold text-gray-900">
                                      {med.stock_disponible}
                                    </p>
                                  </div>
                                  {med.dosis && (
                                    <div className="bg-purple-50 p-2 rounded">
                                      <p className="text-gray-600 text-xs font-semibold mb-1">
                                        Dosis
                                      </p>
                                      <p className="font-bold text-gray-900">
                                        {med.dosis}
                                      </p>
                                    </div>
                                  )}
                                  <div className="bg-orange-50 p-2 rounded">
                                    <p className="text-gray-600 text-xs font-semibold mb-1">
                                      Precio
                                    </p>
                                    <p className="font-bold text-gray-900">
                                      S/{" "}
                                      {Number(med.precio_unitario).toFixed(2)}
                                    </p>
                                  </div>
                                </div>

                                {med.frecuencia && (
                                  <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                                    <span className="font-semibold text-gray-700">
                                      Frecuencia:
                                    </span>{" "}
                                    <span className="text-gray-600">
                                      {med.frecuencia}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))
                        ) : (
                          <p className="text-center text-gray-500 py-8">
                            No hay medicamentos en esta receta
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Formulario de Rechazo */}
                  {recetaSeleccionada.estado_envio === "enviada" && (
                    <Card className="border-l-4 border-l-red-500 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          Rechazar Receta
                        </CardTitle>
                        <CardDescription>
                          Proporciona un motivo para el rechazo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <textarea
                          placeholder="Ej: Sin stock de medicamentos, Documentación incompleta, Receta vencida..."
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                          className="w-full border border-red-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                          rows={3}
                        />
                        <Button
                          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold"
                          onClick={() => {
                            setAccionConfirmada("rechazar");
                            setMostrarConfirmacion(true);
                          }}
                          disabled={procesando || !motivoRechazo.trim()}
                        >
                          {procesando ? (
                            <>
                              <LoaderCircle
                                className="animate-spin mr-2"
                                size={16}
                              />
                              Procesando...
                            </>
                          ) : (
                            "Confirmar Rechazo"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Botones de Acción */}
                  <div className="flex gap-3 border-t pt-6">
                    {recetaSeleccionada.estado_envio === "enviada" && (
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-base h-10"
                        onClick={() => {
                          setAccionConfirmada("aceptar");
                          setMostrarConfirmacion(true);
                        }}
                        disabled={procesando}
                      >
                        {procesando ? (
                          <>
                            <LoaderCircle
                              className="animate-spin mr-2"
                              size={16}
                            />
                            Aceptando...
                          </>
                        ) : (
                          "✓ Aceptar Receta"
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="flex-1 text-base h-10 font-semibold"
                      onClick={() => {
                        setMostrarDetalles(false);
                        setMotivoRechazo("");
                      }}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmación */}
        <AlertDialog
          open={mostrarConfirmacion}
          onOpenChange={setMostrarConfirmacion}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {accionConfirmada === "aceptar"
                  ? "Aceptar Receta"
                  : "Rechazar Receta"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {accionConfirmada === "aceptar"
                  ? `¿Está seguro de que desea aceptar la receta ${recetaSeleccionada?.codigo_receta}? Se moverá a despacho inmediatamente.`
                  : `¿Está seguro de que desea rechazar la receta ${recetaSeleccionada?.codigo_receta}?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (recetaSeleccionada && accionConfirmada) {
                    responderReceta(recetaSeleccionada.id, accionConfirmada);
                  }
                }}
                className={
                  accionConfirmada === "aceptar"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {procesando ? (
                  <>
                    <LoaderCircle className="animate-spin mr-2" size={16} />
                    Procesando...
                  </>
                ) : accionConfirmada === "aceptar" ? (
                  "Aceptar"
                ) : (
                  "Rechazar"
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
