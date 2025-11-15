// app/api/paciente/recetas/route.ts
// MediLink+ - API para obtener recetas del paciente
// Endpoint que retorna todas las recetas con medicamentos y estado de dispensación

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verificarToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token de acceso requerido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verificarToken(token)

    if (!payload || payload.rol !== "paciente") {
      // Cuando verificarToken devuelve null puede ser por token inválido, mal formado o usuario no existente
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    // Obtener ID del paciente
    const pacienteResult = await query("SELECT id FROM pacientes WHERE id_usuario = $1", [payload.userId])

    if (pacienteResult.rows.length === 0) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }

    const pacienteId = pacienteResult.rows[0].id

    // Obtener todas las recetas del paciente con información completa
    // Nota: esta consulta es detallada y puede fallar si alguna tabla/columna
    // no existe en la BD. Hacemos un intento y, si falla, devolvemos una
    // consulta de respaldo más simple para evitar un 500 en el dashboard.
    let recetas: any[] = []
    try {
      const recetasResult = await query(
        `
      SELECT 
        r.*,
        c.fecha_cita, c.motivo_consulta, c.diagnostico,
        u.nombre as medico_nombre, u.apellido as medico_apellido,
        e.nombre as especialidad_nombre,
        f.nombre_comercial as farmacia_nombre
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios u ON m.id_usuario = u.id
      JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN farmacias f ON r.id_farmacia_dispensadora = f.id
      WHERE c.id_paciente = $1
      ORDER BY r.fecha_emision DESC
    `,
        [pacienteId],
      )

      // Para cada receta, obtener los medicamentos
      recetas = await Promise.all(
        recetasResult.rows.map(async (receta: any) => {
          const medicamentosResult = await query(
            `
          SELECT 
            rd.id as detalle_id, rd.cantidad, rd.dosis, rd.frecuencia, rd.duracion_dias, rd.via_administracion, rd.instrucciones_especiales, rd.dispensado,
            med.id as medicamento_id, med.codigo_digemid, med.nombre_comercial, med.nombre_generico, med.forma_farmaceutica, med.concentracion, med.laboratorio, med.principio_activo, med.categoria_terapeutica, med.contraindicaciones, med.efectos_secundarios
          FROM receta_detalle rd
          JOIN medicamentos med ON rd.medicamento_id = med.id
          WHERE rd.id_receta = $1
          ORDER BY med.nombre_comercial
        `,
            [receta.id],
          )

          return {
            id: receta.id,
            codigo_receta: receta.codigo_receta,
            fecha_emision: receta.fecha_emision,
            fecha_vencimiento: receta.fecha_vencimiento,
            estado: receta.estado,
            observaciones_generales: receta.observaciones_generales,
            total_estimado: receta.total_estimado,
            fecha_dispensacion: receta.fecha_dispensacion,
            cita: {
              fecha_cita: receta.fecha_cita,
              motivo_consulta: receta.motivo_consulta,
              diagnostico: receta.diagnostico,
            },
            medico: {
              nombre: receta.medico_nombre,
              apellido: receta.medico_apellido,
              especialidad: receta.especialidad_nombre,
            },
            farmacia_dispensadora: receta.farmacia_nombre,
            medicamentos: medicamentosResult.rows.map((med: any) => ({
              id: med.detalle_id,
              medicamento: {
                id: med.medicamento_id,
                codigo_digemid: med.codigo_digemid,
                nombre_comercial: med.nombre_comercial,
                nombre_generico: med.nombre_generico,
                presentacion: med.forma_farmaceutica,
                concentracion: med.concentracion,
                laboratorio: med.laboratorio,
                principio_activo: med.principio_activo,
                categoria: med.categoria_terapeutica,
                contraindicaciones: med.contraindicaciones,
                efectos_secundarios: med.efectos_secundarios,
              },
              cantidad: med.cantidad,
              dosis: med.dosis,
              duracion_dias: med.duracion_dias,
              instrucciones_especiales: med.instrucciones_especiales,
              dispensado: med.dispensado,
              cantidad_dispensada: null,
              precio_unitario: null,
              subtotal: null,
            })),
          }
        }),
      )
    } catch (innerError) {
      console.error("Consulta detallada de recetas falló, intentando respaldo:", innerError)
      // Consulta de respaldo: devolver datos mínimos para que el dashboard funcione
      try {
        const respaldo = await query(
          `SELECT r.id, r.codigo_receta, r.fecha_emision, r.fecha_vencimiento, r.estado
           FROM recetas r
           JOIN citas c ON r.id_cita = c.id
           WHERE c.id_paciente = $1
           ORDER BY r.fecha_emision DESC`,
          [pacienteId],
        )

        recetas = respaldo.rows.map((rec: any) => ({
          id: rec.id,
          codigo_receta: rec.codigo_receta,
          fecha_emision: rec.fecha_emision,
          fecha_vencimiento: rec.fecha_vencimiento,
          estado: rec.estado,
          medicamentos: [],
        }))
      } catch (respaldoError) {
        console.error("Consulta de respaldo también falló:", respaldoError)
        throw respaldoError
      }
    }

    // Estadísticas de recetas
    const estadisticas = {
      total: recetas.length,
      activas: recetas.filter((r) => r.estado === "activa").length,
      dispensadas: recetas.filter((r) => r.estado === "dispensada").length,
      vencidas: recetas.filter((r) => r.estado === "vencida").length,
      medicamentos_activos: recetas
        .filter((r: any) => r.estado === "activa")
        .reduce((total: number, r: any) => total + r.medicamentos.filter((m: any) => !m.dispensado).length, 0),
    }

    return NextResponse.json({
      recetas,
      estadisticas,
    })
  } catch (error) {
    console.error("Error obteniendo recetas del paciente:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
