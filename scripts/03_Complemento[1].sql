-- Paciente 6
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado)
VALUES 
('Javier', 'Lozano Paredes', 'javier.lozano@correo.com', crypt('password123', gen_salt('bf')), '987654330', 'paciente', true, true);

-- Paciente 7
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado)
VALUES 
('Natalia', 'Ruiz Salazar', 'natalia.ruiz@correo.com', crypt('password123', gen_salt('bf')), '987654331', 'paciente', true, true);

-- Paciente 8
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado)
VALUES 
('Esteban', 'Vargas Luján', 'esteban.vargas@correo.com', crypt('password123', gen_salt('bf')), '987654332', 'paciente', true, true);

-- Paciente 9
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado)
VALUES 
('Rocío', 'Medina Campos', 'rocio.medina@correo.com', crypt('password123', gen_salt('bf')), '987654333', 'paciente', true, true);

-- Paciente 10
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado)
VALUES 
('Tomás', 'Cáceres Huamán', 'tomas.caceres@correo.com', crypt('password123', gen_salt('bf')), '987654334', 'paciente', true, true);

-- Farmacia 3
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado)
VALUES
('Farmacia', 'SaludTotal', 'admin@saludtotal.com', crypt('password123', gen_salt('bf')), '014567893', 'farmacia', true, true);

-- Farmacia 4
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado)
VALUES
('Farmacia', 'FarmaVida', 'admin@farmavida.com', crypt('password123', gen_salt('bf')), '014567894', 'farmacia', true, true);


INSERT INTO pacientes (id_usuario, fecha_nacimiento, sexo, direccion, id_ubicacion, dni, tipo_sangre, alergias, seguro_medico, peso_kg, altura_cm)
VALUES
(
    (SELECT id FROM usuarios WHERE email = 'javier.lozano@correo.com'),
    '1988-04-10', 'masculino',
    'Av. Grau 1540, Piura',
    1,
    '45678906', 'A-', 'Ninguna', 'EsSalud', 82, 178
),
(
    (SELECT id FROM usuarios WHERE email = 'natalia.ruiz@correo.com'),
    '1993-12-02', 'femenino',
    'Jr. Lima 245, Castilla',
    2,
    '45678907', 'O+', 'Aspirina', 'Pacífico Salud', 60, 165
),
(
    (SELECT id FROM usuarios WHERE email = 'esteban.vargas@correo.com'),
    '1985-03-21', 'masculino',
    'Calle Junín 980, Catacaos',
    3,
    '45678908', 'B-', 'Ninguna', 'Rímac Seguros', 75, 173
),
(
    (SELECT id FROM usuarios WHERE email = 'rocio.medina@correo.com'),
    '1998-07-14', 'femenino',
    'Av. Arequipa 330, Piura',
    1,
    '45678909', 'AB+', 'Gluten', 'Mapfre', 55, 160
),
(
    (SELECT id FROM usuarios WHERE email = 'tomas.caceres@correo.com'),
    '1990-10-30', 'masculino',
    'Calle Tarapacá 556, Sullana',
    10,
    '45678910', 'O-', 'Mariscos', 'La Positiva', 70, 172
);

-- Farmacia 3 - SaludTotal
INSERT INTO farmacias (id_usuario, nombre_comercial, ruc, direccion, id_ubicacion, horario_atencion, delivery_disponible, radio_delivery_km, licencia_funcionamiento)
VALUES (
    (SELECT id FROM usuarios WHERE email = 'admin@saludtotal.com'),
    'SaludTotal - Sucursal Castilla',
    '20678901234',
    'Av. Independencia 450, Castilla',
    2, -- Castilla
    '{"lunes":"08:00-22:00","martes":"08:00-22:00","miercoles":"08:00-22:00","jueves":"08:00-22:00","viernes":"08:00-22:00","sabado":"09:00-20:00","domingo":"09:00-20:00"}',
    true,
    5,
    'LIC-ST-2024-5501'
);

