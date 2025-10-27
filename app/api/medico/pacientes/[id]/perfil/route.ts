// app/api/medico/pacientes/[id]/perfil/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database"; // ✅ Cambiar de pool a query
import { verifyToken } from "@/lib/auth"; // ✅ Usar verifyToken en lugar de verificarToken

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🔍 Iniciando obtención de perfil de paciente...");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Token de autorización requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token); // ✅ Usar verifyToken

    if (!payload || payload.rol !== "medico") {
      return NextResponse.json(
        { message: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    // ✅ CORREGIDO: Usar await y validar el ID
    const { id } = await params;
    const pacienteId = id;

    console.log("📋 Paciente ID recibido:", pacienteId);

    // Validar que el pacienteId sea un UUID válido
    if (
      !pacienteId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        pacienteId
      )
    ) {
      return NextResponse.json(
        { message: "ID de paciente inválido" },
        { status: 400 }
      );
    }

    // ✅ VERIFICAR QUE EL MÉDICO TIENE ACCESO A ESTE PACIENTE (igual que en historial)
    const medicoResult = await query(
      "SELECT id FROM medicos WHERE id_usuario = $1",
      [payload.userId]
    );
    if (medicoResult.rows.length === 0) {
      return NextResponse.json(
        { message: "Médico no encontrado" },
        { status: 404 }
      );
    }

    const medicoId = medicoResult.rows[0].id;
    console.log("👨‍⚕️ Médico ID:", medicoId);

    // Verificar que existe al menos una cita entre el médico y el paciente
    const accesoResult = await query(
      "SELECT COUNT(*) as count FROM citas WHERE id_medico = $1 AND id_paciente = $2",
      [medicoId, pacienteId]
    );

    if (Number.parseInt(accesoResult.rows[0].count) === 0) {
      return NextResponse.json(
        { message: "No tienes acceso al perfil de este paciente" },
        { status: 403 }
      );
    }

    // ✅ CONSULTA CORREGIDA - usar query en lugar de pool
    const pacienteResult = await query(
      `
      SELECT 
        p.id,
        u.nombre, u.apellido, u.email, u.telefono, u.avatar_url,
        p.dni, p.fecha_nacimiento, p.sexo, p.tipo_sangre, p.direccion,
        p.peso_kg, p.altura_cm, p.alergias, p.enfermedades_cronicas,
        p.seguro_medico, p.numero_seguro,
        p.contacto_emergencia_nombre, p.contacto_emergencia_telefono,
        ub.departamento, ub.provincia, ub.distrito
      FROM pacientes p
      JOIN usuarios u ON p.id_usuario = u.id
      LEFT JOIN ubicaciones ub ON p.id_ubicacion = ub.id
      WHERE p.id = $1
      `,
      [pacienteId]
    );

    if (pacienteResult.rows.length === 0) {
      return NextResponse.json(
        { message: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const pacienteData = pacienteResult.rows[0];
    console.log(
      "✅ Paciente encontrado:",
      pacienteData.nombre,
      pacienteData.apellido
    );

    // Calcular edad
    const fechaNacimiento = new Date(pacienteData.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    // Calcular IMC
    const imc =
      pacienteData.peso_kg && pacienteData.altura_cm
        ? (pacienteData.peso_kg / (pacienteData.altura_cm / 100) ** 2).toFixed(
            1
          )
        : null;

    const paciente = {
      id: pacienteData.id,
      usuario: {
        nombre: pacienteData.nombre,
        apellido: pacienteData.apellido,
        email: pacienteData.email,
        telefono: pacienteData.telefono,
        avatar_url: pacienteData.avatar_url,
      },
      informacion_personal: {
        dni: pacienteData.dni,
        edad: edad,
        sexo: pacienteData.sexo,
        tipo_sangre: pacienteData.tipo_sangre,
        direccion: pacienteData.direccion,
        ubicacion: {
          departamento: pacienteData.departamento,
          provincia: pacienteData.provincia,
          distrito: pacienteData.distrito,
        },
      },
      informacion_medica: {
        peso_kg: pacienteData.peso_kg,
        altura_cm: pacienteData.altura_cm,
        imc: imc,
        alergias: pacienteData.alergias,
        enfermedades_cronicas: pacienteData.enfermedades_cronicas,
        seguro_medico: pacienteData.seguro_medico,
        numero_seguro: pacienteData.numero_seguro,
      },
      contacto_emergencia: {
        nombre: pacienteData.contacto_emergencia_nombre,
        telefono: pacienteData.contacto_emergencia_telefono,
      },
    };

    console.log("✅ Perfil generado exitosamente");
    return NextResponse.json({ paciente });
  } catch (error) {
    console.error("❌ Error obteniendo perfil del paciente:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
