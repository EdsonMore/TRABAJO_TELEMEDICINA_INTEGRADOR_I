-- ============================================================
-- VALIDACIÓN: MÉTODO DE PAGO EN CITAS Y TABLA PAGOS
-- Fecha: 30 de noviembre 2025
-- Propósito: Verificar que los métodos de pago se guardan correctamente
-- ============================================================

-- ============================================================
-- PASO 1: Verificar que existan citas con metodo_pago
-- ============================================================
-- Ejecuta esta query para ver las citas con método de pago guardado

SELECT 
  id as "ID Cita",
  id_paciente as "ID Paciente",
  id_medico as "ID Médico",
  metodo_pago as "Método de Pago",
  costo as "Costo",
  estado as "Estado",
  fecha_creacion as "Fecha Creación"
FROM citas
WHERE metodo_pago IS NOT NULL
ORDER BY fecha_creacion DESC
LIMIT 10;

-- Resultado esperado:
-- ✅ Debe mostrar filas con metodo_pago = 'tarjeta', 'yape', 'efectivo', etc.
-- ❌ Si está vacío = No se está guardando el método

---

-- ============================================================
-- PASO 2: Verificar registros en tabla pagos
-- ============================================================
-- Ejecuta esta query para ver los pagos pendientes de citas

SELECT 
  p.id as "ID Pago",
  p.usuario_id as "ID Usuario",
  p.entidad_tipo as "Tipo Entidad",
  p.entidad_id as "ID Entidad (Cita)",
  p.monto as "Monto",
  p.metodo_pago as "Método Pago",
  p.estado as "Estado Pago",
  p.created_at as "Fecha Creación Pago"
FROM pagos p
WHERE p.entidad_tipo = 'cita'
ORDER BY p.created_at DESC
LIMIT 10;

-- Resultado esperado:
-- ✅ Debe mostrar filas con estado = 'pendiente' o 'completado'
-- ✅ metodo_pago debe coincidir con método elegido
-- ❌ Si está vacío = No se están creando registros de pago

---

-- ============================================================
-- PASO 3: Verificar integridad (Citas ↔ Pagos)
-- ============================================================
-- Ejecuta esta query para asegurar que cada cita tiene su registro de pago

SELECT 
  c.id as "Cita ID",
  c.metodo_pago as "Método (Cita)",
  c.costo as "Costo",
  c.estado as "Estado Cita",
  p.id as "Pago ID",
  p.metodo_pago as "Método (Pago)",
  p.monto as "Monto",
  p.estado as "Estado Pago",
  CASE 
    WHEN p.id IS NULL THEN '⚠️ SIN PAGO'
    WHEN c.costo = p.monto THEN '✅ OK'
    ELSE '❌ MONTO NO COINCIDE'
  END as "Validación"
FROM citas c
LEFT JOIN pagos p ON p.entidad_id = c.id AND p.entidad_tipo = 'cita'
WHERE c.estado IN ('programada', 'confirmada')
ORDER BY c.fecha_creacion DESC
LIMIT 10;

-- Resultado esperado:
-- ✅ Todos deben mostrar "✅ OK" o al menos "✅ SIN PAGO" (si aún no procesado)
-- ✅ Los montos en c.costo y p.monto deben ser iguales
-- ❌ Si hay "❌ MONTO NO COINCIDE" = Hay inconsistencia

---

-- ============================================================
-- PASO 4: Contar citas por método de pago
-- ============================================================
-- Ejecuta esta query para ver estadísticas de métodos usados

SELECT 
  metodo_pago as "Método de Pago",
  COUNT(*) as "Total Citas",
  SUM(costo) as "Monto Total",
  AVG(costo) as "Costo Promedio"
FROM citas
WHERE metodo_pago IS NOT NULL
GROUP BY metodo_pago
ORDER BY COUNT(*) DESC;

-- Resultado esperado:
-- ✅ Debe mostrar distribución de métodos (tarjeta, yape, etc.)
-- ✅ Totales deben cuadrar con tabla pagos

---

-- ============================================================
-- PASO 5: Verificar que no hay NULL en métodos de pago (nuevas citas)
-- ============================================================
-- Ejecuta esta query para ver si hay citas sin método de pago (problema)

