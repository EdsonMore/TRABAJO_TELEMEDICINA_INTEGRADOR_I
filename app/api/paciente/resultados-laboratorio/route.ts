// MediLink+ - API para obtener resultados de laboratorio del paciente
// Endpoint que retorna todos los exámenes y resultados médicos

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verificarToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de acceso requerido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verificarToken(token)

    if (!payload || payload.rol !== "paciente") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    // Obtener ID del paciente
    const pacienteResult = await query("SELECT id FROM pacientes WHERE id_usuario = $1", [payload.userId])

    if (pacienteResult.rows.length === 0) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }

    const pacienteId = pacienteResult.rows[0].id

    // Obtener todas las solicitudes de exámenes del paciente con resultados
    const resultadosResult = await query(
      `
      SELECT 
        se.id as solicitud_id, se.codigo_solicitud, se.fecha_solicitud, se.estado as estado_solicitud,
        se.fecha_programada, se.hora_programada, se.costo_total,
        c.fecha_cita, c.motivo_consulta, c.diagnostico,
        u_medico.nombre as medico_nombre, u_medico.apellido as medico_apellido,
        esp.nombre as especialidad_nombre,
        lab.nombre_comercial as laboratorio_nombre,
        u_lab.telefono as laboratorio_telefono,
        sed.id as detalle_id, sed.instrucciones_especiales, sed.completado,
        te.nombre as examen_nombre, te.categoria as examen_categoria, te.descripcion as examen_descripcion,
        te.preparacion_requerida, te.tiempo_resultado_horas,
        rl.id as resultado_id, rl.resultado_texto, rl.resultado_numerico, rl.unidad_medida,
        rl.valor_referencia_min, rl.valor_referencia_max, rl.observaciones as resultado_observaciones,
        rl.anormal, rl.fecha_resultado, rl.validado_por, rl.archivo_adjunto_url
      FROM solicitudes_examenes se
      JOIN citas c ON se.id_cita = c.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios u_medico ON m.id_usuario = u_medico.id
      JOIN especialidades esp ON m.id_especialidad = esp.id
      LEFT JOIN laboratorios lab ON se.id_laboratorio = lab.id
      LEFT JOIN usuarios u_lab ON lab.id_usuario = u_lab.id
      JOIN examen_detalle sed ON se.id = sed.id_solicitud
      JOIN tipos_examenes te ON sed.id_tipo_examen = te.id
      LEFT JOIN resultados_laboratorio rl ON sed.id = rl.id_examen_detalle
      WHERE c.id_paciente = $1
      ORDER BY se.fecha_solicitud DESC, te.nombre
    `,
      [pacienteId],
    )

    // Agrupar resultados por solicitud
    const solicitudesMap = new Map()

    resultadosResult.rows.forEach((row: any) => {
      if (!solicitudesMap.has(row.solicitud_id)) {
        solicitudesMap.set(row.solicitud_id, {
          id: row.solicitud_id,
          codigo_solicitud: row.codigo_solicitud,
          fecha_solicitud: row.fecha_solicitud,
          estado: row.estado_solicitud,
          fecha_programada: row.fecha_programada,
          hora_programada: row.hora_programada,
          costo_total: row.costo_total,
          cita: {
            fecha_cita: row.fecha_cita,
            motivo_consulta: row.motivo_consulta,
            diagnostico: row.diagnostico,
          },
          medico: {
            nombre: row.medico_nombre,
            apellido: row.medico_apellido,
            especialidad: row.especialidad_nombre,
          },
          laboratorio: {
            nombre: row.laboratorio_nombre,
            telefono: row.laboratorio_telefono,
          },
          examenes: [],
        })
      }

      const solicitud = solicitudesMap.get(row.solicitud_id)
      solicitud.examenes.push({
        detalle_id: row.detalle_id,
        examen: {
          nombre: row.examen_nombre,
          categoria: row.examen_categoria,
          descripcion: row.examen_descripcion,
          preparacion_requerida: row.preparacion_requerida,
          tiempo_resultado_horas: row.tiempo_resultado_horas,
        },
        instrucciones_especiales: row.instrucciones_especiales,
        completado: row.completado,
        resultado: row.resultado_id
          ? {
              id: row.resultado_id,
              resultado_texto: row.resultado_texto,
              resultado_numerico: row.resultado_numerico,
              unidad_medida: row.unidad_medida,
              valor_referencia_min: row.valor_referencia_min,
              valor_referencia_max: row.valor_referencia_max,
              observaciones: row.resultado_observaciones,
              anormal: row.anormal,
              fecha_resultado: row.fecha_resultado,
              validado_por: row.validado_por,
              archivo_adjunto_url: row.archivo_adjunto_url,
            }
          : null,
      })
    })

    const solicitudes = Array.from(solicitudesMap.values())

    // Estadísticas de exámenes
    const totalExamenes = solicitudes.reduce((total, s) => total + s.examenes.length, 0)
    const examenesCompletados = solicitudes.reduce(
      (total: number, s: any) => total + s.examenes.filter((e: any) => e.completado && e.resultado).length,
      0,
    )
    const examenesPendientes = solicitudes.reduce(
      (total: number, s: any) => total + s.examenes.filter((e: any) => !e.completado || !e.resultado).length,
      0,
    )
    const resultadosAnormales = solicitudes.reduce(
      (total: number, s: any) => total + s.examenes.filter((e: any) => e.resultado && e.resultado.anormal).length,
      0,
    )

    const estadisticas = {
      total_solicitudes: solicitudes.length,
      total_examenes: totalExamenes,
      examenes_completados: examenesCompletados,
      examenes_pendientes: examenesPendientes,
      resultados_anormales: resultadosAnormales,
      ultima_solicitud: solicitudes[0] || null,
    }

    return NextResponse.json({
      solicitudes,
      estadisticas,
    })
  } catch (error) {
    console.error("Error obteniendo resultados de laboratorio:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
