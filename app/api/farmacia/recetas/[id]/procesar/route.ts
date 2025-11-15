// app/api/farmacia/recetas/[id]/procesar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: recetaId } = await params;
    const body = await request.json();
    const { accion, medicamentos_procesados, observaciones } = body;

    // accion puede ser: "en_proceso", "dispensada", "rechazada"

    if (!accion || !["en_proceso", "dispensada", "rechazada"].includes(accion)) {
      return NextResponse.json(
        { error: "Acción no válida" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Obtener ID de la farmacia
    const farmaciaResult = await client.query(
      "SELECT id FROM farmacias WHERE id_usuario = $1",
      [usuario.id]
    );

    if (farmaciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Farmacia no encontrada" },
        { status: 404 }
      );
    }

    const farmaciaId = farmaciaResult.rows[0].id;

    // Verificar que la receta existe y pertenece a esta farmacia
    const recetaResult = await client.query(
      `SELECT r.* FROM recetas r 
       WHERE r.id = $1 AND r.id_farmacia_dispensadora = $2`,
      [recetaId, farmaciaId]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada o no pertenece a esta farmacia" },
        { status: 404 }
      );
    }

    const receta = recetaResult.rows[0];

    // Iniciar transacción
    await client.query("BEGIN");

    try {
      if (accion === "dispensada") {
        // Verificar disponibilidad de medicamentos si es necesario
        if (medicamentos_procesados && medicamentos_procesados.length > 0) {
          for (const med of medicamentos_procesados) {
            // Verificar stock
            const stockResult = await client.query(
              `SELECT stock_actual FROM inventario_farmacia 
               WHERE id_farmacia = $1 AND id_medicamento = $2 AND disponible = true`,
              [farmaciaId, med.medicamento_id]
            );

            if (stockResult.rows.length === 0 || stockResult.rows[0].stock_actual < med.cantidad) {
              throw new Error(
                `Stock insuficiente para medicamento ID ${med.medicamento_id}`
              );
            }

            // Descontar stock
            await client.query(
              `UPDATE inventario_farmacia 
               SET stock_actual = stock_actual - $1,
                   fecha_actualizacion = CURRENT_TIMESTAMP
               WHERE id_farmacia = $2 AND id_medicamento = $3`,
              [med.cantidad, farmaciaId, med.medicamento_id]
            );
          }
        }

        // Actualizar estado de la receta
        await client.query(
          `UPDATE recetas 
           SET estado = 'dispensada',
               id_farmacia_dispensadora = $1,
               fecha_dispensacion = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [farmaciaId, recetaId]
        );

        // Crear registro de auditoría
        await client.query(
          `INSERT INTO auditoria (usuario_id, accion, tabla_afectada, id_registro, datos_nuevos)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            usuario.id,
            "DISPENSAR_RECETA",
            "recetas",
            recetaId,
            JSON.stringify({
              estado_anterior: receta.estado,
              estado_nuevo: "dispensada",
              medicamentos_procesados,
              fecha_dispensacion: new Date().toISOString(),
            }),
          ]
        );
      } else if (accion === "en_proceso") {
        // Cambiar estado a en_proceso
        await client.query(
          `UPDATE recetas 
           SET estado = 'en_proceso'
           WHERE id = $1`,
          [recetaId]
        );

        await client.query(
          `INSERT INTO auditoria (usuario_id, accion, tabla_afectada, id_registro, datos_nuevos)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            usuario.id,
            "PROCESAR_RECETA",
            "recetas",
            recetaId,
            JSON.stringify({
              estado_anterior: receta.estado,
              estado_nuevo: "en_proceso",
              observaciones,
            }),
          ]
        );
      } else if (accion === "rechazada") {
        // Cambiar estado a cancelada (rechazada)
        await client.query(
          `UPDATE recetas 
           SET estado = 'cancelada'
           WHERE id = $1`,
          [recetaId]
        );

        await client.query(
          `INSERT INTO auditoria (usuario_id, accion, tabla_afectada, id_registro, datos_nuevos)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            usuario.id,
            "RECHAZAR_RECETA",
            "recetas",
            recetaId,
            JSON.stringify({
              estado_anterior: receta.estado,
              estado_nuevo: "cancelada",
              motivo: observaciones,
            }),
          ]
        );
      }

      await client.query("COMMIT");

      // Obtener receta actualizada
      const recetaActualizada = await client.query(
        `SELECT r.*, 
          (SELECT json_agg(json_build_object(
            'medicamento_id', rd.medicamento_id,
            'nombre_comercial', m.nombre_comercial,
            'cantidad', rd.cantidad,
            'dosis', rd.dosis,
            'frecuencia', rd.frecuencia,
            'via_administracion', rd.via_administracion
          )) FROM receta_detalle rd 
           JOIN medicamentos m ON rd.medicamento_id = m.id 
           WHERE rd.id_receta = r.id) as medicamentos
         FROM recetas r
         WHERE r.id = $1`,
        [recetaId]
      );

      return NextResponse.json({
        success: true,
        receta: recetaActualizada.rows[0],
        message: `Receta ${accion === "dispensada" ? "dispensada" : accion === "en_proceso" ? "en proceso" : "rechazada"} correctamente`,
      });
    } catch (innerError: any) {
      await client.query("ROLLBACK");
      throw innerError;
    }
  } catch (error: any) {
    console.error("Error procesando receta:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
