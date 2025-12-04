import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario || usuario.rol !== "administrador") {
      return NextResponse.json(
        { error: "Solo administradores pueden acceder" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo") || "general";

    // Obtener todas las evaluaciones
    const evaluacionesResult = await pool.query(`
      SELECT 
        e.id,
        e.cita_id,
        e.paciente_id,
        e.medico_id,
        e.calificacion,
        e.comentarios,
        e.recomendaria,
        e.created_at,
        u_pac.nombre as paciente_nombre,
        u_pac.apellido as paciente_apellido,
        u_med.nombre as medico_nombre,
        u_med.apellido as medico_apellido,
        c.fecha_cita
      FROM evaluaciones e
      JOIN pacientes p ON e.paciente_id = p.id
      JOIN usuarios u_pac ON p.id_usuario = u_pac.id
      JOIN medicos m ON e.medico_id = m.id
      JOIN usuarios u_med ON m.id_usuario = u_med.id
      JOIN citas c ON e.cita_id = c.id
      ORDER BY e.created_at DESC
    `);

    const evaluaciones = evaluacionesResult.rows;

    if (tipo === "analisis") {
      // Análisis agregado por médico
      const porMedico = new Map();
      const distribucion = new Map();
      let totalEvaluaciones = 0;
      let sumaCalificaciones = 0;

      evaluaciones.forEach((evaluation) => {
        totalEvaluaciones++;
        sumaCalificaciones += evaluation.calificacion;

        // Contabilizar por médico
        const medicoKey = evaluation.medico_id;
        if (!porMedico.has(medicoKey)) {
          porMedico.set(medicoKey, {
            medico_id: evaluation.medico_id,
            medico_nombre: evaluation.medico_nombre,
            medico_apellido: evaluation.medico_apellido,
            calificaciones: [],
            positivas: 0,
            negativas: 0,
          });
        }

        const medico = porMedico.get(medicoKey);
        medico.calificaciones.push(evaluation.calificacion);
        if (evaluation.calificacion >= 4) {
          medico.positivas++;
        } else if (evaluation.calificacion < 3) {
          medico.negativas++;
        }

        // Contabilizar distribución
        const calif = evaluation.calificacion;
        distribucion.set(calif, (distribucion.get(calif) || 0) + 1);
      });

      // Convertir a array y calcular promedios
      const porMedicoArray = Array.from(porMedico.values())
        .map((medico) => ({
          medico_id: medico.medico_id,
          medico_nombre: medico.medico_nombre,
          medico_apellido: medico.medico_apellido,
          calificacion_promedio:
            medico.calificaciones.reduce((a: number, b: number) => a + b, 0) /
            medico.calificaciones.length,
          total_evaluaciones: medico.calificaciones.length,
          evaluaciones_positivas: medico.positivas,
          evaluaciones_negativas: medico.negativas,
        }))
        .sort(
          (a: any, b: any) => b.calificacion_promedio - a.calificacion_promedio
        );

      // Convertir distribución a array
      const distribucionArray = Array.from(distribucion.entries())
        .map(([calificacion, cantidad]) => ({
          calificacion: parseInt(calificacion),
          cantidad,
          porcentaje: Math.round((cantidad / totalEvaluaciones) * 100),
        }))
        .sort((a, b) => a.calificacion - b.calificacion);

      const promedio =
        totalEvaluaciones > 0 ? sumaCalificaciones / totalEvaluaciones : 0;

      return NextResponse.json({
        total: totalEvaluaciones,
        promedio: Math.round(promedio * 100) / 100,
        por_medico: porMedicoArray,
        distribucion: distribucionArray,
      });
    }

    // Retornar evaluaciones completas
    return NextResponse.json({
      total: evaluaciones.length,
      evaluaciones,
    });
  } catch (error) {
    console.error("Error obteniendo evaluaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
