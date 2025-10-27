
//App/api/pagos/procesar/route.ts
// API para procesamiento de pagos
// Maneja pagos de consultas y exámenes médicos

import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json(
        { error: "Solo pacientes pueden realizar pagos" },
        { status: 403 }
      );
    }

    const {
      tipo_pago, // 'cita' o 'examen'
      referencia_id, // ID de la cita o examen
      monto,
      metodo_pago, // 'yape', 'transferencia', 'tarjeta'
      datos_pago, // Información específica del método de pago
    } = await request.json();

    if (!tipo_pago || !referencia_id || !monto || !metodo_pago) {
      return NextResponse.json(
        { error: "Datos de pago incompletos" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const codigoPago = `PAY-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 8)
        .toUpperCase()}`;

      const pagoResult = await client.query(
        `
        INSERT INTO pagos (
          paciente_id, tipo_pago, referencia_id, monto, metodo_pago,
          codigo_pago, estado, datos_pago, fecha_pago, created_at
        ) VALUES (
          (SELECT id FROM pacientes WHERE usuario_id = $1),
          $2, $3, $4, $5, $6, 'procesando', $7, NOW(), NOW()
        ) RETURNING *
      `,
        [
          usuario.id,
          tipo_pago,
          referencia_id,
          monto,
          metodo_pago,
          codigoPago,
          JSON.stringify(datos_pago),
        ]
      );

      const pago = pagoResult.rows[0];

      let estadoPago = "completado";
      let mensajeEstado = "Pago procesado exitosamente";

      if (metodo_pago === "yape") {
        // Simular validación de YAPE
        if (datos_pago.numero_yape && datos_pago.codigo_operacion) {
          estadoPago = "completado";
          mensajeEstado = `Pago YAPE procesado. Operación: ${datos_pago.codigo_operacion}`;
        } else {
          estadoPago = "fallido";
          mensajeEstado = "Datos de YAPE incompletos";
        }
      } else if (metodo_pago === "transferencia") {
        // Simular validación de transferencia
        if (datos_pago.numero_operacion && datos_pago.banco) {
          estadoPago = "completado";
          mensajeEstado = `Transferencia ${datos_pago.banco} procesada. Operación: ${datos_pago.numero_operacion}`;
        } else {
          estadoPago = "pendiente";
          mensajeEstado = "Transferencia en verificación";
        }
      }

      await client.query(
        `
        UPDATE pagos SET 
          estado = $1,
          mensaje_estado = $2,
          fecha_procesamiento = NOW(),
          updated_at = NOW()
        WHERE id = $3
      `,
        [estadoPago, mensajeEstado, pago.id]
      );

      if (estadoPago === "completado") {
        if (tipo_pago === "cita") {
          await client.query(
            `
            UPDATE citas SET 
              estado_pago = 'pagado',
              updated_at = NOW()
            WHERE id = $1
          `,
            [referencia_id]
          );
        } else if (tipo_pago === "examen") {
          await client.query(
            `
            UPDATE solicitudes_laboratorio SET 
              estado_pago = 'pagado',
              updated_at = NOW()
            WHERE id = $1
          `,
            [referencia_id]
          );
        }

        await client.query(
          `
          INSERT INTO notificaciones (
            usuario_id, tipo, titulo, mensaje, datos_adicionales, created_at
          ) VALUES ($1, 'pago_exitoso', 'Pago Procesado', $2, $3, NOW())
        `,
          [
            usuario.id,
            `Su pago de S/ ${monto} ha sido procesado exitosamente. Código: ${codigoPago}`,
            JSON.stringify({
              codigo_pago: codigoPago,
              monto,
              metodo_pago,
              tipo_pago,
              referencia_id,
            }),
          ]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: mensajeEstado,
        pago: {
          id: pago.id,
          codigo_pago: codigoPago,
          estado: estadoPago,
          monto,
          metodo_pago,
          fecha_pago: pago.fecha_pago,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error procesando pago:", error);
    return NextResponse.json(
      { error: "Error procesando el pago" },
      { status: 500 }
    );
  }
}
