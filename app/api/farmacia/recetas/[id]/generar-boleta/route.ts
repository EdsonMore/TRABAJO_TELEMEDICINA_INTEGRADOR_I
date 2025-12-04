// app/api/farmacia/recetas/[id]/generar-boleta/route.ts
// API para generar boletas de despacho cuando se completa el despacho

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";
import { verificarToken } from "@/lib/auth";
import { generarBoletaDespacho } from "@/lib/pdf-boleta-despacho";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: any = null;

  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      console.error(`❌ TOKEN REQUERIDO pero no fue proporcionado`);
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }

    console.log(`\n================== GENERAR BOLETA ==================`);
    console.log(`🔐 Token recibido: ${token.substring(0, 20)}...`);

    const usuario = await verificarToken(token);

    if (!usuario) {
      console.error(`❌ TOKEN INVÁLIDO o no se pudo verificar`);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    console.log(`✅ Token verificado para usuario: ${usuario.userId} (rol: ${usuario.rol})`);

    if (usuario.rol !== "farmacia") {
      console.error(`❌ Acceso denegado - Usuario no es farmacia, es: ${usuario.rol}`);
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;
    const recetaId = id;
    const { medicamentos_procesados, observaciones } = await request.json();

    console.log(`📋 Generando boleta para receta: ${recetaId}`);
    console.log(`💊 Medicamentos recibidos: ${medicamentos_procesados?.length || 0}`);

    if (!medicamentos_procesados || medicamentos_procesados.length === 0) {
      console.error(`❌ VALIDACIÓN: Medicamentos requeridos pero recibió: ${medicamentos_procesados?.length || "ninguno"}`);
      return NextResponse.json(
        { error: "Medicamentos procesados requeridos" },
        { status: 400 }
      );
    }

    console.log(`✅ VALIDACIÓN: Medicamentos recibidos correctamente (${medicamentos_procesados.length})`);

    client = await pool.connect();
    console.log(`✅ CONEXIÓN: Pool conectado`);

    // Obtener ID de la farmacia del usuario
    const farmaciaResult = await client.query(
      "SELECT id FROM farmacias WHERE id_usuario = $1",
      [usuario.userId]
    );

    if (farmaciaResult.rows.length === 0) {
      console.error(`❌ FARMACIA: No encontrada para usuario ${usuario.userId}`);
      return NextResponse.json(
        { error: "Farmacia no encontrada" },
        { status: 404 }
      );
    }

    const farmaciaId = farmaciaResult.rows[0].id;
    console.log(`✅ FARMACIA: Encontrada - ${farmaciaId}`);

    // Verificar si la receta ya tiene boleta (evitar duplicadas)
    const boletaExistenteResult = await client.query(
      "SELECT id, boleta_despacho_id FROM recetas WHERE id = $1",
      [recetaId]
    );

    if (boletaExistenteResult.rows.length === 0) {
      console.error(`❌ Receta no encontrada: ${recetaId}`);
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 }
      );
    }

    const recetaData = boletaExistenteResult.rows[0];
    if (recetaData.boleta_despacho_id) {
      console.log(`⚠️ Receta ya tiene boleta asociada: ${recetaData.boleta_despacho_id}`);
      // Obtener la boleta existente
      const boletaExistenteDb = await client.query(
        "SELECT id, numero_boleta, boleta_pdf_path, nota_venta_pdf_path FROM boletas_despacho WHERE id = $1",
        [recetaData.boleta_despacho_id]
      );
      
      if (boletaExistenteDb.rows.length > 0) {
        return NextResponse.json({
          success: true,
          message: "Esta receta ya tiene una boleta generada",
          boleta_existente: true,
          boleta: boletaExistenteDb.rows[0],
        });
      }
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
    // Usar timestamp + random hash para garantizar unicidad sin race conditions
    const fecha = new Date();
    const fechaStr = fecha.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const timestamp = Date.now(); // Milisegundos desde epoch
    const randomPart = crypto.randomBytes(4).toString('hex').substring(0, 4);
    const numeroBoleta = `B${fechaStr}${String(timestamp % 1000000).padStart(6, '0')}${randomPart}`;

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
    console.log(`📄 Generando PDFs para boleta ${numeroBoleta}`);
    let boletaPdf: any;
    let notaVentaPdf: any;
    
    try {
      boletaPdf = generarBoletaDespacho(dataBoleta, "farmacia");
      console.log(`✅ PDF farmacia generado`);
    } catch (err) {
      console.error(`❌ Error generando PDF farmacia:`, err);
      return NextResponse.json(
        { error: "Error al generar PDF de boleta", details: String(err) },
        { status: 500 }
      );
    }

    try {
      notaVentaPdf = generarBoletaDespacho(dataBoleta, "paciente");
      console.log(`✅ PDF nota de venta generado`);
    } catch (err) {
      console.error(`❌ Error generando PDF nota:`, err);
      return NextResponse.json(
        { error: "Error al generar PDF de nota de venta", details: String(err) },
        { status: 500 }
      );
    }

    console.log(`📊 Tamaño boleta PDF: ${boletaPdf?.length || 0} bytes`);
    console.log(`📊 Tamaño nota PDF: ${notaVentaPdf?.length || 0} bytes`);

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

    console.log(`💾 Guardando boleta en: ${boletaPath}`);
    console.log(`💾 Guardando nota en: ${notaPath}`);
    
    try {
      await fs.writeFile(boletaPath, boletaPdf);
      console.log(`✅ Boleta guardada exitosamente`);
    } catch (writeErr) {
      console.error(`❌ Error guardando boleta:`, writeErr);
      return NextResponse.json(
        { error: "No se pudo guardar el archivo de boleta en el sistema de archivos", details: String(writeErr) },
        { status: 500 }
      );
    }
    
    try {
      await fs.writeFile(notaPath, notaVentaPdf);
      console.log(`✅ Nota de venta guardada exitosamente`);
    } catch (writeErr) {
      console.error(`❌ Error guardando nota:`, writeErr);
      return NextResponse.json(
        { error: "No se pudo guardar el archivo de nota de venta en el sistema de archivos", details: String(writeErr) },
        { status: 500 }
      );
    }

    // Registrar boleta en la BD con manejo de conflicto
    console.log(`🛢️ Preparando inserción en BD con rutas:`);
    console.log(`   - Número boleta: ${numeroBoleta}`);
    console.log(`   - boletaFilename: ${boletaFilename}`);
    console.log(`   - notaFilename: ${notaFilename}`);
    
    let boletaDbResult;
    try {
      boletaDbResult = await client.query(
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
        ON CONFLICT (numero_boleta) DO UPDATE SET
          boleta_pdf_path = EXCLUDED.boleta_pdf_path,
          nota_venta_pdf_path = EXCLUDED.nota_venta_pdf_path,
          fecha_despacho = EXCLUDED.fecha_despacho
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
      console.log(`✅ Boleta insertada/actualizada en BD`);
    } catch (insertError: any) {
      console.error(`❌ Error en INSERT boleta:`, insertError.message);
      // Si aún falla, intenta buscar si ya existe
      const existenteBoleta = await client.query(
        "SELECT id FROM boletas_despacho WHERE numero_boleta = $1",
        [numeroBoleta]
      );
      if (existenteBoleta.rows.length > 0) {
        boletaDbResult = existenteBoleta;
      } else {
        throw insertError;
      }
    }

    const boletaId = boletaDbResult.rows[0]?.id;
    
    console.log(`🗄️ Boleta insertada en BD:`);
    console.log(`   - ID: ${boletaId}`);
    console.log(`   - Ruta boleta: /boletas/${boletaFilename}`);
    console.log(`   - Ruta nota: /notas-venta/${notaFilename}`);

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
    console.error("Error generando boleta:", error.message || error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
