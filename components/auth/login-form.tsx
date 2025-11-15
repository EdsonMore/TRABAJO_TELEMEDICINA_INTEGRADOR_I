// MediLink+ - Formulario de inicio de sesión responsivo MEJORADO
// components/auth/login-form.tsx - Diseño optimizado para adultos mayores

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Heart,
  User,
  ArrowLeft,
  Home,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(
          result.error || "Error de autenticación. Verifique sus datos."
        );
      }
    } catch (error) {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md lg:max-w-2xl mx-auto shadow-2xl rounded-3xl border-4 border-blue-200 bg-white relative">
      {/* Botón de regreso interno - PARA MÓVIL PRINCIPALMENTE */}
      <div className="absolute -top-4 left-4 lg:hidden">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-3 bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <CardHeader className="space-y-4 text-center pb-6 lg:pb-8 px-6 lg:px-8">
        {/* Logo adicional en el card */}
        <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <CardTitle className="text-2xl lg:text-3xl font-bold text-blue-900">
          Iniciar Sesión
        </CardTitle>
        <CardDescription className="text-base lg:text-lg text-blue-700 font-medium">
          Acceda a su cuenta de MediLink+
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-8 px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
          {error && (
            <Alert
              variant="destructive"
              className="border-2 border-red-500 bg-red-50"
            >
              <AlertDescription className="text-lg font-medium text-red-800 text-center">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Campo de email - MEJORADO */}
          <div className="space-y-4">
            <Label
              htmlFor="email"
              className="text-xl font-bold text-blue-900 block"
            >
              📧 Correo Electrónico
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-12 md:h-14 text-base md:text-lg border-2 border-blue-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-200 transition-all"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Campo de contraseña - MEJORADO */}
          <div className="space-y-4">
            <Label
              htmlFor="password"
              className="text-xl font-bold text-blue-900 block"
            >
              🔒 Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-12 md:h-14 text-base md:text-lg border-2 border-blue-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-200 transition-all"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 h-6 w-6 text-blue-600 hover:text-blue-800 transition-colors"
                disabled={isLoading}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-6 w-6" />
                ) : (
                  <Eye className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Enlace de contraseña olvidada - MEJORADO */}
          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="text-lg text-blue-700 hover:text-blue-900 font-bold transition-colors underline"
            >
              ¿Olvidó su contraseña?
            </Link>
          </div>

          {/* Botón de inicio de sesión - MEJORADO */}
          <Button
            type="submit"
            className="w-full h-14 md:h-16 text-base md:text-lg font-bold bg-blue-700 hover:bg-blue-800 text-white border-4 border-blue-800 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 min-h-14"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 lg:h-6 lg:w-6 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <User className="mr-3 h-5 w-5 lg:h-6 lg:w-6" />
                Iniciar Sesión
              </>
            )}
          </Button>

          {/* Separador visual */}
          <div className="relative flex items-center justify-center">
            <div className="border-t-2 border-blue-200 flex-grow"></div>
            <span className="mx-4 text-blue-700 font-medium text-lg">o</span>
            <div className="border-t-2 border-blue-200 flex-grow"></div>
          </div>

          {/* Enlace de registro - MEJORADO */}
          <div className="text-center">
            <div className="text-lg lg:text-xl text-blue-700 font-medium">
              ¿No tiene cuenta?{" "}
              <Link
                href="/auth/register"
                className="text-blue-800 hover:text-blue-900 font-bold underline transition-colors text-xl lg:text-2xl"
              >
                Regístrese aquí
              </Link>
            </div>
          </div>

          {/* Botón de regreso alternativo - PARA FACIL ACCESO */}
          <div className="text-center pt-4 border-t-2 border-blue-200">
            <Link href="/">
              <Button
                variant="outline"
                className="h-12 px-6 text-lg font-medium border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-all duration-200"
              >
                <Home className="w-5 h-5 mr-2" />
                Volver a la Página Principal
              </Button>
            </Link>
          </div>

          {/* Información adicional para adultos mayores - MEJORADO */}
          <div className="bg-blue-50 rounded-xl p-4 lg:p-6 border-2 border-blue-200 mt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">💡</span>
              </div>
              <div>
                <p className="text-lg lg:text-xl text-blue-800 font-medium">
                  <strong>Consejo de seguridad:</strong>
                </p>
                <p className="text-blue-700 text-base lg:text-lg mt-1">
                  Nunca comparta su contraseña. Nuestro equipo nunca le pedirá
                  sus datos de acceso.
                </p>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