SELECT 
  id as "Cita ID",
  fecha_creacion as "Fecha",
  metodo_pago as "Método de Pago",
  costo as "Costo",
  estado as "Estado"
FROM citas
WHERE metodo_pago IS NULL
AND fecha_creacion > NOW() - INTERVAL '1 day'
ORDER BY fecha_creacion DESC;

-- Resultado esperado:
-- ✅ Si está VACÍO = Todas las citas tienen método de pago ✅
-- ❌ Si hay filas = Las nuevas citas no están guardando el método ❌

---

-- ============================================================
-- PASO 6: Comparar citas vs pagos (Auditoría)
-- ============================================================
-- Ejecuta esta query para hacer auditoría completa

SELECT 
  COUNT(DISTINCT c.id) as "Total Citas",
  COUNT(DISTINCT p.id) as "Total Pagos",
  COUNT(DISTINCT c.id) - COUNT(DISTINCT p.id) as "Diferencia",
  CASE 
    WHEN COUNT(DISTINCT c.id) = COUNT(DISTINCT p.id) THEN '✅ Auditoria OK'
    ELSE '⚠️ Hay citas sin pago registrado'
  END as "Status Auditoría"
FROM citas c
LEFT JOIN pagos p ON p.entidad_id = c.id AND p.entidad_tipo = 'cita'
WHERE c.estado IN ('programada', 'confirmada')
AND c.fecha_creacion > NOW() - INTERVAL '7 days';

-- Resultado esperado:
-- ✅ Total Citas = Total Pagos = Diferencia = 0
-- ✅ Status = "✅ Auditoria OK"

---

-- ============================================================
-- PASO 7: Ver últimas 5 citas creadas (Verificación Rápida)
-- ============================================================
-- Ejecuta esta query para un quick-check

SELECT 
  c.id as "ID",
  u.nombre as "Paciente",
  m.nombre as "Médico",
  c.metodo_pago as "💳 Método",
  c.costo as "Costo",
  c.estado as "Estado",
  c.fecha_creacion as "Creada"
FROM citas c
JOIN pacientes p ON c.id_paciente = p.id
JOIN usuarios u ON p.id_usuario = u.id
JOIN medicos m ON c.id_medico = m.id
ORDER BY c.fecha_creacion DESC
LIMIT 5;

-- Resultado esperado:
-- ✅ Columna "💳 Método" debe tener valores como 'tarjeta', 'yape', etc.
-- ❌ Si está NULL = Problema en implementación

---

-- ============================================================
-- PASO 8: Debug - Ver logs en tabla pagos
-- ============================================================
-- Si hay problemas, ejecuta esto para ver qué está pasando

SELECT 
  p.*,
  (SELECT COUNT(*) FROM citas WHERE id = p.entidad_id) as "Cita Existe"
FROM pagos p
WHERE p.entidad_tipo = 'cita'
ORDER BY p.created_at DESC
LIMIT 10;

---

-- ============================================================
-- CHECKLIST DE VALIDACIÓN
-- ============================================================
-- Marca ✅ cuando cada paso pase exitosamente:

-- [ ] PASO 1: Citas tienen metodo_pago (no NULL)
-- [ ] PASO 2: Existen registros en tabla pagos
-- [ ] PASO 3: Cada cita tiene su correspondiente pago
-- [ ] PASO 4: Estadísticas muestran distribución de métodos
-- [ ] PASO 5: No hay citas nuevas sin método de pago
-- [ ] PASO 6: Total de citas = Total de pagos
-- [ ] PASO 7: Últimas citas muestran método de pago
-- [ ] PASO 8: Tabla pagos tiene datos coherentes

-- Si todos marcan ✅ = SISTEMA FUNCIONANDO CORRECTAMENTE ✅

---

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
-- 1. Después de implementar los cambios, crear 2-3 citas de prueba
-- 2. Ejecutar TODOS los pasos para validación completa
-- 3. Si algo falla, revisar logs de aplicación
-- 4. No hay necesidad de ejecutar migraciones (columna ya existe)
-- 5. Los datos históricos (NULL) son normales, solo validar nuevos
