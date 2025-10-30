-- =====================================================
-- SCRIPT DE BASE DE DATOS - SISTEMA DE SALUD
-- ORDEN CORRECTO DE EJECUCIÓN PARA POSTGRESQL
-- =====================================================

-- =====================================================
-- PASO 1: EXTENSIONES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PASO 2: TABLAS INDEPENDIENTES (Sin dependencias)
-- =====================================================

-- 2.1 TABLA DE USUARIOS (Base de todo el sistema)
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

-- 2.2 TABLA DE UBICACIONES
CREATE TABLE ubicaciones (
    id SERIAL PRIMARY KEY,
    departamento VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    distrito VARCHAR(100),
    codigo_postal VARCHAR(10),
    activo BOOLEAN DEFAULT true,
    CONSTRAINT ubicacion_unica UNIQUE (departamento, provincia, distrito)
);

-- 2.3 TABLA DE ESPECIALIDADES MÉDICAS
CREATE TABLE especialidades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true
);

-- 2.4 TABLA DE CÓDIGOS CIE-10
CREATE TABLE codigos_cie10 (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(500) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(200),
    capitulo VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.5 TABLA DE MEDICAMENTOS
CREATE TABLE medicamentos (
    id SERIAL PRIMARY KEY,
    codigo_digemid VARCHAR(20) UNIQUE NOT NULL,
    nombre_comercial VARCHAR(200) NOT NULL,
    nombre_generico VARCHAR(200) NOT NULL,
    forma_farmaceutica VARCHAR(100),
    concentracion VARCHAR(100),
    laboratorio VARCHAR(100),
    principio_activo VARCHAR(200),
    categoria_terapeutica VARCHAR(100),
    requiere_receta BOOLEAN DEFAULT true,
    contraindicaciones TEXT,
    efectos_secundarios TEXT,
    almacenamiento TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 TABLA DE TIPOS DE EXÁMENES
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

-- =====================================================
-- PASO 3: TABLAS DE NIVEL 1 (Dependen de usuarios)
-- =====================================================

-- 3.1 TABLA DE PACIENTES
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
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 TABLA DE MÉDICOS
CREATE TABLE medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_especialidad INTEGER NOT NULL REFERENCES especialidades(id),
    numero_colegiatura VARCHAR(20) UNIQUE NOT NULL,
    anos_experiencia INTEGER DEFAULT 0,
    direccion_consultorio TEXT,
    id_ubicacion INTEGER REFERENCES ubicaciones(id),
    horario_atencion JSONB,
    tarifa_consulta DECIMAL(8,2),
    acepta_seguro BOOLEAN DEFAULT true,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_consultas INTEGER DEFAULT 0,
    biografia TEXT,
    certificaciones TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.3 TABLA DE FARMACIAS
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

-- 3.4 TABLA DE LABORATORIOS
CREATE TABLE laboratorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_comercial VARCHAR(200) NOT NULL,
    ruc VARCHAR(11) UNIQUE NOT NULL,
    direccion TEXT NOT NULL,
    id_ubicacion INTEGER REFERENCES ubicaciones(id),
    horario_atencion JSONB,
    tipos_examenes TEXT[],
    certificaciones TEXT,
    tiempo_promedio_resultados INTEGER,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.5 TABLA DE TRATAMIENTOS RECOMENDADOS
CREATE TABLE tratamientos_recomendados (
    id SERIAL PRIMARY KEY,
    codigo_cie10_id INTEGER NOT NULL REFERENCES codigos_cie10(id),
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
    dosis_recomendada VARCHAR(200) NOT NULL,
    duracion_tratamiento VARCHAR(100),
    linea_tratamiento INTEGER DEFAULT 1,
    evidencia_nivel VARCHAR(10),
    contraindicaciones_especificas TEXT,
    observaciones TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(codigo_cie10_id, medicamento_id, linea_tratamiento)
);

-- 3.6 TABLA DE EXPEDIENTES MÉDICOS
CREATE TABLE expedientes_medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    numero_expediente VARCHAR(50) UNIQUE NOT NULL,
    alergias TEXT[],
    enfermedades_cronicas TEXT[],
    medicamentos_actuales TEXT[],
    cirugias_previas TEXT[],
    antecedentes_familiares TEXT,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PASO 4: TABLAS DE NIVEL 2 (Dependen de nivel 1)
-- =====================================================

-- 4.1 TABLA DE CITAS MÉDICAS
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

-- 4.2 TABLA DE INVENTARIO FARMACIA
CREATE TABLE inventario_farmacia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_farmacia UUID NOT NULL REFERENCES farmacias(id),
    id_medicamento INTEGER NOT NULL REFERENCES medicamentos(id),
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER DEFAULT 10,
    precio_venta DECIMAL(8,2) NOT NULL CHECK (precio_venta >= 0),
    fecha_vencimiento DATE,
    lote VARCHAR(50),
    disponible BOOLEAN DEFAULT true,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_farmacia, id_medicamento, lote)
);

