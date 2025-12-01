// app/api/farmacia/recetas-recibidas/[id]/responder/route.ts
// MediLink+ - API para que farmacia acepte o rechace receta
// PATCH: Actualiza el estado de la receta

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  try {
    // Verificar token
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario || usuario.rol !== "farmacia") {
      return NextResponse.json(
        { error: "Acceso denegado. Solo farmacias" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { accion, motivo_rechazo } = await request.json();

    // Validar acción
    if (!accion || !["aceptar", "rechazar"].includes(accion)) {
      return NextResponse.json(
        { error: "acción debe ser 'aceptar' o 'rechazar'" },
        { status: 400 }
      );
    }

    if (accion === "rechazar" && !motivo_rechazo) {
      return NextResponse.json(
        { error: "motivo_rechazo es requerido para rechazar" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // 1️⃣ Obtener ID de la farmacia
    const farmaciaResult = await client.query(
      `SELECT id FROM farmacias WHERE id_usuario = $1`,
      [usuario.id]
    );

    if (farmaciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Farmacia no encontrada" },
        { status: 404 }
      );
    }

    const farmaciaId = farmaciaResult.rows[0].id;

    // 2️⃣ Verificar que la receta le pertenece a la farmacia
    const recetaResult = await client.query(
      `SELECT r.id, r.estado_envio, r.codigo_receta
       FROM recetas r
       WHERE r.id = $1 AND r.farmacia_seleccionada_id = $2`,
      [id, farmaciaId]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada o no te pertenece" },
        { status: 404 }
      );
    }

    const receta = recetaResult.rows[0];

    // 3️⃣ Verificar que está en estado "enviada"
    if (receta.estado_envio !== "enviada") {
      return NextResponse.json(
        {
          error: `No puedes responder a una receta en estado '${receta.estado_envio}'`,
        },
        { status: 400 }
      );
    }

    // 4️⃣ Iniciar transacción
    await client.query("BEGIN");

    try {
      const nuevoEstado = accion === "aceptar" ? "recibida" : "rechazada";

      // Actualizar estado de la receta
      await client.query(
        `UPDATE recetas
         SET estado_envio = $1,
             motivo_rechazo = $2
         WHERE id = $3`,
        [nuevoEstado, accion === "rechazar" ? motivo_rechazo : null, id]
      );

      // Registrar en historial
      await client.query(
        `INSERT INTO historial_envio_recetas 
        (receta_id, farmacia_id, estado_anterior, estado_nuevo, usuario_id, motivo)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          farmaciaId,
          "enviada",
          nuevoEstado,
          usuario.id,
          accion === "rechazar" ? motivo_rechazo : "Farmacia aceptó la receta",
        ]
      );

      // Si se rechazó, liberar reservas
      if (accion === "rechazar") {
        const medicamentosResult = await client.query(
          `SELECT medicamento_id, cantidad FROM receta_detalle WHERE id_receta = $1`,
          [id]
        );

        for (const med of medicamentosResult.rows) {
          await client.query(
            `UPDATE inventario_farmacia 
             SET reservas_activas = GREATEST(0, COALESCE(reservas_activas, 0) - $1)
             WHERE id_farmacia = $2 AND id_medicamento = $3`,
            [med.cantidad, farmaciaId, med.medicamento_id]
          );
        }
      }

      // Obtener datos del paciente para notificación
      const pacienteResult = await client.query(
        `SELECT p.id_usuario
         FROM citas c
         JOIN pacientes p ON c.id_paciente = p.id
         WHERE c.id = (SELECT id_cita FROM recetas WHERE id = $1)`,
        [id]
      );

      if (pacienteResult.rows.length > 0) {
        const pacienteUserId = pacienteResult.rows[0].id_usuario;

        // Crear notificación para el paciente
        const mensaje =
          accion === "aceptar"
            ? `✅ Tu receta ${receta.codigo_receta} fue aceptada por la farmacia. Será surtida pronto.`
            : `❌ Tu receta ${receta.codigo_receta} fue rechazada. Motivo: ${motivo_rechazo}`;

        await client.query(
          `INSERT INTO notificaciones 
          (id_usuario, titulo, mensaje, tipo, id_relacionado)
          VALUES ($1, $2, $3, $4, $5)`,
          [
            pacienteUserId,
            accion === "aceptar" ? "Receta Aceptada" : "Receta Rechazada",
            mensaje,
            accion === "aceptar" ? "receta" : "receta",
            id,
          ]
        );
      }

      // Commit
      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          receta: {
            id,
            codigo_receta: receta.codigo_receta,
            estado_anterior: "enviada",
            estado_nuevo: nuevoEstado,
          },
          mensaje:
            accion === "aceptar"
              ? `Receta aceptada. Paciente notificado.`
              : `Receta rechazada. Motivo: ${motivo_rechazo}`,
        },
        { status: 200 }
      );
    } catch (transactionError) {
      await client.query("ROLLBACK");
      throw transactionError;
    }
  } catch (error: any) {
    console.error("[ERROR] Responder receta:", error);
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (e) {
        // Ignorar error en ROLLBACK
      }
    }
    return NextResponse.json(
      { error: "Error al responder receta", detalle: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        // Ignorar error si ya fue liberado
      }
    }
  }
}
