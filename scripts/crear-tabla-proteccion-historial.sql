-- Script para crear tabla de protección global de historial médico
-- Ejecutar en: psql -U postgres -d telemedicina_db -f this_file.sql

CREATE TABLE IF NOT EXISTS proteccion_historial_medico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_medico UUID NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_medico FOREIGN KEY (id_medico) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_proteccion_medico ON proteccion_historial_medico(id_medico);

-- Comentarios de documentación
COMMENT ON TABLE proteccion_historial_medico IS 'Almacena la contraseña global para proteger TODOS los historiales médicos de un médico';
COMMENT ON COLUMN proteccion_historial_medico.id_medico IS 'ID del médico propietario de esta protección (ÚNICA por médico)';
COMMENT ON COLUMN proteccion_historial_medico.password_hash IS 'Hash bcrypt de la contraseña';
COMMENT ON COLUMN proteccion_historial_medico.created_at IS 'Fecha de creación';
COMMENT ON COLUMN proteccion_historial_medico.updated_at IS 'Última actualización';