-- 4.3 TABLA DE DIAGNÓSTICOS POR PACIENTE
CREATE TABLE diagnosticos_paciente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    cita_id UUID REFERENCES citas(id),
    codigo_cie10_id INTEGER NOT NULL REFERENCES codigos_cie10(id),
    tipo_diagnostico VARCHAR(20) DEFAULT 'principal' CHECK (tipo_diagnostico IN ('principal', 'secundario', 'crónico')),
    observaciones TEXT,
    fecha_diagnostico DATE NOT NULL DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4.4 TABLA DE EVALUACIONES
CREATE TABLE evaluaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cita_id UUID NOT NULL REFERENCES citas(id),
    paciente_id UUID NOT NULL REFERENCES pacientes(id),
    medico_id UUID NOT NULL REFERENCES medicos(id),
    calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentarios TEXT,
    recomendaria BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cita_id)
);

-- 4.5 TABLA DE SESIONES DE TELEMEDICINA
CREATE TABLE sesiones_telemedicina (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cita UUID NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
    id_medico UUID NOT NULL REFERENCES medicos(id),
    id_paciente UUID NOT NULL REFERENCES pacientes(id),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_programada TIMESTAMP NOT NULL,
    duracion_minutos INTEGER DEFAULT 30,
    enlace_reunion TEXT NOT NULL,
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

-- =====================================================
-- PASO 5: TABLAS DE NIVEL 3 (Dependen de nivel 2)
-- =====================================================

-- 5.1 TABLA DE RECETAS MÉDICAS
CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cita UUID NOT NULL REFERENCES citas(id),
    codigo_receta VARCHAR(20) UNIQUE NOT NULL,
    diagnostico_principal_id INTEGER REFERENCES codigos_cie10(id),
    diagnostico_principal_texto TEXT,
    diagnosticos_secundarios JSONB,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'dispensada', 'vencida', 'cancelada')),
    id_farmacia_dispensadora UUID REFERENCES farmacias(id),
    fecha_dispensacion TIMESTAMP,
    firma_medico TEXT,
    sello_temporal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5.2 TABLA DE SOLICITUDES DE EXÁMENES
CREATE TABLE solicitudes_examenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cita UUID NOT NULL REFERENCES citas(id),
    id_laboratorio UUID REFERENCES laboratorios(id),
    codigo_solicitud VARCHAR(20) UNIQUE NOT NULL,
    fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(20) DEFAULT 'solicitado' CHECK (estado IN ('solicitado', 'en_proceso', 'completado', 'cancelado')),
    observaciones TEXT,
    urgente BOOLEAN DEFAULT false,
    fecha_programada DATE,
    costo_total DECIMAL(8,2)
);

-- =====================================================
-- PASO 6: TABLAS DE NIVEL 4 (Dependen de nivel 3)
-- =====================================================

