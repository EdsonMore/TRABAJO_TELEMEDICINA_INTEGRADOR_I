// components/paciente/pagos-sandbox.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import {
  CreditCard,
  Smartphone,
  Building,
  CheckCircle,
  Download,
  Receipt,
  Shield,
  Clock,
  Calendar,
  User,
  Stethoscope,
  TestTube,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ServicioPendiente {
  id: string;
  tipo: "cita" | "examen";
  descripcion: string;
  fecha: string;
  medico_nombre?: string;
  medico_apellido?: string;
  especialidad?: string;
  laboratorio?: string;
  monto: number;
  estado: "pendiente" | "pagado" | "confirmado";
  referencia_id: string;
}

interface PagoRealizado {
  id: string;
  servicio_id: string;
  metodo_pago: string;
  monto: number;
  fecha_pago: string;
  numero_transaccion: string;
  comprobante_url: string;
  estado: "exitoso" | "fallido" | "pendiente";
  codigo_pago: string;
}

export function PagosSandbox() {
  const { token } = useAuth();
  const [serviciosPendientes, setServiciosPendientes] = useState<
    ServicioPendiente[]
  >([]);
  const [servicioSeleccionado, setServicioSeleccionado] =
    useState<ServicioPendiente | null>(null);
  const [metodoPago, setMetodoPago] = useState("");
  const [datosPago, setDatosPago] = useState({
    // Para tarjeta
    numero_tarjeta: "",
    fecha_vencimiento: "",
    cvv: "",
    nombre_titular: "",
    // Para YAPE/Plin
    numero_yape: "",
    codigo_operacion: "",
    // Para transferencia
    numero_cuenta: "",
    banco: "bcp",
    numero_operacion: "",
  });
  const [pagoRealizado, setPagoRealizado] = useState<PagoRealizado | null>(
    null
  );
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [error, setError] = useState("");
  const [cargandoServicios, setCargandoServicios] = useState(true);

  // Cargar servicios pendientes de pago
  useEffect(() => {
    cargarServiciosPendientes();
  }, []);

  const cargarServiciosPendientes = async () => {
    if (!token) return;

    setCargandoServicios(true);
    try {
      // Cargar citas pendientes de pago
      const citasResponse = await fetch("/api/citas/paciente", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Cargar exámenes pendientes de pago
      const examenesResponse = await fetch(
        "/api/solicitudes-laboratorio/paciente",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const servicios: ServicioPendiente[] = [];

      if (citasResponse.ok) {
        const citasData = await citasResponse.json();
        const citasPendientes =
          citasData.citas
            ?.filter(
              (cita: any) =>
                cita.estado_pago === "pendiente" || !cita.estado_pago
            )
            .map((cita: any) => ({
              id: `cita_${cita.id}`,
              tipo: "cita" as const,
              descripcion: cita.motivo_consulta || "Consulta médica",
              fecha: cita.fecha_cita,
              medico_nombre: cita.medico_nombre,
              medico_apellido: cita.medico_apellido,
              especialidad: cita.especialidad,
              monto: cita.tarifa_consulta || 80.0,
              estado: "pendiente" as const,
              referencia_id: cita.id,
            })) || [];

        servicios.push(...citasPendientes);
      }

      if (examenesResponse.ok) {
        const examenesData = await examenesResponse.json();
        const examenesPendientes =
          examenesData.solicitudes
            ?.filter(
              (examen: any) =>
                examen.estado_pago === "pendiente" || !examen.estado_pago
            )
            .map((examen: any) => ({
              id: `examen_${examen.id}`,
              tipo: "examen" as const,
              descripcion: examen.tipo_examen || "Análisis de laboratorio",
              fecha: examen.fecha_solicitud,
              laboratorio: examen.laboratorio_nombre,
              monto: examen.costo || 120.0,
              estado: "pendiente" as const,
              referencia_id: examen.id,
            })) || [];

        servicios.push(...examenesPendientes);
      }

      // Si no hay servicios reales, usar datos de ejemplo
      if (servicios.length === 0) {
        servicios.push(
          ...[
            {
              id: "cita_001",
              tipo: "cita",
              descripcion: "Consulta Medicina General",
              fecha: new Date().toISOString().split("T")[0],
              medico_nombre: "Juan",
              medico_apellido: "Pérez",
              especialidad: "Medicina General",
              monto: 80.0,
              estado: "pendiente",
              referencia_id: "1",
            },
            {
              id: "examen_001",
              tipo: "examen",
              descripcion: "Análisis de Sangre Completo",
              fecha: new Date(Date.now() + 86400000)
                .toISOString()
                .split("T")[0],
              laboratorio: "Lab Central",
              monto: 120.0,
              estado: "pendiente",
              referencia_id: "1",
            },
          ]
        );
      }

      setServiciosPendientes(servicios);
    } catch (error) {
      console.error("Error cargando servicios:", error);
      // Datos de ejemplo en caso de error
      setServiciosPendientes([
        {
          id: "cita_001",
          tipo: "cita",
          descripcion: "Consulta Medicina General",
          fecha: new Date().toISOString().split("T")[0],
          medico_nombre: "Juan",
          medico_apellido: "Pérez",
          especialidad: "Medicina General",
          monto: 80.0,
          estado: "pendiente",
          referencia_id: "1",
        },
        {
          id: "examen_001",
          tipo: "examen",
          descripcion: "Análisis de Sangre Completo",
          fecha: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          laboratorio: "Lab Central",
          monto: 120.0,
          estado: "pendiente",
          referencia_id: "1",
        },
      ]);
    } finally {
      setCargandoServicios(false);
    }
  };

  const validarDatosPago = () => {
    if (!servicioSeleccionado || !metodoPago) {
      setError("Por favor seleccione un servicio y método de pago");
      return false;
    }

    if (metodoPago === "tarjeta") {
      if (
        !datosPago.numero_tarjeta ||
        !datosPago.cvv ||
        !datosPago.fecha_vencimiento
      ) {
        setError("Por favor complete los datos de la tarjeta");
        return false;
      }
      if (!/^\d{16}$/.test(datosPago.numero_tarjeta.replace(/\s/g, ""))) {
        setError("El número de tarjeta debe tener 16 dígitos");
        return false;
      }
    } else if (metodoPago === "yape") {
      if (!datosPago.numero_yape || !datosPago.codigo_operacion) {
        setError("Por favor complete los datos de YAPE");
        return false;
      }
      if (!/^9\d{8}$/.test(datosPago.numero_yape)) {
        setError("El número de YAPE debe tener 9 dígitos y comenzar con 9");
        return false;
      }
    } else if (metodoPago === "transferencia") {
      if (!datosPago.numero_operacion || !datosPago.banco) {
        setError("Por favor complete los datos de transferencia");
        return false;
      }
    }

    return true;
  };

  const procesarPago = async () => {
    if (!validarDatosPago()) {
      return;
    }

    setProcesandoPago(true);
    setError("");

    try {
      // Simular procesamiento de pago (2-3 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Simular respuesta exitosa del sandbox (95% de éxito)
      const esExitoso = Math.random() > 0.05;

      const pagoData = {
        tipo_pago: servicioSeleccionado!.tipo,
        referencia_id: servicioSeleccionado!.referencia_id,
        monto: servicioSeleccionado!.monto,
        metodo_pago: metodoPago,
        datos_pago: datosPago,
      };

      // En sandbox, simular la API call
      let pagoExitoso: PagoRealizado;

      if (esExitoso) {
        pagoExitoso = {
          id: `pago_${Date.now()}`,
          servicio_id: servicioSeleccionado!.id,
          metodo_pago: metodoPago,
          monto: servicioSeleccionado!.monto,
          fecha_pago: new Date().toISOString(),
          numero_transaccion: `TXN${Math.random()
            .toString(36)
            .substr(2, 9)
            .toUpperCase()}`,
          comprobante_url: `/comprobantes/pago_${Date.now()}.pdf`,
          estado: "exitoso",
          codigo_pago: `PAY-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 8)
            .toUpperCase()}`,
        };

        setPagoRealizado(pagoExitoso);
        setMostrarComprobante(true);

        // Actualizar estado del servicio en el estado local
        setServiciosPendientes((prev) =>
          prev.map((servicio) =>
            servicio.id === servicioSeleccionado.id
              ? { ...servicio, estado: "pagado" }
              : servicio
          )
        );

        // Limpiar formulario
        setServicioSeleccionado(null);
        setMetodoPago("");
        setDatosPago({
          numero_tarjeta: "",
          fecha_vencimiento: "",
          cvv: "",
          nombre_titular: "",
          numero_yape: "",
          codigo_operacion: "",
          numero_cuenta: "",
          banco: "bcp",
          numero_operacion: "",
        });
      } else {
        setError("Error en el procesamiento del pago. Intente nuevamente.");
      }
    } catch (error) {
      console.error("Error procesando pago:", error);
      setError("Error en el procesamiento del pago");
    } finally {
      setProcesandoPago(false);
    }
  };

  const descargarComprobante = () => {
    if (!pagoRealizado) return;

    // Simular descarga de comprobante
    const link = document.createElement("a");
    link.href = "#";
    link.download = `comprobante_${pagoRealizado.numero_transaccion}.pdf`;
    link.click();

    alert("Comprobante descargado exitosamente (simulación)");
  };

  const formatNumeroTarjeta = (value: string) => {
    const cleaned = value.replace(/\s/g, "").replace(/\D/g, "");
    const matches = cleaned.match(/\d{1,4}/g);
    return matches ? matches.join(" ") : "";
  };

  const formatFechaVencimiento = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <div className="space-y-6">
      <Card className="medical-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-primary" />
            Gestión de Pagos - Sandbox
          </CardTitle>
          <CardDescription>
            Sistema de pagos en entorno de pruebas. Los pagos son simulados y no
            se procesan transacciones reales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Servicios Pendientes de Pago */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Label className="text-base font-medium">
                Servicios Pendientes de Pago
              </Label>
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800 w-fit"
              >
                <Clock className="w-3 h-3 mr-1" />
                Sandbox Mode
              </Badge>
            </div>

            {cargandoServicios ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span>Cargando servicios...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {serviciosPendientes
                  .filter((s) => s.estado === "pendiente")
                  .map((servicio) => (
                    <div
                      key={servicio.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        servicioSeleccionado?.id === servicio.id
                          ? "ring-2 ring-primary border-primary bg-primary/5"
                          : "border-border bg-card/50"
                      }`}
                      onClick={() => setServicioSeleccionado(servicio)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                            {servicio.tipo === "cita" ? (
                              <Stethoscope className="h-5 w-5 text-primary" />
                            ) : (
                              <TestTube className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm sm:text-base">
                              {servicio.descripcion}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {servicio.tipo === "cita"
                                ? `${servicio.medico_nombre} ${servicio.medico_apellido} - ${servicio.especialidad}`
                                : `${servicio.laboratorio}`}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(servicio.fecha).toLocaleDateString(
                                "es-PE"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-primary">
                            S/ {servicio.monto.toFixed(2)}
                          </p>
                          <Badge
                            variant={
                              servicio.estado === "pendiente"
                                ? "outline"
                                : "default"
                            }
                            className={
                              servicio.estado === "pagado"
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {servicio.estado === "pendiente"
                              ? "Pendiente"
                              : "Pagado"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}

                {serviciosPendientes.filter((s) => s.estado === "pendiente")
                  .length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay servicios pendientes de pago</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Información del Servicio Seleccionado */}
          {servicioSeleccionado && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-medium text-primary mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Servicio Seleccionado:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>
                    <strong>Servicio:</strong>{" "}
                    {servicioSeleccionado.descripcion}
                  </p>
                  <p className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <strong>Fecha:</strong>{" "}
                    {new Date(servicioSeleccionado.fecha).toLocaleDateString(
                      "es-PE"
                    )}
                  </p>
                  <p>
                    <strong>Monto:</strong>{" "}
                    <span className="text-primary font-semibold">
                      S/ {servicioSeleccionado.monto.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  {servicioSeleccionado.tipo === "cita" ? (
                    <>
                      <p className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        <strong>Médico:</strong> Dr.{" "}
                        {servicioSeleccionado.medico_nombre}{" "}
                        {servicioSeleccionado.medico_apellido}
                      </p>
                      <p>
                        <strong>Especialidad:</strong>{" "}
                        {servicioSeleccionado.especialidad}
                      </p>
                    </>
                  ) : (
                    <p>
                      <strong>Laboratorio:</strong>{" "}
                      {servicioSeleccionado.laboratorio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Método de Pago */}
          {servicioSeleccionado && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Método de Pago</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card
                  className={`cursor-pointer transition-all border-2 ${
                    metodoPago === "tarjeta"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => setMetodoPago("tarjeta")}
                >
                  <CardContent className="p-4 text-center">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Tarjeta</p>
                    <p className="text-xs text-muted-foreground">
                      Crédito/Débito
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all border-2 ${
                    metodoPago === "yape"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => setMetodoPago("yape")}
                >
                  <CardContent className="p-4 text-center">
                    <Smartphone className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">YAPE</p>
                    <p className="text-xs text-muted-foreground">Pago móvil</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all border-2 ${
                    metodoPago === "transferencia"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => setMetodoPago("transferencia")}
                >
                  <CardContent className="p-4 text-center">
                    <Building className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium">Transferencia</p>
                    <p className="text-xs text-muted-foreground">Bancaria</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Formulario de Datos de Pago */}
          {metodoPago && servicioSeleccionado && (
            <div className="space-y-4 p-4 border border-border rounded-lg bg-card/50">
              <h4 className="font-medium">
                Datos de Pago - {metodoPago.toUpperCase()}
              </h4>

              {metodoPago === "tarjeta" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="numero_tarjeta">Número de Tarjeta *</Label>
                    <Input
                      id="numero_tarjeta"
                      placeholder="1234 5678 9012 3456"
                      value={datosPago.numero_tarjeta}
                      onChange={(e) =>
                        setDatosPago({
                          ...datosPago,
                          numero_tarjeta: formatNumeroTarjeta(e.target.value),
                        })
                      }
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha_vencimiento">
                      Fecha Vencimiento *
                    </Label>
                    <Input
                      id="fecha_vencimiento"
                      placeholder="MM/AA"
                      value={datosPago.fecha_vencimiento}
                      onChange={(e) =>
                        setDatosPago({
                          ...datosPago,
                          fecha_vencimiento: formatFechaVencimiento(
                            e.target.value
                          ),
                        })
                      }
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={datosPago.cvv}
                      onChange={(e) =>
                        setDatosPago({
                          ...datosPago,
                          cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                        })
                      }
                      maxLength={4}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="nombre_titular">Nombre del Titular</Label>
                    <Input
                      id="nombre_titular"
                      placeholder="Nombre como aparece en la tarjeta"
                      value={datosPago.nombre_titular}
                      onChange={(e) =>
                        setDatosPago({
                          ...datosPago,
                          nombre_titular: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {metodoPago === "yape" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="numero_yape">Número de YAPE *</Label>
                    <Input
                      id="numero_yape"
                      placeholder="987654321"
                      value={datosPago.numero_yape}
                      onChange={(e) =>
                        setDatosPago({
                          ...datosPago,
                          numero_yape: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 9),
                        })
                      }
                      maxLength={9}
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigo_operacion">
                      Código de Operación *
                    </Label>
                    <Input
                      id="codigo_operacion"
                      placeholder="Código de 6 dígitos"
                      value={datosPago.codigo_operacion}
                      onChange={(e) =>
                        setDatosPago({
                          ...datosPago,
                          codigo_operacion: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6),
                        })
                      }
                      maxLength={6}
                    />
                  </div>
                </div>
              )}

              {metodoPago === "transferencia" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="banco">Banco *</Label>
                    <Select
                      value={datosPago.banco}
                      onValueChange={(value) =>
                        setDatosPago({ ...datosPago, banco: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar banco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bcp">
                          Banco de Crédito del Perú
                        </SelectItem>
                        <SelectItem value="bbva">BBVA Perú</SelectItem>
                        <SelectItem value="interbank">Interbank</SelectItem>
                        <SelectItem value="scotiabank">
                          Scotiabank Perú
                        </SelectItem>
                        <SelectItem value="banbif">BanBif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="numero_operacion">
                      Número de Operación *
                    </Label>
                    <Input
                      id="numero_operacion"
                      placeholder="Número de operación"
                      value={datosPago.numero_operacion}
                      onChange={(e) =>
                        setDatosPago({
                          ...datosPago,
                          numero_operacion: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="numero_cuenta">
                      Número de Cuenta (Opcional)
                    </Label>
                    <Input
                      id="numero_cuenta"
                      placeholder="Cuenta desde la que transfiere"
                      value={datosPago.numero_cuenta}
                      onChange={(e) =>
                        setDatosPago({
                          ...datosPago,
                          numero_cuenta: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Información de Seguridad */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800">
                  Entorno de Prueba - Sandbox
                </h4>
                <p className="text-sm text-blue-600 mt-1">
                  Este es un entorno de prueba. No se procesarán pagos reales.
                  Usa datos de prueba para simular transacciones.
                </p>
                <div className="mt-2 text-xs text-blue-600 space-y-1">
                  <p>
                    • <strong>Tarjeta de prueba:</strong> 4111 1111 1111 1111
                  </p>
                  <p>
                    • <strong>CVV:</strong> 123 • <strong>Fecha:</strong> 12/25
                  </p>
                  <p>
                    • <strong>YAPE:</strong> Cualquier número que comience con 9
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 text-destructive p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Botón de Pago */}
          {servicioSeleccionado && (
            <div className="flex justify-end">
              <Button
                onClick={procesarPago}
                disabled={!metodoPago || procesandoPago}
                className="bg-primary hover:bg-primary/90 min-w-[200px]"
                size="lg"
              >
                {procesandoPago ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pagar S/ {servicioSeleccionado.monto.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Comprobante */}
      <Dialog open={mostrarComprobante} onOpenChange={setMostrarComprobante}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Pago Procesado Exitosamente
            </DialogTitle>
            <DialogDescription>
              Tu pago ha sido procesado correctamente en el entorno de prueba
            </DialogDescription>
          </DialogHeader>

          {pagoRealizado && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-800 text-lg">
                    ¡Pago Exitoso!
                  </h3>
                  <p className="text-sm text-green-600">
                    Código: {pagoRealizado.codigo_pago}
                  </p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 bg-white">
                <h4 className="font-medium mb-3">Detalles de la Transacción</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Método de Pago:</p>
                    <p className="font-medium capitalize">
                      {pagoRealizado.metodo_pago}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monto:</p>
                    <p className="font-medium">
                      S/ {pagoRealizado.monto.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha:</p>
                    <p className="font-medium">
                      {new Date(pagoRealizado.fecha_pago).toLocaleDateString(
                        "es-PE"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Transacción:</p>
                    <p className="font-mono text-xs">
                      {pagoRealizado.numero_transaccion}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Estado:</p>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {pagoRealizado.estado}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  onClick={descargarComprobante}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Comprobante
                </Button>
                <Button
                  onClick={() => setMostrarComprobante(false)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
