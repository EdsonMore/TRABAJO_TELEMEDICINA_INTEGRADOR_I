import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"
import { verificarToken } from "@/lib/auth"

// API para obtener recetas pendientes de despacho en farmacia
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de farmacia
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const usuario = await verificarToken(token)
    if (!usuario || usuario.rol !== "farmacia") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const client = await pool.connect()

    // Obtener recetas pendientes con información del paciente y médico
    const query = `
      SELECT 
        r.id,
        r.fecha_emision,
        r.medicamentos,
        r.instrucciones,
        r.estado,
        p.nombres || ' ' || p.apellidos as nombre_paciente,
        p.dni as dni_paciente,
        p.telefono as telefono_paciente,
        m.nombres || ' ' || m.apellidos as nombre_medico,
        m.especialidad,
        m.cmp
      FROM recetas r
      JOIN usuarios p ON r.paciente_id = p.id
      JOIN usuarios m ON r.medico_id = m.id
      WHERE r.estado IN ('pendiente', 'en_proceso')
      ORDER BY r.fecha_emision DESC
    `

    const result = await client.query(query)
    client.release()

    return NextResponse.json({
      success: true,
      recetas: result.rows,
    })
  } catch (error) {
    console.error("Error al obtener recetas pendientes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// API para actualizar estado de receta (despachar medicamento)
export async function PUT(request: NextRequest) {
  try {
    const { recetaId, nuevoEstado, observaciones } = await request.json()

    // Verificar autenticación
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const usuario = await verificarToken(token)
    if (!usuario || usuario.rol !== "farmacia") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const client = await pool.connect()

    // Actualizar estado de la receta
    const updateQuery = `
      UPDATE recetas 
      SET estado = $1, 
          fecha_actualizacion = CURRENT_TIMESTAMP,
          observaciones = $2
      WHERE id = $3
      RETURNING *
    `

    const result = await client.query(updateQuery, [nuevoEstado, observaciones, recetaId])
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Estado de receta actualizado correctamente",
      receta: result.rows[0],
    })
  } catch (error) {
    console.error("Error al actualizar receta:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
