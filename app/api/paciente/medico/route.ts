// app/api/pacientes/medico/route.ts - NUEVO ARCHIVO
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
    const busqueda = searchParams.get("busqueda") || "";

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

    // Consulta para obtener pacientes del médico
    let query = `
      SELECT DISTINCT
        p.id,
        up.nombre,
        up.apellido,
        p.dni,
        EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) as edad,
        p.tipo_sangre,
        COUNT(DISTINCT r.id) as total_recetas
      FROM pacientes p
      JOIN usuarios up ON p.id_usuario = up.id
      JOIN citas c ON p.id = c.id_paciente
      LEFT JOIN recetas r ON c.id = r.id_cita
      WHERE c.id_medico = $1
    `;

    const params: any[] = [medicoId];
    let paramCount = 1;

    if (busqueda) {
      paramCount++;
      query += ` AND (
        LOWER(up.nombre) LIKE LOWER($${paramCount}) OR 
        LOWER(up.apellido) LIKE LOWER($${paramCount}) OR
        p.dni LIKE $${paramCount}
      )`;
      params.push(`%${busqueda}%`);
    }

    query += ` GROUP BY p.id, up.nombre, up.apellido, p.dni, p.fecha_nacimiento, p.tipo_sangre
               ORDER BY up.nombre, up.apellido`;

    const result = await client.query(query, params);

    const pacientes = result.rows.map((paciente) => ({
      ...paciente,
      edad: parseInt(paciente.edad) || 0,
      total_recetas: parseInt(paciente.total_recetas) || 0,
    }));

    return NextResponse.json({
      success: true,
      pacientes: pacientes,
      total: pacientes.length,
    });
  } catch (error: any) {
    console.error("Error obteniendo pacientes del médico:", error);
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
