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
      // Obtener todas las estadísticas para el reporte
      const query = `
        SELECT
          -- Usuarios
          (SELECT COUNT(*) FROM usuarios WHERE activo = true) as total_usuarios,
          (SELECT COUNT(*) FROM usuarios WHERE rol = 'paciente' AND activo = true) as total_pacientes,
          (SELECT COUNT(*) FROM usuarios WHERE rol = 'medico' AND activo = true) as total_medicos,
          
          -- Citas
          (SELECT COUNT(*) FROM citas) as total_citas,
          (SELECT COUNT(*) FROM citas WHERE estado = 'completada') as citas_completadas,
          (SELECT COUNT(*) FROM citas WHERE estado = 'programada') as citas_pendientes,
          
          -- Recetas
          (SELECT COUNT(*) FROM recetas) as total_recetas,
          (SELECT COUNT(*) FROM recetas WHERE estado_envio = 'dispensada') as recetas_dispensadas,
          
          -- Transacciones
          (SELECT COALESCE(SUM(total), 0) FROM boletas_despacho) as ingresos_totales,
          (SELECT COUNT(*) FROM boletas_despacho) as total_transacciones,
          
          -- Satisfacción
          (SELECT COALESCE(ROUND(AVG(calificacion)::numeric, 2), 0) FROM evaluaciones WHERE calificacion IS NOT NULL) as satisfaccion_promedio,
          (SELECT COUNT(*) FROM evaluaciones WHERE calificacion IS NOT NULL) as evaluaciones_totales
      `

      const result = await client.query(query)
      const data = result.rows[0]

      // Generar datos para el reporte
      const reportData = {
        fecha_generacion: new Date().toLocaleString('es-PE'),
        periodo: 'Reporte Completo del Sistema',
        metricas_clave: {
          usuarios_registrados: {
            total: parseInt(data.total_usuarios),
            pacientes: parseInt(data.total_pacientes),
            medicos: parseInt(data.total_medicos),
            descripcion: 'Número total de usuarios activos en el sistema'
          },
          citas_medicas: {
            total: parseInt(data.total_citas),
            completadas: parseInt(data.citas_completadas),
            pendientes: parseInt(data.citas_pendientes),
            tasa_completacion: data.total_citas > 0 ? Math.round((data.citas_completadas / data.total_citas) * 100) : 0,
            descripcion: 'Volumen de citas médicas y su estado'
          },
          recetas_electronicas: {
            total: parseInt(data.total_recetas),
            dispensadas: parseInt(data.recetas_dispensadas),
            tasa_dispensacion: data.total_recetas > 0 ? Math.round((data.recetas_dispensadas / data.total_recetas) * 100) : 0,
            descripcion: 'Volumen de recetas electrónicas procesadas'
          },
          transacciones_medicamentos: {
            total_transacciones: parseInt(data.total_transacciones),
            ingresos_totales: parseFloat(data.ingresos_totales),
            ingreso_promedio: data.total_transacciones > 0 ? (parseFloat(data.ingresos_totales) / parseInt(data.total_transacciones)).toFixed(2) : 0,
            descripcion: 'Transacciones de compra de medicamentos'
          },
          satisfaccion_pacientes: {
            promedio: parseFloat(data.satisfaccion_promedio),
            evaluaciones_totales: parseInt(data.evaluaciones_totales),
            descripcion: 'Nivel de satisfacción de los pacientes (0-5)'
          }
        },
        timestamp: new Date().toISOString()
      }

      return NextResponse.json(reportData, { status: 200 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error generando reporte:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
