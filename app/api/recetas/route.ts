// app/api/recetas/route.ts - VERSIÓN CORREGIDA
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "medico") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      id_cita,
      diagnostico_principal_id,
      diagnostico_principal_texto,
      diagnosticos_secundarios,
      observaciones,
      medicamentos,
      fecha_vencimiento,
    } = body;

    // Validaciones básicas
    if (!id_cita || !medicamentos || medicamentos.length === 0) {
      return NextResponse.json(
        { error: "Cita y medicamentos son requeridos" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Verificar que la cita pertenece al médico
      const citaCheck = await client.query(
        `SELECT c.id, m.id as medico_id 
         FROM citas c 
         JOIN medicos m ON c.id_medico = m.id 
         WHERE c.id = $1 AND m.id_usuario = $2`,
        [id_cita, usuario.id]
      );

      if (citaCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Cita no encontrada o no autorizada" },
          { status: 404 }
        );
      }

      // 2. Generar código único para la receta (MÁXIMO 20 CARACTERES)
      const timestamp = Date.now().toString().slice(-8); // Últimos 8 dígitos
      const random = Math.random().toString(36).substr(2, 4).toUpperCase(); // 4 caracteres
      const codigoReceta = `REC-${timestamp}${random}`; // Máximo 20 caracteres

      console.log(
        "📝 Código receta generado:",
        codigoReceta,
        "Longitud:",
        codigoReceta.length
      );

      // 3. Insertar receta principal
      const recetaResult = await client.query(
        `INSERT INTO recetas (
          id_cita, codigo_receta, diagnostico_principal_id, 
          diagnostico_principal_texto, diagnosticos_secundarios,
          observaciones, fecha_emision, fecha_vencimiento, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING id, codigo_receta, fecha_emision`,
        [
          id_cita,
          codigoReceta,
          diagnostico_principal_id,
          diagnostico_principal_texto,
          diagnosticos_secundarios
            ? JSON.stringify(diagnosticos_secundarios)
            : null,
          observaciones,
          new Date(),
          fecha_vencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          "activa",
        ]
      );

      const recetaId = recetaResult.rows[0].id;

      // 4. Insertar medicamentos en receta_detalle
      for (const med of medicamentos) {
        await client.query(
          `INSERT INTO receta_detalle (
            id_receta, medicamento_id, cantidad, dosis, frecuencia,
            duracion_dias, via_administracion, instrucciones_especiales
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            recetaId,
            med.medicamento_id,
            med.cantidad,
            med.dosis,
            med.frecuencia,
            med.duracion_dias,
            med.via_administracion,
            med.instrucciones_especiales,
          ]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: true,
          receta: recetaResult.rows[0],
          message: "Receta creada exitosamente",
        },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } catch (error: any) {
    console.error("Error creando receta:", error);

    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Referencia inválida (cita o medicamento no existe)" },
        { status: 400 }
      );
    }

    if (error.code === "22001") {
      return NextResponse.json(
        { error: "Error: código de receta demasiado largo" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
