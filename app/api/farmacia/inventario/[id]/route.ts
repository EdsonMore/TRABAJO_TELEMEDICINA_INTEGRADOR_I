// app/api/farmacia/inventario/[id]/route.ts
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

    // ✅ AGREGAR ESTA VALIDACIÓN
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "farmacia") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { stock_actual, stock_minimo, precio_venta, disponible } = body;

    client = await pool.connect();

    // Verificar que el item pertenece a la farmacia
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

    const updateResult = await client.query(
      `UPDATE inventario_farmacia 
       SET stock_actual = $1, stock_minimo = $2, precio_venta = $3, 
           disponible = $4, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $5 AND id_farmacia = $6
       RETURNING *`,
      [stock_actual, stock_minimo, precio_venta, disponible, id, farmaciaId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Item no encontrado o no pertenece a esta farmacia" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: updateResult.rows[0],
      message: "Inventario actualizado correctamente",
    });
  } catch (error: any) {
    console.error("Error actualizando inventario:", error);
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
