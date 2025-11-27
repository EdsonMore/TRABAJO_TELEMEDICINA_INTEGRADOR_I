// app/api/pacientes/[id]/route.ts - Obtener datos completos de un paciente (para médicos)
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  try {
    const { id } = await params;

    console.log("🔍 GET /api/pacientes/[id] - ID solicitado:", id);

    // ===== VERIFICAR AUTENTICACIÓN =====
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo médicos pueden acceder a estos datos
    if (usuario.rol !== "medico") {
      return NextResponse.json(
        { error: "Solo médicos pueden ver datos de pacientes" },
        { status: 403 }
      );
    }

    client = await pool.connect();

    // ===== VALIDAR QUE EL USUARIO ES MÉDICO =====
    const medicoResult = await client.query(
      "SELECT id FROM medicos WHERE id_usuario = $1",
      [usuario.id]
    );

    if (medicoResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: "Médico no encontrado" },
        { status: 404 }
      );
    }

    const medicoId = medicoResult.rows[0].id;
    console.log("✅ Médico encontrado - ID:", medicoId);

    // ===== OBTENER DATOS COMPLETOS DEL PACIENTE =====
    // Primero intentar buscar por p.id (paciente ID)
    let pacienteResult = await client.query(
      `SELECT 
    p.id,
    p.id_usuario,
    u.nombre,
    u.apellido,
    u.email,
    u.telefono,
    u.avatar_url,
    p.dni,
    p.fecha_nacimiento,
    p.sexo,
    p.tipo_sangre,
    p.direccion,
    p.peso_kg,
    p.altura_cm,
    p.alergias,
    p.enfermedades_cronicas,
    p.seguro_medico,
    p.numero_seguro,
    p.contacto_emergencia_nombre,
    p.contacto_emergencia_telefono,
    ub.departamento,
    ub.provincia,
    ub.distrito
  FROM pacientes p
  JOIN usuarios u ON p.id_usuario = u.id
  LEFT JOIN ubicaciones ub ON p.id_ubicacion = ub.id
  WHERE p.id = $1`,
      [id]
    );

    // Si no encuentra por p.id, intentar por id_usuario
    if (pacienteResult.rows.length === 0) {
      console.log(
        "🔄 No encontrado por p.id, intentando por id_usuario:",
        id
      );
      pacienteResult = await client.query(
        `SELECT 
    p.id,
    p.id_usuario,
    u.nombre,
    u.apellido,
    u.email,
    u.telefono,
    u.avatar_url,
    p.dni,
    p.fecha_nacimiento,
    p.sexo,
    p.tipo_sangre,
    p.direccion,
    p.peso_kg,
    p.altura_cm,
    p.alergias,
    p.enfermedades_cronicas,
    p.seguro_medico,
    p.numero_seguro,
    p.contacto_emergencia_nombre,
    p.contacto_emergencia_telefono,
    ub.departamento,
    ub.provincia,
    ub.distrito
  FROM pacientes p
  JOIN usuarios u ON p.id_usuario = u.id
  LEFT JOIN ubicaciones ub ON p.id_ubicacion = ub.id
  WHERE p.id_usuario = $1 OR u.id = $1`,
        [id]
      );
    }

    if (pacienteResult.rows.length === 0) {
      client.release();
      console.warn("⚠️ Paciente no encontrado con ID:", id);
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const paciente = pacienteResult.rows[0];
    console.log("✅ Paciente encontrado:", paciente.nombre, paciente.apellido);

    // Calcular edad
    const fechaNacimiento = new Date(paciente.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const m = hoy.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    // Calcular IMC
    let imc = null;
    if (paciente.peso_kg && paciente.altura_cm) {
      const alturaM = paciente.altura_cm / 100;
      imc = (paciente.peso_kg / (alturaM * alturaM)).toFixed(1);
    }

    client.release();

    return NextResponse.json({
      success: true,
      paciente: {
        id: paciente.id,
        usuario: {
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          email: paciente.email,
          telefono: paciente.telefono,
          avatar_url: paciente.avatar_url,
        },
        informacion_personal: {
          dni: paciente.dni,
          edad: edad,
          fecha_nacimiento: paciente.fecha_nacimiento,
          sexo: paciente.sexo,
          direccion: paciente.direccion,
          ubicacion: {
            departamento: paciente.departamento,
            provincia: paciente.provincia,
            distrito: paciente.distrito,
          },
        },
        informacion_medica: {
          tipo_sangre: paciente.tipo_sangre,
          peso_kg: paciente.peso_kg,
          altura_cm: paciente.altura_cm,
          imc: imc,
          alergias: paciente.alergias,
          enfermedades_cronicas: paciente.enfermedades_cronicas,
          seguro_medico: paciente.seguro_medico,
          numero_seguro: paciente.numero_seguro,
        },
        contacto_emergencia: {
          nombre: paciente.contacto_emergencia_nombre,
          telefono: paciente.contacto_emergencia_telefono,
        },
      },
    });
  } catch (error) {
    console.error("Error obteniendo datos del paciente:", error);
    if (client) {
      client.release();
    }
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details:
          process.env.NODE_ENV === "development"
            ? (error as any).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
