// app/api/farmacia/despachos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 401 });

    const usuario = await verificarToken(token);
    if (!usuario || usuario.rol !== "farmacia") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

    client = await pool.connect();
    const farmaciaRes = await client.query("SELECT id FROM farmacias WHERE id_usuario = $1", [usuario.id]);
    if (farmaciaRes.rows.length === 0) return NextResponse.json({ error: "Farmacia no encontrada" }, { status: 404 });
    const farmaciaId = farmaciaRes.rows[0].id;

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") || null;

    let query = `SELECT d.id, d.id_receta, d.id_paciente, d.fecha_despacho, d.estado, d.medicamentos_despachados as medicamentos, d.costo_total, r.codigo_receta, p.id_usuario as paciente_usuario_id
      FROM despachos_farmacia d
      JOIN recetas r ON d.id_receta = r.id
      JOIN pacientes p ON d.id_paciente = p.id
      WHERE d.id_farmacia = $1`;
    const params: any[] = [farmaciaId];
    if (estado) {
      params.push(estado);
      query += ` AND d.estado = $${params.length}`;
    }

    query += ` ORDER BY d.fecha_despacho DESC LIMIT 100`;

    const res = await client.query(query, params);
    const items = res.rows.map((r) => ({ ...r, medicamentos: r.medicamentos ? JSON.parse(r.medicamentos) : [] }));

    return NextResponse.json({ success: true, despachos: items });
  } catch (error: any) {
    console.error("Error listando despachos farmacia:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

export async function PATCH(request: NextRequest) {
  let client;
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 401 });

    const usuario = await verificarToken(token);
    if (!usuario || usuario.rol !== "farmacia") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

    const body = await request.json();
    const { despacho_id, accion, medicamentos_procesados } = body;
    if (!despacho_id || !accion) return NextResponse.json({ error: "despacho_id y accion requeridos" }, { status: 400 });

    client = await pool.connect();
    await client.query('BEGIN');

    // Verificar farmacia dueña
    const farmaciaRes = await client.query("SELECT id FROM farmacias WHERE id_usuario = $1", [usuario.id]);
    if (farmaciaRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: "Farmacia no encontrada" }, { status: 404 });
    }
    const farmaciaId = farmaciaRes.rows[0].id;

    const despachoRes = await client.query("SELECT * FROM despachos_farmacia WHERE id = $1 AND (id_farmacia = $2 OR id_farmacia IS NULL)", [despacho_id, farmaciaId]);
    if (despachoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: "Despacho no encontrado o no autorizado" }, { status: 404 });
    }

    const despacho = despachoRes.rows[0];

    // Acciones: aceptar, preparar, despachar, rechazar
    if (accion === 'preparar') {
      await client.query("UPDATE despachos_farmacia SET estado = 'en_preparacion', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [despacho_id]);
    } else if (accion === 'rechazar') {
      await client.query("UPDATE despachos_farmacia SET estado = 'rechazado', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [despacho_id]);
    } else if (accion === 'despachar') {
      // medicamentos_procesados: [{ id_medicamento, cantidad }]
      if (!Array.isArray(medicamentos_procesados) || medicamentos_procesados.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'medicamentos_procesados requeridos para despachar' }, { status: 400 });
      }

      // Verificar stock y decrementar
      for (const m of medicamentos_procesados) {
        const inv = await client.query(
          `SELECT id, stock_actual FROM inventario_farmacia WHERE id_farmacia = $1 AND id_medicamento = $2 FOR UPDATE`,
          [farmaciaId, m.id_medicamento]
        );
        if (inv.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: `Medicamento ${m.id_medicamento} no disponible en inventario` }, { status: 400 });
        }
        const stock = inv.rows[0].stock_actual;
        if (stock < m.cantidad) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: `Stock insuficiente para medicamento ${m.id_medicamento}` }, { status: 400 });
        }
        await client.query(`UPDATE inventario_farmacia SET stock_actual = stock_actual - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [m.cantidad, inv.rows[0].id]);
      }

      // Marcar como despachado y registrar fecha
      await client.query("UPDATE despachos_farmacia SET estado = 'retirado', fecha_despacho = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [despacho_id]);
    } else if (accion === 'aceptar') {
      await client.query("UPDATE despachos_farmacia SET estado = 'aceptado', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [despacho_id]);
    } else {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
    }

    // Notificar al paciente
    const pacienteRes = await client.query("SELECT id_usuario FROM pacientes WHERE id = $1", [despacho.id_paciente]);
    if (pacienteRes.rows.length > 0) {
      const pacienteUsuarioId = pacienteRes.rows[0].id_usuario;
      await client.query(`INSERT INTO notificaciones (id_usuario, titulo, descripcion, tipo, referencia_id) VALUES ($1,$2,$3,$4,$5)`, [
        pacienteUsuarioId,
        'Actualización de despacho',
        `Su despacho ${despacho_id} ha cambiado de estado a ${accion}`,
        'despacho',
        despacho_id,
      ]);
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (client) await client.query('ROLLBACK');
    console.error('Error actualizando despacho:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
