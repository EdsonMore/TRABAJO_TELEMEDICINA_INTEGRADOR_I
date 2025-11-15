// app/api/farmacia/dashboard/stats/route.ts
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

    // 1. Obtener estadísticas de recetas
    const recetasResult = await client.query(
      `SELECT 
        COUNT(CASE WHEN r.estado = 'activa' THEN 1 END) as pendientes,
        COUNT(CASE WHEN r.estado = 'en_proceso' THEN 1 END) as en_proceso,
        COUNT(CASE WHEN r.estado = 'dispensada' AND DATE(r.fecha_dispensacion) = CURRENT_DATE THEN 1 END) as dispensadas_hoy,
        COUNT(*) as total
      FROM recetas r
      WHERE r.id_farmacia_dispensadora = $1 
      AND r.estado IN ('activa', 'en_proceso', 'dispensada', 'vencida')`,
      [farmaciaId]
    );

    const recetas = {
      pendientes: parseInt(recetasResult.rows[0].pendientes) || 0,
      enProceso: parseInt(recetasResult.rows[0].en_proceso) || 0,
      dispensadasHoy: parseInt(recetasResult.rows[0].dispensadas_hoy) || 0,
      total: parseInt(recetasResult.rows[0].total) || 0,
    };

    // 2. Obtener estadísticas de inventario
    const inventarioResult = await client.query(
      `SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN inv.stock_actual <= inv.stock_minimo AND inv.stock_actual > 0 THEN 1 END) as stock_bajo,
        COUNT(CASE WHEN inv.stock_actual = 0 THEN 1 END) as agotados,
        COUNT(CASE WHEN inv.fecha_actualizacion >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as nuevos_ingresos
      FROM inventario_farmacia inv
      WHERE inv.id_farmacia = $1 AND inv.disponible = true`,
      [farmaciaId]
    );

    const inventario = {
      totalItems: parseInt(inventarioResult.rows[0].total_items) || 0,
      stockBajo: parseInt(inventarioResult.rows[0].stock_bajo) || 0,
      agotados: parseInt(inventarioResult.rows[0].agotados) || 0,
      nuevosIngresos: parseInt(inventarioResult.rows[0].nuevos_ingresos) || 0,
    };

    // 3. Obtener estadísticas de ventas del día
    const ventasResult = await client.query(
      `SELECT 
        COALESCE(SUM(CAST(p.monto AS DECIMAL(10,2))), 0) as total_hoy,
        -- Contar recetas dispensadas hoy por esta farmacia (tabla recetas)
        (SELECT COUNT(*) FROM recetas r WHERE r.id_farmacia_dispensadora = $1 AND DATE(r.fecha_dispensacion) = CURRENT_DATE AND r.estado = 'dispensada') as recetas_hoy,
        COUNT(DISTINCT CASE WHEN p.entidad_tipo = 'medicamento' THEN p.entidad_id END) as productos_vendidos
      FROM pagos p
      WHERE p.usuario_id IN (SELECT id_usuario FROM farmacias WHERE id = $1)
      AND DATE(p.fecha_pago) = CURRENT_DATE
      AND p.estado = 'completado'`,
      [farmaciaId]
    );

    const ventas = {
      totalHoy: parseFloat(ventasResult.rows[0]?.total_hoy || 0) || 0,
      recetasHoy: parseInt(ventasResult.rows[0]?.recetas_hoy || 0) || 0,
      productosVendidos: parseInt(ventasResult.rows[0]?.productos_vendidos || 0) || 0,
    };

    // 4. Obtener alertas activas
    const alertasResult = await client.query(
      `SELECT 
        COUNT(*) as activas,
        COUNT(CASE WHEN inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' AND inv.fecha_vencimiento > CURRENT_DATE THEN 1 END) as por_vencer,
        COUNT(CASE WHEN inv.stock_actual = 0 THEN 1 END) as stock_critico
      FROM inventario_farmacia inv
      WHERE inv.id_farmacia = $1 
      AND inv.disponible = true
      AND (inv.stock_actual = 0 OR inv.stock_actual <= inv.stock_minimo OR inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days')`,
      [farmaciaId]
    );

    const alertas = {
      activas: parseInt(alertasResult.rows[0]?.activas || 0) || 0,
      porVencer: parseInt(alertasResult.rows[0]?.por_vencer || 0) || 0,
      stockCritico: parseInt(alertasResult.rows[0]?.stock_critico || 0) || 0,
    };

    return NextResponse.json({
      success: true,
      stats: {
        recetas,
        inventario,
        ventas,
        alertas,
      },
    });
  } catch (error: any) {
    console.error("Error obteniendo estadísticas de farmacia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
