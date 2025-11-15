// MediLink+ - Página de registro de usuarios mejorada
// Interfaz para crear nuevas cuentas en el sistema - Diseño optimizado

import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart } from "lucide-react";

export default function RegisterPage() {
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

      <div className="w-full max-w-4xl lg:max-w-6xl">
        {/* Header con logo y título - MEJORADO */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="mx-auto w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl border-4 border-white">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-blue-900 mb-4">
            Únete a MediLink+
          </h1>
          <p className="text-xl lg:text-2xl text-blue-700 font-medium max-w-2xl mx-auto leading-relaxed">
            Crea tu cuenta y mejora tu experiencia de salud digital
          </p>
        </div>

        <RegisterForm />

        {/* Footer informativo - MEJORADO */}
        <div className="mt-8 lg:mt-12 text-center">
          <p className="text-lg text-blue-700 font-medium">
            Al registrarte, aceptas nuestros{" "}
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

          {/* Información de seguridad */}
          <div className="mt-6 p-4 bg-green-50 rounded-2xl border-2 border-green-200 max-w-2xl mx-auto">
            <p className="text-green-800 font-medium text-lg">
              🛡️ <strong>Tu información está segura:</strong> Protegemos tus
              datos médicos con los más altos estándares de seguridad y
              confidencialidad.
            </p>
          </div>

          {/* Información de contacto para ayuda */}
          <div className="mt-4 p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 max-w-2xl mx-auto">
            <p className="text-blue-800 font-medium">
              📞 <strong>¿Necesita ayuda con el registro?</strong> Llámenos al{" "}
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
