// MediLink+ - API Route para registro de usuarios
// Endpoint para crear nuevos usuarios con validación completa

import { type NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // ✅ AGREGAR los campos adicionales para pacientes
    const {
      nombre,
      apellido,
      email,
      password,
      telefono,
      rol,
      // Campos específicos para pacientes
      fechaNacimiento,
      genero,
      direccion,
      tipoDocumento,
      numeroDocumento,
    } = await request.json();

    // Validar datos requeridos
    if (!nombre || !apellido || !email || !password || !rol) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben ser completados" },
        { status: 400 }
      );
    }

    // ✅ AGREGAR validaciones específicas para pacientes
    if (rol === "paciente") {
      if (!fechaNacimiento || !genero || !direccion || !numeroDocumento) {
        return NextResponse.json(
          {
            error:
              "Para pacientes: fecha de nacimiento, género, dirección y número de documento son obligatorios",
          },
          { status: 400 }
        );
      }

      // Validar formato de fecha
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fechaNacimiento)) {
        return NextResponse.json(
          { error: "Formato de fecha inválido (debe ser YYYY-MM-DD)" },
          { status: 400 }
        );
      }

      // Validar género
      const generosValidos = ["masculino", "femenino", "otro"];
      if (!generosValidos.includes(genero)) {
        return NextResponse.json({ error: "Género inválido" }, { status: 400 });
      }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Validar rol
    const rolesValidos = [
      "paciente",
      "medico",
      "farmacia",
      "laboratorio",
      "administrador",
    ];
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    // Validar teléfono si se proporciona
    if (telefono && !/^\+?[1-9]\d{1,14}$/.test(telefono.replace(/\s/g, ""))) {
      return NextResponse.json(
        { error: "Formato de teléfono inválido" },
        { status: 400 }
      );
    }

    // ✅ PASAR todos los datos a registerUser
    const result = await registerUser({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.toLowerCase().trim(),
      password,
      telefono: telefono?.trim(),
      rol,
      // Campos adicionales para pacientes
      fechaNacimiento,
      genero,
      direccion: direccion?.trim(),
      tipoDocumento,
      numeroDocumento: numeroDocumento?.trim(),
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Registrar en auditoría
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    console.log(
      `Nuevo usuario registrado: ${email} (${rol}) desde IP: ${clientIP}`
    );

    return NextResponse.json(
      {
        message: "Usuario registrado exitosamente",
        user: result.user,
        token: result.token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
