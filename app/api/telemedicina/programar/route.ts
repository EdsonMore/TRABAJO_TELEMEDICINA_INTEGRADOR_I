// app/api/telemedicina/programar/route.ts - VERSIÓN COMPLETA CORREGIDA
import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

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

    const { id_cita, titulo, descripcion, fecha_programada, duracion_minutos } =
      await request.json();

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Verificar cita
      const citaResult = await client.query(
        `SELECT c.*, p.id as paciente_id, u_paciente.nombre as paciente_nombre, u_paciente.apellido as paciente_apellido
         FROM citas c
         JOIN pacientes p ON c.id_paciente = p.id
         JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
         JOIN medicos m ON c.id_medico = m.id
         JOIN usuarios u_medico ON m.id_usuario = u_medico.id
         WHERE c.id = $1 AND u_medico.id = $2`,
        [id_cita, usuario.id]
      );

      if (citaResult.rows.length === 0) {
        throw new Error("Cita no encontrada");
      }

      const cita = citaResult.rows[0];

      // Generar código único
      const codigo_acceso = `GM${Date.now()
        .toString(36)
        .slice(-8)}`.toUpperCase();

      const enlace_reunion = `/telemedicina/sesion/${cita.id}`;

      // Crear sesión en la base de datos
      const resultSesion = await client.query(
        `INSERT INTO sesiones_telemedicina 
         (id_cita, id_medico, id_paciente, titulo, descripcion, fecha_programada, 
          duracion_minutos, enlace_reunion, codigo_acceso, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'programada')
         RETURNING *`,
        [
          id_cita,
          cita.id_medico,
          cita.paciente_id,
          titulo,
          descripcion,
          fecha_programada,
          duracion_minutos || 30,
          enlace_reunion,
          codigo_acceso,
        ]
      );

      const sesion = resultSesion.rows[0];

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        sesion: sesion,
        message: "✅ Sesión de Google Meet creada exitosamente",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error en transacción:", error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error al programar telemedicina:", error);
    return NextResponse.json(
      {
        error: error.message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const citaId = searchParams.get("cita_id");
    const sesionId = searchParams.get("sesion_id");

    const client = await pool.connect();

    try {
      let query = "";
      let params: any[] = [];

      if (sesionId) {
        // 🔥 QUERY CORREGIDA - Incluir IDs de usuario para verificación de permisos
        query = `
          SELECT 
            st.*, 
            c.fecha_cita, 
            c.hora_cita, 
            c.motivo_consulta,
            c.tipo_cita,
            c.estado as estado_cita,
            u_paciente.id as usuario_paciente_id,  -- 🔥 CRÍTICO: ID de usuario del paciente
            u_paciente.nombre as paciente_nombre, 
            u_paciente.apellido as paciente_apellido,
            u_medico.id as usuario_medico_id,      -- 🔥 CRÍTICO: ID de usuario del médico
            u_medico.nombre as medico_nombre, 
            u_medico.apellido as medico_apellido,
            p.id as paciente_id,
            m.id as medico_id
          FROM sesiones_telemedicina st
          JOIN citas c ON st.id_cita = c.id
          JOIN pacientes p ON st.id_paciente = p.id
          JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
          JOIN medicos m ON st.id_medico = m.id
          JOIN usuarios u_medico ON m.id_usuario = u_medico.id
          WHERE st.id = $1
        `;
        params = [sesionId];
      } else if (citaId) {
        // Buscar sesiones específicas por cita_id
        query = `
          SELECT 
            st.*, 
            c.fecha_cita, 
            c.hora_cita, 
            c.motivo_consulta,
            u_paciente.id as usuario_paciente_id,  -- 🔥 Agregar también aquí
            u_paciente.nombre as paciente_nombre, 
            u_paciente.apellido as paciente_apellido,
            u_medico.id as usuario_medico_id,      -- 🔥 Agregar también aquí
            u_medico.nombre as medico_nombre, 
            u_medico.apellido as medico_apellido
          FROM sesiones_telemedicina st
          JOIN citas c ON st.id_cita = c.id
          JOIN pacientes p ON st.id_paciente = p.id
          JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
          JOIN medicos m ON st.id_medico = m.id
          JOIN usuarios u_medico ON m.id_usuario = u_medico.id
          WHERE st.id_cita = $1
        `;
        params = [citaId];
      } else if (usuario.rol === "paciente") {
        query = `
          SELECT 
            st.*, 
            c.fecha_cita, 
            c.hora_cita, 
            c.motivo_consulta,
            u_medico.id as usuario_medico_id,      -- 🔥 Agregar también aquí
            u_medico.nombre as medico_nombre, 
            u_medico.apellido as medico_apellido,
            e.nombre as especialidad
          FROM sesiones_telemedicina st
          JOIN citas c ON st.id_cita = c.id
          JOIN pacientes p ON st.id_paciente = p.id
          JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
          JOIN medicos m ON st.id_medico = m.id
          JOIN usuarios u_medico ON m.id_usuario = u_medico.id
          JOIN especialidades e ON m.id_especialidad = e.id
          WHERE u_paciente.id = $1
          ORDER BY st.fecha_programada DESC
        `;
        params = [usuario.id];
      } else if (usuario.rol === "medico") {
        query = `
          SELECT 
            st.*, 
            c.fecha_cita, 
            c.hora_cita, 
            c.motivo_consulta,
            u_paciente.id as usuario_paciente_id,  -- 🔥 Agregar también aquí
            u_paciente.nombre as paciente_nombre, 
            u_paciente.apellido as paciente_apellido,
            p.dni as paciente_dni
          FROM sesiones_telemedicina st
          JOIN citas c ON st.id_cita = c.id
          JOIN medicos m ON st.id_medico = m.id
          JOIN usuarios u_medico ON m.id_usuario = u_medico.id
          JOIN pacientes p ON st.id_paciente = p.id
          JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
          WHERE u_medico.id = $1
          ORDER BY st.fecha_programada DESC
        `;
        params = [usuario.id];
      }

      const result = await client.query(query, params);

      // 🔥 DEBUG: Ver qué datos se están devolviendo
      console.log("🔍 DEBUG API Sesiones:", {
        sesionId,
        citaId,
        rol: usuario.rol,
        usuarioId: usuario.id,
        resultados: result.rows.map((r) => ({
          id: r.id,
          usuario_paciente_id: r.usuario_paciente_id,
          usuario_medico_id: r.usuario_medico_id,
          id_paciente: r.id_paciente,
          id_medico: r.id_medico,
        })),
      });

      return NextResponse.json({
        success: true,
        sesiones: result.rows,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Error obteniendo sesiones:", error);
    return NextResponse.json(
      {
        error: error.message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
