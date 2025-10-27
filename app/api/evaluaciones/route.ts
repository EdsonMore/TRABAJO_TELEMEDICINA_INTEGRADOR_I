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
      calificacion_general,
      calificacion_atencion,
      calificacion_puntualidad,
      comentarios,
      recomendaria,
    } = await request.json();

    // Verificar que la cita pertenece al paciente y está completada
    const citaResult = await pool.query(
      `
      SELECT c.*, p.id as paciente_id
      FROM citas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.id = $1 AND p.usuario_id = $2 AND c.estado = 'completada'
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
      "SELECT id FROM evaluaciones_consulta WHERE cita_id = $1",
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
      INSERT INTO evaluaciones_consulta 
      (cita_id, paciente_id, medico_id, calificacion_general, calificacion_atencion, 
       calificacion_puntualidad, comentarios, recomendaria)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        cita_id,
        cita.paciente_id,
        cita.medico_id,
        calificacion_general,
        calificacion_atencion,
        calificacion_puntualidad,
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

    let query = `
      SELECT e.*, 
             p.nombres as paciente_nombres, p.apellidos as paciente_apellidos,
             c.fecha_cita
      FROM evaluaciones_consulta e
      JOIN pacientes pac ON e.paciente_id = pac.id
      JOIN usuarios p ON pac.usuario_id = p.id
      JOIN citas c ON e.cita_id = c.id
    `;
    let params = [];

    if (usuario.rol === "medico") {
      // Médico ve sus propias evaluaciones
      const medicoResult = await pool.query(
        "SELECT id FROM medicos WHERE usuario_id = $1",
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
      evaluaciones.reduce((sum, e) => sum + e.calificacion_general, 0) /
      totalEvaluaciones;
    const promedioAtencion =
      evaluaciones.reduce((sum, e) => sum + e.calificacion_atencion, 0) /
      totalEvaluaciones;
    const promedioPuntualidad =
      evaluaciones.reduce((sum, e) => sum + e.calificacion_puntualidad, 0) /
      totalEvaluaciones;
    const porcentajeRecomendacion =
      (evaluaciones.filter((e) => e.recomendaria).length / totalEvaluaciones) *
      100;

    return NextResponse.json({
      evaluaciones,
      estadisticas: {
        total_evaluaciones: totalEvaluaciones,
        promedio_general: Math.round(promedioGeneral * 100) / 100,
        promedio_atencion: Math.round(promedioAtencion * 100) / 100,
        promedio_puntualidad: Math.round(promedioPuntualidad * 100) / 100,
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
