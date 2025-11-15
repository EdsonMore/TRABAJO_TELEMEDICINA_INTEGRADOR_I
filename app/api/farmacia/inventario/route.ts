// app/api/farmacia/inventario/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    // ✅ AGREGAR ESTA VALIDACIÓN
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "farmacia") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria") || "";
    const stock = searchParams.get("stock") || "";
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
        inv.*,
        med.nombre_comercial,
        med.nombre_generico,
        med.forma_farmaceutica,
        med.concentracion,
        med.categoria_terapeutica,
        med.principio_activo,
        med.laboratorio,
        -- Estado del stock
        CASE 
          WHEN inv.stock_actual = 0 THEN 'agotado'
          WHEN inv.stock_actual <= inv.stock_minimo THEN 'bajo'
          WHEN inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'por_vencer'
          ELSE 'normal'
        END as estado_stock,
        COUNT(*) OVER() as total_count
      FROM inventario_farmacia inv
      JOIN medicamentos med ON inv.id_medicamento = med.id
      WHERE inv.id_farmacia = $1 AND inv.disponible = true
    `;

    const params: any[] = [farmaciaId];
    let paramCount = 1;

    // Filtros
    if (categoria) {
      paramCount++;
      query += ` AND med.categoria_terapeutica = $${paramCount}`;
      params.push(categoria);
    }

    if (stock === "bajo") {
      paramCount++;
      query += ` AND inv.stock_actual <= inv.stock_minimo`;
    } else if (stock === "agotado") {
      paramCount++;
      query += ` AND inv.stock_actual = 0`;
    } else if (stock === "por_vencer") {
      paramCount++;
      query += ` AND inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'`;
    }

    query += ` ORDER BY 
                CASE 
                  WHEN inv.stock_actual = 0 THEN 1
                  WHEN inv.stock_actual <= inv.stock_minimo THEN 2
                  WHEN inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 3
                  ELSE 4
                END,
                med.nombre_comercial
              LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;

    params.push(limit, offset);

    const result = await client.query(query, params);
    const totalCount = result.rows[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      inventario: result.rows.map((row) => {
        const { total_count, ...item } = row;
        return item;
      }),
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
    console.error("Error obteniendo inventario:", error);
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

export async function POST(request: NextRequest) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    // ✅ AGREGAR ESTA VALIDACIÓN
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "farmacia") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      medicamento_id,
      lote,
      stock_actual,
      stock_minimo,
      precio_venta,
      fecha_vencimiento,
    } = body;

    // Validaciones
    if (!medicamento_id || !lote || !precio_venta) {
      return NextResponse.json(
        { error: "Medicamento, lote y precio son requeridos" },
        { status: 400 }
      );
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

    // Verificar si ya existe el mismo lote
    const existente = await client.query(
      `SELECT id FROM inventario_farmacia 
       WHERE id_farmacia = $1 AND id_medicamento = $2 AND lote = $3`,
      [farmaciaId, medicamento_id, lote]
    );

    if (existente.rows.length > 0) {
      return NextResponse.json(
        {
          error:
            "Ya existe un registro con el mismo lote para este medicamento",
        },
        { status: 400 }
      );
    }

    // Insertar nuevo item
    const result = await client.query(
      `INSERT INTO inventario_farmacia (
        id_farmacia, id_medicamento, lote, stock_actual, stock_minimo,
        precio_venta, fecha_vencimiento
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        farmaciaId,
        medicamento_id,
        lote,
        stock_actual || 0,
        stock_minimo || 10,
        precio_venta,
        fecha_vencimiento,
      ]
    );

    return NextResponse.json({
      success: true,
      item: result.rows[0],
      message: "Medicamento agregado al inventario correctamente",
    });
  } catch (error: any) {
    console.error("Error agregando al inventario:", error);
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
