// app/api/paciente/despachos/route.ts
// Endpoint para que pacientes vean sus recetas en despacho
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

    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const recetaId = searchParams.get("receta_id");

    client = await pool.connect();

    // Obtener ID del paciente
    const pacienteResult = await client.query(
      "SELECT id FROM pacientes WHERE id_usuario = $1",
      [usuario.id]
    );

    if (pacienteResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const pacienteId = pacienteResult.rows[0].id;

    // Construir query
    let query = `
      SELECT 
        d.id,
        r.codigo_receta,
        d.estado,
        f.nombre as farmacia_nombre,
        f.direccion as farmacia_direccion,
        f.telefono as farmacia_telefono,
        d.fecha_despacho,
        d.medicamentos_despachados as medicamentos,
        d.costo_total,
        d.observaciones
      FROM despachos_farmacia d
      JOIN recetas r ON d.id_receta = r.id
      JOIN farmacias f ON d.id_farmacia = f.id
      WHERE d.id_paciente = $1
    `;

    const params: any[] = [pacienteId];

    if (recetaId) {
      query += ` AND r.id = $2`;
      params.push(recetaId);
    }

    query += ` ORDER BY d.fecha_despacho DESC LIMIT 50`;

    const result = await client.query(query, params);

    const despachos = result.rows.map((row) => ({
      ...row,
      medicamentos: row.medicamentos ? JSON.parse(row.medicamentos) : [],
    }));

    return NextResponse.json({
      success: true,
      despachos,
    });
  } catch (error: any) {
    console.error("Error obteniendo despachos:", error);
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

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);

    if (!usuario || usuario.rol !== "paciente") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const { receta_id, farmacia_id, medicamentos, tipo_envio, direccion_envio, observaciones } = body;

    if (!receta_id || !Array.isArray(medicamentos) || medicamentos.length === 0) {
      return NextResponse.json({ error: "receta_id y medicamentos son requeridos" }, { status: 400 });
    }

    client = await pool.connect();

    // Obtener ID del paciente
    const pacienteResult = await client.query(
      "SELECT id FROM pacientes WHERE id_usuario = $1",
      [usuario.id]
    );

    if (pacienteResult.rows.length === 0) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const pacienteId = pacienteResult.rows[0].id;

    // Verificar receta
    const recetaResult = await client.query(
      "SELECT id, id_paciente, id_farmacia_dispensadora FROM recetas WHERE id = $1",
      [receta_id]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json({ error: "Receta no encontrada" }, { status: 404 });
    }

    const receta = recetaResult.rows[0];

    if (receta.id_paciente !== pacienteId) {
      return NextResponse.json({ error: "La receta no pertenece al paciente autenticado" }, { status: 403 });
    }

    // Determinar farmacia destino
    let destinoFarmaciaId = farmacia_id || receta.id_farmacia_dispensadora || null;

    // Si paciente eligió retirar, farmacia_id es requerido
    if (tipo_envio === 'retirar' && !destinoFarmaciaId) {
      return NextResponse.json({ error: "Debe seleccionar una farmacia para retirar" }, { status: 400 });
    }

    // Calcular costo total si hay farmacia destino
    let costoTotal = 0;
    const medicamentosProcesados: any[] = [];

    if (destinoFarmaciaId) {
      // Obtener precios y stock desde inventario
      const ids = medicamentos.map((m: any) => m.id_medicamento);
      const invRes = await client.query(
        `SELECT id_medicamento, stock_actual, precio_venta FROM inventario_farmacia WHERE id_farmacia = $1 AND id_medicamento = ANY($2::int[])`,
        [destinoFarmaciaId, ids]
      );

      const invMap: any = {};
      invRes.rows.forEach((r: any) => {
        invMap[r.id_medicamento] = r;
      });

      const insuficientes: string[] = [];

      for (const m of medicamentos) {
        const invItem = invMap[m.id_medicamento];
        const cantidad = Number(m.cantidad) || 1;
        if (!invItem) {
          insuficientes.push(`Medicamento ${m.id_medicamento} no disponible en la farmacia`);
          continue;
        }
        if (invItem.stock_actual < cantidad) {
          insuficientes.push(`Stock insuficiente para medicamento ${m.id_medicamento}`);
        }
        const precio = parseFloat(invItem.precio_venta) || 0;
        costoTotal += precio * cantidad;
        medicamentosProcesados.push({ id_medicamento: m.id_medicamento, cantidad, precio });
      }

      if (insuficientes.length > 0) {
        return NextResponse.json({ error: 'Stock insuficiente', detalles: insuficientes }, { status: 400 });
      }
    } else {
      // Sin farmacia destino: estimar costo 0 (se resolverá por farmacia)
      for (const m of medicamentos) {
        const cantidad = Number(m.cantidad) || 1;
        medicamentosProcesados.push({ id_medicamento: m.id_medicamento, cantidad });
      }
      costoTotal = 0;
    }

    // Insertar despacho
    const insertRes = await client.query(
      `INSERT INTO despachos_farmacia (id_receta, id_farmacia, id_paciente, medicamentos_despachados, costo_total, estado, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [receta_id, destinoFarmaciaId, pacienteId, JSON.stringify(medicamentosProcesados), costoTotal, destinoFarmaciaId ? 'pendiente_recepcion' : 'solicitado', observaciones || null]
    );

    const despachoId = insertRes.rows[0].id;

    // Notificar a la farmacia si existe
    if (destinoFarmaciaId) {
      const farmUserRes = await client.query("SELECT id_usuario FROM farmacias WHERE id = $1", [destinoFarmaciaId]);
      if (farmUserRes.rows.length > 0) {
        const farmaciaUserId = farmUserRes.rows[0].id_usuario;
        await client.query(
          `INSERT INTO notificaciones (id_usuario, titulo, descripcion, tipo, referencia_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [farmaciaUserId, 'Nueva solicitud de despacho', `Solicitud de despacho #${despachoId} para receta ${receta_id}`, 'despacho', despachoId]
        );
      }
    } else {
      // TODO: notificar a farmacias cercanas (implementación futura)
    }

    return NextResponse.json({ success: true, despachoId });
  } catch (error: any) {
    console.error("Error creando despacho desde paciente:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
