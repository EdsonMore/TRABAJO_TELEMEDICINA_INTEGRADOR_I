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

      console.log("📊 Sesiones encontradas:", result.rows.length);
      if (result.rows.length > 0) {
        console.log("📊 Primera sesión - Campos disponibles:", Object.keys(result.rows[0]));
        console.log("📊 Estado de sesión:", result.rows[0].estado);
      }

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

// 🔥 NUEVO: PUT endpoint para actualizar el estado de la sesión
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      console.error("❌ PUT /api/telemedicina/sesiones - Sin token");
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario) {
      console.error("❌ PUT /api/telemedicina/sesiones - Token inválido");
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    console.log("🔐 PUT /api/telemedicina/sesiones - Usuario autenticado:", {
      id: usuario.id,
      rol: usuario.rol,
      email: usuario.email,
    });

    const body = await request.json();
    const { sesionId, estado } = body;

    console.log("📝 Datos recibidos:", { sesionId, estado });

    if (!sesionId || !estado) {
      console.error("❌ Parámetros faltantes:", { sesionId, estado });
      return NextResponse.json(
        { error: "sesionId y estado son requeridos" },
        { status: 400 }
      );
    }

    // Validar que el estado sea válido
    const estadosValidos = ["programada", "iniciada", "completada", "cancelada"];
    if (!estadosValidos.includes(estado)) {
      console.error("❌ Estado inválido:", estado);
      return NextResponse.json(
        { error: `Estado inválido. Valores permitidos: ${estadosValidos.join(", ")}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Verificar que la sesión existe y que el usuario es el médico
      const sesionQuery = `
        SELECT st.*, u_medico.id as usuario_medico_id
        FROM sesiones_telemedicina st
        JOIN medicos m ON st.id_medico = m.id
        JOIN usuarios u_medico ON m.id_usuario = u_medico.id
        WHERE st.id = $1
      `;

      console.log("🔍 Buscando sesión:", sesionId);
      const sesionResult = await client.query(sesionQuery, [sesionId]);

      if (sesionResult.rows.length === 0) {
        console.error("❌ Sesión no encontrada:", sesionId);
        return NextResponse.json(
          { error: "Sesión no encontrada" },
          { status: 404 }
        );
      }

      const sesion = sesionResult.rows[0];
      console.log("✅ Sesión encontrada:", {
        id: sesion.id,
        estado_actual: sesion.estado,
        usuario_medico_id: sesion.usuario_medico_id,
      });

      // Validar que solo el médico pueda actualizar el estado
      if (usuario.rol !== "medico") {
        console.error("❌ Usuario no es médico. Rol:", usuario.rol);
        return NextResponse.json(
          { error: "No tienes permiso para actualizar esta sesión" },
          { status: 403 }
        );
      }

      if (sesion.usuario_medico_id !== usuario.id) {
        console.error("❌ Usuario no es el médico de esta sesión", {
          usuario_id: usuario.id,
          medico_id: sesion.usuario_medico_id,
        });
        return NextResponse.json(
          { error: "No tienes permiso para actualizar esta sesión" },
          { status: 403 }
        );
      }

      console.log("✅ Validaciones pasadas. Actualizando sesión...");

      // Actualizar estado
      let updateQuery = `
        UPDATE sesiones_telemedicina
        SET estado = $1
      `;
      let params: any[] = [estado];
      let paramCount = 2;

      // Si el estado es 'iniciada', registrar la hora de inicio
      if (estado === "iniciada") {
        updateQuery += `, fecha_inicio_real = CURRENT_TIMESTAMP`;
      }

      // Si el estado es 'completada', registrar la hora de fin
      if (estado === "completada") {
        updateQuery += `, fecha_fin_real = CURRENT_TIMESTAMP`;
      }

      updateQuery += ` WHERE id = $${paramCount}
        RETURNING *;
      `;
      params.push(sesionId);

      console.log("🔄 Ejecutando UPDATE:", {
        query: updateQuery.substring(0, 100) + "...",
        params: [estado, sesionId],
      });

      const updateResult = await client.query(updateQuery, params);

      if (updateResult.rows.length === 0) {
        console.error("❌ No se pudo actualizar la sesión");
        return NextResponse.json(
          { error: "No se pudo actualizar la sesión" },
          { status: 500 }
        );
      }

      const sesionActualizada = updateResult.rows[0];

      console.log(`✅ Sesión ${sesionId} actualizada a estado: ${estado}`, {
        estado_anterior: sesion.estado,
        estado_nuevo: sesionActualizada.estado,
        fecha_inicio_real: sesionActualizada.fecha_inicio_real,
      });

      return NextResponse.json({
        success: true,
        sesion: sesionActualizada,
        message: `Sesión actualizada a estado: ${estado}`,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Error actualizando sesión:", error.message);
    return NextResponse.json(
      {
        error: error.message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

