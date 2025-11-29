// components/farmacia/recetas-recibidas.tsx
// Componente que muestra recetas enviadas por pacientes a la farmacia
// Permite aceptar o rechazar cada receta con flujo dinámico

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface Notificacion {
  tipo: "exito" | "error" | "info";
  mensaje: string;
}

export default function RecetasRecibidas() {
  const router = useRouter();
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("enviada");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [accionConfirmada, setAccionConfirmada] = useState<"aceptar" | "rechazar" | null>(null);
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
        throw new Error(errorData.error || errorData.detalle || `Error ${response.status} al cargar recetas`);
      }

      const data = await response.json();
      setRecetas(data.recetas || []);
      setEstadisticas(data.estadisticas || {
        enviadas: 0,
        recibidas: 0,
        rechazadas: 0,
        dispensadas: 0,
      });
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
      setRecetas(prevRecetas =>
        prevRecetas.map(r =>
          r.id === recetaId
            ? { ...r, estado_envio: accion === "aceptar" ? "recibida" : "rechazada" }
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

      // Si fue aceptada, redirigir a despacho
      if (accion === "aceptar") {
        setTimeout(() => {
          router.push("/dashboard/farmacia/despacho-recetas");
        }, 1500);
      }
    } catch (error) {
      setNotificacion({
        tipo: "error",
        mensaje: error instanceof Error ? error.message : "Error al procesar receta",
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
    <div className="space-y-6">
      {/* Notificaciones */}
      {notificacion && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            notificacion.tipo === "exito"
              ? "bg-green-50 border border-green-200"
              : notificacion.tipo === "error"
              ? "bg-red-50 border border-red-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          {notificacion.tipo === "exito" ? (
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          ) : notificacion.tipo === "error" ? (
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          ) : (
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          )}
          <div className="flex-1">
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
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}
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
      <Card className="p-4 space-y-4">
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

        {/* Input de búsqueda */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por código de receta o nombre de paciente..."
            value={busqueda}
            onChange={handleBusqueda}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
                  Enviada
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Vence
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
                          ⚠️ {receta.medicamentos_disponibles}/{receta.medicamentos_totales}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {new Date(receta.fecha_envio).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <span className={new Date(receta.fecha_vencimiento) < new Date() ? "text-red-600 font-semibold" : ""}>
                        {new Date(receta.fecha_vencimiento).toLocaleDateString("es-PE")}
                      </span>
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
                              onClick={() => {
                                setRecetaSeleccionada(receta);
                                setAccionConfirmada("aceptar");
                                setMostrarConfirmacion(true);
                              }}
                              disabled={procesando}
                            >
                              {procesando ? (
                                <>
                                  <LoaderCircle className="animate-spin mr-1" size={14} />
                                </>
                              ) : (
                                <>Aceptar</>
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
        <DialogContent className="w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto">
          {recetaSeleccionada && (
            <>
              <DialogHeader className="sticky top-0 bg-white z-10 pb-2">
                <DialogTitle className="text-lg">Receta {recetaSeleccionada.codigo_receta}</DialogTitle>
                <DialogDescription className="text-xs">
                  Detalles de la receta y medicamentos
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 px-1">
                {/* Información del Paciente */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">Paciente</h3>
                  <p className="text-sm">
                    <strong>{recetaSeleccionada.paciente.nombre}{" "}
                      {recetaSeleccionada.paciente.apellido}</strong>
                  </p>
                  <p className="text-xs text-gray-600">
                    {recetaSeleccionada.paciente.email}
                  </p>
                  <p className="text-xs text-gray-600">
                    {recetaSeleccionada.paciente.telefono}
                  </p>
                </div>

                {/* Información de Fechas */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h3 className="font-semibold text-xs mb-1 text-purple-900">Emitida</h3>
                    <p className="text-xs text-purple-700">
                      {new Date(recetaSeleccionada.fecha_emision).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <h3 className="font-semibold text-xs mb-1 text-orange-900">Vence</h3>
                    <p className="text-xs text-orange-700">
                      {new Date(recetaSeleccionada.fecha_vencimiento).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                </div>

                {/* Medicamentos */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">Medicamentos ({recetaSeleccionada.medicamentos?.length || 0})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recetaSeleccionada.medicamentos && recetaSeleccionada.medicamentos.length > 0 ? (
                      (() => {
                        // Deduplicar medicamentos por medicamento_id o nombre_comercial
                        const medicamentosUnicos = recetaSeleccionada.medicamentos.reduce((unique: any[], med: any) => {
                          const existe = unique.some(
                            (u: any) => u.medicamento_id === med.medicamento_id || u.nombre_comercial === med.nombre_comercial
                          );
                          if (!existe) {
                            unique.push(med);
                          }
                          return unique;
                        }, []);

                        return medicamentosUnicos.map((med, idx) => (
                          <div key={`med-${med.medicamento_id || med.nombre_comercial}-${idx}`} className="border p-2 rounded text-xs bg-white hover:bg-gray-50 transition">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate text-gray-900">{med.nombre_comercial}</p>
                                <p className="text-gray-600 truncate text-xs">
                                  {med.nombre_generico}
                                </p>
                                <p className="text-gray-500 text-xs mt-0.5">
                                  <span className="font-medium">Cantidad:</span> {med.cantidad_requerida}
                                </p>
                              </div>
                              <Badge
                                className={`flex-shrink-0 text-xs whitespace-nowrap ${
                                  med.estado_disponibilidad === "disponible"
                                    ? "bg-green-100 text-green-800"
                                    : med.estado_disponibilidad === "sin-stock"
                                    ? "bg-red-100 text-red-800"
                                    : med.estado_disponibilidad === "stock-insuficiente"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {med.estado_disponibilidad === "disponible"
                                  ? "✓ OK"
                                  : med.estado_disponibilidad === "sin-stock"
                                  ? "Sin stock"
                                  : med.estado_disponibilidad === "stock-insuficiente"
                                  ? "Insuficiente"
                                  : "Por vencer"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                              <p className="text-gray-600">
                                <span className="font-medium">Stock:</span> {med.stock_disponible}
                              </p>
                              {med.dosis && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Dosis:</span> {med.dosis}
                                </p>
                              )}
                              {med.frecuencia && (
                                <p className="text-gray-600 col-span-2">
                                  <span className="font-medium">Frecuencia:</span> {med.frecuencia}
                                </p>
                              )}
                            </div>
                          </div>
                        ));
                      })()
                    ) : (
                      <p className="text-gray-500 text-xs">No hay medicamentos</p>
                    )}
                  </div>
                </div>

                {/* Formulario de Rechazo */}
                {recetaSeleccionada.estado_envio === "enviada" && (
                  <div className="space-y-2 bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <h3 className="font-semibold text-red-900 text-sm">Rechazar</h3>
                        <p className="text-xs text-red-700">
                          Motivo para rechazo
                        </p>
                      </div>
                    </div>
                    <textarea
                      placeholder="Ej: Sin stock, Documentación incompleta..."
                      value={motivoRechazo}
                      onChange={(e) => setMotivoRechazo(e.target.value)}
                      className="w-full border border-red-300 rounded p-2 text-xs focus:ring-2 focus:ring-red-500"
                      rows={2}
                    />
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                      onClick={() => {
                        setAccionConfirmada("rechazar");
                        setMostrarConfirmacion(true);
                      }}
                      disabled={procesando || !motivoRechazo.trim()}
                    >
                      {procesando ? (
                        <>
                          <LoaderCircle className="animate-spin mr-1" size={14} />
                          Procesando...
                        </>
                      ) : (
                        "Confirmar Rechazo"
                      )}
                    </Button>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex gap-2 pt-2 border-t">
                  {recetaSeleccionada.estado_envio === "enviada" && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                      onClick={() => {
                        setAccionConfirmada("aceptar");
                        setMostrarConfirmacion(true);
                      }}
                      disabled={procesando}
                    >
                      {procesando ? (
                        <>
                          <LoaderCircle className="animate-spin mr-1" size={14} />
                          Aceptando...
                        </>
                      ) : (
                        "✓ Aceptar"
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={() => {
                      setMostrarDetalles(false);
                      setMotivoRechazo("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmación */}
      <AlertDialog open={mostrarConfirmacion} onOpenChange={setMostrarConfirmacion}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accionConfirmada === "aceptar" ? "Aceptar Receta" : "Rechazar Receta"}
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
  );
}
