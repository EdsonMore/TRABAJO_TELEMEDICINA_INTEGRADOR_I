// Script para deshabilitar el trigger automático de boleta
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

async function disableTrigger() {
  const client = await pool.connect();
  try {
    console.log('🔄 Deshabilitando trigger automático...');
    
    // Deshabilitar el trigger
    await client.query('ALTER TABLE recetas DISABLE TRIGGER trigger_crear_boleta_despacho;');
    console.log('✅ Trigger deshabilitado exitosamente');
    
    // Verificar estado
    const result = await client.query(`
      SELECT tgname, tgenabled
      FROM pg_trigger
      WHERE relname = 'recetas' AND tgname = 'trigger_crear_boleta_despacho'
    `);
    
    if (result.rows.length > 0) {
      const tgEnabled = result.rows[0].tgenabled;
      console.log(`📋 Trigger estado: ${tgEnabled ? 'HABILITADO ❌' : 'DESHABILITADO ✅'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

disableTrigger();
