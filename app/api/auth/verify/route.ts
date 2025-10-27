// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "No token provided",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const usuario = await verificarToken(token);

    if (!usuario) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "Invalid token",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
      },
    });
  } catch (error) {
    console.error("Error verificando auth:", error);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}
