// components/paciente/pago-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Stethoscope,
  TestTube,
} from "lucide-react";

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoPago: "cita" | "examen";
  referenciaId: string;
  monto: number;
  descripcion: string;
  onPagoExitoso?: () => void;
}

interface DetallesServicio {
  id: string;
  tipo: string;
  descripcion: string;
  fecha?: string;
  medico_nombre?: string;
  medico_apellido?: string;
  especialidad?: string;
  laboratorio?: string;
}

export function PagoModal({
  isOpen,
  onClose,
  tipoPago,
  referenciaId,
  monto,
  descripcion,
  onPagoExitoso,
}: PagoModalProps) {
  const { token } = useAuth();
  const [metodoPago, setMetodoPago] = useState<
    "yape" | "transferencia" | "tarjeta"
  >("yape");
  const [detallesServicio, setDetallesServicio] =
    useState<DetallesServicio | null>(null);
  const [datosYape, setDatosYape] = useState({
    numero_yape: "",
    codigo_operacion: "",
  });
  const [datosTransferencia, setDatosTransferencia] = useState({
    banco: "bcp",
    numero_operacion: "",
    numero_cuenta: "",
  });
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero_tarjeta: "",
    fecha_vencimiento: "",
    cvv: "",
    nombre_titular: "",
  });
  const [procesando, setProcesando] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);
  const [error, setError] = useState("");
  const [cargandoDetalles, setCargandoDetalles] = useState(true);

  // Cargar detalles del servicio al abrir el modal
  useEffect(() => {
    if (isOpen && referenciaId) {
      cargarDetallesServicio();
    }
  }, [isOpen, referenciaId, tipoPago]);

  const cargarDetallesServicio = async () => {
    if (!token) return;

    setCargandoDetalles(true);
    try {
      let endpoint = "";
      if (tipoPago === "cita") {
        endpoint = `/api/citas/paciente`;
      } else {
        endpoint = `/api/solicitudes-laboratorio/paciente`;
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const servicio =
          tipoPago === "cita"
            ? data.citas?.find((c: any) => c.id === referenciaId)
            : data.solicitudes?.find((s: any) => s.id === referenciaId);

        if (servicio) {
          setDetallesServicio({
            id: servicio.id,
            tipo: tipoPago,
            descripcion:
              servicio.motivo_consulta || servicio.tipo_examen || descripcion,
            fecha: servicio.fecha_cita || servicio.fecha_solicitud,
            medico_nombre: servicio.medico_nombre,
            medico_apellido: servicio.medico_apellido,
            especialidad: servicio.especialidad,
            laboratorio: servicio.laboratorio_nombre,
          });
        }
      }
    } catch (error) {
      console.error("Error cargando detalles:", error);
    } finally {
      setCargandoDetalles(false);
    }
  };

  const validarDatosPago = () => {
    if (metodoPago === "yape") {
      if (!datosYape.numero_yape || !datosYape.codigo_operacion) {
        setError("Por favor complete todos los campos de YAPE");
        return false;
      }
      if (!/^9\d{8}$/.test(datosYape.numero_yape)) {
        setError("El número de YAPE debe tener 9 dígitos y comenzar con 9");
        return false;
      }
    } else if (metodoPago === "transferencia") {
      if (!datosTransferencia.numero_operacion || !datosTransferencia.banco) {
        setError("Por favor complete todos los campos de transferencia");
        return false;
      }
    } else if (metodoPago === "tarjeta") {
      if (
        !datosTarjeta.numero_tarjeta ||
        !datosTarjeta.fecha_vencimiento ||
        !datosTarjeta.cvv
      ) {
        setError("Por favor complete todos los campos de la tarjeta");
        return false;
      }
      if (!/^\d{16}$/.test(datosTarjeta.numero_tarjeta.replace(/\s/g, ""))) {
        setError("El número de tarjeta debe tener 16 dígitos");
        return false;
      }
      if (!/^\d{3,4}$/.test(datosTarjeta.cvv)) {
        setError("El CVV debe tener 3 o 4 dígitos");
        return false;
      }
    }
    return true;
  };

  const procesarPago = async () => {
    if (!validarDatosPago()) {
      return;
    }

    setProcesando(true);
    setError("");

    try {
      let datosPago = {};

      if (metodoPago === "yape") {
        datosPago = datosYape;
      } else if (metodoPago === "transferencia") {
        datosPago = datosTransferencia;
      } else if (metodoPago === "tarjeta") {
        datosPago = datosTarjeta;
      }

      const response = await fetch("/api/pagos/procesar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo_pago: tipoPago,
          referencia_id: referenciaId,
          monto,
          metodo_pago: metodoPago,
          datos_pago: datosPago,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPagoCompletado(true);
        if (onPagoExitoso) {
          setTimeout(() => {
            onPagoExitoso();
            resetModal();
            onClose();
          }, 3000);
        }
      } else {
        setError(data.error || "Error procesando el pago");
      }
    } catch (error) {
      console.error("Error procesando pago:", error);
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setProcesando(false);
    }
  };

  const resetModal = () => {
    setMetodoPago("yape");
    setDatosYape({ numero_yape: "", codigo_operacion: "" });
    setDatosTransferencia({
      banco: "bcp",
      numero_operacion: "",
      numero_cuenta: "",
    });
    setDatosTarjeta({
      numero_tarjeta: "",
      fecha_vencimiento: "",
      cvv: "",
      nombre_titular: "",
    });
    setProcesando(false);
    setPagoCompletado(false);
    setError("");
    setDetallesServicio(null);
    setCargandoDetalles(true);
  };

  const handleClose = () => {
    resetModal();
    onClose();
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

  if (pagoCompletado) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4 py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">
                ¡Pago Exitoso!
              </h3>
              <p className="text-muted-foreground">
                Su pago de S/ {monto.toFixed(2)} ha sido procesado
                correctamente.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
          <DialogDescription>
            Complete la información para procesar su pago de forma segura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen del servicio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                {tipoPago === "cita" ? (
                  <Stethoscope className="w-5 h-5 mr-2 text-primary" />
                ) : (
                  <TestTube className="w-5 h-5 mr-2 text-primary" />
                )}
                Detalles del Servicio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cargandoDetalles ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2">Cargando detalles...</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Servicio:</span>
                    <span className="font-medium text-right">
                      {detallesServicio?.descripcion || descripcion}
                    </span>
                  </div>

                  {detallesServicio?.fecha && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="font-medium flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(detallesServicio.fecha).toLocaleDateString(
                          "es-PE"
                        )}
                      </span>
                    </div>
                  )}

                  {detallesServicio?.medico_nombre && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Médico:</span>
                      <span className="font-medium flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        Dr. {detallesServicio.medico_nombre}{" "}
                        {detallesServicio.medico_apellido}
                      </span>
                    </div>
                  )}

                  {detallesServicio?.especialidad && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Especialidad:
                      </span>
                      <Badge variant="outline">
                        {detallesServicio.especialidad}
                      </Badge>
                    </div>
                  )}

                  {detallesServicio?.laboratorio && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Laboratorio:
                      </span>
                      <span className="font-medium">
                        {detallesServicio.laboratorio}
                      </span>
                    </div>
                  )}

                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total a Pagar:</span>
                    <span className="text-primary">S/ {monto.toFixed(2)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Métodos de pago */}
          <div>
            <Label className="text-base font-medium">Método de Pago</Label>
            <RadioGroup
              value={metodoPago}
              onValueChange={(value: any) => setMetodoPago(value)}
              className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <Card
                className={`cursor-pointer transition-all border-2 ${
                  metodoPago === "yape"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <CardContent
                  className="p-4"
                  onClick={() => setMetodoPago("yape")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="yape"
                      id="yape"
                      className="flex-shrink-0"
                    />
                    <Label
                      htmlFor="yape"
                      className="flex items-center cursor-pointer flex-1"
                    >
                      <Smartphone className="w-5 h-5 mr-2 text-purple-600" />
                      <div>
                        <p className="font-medium">YAPE</p>
                        <p className="text-xs text-muted-foreground">
                          Pago inmediato
                        </p>
                      </div>
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all border-2 ${
                  metodoPago === "transferencia"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <CardContent
                  className="p-4"
                  onClick={() => setMetodoPago("transferencia")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="transferencia"
                      id="transferencia"
                      className="flex-shrink-0"
                    />
                    <Label
                      htmlFor="transferencia"
                      className="flex items-center cursor-pointer flex-1"
                    >
                      <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                      <div>
                        <p className="font-medium">Transferencia</p>
                        <p className="text-xs text-muted-foreground">
                          Todos los bancos
                        </p>
                      </div>
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all border-2 ${
                  metodoPago === "tarjeta"
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <CardContent
                  className="p-4"
                  onClick={() => setMetodoPago("tarjeta")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="tarjeta"
                      id="tarjeta"
                      className="flex-shrink-0"
                    />
                    <Label
                      htmlFor="tarjeta"
                      className="flex items-center cursor-pointer flex-1"
                    >
                      <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                      <div>
                        <p className="font-medium">Tarjeta</p>
                        <p className="text-xs text-muted-foreground">
                          Crédito/Débito
                        </p>
                      </div>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Formularios específicos por método */}
          {metodoPago === "yape" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Smartphone className="w-5 h-5 mr-2 text-purple-600" />
                  Pago con YAPE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="numero_yape">Número de YAPE *</Label>
                  <Input
                    id="numero_yape"
                    placeholder="987654321"
                    value={datosYape.numero_yape}
                    onChange={(e) =>
                      setDatosYape((prev) => ({
                        ...prev,
                        numero_yape: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 9),
                      }))
                    }
                    maxLength={9}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingrese su número de YAPE (9 dígitos)
                  </p>
                </div>
                <div>
                  <Label htmlFor="codigo_operacion">
                    Código de Operación *
                  </Label>
                  <Input
                    id="codigo_operacion"
                    placeholder="Código de 6 dígitos"
                    value={datosYape.codigo_operacion}
                    onChange={(e) =>
                      setDatosYape((prev) => ({
                        ...prev,
                        codigo_operacion: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6),
                      }))
                    }
                    maxLength={6}
                  />
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Instrucciones:</strong> Realice el pago por YAPE al
                    número 987-654-321 por el monto de S/ {monto.toFixed(2)} y
                    luego ingrese el código de operación generado.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {metodoPago === "transferencia" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Transferencia Bancaria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="banco">Banco *</Label>
                  <Select
                    value={datosTransferencia.banco}
                    onValueChange={(value) =>
                      setDatosTransferencia((prev) => ({
                        ...prev,
                        banco: value,
                      }))
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
                    placeholder="Número de operación del banco"
                    value={datosTransferencia.numero_operacion}
                    onChange={(e) =>
                      setDatosTransferencia((prev) => ({
                        ...prev,
                        numero_operacion: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="numero_cuenta">
                    Número de Cuenta (Opcional)
                  </Label>
                  <Input
                    id="numero_cuenta"
                    placeholder="Cuenta desde la que transfiere"
                    value={datosTransferencia.numero_cuenta}
                    onChange={(e) =>
                      setDatosTransferencia((prev) => ({
                        ...prev,
                        numero_cuenta: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Datos para transferencia:</strong>
                    <br />
                    Banco: BCP
                    <br />
                    Cuenta: 123-456-789-012
                    <br />
                    CCI: 00212312345678901234
                    <br />
                    Titular: MediLink+ SAC
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {metodoPago === "tarjeta" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                  Tarjeta de Crédito/Débito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="numero_tarjeta">Número de Tarjeta *</Label>
                  <Input
                    id="numero_tarjeta"
                    placeholder="1234 5678 9012 3456"
                    value={datosTarjeta.numero_tarjeta}
                    onChange={(e) =>
                      setDatosTarjeta((prev) => ({
                        ...prev,
                        numero_tarjeta: formatNumeroTarjeta(e.target.value),
                      }))
                    }
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fecha_vencimiento">
                      Fecha de Vencimiento *
                    </Label>
                    <Input
                      id="fecha_vencimiento"
                      placeholder="MM/AA"
                      value={datosTarjeta.fecha_vencimiento}
                      onChange={(e) =>
                        setDatosTarjeta((prev) => ({
                          ...prev,
                          fecha_vencimiento: formatFechaVencimiento(
                            e.target.value
                          ),
                        }))
                      }
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={datosTarjeta.cvv}
                      onChange={(e) =>
                        setDatosTarjeta((prev) => ({
                          ...prev,
                          cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                      maxLength={4}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nombre_titular">Nombre del Titular</Label>
                  <Input
                    id="nombre_titular"
                    placeholder="Como aparece en la tarjeta"
                    value={datosTarjeta.nombre_titular}
                    onChange={(e) =>
                      setDatosTarjeta((prev) => ({
                        ...prev,
                        nombre_titular: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 text-destructive p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={procesando}
              className="flex-1 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              onClick={procesarPago}
              disabled={procesando || !metodoPago}
              className="flex-1"
            >
              {procesando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                `Pagar S/ ${monto.toFixed(2)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
