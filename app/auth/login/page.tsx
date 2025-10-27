// MediLink+ - Página de inicio de sesión
// Interfaz principal para autenticación de usuarios

import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header con logo y título */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 medilink-gradient rounded-2xl flex items-center justify-center mb-4 medical-shadow">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">MediLink+</h1>
          <p className="text-muted-foreground text-lg">Plataforma Inteligente de Coordinación Médica</p>
        </div>

        <LoginForm />

        {/* Footer informativo */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Al iniciar sesión, aceptas nuestros{" "}
            <a href="/terms" className="text-primary hover:text-primary/80">
              Términos de Servicio
            </a>{" "}
            y{" "}
            <a href="/privacy" className="text-primary hover:text-primary/80">
              Política de Privacidad
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
