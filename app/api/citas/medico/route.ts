// app/api/citas/medico/route.ts - 
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

// Función para convertir fecha de UTC a Perú
function convertirFechaUTCAPeru(fechaUTC: string): string {
  try {
    // Si ya es una fecha válida, convertir directamente
    const fecha = new Date(fechaUTC);
    if (isNaN(fecha.getTime())) {
      // Si no es válida, intentar parsearlo como YYYY-MM-DD
      return fechaUTC;
    }
    // Convertir a Perú (UTC-5)
    const offsetPeru = -5 * 60 * 60 * 1000;
    return new Date(fecha.getTime() + offsetPeru).toISOString().split("T")[0];
  } catch (e) {
    return fechaUTC;
  }
}

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
        c.hora_cita,
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

    // ✅ CORREGIR: Convertir fechas UTC a Perú
    const citas = result.rows.map((cita) => ({
      ...cita,
      fecha_cita: convertirFechaUTCAPeru(cita.fecha_cita), // ✅ CONVERTIR FECHA
      paciente_edad: parseInt(cita.paciente_edad) || 0,
    }));

    console.log(
      "📅 Citas del médico después de conversión:",
      citas.map((c) => ({
        id: c.id,
        fecha_original: cita.fecha_cita,
        fecha_convertida: c.fecha_cita,
        paciente: c.paciente_nombre,
      }))
    );

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
