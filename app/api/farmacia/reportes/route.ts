// app/api/farmacia/reportes/route.ts
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

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo") || "resumen"; // resumen, recetas, ventas, inventario
    const fechaInicio = searchParams.get("fecha_inicio");
    const fechaFin = searchParams.get("fecha_fin");

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

    let reporteData: any = {};

    if (tipo === "resumen" || tipo === "ventas") {
      // Reporte de ventas
      const ventasResult = await client.query(
        `SELECT 
          DATE(r.fecha_dispensacion) as fecha,
          COUNT(*) as recetas_dispensadas,
          COUNT(DISTINCT rd.medicamento_id) as medicamentos_vendidos,
          SUM(inv.precio_venta * rd.cantidad) as ingreso_total
        FROM recetas r
        LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
        LEFT JOIN inventario_farmacia inv ON rd.medicamento_id = inv.id_medicamento 
          AND inv.id_farmacia = $1
        WHERE r.id_farmacia_dispensadora = $1
        AND r.estado = 'dispensada'
        ${fechaInicio ? "AND DATE(r.fecha_dispensacion) >= $2" : ""}
        ${fechaFin ? "AND DATE(r.fecha_dispensacion) <= $3" : ""}
        GROUP BY DATE(r.fecha_dispensacion)
        ORDER BY fecha DESC`,
        [farmaciaId, fechaInicio, fechaFin].filter(Boolean)
      );

      reporteData.ventas = ventasResult.rows;
    }

    if (tipo === "resumen" || tipo === "recetas") {
      // Reporte de recetas
      const recetasResult = await client.query(
        `SELECT 
          r.estado,
          COUNT(*) as cantidad,
          COUNT(CASE WHEN r.estado = 'dispensada' THEN 1 END) as dispensadas,
          COUNT(CASE WHEN r.estado = 'cancelada' THEN 1 END) as canceladas,
          COUNT(CASE WHEN r.estado = 'vencida' THEN 1 END) as vencidas
        FROM recetas r
        WHERE r.id_farmacia_dispensadora = $1
        ${fechaInicio ? "AND DATE(r.fecha_emision) >= $2" : ""}
        ${fechaFin ? "AND DATE(r.fecha_emision) <= $3" : ""}
        GROUP BY r.estado`,
        [farmaciaId, fechaInicio, fechaFin].filter(Boolean)
      );

      reporteData.recetas = {
        estadisticas: recetasResult.rows,
        resumen: {
          total: recetasResult.rows.reduce((sum: number, row: any) => sum + row.cantidad, 0),
          dispensadas: recetasResult.rows.reduce(
            (sum: number, row: any) => sum + (row.dispensadas || 0),
            0
          ),
          canceladas: recetasResult.rows.reduce(
            (sum: number, row: any) => sum + (row.canceladas || 0),
            0
          ),
          vencidas: recetasResult.rows.reduce(
            (sum: number, row: any) => sum + (row.vencidas || 0),
            0
          ),
        },
      };
    }

    if (tipo === "resumen" || tipo === "inventario") {
      // Reporte de inventario
      const inventarioResult = await client.query(
        `SELECT 
          m.nombre_comercial,
          m.nombre_generico,
          m.forma_farmaceutica,
          m.concentracion,
          m.categoria_terapeutica,
          inv.stock_actual,
          inv.stock_minimo,
          inv.precio_venta,
          inv.fecha_vencimiento,
          CASE 
            WHEN inv.stock_actual = 0 THEN 'agotado'
            WHEN inv.stock_actual <= inv.stock_minimo THEN 'bajo'
            WHEN inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' 
              AND inv.fecha_vencimiento > CURRENT_DATE THEN 'por_vencer'
            ELSE 'normal'
          END as estado,
          inv.fecha_actualizacion
        FROM inventario_farmacia inv
        JOIN medicamentos m ON inv.id_medicamento = m.id
        WHERE inv.id_farmacia = $1 AND inv.disponible = true
        ORDER BY 
          CASE 
            WHEN inv.stock_actual = 0 THEN 1
            WHEN inv.stock_actual <= inv.stock_minimo THEN 2
            WHEN inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 3
            ELSE 4
          END,
          m.nombre_comercial ASC`,
        [farmaciaId]
      );

      reporteData.inventario = {
        items: inventarioResult.rows,
        resumen: {
          total: inventarioResult.rows.length,
          agotados: inventarioResult.rows.filter((r: any) => r.estado === "agotado").length,
          bajo: inventarioResult.rows.filter((r: any) => r.estado === "bajo").length,
          por_vencer: inventarioResult.rows.filter((r: any) => r.estado === "por_vencer").length,
          valor_total: inventarioResult.rows.reduce(
            (sum: number, row: any) => sum + row.precio_venta * row.stock_actual,
            0
          ),
        },
      };
    }

    if (tipo === "resumen") {
      // Calcular resumen general
      reporteData.resumen = {
        fecha_generacion: new Date().toISOString(),
        recetas_dispensadas_hoy: await client.query(
          `SELECT COUNT(*) as cantidad FROM recetas 
           WHERE id_farmacia_dispensadora = $1 
           AND estado = 'dispensada' 
           AND DATE(fecha_dispensacion) = CURRENT_DATE`,
          [farmaciaId]
        ).then(r => r.rows[0]?.cantidad || 0),
        items_alerta: await client.query(
          `SELECT COUNT(*) as cantidad FROM inventario_farmacia 
           WHERE id_farmacia = $1 
           AND disponible = true
           AND (stock_actual = 0 OR stock_actual <= stock_minimo OR fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days')`,
          [farmaciaId]
        ).then(r => r.rows[0]?.cantidad || 0),
      };
    }

    return NextResponse.json({
      success: true,
      tipo,
      reporte: reporteData,
    });
  } catch (error: any) {
    console.error("Error generando reporte:", error);
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
