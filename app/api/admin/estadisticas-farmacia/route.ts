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
    const payload = await verificarToken(token)

    if (!payload || payload.rol !== "administrador") {
      return NextResponse.json({ message: "Acceso no autorizado" }, { status: 403 })
    }

    const client = await pool.connect()

    try {
      // Obtener estadísticas desglosadas por farmacia
      const query = `
        SELECT
          f.id as farmacia_id,
          f.nombre_comercial as nombre_farmacia,
          u.email as email_farmacia,
          COUNT(DISTINCT bd.id) as total_transacciones,
          COUNT(DISTINCT CASE WHEN DATE(bd.fecha_despacho) = CURRENT_DATE THEN bd.id END) as transacciones_hoy,
          COUNT(DISTINCT CASE WHEN bd.estado = 'generada' THEN bd.id END) as transacciones_entregadas,
          COUNT(DISTINCT CASE WHEN bd.estado IS NULL THEN bd.id END) as transacciones_pendientes,
          COALESCE(SUM(bd.total), 0) as ingresos_totales,
          COALESCE(SUM(CASE WHEN DATE(bd.fecha_despacho) = CURRENT_DATE THEN bd.total END), 0) as ingresos_hoy,
          COALESCE(AVG(bd.total), 0) as ticket_promedio,
          COALESCE(AVG(CASE WHEN DATE(bd.fecha_despacho) = CURRENT_DATE THEN bd.total END), 0) as ticket_promedio_hoy
        FROM farmacias f
        INNER JOIN usuarios u ON f.id_usuario = u.id
        LEFT JOIN boletas_despacho bd ON f.id = bd.id_farmacia
        WHERE u.rol = 'farmacia' AND u.activo = true
        GROUP BY f.id, f.nombre_comercial, u.email
        ORDER BY ingresos_totales DESC
      `

      const result = await client.query(query)
      const farmacias = result.rows

      // Calcular totales consolidados
      const totales = {
        total_farmacias: farmacias.length,
        total_transacciones_todas: farmacias.reduce((sum, f) => sum + parseInt(f.total_transacciones), 0),
        total_transacciones_hoy: farmacias.reduce((sum, f) => sum + parseInt(f.transacciones_hoy), 0),
        ingresos_totales_todas: farmacias.reduce((sum, f) => sum + parseFloat(f.ingresos_totales), 0),
        ingresos_totales_hoy: farmacias.reduce((sum, f) => sum + parseFloat(f.ingresos_hoy), 0),
        ticket_promedio_general: farmacias.length > 0 
          ? farmacias.reduce((sum, f) => sum + parseFloat(f.ingresos_totales), 0) / 
            (farmacias.reduce((sum, f) => sum + parseInt(f.total_transacciones), 0) || 1)
          : 0
      }

      // Formatear datos
      const farmaciasProcesadas = farmacias.map(f => ({
        farmacia_id: f.farmacia_id,
        nombre_farmacia: f.nombre_farmacia,
        email_farmacia: f.email_farmacia,
        total_transacciones: parseInt(f.total_transacciones),
        transacciones_hoy: parseInt(f.transacciones_hoy),
        transacciones_entregadas: parseInt(f.transacciones_entregadas),
        transacciones_pendientes: parseInt(f.transacciones_pendientes),
        ingresos_totales: parseFloat(f.ingresos_totales),
        ingresos_hoy: parseFloat(f.ingresos_hoy),
        ticket_promedio: parseFloat(f.ticket_promedio),
        ticket_promedio_hoy: parseFloat(f.ticket_promedio_hoy)
      }))

      return NextResponse.json({ 
        farmacias: farmaciasProcesadas,
        totales
      }, { status: 200 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error obteniendo estadísticas por farmacia:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
