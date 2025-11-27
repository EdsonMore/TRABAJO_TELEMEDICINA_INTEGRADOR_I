// App/api/citas/disponibilidad/route.ts - VERSIÓN CORREGIDA
import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

// Función para convertir fecha a timezone Perú
function convertirFechaAPeru(fecha: string): string {
  const fechaObj = new Date(fecha + "T00:00:00-05:00");
  return fechaObj.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const medicoId = searchParams.get("medico_id");
    const fecha = searchParams.get("fecha");
    const especialidad = searchParams.get("especialidad");

    // Verificar autenticación
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const client = await pool.connect();
    let query = "";
    let params: any[] = [];

    if (medicoId && fecha) {
      const fechaPeru = convertirFechaAPeru(fecha);
      const hoyPeru = new Date().toLocaleString("en-US", {
        timeZone: "America/Lima",
      });
      const esHoy = fechaPeru === new Date(hoyPeru).toISOString().split("T")[0];

      // ✅ QUERY CORREGIDO - Filtrar horas pasadas si es hoy
      query = `
        WITH horarios_ocupados AS (
          SELECT EXTRACT(HOUR FROM hora_cita) as hora_ocupada
          FROM citas
          WHERE id_medico = $1
            AND fecha_cita = $2::date
            AND estado NOT IN ('cancelada', 'no_asistio')
        ),
        horarios_laborales AS (
          SELECT generate_series(8, 17) as hora
        ),
        horarios_filtrados AS (
          SELECT 
            hl.hora,
            CASE 
              WHEN ho.hora_ocupada IS NULL THEN true 
              ELSE false 
            END as disponible
          FROM horarios_laborales hl
          LEFT JOIN horarios_ocupados ho ON hl.hora = ho.hora_ocupada
          WHERE 
            -- ✅ SI ES HOY, EXCLUIR HORAS QUE YA PASARON
            NOT ($3 = true AND hl.hora <= EXTRACT(HOUR FROM CURRENT_TIME AT TIME ZONE 'America/Lima'))
        )
        SELECT * FROM horarios_filtrados
        ORDER BY hora
      `;
      params = [medicoId, fechaPeru, esHoy];
    } else if (especialidad) {
      query = `
        SELECT 
          m.id,
          u.nombre || ' ' || u.apellido AS nombre_completo,
          e.nombre AS especialidad,
          m.numero_colegiatura AS cmp,
          COUNT(c.id) AS citas_pendientes
        FROM medicos m
        JOIN usuarios u ON u.id = m.id_usuario
        JOIN especialidades e ON e.id = m.id_especialidad
        LEFT JOIN citas c ON m.id = c.id_medico 
          AND c.estado = 'programada' 
          AND c.fecha_cita >= CURRENT_DATE
        WHERE e.nombre ILIKE $1
        GROUP BY m.id, u.nombre, u.apellido, e.nombre, m.numero_colegiatura
        ORDER BY citas_pendientes ASC, nombre_completo ASC
      `;
      params = [`%${especialidad}%`];
    } else {
      query = `
        SELECT e.nombre AS especialidad, COUNT(*) as total_medicos
        FROM medicos m
        JOIN especialidades e ON e.id = m.id_especialidad
        GROUP BY e.nombre
        ORDER BY e.nombre
      `;
    }

    const result = await client.query(query, params);
    client.release();

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error al obtener disponibilidad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
