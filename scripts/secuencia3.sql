-- 🔄 Iniciando migración: Agregar opciones de entrega a la tabla "recetas"

-- 1. Agregar columnas si no existen
ALTER TABLE recetas
    ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(50) 
        DEFAULT 'recojo' 
        CHECK (tipo_entrega IN ('recojo', 'domicilio')),
    ADD COLUMN IF NOT EXISTS direccion_entrega TEXT,
    ADD COLUMN IF NOT EXISTS costo_entrega DECIMAL(10, 2) DEFAULT 0;

-- 2. Crear índice para búsquedas rápidas por tipo_entrega
CREATE INDEX IF NOT EXISTS idx_recetas_tipo_entrega 
ON recetas(tipo_entrega);

-- 🎉 Migración completada
