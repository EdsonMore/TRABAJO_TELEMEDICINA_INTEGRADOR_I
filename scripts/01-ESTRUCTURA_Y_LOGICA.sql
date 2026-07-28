-- =====================================================
-- PARTE 1: ESTRUCTURA Y LÓGICA DE BASE DE DATOS
-- =====================================================
-- Este archivo contiene TODA la lógica de la BD:
-- - EXTENSIONES
-- - CREATE TABLE
-- - CREATE INDEX  
-- - CREATE FUNCTION
-- - CREATE TRIGGER
-- - CREATE VIEW
-- - COMMENTS
-- =====================================================
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- =====================================================
-- PASO 1: EXTENSIONES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PASO 2: TABLAS INDEPENDIENTES (Sin dependencias)
-- =====================================================

-- ┌─────────────────────────────────────────────────┐
-- │ 2.1 TABLA DE USUARIOS (Base de todo el sistema) │
-- └─────────────────────────────────────────────────┘

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


-- ┌─────────────────────┐
-- │ 2.2 UBICACIONES     │
-- └─────────────────────┘


CREATE TABLE ubicaciones (
    id SERIAL PRIMARY KEY,
    departamento VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    distrito VARCHAR(100),
    codigo_postal VARCHAR(10),
    activo BOOLEAN DEFAULT true,
    CONSTRAINT ubicacion_unica UNIQUE (departamento, provincia, distrito)
);


-- ┌──────────────────────────────────────────────────┐
-- │ 2.3 ESPECIALIDADES MÉDICAS   │
-- └──────────────────────────────────────────────────┘


CREATE TABLE especialidades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true
);


-- ┌────────────────────────┐
-- │ 2.4 CÓDIGOS CIE-10     │
-- └────────────────────────┘


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


-- ┌───────────────────────┐
-- │ 2.5 MEDICAMENTOS      │
-- └───────────────────────┘


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


-- ┌────────────────────────────┐
-- │ 2.6 TIPOS DE EXÁMENES      │
-- └────────────────────────────┘


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

-- ┌────────────────────────┐
-- │ 3.1 PACIENTES          │
-- └────────────────────────┘


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


-- ┌────────────────────────┐
-- │ 3.2 MÉDICOS            │
-- └────────────────────────┘


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


-- ┌────────────────────────┐
-- │ 3.3 FARMACIAS          │
-- └────────────────────────┘


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


-- ┌────────────────────────┐
-- │ 3.4 LABORATORIOS       │
-- └────────────────────────┘


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


-- ┌──────────────────────────────────────┐
-- │ 3.5 TRATAMIENTOS RECOMENDADOS        │
-- └──────────────────────────────────────┘


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


-- ┌──────────────────────────────────────┐
-- │ 3.6 EXPEDIENTES MÉDICOS              │
-- └──────────────────────────────────────┘


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

-- ┌────────────────────────┐
-- │ 4.1 CITAS MÉDICAS      │
-- └────────────────────────┘


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


-- ┌──────────────────────────────────────┐
-- │ 4.2 INVENTARIO DE FARMACIAS          │
-- └──────────────────────────────────────┘


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


-- ┌──────────────────────────────────────────┐
-- │ 4.3 DIAGNÓSTICOS POR PACIENTE            │
-- └──────────────────────────────────────────┘


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


-- ┌────────────────────────────────────┐
-- │ 4.4 EVALUACIONES                   │
-- └────────────────────────────────────┘


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


-- ┌──────────────────────────────────────────┐
-- │ 4.5 SESIONES DE TELEMEDICINA             │
-- └──────────────────────────────────────────┘


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

-- ┌─────────────────────────────────────┐
-- │ 5.1 RECETAS MÉDICAS (VERSIÓN FINAL) │
-- └─────────────────────────────────────┘


