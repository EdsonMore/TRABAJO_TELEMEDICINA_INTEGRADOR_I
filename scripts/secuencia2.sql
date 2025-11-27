-- Migración: Actualizar CHECK de estado en tabla recetas
-- Permitir estados: activa, en_proceso, dispensada, vencida, cancelada

-- 1. Primero, eliminar la restricción CHECK actual
ALTER TABLE recetas DROP CONSTRAINT IF EXISTS recetas_estado_check;

-- 2. Agregar la nueva restricción CHECK con los nuevos estados
ALTER TABLE recetas ADD CONSTRAINT recetas_estado_check 
  CHECK (estado IN ('activa', 'en_proceso', 'dispensada', 'vencida', 'cancelada'));

-- 3. Verificar que la restricción se aplicó
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'recetas' AND constraint_type = 'CHECK';
