// MediLink+ - API Route para autenticación de usuarios
// Endpoint para login con validación y generación de JWT

import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validar datos requeridos
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 })
    }

    // Autenticar usuario
    const result = await authenticateUser(email, password)

    if (!result) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Registrar en auditoría
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Aquí podrías agregar el registro de auditoría si lo necesitas
    console.log(`Login exitoso para ${email} desde IP: ${clientIP}`)

    return NextResponse.json({
      message: "Autenticación exitosa",
      user: result.user,
      token: result.token,
    })
  } catch (error) {
    console.error("Error en login API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
