
//App/api/pagos/route.ts
// API para gestión de pagos
// Permite a pacientes realizar pagos y obtener comprobantes
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

    const {
      cita_id,
      examen_id,
      tipo_pago,
      metodo_pago,
      monto,
      referencia_pago,
    } = await request.json();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Obtener información del paciente
      const pacienteResult = await client.query(
        "SELECT id FROM pacientes WHERE usuario_id = $1",
        [usuario.id]
      );

      if (pacienteResult.rows.length === 0) {
        throw new Error("Paciente no encontrado");
      }

      const paciente_id = pacienteResult.rows[0].id;

      // Crear el pago
      const pagoResult = await client.query(
        `
        INSERT INTO pagos (paciente_id, cita_id, examen_id, tipo_pago, metodo_pago, monto, referencia_pago, estado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'completado')
        RETURNING *
      `,
        [
          paciente_id,
          cita_id,
          examen_id,
          tipo_pago,
          metodo_pago,
          monto,
          referencia_pago,
        ]
      );

      const pago = pagoResult.rows[0];

      // Generar comprobante PDF
      const pdf = new jsPDF();
      pdf.setFontSize(20);
      pdf.text("COMPROBANTE DE PAGO", 20, 30);
      pdf.setFontSize(12);
      pdf.text(`Número de Pago: ${pago.id}`, 20, 50);
      pdf.text(`Fecha: ${new Date().toLocaleDateString("es-PE")}`, 20, 60);
      pdf.text(`Tipo: ${tipo_pago}`, 20, 70);
      pdf.text(`Método: ${metodo_pago}`, 20, 80);
      pdf.text(`Monto: S/ ${monto}`, 20, 90);
      pdf.text(`Referencia: ${referencia_pago}`, 20, 100);

      const pdfBuffer = pdf.output("arraybuffer");
      const comprobante_path = `/comprobantes/pago_${pago.id}.pdf`;

      // Actualizar con la ruta del PDF
      await client.query(
        "UPDATE pagos SET comprobante_pdf = $1, fecha_pago = CURRENT_TIMESTAMP WHERE id = $2",
        [comprobante_path, pago.id]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        pago: { ...pago, comprobante_pdf: comprobante_path },
        message: "Pago procesado exitosamente",
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
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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

    // Obtener historial de pagos del paciente
    const result = await pool.query(
      `
      SELECT p.*, c.fecha_cita, m.nombres as medico_nombre, m.apellidos as medico_apellidos
      FROM pagos p
      LEFT JOIN citas c ON p.cita_id = c.id
      LEFT JOIN medicos m ON c.medico_id = m.id
      JOIN pacientes pac ON p.paciente_id = pac.id
      WHERE pac.usuario_id = $1
      ORDER BY p.created_at DESC
    `,
      [usuario.id]
    );

    return NextResponse.json({ pagos: result.rows });
  } catch (error) {
    console.error("Error obteniendo pagos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
