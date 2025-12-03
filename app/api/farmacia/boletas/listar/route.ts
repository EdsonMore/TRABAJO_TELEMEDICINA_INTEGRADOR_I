// app/api/farmacia/boletas/listar/route.ts
// API para listar todas las boletas generadas por una farmacia

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    // Verificar token del usuario
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = token ? await verificarToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Solo farmacia y admin pueden acceder
    if (user.rol !== "farmacia" && user.rol !== "admin") {
      return NextResponse.json(
        { error: "No tienes permiso para acceder a boletas" },
        { status: 403 }
      );
    }

    // Obtener el ID de la farmacia del usuario
    const farmaciaResult = await client.query(
      `SELECT id FROM farmacias WHERE id_usuario = $1 LIMIT 1`,
      [user.userId]
    );

    if (farmaciaResult.rows.length === 0 && user.rol !== "admin") {
      return NextResponse.json(
        { error: "No tienes una farmacia asociada" },
        { status: 403 }
      );
    }

    const farmaciaId = user.rol === "admin" 
      ? request.nextUrl.searchParams.get("farmacia_id") 
      : farmaciaResult.rows[0]?.id;

    if (!farmaciaId) {
      return NextResponse.json(
        { error: "ID de farmacia requerido" },
        { status: 400 }
      );
    }

    // Obtener parámetros de paginación y filtrado
    const pagina = parseInt(request.nextUrl.searchParams.get("pagina") || "1");
    const limite = parseInt(request.nextUrl.searchParams.get("limite") || "20");
    const estado = request.nextUrl.searchParams.get("estado");
    const fechaDesde = request.nextUrl.searchParams.get("fecha_desde");
    const fechaHasta = request.nextUrl.searchParams.get("fecha_hasta");

    const offset = (pagina - 1) * limite;

    // Construir WHERE dinamicamente
    let whereClause = "bd.id_farmacia = $1";
    const params: any[] = [farmaciaId];
    let paramCount = 2;

    if (estado) {
      whereClause += ` AND bd.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    if (fechaDesde) {
      whereClause += ` AND bd.fecha_despacho >= $${paramCount}`;
      params.push(new Date(fechaDesde));
      paramCount++;
    }

    if (fechaHasta) {
      whereClause += ` AND bd.fecha_despacho <= $${paramCount}`;
      params.push(new Date(fechaHasta));
      paramCount++;
    }

    // Obtener boletas
    const boletasResult = await client.query(
      `SELECT 
        bd.id,
        bd.numero_boleta,
        bd.fecha_despacho,
        bd.subtotal,
        bd.igv,
        bd.total,
        bd.tipo_entrega,
        bd.estado,
        bd.boleta_pdf_path,
        bd.nota_venta_pdf_path,
        r.codigo_receta,
        u.nombre as paciente_nombre,
        u.apellido as paciente_apellido,
        p.dni as paciente_dni
      FROM boletas_despacho bd
      JOIN recetas r ON bd.id_receta = r.id
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios u ON p.id_usuario = u.id
      WHERE ${whereClause}
      ORDER BY bd.fecha_despacho DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limite, offset]
    );

    // Obtener total para paginación
    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM boletas_despacho bd
       JOIN recetas r ON bd.id_receta = r.id
       WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0]?.total || "0");
    const totalPaginas = Math.ceil(total / limite);

    return NextResponse.json({
      message: "Boletas obtenidas correctamente",
      boletas: boletasResult.rows,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas,
      },
    });
  } catch (error: any) {
    console.error("Error obteniendo boletas:", error);
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

// Endpoint para obtener estadísticas de boletas
export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = token ? await verificarToken(token) : null;

    if (!user || (user.rol !== "farmacia" && user.rol !== "admin")) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const { accion } = await request.json();

    if (accion === "estadisticas") {
      const farmaciaResult = await client.query(
        `SELECT id FROM farmacias WHERE id_usuario = $1 LIMIT 1`,
        [user.userId]
      );

      const farmaciaId = user.rol === "admin" 
        ? request.nextUrl.searchParams.get("farmacia_id") 
        : farmaciaResult.rows[0]?.id;

      if (!farmaciaId) {
        return NextResponse.json({ error: "Farmacia no encontrada" }, { status: 404 });
      }

      // Estadísticas generales
      const stats = await client.query(
        `SELECT 
          COUNT(*) as total_boletas,
          SUM(total) as total_ventas,
          SUM(subtotal) as subtotal_total,
          SUM(igv) as igv_total,
          COUNT(CASE WHEN estado = 'generada' THEN 1 END) as boletas_generadas,
          COUNT(CASE WHEN estado = 'impresa' THEN 1 END) as boletas_impresas,
          COUNT(CASE WHEN estado = 'entregada' THEN 1 END) as boletas_entregadas
        FROM boletas_despacho
        WHERE id_farmacia = $1`,
        [farmaciaId]
      );

      return NextResponse.json({
        message: "Estadísticas obtenidas",
        estadisticas: stats.rows[0],
      });
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error en estadísticas:", error);
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
