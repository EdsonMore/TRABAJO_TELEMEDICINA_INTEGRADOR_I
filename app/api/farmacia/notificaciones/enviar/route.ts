// app/api/farmacia/notificaciones/enviar/route.ts
// Endpoint para que farmacias envíen notificaciones a pacientes
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "farmacia") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const { id_paciente, titulo, descripcion, tipo, referencia_id } = body;

    // Validar datos requeridos
    if (!id_paciente || !titulo || !descripcion || !tipo) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Crear notificación
    const result = await client.query(
      `INSERT INTO notificaciones (
        id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at
      ) VALUES ($1, $2, $3, $4, $5, false, NOW())
      RETURNING id`,
      [id_paciente, titulo, descripcion, tipo, referencia_id || null]
    );

    // También enviar email si existe integración
    // TODO: Implementar envío de email

    return NextResponse.json({
      success: true,
      notificacion: result.rows[0],
      message: "Notificación enviada correctamente",
    });
  } catch (error: any) {
    console.error("Error enviando notificación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
