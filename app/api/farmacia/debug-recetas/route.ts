import { NextResponse, NextRequest } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let client;
  try {
    // 1. Verificar autenticación
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario || usuario.rol !== "farmacia") {
      return NextResponse.json(
        { error: "Solo farmacistas pueden acceder" },
        { status: 403 }
      );
    }

    client = await pool.connect();

    // 2. Obtener datos de farmacia
    console.log("\n=== DEBUG FARMACIA ===");
    console.log("User ID:", usuario.id);

    const farmaciaResult = await client.query(
      `SELECT id, nombre, id_usuario FROM farmacias WHERE id_usuario = $1`,
      [usuario.id]
    );

    console.log("Farmacia encontrada:", farmaciaResult.rows[0]);

    if (farmaciaResult.rows.length === 0) {
      return NextResponse.json({
        error: "Farmacia no encontrada",
        usuario_id: usuario.id,
        usuario_rol: usuario.rol,
      });
    }

    const farmaciaId = farmaciaResult.rows[0].id;

    // 3. Debug: Contar TODAS las recetas de la farmacia sin filtros
    console.log("\n=== DEBUG: RECETAS DE FARMACIA ===");

    const allRecetasResult = await client.query(
      `SELECT 
        id,
        codigo_receta,
        farmacia_seleccionada_id,
        estado_envio,
        estado,
        fecha_envio_farmacia,
        fecha_emision
       FROM recetas 
       WHERE farmacia_seleccionada_id = $1
       ORDER BY fecha_emision DESC
       LIMIT 20`,
      [farmaciaId]
    );

    console.log("Recetas totales de esta farmacia:", allRecetasResult.rows.length);
    console.log("Recetas encontradas:", allRecetasResult.rows);

    // 4. Contar por estado
    const estadoResult = await client.query(
      `SELECT estado_envio, COUNT(*) as cantidad FROM recetas WHERE farmacia_seleccionada_id = $1 GROUP BY estado_envio`,
      [farmaciaId]
    );

    console.log("Conteo por estado_envio:", estadoResult.rows);

    // 5. Verificar si hay recetas SIN farmacia asignada
    const sinFarmaciaResult = await client.query(
      `SELECT COUNT(*) as cantidad FROM recetas WHERE farmacia_seleccionada_id IS NULL`
    );

    console.log("Recetas sin farmacia asignada:", sinFarmaciaResult.rows[0].cantidad);

    // 6. Ver una receta completa con detalles
    if (allRecetasResult.rows.length > 0) {
      const primeraReceta = allRecetasResult.rows[0];
      
      const detallesResult = await client.query(
        `SELECT 
          r.id,
          r.codigo_receta,
          r.farmacia_seleccionada_id,
          r.estado_envio,
          r.estado,
          r.fecha_envio_farmacia,
          c.id_paciente,
          p.nombre as paciente_nombre,
          u.nombre as usuario_nombre
         FROM recetas r
         LEFT JOIN citas c ON r.id_cita = c.id
         LEFT JOIN pacientes p ON c.id_paciente = p.id
         LEFT JOIN usuarios u ON p.id_usuario = u.id
         WHERE r.id = $1`,
        [primeraReceta.id]
      );

      console.log("\nDetalles de primera receta:", detallesResult.rows[0]);
    }

    // 7. Retornar debug info
    return NextResponse.json({
      debug: true,
      farmacia: farmaciaResult.rows[0],
      recetas_de_farmacia: {
        total: allRecetasResult.rows.length,
        lista: allRecetasResult.rows,
        por_estado: estadoResult.rows,
      },
      recetas_sin_farmacia: sinFarmaciaResult.rows[0].cantidad,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[DEBUG ERROR]:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (err) {
        console.error("[RELEASE ERROR]:", err);
      }
    }
  }
}
