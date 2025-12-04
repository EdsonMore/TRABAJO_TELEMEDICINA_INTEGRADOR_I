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
    console.log('🔍 Token recibido en API:', token.substring(0, 20) + '...')
    
    const payload = await verificarToken(token)
    console.log('🔍 Payload decodificado:', payload)

    if (!payload) {
      console.log('❌ Payload es null')
      return NextResponse.json({ message: "Token inválido" }, { status: 401 })
    }

    console.log('🔍 Rol del usuario:', payload.rol)
    
    if (payload.rol !== "administrador") {
      console.log('❌ Rol no es administrador:', payload.rol)
      return NextResponse.json({ message: "Acceso no autorizado. Solo administradores pueden acceder" }, { status: 403 })
    }

    const client = await pool.connect()

    try {
      // Obtener TODAS las métricas en una sola consulta
      const query = `
        SELECT
          -- Métrica 1: Usuarios Registrados
          (SELECT COUNT(*) FROM usuarios WHERE activo = true) as total_usuarios,
          (SELECT COUNT(*) FROM usuarios WHERE rol = 'paciente' AND activo = true) as total_pacientes,
          (SELECT COUNT(*) FROM usuarios WHERE rol = 'medico' AND activo = true) as total_medicos,
          (SELECT COUNT(*) FROM usuarios WHERE rol = 'farmacia' AND activo = true) as total_farmacias,
          (SELECT COUNT(*) FROM usuarios WHERE rol = 'laboratorio' AND activo = true) as total_laboratorios,

          -- Métrica 2: Citas Médicas
          (SELECT COUNT(*) FROM citas) as total_citas,
          (SELECT COUNT(*) FROM citas WHERE estado = 'completada') as citas_completadas,
          (SELECT COUNT(*) FROM citas WHERE estado = 'programada') as citas_pendientes,
          (SELECT COUNT(*) FROM citas WHERE estado = 'cancelada') as citas_canceladas,
          (SELECT COUNT(*) FROM citas WHERE estado = 'no_asistio') as citas_no_show,
          (SELECT COUNT(*) FROM citas WHERE DATE(fecha_cita) = CURRENT_DATE) as citas_hoy,
          (SELECT COUNT(*) FROM citas 
            WHERE DATE(fecha_cita) = CURRENT_DATE AND estado = 'programada') as citas_hoy_pendientes,

          -- Métrica 3: Recetas Electrónicas
          (SELECT COUNT(*) FROM recetas) as total_recetas,
          (SELECT COUNT(*) FROM recetas WHERE estado_envio = 'no_enviada') as recetas_no_enviadas,
          (SELECT COUNT(*) FROM recetas WHERE estado_envio = 'enviada') as recetas_enviadas,
          (SELECT COUNT(*) FROM recetas WHERE estado_envio = 'recibida') as recetas_recibidas,
          (SELECT COUNT(*) FROM recetas WHERE estado_envio = 'en_proceso') as recetas_en_proceso,
          (SELECT COUNT(*) FROM recetas WHERE estado_envio = 'dispensada') as recetas_dispensadas,
          (SELECT COUNT(*) FROM recetas WHERE estado_envio = 'rechazada') as recetas_rechazadas,

          -- Métrica 4: Transacciones de Medicamentos
          (SELECT COALESCE(SUM(total), 0) FROM boletas_despacho) as ingresos_totales,
          (SELECT COUNT(*) FROM boletas_despacho) as total_transacciones,
          (SELECT COUNT(*) FROM boletas_despacho WHERE estado = 'generada') as transacciones_entregadas,
          (SELECT COUNT(*) FROM boletas_despacho WHERE estado IS NULL) as transacciones_pendientes,
          (SELECT COALESCE(SUM(total), 0) FROM boletas_despacho 
            WHERE DATE(fecha_despacho) = CURRENT_DATE) as ingresos_hoy,
          (SELECT COALESCE(AVG(total), 0) FROM boletas_despacho) as ticket_promedio,

          -- Métrica 5: Satisfacción de Pacientes
          (SELECT COUNT(*) FROM evaluaciones WHERE calificacion IS NOT NULL) as evaluaciones_totales,
          (SELECT COALESCE(ROUND(AVG(calificacion)::numeric, 2), 0) 
            FROM evaluaciones WHERE calificacion IS NOT NULL) as satisfaccion_promedio,
          (SELECT COUNT(*) FROM evaluaciones WHERE calificacion >= 4 AND calificacion IS NOT NULL) as evaluaciones_positivas,
          (SELECT COUNT(*) FROM evaluaciones WHERE calificacion < 3 AND calificacion IS NOT NULL) as evaluaciones_negativas,

          -- Métricas Adicionales
          (SELECT COUNT(*) FROM resultados_laboratorio) as total_solicitudes_laboratorio,
          (SELECT COUNT(*) FROM resultados_laboratorio WHERE anormal = false) as solicitudes_completadas,
          (SELECT COUNT(*) FROM resultados_laboratorio WHERE anormal = true) as solicitudes_pendientes,
          (SELECT COUNT(*) FROM resultados_laboratorio WHERE DATE(fecha_resultado) = CURRENT_DATE) as solicitudes_hoy;
      `

      const result = await client.query(query)
      const metrics = result.rows[0]

      // Calcular porcentajes y datos derivados
      const estadisticas = {
        // Usuarios
        usuarios: {
          total: parseInt(metrics.total_usuarios),
          pacientes: parseInt(metrics.total_pacientes),
          medicos: parseInt(metrics.total_medicos),
          farmacias: parseInt(metrics.total_farmacias),
          laboratorios: parseInt(metrics.total_laboratorios)
        },

        // Citas
        citas: {
          total: parseInt(metrics.total_citas),
          completadas: parseInt(metrics.citas_completadas),
          pendientes: parseInt(metrics.citas_pendientes),
          canceladas: parseInt(metrics.citas_canceladas),
          no_show: parseInt(metrics.citas_no_show),
          hoy: parseInt(metrics.citas_hoy),
          hoy_pendientes: parseInt(metrics.citas_hoy_pendientes),
          tasa_completacion: metrics.total_citas > 0 
            ? Math.round((metrics.citas_completadas / metrics.total_citas) * 100)
            : 0
        },

        // Recetas
        recetas: {
          total: parseInt(metrics.total_recetas),
          no_enviadas: parseInt(metrics.recetas_no_enviadas),
          enviadas: parseInt(metrics.recetas_enviadas),
          recibidas: parseInt(metrics.recetas_recibidas),
          en_proceso: parseInt(metrics.recetas_en_proceso),
          dispensadas: parseInt(metrics.recetas_dispensadas),
          rechazadas: parseInt(metrics.recetas_rechazadas),
          tasa_dispensacion: metrics.total_recetas > 0
            ? Math.round((metrics.recetas_dispensadas / metrics.total_recetas) * 100)
            : 0
        },

        // Transacciones
        transacciones: {
          total: parseInt(metrics.total_transacciones),
          ingresos_totales: parseFloat(metrics.ingresos_totales),
          transacciones_entregadas: parseInt(metrics.transacciones_entregadas),
          transacciones_pendientes: parseInt(metrics.transacciones_pendientes),
          ingresos_hoy: parseFloat(metrics.ingresos_hoy),
          ticket_promedio: parseFloat(metrics.ticket_promedio),
          tasa_entrega: metrics.total_transacciones > 0
            ? Math.round((metrics.transacciones_entregadas / metrics.total_transacciones) * 100)
            : 0
        },

        // Satisfacción
        satisfaccion: {
          evaluaciones_totales: parseInt(metrics.evaluaciones_totales),
          promedio: parseFloat(metrics.satisfaccion_promedio),
          positivas: parseInt(metrics.evaluaciones_positivas),
          negativas: parseInt(metrics.evaluaciones_negativas),
          tasa_respuesta: metrics.total_citas > 0
            ? Math.round((metrics.evaluaciones_totales / metrics.total_citas) * 100)
            : 0
        },

        // Laboratorio
        laboratorio: {
          solicitudes_totales: parseInt(metrics.total_solicitudes_laboratorio),
          completadas: parseInt(metrics.solicitudes_completadas),
          pendientes: parseInt(metrics.solicitudes_pendientes),
          hoy: parseInt(metrics.solicitudes_hoy),
          tasa_completacion: metrics.total_solicitudes_laboratorio > 0
            ? Math.round((metrics.solicitudes_completadas / metrics.total_solicitudes_laboratorio) * 100)
            : 0
        },

        // Timestamp
        timestamp: new Date().toISOString(),
        periodo: 'todo_tiempo'
      }

      return NextResponse.json({ estadisticas }, { status: 200 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
