// app/api/farmacia/estadisticas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    client = await pool.connect();

    // Obtener ID de la farmacia usando usuario.id (que ahora existe)
    const farmaciaResult = await client.query(
      "SELECT id FROM farmacias WHERE id_usuario = $1",
      [usuario.id] // ← Ahora usuario.id está disponible
    );

    if (farmaciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Farmacia no encontrada" },
        { status: 404 }
      );
    }

    const farmaciaId = farmaciaResult.rows[0].id;

    // Estadísticas de recetas
    const estadisticasRecetas = await client.query(
      `
      SELECT 
        COUNT(*) as total_recetas,
        COUNT(CASE WHEN estado = 'activa' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'en_proceso' THEN 1 END) as en_proceso,
        COUNT(CASE WHEN estado = 'dispensada' THEN 1 END) as dispensadas,
        COUNT(CASE WHEN DATE(fecha_emision) = CURRENT_DATE THEN 1 END) as recibidas_hoy
      FROM recetas 
      WHERE id_farmacia_dispensadora = $1 
         OR (estado IN ('activa', 'en_proceso') AND id_farmacia_dispensadora IS NULL)
      `,
      [farmaciaId]
    );

    // Estadísticas de inventario
    const estadisticasInventario = await client.query(
      `
      SELECT 
        COUNT(*) as total_medicamentos,
        COUNT(CASE WHEN stock_actual <= stock_minimo THEN 1 END) as stock_bajo,
        COUNT(CASE WHEN stock_actual = 0 THEN 1 END) as sin_stock,
        COUNT(CASE WHEN fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as por_vencer
      FROM inventario_farmacia 
      WHERE id_farmacia = $1 AND disponible = true
      `,
      [farmaciaId]
    );

    // Recetas más recientes (para dashboard)
    const recetasRecientes = await client.query(
      `
      SELECT 
        r.id,
        r.codigo_receta,
        r.estado,
        r.fecha_emision,
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        COUNT(rd.id) as total_medicamentos
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios up ON p.id_usuario = up.id
      LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
      WHERE (r.id_farmacia_dispensadora = $1 OR r.estado IN ('activa', 'en_proceso'))
      GROUP BY r.id, up.nombre, up.apellido
      ORDER BY r.fecha_emision DESC
      LIMIT 5
      `,
      [farmaciaId]
    );

    const estadisticas = {
      recetas: estadisticasRecetas.rows[0],
      inventario: estadisticasInventario.rows[0],
      recetas_recientes: recetasRecientes.rows,
    };

    return NextResponse.json({
      success: true,
      estadisticas,
    });
  } catch (error: any) {
    console.error("Error obteniendo estadísticas:", error);
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
