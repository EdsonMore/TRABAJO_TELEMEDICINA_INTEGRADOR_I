-- =====================================================
-- MIGRACIÓN: Sistema de distribución de recetas a farmacias
-- Fecha: 2025-11-12
-- Descripción: Agrega campos para que pacientes seleccionen farmacia
-- =====================================================

-- 1. Agregar columnas a tabla recetas
ALTER TABLE recetas
ADD COLUMN IF NOT EXISTS farmacia_seleccionada_id UUID REFERENCES farmacias(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS estado_envio VARCHAR(20) DEFAULT 'no_enviada' CHECK (estado_envio IN ('no_enviada', 'enviada', 'recibida', 'rechazada', 'dispensada')),
ADD COLUMN IF NOT EXISTS fecha_envio_farmacia TIMESTAMP,
ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;

-- 2. Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_recetas_farmacia_seleccionada ON recetas(farmacia_seleccionada_id, estado_envio);
CREATE INDEX IF NOT EXISTS idx_recetas_estado_envio ON recetas(estado_envio, fecha_emision);

-- 3. Crear tabla de historial de envíos de recetas (auditoría)
CREATE TABLE IF NOT EXISTS historial_envio_recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    farmacia_id UUID REFERENCES farmacias(id) ON DELETE SET NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    motivo TEXT,
    usuario_id UUID REFERENCES usuarios(id),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_envio_receta ON historial_envio_recetas(receta_id, fecha_cambio);
CREATE INDEX IF NOT EXISTS idx_historial_envio_farmacia ON historial_envio_recetas(farmacia_id, fecha_cambio);

-- 4. Crear tabla de comparación de opciones farmacia (para registro de búsquedas)
CREATE TABLE IF NOT EXISTS busquedas_farmacias_recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    farmacias_consultadas JSONB NOT NULL, -- Array con {id, nombre, precio_total, disponibilidad, distancia}
    farmacia_seleccionada_id UUID REFERENCES farmacias(id)
);

CREATE INDEX IF NOT EXISTS idx_busquedas_receta ON busquedas_farmacias_recetas(receta_id);
CREATE INDEX IF NOT EXISTS idx_busquedas_paciente ON busquedas_farmacias_recetas(paciente_id, fecha_busqueda);

-- 5. Agregar columnas a inventario_farmacia para mejor gestión
ALTER TABLE inventario_farmacia
ADD COLUMN IF NOT EXISTS reservas_activas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_actualizacion_stock TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 6. Crear vista para mostrar disponibilidad resumida por medicamento
CREATE OR REPLACE VIEW vista_disponibilidad_medicamentos AS
SELECT 
    med.id,
    med.nombre_comercial,
    med.nombre_generico,
    farm.id as farmacia_id,
    farm.nombre_comercial as farmacia_nombre,
    ub.departamento,
    ub.provincia,
    ub.distrito,
    inv.stock_actual,
    inv.reservas_activas,
    (inv.stock_actual - inv.reservas_activas) as stock_disponible,
    inv.precio_venta,
    inv.fecha_vencimiento,
    inv.lote,
    CASE 
        WHEN (inv.stock_actual - inv.reservas_activas) <= 0 THEN 'Sin Stock'
        WHEN inv.fecha_vencimiento <= CURRENT_DATE THEN 'Vencido'
        WHEN inv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'Por Vencer'
        ELSE 'Disponible'
    END as estado_disponibilidad
FROM medicamentos med
JOIN inventario_farmacia inv ON med.id = inv.id_medicamento
JOIN farmacias farm ON inv.id_farmacia = farm.id
LEFT JOIN ubicaciones ub ON farm.id_ubicacion = ub.id
WHERE inv.disponible = true
ORDER BY farm.nombre_comercial, med.nombre_comercial;

-- 7. Crear función para calcular precio total de una receta en una farmacia
CREATE OR REPLACE FUNCTION calcular_precio_receta_farmacia(
    p_receta_id UUID,
    p_farmacia_id UUID
) RETURNS TABLE (
    total_precio DECIMAL(10,2),
    medicamentos_disponibles INT,
    medicamentos_faltantes INT
) AS $$
DECLARE
    v_total DECIMAL(10,2) := 0;
    v_disponibles INT := 0;
    v_faltantes INT := 0;
    v_medicamento RECORD;
BEGIN
    FOR v_medicamento IN
        SELECT rd.medicamento_id, rd.cantidad
        FROM receta_detalle rd
        WHERE rd.id_receta = p_receta_id
    LOOP
        SELECT inv.stock_actual, inv.precio_venta INTO v_medicamento
        FROM inventario_farmacia inv
        WHERE inv.id_farmacia = p_farmacia_id 
        AND inv.id_medicamento = v_medicamento.medicamento_id
        AND inv.disponible = true;
        
        IF FOUND THEN
            IF v_medicamento.stock_actual >= v_medicamento.cantidad THEN
                v_total := v_total + (v_medicamento.precio_venta * v_medicamento.cantidad);
                v_disponibles := v_disponibles + 1;
            ELSE
                v_faltantes := v_faltantes + 1;
            END IF;
        ELSE
            v_faltantes := v_faltantes + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT v_total, v_disponibles, v_faltantes;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear función para registrar cambio de estado de envío
CREATE OR REPLACE FUNCTION registrar_cambio_envio_receta(
    p_receta_id UUID,
    p_estado_nuevo VARCHAR,
    p_farmacia_id UUID,
    p_usuario_id UUID,
    p_motivo TEXT DEFAULT NULL
) RETURNS TABLE (
    exito BOOLEAN,
    mensaje TEXT
) AS $$
DECLARE
    v_estado_anterior VARCHAR;
BEGIN
    -- Obtener estado anterior
    SELECT estado_envio INTO v_estado_anterior FROM recetas WHERE id = p_receta_id;
    
    -- Registrar en historial
    INSERT INTO historial_envio_recetas 
    (receta_id, farmacia_id, estado_anterior, estado_nuevo, usuario_id, motivo)
    VALUES (p_receta_id, p_farmacia_id, v_estado_anterior, p_estado_nuevo, p_usuario_id, p_motivo);
    
    -- Retornar éxito
    RETURN QUERY SELECT true, 'Cambio registrado exitosamente';
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error al registrar cambio: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 9. Agregar comentarios a las nuevas columnas
COMMENT ON COLUMN recetas.farmacia_seleccionada_id IS 'Referencia a la farmacia elegida por el paciente para dispensar la receta';
COMMENT ON COLUMN recetas.estado_envio IS 'Estado del envío: no_enviada, enviada, recibida, rechazada, dispensada';
COMMENT ON COLUMN recetas.fecha_envio_farmacia IS 'Fecha y hora cuando el paciente envió la receta a la farmacia';
COMMENT ON COLUMN recetas.motivo_rechazo IS 'Razón por la que la farmacia rechazó la receta (si aplica)';
COMMENT ON COLUMN inventario_farmacia.reservas_activas IS 'Cantidad de medicamentos reservados en recetas no dispensadas aún';

-- 10. Verificar integridad
SELECT 
    'Migración completada exitosamente' as estado,
    (SELECT COUNT(*) FROM recetas) as total_recetas,
    (SELECT COUNT(*) FROM farmacias) as total_farmacias,
    (SELECT COUNT(*) FROM inventario_farmacia) as total_items_inventario;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
