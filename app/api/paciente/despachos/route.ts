// app/api/paciente/despachos/route.ts
// Endpoint para que pacientes vean sus recetas en despacho
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const recetaId = searchParams.get("receta_id");

    client = await pool.connect();

    // Obtener ID del paciente
    const pacienteResult = await client.query(
      "SELECT id FROM pacientes WHERE id_usuario = $1",
      [usuario.id]
    );

    if (pacienteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const pacienteId = pacienteResult.rows[0].id;

    // Construir query para obtener recetas que han sido enviadas a farmacias (estado_envio != 'no_enviada')
    let query = `
      SELECT 
        r.id,
        r.codigo_receta,
        r.estado,
        r.estado_envio,
        f.nombre_comercial as farmacia_nombre,
        f.direccion as farmacia_direccion,
        f.horario_atencion as farmacia_horario,
        r.fecha_emision,
        r.fecha_dispensacion
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      LEFT JOIN farmacias f ON r.farmacia_seleccionada_id = f.id
      WHERE c.id_paciente = $1
        AND r.estado_envio != 'no_enviada'
    `;

    const params: any[] = [pacienteId];

    if (recetaId) {
      query += ` AND r.id = $2`;
      params.push(recetaId);
    }

    query += ` ORDER BY r.fecha_emision DESC LIMIT 50`;

    const result = await client.query(query, params);

    const despachos = result.rows.map((row) => ({
      id: row.id,
      codigo_receta: row.codigo_receta,
      estado: row.estado,
      estado_envio: row.estado_envio,
      farmacia_nombre: row.farmacia_nombre,
      farmacia_direccion: row.farmacia_direccion,
      farmacia_horario: row.farmacia_horario,
      fecha_emision: row.fecha_emision,
      fecha_dispensacion: row.fecha_dispensacion,
    }));

    return NextResponse.json({
      success: true,
      despachos,
    });
  } catch (error: any) {
    console.error("Error obteniendo despachos:", error);
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

export async function POST(request: NextRequest) {
  // Este endpoint actualmente no es utilizado
  // El flujo de envío de recetas se maneja directamente a través del endpoint
  // /api/recetas/[id]/enviar-farmacia
  return NextResponse.json(
    { error: "Este endpoint ha sido migrado. Use /api/recetas/[id]/enviar-farmacia en su lugar" },
    { status: 410 }
  );
}
