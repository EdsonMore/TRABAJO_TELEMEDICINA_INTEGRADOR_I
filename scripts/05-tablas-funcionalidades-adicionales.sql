-- Crear tablas para las nuevas funcionalidades

-- Tabla para recetas electrónicas
CREATE TABLE IF NOT EXISTS recetas_electronicas (
    id SERIAL PRIMARY KEY,
    medico_id INTEGER REFERENCES usuarios(id),
    paciente_id INTEGER REFERENCES usuarios(id),
    diagnostico TEXT NOT NULL,
    observaciones TEXT,
    codigo_qr VARCHAR(50) UNIQUE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'activa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para medicamentos de recetas electrónicas
CREATE TABLE IF NOT EXISTS receta_medicamentos (
    id SERIAL PRIMARY KEY,
    receta_id INTEGER REFERENCES recetas_electronicas(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    dosis VARCHAR(100) NOT NULL,
    frecuencia VARCHAR(100),
    duracion VARCHAR(100),
    instrucciones TEXT,
    cantidad INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para pagos sandbox
CREATE TABLE IF NOT EXISTS pagos_sandbox (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    servicio_id VARCHAR(50) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    numero_transaccion VARCHAR(100) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'exitoso',
    datos_pago JSONB,
    comprobante_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_recetas_electronicas_medico ON recetas_electronicas(medico_id);
CREATE INDEX IF NOT EXISTS idx_recetas_electronicas_paciente ON recetas_electronicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_recetas_electronicas_codigo_qr ON recetas_electronicas(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_receta_medicamentos_receta ON receta_medicamentos(receta_id);
CREATE INDEX IF NOT EXISTS idx_pagos_sandbox_usuario ON pagos_sandbox(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagos_sandbox_transaccion ON pagos_sandbox(numero_transaccion);

-- Actualizar tabla de resultados de laboratorio para incluir archivo
ALTER TABLE resultados_laboratorio 
ADD COLUMN IF NOT EXISTS archivo_resultado VARCHAR(500),
ADD COLUMN IF NOT EXISTS observaciones_laboratorio TEXT;

-- Insertar datos de prueba para recetas electrónicas
INSERT INTO recetas_electronicas (medico_id, paciente_id, diagnostico, observaciones, codigo_qr, fecha_vencimiento) VALUES
(1, 2, 'Hipertensión arterial leve', 'Control en 15 días', 'QR001ABC123', CURRENT_DATE + INTERVAL '30 days'),
(1, 3, 'Gastritis aguda', 'Dieta blanda recomendada', 'QR002DEF456', CURRENT_DATE + INTERVAL '30 days');

-- Insertar medicamentos de prueba
INSERT INTO receta_medicamentos (receta_id, nombre, dosis, frecuencia, duracion, instrucciones, cantidad) VALUES
(1, 'Enalapril 10mg', '1 tableta', 'cada_12_horas', '30 días', 'Tomar con alimentos', 60),
(1, 'Hidroclorotiazida 25mg', '1 tableta', 'cada_24_horas', '30 días', 'Tomar en la mañana', 30),
(2, 'Omeprazol 20mg', '1 cápsula', 'cada_12_horas', '14 días', 'Tomar antes de las comidas', 28),
(2, 'Sucralfato 1g', '1 tableta', 'cada_6_horas', '14 días', 'Tomar con el estómago vacío', 56);

-- Insertar pagos de prueba
INSERT INTO pagos_sandbox (usuario_id, servicio_id, metodo_pago, monto, numero_transaccion, estado) VALUES
(2, 'cita_001', 'tarjeta', 80.00, 'TXN001SANDBOX', 'exitoso'),
(3, 'examen_001', 'yape', 120.00, 'TXN002SANDBOX', 'exitoso');
