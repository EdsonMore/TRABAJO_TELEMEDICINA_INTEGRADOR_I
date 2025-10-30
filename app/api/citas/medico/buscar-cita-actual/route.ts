// /app/api/citas/medico/buscar-cita-actual/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario || usuario.rol !== "medico") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const { roomId, medicoId } = body;

    console.log("🔍 Buscando cita actual para médico:", usuario.id);

    const client = await pool.connect();

    try {
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

      const medicoIdReal = medicoResult.rows[0].id;

      // Buscar la cita MÁS RECIENTE del médico que esté en estado "en_curso" o "confirmada"
      const citaResult = await client.query(
        `SELECT 
          c.*,
          u.nombre as paciente_nombre,
          u.apellido as paciente_apellido,
          p.dni as paciente_dni,
          p.fecha_nacimiento,
          p.tipo_sangre,
          p.alergias
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id
        JOIN usuarios u ON p.id_usuario = u.id
        WHERE c.id_medico = $1 
          AND c.estado IN ('en_curso', 'confirmada', 'programada')
          AND c.tipo_cita = 'virtual'
        ORDER BY c.fecha_creacion DESC
        LIMIT 1`,
        [medicoIdReal]
      );

      if (citaResult.rows.length === 0) {
        console.log("ℹ️ No se encontraron citas en curso para el médico");
        return NextResponse.json({
          success: true,
          cita: null,
          message: "No se encontró cita en curso",
        });
      }

      const cita = citaResult.rows[0];
      console.log("✅ Cita encontrada:", cita.id);

      return NextResponse.json({
        success: true,
        cita: cita,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Error buscando cita actual:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
