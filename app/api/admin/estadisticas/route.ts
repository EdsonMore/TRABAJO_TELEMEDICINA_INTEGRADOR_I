import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"
import { verificarToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Token de autorización requerido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verificarToken(token)

    if (!payload || payload.rol !== "administrador") {
      return NextResponse.json({ message: "Acceso no autorizado" }, { status: 403 })
    }

    // Obtener estadísticas generales del sistema
    const estadisticasQuery = `
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM pacientes) as total_pacientes,
        (SELECT COUNT(*) FROM citas_medicas) as total_citas,
        (SELECT COUNT(*) FROM citas_medicas WHERE estado = 'completada') as citas_completadas,
        (SELECT COUNT(*) FROM citas_medicas WHERE estado IN ('programada', 'confirmada')) as citas_pendientes,
        (SELECT COALESCE(SUM(m.tarifa_consulta), 0) 
         FROM citas_medicas c 
         JOIN medicos m ON c.medico_id = m.id 
         WHERE c.estado = 'completada') as ingresos_totales
    `

    const result = await pool.query(estadisticasQuery)
    const estadisticas = result.rows[0]

    // Convertir strings a números
    const estadisticasFormateadas = {
      total_usuarios: Number.parseInt(estadisticas.total_usuarios),
      total_pacientes: Number.parseInt(estadisticas.total_pacientes),
      total_citas: Number.parseInt(estadisticas.total_citas),
      citas_completadas: Number.parseInt(estadisticas.citas_completadas),
      citas_pendientes: Number.parseInt(estadisticas.citas_pendientes),
      ingresos_totales: Number.parseFloat(estadisticas.ingresos_totales),
    }

    return NextResponse.json({ estadisticas: estadisticasFormateadas })
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
