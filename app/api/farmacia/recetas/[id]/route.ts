// app/api/farmacia/recetas/[id]/route.ts - NUEVA API
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "farmacia") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { estado, fecha_dispensacion } = body;

    if (!id || !estado) {
      return NextResponse.json(
        { error: "ID de receta y estado son requeridos" },
        { status: 400 }
      );
    }

    const estadosValidos = ["en_proceso", "dispensada"];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    client = await pool.connect();

    // Obtener ID de la farmacia
    const farmaciaResult = await client.query(
      "SELECT id FROM farmacias WHERE id_usuario = $1",
      [usuario.id]
    );

    if (farmaciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Farmacia no encontrada" },
        { status: 404 }
      );
    }

    const farmaciaId = farmaciaResult.rows[0].id;

    // Verificar que la receta existe y está en estado válido
    const recetaResult = await client.query(
      `SELECT estado FROM recetas WHERE id = $1`,
      [id]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const recetaActual = recetaResult.rows[0];

    // Validar transición de estado
    if (recetaActual.estado === "dispensada" && estado === "en_proceso") {
      return NextResponse.json(
        { error: "No se puede revertir una receta dispensada" },
        { status: 400 }
      );
    }

    // Actualizar estado de la receta
    let updateQuery = `
      UPDATE recetas 
      SET estado = $1, 
          fecha_actualizacion = CURRENT_TIMESTAMP
    `;

    const updateParams: any[] = [estado];
    let paramCount = 1;

    // Si se marca como dispensada, registrar farmacia y fecha
    if (estado === "dispensada") {
      paramCount++;
      updateQuery += `, id_farmacia_dispensadora = $${paramCount}, fecha_dispensacion = $${
        paramCount + 1
      }`;
      updateParams.push(
        farmaciaId,
        fecha_dispensacion || new Date().toISOString()
      );
    }

    updateQuery += ` WHERE id = $${paramCount + 2}`;
    updateParams.push(id);

    await client.query(updateQuery, updateParams);

    // Si se marca como dispensada, actualizar también los medicamentos
    if (estado === "dispensada") {
      await client.query(
        `UPDATE receta_detalle 
         SET dispensado = true 
         WHERE id_receta = $1`,
        [id]
      );

      // Actualizar inventario (reducir stock)
      await actualizarInventario(client, id, farmaciaId);
    }

    return NextResponse.json({
      success: true,
      message: `Receta ${
        estado === "en_proceso" ? "en proceso" : "dispensada"
      } correctamente`,
    });
  } catch (error: any) {
    console.error("Error actualizando receta:", error);
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

// Función auxiliar para actualizar inventario
async function actualizarInventario(
  client: any,
  recetaId: string,
  farmaciaId: string
) {
  try {
    // Obtener medicamentos de la receta
    const medicamentosResult = await client.query(
      `SELECT medicamento_id, cantidad 
       FROM receta_detalle 
       WHERE id_receta = $1`,
      [recetaId]
    );

    for (const med of medicamentosResult.rows) {
      // Actualizar stock
      await client.query(
        `UPDATE inventario_farmacia 
         SET stock_actual = stock_actual - $1,
             fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id_farmacia = $2 
         AND id_medicamento = $3 
         AND stock_actual >= $1`,
        [med.cantidad, farmaciaId, med.medicamento_id]
      );
    }
  } catch (error) {
    console.error("Error actualizando inventario:", error);
    throw error;
  }
}
