-- MediLink+ - Datos iniciales para el sistema
-- Poblado de tablas con información coherente y realista

-- Insertar ubicaciones del Perú (principales departamentos y provincias)
INSERT INTO ubicaciones (departamento, provincia, distrito, codigo_postal) VALUES
('Lima', 'Lima', 'Miraflores', '15074'),
('Lima', 'Lima', 'San Isidro', '15073'),
('Lima', 'Lima', 'Surco', '15023'),
('Lima', 'Lima', 'La Molina', '15024'),
('Lima', 'Lima', 'San Borja', '15037'),
('Arequipa', 'Arequipa', 'Cercado', '04001'),
('Cusco', 'Cusco', 'Wanchaq', '08002'),
('Trujillo', 'La Libertad', 'Trujillo', '13001'),
('Chiclayo', 'Lambayeque', 'Chiclayo', '14001'),
('Piura', 'Piura', 'Piura', '20001');

-- Insertar especialidades médicas
INSERT INTO especialidades (nombre, descripcion) VALUES
('Medicina General', 'Atención médica integral y preventiva'),
('Cardiología', 'Especialista en enfermedades del corazón y sistema cardiovascular'),
('Pediatría', 'Atención médica especializada en niños y adolescentes'),
('Ginecología', 'Salud reproductiva femenina y obstetricia'),
('Dermatología', 'Enfermedades de la piel, cabello y uñas'),
('Traumatología', 'Lesiones del sistema músculo-esquelético'),
('Neurología', 'Enfermedades del sistema nervioso'),
('Psiquiatría', 'Salud mental y trastornos psiquiátricos'),
('Oftalmología', 'Enfermedades de los ojos y la visión'),
('Endocrinología', 'Trastornos hormonales y metabólicos');

-- Insertar tipos de exámenes de laboratorio
INSERT INTO tipos_examenes (nombre, categoria, descripcion, preparacion_requerida, tiempo_resultado_horas, precio_referencial) VALUES
('Hemograma Completo', 'Hematología', 'Análisis completo de células sanguíneas', 'No requiere ayuno', 4, 25.00),
('Glucosa en Sangre', 'Bioquímica', 'Medición de niveles de azúcar en sangre', 'Ayuno de 8-12 horas', 2, 15.00),
('Perfil Lipídico', 'Bioquímica', 'Colesterol total, HDL, LDL y triglicéridos', 'Ayuno de 12 horas', 6, 35.00),
('Examen de Orina', 'Uroanálisis', 'Análisis físico, químico y microscópico de orina', 'Muestra de primera orina de la mañana', 3, 20.00),
('TSH', 'Endocrinología', 'Hormona estimulante de tiroides', 'No requiere preparación especial', 24, 40.00),
('Antígeno Prostático (PSA)', 'Oncología', 'Marcador tumoral para próstata', 'Evitar ejercicio intenso 48h antes', 24, 50.00),
('Radiografía de Tórax', 'Imagenología', 'Imagen de pulmones y estructuras torácicas', 'Retirar objetos metálicos', 1, 60.00),
('Electrocardiograma', 'Cardiología', 'Registro de actividad eléctrica del corazón', 'Ropa cómoda, evitar cremas', 1, 30.00);