CREATE TABLE recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cita UUID NOT NULL REFERENCES citas(id),
    codigo_receta VARCHAR(50) UNIQUE NOT NULL,
    diagnostico_principal_id INTEGER REFERENCES codigos_cie10(id),
    diagnostico_principal_texto TEXT,
    diagnosticos_secundarios JSONB,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'en_proceso', 'dispensada', 'vencida', 'cancelada')),
    id_farmacia_dispensadora UUID REFERENCES farmacias(id),
    fecha_dispensacion TIMESTAMP,
    firma_medico TEXT,
    sello_temporal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_entrega VARCHAR(50) DEFAULT 'recojo' CHECK (tipo_entrega IN ('recojo', 'domicilio')),
    direccion_entrega TEXT,
    costo_entrega DECIMAL(10, 2) DEFAULT 0,
    -- CAMPOS AGREGADOS EN LA MIGRACIÓN
    farmacia_seleccionada_id UUID REFERENCES farmacias(id) ON DELETE SET NULL,
    estado_envio VARCHAR(20) DEFAULT 'no_enviada' CHECK (estado_envio IN ('no_enviada', 'enviada', 'recibida', 'rechazada', 'dispensada')),
    fecha_envio_farmacia TIMESTAMP,
    motivo_rechazo TEXT,
    -- CAMPOS AGREGADOS EN LA SEGUNDA MIGRACIÓN
    fecha_aceptacion_farmacia TIMESTAMP,
    fecha_inicio_preparacion TIMESTAMP,
    fecha_finalizacion_preparacion TIMESTAMP,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    boleta_despacho_id UUID
);


-- ┌──────────────────────────────────────┐
-- │ 5.2 SOLICITUDES DE EXÁMENES          │
-- └──────────────────────────────────────┘


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

-- ┌──────────────────────────────────────────┐
-- │ 6.1 DETALLE DE RECETAS                   │
-- └──────────────────────────────────────────┘


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


-- ┌────────────────────────────────────┐
-- │ 6.2 DETALLE DE EXÁMENES            │
-- └────────────────────────────────────┘


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

-- ┌──────────────────────────────────────────┐
-- │ 7.1 RESULTADOS DE LABORATORIO            │
-- └──────────────────────────────────────────┘


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

-- ┌────────────────────────────┐
-- │ 8.1 NOTIFICACIONES         │
-- └────────────────────────────┘


CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT,
  tipo VARCHAR(50) NOT NULL DEFAULT 'sistema' CHECK (tipo IN ('cita', 'receta', 'resultado', 'sistema', 'farmacia', 'laboratorio', 'despacho')),
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  id_relacionado UUID
);


-- ┌────────────────────────────┐
-- │ 8.2 PAGOS                  │
-- └────────────────────────────┘


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


-- ┌────────────────────────────┐
-- │ 8.3 AUDITORÍA              │
-- └────────────────────────────┘


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


-- ┌──────────────────────────────────────────┐
-- │ 8.4 HISTORIAL DE ENVÍOS DE RECETAS       │
-- └──────────────────────────────────────────┘


CREATE TABLE historial_envio_recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    farmacia_id UUID REFERENCES farmacias(id) ON DELETE SET NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    motivo TEXT,
    usuario_id UUID REFERENCES usuarios(id),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ┌──────────────────────────────────────────┐
-- │ 8.5 BÚSQUEDAS DE FARMACIAS               │
-- └──────────────────────────────────────────┘


CREATE TABLE busquedas_farmacias_recetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    farmacias_consultadas JSONB NOT NULL,
    farmacia_seleccionada_id UUID REFERENCES farmacias(id)
);


-- ┌──────────────────────────────────────────────┐
-- │ 8.6 PROTECCIÓN GLOBAL DEL HISTORIAL MÉDICO   │
-- └──────────────────────────────────────────────┘


CREATE TABLE proteccion_historial_medico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_medico UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ┌──────────────────────────────────────────┐
-- │ 8.7 HISTORIAL DE CAMBIOS DE ESTADO       │
-- └──────────────────────────────────────────┘


CREATE TABLE historial_cambios_estado_receta (
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


-- ┌──────────────────────────────────────────┐
-- │ 8.8 PROTECCIÓN DE HISTORIAL (OBSOLETA)   │
-- └──────────────────────────────────────────┘


CREATE TABLE historial_protecciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_paciente UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  id_medico UUID REFERENCES medicos(id),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_paciente)
);


