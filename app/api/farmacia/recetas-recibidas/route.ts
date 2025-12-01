// app/api/farmacia/recetas-recibidas/route.ts
// MediLink+ - API de recetas recibidas por la farmacia
// Retorna recetas que los pacientes han enviado a esta farmacia

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let client;
  try {
    // Verificar token y rol
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

    const { searchParams } = new URL(request.url);
    const filtroEstado = searchParams.get("estado") || "enviada"; // enviada, recibida, rechazada, dispensada
    const busqueda = searchParams.get("busqueda");
    const pagina = parseInt(searchParams.get("pagina") || "1");
    const limite = 20;
    const offset = (pagina - 1) * limite;

    console.log("[DEBUG] Parámetros recibidos:", { filtroEstado, busqueda, pagina, farmaciaId: "..." });

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
    console.log("[DEBUG] Farmacia ID:", farmaciaId);

    // 2️⃣ Construir query base - CRÍTICO: DEBE FILTRAR POR estado_envio
    let query = `
      SELECT
        r.id,
        r.codigo_receta,
        r.estado_envio,
        r.fecha_envio_farmacia,
        r.motivo_rechazo,
        c.id_paciente,
        p.id_usuario as paciente_usuario_id,
        u_paciente.nombre as paciente_nombre,
        u_paciente.apellido as paciente_apellido,
        u_paciente.email as paciente_email,
        u_paciente.telefono as paciente_telefono,
        c.id_medico,
        u_medico.nombre as medico_nombre,
        u_medico.apellido as medico_apellido,
        r.fecha_emision,
        r.fecha_vencimiento
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios u_medico ON m.id_usuario = u_medico.id
      WHERE r.farmacia_seleccionada_id = $1
        AND (r.estado_envio = $2 OR (r.estado_envio IS NULL AND $2 = 'enviada'))
    `;

    const params: any[] = [farmaciaId, filtroEstado];

    // Búsqueda por código o paciente
    if (busqueda) {
      query += ` AND (r.codigo_receta ILIKE $${params.length + 1} 
                    OR u_paciente.nombre ILIKE $${params.length + 1}
                    OR u_paciente.apellido ILIKE $${params.length + 1}
                    OR u_paciente.email ILIKE $${params.length + 1})`;
      params.push(`%${busqueda}%`);
    }

    query += ` ORDER BY r.fecha_envio_farmacia DESC NULLS LAST
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limite, offset);

    console.log("[DEBUG] Query ejecutada:", query);
    console.log("[DEBUG] Parámetros de query:", params);

    const result = await client.query(query, params);
    
    console.log("[DEBUG] Recetas encontradas:", result.rows.length);
    console.log("[DEBUG] Primera receta (debug):", result.rows[0]);

    const recetas = [];
    for (const receta of result.rows) {
      const medicamentosResult = await client.query(
        `SELECT 
          rd.id,
          rd.medicamento_id,
          rd.cantidad,
          rd.dosis,
          rd.frecuencia,
          rd.duracion_dias,
          rd.via_administracion,
          m.nombre_comercial,
          m.nombre_generico,
          inv.stock_actual,
          inv.reservas_activas,
          inv.precio_venta,
          inv.fecha_vencimiento,
          CASE 
            WHEN inv.id IS NULL THEN 'sin-stock'
            WHEN (inv.stock_actual - COALESCE(inv.reservas_activas, 0)) < rd.cantidad THEN 'stock-insuficiente'
            WHEN inv.fecha_vencimiento <= CURRENT_DATE THEN 'vencido'
            WHEN inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'por-vencer'
            ELSE 'disponible'
          END as estado_disponibilidad
         FROM receta_detalle rd
         JOIN medicamentos m ON rd.medicamento_id = m.id
         LEFT JOIN inventario_farmacia inv ON rd.medicamento_id = inv.id_medicamento 
           AND inv.id_farmacia = $1
         WHERE rd.id_receta = $2
         ORDER BY m.nombre_comercial`,
        [farmaciaId, receta.id]
      );

      // DEDUPLICAR MEDICAMENTOS por medicamento_id
      const medicamentosUnicos = medicamentosResult.rows.reduce((unique: any[], med: any) => {
        const existe = unique.some((u: any) => u.medicamento_id === med.medicamento_id);
        if (!existe) {
          unique.push(med);
        }
        return unique;
      }, []);

      const medicamentosNoDisponibles = medicamentosUnicos.filter(
        (m: any) => m.estado_disponibilidad !== "disponible"
      );

      recetas.push({
        id: receta.id,
        codigo_receta: receta.codigo_receta,
        estado_envio: receta.estado_envio,
        fecha_envio: receta.fecha_envio_farmacia,
        fecha_emision: receta.fecha_emision,
        fecha_vencimiento: receta.fecha_vencimiento,
        motivo_rechazo: receta.motivo_rechazo,
        paciente: {
          id: receta.id_paciente,
          nombre: receta.paciente_nombre,
          apellido: receta.paciente_apellido,
          email: receta.paciente_email,
          telefono: receta.paciente_telefono,
        },
        medico: {
          nombre: receta.medico_nombre,
          apellido: receta.medico_apellido,
        },
        medicamentos: medicamentosUnicos.map((med: any) => ({
          id: med.id,
          medicamento_id: med.medicamento_id,
          nombre_comercial: med.nombre_comercial,
          nombre_generico: med.nombre_generico,
          cantidad_requerida: med.cantidad,
          dosis: med.dosis,
          frecuencia: med.frecuencia,
          duracion_dias: med.duracion_dias,
          via_administracion: med.via_administracion,
          stock_disponible: med.stock_actual
            ? med.stock_actual - (med.reservas_activas || 0)
            : 0,
          precio_unitario: med.precio_venta,
          subtotal: med.precio_venta ? med.precio_venta * med.cantidad : null,
          fecha_vencimiento: med.fecha_vencimiento,
          estado_disponibilidad: med.estado_disponibilidad,
        })),
        medicamentos_totales: medicamentosUnicos.length,
        medicamentos_disponibles: medicamentosUnicos.filter(
          (m: any) => m.estado_disponibilidad === "disponible"
        ).length,
        medicamentos_no_disponibles: medicamentosNoDisponibles.length,
        precio_estimado: medicamentosUnicos.reduce(
          (total, med: any) => total + (med.precio_venta ? med.precio_venta * med.cantidad : 0),
          0
        ),
        disponibilidad_completa: medicamentosNoDisponibles.length === 0,
      });
    }

    // 4️⃣ Obtener conteo total sin límite
    let countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
      WHERE r.farmacia_seleccionada_id = $1
    `;
    const countParams: any[] = [farmaciaId];

    if (filtroEstado && filtroEstado !== "todas") {
      countQuery += ` AND r.estado_envio = $${countParams.length + 1}`;
      countParams.push(filtroEstado);
    }

    if (busqueda) {
      countQuery += ` AND (r.codigo_receta ILIKE $${countParams.length + 1} 
                          OR u_paciente.nombre ILIKE $${countParams.length + 1}
                          OR u_paciente.apellido ILIKE $${countParams.length + 1}
                          OR u_paciente.email ILIKE $${countParams.length + 1})`;
      countParams.push(`%${busqueda}%`);
    }

    const countResult = await client.query(countQuery, countParams);
    const totalRecetas = countResult.rows[0].total;

    console.log("[DEBUG] Total recetas encontradas (sin límite):", totalRecetas);

    // 5️⃣ Estadísticas por estado
    const estadisticasResult = await client.query(
      `SELECT 
        COALESCE(r.estado_envio, 'no_enviada') as estado_envio,
        COUNT(*) as cantidad
       FROM recetas r
       WHERE r.farmacia_seleccionada_id = $1
       GROUP BY r.estado_envio`,
      [farmaciaId]
    );

    console.log("[DEBUG] Estadísticas crudas de BD:", estadisticasResult.rows);

    const estadisticas = estadisticasResult.rows.reduce(
      (acc: any, row: any) => {
        acc[row.estado_envio] = row.cantidad;
        return acc;
      },
      {}
    );

    return NextResponse.json(
      {
        success: true,
        recetas,
        paginacion: {
          pagina,
          limite,
          total: totalRecetas,
          paginas_totales: Math.ceil(totalRecetas / limite),
        },
        estadisticas: {
          enviadas: estadisticas.enviada || 0,
          recibidas: estadisticas.recibida || 0,
          rechazadas: estadisticas.rechazada || 0,
          dispensadas: estadisticas.dispensada || 0,
          total: Object.values(estadisticas).reduce((a: any, b: any) => a + b, 0),
        },
        filtros_aplicados: {
          estado: filtroEstado,
          busqueda: busqueda || null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[ERROR] Recetas recibidas:", error);
    return NextResponse.json(
      { error: "Error al obtener recetas recibidas", detalle: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        // Ignorar si ya fue liberado
      }
    }
  }
}