-- 6.1 TABLA DE DETALLE DE RECETAS
CREATE TABLE receta_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_receta UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    dosis VARCHAR(100) NOT NULL,
    frecuencia VARCHAR(100) NOT NULL,
    duracion_dias INTEGER,
    via_administracion VARCHAR(50),
    instrucciones_especiales TEXT,
    dispensado BOOLEAN DEFAULT false,
    tratamiento_recomendado_id INTEGER REFERENCES tratamientos_recomendados(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6.2 TABLA DE DETALLE DE EXÁMENES
CREATE TABLE examen_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_solicitud UUID NOT NULL REFERENCES solicitudes_examenes(id) ON DELETE CASCADE,
    id_tipo_examen INTEGER NOT NULL REFERENCES tipos_examenes(id),
    instrucciones TEXT,
    completado BOOLEAN DEFAULT false
);

-- =====================================================
-- PASO 7: TABLAS DE NIVEL 5 (Dependen de nivel 4)
-- =====================================================

-- 7.1 TABLA DE RESULTADOS DE LABORATORIO
CREATE TABLE resultados_laboratorio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_examen_detalle UUID NOT NULL REFERENCES examen_detalle(id),
    resultado_texto TEXT,
    resultado_numerico DECIMAL(10,4),
    unidad_medida VARCHAR(20),
    valor_referencia_min DECIMAL(10,4),
    valor_referencia_max DECIMAL(10,4),
    observaciones TEXT,
    anormal BOOLEAN DEFAULT false,
    fecha_resultado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validado_por VARCHAR(200),
    archivo_url TEXT
);

-- =====================================================
-- PASO 8: TABLAS GENERALES (Pueden ir al final)
-- =====================================================

-- 8.1 TABLA DE NOTIFICACIONES
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    entidad_relacionada VARCHAR(50),
    id_entidad UUID,
    leida BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP
);

-- 8.2 TABLA DE PAGOS
CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    entidad_tipo VARCHAR(20) NOT NULL CHECK (entidad_tipo IN ('cita', 'examen', 'medicamento')),
    entidad_id UUID NOT NULL,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    metodo_pago VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'fallido', 'reembolsado')),
    referencia_pago VARCHAR(255),
    fecha_pago TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8.3 TABLA DE AUDITORÍA
CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    id_registro UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PASO 9: ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol, activo);

-- Índices para pacientes
CREATE INDEX idx_pacientes_usuario ON pacientes(id_usuario);
CREATE INDEX idx_pacientes_dni ON pacientes(dni);

-- Índices para médicos
CREATE INDEX idx_medicos_usuario ON medicos(id_usuario);
CREATE INDEX idx_medicos_especialidad ON medicos(id_especialidad);
CREATE INDEX idx_medicos_colegiatura ON medicos(numero_colegiatura);

-- Índices para citas
CREATE INDEX idx_citas_paciente ON citas(id_paciente, fecha_cita);
CREATE INDEX idx_citas_medico ON citas(id_medico, fecha_cita);
CREATE INDEX idx_citas_estado ON citas(estado, fecha_cita);

-- Índices para CIE-10 y medicamentos
CREATE INDEX idx_cie10_codigo ON codigos_cie10(codigo);
CREATE INDEX idx_medicamentos_digemid ON medicamentos(codigo_digemid);
CREATE INDEX idx_medicamentos_generico ON medicamentos(nombre_generico);
CREATE INDEX idx_tratamientos_cie10 ON tratamientos_recomendados(codigo_cie10_id);
CREATE INDEX idx_tratamientos_medicamento ON tratamientos_recomendados(medicamento_id);

-- Índices para recetas
CREATE INDEX idx_recetas_cita ON recetas(id_cita);
CREATE INDEX idx_recetas_diagnostico ON recetas(diagnostico_principal_id);
CREATE INDEX idx_recetas_fecha ON recetas(fecha_emision);
CREATE INDEX idx_receta_detalle_receta ON receta_detalle(id_receta);
CREATE INDEX idx_receta_detalle_medicamento ON receta_detalle(medicamento_id);

