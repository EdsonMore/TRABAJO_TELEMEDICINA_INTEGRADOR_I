-- Script para crear tabla de boletas de despacho
-- Ejecutar en: psql -U postgres -d telemedicina_db -f this_file.sql

CREATE TABLE IF NOT EXISTS boletas_despacho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_receta UUID NOT NULL,
  id_farmacia UUID NOT NULL,
  numero_boleta VARCHAR(50) NOT NULL UNIQUE,
  fecha_despacho TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(10, 2) NOT NULL,
  igv DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  tipo_entrega VARCHAR(20) NOT NULL DEFAULT 'recojo', -- 'recojo' o 'domicilio'
  direccion_entrega TEXT,
  medicamentos_despachados JSONB NOT NULL, -- Array de medicamentos con cantidad despachada
  boleta_pdf_path VARCHAR(255),
  nota_venta_pdf_path VARCHAR(255),
  estado VARCHAR(20) NOT NULL DEFAULT 'generada', -- 'generada', 'impresa', 'entregada'
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_boleta_receta FOREIGN KEY (id_receta) REFERENCES recetas(id) ON DELETE CASCADE,
  CONSTRAINT fk_boleta_farmacia FOREIGN KEY (id_farmacia) REFERENCES farmacias(id) ON DELETE CASCADE
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_boleta_receta ON boletas_despacho(id_receta);
CREATE INDEX IF NOT EXISTS idx_boleta_farmacia ON boletas_despacho(id_farmacia);
CREATE INDEX IF NOT EXISTS idx_boleta_numero ON boletas_despacho(numero_boleta);
CREATE INDEX IF NOT EXISTS idx_boleta_fecha ON boletas_despacho(fecha_despacho);

-- Comentarios de documentación
COMMENT ON TABLE boletas_despacho IS 'Almacena las boletas/comprobantes generados cuando se despacha una receta';
COMMENT ON COLUMN boletas_despacho.id_receta IS 'ID de la receta que se despachó';
COMMENT ON COLUMN boletas_despacho.id_farmacia IS 'ID de la farmacia que realizó el despacho';
COMMENT ON COLUMN boletas_despacho.numero_boleta IS 'Número único de la boleta para auditoría';
COMMENT ON COLUMN boletas_despacho.fecha_despacho IS 'Fecha y hora exacta del despacho';
COMMENT ON COLUMN boletas_despacho.subtotal IS 'Subtotal de medicamentos (sin IGV)';
COMMENT ON COLUMN boletas_despacho.igv IS 'IGV al 18% sobre subtotal';
COMMENT ON COLUMN boletas_despacho.total IS 'Total a pagar (subtotal + IGV)';
COMMENT ON COLUMN boletas_despacho.tipo_entrega IS 'Tipo de entrega: recojo en farmacia o domicilio';
COMMENT ON COLUMN boletas_despacho.direccion_entrega IS 'Dirección de entrega si es domicilio, NULL si es recojo';
COMMENT ON COLUMN boletas_despacho.medicamentos_despachados IS 'JSON con detalles de medicamentos: [{medicamento_id, nombre, cantidad_dispensada, precio_unitario, lote}]';
COMMENT ON COLUMN boletas_despacho.boleta_pdf_path IS 'Ruta del PDF de boleta para la farmacia (copia interna)';
COMMENT ON COLUMN boletas_despacho.nota_venta_pdf_path IS 'Ruta del PDF de nota de venta para el paciente (copia externa)';
COMMENT ON COLUMN boletas_despacho.estado IS 'Estado: generada, impresa, entregada';
COMMENT ON COLUMN boletas_despacho.observaciones IS 'Observaciones o notas adicionales del despacho';
