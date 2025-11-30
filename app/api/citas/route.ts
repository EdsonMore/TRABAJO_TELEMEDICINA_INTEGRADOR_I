//App/api/citas/route.ts
// MediLink+ - API para gestión de citas médicas
// Permite crear, ver y actualizar citas médicas


import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"
import { verificarToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { id_medico, fecha_cita, hora_cita, motivo_consulta, tipo_cita } = await request.json()

    // Verificar autenticación
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const usuario = await verificarToken(token)
    if (!usuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Validar que el usuario sea paciente
    if (usuario.rol !== "paciente") {
      return NextResponse.json({ error: "Solo los pacientes pueden agendar citas" }, { status: 403 })
    }

    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      // Obtener ID del paciente desde la tabla pacientes
      const pacienteQuery = `
        SELECT p.id as paciente_id
        FROM pacientes p
        JOIN usuarios u ON p.id_usuario = u.id
        WHERE u.id = $1
      `
      const pacienteResult = await client.query(pacienteQuery, [usuario.id])

      if (pacienteResult.rows.length === 0) {
        throw new Error("Perfil de paciente no encontrado")
      }

      const paciente_id = pacienteResult.rows[0].paciente_id

      // Verificar que el médico existe y está activo
      const medicoQuery = `
        SELECT m.id, u.nombre, u.apellido, e.nombre as especialidad 
        FROM medicos m
        JOIN usuarios u ON m.id_usuario = u.id
        JOIN especialidades e ON m.id_especialidad = e.id
        WHERE m.id = $1 AND u.activo = true
      `
      const medicoResult = await client.query(medicoQuery, [id_medico])

      if (medicoResult.rows.length === 0) {
        throw new Error("Médico no encontrado o no disponible")
      }

      // Verificar disponibilidad del horario
      const disponibilidadQuery = `
        SELECT id FROM citas 
        WHERE id_medico = $1 
          AND fecha_cita = $2 
          AND hora_cita = $3
          AND estado NOT IN ('cancelada', 'no_asistio')
      `
      const disponibilidadResult = await client.query(disponibilidadQuery, [id_medico, fecha_cita, hora_cita])

      if (disponibilidadResult.rows.length > 0) {
        throw new Error("El horario seleccionado no está disponible")
      }

      // Crear la cita médica
      const insertQuery = `
        INSERT INTO citas (
          id_paciente, 
          id_medico, 
          fecha_cita, 
          hora_cita,
          tipo_cita,
          motivo_consulta, 
          estado,
          fecha_creacion
        ) VALUES ($1, $2, $3, $4, $5, $6, 'programada', CURRENT_TIMESTAMP)
        RETURNING *
      `

      const result = await client.query(insertQuery, [
        paciente_id,
        id_medico,
        fecha_cita,
        hora_cita,
        tipo_cita || "presencial",
        motivo_consulta,
      ])

      const citaCreada = result.rows[0];
      const nombreMedico = `${medicoResult.rows[0].nombre} ${medicoResult.rows[0].apellido}`;

      console.log("✅ Cita creada:", { citaId: citaCreada.id, nombreMedico });

      // ===== CREAR NOTIFICACIÓN DIRECTAMENTE EN LA BD =====
      try {
        const titulo = "📅 Nueva Cita Programada";
        const fechaObj = new Date(fecha_cita + "T00:00:00");
        const fechaFormato = isNaN(fechaObj.getTime()) 
          ? fecha_cita 
          : fechaObj.toLocaleDateString("es-PE");
        
        const mensaje = `Tu cita con ${nombreMedico} está programada para ${fechaFormato} a las ${hora_cita}`;

        // Obtener usuario_id del paciente
        const usuarioIdResult = await client.query(
          `SELECT id_usuario FROM pacientes WHERE id = $1`,
          [paciente_id]
        );

        if (usuarioIdResult.rows.length > 0) {
          const usuarioId = usuarioIdResult.rows[0].id_usuario;

          // Insertar notificación en la BD
          const notifResult = await client.query(
            `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
             VALUES ($1, $2, $3, 'cita', $4, false, NOW())
             RETURNING id`,
            [usuarioId, titulo, mensaje, citaCreada.id]
          );

          console.log("✅ Notificación creada en BD:", {
            id: notifResult.rows[0].id,
            titulo,
            usuarioId,
            citaId: citaCreada.id,
          });
        } else {
          console.warn("⚠️ No se encontró usuario_id para el paciente");
        }
      } catch (notifError) {
        console.error("❌ Error al crear notificación:", notifError);
        // No fallar la creación de cita si la notificación falla
      }

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        message: "Cita médica agendada exitosamente",
        cita: result.rows[0],
      })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error al crear cita:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const fecha_desde = searchParams.get("fecha_desde")
    const fecha_hasta = searchParams.get("fecha_hasta")

    // Verificar autenticación
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const usuario = await verificarToken(token)
    if (!usuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const client = await pool.connect()

    let query = ""
    let params: any[] = []

    if (usuario.rol === "paciente") {
      // Obtener citas del paciente
      query = `
        SELECT 
          c.*,
          u_medico.nombre || ' ' || u_medico.apellido as nombre_medico,
          e.nombre as especialidad,
          m.numero_colegiatura,
          u_medico.telefono as telefono_medico,
          m.tarifa_consulta
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id
        JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
        JOIN medicos m ON c.id_medico = m.id
        JOIN usuarios u_medico ON m.id_usuario = u_medico.id
        JOIN especialidades e ON m.id_especialidad = e.id
        WHERE u_paciente.id = $1
      `
      params = [usuario.id]
    } else if (usuario.rol === "medico") {
      // Obtener citas del médico
      query = `
        SELECT 
          c.*,
          u_paciente.nombre || ' ' || u_paciente.apellido as nombre_paciente,
          p.dni,
          u_paciente.telefono as telefono_paciente,
          p.fecha_nacimiento,
          p.tipo_sangre,
          p.alergias
        FROM citas c
        JOIN medicos m ON c.id_medico = m.id
        JOIN usuarios u_medico ON m.id_usuario = u_medico.id
        JOIN pacientes p ON c.id_paciente = p.id
        JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
        WHERE u_medico.id = $1
      `
      params = [usuario.id]
    } else {
      client.release()
      return NextResponse.json({ error: "Rol no autorizado" }, { status: 403 })
    }

    // Agregar filtros adicionales
    if (estado) {
      query += ` AND c.estado = $${params.length + 1}`
      params.push(estado)
    }

    if (fecha_desde) {
      query += ` AND c.fecha_cita >= $${params.length + 1}`
      params.push(fecha_desde)
    }

    if (fecha_hasta) {
      query += ` AND c.fecha_cita <= $${params.length + 1}`
      params.push(fecha_hasta)
    }

    query += ` ORDER BY c.fecha_cita ASC, c.hora_cita ASC`

    const result = await client.query(query, params)
    client.release()

    return NextResponse.json({
      success: true,
      citas: result.rows,
    })
  } catch (error) {
    console.error("Error al obtener citas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { cita_id, nuevo_estado, observaciones, diagnostico, tratamiento } = await request.json()

    // Verificar autenticación
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 })
    }

    const usuario = await verificarToken(token)
    if (!usuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      // Verificar que la cita existe y el usuario tiene permisos
      let verificacionQuery = ""
      if (usuario.rol === "paciente") {
        verificacionQuery = `
          SELECT c.*, u_paciente.id as usuario_id
          FROM citas c
          JOIN pacientes p ON c.id_paciente = p.id
          JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
          WHERE c.id = $1 AND u_paciente.id = $2
        `
      } else if (usuario.rol === "medico") {
        verificacionQuery = `
          SELECT c.*, u_medico.id as usuario_id
          FROM citas c
          JOIN medicos m ON c.id_medico = m.id
          JOIN usuarios u_medico ON m.id_usuario = u_medico.id
          WHERE c.id = $1 AND u_medico.id = $2
        `
      } else {
        throw new Error("Rol no autorizado")
      }

      const verificacionResult = await client.query(verificacionQuery, [cita_id, usuario.id])

      if (verificacionResult.rows.length === 0) {
        throw new Error("Cita no encontrada o sin permisos")
      }

      // Actualizar estado de la cita
      let updateQuery = `
        UPDATE citas 
        SET estado = $1, 
            fecha_actualizacion = CURRENT_TIMESTAMP
      `
      const updateParams = [nuevo_estado]

      if (observaciones) {
        updateQuery += `, observaciones_${usuario.rol === "medico" ? "medico" : "paciente"} = $${updateParams.length + 1}`
        updateParams.push(observaciones)
      }

      if (diagnostico && usuario.rol === "medico") {
        updateQuery += `, diagnostico = $${updateParams.length + 1}`
        updateParams.push(diagnostico)
      }

      if (tratamiento && usuario.rol === "medico") {
        updateQuery += `, tratamiento = $${updateParams.length + 1}`
        updateParams.push(tratamiento)
      }

      updateQuery += ` WHERE id = $${updateParams.length + 1} RETURNING *`
      updateParams.push(cita_id)

      const result = await client.query(updateQuery, updateParams)

      await client.query("COMMIT")

      return NextResponse.json({
        success: true,
        message: "Estado de cita actualizado correctamente",
        cita: result.rows[0],
      })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error al actualizar cita:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