-- Insertar medicamentos comunes
INSERT INTO medicamentos (nombre, nombre_generico, laboratorio, presentacion, principio_activo, categoria, requiere_receta, dosis_recomendada, codigo_digemid) VALUES
('Paracetamol 500mg', 'Paracetamol', 'Laboratorios AC Farma', 'Tabletas x 20', 'Paracetamol', 'Analgésico', false, '1 tableta cada 6-8 horas', 'DIG001'),
('Ibuprofeno 400mg', 'Ibuprofeno', 'Laboratorios Bagó', 'Tabletas x 10', 'Ibuprofeno', 'Antiinflamatorio', false, '1 tableta cada 8 horas', 'DIG002'),
('Amoxicilina 500mg', 'Amoxicilina', 'Laboratorios Farmindustria', 'Cápsulas x 12', 'Amoxicilina', 'Antibiótico', true, '1 cápsula cada 8 horas', 'DIG003'),
('Losartán 50mg', 'Losartán', 'Laboratorios Medifarma', 'Tabletas x 30', 'Losartán Potásico', 'Antihipertensivo', true, '1 tableta al día', 'DIG004'),
('Metformina 850mg', 'Metformina', 'Laboratorios Química Suiza', 'Tabletas x 30', 'Metformina HCl', 'Antidiabético', true, '1 tableta con las comidas', 'DIG005'),
('Omeprazol 20mg', 'Omeprazol', 'Laboratorios Hersil', 'Cápsulas x 14', 'Omeprazol', 'Protector Gástrico', true, '1 cápsula antes del desayuno', 'DIG006'),
('Loratadina 10mg', 'Loratadina', 'Laboratorios Roemmers', 'Tabletas x 10', 'Loratadina', 'Antihistamínico', false, '1 tableta al día', 'DIG007'),
('Atorvastatina 20mg', 'Atorvastatina', 'Laboratorios Pfizer', 'Tabletas x 30', 'Atorvastatina Cálcica', 'Hipolipemiante', true, '1 tableta por la noche', 'DIG008');

-- Crear usuario administrador inicial
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, verificado) VALUES
('Carlos', 'Administrador', 'admin@medilink.pe', crypt('admin123', gen_salt('bf')), '+51987654321', 'administrador', true);

-- Crear algunos médicos de ejemplo
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, verificado) VALUES
('Dr. María Elena', 'Rodríguez Vega', 'dra.rodriguez@medilink.pe', crypt('medico123', gen_salt('bf')), '+51987654322', 'medico', true),
('Dr. José Luis', 'Mendoza Paredes', 'dr.mendoza@medilink.pe', crypt('medico123', gen_salt('bf')), '+51987654323', 'medico', true),
('Dra. Ana Sofía', 'Torres Huamán', 'dra.torres@medilink.pe', crypt('medico123', gen_salt('bf')), '+51987654324', 'medico', true);

-- Insertar información específica de médicos
INSERT INTO medicos (id_usuario, id_especialidad, numero_colegiatura, anos_experiencia, direccion_consultorio, id_ubicacion, horario_atencion, tarifa_consulta, biografia) VALUES
((SELECT id FROM usuarios WHERE email = 'dra.rodriguez@medilink.pe'), 1, 'CMP12345', 15, 'Av. Larco 1234, Miraflores', 1, '{"lunes": {"inicio": "08:00", "fin": "17:00"}, "martes": {"inicio": "08:00", "fin": "17:00"}, "miercoles": {"inicio": "08:00", "fin": "17:00"}, "jueves": {"inicio": "08:00", "fin": "17:00"}, "viernes": {"inicio": "08:00", "fin": "14:00"}}', 80.00, 'Médico general con 15 años de experiencia en atención primaria y medicina preventiva.'),
((SELECT id FROM usuarios WHERE email = 'dr.mendoza@medilink.pe'), 2, 'CMP12346', 20, 'Av. El Sol 567, San Isidro', 2, '{"lunes": {"inicio": "09:00", "fin": "18:00"}, "martes": {"inicio": "09:00", "fin": "18:00"}, "miercoles": {"inicio": "09:00", "fin": "18:00"}, "jueves": {"inicio": "09:00", "fin": "18:00"}, "viernes": {"inicio": "09:00", "fin": "15:00"}}', 120.00, 'Cardiólogo especialista en enfermedades cardiovasculares y prevención de infartos.'),
((SELECT id FROM usuarios WHERE email = 'dra.torres@medilink.pe'), 3, 'CMP12347', 12, 'Av. Primavera 890, Surco', 3, '{"lunes": {"inicio": "08:00", "fin": "16:00"}, "martes": {"inicio": "08:00", "fin": "16:00"}, "miercoles": {"inicio": "08:00", "fin": "16:00"}, "jueves": {"inicio": "08:00", "fin": "16:00"}, "viernes": {"inicio": "08:00", "fin": "13:00"}}', 90.00, 'Pediatra especializada en el cuidado integral de niños y adolescentes.');

