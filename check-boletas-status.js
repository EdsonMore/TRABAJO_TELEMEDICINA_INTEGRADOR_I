// Script para verificar boletas y PDFs y validar que futuras generaciones sean correctas
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

async function checkBoletasStatus() {
  const client = await pool.connect();
  try {
    console.log('📊 ESTADO ACTUAL DE BOLETAS\n');
    
    // Obtener boletas con info de recetas
    const result = await client.query(`
      SELECT 
        b.id as boleta_id,
        b.numero_boleta,
        b.boleta_pdf_path,
        b.nota_venta_pdf_path,
        r.codigo_receta,
        r.id as receta_id,
        CASE 
          WHEN b.boleta_pdf_path IS NULL THEN '❌ Sin ruta'
          ELSE '✅ Con ruta'
        END as estado_ruta
      FROM boletas_despacho b
      JOIN recetas r ON b.id_receta = r.id
      WHERE b.numero_boleta LIKE 'B-2025-%'
      ORDER BY b.fecha_despacho DESC
    `);
    
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. Boleta: ${row.numero_boleta}`);
      console.log(`   Receta: ${row.codigo_receta}`);
      console.log(`   Ruta: ${row.boleta_pdf_path || '❌ NULL'}`);
      console.log(`   Estado: ${row.estado_ruta}\n`);
    });
    
    // Verificar archivos en carpetas
    console.log('\n📁 ARCHIVOS DISPONIBLES EN EL SISTEMA\n');
    
    const boletasDir = path.join(__dirname, 'public', 'boletas');
    const notasDir = path.join(__dirname, 'public', 'notas-venta');
    
    try {
      const boletasFiles = fs.readdirSync(boletasDir);
      const notasFiles = fs.readdirSync(notasDir);
      
      console.log(`Boletas generadas: ${boletasFiles.length}`);
      console.log(`Notas generadas: ${notasFiles.length}\n`);
      
      console.log('Últimos 3 archivos de boletas:');
      boletasFiles.sort((a, b) => {
        const timeA = fs.statSync(path.join(boletasDir, a)).mtime;
        const timeB = fs.statSync(path.join(boletasDir, b)).mtime;
        return timeB - timeA;
      }).slice(0, 3).forEach(f => {
        console.log(`  - ${f}`);
      });
      
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    
    console.log('\n\n✅ RECOMENDACIÓN:');
    console.log('═══════════════════════════════════════════════════');
    console.log('Si generas un NUEVO despacho ahora, debería:');
    console.log('1. Generar una boleta con número único (B-2025-000003)');
    console.log('2. Crear PDF único para esa receta');
    console.log('3. Guardar rutas correctas en la BD');
    console.log('4. Mostrar botones de descarga habilitados');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

checkBoletasStatus();
