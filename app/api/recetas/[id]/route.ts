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
    // Validar token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const usuario = await verificarToken(token);

    if (!usuario) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de receta requerido" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // 🔥 QUERY COMPLETA PARA OBTENER TODOS LOS DATOS DE LA RECETA
    const result = await client.query(
      `
      SELECT 
        r.*,
        -- Información del paciente
        p.id as paciente_id,
        p.dni,
        p.tipo_sangre,
        p.sexo,
        p.fecha_nacimiento,
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) as paciente_edad,
        -- Información del médico
        m.id as medico_id,
        m.numero_colegiatura,
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
      WHERE r.id = $1
      GROUP BY r.id, p.id, up.id, m.id, um.id, e.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const receta = result.rows[0];

    // ✅ Verificar permisos: paciente solo puede ver sus recetas
    if (usuario.rol === "paciente") {
      if (receta.paciente_id !== usuario.userId) {
        return NextResponse.json(
          { error: "No tienes permisos para acceder a esta receta" },
          { status: 403 }
        );
      }
    }

    // ✅ Convertir medicamentos de string JSON a array
    let medicamentos = [];
    if (typeof receta.medicamentos === "string") {
      try {
        medicamentos = JSON.parse(receta.medicamentos);
      } catch (e) {
        medicamentos = [];
      }
    } else if (Array.isArray(receta.medicamentos)) {
      medicamentos = receta.medicamentos;
    }

    return NextResponse.json({
      receta: {
        ...receta,
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
