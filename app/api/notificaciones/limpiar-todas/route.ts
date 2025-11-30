// app/api/notificaciones/limpiar-todas/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verificarToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Eliminar todas las notificaciones
    await query(
      `DELETE FROM notificaciones WHERE id_usuario = $1`,
      [payload.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error limpiando notificaciones:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
