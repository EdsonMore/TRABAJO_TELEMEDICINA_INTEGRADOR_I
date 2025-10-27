//App/api/citas/paciente/route.ts
// MediLink+ - API para gestión de citas del paciente
// Permite crear, ver y gestionar citas médicas

import { NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Obtener citas del paciente - CON ESPECIALIDAD
    const citasResult = await pool.query(
      `
  SELECT 
    c.id,
    c.fecha_cita,
    c.hora_cita,
    c.tipo_cita,
    c.estado,
    c.motivo_consulta,
    c.diagnostico,
    c.tratamiento,
    c.observaciones_paciente AS observaciones,
    c.fecha_creacion AS created_at,
    u.nombre AS medico_nombre,
    u.apellido AS medico_apellido,
    m.numero_colegiatura,
    e.nombre AS especialidad  -- ✅ CAMBIAR: de especialidad_id a nombre
  FROM citas c
  JOIN medicos m ON c.id_medico = m.id
  JOIN usuarios u ON m.id_usuario = u.id
  JOIN especialidades e ON m.id_especialidad = e.id  -- ✅ NUEVO JOIN
  WHERE c.id_paciente = (SELECT id FROM pacientes WHERE id_usuario = $1)
  ORDER BY c.fecha_cita DESC, c.hora_cita DESC
  `,
      [usuario.id]
    );

    // Estadísticas de citas
    const estadisticasResult = await pool.query(
      `
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN estado = 'completada' THEN 1 END) AS completadas,
        COUNT(CASE WHEN estado = 'confirmada' AND fecha_cita >= CURRENT_DATE THEN 1 END) AS programadas,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) AS canceladas
      FROM citas
      WHERE id_paciente = (SELECT id FROM pacientes WHERE id_usuario = $1)
      `,
      [usuario.id]
    );

    // Próxima cita - CON ESPECIALIDAD
    const proximaCitaResult = await pool.query(
      `
  SELECT 
    c.id,
    c.fecha_cita,
    c.hora_cita,
    c.tipo_cita,
    c.motivo_consulta,
    u.nombre AS medico_nombre,
    u.apellido AS medico_apellido,
    e.nombre AS especialidad  -- ✅ AGREGAR ESTA LÍNEA
  FROM citas c
  JOIN medicos m ON c.id_medico = m.id
  JOIN usuarios u ON m.id_usuario = u.id
  JOIN especialidades e ON m.id_especialidad = e.id  -- ✅ AGREGAR ESTE JOIN
  WHERE c.id_paciente = (SELECT id FROM pacientes WHERE id_usuario = $1)
    AND c.estado = 'confirmada'
    AND c.fecha_cita >= CURRENT_DATE
  ORDER BY c.fecha_cita ASC, c.hora_cita ASC
  LIMIT 1
  `,
      [usuario.id]
    );

    return NextResponse.json({
      citas: citasResult.rows,
      estadisticas: {
        ...estadisticasResult.rows[0],
        proxima_cita: proximaCitaResult.rows[0] || null,
      },
    });
  } catch (error) {
    console.error("Error obteniendo citas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const client = await pool.connect(); // ✅ Obtener conexión al inicio

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    console.log("Body recibido:", body);

    const { medico_id, fecha_cita, hora_cita, tipo_cita, motivo_consulta } =
      body;

    // ✅ Validar datos requeridos
    if (
      !medico_id ||
      !fecha_cita ||
      !hora_cita ||
      !tipo_cita ||
      !motivo_consulta
    ) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Formatear la hora de cita para la consulta
    let horaFormateada = hora_cita;

    // Si es solo un número o string tipo "9" o "9:0", convertirlo
    if (!hora_cita.includes(":")) {
      horaFormateada = `${hora_cita.padStart(2, "0")}:00`;
    } else if (hora_cita.split(":")[1].length === 1) {
      const [h, m] = hora_cita.split(":");
      horaFormateada = `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
    }

    console.log("Datos a insertar:", {
      medico_id,
      fecha_cita,
      hora_cita,
      horaFormateada,
      tipo_cita,
      motivo_consulta,
      usuario_id: usuario.id,
    });

    // ✅ Verificar disponibilidad usando pool.query consistentemente
    const disponibilidadResult = await client.query(
      `SELECT COUNT(*) AS conflictos
       FROM citas
       WHERE id_medico = $1
         AND fecha_cita = $2
         AND hora_cita = $3
         AND estado IN ('confirmada', 'programada')`,
      [medico_id, fecha_cita, horaFormateada]
    );

    if (Number.parseInt(disponibilidadResult.rows[0].conflictos, 10) > 0) {
      return NextResponse.json(
        { error: "El horario seleccionado no está disponible" },
        { status: 400 }
      );
    }

    // Normalizar tipo de cita
    let tipoNormalizado: "presencial" | "virtual" | "domicilio";
    switch (tipo_cita?.toLowerCase()) {
      case "presencial":
      case "virtual":
      case "domicilio":
        tipoNormalizado = tipo_cita.toLowerCase() as any;
        break;
      default:
        return NextResponse.json(
          {
            error:
              "Tipo de cita inválido. Debe ser: presencial, virtual o domicilio",
          },
          { status: 400 }
        );
    }

    // ✅ Obtener id_paciente
    const pacienteResult = await client.query(
      "SELECT id FROM pacientes WHERE id_usuario = $1",
      [usuario.id]
    );

    if (pacienteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Paciente no encontrado. Complete su perfil primero." },
        { status: 404 }
      );
    }

    const paciente_id = pacienteResult.rows[0].id;

    // ✅ Verificar que el médico existe
    const medicoResult = await client.query(
      "SELECT id FROM medicos WHERE id = $1",
      [medico_id]
    );

    if (medicoResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Médico no encontrado" },
        { status: 404 }
      );
    }

    console.log("Verificaciones completadas:", {
      paciente_id,
      medico_id,
      medico_existe: medicoResult.rows.length > 0,
    });

    // ✅ Iniciar transacción
    await client.query("BEGIN");

    try {
      // ✅ Insertar cita
      // ✅ REEMPLAZAR la inserción de cita (línea ~180) con esta versión:
      const citaResult = await client.query(
        `INSERT INTO citas (
     id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, 
     motivo_consulta, estado, pagado, costo
   )
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
   RETURNING id, fecha_cita, hora_cita, tipo_cita, estado, pagado, costo, motivo_consulta`,
        [
          paciente_id,
          medico_id,
          fecha_cita,
          horaFormateada,
          tipoNormalizado,
          motivo_consulta,
          "programada", // ✅ Estado inicial
          false, // ✅ pagado = false (pendiente)
          80.0, // ✅ Costo por defecto
        ]
      );

      // ✅ Confirmar transacción
      await client.query("COMMIT");

      const nuevaCita = citaResult.rows[0];
      console.log("Cita creada exitosamente:", nuevaCita);

      return NextResponse.json(
        {
          success: true,
          message: "Cita agendada correctamente",
          cita: nuevaCita,
        },
        { status: 201 }
      );
    } catch (insertError) {
      // ✅ Revertir transacción en caso de error
      await client.query("ROLLBACK");
      console.error("Error en la inserción:", insertError);

      // ✅ Mensaje de error más específico
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Ya existe una cita en este horario" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Error al crear la cita: " + insertError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error general creando cita:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    // ✅ IMPORTANTE: Siempre liberar la conexión
    client.release();
  }
}
