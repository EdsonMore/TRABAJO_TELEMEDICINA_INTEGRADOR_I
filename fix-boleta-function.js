// Script para actualizar la función generar_numero_boleta en PostgreSQL
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

const sqlFix = `
CREATE OR REPLACE FUNCTION generar_numero_boleta()
RETURNS TRIGGER AS $$
DECLARE
    año_actual VARCHAR(4);
    consecutivo INTEGER;
    nuevo_numero VARCHAR(50);
BEGIN
    -- Obtener año actual
    año_actual := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Obtener último consecutivo del año
    -- Buscar números con formato: B-YYYY-NNNNNN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_boleta FROM 8 FOR 6) AS INTEGER)), 0) + 1
    INTO consecutivo
    FROM boletas_despacho
    WHERE numero_boleta LIKE 'B-' || año_actual || '-%';
    
    -- Formatear número: B-YYYY-000001
    nuevo_numero := 'B-' || año_actual || '-' || LPAD(consecutivo::TEXT, 6, '0');
    
    -- Asignar número a la nueva boleta
    NEW.numero_boleta := nuevo_numero;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

async function fixBoleta() {
  const client = await pool.connect();
  try {
    console.log('🔄 Actualizando función generar_numero_boleta...');
    await client.query(sqlFix);
    console.log('✅ Función actualizada exitosamente');
    
    // Verificar boletas existentes
    const result = await client.query('SELECT COUNT(*) as total FROM boletas_despacho');
    console.log(`📊 Total de boletas en BD: ${result.rows[0].total}`);
    
    // Mostrar últimas boletas
    const latest = await client.query('SELECT numero_boleta, fecha_despacho FROM boletas_despacho ORDER BY fecha_despacho DESC LIMIT 5');
    console.log('📋 Últimas boletas generadas:');
    latest.rows.forEach(row => {
      console.log(`   - ${row.numero_boleta} (${row.fecha_despacho})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

fixBoleta();
