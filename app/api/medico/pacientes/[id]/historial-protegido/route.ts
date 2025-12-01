// app/api/medico/pacientes/[id]/historial-protegido/route.ts
// Endpoint para obtener historial protegido con contraseña

import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { verificarToken } from "@/lib/auth";
import { hash, compare } from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password, action } = body;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de acceso requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verificarToken(token);

    if (!payload || payload.rol !== "medico") {
      return NextResponse.json(
        { error: "Acceso no autorizado" },
        { status: 403 }
      );
    }

    // Validar ID del paciente
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: "ID de paciente inválido" },
        { status: 400 }
      );
    }

    // Obtener o crear protección de historial
    if (action === "check") {
      return handleCheckProtection(id);
    } else if (action === "verify" && password) {
      return handleVerifyPassword(payload.userId, id, password);
    } else if (action === "create" && password) {
      return handleCreatePassword(payload.userId, id, password);
    } else if (action === "update" && password) {
      return handleUpdatePassword(payload.userId, id, password);
    } else {
      return NextResponse.json(
        { error: "Acción no válida o parámetros incompletos" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Error en historial protegido:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

async function handleCheckProtection(pacienteId: string) {
  try {
    const protectionResult = await query(
      `SELECT id FROM historial_protecciones WHERE id_paciente = $1`,
      [pacienteId]
    );

    const isProtected = protectionResult.rows.length > 0;

    return NextResponse.json({
      isProtected,
      message: isProtected ? "Este historial está protegido" : "No hay protección",
    });
  } catch (error) {
    console.error("Error verificando protección:", error);
    return NextResponse.json(
      { error: "Error al verificar protección" },
      { status: 500 }
    );
  }
}

async function handleVerifyPassword(
  medicoUserId: string,
  pacienteId: string,
  password: string
) {
  try {
    // Obtener protección de historial del paciente
    const protectionResult = await query(
      `SELECT password_hash, created_at FROM historial_protecciones 
       WHERE id_paciente = $1`,
      [pacienteId]
    );

    if (protectionResult.rows.length === 0) {
      // No existe protección aún
      return NextResponse.json({
        success: false,
        exists: false,
        message: "No hay protección de contraseña. Crear una nueva.",
      });
    }

    const protection = protectionResult.rows[0];
    const isValid = await compare(password, protection.password_hash);

    if (!isValid) {
      return NextResponse.json({
        success: false,
        exists: true,
        message: "Contraseña incorrecta",
      });
    }

    // Log de acceso
    await query(
      `INSERT INTO acceso_historial_logs (id_medico, id_paciente, timestamp)
       VALUES ($1, $2, NOW())`,
      [medicoUserId, pacienteId]
    );

    return NextResponse.json({
      success: true,
      exists: true,
      message: "Acceso permitido",
      verified: true,
    });
  } catch (error) {
    console.error("Error verificando contraseña:", error);
    return NextResponse.json(
      { error: "Error al verificar contraseña" },
      { status: 500 }
    );
  }
}

async function handleCreatePassword(
  medicoUserId: string,
  pacienteId: string,
  password: string
) {
  try {
    // Validar que la contraseña sea segura
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const passwordHash = await hash(password, 10);

    // Crear o actualizar protección
    const result = await query(
      `INSERT INTO historial_protecciones (id_paciente, password_hash, created_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_paciente) DO NOTHING
       RETURNING id`,
      [pacienteId, passwordHash, medicoUserId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "La protección ya existe. Usa action: 'update'" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Protección de contraseña creada exitosamente",
      created: true,
    });
  } catch (error) {
    console.error("Error creando protección:", error);
    return NextResponse.json(
      { error: "Error al crear protección" },
      { status: 500 }
    );
  }
}

async function handleUpdatePassword(
  medicoUserId: string,
  pacienteId: string,
  password: string
) {
  try {
    // Validar nueva contraseña
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const newPasswordHash = await hash(password, 10);

    // Actualizar protección
    const result = await query(
      `UPDATE historial_protecciones 
       SET password_hash = $1, updated_at = NOW()
       WHERE id_paciente = $2
       RETURNING id`,
      [newPasswordHash, pacienteId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No existe protección para este paciente" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
      updated: true,
    });
  } catch (error) {
    console.error("Error actualizando contraseña:", error);
    return NextResponse.json(
      { error: "Error al actualizar contraseña" },
      { status: 500 }
    );
  }
}
