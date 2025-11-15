// MediLink+ - API para obtener perfil completo del médico
// Endpoint que retorna información profesional y estadísticas del médico

import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.rol !== "medico") {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    // Obtener información completa del médico
    const result = await query(
      `
      SELECT 
        m.*,
        u.nombre, u.apellido, u.email, u.telefono, u.fecha_registro, u.ultima_conexion, u.avatar_url,
        e.nombre as especialidad_nombre, e.descripcion as especialidad_descripcion,
        ub.departamento, ub.provincia, ub.distrito
      FROM medicos m
      JOIN usuarios u ON m.id_usuario = u.id
      JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN ubicaciones ub ON m.id_ubicacion = ub.id
      WHERE m.id_usuario = $1
    `,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Perfil de médico no encontrado" },
        { status: 404 }
      );
    }

    const medico = result.rows[0];

    // Obtener estadísticas del médico
    const estadisticasResult = await query(
      `
      SELECT 
        COUNT(*) as total_citas,
        COUNT(CASE WHEN estado = 'completada' THEN 1 END) as citas_completadas,
        COUNT(CASE WHEN estado = 'programada' OR estado = 'confirmada' THEN 1 END) as citas_programadas,
        COUNT(CASE WHEN fecha_cita = CURRENT_DATE THEN 1 END) as citas_hoy,
        COUNT(CASE WHEN fecha_cita > CURRENT_DATE THEN 1 END) as citas_futuras,
        AVG(CASE WHEN costo IS NOT NULL THEN costo END) as ingreso_promedio_cita
      FROM citas 
      WHERE id_medico = $1
    `,
      [medico.id]
    );

    const estadisticas = estadisticasResult.rows[0];

    // Obtener pacientes únicos atendidos
    const pacientesResult = await query(
      `
      SELECT COUNT(DISTINCT id_paciente) as total_pacientes
      FROM citas 
      WHERE id_medico = $1 AND estado = 'completada'
    `,
      [medico.id]
    );

    const totalPacientes = pacientesResult.rows[0].total_pacientes;

    return NextResponse.json({
      id: medico.id,
      usuario: {
        nombre: medico.nombre,
        apellido: medico.apellido,
        email: medico.email,
        telefono: medico.telefono,
        avatar_url: medico.avatar_url,
        fecha_registro: medico.fecha_registro,
        ultima_conexion: medico.ultima_conexion,
      },
      informacion_profesional: {
        numero_colegiatura: medico.numero_colegiatura,
        anos_experiencia: medico.anos_experiencia,
        especialidad: {
          nombre: medico.especialidad_nombre,
          descripcion: medico.especialidad_descripcion,
        },
        direccion_consultorio: medico.direccion_consultorio,
        ubicacion: {
          departamento: medico.departamento,
          provincia: medico.provincia,
          distrito: medico.distrito,
        },
        horario_atencion: medico.horario_atencion,
        tarifa_consulta: medico.tarifa_consulta,
        calificacion_promedio: medico.calificacion_promedio,
        total_consultas: medico.total_consultas,
        biografia: medico.biografia,
        certificaciones: medico.certificaciones,
      },
      estadisticas: {
        total_citas: Number.parseInt(estadisticas.total_citas),
        citas_completadas: Number.parseInt(estadisticas.citas_completadas),
        citas_programadas: Number.parseInt(estadisticas.citas_programadas),
        citas_hoy: Number.parseInt(estadisticas.citas_hoy),
        citas_futuras: Number.parseInt(estadisticas.citas_futuras),
        total_pacientes: Number.parseInt(totalPacientes),
        ingreso_promedio_cita:
          Number.parseFloat(estadisticas.ingreso_promedio_cita) || 0,
      },
      fecha_actualizacion: medico.fecha_actualizacion,
    });
  } catch (error) {
    console.error("Error obteniendo perfil del médico:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
