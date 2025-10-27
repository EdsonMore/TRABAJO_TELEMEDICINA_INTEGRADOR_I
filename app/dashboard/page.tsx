// MediLink+ - Dashboard principal que redirige según el rol del usuario
// Página que determina qué dashboard mostrar según el tipo de usuario

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { usuario, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/auth/login")
        return
      }

      // Redirigir según el rol del usuario
      switch (usuario?.rol) {
        case "paciente":
          router.push("/dashboard/paciente")
          break
        case "medico":
          router.push("/dashboard/medico")
          break
        case "farmacia":
          router.push("/dashboard/farmacia")
          break
        case "laboratorio":
          router.push("/dashboard/laboratorio")
          break
        case "administrador":
          router.push("/dashboard/admin")
          break
        default:
          router.push("/auth/login")
      }
    }
  }, [isLoading, isAuthenticated, usuario, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Cargando tu dashboard...</p>
      </div>
    </div>
  )
}