-- ┌──────────────────────────────────────────┐
-- │ 8.9 LOG DE ACCESO AL HISTORIAL           │
-- └──────────────────────────────────────────┘


CREATE TABLE acceso_historial_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_medico UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
  id_paciente UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tipo_acceso VARCHAR(50) DEFAULT 'visualizar' CHECK (tipo_acceso IN ('visualizar', 'descargar', 'imprimir')),
  ip_address VARCHAR(45),
  descripcion TEXT
);


-- ┌──────────────────────────────────────────┐
-- │ 8.10 BOLETAS DE DESPACHO                 │
-- └──────────────────────────────────────────┘


CREATE TABLE boletas_despacho (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_receta UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  id_farmacia UUID NOT NULL REFERENCES farmacias(id) ON DELETE CASCADE,
  numero_boleta VARCHAR(50) NOT NULL UNIQUE,
  fecha_despacho TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(10, 2) NOT NULL,
  igv DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  tipo_entrega VARCHAR(20) NOT NULL DEFAULT 'recojo',
  direccion_entrega TEXT,
  medicamentos_despachados JSONB NOT NULL,
  boleta_pdf_path VARCHAR(255),
  nota_venta_pdf_path VARCHAR(255),
  estado VARCHAR(20) NOT NULL DEFAULT 'generada',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- PASO 9: ÍNDICES PARA OPTIMIZACIÓN (SECCIÓN COMPLETA)
-- =====================================================

-- ÍNDICES PARA USUARIOS
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol, activo);

-- ÍNDICES PARA PACIENTES
CREATE INDEX idx_pacientes_usuario ON pacientes(id_usuario);
CREATE INDEX idx_pacientes_dni ON pacientes(dni);

-- ÍNDICES PARA MÉDICOS
CREATE INDEX idx_medicos_usuario ON medicos(id_usuario);
CREATE INDEX idx_medicos_especialidad ON medicos(id_especialidad);
CREATE INDEX idx_medicos_colegiatura ON medicos(numero_colegiatura);

-- ÍNDICES PARA CITAS
CREATE INDEX idx_citas_paciente ON citas(id_paciente, fecha_cita);
CREATE INDEX idx_citas_medico ON citas(id_medico, fecha_cita);
CREATE INDEX idx_citas_estado ON citas(estado, fecha_cita);

-- ÍNDICES PARA CIE-10 Y MEDICAMENTOS
CREATE INDEX idx_cie10_codigo ON codigos_cie10(codigo);
CREATE INDEX idx_medicamentos_digemid ON medicamentos(codigo_digemid);
CREATE INDEX idx_medicamentos_generico ON medicamentos(nombre_generico);
CREATE INDEX idx_tratamientos_cie10 ON tratamientos_recomendados(codigo_cie10_id);
CREATE INDEX idx_tratamientos_medicamento ON tratamientos_recomendados(medicamento_id);

-- ÍNDICES PARA RECETAS
CREATE INDEX idx_recetas_cita ON recetas(id_cita);
CREATE INDEX idx_recetas_diagnostico ON recetas(diagnostico_principal_id);
CREATE INDEX idx_recetas_fecha ON recetas(fecha_emision);
CREATE INDEX idx_recetas_tipo_entrega ON recetas(tipo_entrega);
CREATE INDEX idx_receta_detalle_receta ON receta_detalle(id_receta);
CREATE INDEX idx_receta_detalle_medicamento ON receta_detalle(medicamento_id);

-- ÍNDICES PARA INVENTARIO
CREATE INDEX idx_inventario_farmacia ON inventario_farmacia(id_farmacia, disponible);
CREATE INDEX idx_inventario_medicamento ON inventario_farmacia(id_medicamento, stock_actual);

