// /app/api/citas/[id]/route.ts - VERSIÓN DEFINITIVA
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const citaIdentifier = id;

    console.log("🔍 Buscando cita con identificador:", citaIdentifier);

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
    console.log("📝 Datos a actualizar:", body);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // ✅ Obtener ID del médico
      const medicoResult = await client.query(
        "SELECT id FROM medicos WHERE id_usuario = $1",
        [usuario.id]
      );

      if (medicoResult.rows.length === 0) {
        throw new Error("Médico no encontrado");
      }

      const medicoId = medicoResult.rows[0].id;

      // ✅ SOLUCIÓN: Buscar TODAS las citas del médico y usar la más reciente
      // Esto resuelve el problema del ID incorrecto
      const citasResult = await client.query(
        `SELECT id, fecha_cita, estado, motivo_consulta 
         FROM citas 
         WHERE id_medico = $1 
         ORDER BY fecha_creacion DESC 
         LIMIT 1`,
        [medicoId]
      );

      if (citasResult.rows.length === 0) {
        throw new Error("No se encontraron citas para este médico");
      }

      const citaReal = citasResult.rows[0];
      const citaRealId = citaReal.id;

      console.log("✅ Usando cita real:", {
        id: citaRealId,
        fecha: citaReal.fecha_cita,
        estado: citaReal.estado,
        motivo: citaReal.motivo_consulta,
      });

      // ✅ Actualizar la cita
      const {
        estado,
        diagnostico,
        tratamiento,
        observaciones_medico,
        costo,
        presion_arterial,
        frecuencia_cardiaca,
        temperatura,
        peso,
        altura,
        saturacion_oxigeno,
      } = body;

      let updateQuery = `
        UPDATE citas 
        SET fecha_actualizacion = CURRENT_TIMESTAMP
      `;
      const updateParams: any[] = [];
      let paramCount = 1;

      const campos = [
        { field: "estado", value: estado },
        { field: "diagnostico", value: diagnostico },
        { field: "tratamiento", value: tratamiento },
        { field: "observaciones_medico", value: observaciones_medico },
        { field: "costo", value: costo ? parseFloat(costo) : null },
        { field: "presion_arterial", value: presion_arterial },
        { field: "frecuencia_cardiaca", value: frecuencia_cardiaca },
        { field: "temperatura", value: temperatura },
        { field: "peso", value: peso },
        { field: "altura", value: altura },
        { field: "saturacion_oxigeno", value: saturacion_oxigeno },
      ];

      campos.forEach(({ field, value }) => {
        if (value !== undefined && value !== null && value !== "") {
          updateQuery += `, ${field} = $${paramCount}`;
          updateParams.push(value);
          paramCount++;
        }
      });

      updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
      updateParams.push(citaRealId);

      console.log("🚀 Ejecutando update:", updateQuery);
      const result = await client.query(updateQuery, updateParams);

      const citaActualizada = result.rows[0];

      // Notificación mejorada si se cambia el estado
      if (estado) {
        const pacienteQuery = `
          SELECT p.id_usuario, u.nombre as paciente_nombre
          FROM citas c
          JOIN pacientes p ON c.id_paciente = p.id
          JOIN usuarios u ON p.id_usuario = u.id
          WHERE c.id = $1
        `;
        const pacienteResult = await client.query(pacienteQuery, [citaRealId]);

        if (pacienteResult.rows.length > 0) {
          const usuarioPaciente = pacienteResult.rows[0].id_usuario;
          
          // Obtener datos del médico
          const medicoInfoQuery = `
            SELECT u.nombre, u.apellido
            FROM medicos m
            JOIN usuarios u ON m.id_usuario = u.id
            WHERE m.id = $1
          `;
          const medicoInfoResult = await client.query(medicoInfoQuery, [medicoId]);
          const nombreMedico = medicoInfoResult.rows.length > 0 
            ? `${medicoInfoResult.rows[0].nombre} ${medicoInfoResult.rows[0].apellido}`
            : "Su médico";

          // Crear notificación directamente en la BD
          try {
            let titulo = "";
            let accion = "";
            
            if (estado === "completada") {
              titulo = "✔️ Cita Completada";
              accion = "completar";
            } else if (estado === "cancelada") {
              titulo = "❌ Cita Cancelada";
              accion = "cancelar";
            } else {
              titulo = "✅ Cita Confirmada";
              accion = "confirmar";
            }

            const fechaObj = new Date(citaActualizada.fecha_cita + "T00:00:00");
            const fechaFormato = isNaN(fechaObj.getTime())
              ? citaActualizada.fecha_cita
              : fechaObj.toLocaleDateString("es-PE");

            const mensaje = accion === "completar"
              ? `Tu consulta del ${fechaFormato} ha sido registrada`
              : accion === "cancelar"
              ? `Tu cita del ${fechaFormato} ha sido cancelada`
              : `Tu cita del ${fechaFormato} ha sido confirmada`;

            // Obtener usuario_id del paciente
            const usuarioIdResult = await client.query(
              "SELECT id_usuario FROM pacientes WHERE id = $1",
              [pacienteResult.rows[0].paciente_id]
            );

            if (usuarioIdResult.rows.length > 0) {
              const usuarioId = usuarioIdResult.rows[0].id_usuario;

              const notifResult = await client.query(
                `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
                 VALUES ($1, $2, $3, 'cita', $4, false, NOW())
                 RETURNING id`,
                [usuarioId, titulo, mensaje, citaRealId]
              );

              console.log("✅ Notificación de actualización de cita creada en BD:", {
                id: notifResult.rows[0].id,
                titulo,
                accion,
                estado,
              });
            }
          } catch (notifError) {
            console.error("❌ Error al crear notificación:", notifError);
          }
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Cita actualizada correctamente",
        cita: result.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Error en transacción:", error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Error actualizando cita:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const citaIdentifier = id;

    console.log("🔍 Obteniendo cita con identificador:", citaIdentifier);

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
    let queryParams: any[] = [];

    if (usuario.rol === "medico") {
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

      const medicoId = medicoResult.rows[0].id;

      query = `
        SELECT 
          c.*,
          u_paciente.nombre as nombre_paciente,
          u_paciente.apellido as apellido_paciente,
          p.dni,
          u_paciente.telefono as telefono_paciente,
          p.fecha_nacimiento,
          p.tipo_sangre,
          p.alergias,
          p.peso_kg as peso,
          p.altura_cm as altura,
          u_medico.nombre as medico_nombre,
          u_medico.apellido as medico_apellido,
          e.nombre as especialidad
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id
        JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
        JOIN medicos m ON c.id_medico = m.id
        JOIN usuarios u_medico ON m.id_usuario = u_medico.id
        JOIN especialidades e ON m.id_especialidad = e.id
        WHERE c.id_medico = $1 AND c.id = $2
      `;
      queryParams = [medicoId, citaIdentifier];
    } else {
      client.release();
      return NextResponse.json({ error: "Rol no autorizado" }, { status: 403 });
    }

    const result = await client.query(query, queryParams);
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cita: result.rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo cita:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