-- Crear farmacias de ejemplo
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, verificado) VALUES
('Farmacia', 'MediFarma', 'farmacia.medifarma@medilink.pe', crypt('farmacia123', gen_salt('bf')), '+51987654325', 'farmacia', true),
('Farmacia', 'Boticas Arcángel', 'boticas.arcangel@medilink.pe', crypt('farmacia123', gen_salt('bf')), '+51987654326', 'farmacia', true);

-- Insertar información específica de farmacias
INSERT INTO farmacias (id_usuario, nombre_comercial, ruc, direccion, id_ubicacion, horario_atencion, delivery_disponible, radio_delivery_km, licencia_funcionamiento) VALUES
((SELECT id FROM usuarios WHERE email = 'farmacia.medifarma@medilink.pe'), 'MediFarma Miraflores', '20123456789', 'Av. Pardo 456, Miraflores', 1, '{"lunes": {"inicio": "07:00", "fin": "23:00"}, "martes": {"inicio": "07:00", "fin": "23:00"}, "miercoles": {"inicio": "07:00", "fin": "23:00"}, "jueves": {"inicio": "07:00", "fin": "23:00"}, "viernes": {"inicio": "07:00", "fin": "23:00"}, "sabado": {"inicio": "08:00", "fin": "22:00"}, "domingo": {"inicio": "09:00", "fin": "21:00"}}', true, 5.0, 'LF001234'),
((SELECT id FROM usuarios WHERE email = 'boticas.arcangel@medilink.pe'), 'Boticas Arcángel San Isidro', '20123456790', 'Av. Conquistadores 789, San Isidro', 2, '{"lunes": {"inicio": "08:00", "fin": "22:00"}, "martes": {"inicio": "08:00", "fin": "22:00"}, "miercoles": {"inicio": "08:00", "fin": "22:00"}, "jueves": {"inicio": "08:00", "fin": "22:00"}, "viernes": {"inicio": "08:00", "fin": "22:00"}, "sabado": {"inicio": "08:00", "fin": "20:00"}, "domingo": {"inicio": "09:00", "fin": "18:00"}}', true, 3.0, 'LF001235');

