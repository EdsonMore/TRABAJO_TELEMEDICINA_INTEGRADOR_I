// app/api/medico/pacientes/route.ts
// MediLink+ - API para obtener pacientes del médico
// Endpoint que retorna lista de pacientes atendidos con historial

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

    if (!payload || payload.rol !== "medico") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    // Obtener ID del médico
    const medicoResult = await query("SELECT id FROM medicos WHERE id_usuario = $1", [payload.userId])

    if (medicoResult.rows.length === 0) {
      return NextResponse.json({ error: "Médico no encontrado" }, { status: 404 })
    }

    const medicoId = medicoResult.rows[0].id

    // Obtener pacientes únicos que han tenido citas con este médico
    const pacientesResult = await query(
      `
      SELECT DISTINCT
        p.id, p.dni, p.fecha_nacimiento, p.sexo, p.tipo_sangre, p.alergias, 
        p.enfermedades_cronicas, p.direccion, p.seguro_medico,
        u.nombre, u.apellido, u.telefono, u.email, u.avatar_url,
        ub.departamento, ub.provincia, ub.distrito,
        (SELECT COUNT(*) FROM citas WHERE id_paciente = p.id AND id_medico = $1) as total_citas,
        (SELECT COUNT(*) FROM citas WHERE id_paciente = p.id AND id_medico = $1 AND estado = 'completada') as citas_completadas,
        (SELECT MAX(fecha_cita) FROM citas WHERE id_paciente = p.id AND id_medico = $1 AND estado = 'completada') as ultima_cita,
        (SELECT MIN(fecha_cita) FROM citas WHERE id_paciente = p.id AND id_medico = $1) as primera_cita
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id
      LEFT JOIN ubicaciones ub ON p.id_ubicacion = ub.id
      WHERE p.id IN (
        SELECT DISTINCT id_paciente 
        FROM citas 
        WHERE id_medico = $1
      )
      ORDER BY u.apellido, u.nombre
    `,
      [medicoId],
    )

    const pacientes = pacientesResult.rows.map((paciente) => {
      // Calcular edad
      const fechaNacimiento = new Date(paciente.fecha_nacimiento)
      const hoy = new Date()
      const edad = hoy.getFullYear() - fechaNacimiento.getFullYear()

      return {
        id: paciente.id,
        usuario: {
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          email: paciente.email,
          telefono: paciente.telefono,
          avatar_url: paciente.avatar_url,
        },
        informacion_personal: {
          dni: paciente.dni,
          edad: edad,
          sexo: paciente.sexo,
          tipo_sangre: paciente.tipo_sangre,
          direccion: paciente.direccion,
          ubicacion: {
            departamento: paciente.departamento,
            provincia: paciente.provincia,
            distrito: paciente.distrito,
          },
        },
        informacion_medica: {
          alergias: paciente.alergias,
          enfermedades_cronicas: paciente.enfermedades_cronicas,
          seguro_medico: paciente.seguro_medico,
        },
        estadisticas_atencion: {
          total_citas: Number.parseInt(paciente.total_citas),
          citas_completadas: Number.parseInt(paciente.citas_completadas),
          primera_cita: paciente.primera_cita,
          ultima_cita: paciente.ultima_cita,
        },
      }
    })

    // Estadísticas generales
    const estadisticas = {
      total_pacientes: pacientes.length,
      pacientes_activos: pacientes.filter((p) => {
        const ultimaCita = p.estadisticas_atencion.ultima_cita
        if (!ultimaCita) return false
        const diasDesdeUltimaCita = Math.floor(
          (new Date().getTime() - new Date(ultimaCita).getTime()) / (1000 * 60 * 60 * 24),
        )
        return diasDesdeUltimaCita <= 90 // Activo si tuvo cita en los últimos 3 meses
      }).length,
      promedio_citas_por_paciente:
        pacientes.length > 0
          ? (pacientes.reduce((sum, p) => sum + p.estadisticas_atencion.total_citas, 0) / pacientes.length).toFixed(1)
          : 0,
    }

    return NextResponse.json({
      pacientes,
      estadisticas,
    })
  } catch (error) {
    console.error("Error obteniendo pacientes del médico:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
