// MediLink+ - Context de autenticación
// Manejo global del estado de autenticación y usuario

"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Usuario } from "@/lib/database"

interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (roles: string[]) => boolean
}

interface RegisterData {
  nombre: string
  apellido: string
  email: string
  password: string
  telefono?: string
  rol: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar token almacenado al cargar la aplicación
  useEffect(() => {
    const storedToken = localStorage.getItem("medilink_token")
    const storedUser = localStorage.getItem("medilink_user")

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUsuario(parsedUser)
      } catch (error) {
        console.error("Error parsing stored user data:", error)
        localStorage.removeItem("medilink_token")
        localStorage.removeItem("medilink_user")
      }
    }
    setIsLoading(false)
  }, [])

  // Función de login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.token)
        setUsuario(data.user)
        localStorage.setItem("medilink_token", data.token)
        localStorage.setItem("medilink_user", JSON.stringify(data.user))
        return { success: true }
      } else {
        return { success: false, error: data.error || "Error de autenticación" }
      }
    } catch (error) {
      console.error("Error en login:", error)
      return { success: false, error: "Error de conexión" }
    }
  }

  // Función de registro
  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.token)
        setUsuario(data.user)
        localStorage.setItem("medilink_token", data.token)
        localStorage.setItem("medilink_user", JSON.stringify(data.user))
        return { success: true }
      } else {
        return { success: false, error: data.error || "Error en el registro" }
      }
    } catch (error) {
      console.error("Error en registro:", error)
      return { success: false, error: "Error de conexión" }
    }
  }

  // Función de logout
  const logout = () => {
    setToken(null)
    setUsuario(null)
    localStorage.removeItem("medilink_token")
    localStorage.removeItem("medilink_user")
  }

  // Verificar si el usuario está autenticado
  const isAuthenticated = !!token && !!usuario

  // Verificar si el usuario tiene uno de los roles especificados
  const hasRole = (roles: string[]): boolean => {
    return usuario ? roles.includes(usuario.rol) : false
  }

  const value: AuthContextType = {
    usuario,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook personalizado para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
