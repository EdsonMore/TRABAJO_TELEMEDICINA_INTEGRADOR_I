// components/medico/modal-historial-paciente.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  AlertCircle,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  X,
  Loader2,
  User,
  Calendar,
  Clock,
  Pill,
  FlaskConical,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Heart,
  BadgeCheck,
} from "lucide-react";
import { VirtualKeyboard } from "@/components/ui/virtual-keyboard";
import { Input } from "@/components/ui/input";

// ============= INTERFACES =============
interface HistorialCita {
  id: string;
  fecha_cita: string;
  estado: string;
  tipo_cita: string;
  motivo_consulta: string;
  diagnostico?: string;
  tratamiento?: string;
  medico: {
    nombre: string;
    apellido: string;
    especialidad: string;
  };
  hora_cita?: string;
  observaciones_medico?: string;
  costo?: number;
}

interface Receta {
  id: string;
  codigo_receta: string;
  estado: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  observaciones?: string;
  medico: {
    nombre: string;
    apellido: string;
  };
}

interface ExamenLaboratorio {
  id: string;
  codigo_solicitud: string;
  estado: string;
  fecha_solicitud: string;
  laboratorio?: string;
  observaciones?: string;
}

interface PacienteData {
  id?: string;
  nombre?: string;
  apellido?: string;
  numero_documento?: string;
  numero_telefonico?: string;
  usuario?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  informacion_personal?: {
    dni?: string;
    edad?: number;
    fecha_nacimiento?: string;
  };
  informacion_medica?: {
    alergias?: string;
    enfermedades_cronicas?: string;
    tipo_sangre?: string;
  };
}

interface PacienteHistorial {
  paciente: PacienteData;
  historial_citas: HistorialCita[];
  recetas: Receta[];
  examenes_laboratorio: ExamenLaboratorio[];
}

interface ModalHistorialPacienteProps {
  isOpen: boolean;
  onClose: () => void;
  historial: PacienteHistorial | null;
  canAccess?: boolean;
  accessDenialReason?: string;
  citaFecha?: string;
  pacienteId?: string;
}

