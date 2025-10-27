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
    if (!usuario || usuario.rol !== "laboratorio") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { examen_id, archivo_pdf, observaciones, valores_referencia } =
      await request.json();

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Simular guardado de archivo PDF (en producción se subiría a storage)
      const archivo_url = `/resultados/resultado_${examen_id}_${Date.now()}.pdf`;

      // Actualizar examen con resultado
      const updateQuery = `
        UPDATE resultados_laboratorio 
        SET estado = 'completado',
            archivo_resultado = $1,
            observaciones_laboratorio = $2,
            valores_referencia = $3,
            fecha_resultado = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        archivo_url,
        observaciones,
        valores_referencia,
        examen_id,
      ]);

      if (result.rows.length === 0) {
        throw new Error("Examen no encontrado");
      }

      // Crear notificación para paciente y médico (simulado)
      const examen = result.rows[0];

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        resultado: {
          id: `resultado_${Date.now()}`,
          examen_id: examen_id,
          archivo_pdf: archivo_url,
          fecha_subida: new Date().toISOString(),
          observaciones: observaciones,
          valores_referencia: valores_referencia,
        },
        message: "Resultado subido exitosamente",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error subiendo resultado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
