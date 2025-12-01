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
       WHERE r.id = $1 AND r.farmacia_seleccionada_id = $2`,
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
      // 🔄 SINCRONIZACIÓN: Determinar estados según acción
      // IMPORTANTE: estado_envio solo acepta: 'no_enviada', 'enviada', 'recibida', 'rechazada', 'dispensada'
      
      if (accion === "dispensada") {
        // Verificar disponibilidad de medicamentos si es necesario
        if (medicamentos_procesados && medicamentos_procesados.length > 0) {
          for (const med of medicamentos_procesados) {
            // Verificar stock
            const stockResult = await client.query(
              `SELECT COALESCE(stock_actual, 0) as stock_actual FROM inventario_farmacia 
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
               SET stock_actual = GREATEST(0, COALESCE(stock_actual, 0) - $1),
                   fecha_actualizacion = CURRENT_TIMESTAMP
               WHERE id_farmacia = $2 AND id_medicamento = $3`,
              [med.cantidad, farmaciaId, med.medicamento_id]
            );
          }
        }

        // Actualizar estado de la receta: cambiar a dispensada
        await client.query(
          `UPDATE recetas 
           SET estado = 'dispensada',
               estado_envio = 'dispensada',
               id_farmacia_dispensadora = $1,
               fecha_dispensacion = CURRENT_TIMESTAMP,
               fecha_finalizacion_preparacion = CURRENT_TIMESTAMP
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
              estado_envio_nuevo: "dispensada",
              medicamentos_procesados,
              fecha_dispensacion: new Date().toISOString(),
            }),
          ]
        );
      } else if (accion === "en_proceso") {
        // Cambiar estado a en_proceso: SOLO actualizar estado, mantener estado_envio = 'recibida'
        await client.query(
          `UPDATE recetas 
           SET estado = 'en_proceso',
               fecha_inicio_preparacion = CURRENT_TIMESTAMP
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
              estado_envio_actual: "recibida",
              observaciones,
            }),
          ]
        );
      } else if (accion === "rechazada") {
        // Cambiar estado a cancelada y estado_envio a rechazada
        await client.query(
          `UPDATE recetas 
           SET estado = 'cancelada',
               estado_envio = 'rechazada',
               motivo_rechazo = $1
           WHERE id = $2`,
          [observaciones, recetaId]
        );

        // Si se rechaza en en_proceso, devolver los medicamentos que se despacharon
        if (receta.estado === "en_proceso" && medicamentos_procesados && medicamentos_procesados.length > 0) {
          for (const med of medicamentos_procesados) {
            await client.query(
              `UPDATE inventario_farmacia 
               SET stock_actual = GREATEST(0, COALESCE(stock_actual, 0) + $1),
                   fecha_actualizacion = CURRENT_TIMESTAMP
               WHERE id_farmacia = $2 AND id_medicamento = $3`,
              [med.cantidad_dispensada, farmaciaId, med.medicamento_id]
            );
          }
        }

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
              estado_envio_nuevo: "rechazada",
              motivo: observaciones,
            }),
          ]
        );
      }

      // 📢 NOTIFICACIÓN AL PACIENTE
      // Obtener datos del paciente y tipo de entrega
      const pacienteResult = await client.query(
        `SELECT p.id_usuario, r.tipo_entrega, r.codigo_receta
         FROM citas c
         JOIN pacientes p ON c.id_paciente = p.id
         JOIN recetas r ON r.id_cita = c.id
         WHERE r.id = $1`,
        [recetaId]
      );

      if (pacienteResult.rows.length > 0) {
        const { id_usuario: pacienteUserId, tipo_entrega, codigo_receta } = pacienteResult.rows[0];

        // Crear mensajes personalizados según acción y tipo de entrega
        const mensajes: Record<string, string> = {
          en_proceso: `🔄 Tu receta ${codigo_receta} está siendo preparada por la farmacia`,
          dispensada: tipo_entrega === "domicilio"
            ? `🚚 Tu receta ${codigo_receta} está en camino a tu domicilio`
            : `✅ Tu receta ${codigo_receta} está lista para retiro en farmacia`,
          rechazada: `❌ Tu receta ${codigo_receta} fue rechazada. ${observaciones || "Consulta con la farmacia para más detalles"}`,
        };

        const titulos: Record<string, string> = {
          en_proceso: "Receta en Preparación",
          dispensada: tipo_entrega === "domicilio" ? "Receta en Camino" : "Receta Lista",
          rechazada: "Receta Rechazada",
        };

        await client.query(
          `INSERT INTO notificaciones 
           (id_usuario, titulo, mensaje, tipo, id_relacionado)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            pacienteUserId,
            titulos[accion],
            mensajes[accion],
            "receta",
            recetaId,
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
