// Script para limpiar boletas problemáticas y resetear para nuevas generaciones
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

async function cleanBoletas() {
  const client = await pool.connect();
  try {
    console.log('🧹 Limpiando boletas problemáticas...\n');
    
    // Obtener boletas de 2025 que apuntan a boletas_despacho
    const boletasProblematicas = await client.query(`
      SELECT b.id, b.numero_boleta, r.id as receta_id, r.codigo_receta
      FROM boletas_despacho b
      JOIN recetas r ON b.id_receta = r.id
      WHERE b.numero_boleta LIKE 'B-2025-%'
    `);
    
    console.log(`Encontradas ${boletasProblematicas.rows.length} boletas de 2025\n`);
    
    for (const boleta of boletasProblematicas.rows) {
      console.log(`📌 Procesando: ${boleta.numero_boleta} (${boleta.codigo_receta})`);
      
      // Desasociar boleta de la receta (solo limpiar referencia)
      await client.query(
        'UPDATE recetas SET boleta_despacho_id = NULL WHERE id = $1',
        [boleta.receta_id]
      );
      console.log(`   ✅ Receta desasociada de boleta`);
      
      // Eliminar boleta
      await client.query(
        'DELETE FROM boletas_despacho WHERE id = $1',
        [boleta.id]
      );
      console.log(`   ✅ Boleta eliminada de BD\n`);
    }
    
    console.log('\n✅ LIMPIEZA COMPLETADA');
    console.log('═════════════════════════════════════════════════════');
    console.log('Ahora puedes generar nuevos despachos desde cero.');
    console.log('Cada uno generará su boleta única con número secuencial');
    console.log('y su PDF único asociado correctamente.');
    console.log('═════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

cleanBoletas();
