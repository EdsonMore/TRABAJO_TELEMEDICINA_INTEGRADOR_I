"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Check, Loader2, CreditCard, Smartphone, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type MetodoPago = "yape" | "plin" | "tarjeta" | "transferencia";

interface ModalPagoProps {
  isOpen: boolean;
  onClose: () => void;
  monto: number;
  recetaId: string;
  onPagoExitoso: (metodo: MetodoPago, referencia: string) => void;
  farmaciaId: string;
}

export default function ModalPago({
  isOpen,
  onClose,
  monto,
  recetaId,
  onPagoExitoso,
  farmaciaId,
}: ModalPagoProps) {
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numeroReferencia, setNumeroReferencia] = useState("");

  // Datos de pago por método
  const [datosPago, setDatosPago] = useState({
    numero_tarjeta: "",
    fecha_vencimiento: "",
    cvv: "",
    nombre_titular: "",
    numero_yape: "",
    codigo_operacion_yape: "",
    numero_plin: "",
    codigo_operacion_plin: "",
    numero_cuenta: "",
    banco: "bcp",
    numero_operacion_trans: "",
  });

  const metodos = [
    {
      id: "tarjeta" as MetodoPago,
      nombre: "Tarjeta Débito/Crédito",
      descripcion: "Visa, Mastercard, American Express",
      icon: <CreditCard className="w-6 h-6" />,
    },
    {
      id: "yape" as MetodoPago,
      nombre: "Yape",
      descripcion: "Pago inmediato con tu celular",
      icon: <Smartphone className="w-6 h-6" />,
    },
    {
      id: "plin" as MetodoPago,
      nombre: "Plin",
      descripcion: "Pago inmediato con tu celular",
      icon: <Smartphone className="w-6 h-6" />,
    },
    {
      id: "transferencia" as MetodoPago,
      nombre: "Transferencia Bancaria",
      descripcion: "Depósito o transferencia directa",
      icon: <Building className="w-6 h-6" />,
    },
  ];

  const validarDatos = (): boolean => {
    if (!metodoPago) return false;

    switch (metodoPago) {
      case "tarjeta":
        const tarjeta = datosPago.numero_tarjeta.replace(/\s/g, "");
        if (!/^\d{16}$/.test(tarjeta)) {
          setError("Número de tarjeta inválido (16 dígitos)");
          return false;
        }
        if (!/^\d{2}\/\d{2}$/.test(datosPago.fecha_vencimiento)) {
          setError("Fecha inválida (MM/AA)");
          return false;
        }
        if (!/^\d{3,4}$/.test(datosPago.cvv)) {
          setError("CVV inválido (3-4 dígitos)");
          return false;
        }
        if (!datosPago.nombre_titular.trim()) {
          setError("Nombre del titular requerido");
          return false;
        }
        return true;

      case "yape":
        if (!/^9\d{8}$/.test(datosPago.numero_yape)) {
          setError("Número Yape inválido (9 dígitos, comienza con 9)");
          return false;
        }
        if (!/^\d{6}$/.test(datosPago.codigo_operacion_yape)) {
          setError("Código de operación inválido (6 dígitos)");
          return false;
        }
        return true;

      case "plin":
        if (!/^9\d{8}$/.test(datosPago.numero_plin)) {
          setError("Número Plin inválido (9 dígitos, comienza con 9)");
          return false;
        }
        if (!/^\d{6}$/.test(datosPago.codigo_operacion_plin)) {
          setError("Código de operación inválido (6 dígitos)");
          return false;
        }
        return true;

      case "transferencia":
        if (!datosPago.numero_cuenta.trim()) {
          setError("Número de cuenta requerido");
          return false;
        }
        if (!/^\d{8,20}$/.test(datosPago.numero_operacion_trans)) {
          setError("Número de operación inválido");
          return false;
        }
        return true;

      default:
        return false;
    }
  };

  const procesarPago = async () => {
    setError(null);

    if (!validarDatos()) {
      return;
    }

    if (!metodoPago) return;

    try {
      setProcesando(true);

      // Simular procesamiento (1-2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Generar referencia de pago
      const referencia = `${metodoPago.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      setNumeroReferencia(referencia);

      // Simular respuesta exitosa (95% de probabilidad)
      if (Math.random() < 0.95) {
        setPagoExitoso(true);
        
        // Esperar 2 segundos y callback
        await new Promise((resolve) => setTimeout(resolve, 2000));
        onPagoExitoso(metodoPago, referencia);
      } else {
        setError("Transacción rechazada. Por favor intenta con otro método.");
        setProcesando(false);
      }
    } catch (err) {
      setError("Error al procesar el pago. Intenta nuevamente.");
      setProcesando(false);
    }
  };

  const handleClose = () => {
    if (!procesando && !pagoExitoso) {
      setMetodoPago(null);
      setError(null);
      setPagoExitoso(false);
      setDatosPago({
        numero_tarjeta: "",
        fecha_vencimiento: "",
        cvv: "",
        nombre_titular: "",
        numero_yape: "",
        codigo_operacion_yape: "",
        numero_plin: "",
        codigo_operacion_plin: "",
        numero_cuenta: "",
        banco: "bcp",
        numero_operacion_trans: "",
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💰 Confirmación de Pago
          </DialogTitle>
          <DialogDescription>
            Completa los datos para procesar tu pago de forma segura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen de pago */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Receta #</span>
                  <span className="font-mono text-sm">{recetaId}</span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Monto a Pagar:
                  </span>
                  <span className="text-3xl font-bold text-blue-600">
                    S/ {monto.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pantalla de éxito */}
          {pagoExitoso ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Pago Exitoso!
              </h3>
              <p className="text-gray-600 mb-4">
                Tu pago ha sido procesado correctamente.
                <br />
                Tu receta será enviada a la farmacia inmediatamente.
              </p>
              <Card className="w-full max-w-sm bg-gray-50 p-4 text-left">
                <p className="text-xs text-gray-600 mb-1">
                  <strong>Número de referencia:</strong>
                </p>
                <p className="font-mono text-sm text-green-600 break-all">
                  {numeroReferencia}
                </p>
              </Card>
            </div>
          ) : (
            <>
              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Selección de método */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">
                  Selecciona tu método de pago:
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {metodos.map((metodo) => (
                    <button
                      key={metodo.id}
                      onClick={() => !procesando && setMetodoPago(metodo.id)}
                      disabled={procesando}
                      className={`p-4 border-2 rounded-lg transition-all text-center ${
                        metodoPago === metodo.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      } ${procesando ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {metodo.icon}
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {metodo.nombre}
                          </p>
                          <p className="text-xs text-gray-600">
                            {metodo.descripcion}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulario de datos por método */}
              {metodoPago === "tarjeta" && (
                <Card className="p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Datos de Tarjeta
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-700">
                        Número de Tarjeta
                      </Label>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={datosPago.numero_tarjeta}
                        onChange={(e) =>
                          setDatosPago({
                            ...datosPago,
                            numero_tarjeta: e.target.value.replace(/\D/g, "").slice(0, 16),
                          })
                        }
                        disabled={procesando}
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-700">
                          Vencimiento
                        </Label>
                        <Input
                          placeholder="MM/AA"
                          value={datosPago.fecha_vencimiento}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length >= 2) {
                              val = val.slice(0, 2) + "/" + val.slice(2, 4);
                            }
                            setDatosPago({
                              ...datosPago,
                              fecha_vencimiento: val,
                            });
                          }}
                          disabled={procesando}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-700">CVV</Label>
                        <Input
                          placeholder="123"
                          value={datosPago.cvv}
                          onChange={(e) =>
                            setDatosPago({
                              ...datosPago,
                              cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                            })
                          }
                          disabled={procesando}
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700">
                        Nombre del Titular
                      </Label>
                      <Input
                        placeholder="Juan Pérez"
                        value={datosPago.nombre_titular}
                        onChange={(e) =>
                          setDatosPago({
                            ...datosPago,
                            nombre_titular: e.target.value,
                          })
                        }
                        disabled={procesando}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {metodoPago === "yape" && (
                <Card className="p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Datos de Yape
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-700">
                        Número Yape
                      </Label>
                      <Input
                        placeholder="912345678"
                        value={datosPago.numero_yape}
                        onChange={(e) =>
                          setDatosPago({
                            ...datosPago,
                            numero_yape: e.target.value.replace(/\D/g, "").slice(0, 9),
                          })
                        }
                        disabled={procesando}
                        maxLength={9}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Comienza con 9, 9 dígitos en total
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700">
                        Código de Operación
                      </Label>
                      <Input
                        placeholder="123456"
                        value={datosPago.codigo_operacion_yape}
                        onChange={(e) =>
                          setDatosPago({
                            ...datosPago,
                            codigo_operacion_yape: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          })
                        }
                        disabled={procesando}
                        maxLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        6 dígitos
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {metodoPago === "plin" && (
                <Card className="p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Datos de Plin
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-700">
                        Número Plin
                      </Label>
                      <Input
                        placeholder="912345678"
                        value={datosPago.numero_plin}
                        onChange={(e) =>
                          setDatosPago({
                            ...datosPago,
                            numero_plin: e.target.value.replace(/\D/g, "").slice(0, 9),
                          })
                        }
                        disabled={procesando}
                        maxLength={9}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Comienza con 9, 9 dígitos en total
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700">
                        Código de Operación
                      </Label>
                      <Input
                        placeholder="123456"
                        value={datosPago.codigo_operacion_plin}
                        onChange={(e) =>
                          setDatosPago({
                            ...datosPago,
                            codigo_operacion_plin: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          })
                        }
                        disabled={procesando}
                        maxLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        6 dígitos
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {metodoPago === "transferencia" && (
                <Card className="p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Datos de Transferencia
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-700">Banco</Label>
                      <Select
                        value={datosPago.banco}
                        onValueChange={(val) =>
                          setDatosPago({ ...datosPago, banco: val })
                        }
                        disabled={procesando}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bcp">BCP</SelectItem>
                          <SelectItem value="interbank">Interbank</SelectItem>
                          <SelectItem value="bbva">BBVA</SelectItem>
                          <SelectItem value="scotiabank">Scotiabank</SelectItem>
                          <SelectItem value="otro">Otro Banco</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700">
                        Número de Cuenta
                      </Label>
                      <Input
                        placeholder="0000000000"
                        value={datosPago.numero_cuenta}
                        onChange={(e) =>
                          setDatosPago({
                            ...datosPago,
                            numero_cuenta: e.target.value,
                          })
                        }
                        disabled={procesando}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-700">
                        Número de Operación
                      </Label>
                      <Input
                        placeholder="Ej: 202311221500"
                        value={datosPago.numero_operacion_trans}
                        onChange={(e) =>
                          setDatosPago({
                            ...datosPago,
                            numero_operacion_trans: e.target.value,
                          })
                        }
                        disabled={procesando}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Referencia o código de la transacción
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Info de seguridad */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-semibold text-gray-700 mb-1">
                  🔒 Información Segura
                </p>
                <p>
                  Tus datos de pago están protegidos con encriptación de nivel
                  banco. Nunca compartiremos tu información.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={procesando}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={procesarPago}
                  disabled={!metodoPago || procesando}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {procesando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    `Pagar S/ ${monto.toFixed(2)}`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
