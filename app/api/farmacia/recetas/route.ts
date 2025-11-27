// app/api/farmacia/recetas/route.ts - NUEVA API
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

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

    let query = `
      SELECT 
        r.id,
        r.codigo_receta,
        r.fecha_emision,
        r.fecha_vencimiento,
        r.estado,
        r.estado_envio,
        r.diagnostico_principal_texto,
        r.observaciones,
        -- Información del paciente
        p.id as paciente_id,
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        p.dni as paciente_dni,
        EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) as paciente_edad,
        p.sexo as paciente_sexo,
        -- Información del médico
        um.nombre as medico_nombre,
        um.apellido as medico_apellido,
        m.numero_colegiatura,
        e.nombre as especialidad,
        -- Contar medicamentos
        COUNT(rd.id) as total_medicamentos,
        -- Verificar stock disponible
        COUNT(CASE WHEN inv.stock_actual >= rd.cantidad THEN 1 END) as medicamentos_con_stock
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios up ON p.id_usuario = up.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios um ON m.id_usuario = um.id
      JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
      LEFT JOIN inventario_farmacia inv ON (
        rd.medicamento_id = inv.id_medicamento 
        AND inv.id_farmacia = $1 
        AND inv.disponible = true
      )
      WHERE r.farmacia_seleccionada_id = $1
        AND r.estado_envio = 'recibida'
    `;

    const params: any[] = [farmaciaId];
    let paramCount = 1;

    // Filtrar por estado específico
    if (estado === "pendientes") {
      query += ` AND r.estado = 'activa'`;
    } else if (estado === "en_proceso") {
      query += ` AND r.estado = 'en_proceso'`;
    } else if (estado === "dispensadas") {
      query += ` AND r.estado = 'dispensada'`;
    }

    query += ` GROUP BY r.id, r.codigo_receta, r.fecha_emision, r.fecha_vencimiento, r.estado, r.estado_envio,
                 r.diagnostico_principal_texto, r.observaciones,
                 p.id, up.nombre, up.apellido, p.dni, p.fecha_nacimiento, p.sexo,
                 um.nombre, um.apellido, m.numero_colegiatura, e.nombre
               ORDER BY 
                 CASE 
                   WHEN r.estado = 'activa' THEN 1
                   WHEN r.estado = 'en_proceso' THEN 2
                   ELSE 3
                 END,
                 r.fecha_emision DESC
               LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;

    params.push(limit, offset);

    const result = await client.query(query, params);
    
    // Contar el total de recetas (sin LIMIT/OFFSET)
    let countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM recetas r
      WHERE r.farmacia_seleccionada_id = $1
        AND r.estado_envio = 'recibida'
    `;
    
    const countParams: any[] = [farmaciaId];
    
    if (estado === "pendientes") {
      countQuery += ` AND r.estado = 'activa'`;
    } else if (estado === "en_proceso") {
      countQuery += ` AND r.estado = 'en_proceso'`;
    } else if (estado === "dispensadas") {
      countQuery += ` AND r.estado = 'dispensada'`;
    }
    
    const countResult = await client.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(totalCount / limit);

    const recetas = result.rows.map((row) => {
      // Determinar estado visual para la farmacia
      let estadoVisual = row.estado;
      if (row.estado === "activa") {
        estadoVisual = "pendiente";
      }

      return {
        ...row,
        estado: estadoVisual,
        tiene_stock_completo:
          row.medicamentos_con_stock === row.total_medicamentos,
        medicamentos: [], // Inicializar array vacío, será llenado después
      };
    });

    // Obtener medicamentos para cada receta
    for (const receta of recetas) {
      const medicamentosResult = await client.query(
        `SELECT 
          rd.id,
          rd.medicamento_id,
          rd.cantidad as cantidad_requerida,
          rd.dosis,
          rd.frecuencia,
          rd.duracion_dias,
          rd.via_administracion,
          m.nombre_comercial,
          m.nombre_generico,
          inv.stock_actual as stock_disponible,
          inv.precio_venta as precio_unitario,
          inv.fecha_vencimiento,
          CASE 
            WHEN inv.id IS NULL THEN false
            WHEN inv.stock_actual >= rd.cantidad THEN true
            ELSE false
          END as disponible
         FROM receta_detalle rd
         JOIN medicamentos m ON rd.medicamento_id = m.id
         LEFT JOIN inventario_farmacia inv ON (
           rd.medicamento_id = inv.id_medicamento 
           AND inv.id_farmacia = $1
         )
         WHERE rd.id_receta = $2
         ORDER BY m.nombre_comercial`,
        [farmaciaId, receta.id]
      );

      receta.medicamentos = medicamentosResult.rows.map((med: any) => ({
        id: med.id,
        medicamento_id: med.medicamento_id,
        nombre_comercial: med.nombre_comercial,
        nombre_generico: med.nombre_generico,
        cantidad_requerida: med.cantidad_requerida,
        dosis: med.dosis,
        frecuencia: med.frecuencia,
        duracion_dias: med.duracion_dias,
        via_administracion: med.via_administracion,
        stock_disponible: med.stock_disponible || 0,
        precio_unitario: med.precio_unitario || 0,
        fecha_vencimiento: med.fecha_vencimiento,
        disponible: med.disponible,
      }));
    }

    return NextResponse.json({
      success: true,
      recetas,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error obteniendo recetas para farmacia:", error);
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
