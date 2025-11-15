// app/api/farmacias/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";

export async function GET(request: NextRequest) {
  let client;
  try {
    client = await pool.connect();

    const { searchParams } = new URL(request.url);
    const farmaciaId = searchParams.get("farmacia_id");

    if (farmaciaId) {
      const farmaciaRes = await client.query(
        `SELECT id, nombre_comercial, direccion, telefono, delivery_disponible, radio_delivery_km FROM farmacias WHERE id = $1`,
        [farmaciaId]
      );

      if (farmaciaRes.rows.length === 0) {
        return NextResponse.json({ error: "Farmacia no encontrada" }, { status: 404 });
      }

      const invRes = await client.query(
        `SELECT inv.id_medicamento, inv.stock_actual, inv.precio_venta, med.nombre_comercial, med.nombre_generico
         FROM inventario_farmacia inv
         JOIN medicamentos med ON inv.id_medicamento = med.id
         WHERE inv.id_farmacia = $1 AND inv.disponible = true`,
        [farmaciaId]
      );

      return NextResponse.json({ success: true, farmacia: farmaciaRes.rows[0], inventario: invRes.rows });
    }

    // Lista de farmacias (pública)
    const res = await client.query(`SELECT id, nombre_comercial, direccion, telefono, delivery_disponible FROM farmacias ORDER BY nombre_comercial LIMIT 200`);

    return NextResponse.json({ success: true, farmacias: res.rows });
  } catch (error: any) {
    console.error("Error obteniendo farmacias:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
