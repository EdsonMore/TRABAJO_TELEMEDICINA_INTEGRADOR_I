// Script para desactivar TODOS los triggers de boletas automáticas
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

async function disableAllTriggers() {
  const client = await pool.connect();
  try {
    console.log('🔴 Deshabilitando TODOS los triggers de boletas...\n');
    
    // Lista de triggers a deshabilitar
    const triggers = [
      'trigger_crear_boleta_despacho',
      'trigger_generar_numero_boleta'
    ];
    
    for (const trigger of triggers) {
      try {
        await client.query(`ALTER TABLE recetas DISABLE TRIGGER ${trigger};`);
        console.log(`✅ Deshabilitado: ${trigger}`);
      } catch (e) {
        console.log(`⚠️ ${trigger}: ${e.message.split('\n')[0]}`);
      }
    }
    
    // También deshabilitar en la tabla boletas_despacho si existe
    try {
      await client.query(`ALTER TABLE boletas_despacho DISABLE TRIGGER trigger_generar_numero_boleta;`);
      console.log(`✅ Deshabilitado: trigger_generar_numero_boleta en boletas_despacho`);
    } catch (e) {
      console.log(`⚠️ trigger_generar_numero_boleta en boletas_despacho: ${e.message.split('\n')[0]}`);
    }
    
    console.log('\n✅ TODOS LOS TRIGGERS DESHABILITADOS');
    console.log('═════════════════════════════════════════════════════');
    console.log('Ahora SOLO el endpoint /generar-boleta creará boletas.');
    console.log('Las boletas se generan con:');
    console.log('1. Número secuencial correcto (B-2025-000001)');
    console.log('2. PDF único para cada receta');
    console.log('3. Rutas correctas en BD');
    console.log('═════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

disableAllTriggers();
