// MediLink+ - API para obtener lista de médicos disponibles
// Endpoint para que pacientes puedan buscar y seleccionar médicos

import { NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    // Asegurar formato "Bearer <token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return NextResponse.json(
        { error: "Formato de token inválido" },
        { status: 401 }
      );
    }

    const token = parts[1];
    if (!token || token.split(".").length !== 3) {
      return NextResponse.json({ error: "Token malformado" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    // Obtener lista de médicos
    const medicosResult = await pool.query(`
      SELECT 
        m.id,
        u.nombre,
        u.apellido,
        u.telefono,
        u.email,
        m.numero_colegiatura,
        m.anos_experiencia,
        m.direccion_consultorio,
        m.tarifa_consulta,
        m.calificacion_promedio,
        m.total_consultas,
        m.biografia,
        e.nombre AS especialidad,
        e.descripcion AS especialidad_descripcion
      FROM medicos m
      JOIN usuarios u ON m.id_usuario = u.id
      JOIN especialidades e ON m.id_especialidad = e.id
      WHERE u.activo = true
      ORDER BY m.calificacion_promedio DESC, m.total_consultas DESC;
    `);

    return NextResponse.json({ medicos: medicosResult.rows });
  } catch (error) {
    console.error("Error obteniendo médicos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
