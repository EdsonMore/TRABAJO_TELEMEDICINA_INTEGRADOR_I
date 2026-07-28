// app/api/farmacia/recetas/[id]/obtener-boleta/route.ts
// API para obtener la boleta del paciente (nota de venta)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recetaId } = await params;

  if (!recetaId) {
    return NextResponse.json(
      { error: "ID de receta requerido" },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    // Verificar token del usuario (cualquier usuario autenticado puede ver su receta)
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = token ? await verificarToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener la receta y su boleta asociada
    const recetaResult = await client.query(
      `SELECT 
        r.id,
        r.codigo_receta,
        r.boleta_despacho_id,
        c.id_paciente as paciente_id,
        p.id_usuario as paciente_usuario_id,
        bd.id as boleta_id,
        bd.numero_boleta,
        bd.fecha_despacho,
        bd.subtotal,
        bd.igv,
        bd.total,
        bd.tipo_entrega,
        bd.direccion_entrega,
        bd.medicamentos_despachados,
        bd.nota_venta_pdf_path,
        bd.boleta_pdf_path,
        bd.estado,
        bd.observaciones
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      LEFT JOIN boletas_despacho bd ON r.boleta_despacho_id = bd.id
      WHERE r.id = $1`,
      [recetaId]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const receta = recetaResult.rows[0];

    // Verificar que el usuario sea el paciente propietario
    if (receta.paciente_usuario_id !== user.userId && user.rol !== "admin") {
      return NextResponse.json(
        { error: "No tienes permiso para acceder a esta boleta" },
        { status: 403 }
      );
    }

    console.log(`🔍 Consulta boleta para receta: ${recetaId}`);
    console.log(`   - boleta_despacho_id: ${receta.boleta_despacho_id}`);
    console.log(`   - boleta_id: ${receta.boleta_id}`);
    console.log(`   - nota_venta_pdf_path: ${receta.nota_venta_pdf_path}`);
    console.log(`   - boleta_pdf_path: ${receta.boleta_pdf_path}`);
    console.log(`   - estado: ${receta.estado}`);

    // Si no hay boleta generada aún
    if (!receta.boleta_id) {
      console.log(`⚠️ No hay boleta para esta receta (boleta_id es null)`);
      return NextResponse.json(
        { 
          message: "La boleta aún no ha sido generada",
          boleta: null
        },
        { status: 200 }
      );
    }

    // Retornar información de la boleta
    return NextResponse.json({
      message: "Boleta obtenida correctamente",
      boleta: {
        id: receta.boleta_id,
        numero_boleta: receta.numero_boleta,
        fecha_despacho: receta.fecha_despacho,
        subtotal: receta.subtotal,
        igv: receta.igv,
        total: receta.total,
        tipo_entrega: receta.tipo_entrega,
        direccion_entrega: receta.direccion_entrega,
        medicamentos_despachados: receta.medicamentos_despachados,
        nota_venta_pdf_path: receta.nota_venta_pdf_path,
        boleta_pdf_path: receta.boleta_pdf_path,
        estado: receta.estado,
        observaciones: receta.observaciones,
      },
    });
  } catch (error: any) {
    console.error("Error obteniendo boleta:", error);
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

// GET para descargar el PDF directamente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recetaId } = await params;
  const { tipo } = await request.json(); // "boleta" o "nota"

  if (!recetaId || !tipo) {
    return NextResponse.json(
      { error: "ID de receta y tipo de documento requeridos" },
      { status: 400 }
    );
  }

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

    // Obtener la receta
    const recetaResult = await client.query(
      `SELECT 
        c.id_paciente as paciente_id,
        p.id_usuario as paciente_usuario_id,
        bd.nota_venta_pdf_path,
        bd.boleta_pdf_path
      FROM recetas r
      JOIN citas c ON r.id_cita = c.id
      JOIN pacientes p ON c.id_paciente = p.id
      LEFT JOIN boletas_despacho bd ON r.boleta_despacho_id = bd.id
      WHERE r.id = $1`,
      [recetaId]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const receta = recetaResult.rows[0];

    // Verificar permisos
    if (receta.paciente_usuario_id !== user.userId && user.rol !== "admin") {
      return NextResponse.json(
        { error: "No tienes permiso para descargar esta boleta" },
        { status: 403 }
      );
    }

    // Obtener ruta del archivo
    const pdfPath = tipo === "nota" ? receta.nota_venta_pdf_path : receta.boleta_pdf_path;

    if (!pdfPath) {
      return NextResponse.json(
        { error: `Boleta de tipo '${tipo}' no disponible aún` },
        { status: 404 }
      );
    }

    // Retornar la ruta del PDF para descargar desde frontend
    return NextResponse.json({
      message: "Ruta del PDF obtenida",
      pdfPath,
      nombre_archivo: `${tipo === "nota" ? "nota-venta" : "boleta"}-${new Date().toISOString().split("T")[0]}.pdf`,
    });
  } catch (error: any) {
    console.error("Error obteniendo PDF de boleta:", error);
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
