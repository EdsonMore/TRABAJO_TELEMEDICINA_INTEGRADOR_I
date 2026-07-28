// app/api/debug/test-fs/route.ts
// Endpoint para probar si podemos escribir archivos en el filesystem

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Test de escritura en filesystem...");

    // Crear directorios de prueba
    const boletasDir = path.join(process.cwd(), "public", "boletas");
    const notasDir = path.join(process.cwd(), "public", "notas-venta");

    console.log(`📂 Directorio boletas: ${boletasDir}`);
    console.log(`📂 Directorio notas: ${notasDir}`);

    // Intentar crear directorios
    try {
      await fs.mkdir(boletasDir, { recursive: true });
      console.log(`✅ Directorio boletas creado/verificado`);
    } catch (err) {
      console.error(`❌ Error con directorio boletas:`, err);
    }

    try {
      await fs.mkdir(notasDir, { recursive: true });
      console.log(`✅ Directorio notas creado/verificado`);
    } catch (err) {
      console.error(`❌ Error con directorio notas:`, err);
    }

    // Intentar escribir un archivo de prueba
    const testBoletaPath = path.join(boletasDir, "test-boleta.txt");
    const testNotaPath = path.join(notasDir, "test-nota.txt");

    console.log(`📝 Escribiendo archivo de prueba en: ${testBoletaPath}`);
    try {
      await fs.writeFile(testBoletaPath, "Test boleta - " + new Date().toISOString());
      console.log(`✅ Archivo de prueba boleta escrito exitosamente`);
    } catch (err) {
      console.error(`❌ Error escribiendo boleta:`, err);
    }

    console.log(`📝 Escribiendo archivo de prueba en: ${testNotaPath}`);
    try {
      await fs.writeFile(testNotaPath, "Test nota - " + new Date().toISOString());
      console.log(`✅ Archivo de prueba nota escrito exitosamente`);
    } catch (err) {
      console.error(`❌ Error escribiendo nota:`, err);
    }

    // Intentar listar archivos
    console.log(`📋 Listando archivos en boletas...`);
    try {
      const boletasFiles = await fs.readdir(boletasDir);
      console.log(`📄 Archivos en boletas:`, boletasFiles.slice(0, 5));
    } catch (err) {
      console.error(`❌ Error listando boletas:`, err);
    }

    console.log(`📋 Listando archivos en notas...`);
    try {
      const notasFiles = await fs.readdir(notasDir);
      console.log(`📄 Archivos en notas:`, notasFiles.slice(0, 5));
    } catch (err) {
      console.error(`❌ Error listando notas:`, err);
    }

    return NextResponse.json({
      success: true,
      message: "Test completado - revisa los logs del servidor",
      boletasDir,
      notasDir,
    });
  } catch (error: any) {
    console.error("❌ Error en test FS:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