-- Farmacia 4 - FarmaVida
INSERT INTO farmacias (id_usuario, nombre_comercial, ruc, direccion, id_ubicacion, horario_atencion, delivery_disponible, radio_delivery_km, licencia_funcionamiento)
VALUES (
    (SELECT id FROM usuarios WHERE email = 'admin@farmavida.com'),
    'FarmaVida - Sullana Centro',
    '20678905678',
    'Jr. Cuzco 102, Sullana',
    10, -- Sullana
    '{"lunes":"07:00-23:00","martes":"07:00-23:00","miercoles":"07:00-23:00","jueves":"07:00-23:00","viernes":"07:00-23:00","sabado":"08:00-22:00","domingo":"08:00-22:00"}',
    true,
    7,
    'LIC-FV-2024-8890'
);



---citas 
-- CITA 11: Javier Lozano (A-) con Dr. Juan Mendoza (Cardiología)
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, diagnostico, tratamiento, costo, pagado, metodo_pago)
VALUES (
    (SELECT id FROM pacientes WHERE dni = '45678906'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54321'),
    '2024-12-20',
    '10:00:00',
    'presencial',
    'completada',
    'Dolor torácico leve y antecedentes familiares cardiacos',
    'Sospecha de hipertensión arterial leve',
    'Se solicita electrocardiograma + control de presión semanal',
    150.00,
    true,
    'tarjeta'
);

-- CITA 12: Natalia Ruiz (O+) con Dra. Lazo (Ginecología)
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, diagnostico, tratamiento, costo, pagado, metodo_pago)
VALUES (
    (SELECT id FROM pacientes WHERE dni = '45678907'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54324'),
    '2024-12-22',
    '09:30:00',
    'presencial',
    'completada',
    'Dolor pélvico intermitente y antecedentes de quistes',
    'Posible síndrome de ovario poliquístico leve',
    'Ecografía transvaginal + dieta baja en carbohidratos',
    175.00,
    true,
    'efectivo'
);

-- CITA 13: Esteban Vargas (B-) con Dr. Vargas (Medicina General)
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, diagnostico, tratamiento, costo)
VALUES (
    (SELECT id FROM pacientes WHERE dni = '45678908'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    '2024-12-18',
    '18:30:00',
    'virtual',
    'confirmada',
    'Fatiga persistente y episodios de mareo',
    NULL,
    NULL,
    100.00
);

-- CITA 14: Rocío Medina (AB+) con Dr. Carlos Vargas
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, costo, pagado)
VALUES (
    (SELECT id FROM pacientes WHERE dni = '45678909'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    '2024-12-21',
    '11:00:00',
    'virtual',
    'completada',
    'Reacciones alérgicas recurrentes (gluten)',
    100.00,
    true
);

-- CITA 15: Tomás Cáceres (O-) con Dr. Juan Mendoza
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, diagnostico, tratamiento, costo)
VALUES (
    (SELECT id FROM pacientes WHERE dni = '45678910'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54321'),
    '2025-01-05',
    '08:30:00',
    'presencial',
    'confirmada',
    'Palpitaciones frecuentes tras actividad física',
    NULL,
    NULL,
    150.00
);
---evaluaciones
INSERT INTO evaluaciones (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
VALUES (
    (SELECT id FROM citas 
        WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678906')
        AND fecha_cita = '2024-12-20'),
    (SELECT id FROM pacientes WHERE dni = '45678906'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54321'),
    5,
    'El médico realizó una evaluación detallada y explicó claramente los riesgos cardiacos.',
    true
);

INSERT INTO evaluaciones (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
VALUES (
    (SELECT id FROM citas 
        WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678907')
        AND fecha_cita = '2024-12-22'),
    (SELECT id FROM pacientes WHERE dni = '45678907'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54324'),
    4,
    'La doctora fue amable y explicó todo con detalle. Recomendaciones claras.',
    true
);
INSERT INTO evaluaciones (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
VALUES (
    (SELECT id FROM citas 
        WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678908')
        AND fecha_cita = '2024-12-18'),
    (SELECT id FROM pacientes WHERE dni = '45678908'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    5,
    'Muy buena atención, el doctor solicitó los exámenes necesarios.',
    true
);
INSERT INTO evaluaciones (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
VALUES (
    (SELECT id FROM citas 
        WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678909')
        AND fecha_cita = '2024-12-21'),
    (SELECT id FROM pacientes WHERE dni = '45678909'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    5,
    'Diagnóstico certero y tratamiento adecuado. Muy recomendable.',
    true
);
INSERT INTO evaluaciones (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
VALUES (
    (SELECT id FROM citas 
        WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678910')
        AND fecha_cita = '2025-01-05'),
    (SELECT id FROM pacientes WHERE dni = '45678910'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54321'),
    4,
    'Buena atención, me derivó a exámenes más completos. Profesional y claro.',
    true
);







--INVENTARIO — FarmaVida – Sullana Centro

--(15 productos, coherentes y estilo realista)

INSERT INTO inventario_farmacia
(id_farmacia, id_medicamento, stock_actual, stock_minimo, precio_venta, fecha_vencimiento, lote, disponible)
VALUES
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 1, 120, 20, 12.00, '2026-12-18', 'FVC-001-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 2, 105, 15, 19.50, '2026-09-10', 'FVC-002-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 3, 65, 10, 11.00, '2027-01-08', 'FVC-003-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 4, 170, 20, 21.80, '2027-03-25', 'FVC-004-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 5, 140, 15, 7.80, '2026-10-25', 'FVC-005-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 6, 85, 10, 44.00, '2026-09-05', 'FVC-006-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 7, 50, 5, 66.90, '2027-02-14', 'FVC-007-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 8, 140, 20, 5.50, '2027-06-22', 'FVC-008-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 9, 95, 10, 20.00, '2027-03-15', 'FVC-009-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 10, 165, 20, 14.00, '2027-01-25', 'FVC-010-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 11, 75, 10, 34.50, '2026-08-19', 'FVC-011-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 12, 58, 8, 26.00, '2026-09-12', 'FVC-012-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 13, 155, 15, 9.20, '2027-04-25', 'FVC-013-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 14, 135, 18, 12.00, '2027-03-08', 'FVC-014-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaVida - Sullana Centro'), 15, 82, 10, 32.50, '2026-10-03', 'FVC-015-2024', true);



--INVENTARIO — SaludTotal – Sucursal Castilla

--(15 productos, coherentes, estilo idéntico a MediFarma y FarmaPlus)

INSERT INTO inventario_farmacia
(id_farmacia, id_medicamento, stock_actual, stock_minimo, precio_venta, fecha_vencimiento, lote, disponible)
VALUES
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 1, 140, 20, 12.50, '2026-12-20', 'STC-001-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 2, 90, 15, 18.90, '2026-10-15', 'STC-002-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 3, 75, 10, 10.50, '2026-09-05', 'STC-003-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 4, 180, 20, 22.00, '2027-02-12', 'STC-004-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 5, 130, 15, 8.00, '2026-08-18', 'STC-005-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 6, 70, 10, 45.90, '2026-07-30', 'STC-006-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 7, 55, 5, 65.00, '2026-08-22', 'STC-007-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 8, 145, 25, 5.60, '2027-03-10', 'STC-008-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 9, 100, 10, 19.50, '2027-01-25', 'STC-009-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 10, 160, 20, 14.20, '2026-11-07', 'STC-010-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 11, 95, 10, 35.00, '2026-12-12', 'STC-011-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 12, 60, 8, 27.90, '2026-10-11', 'STC-012-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 13, 150, 15, 9.50, '2027-05-02', 'STC-013-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 14, 120, 20, 11.80, '2027-02-20', 'STC-014-2024', true),
((SELECT id FROM farmacias WHERE nombre_comercial = 'SaludTotal - Sucursal Castilla'), 15, 80, 10, 33.00, '2026-09-02', 'STC-015-2024', true);






-- =====================================================
-- INSERTS NUEVOS PARA MÉDICOS (DATOS ÚNICOS)
-- =====================================================

-- PRIMERO: Crear nuevos usuarios médicos (si no existen)
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Dr. Luis', 'Fernández Ríos', 'dr.fernandez@telemedicina.com', crypt('medico123', gen_salt('bf')), '987654330', 'medico', true, true),
('Dra. Claudia', 'Mendoza Paredes', 'dra.mendoza@telemedicina.com', crypt('medico123', gen_salt('bf')), '987654331', 'medico', true, true),
('Dr. Roberto', 'Silva Alvarado', 'dr.silva@telemedicina.com', crypt('medico123', gen_salt('bf')), '987654332', 'medico', true, true),
('Dra. Gabriela', 'Torres Ruiz', 'dra.torresg@telemedicina.com', crypt('medico123', gen_salt('bf')), '987654333', 'medico', true, true),
('Dr. Andrés', 'García Morales', 'dr.garcia@telemedicina.com', crypt('medico123', gen_salt('bf')), '987654334', 'medico', true, true),
('Dra. Valeria', 'Castro Díaz', 'dra.castro@telemedicina.com', crypt('medico123', gen_salt('bf')), '987654335', 'medico', true, true),
('Dr. Miguel', 'Rojas Quintana', 'dr.rojas@telemedicina.com', crypt('medico123', gen_salt('bf')), '987654336', 'medico', true, true),
('Dra. Sofía', 'Vega Mendoza', 'dra.vega@telemedicina.com', crypt('medico123', gen_salt('bf')), '987654337', 'medico', true, true);

-- SEGUNDO: Insertar los nuevos médicos con datos únicos
INSERT INTO medicos (id_usuario, id_especialidad, numero_colegiatura, anos_experiencia, direccion_consultorio, id_ubicacion, horario_atencion, tarifa_consulta, acepta_seguro, biografia, certificaciones)
VALUES 
(
    (SELECT id FROM usuarios WHERE email = 'dr.fernandez@telemedicina.com'),
    2, -- Cardiología
    'CMP-60123',
    12,
    'Clínica CardioVirtual, Av. Salaverry 1500, Jesús María',
    2,
    '{"lunes": "08:00-21:00", "martes": "08:00-21:00", "miercoles": "14:00-21:00", "jueves": "08:00-21:00", "viernes": "08:00-20:00", "sabado": "09:00-15:00"}'::jsonb,
    160.00,
    true,
    'Cardiólogo especializado en telemedicina cardíaca. Monitoreo remoto de pacientes con hipertensión y enfermedades coronarias. Consultas virtuales hasta las 9PM.',
    'Especialidad en Cardiología - UNMSM, Diplomado en Telecardiología, Certificación en Monitoreo Remoto'
),

(
    (SELECT id FROM usuarios WHERE email = 'dra.mendoza@telemedicina.com'),
    3, -- Pediatría
    'CMP-60124',
    8,
    'Consultorio Pediátrico Virtual, Calle Las Flores 245, San Isidro',
    2,
    '{"lunes": "15:00-21:00", "martes": "09:00-21:00", "miercoles": "15:00-21:00", "jueves": "09:00-21:00", "viernes": "09:00-20:00", "sabado": "10:00-16:00"}'::jsonb,
    130.00,
    true,
    'Pediatra con enfoque en telemedicina pediátrica. Especializada en consultas virtuales para niños y adolescentes. Horarios extendidos para después del colegio.',
    'Especialidad en Pediatría - UPCH, Certificación en Telepediatría, Curso de Urgencias Pediátricas Online'
),

(
    (SELECT id FROM usuarios WHERE email = 'dr.silva@telemedicina.com'),
    1, -- Medicina General
    'CMP-60125',
    10,
    'Centro de Telemedicina Integral, Av. Arequipa 1850, Lince',
    1,
    '{"lunes": "07:00-21:00", "martes": "07:00-21:00", "miercoles": "07:00-21:00", "jueves": "07:00-21:00", "viernes": "07:00-21:00", "sabado": "08:00-18:00"}'::jsonb,
    110.00,
    true,
    'Médico general pionero en telemedicina en Perú. Más de 5 años de experiencia en consultas virtuales. Disponible para atención primaria remota.',
    'Licenciado en Medicina - UNSA, Diplomado en Telemedicina, Certificación en Salud Digital'
),

(
    (SELECT id FROM usuarios WHERE email = 'dra.torresg@telemedicina.com'),
    4, -- Ginecología
    'CMP-60126',
    14,
    'Clínica Ginecológica Digital, Av. Angamos 4200, Surco',
    4,
    '{"lunes": "16:00-21:00", "martes": "10:00-21:00", "miercoles": "16:00-21:00", "jueves": "10:00-21:00", "viernes": "10:00-20:00", "sabado": "09:00-14:00"}'::jsonb,
    180.00,
    true,
    'Ginecóloga especializada en consultas virtuales para mujeres trabajadoras. Seguimiento de embarazos y patologías ginecológicas mediante telemedicina.',
    'Especialidad en Ginecología y Obstetricia - UNFV, Diplomado en Telemedicina Ginecológica, Ecografía Obstétrica'
),

(
    (SELECT id FROM usuarios WHERE email = 'dr.garcia@telemedicina.com'),
    5, -- Dermatología
    'CMP-60127',
    6,
    'DermaTel - Consultorio Virtual, Av. La Marina 3200, San Miguel',
    4,
    '{"lunes": "13:00-21:00", "martes": "09:00-21:00", "miercoles": "13:00-21:00", "jueves": "09:00-21:00", "viernes": "09:00-19:00", "sabado": "10:00-15:00"}'::jsonb,
    150.00,
    true,
    'Dermatólogo especializado en teledermatología. Diagnóstico de patologías cutáneas mediante imágenes de alta calidad. Ideal para seguimiento de tratamientos.',
    'Especialidad en Dermatología - URP, Diplomado en Teledermatología, Certificación en Dermatoscopia Digital'
),

(
    (SELECT id FROM usuarios WHERE email = 'dra.castro@telemedicina.com'),
    6, -- Psicología
    'CMP-60128',
    9,
    'PsicoVirtual - Centro de Terapia Online, Av. Javier Prado 3500, San Isidro',
    2,
    '{"lunes": "16:00-21:00", "martes": "16:00-21:00", "miercoles": "16:00-21:00", "jueves": "16:00-21:00", "viernes": "14:00-20:00", "sabado": "09:00-16:00"}'::jsonb,
    140.00,
    true,
    'Psicóloga clínica con especialización en terapia online. Terapias individuales y de pareja mediante videollamada. Enfoque en salud mental digital.',
    'Licenciada en Psicología - UARM, Maestría en Psicología Clínica, Certificación en Terapia Online Avanzada'
),

(
    (SELECT id FROM usuarios WHERE email = 'dr.rojas@telemedicina.com'),
    7, -- Ortopedia
    'CMP-60129',
    11,
    'Ortopedia Virtual, Av. Brasil 2200, Pueblo Libre',
    2,
    '{"lunes": "17:00-21:00", "martes": "10:00-21:00", "miercoles": "17:00-21:00", "jueves": "10:00-21:00", "viernes": "10:00-19:00", "sabado": "09:00-13:00"}'::jsonb,
    170.00,
    true,
    'Ortopedista especializado en seguimiento virtual post-operatorio y rehabilitación. Evaluación remota de lesiones musculoesqueléticas.',
    'Especialidad en Ortopedia y Traumatología - UNMSM, Diplomado en Cirugía Artroscópica, Telemedicina Ortopédica'
),

(
    (SELECT id FROM usuarios WHERE email = 'dra.vega@telemedicina.com'),
    8, -- Oftalmología
    'CMP-60130',
    7,
    'OftalmoVirtual, Av. Guardia Civil 450, San Borja',
    3,
    '{"lunes": "18:00-21:00", "martes": "11:00-21:00", "miercoles": "18:00-21:00", "jueves": "11:00-21:00", "viernes": "11:00-19:00"}'::jsonb,
    155.00,
    true,
    'Oftalmóloga especializada en teleoftalmología. Consultas de seguimiento para glaucoma, retinopatía diabética y otras patologías oculares crónicas.',
    'Especialidad en Oftalmología - Universidad de Lima, Diplomado en Teleoftalmología, Certificación en Retinografía Digital'
);