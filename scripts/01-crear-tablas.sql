-- MediLink+ - Script de creación de base de datos PostgreSQL
-- Sistema completo de gestión médica comunitaria
-- Todas las tablas están normalizadas y bien relacionadas

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla principal de usuarios (base para todos los roles)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('paciente', 'medico', 'farmacia', 'laboratorio', 'administrador')),
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP,
    avatar_url TEXT,
    verificado BOOLEAN DEFAULT false
);

-- Tabla de departamentos y provincias del Perú con restricción única
CREATE TABLE ubicaciones (
    id SERIAL PRIMARY KEY,
    departamento VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    distrito VARCHAR(100),
    codigo_postal VARCHAR(10),
    CONSTRAINT ubicacion_unica UNIQUE (departamento, provincia, distrito)
);


-- Tabla específica para pacientes
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('masculino', 'femenino', 'otro')),
    direccion TEXT NOT NULL,
    id_ubicacion INTEGER REFERENCES ubicaciones(id),
    dni VARCHAR(8) UNIQUE NOT NULL,
    tipo_sangre VARCHAR(5),
    alergias TEXT,
    enfermedades_cronicas TEXT,
    contacto_emergencia_nombre VARCHAR(200),
    contacto_emergencia_telefono VARCHAR(20),
    seguro_medico VARCHAR(100),
    numero_seguro VARCHAR(50),
    peso_kg DECIMAL(5,2),
    altura_cm INTEGER,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ubicacion_id INT REFERENCES ubicaciones(id)  -- ← aquí correctamente
);

-- Tabla de especialidades médicas
CREATE TABLE especialidades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true
);

-- Tabla específica para médicos
CREATE TABLE medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_especialidad INTEGER NOT NULL REFERENCES especialidades(id),
    numero_colegiatura VARCHAR(20) UNIQUE NOT NULL,
    anos_experiencia INTEGER DEFAULT 0,
    direccion_consultorio TEXT,
    id_ubicacion INTEGER REFERENCES ubicaciones(id),
    horario_atencion JSONB, -- Formato: {"lunes": {"inicio": "08:00", "fin": "17:00"}, ...}
    tarifa_consulta DECIMAL(8,2),
    acepta_seguro BOOLEAN DEFAULT true,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_consultas INTEGER DEFAULT 0,
    biografia TEXT,
    certificaciones TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla específica para farmacias
CREATE TABLE farmacias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_comercial VARCHAR(200) NOT NULL,
    ruc VARCHAR(11) UNIQUE NOT NULL,
    direccion TEXT NOT NULL,
    id_ubicacion INTEGER REFERENCES ubicaciones(id),
    horario_atencion JSONB,
    delivery_disponible BOOLEAN DEFAULT false,
    radio_delivery_km DECIMAL(4,2),
    licencia_funcionamiento VARCHAR(50),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla específica para laboratorios
CREATE TABLE laboratorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_comercial VARCHAR(200) NOT NULL,
    ruc VARCHAR(11) UNIQUE NOT NULL,
    direccion TEXT NOT NULL,
    id_ubicacion INTEGER REFERENCES ubicaciones(id),
    horario_atencion JSONB,
    tipos_examenes TEXT[], -- Array de tipos de exámenes que realizan
    certificaciones TEXT,
    tiempo_promedio_resultados INTEGER, -- En horas
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de citas médicas
CREATE TABLE citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_paciente UUID NOT NULL REFERENCES pacientes(id),
    id_medico UUID NOT NULL REFERENCES medicos(id),
    fecha_cita DATE NOT NULL,
    hora_cita TIME NOT NULL,
    tipo_cita VARCHAR(20) NOT NULL CHECK (tipo_cita IN ('presencial', 'virtual', 'domicilio')),
    estado VARCHAR(20) NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio')),
    motivo_consulta TEXT NOT NULL,
    observaciones_paciente TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones_medico TEXT,
    costo DECIMAL(8,2),
    pagado BOOLEAN DEFAULT false,
    metodo_pago VARCHAR(50),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recordatorio_enviado BOOLEAN DEFAULT false
);

-- Tabla de medicamentos (catálogo general)
CREATE TABLE medicamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    nombre_generico VARCHAR(200),
    laboratorio VARCHAR(100),
    presentacion VARCHAR(100), -- "Tabletas 500mg", "Jarabe 120ml", etc.
    principio_activo VARCHAR(200),
    categoria VARCHAR(100),
    requiere_receta BOOLEAN DEFAULT true,
    contraindicaciones TEXT,
    efectos_secundarios TEXT,
    dosis_recomendada TEXT,
    codigo_digemid VARCHAR(20),
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de recetas médicas
CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cita UUID NOT NULL REFERENCES citas(id),
    codigo_receta VARCHAR(20) UNIQUE NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    observaciones_generales TEXT,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'parcialmente_dispensada', 'dispensada', 'vencida', 'cancelada')),
    id_farmacia_dispensadora UUID REFERENCES farmacias(id),
    fecha_dispensacion TIMESTAMP,
    total_estimado DECIMAL(8,2)
);


-- Tabla de detalle de medicamentos en recetas
CREATE TABLE receta_medicamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_receta UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    id_medicamento INTEGER NOT NULL REFERENCES medicamentos(id),
    cantidad INTEGER NOT NULL,
    dosis VARCHAR(100) NOT NULL, -- "1 tableta cada 8 horas"
    duracion_dias INTEGER,
    instrucciones_especiales TEXT,
    dispensado BOOLEAN DEFAULT false,
    cantidad_dispensada INTEGER DEFAULT 0,
    precio_unitario DECIMAL(8,2),
    subtotal DECIMAL(8,2)
);



