// app/api/recetas/[id]/route.ts - VERSIÓN CORREGIDA
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Cambiado a Promise
) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const usuario = await verificarToken(token);

    if (!usuario) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params; // ✅ AWAIT aquí

    if (!id) {
      return NextResponse.json(
        { error: "ID de receta requerido" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Consulta optimizada con la estructura REAL de tu BD
    const result = await client.query(
      `
      SELECT 
        r.*,
        -- Información del paciente
        p.id as paciente_id,
        p.dni,
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) as paciente_edad,
        p.tipo_sangre,
        -- Información del médico
        m.id as medico_id,
        um.nombre as medico_nombre,
        um.apellido as medico_apellido,
        m.numero_colegiatura,
        e.nombre as especialidad,
        -- Diagnóstico
        cie.codigo as codigo_cie10,
        cie.nombre as nombre_diagnostico,
        -- Farmacia
        f.nombre_comercial as farmacia_nombre,
        -- Detalle de medicamentos
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
      LEFT JOIN codigos_cie10 cie ON r.diagnostico_principal_id = cie.id
      LEFT JOIN farmacias f ON r.id_farmacia_dispensadora = f.id
      LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
      LEFT JOIN medicamentos med ON rd.medicamento_id = med.id
      WHERE r.id = $1
      GROUP BY r.id, p.id, up.id, m.id, um.id, e.id, cie.id, f.id
      `,
      [id] // ✅ Usar la variable desestructurada
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      receta: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error obteniendo receta:", error);
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
