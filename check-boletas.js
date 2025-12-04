// Script para verificar rutas de boletas y PDFs
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

async function checkBoletas() {
  const client = await pool.connect();
  try {
    console.log('🔍 Verificando boletas y rutas...\n');
    
    // Obtener últimas boletas con rutas
    const result = await client.query(`
      SELECT 
        id,
        numero_boleta,
        boleta_pdf_path,
        nota_venta_pdf_path,
        fecha_despacho,
        estado
      FROM boletas_despacho
      ORDER BY fecha_despacho DESC
      LIMIT 5
    `);
    
    console.log('📊 Últimas 5 boletas en BD:\n');
    result.rows.forEach(row => {
      console.log(`📌 Boleta: ${row.numero_boleta}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Boleta PDF: ${row.boleta_pdf_path}`);
      console.log(`   Nota Venta PDF: ${row.nota_venta_pdf_path}`);
      console.log(`   Fecha: ${row.fecha_despacho}`);
      console.log(`   Estado: ${row.estado}\n`);
      
      // Verificar si archivos existen
      if (row.boleta_pdf_path) {
        const boletaFullPath = path.join(__dirname, 'public', row.boleta_pdf_path);
        const exists = fs.existsSync(boletaFullPath);
        console.log(`   ✅ Archivo boleta ${exists ? 'EXISTE' : '❌ NO EXISTE'}: ${boletaFullPath}`);
      }
      
      if (row.nota_venta_pdf_path) {
        const notaFullPath = path.join(__dirname, 'public', row.nota_venta_pdf_path);
        const exists = fs.existsSync(notaFullPath);
        console.log(`   ✅ Archivo nota ${exists ? 'EXISTE' : '❌ NO EXISTE'}: ${notaFullPath}`);
      }
      console.log('');
    });
    
    // Listar archivos en carpetas
    console.log('\n📁 Archivos en /public/boletas:\n');
    try {
      const boletasDir = path.join(__dirname, 'public', 'boletas');
      const boletasFiles = fs.readdirSync(boletasDir);
      console.log(`Total: ${boletasFiles.length} archivos`);
      boletasFiles.slice(-5).forEach(f => console.log(`  - ${f}`));
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
    
    console.log('\n📁 Archivos en /public/notas-venta:\n');
    try {
      const notasDir = path.join(__dirname, 'public', 'notas-venta');
      const notasFiles = fs.readdirSync(notasDir);
      console.log(`Total: ${notasFiles.length} archivos`);
      notasFiles.slice(-5).forEach(f => console.log(`  - ${f}`));
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

checkBoletas();
