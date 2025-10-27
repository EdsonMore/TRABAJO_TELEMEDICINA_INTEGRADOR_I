import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";
import { jsPDF } from "jspdf";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { servicio_id, metodo_pago, monto, datos_pago } =
      await request.json();

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Generar número de transacción único
      const numero_transaccion = `TXN${Date.now()}${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`;

      // Simular procesamiento según método de pago
      let estado_pago = "exitoso";
      let mensaje_respuesta = "Pago procesado exitosamente";

      // Simular diferentes respuestas según método
      if (metodo_pago === "tarjeta") {
        // Validar datos de tarjeta (simulado)
        if (!datos_pago.numeroTarjeta || !datos_pago.cvv) {
          estado_pago = "fallido";
          mensaje_respuesta = "Datos de tarjeta inválidos";
        }
      } else if (metodo_pago === "yape" || metodo_pago === "plin") {
        // Simular notificación móvil
        mensaje_respuesta = `Notificación enviada a ${datos_pago.numeroTelefono}`;
      } else if (metodo_pago === "transferencia") {
        // Simular validación bancaria
        mensaje_respuesta = `Transferencia desde ${datos_pago.banco} procesada`;
      }

      // Registrar pago en base de datos
      const pagoQuery = `
        INSERT INTO pagos_sandbox 
        (usuario_id, servicio_id, metodo_pago, monto, numero_transaccion, estado, datos_pago)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const pagoResult = await client.query(pagoQuery, [
        usuario.id,
        servicio_id,
        metodo_pago,
        monto,
        numero_transaccion,
        estado_pago,
        JSON.stringify(datos_pago),
      ]);

      const pago = pagoResult.rows[0];

      // Generar comprobante PDF (simulado)
      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.text("COMPROBANTE DE PAGO", 20, 30);
      pdf.text("(ENTORNO DE PRUEBA)", 20, 40);

      pdf.setFontSize(12);
      pdf.text(`Número de Transacción: ${numero_transaccion}`, 20, 60);
      pdf.text(`Fecha: ${new Date().toLocaleDateString("es-PE")}`, 20, 70);
      pdf.text(`Método: ${metodo_pago.toUpperCase()}`, 20, 80);
      pdf.text(`Monto: S/ ${monto.toFixed(2)}`, 20, 90);
      pdf.text(`Estado: ${estado_pago.toUpperCase()}`, 20, 100);

      pdf.setFontSize(10);
      pdf.text(
        "Este es un comprobante de prueba - No válido para fines fiscales",
        20,
        120
      );

      const comprobante_url = `/comprobantes/sandbox_${numero_transaccion}.pdf`;

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        pago: {
          id: pago.id,
          numero_transaccion: numero_transaccion,
          estado: estado_pago,
          monto: monto,
          fecha_pago: pago.created_at,
          comprobante_url: comprobante_url,
          mensaje: mensaje_respuesta,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error procesando pago sandbox:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
