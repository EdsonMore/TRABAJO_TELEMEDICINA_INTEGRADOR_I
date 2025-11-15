//app/api/pagos/procesar-sandbox/route.ts
// API Sandbox para procesamiento de pagos de prueba
// Simula pagos pero los registra en la BD de forma completa y consistente

import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await request.json();
    const tipo_pago = body.tipo_pago || "cita"; // 'cita' por defecto
    const referencia_id = body.referencia_id; // ID de la cita
    const metodo_pago = body.metodo_pago;
    const monto = body.monto ? Number(body.monto) : null;
    const datos_pago = body.datos_pago || {};

    // ✅ Validar datos requeridos
    if (!referencia_id || !metodo_pago || !monto) {
      return NextResponse.json(
        { error: "Faltan datos requeridos: referencia_id, metodo_pago, monto" },
        { status: 400 }
      );
    }

    console.log("Procesando pago sandbox:", {
      usuario_id: usuario.id,
      tipo_pago,
      referencia_id,
      metodo_pago,
      monto,
    });

    await client.query("BEGIN");

    try {
      // ✅ Generar referencia de pago única
      const referencia_sandbox = `SBX${Date.now()}${Math.random()
        .toString(36)
        .substr(2, 8)
        .toUpperCase()}`;

      // ✅ Simular validación del método de pago
      let estado_pago = "completado";
      let mensaje_respuesta = "Pago procesado exitosamente en entorno sandbox";

      // Validaciones simuladas
      if (metodo_pago === "tarjeta") {
        if (
          !datos_pago.numero_tarjeta ||
          !datos_pago.cvv ||
          !datos_pago.fecha_vencimiento
        ) {
          estado_pago = "fallido";
          mensaje_respuesta = "Datos de tarjeta inválidos";
        }
      } else if (metodo_pago === "yape" || metodo_pago === "plin") {
        if (!datos_pago.numero_telefono || !datos_pago.codigo_operacion) {
          estado_pago = "fallido";
          mensaje_respuesta = "Datos de YAPE/PLIN incompletos";
        }
      } else if (metodo_pago === "transferencia") {
        if (!datos_pago.banco || !datos_pago.numero_operacion) {
          estado_pago = "fallido";
          mensaje_respuesta = "Datos de transferencia incompletos";
        }
      }

      console.log("Estado de pago simulado:", estado_pago);

      // ✅ Insertar registro de pago en tabla pagos (con estructura REAL de BD)
      const pagoResult = await client.query(
        `INSERT INTO pagos (
          usuario_id, entidad_tipo, entidad_id, monto, metodo_pago, 
          estado, referencia_pago, fecha_pago, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, created_at`,
        [
          usuario.id,
          tipo_pago,          // 'cita' → entidad_tipo
          referencia_id,      // cita ID → entidad_id
          monto,
          metodo_pago,
          estado_pago,
          referencia_sandbox, // SBX... → referencia_pago
        ]
      );

      const pago = pagoResult.rows[0];
      console.log("Pago registrado en BD:", pago);

      // ✅ Si el pago es exitoso y es una cita, actualizar estado de la cita
      if (estado_pago === "completado" && tipo_pago === "cita") {
        console.log("Actualizando cita:", referencia_id);

        const updateResult = await client.query(
          `UPDATE citas 
           SET pagado = true, estado = 'confirmada', fecha_actualizacion = NOW() 
           WHERE id = $1
           RETURNING id, pagado, estado, costo`,
          [referencia_id]
        );

        if (updateResult.rows.length === 0) {
          throw new Error(`Cita con ID ${referencia_id} no encontrada`);
        }

        console.log("Cita actualizada:", updateResult.rows[0]);
      }

      // ✅ Confirmar transacción
      await client.query("COMMIT");

      // ✅ Devolver respuesta consistente
      return NextResponse.json({
        success: true,
        pago: {
          id: pago.id,
          referencia_pago: referencia_sandbox,
          estado: estado_pago,
          monto: monto,
          fecha_pago: pago.created_at,
          mensaje: mensaje_respuesta,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error en transacción de pago:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error procesando pago sandbox:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
