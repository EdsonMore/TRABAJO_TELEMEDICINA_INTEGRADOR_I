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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Package,
  Check,
  AlertTriangle,
  Clock,
  Search,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Download,
} from "lucide-react";

interface Medicamento {
  id: string;
  nombre_comercial: string;
  nombre_generico: string;
  cantidad_requerida: number;
  stock_disponible: number;
  precio_unitario: number;
  lote: string;
  disponible: boolean;
}

interface Receta {
  id: string;
  codigo_receta: string;
  estado: "pendiente" | "en_proceso" | "dispensada";
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  medico_nombre: string;
  especialidad: string;
  fecha_emision: string;
  total_medicamentos: number;
  medicamentos: Medicamento[];
}

interface DespachoRecetasProps {
  onVolver?: () => void;
}

export default function DespachoRecetas({
  onVolver,
}: DespachoRecetasProps) {
  const { token } = useAuth();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [recetasFiltradas, setRecetasFiltradas] = useState<Receta[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // Despacho
  const [recetaSeleccionada, setRecetaSeleccionada] = useState<Receta | null>(
    null
  );
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [accionConfirmada, setAccionConfirmada] = useState<
    "preparar" | "despachar" | "rechazar" | null
  >(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  // Medicamentos seleccionados para despacho
  const [medicamentosDespacho, setMedicamentosDespacho] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (token) {
      cargarRecetas();
    }
  }, [token]);

  useEffect(() => {
    filtrarRecetas();
  }, [recetas, busqueda, filtroEstado]);

  const cargarRecetas = async () => {
    if (!token) return;

    try {
      setCargando(true);
      const response = await fetch("/api/farmacia/recetas", {
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

  const filtrarRecetas = () => {
    let filtradas = recetas;

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtradas = filtradas.filter(
        (r) =>
          r.paciente_nombre.toLowerCase().includes(busquedaLower) ||
          r.paciente_apellido.toLowerCase().includes(busquedaLower) ||
          r.paciente_dni.includes(busqueda) ||
          r.codigo_receta.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro por estado
    if (filtroEstado === "pendiente") {
      filtradas = filtradas.filter((r) => r.estado === "pendiente");
    } else if (filtroEstado === "en_proceso") {
      filtradas = filtradas.filter((r) => r.estado === "en_proceso");
    } else if (filtroEstado === "dispensadas") {
      filtradas = filtradas.filter((r) => r.estado === "dispensada");
    }

    setRecetasFiltradas(filtradas);
  };

  const abrirDetalles = (receta: Receta) => {
    setRecetaSeleccionada(receta);
    setMedicamentosDespacho({});
    setMotivoRechazo("");
    setMostrarDetalles(true);
  };

  const procesarAccion = async (accion: "preparar" | "despachar" | "rechazar") => {
    if (!recetaSeleccionada || !token) return;

    // Validar medicamentos para despacho
    if (accion === "despachar") {
      const medicamentosValidos = recetaSeleccionada.medicamentos.filter((m) =>
        medicamentosDespacho[m.id]
      );

      if (medicamentosValidos.length === 0) {
        alert("Debe seleccionar al menos un medicamento para despachar");
        return;
      }

      for (const med of medicamentosValidos) {
        const cantidad = medicamentosDespacho[med.id];
        if (cantidad > med.stock_disponible) {
          alert(
            `Stock insuficiente para ${med.nombre_comercial}. Disponible: ${med.stock_disponible}`
          );
          return;
        }
      }
    }

    if (accion === "rechazar" && !motivoRechazo.trim()) {
      alert("Debe ingresar un motivo para rechazar");
      return;
    }

    setAccionConfirmada(accion);
    setMostrarConfirmacion(true);
  };

  const confirmarAccion = async () => {
    if (!recetaSeleccionada || !token || !accionConfirmada) return;

    try {
      setProcesando(true);

      const medicamentosA = recetaSeleccionada.medicamentos
        .filter((m) => medicamentosDespacho[m.id])
        .map((m) => ({
          medicamento_id: m.id,
          cantidad_dispensada: medicamentosDespacho[m.id],
          lote: m.lote,
          precio_unitario: m.precio_unitario,
        }));

      const response = await fetch(
        `/api/farmacia/recetas/${recetaSeleccionada.id}/procesar`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accion: accionConfirmada === "preparar" ? "preparar" : accionConfirmada === "despachar" ? "dispensar" : "rechazar",
            medicamentos_procesados: medicamentosA,
            observaciones: motivoRechazo,
          }),
        }
      );

      if (response.ok) {
        await cargarRecetas();
        setMostrarDetalles(false);
        setRecetaSeleccionada(null);
        alert(
          `Receta ${accionConfirmada === "despachar" ? "dispensada" : accionConfirmada === "preparar" ? "en preparación" : "rechazada"} correctamente`
        );
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error procesando receta:", error);
      alert("Error al procesar receta");
    } finally {
      setProcesando(false);
      setMostrarConfirmacion(false);
      setAccionConfirmada(null);
    }
  };

  const calcularCostoDespacho = () => {
    if (!recetaSeleccionada) return 0;

    return recetaSeleccionada.medicamentos
      .filter((m) => medicamentosDespacho[m.id])
      .reduce(
        (total, m) =>
          total + medicamentosDespacho[m.id] * m.precio_unitario,
        0
      );
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "en_proceso":
        return "bg-blue-100 text-blue-800";
      case "dispensada":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Despacho de Recetas</h1>
          <p className="text-gray-600 text-sm">
            Procesa y despacha recetas a pacientes
          </p>
        </div>
        {onVolver && (
          <Button variant="outline" onClick={onVolver}>
            ← Volver
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente, DNI o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filtroEstado === "pendiente" ? "default" : "outline"}
                onClick={() => setFiltroEstado("pendiente")}
                size="sm"
              >
                Pendientes
              </Button>
              <Button
                variant={
                  filtroEstado === "en_proceso" ? "default" : "outline"
                }
                onClick={() => setFiltroEstado("en_proceso")}
                size="sm"
              >
                En Proceso
              </Button>
              <Button
                variant={
                  filtroEstado === "dispensadas" ? "default" : "outline"
                }
                onClick={() => setFiltroEstado("dispensadas")}
                size="sm"
              >
                Dispensadas
              </Button>
            </div>

            <Button
              onClick={cargarRecetas}
              disabled={cargando}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {cargando ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recetas */}
      <div className="space-y-3">
        {recetasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {cargando ? "Cargando recetas..." : "No hay recetas en este estado"}
              </p>
            </CardContent>
          </Card>
        ) : (
          recetasFiltradas.map((receta) => (
            <Card
              key={receta.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => abrirDetalles(receta)}
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* Información del Paciente */}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {receta.paciente_nombre} {receta.paciente_apellido}
                    </p>
                    <p className="text-xs text-gray-600">
                      DNI: {receta.paciente_dni}
                    </p>
                    <p className="text-xs text-gray-600">
                      Receta: {receta.codigo_receta}
                    </p>
                  </div>

                  {/* Información Médica */}
                  <div>
                    <p className="text-xs text-gray-600">
                      <strong>Médico:</strong> Dr. {receta.medico_nombre}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Especialidad:</strong> {receta.especialidad}
                    </p>
                  </div>

                  {/* Medicamentos */}
                  <div>
                    <Badge variant="outline" className="bg-blue-50">
                      {receta.total_medicamentos} medicamento
                      {receta.total_medicamentos !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Estado */}
                  <div>
                    <Badge className={getEstadoColor(receta.estado)}>
                      {receta.estado === "pendiente"
                        ? "Pendiente"
                        : receta.estado === "en_proceso"
                        ? "En Proceso"
                        : "Dispensada"}
                    </Badge>
                  </div>

                  {/* Acción */}
                  <div className="text-right">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirDetalles(receta);
                      }}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Detalles y Despacho */}
      <Dialog open={mostrarDetalles} onOpenChange={setMostrarDetalles}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalles de Receta - {recetaSeleccionada?.codigo_receta}
            </DialogTitle>
          </DialogHeader>

          {recetaSeleccionada && (
            <div className="space-y-6">
              {/* Información de Paciente y Médico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Paciente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>Nombre:</strong>{" "}
                      {recetaSeleccionada.paciente_nombre}{" "}
                      {recetaSeleccionada.paciente_apellido}
                    </p>
                    <p>
                      <strong>DNI:</strong> {recetaSeleccionada.paciente_dni}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Médico</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>Médico:</strong> Dr.{" "}
                      {recetaSeleccionada.medico_nombre}
                    </p>
                    <p>
                      <strong>Especialidad:</strong>{" "}
                      {recetaSeleccionada.especialidad}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Medicamentos */}
              <Card>
                <CardHeader>
                  <CardTitle>Medicamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recetaSeleccionada.medicamentos.map((med) => (
                      <div
                        key={med.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {med.nombre_comercial}
                            </p>
                            <p className="text-sm text-gray-600">
                              {med.nombre_generico}
                            </p>
                          </div>
                          {med.disponible ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Disponible
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              No disponible
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Requerido</p>
                            <p className="font-semibold">
                              {med.cantidad_requerida} unidades
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Stock Disponible</p>
                            <p
                              className={`font-semibold ${
                                med.stock_disponible >= med.cantidad_requerida
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {med.stock_disponible} unidades
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Precio Unitario</p>
                            <p className="font-semibold">
                              S/ {med.precio_unitario.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {med.disponible && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={med.stock_disponible}
                              value={medicamentosDespacho[med.id] || ""}
                              onChange={(e) =>
                                setMedicamentosDespacho({
                                  ...medicamentosDespacho,
                                  [med.id]: parseInt(e.target.value) || 0,
                                })
                              }
                              placeholder="Cantidad a despachar"
                              className="w-32"
                              disabled={recetaSeleccionada.estado === "dispensada"}
                            />
                            <span className="text-sm text-gray-600">
                              {medicamentosDespacho[med.id]
                                ? `S/ ${(medicamentosDespacho[med.id] * med.precio_unitario).toFixed(2)}`
                                : "S/ 0.00"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resumen de Costo */}
              {Object.keys(medicamentosDespacho).some((k) => medicamentosDespacho[k] > 0) && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">
                        Costo Total del Despacho:
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        S/ {calcularCostoDespacho().toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Motivo de Rechazo (si aplica) */}
              {recetaSeleccionada.estado === "pendiente" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Motivo de Rechazo (opcional)
                  </label>
                  <Input
                    placeholder="Ingrese el motivo si desea rechazar la receta"
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                  />
                </div>
              )}

              {/* Botones de Acción */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => setMostrarDetalles(false)}
                >
                  Cerrar
                </Button>

                {recetaSeleccionada.estado === "pendiente" && (
                  <>
                    <Button
                      onClick={() => procesarAccion("preparar")}
                      disabled={procesando}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {procesando ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Clock className="w-4 h-4 mr-2" />
                      )}
                      Preparar
                    </Button>

                    <Button
                      onClick={() => procesarAccion("despachar")}
                      disabled={procesando || Object.values(medicamentosDespacho).every(v => !v)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {procesando ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Despachar
                    </Button>

                    <Button
                      onClick={() => procesarAccion("rechazar")}
                      disabled={procesando}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                  </>
                )}

                {recetaSeleccionada.estado === "en_proceso" && (
                  <Button
                    onClick={() => procesarAccion("despachar")}
                    disabled={procesando || Object.values(medicamentosDespacho).every(v => !v)}
                    className="bg-green-600 hover:bg-green-700 md:col-span-2"
                  >
                    {procesando ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Despachar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación */}
      <AlertDialog
        open={mostrarConfirmacion}
        onOpenChange={setMostrarConfirmacion}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accionConfirmada === "preparar"
                ? "¿Iniciar Preparación?"
                : accionConfirmada === "despachar"
                ? "¿Confirmar Despacho?"
                : "¿Rechazar Receta?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accionConfirmada === "preparar"
                ? "La receta pasará a estado 'En Proceso'"
                : accionConfirmada === "despachar"
                ? `Se despachará por S/ ${calcularCostoDespacho().toFixed(2)}`
                : "El paciente será notificado del rechazo"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarAccion}
              disabled={procesando}
              className={
                accionConfirmada === "rechazar"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {procesando ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
