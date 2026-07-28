// app/api/farmacia/boletas/limpiar-duplicadas/route.ts
// API para eliminar boletas duplicadas

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let client: any = null;

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "farmacia") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    client = await pool.connect();

    // Obtener ID de la farmacia del usuario
    const farmaciaResult = await client.query(
      "SELECT id FROM farmacias WHERE id_usuario = $1",
      [usuario.userId]
    );

    if (farmaciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Farmacia no encontrada" },
        { status: 404 }
      );
    }

    const farmaciaId = farmaciaResult.rows[0].id;

    // Detectar duplicadas
    const duplicadasResult = await client.query(
      `SELECT 
        id_receta,
        COUNT(*) as cantidad,
        ARRAY_AGG(id) as boleta_ids
       FROM boletas_despacho
       WHERE id_farmacia = $1
       GROUP BY id_receta
       HAVING COUNT(*) > 1`,
      [farmaciaId]
    );

    const duplicadas = duplicadasResult.rows;

    if (duplicadas.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: "No hay boletas duplicadas",
        duplicadas_encontradas: 0,
        eliminadas: 0,
      });
    }

    console.log(
      `🔍 Encontradas ${duplicadas.length} recetas con boletas duplicadas`
    );

    // Eliminar duplicadas (mantener solo la más antigua)
    const resultadoEliminar = await client.query(
      `DELETE FROM boletas_despacho
       WHERE id IN (
         SELECT id
         FROM (
           SELECT 
             id,
             ROW_NUMBER() OVER (PARTITION BY id_receta ORDER BY created_at ASC) as rn
           FROM boletas_despacho
           WHERE id_farmacia = $1
         ) sub
         WHERE rn > 1
       )`,
      [farmaciaId]
    );

    console.log(`✅ ${resultadoEliminar.rowCount} boletas duplicadas eliminadas`);

    return NextResponse.json({
      success: true,
      mensaje: "Boletas duplicadas eliminadas correctamente",
      duplicadas_encontradas: duplicadas.length,
      eliminadas: resultadoEliminar.rowCount,
    });
  } catch (error: any) {
    console.error("Error limpiando duplicadas:", error);
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
