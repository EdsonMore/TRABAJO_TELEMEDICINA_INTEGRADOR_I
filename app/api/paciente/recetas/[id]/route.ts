// app/api/paciente/recetas/[id]/route.ts
// Devuelve la receta detallada para el paciente autenticado

import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verificarToken } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 401 })

    const usuario = await verificarToken(token)
    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 })
    }

    const { id } = await params

    // Obtener receta con paciente, médico, diagnóstico y medicamentos en una sola consulta
    const recetaRes = await query(
      `SELECT r.id, r.codigo_receta, r.fecha_emision, r.fecha_vencimiento, r.estado, r.observaciones, r.fecha_dispensacion, r.id_farmacia_dispensadora,
              r.diagnostico_principal_texto as diagnostico,
              p.id as id_paciente, p.dni, p.fecha_nacimiento,
              up.nombre as paciente_nombre, up.apellido as paciente_apellido,
              m.id as id_medico, um.nombre as medico_nombre, um.apellido as medico_apellido, esp.nombre as especialidad,
              -- Agrupar medicamentos como JSON
              COALESCE(json_agg(json_build_object(
                'id', rd.id,
                'medicamento', json_build_object('id', med.id, 'nombre_comercial', med.nombre_comercial, 'nombre_generico', med.nombre_generico, 'forma_farmaceutica', med.forma_farmaceutica),
                'cantidad', rd.cantidad,
                'dosis', rd.dosis,
                'frecuencia', rd.frecuencia,
                'duracion_dias', rd.duracion_dias,
                'instrucciones_especiales', rd.instrucciones_especiales,
                'dispensado', rd.dispensado
              ) ORDER BY med.nombre_comercial) FILTER (WHERE rd.id IS NOT NULL), '[]') as medicamentos
       FROM recetas r
       JOIN citas c ON r.id_cita = c.id
       JOIN pacientes p ON c.id_paciente = p.id
       JOIN usuarios up ON p.id_usuario = up.id
       JOIN medicos m ON c.id_medico = m.id
       JOIN usuarios um ON m.id_usuario = um.id
       LEFT JOIN especialidades esp ON m.id_especialidad = esp.id
       LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
       LEFT JOIN medicamentos med ON rd.medicamento_id = med.id
       WHERE r.id = $1
       GROUP BY r.id, p.id, up.id, m.id, um.id, esp.id`,
      [id]
    )

    if (recetaRes.rows.length === 0) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 })
    }

    const recetaRow = recetaRes.rows[0]

    // Verificar permisos: el paciente propietario debe coincidir con el usuario autenticado
    if (recetaRow.id_paciente) {
      const pacientePropietario = await query("SELECT id_usuario FROM pacientes WHERE id = $1", [recetaRow.id_paciente])
      if (pacientePropietario.rows.length > 0) {
        const idUsuarioPaciente = pacientePropietario.rows[0].id_usuario
        if (idUsuarioPaciente !== usuario.id) {
          return NextResponse.json({ error: "No tienes permiso para ver esta receta" }, { status: 403 })
        }
      }
    }

    const edad = recetaRow.fecha_nacimiento ? Math.floor((new Date().getTime() - new Date(recetaRow.fecha_nacimiento).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : null

    const result = {
      receta: {
        id: recetaRow.id,
        codigo_receta: recetaRow.codigo_receta,
        fecha_emision: recetaRow.fecha_emision,
        fecha_vencimiento: recetaRow.fecha_vencimiento,
        estado: recetaRow.estado,
        diagnostico: recetaRow.diagnostico || recetaRow.diagnostico_principal_texto || null,
        observaciones_generales: recetaRow.observaciones,
        fecha_dispensacion: recetaRow.fecha_dispensacion,
        farmacia_dispensadora: recetaRow.id_farmacia_dispensadora,
        paciente: {
          id: recetaRow.id_paciente,
          nombre: recetaRow.paciente_nombre,
          apellido: recetaRow.paciente_apellido,
          dni: recetaRow.dni,
          edad,
        },
        medicamentos: recetaRow.medicamentos || [],
        medico: recetaRow.medico_nombre
          ? { nombre: recetaRow.medico_nombre, apellido: recetaRow.medico_apellido, especialidad: recetaRow.especialidad }
          : null,
      }
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error("Error obteniendo detalle de receta:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
