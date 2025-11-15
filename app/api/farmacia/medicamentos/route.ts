// app/api/farmacia/medicamentos/route.ts
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
    const categoria = searchParams.get("categoria");
    const busqueda = searchParams.get("busqueda") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    client = await pool.connect();

    let query = `
      SELECT 
        m.id,
        m.codigo_digemid,
        m.nombre_comercial,
        m.nombre_generico,
        m.forma_farmaceutica,
        m.concentracion,
        m.laboratorio,
        m.principio_activo,
        m.categoria_terapeutica,
        m.requiere_receta,
        m.contraindicaciones,
        m.efectos_secundarios,
        m.almacenamiento,
        COUNT(*) OVER() as total_count
      FROM medicamentos m
      WHERE m.activo = true
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (busqueda) {
      paramCount++;
      query += ` AND (
        LOWER(m.nombre_comercial) LIKE LOWER($${paramCount})
        OR LOWER(m.nombre_generico) LIKE LOWER($${paramCount})
        OR LOWER(m.codigo_digemid) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${busqueda}%`);
    }

    if (categoria) {
      paramCount++;
      query += ` AND m.categoria_terapeutica = $${paramCount}`;
      params.push(categoria);
    }

    query += ` ORDER BY m.nombre_comercial ASC
               LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;

    params.push(limit, offset);

    const result = await client.query(query, params);
    const totalCount = result.rows[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      medicamentos: result.rows,
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
    console.error("Error obteniendo medicamentos:", error);
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
