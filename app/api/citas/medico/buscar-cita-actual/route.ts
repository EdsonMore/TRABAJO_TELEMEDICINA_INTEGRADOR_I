// /app/api/citas/medico/buscar-cita-actual/route.ts - VERSIÓN CORREGIDA
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

// Función para convertir fecha de UTC a Perú - MEJORADA
function convertirFechaUTCAPeru(fechaUTC: string | Date): string {
  try {
    let fechaStr: string;

    // Si es Date, convertir a string ISO
    if (fechaUTC instanceof Date) {
      fechaStr = fechaUTC.toISOString().split("T")[0];
    } else {
      fechaStr = fechaUTC;
    }

    // Si ya está en formato YYYY-MM-DD, verificar validez
    if (fechaStr.includes("-") && !fechaStr.includes("T")) {
      const fecha = new Date(fechaStr + "T00:00:00Z");
      if (isNaN(fecha.getTime())) {
        console.warn("⚠️ Fecha inválida, retornando fecha actual:", fechaStr);
        return new Date().toISOString().split("T")[0];
      }
      return fechaStr;
    }

    // Parsear y convertir
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) {
      console.warn(
        "⚠️ No se pudo parsear fecha, retornando fecha actual:",
        fechaStr
      );
      return new Date().toISOString().split("T")[0];
    }

    const offsetPeru = -5 * 60 * 60 * 1000;
    return new Date(fecha.getTime() + offsetPeru)
      .toISOString()
      .split("T")[0];
  } catch (error) {
    console.error("❌ Error en convertirFechaUTCAPeru:", error);
    return new Date().toISOString().split("T")[0];
  }
}

export async function POST(request: NextRequest) {
  try {
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

      // Obtener hora actual en Perú (UTC-5)
      const ahora = new Date();
      const horaPeruMs = ahora.getTime() - (5 * 60 * 60 * 1000);
      const horaPeruActual = new Date(horaPeruMs);
      const horaActualStr = horaPeruActual
        .toISOString()
        .split("T")[1]
        .slice(0, 5);
      const fechaActualStr = horaPeruActual
        .toISOString()
        .split("T")[0];

      console.log(
        "📅 Buscando cita para fecha:",
        fechaActualStr,
        "hora actual:",
        horaActualStr
      );

      // ✅ ARREGLADO: Buscar cita por fecha y hora más cercana a la hora actual
      const citaResult = await client.query(
        `SELECT 
          c.*,
          u.nombre as paciente_nombre,
          u.apellido as paciente_apellido,
          p.dni as paciente_dni,
          p.fecha_nacimiento,
          p.tipo_sangre,
          p.alergias,
          m.numero_colegiatura,
          um.nombre as medico_nombre,
          um.apellido as medico_apellido
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id
        JOIN usuarios u ON p.id_usuario = u.id
        JOIN medicos m ON c.id_medico = m.id
        JOIN usuarios um ON m.id_usuario = um.id
        WHERE c.id_medico = $1 
          AND c.estado IN ('en_curso', 'confirmada', 'programada')
          AND c.tipo_cita = 'virtual'
          AND DATE(c.fecha_cita) = $2
        ORDER BY ABS(EXTRACT(EPOCH FROM (c.hora_cita::time - $3::time))) ASC
        LIMIT 1`,
        [medicoIdReal, fechaActualStr, horaActualStr]
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

      // ✅ CORREGIR: Convertir fecha a Perú
      cita.fecha_cita = convertirFechaUTCAPeru(cita.fecha_cita);

      console.log("✅ Cita encontrada:", {
        id: cita.id,
        fecha_convertida: cita.fecha_cita,
        paciente: cita.paciente_nombre,
        medico: cita.medico_nombre,
        hora: cita.hora_cita,
      });

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
