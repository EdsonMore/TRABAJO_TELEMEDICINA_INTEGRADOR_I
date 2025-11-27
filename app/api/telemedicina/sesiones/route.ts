// app/api/telemedicina/sesiones/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

// ✅ Helper para validar UUID
function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
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
    let citaId = searchParams.get("cita_id");
    let sesionId = searchParams.get("sesion_id");
    let codigoAcceso = searchParams.get("codigo_acceso");

    const client = await pool.connect();

    try {
      let query = "";
      let params: any[] = [];

      // 🔥 PRIORIDAD 1: BUSCAR POR CÓDIGO DE ACCESO (string válido siempre)
      if (codigoAcceso) {
        console.log("🔍 Buscando por codigo_acceso:", codigoAcceso);
        query = `
          SELECT 
            st.*, 
            c.fecha_cita, 
            c.hora_cita, 
            c.motivo_consulta,
            c.tipo_cita,
            c.estado as estado_cita,
            u_paciente.nombre as paciente_nombre, 
            u_paciente.apellido as paciente_apellido,
            u_paciente.id as usuario_paciente_id,
            u_medico.nombre as medico_nombre, 
            u_medico.apellido as medico_apellido,
            u_medico.id as usuario_medico_id,
            p.id as paciente_id,
            m.id as medico_id
          FROM sesiones_telemedicina st
          JOIN citas c ON st.id_cita = c.id
          JOIN pacientes p ON st.id_paciente = p.id
          JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
          JOIN medicos m ON st.id_medico = m.id
          JOIN usuarios u_medico ON m.id_usuario = u_medico.id
          WHERE st.codigo_acceso = $1
        `;
        params = [codigoAcceso];
      }
      // 🔥 PRIORIDAD 2: BUSCAR POR ID DE CITA (validar UUID primero)
      else if (citaId && isValidUUID(citaId)) {
        console.log("🔍 Buscando por id_cita UUID:", citaId);
        query = `
          SELECT 
            st.*, 
            c.fecha_cita, 
            c.hora_cita, 
            c.motivo_consulta,
            c.tipo_cita,
            c.estado as estado_cita,
            u_paciente.nombre as paciente_nombre, 
            u_paciente.apellido as paciente_apellido,
            u_paciente.id as usuario_paciente_id,
            u_medico.nombre as medico_nombre, 
            u_medico.apellido as medico_apellido,
            u_medico.id as usuario_medico_id,
            p.id as paciente_id,
            m.id as medico_id
          FROM sesiones_telemedicina st
          JOIN citas c ON st.id_cita = c.id
          JOIN pacientes p ON st.id_paciente = p.id
          JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
          JOIN medicos m ON st.id_medico = m.id
          JOIN usuarios u_medico ON m.id_usuario = u_medico.id
          WHERE st.id_cita = $1::uuid
        `;
        params = [citaId];
      }
      // 🔥 PRIORIDAD 3: BUSCAR POR ID DE SESIÓN (validar UUID primero)
      else if (sesionId && isValidUUID(sesionId)) {
        console.log("🔍 Buscando por sesion_id UUID:", sesionId);
        query = `
          SELECT 
            st.*, 
            c.fecha_cita, 
            c.hora_cita, 
            c.motivo_consulta,
            c.tipo_cita,
            c.estado as estado_cita,
            u_paciente.nombre as paciente_nombre, 
            u_paciente.apellido as paciente_apellido,
            u_paciente.id as usuario_paciente_id,
            u_medico.nombre as medico_nombre, 
            u_medico.apellido as medico_apellido,
            u_medico.id as usuario_medico_id,
            p.id as paciente_id,
            m.id as medico_id
          FROM sesiones_telemedicina st
          JOIN citas c ON st.id_cita = c.id
          JOIN pacientes p ON st.id_paciente = p.id
          JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
          JOIN medicos m ON st.id_medico = m.id
          JOIN usuarios u_medico ON m.id_usuario = u_medico.id
          WHERE st.id = $1::uuid
        `;
        params = [sesionId];
      }
      // 🔥 PRIORIDAD 4: Si sesionId no es UUID válido, intentar como codigo_acceso
      else if (sesionId) {
        console.log("⚠️ sesion_id NO es UUID, intentando como codigo_acceso:", sesionId);
        query = `
          SELECT 
            st.*, 
            c.fecha_cita, 
            c.hora_cita, 
            c.motivo_consulta,
            c.tipo_cita,
            c.estado as estado_cita,
            u_paciente.nombre as paciente_nombre, 
            u_paciente.apellido as paciente_apellido,
            u_paciente.id as usuario_paciente_id,
            u_medico.nombre as medico_nombre, 
            u_medico.apellido as medico_apellido,
            u_medico.id as usuario_medico_id,
            p.id as paciente_id,
            m.id as medico_id
          FROM sesiones_telemedicina st
          JOIN citas c ON st.id_cita = c.id
          JOIN pacientes p ON st.id_paciente = p.id
          JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
          JOIN medicos m ON st.id_medico = m.id
          JOIN usuarios u_medico ON m.id_usuario = u_medico.id
          WHERE st.codigo_acceso = $1
        `;
        params = [sesionId];
      }
      // 🔥 PRIORIDAD 5: Si citaId no es UUID válido, intentar como codigo_acceso
      else if (citaId) {
        console.log("⚠️ cita_id NO es UUID, intentando como codigo_acceso:", citaId);
        query = `
          SELECT 
            st.*, 
            c.fecha_cita, 
            c.hora_cita, 
            c.motivo_consulta,
            c.tipo_cita,
            c.estado as estado_cita,
            u_paciente.nombre as paciente_nombre, 
            u_paciente.apellido as paciente_apellido,
            u_paciente.id as usuario_paciente_id,
            u_medico.nombre as medico_nombre, 
            u_medico.apellido as medico_apellido,
            u_medico.id as usuario_medico_id,
            p.id as paciente_id,
            m.id as medico_id
          FROM sesiones_telemedicina st
          JOIN citas c ON st.id_cita = c.id
          JOIN pacientes p ON st.id_paciente = p.id
          JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
          JOIN medicos m ON st.id_medico = m.id
          JOIN usuarios u_medico ON m.id_usuario = u_medico.id
          WHERE st.codigo_acceso = $1
        `;
        params = [citaId];
      }
      // 🔥 PRIORIDAD 6: Si no hay parámetros, buscar por rol del usuario
      else if (usuario.rol === "paciente") {
        query = `
          SELECT st.*, c.fecha_cita, c.hora_cita, c.motivo_consulta,
                 u_medico.nombre as medico_nombre, u_medico.apellido as medico_apellido,
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
          SELECT st.*, c.fecha_cita, c.hora_cita, c.motivo_consulta,
                 u_paciente.nombre as paciente_nombre, u_paciente.apellido as paciente_apellido,
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

      if (!query) {
        return NextResponse.json(
          { error: "No se especificaron parámetros de búsqueda válidos" },
          { status: 400 }
        );
      }

      console.log("🔍 Query:", query.substring(0, 100), "... | Params:", params);
      const result = await client.query(query, params);

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
