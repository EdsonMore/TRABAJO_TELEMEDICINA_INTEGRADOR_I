// app/api/enfermedades/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    const usuario = await verificarToken(token);

    if (!usuario) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";
    const categoria = searchParams.get("categoria") || "";
    const capitulo = searchParams.get("capitulo") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = `
      SELECT 
        id, codigo, nombre, descripcion, categoria, capitulo
      FROM codigos_cie10 
      WHERE activo = true
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (busqueda) {
      paramCount++;
      query += ` AND (
        LOWER(nombre) LIKE LOWER($${paramCount}) OR 
        codigo LIKE $${paramCount}
      )`;
      params.push(`%${busqueda}%`);
    }

    if (categoria) {
      paramCount++;
      query += ` AND categoria = $${paramCount}`;
      params.push(categoria);
    }

    if (capitulo) {
      paramCount++;
      query += ` AND capitulo = $${paramCount}`;
      params.push(capitulo);
    }

    query += ` ORDER BY codigo LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      enfermedades: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error obteniendo enfermedades:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