-- ÍNDICES PARA EXÁMENES
CREATE INDEX idx_solicitudes_cita ON solicitudes_examenes(id_cita);
CREATE INDEX idx_solicitudes_lab ON solicitudes_examenes(id_laboratorio);
CREATE INDEX idx_examen_detalle_solicitud ON examen_detalle(id_solicitud);
CREATE INDEX idx_resultados_detalle ON resultados_laboratorio(id_examen_detalle);

-- ÍNDICES PARA EXPEDIENTES Y DIAGNÓSTICOS
CREATE INDEX idx_expedientes_paciente ON expedientes_medicos(paciente_id);
CREATE INDEX idx_diagnosticos_paciente ON diagnosticos_paciente(paciente_id, fecha_diagnostico);
CREATE INDEX idx_diagnosticos_cie10 ON diagnosticos_paciente(codigo_cie10_id);

-- ÍNDICES PARA NOTIFICACIONES Y PAGOS
CREATE INDEX idx_notificaciones_usuario ON notificaciones(id_usuario, leida);
CREATE INDEX idx_pagos_usuario ON pagos(usuario_id, estado);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id, fecha_accion);

-- ÍNDICES PARA MIGRACIÓN DE RECETAS
CREATE INDEX idx_recetas_farmacia_seleccionada ON recetas(farmacia_seleccionada_id, estado_envio);
CREATE INDEX idx_recetas_estado_envio ON recetas(estado_envio, fecha_emision);
CREATE INDEX idx_historial_envio_receta ON historial_envio_recetas(receta_id, fecha_cambio);
CREATE INDEX idx_historial_envio_farmacia ON historial_envio_recetas(farmacia_id, fecha_cambio);
CREATE INDEX idx_busquedas_receta ON busquedas_farmacias_recetas(receta_id);
CREATE INDEX idx_busquedas_paciente ON busquedas_farmacias_recetas(paciente_id, fecha_busqueda);

-- ÍNDICES PARA SEGUNDA MIGRACIÓN (SEGUIMIENTO DE RECETAS)
CREATE INDEX idx_historial_receta ON historial_cambios_estado_receta(receta_id);
CREATE INDEX idx_historial_fecha ON historial_cambios_estado_receta(fecha_cambio DESC);
CREATE INDEX idx_historial_estado_nuevo ON historial_cambios_estado_receta(estado_nuevo);
CREATE INDEX idx_historial_notificado ON historial_cambios_estado_receta(notificado) WHERE notificado = FALSE;

-- ÍNDICES PARA NOTIFICACIONES (ADICIONALES)
CREATE INDEX idx_notificaciones_id_usuario ON notificaciones(id_usuario);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_created_at ON notificaciones(created_at DESC);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);

-- ÍNDICES PARA PROTECCIÓN DE HISTORIAL (OBSOLETA)
CREATE INDEX idx_historial_protecciones_id_paciente ON historial_protecciones(id_paciente);
CREATE INDEX idx_historial_protecciones_id_medico ON historial_protecciones(id_medico);
CREATE INDEX idx_acceso_historial_logs_medico ON acceso_historial_logs(id_medico);
CREATE INDEX idx_acceso_historial_logs_paciente ON acceso_historial_logs(id_paciente);
CREATE INDEX idx_acceso_historial_logs_fecha ON acceso_historial_logs(fecha_acceso DESC);

-- ÍNDICES PARA PROTECCIÓN DE HISTORIAL MÉDICO
CREATE INDEX idx_proteccion_historial_medico ON proteccion_historial_medico(id_medico);
CREATE INDEX idx_proteccion_historial_created ON proteccion_historial_medico(created_at DESC);

-- ÍNDICES PARA BOLETAS
CREATE INDEX idx_boleta_receta ON boletas_despacho(id_receta);
CREATE INDEX idx_boleta_farmacia ON boletas_despacho(id_farmacia);
CREATE INDEX idx_boleta_numero ON boletas_despacho(numero_boleta);
CREATE INDEX idx_boleta_fecha ON boletas_despacho(fecha_despacho);
CREATE INDEX idx_receta_boleta ON recetas(boleta_despacho_id);


