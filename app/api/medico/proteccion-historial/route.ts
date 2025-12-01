// app/api/medico/proteccion-historial/route.ts
// Endpoint para gestionar protección GLOBAL de historiales médicos del médico

import { type NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { verificarToken } from "@/lib/auth";
import { hash, compare } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, password } = body;

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

    const medicoId = payload.userId;

    // ===== ACCIÓN: CHECK =====
    // Verificar si el médico tiene protección habilitada
    if (action === "check") {
      const result = await query(
        `SELECT id, created_at FROM proteccion_historial_medico 
         WHERE id_medico = $1`,
        [medicoId]
      );

      const hasProtection = result.rows.length > 0;
      return NextResponse.json({
        isProtected: hasProtection,
        message: hasProtection
          ? "Protección habilitada"
          : "Sin protección",
      });
    }

    // ===== ACCIÓN: VERIFY =====
    // Verificar contraseña
    if (action === "verify" && password) {
      const result = await query(
        `SELECT password_hash FROM proteccion_historial_medico 
         WHERE id_medico = $1`,
        [medicoId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No hay protección configurada",
          },
          { status: 404 }
        );
      }

      const protection = result.rows[0];
      const isValid = await compare(password, protection.password_hash);

      if (!isValid) {
        return NextResponse.json({
          success: false,
          message: "Contraseña incorrecta",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Acceso permitido",
        verified: true,
      });
    }

    // ===== ACCIÓN: CREATE =====
    // Crear nueva protección
    if (action === "create" && password) {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 6 caracteres" },
          { status: 400 }
        );
      }

      // Verificar si ya existe protección
      const existing = await query(
        `SELECT id FROM proteccion_historial_medico WHERE id_medico = $1`,
        [medicoId]
      );

      if (existing.rows.length > 0) {
        return NextResponse.json(
          { error: "Ya existe una protección. Usa action: 'update'" },
          { status: 409 }
        );
      }

      const passwordHash = await hash(password, 10);

      const result = await query(
        `INSERT INTO proteccion_historial_medico (id_medico, password_hash, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id`,
        [medicoId, passwordHash]
      );

      return NextResponse.json({
        success: true,
        message: "Protección creada exitosamente",
        created: true,
      });
    }

    // ===== ACCIÓN: UPDATE =====
    // Actualizar contraseña existente
    if (action === "update" && password) {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 6 caracteres" },
          { status: 400 }
        );
      }

      const passwordHash = await hash(password, 10);

      const result = await query(
        `UPDATE proteccion_historial_medico 
         SET password_hash = $1, updated_at = NOW()
         WHERE id_medico = $2
         RETURNING id`,
        [passwordHash, medicoId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "No existe protección para este médico" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Contraseña actualizada exitosamente",
        updated: true,
      });
    }

    // ===== ACCIÓN: DELETE =====
    // Remover protección
    if (action === "delete") {
      const result = await query(
        `DELETE FROM proteccion_historial_medico 
         WHERE id_medico = $1
         RETURNING id`,
        [medicoId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "No existe protección para remover" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Protección eliminada",
        deleted: true,
      });
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Error en protección de historial:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