-- Tabla de inventario de farmacias
CREATE TABLE inventario_farmacia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_farmacia UUID NOT NULL REFERENCES farmacias(id),
    id_medicamento INTEGER NOT NULL REFERENCES medicamentos(id),
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER DEFAULT 10,
    precio_venta DECIMAL(8,2) NOT NULL,
    precio_compra DECIMAL(8,2),
    fecha_vencimiento DATE,
    lote VARCHAR(50),
    disponible BOOLEAN DEFAULT true,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_farmacia, id_medicamento, lote)
);

-- Tabla de tipos de exámenes de laboratorio
CREATE TABLE tipos_examenes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(100),
    descripcion TEXT,
    preparacion_requerida TEXT,
    tiempo_resultado_horas INTEGER DEFAULT 24,
    precio_referencial DECIMAL(8,2),
    activo BOOLEAN DEFAULT true
);

-- Tabla de solicitudes de exámenes
CREATE TABLE solicitudes_examenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cita UUID NOT NULL REFERENCES citas(id),
    id_laboratorio UUID REFERENCES laboratorios(id),
    codigo_solicitud VARCHAR(20) UNIQUE NOT NULL,
    fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(20) DEFAULT 'solicitado' CHECK (estado IN ('solicitado', 'programado', 'en_proceso', 'completado', 'cancelado')),
    observaciones TEXT,
    urgente BOOLEAN DEFAULT false,
    fecha_programada DATE,
    hora_programada TIME,
    costo_total DECIMAL(8,2)
);

-- Tabla de detalle de exámenes solicitados
CREATE TABLE solicitud_examenes_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_solicitud UUID NOT NULL REFERENCES solicitudes_examenes(id) ON DELETE CASCADE,
    id_tipo_examen INTEGER NOT NULL REFERENCES tipos_examenes(id),
    instrucciones_especiales TEXT,
    completado BOOLEAN DEFAULT false
);

-- Tabla de resultados de laboratorio
CREATE TABLE resultados_laboratorio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_solicitud_detalle UUID NOT NULL REFERENCES solicitud_examenes_detalle(id),
    resultado_texto TEXT,
    resultado_numerico DECIMAL(10,4),
    unidad_medida VARCHAR(20),
    valor_referencia_min DECIMAL(10,4),
    valor_referencia_max DECIMAL(10,4),
    observaciones TEXT,
    anormal BOOLEAN DEFAULT false,
    fecha_resultado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validado_por VARCHAR(200), -- Nombre del profesional que validó
    archivo_adjunto_url TEXT
);

-- Tabla de alertas comunitarias de salud
CREATE TABLE alertas_salud (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo_alerta VARCHAR(50) NOT NULL CHECK (tipo_alerta IN ('brote', 'epidemia', 'prevencion', 'vacunacion', 'emergencia')),
    nivel_gravedad VARCHAR(20) NOT NULL CHECK (nivel_gravedad IN ('bajo', 'medio', 'alto', 'critico')),
    id_ubicacion INTEGER REFERENCES ubicaciones(id),
    radio_afectacion_km DECIMAL(6,2),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activa BOOLEAN DEFAULT true,
    id_creador UUID NOT NULL REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_afectados INTEGER DEFAULT 0,
    medidas_preventivas TEXT
);

-- Tabla de mensajería segura entre usuarios
CREATE TABLE mensajes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_emisor UUID NOT NULL REFERENCES usuarios(id),
    id_receptor UUID NOT NULL REFERENCES usuarios(id),
    asunto VARCHAR(200),
    contenido TEXT NOT NULL,
    tipo_mensaje VARCHAR(20) DEFAULT 'general' CHECK (tipo_mensaje IN ('general', 'cita', 'receta', 'resultado', 'alerta')),
    leido BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP,
    archivo_adjunto_url TEXT,
    respuesta_a UUID REFERENCES mensajes(id)
);

-- Tabla de notificaciones del sistema
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id),
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    leida BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP,
    datos_adicionales JSONB -- Para almacenar información específica según el tipo
);

-- Tabla de historial de acciones (auditoría)
CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID REFERENCES usuarios(id),
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    id_registro UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_pacientes_dni ON pacientes(dni);
CREATE INDEX idx_citas_fecha ON citas(fecha_cita);
CREATE INDEX idx_citas_paciente ON citas(id_paciente);
CREATE INDEX idx_citas_medico ON citas(id_medico);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_recetas_codigo ON recetas(codigo_receta);
CREATE INDEX idx_mensajes_receptor ON mensajes(id_receptor);
CREATE INDEX idx_mensajes_fecha ON mensajes(fecha_envio);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(id_usuario);
CREATE INDEX idx_alertas_ubicacion ON alertas_salud(id_ubicacion);
CREATE INDEX idx_inventario_farmacia ON inventario_farmacia(id_farmacia, id_medicamento);

-- Comentarios en las tablas principales
COMMENT ON TABLE usuarios IS 'Tabla principal que almacena todos los usuarios del sistema con sus roles';
COMMENT ON TABLE pacientes IS 'Información específica y detallada de los pacientes';
COMMENT ON TABLE medicos IS 'Información profesional de los médicos registrados';
COMMENT ON TABLE citas IS 'Gestión completa de citas médicas con seguimiento de estados';
COMMENT ON TABLE recetas IS 'Recetas digitales emitidas por médicos';
COMMENT ON TABLE alertas_salud IS 'Alertas comunitarias de salud por zonas geográficas';


"scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },