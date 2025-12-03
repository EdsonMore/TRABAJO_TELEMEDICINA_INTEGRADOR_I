// app/api/farmacia/recetas/[id]/generar-boleta/route.ts
// API para generar boletas de despacho cuando se completa el despacho

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";
import { generarBoletaDespacho } from "@/lib/pdf-boleta-despacho";
import fs from "fs/promises";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: any = null;

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
    const recetaId = id;
    const { medicamentos_procesados, observaciones } = await request.json();

    if (!medicamentos_procesados || medicamentos_procesados.length === 0) {
      return NextResponse.json(
        { error: "Medicamentos procesados requeridos" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Obtener ID de la farmacia del usuario
    const farmaciaResult = await client.query(
      "SELECT id FROM farmacias WHERE id_usuario = $1",
      [usuario.userId]
    );

    if (farmaciaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Farmacia no encontrada" },
        { status: 404 }
      );
    }

    const farmaciaId = farmaciaResult.rows[0].id;

    // Verificar si la receta ya tiene boleta (evitar duplicadas)
    const boletaExistenteResult = await client.query(
      "SELECT id FROM recetas WHERE id = $1 AND boleta_despacho_id IS NOT NULL",
      [recetaId]
    );

    if (boletaExistenteResult.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Esta receta ya tiene una boleta generada",
        boleta_existente: true,
      });
    }

    // Obtener detalles de la receta
    const recetaResult = await client.query(
      `SELECT 
        r.id,
        r.codigo_receta,
        r.tipo_entrega,
        r.direccion_entrega,
        -- Información del paciente
        up.nombre as paciente_nombre,
        up.apellido as paciente_apellido,
        up.email as paciente_email,
        up.telefono as paciente_telefono,
        p.dni as paciente_dni,
        -- Información de la farmacia
        f.nombre_comercial as farmacia_nombre,
        f.ruc as farmacia_ruc,
        f.direccion as farmacia_direccion,
        uf.telefono as farmacia_telefono
       FROM recetas r
       JOIN citas c ON r.id_cita = c.id
       JOIN pacientes p ON c.id_paciente = p.id
       JOIN usuarios up ON p.id_usuario = up.id
       JOIN farmacias f ON r.farmacia_seleccionada_id = f.id
       JOIN usuarios uf ON f.id_usuario = uf.id
       WHERE r.id = $1 AND r.farmacia_seleccionada_id = $2`,
      [recetaId, farmaciaId]
    );

    if (recetaResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Receta no encontrada o no pertenece a esta farmacia" },
        { status: 404 }
      );
    }

    const receta = recetaResult.rows[0];

    // Calcular subtotal, IGV y total
    let subtotal = 0;
    medicamentos_procesados.forEach((med: any) => {
      subtotal += med.cantidad_dispensada * med.precio_unitario;
    });

    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    // Obtener medicamentos con detalles completos para la boleta
    const medicamentosConDetalles = medicamentos_procesados.map((med: any) => {
      return {
        medicamento_id: med.medicamento_id,
        nombre_comercial: med.nombre_comercial || "",
        nombre_generico: med.nombre_generico || "",
        cantidad_dispensada: med.cantidad_dispensada,
        precio_unitario: med.precio_unitario,
        subtotal: med.cantidad_dispensada * med.precio_unitario,
        lote: med.lote || "",
        dosis: med.dosis || "",
        frecuencia: med.frecuencia || "",
      };
    });

    // Generar número único para la boleta
    const fecha = new Date();
    const timestamp = fecha.getTime();
    const numeroBoleta = `BOL-${farmaciaId.substring(0, 8)}-${timestamp.toString().slice(-8)}`;

    // Preparar datos para la boleta
    const dataBoleta = {
      numero_boleta: numeroBoleta,
      fecha_despacho: new Date().toISOString(),
      codigo_receta: receta.codigo_receta,
      paciente: {
        nombre: receta.paciente_nombre,
        apellido: receta.paciente_apellido,
        dni: receta.paciente_dni,
        email: receta.paciente_email,
        telefono: receta.paciente_telefono,
      },
      farmacia: {
        nombre: receta.farmacia_nombre,
        ruc: receta.farmacia_ruc,
        direccion: receta.farmacia_direccion,
        telefono: receta.farmacia_telefono,
      },
      medicamentos: medicamentosConDetalles,
      subtotal,
      igv,
      total,
      tipo_entrega: receta.tipo_entrega || "recojo",
      direccion_entrega: receta.direccion_entrega || undefined,
      observaciones,
    };

    // Generar PDFs
    const boletaPdf = generarBoletaDespacho(dataBoleta, "farmacia");
    const notaVentaPdf = generarBoletaDespacho(dataBoleta, "paciente");

    // Crear directorios si no existen
    const boletasDir = path.join(process.cwd(), "public", "boletas");
    const notasDir = path.join(process.cwd(), "public", "notas-venta");

    try {
      await fs.mkdir(boletasDir, { recursive: true });
      await fs.mkdir(notasDir, { recursive: true });
    } catch (err) {
      console.error("Error creando directorios:", err);
    }

    // Guardar PDFs
    const boletaFilename = `boleta-${numeroBoleta}.pdf`;
    const notaFilename = `nota-${numeroBoleta}.pdf`;

    const boletaPath = path.join(boletasDir, boletaFilename);
    const notaPath = path.join(notasDir, notaFilename);

    try {
      await fs.writeFile(boletaPath, boletaPdf);
      await fs.writeFile(notaPath, notaVentaPdf);
    } catch (err) {
      console.error("Error guardando PDFs:", err);
      // No interrumpir el flujo si falla el guardado de archivos
    }

    // Registrar boleta en la BD
    const boletaDbResult = await client.query(
      `INSERT INTO boletas_despacho (
        id_receta,
        id_farmacia,
        numero_boleta,
        fecha_despacho,
        subtotal,
        igv,
        total,
        tipo_entrega,
        direccion_entrega,
        medicamentos_despachados,
        boleta_pdf_path,
        nota_venta_pdf_path,
        estado,
        observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        recetaId,
        farmaciaId,
        numeroBoleta,
        new Date(),
        subtotal,
        igv,
        total,
        dataBoleta.tipo_entrega,
        dataBoleta.direccion_entrega || null,
        JSON.stringify(medicamentosConDetalles),
        `/boletas/${boletaFilename}`,
        `/notas-venta/${notaFilename}`,
        "generada",
        observaciones || null,
      ]
    );

    const boletaId = boletaDbResult.rows[0]?.id;

    // Actualizar receta con la referencia a la boleta
    await client.query(
      `UPDATE recetas 
       SET boleta_despacho_id = $1
       WHERE id = $2`,
      [boletaId, recetaId]
    );

    return NextResponse.json({
      success: true,
      message: "Boleta generada correctamente",
      boleta: {
        id: boletaId,
        numero_boleta: numeroBoleta,
        boleta_pdf_path: `/boletas/${boletaFilename}`,
        nota_venta_pdf_path: `/notas-venta/${notaFilename}`,
      },
    });
  } catch (error: any) {
    console.error("Error generando boleta:", error);
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
