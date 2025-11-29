-- =====================================================
-- MediLink+ - Migration: Sistema de Seguimiento de Recetas
-- Descripción: Agrega tablas y triggers para tracking en tiempo real
-- Fecha: 2024-11-29
-- =====================================================

-- 1. Crear tabla de historial de cambios de estado
CREATE TABLE IF NOT EXISTS historial_cambios_estado_receta (
    id SERIAL PRIMARY KEY,
    receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    usuario_id UUID REFERENCES usuarios(id),
    farmacia_id UUID REFERENCES farmacias(id),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    detalles JSONB DEFAULT '{}'::jsonb,
    notificado BOOLEAN DEFAULT FALSE,
    descripcion TEXT,
    CONSTRAINT fk_receta_historial FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_historial_receta ON historial_cambios_estado_receta(receta_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_cambios_estado_receta(fecha_cambio DESC);
CREATE INDEX IF NOT EXISTS idx_historial_estado_nuevo ON historial_cambios_estado_receta(estado_nuevo);
CREATE INDEX IF NOT EXISTS idx_historial_notificado ON historial_cambios_estado_receta(notificado) WHERE notificado = FALSE;

-- 2. Agregar campos de tracking a la tabla recetas
ALTER TABLE recetas 
ADD COLUMN IF NOT EXISTS fecha_aceptacion_farmacia TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_inicio_preparacion TIMESTAMP,
ADD COLUMN IF NOT EXISTS fecha_finalizacion_preparacion TIMESTAMP,
ADD COLUMN IF NOT EXISTS ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp_receta()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para actualizar ultima_actualizacion
DROP TRIGGER IF EXISTS trigger_actualizar_timestamp_receta ON recetas;
CREATE TRIGGER trigger_actualizar_timestamp_receta
BEFORE UPDATE ON recetas
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_receta();

-- 5. Crear función para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION registrar_cambio_estado_receta()
RETURNS TRIGGER AS $$
DECLARE
    descripcion_cambio TEXT;
    farmacia_id_val UUID;
BEGIN
    -- Solo registrar si cambió el estado_envio
    IF OLD.estado_envio IS DISTINCT FROM NEW.estado_envio THEN
        -- Obtener farmacia_id
        farmacia_id_val := COALESCE(NEW.farmacia_seleccionada_id, NEW.id_farmacia_dispensadora);
        
        -- Generar descripción del cambio
        descripcion_cambio := CASE 
            WHEN NEW.estado_envio = 'enviada' THEN 'Receta enviada a farmacia'
            WHEN NEW.estado_envio = 'recibida' THEN 'Farmacia aceptó la receta'
            WHEN NEW.estado_envio = 'en_proceso' THEN 'Farmacia está preparando los medicamentos'
            WHEN NEW.estado_envio = 'dispensada' THEN 
                CASE 
                    WHEN NEW.tipo_entrega = 'domicilio' THEN 'Medicamentos en camino a domicilio'
                    ELSE 'Medicamentos listos para retiro en farmacia'
                END
            WHEN NEW.estado_envio = 'rechazada' THEN 'Farmacia rechazó la receta'
            ELSE 'Estado actualizado'
        END;
        
        -- Insertar en historial
        INSERT INTO historial_cambios_estado_receta (
            receta_id,
            estado_anterior,
            estado_nuevo,
            farmacia_id,
            descripcion,
            detalles
        ) VALUES (
            NEW.id,
            OLD.estado_envio,
            NEW.estado_envio,
            farmacia_id_val,
            descripcion_cambio,
            jsonb_build_object(
                'codigo_receta', NEW.codigo_receta,
                'tipo_entrega', NEW.tipo_entrega,
                'direccion_entrega', NEW.direccion_entrega,
                'motivo_rechazo', NEW.motivo_rechazo
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para registrar cambios automáticamente
DROP TRIGGER IF EXISTS trigger_registrar_cambio_estado ON recetas;
CREATE TRIGGER trigger_registrar_cambio_estado
AFTER UPDATE ON recetas
FOR EACH ROW
EXECUTE FUNCTION registrar_cambio_estado_receta();

-- 7. Actualizar timestamps de fechas específicas según estado
CREATE OR REPLACE FUNCTION actualizar_fechas_especificas_receta()
RETURNS TRIGGER AS $$
BEGIN
    -- Cuando se acepta (pasa a recibida)
    IF OLD.estado_envio IS DISTINCT FROM NEW.estado_envio AND NEW.estado_envio = 'recibida' THEN
        NEW.fecha_aceptacion_farmacia = CURRENT_TIMESTAMP;
    END IF;
    
    -- Cuando pasa a en_proceso
    IF OLD.estado_envio IS DISTINCT FROM NEW.estado_envio AND NEW.estado_envio = 'en_proceso' THEN
        NEW.fecha_inicio_preparacion = CURRENT_TIMESTAMP;
    END IF;
    
    -- Cuando se despacha (pasa a dispensada)
    IF OLD.estado_envio IS DISTINCT FROM NEW.estado_envio AND NEW.estado_envio = 'dispensada' THEN
        NEW.fecha_finalizacion_preparacion = CURRENT_TIMESTAMP;
        NEW.fecha_dispensacion = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear trigger para fechas específicas (debe ejecutarse ANTES del trigger de timestamp)
DROP TRIGGER IF EXISTS trigger_actualizar_fechas_especificas ON recetas;
CREATE TRIGGER trigger_actualizar_fechas_especificas
BEFORE UPDATE ON recetas
FOR EACH ROW
EXECUTE FUNCTION actualizar_fechas_especificas_receta();

-- 9. Crear vista para consulta rápida de historial
CREATE OR REPLACE VIEW vista_historial_recetas AS
SELECT 
    h.id,
    h.receta_id,
    r.codigo_receta,
    h.estado_anterior,
    h.estado_nuevo,
    h.fecha_cambio,
    h.descripcion,
    h.detalles,
    h.notificado,
    f.nombre_comercial as farmacia_nombre,
    u.nombre as usuario_nombre,
    u.apellido as usuario_apellido
FROM historial_cambios_estado_receta h
JOIN recetas r ON h.receta_id = r.id
LEFT JOIN farmacias f ON h.farmacia_id = f.id
LEFT JOIN usuarios u ON h.usuario_id = u.id
ORDER BY h.fecha_cambio DESC;

-- 10. Comentarios para documentación
COMMENT ON TABLE historial_cambios_estado_receta IS 'Registro histórico de todos los cambios de estado de recetas para tracking en tiempo real';
COMMENT ON COLUMN historial_cambios_estado_receta.receta_id IS 'ID de la receta a la que pertenece este cambio';
COMMENT ON COLUMN historial_cambios_estado_receta.estado_anterior IS 'Estado previo antes del cambio';
COMMENT ON COLUMN historial_cambios_estado_receta.estado_nuevo IS 'Nuevo estado después del cambio';
COMMENT ON COLUMN historial_cambios_estado_receta.notificado IS 'Indica si el paciente fue notificado de este cambio';
COMMENT ON COLUMN historial_cambios_estado_receta.detalles IS 'Información adicional del cambio en formato JSON';

COMMENT ON COLUMN recetas.fecha_aceptacion_farmacia IS 'Fecha y hora en que la farmacia aceptó la receta';
COMMENT ON COLUMN recetas.fecha_inicio_preparacion IS 'Fecha y hora en que la farmacia comenzó a preparar los medicamentos';
COMMENT ON COLUMN recetas.fecha_finalizacion_preparacion IS 'Fecha y hora en que la farmacia finalizó la preparación';
COMMENT ON COLUMN recetas.ultima_actualizacion IS 'Timestamp de la última modificación de la receta';

-- 11. Insertar registros históricos para recetas existentes con estado_envio
INSERT INTO historial_cambios_estado_receta (
    receta_id,
    estado_anterior,
    estado_nuevo,
    farmacia_id,
    fecha_cambio,
    descripcion,
    detalles,
    notificado
)
SELECT 
    r.id,
    NULL,
    r.estado_envio,
    r.farmacia_seleccionada_id,
    COALESCE(r.fecha_envio_farmacia, r.fecha_emision),
    CASE 
        WHEN r.estado_envio = 'enviada' THEN 'Receta enviada a farmacia'
        WHEN r.estado_envio = 'recibida' THEN 'Farmacia aceptó la receta'
        WHEN r.estado_envio = 'en_proceso' THEN 'Farmacia está preparando los medicamentos'
        WHEN r.estado_envio = 'dispensada' THEN 'Medicamentos listos'
        WHEN r.estado_envio = 'rechazada' THEN 'Farmacia rechazó la receta'
        ELSE 'Estado inicial'
    END,
    jsonb_build_object(
        'codigo_receta', r.codigo_receta,
        'tipo_entrega', r.tipo_entrega,
        'es_registro_inicial', true
    ),
    true
FROM recetas r
WHERE r.estado_envio IS NOT NULL 
  AND r.estado_envio != 'no_enviada'
  AND NOT EXISTS (
    SELECT 1 FROM historial_cambios_estado_receta h 
    WHERE h.receta_id = r.id
  );

-- =====================================================
-- Fin de la migración
-- =====================================================
