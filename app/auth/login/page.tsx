// MediLink+ - Página de inicio de sesión mejorada con botón de regreso
// Interfaz principal para autenticación de usuarios - Diseño optimizado

import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4 md:p-8 relative">
      {/* Botón de regreso - POSICIÓN ABSOLUTA */}
      <Link href="/" className="absolute top-6 left-4 md:top-8 md:left-8 z-10">
        <Button
          variant="outline"
          className="flex items-center gap-2 h-12 px-4 md:px-6 text-lg font-medium bg-white/90 backdrop-blur-sm border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-900 transition-all duration-200 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Volver al Inicio</span>
          <span className="sm:hidden">Inicio</span>
        </Button>
      </Link>

      <div className="w-full max-w-md lg:max-w-2xl">
        {/* Header con logo y título - MEJORADO */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="mx-auto w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl border-4 border-white">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-blue-900 mb-4">
            MediLink+
          </h1>
          <p className="text-xl lg:text-2xl text-blue-700 font-medium max-w-md mx-auto leading-relaxed">
            Plataforma Inteligente de Coordinación Médica
          </p>
        </div>

        <LoginForm />

        {/* Footer informativo - MEJORADO */}
        <div className="mt-8 lg:mt-12 text-center">
          <p className="text-lg text-blue-700 font-medium">
            Al iniciar sesión, aceptas nuestros{" "}
            <a
              href="/terms"
              className="text-blue-800 hover:text-blue-900 font-bold underline transition-colors"
            >
              Términos de Servicio
            </a>{" "}
            y{" "}
            <a
              href="/privacy"
              className="text-blue-800 hover:text-blue-900 font-bold underline transition-colors"
            >
              Política de Privacidad
            </a>
          </p>

          {/* Información de contacto para ayuda */}
          <div className="mt-6 p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
            <p className="text-blue-800 font-medium">
              📞 <strong>¿Necesita ayuda?</strong> Llámenos al{" "}
              <span className="text-blue-900 font-bold text-lg">
                +51 1 234-5678
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