-- Índices para inventario
CREATE INDEX idx_inventario_farmacia ON inventario_farmacia(id_farmacia, disponible);
CREATE INDEX idx_inventario_medicamento ON inventario_farmacia(id_medicamento, stock_actual);

-- Índices para exámenes
CREATE INDEX idx_solicitudes_cita ON solicitudes_examenes(id_cita);
CREATE INDEX idx_solicitudes_lab ON solicitudes_examenes(id_laboratorio);
CREATE INDEX idx_examen_detalle_solicitud ON examen_detalle(id_solicitud);
CREATE INDEX idx_resultados_detalle ON resultados_laboratorio(id_examen_detalle);

-- Índices para expedientes y diagnósticos
CREATE INDEX idx_expedientes_paciente ON expedientes_medicos(paciente_id);
CREATE INDEX idx_diagnosticos_paciente ON diagnosticos_paciente(paciente_id, fecha_diagnostico);
CREATE INDEX idx_diagnosticos_cie10 ON diagnosticos_paciente(codigo_cie10_id);

-- Índices para notificaciones y pagos
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leida);
CREATE INDEX idx_pagos_usuario ON pagos(usuario_id, estado);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id, fecha_accion);

-- =====================================================
-- PASO 10: INSERCIÓN DE DATOS BÁSICOS
-- =====================================================

-- 10.1 Insertar ubicaciones principales del Perú
INSERT INTO ubicaciones (departamento, provincia, distrito, codigo_postal) VALUES
('Lima', 'Lima', 'Miraflores', '15074'),
('Lima', 'Lima', 'San Isidro', '15076'),
('Lima', 'Lima', 'La Molina', '15026'),
('Lima', 'Lima', 'Surco', '15023'),
('Arequipa', 'Arequipa', 'Arequipa', '04001'),
('Cusco', 'Cusco', 'Cusco', '08001'),
('La Libertad', 'Trujillo', 'Trujillo', '13001'),
('Lambayeque', 'Chiclayo', 'Chiclayo', '14001');

-- 10.2 Insertar especialidades médicas
INSERT INTO especialidades (nombre, descripcion) VALUES
('Medicina General', 'Atención primaria y diagnóstico general'),
('Cardiología', 'Especialidad en enfermedades del corazón'),
('Pediatría', 'Atención médica para niños y adolescentes'),
('Ginecología', 'Salud femenina y sistema reproductivo'),
('Dermatología', 'Enfermedades de la piel'),
('Psicología', 'Salud mental y terapia'),
('Ortopedia', 'Enfermedades del sistema musculoesquelético'),
('Oftalmología', 'Enfermedades de los ojos');

-- 10.3 Insertar códigos CIE-10 de ejemplo
INSERT INTO codigos_cie10 (codigo, nombre, categoria, capitulo) VALUES
('I10', 'Hipertensión esencial (primaria)', 'Enfermedades cardiovasculares', 'IX'),
('E11.9', 'Diabetes mellitus tipo 2, sin complicaciones', 'Enfermedades endocrinas', 'IV'),
('J06.9', 'Infección aguda de las vías respiratorias superiores, no especificada', 'Enfermedades respiratorias', 'X'),
('K21.9', 'Enfermedad por reflujo gastroesofágico, sin esofagitis', 'Enfermedades digestivas', 'XI'),
('M54.5', 'Lumbalgia, no especificada', 'Enfermedades musculoesqueléticas', 'XIII'),
('F41.1', 'Trastorno de ansiedad generalizada', 'Trastornos mentales', 'V'),
('N39.0', 'Infección de vías urinarias, sitio no especificado', 'Enfermedades genitourinarias', 'XIV');

