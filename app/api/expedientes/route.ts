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
    const paciente_id = searchParams.get("paciente_id");

    if (!paciente_id) {
      return NextResponse.json(
        { error: "ID de paciente requerido" },
        { status: 400 }
      );
    }

    // Verificar acceso según el rol
    let tieneAcceso = false;
    let cita_id = null;

    if (usuario.rol === "paciente") {
      // El paciente solo puede ver su propio expediente
      const pacienteResult = await pool.query(
        "SELECT id FROM pacientes WHERE id = $1 AND usuario_id = $2",
        [paciente_id, usuario.id]
      );
      tieneAcceso = pacienteResult.rows.length > 0;
    } else if (
      usuario.rol === "medico" ||
      usuario.rol === "farmacia" ||
      usuario.rol === "laboratorio"
    ) {
      // Verificar que tenga una cita programada con el paciente
      let tabla_usuario = "";
      if (usuario.rol === "medico") tabla_usuario = "medicos";
      else if (usuario.rol === "farmacia") tabla_usuario = "farmacias";
      else if (usuario.rol === "laboratorio") tabla_usuario = "laboratorios";

      const citaResult = await pool.query(
        `
        SELECT c.id
        FROM citas c
        JOIN ${tabla_usuario} t ON c.${usuario.rol}_id = t.id
        WHERE c.paciente_id = $1 AND t.usuario_id = $2 
        AND c.fecha_cita >= CURRENT_DATE - INTERVAL '30 days'
        AND c.estado IN ('programada', 'completada')
        ORDER BY c.fecha_cita DESC
        LIMIT 1
      `,
        [paciente_id, usuario.id]
      );

      if (citaResult.rows.length > 0) {
        tieneAcceso = true;
        cita_id = citaResult.rows[0].id;
      }
    } else if (usuario.rol === "admin") {
      tieneAcceso = true;
    }

    if (!tieneAcceso) {
      return NextResponse.json(
        {
          error:
            "No tiene autorización para acceder a este expediente. Debe tener una cita programada con el paciente.",
        },
        { status: 403 }
      );
    }

    // Obtener el expediente médico
    const expedienteResult = await pool.query(
      `
      SELECT e.*, 
             p.nombres, p.apellidos, p.fecha_nacimiento, p.genero, p.telefono,
             u.documento_identidad, u.email
      FROM expedientes_medicos e
      JOIN pacientes p ON e.paciente_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE e.paciente_id = $1
    `,
      [paciente_id]
    );

    let expediente = null;
    if (expedienteResult.rows.length > 0) {
      expediente = expedienteResult.rows[0];
    } else {
      // Crear expediente si no existe
      const numeroExpediente = `EXP-${Date.now()}-${paciente_id}`;
      const nuevoExpedienteResult = await pool.query(
        `
        INSERT INTO expedientes_medicos (paciente_id, numero_expediente, historial_medico)
        VALUES ($1, $2, '{}')
        RETURNING *
      `,
        [paciente_id, numeroExpediente]
      );

      expediente = nuevoExpedienteResult.rows[0];
    }

    // Registrar el acceso
    await pool.query(
      `
      INSERT INTO accesos_expedientes (expediente_id, usuario_id, cita_id, tipo_acceso, ip_acceso, motivo)
      VALUES ($1, $2, $3, 'lectura', $4, 'Consulta de expediente médico')
    `,
      [expediente.id, usuario.id, cita_id, request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "0.0.0.0"]
    );

    // Obtener historial de citas
    const citasResult = await pool.query(
      `
      SELECT c.*, m.nombres as medico_nombres, m.apellidos as medico_apellidos, m.especialidad
      FROM citas c
      JOIN medicos m ON c.medico_id = m.id
      WHERE c.paciente_id = $1
      ORDER BY c.fecha_cita DESC
    `,
      [paciente_id]
    );

    // Obtener recetas
    const recetasResult = await pool.query(
      `
      SELECT r.*, m.nombres as medico_nombres, m.apellidos as medico_apellidos
      FROM recetas_digitales r
      JOIN medicos m ON r.medico_id = m.id
      WHERE r.paciente_id = $1
      ORDER BY r.fecha_emision DESC
    `,
      [paciente_id]
    );

    return NextResponse.json({
      expediente: {
        ...expediente,
        historial_medico: JSON.parse(expediente.historial_medico || "{}"),
        medicamentos_actuales: JSON.parse(
          expediente.medicamentos_actuales || "[]"
        ),
        cirugias_previas: JSON.parse(expediente.cirugias_previas || "[]"),
        contacto_emergencia: JSON.parse(expediente.contacto_emergencia || "{}"),
      },
      citas: citasResult.rows,
      recetas: recetasResult.rows.map((r) => ({
        ...r,
        medicamentos: JSON.parse(r.medicamentos),
      })),
    });
  } catch (error) {
    console.error("Error obteniendo expediente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
