// app/api/notificaciones/marcar-todo-leido/route.ts

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

    // Marcar todas como leídas
    await query(
      `UPDATE notificaciones 
       SET leida = true 
       WHERE id_usuario = $1 AND leida = false`,
      [payload.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error marcando todas como leídas:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