-- =====================================================
-- PASO 10: FUNCIONES ALMACENADAS
-- =====================================================

-- ┌──────────────────────────────────────────────────────┐
-- │ 10.1 FUNCIÓN: Calcular precio receta por farmacia    │
-- └──────────────────────────────────────────────────────┘


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

-- ┌──────────────────────────────────────────────────────┐
-- │ 10.2 FUNCIÓN: Registrar cambio de envío de receta    │
-- └──────────────────────────────────────────────────────┘


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

-- ┌──────────────────────────────────────────────────────┐
-- │ 10.3 FUNCIÓN: Actualizar timestamp automáticamente   │
-- └──────────────────────────────────────────────────────┘


CREATE OR REPLACE FUNCTION actualizar_timestamp_receta()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ┌──────────────────────────────────────────────────────┐
-- │ 10.4 FUNCIÓN: Registrar cambios de estado de receta  │
-- └──────────────────────────────────────────────────────┘


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

-- ┌──────────────────────────────────────────────────────┐
-- │ 10.5 FUNCIÓN: Actualizar fechas específicas receta   │
-- └──────────────────────────────────────────────────────┘


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

-- ┌──────────────────────────────────────────────────────┐
-- │ 10.6 FUNCIÓN: Generar número de boleta automático    │
-- └──────────────────────────────────────────────────────┘


CREATE OR REPLACE FUNCTION generar_numero_boleta()
RETURNS TRIGGER AS $$
DECLARE
    año_actual VARCHAR(4);
    consecutivo INTEGER;
    nuevo_numero VARCHAR(50);
BEGIN
    -- Obtener año actual
    año_actual := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Obtener último consecutivo del año
    -- Buscar números con formato: B-YYYY-NNNNNN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_boleta FROM 8 FOR 6) AS INTEGER)), 0) + 1
    INTO consecutivo
    FROM boletas_despacho
    WHERE numero_boleta LIKE 'B-' || año_actual || '-%';
    
    -- Formatear número: B-YYYY-000001
    nuevo_numero := 'B-' || año_actual || '-' || LPAD(consecutivo::TEXT, 6, '0');
    
    -- Asignar número a la nueva boleta
    NEW.numero_boleta := nuevo_numero;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ┌──────────────────────────────────────────────────────┐
-- │ 10.7 FUNCIÓN: Crear boleta al dispensar receta       │
-- └──────────────────────────────────────────────────────┘


CREATE OR REPLACE FUNCTION crear_boleta_al_dispensar()
RETURNS TRIGGER AS $$
DECLARE
    farmacia_info RECORD;
    receta_info RECORD;
    detalle_receta RECORD;
    medicamentos_despachados JSONB := '[]'::JSONB;
    subtotal_val DECIMAL(10,2) := 0;
    igv_val DECIMAL(10,2);
    total_val DECIMAL(10,2);
    boleta_id UUID;
