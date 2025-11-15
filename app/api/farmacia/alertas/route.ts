// app/api/farmacia/alertas/route.ts
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
    const tipo = searchParams.get("tipo"); // stock_bajo, vencimiento, agotado, todas
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

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

    let query = `
      SELECT 
        inv.id,
        m.nombre_comercial,
        m.nombre_generico,
        m.forma_farmaceutica,
        m.concentracion,
        inv.stock_actual,
        inv.stock_minimo,
        inv.lote,
        inv.fecha_vencimiento,
        inv.precio_venta,
        CASE 
          WHEN inv.stock_actual = 0 THEN 'agotado'
          WHEN inv.stock_actual <= inv.stock_minimo THEN 'stock_bajo'
          WHEN inv.fecha_vencimiento <= CURRENT_DATE THEN 'vencido'
          WHEN inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'por_vencer'
          ELSE 'normal'
        END as tipo_alerta,
        CASE 
          WHEN inv.stock_actual = 0 THEN 'critical'
          WHEN inv.stock_actual <= inv.stock_minimo THEN 'warning'
          WHEN inv.fecha_vencimiento <= CURRENT_DATE THEN 'danger'
          WHEN inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'info'
          ELSE 'success'
        END as severidad,
        COUNT(*) OVER() as total_count
      FROM inventario_farmacia inv
      JOIN medicamentos m ON inv.id_medicamento = m.id
      WHERE inv.id_farmacia = $1 
      AND inv.disponible = true
      AND (
        inv.stock_actual = 0 
        OR inv.stock_actual <= inv.stock_minimo 
        OR inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
      )
    `;

    const params: any[] = [farmaciaId];

    if (tipo && tipo !== "todas") {
      if (tipo === "stock_bajo") {
        query += ` AND inv.stock_actual <= inv.stock_minimo AND inv.stock_actual > 0`;
      } else if (tipo === "agotado") {
        query += ` AND inv.stock_actual = 0`;
      } else if (tipo === "vencimiento") {
        query += ` AND inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'`;
      }
    }

    query += ` ORDER BY 
                CASE 
                  WHEN inv.stock_actual = 0 THEN 1
                  WHEN inv.fecha_vencimiento <= CURRENT_DATE THEN 2
                  WHEN inv.stock_actual <= inv.stock_minimo THEN 3
                  WHEN inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 4
                  ELSE 5
                END,
                inv.fecha_vencimiento ASC
              LIMIT $2 OFFSET $3`;

    params.push(limit, offset);

    const result = await client.query(query, params);
    const totalCount = result.rows[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Agrupar alertas por severidad
    const alertasAgrupadas = {
      critical: result.rows.filter((r) => r.severidad === "critical"),
      danger: result.rows.filter((r) => r.severidad === "danger"),
      warning: result.rows.filter((r) => r.severidad === "warning"),
      info: result.rows.filter((r) => r.severidad === "info"),
    };

    return NextResponse.json({
      success: true,
      alertas: result.rows,
      agrupadas: alertasAgrupadas,
      estadisticas: {
        total: totalCount,
        critical: alertasAgrupadas.critical.length,
        danger: alertasAgrupadas.danger.length,
        warning: alertasAgrupadas.warning.length,
        info: alertasAgrupadas.info.length,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error obteniendo alertas:", error);
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
