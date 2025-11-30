#!/usr/bin/env node
// Script de diagnóstico - Verificar notificaciones en BD

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '1234',
  host: 'localhost',
  port: 5432,
  database: 'Medilink_Plus'
});

async function diagnose() {
  console.log('\n🔍 DIAGNÓSTICO DEL SISTEMA DE NOTIFICACIONES\n');
  
  try {
    // 1. Verificar conexión
    console.log('1️⃣  Verificando conexión a BD...');
    const testResult = await pool.query('SELECT NOW()');
    console.log('   ✅ Conexión OK:', testResult.rows[0].now);
    
    // 2. Contar notificaciones totales
    console.log('\n2️⃣  Contando notificaciones totales...');
    const countResult = await pool.query('SELECT COUNT(*) as total FROM notificaciones');
    const totalNotifs = countResult.rows[0].total;
    console.log(`   ✅ Total de notificaciones: ${totalNotifs}`);
    
    // 3. Mostrar últimas 10 notificaciones
    console.log('\n3️⃣  Últimas 10 notificaciones creadas:');
    const recentResult = await pool.query(`
      SELECT 
        n.id,
        n.titulo,
        n.tipo,
        n.leida,
        n.created_at,
        u.nombre,
        u.email
      FROM notificaciones n
      JOIN usuarios u ON n.id_usuario = u.id
      ORDER BY n.created_at DESC
      LIMIT 10
    `);
    
    if (recentResult.rows.length === 0) {
      console.log('   ⚠️  NO HAY NOTIFICACIONES EN LA BD');
    } else {
      recentResult.rows.forEach((n, i) => {
        console.log(`   ${i+1}. ${n.titulo} (${n.tipo})`);
        console.log(`      Usuario: ${n.nombre} <${n.email}>`);
        console.log(`      Creada: ${n.created_at}`);
        console.log(`      Leída: ${n.leida ? 'Sí' : 'No'}`);
        console.log('');
      });
    }
    
    // 4. Contar notificaciones por tipo
    console.log('4️⃣  Notificaciones por tipo:');
    const typeResult = await pool.query(`
      SELECT tipo, COUNT(*) as cantidad
      FROM notificaciones
      GROUP BY tipo
      ORDER BY cantidad DESC
    `);
    
    typeResult.rows.forEach(row => {
      console.log(`   - ${row.tipo}: ${row.cantidad}`);
    });
    
    // 5. Verificar si hay citas recientes
    console.log('\n5️⃣  Citas creadas en las últimas 24 horas:');
    const citasResult = await pool.query(`
      SELECT 
        c.id,
        c.fecha_cita,
        c.hora_cita,
        c.estado,
        c.fecha_creacion,
        p.id as paciente_id,
        u_paciente.nombre as paciente_nombre,
        u_medico.nombre as medico_nombre
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios u_medico ON m.id_usuario = u_medico.id
      WHERE c.fecha_creacion > NOW() - INTERVAL '24 hours'
      ORDER BY c.fecha_creacion DESC
      LIMIT 5
    `);
    
    if (citasResult.rows.length === 0) {
      console.log('   ℹ️  No hay citas recientes');
    } else {
      citasResult.rows.forEach((c, i) => {
        console.log(`   ${i+1}. Cita del ${c.fecha_cita} a las ${c.hora_cita}`);
        console.log(`      Paciente: ${c.paciente_nombre}`);
        console.log(`      Médico: ${c.medico_nombre}`);
        console.log(`      Estado: ${c.estado}`);
        console.log(`      Creada: ${c.fecha_creacion}`);
        console.log('');
      });
    }
    
    // 6. Verificar tabla de usuarios
    console.log('6️⃣  Usuarios en el sistema:');
    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.email,
        u.rol,
        COUNT(n.id) as notificaciones_count
      FROM usuarios u
      LEFT JOIN notificaciones n ON u.id = n.id_usuario
      GROUP BY u.id, u.nombre, u.email, u.rol
      ORDER BY u.nombre
      LIMIT 10
    `);
    
    usersResult.rows.forEach(u => {
      console.log(`   - ${u.nombre} (${u.email}) - Rol: ${u.rol} - Notificaciones: ${u.notificaciones_count}`);
    });
    
    console.log('\n✅ DIAGNÓSTICO COMPLETADO\n');
    
  } catch (error) {
    console.error('❌ ERROR EN DIAGNÓSTICO:', error.message);
  } finally {
    await pool.end();
  }
}

diagnose();