BEGIN
    -- Solo crear boleta cuando pasa a estado 'dispensada'
    IF OLD.estado_envio IS DISTINCT FROM NEW.estado_envio AND NEW.estado_envio = 'dispensada' THEN
        -- Obtener información de la farmacia
        SELECT f.*, ub.departamento, ub.provincia, ub.distrito
        INTO farmacia_info
        FROM farmacias f
        LEFT JOIN ubicaciones ub ON f.id_ubicacion = ub.id
        WHERE f.id = NEW.farmacia_seleccionada_id;
        
        -- Obtener información de la receta
        SELECT r.*, p.dni as paciente_dni, 
               CONCAT(u.nombre, ' ', u.apellido) as paciente_nombre
        INTO receta_info
        FROM recetas r
        JOIN citas c ON r.id_cita = c.id
        JOIN pacientes p ON c.id_paciente = p.id
        JOIN usuarios u ON p.id_usuario = u.id
        WHERE r.id = NEW.id;
        
        -- Recorrer detalle de receta para calcular totales
        FOR detalle_receta IN
            SELECT 
                rd.id,
                rd.medicamento_id,
                rd.cantidad,
                rd.dosis,
                rd.frecuencia,
                m.nombre_comercial,
                m.nombre_generico,
                inv.precio_venta,
                inv.lote
            FROM receta_detalle rd
            JOIN medicamentos m ON rd.medicamento_id = m.id
            JOIN inventario_farmacia inv ON inv.id_medicamento = m.id 
                AND inv.id_farmacia = NEW.farmacia_seleccionada_id
                AND inv.disponible = true
            WHERE rd.id_receta = NEW.id
        LOOP
            -- Agregar medicamento al JSON
            medicamentos_despachados := medicamentos_despachados || jsonb_build_object(
                'medicamento_id', detalle_receta.medicamento_id,
                'nombre_comercial', detalle_receta.nombre_comercial,
                'nombre_generico', detalle_receta.nombre_generico,
                'cantidad_dispensada', detalle_receta.cantidad,
                'precio_unitario', detalle_receta.precio_venta,
                'lote', detalle_receta.lote,
                'subtotal', detalle_receta.precio_venta * detalle_receta.cantidad
            );
            
            -- Acumular subtotal
            subtotal_val := subtotal_val + (detalle_receta.precio_venta * detalle_receta.cantidad);
        END LOOP;
        
        -- Calcular IGV (18%)
        igv_val := subtotal_val * 0.18;
        total_val := subtotal_val + igv_val;
        
        -- Insertar boleta
        INSERT INTO boletas_despacho (
            id_receta,
            id_farmacia,
            fecha_despacho,
            subtotal,
            igv,
            total,
            tipo_entrega,
            direccion_entrega,
            medicamentos_despachados,
            estado,
            observaciones
        ) VALUES (
            NEW.id,
            NEW.farmacia_seleccionada_id,
            NEW.fecha_dispensacion,
            subtotal_val,
            igv_val,
            total_val,
            NEW.tipo_entrega,
            NEW.direccion_entrega,
            medicamentos_despachados,
            'generada',
            'Boleta generada automáticamente al dispensar receta'
        ) RETURNING id INTO boleta_id;
        
        -- Actualizar receta con ID de boleta
        UPDATE recetas 
        SET boleta_despacho_id = boleta_id 
        WHERE id = NEW.id;
        
        -- Notificar paciente
        INSERT INTO notificaciones (
            id_usuario,
            titulo,
            mensaje,
            tipo,
            id_relacionado
        )
        SELECT 
            p.id_usuario,
            'Boleta de despacho generada',
            'Se ha generado la boleta ' || (SELECT numero_boleta FROM boletas_despacho WHERE id = boleta_id) || 
            ' por un total de S/ ' || total_val || '. Puede descargarla desde su historial.',
            'despacho',
            boleta_id
        FROM pacientes p
        JOIN citas c ON p.id = c.id_paciente
        JOIN recetas r ON c.id = r.id_cita
        WHERE r.id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- PASO 11: TRIGGERS (Aplicados en secuencia correcta)
-- =====================================================

-- Trigger para actualizar timestamp
DROP TRIGGER IF EXISTS trigger_actualizar_timestamp_receta ON recetas;
CREATE TRIGGER trigger_actualizar_timestamp_receta
BEFORE UPDATE ON recetas
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_receta();

-- Trigger para registrar cambios automáticamente
DROP TRIGGER IF EXISTS trigger_registrar_cambio_estado ON recetas;
CREATE TRIGGER trigger_registrar_cambio_estado
AFTER UPDATE ON recetas
FOR EACH ROW
EXECUTE FUNCTION registrar_cambio_estado_receta();

-- Trigger para fechas específicas (debe ejecutarse ANTES del trigger de timestamp)
DROP TRIGGER IF EXISTS trigger_actualizar_fechas_especificas ON recetas;
CREATE TRIGGER trigger_actualizar_fechas_especificas
BEFORE UPDATE ON recetas
FOR EACH ROW
EXECUTE FUNCTION actualizar_fechas_especificas_receta();