-- 10.4 Insertar medicamentos de ejemplo
INSERT INTO medicamentos (codigo_digemid, nombre_comercial, nombre_generico, forma_farmaceutica, concentracion, laboratorio, principio_activo, categoria_terapeutica) VALUES
('DIG-123456', 'Losartán Potásico', 'Losartán', 'Tabletas', '50 mg', 'Genfar', 'Losartán', 'Antihipertensivo'),
('DIG-789012', 'Metformina', 'Metformina', 'Tabletas', '850 mg', 'Merck', 'Metformina', 'Antidiabético'),
('DIG-345678', 'Amoxicilina', 'Amoxicilina', 'Cápsulas', '500 mg', 'Bayer', 'Amoxicilina', 'Antibiótico'),
('DIG-901234', 'Omeprazol', 'Omeprazol', 'Cápsulas', '20 mg', 'Pfizer', 'Omeprazol', 'Antiulceroso'),
('DIG-567890', 'Atorvastatina', 'Atorvastatina', 'Tabletas', '20 mg', 'Roemmers', 'Atorvastatina', 'Hipolipemiante'),
('DIG-112233', 'Ibuprofeno', 'Ibuprofeno', 'Tabletas', '400 mg', 'Mintlab', 'Ibuprofeno', 'Antiinflamatorio'),
('DIG-445566', 'Sertralina', 'Sertralina', 'Tabletas', '50 mg', 'Pharmax', 'Sertralina', 'Antidepresivo');

