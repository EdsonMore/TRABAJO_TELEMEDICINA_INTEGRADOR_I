// MediLink+ - API para obtener agenda del médico
// Endpoint que retorna citas programadas y disponibilidad

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    // Soporte para token en Authorization Bearer o en cookie `medilink_token`
    let token: string | null = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else {
      // Intentar leer token desde cookies (cliente que guarda token en cookie)
      try {
        const cookieToken = request.cookies.get("medilink_token")
        if (cookieToken) token = cookieToken.value
      } catch (e) {
        // ignore
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Token de acceso requerido" }, { status: 401 })
    }
    const payload = verifyToken(token)

    if (!payload || payload.rol !== "medico") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const url = new URL(request.url)
    const fecha = url.searchParams.get("fecha") || new Date().toISOString().split("T")[0]
    const dias = Number.parseInt(url.searchParams.get("dias") || "7")

    // Obtener ID del médico
    const medicoResult = await query("SELECT id FROM medicos WHERE id_usuario = $1", [payload.userId])

    if (medicoResult.rows.length === 0) {
      return NextResponse.json({ error: "Médico no encontrado" }, { status: 404 })
    }

    const medicoId = medicoResult.rows[0].id

    // Calcular rango de fechas
    const fechaInicio = new Date(fecha)
    const fechaFin = new Date(fechaInicio)
    fechaFin.setDate(fechaFin.getDate() + dias)

    // Obtener citas del médico en el rango de fechas - CON DATOS DE SESIÓN TELEMEDICINA
    const citasResult = await query(
      `
      SELECT 
        c.*,
        p.dni, p.fecha_nacimiento, p.sexo, p.tipo_sangre, p.alergias, p.enfermedades_cronicas,
        u.nombre as paciente_nombre, u.apellido as paciente_apellido, u.telefono as paciente_telefono,
        u.email as paciente_email,
        st.id as id_sesion, st.codigo_acceso, st.estado as estado_sesion
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios u ON p.id_usuario = u.id
      LEFT JOIN sesiones_telemedicina st ON st.id_cita = c.id
      WHERE c.id_medico = $1 
        AND c.fecha_cita >= $2 
        AND c.fecha_cita <= $3
      ORDER BY c.fecha_cita, c.hora_cita
    `,
      [medicoId, fechaInicio.toISOString().split("T")[0], fechaFin.toISOString().split("T")[0]],
    )

    // Procesar citas por día
    const citasPorDia = new Map()

    citasResult.rows.forEach((cita) => {
      const fechaCita = cita.fecha_cita.toISOString().split("T")[0]

      if (!citasPorDia.has(fechaCita)) {
        citasPorDia.set(fechaCita, [])
      }

      // Calcular edad del paciente
      const fechaNacimiento = new Date(cita.fecha_nacimiento)
      const hoy = new Date()
      const edad = hoy.getFullYear() - fechaNacimiento.getFullYear()

      citasPorDia.get(fechaCita).push({
        id: cita.id,
        id_paciente: cita.id_paciente,
        id_sesion: cita.id_sesion, // ✨ NUEVO: ID de sesión telemedicina
        codigo_acceso: cita.codigo_acceso, // ✨ NUEVO: Código para generar roomId
        estado_sesion: cita.estado_sesion, // ✨ NUEVO: Estado de sesión
        hora_cita: cita.hora_cita,
        tipo_cita: cita.tipo_cita,
        estado: cita.estado,
        motivo_consulta: cita.motivo_consulta,
        observaciones_paciente: cita.observaciones_paciente,
        diagnostico: cita.diagnostico,
        tratamiento: cita.tratamiento,
        observaciones_medico: cita.observaciones_medico,
        costo: cita.costo,
        pagado: cita.pagado,
        fecha_cita: fechaCita,
        paciente: {
          id: cita.id_paciente,
          nombre: cita.paciente_nombre,
          apellido: cita.paciente_apellido,
          dni: cita.dni,
          edad: edad,
          sexo: cita.sexo,
          telefono: cita.paciente_telefono,
          email: cita.paciente_email,
          tipo_sangre: cita.tipo_sangre,
          alergias: cita.alergias,
          enfermedades_cronicas: cita.enfermedades_cronicas,
        },
        fecha_creacion: cita.fecha_creacion,
      })
    })

    // Convertir Map a array de objetos
    const agenda = Array.from(citasPorDia.entries()).map(([fecha, citas]) => ({
      fecha,
      total_citas: citas.length,
      citas_completadas: citas.filter((c) => c.estado === "completada").length,
      citas_programadas: citas.filter((c) => c.estado === "programada" || c.estado === "confirmada").length,
      citas_canceladas: citas.filter((c) => c.estado === "cancelada").length,
      citas: citas,
    }))

    // Estadísticas del período
    const totalCitas = citasResult.rows.length
    const citasHoy = citasResult.rows.filter(
      (c) => c.fecha_cita.toISOString().split("T")[0] === new Date().toISOString().split("T")[0],
    ).length

    return NextResponse.json({
      agenda,
      resumen: {
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_fin: fechaFin.toISOString().split("T")[0],
        total_citas: totalCitas,
        citas_hoy: citasHoy,
        dias_con_citas: agenda.length,
        promedio_citas_por_dia: agenda.length > 0 ? (totalCitas / agenda.length).toFixed(1) : 0,
      },
    })
  } catch (error) {
    console.error("Error obteniendo agenda del médico:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
