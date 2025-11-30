// app/api/citas/crear-notificacion/route.ts
// Endpoint especializado para crear notificaciones de citas

import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let client;
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("⚠️ Sin token en crear-notificacion de cita");
      return NextResponse.json(
        { error: "Token requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verificarToken(token);

    if (!payload) {
      console.log("⚠️ Token inválido en crear-notificacion de cita");
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const { citaId, accion, estado, fechaCita, horaCita, medicoNombre } =
      await request.json();

    console.log("📅 Creando notificación de cita:", {
      citaId,
      accion,
      fechaCita,
      horaCita,
      payload: payload.userId,
    });

    let titulo = "";
    let mensaje = "";

    // Determinar título y mensaje según la acción
    if (accion === "crear") {
      titulo = "📅 Nueva Cita Programada";
      // Formatear fecha correctamente
      const fechaObj = new Date(fechaCita + "T00:00:00");
      const fechaFormato = isNaN(fechaObj.getTime()) 
        ? fechaCita 
        : fechaObj.toLocaleDateString("es-PE");
      
      mensaje = `Tu cita con ${medicoNombre} está programada para ${fechaFormato} a las ${horaCita}`;
    } else if (accion === "confirmar") {
      titulo = "✅ Cita Confirmada";
      const fechaObj = new Date(fechaCita + "T00:00:00");
      const fechaFormato = isNaN(fechaObj.getTime()) 
        ? fechaCita 
        : fechaObj.toLocaleDateString("es-PE");
      mensaje = `Tu cita del ${fechaFormato} ha sido confirmada`;
    } else if (accion === "cancelar") {
      titulo = "❌ Cita Cancelada";
      const fechaObj = new Date(fechaCita + "T00:00:00");
      const fechaFormato = isNaN(fechaObj.getTime()) 
        ? fechaCita 
        : fechaObj.toLocaleDateString("es-PE");
      mensaje = `Tu cita del ${fechaFormato} ha sido cancelada`;
    } else if (accion === "completar") {
      titulo = "✔️ Cita Completada";
      const fechaObj = new Date(fechaCita + "T00:00:00");
      const fechaFormato = isNaN(fechaObj.getTime()) 
        ? fechaCita 
        : fechaObj.toLocaleDateString("es-PE");
      mensaje = `Tu consulta del ${fechaFormato} ha sido registrada`;
    } else {
      titulo = `Cita ${estado}`;
      mensaje = `Tu cita ha sido ${estado}`;
    }

    // ===== OBTENER INFORMACIÓN DE LA CITA =====
    client = await pool.connect();

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

    // Obtener ID de usuario del paciente
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
       VALUES ($1, $2, $3, 'cita', $4, false, NOW())
       RETURNING id, created_at`,
      [usuarioId, titulo, mensaje, citaId]
    );

    const notificacionId = notifResult.rows[0].id;

    console.log(`✅ Notificación de cita creada:`, {
      id: notificacionId,
      titulo,
      accion,
      citaId,
    });

    return NextResponse.json({
      success: true,
      message: "Notificación creada",
      notificationId: notificacionId,
    });
  } catch (error: any) {
    console.error("❌ Error creando notificación de cita:", error);
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
