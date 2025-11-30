// app/api/notificaciones/route.ts
// Endpoint para obtener y crear notificaciones

import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let client;
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

    client = await pool.connect();

    // Obtener notificaciones del usuario
    const result = await client.query(
      `SELECT 
        id,
        titulo,
        mensaje,
        tipo,
        leida,
        created_at,
        id_relacionado
       FROM notificaciones 
       WHERE id_usuario = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [payload.userId]
    );

    const notificaciones = result.rows.map((n: any) => ({
      id: n.id,
      titulo: n.titulo,
      mensaje: n.mensaje,
      tipo: n.tipo,
      estado: n.leida ? "leida" : "nueva",
      leida: n.leida,
      timestamp: n.created_at,
      idRelacionado: n.id_relacionado,
    }));

    console.log(`✅ Obtenidas ${notificaciones.length} notificaciones para ${payload.userId}`);

    return NextResponse.json({ notificaciones });
  } catch (error) {
    console.error("❌ Error en GET notificaciones:", error);
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

export async function POST(request: NextRequest) {
  let client;
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

    const { titulo, mensaje, tipo, idRelacionado } = await request.json();

    // Validar campos requeridos
    if (!titulo || !mensaje || !tipo) {
      return NextResponse.json(
        { error: "Campos requeridos: titulo, mensaje, tipo" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Insertar notificación
    const result = await client.query(
      `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW())
       RETURNING id, created_at`,
      [payload.userId, titulo, mensaje, tipo, idRelacionado || null]
    );

    console.log(`✅ Notificación creada:`, {
      id: result.rows[0].id,
      titulo,
      tipo,
      usuario: payload.userId,
    });

    return NextResponse.json({
      success: true,
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("❌ Error creando notificación:", error);
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