-- Trigger para generar número de boleta
DROP TRIGGER IF EXISTS trigger_generar_numero_boleta ON boletas_despacho;
CREATE TRIGGER trigger_generar_numero_boleta
BEFORE INSERT ON boletas_despacho
FOR EACH ROW
EXECUTE FUNCTION generar_numero_boleta();

-- Trigger para crear boleta automática al dispensar
DROP TRIGGER IF EXISTS trigger_crear_boleta_despacho ON recetas;
CREATE TRIGGER trigger_crear_boleta_despacho
AFTER UPDATE ON recetas
FOR EACH ROW
EXECUTE FUNCTION crear_boleta_al_dispensar();


-- =====================================================
-- PASO 12: VISTAS PARA REPORTING Y ANÁLISIS
-- =====================================================

-- ┌──────────────────────────────────────────────────────┐
-- │ 12.1 VISTA: Disponibilidad de medicamentos           │
-- └──────────────────────────────────────────────────────┘


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
    0 as reservas_activas,
    inv.stock_actual as stock_disponible,
    inv.precio_venta,
    inv.fecha_vencimiento,
    inv.lote,
    CASE 
        WHEN inv.stock_actual <= 0 THEN 'Sin Stock'
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

-- ┌──────────────────────────────────────────────────────┐
-- │ 12.2 VISTA: Historial de recetas completo           │
-- └──────────────────────────────────────────────────────┘


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

-- ┌──────────────────────────────────────────────────────┐
-- │ 12.3 VISTA: Boletas con detalles completos           │
-- └──────────────────────────────────────────────────────┘


CREATE OR REPLACE VIEW vista_boletas_completas AS
SELECT 
    b.id,
    b.numero_boleta,
    b.fecha_despacho,
    r.codigo_receta,
    b.subtotal,
    b.igv,
    b.total,
    b.tipo_entrega,
    b.direccion_entrega,
    b.estado as estado_boleta,
    b.observaciones,
    b.boleta_pdf_path,
    b.nota_venta_pdf_path,
    f.nombre_comercial as farmacia_nombre,
    f.ruc as farmacia_ruc,
    ub.departamento as farmacia_departamento,
    ub.provincia as farmacia_provincia,
    ub.distrito as farmacia_distrito,
    p.dni as paciente_dni,
    CONCAT(u.nombre, ' ', u.apellido) as paciente_nombre,
    CONCAT(um.nombre, ' ', um.apellido) as medico_nombre,
    b.medicamentos_despachados,
    b.created_at,
    b.updated_at
FROM boletas_despacho b
JOIN recetas r ON b.id_receta = r.id
JOIN farmacias f ON b.id_farmacia = f.id
LEFT JOIN ubicaciones ub ON f.id_ubicacion = ub.id
JOIN citas c ON r.id_cita = c.id
JOIN pacientes p ON c.id_paciente = p.id
JOIN usuarios u ON p.id_usuario = u.id
JOIN medicos m ON c.id_medico = m.id
JOIN usuarios um ON m.id_usuario = um.id
ORDER BY b.fecha_despacho DESC;


-- =====================================================
-- PASO 13: EXTENSIONES A TABLAS EXISTENTES
-- =====================================================

ALTER TABLE inventario_farmacia
ADD COLUMN IF NOT EXISTS reservas_activas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_actualizacion_stock TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- =====================================================
-- PASO 14: COMENTARIOS Y DOCUMENTACIÓN (SCHEMA)
-- =====================================================

-- ┌──────────────────────────────────────────────────────┐
-- │ COMENTARIOS PARA NUEVAS COLUMNAS DE RECETAS          │
-- └──────────────────────────────────────────────────────┘

