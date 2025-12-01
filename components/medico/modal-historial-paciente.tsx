// components/medico/modal-historial-paciente.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  AlertCircle,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

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
  token?: string;
}

// ============= COMPONENTES AUXILIARES =============
function NoData({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-gray-500">
      <AlertCircle className="w-5 h-5 mr-2" />
      <p>{text}</p>
    </div>
  );
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
  token = "",
}: ModalHistorialPacienteProps) {
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
    if (isOpen && pacienteId && token) {
      checkPasswordProtection();
    }
  }, [isOpen, pacienteId, token]);

  // ============= FUNCIONES DE CONTRASEÑA =============
  const checkPasswordProtection = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/medico/pacientes/${pacienteId}/historial-protegido`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "check" }),
        }
      );

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

      const res = await fetch(
        `/api/medico/pacientes/${pacienteId}/historial-protegido`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "verify", password }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setAccessGranted(true);
        setPassword("");
      } else {
        setPasswordError(
          data.message || "Contraseña incorrecta. Intenta de nuevo."
        );
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

      const res = await fetch(
        `/api/medico/pacientes/${pacienteId}/historial-protegido`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "create", password: setupPassword }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setAccessGranted(true);
        setSetupPassword("");
        setSetupPasswordConfirm("");
        setShowPasswordSetup(false);
        setIsPasswordProtected(true);
      } else {
        setPasswordError(data.message || "Error al crear la contraseña");
      }
    } catch (error) {
      setPasswordError("Error al crear la contraseña");
      console.error("Error:", error);
    } finally {
      setIsSettingUp(false);
    }
  };

  // ============= EARLY RETURNS =============
  if (!historial) {
    return null;
  }

  // Sin acceso
  if (!canAccess && !accessGranted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg font-semibold">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              Acceso Denegado
            </DialogTitle>
            <DialogDescription>
              {accessDenialReason ||
                "No tienes permiso para acceder al historial de este paciente en este momento."}
            </DialogDescription>
          </DialogHeader>

          {citaFecha && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
              <p className="text-sm text-amber-900">
                <strong>ℹ️ Información:</strong>
              </p>
              <p className="text-sm text-amber-800 mt-1">
                El acceso al historial está disponible desde la fecha de la cita
                hasta 7 días después.
              </p>
              <p className="text-sm text-amber-800 mt-2">
                <strong>Fecha de la cita:</strong>{" "}
                {new Date(citaFecha).toLocaleDateString("es-PE", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
            >
              Entendido
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Pantalla de protección por contraseña
  if (isPasswordProtected && !accessGranted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg font-semibold">
              <Lock className="w-5 h-5 mr-2 text-blue-600" />
              Historial Protegido
            </DialogTitle>
            <DialogDescription>
              Este historial está protegido con contraseña. Ingresa la
              contraseña para continuar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleVerifyPassword();
                    }
                  }}
                  placeholder="Ingresa la contraseña"
                  className="pr-10"
                  disabled={isVerifying}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-600 mt-2">{passwordError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleVerifyPassword}
                disabled={isVerifying}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isVerifying ? "Verificando..." : "Verificar"}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Pantalla de crear contraseña (primera vez)
  if (!isPasswordProtected && !accessGranted && showPasswordSetup) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg font-semibold">
              <Key className="w-5 h-5 mr-2 text-green-600" />
              Crear Protección de Contraseña
            </DialogTitle>
            <DialogDescription>
              Protege este historial con una contraseña. La próxima vez que lo
              consultes, necesitarás esta contraseña.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={setupPassword}
                  onChange={(e) => {
                    setSetupPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                  disabled={isSettingUp}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={setupPasswordConfirm}
                  onChange={(e) => {
                    setSetupPasswordConfirm(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="Confirma tu contraseña"
                  className="pr-10"
                  disabled={isSettingUp}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-600 mt-2">{passwordError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSetupPassword}
                disabled={isSettingUp}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSettingUp ? "Creando..." : "Crear Protección"}
              </Button>
              <Button
                onClick={() => setShowPasswordSetup(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // PANTALLA PRINCIPAL - Mostrar historial completo
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          max-w-6xl 
          max-h-[85vh] 
          w-full 
          overflow-y-auto 
          rounded-2xl 
          p-6 
          scrollbar-thin 
          scrollbar-thumb-gray-300 
          scrollbar-track-transparent
        "
      >
        <DialogHeader className="pb-2 sticky top-0 bg-white z-10">
          <DialogTitle className="flex items-center text-xl font-semibold">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            Historial Médico de {getPacienteNombre()} {getPacienteApellido()}
          </DialogTitle>
          <DialogDescription>
            Evolución clínica completa del paciente
            {isPasswordProtected && (
              <span className="ml-2 inline-flex items-center text-blue-600">
                <Lock className="w-4 h-4 mr-1" /> Protegido
              </span>
            )}
            {!isPasswordProtected && !loading && (
              <button
                onClick={() => setShowPasswordSetup(true)}
                className="ml-2 text-blue-600 hover:text-blue-700 text-sm underline"
              >
                Proteger con contraseña
              </button>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="resumen" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="citas">
              Citas ({historial.historial_citas?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="recetas">
              Recetas ({historial.recetas?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="examenes">
              Exámenes ({historial.examenes_laboratorio?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* 📋 Resumen Clínico */}
          <TabsContent value="resumen" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Datos Personales */}
              <div className="p-4 border rounded-lg bg-white shadow-sm">
                <h4 className="font-semibold text-blue-700 mb-3">
                  Datos Personales
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Nombre:</strong> {getPacienteNombre()}{" "}
                    {getPacienteApellido()}
                  </p>
                  <p>
                    <strong>DNI:</strong> {getPacienteContacto().dni}
                  </p>
                  <p>
                    <strong>Teléfono:</strong> {getPacienteContacto().telefono}
                  </p>
                  <p>
                    <strong>Email:</strong> {getPacienteContacto().email}
                  </p>
                </div>
              </div>

              {/* Información Médica */}
              <div className="p-4 border rounded-lg bg-white shadow-sm">
                <h4 className="font-semibold text-red-700 mb-3">
                  Antecedentes Médicos
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Tipo de Sangre:</strong>{" "}
                    {historial.paciente?.informacion_medica?.tipo_sangre ||
                      "No especificado"}
                  </p>
                  <p>
                    <strong>Alergias:</strong>{" "}
                    {historial.paciente?.informacion_medica?.alergias ||
                      "No reportadas"}
                  </p>
                  <p>
                    <strong>Enfermedades Crónicas:</strong>{" "}
                    {historial.paciente?.informacion_medica
                      ?.enfermedades_cronicas || "Ninguna"}
                  </p>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="p-4 border rounded-lg bg-white shadow-sm">
                <h4 className="font-semibold text-green-700 mb-3">
                  Estadísticas
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Total de Citas:</strong>{" "}
                    {historial.historial_citas?.length || 0}
                  </p>
                  <p>
                    <strong>Recetas Activas:</strong>{" "}
                    {historial.recetas?.filter((r) => r.estado === "activa")
                      .length || 0}
                  </p>
                  <p>
                    <strong>Exámenes Realizados:</strong>{" "}
                    {historial.examenes_laboratorio?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 🗓️ Citas */}
          <TabsContent value="citas" className="space-y-4 py-4">
            {historial.historial_citas?.length > 0 ? (
              historial.historial_citas.map((cita) => (
                <div
                  key={cita.id}
                  className="border border-blue-200 rounded-lg p-4 shadow-sm bg-blue-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        {cita.tipo_cita || "Cita"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(cita.fecha_cita).toLocaleDateString(
                          "es-PE",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                        {cita.hora_cita && ` a las ${cita.hora_cita}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        cita.estado === "completada" ? "default" : "secondary"
                      }
                    >
                      {cita.estado}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Médico:</strong> {cita.medico.nombre}{" "}
                      {cita.medico.apellido} ({cita.medico.especialidad})
                    </p>
                    <p>
                      <strong>Motivo:</strong> {cita.motivo_consulta}
                    </p>
                    {cita.diagnostico && (
                      <div className="bg-white p-2 rounded border-l-4 border-green-500">
                        <p className="text-xs text-green-700">
                          <strong>Diagnóstico:</strong>
                        </p>
                        <p className="text-sm">{cita.diagnostico}</p>
                      </div>
                    )}
                    {cita.tratamiento && (
                      <div className="bg-white p-2 rounded border-l-4 border-purple-500">
                        <p className="text-xs text-purple-700">
                          <strong>Tratamiento:</strong>
                        </p>
                        <p className="text-sm">{cita.tratamiento}</p>
                      </div>
                    )}
                    {cita.observaciones_medico && (
                      <div className="bg-white p-2 rounded border-l-4 border-orange-500">
                        <p className="text-xs text-orange-700">
                          <strong>Observaciones:</strong>
                        </p>
                        <p className="text-sm">
                          {cita.observaciones_medico}
                        </p>
                      </div>
                    )}
                    {cita.costo && (
                      <p>
                        <strong>Costo:</strong> S/ {Number(cita.costo).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <NoData text="No hay citas registradas" />
            )}
          </TabsContent>

          {/* 💊 Recetas */}
          <TabsContent value="recetas" className="space-y-4 py-4">
            {historial.recetas?.length > 0 ? (
              historial.recetas.map((receta) => (
                <div
                  key={receta.id}
                  className="border border-green-200 rounded-lg p-4 shadow-sm bg-green-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-green-900">
                        Receta #{receta.codigo_receta}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Por: {receta.medico.nombre} {receta.medico.apellido}
                      </p>
                    </div>
                    <Badge
                      variant={
                        receta.estado === "completada" ? "default" : "secondary"
                      }
                    >
                      {receta.estado}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">
                        <strong>Emitida:</strong>
                      </p>
                      <p className="text-gray-900">
                        {new Date(receta.fecha_emision).toLocaleDateString(
                          "es-PE"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        <strong>Vence:</strong>
                      </p>
                      <p className="text-gray-900">
                        {new Date(receta.fecha_vencimiento).toLocaleDateString(
                          "es-PE"
                        )}
                      </p>
                    </div>
                  </div>

                  {receta.observaciones && (
                    <div className="bg-white p-3 rounded-lg border-l-4 border-green-500">
                      <p className="text-sm">
                        <strong className="text-green-700">Medicamentos:</strong>
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {receta.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <NoData text="No hay recetas registradas" />
            )}
          </TabsContent>

          {/* 🧪 Exámenes */}
          <TabsContent value="examenes" className="space-y-4 py-4">
            {historial.examenes_laboratorio?.length > 0 ? (
              historial.examenes_laboratorio.map((examen) => (
                <div
                  key={examen.id}
                  className="border border-orange-200 rounded-lg p-4 shadow-sm bg-orange-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-orange-700">
                      Examen #{examen.codigo_solicitud}
                    </h4>
                    <Badge
                      variant={
                        examen.estado === "completado" ? "default" : "secondary"
                      }
                    >
                      {examen.estado}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Fecha:{" "}
                    {new Date(examen.fecha_solicitud).toLocaleDateString(
                      "es-PE"
                    )}
                  </p>
                  <p className="text-sm mb-2">
                    <strong>Laboratorio:</strong>{" "}
                    {examen.laboratorio || "No especificado"}
                  </p>
                  {examen.observaciones && (
                    <div className="bg-white p-2 rounded border-l-4 border-orange-500">
                      <p className="text-sm">
                        <strong>Observaciones:</strong> {examen.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <NoData text="No hay exámenes registrados" />
            )}
          </TabsContent>
        </Tabs>

        <div className="border-t pt-4 mt-4 flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
