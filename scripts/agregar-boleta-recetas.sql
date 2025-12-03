-- Script para agregar columna de boleta a tabla recetas
-- Ejecutar en: psql -U postgres -d telemedicina_db -f this_file.sql

ALTER TABLE recetas ADD COLUMN IF NOT EXISTS boleta_despacho_id UUID;

-- Agregar constraint de clave foránea
ALTER TABLE recetas ADD CONSTRAINT fk_receta_boleta 
  FOREIGN KEY (boleta_despacho_id) 
  REFERENCES boletas_despacho(id) 
  ON DELETE SET NULL;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_receta_boleta ON recetas(boleta_despacho_id);

-- Comentario
COMMENT ON COLUMN recetas.boleta_despacho_id IS 'ID de la boleta de despacho generada cuando se completa el despacho';
