import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

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
    const sesionId = searchParams.get("sesion_id"); // NUEVO PARÁMETRO

    const client = await pool.connect();

    try {
      let query = "";
      let params: any[] = [];

      if (sesionId) {
        // 🔥 NUEVO: Buscar sesión específica por ID de sesión
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
          WHERE st.id = $1
        `;
        params = [sesionId];
      } else if (citaId) {
        // Buscar sesiones específicas por cita_id
        query = `
          SELECT st.*, c.fecha_cita, c.hora_cita, c.motivo_consulta,
                 u_paciente.nombre as paciente_nombre, u_paciente.apellido as paciente_apellido,
                 u_medico.nombre as medico_nombre, u_medico.apellido as medico_apellido
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
