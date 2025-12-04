// app/api/recetas/[id]/route.ts
// GET - Obtener receta completa con detalles del médico y medicamentos

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  try {
    // Obtener ID de receta
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de receta requerido" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // 🔥 QUERY COMPLETA - Obtener receta + paciente + médico + medicamentos
    const recetaResult = await client.query(
      `
      SELECT 
        r.*,
        p.id as paciente_id,
        p.dni,
        p.tipo_sangre,
        p.sexo,
        p.fecha_nacimiento,
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) as paciente_edad,
        m.id as medico_id,
        m.numero_colegiatura,
        um.nombre as medico_nombre,
        um.apellido as medico_apellido,
        e.nombre as especialidad,
        COALESCE(f.nombre_comercial, fd.nombre_comercial) as farmacia_nombre,
        COALESCE(f.id, fd.id) as farmacia_id
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios up ON p.id_usuario = up.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios um ON m.id_usuario = um.id
      JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN farmacias f ON r.farmacia_seleccionada_id = f.id
      LEFT JOIN farmacias fd ON r.id_farmacia_dispensadora = fd.id
      WHERE r.id = $1
      `,
      [id]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const recetaData = recetaResult.rows[0];

    // Obtener medicamentos por separado
    const medicamentosResult = await client.query(
      `
      SELECT 
        rd.id,
        rd.medicamento_id,
        med.nombre_comercial,
        med.nombre_generico,
        med.forma_farmaceutica,
        med.concentracion,
        rd.cantidad,
        rd.dosis,
        rd.frecuencia,
        rd.duracion_dias,
        rd.via_administracion,
        rd.instrucciones_especiales,
        rd.dispensado
      FROM receta_detalle rd
      LEFT JOIN medicamentos med ON rd.medicamento_id = med.id
      WHERE rd.id_receta = $1
      ORDER BY rd.created_at
      `,
      [id]
    );

    const medicamentos = medicamentosResult.rows;

    return NextResponse.json({
      receta: {
        ...recetaData,
        medicamentos,
      },
    });
  } catch (error: any) {
    console.error("Error obteniendo receta completa:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        detalles:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
