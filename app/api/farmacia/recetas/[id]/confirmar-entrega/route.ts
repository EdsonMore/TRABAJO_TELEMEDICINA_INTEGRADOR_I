import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(
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
    if (!usuario) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id: recetaId } = await params;
    const body = await request.json();
    const { rol } = body;

    if (!rol || !["farmacia", "paciente"].includes(rol)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    if (usuario.rol !== rol) {
      return NextResponse.json(
        { error: "El rol del token no coincide con el rol enviado" },
        { status: 403 }
      );
    }

    client = await pool.connect();

    await client.query(`
      ALTER TABLE recetas ADD COLUMN IF NOT EXISTS fecha_confirmacion_envio TIMESTAMP;
      ALTER TABLE recetas ADD COLUMN IF NOT EXISTS fecha_confirmacion_recepcion TIMESTAMP;
    `);

    const recetaResult = await client.query(
      `SELECT r.*, r.tipo_entrega, r.estado, r.estado_envio, r.codigo_receta,
        c.id_paciente,
        p.id_usuario as paciente_user_id
       FROM recetas r
       JOIN citas c ON r.id_cita = c.id
       JOIN pacientes p ON c.id_paciente = p.id
       WHERE r.id = $1`,
      [recetaId]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
    }

    const receta = recetaResult.rows[0];

    if (receta.tipo_entrega !== "domicilio") {
      return NextResponse.json(
        { error: "Solo recetas con entrega a domicilio pueden confirmarse" },
        { status: 400 }
      );
    }

    if (receta.estado !== "dispensada" && receta.estado_envio !== "dispensada") {
      return NextResponse.json(
        { error: "La receta debe estar dispensada antes de confirmar la entrega" },
        { status: 400 }
      );
    }

    if (rol === "farmacia") {
      if (receta.fecha_confirmacion_envio) {
        return NextResponse.json(
          { error: "La farmacia ya confirmó el envío de esta receta" },
          { status: 409 }
        );
      }

      const farmaciaResult = await client.query(
        "SELECT id, nombre_comercial FROM farmacias WHERE id_usuario = $1",
        [usuario.userId]
      );

      if (farmaciaResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Farmacia no encontrada" },
          { status: 404 }
        );
      }

      const farmaciaId = farmaciaResult.rows[0].id;

      if (receta.farmacia_seleccionada_id !== farmaciaId) {
        return NextResponse.json(
          { error: "Esta receta no pertenece a tu farmacia" },
          { status: 403 }
        );
      }

      await client.query("BEGIN");
      try {
        await client.query(
          `UPDATE recetas SET fecha_confirmacion_envio = CURRENT_TIMESTAMP WHERE id = $1`,
          [recetaId]
        );

        await client.query(
          `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            receta.paciente_user_id,
            "🚚 Receta en Camino",
            `Tu receta ${receta.codigo_receta} ha sido enviada a tu domicilio. Prepara S/ ${Number(receta.costo_entrega || 15).toFixed(2)} para el pago de envío.`,
            "receta",
            recetaId,
          ]
        );

        await client.query(
          `INSERT INTO auditoria (usuario_id, accion, tabla_afectada, id_registro, datos_nuevos)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            usuario.id,
            "CONFIRMAR_ENVIO_DOMICILIO",
            "recetas",
            recetaId,
            JSON.stringify({
              accion: "farmacia_confirma_envio",
              codigo_receta: receta.codigo_receta,
            }),
          ]
        );

        await client.query("COMMIT");

        return NextResponse.json({
          success: true,
          message: "Envío a domicilio confirmado. Paciente notificado.",
        });
      } catch (innerError: any) {
        await client.query("ROLLBACK");
        throw innerError;
      }
    }

    if (rol === "paciente") {
      if (receta.fecha_confirmacion_recepcion) {
        return NextResponse.json(
          { error: "Ya confirmaste la recepción de esta receta" },
          { status: 409 }
        );
      }

      if (!receta.fecha_confirmacion_envio) {
        return NextResponse.json(
          { error: "La farmacia aún no ha confirmado el envío" },
          { status: 400 }
        );
      }

      const pacienteUserId = receta.paciente_user_id;
      if (pacienteUserId !== usuario.userId) {
        return NextResponse.json(
          { error: "Esta receta no te pertenece" },
          { status: 403 }
        );
      }

      await client.query("BEGIN");
      try {
        await client.query(
          `UPDATE recetas SET fecha_confirmacion_recepcion = CURRENT_TIMESTAMP WHERE id = $1`,
          [recetaId]
        );

        const farmaciaInfo = await client.query(
          `SELECT f.id_usuario FROM farmacias f WHERE f.id = $1`,
          [receta.farmacia_seleccionada_id]
        );

        if (farmaciaInfo.rows.length > 0) {
          await client.query(
            `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              farmaciaInfo.rows[0].id_usuario,
              "✅ Receta Entregada",
              `El paciente confirmó la recepción de la receta ${receta.codigo_receta}. Pedido completado.`,
              "receta",
              recetaId,
            ]
          );
        }

        await client.query(
          `INSERT INTO auditoria (usuario_id, accion, tabla_afectada, id_registro, datos_nuevos)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            usuario.id,
            "CONFIRMAR_RECEPCION_DOMICILIO",
            "recetas",
            recetaId,
            JSON.stringify({
              accion: "paciente_confirma_recepcion",
              codigo_receta: receta.codigo_receta,
            }),
          ]
        );

        await client.query("COMMIT");

        return NextResponse.json({
          success: true,
          message: "Recepción confirmada. ¡Gracias por tu compra!",
        });
      } catch (innerError: any) {
        await client.query("ROLLBACK");
        throw innerError;
      }
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error confirmando entrega:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
