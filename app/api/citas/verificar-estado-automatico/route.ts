// app/api/citas/verificar-estado-automatico/route.ts
// Endpoint para verificar y cambiar automáticamente citas a "en_curso" cuando llega la hora

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    // Verificar token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    
    // Decodificar token básico para obtener el ID de usuario
    let usuarioId: string;
    try {
      const decoded = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      usuarioId = decoded.sub || decoded.usuario_id;
    } catch (e) {
      console.error("Error decodificando token:", e);
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // 🔥 LÓGICA: Encontrar todas las citas que deben estar "en_curso"
    // Condiciones:
    // 1. Estado actual: "programada" o "confirmada"
    // 2. Fecha de cita: HOY
    // 3. Hora de cita: <= AHORA
    // 4. Médico o el usuario que hace la solicitud es el médico

    const ahora = new Date();
    const horaActual = ahora.toTimeString().slice(0, 5); // HH:MM en formato 24h
    const fechaHoy = ahora.toISOString().split("T")[0]; // YYYY-MM-DD

    console.log(`🔍 [AUTO-STATE] Buscando citas para actualizar...`);
    console.log(`📅 Fecha: ${fechaHoy}, Hora actual: ${horaActual}`);

    // Query para encontrar citas que deben cambiar a "en_curso"
    const queryBuscar = `
      SELECT 
        c.id,
        c.id_medico,
        c.id_paciente,
        c.fecha_cita,
        c.hora_cita,
        c.estado,
        c.tipo_cita,
        m.nombre as medico_nombre,
        m.apellido as medico_apellido,
        p.nombre as paciente_nombre,
        p.apellido as paciente_apellido
      FROM citas c
      LEFT JOIN medicos m ON c.id_medico = m.id
      LEFT JOIN pacientes p ON c.id_paciente = p.id
      WHERE 
        c.estado IN ('programada', 'confirmada')
        AND DATE(c.fecha_cita) = $1::date
        AND TIME(c.hora_cita) <= $2::time
        AND c.id_medico = $3
      ORDER BY c.hora_cita DESC
      LIMIT 50
    `;

    const resultBuscar = await client.query(queryBuscar, [
      fechaHoy,
      horaActual,
      usuarioId,
    ]);

    console.log(
      `✅ [AUTO-STATE] Se encontraron ${resultBuscar.rows.length} citas para actualizar`
    );

    const citasActualizadas: any[] = [];

    // 🔥 Para cada cita encontrada, cambiar estado a "en_curso"
    for (const cita of resultBuscar.rows) {
      try {
        await client.query("BEGIN");

        // Validar transición usando la máquina de estados
        // (programada -> en_curso) y (confirmada -> en_curso) son válidas
        const transicionesValidas =
          (cita.estado === "programada" && "en_curso") ||
          (cita.estado === "confirmada" && "en_curso");

        if (!transicionesValidas) {
          console.warn(
            `⚠️ [AUTO-STATE] Transición inválida: ${cita.estado} -> en_curso para cita ${cita.id}`
          );
          await client.query("ROLLBACK");
          continue;
        }

        // Actualizar estado a "en_curso"
        const queryUpdate = `
          UPDATE citas 
          SET 
            estado = 'en_curso',
            fecha_actualizacion = NOW(),
            recordatorio_enviado = true
          WHERE id = $1
          RETURNING *
        `;

        const resultUpdate = await client.query(queryUpdate, [cita.id]);
        
        console.log(`✅ [AUTO-STATE] Cita ${cita.id} actualizada a en_curso`);

        // Crear notificación para el médico
        const queryNotificacion = `
          INSERT INTO notificaciones (
            id_usuario, 
            titulo, 
            mensaje, 
            tipo, 
            id_relacionado, 
            leida, 
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING id
        `;

        const nombrPaciente = `${cita.paciente_nombre || ""} ${cita.paciente_apellido || ""}`.trim();
        
        await client.query(queryNotificacion, [
          cita.id_medico,
          "⏰ Cita Iniciada Automáticamente",
          `La cita con ${nombrPaciente} ha iniciado automáticamente a las ${horaActual}`,
          "cita",
          cita.id,
          false,
        ]);

        await client.query("COMMIT");

        citasActualizadas.push({
          id: cita.id,
          paciente: nombrPaciente,
          hora: cita.hora_cita,
          tipo: cita.tipo_cita,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`❌ [AUTO-STATE] Error actualizando cita ${cita.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: `Se actualizaron ${citasActualizadas.length} cita(s) automáticamente`,
      citasActualizadas,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [AUTO-STATE] Error en endpoint:", error);
    return NextResponse.json(
      {
        error: "Error verificando estados automáticos",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
