//app/api/paciente/citas/route.ts
// MediLink+ - API para obtener citas del paciente
// Endpoint que retorna todas las citas (pasadas, presentes y futuras) del paciente

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de acceso requerido" }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    if (!payload || payload.rol !== "paciente") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    // Obtener ID del paciente
    const pacienteResult = await query("SELECT id FROM pacientes WHERE id_usuario = $1", [payload.userId])

    if (pacienteResult.rows.length === 0) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }

    const pacienteId = pacienteResult.rows[0].id

    // Obtener todas las citas del paciente con información del médico y especialidad
    const citasResult = await query(
      `
      SELECT 
        c.*,
        u.nombre as medico_nombre, u.apellido as medico_apellido, u.telefono as medico_telefono,
        m.direccion_consultorio, m.tarifa_consulta, m.calificacion_promedio,
        e.nombre as especialidad_nombre
      FROM citas c
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios u ON m.id_usuario = u.id
      JOIN especialidades e ON m.id_especialidad = e.id
      WHERE c.id_paciente = $1
      ORDER BY c.fecha_cita DESC, c.hora_cita DESC
    `,
      [pacienteId],
    )

    // Separar citas por estado temporal
    const hoy = new Date()
    const citas = citasResult.rows.map((cita) => {
      const fechaCita = new Date(cita.fecha_cita)
      let estadoTemporal = "pasada"

      if (fechaCita.toDateString() === hoy.toDateString()) {
        estadoTemporal = "hoy"
      } else if (fechaCita > hoy) {
        estadoTemporal = "futura"
      }

      return {
        id: cita.id,
        fecha_cita: cita.fecha_cita,
        hora_cita: cita.hora_cita,
        tipo_cita: cita.tipo_cita,
        estado: cita.estado,
        estado_temporal: estadoTemporal,
        motivo_consulta: cita.motivo_consulta,
        observaciones_paciente: cita.observaciones_paciente,
        diagnostico: cita.diagnostico,
        tratamiento: cita.tratamiento,
        observaciones_medico: cita.observaciones_medico,
        costo: cita.costo,
        pagado: cita.pagado,
        medico: {
          nombre: cita.medico_nombre,
          apellido: cita.medico_apellido,
          telefono: cita.medico_telefono,
          direccion_consultorio: cita.direccion_consultorio,
          tarifa_consulta: cita.tarifa_consulta,
          calificacion_promedio: cita.calificacion_promedio,
          especialidad: cita.especialidad_nombre,
        },
        fecha_creacion: cita.fecha_creacion,
      }
    })

    // Estadísticas de citas
    const estadisticas = {
      total: citas.length,
      completadas: citas.filter((c) => c.estado === "completada").length,
      programadas: citas.filter((c) => c.estado === "programada" || c.estado === "confirmada").length,
      canceladas: citas.filter((c) => c.estado === "cancelada").length,
      proxima_cita: citas.find((c) => c.estado_temporal === "futura" && c.estado === "programada"),
    }

    return NextResponse.json({
      citas,
      estadisticas,
    })
  } catch (error) {
    console.error("Error obteniendo citas del paciente:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
