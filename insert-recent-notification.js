#!/usr/bin/env node
// Script para insertar la notificación de la cita más reciente

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '1234',
  host: 'localhost',
  port: 5432,
  database: 'Medilink_Plus'
});

async function insertarNotificacionReciente() {
  console.log('\n🔧 INSERTANDO NOTIFICACIÓN DE LA CITA MÁS RECIENTE\n');
  
  try {
    // Obtener la cita más reciente sin notificación
    const citaResult = await pool.query(`
      SELECT 
        c.id,
        c.fecha_cita,
        c.hora_cita,
        c.fecha_creacion,
        c.id_paciente,
        p.id_usuario as paciente_usuario_id,
        u_paciente.nombre as paciente_nombre,
        m.id_usuario as medico_usuario_id,
        u_medico.nombre as medico_nombre,
        u_medico.apellido as medico_apellido
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios u_medico ON m.id_usuario = u_medico.id
      WHERE NOT EXISTS (
        SELECT 1 FROM notificaciones n 
        WHERE n.id_relacionado = c.id AND n.tipo = 'cita'
      )
      ORDER BY c.fecha_creacion DESC
      LIMIT 1
    `);

    if (citaResult.rows.length === 0) {
      console.log('ℹ️  No hay citas sin notificaciones');
      return;
    }

    const cita = citaResult.rows[0];
    console.log('📋 Cita encontrada:');
    console.log(`   ID: ${cita.id}`);
    console.log(`   Paciente: ${cita.paciente_nombre}`);
    console.log(`   Médico: ${cita.medico_nombre} ${cita.medico_apellido}`);
    console.log(`   Fecha: ${cita.fecha_cita}`);
    console.log(`   Hora: ${cita.hora_cita}\n`);

    // Formatear fecha
    const fechaObj = new Date(cita.fecha_cita);
    const fechaFormato = fechaObj.toLocaleDateString('es-PE');
    const hora = cita.hora_cita.substring(0, 5); // HH:MM

    // 1. Notificación para el paciente
    const tituloP = '📅 Nueva Cita Programada';
    const mensajeP = `Tu cita con ${cita.medico_nombre} ${cita.medico_apellido} está programada para ${fechaFormato} a las ${hora}`;

    const notifPResult = await pool.query(
      `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
       VALUES ($1, $2, $3, 'cita', $4, false, $5)
       RETURNING id`,
      [cita.paciente_usuario_id, tituloP, mensajeP, cita.id, cita.fecha_creacion]
    );

    console.log('✅ Notificación para PACIENTE insertada:');
    console.log(`   ID: ${notifPResult.rows[0].id}`);
    console.log(`   Título: ${tituloP}`);
    console.log(`   Mensaje: ${mensajeP}\n`);

    // 2. Notificación para el médico
    const tituloM = '📅 Nueva Cita Agendada';
    const mensajeM = `${cita.paciente_nombre} ha agendado una cita para ${fechaFormato} a las ${hora}`;

    const notifMResult = await pool.query(
      `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
       VALUES ($1, $2, $3, 'cita', $4, false, $5)
       RETURNING id`,
      [cita.medico_usuario_id, tituloM, mensajeM, cita.id, cita.fecha_creacion]
    );

    console.log('✅ Notificación para MÉDICO insertada:');
    console.log(`   ID: ${notifMResult.rows[0].id}`);
    console.log(`   Título: ${tituloM}`);
    console.log(`   Mensaje: ${mensajeM}\n`);

    // Mostrar resumen
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM notificaciones');
    console.log(`📊 Total de notificaciones en BD: ${totalResult.rows[0].total}`);
    console.log('\n✅ PROCESO COMPLETADO\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await pool.end();
  }
}

insertarNotificacionReciente();
