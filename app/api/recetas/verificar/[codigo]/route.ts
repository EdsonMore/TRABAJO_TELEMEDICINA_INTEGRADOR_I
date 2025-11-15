// app/api/recetas/verificar/[codigo]/route.ts - NUEVO ARCHIVO
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  let client;
  try {
    const { codigo } = await params;

    if (!codigo) {
      return NextResponse.json(
        { error: "Código de receta requerido" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Consulta para verificar la receta
    const result = await client.query(
      `
      SELECT 
        r.*,
        -- Información del paciente
        p.id as paciente_id,
        p.dni,
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        -- Información del médico
        um.nombre as medico_nombre,
        um.apellido as medico_apellido,
        e.nombre as especialidad,
        -- Medicamentos
        COALESCE(
          json_agg(
            json_build_object(
              'id', rd.id,
              'medicamento_id', rd.medicamento_id,
              'nombre_comercial', med.nombre_comercial,
              'nombre_generico', med.nombre_generico,
              'forma_farmaceutica', med.forma_farmaceutica,
              'concentracion', med.concentracion,
              'cantidad', rd.cantidad,
              'dosis', rd.dosis,
              'frecuencia', rd.frecuencia,
              'duracion_dias', rd.duracion_dias,
              'via_administracion', rd.via_administracion,
              'instrucciones_especiales', rd.instrucciones_especiales,
              'dispensado', rd.dispensado
            ) ORDER BY rd.created_at
          ) FILTER (WHERE rd.id IS NOT NULL), '[]'
        ) as medicamentos
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios up ON p.id_usuario = up.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios um ON m.id_usuario = um.id
      JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
      LEFT JOIN medicamentos med ON rd.medicamento_id = med.id
      WHERE r.codigo_receta = $1
      GROUP BY r.id, p.id, up.id, m.id, um.id, e.id
      `,
      [codigo]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const receta = result.rows[0];

    // Verificar si la receta es válida
    const fechaVencimiento = new Date(receta.fecha_vencimiento);
    const hoy = new Date();
    const estaVencida = fechaVencimiento < hoy;
    const esActiva = receta.estado === "activa";
    const valida = esActiva && !estaVencida;

    let mensaje = "";
    if (!esActiva) {
      mensaje = "Receta no activa";
    } else if (estaVencida) {
      mensaje = "Receta vencida";
    } else {
      mensaje = "Receta válida y activa";
    }

    const recetaVerificada = {
      ...receta,
      valida,
      mensaje,
    };

    return NextResponse.json({
      success: true,
      receta: recetaVerificada,
    });
  } catch (error: any) {
    console.error("Error verificando receta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
