import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"
import { verificarToken } from "@/lib/auth"

// API para obtener exámenes pendientes en laboratorio
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de laboratorio
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const usuario = await verificarToken(token)
    if (!usuario || usuario.rol !== "laboratorio") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const client = await pool.connect()

    // Obtener exámenes pendientes con información del paciente y médico
    const query = `
      SELECT 
        rl.id,
        rl.fecha_solicitud,
        rl.tipo_examen,
        rl.indicaciones,
        rl.estado,
        rl.prioridad,
        p.nombres || ' ' || p.apellidos as nombre_paciente,
        p.dni as dni_paciente,
        p.telefono as telefono_paciente,
        p.fecha_nacimiento,
        m.nombres || ' ' || m.apellidos as nombre_medico,
        m.especialidad,
        m.cmp
      FROM resultados_laboratorio rl
      JOIN usuarios p ON rl.paciente_id = p.id
      JOIN usuarios m ON rl.medico_id = m.id
      WHERE rl.estado IN ('pendiente', 'en_proceso')
      ORDER BY 
        CASE rl.prioridad 
          WHEN 'urgente' THEN 1 
          WHEN 'alta' THEN 2 
          WHEN 'normal' THEN 3 
        END,
        rl.fecha_solicitud ASC
    `

    const result = await client.query(query)
    client.release()

    return NextResponse.json({
      success: true,
      examenes: result.rows,
    })
  } catch (error) {
    console.error("Error al obtener exámenes pendientes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// API para registrar resultados de examen
export async function PUT(request: NextRequest) {
  try {
    const { examenId, resultados, observaciones, valores_referencia } = await request.json()

    // Verificar autenticación
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const usuario = await verificarToken(token)
    if (!usuario || usuario.rol !== "laboratorio") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const client = await pool.connect()

    // Actualizar resultados del examen
    const updateQuery = `
      UPDATE resultados_laboratorio 
      SET resultados = $1,
          observaciones = $2,
          valores_referencia = $3,
          estado = 'completado',
          fecha_resultado = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `

    const result = await client.query(updateQuery, [
      JSON.stringify(resultados),
      observaciones,
      JSON.stringify(valores_referencia),
      examenId,
    ])
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Examen no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Resultados registrados correctamente",
      examen: result.rows[0],
    })
  } catch (error) {
    console.error("Error al registrar resultados:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
