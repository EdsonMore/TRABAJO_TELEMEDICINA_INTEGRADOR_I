// app/api/recetas/medico/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "medico") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    client = await pool.connect();

    // Obtener ID del médico
    const medicoResult = await client.query(
      "SELECT id FROM medicos WHERE id_usuario = $1",
      [usuario.id]
    );

    if (medicoResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Médico no encontrado" },
        { status: 404 }
      );
    }

    const medicoId = medicoResult.rows[0].id;

    let query = `
      SELECT 
        r.id,
        r.codigo_receta,
        r.fecha_emision,
        r.fecha_vencimiento,
        r.estado,
        r.diagnostico_principal_texto,
        -- Información del paciente
        p.id as paciente_id,
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        p.dni,
        -- Contar medicamentos
        COUNT(rd.id) as total_medicamentos,
        COUNT(*) OVER() as total_count
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios up ON p.id_usuario = up.id
      LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
      WHERE c.id_medico = $1
    `;

    const params: any[] = [medicoId];
    let paramCount = 1;

    // Filtrar por estado
    const estadosValidos = ["activa", "dispensada", "vencida", "cancelada"];
    if (estado && estadosValidos.includes(estado)) {
      paramCount++;
      query += ` AND r.estado = $${paramCount}`;
      params.push(estado);
    }

    query += ` GROUP BY r.id, p.id, up.nombre, up.apellido, p.dni
               ORDER BY r.fecha_emision DESC
               LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;

    params.push(limit, offset);

    const result = await client.query(query, params);
    const totalCount = result.rows[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      recetas: result.rows.map((row) => {
        const { total_count, ...receta } = row;
        return receta;
      }),
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
    console.error("Error obteniendo recetas médicas:", error);
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