-- 10.5 Insertar tratamientos recomendados
INSERT INTO tratamientos_recomendados (codigo_cie10_id, medicamento_id, dosis_recomendada, duracion_tratamiento, linea_tratamiento, evidencia_nivel) VALUES
(1, 1, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(2, 2, '1 tableta cada 12 horas con alimentos', 'Tratamiento crónico', 1, 'A'),
(3, 3, '1 cápsula cada 8 horas', '7-10 días', 1, 'A'),
(4, 4, '1 cápsula cada 24 horas antes del desayuno', '4-8 semanas', 1, 'A'),
(1, 5, '1 tableta cada 24 horas', 'Tratamiento crónico', 2, 'A'),
(6, 7, '1 tableta cada 24 horas', '6-12 meses', 1, 'A'),
(5, 6, '1 tableta cada 8 horas según dolor', '3-7 días', 1, 'A');

-- 10.6 Insertar tipos de exámenes comunes
INSERT INTO tipos_examenes (nombre, categoria, descripcion, preparacion_requerida, tiempo_resultado_horas, precio_referencial) VALUES
('Hemograma completo', 'Hematología', 'Análisis completo de células sanguíneas', 'Ayuno de 8 horas', 2, 25.00),
('Perfil lipídico', 'Bioquímica', 'Colesterol total, HDL, LDL y triglicéridos', 'Ayuno de 12 horas', 4, 35.00),
('Glucosa en ayunas', 'Bioquímica', 'Niveles de glucosa en sangre', 'Ayuno de 8 horas', 2, 15.00),
('Urocultivo', 'Microbiología', 'Cultivo de orina para detectar bacterias', 'Primera orina de la mañana', 48, 40.00),
('Radiografía de tórax', 'Imagenología', 'Estudio radiológico del tórax', 'Ninguna', 24, 80.00),
('Electrocardiograma', 'Cardiología', 'Registro de actividad eléctrica del corazón', 'Ninguna', 1, 50.00);

-- =====================================================
-- PASO 11: INSERCIÓN DE DATOS DE EJEMPLO (USUARIOS Y PERFILES)
-- =====================================================

-- 11.1 INSERTAR USUARIOS
-- Nota: Las contraseñas están hasheadas con crypt (password123)

-- Usuario Paciente 1
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('María', 'García López', 'maria.garcia@email.com', crypt('password123', gen_salt('bf')), '987654321', 'paciente', true, true);

-- Usuario Paciente 2
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Carlos', 'Rodríguez Pérez', 'carlos.rodriguez@email.com', crypt('password123', gen_salt('bf')), '987654322', 'paciente', true, true);

-- Usuario Médico 1
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Dr. Juan', 'Mendoza Silva', 'dr.mendoza@clinica.com', crypt('password123', gen_salt('bf')), '987654323', 'medico', true, true);

-- Usuario Médico 2
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Dra. Ana', 'Torres Vega', 'dra.torres@clinica.com', crypt('password123', gen_salt('bf')), '987654324', 'medico', true, true);

-- Usuario Farmacia
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Farmacia', 'MediFarma', 'admin@medifarma.com', crypt('password123', gen_salt('bf')), '014567890', 'farmacia', true, true);

-- Usuario Laboratorio
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Laboratorio', 'Clinilabs', 'admin@clinilabs.com', crypt('password123', gen_salt('bf')), '014567891', 'laboratorio', true, true);

-- 11.2 INSERTAR PACIENTES
-- Nota: Usamos los IDs de usuarios recién creados

INSERT INTO pacientes (id_usuario, fecha_nacimiento, sexo, direccion, id_ubicacion, dni, tipo_sangre, alergias, seguro_medico, peso_kg, altura_cm)
VALUES 
(
    (SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'),
    '1990-05-15',
    'femenino',
    'Av. Larco 1234, Miraflores',
    1,
    '45678901',
    'O+',
    'Penicilina, mariscos',
    'Pacífico Salud',
    65.5,
    162
),
(
    (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@email.com'),
    '1985-08-22',
    'masculino',
    'Calle Los Olivos 567, San Isidro',
    2,
    '45678902',
    'A+',
    'Ninguna conocida',
    'Rímac Seguros',
    78.0,
    175
);

-- 11.3 INSERTAR MÉDICOS

INSERT INTO medicos (id_usuario, id_especialidad, numero_colegiatura, anos_experiencia, direccion_consultorio, id_ubicacion, horario_atencion, tarifa_consulta, acepta_seguro, biografia, certificaciones)
VALUES 
(
    (SELECT id FROM usuarios WHERE email = 'dr.mendoza@clinica.com'),
    2, -- Cardiología
    'CMP-54321',
    15,
    'Centro Médico Cardio Plus, Av. Javier Prado 2458, San Isidro',
    2,
    '{"lunes": "09:00-18:00", "martes": "09:00-18:00", "miercoles": "09:00-18:00", "jueves": "09:00-18:00", "viernes": "09:00-14:00"}'::jsonb,
    150.00,
    true,
    'Cardiólogo con 15 años de experiencia, especializado en hipertensión arterial y enfermedades coronarias. Egresado de la Universidad Nacional Mayor de San Marcos.',
    'Especialidad en Cardiología - Hospital Rebagliati, Diplomado en Ecocardiografía - Universidad Cayetano Heredia'
),
(
    (SELECT id FROM usuarios WHERE email = 'dra.torres@clinica.com'),
    3, -- Pediatría
    'CMP-54322',
    10,
    'Clínica Pediátrica Los Ángeles, Av. Benavides 1890, Miraflores',
    1,
    '{"lunes": "08:00-13:00", "martes": "08:00-13:00", "miercoles": "14:00-19:00", "jueves": "08:00-13:00", "viernes": "08:00-13:00", "sabado": "09:00-12:00"}'::jsonb,
    120.00,
    true,
    'Pediatra especializada en atención integral del niño y adolescente. Enfoque en medicina preventiva y seguimiento del desarrollo infantil.',
    'Especialidad en Pediatría - Hospital del Niño, Certificación en Lactancia Materna - OMS'
);

-- 11.4 INSERTAR FARMACIAS

INSERT INTO farmacias (id_usuario, nombre_comercial, ruc, direccion, id_ubicacion, horario_atencion, delivery_disponible, radio_delivery_km, licencia_funcionamiento)
VALUES 
(
    (SELECT id FROM usuarios WHERE email = 'admin@medifarma.com'),
    'MediFarma - Sucursal Miraflores',
    '20567890123',
    'Av. Larco 898, Miraflores',
    1,
    '{"lunes": "07:00-23:00", "martes": "07:00-23:00", "miercoles": "07:00-23:00", "jueves": "07:00-23:00", "viernes": "07:00-23:00", "sabado": "08:00-22:00", "domingo": "09:00-21:00"}'::jsonb,
    true,
    5.0,
    'LF-2023-001234'
);

-- 11.5 INSERTAR LABORATORIOS

INSERT INTO laboratorios (id_usuario, nombre_comercial, ruc, direccion, id_ubicacion, horario_atencion, tipos_examenes, certificaciones, tiempo_promedio_resultados)
VALUES 
(
    (SELECT id FROM usuarios WHERE email = 'admin@clinilabs.com'),
    'CliniLabs - Centro de Diagnóstico',
    '20567890124',
    'Av. República de Panamá 3456, San Isidro',
    2,
    '{"lunes": "06:00-20:00", "martes": "06:00-20:00", "miercoles": "06:00-20:00", "jueves": "06:00-20:00", "viernes": "06:00-20:00", "sabado": "07:00-14:00"}'::jsonb,
    ARRAY['Hematología', 'Bioquímica', 'Microbiología', 'Inmunología', 'Hormonas', 'Imagenología'],
    'Certificación ISO 9001:2015, Acreditación INACAL, Certificación CAP',
    24
);

-- 11.6 INSERTAR INVENTARIO DE FARMACIA (Ejemplos de stock)

INSERT INTO inventario_farmacia (id_farmacia, id_medicamento, stock_actual, stock_minimo, precio_venta, fecha_vencimiento, lote, disponible)
VALUES 
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    1, -- Losartán
    150,
    20,
    12.50,
    '2026-12-31',
    'LOT-2024-001',
    true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    2, -- Metformina
    200,
    30,
    8.00,
    '2026-10-31',
    'LOT-2024-002',
    true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    3, -- Amoxicilina
    100,
    25,
    15.00,
    '2025-08-31',
    'LOT-2024-003',
    true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    4, -- Omeprazol
    180,
    30,
    10.50,
    '2026-11-30',
    'LOT-2024-004',
    true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    5, -- Atorvastatina
    120,
    20,
    18.00,
    '2026-09-30',
    'LOT-2024-005',
    true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    6, -- Ibuprofeno
    250,
    40,
    5.50,
    '2027-03-31',
    'LOT-2024-006',
    true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    7, -- Sertralina
    80,
    15,
    22.00,
    '2026-07-31',
    'LOT-2024-007',
    true
);

-- 11.7 INSERTAR EXPEDIENTES MÉDICOS PARA LOS PACIENTES

INSERT INTO expedientes_medicos (paciente_id, numero_expediente, alergias, enfermedades_cronicas, medicamentos_actuales, cirugias_previas, antecedentes_familiares)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678901'),
    'EXP-2024-001',
    ARRAY['Penicilina', 'Mariscos'],
    ARRAY['Hipertensión arterial controlada'],
    ARRAY['Losartán 50mg - 1 vez al día'],
    ARRAY['Apendicectomía (2015)'],
    'Madre con diabetes tipo 2, padre con hipertensión arterial'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678902'),
    'EXP-2024-002',
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    'Padre con antecedentes de infarto al miocardio a los 58 años'
);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- RESUMEN DE EJECUCIÓN:
-- 1. Extensiones creadas
-- 2. Tablas creadas en orden jerárquico (9 niveles)
-- 3. Índices creados para optimización
-- 4. Datos base insertados (ubicaciones, especialidades, CIE-10, medicamentos, etc.)
-- 5. Usuarios de ejemplo creados (2 pacientes, 2 médicos, 1 farmacia, 1 laboratorio)
-- 6. Perfiles completos creados para cada tipo de usuario
-- 7. Inventario de farmacia poblado
-- 8. Expedientes médicos inicializados

-- CREDENCIALES DE EJEMPLO (password: password123):
-- Paciente 1: maria.garcia@email.com
-- Paciente 2: carlos.rodriguez@email.com
-- Médico 1: dr.mendoza@clinica.com (Cardiólogo)
-- Médico 2: dra.torres@clinica.com (Pediatra)
-- Farmacia: admin@medifarma.com
-- Laboratorio: admin@clinilabs.com