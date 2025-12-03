// app/api/farmacia/boletas/generar-faltantes/route.ts
// API para generar boletas automáticamente para todas las recetas dispensadas que no tienen boleta

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

    // Obtener todas las recetas dispensadas sin boleta de esta farmacia
    const recetasResult = await client.query(
      `SELECT r.id as receta_id
       FROM recetas r
       WHERE r.estado_envio = 'dispensada' 
         AND r.boleta_despacho_id IS NULL
         AND r.farmacia_seleccionada_id = $1
       ORDER BY r.fecha_envio_farmacia DESC`,
      [farmaciaId]
    );

    const recetasParaGenerar = recetasResult.rows;

    if (recetasParaGenerar.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: "No hay recetas dispensadas sin boleta",
        total_procesadas: 0,
        exitosas: 0,
        fallidas: 0,
      });
    }

    console.log(
      `📋 Generando boletas faltantes: ${recetasParaGenerar.length} recetas`
    );

    let exitosas = 0;
    let fallidas = 0;

    // Procesar cada receta
    for (const receta of recetasParaGenerar) {
      try {
        // Llamar a la API de generar-boleta internamente
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const boletaUrl = `${baseUrl}/api/farmacia/recetas/${receta.receta_id}/generar-boleta`;

        // Obtener medicamentos procesados de la receta
        const medicamentosResult = await client.query(
          `SELECT 
            m.id as medicamento_id,
            m.nombre_comercial,
            m.nombre_generico,
            rd.cantidad as cantidad_dispensada,
            rd.dosis,
            rd.frecuencia,
            rd.via_administracion,
            0 as precio_unitario,
            0 as lote
           FROM receta_detalle rd
           JOIN medicamentos m ON rd.medicamento_id = m.id
           WHERE rd.id_receta = $1`,
          [receta.receta_id]
        );

        const medicamentos = medicamentosResult.rows.map((med: any) => ({
          ...med,
          cantidad_dispensada: parseInt(med.cantidad_dispensada) || 1,
          precio_unitario: 0,
        }));

        // Hacer fetch interno a generar-boleta
        const response = await fetch(boletaUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            medicamentos_procesados: medicamentos,
            observaciones: "Boleta generada automáticamente desde lote",
          }),
        });

        if (response.ok) {
          console.log(`✅ Boleta generada: ${receta.receta_id}`);
          exitosas++;
        } else {
          console.error(
            `⚠️ Error generando boleta ${receta.receta_id}: ${response.status}`
          );
          fallidas++;
        }
      } catch (err: any) {
        console.error(`❌ Error procesando receta ${receta.receta_id}:`, err);
        fallidas++;
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: "Proceso de generación de boletas completado",
      total_procesadas: recetasParaGenerar.length,
      exitosas,
      fallidas,
    });
  } catch (error: any) {
    console.error("Error generando boletas faltantes:", error);
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
