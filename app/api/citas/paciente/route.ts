// App/api/citas/paciente/route.ts - VERSIÓN CORREGIDA
import { NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

// Función para obtener fecha actual en timezone de Perú
function getFechaActualPeru(): Date {
  const ahora = new Date();
  // Perú está en UTC-5
  const offsetPeru = -5 * 60 * 60 * 1000; // milisegundos para UTC-5
  return new Date(ahora.getTime() + offsetPeru);
}

// Función para convertir fecha a formato Perú
function convertirFechaAPeru(fecha: string): string {
  const fechaObj = new Date(fecha + "T00:00:00-05:00");
  return fechaObj.toISOString().split("T")[0];
}

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
    e.nombre AS especialidad
  FROM citas c
  JOIN medicos m ON c.id_medico = m.id
  JOIN usuarios u ON m.id_usuario = u.id
  JOIN especialidades e ON m.id_especialidad = e.id
  WHERE c.id_paciente = (SELECT id FROM pacientes WHERE id_usuario = $1)
  ORDER BY c.fecha_cita DESC, c.hora_cita DESC
  `,
      [usuario.id]
    );

    // Estadísticas de citas - CORREGIDO: usar fecha actual Perú
    const fechaHoyPeru = getFechaActualPeru().toISOString().split("T")[0];

    const estadisticasResult = await pool.query(
      `
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN estado = 'completada' THEN 1 END) AS completadas,
        COUNT(CASE WHEN estado = 'confirmada' AND fecha_cita >= $2 THEN 1 END) AS programadas,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) AS canceladas
      FROM citas
      WHERE id_paciente = (SELECT id FROM pacientes WHERE id_usuario = $1)
      `,
      [usuario.id, fechaHoyPeru]
    );

    // Próxima cita - CORREGIDO: usar fecha actual Perú
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
    e.nombre AS especialidad
  FROM citas c
  JOIN medicos m ON c.id_medico = m.id
  JOIN usuarios u ON m.id_usuario = u.id
  JOIN especialidades e ON m.id_especialidad = e.id
  WHERE c.id_paciente = (SELECT id FROM pacientes WHERE id_usuario = $1)
    AND c.estado = 'confirmada'
    AND c.fecha_cita >= $2
  ORDER BY c.fecha_cita ASC, c.hora_cita ASC
  LIMIT 1
  `,
      [usuario.id, fechaHoyPeru]
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
  const client = await pool.connect();

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

    const { medico_id, fecha_cita, hora_cita, tipo_cita, motivo_consulta, metodo_pago } =
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

    // ✅ VALIDACIÓN CRÍTICA: Verificar que la fecha no sea pasada
    // Parsear fecha local sin asumir timezone
    const [año, mes, día] = fecha_cita.split("-").map(Number);
    const fechaSeleccionada = new Date(año, mes - 1, día);
    
    // Obtener hoy en timezone Perú
    const ahora = new Date();
    const offsetPeru = -5 * 60 * 60 * 1000;
    const ahoraPeru = new Date(ahora.getTime() + offsetPeru);
    const stringHoyPeru = ahoraPeru.toISOString().split("T")[0];
    const [añoHoy, mesHoy, díaHoy] = stringHoyPeru.split("-").map(Number);
    const fechaHoy = new Date(añoHoy, mesHoy - 1, díaHoy);

    if (fechaSeleccionada < fechaHoy) {
      return NextResponse.json(
        { error: "No puedes agendar citas en fechas pasadas" },
        { status: 400 }
      );
    }

    // Formatear la hora de cita para la consulta
    let horaFormateada = hora_cita;

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

    // ✅ CORREGIDO: Convertir fecha a timezone Perú para la consulta
    const fechaCitaPeru = convertirFechaAPeru(fecha_cita);

    // ✅ Verificar disponibilidad
    const disponibilidadResult = await client.query(
      `SELECT COUNT(*) AS conflictos
       FROM citas
       WHERE id_medico = $1
         AND fecha_cita = $2
         AND hora_cita = $3
         AND estado IN ('confirmada', 'programada')`,
      [medico_id, fechaCitaPeru, horaFormateada]
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

    // ✅ Verificar que el médico existe Y obtener su tarifa
    const medicoResult = await client.query(
      "SELECT id, tarifa_consulta FROM medicos WHERE id = $1",
      [medico_id]
    );

    if (medicoResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Médico no encontrado" },
        { status: 404 }
      );
    }

    const medicoData = medicoResult.rows[0];
    let tarifaBase = parseFloat(medicoData.tarifa_consulta) || 80.0;

    // ✅ Calcular costo según tipo de cita
    let costoFinal = tarifaBase;
    if (tipoNormalizado === "virtual") {
      costoFinal = Math.max(tarifaBase - 20, 50);
    } else if (tipoNormalizado === "domicilio") {
      costoFinal = tarifaBase + 50;
    }

    console.log("Verificaciones completadas:", {
      paciente_id,
      medico_id,
      fecha_cita_original: fecha_cita,
      fecha_cita_peru: fechaCitaPeru,
      tarifa_base: tarifaBase,
      tipo_cita: tipoNormalizado,
      costo_final: costoFinal,
    });

    // ✅ Iniciar transacción
    await client.query("BEGIN");

    try {
      // ✅ CORREGIDO: Usar fecha convertida a Perú
      const citaResult = await client.query(
        `INSERT INTO citas (
     id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, 
     motivo_consulta, estado, pagado, costo, metodo_pago
   )
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
   RETURNING id, fecha_cita, hora_cita, tipo_cita, estado, pagado, costo, motivo_consulta, metodo_pago`,
        [
          paciente_id,
          medico_id,
          fechaCitaPeru, // ✅ USAR FECHA CORREGIDA
          horaFormateada,
          tipoNormalizado,
          motivo_consulta,
          "programada",
          false,
          costoFinal,
          metodo_pago || null, // ✅ AGREGADO: Guardar método de pago
        ]
      );

      const nuevaCita = citaResult.rows[0];
      console.log("Cita creada exitosamente:", nuevaCita);

      // ===== CREAR REGISTRO DE PAGO EN TABLA PAGOS =====
      try {
        const pagoResult = await client.query(
          `INSERT INTO pagos (usuario_id, entidad_tipo, entidad_id, monto, metodo_pago, estado)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [usuario.id, "cita", nuevaCita.id, costoFinal, metodo_pago || "pendiente", "pendiente"]
        );
        
        console.log("✅ Registro de pago creado:", {
          id: pagoResult.rows[0].id,
          citaId: nuevaCita.id,
          monto: costoFinal,
          metodo_pago: metodo_pago || "pendiente",
        });
      } catch (pagoError) {
        console.error("❌ Error al crear registro de pago:", pagoError);
        // No fallar la creación de cita si el pago falla
      }

      // ===== CREAR NOTIFICACIÓN PARA EL PACIENTE (DENTRO DE TRANSACCIÓN) =====
      try {
        const titulo = "📅 Nueva Cita Programada";
        const fechaObj = new Date(fechaCitaPeru + "T00:00:00");
        const fechaFormato = isNaN(fechaObj.getTime())
          ? fechaCitaPeru
          : fechaObj.toLocaleDateString("es-PE");

        const medicoNombre = await client.query(
          `SELECT u.nombre, u.apellido FROM medicos m 
           JOIN usuarios u ON m.id_usuario = u.id WHERE m.id = $1`,
          [medico_id]
        );

        const nombreMedico = medicoNombre.rows.length > 0
          ? `${medicoNombre.rows[0].nombre} ${medicoNombre.rows[0].apellido}`
          : "Su médico";

        const mensaje = `Tu cita con ${nombreMedico} está programada para ${fechaFormato} a las ${horaFormateada}`;

        const notifResult = await client.query(
          `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
           VALUES ($1, $2, $3, 'cita', $4, false, NOW())
           RETURNING id`,
          [usuario.id, titulo, mensaje, nuevaCita.id]
        );

        console.log("✅ Notificación de cita creada para paciente:", {
          id: notifResult.rows[0].id,
          titulo,
          usuarioId: usuario.id,
          citaId: nuevaCita.id,
        });

        // ===== MARCAR recordatorio_enviado = true =====
        const updateRecordatorioResult = await client.query(
          `UPDATE citas SET recordatorio_enviado = true WHERE id = $1 RETURNING id, recordatorio_enviado`,
          [nuevaCita.id]
        );

        console.log("✅ recordatorio_enviado actualizado:", {
          citaId: nuevaCita.id,
          recordatorio_enviado: updateRecordatorioResult.rows[0].recordatorio_enviado,
        });

        // ===== CREAR NOTIFICACIÓN PARA EL MÉDICO =====
        const medicoUserResult = await client.query(
          `SELECT id_usuario FROM medicos WHERE id = $1`,
          [medico_id]
        );

        if (medicoUserResult.rows.length > 0) {
          const medicoUserId = medicoUserResult.rows[0].id_usuario;
          const pacienteNombre = await client.query(
            `SELECT u.nombre FROM pacientes p 
             JOIN usuarios u ON p.id_usuario = u.id WHERE p.id = $1`,
            [paciente_id]
          );

          const nombrePaciente = pacienteNombre.rows.length > 0
            ? pacienteNombre.rows[0].nombre
            : "Un paciente";

          const tituloMedico = "📅 Nueva Cita Agendada";
          const mensajeMedico = `${nombrePaciente} ha agendado una cita para ${fechaFormato} a las ${horaFormateada}`;

          const notifMedicoResult = await client.query(
            `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
             VALUES ($1, $2, $3, 'cita', $4, false, NOW())
             RETURNING id`,
            [medicoUserId, tituloMedico, mensajeMedico, nuevaCita.id]
          );

          console.log("✅ Notificación de cita creada para médico:", {
            id: notifMedicoResult.rows[0].id,
            titulo: tituloMedico,
            usuarioId: medicoUserId,
            citaId: nuevaCita.id,
          });
        }
      } catch (notifError) {
        console.error("❌ Error al crear notificaciones:", notifError);
        // No fallar la creación de cita si las notificaciones fallan
      }

      // COMMIT después de crear notificaciones
      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          message: "Cita agendada correctamente",
          cita: nuevaCita,
        },
        { status: 201 }
      );
    } catch (insertError) {
      await client.query("ROLLBACK");
      console.error("Error en la inserción:", insertError);

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
    client.release();
  }
}
