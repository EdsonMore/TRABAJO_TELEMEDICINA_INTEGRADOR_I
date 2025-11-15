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
        COUNT(CASE WHEN inv.stock_actual >= rd.cantidad THEN 1 END) as medicamentos_con_stock,
        COUNT(*) OVER() as total_count
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
      WHERE r.estado IN ('activa', 'pendiente', 'en_proceso')
    `;

    const params: any[] = [farmaciaId];
    let paramCount = 1;

    // Filtrar por estado específico
    if (estado === "pendientes") {
      paramCount++;
      query += ` AND r.estado = 'activa'`;
    } else if (estado === "en_proceso") {
      paramCount++;
      query += ` AND r.estado = 'en_proceso'`;
    } else if (estado === "dispensadas") {
      paramCount++;
      query += ` AND r.estado = 'dispensada'`;
    }

    query += ` GROUP BY r.id, p.id, up.id, m.id, um.id, e.id
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
    const totalCount = result.rows[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const recetas = result.rows.map((row) => {
      const { total_count, ...receta } = row;

      // Determinar estado visual para la farmacia
      let estadoVisual = receta.estado;
      if (receta.estado === "activa") {
        estadoVisual = "pendiente";
      }

      return {
        ...receta,
        estado: estadoVisual,
        tiene_stock_completo:
          receta.medicamentos_con_stock === receta.total_medicamentos,
      };
    });

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
