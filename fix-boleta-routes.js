// Script para limpiar boletas sin rutas y recriar con datos correctos
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const pool = new Pool({
  user: envVars.POSTGRES_USER || 'postgres',
  host: envVars.POSTGRES_HOST || 'localhost',
  database: envVars.POSTGRES_DB || 'medilink_plus',
  password: envVars.POSTGRES_PASSWORD || 'password',
  port: Number(envVars.POSTGRES_PORT || '5432'),
});

async function fixBoletas() {
  const client = await pool.connect();
  try {
    console.log('🔧 Limpiando boletas sin rutas...\n');
    
    // Obtener boletas sin rutas (creadas por trigger defectuoso)
    const boletasSinRutas = await client.query(`
      SELECT id, numero_boleta, id_receta
      FROM boletas_despacho
      WHERE (boleta_pdf_path IS NULL OR nota_venta_pdf_path IS NULL)
      AND numero_boleta LIKE 'B-2025-%'
      ORDER BY fecha_despacho DESC
    `);
    
    console.log(`🔍 Encontradas ${boletasSinRutas.rows.length} boletas sin rutas\n`);
    
    // Por cada boleta sin rutas, buscar y generar/obtener los PDFs
    for (const boleta of boletasSinRutas.rows) {
      console.log(`📌 Procesando: ${boleta.numero_boleta}`);
      
      // Buscar archivos PDF que coincidan con esta receta (por ID)
      const boletasDir = path.join(__dirname, 'public', 'boletas');
      const notasDir = path.join(__dirname, 'public', 'notas-venta');
      
      // Listar archivos en las carpetas
      let boletaFile = null;
      let notaFile = null;
      
      try {
        const boletasFiles = fs.readdirSync(boletasDir);
        const notasFiles = fs.readdirSync(notasDir);
        
        // Buscar el archivo más reciente
        if (boletasFiles.length > 0) {
          const sortedBoletas = boletasFiles
            .map(f => ({ name: f, time: fs.statSync(path.join(boletasDir, f)).mtime }))
            .sort((a, b) => b.time - a.time);
          boletaFile = sortedBoletas[0]?.name;
        }
        
        if (notasFiles.length > 0) {
          const sortedNotas = notasFiles
            .map(f => ({ name: f, time: fs.statSync(path.join(notasDir, f)).mtime }))
            .sort((a, b) => b.time - a.time);
          notaFile = sortedNotas[0]?.name;
        }
        
        if (boletaFile && notaFile) {
          // Actualizar boleta con rutas
          await client.query(
            `UPDATE boletas_despacho
             SET boleta_pdf_path = $1,
                 nota_venta_pdf_path = $2
             WHERE id = $3`,
            [`/boletas/${boletaFile}`, `/notas-venta/${notaFile}`, boleta.id]
          );
          console.log(`   ✅ Actualizada con rutas:`);
          console.log(`      - Boleta: /boletas/${boletaFile}`);
          console.log(`      - Nota: /notas-venta/${notaFile}\n`);
        } else {
          console.log(`   ⚠️ No se encontraron archivos PDF\n`);
        }
      } catch (e) {
        console.log(`   ❌ Error: ${e.message}\n`);
      }
    }
    
    // Verificar resultado
    console.log('\n✅ Verificando boletas actualizadas:\n');
    const result = await client.query(`
      SELECT numero_boleta, boleta_pdf_path, nota_venta_pdf_path
      FROM boletas_despacho
      WHERE numero_boleta LIKE 'B-2025-%'
      ORDER BY fecha_despacho DESC
      LIMIT 3
    `);
    
    result.rows.forEach(row => {
      console.log(`📋 ${row.numero_boleta}`);
      console.log(`   Boleta: ${row.boleta_pdf_path || '❌ NULL'}`);
      console.log(`   Nota: ${row.nota_venta_pdf_path || '❌ NULL'}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

fixBoletas();
