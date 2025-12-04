import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json(
        { error: "Solo pacientes pueden evaluar" },
        { status: 403 }
      );
    }

    const {
      cita_id,
      calificacion,
      comentarios,
      recomendaria,
    } = await request.json();

    // Verificar que la cita pertenece al paciente y está completada
    const citaResult = await pool.query(
      `
      SELECT c.*, p.id as paciente_id
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id
      WHERE c.id = $1 AND p.id_usuario = $2 AND c.estado = 'completada'
    `,
      [cita_id, usuario.id]
    );

    if (citaResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: "Cita no encontrada o no completada",
        },
        { status: 404 }
      );
    }

    const cita = citaResult.rows[0];

    // Verificar si ya existe una evaluación
    const evaluacionExistente = await pool.query(
      "SELECT id FROM evaluaciones WHERE cita_id = $1",
      [cita_id]
    );

    if (evaluacionExistente.rows.length > 0) {
      return NextResponse.json(
        {
          error: "Ya existe una evaluación para esta cita",
        },
        { status: 400 }
      );
    }

    // Crear la evaluación
    const result = await pool.query(
      `
      INSERT INTO evaluaciones 
      (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        cita_id,
        cita.paciente_id,
        cita.id_medico,
        calificacion,
        comentarios,
        recomendaria,
      ]
    );

    return NextResponse.json({
      success: true,
      evaluacion: result.rows[0],
      message: "Evaluación registrada exitosamente",
    });
  } catch (error) {
    console.error("Error creando evaluación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const medico_id = searchParams.get("medico_id");
    const cita_id = searchParams.get("cita_id");

    // Si se especifica una cita_id, obtener evaluación de esa cita específica
    if (cita_id) {
      const evaluacionResult = await pool.query(
        `
        SELECT e.* FROM evaluaciones e
        WHERE e.cita_id = $1
        `,
        [cita_id]
      );

      if (evaluacionResult.rows.length === 0) {
        return NextResponse.json({
          evaluacion: null,
        });
      }

      return NextResponse.json({
        evaluacion: evaluacionResult.rows[0],
      });
    }

    let query = `
      SELECT e.*, 
             u.nombre as paciente_nombre, u.apellido as paciente_apellido,
             c.fecha_cita
      FROM evaluaciones e
      JOIN pacientes pac ON e.paciente_id = pac.id
      JOIN usuarios u ON pac.id_usuario = u.id
      JOIN citas c ON e.cita_id = c.id
    `;
    let params = [];

    if (usuario.rol === "medico") {
      // Médico ve sus propias evaluaciones
      const medicoResult = await pool.query(
        "SELECT id FROM medicos WHERE id_usuario = $1",
        [usuario.id]
      );
      if (medicoResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Médico no encontrado" },
          { status: 404 }
        );
      }
      query += " WHERE e.medico_id = $1";
      params = [medicoResult.rows[0].id];
    } else if (usuario.rol === "admin" && medico_id) {
      // Admin puede ver evaluaciones de cualquier médico
      query += " WHERE e.medico_id = $1";
      params = [medico_id];
    } else if (usuario.rol === "admin") {
      // Admin ve todas las evaluaciones
    } else {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    query += " ORDER BY e.created_at DESC";

    const result = await pool.query(query, params);

    // Calcular estadísticas
    const evaluaciones = result.rows;
    const totalEvaluaciones = evaluaciones.length;

    if (totalEvaluaciones === 0) {
      return NextResponse.json({
        evaluaciones: [],
        estadisticas: null,
      });
    }

    const promedioGeneral =
      evaluaciones.reduce((sum, e) => sum + e.calificacion, 0) /
      totalEvaluaciones;
    const porcentajeRecomendacion =
      (evaluaciones.filter((e) => e.recomendaria).length / totalEvaluaciones) *
      100;

    return NextResponse.json({
      evaluaciones,
      estadisticas: {
        total_evaluaciones: totalEvaluaciones,
        promedio_calificacion: Math.round(promedioGeneral * 100) / 100,
        porcentaje_recomendacion: Math.round(porcentajeRecomendacion),
      },
    });
  } catch (error) {
    console.error("Error obteniendo evaluaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
