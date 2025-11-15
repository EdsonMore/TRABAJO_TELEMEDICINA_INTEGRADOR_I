// MediLink+ - Formulario de registro MEJORADO
// Diseño amigable para adultos mayores pero respetuoso

"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  MapPin,
  Calendar,
  IdCard,
  ArrowLeft,
  Home,
  Shield,
  Heart,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// Interface para los datos de registro - CORREGIDO
interface RegisterFormData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono: string;
  fechaNacimiento: string; // CORREGIDO: debe ser fechaNacimiento
  genero: string;
  direccion: string;
  tipoDocumento: string;
  numeroDocumento: string;
}

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    fechaNacimiento: "", // CORREGIDO
    genero: "",
    direccion: "",
    tipoDocumento: "dni",
    numeroDocumento: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      return "Por favor ingrese su nombre y apellido completos";
    }

    if (!formData.email.trim()) {
      return "Necesitamos su correo electrónico para crear su cuenta";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "El formato del correo electrónico no es válido";
    }

    if (formData.password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres para mayor seguridad";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Las contraseñas no coinciden. Por favor verifique";
    }

    if (!formData.fechaNacimiento) {
      return "La fecha de nacimiento es necesaria para su historial médico";
    }

    if (!formData.numeroDocumento.trim()) {
      return "El número de documento es requerido para su identificación";
    }

    if (!formData.telefono.trim()) {
      return "Su número de teléfono es importante para contactarlo";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // CORREGIDO: Usar fechaNacimiento en lugar de fechaNacimiento
      const result = await register({
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim(),
        password: formData.password,
        telefono: formData.telefono.trim(),
        rol: "paciente",
        fechaNacimiento: formData.fechaNacimiento, // CORREGIDO
        genero: formData.genero,
        direccion: formData.direccion.trim(),
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento.trim(),
      });

      if (result.success) {
        router.push("/dashboard/paciente");
      } else {
        setError(result.error || "Ocurrió un error al crear su cuenta");
      }
    } catch (error) {
      setError("Error de conexión. Por favor intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular fechas para el input de fecha
  const getMaxBirthDate = () => {
    const today = new Date();
    const minAgeDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    return minAgeDate.toISOString().split("T")[0];
  };

  const getMinBirthDate = () => {
    const today = new Date();
    const maxAgeDate = new Date(
      today.getFullYear() - 120,
      today.getMonth(),
      today.getDate()
    );
    return maxAgeDate.toISOString().split("T")[0];
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl rounded-2xl border-2 border-blue-200 bg-white">
      {/* Header del formulario */}
      <CardHeader className="text-center pb-6 px-6">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-blue-900">
          Crear Cuenta de Paciente
        </CardTitle>
        <CardDescription className="text-lg text-blue-700">
          Complete sus datos para acceder a todos nuestros servicios médicos
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6 px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="nombre"
                  className="text-base font-medium text-blue-900"
                >
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Su nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  className="h-12 text-base border-blue-300 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="apellido"
                  className="text-base font-medium text-blue-900"
                >
                  Apellido
                </Label>
                <Input
                  id="apellido"
                  type="text"
                  placeholder="Su apellido"
                  value={formData.apellido}
                  onChange={(e) =>
                    handleInputChange("apellido", e.target.value)
                  }
                  className="h-12 text-base border-blue-300 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Documentación */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              <IdCard className="w-5 h-5" />
              Documento de Identidad
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="tipoDocumento"
                  className="text-base font-medium text-blue-900"
                >
                  Tipo de Documento
                </Label>
                <Select
                  value={formData.tipoDocumento}
                  onValueChange={(value) =>
                    handleInputChange("tipoDocumento", value)
                  }
                >
                  <SelectTrigger className="h-12 text-base border-blue-300 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dni" className="text-base">
                      DNI
                    </SelectItem>
                    <SelectItem value="pasaporte" className="text-base">
                      Pasaporte
                    </SelectItem>
                    <SelectItem
                      value="carnet_extranjeria"
                      className="text-base"
                    >
                      Carnet de Extranjería
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="numeroDocumento"
                  className="text-base font-medium text-blue-900"
                >
                  Número de Documento
                </Label>
                <Input
                  id="numeroDocumento"
                  type="text"
                  placeholder="Ej: 87654321"
                  value={formData.numeroDocumento}
                  onChange={(e) =>
                    handleInputChange("numeroDocumento", e.target.value)
                  }
                  className="h-12 text-base border-blue-300 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Datos Personales */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Datos Personales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="fechaNacimiento"
                  className="text-base font-medium text-blue-900"
                >
                  Fecha de Nacimiento
                </Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) =>
                    handleInputChange("fechaNacimiento", e.target.value)
                  }
                  className="h-12 text-base border-blue-300 focus:border-blue-500"
                  required
                  disabled={isLoading}
                  max={getMaxBirthDate()}
                  min={getMinBirthDate()}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="genero"
                  className="text-base font-medium text-blue-900"
                >
                  Género
                </Label>
                <Select
                  value={formData.genero}
                  onValueChange={(value) => handleInputChange("genero", value)}
                >
                  <SelectTrigger className="h-12 text-base border-blue-300 focus:border-blue-500">
                    <SelectValue placeholder="Seleccione su género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino" className="text-base">
                      Masculino
                    </SelectItem>
                    <SelectItem value="femenino" className="text-base">
                      Femenino
                    </SelectItem>
                    <SelectItem value="otro" className="text-base">
                      Otro
                    </SelectItem>
                    <SelectItem value="prefiero_no_decir" className="text-base">
                      Prefiero no decir
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Información de Contacto
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-base font-medium text-blue-900"
                >
                  Correo Electrónico
                </Label>

                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="su.correo@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 h-12 text-base border-blue-300 focus:border-blue-500"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="telefono"
                  className="text-base font-medium text-blue-900"
                >
                  Teléfono
                </Label>
                <div className="relative">
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="+51 987 654 321"
                    value={formData.telefono}
                    onChange={(e) =>
                      handleInputChange("telefono", e.target.value)
                    }
                    className="pl-10 h-12 text-base border-blue-300 focus:border-blue-500"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="direccion"
                  className="text-base font-medium text-blue-900"
                >
                  Dirección (Opcional)
                </Label>
                <div className="relative">
                  <Input
                    id="direccion"
                    type="text"
                    placeholder="Av. Principal 123, Lima, Perú"
                    value={formData.direccion}
                    onChange={(e) =>
                      handleInputChange("direccion", e.target.value)
                    }
                    className="pl-10 h-12 text-base border-blue-300 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contraseñas */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Seguridad de la Cuenta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-base font-medium text-blue-900"
                >
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="pl-10 pr-10 h-12 text-base border-blue-300 focus:border-blue-500"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-blue-600 hover:text-blue-800"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-base font-medium text-blue-900"
                >
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita su contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="pl-10 pr-10 h-12 text-base border-blue-300 focus:border-blue-500"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-blue-600 hover:text-blue-800"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de registro */}
          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700 rounded-xl transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creando su cuenta...
              </>
            ) : (
              <>
                <Heart className="mr-2 h-5 w-5" />
                Crear Mi Cuenta
              </>
            )}
          </Button>

          {/* Enlaces adicionales */}
          <div className="text-center space-y-4 pt-4">
            <div className="text-base text-blue-700">
              ¿Ya tiene una cuenta?{" "}
              <Link
                href="/auth/login"
                className="text-blue-800 hover:text-blue-900 font-semibold underline"
              >
                Iniciar Sesión
              </Link>
            </div>

            <Link href="/">
              <Button
                variant="outline"
                className="h-11 text-base font-medium border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Home className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
            </Link>
          </div>

          {/* Información de ayuda */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-medium text-sm">
                  ¿Necesita ayuda? Estamos aquí para ayudarle.
                </p>
                <p className="text-blue-700 text-sm">
                  Llámenos al{" "}
                  <span className="font-semibold">+51 1 234-5678</span>
                </p>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
