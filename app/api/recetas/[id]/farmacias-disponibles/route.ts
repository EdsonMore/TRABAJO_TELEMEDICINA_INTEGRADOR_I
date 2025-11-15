// app/api/recetas/[id]/farmacias-disponibles/route.ts
// MediLink+ - API de distribución de recetas a farmacias
// Retorna todas las farmacias que tienen los medicamentos de la receta
// con disponibilidad, precios y ubicación

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client;
  try {
    // Verificar token
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    const usuario = await verificarToken(token);
    if (!usuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { id } = await params;

    // Obtener conexión
    client = await pool.connect();

    // 1️⃣ Obtener datos de la receta
    const recetaResult = await client.query(
      `SELECT r.id, r.codigo_receta, r.id_farmacia_dispensadora, 
              p.id_ubicacion as paciente_ubicacion
       FROM recetas r
       JOIN citas c ON r.id_cita = c.id
       JOIN pacientes p ON c.id_paciente = p.id
       WHERE r.id = $1`,
      [id]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const receta = recetaResult.rows[0];

    // 2️⃣ Obtener medicamentos de la receta
    const medicamentosResult = await client.query(
      `SELECT 
        rd.id as detalle_id,
        rd.medicamento_id,
        rd.cantidad,
        m.nombre_comercial,
        m.nombre_generico
       FROM receta_detalle rd
       JOIN medicamentos m ON rd.medicamento_id = m.id
       WHERE rd.id_receta = $1
       ORDER BY m.nombre_comercial`,
      [id]
    );

    if (medicamentosResult.rows.length === 0) {
      return NextResponse.json(
        { error: "La receta no tiene medicamentos" },
        { status: 400 }
      );
    }

    const medicamentosReceta = medicamentosResult.rows;

    // 3️⃣ Obtener todas las farmacias con su disponibilidad
    const farmaciasResult = await client.query(
      `SELECT DISTINCT
        f.id,
        f.nombre_comercial,
        f.ruc,
        f.direccion,
        u.departamento,
        u.provincia,
        u.distrito,
        u.codigo_postal,
        f.delivery_disponible,
        f.radio_delivery_km,
         CASE 
            WHEN u.id = $1 THEN 0
            ELSE ROUND((RANDOM() * 5)::numeric, 2)
          END as distancia_km
       FROM farmacias f
       LEFT JOIN ubicaciones u ON f.id_ubicacion = u.id
       WHERE f.id != $2
       ORDER BY distancia_km`,
      [receta.paciente_ubicacion, receta.id_farmacia_dispensadora]
    );

    // 4️⃣ Para cada farmacia, evaluar disponibilidad y precio
    const opciones = [];

    for (const farmacia of farmaciasResult.rows) {
      const detallesMedicamentos = [];
      let precioTotal = 0;
      let todosDisponibles = true;
      let medicamentosDisponibles = 0;
      let medicamentosFaltantes = 0;

      for (const medicamento of medicamentosReceta) {
        // Buscar medicamento en inventario de la farmacia
        const inventarioResult = await client.query(
          `SELECT 
            id,
            stock_actual,
            reservas_activas,
            precio_venta,
            fecha_vencimiento,
            lote,
            disponible
           FROM inventario_farmacia
           WHERE id_farmacia = $1 
           AND id_medicamento = $2 
           AND disponible = true
           ORDER BY fecha_vencimiento ASC
           LIMIT 1`,
          [farmacia.id, medicamento.medicamento_id]
        );

        if (
          inventarioResult.rows.length > 0 &&
          inventarioResult.rows[0].stock_actual - inventarioResult.rows[0].reservas_activas >=
            medicamento.cantidad
        ) {
          // Medicamento disponible
          const item = inventarioResult.rows[0];
          const subtotal = item.precio_venta * medicamento.cantidad;
          precioTotal += subtotal;
          medicamentosDisponibles++;

          detallesMedicamentos.push({
            medicamento_id: medicamento.medicamento_id,
            nombre_comercial: medicamento.nombre_comercial,
            nombre_generico: medicamento.nombre_generico,
            cantidad_requerida: medicamento.cantidad,
            stock_disponible:
              item.stock_actual - item.reservas_activas,
            precio_unitario: item.precio_venta,
            subtotal: subtotal,
            fecha_vencimiento: item.fecha_vencimiento,
            lote: item.lote,
            disponible: true,
          });
        } else if (inventarioResult.rows.length > 0) {
          // Medicamento existe pero stock insuficiente
          const item = inventarioResult.rows[0];
          medicamentosFaltantes++;
          todosDisponibles = false;

          detallesMedicamentos.push({
            medicamento_id: medicamento.medicamento_id,
            nombre_comercial: medicamento.nombre_comercial,
            nombre_generico: medicamento.nombre_generico,
            cantidad_requerida: medicamento.cantidad,
            stock_disponible:
              Math.max(0, item.stock_actual - item.reservas_activas),
            precio_unitario: item.precio_venta,
            subtotal: 0,
            fecha_vencimiento: item.fecha_vencimiento,
            lote: item.lote,
            disponible: false,
            motivo: "Stock insuficiente",
          });
        } else {
          // Medicamento no existe en esta farmacia
          medicamentosFaltantes++;
          todosDisponibles = false;

          detallesMedicamentos.push({
            medicamento_id: medicamento.medicamento_id,
            nombre_comercial: medicamento.nombre_comercial,
            nombre_generico: medicamento.nombre_generico,
            cantidad_requerida: medicamento.cantidad,
            stock_disponible: 0,
            precio_unitario: null,
            subtotal: 0,
            fecha_vencimiento: null,
            lote: null,
            disponible: false,
            motivo: "Medicamento no disponible",
          });
        }
      }

      // Calcular calificación de la opción
      const porcentajeDisponibilidad =
        (medicamentosDisponibles / medicamentosReceta.length) * 100;

      opciones.push({
        farmacia_id: farmacia.id,
        nombre_farmacia: farmacia.nombre_comercial,
        ruc: farmacia.ruc,
        ubicacion: {
          direccion: farmacia.direccion,
          departamento: farmacia.departamento,
          provincia: farmacia.provincia,
          distrito: farmacia.distrito,
          codigo_postal: farmacia.codigo_postal,
        },
        distancia_km: farmacia.distancia_km,
        delivery: {
          disponible: farmacia.delivery_disponible,
          radio_km: farmacia.radio_delivery_km,
          puede_entregar:
            farmacia.delivery_disponible &&
            farmacia.radio_delivery_km >= farmacia.distancia_km,
        },
        disponibilidad: {
          todos_disponibles: todosDisponibles,
          medicamentos_disponibles: medicamentosDisponibles,
          medicamentos_faltantes: medicamentosFaltantes,
          porcentaje: Math.round(porcentajeDisponibilidad),
        },
        precio: {
          total: todosDisponibles ? precioTotal : null,
          moneda: "PEN",
          nota: todosDisponibles
            ? "Precio total si compras aquí"
            : "Algunos medicamentos no están disponibles",
        },
        medicamentos: detallesMedicamentos,
        calificacion: calcularCalificacion(
          todosDisponibles,
          farmacia.distancia_km,
          precioTotal
        ),
      });
    }

    // 5️⃣ Ordenar por disponibilidad y precio
    opciones.sort((a, b) => {
      // Primero por disponibilidad
      if (
        a.disponibilidad.todos_disponibles !==
        b.disponibilidad.todos_disponibles
      ) {
        return a.disponibilidad.todos_disponibles ? -1 : 1;
      }
      // Luego por precio (si ambos tienen todo disponible)
      if (
        a.disponibilidad.todos_disponibles &&
        b.disponibilidad.todos_disponibles
      ) {
        return (a.precio.total || Infinity) - (b.precio.total || Infinity);
      }
      // Por distancia
      return a.distancia_km - b.distancia_km;
    });

    // 6️⃣ Registrar búsqueda para auditoría
    const pacientesResult = await client.query(
      `SELECT id FROM pacientes WHERE id_usuario = $1`,
      [usuario.id]
    );

    if (pacientesResult.rows.length > 0) {
      await client.query(
        `INSERT INTO busquedas_farmacias_recetas 
        (receta_id, paciente_id, farmacias_consultadas)
        VALUES ($1, $2, $3)`,
        [id, pacientesResult.rows[0].id, JSON.stringify(opciones)]
      );
    }

    return NextResponse.json(
      {
        success: true,
        receta: {
          id: receta.id,
          codigo_receta: receta.codigo_receta,
          medicamentos_totales: medicamentosReceta.length,
        },
        opciones_disponibles: opciones.length,
        opciones,
        mensaje: opciones.length > 0 
          ? `Se encontraron ${opciones.length} farmacias disponibles`
          : "No hay farmacias disponibles con los medicamentos",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[ERROR] Farmacias disponibles:", error);
    return NextResponse.json(
      { error: "Error al obtener farmacias disponibles", detalle: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e: any) {
        console.warn("Advertencia: error liberando cliente pg pool:", e?.message || e);
      }
    }
  }
}

// Función auxiliar para calcular calificación de opción
function calcularCalificacion(
  todosDisponibles: boolean,
  distancia: number,
  precio: number
): string {
  if (!todosDisponibles) return "⚠️ Incompleta";

  let score = 100;

  // Penalizar por distancia
  if (distancia > 5) score -= 10;
  if (distancia > 10) score -= 15;

  // Penalizar por precio (comparar con promedio)
  if (precio > 200) score -= 5;

  if (score >= 85) return "⭐⭐⭐⭐⭐ Excelente";
  if (score >= 70) return "⭐⭐⭐⭐ Muy buena";
  if (score >= 50) return "⭐⭐⭐ Buena";
  return "⭐⭐ Regular";
}