-- Poblar inventario de farmacias
INSERT INTO inventario_farmacia (id_farmacia, id_medicamento, stock_actual, stock_minimo, precio_venta, precio_compra, fecha_vencimiento, lote) VALUES
((SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma Miraflores'), 1, 100, 20, 8.50, 6.00, '2025-12-31', 'LOTE001'),
((SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma Miraflores'), 2, 80, 15, 12.00, 9.00, '2025-11-30', 'LOTE002'),
((SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma Miraflores'), 3, 50, 10, 25.00, 18.00, '2025-10-31', 'LOTE003'),
((SELECT id FROM farmacias WHERE nombre_comercial = 'Boticas Arcángel San Isidro'), 1, 120, 25, 8.00, 5.50, '2025-12-31', 'LOTE004'),
((SELECT id FROM farmacias WHERE nombre_comercial = 'Boticas Arcángel San Isidro'), 4, 60, 15, 45.00, 35.00, '2026-01-31', 'LOTE005'),
((SELECT id FROM farmacias WHERE nombre_comercial = 'Boticas Arcángel San Isidro'), 5, 40, 10, 35.00, 28.00, '2025-09-30', 'LOTE006');

-- Crear laboratorios de ejemplo
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, verificado) VALUES
('Laboratorio', 'Clínico San Pablo', 'lab.sanpablo@medilink.pe', crypt('laboratorio123', gen_salt('bf')), '+51987654327', 'laboratorio', true),
('Laboratorio', 'Diagnóstica', 'lab.diagnostica@medilink.pe', crypt('laboratorio123', gen_salt('bf')), '+51987654328', 'laboratorio', true);

-- Insertar información específica de laboratorios
INSERT INTO laboratorios (id_usuario, nombre_comercial, ruc, direccion, id_ubicacion, horario_atencion, tipos_examenes, tiempo_promedio_resultados) VALUES
((SELECT id FROM usuarios WHERE email = 'lab.sanpablo@medilink.pe'), 'Laboratorio Clínico San Pablo', '20123456791', 'Av. Guardia Civil 123, San Borja', 5, '{"lunes": {"inicio": "06:00", "fin": "18:00"}, "martes": {"inicio": "06:00", "fin": "18:00"}, "miercoles": {"inicio": "06:00", "fin": "18:00"}, "jueves": {"inicio": "06:00", "fin": "18:00"}, "viernes": {"inicio": "06:00", "fin": "18:00"}, "sabado": {"inicio": "07:00", "fin": "14:00"}}', ARRAY['Hematología', 'Bioquímica', 'Uroanálisis', 'Endocrinología'], 24),
((SELECT id FROM usuarios WHERE email = 'lab.diagnostica@medilink.pe'), 'Diagnóstica Laboratorio', '20123456792', 'Av. Javier Prado 456, La Molina', 4, '{"lunes": {"inicio": "07:00", "fin": "19:00"}, "martes": {"inicio": "07:00", "fin": "19:00"}, "miercoles": {"inicio": "07:00", "fin": "19:00"}, "jueves": {"inicio": "07:00", "fin": "19:00"}, "viernes": {"inicio": "07:00", "fin": "19:00"}, "sabado": {"inicio": "08:00", "fin": "15:00"}}', ARRAY['Imagenología', 'Cardiología', 'Oncología'], 12);

-- Crear algunos pacientes de ejemplo
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, verificado) VALUES
('Juan Carlos', 'Pérez López', 'juan.perez@email.com', crypt('paciente123', gen_salt('bf')), '+51987654329', 'paciente', true),
('María Isabel', 'García Flores', 'maria.garcia@email.com', crypt('paciente123', gen_salt('bf')), '+51987654330', 'paciente', true),
('Luis Alberto', 'Mendoza Ríos', 'luis.mendoza@email.com', crypt('paciente123', gen_salt('bf')), '+51987654331', 'paciente', true);

-- Insertar información específica de pacientes
INSERT INTO pacientes (id_usuario, fecha_nacimiento, sexo, direccion, id_ubicacion, dni, tipo_sangre, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono, seguro_medico, peso_kg, altura_cm) VALUES
((SELECT id FROM usuarios WHERE email = 'juan.perez@email.com'), '1985-03-15', 'masculino', 'Calle Los Olivos 123, Miraflores', 1, '12345678', 'O+', 'Penicilina', 'Rosa Pérez (Esposa)', '+51987654340', 'EsSalud', 75.5, 175),
((SELECT id FROM usuarios WHERE email = 'maria.garcia@email.com'), '1990-07-22', 'femenino', 'Av. La Marina 456, San Isidro', 2, '87654321', 'A+', 'Ninguna conocida', 'Carlos García (Hermano)', '+51987654341', 'Rimac Seguros', 62.0, 165),
((SELECT id FROM usuarios WHERE email = 'luis.mendoza@email.com'), '1978-11-08', 'masculino', 'Jr. Las Flores 789, Surco', 3, '11223344', 'B+', 'Mariscos', 'Ana Mendoza (Esposa)', '+51987654342', 'EsSalud', 80.2, 180);

-- Crear algunas alertas de salud comunitaria
INSERT INTO alertas_salud (titulo, descripcion, tipo_alerta, nivel_gravedad, id_ubicacion, radio_afectacion_km, fecha_inicio, id_creador, total_afectados, medidas_preventivas) VALUES
('Aumento de casos de dengue en Lima Norte', 'Se ha detectado un incremento del 40% en casos de dengue en los distritos del norte de Lima. Se recomienda eliminar criaderos de zancudos.', 'brote', 'medio', 1, 15.0, CURRENT_DATE - INTERVAL '5 days', (SELECT id FROM usuarios WHERE email = 'admin@medilink.pe'), 45, 'Eliminar recipientes con agua estancada, usar repelente, mantener patios limpios'),
('Campaña de vacunación contra la influenza', 'Inicia la campaña nacional de vacunación contra la influenza estacional. Dirigida especialmente a adultos mayores y niños.', 'vacunacion', 'bajo', 2, 10.0, CURRENT_DATE, (SELECT id FROM usuarios WHERE email = 'admin@medilink.pe'), 0, 'Acudir a centros de salud autorizados, llevar DNI y carnet de vacunación');
