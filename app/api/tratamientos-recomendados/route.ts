// app/api/tratamientos-recomendados/route.ts
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
    const cie10Id = searchParams.get("cie10_id");

    if (!cie10Id) {
      return NextResponse.json(
        { error: "ID de código CIE-10 requerido" },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        tr.*,
        m.nombre_comercial,
        m.nombre_generico,
        m.forma_farmaceutica,
        m.concentracion
      FROM tratamientos_recomendados tr
      JOIN medicamentos m ON tr.medicamento_id = m.id
      WHERE tr.codigo_cie10_id = $1 AND tr.activo = true AND m.activo = true
      ORDER BY tr.linea_tratamiento, m.nombre_comercial
    `;

    const result = await pool.query(query, [cie10Id]);

    return NextResponse.json({
      success: true,
      tratamientos: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error obteniendo tratamientos recomendados:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
