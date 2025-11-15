// app/api/recetas/[id]/enviar-farmacia/route.ts
// MediLink+ - API para enviar receta a farmacia seleccionada
// Registra la selección del paciente y notifica a la farmacia

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(
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
    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json(
        { error: "Acceso denegado. Solo pacientes" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { farmacia_id } = await request.json();

    if (!farmacia_id) {
      return NextResponse.json(
        { error: "farmacia_id es requerido" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // 1️⃣ Verificar que la receta pertenece al paciente
    const recetaResult = await client.query(
      `SELECT r.id, r.codigo_receta, r.estado, r.estado_envio,
              r.farmacia_seleccionada_id, c.id_paciente,
              p.id_usuario
       FROM recetas r
       JOIN citas c ON r.id_cita = c.id
       JOIN pacientes p ON c.id_paciente = p.id
       WHERE r.id = $1`,
      [id]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const receta = recetaResult.rows[0];

    // Verificar que es el paciente correcto
    if (receta.id_usuario !== usuario.id) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar esta receta" },
        { status: 403 }
      );
    }

    // Verificar que la receta está activa
    if (receta.estado !== "activa") {
      return NextResponse.json(
        {
          error: "La receta no está activa",
          estado_actual: receta.estado,
        },
        { status: 400 }
      );
    }

    // 2️⃣ Verificar que la farmacia existe
    const farmaciaResult = await client.query(
      `SELECT id, nombre_comercial FROM farmacias WHERE id = $1`,
      [farmacia_id]
    );

    if (farmaciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Farmacia no encontrada" },
        { status: 404 }
      );
    }

    const farmacia = farmaciaResult.rows[0];

    // 3️⃣ Verificar disponibilidad de medicamentos en la farmacia
    const medicamentosResult = await client.query(
      `SELECT rd.medicamento_id, rd.cantidad, m.nombre_comercial
       FROM receta_detalle rd
       JOIN medicamentos m ON rd.medicamento_id = m.id
       WHERE rd.id_receta = $1`,
      [id]
    );

    const medicamentos = medicamentosResult.rows;
    const medicamentosNoDisponibles = [];

    for (const med of medicamentos) {
      const disponibilidadResult = await client.query(
        `SELECT (stock_actual - COALESCE(reservas_activas, 0)) as stock_disponible
         FROM inventario_farmacia
         WHERE id_farmacia = $1 
         AND id_medicamento = $2 
         AND disponible = true`,
        [farmacia_id, med.medicamento_id]
      );

      if (
        disponibilidadResult.rows.length === 0 ||
        disponibilidadResult.rows[0].stock_disponible < med.cantidad
      ) {
        medicamentosNoDisponibles.push(med.nombre_comercial);
      }
    }

    // 4️⃣ Iniciar transacción
    await client.query("BEGIN");

    try {
      // Actualizar receta con la farmacia seleccionada
      const updateResult = await client.query(
        `UPDATE recetas 
         SET farmacia_seleccionada_id = $1,
             estado_envio = 'enviada',
             fecha_envio_farmacia = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [farmacia_id, id]
      );

      const recetaActualizada = updateResult.rows[0];

      // 5️⃣ Registrar cambio en historial
      await client.query(
        `INSERT INTO historial_envio_recetas 
        (receta_id, farmacia_id, estado_anterior, estado_nuevo, usuario_id, motivo)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          farmacia_id,
          receta.estado_envio,
          "enviada",
          usuario.id,
          "Paciente seleccionó esta farmacia",
        ]
      );

      // 6️⃣ Crear notificación para la farmacia
      const farmaciasUsuariosResult = await client.query(
        `SELECT id_usuario FROM farmacias WHERE id = $1`,
        [farmacia_id]
      );

      if (farmaciasUsuariosResult.rows.length > 0) {
        const farmaciaUserId = farmaciasUsuariosResult.rows[0].id_usuario;

        await client.query(
          `INSERT INTO notificaciones 
          (usuario_id, titulo, mensaje, tipo, entidad_relacionada, id_entidad)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            farmaciaUserId,
            "Nueva Receta Recibida",
            `Receta ${receta.codigo_receta} enviada por paciente. ${
              medicamentosNoDisponibles.length > 0
                ? `Faltantes: ${medicamentosNoDisponibles.join(", ")}`
                : "Todos los medicamentos disponibles ✓"
            }`,
            "receta_nueva",
            "receta",
            id,
          ]
        );
      }

      // 7️⃣ Crear notificación para el paciente
      await client.query(
        `INSERT INTO notificaciones 
        (usuario_id, titulo, mensaje, tipo, entidad_relacionada, id_entidad)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          usuario.id,
          "Receta Enviada a Farmacia",
          `Tu receta ${receta.codigo_receta} fue enviada a ${farmacia.nombre_comercial}. Te notificaremos cuando esté lista.`,
          "receta_enviada",
          "receta",
          id,
        ]
      );

      // 8️⃣ Reservar stock (actualizar reservas_activas)
      for (const med of medicamentos) {
        await client.query(
          `UPDATE inventario_farmacia 
           SET reservas_activas = COALESCE(reservas_activas, 0) + $1
           WHERE id_farmacia = $2 
           AND id_medicamento = $3`,
          [med.cantidad, farmacia_id, med.medicamento_id]
        );
      }

      // Commit de la transacción
      await client.query("COMMIT");

      client.release();

      return NextResponse.json(
        {
          success: true,
          receta: {
            id: recetaActualizada.id,
            codigo_receta: recetaActualizada.codigo_receta,
            estado_envio: recetaActualizada.estado_envio,
            fecha_envio: recetaActualizada.fecha_envio_farmacia,
          },
          farmacia: {
            id: farmacia.id,
            nombre: farmacia.nombre_comercial,
          },
          avisos: {
            medicamentos_no_disponibles: medicamentosNoDisponibles,
            cantidad_faltantes: medicamentosNoDisponibles.length,
          },
          mensaje: `Receta enviada exitosamente a ${farmacia.nombre_comercial}. ${
            medicamentosNoDisponibles.length > 0
              ? `⚠️ ${medicamentosNoDisponibles.length} medicamento(s) no disponible(s). La farmacia podría contactarte.`
              : "✅ La farmacia tiene todos los medicamentos disponibles."
          }`,
        },
        { status: 200 }
      );
    } catch (transactionError) {
      await client.query("ROLLBACK");
      throw transactionError;
    }
  } catch (error: any) {
    console.error("[ERROR] Enviar receta a farmacia:", error);
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (e) {
        // Ignorar errores de rollback
      }
    }
    return NextResponse.json(
      { error: "Error al enviar receta", detalle: error.message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

// GET: Obtener estado del envío
export async function GET(
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
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { id } = await params;

    client = await pool.connect();

    const result = await client.query(
      `SELECT 
        r.id,
        r.codigo_receta,
        r.estado_envio,
        r.fecha_envio_farmacia,
        f.nombre_comercial as farmacia_nombre,
        f.id as farmacia_id,
        (SELECT COUNT(*) FROM historial_envio_recetas WHERE receta_id = r.id) as cambios_totales
       FROM recetas r
       LEFT JOIN farmacias f ON r.farmacia_seleccionada_id = f.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    client.release();

    return NextResponse.json({
      success: true,
      envio: result.rows[0],
    });
  } catch (error: any) {
    console.error("[ERROR] Obtener estado envío:", error);
    return NextResponse.json(
      { error: "Error al obtener estado", detalle: error.message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
