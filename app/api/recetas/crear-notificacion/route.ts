// app/api/recetas/crear-notificacion/route.ts
// Endpoint especializado para crear notificaciones de recetas

import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let client;
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("⚠️ Sin token en crear-notificacion");
      return NextResponse.json(
        { error: "Token requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verificarToken(token);

    if (!payload) {
      console.log("⚠️ Token inválido en crear-notificacion");
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const { recetaId, accion, estado, medicoNombre, codigoReceta } =
      await request.json();

    console.log("📬 Creando notificación de receta:", {
      recetaId,
      accion,
      codigoReceta,
    });

    let titulo = "";
    let mensaje = "";

    // Determinar título y mensaje según la acción
    if (accion === "crear") {
      titulo = "📋 Nueva Receta";
      mensaje = `${medicoNombre} ha emitido una nueva receta (${codigoReceta}). Disponible para retirar en farmacias.`;
    } else if (accion === "dispensada") {
      titulo = "✅ Receta Dispensada";
      mensaje = `Tu receta ${codigoReceta} ha sido dispensada correctamente.`;
    } else if (accion === "rechazada") {
      titulo = "❌ Receta Rechazada";
      mensaje = `Tu receta ${codigoReceta} fue rechazada. Contacta con tu médico.`;
    } else if (accion === "en_proceso") {
      titulo = "⏳ Receta en Preparación";
      mensaje = `Tu receta ${codigoReceta} está siendo preparada en la farmacia.`;
    } else if (accion === "cancelada") {
      titulo = "❌ Receta Cancelada";
      mensaje = `Tu receta ${codigoReceta} ha sido cancelada.`;
    } else if (accion === "expirada") {
      titulo = "⏰ Receta Expirada";
      mensaje = `Tu receta ${codigoReceta} ha expirado y no puede ser despachada.`;
    } else {
      titulo = `Receta ${estado}`;
      mensaje = `Tu receta ha cambiado a estado: ${estado}`;
    }

    // ===== OBTENER INFORMACIÓN DE LA RECETA =====
    client = await pool.connect();

    const recetaResult = await client.query(
      `SELECT r.id, r.id_cita
       FROM recetas r
       WHERE r.id = $1`,
      [recetaId]
    );

    if (recetaResult.rows.length === 0) {
      console.log(`❌ Receta no encontrada: ${recetaId}`);
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const citaId = recetaResult.rows[0].id_cita;

    // Obtener paciente desde cita
    const citaResult = await client.query(
      "SELECT id_paciente FROM citas WHERE id = $1",
      [citaId]
    );

    if (citaResult.rows.length === 0) {
      console.log(`❌ Cita no encontrada: ${citaId}`);
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    const pacienteId = citaResult.rows[0].id_paciente;

    // Obtener usuario del paciente
    const pacienteResult = await client.query(
      "SELECT id_usuario FROM pacientes WHERE id = $1",
      [pacienteId]
    );

    if (pacienteResult.rows.length === 0) {
      console.log(`❌ Paciente no encontrado: ${pacienteId}`);
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const usuarioId = pacienteResult.rows[0].id_usuario;

    // ===== CREAR NOTIFICACIÓN EN BD =====
    const notifResult = await client.query(
      `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
       VALUES ($1, $2, $3, 'receta', $4, false, NOW())
       RETURNING id, created_at`,
      [usuarioId, titulo, mensaje, recetaId]
    );

    const notificacionId = notifResult.rows[0].id;

    console.log(`✅ Notificación creada:`, {
      id: notificacionId,
      titulo,
      accion,
      recetaId,
    });

    return NextResponse.json({
      success: true,
      message: "Notificación creada",
      notificationId: notificacionId,
    });
  } catch (error: any) {
    console.error("❌ Error creando notificación de receta:", error);
    return NextResponse.json(
      {
        error: "Error interno",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
