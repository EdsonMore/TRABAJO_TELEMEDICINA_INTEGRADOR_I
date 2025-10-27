// app/api/medico/pacientes/buscar/route.ts
// MediLink+ - API para buscar pacientes (médicos)
// Permite a los médicos buscar y ver perfiles de pacientes

import { type NextRequest, NextResponse } from "next/server";
import { verificarToken } from "@/lib/auth";
import { query } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verificarToken(token);

    if (!payload || payload.rol !== "medico") {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get("q") || "";
    const limite = Number.parseInt(searchParams.get("limite") || "20");
    const offset = Number.parseInt(searchParams.get("offset") || "0");

    let queryText = `
  SELECT 
    p.id, u.nombre, u.apellido, u.email, u.telefono, u.avatar_url,
    p.fecha_nacimiento, p.sexo, p.direccion, p.dni, p.tipo_sangre,
    p.alergias, p.enfermedades_cronicas, p.seguro_medico,
    p.contacto_emergencia_nombre, p.contacto_emergencia_telefono,
    ub.departamento, ub.provincia, ub.distrito,
    COUNT(c.id) as total_citas
  FROM pacientes p
  JOIN usuarios u ON p.id_usuario = u.id
  LEFT JOIN ubicaciones ub ON p.id_ubicacion = ub.id
  LEFT JOIN citas c ON p.id = c.id_paciente
  WHERE u.rol = 'paciente' AND u.activo = true
`;

    const params: any[] = [];

    if (busqueda) {
      queryText += ` AND (
        LOWER(u.nombre) LIKE LOWER($${params.length + 1}) OR 
        LOWER(u.apellido) LIKE LOWER($${params.length + 1}) OR 
        LOWER(u.email) LIKE LOWER($${params.length + 1})
      )`;
      params.push(`%${busqueda}%`);
    }

    queryText += ` 
      GROUP BY u.id, u.nombre, u.apellido, u.email, u.telefono,
               p.fecha_nacimiento, p.genero, p.direccion, p.distrito, p.provincia, p.departamento,
               p.tipo_sangre, p.alergias, p.enfermedades_cronicas, p.medicamentos_actuales,
               p.contacto_emergencia_nombre, p.contacto_emergencia_telefono, p.seguro_medico
      ORDER BY u.nombre, u.apellido
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limite, offset);

    const result = await query(queryText, params);

    // Obtener total de registros para paginación
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM usuarios u
      INNER JOIN pacientes p ON u.id = p.usuario_id
      WHERE u.rol = 'paciente' AND u.activo = true
    `;

    const countParams: any[] = [];

    if (busqueda) {
      countQuery += ` AND (
        LOWER(u.nombre) LIKE LOWER($1) OR 
        LOWER(u.apellido) LIKE LOWER($1) OR 
        LOWER(u.email) LIKE LOWER($1)
      )`;
      countParams.push(`%${busqueda}%`);
    }

    const countResult = await query(countQuery, countParams);
    const total = Number.parseInt(countResult.rows[0].total);

    return NextResponse.json({
      pacientes: result.rows,
      total,
      limite,
      offset,
      paginas: Math.ceil(total / limite),
    });
  } catch (error) {
    console.error("Error buscando pacientes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
