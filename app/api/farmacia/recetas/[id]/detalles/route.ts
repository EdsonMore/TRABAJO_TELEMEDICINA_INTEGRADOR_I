// app/api/farmacia/recetas/[id]/detalles/route.ts - NUEVA API
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de receta requerido" },
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

    // Consulta detallada con información de stock
    const result = await client.query(
      `
      SELECT 
        r.*,
        -- Información del paciente
        p.id as paciente_id,
        p.dni,
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        EXTRACT(YEAR FROM AGE(p.fecha_nacimiento)) as paciente_edad,
        p.tipo_sangre,
        p.sexo,
        p.telefono as paciente_telefono,
        -- Información del médico
        m.id as medico_id,
        um.nombre as medico_nombre,
        um.apellido as medico_apellido,
        m.numero_colegiatura,
        e.nombre as especialidad,
        -- Medicamentos con información de stock
        COALESCE(
          json_agg(
            json_build_object(
              'id', rd.id,
              'medicamento_id', rd.medicamento_id,
              'nombre_comercial', med.nombre_comercial,
              'nombre_generico', med.nombre_generico,
              'forma_farmaceutica', med.forma_farmaceutica,
              'concentracion', med.concentracion,
              'cantidad', rd.cantidad,
              'dosis', rd.dosis,
              'frecuencia', rd.frecuencia,
              'duracion_dias', rd.duracion_dias,
              'via_administracion', rd.via_administracion,
              'instrucciones_especiales', rd.instrucciones_especiales,
              'dispensado', rd.dispensado,
              'stock_disponible', COALESCE(inv.stock_actual, 0),
              'precio_venta', COALESCE(inv.precio_venta, 0),
              'fecha_vencimiento', inv.fecha_vencimiento,
              'lote', inv.lote,
              'suficiente_stock', COALESCE(inv.stock_actual, 0) >= rd.cantidad
            ) ORDER BY rd.created_at
          ) FILTER (WHERE rd.id IS NOT NULL), '[]'
        ) as medicamentos
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios up ON p.id_usuario = up.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios um ON m.id_usuario = um.id
      JOIN especialidades e ON m.id_especialidad = e.id
      LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
      LEFT JOIN medicamentos med ON rd.medicamento_id = med.id
      LEFT JOIN inventario_farmacia inv ON (
        med.id = inv.id_medicamento 
        AND inv.id_farmacia = $2 
        AND inv.disponible = true
      )
      WHERE r.id = $1
      GROUP BY r.id, p.id, up.id, m.id, um.id, e.id
      `,
      [id, farmaciaId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const receta = result.rows[0];

    // Calcular totales
    const totalMedicamentos = receta.medicamentos.length;
    const medicamentosConStock = receta.medicamentos.filter(
      (med: any) => med.suficiente_stock
    ).length;
    const totalPrecio = receta.medicamentos.reduce(
      (total: number, med: any) => {
        return total + med.precio_venta * med.cantidad;
      },
      0
    );

    const recetaConTotales = {
      ...receta,
      total_medicamentos: totalMedicamentos,
      medicamentos_con_stock: medicamentosConStock,
      total_precio: totalPrecio,
      tiene_stock_completo: medicamentosConStock === totalMedicamentos,
    };

    return NextResponse.json({
      success: true,
      receta: recetaConTotales,
    });
  } catch (error: any) {
    console.error("Error obteniendo detalles de receta:", error);
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
