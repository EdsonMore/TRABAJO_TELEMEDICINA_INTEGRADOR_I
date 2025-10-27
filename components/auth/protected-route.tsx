// MediLink+ - Componente para proteger rutas según autenticación y roles
// Wrapper que verifica permisos antes de mostrar contenido

"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requireAuth?: boolean
}

export function ProtectedRoute({ children, allowedRoles = [], requireAuth = true }: ProtectedRouteProps) {
  const { usuario, isLoading, isAuthenticated, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Si se requiere autenticación y el usuario no está autenticado
      if (requireAuth && !isAuthenticated) {
        router.push("/auth/login")
        return
      }

      // Si hay roles específicos requeridos y el usuario no los tiene
      if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        router.push("/unauthorized")
        return
      }
    }
  }, [isLoading, isAuthenticated, usuario, allowedRoles, requireAuth, hasRole, router])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si se requiere autenticación y no está autenticado, no mostrar nada
  // (el useEffect se encargará de redirigir)
  if (requireAuth && !isAuthenticated) {
    return null
  }

  // Si hay roles requeridos y el usuario no los tiene, no mostrar nada
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return null
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>
}
