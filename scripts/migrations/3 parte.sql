-- =====================================================
-- Script de Sincronización de Estados Existentes
-- Ejecutar DESPUÉS de la migración principal
-- =====================================================

-- Este script sincroniza los estados de recetas que fueron procesadas
-- ANTES de implementar la sincronización automática de estado_envio

-- 1. Sincronizar recetas en estado 'en_proceso'
UPDATE recetas
SET estado_envio = 'en_proceso'
WHERE estado = 'en_proceso' 
  AND (estado_envio IS NULL OR estado_envio != 'en_proceso')
  AND farmacia_seleccionada_id IS NOT NULL;

-- 2. Sincronizar recetas dispensadas
UPDATE recetas
SET estado_envio = 'dispensada'
WHERE estado = 'dispensada' 
  AND (estado_envio IS NULL OR estado_envio != 'dispensada')
  AND farmacia_seleccionada_id IS NOT NULL;

-- 3. Sincronizar recetas canceladas/rechazadas
UPDATE recetas
SET estado_envio = 'rechazada'
WHERE estado = 'cancelada' 
  AND (estado_envio IS NULL OR estado_envio != 'rechazada')
  AND farmacia_seleccionada_id IS NOT NULL;

-- 4. Verificar resultados
SELECT 
    estado,
    estado_envio,
    COUNT(*) as cantidad
FROM recetas
WHERE farmacia_seleccionada_id IS NOT NULL
GROUP BY estado, estado_envio
ORDER BY estado, estado_envio;

-- =====================================================
-- Fin del script de sincronización
-- =====================================================
