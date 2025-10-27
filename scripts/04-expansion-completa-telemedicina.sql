-- Expansión completa de la base de datos para todas las funcionalidades de telemedicina
-- Tabla de códigos de enfermedades (CIE-10)
CREATE TABLE IF NOT EXISTS codigos_enfermedades (
    id SERIAL PRIMARY KEY,
    codigo_cie10 VARCHAR(10) NOT NULL UNIQUE,
    nombre_enfermedad VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de medicamentos recomendados por enfermedad
CREATE TABLE IF NOT EXISTS medicamentos_recomendados (
    id SERIAL PRIMARY KEY,
    codigo_enfermedad_id INTEGER REFERENCES codigos_enfermedades(id),
    nombre_medicamento VARCHAR(255) NOT NULL,
    dosis_recomendada VARCHAR(100),
    frecuencia VARCHAR(100),
    duracion VARCHAR(100),
    contraindicaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de recetas digitales con seguridad
CREATE TABLE IF NOT EXISTS recetas_digitales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_qr VARCHAR(255) UNIQUE NOT NULL,
    paciente_id UUID REFERENCES pacientes(id),
    medico_id UUID REFERENCES medicos(id),
    cita_id UUID REFERENCES citas(id),
    codigo_enfermedad_id INTEGER REFERENCES codigos_enfermedades(id), -- suponiendo que esa tabla usa SERIAL
    diagnostico TEXT NOT NULL,
    medicamentos JSONB NOT NULL, -- Array de medicamentos con dosis
    instrucciones TEXT,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'activa',
    pdf_path VARCHAR(500),
    firma_digital TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos en línea
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES pacientes(id),
    cita_id UUID REFERENCES citas(id),
    examen_id UUID REFERENCES solicitudes_examenes(id), -- corregido: antes ponías examenes_laboratorio (no existe)
    tipo_pago VARCHAR(50) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'PEN',
    estado VARCHAR(50) DEFAULT 'pendiente',
    referencia_pago VARCHAR(255),
    comprobante_pdf VARCHAR(500),
    fecha_pago TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de evaluaciones post-consulta
CREATE TABLE IF NOT EXISTS evaluaciones_consulta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cita_id UUID REFERENCES citas(id),
    paciente_id UUID REFERENCES pacientes(id),
    medico_id UUID REFERENCES medicos(id),
    calificacion_general INTEGER CHECK (calificacion_general BETWEEN 1 AND 5),
    calificacion_atencion INTEGER CHECK (calificacion_atencion BETWEEN 1 AND 5),
    calificacion_puntualidad INTEGER CHECK (calificacion_puntualidad BETWEEN 1 AND 5),
    comentarios TEXT,
    recomendaria BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de evaluaciones post-consulta
CREATE TABLE IF NOT EXISTS evaluaciones_consulta (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER REFERENCES citas(id),
    paciente_id INTEGER REFERENCES pacientes(id),
    medico_id INTEGER REFERENCES medicos(id),
    calificacion_general INTEGER CHECK (calificacion_general >= 1 AND calificacion_general <= 5),
    calificacion_atencion INTEGER CHECK (calificacion_atencion >= 1 AND calificacion_atencion <= 5),
    calificacion_puntualidad INTEGER CHECK (calificacion_puntualidad >= 1 AND calificacion_puntualidad <= 5),
    comentarios TEXT,
    recomendaria BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de expedientes médicos unificados
CREATE TABLE IF NOT EXISTS expedientes_medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES pacientes(id),
    numero_expediente VARCHAR(50) UNIQUE NOT NULL,
    historial_medico JSONB,
    alergias TEXT[],
    medicamentos_actuales JSONB,
    cirugias_previas JSONB,
    enfermedades_cronicas TEXT[],
    contacto_emergencia JSONB,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tutoriales del sistema
CREATE TABLE IF NOT EXISTS tutoriales (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    video_url VARCHAR(500),
    duracion INTEGER, -- en segundos
    rol_objetivo VARCHAR(50), -- paciente, medico, admin
    orden_visualizacion INTEGER DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de accesos a expedientes
CREATE TABLE IF NOT EXISTS accesos_expedientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expediente_id UUID REFERENCES expedientes_medicos(id),
    usuario_id UUID REFERENCES usuarios(id),
    cita_id UUID REFERENCES citas(id),
    tipo_acceso VARCHAR(50),
    fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_acceso INET,
    motivo TEXT
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_recetas_qr ON recetas_digitales(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_pagos_paciente ON pagos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_paciente ON expedientes_medicos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_accesos_expediente ON accesos_expedientes(expediente_id);

-- Insertar códigos de enfermedades comunes (CIE-10)
INSERT INTO codigos_enfermedades (codigo_cie10, nombre_enfermedad, descripcion, categoria) VALUES
('J00', 'Rinofaringitis aguda (resfriado común)', 'Inflamación aguda de la mucosa nasal y faríngea', 'Respiratorio'),
('K59.0', 'Estreñimiento', 'Dificultad para evacuar o evacuaciones infrecuentes', 'Digestivo'),
('I10', 'Hipertensión esencial', 'Presión arterial elevada sin causa identificable', 'Cardiovascular'),
('E11', 'Diabetes mellitus tipo 2', 'Trastorno metabólico caracterizado por hiperglucemia', 'Endocrino'),
('M79.3', 'Dolor muscular', 'Dolor en músculos y tejidos blandos', 'Musculoesquelético'),
('R50', 'Fiebre no especificada', 'Elevación de la temperatura corporal', 'Síntomas generales'),
('H57.1', 'Dolor ocular', 'Dolor en el ojo o estructuras oculares', 'Oftalmológico'),
('R05', 'Tos', 'Expulsión súbita y ruidosa del aire de los pulmones', 'Respiratorio');

-- Insertar medicamentos recomendados
INSERT INTO medicamentos_recomendados (codigo_enfermedad_id, nombre_medicamento, dosis_recomendada, frecuencia, duracion) VALUES
(1, 'Paracetamol', '500mg', 'Cada 8 horas', '3-5 días'),
(1, 'Ibuprofeno', '400mg', 'Cada 8 horas', '3-5 días'),
(2, 'Lactulosa', '15ml', 'Cada 12 horas', 'Según necesidad'),
(3, 'Enalapril', '10mg', 'Cada 12 horas', 'Tratamiento continuo'),
(4, 'Metformina', '850mg', 'Cada 12 horas', 'Tratamiento continuo'),
(5, 'Diclofenaco', '50mg', 'Cada 8 horas', '5-7 días'),
(6, 'Paracetamol', '500mg', 'Cada 6 horas', '3-5 días'),
(8, 'Dextrometorfano', '15mg', 'Cada 8 horas', '5-7 días');

-- Insertar tutoriales básicos
INSERT INTO tutoriales (titulo, descripcion, video_url, duracion, rol_objetivo, orden_visualizacion) VALUES
('Cómo agendar una cita médica', 'Tutorial paso a paso para agendar citas en la plataforma', '/videos/agendar-cita.mp4', 180, 'paciente', 1),
('Cómo usar la telemedicina', 'Guía para conectarse a videollamadas médicas', '/videos/telemedicina.mp4', 240, 'paciente', 2),
('Gestión de pacientes', 'Tutorial para médicos sobre gestión de pacientes', '/videos/gestion-pacientes.mp4', 300, 'medico', 1),
('Crear recetas digitales', 'Cómo generar recetas digitales seguras', '/videos/recetas-digitales.mp4', 200, 'medico', 2);
