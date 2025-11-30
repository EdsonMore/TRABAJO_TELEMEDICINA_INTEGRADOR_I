#!/usr/bin/env node
// Script para insertar notificaciones faltantes

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '1234',
  host: 'localhost',
  port: 5432,
  database: 'Medilink_Plus'
});

async function insertMissingNotifications() {
  console.log('\n🔧 INSERTANDO NOTIFICACIONES FALTANTES\n');
  
  try {
    // Obtener citas sin notificaciones
    const citasResult = await pool.query(`
      SELECT 
        c.id,
        c.fecha_cita,
        c.hora_cita,
        c.fecha_creacion,
        p.id_usuario,
        CONCAT(u_medico.nombre, ' ', u_medico.apellido) as nombre_medico
      FROM citas c
      JOIN pacientes p ON c.id_paciente = p.id
      JOIN medicos m ON c.id_medico = m.id
      JOIN usuarios u_medico ON m.id_usuario = u_medico.id
      WHERE c.fecha_creacion > NOW() - INTERVAL '24 hours'
        AND NOT EXISTS (
          SELECT 1 FROM notificaciones n 
          WHERE n.id_relacionado = c.id AND n.tipo = 'cita'
        )
      ORDER BY c.fecha_creacion DESC
    `);

    console.log(`📋 Se encontraron ${citasResult.rows.length} citas sin notificaciones\n`);

    let insertedCount = 0;

    for (const cita of citasResult.rows) {
      const fechaObj = new Date(cita.fecha_cita);
      const fechaFormato = fechaObj.toLocaleDateString('es-PE');
      const hora = cita.hora_cita.substring(0, 5); // HH:MM

      const titulo = '📅 Nueva Cita Programada';
      const mensaje = `Tu cita con ${cita.nombre_medico} está programada para ${fechaFormato} a las ${hora}`;

      try {
        const result = await pool.query(
          `INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
           VALUES ($1, $2, $3, 'cita', $4, false, $5)
           RETURNING id`,
          [cita.id_usuario, titulo, mensaje, cita.id, cita.fecha_creacion]
        );

        console.log(`✅ Notificación insertada:`);
        console.log(`   ID: ${result.rows[0].id}`);
        console.log(`   Usuario: ${cita.id_usuario}`);
        console.log(`   Mensaje: ${mensaje}\n`);

        insertedCount++;
      } catch (error) {
        console.error(`❌ Error insertando notificación para cita ${cita.id}:`, error.message);
      }
    }

    // Mostrar resumen
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM notificaciones');
    const citasWithNotifResult = await pool.query(`
      SELECT COUNT(DISTINCT c.id) as total 
      FROM citas c
      WHERE EXISTS (
        SELECT 1 FROM notificaciones n 
        WHERE n.id_relacionado = c.id AND n.tipo = 'cita'
      )
    `);

    console.log('\n📊 RESUMEN:');
    console.log(`   Notificaciones insertadas: ${insertedCount}`);
    console.log(`   Total de notificaciones en BD: ${totalResult.rows[0].total}`);
    console.log(`   Citas con notificaciones: ${citasWithNotifResult.rows[0].total}`);

    console.log('\n✅ PROCESO COMPLETADO\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await pool.end();
  }
}

insertMissingNotifications();
