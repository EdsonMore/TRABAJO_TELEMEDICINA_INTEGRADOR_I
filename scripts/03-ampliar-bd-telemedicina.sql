-- MediLink+ - Ampliación de base de datos para telemedicina
-- Nuevas tablas para funcionalidades de telemedicina avanzada

-- Tabla de sesiones de telemedicina programadas por médicos
CREATE TABLE sesiones_telemedicina (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cita UUID NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
    id_medico UUID NOT NULL REFERENCES medicos(id),
    id_paciente UUID NOT NULL REFERENCES pacientes(id),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_programada TIMESTAMP NOT NULL,
    duracion_minutos INTEGER DEFAULT 30,
    enlace_reunion TEXT NOT NULL, -- URL de la videollamada
    codigo_acceso VARCHAR(20) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'programada' CHECK (estado IN ('programada', 'iniciada', 'completada', 'cancelada')),
    recordatorio_enviado BOOLEAN DEFAULT false,
    notas_medico TEXT,
    calificacion_paciente INTEGER CHECK (calificacion_paciente BETWEEN 1 AND 5),
    comentarios_paciente TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio_real TIMESTAMP,
    fecha_fin_real TIMESTAMP
);

-- Tabla de notificaciones específicas para telemedicina
CREATE TABLE notificaciones_telemedicina (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_sesion UUID NOT NULL REFERENCES sesiones_telemedicina(id),
    id_usuario UUID NOT NULL REFERENCES usuarios(id),
    tipo_notificacion VARCHAR(50) NOT NULL CHECK (tipo_notificacion IN ('sesion_programada', 'recordatorio_24h', 'recordatorio_1h', 'sesion_iniciada', 'sesion_completada')),
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    enviada BOOLEAN DEFAULT false,
    fecha_programada TIMESTAMP NOT NULL,
    fecha_enviada TIMESTAMP,
    canal VARCHAR(20) DEFAULT 'sistema' CHECK (canal IN ('sistema', 'email', 'sms', 'push'))
);

-- Tabla de archivos compartidos durante telemedicina
CREATE TABLE archivos_telemedicina (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_sesion UUID NOT NULL REFERENCES sesiones_telemedicina(id),
    id_usuario_subida UUID NOT NULL REFERENCES usuarios(id),
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(50) NOT NULL,
    tamaño_bytes BIGINT NOT NULL,
    url_archivo TEXT NOT NULL,
    descripcion TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de chat durante sesiones de telemedicina
CREATE TABLE chat_telemedicina (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_sesion UUID NOT NULL REFERENCES sesiones_telemedicina(id),
    id_usuario UUID NOT NULL REFERENCES usuarios(id),
    mensaje TEXT NOT NULL,
    tipo_mensaje VARCHAR(20) DEFAULT 'texto' CHECK (tipo_mensaje IN ('texto', 'archivo', 'imagen', 'sistema')),
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    editado BOOLEAN DEFAULT false,
    fecha_edicion TIMESTAMP
);

-- Índices para optimizar consultas de telemedicina
CREATE INDEX idx_sesiones_telemedicina_fecha ON sesiones_telemedicina(fecha_programada);
CREATE INDEX idx_sesiones_telemedicina_medico ON sesiones_telemedicina(id_medico);
CREATE INDEX idx_sesiones_telemedicina_paciente ON sesiones_telemedicina(id_paciente);
CREATE INDEX idx_sesiones_telemedicina_codigo ON sesiones_telemedicina(codigo_acceso);
CREATE INDEX idx_notificaciones_telemedicina_usuario ON notificaciones_telemedicina(id_usuario);
CREATE INDEX idx_notificaciones_telemedicina_fecha ON notificaciones_telemedicina(fecha_programada);

-- Comentarios en las nuevas tablas
COMMENT ON TABLE sesiones_telemedicina IS 'Sesiones de telemedicina programadas por médicos con toda la información necesaria';
COMMENT ON TABLE notificaciones_telemedicina IS 'Sistema de notificaciones específico para telemedicina';
COMMENT ON TABLE archivos_telemedicina IS 'Archivos compartidos durante las sesiones de telemedicina';
COMMENT ON TABLE chat_telemedicina IS 'Chat en tiempo real durante las sesiones de telemedicina';