// ============= COMPONENTES AUXILIARES =============
function NoData({
  text,
  icon: Icon = AlertCircle,
}: {
  text: string;
  icon?: any;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <Icon className="w-12 h-12 mb-3 text-gray-300" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function BadgeEstado({ estado }: { estado: string }) {
  const getColor = () => {
    switch (estado.toLowerCase()) {
      case "completada":
      case "activa":
      case "completado":
        return "bg-green-100 text-green-800";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getColor()}`}
    >
      {estado}
    </span>
  );
}

function formatDate(value: string) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "-";
  }
}

// ============= COMPONENTE PRINCIPAL =============
export function ModalHistorialPaciente({
  isOpen,
  onClose,
  historial,
  canAccess = true,
  accessDenialReason = "",
  citaFecha,
  pacienteId = "",
}: ModalHistorialPacienteProps) {
  const { token } = useAuth();
  const { toast } = useToast();

  // ============= STATE =============
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [setupPassword, setSetupPassword] = useState("");
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"citas" | "recetas" | "examenes">(
    "citas"
  );

  // ============= HELPER FUNCTIONS =============
  const getPacienteNombre = (): string => {
    if (!historial) return "Paciente";
    return (
      historial.paciente?.usuario?.nombre ||
      historial.paciente?.nombre ||
      "Paciente"
    );
  };

  const getPacienteApellido = (): string => {
    if (!historial) return "";
    return (
      historial.paciente?.usuario?.apellido ||
      historial.paciente?.apellido ||
      ""
    );
  };

  const getPacienteContacto = () => {
    if (!historial) {
      return { dni: "", telefono: "", email: "" };
    }
    return {
      dni:
        historial.paciente?.informacion_personal?.dni ||
        historial.paciente?.numero_documento ||
        "N/A",
      telefono: historial.paciente?.numero_telefonico || "-",
      email: historial.paciente?.usuario?.email || "-",
    };
  };

  // ============= EFFECTS =============
  useEffect(() => {
    if (isOpen && token) {
      checkPasswordProtection();
    }
  }, [isOpen, token]);

  // ============= FUNCIONES DE CONTRASEÑA =============
  const checkPasswordProtection = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/medico/proteccion-historial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "check" }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsPasswordProtected(data.isProtected);
        setAccessGranted(!data.isProtected);
        if (data.isProtected) {
          setShowPasswordSetup(false);
        }
      }
    } catch (error) {
      console.error("Error checking password protection:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!password) {
      setPasswordError("Ingresa la contraseña");
      return;
    }

    try {
      setIsVerifying(true);
      setPasswordError("");

      const res = await fetch(`/api/medico/proteccion-historial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "verify", password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAccessGranted(true);
        setPassword("");
        toast({
          title: "✅ Acceso concedido",
          description: "Acceso al historial médico autorizado",
        });
      } else {
        setPasswordError(
          data.message || "Contraseña incorrecta. Intenta de nuevo."
        );
        toast({
          title: "❌ Contraseña incorrecta",
          description: "Verifica la contraseña e intenta nuevamente",
          variant: "destructive",
        });
      }
    } catch (error) {
      setPasswordError("Error al verificar la contraseña");
      console.error("Error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetupPassword = async () => {
    if (!setupPassword || !setupPasswordConfirm) {
      setPasswordError("Completa ambos campos");
      return;
    }

    if (setupPassword !== setupPasswordConfirm) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    if (setupPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setIsSettingUp(true);
      setPasswordError("");

      const res = await fetch(`/api/medico/proteccion-historial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "create", password: setupPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAccessGranted(true);
        setSetupPassword("");
        setSetupPasswordConfirm("");
        setShowPasswordSetup(false);
        setIsPasswordProtected(true);
        toast({
          title: "✅ Protección activada",
          description: "El historial ahora está protegido por contraseña",
        });
      } else {
        setPasswordError(data.message || "Error al crear la contraseña");
        toast({
          title: "❌ Error",
          description: "No se pudo crear la protección",
          variant: "destructive",
        });
      }
    } catch (error) {
      setPasswordError("Error al crear la contraseña");
      console.error("Error:", error);
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setSetupPassword("");
    setSetupPasswordConfirm("");
    setPasswordError("");
    setAccessGranted(false);
    setShowPasswordSetup(false);
    onClose();
  };

  // ============= RENDERIZADO CONDICIONAL =============
  if (!isOpen || !historial) return null;

  // Pantalla 1: Acceso denegado por tiempo
  if (!canAccess && !accessGranted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                  Acceso Denegado
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                {accessDenialReason ||
                  "No tienes permiso para acceder al historial de este paciente en este momento."}
              </p>

              {citaFecha && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    ℹ️ Información:
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    El acceso al historial está disponible desde la fecha de la
                    cita hasta 7 días después.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    <strong>Fecha de la cita:</strong> {formatDate(citaFecha)}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla 2: Verificación de contraseña (CON TECLADO VIRTUAL ORIGINAL)
  if (isPasswordProtected && !accessGranted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-lg w-full">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-blue-600" />
                  Acceso Protegido
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Ingresa tu contraseña para acceder al historial médico
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Campo de contraseña */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">
                  Contraseña de protección
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    placeholder="Ingresa con el teclado seguro"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-10"
                    disabled
                    readOnly
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {password.length} dígitos
                  </span>
                </div>
              </div>

              {/* TECLADO VIRTUAL ORIGINAL */}
              <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                <p className="text-xs font-semibold text-blue-700 mb-3">
                  🔒 TECLADO SEGURO - INGRESA TU CONTRASEÑA
                </p>
                <VirtualKeyboard
                  onInput={(char) => {
                    setPassword((prev) => prev + char);
                    setPasswordError("");
                  }}
                  onBackspace={() => setPassword((prev) => prev.slice(0, -1))}
                  onClear={() => setPassword("")}
                  inputLength={password.length}
                />
              </div>

              {/* Mensaje de error */}
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">❌ {passwordError}</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleVerifyPassword}
                  disabled={isVerifying || password.length === 0}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Verificar Acceso
                    </>
                  )}
                </button>
                <button
                  onClick={handleClose}
                  disabled={isVerifying}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============= PANTALLA PRINCIPAL - HISTORIAL COMPLETO =============
  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-blue-600" />
                  Historial Médico Completo
                </h2>
                <p className="text-gray-600">
                  Paciente: {getPacienteNombre()} {getPacienteApellido()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {isPasswordProtected ? (
                  <div className="inline-flex items-center px-3 py-1 bg-green-100 rounded-full">
                    <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Protegido
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPasswordSetup(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Proteger Historial
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Información del paciente */}
                <div className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <User className="w-5 h-5 mr-2 text-gray-600" />
                      Información del Paciente
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">
                          Datos Personales
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Nombre:</span>{" "}
                            {getPacienteNombre()} {getPacienteApellido()}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">DNI:</span>{" "}
                            {getPacienteContacto().dni}
                          </p>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-green-800 mb-2">
                          Contacto
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Teléfono:</span>{" "}
                            {getPacienteContacto().telefono}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Email:</span>{" "}
                            {getPacienteContacto().email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs de navegación */}
                <div className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-semibold text-gray-800">
                      Historial Médico Detallado
                    </h3>
                  </div>

                  <div className="p-4">
                    {/* Tabs personalizados */}
                    <div className="flex border-b mb-6">
                      <button
                        onClick={() => setActiveTab("citas")}
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === "citas"
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-600 hover:text-blue-600"
                        }`}
                      >
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Citas ({historial.historial_citas?.length || 0})
                      </button>
                      <button
                        onClick={() => setActiveTab("recetas")}
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === "recetas"
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-600 hover:text-blue-600"
                        }`}
                      >
                        <Pill className="w-4 h-4 inline mr-2" />
                        Recetas ({historial.recetas?.length || 0})
                      </button>
                      <button
                        onClick={() => setActiveTab("examenes")}
                        className={`px-4 py-2 text-sm font-medium ${
                          activeTab === "examenes"
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-600 hover:text-blue-600"
                        }`}
                      >
                        <FlaskConical className="w-4 h-4 inline mr-2" />
                        Exámenes ({historial.examenes_laboratorio?.length || 0})
                      </button>
                    </div>

                    {/* Contenido de citas */}
                    {activeTab === "citas" && (
                      <div className="space-y-4">
                        {historial.historial_citas?.length > 0 ? (
                          historial.historial_citas.map((cita) => (
                            <div
                              key={cita.id}
                              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-800">
                                    {cita.tipo_cita || "Consulta"}
                                  </h4>
                                  <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {formatDate(cita.fecha_cita)}
                                    {cita.hora_cita && (
                                      <>
                                        <Clock className="w-4 h-4 ml-4 mr-2" />
                                        {cita.hora_cita}
                                      </>
                                    )}
                                  </div>
                                </div>
                                <BadgeEstado estado={cita.estado} />
                              </div>

                              <div className="space-y-3 text-sm">
                                <p>
                                  <span className="font-medium text-gray-700">
                                    Médico:
                                  </span>{" "}
                                  {cita.medico.nombre} {cita.medico.apellido}
                                  <span className="text-gray-500 ml-2">
                                    ({cita.medico.especialidad})
                                  </span>
                                </p>

                                <div className="bg-gray-50 p-3 rounded">
                                  <p className="font-medium text-gray-700">
                                    Motivo:
                                  </p>
                                  <p className="text-gray-800">
                                    {cita.motivo_consulta}
                                  </p>
                                </div>

                                {cita.diagnostico && (
                                  <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                                    <p className="font-medium text-green-700 text-xs">
                                      DIAGNÓSTICO:
                                    </p>
                                    <p className="text-green-800 text-sm">
                                      {cita.diagnostico}
                                    </p>
                                  </div>
                                )}

                                {cita.tratamiento && (
                                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                                    <p className="font-medium text-blue-700 text-xs">
                                      TRATAMIENTO:
                                    </p>
                                    <p className="text-blue-800 text-sm">
                                      {cita.tratamiento}
                                    </p>
                                  </div>
                                )}

                                {cita.costo && (
                                  <p className="text-right text-sm">
                                    <span className="font-medium">Costo:</span>{" "}
                                    S/ {Number(cita.costo).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <NoData
                            text="No hay citas registradas"
                            icon={Calendar}
                          />
                        )}
                      </div>
                    )}

                    {/* Contenido de recetas */}
                    {activeTab === "recetas" && (
                      <div className="space-y-4">
                        {historial.recetas?.length > 0 ? (
                          historial.recetas.map((receta) => (
                            <div
                              key={receta.id}
                              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-800">
                                    Receta #{receta.codigo_receta}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Por: {receta.medico.nombre}{" "}
                                    {receta.medico.apellido}
                                  </p>
                                </div>
                                <BadgeEstado estado={receta.estado} />
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <p className="text-gray-600">
                                    <strong>Emitida:</strong>
                                  </p>
                                  <p className="text-gray-900">
                                    {formatDate(receta.fecha_emision)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">
                                    <strong>Vence:</strong>
                                  </p>
                                  <p className="text-gray-900">
                                    {formatDate(receta.fecha_vencimiento)}
                                  </p>
                                </div>
                              </div>

                              {receta.observaciones && (
                                <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                                  <p className="text-sm">
                                    <strong className="text-yellow-700">
                                      Medicamentos:
                                    </strong>
                                  </p>
                                  <p className="text-sm text-gray-700 mt-1">
                                    {receta.observaciones}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <NoData
                            text="No hay recetas registradas"
                            icon={Pill}
                          />
                        )}
                      </div>
                    )}

                    {/* Contenido de exámenes */}
                    {activeTab === "examenes" && (
                      <div className="space-y-4">
                        {historial.examenes_laboratorio?.length > 0 ? (
                          historial.examenes_laboratorio.map((examen) => (
                            <div
                              key={examen.id}
                              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-700">
                                  Examen #{examen.codigo_solicitud}
                                </h4>
                                <BadgeEstado estado={examen.estado} />
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                Fecha: {formatDate(examen.fecha_solicitud)}
                              </p>
                              <p className="text-sm mb-2">
                                <strong>Laboratorio:</strong>{" "}
                                {examen.laboratorio || "No especificado"}
                              </p>
                              {examen.observaciones && (
                                <div className="bg-purple-50 p-2 rounded border-l-4 border-purple-500">
                                  <p className="text-sm">
                                    <strong>Observaciones:</strong>{" "}
                                    {examen.observaciones}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <NoData
                            text="No hay exámenes registrados"
                            icon={FlaskConical}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel lateral */}
              <div className="space-y-6">
                {/* Antecedentes médicos */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-red-600" />
                    Antecedentes Médicos
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">Tipo de Sangre</p>
                      <p className="font-medium">
                        {historial.paciente?.informacion_medica?.tipo_sangre ||
                          "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Alergias</p>
                      <p className="font-medium">
                        {historial.paciente?.informacion_medica?.alergias ||
                          "No reportadas"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Enfermedades Crónicas</p>
                      <p className="font-medium">
                        {historial.paciente?.informacion_medica
                          ?.enfermedades_cronicas || "Ninguna"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    📊 Estadísticas
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Citas Totales</span>
                      <span className="font-medium">
                        {historial.historial_citas?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recetas Activas</span>
                      <span className="font-medium">
                        {historial.recetas?.filter((r) => r.estado === "activa")
                          .length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exámenes Realizados</span>
                      <span className="font-medium">
                        {historial.examenes_laboratorio?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Acciones</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-green-700 flex items-center justify-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Exportar Historial
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded text-sm font-medium hover:bg-gray-50 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cerrar Historial
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear protección (superpuesto) CON TECLADOS VIRTUALES ORIGINALES */}
      {showPasswordSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-green-600" />
                    Crear Protección de Contraseña
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Protege tus historiales médicos con una contraseña
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordSetup(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Campo: Nueva Contraseña */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={setupPassword}
                      placeholder="Ingresa con el teclado seguro"
                      className="pr-10 bg-gray-50"
                      disabled={isSettingUp}
                      readOnly
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {setupPassword.length}/6+
                    </span>
                  </div>
                </div>

                {/* TECLADO VIRTUAL ORIGINAL para Primera Contraseña */}
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                  <p className="text-xs font-semibold text-green-700 mb-3">
                    TECLADO SEGURO - NUEVA CONTRASEÑA
                  </p>
                  <VirtualKeyboard
                    onInput={(char) => setSetupPassword((prev) => prev + char)}
                    onBackspace={() =>
                      setSetupPassword((prev) => prev.slice(0, -1))
                    }
                    onClear={() => setSetupPassword("")}
                    inputLength={setupPassword.length}
                  />
                </div>

                {/* Campo: Confirmar Contraseña */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={setupPasswordConfirm}
                      placeholder="Confirma en el teclado seguro"
                      className="pr-10 bg-gray-50"
                      disabled={isSettingUp}
                      readOnly
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {setupPasswordConfirm.length}/6+
                    </span>
                  </div>
                </div>

                {/* TECLADO VIRTUAL ORIGINAL para Confirmación */}
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                  <p className="text-xs font-semibold text-blue-700 mb-3">
                    TECLADO SEGURO - CONFIRMAR CONTRASEÑA
                  </p>
                  <VirtualKeyboard
                    onInput={(char) =>
                      setSetupPasswordConfirm((prev) => prev + char)
                    }
                    onBackspace={() =>
                      setSetupPasswordConfirm((prev) => prev.slice(0, -1))
                    }
                    onClear={() => setSetupPasswordConfirm("")}
                    inputLength={setupPasswordConfirm.length}
                  />
                </div>

                {/* Mensaje de Error */}
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">❌ {passwordError}</p>
                  </div>
                )}

                {/* Validación */}
                {setupPassword && setupPasswordConfirm && (
                  <div className="space-y-2">
                    {setupPassword.length >= 6 ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        ✅ Contraseña válida ({setupPassword.length} caracteres)
                      </p>
                    ) : (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        ⚠️ Mínimo 6 caracteres ({setupPassword.length}/6)
                      </p>
                    )}

                    {setupPassword === setupPasswordConfirm ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        ✅ Las contraseñas coinciden
                      </p>
                    ) : (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        ❌ Las contraseñas no coinciden
                      </p>
                    )}
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={handleSetupPassword}
                    disabled={
                      isSettingUp ||
                      setupPassword.length < 6 ||
                      setupPassword !== setupPasswordConfirm
                    }
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSettingUp ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Crear Protección
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowPasswordSetup(false)}
                    disabled={isSettingUp}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
