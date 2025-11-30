// app/api/notificaciones/[id]/route.ts
// Endpoint para marcar como leída y eliminar notificaciones

import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  try {
    const { id } = await params;
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

    const { leida } = await request.json();

    client = await pool.connect();

    // Actualizar notificación
    const result = await client.query(
      `UPDATE notificaciones 
       SET leida = $1 
       WHERE id = $2 AND id_usuario = $3
       RETURNING id`,
      [leida, id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    console.log(`✅ Notificación ${id} marcada como ${leida ? "leída" : "no leída"}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error actualizando notificación:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  try {
    const { id } = await params;
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

    client = await pool.connect();

    // Eliminar notificación
    const result = await client.query(
      `DELETE FROM notificaciones 
       WHERE id = $1 AND id_usuario = $2
       RETURNING id`,
      [id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    console.log(`✅ Notificación ${id} eliminada`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error eliminando notificación:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
