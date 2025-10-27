// app/api/medicamentos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken, debugToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    console.log("🔑 Header de autorización:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("❌ No hay token Bearer en el header");
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log(
      "📝 Token recibido:",
      token ? `✅ (${token.length} caracteres)` : "❌ Vacío"
    );

    // Debug del token (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      debugToken(token);
    }

    const usuario = await verificarToken(token);

    if (!usuario) {
      console.warn("❌ Token inválido o usuario no encontrado");
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 403 }
      );
    }

    console.log("✅ Usuario autenticado:", usuario.email, `(${usuario.rol})`);

    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("busqueda") || "";
    const categoria = searchParams.get("categoria") || "";
    const requiereReceta = searchParams.get("requiere_receta");

    let query = `
      SELECT 
        id, codigo_digemid, nombre_comercial, nombre_generico, 
        forma_farmaceutica, concentracion, laboratorio, principio_activo,
        categoria_terapeutica, requiere_receta, contraindicaciones,
        efectos_secundarios
      FROM medicamentos 
      WHERE activo = true
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (busqueda) {
      paramCount++;
      query += ` AND (
        LOWER(nombre_comercial) LIKE LOWER($${paramCount}) OR 
        LOWER(nombre_generico) LIKE LOWER($${paramCount}) OR
        LOWER(principio_activo) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${busqueda}%`);
    }

    if (categoria) {
      paramCount++;
      query += ` AND categoria_terapeutica = $${paramCount}`;
      params.push(categoria);
    }

    if (requiereReceta !== null) {
      paramCount++;
      query += ` AND requiere_receta = $${paramCount}`;
      params.push(requiereReceta === "true");
    }

    query += ` ORDER BY nombre_comercial, nombre_generico`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      medicamentos: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Error obteniendo medicamentos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
