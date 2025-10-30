// app/api/citas/medico/route.ts - NUEVO (completar el que tienes)
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "medico") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") || "completada";

    client = await pool.connect();

    // Obtener ID del médico
    const medicoResult = await client.query(
      "SELECT id FROM medicos WHERE id_usuario = $1",
      [usuario.id]
    );

    if (medicoResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Médico no encontrado" },
        { status: 404 }
      );
    }

    const medicoId = medicoResult.rows[0].id;

    // Consulta para obtener citas con información del paciente
    const query = `
      SELECT 
        c.id,
        c.fecha_cita,
        c.motivo_consulta,
        c.estado,
        c.tipo_cita,
        p.id as paciente_id,
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        p.dni,
        p.fecha_nacimiento,
        EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) as paciente_edad,
        p.sexo,
        p.tipo_sangre
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios up ON p.id_usuario = up.id
      WHERE c.id_medico = $1 
        AND c.estado = $2
        AND NOT EXISTS (
          SELECT 1 FROM recetas r WHERE r.id_cita = c.id
        )
      ORDER BY c.fecha_cita DESC
    `;

    const result = await client.query(query, [medicoId, estado]);

    const citas = result.rows.map((cita) => ({
      ...cita,
      paciente_edad: parseInt(cita.paciente_edad) || 0,
    }));

    return NextResponse.json({
      success: true,
      citas: citas,
      total: citas.length,
    });
  } catch (error: any) {
    console.error("Error obteniendo citas del médico:", error);
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
