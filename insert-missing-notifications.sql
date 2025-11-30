-- Script para insertar notificaciones faltantes
-- Esto agregará notificaciones para las citas que ya existen pero no tienen notificaciones

INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, id_relacionado, leida, created_at)
SELECT 
  p.id_usuario,
  '📅 Nueva Cita Programada' as titulo,
  CONCAT(
    'Tu cita con ',
    (SELECT CONCAT(u.nombre, ' ', u.apellido) FROM usuarios u JOIN medicos m ON u.id = m.id_usuario WHERE m.id = c.id_medico),
    ' está programada para ',
    TO_CHAR(c.fecha_cita::date, 'DD/MM/YYYY'),
    ' a las ',
    TO_CHAR(c.hora_cita, 'HH24:MI')
  ) as mensaje,
  'cita' as tipo,
  c.id as id_relacionado,
  false as leida,
  c.fecha_creacion as created_at
FROM citas c
JOIN pacientes p ON c.id_paciente = p.id
WHERE c.fecha_creacion > NOW() - INTERVAL '24 hours'
  AND NOT EXISTS (
    SELECT 1 FROM notificaciones n 
    WHERE n.id_relacionado = c.id AND n.tipo = 'cita'
  )
ON CONFLICT DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT 
  COUNT(*) as notificaciones_insertadas,
  MAX(created_at) as ultima_creada
FROM notificaciones
WHERE tipo = 'cita' AND created_at > NOW() - INTERVAL '24 hours';
