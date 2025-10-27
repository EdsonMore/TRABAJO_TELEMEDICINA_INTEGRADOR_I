// MediLink+ - Página de registro de usuarios
// Interfaz para crear nuevas cuentas en el sistema

import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header con logo y título */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 medilink-gradient rounded-2xl flex items-center justify-center mb-4 medical-shadow">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Únete a MediLink+</h1>
          <p className="text-muted-foreground text-lg">Crea tu cuenta y mejora tu experiencia de salud</p>
        </div>

        <RegisterForm />

        {/* Footer informativo */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Al registrarte, aceptas nuestros{" "}
            <a href="/terms" className="text-primary hover:text-primary/80">
              Términos de Servicio
            </a>{" "}
            y{" "}
            <a href="/privacy" className="text-primary hover:text-primary/80">
              Política de Privacidad
            </a>
          </p>
          <p className="mt-2">Tu información médica está protegida con los más altos estándares de seguridad</p>
        </div>
      </div>
    </div>
  )
}
