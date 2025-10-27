// app/api/paciente/telemedicina/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"
import { verificarToken } from "@/lib/auth"

// GET - Obtener sesiones de telemedicina del paciente
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const usuario = await verificarToken(token)
    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const result = await pool.query(
      `
      SELECT 
        st.*,
        c.motivo_consulta,
        c.fecha_cita,
        c.hora_cita,
        u_medico.nombre as medico_nombre,
        u_medico.apellido as medico_apellido,
        e.nombre as especialidad,
        m.numero_colegiatura
      FROM sesiones_telemedicina st
      JOIN citas c ON st.id_cita = c.id
      JOIN medicos m ON st.id_medico = m.id
      JOIN usuarios u_medico ON m.id_usuario = u_medico.id
      JOIN especialidades e ON m.id_especialidad = e.id
      JOIN pacientes p ON st.id_paciente = p.id
      JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
      WHERE u_paciente.id = $1
      ORDER BY st.fecha_programada DESC
    `,
      [usuario.id],
    )

    // También obtener notificaciones pendientes
    const notificaciones = await pool.query(
      `
      SELECT nt.*
      FROM notificaciones_telemedicina nt
      JOIN sesiones_telemedicina st ON nt.id_sesion = st.id
      JOIN pacientes p ON st.id_paciente = p.id
      JOIN usuarios u ON p.id_usuario = u.id
      WHERE u.id = $1 AND nt.enviada = false AND nt.fecha_programada <= NOW()
      ORDER BY nt.fecha_programada ASC
    `,
      [usuario.id],
    )

    return NextResponse.json({
      success: true,
      sesiones: result.rows,
      notificaciones_pendientes: notificaciones.rows,
    })
  } catch (error) {
    console.error("Error al obtener sesiones de telemedicina del paciente:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