COMMENT ON COLUMN recetas.farmacia_seleccionada_id IS 'Referencia a la farmacia elegida por el paciente para dispensar la receta';
COMMENT ON COLUMN recetas.estado_envio IS 'Estado del envío: no_enviada, enviada, recibida, rechazada, dispensada';
COMMENT ON COLUMN recetas.fecha_envio_farmacia IS 'Fecha y hora cuando el paciente envió la receta a la farmacia';
COMMENT ON COLUMN recetas.motivo_rechazo IS 'Razón por la que la farmacia rechazó la receta (si aplica)';
COMMENT ON COLUMN recetas.fecha_aceptacion_farmacia IS 'Fecha y hora en que la farmacia aceptó la receta';
COMMENT ON COLUMN recetas.fecha_inicio_preparacion IS 'Fecha y hora en que la farmacia comenzó a preparar los medicamentos';
COMMENT ON COLUMN recetas.fecha_finalizacion_preparacion IS 'Fecha y hora en que la farmacia finalizó la preparación';
COMMENT ON COLUMN recetas.ultima_actualizacion IS 'Timestamp de la última modificación de la receta';
COMMENT ON COLUMN recetas.boleta_despacho_id IS 'ID de la boleta de despacho generada cuando se completa el despacho';

COMMENT ON COLUMN inventario_farmacia.reservas_activas IS 'Cantidad de medicamentos reservados en recetas no dispensadas aún';

COMMENT ON TABLE historial_cambios_estado_receta IS 'Registro histórico de todos los cambios de estado de recetas para tracking en tiempo real';
COMMENT ON COLUMN historial_cambios_estado_receta.receta_id IS 'ID de la receta a la que pertenece este cambio';
COMMENT ON COLUMN historial_cambios_estado_receta.estado_anterior IS 'Estado previo antes del cambio';
COMMENT ON COLUMN historial_cambios_estado_receta.estado_nuevo IS 'Nuevo estado después del cambio';
COMMENT ON COLUMN historial_cambios_estado_receta.notificado IS 'Indica si el paciente fue notificado de este cambio';
COMMENT ON COLUMN historial_cambios_estado_receta.detalles IS 'Información adicional del cambio en formato JSON';

COMMENT ON TABLE proteccion_historial_medico IS 'Almacena la contraseña global para proteger TODOS los historiales médicos de un médico';
COMMENT ON COLUMN proteccion_historial_medico.id_medico IS 'ID del médico propietario de esta protección (ÚNICA por médico)';
COMMENT ON COLUMN proteccion_historial_medico.password_hash IS 'Hash bcrypt de la contraseña';
COMMENT ON COLUMN proteccion_historial_medico.created_at IS 'Fecha de creación';
COMMENT ON COLUMN proteccion_historial_medico.updated_at IS 'Última actualización';

COMMENT ON TABLE boletas_despacho IS 'Almacena las boletas/comprobantes generados cuando se despacha una receta';
COMMENT ON COLUMN boletas_despacho.id_receta IS 'ID de la receta que se despachó';
COMMENT ON COLUMN boletas_despacho.id_farmacia IS 'ID de la farmacia que realizó el despacho';
COMMENT ON COLUMN boletas_despacho.numero_boleta IS 'Número único de la boleta para auditoría (formato: B-YYYY-000001)';
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


-- =====================================================
-- PASO 15: SINCRONIZACIÓN DE ESTADOS EXISTENTES
-- =====================================================

-- Sincronizar recetas en proceso
UPDATE recetas
SET estado_envio = 'en_proceso'
WHERE estado = 'en_proceso' 
  AND (estado_envio IS NULL OR estado_envio != 'en_proceso')
  AND farmacia_seleccionada_id IS NOT NULL;

-- Sincronizar recetas dispensadas
UPDATE recetas
SET estado_envio = 'dispensada'
WHERE estado = 'dispensada' 
  AND (estado_envio IS NULL OR estado_envio != 'dispensada')
  AND farmacia_seleccionada_id IS NOT NULL;

-- Sincronizar recetas canceladas/rechazadas
UPDATE recetas
SET estado_envio = 'rechazada'
WHERE estado = 'cancelada' 
  AND (estado_envio IS NULL OR estado_envio != 'rechazada')
  AND farmacia_seleccionada_id IS NOT NULL;


-- =====================================================
-- FIN: ESTRUCTURA Y LÓGICA DE BASE DE DATOS
-- =====================================================
