-- =====================================================
-- PARTE 2: DATOS DE PRUEBA (INSERTS ÚNICAMENTE)
-- =====================================================
-- Este archivo contiene SOLO los INSERT:
-- - UBICACIONES
-- - ESPECIALIDADES
-- - CÓDIGOS CIE-10
-- - MEDICAMENTOS
-- - TIPOS DE EXÁMENES
-- - TRATAMIENTOS RECOMENDADOS
-- - USUARIOS
-- - PACIENTES
-- - MÉDICOS
-- - FARMACIAS
-- - LABORATORIOS
-- - INVENTARIO DE FARMACIA
-- - EXPEDIENTES MÉDICOS
-- - REGISTROS HISTÓRICOS
-- =====================================================

-- IMPORTANTE: Ejecutar este archivo DESPUÉS de ejecutar 01-ESTRUCTURA_Y_LOGICA.sql

-- =====================================================
-- PASO 1: UBICACIONES DEL PERÚ
-- =====================================================



INSERT INTO ubicaciones (departamento, provincia, distrito, codigo_postal) VALUES
('Piura', 'Piura', 'Piura', '20001'),
('Piura', 'Piura', 'Castilla', '20002'),
('Piura', 'Piura', 'Catacaos', '20003'),
('Piura', 'Piura', 'Cura Mori', '20004'),
('Piura', 'Piura', 'El Tallan', '20005'),
('Piura', 'Piura', 'La Arena', '20006'),
('Piura', 'Piura', 'La Union', '20007'),
('Piura', 'Piura', 'Las Lomas', '20008'),
('Piura', 'Piura', 'Tambo Grande', '20009'),
-- Provincia de Sullana
('Piura', 'Sullana', 'Sullana', '20101'),
('Piura', 'Sullana', 'Bellavista', '20102'),
('Piura', 'Sullana', 'Ignacio Escudero', '20103'),
('Piura', 'Sullana', 'Lancones', '20104'),
('Piura', 'Sullana', 'Marcavelica', '20105'),
('Piura', 'Sullana', 'Miguel Checa', '20106'),
('Piura', 'Sullana', 'Querecotillo', '20107'),
('Piura', 'Sullana', 'Salitral', '20108'),
-- Provincia de Paita
('Piura', 'Paita', 'Paita', '20201'),
('Piura', 'Paita', 'Amotape', '20202'),
('Piura', 'Paita', 'Arenal', '20203'),
('Piura', 'Paita', 'Colan', '20204'),
('Piura', 'Paita', 'La Huaca', '20205'),
('Piura', 'Paita', 'Tamarindo', '20206'),
('Piura', 'Paita', 'Vichayal', '20207'),
-- Provincia de Talara
('Piura', 'Talara', 'Talara', '20301'),
('Piura', 'Talara', 'El Alto', '20302'),
('Piura', 'Talara', 'Lobitos', '20303'),
('Piura', 'Talara', 'Los Organos', '20304'),
('Piura', 'Talara', 'Mancora', '20305'),
('Piura', 'Talara', 'Pariñas', '20306'),
-- Provincia de Sechura
('Piura', 'Sechura', 'Sechura', '20401'),
('Piura', 'Sechura', 'Bellavista de la Union', '20402'),
('Piura', 'Sechura', 'Bernal', '20403'),
('Piura', 'Sechura', 'Cristo Nos Valga', '20404'),
('Piura', 'Sechura', 'Rinconada Llicuar', '20405'),
('Piura', 'Sechura', 'Vice', '20406'),
-- Provincia de Ayabaca
('Piura', 'Ayabaca', 'Ayabaca', '20501'),
('Piura', 'Ayabaca', 'Frias', '20502'),
('Piura', 'Ayabaca', 'Jilili', '20503'),
('Piura', 'Ayabaca', 'Lagunas', '20504'),
('Piura', 'Ayabaca', 'Montero', '20505'),
('Piura', 'Ayabaca', 'Pacaipampa', '20506'),
('Piura', 'Ayabaca', 'Paimas', '20507'),
('Piura', 'Ayabaca', 'Sapillica', '20508'),
('Piura', 'Ayabaca', 'Sicchez', '20509'),
('Piura', 'Ayabaca', 'Suyo', '20510'),
-- Provincia de Huancabamba
('Piura', 'Huancabamba', 'Huancabamba', '20601'),
('Piura', 'Huancabamba', 'Canchaque', '20602'),
('Piura', 'Huancabamba', 'El Carmen de la Frontera', '20603'),
('Piura', 'Huancabamba', 'Huarmaca', '20604'),
('Piura', 'Huancabamba', 'Lalaquiz', '20605'),
('Piura', 'Huancabamba', 'San Miguel de El Faique', '20606'),
('Piura', 'Huancabamba', 'Sondor', '20607'),
('Piura', 'Huancabamba', 'Sondorillo', '20608'),
-- Provincia de Morropon
('Piura', 'Morropon', 'Chulucanas', '20701'),
('Piura', 'Morropon', 'Buenos Aires', '20702'),
('Piura', 'Morropon', 'Chalaco', '20703'),
('Piura', 'Morropon', 'La Matanza', '20704'),
('Piura', 'Morropon', 'Morropon', '20705'),
('Piura', 'Morropon', 'Salitral', '20706'),
('Piura', 'Morropon', 'San Juan de Bigote', '20707'),
('Piura', 'Morropon', 'Santa Catalina de Mossa', '20708'),
('Piura', 'Morropon', 'Santo Domingo', '20709'),
('Piura', 'Morropon', 'Yamango', '20710'),
-- **Lima (complementando)**
('Lima', 'Lima', 'Lince', '15046'),
('Lima', 'Lima', 'Magdalena', '15076'),
('Lima', 'Lima', 'Pueblo Libre', '15084'),
('Lima', 'Lima', 'San Miguel', '15088'),
('Lima', 'Lima', 'Barranco', '15063'),
('Lima', 'Lima', 'Rimac', '15025'),
('Lima', 'Lima', 'Los Olivos', '15039'),
('Lima', 'Lima', 'San Juan de Lurigancho', '15036'),
('Lima', 'Lima', 'Ate', '15024'),
('Lima', 'Lima', 'Comas', '15011'),
('Lima', 'Huaura', 'Huacho', '15131'),
('Lima', 'Huarochiri', 'Matucana', '15460'),
('Lima', 'Cañete', 'San Vicente de Cañete', '15701'),

-- **Arequipa (complementando)**
('Arequipa', 'Arequipa', 'Cayma', '04002'),
('Arequipa', 'Arequipa', 'Cerro Colorado', '04003'),
('Arequipa', 'Arequipa', 'Sachaca', '04004'),
('Arequipa', 'Arequipa', 'Yanahuara', '04005'),
('Arequipa', 'Islay', 'Mollendo', '04120'),
('Arequipa', 'Camaná', 'Camaná', '04160'),

-- **Cusco (complementando)**
('Cusco', 'Cusco', 'San Sebastián', '08002'),
('Cusco', 'Cusco', 'San Jerónimo', '08003'),
('Cusco', 'Urubamba', 'Urubamba', '08051'),
('Cusco', 'Urubamba', 'Ollantaytambo', '08052'),
('Cusco', 'Calca', 'Calca', '08071'),
('Cusco', 'Quispicanchi', 'Urcos', '08150'),
('Cusco', 'Anta', 'Izcuchaca', '08110'),

-- **La Libertad (complementando)**
('La Libertad', 'Trujillo', 'Victor Larco Herrera', '13002'),
('La Libertad', 'Trujillo', 'Huanchaco', '13012'),
('La Libertad', 'Trujillo', 'Laredo', '13018'),
('La Libertad', 'Ascope', 'Casa Grande', '13050'),
('La Libertad', 'Chepén', 'Chepén', '13120'),
('La Libertad', 'Pacasmayo', 'San Pedro de Lloc', '13160'),

-- **Lambayeque (complementando)**
('Lambayeque', 'Chiclayo', 'José Leonardo Ortiz', '14002'),
('Lambayeque', 'Chiclayo', 'La Victoria', '14003'),
('Lambayeque', 'Chiclayo', 'Pomalca', '14004'),
('Lambayeque', 'Lambayeque', 'Lambayeque', '14101'),
('Lambayeque', 'Ferreñafe', 'Ferreñafe', '14201'),

-- **Áncash**
('Áncash', 'Huaraz', 'Huaraz', '02001'),
('Áncash', 'Huaraz', 'Independencia', '02002'),
('Áncash', 'Santa', 'Chimbote', '02050'),
('Áncash', 'Carhuaz', 'Carhuaz', '02110'),

-- **Junín**
('Junín', 'Huancayo', 'Huancayo', '12001'),
('Junín', 'Huancayo', 'Chilca', '12002'),
('Junín', 'Chanchamayo', 'La Merced', '12031'),
('Junín', 'Tarma', 'Tarma', '12071'),

-- **Puno**
('Puno', 'Puno', 'Puno', '21001'),
('Puno', 'Puno', 'Juliaca', '21020'),
('Puno', 'Juli', 'Juli', '21101'),
('Puno', 'Chucuito', 'Ilave', '21120'),

-- **Ica**
('Ica', 'Ica', 'Ica', '11001'),
('Ica', 'Ica', 'Subtanjalla', '11002'),
('Ica', 'Chincha', 'Chincha Alta', '11050'),
('Ica', 'Nazca', 'Nazca', '11160'),

-- **San Martín**
('San Martín', 'Moyobamba', 'Moyobamba', '22001'),
('San Martín', 'Rioja', 'Rioja', '22020'),
('San Martín', 'Tarapoto', 'Tarapoto', '22050'),

-- **Loreto**
('Loreto', 'Maynas', 'Iquitos', '16001'),
('Loreto', 'Maynas', 'Punchana', '16002'),
('Loreto', 'Loreto', 'Nauta', '16101'),

-- **Ucayali**
('Ucayali', 'Coronel Portillo', 'Pucallpa', '25001'),
('Ucayali', 'Coronel Portillo', 'Calleria', '25002'),
('Ucayali', 'Padre Abad', 'Aguaytia', '25101'),

-- **Tacna**
('Tacna', 'Tacna', 'Tacna', '23001'),
('Tacna', 'Tacna', 'Alto de la Alianza', '23002'),
('Tacna', 'Jorge Basadre', 'Locumba', '23120'),

-- **Moquegua**
('Moquegua', 'Mariscal Nieto', 'Moquegua', '18001'),
('Moquegua', 'Ilo', 'Ilo', '18050'),

-- **Amazonas**
('Amazonas', 'Chachapoyas', 'Chachapoyas', '01001'),
('Amazonas', 'Bagua', 'Bagua', '01050'),

-- **Cajamarca**
('Cajamarca', 'Cajamarca', 'Cajamarca', '06001'),
('Cajamarca', 'Cajamarca', 'Los Baños del Inca', '06002'),
('Cajamarca', 'Jaén', 'Jaén', '06050'),

-- **Huánuco**
('Huánuco', 'Huánuco', 'Huánuco', '10001'),
('Huánuco', 'Huánuco', 'Amarilis', '10002'),
('Huánuco', 'Leoncio Prado', 'Tingo María', '10050'),

-- **Ayacucho**
('Ayacucho', 'Huamanga', 'Ayacucho', '05001'),
('Ayacucho', 'Huamanga', 'Carmen Alto', '05002'),
('Ayacucho', 'Huanta', 'Huanta', '05101'),

-- **Apurímac**
('Apurímac', 'Abancay', 'Abancay', '03001'),
('Apurímac', 'Andahuaylas', 'Andahuaylas', '03050'),

-- **Huancavelica**
('Huancavelica', 'Huancavelica', 'Huancavelica', '09001'),
('Huancavelica', 'Huancavelica', 'Ascensión', '09002'),

-- **Madre de Dios**
('Madre de Dios', 'Tambopata', 'Puerto Maldonado', '17001'),
('Madre de Dios', 'Tambopata', 'Inambari', '17002'),

-- **Tumbes**
('Tumbes', 'Tumbes', 'Tumbes', '24001'),
('Tumbes', 'Tumbes', 'Corrales', '24002'),
('Tumbes', 'Zarumilla', 'Zarumilla', '24101');

-- =====================================================
-- PASO 2: ESPECIALIDADES MÉDICAS
-- =====================================================

INSERT INTO especialidades (nombre, descripcion) VALUES
('Medicina General', 'Atención primaria y diagnóstico general'),
('Cardiología', 'Especialidad en enfermedades del corazón'),
('Pediatría', 'Atención médica para niños y adolescentes'),
('Ginecología', 'Salud femenina y sistema reproductivo'),
('Dermatología', 'Enfermedades de la piel'),
('Psicología', 'Salud mental y terapia'),
('Ortopedia', 'Enfermedades del sistema musculoesquelético'),
('Oftalmología', 'Enfermedades de los ojos');

-- =====================================================
-- PASO 3: CÓDIGOS CIE-10 (45 ejemplos - EXPANDIDOS)
-- =====================================================

INSERT INTO codigos_cie10 (codigo, nombre, descripcion, categoria, capitulo) VALUES
-- Enfermedades Cardiovasculares (9)
('I10', 'Hipertensión esencial (primaria)', 'Presión arterial elevada sin causa identificable', 'Enfermedades cardiovasculares', 'IX'),
('I25.1', 'Enfermedad ateroesclerótica del corazón', 'Enfermedad coronaria arteriosclerótica', 'Enfermedades cardiovasculares', 'IX'),
('I48.9', 'Fibrilación auricular, no especificada', 'Arritmia cardíaca común', 'Enfermedades cardiovasculares', 'IX'),
('I50.9', 'Insuficiencia cardíaca, no especificada', 'Fallo del corazón para bombear sangre', 'Enfermedades cardiovasculares', 'IX'),
('I21.9', 'Infarto agudo de miocardio, no especificado', 'Ataque al corazón', 'Enfermedades cardiovasculares', 'IX'),
('I63.9', 'Accidente cerebrovascular isquémico, no especificado', 'Ictus', 'Enfermedades cardiovasculares', 'IX'),
('I70.9', 'Aterosclerosis generalizada', 'Endurecimiento de arterias', 'Enfermedades cardiovasculares', 'IX'),
('I11.9', 'Cardiopatía hipertensiva', 'Daño cardíaco por hipertensión', 'Enfermedades cardiovasculares', 'IX'),
('I36.9', 'Endocarditis no especificada', 'Inflamación del revestimiento del corazón', 'Enfermedades cardiovasculares', 'IX'),
-- Enfermedades Endocrinas (9)
('E11.9', 'Diabetes mellitus tipo 2, sin complicaciones', 'Trastorno metabólico de glucosa', 'Enfermedades endocrinas', 'IV'),
('E04.9', 'Bocio no tóxico, no especificada', 'Agrandamiento de la glándula tiroides', 'Enfermedades endocrinas', 'IV'),
('E66.9', 'Obesidad, no especificada', 'Exceso de grasa corporal', 'Enfermedades endocrinas', 'IV'),
('E05.9', 'Tirotoxicosis, no especificada', 'Exceso de hormona tiroidea', 'Enfermedades endocrinas', 'IV'),
('E03.9', 'Hipotiroidismo, no especificado', 'Deficiencia de hormona tiroidea', 'Enfermedades endocrinas', 'IV'),
('E10.9', 'Diabetes mellitus tipo 1, sin complicaciones', 'Diabetes insulinodependiente', 'Enfermedades endocrinas', 'IV'),
('E89.0', 'Hipotiroidismo posquirúrgico', 'Déficit hormonal tras cirugía tiroidea', 'Enfermedades endocrinas', 'IV'),
('E23.6', 'Deficiencia de hormona adrenocorticotropa', 'Insuficiencia corticotropa', 'Enfermedades endocrinas', 'IV'),
('E24.9', 'Síndrome de Cushing, no especificado', 'Exceso de cortisol', 'Enfermedades endocrinas', 'IV'),
-- Enfermedades Respiratorias (6)
('J06.9', 'Infección aguda de las vías respiratorias superiores', 'Resfriado común, faringitis aguda', 'Enfermedades respiratorias', 'X'),
('J45.9', 'Asma, no especificada', 'Enfermedad crónica de las vías respiratorias', 'Enfermedades respiratorias', 'X'),
('J18.9', 'Neumonía, no especificada', 'Infección pulmonar', 'Enfermedades respiratorias', 'X'),
('J44.9', 'Enfermedad pulmonar obstructiva crónica', 'EPOC sin especificar', 'Enfermedades respiratorias', 'X'),
('J30.9', 'Alergia, no especificada', 'Reacción alérgica sin especificar', 'Enfermedades respiratorias', 'X'),
('J20.9', 'Bronquitis aguda, no especificada', 'Inflamación aguda de bronquios', 'Enfermedades respiratorias', 'X'),
-- Enfermedades Digestivas (6)
('K21.9', 'Enfermedad por reflujo gastroesofágico', 'Acidez estomacal crónica', 'Enfermedades digestivas', 'XI'),
('K29.7', 'Gastritis, no especificada', 'Inflamación del revestimiento del estómago', 'Enfermedades digestivas', 'XI'),
('K57.9', 'Enfermedad diverticular del intestino', 'Diverticulosis no especificada', 'Enfermedades digestivas', 'XI'),
('K80.9', 'Colelitiasis, no especificada', 'Cálculos biliares', 'Enfermedades digestivas', 'XI'),
('K31.9', 'Enfermedad del estómago y duodeno', 'Úlcera péptica', 'Enfermedades digestivas', 'XI'),
('K76.9', 'Enfermedad del hígado, no especificada', 'Hepatopatía crónica', 'Enfermedades digestivas', 'XI'),
-- Enfermedades Musculoesqueléticas (6)
('M54.5', 'Lumbalgia, no especificada', 'Dolor en la parte baja de la espalda', 'Enfermedades musculoesqueléticas', 'XIII'),
('M17.9', 'Gonartrosis [artrosis de rodilla]', 'Artrosis de rodilla no especificada', 'Enfermedades musculoesqueléticas', 'XIII'),
('M79.1', 'Mialgia', 'Dolor muscular no especificado', 'Enfermedades musculoesqueléticas', 'XIII'),
('M19.9', 'Artrosis, no especificada', 'Osteoartritis generalizada', 'Enfermedades musculoesqueléticas', 'XIII'),
('M06.9', 'Artritis reumatoide, no especificada', 'Enfermedad inflamatoria articular', 'Enfermedades musculoesqueléticas', 'XIII'),
('M42.9', 'Espondilosis, no especificada', 'Degeneración vertebral', 'Enfermedades musculoesqueléticas', 'XIII'),
-- Trastornos Mentales (6)
('F41.1', 'Trastorno de ansiedad generalizada', 'Ansiedad persistente y excesiva', 'Trastornos mentales', 'V'),
('F32.9', 'Episodio depresivo, no especificado', 'Trastorno del estado de ánimo', 'Trastornos mentales', 'V'),
('F31.9', 'Trastorno bipolar, no especificado', 'Alteración del estado de ánimo cíclica', 'Trastornos mentales', 'V'),
('F33.9', 'Trastorno depresivo recurrente', 'Depresión crónica', 'Trastornos mentales', 'V'),
('F10.9', 'Trastornos por uso de alcohol', 'Dependencia alcohólica', 'Trastornos mentales', 'V'),
('F90.9', 'Trastorno por déficit de atención e hiperactividad', 'TDAH', 'Trastornos mentales', 'V'),
-- Enfermedades Genitourinarias (3)
('N39.0', 'Infección de vías urinarias', 'Infección en tracto urinario', 'Enfermedades genitourinarias', 'XIV'),
('N20.0', 'Cálculo del riñón', 'Cálculo renal, nefrolitiasis', 'Enfermedades genitourinarias', 'XIV'),
('N18.9', 'Enfermedad renal crónica, no especificada', 'Insuficiencia renal crónica', 'Enfermedades genitourinarias', 'XIV'),
-- Enfermedades del Sistema Nervioso (1)
('G43.9', 'Migraña, no especificada', 'Dolor de cabeza intenso', 'Enfermedades del sistema nervioso', 'VI');

-- =====================================================
-- PASO 4: MEDICAMENTOS (27 ejemplos)
-- =====================================================

INSERT INTO medicamentos (codigo_digemid, nombre_comercial, nombre_generico, forma_farmaceutica, concentracion, laboratorio, principio_activo, categoria_terapeutica) VALUES
('DIG-123456', 'Losartán Potásico', 'Losartán', 'Tabletas', '50 mg', 'Genfar', 'Losartán', 'Antihipertensivo'),
('DIG-789012', 'Metformina', 'Metformina', 'Tabletas', '850 mg', 'Merck', 'Metformina', 'Antidiabético'),
('DIG-345678', 'Amoxicilina', 'Amoxicilina', 'Cápsulas', '500 mg', 'Bayer', 'Amoxicilina', 'Antibiótico'),
('DIG-901234', 'Omeprazol', 'Omeprazol', 'Cápsulas', '20 mg', 'Pfizer', 'Omeprazol', 'Antiulceroso'),
('DIG-567890', 'Atorvastatina', 'Atorvastatina', 'Tabletas', '20 mg', 'Roemmers', 'Atorvastatina', 'Hipolipemiante'),
('DIG-112233', 'Ibuprofeno', 'Ibuprofeno', 'Tabletas', '400 mg', 'Mintlab', 'Ibuprofeno', 'Antiinflamatorio'),
('DIG-445566', 'Sertralina', 'Sertralina', 'Tabletas', '50 mg', 'Pharmax', 'Sertralina', 'Antidepresivo'),
('DIG-998877', 'Amlodipino', 'Amlodipino', 'Tabletas', '5 mg', 'Pfizer', 'Amlodipino besilato', 'Antihipertensivo'),
('DIG-887766', 'Glibenclamida', 'Glibenclamida', 'Tabletas', '5 mg', 'Bayer', 'Glibenclamida', 'Antidiabético'),
('DIG-776655', 'Azitromicina', 'Azitromicina', 'Tabletas', '500 mg', 'Pfizer', 'Azitromicina', 'Antibiótico'),
('DIG-665544', 'Pantoprazol', 'Pantoprazol', 'Tabletas', '40 mg', 'Takeda', 'Pantoprazol', 'Antiulceroso'),
('DIG-554433', 'Diazepam', 'Diazepam', 'Tabletas', '10 mg', 'Roche', 'Diazepam', 'Ansiolítico'),
('DIG-443322', 'Nitrofurantoína', 'Nitrofurantoína', 'Cápsulas', '100 mg', 'Procter & Gamble', 'Nitrofurantoína', 'Antibiótico urinario'),
('DIG-332211', 'Atorvastatina Forte', 'Atorvastatina', 'Tabletas', '40 mg', 'Pfizer', 'Atorvastatina cálcica', 'Hipolipemiante'),
('DIG-221100', 'Levotiroxina', 'Levotiroxina', 'Tabletas', '100 mcg', 'Merck', 'Levotiroxina sódica', 'Hormona tiroidea'),
('DIG-110099', 'Salbutamol', 'Salbutamol', 'Inhalador', '100 mcg', 'GSK', 'Salbutamol', 'Broncodilatador'),
('DIG-009988', 'Ibuprofeno Forte', 'Ibuprofeno', 'Tabletas', '600 mg', 'Bayer', 'Ibuprofeno', 'Antiinflamatorio'),
('DIG-119977', 'Sertralina Plus', 'Sertralina', 'Tabletas', '100 mg', 'Pfizer', 'Sertralina clorhidrato', 'Antidepresivo'),
('DIG-228866', 'Tamsulosina', 'Tamsulosina', 'Cápsulas', '0.4 mg', 'Astellas', 'Tamsulosina clorhidrato', 'Relajante prostático'),
('DIG-337755', 'Digoxina', 'Digoxina', 'Tabletas', '0.25 mg', 'Roche', 'Digoxina', 'Cardiotónico'),
('DIG-446644', 'Orlistat', 'Orlistat', 'Cápsulas', '120 mg', 'GSK', 'Orlistat', 'Antiobesidad'),
('DIG-555533', 'Amoxicilina/Clavulanato', 'Amoxicilina/Ácido clavulánico', 'Tabletas', '875/125 mg', 'GSK', 'Amoxicilina/Clavulanato', 'Antibiótico'),
('DIG-664422', 'Mesalazina', 'Mesalazina', 'Tabletas', '800 mg', 'Ferring', 'Mesalazina', 'Antiinflamatorio intestinal'),
('DIG-773311', 'Naproxeno', 'Naproxeno', 'Tabletas', '500 mg', 'Roche', 'Naproxeno sódico', 'Antiinflamatorio'),
('DIG-882200', 'Sumatriptán', 'Sumatriptán', 'Tabletas', '50 mg', 'GSK', 'Sumatriptán succinato', 'Antimigrañoso'),
('DIG-991199', 'Metformina XR', 'Metformina', 'Tabletas', '1000 mg', 'Merck', 'Metformina clorhidrato', 'Antidiabético'),
('DIG-100088', 'Losartán Plus', 'Losartán', 'Tabletas', '100 mg', 'Merck', 'Losartán potásico', 'Antihipertensivo');

-- =====================================================
-- PASO 5: TIPOS DE EXÁMENES (6 tipos)
-- =====================================================

INSERT INTO tipos_examenes (nombre, categoria, descripcion, preparacion_requerida, tiempo_resultado_horas, precio_referencial) VALUES
('Hemograma completo', 'Hematología', 'Análisis completo de células sanguíneas', 'Ayuno de 8 horas', 2, 25.00),
('Perfil lipídico', 'Bioquímica', 'Colesterol total, HDL, LDL y triglicéridos', 'Ayuno de 12 horas', 4, 35.00),
('Glucosa en ayunas', 'Bioquímica', 'Niveles de glucosa en sangre', 'Ayuno de 8 horas', 2, 15.00),
('Urocultivo', 'Microbiología', 'Culturo de orina para detectar bacterias', 'Primera orina de la mañana', 48, 40.00),
('Radiografía de tórax', 'Imagenología', 'Estudio radiológico del tórax', 'Ninguna', 24, 80.00),
('Electrocardiograma', 'Cardiología', 'Registro de actividad eléctrica del corazón', 'Ninguna', 1, 50.00);

-- =====================================================
-- PASO 6: TRATAMIENTOS RECOMENDADOS (CORREGIDO Y EXPANDIDO)
-- =====================================================

INSERT INTO tratamientos_recomendados (codigo_cie10_id, medicamento_id, dosis_recomendada, duracion_tratamiento, linea_tratamiento, evidencia_nivel) VALUES
-- Hipertensión arterial (I10 - ID 1)
(1, 1, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(1, 8, '1 tableta cada 24 horas', 'Tratamiento crónico', 2, 'A'),
(1, 5, '1 tableta cada 24 horas', 'Tratamiento crónico', 3, 'A'),
-- Enfermedad coronaria (I25.1 - ID 2)
(2, 1, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(2, 5, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(2, 20, '1 tableta cada 24 horas', 'Tratamiento crónico', 2, 'A'),
-- Fibrilación auricular (I48.9 - ID 3)
(3, 19, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(3, 1, '1 tableta cada 24 horas', 'Tratamiento crónico', 2, 'A'),
-- Insuficiencia cardíaca (I50.9 - ID 4)
(4, 1, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(4, 8, '1 tableta cada 24 horas', 'Tratamiento crónico', 2, 'A'),
-- Infarto agudo de miocardio (I21.9 - ID 5)
(5, 5, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(5, 20, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
-- Diabetes mellitus tipo 2 (E11.9 - ID 11)
(11, 2, '1 tableta cada 12 horas con alimentos', 'Tratamiento crónico', 1, 'A'),
(11, 9, '1 tableta cada 24 horas', 'Tratamiento crónico', 2, 'A'),
(11, 25, '1 tableta al inicio del dolor', 'Según necesidad', 1, 'B'),
-- Bocio no tóxico (E04.9 - ID 12)
(12, 15, '1 tableta cada 24 horas en ayunas', 'Tratamiento crónico', 1, 'A'),
-- Tirotoxicosis (E05.9 - ID 13)
(13, 15, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
-- Hipotiroidismo (E03.9 - ID 14)
(14, 15, '1 tableta cada 24 horas en ayunas', 'Tratamiento crónico', 1, 'A'),
-- Diabetes tipo 1 (E10.9 - ID 15)
(15, 2, '1 tableta cada 12 horas con alimentos', 'Tratamiento crónico', 1, 'A'),
-- Obesidad (E66.9 - ID 16)
(16, 21, '1 cápsula con cada comida principal', '3-6 meses', 1, 'A'),
-- Infección aguda respiratoria (J06.9 - ID 20)
(20, 3, '1 cápsula cada 8 horas', '7-10 días', 1, 'A'),
(20, 10, '1 tableta cada 12 horas', '5 días', 2, 'A'),
-- Asma (J45.9 - ID 21)
(21, 16, '1-2 inhalaciones cada 4-6 horas', 'Según necesidad', 1, 'A'),
(21, 7, '1 tableta cada 24 horas', '1-3 meses', 2, 'A'),
-- Neumonía (J18.9 - ID 22)
(22, 3, '1 cápsula cada 8 horas', '7-14 días', 1, 'A'),
(22, 10, '1 tableta cada 12 horas', '7-10 días', 2, 'A'),
-- EPOC (J44.9 - ID 23)
(23, 16, '1-2 inhalaciones cada 12 horas', 'Mantenimiento', 1, 'A'),
(23, 7, '1 tableta cada 24 horas', 'Soporte', 2, 'B'),
-- Alergia (J30.9 - ID 24)
(24, 12, '1 tableta cada 12-24 horas', '2-4 semanas', 1, 'A'),
-- Bronquitis aguda (J20.9 - ID 25)
(25, 10, '1 tableta cada 12 horas', '7-10 días', 1, 'A'),
-- Reflujo gastroesofágico (K21.9 - ID 27)
(27, 4, '1 cápsula cada 24 horas antes del desayuno', '4-8 semanas', 1, 'A'),
(27, 11, '1 tableta cada 24 horas', '4-8 semanas', 2, 'A'),
-- Gastritis (K29.7 - ID 28)
(28, 4, '1 cápsula cada 24 horas', '4-8 semanas', 1, 'A'),
(28, 11, '1 tableta cada 24 horas', '4-8 semanas', 2, 'A'),
-- Enfermedad diverticular (K57.9 - ID 29)
(29, 22, '1 tableta cada 12 horas', '7-10 días', 1, 'A'),
-- Colelitiasis (K80.9 - ID 30)
(30, 4, '1 cápsula cada 24 horas', 'Manejo conservador', 1, 'A'),
-- Úlcera péptica (K31.9 - ID 31)
(31, 4, '1 cápsula cada 24 horas', '4-8 semanas', 1, 'A'),
(31, 11, '1 tableta cada 24 horas', 'Mantenimiento', 2, 'A'),
-- Enfermedad hepática (K76.9 - ID 32)
(32, 4, '1 cápsula cada 24 horas', 'Manejo sintomático', 1, 'B'),
-- Lumbalgia (M54.5 - ID 26)
(26, 6, '1 tableta cada 8 horas según dolor', '3-7 días', 1, 'A'),
(26, 17, '1 tableta cada 8-12 horas', '3-7 días', 2, 'A'),
(26, 23, '1 tableta cada 8 horas', 'Indefinido', 3, 'B'),
-- Gonartrosis (M17.9 - ID 33) -- CAMBIADO DE 26 A 33
(33, 6, '1 tableta cada 8-12 horas', '3-7 días', 1, 'A'),
(33, 17, '1 tableta cada 8-12 horas', '3-7 días', 2, 'A'),
-- Mialgia (M79.1 - ID 34)
(34, 6, '1 tableta cada 8 horas según dolor', '3-7 días', 1, 'A'),
(34, 17, '1 tableta cada 8-12 horas', '3-7 días', 2, 'A'),
-- Artrosis generalizada (M19.9 - ID 35)
(35, 6, '1 tableta cada 8 horas', 'Crónico', 1, 'A'),
(35, 17, '1 tableta cada 8-12 horas', 'Crónico', 2, 'A'),
-- Artritis reumatoide (M06.9 - ID 36)
(36, 6, '1 tableta cada 8 horas', 'Crónico', 1, 'A'),
(36, 17, '1 tableta cada 8-12 horas', 'Crónico', 2, 'A'),
-- Espondilosis (M42.9 - ID 37)
(37, 6, '1 tableta cada 8 horas', 'Crónico', 1, 'A'),
-- Ansiedad generalizada (F41.1 - ID 6)
(6, 7, '1 tableta cada 24 horas', '6-12 meses', 1, 'A'),
(6, 12, '1 tableta cada 12-24 horas', '2-4 semanas', 2, 'A'),
-- Episodio depresivo (F32.9 - ID 40)
(40, 7, '1 tableta cada 24 horas', '6-12 meses', 1, 'A'),
(40, 18, '1 tableta cada 24 horas', '6-12 meses', 2, 'A'),
-- Trastorno bipolar (F31.9 - ID 41)
(41, 12, '1 tableta cada 12-24 horas', 'Tratamiento crónico', 1, 'A'),
-- Depresión recurrente (F33.9 - ID 42)
(42, 7, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(42, 18, '1 tableta cada 24 horas', 'Tratamiento crónico', 2, 'A'),
-- Trastornos por alcohol (F10.9 - ID 43)
(43, 7, '1 tableta cada 24 horas', 'Manejo del síndrome de abstinencia', 1, 'A'),
-- TDAH (F90.9 - ID 44)
(44, 2, '1 tableta cada 12 horas', 'Tratamiento crónico', 1, 'A'),
-- Infección de vías urinarias (N39.0 - ID 39)
(39, 13, '1 cápsula cada 6 horas', '7 días', 1, 'A'),
(39, 22, '1 tableta cada 12 horas', '7-10 días', 2, 'A'),
-- Cálculo renal (N20.0 - ID 38)
(38, 6, '1 tableta cada 8 horas', '3-5 días', 1, 'A'),
(38, 13, '1 cápsula cada 6 horas', '7 días', 2, 'A'),
-- Enfermedad renal crónica (N18.9 - ID 39)
(39, 1, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
-- Migraña (G43.9 - ID 45)
(45, 24, '1 tableta al inicio del dolor', 'Según necesidad', 1, 'A'),
(45, 7, '1 tableta cada 24 horas', 'Profilaxis crónica', 2, 'A'),
-- Accidente cerebrovascular (I63.9 - ID 7)
(7, 5, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(7, 1, '1 tableta cada 24 horas', 'Tratamiento crónico', 2, 'A'),
-- Aterosclerosis (I70.9 - ID 8)
(8, 5, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(8, 1, '1 tableta cada 24 horas', 'Tratamiento crónico', 2, 'A'),
-- Cardiopatía hipertensiva (I11.9 - ID 9)
(9, 1, '1 tableta cada 24 horas', 'Tratamiento crónico', 1, 'A'),
(9, 8, '1 tableta cada 24 horas', 'Tratamiento crónico', 2, 'A'),
-- Endocarditis (I36.9 - ID 10)
(10, 3, '1 cápsula cada 8 horas', '2-4 semanas', 1, 'A'),
(10, 10, '1 tableta cada 12 horas', 'Mantenimiento', 2, 'A'),
-- Hipotiroidismo posquirúrgico (E89.0 - ID 17)
(17, 15, '1 tableta cada 24 horas en ayunas', 'Tratamiento crónico', 1, 'A'),
-- Deficiencia ACTH (E23.6 - ID 18)
(18, 2, '1 tableta cada 12 horas', 'Tratamiento crónico', 1, 'A'),
-- Síndrome de Cushing (E24.9 - ID 19)
(19, 6, '1 tableta cada 8 horas', 'Manejo del síndrome', 1, 'A');

-- =====================================================
-- PASO 7: USUARIOS DE PRUEBA
-- =====================================================

-- Paciente 1
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('María', 'García López', 'maria.garcia@email.com', crypt('password123', gen_salt('bf')), '987654321', 'paciente', true, true);

-- Paciente 2
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Carlos', 'Rodríguez Pérez', 'carlos.rodriguez@email.com', crypt('password123', gen_salt('bf')), '987654322', 'paciente', true, true);

-- Paciente 3
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Patricia', 'Sánchez Martínez', 'patricia.sanchez@email.com', crypt('password123', gen_salt('bf')), '987654325', 'paciente', true, true);

-- Paciente 4
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Roberto', 'Flores Gutierrez', 'roberto.flores@email.com', crypt('password123', gen_salt('bf')), '987654326', 'paciente', true, true);

-- Paciente 5
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Lucía', 'Quispe Romero', 'lucia.quispe@email.com', crypt('password123', gen_salt('bf')), '987654327', 'paciente', true, true);

-- Médico 1
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Dr. Juan', 'Mendoza Silva', 'dr.mendoza@clinica.com', crypt('password123', gen_salt('bf')), '987654323', 'medico', true, true);

-- Médico 2
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Dra. Ana', 'Torres Vega', 'dra.torres@clinica.com', crypt('password123', gen_salt('bf')), '987654324', 'medico', true, true);

-- Médico 3
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Dr. Carlos', 'Vargas Moreno', 'dr.vargas@clinica.com', crypt('password123', gen_salt('bf')), '987654328', 'medico', true, true);

-- Médico 4
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Dra. Sofía', 'Lazo Campos', 'dra.lazo@clinica.com', crypt('password123', gen_salt('bf')), '987654329', 'medico', true, true);

-- Farmacia 1
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Farmacia', 'MediFarma', 'admin@medifarma.com', crypt('password123', gen_salt('bf')), '014567890', 'farmacia', true, true);

-- Farmacia 2
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Farmacia', 'FarmaPlus', 'admin@farmaplus.com', crypt('password123', gen_salt('bf')), '014567892', 'farmacia', true, true);

-- Laboratorio
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Laboratorio', 'Clinilabs', 'admin@clinilabs.com', crypt('password123', gen_salt('bf')), '014567891', 'laboratorio', true, true);

-- Administrador del Sistema
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, rol, activo, verificado) 
VALUES 
('Admin', 'Sistema MediLink+', 'admin@medilink.com', crypt('admin123456', gen_salt('bf')), '018005000', 'administrador', true, true);

-- =====================================================
-- PASO 8: PERFIL PACIENTES
-- =====================================================

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
),
(
    (SELECT id FROM usuarios WHERE email = 'patricia.sanchez@email.com'),
    '1992-03-18',
    'femenino',
    'Calle Primavera 890, La Molina',
    3,
    '45678903',
    'B+',
    'Aspirina',
    'Pacífico Salud',
    58.0,
    158
),
(
    (SELECT id FROM usuarios WHERE email = 'roberto.flores@email.com'),
    '1980-11-30',
    'masculino',
    'Av. Paseo de la República 2500, Surco',
    4,
    '45678904',
    'O-',
    'Ninguna conocida',
    'Integral Seguros',
    82.5,
    180
),
(
    (SELECT id FROM usuarios WHERE email = 'lucia.quispe@email.com'),
    '1995-07-25',
    'femenino',
    'Calle San Martín 456, La Molina',
    3,
    '45678905',
    'AB+',
    'Cefalosporinas',
    'Rímac Seguros',
    62.0,
    164
);

-- =====================================================
-- PASO 9: PERFIL MÉDICOS
-- =====================================================

INSERT INTO medicos (id_usuario, id_especialidad, numero_colegiatura, anos_experiencia, direccion_consultorio, id_ubicacion, horario_atencion, tarifa_consulta, acepta_seguro, biografia, certificaciones)
VALUES 
(
    (SELECT id FROM usuarios WHERE email = 'dr.mendoza@clinica.com'),
    2,
    'CMP-54321',
    15,
    'Centro Médico Cardio Plus, Av. Javier Prado 2458, San Isidro',
    2,
    '{"lunes": "09:00-18:00", "martes": "09:00-18:00", "miercoles": "09:00-18:00", "jueves": "09:00-18:00", "viernes": "09:00-14:00"}'::jsonb,
    150.00,
    true,
    'Cardiólogo con 15 años de experiencia, especializado en hipertensión arterial y enfermedades coronarias.',
    'Especialidad en Cardiología - Hospital Rebagliati, Diplomado en Ecocardiografía'
),
(
    (SELECT id FROM usuarios WHERE email = 'dra.torres@clinica.com'),
    3,
    'CMP-54322',
    10,
    'Clínica Pediátrica Los Ángeles, Av. Benavides 1890, Miraflores',
    1,
    '{"lunes": "08:00-13:00", "martes": "08:00-13:00", "miercoles": "14:00-19:00", "jueves": "08:00-13:00", "viernes": "08:00-13:00", "sabado": "09:00-12:00"}'::jsonb,
    120.00,
    true,
    'Pediatra especializada en atención integral del niño y adolescente.',
    'Especialidad en Pediatría - Hospital del Niño, Certificación en Lactancia Materna'
),
(
    (SELECT id FROM usuarios WHERE email = 'dr.vargas@clinica.com'),
    1,
    'CMP-54323',
    8,
    'Consultorio Médico Vargas, Av. Larco 1560, Miraflores',
    1,
    '{"lunes": "07:00-19:00", "martes": "07:00-19:00", "miercoles": "07:00-19:00", "jueves": "07:00-19:00", "viernes": "07:00-19:00", "sabado": "08:00-13:00"}'::jsonb,
    100.00,
    true,
    'Médico general con amplia experiencia en diagnóstico y atención de enfermedades comunes.',
    'Licenciado en Medicina - UNMSM, Diplomado en Medicina Familiar'
),
(
    (SELECT id FROM usuarios WHERE email = 'dra.lazo@clinica.com'),
    4,
    'CMP-54324',
    12,
    'Centro de Ginecología La Esperanza, Av. Angamos 3200, Surco',
    4,
    '{"lunes": "10:00-18:00", "martes": "10:00-18:00", "miercoles": "10:00-18:00", "jueves": "10:00-18:00", "viernes": "09:00-16:00"}'::jsonb,
    175.00,
    true,
    'Ginecóloga especializada en salud reproductiva y obstetricia, con experiencia en medicina fetal.',
    'Especialidad en Ginecología y Obstetricia - UPCH, Certificación en Ecografía Obstétrica'
);

-- =====================================================
-- PASO 10: FARMACIAS
-- =====================================================

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
),
(
    (SELECT id FROM usuarios WHERE email = 'admin@farmaplus.com'),
    'FarmaPlus - Centro Comercial La Molina',
    '20567890125',
    'Centro Comercial Plaza La Molina, Av. Javier Prado Este 4200, La Molina',
    3,
    '{"lunes": "07:30-22:00", "martes": "07:30-22:00", "miercoles": "07:30-22:00", "jueves": "07:30-22:00", "viernes": "07:30-22:00", "sabado": "08:00-21:00", "domingo": "09:00-20:00"}'::jsonb,
    true,
    4.5,
    'LF-2023-001235'
);

-- =====================================================
-- PASO 11: LABORATORIOS
-- =====================================================

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

-- =====================================================
-- PASO 12: INVENTARIO DE FARMACIAS (100+ PRODUCTOS)
-- =====================================================

-- INVENTARIO MEDIFARMA - Sucursal Miraflores (50 productos)
INSERT INTO inventario_farmacia (id_farmacia, id_medicamento, stock_actual, stock_minimo, precio_venta, fecha_vencimiento, lote, disponible) VALUES
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    1, 150, 20, 12.50, '2026-12-31', 'LOT-2024-001', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    2, 200, 30, 8.00, '2026-10-31', 'LOT-2024-002', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    3, 100, 25, 15.00, '2025-08-31', 'LOT-2024-003', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    4, 180, 30, 10.50, '2026-11-30', 'LOT-2024-004', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    5, 120, 20, 18.00, '2026-09-30', 'LOT-2024-005', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    6, 250, 40, 5.50, '2027-03-31', 'LOT-2024-006', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    7, 80, 15, 22.00, '2026-07-31', 'LOT-2024-007', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    8, 160, 25, 14.80, '2026-08-15', 'LOT-2024-008', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    9, 90, 20, 9.25, '2026-05-20', 'LOT-2024-009', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    10, 110, 30, 28.50, '2025-11-30', 'LOT-2024-010', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    11, 140, 25, 16.75, '2026-10-10', 'LOT-2024-011', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    12, 60, 15, 12.30, '2026-04-25', 'LOT-2024-012', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    13, 85, 20, 18.90, '2025-12-15', 'LOT-2024-013', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    14, 95, 15, 24.50, '2026-09-05', 'LOT-2024-014', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    15, 70, 10, 15.80, '2026-07-18', 'LOT-2024-015', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    16, 120, 25, 32.40, '2026-11-22', 'LOT-2024-016', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    17, 180, 35, 8.75, '2027-02-14', 'LOT-2024-017', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    18, 55, 10, 35.20, '2026-08-30', 'LOT-2024-018', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    19, 45, 8, 42.80, '2026-06-12', 'LOT-2024-019', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    20, 30, 5, 28.90, '2026-03-28', 'LOT-2024-020', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    21, 65, 12, 85.00, '2026-01-20', 'LOT-2024-021', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    22, 125, 30, 45.30, '2025-10-08', 'LOT-2024-022', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    23, 40, 8, 78.50, '2026-09-17', 'LOT-2024-023', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    24, 150, 25, 12.80, '2027-01-05', 'LOT-2024-024', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    25, 35, 6, 65.40, '2026-05-30', 'LOT-2024-025', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    26, 170, 25, 14.50, '2026-12-10', 'LOT-2024-026', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    27, 110, 20, 18.75, '2026-11-05', 'LOT-2024-027', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    1, 75, 20, 12.50, '2027-02-28', 'LOT-2024-028', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    2, 100, 30, 8.00, '2027-01-15', 'LOT-2024-029', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    3, 80, 25, 15.00, '2025-12-20', 'LOT-2024-030', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    6, 120, 40, 5.50, '2027-06-30', 'LOT-2024-031', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    4, 90, 30, 10.50, '2027-03-15', 'LOT-2024-032', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    16, 60, 25, 32.40, '2027-04-10', 'LOT-2024-033', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    17, 95, 35, 8.75, '2027-05-22', 'LOT-2024-034', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    8, 80, 25, 14.80, '2027-01-08', 'LOT-2024-035', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    11, 70, 25, 16.75, '2027-02-18', 'LOT-2024-036', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    22, 60, 30, 45.30, '2026-03-25', 'LOT-2024-037', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    19, 8, 8, 42.80, '2026-06-12', 'LOT-2024-038', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    20, 6, 5, 28.90, '2026-03-28', 'LOT-2024-039', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    25, 4, 6, 65.40, '2026-05-30', 'LOT-2024-040', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    23, 7, 8, 78.50, '2026-09-17', 'LOT-2024-041', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    12, 12, 15, 12.30, '2026-04-25', 'LOT-2024-042', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    18, 9, 10, 35.20, '2026-08-30', 'LOT-2024-043', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    15, 8, 10, 15.80, '2026-07-18', 'LOT-2024-044', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    21, 10, 12, 85.00, '2026-01-20', 'LOT-2024-045', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    13, 25, 20, 18.90, '2024-12-15', 'LOT-2023-046', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    3, 30, 25, 15.00, '2024-10-31', 'LOT-2023-047', true
);

-- INVENTARIO FARMAPLUS - Centro Comercial La Molina (55 productos con precios distintos)
INSERT INTO inventario_farmacia (id_farmacia, id_medicamento, stock_actual, stock_minimo, precio_venta, fecha_vencimiento, lote, disponible) VALUES
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    1, 200, 25, 12.00, '2027-01-15', 'FP-2024-001', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    2, 180, 35, 8.50, '2026-11-20', 'FP-2024-002', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    3, 120, 30, 14.80, '2025-09-10', 'FP-2024-003', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    4, 220, 40, 10.20, '2027-01-05', 'FP-2024-004', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    5, 140, 25, 17.50, '2026-10-15', 'FP-2024-005', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    6, 300, 50, 5.25, '2027-04-30', 'FP-2024-006', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    7, 95, 18, 21.50, '2026-08-15', 'FP-2024-007', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    8, 175, 30, 14.50, '2026-09-20', 'FP-2024-008', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    9, 105, 25, 9.00, '2026-06-10', 'FP-2024-009', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    10, 125, 40, 27.80, '2025-12-20', 'FP-2024-010', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    11, 160, 30, 16.25, '2026-11-15', 'FP-2024-011', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    12, 75, 18, 12.00, '2026-05-10', 'FP-2024-012', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    13, 100, 22, 18.50, '2026-01-20', 'FP-2024-013', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    14, 110, 18, 24.00, '2026-10-12', 'FP-2024-014', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    15, 85, 12, 15.50, '2026-08-22', 'FP-2024-015', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    16, 140, 30, 31.80, '2026-12-28', 'FP-2024-016', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    17, 200, 40, 8.50, '2027-03-20', 'FP-2024-017', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    18, 70, 12, 34.80, '2026-09-15', 'FP-2024-018', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    19, 55, 10, 42.00, '2026-07-18', 'FP-2024-019', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    20, 40, 6, 28.50, '2026-04-30', 'FP-2024-020', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    21, 80, 15, 83.50, '2026-02-25', 'FP-2024-021', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    22, 140, 35, 44.80, '2025-11-15', 'FP-2024-022', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    23, 50, 10, 77.80, '2026-10-25', 'FP-2024-023', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    24, 165, 30, 12.50, '2027-02-10', 'FP-2024-024', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    25, 45, 8, 64.50, '2026-06-15', 'FP-2024-025', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    26, 190, 30, 14.80, '2027-01-05', 'FP-2024-026', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    27, 130, 25, 18.50, '2026-12-10', 'FP-2024-027', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    1, 110, 25, 12.50, '2027-03-30', 'FP-2024-028', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    2, 95, 35, 8.25, '2027-02-20', 'FP-2024-029', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    5, 70, 25, 18.00, '2026-11-10', 'FP-2024-030', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    6, 160, 45, 5.50, '2027-07-15', 'FP-2024-031', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    4, 120, 35, 10.80, '2027-04-20', 'FP-2024-032', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    8, 100, 28, 15.20, '2027-02-14', 'FP-2024-033', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    11, 85, 28, 17.00, '2027-03-20', 'FP-2024-034', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    16, 75, 28, 33.00, '2027-05-15', 'FP-2024-035', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    17, 115, 38, 9.00, '2027-06-25', 'FP-2024-036', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    22, 80, 35, 46.00, '2026-04-30', 'FP-2024-037', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    9, 20, 20, 9.50, '2026-07-10', 'FP-2024-038', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    12, 16, 18, 12.50, '2026-05-20', 'FP-2024-039', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    13, 35, 23, 19.20, '2026-02-05', 'FP-2024-040', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    14, 22, 20, 25.00, '2026-11-18', 'FP-2024-041', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    15, 14, 12, 16.20, '2026-08-28', 'FP-2024-042', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    18, 11, 12, 36.00, '2026-09-25', 'FP-2024-043', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    19, 18, 10, 43.50, '2026-07-25', 'FP-2024-044', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    20, 9, 6, 29.50, '2026-05-05', 'FP-2024-045', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    21, 12, 15, 86.00, '2026-03-05', 'FP-2024-046', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    23, 5, 10, 79.50, '2026-10-30', 'FP-2024-047', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    24, 35, 28, 13.00, '2027-01-22', 'FP-2024-048', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    25, 6, 8, 66.00, '2026-06-25', 'FP-2024-049', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    26, 25, 28, 15.10, '2027-01-18', 'FP-2024-050', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    27, 40, 28, 19.00, '2026-12-20', 'FP-2024-051', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    3, 35, 28, 15.50, '2025-11-05', 'FP-2024-052', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    7, 28, 18, 22.50, '2026-09-08', 'FP-2024-053', true
),
(
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    10, 35, 38, 28.50, '2026-01-15', 'FP-2024-054', true
);

-- =====================================================
-- PASO 13: EXPEDIENTES MÉDICOS
-- =====================================================

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
),
(
    (SELECT id FROM pacientes WHERE dni = '45678903'),
    'EXP-2024-003',
    ARRAY['Aspirina'],
    ARRAY['Asma leve intermitente'],
    ARRAY['Salbutamol inhalador - según sea necesario'],
    ARRAY[]::TEXT[],
    'Madre con asma alérgica, abuela materna con enfermedad tiroidea'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678904'),
    'EXP-2024-004',
    ARRAY[]::TEXT[],
    ARRAY['Hipertensión arterial', 'Diabetes mellitus tipo 2'],
    ARRAY['Metformina 850mg - 2 veces al día', 'Losartán 100mg - 1 vez al día'],
    ARRAY['Colecistectomía (2012)'],
    'Padre y tío con diabetes tipo 2, madre con hipertensión'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678905'),
    'EXP-2024-005',
    ARRAY['Cefalosporinas'],
    ARRAY['Gastritis crónica'],
    ARRAY['Omeprazol 20mg - 1 vez al día'],
    ARRAY['Amigdalectomía (2010)'],
    'Abuela paterna con cáncer de estómago, madre con gastritis'
);

-- =====================================================
-- PASO 13.5: DIAGNÓSTICOS DE PACIENTES (COHERENTES CON CIE-10 Y EXPEDIENTES)
-- =====================================================

-- Paciente María García (45678901) - Hipertensión arterial
INSERT INTO diagnosticos_paciente (paciente_id, codigo_cie10_id, fecha_diagnostico, activo, observaciones)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678901'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'I10'),
    '2023-06-15',
    true,
    'Hipertensión esencial controlada con Losartán. Presión arterial estable entre 130-140/80-85 mmHg'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678901'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'K21.9'),
    '2023-08-20',
    true,
    'Reflujo gastroesofágico asociado a estrés laboral. En tratamiento con omeprazol con buena respuesta'
);

-- Paciente Carlos Rodríguez (45678902) - Diabético e hipertenso
INSERT INTO diagnosticos_paciente (paciente_id, codigo_cie10_id, fecha_diagnostico, activo, observaciones)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678902'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'E11.9'),
    '2022-03-10',
    true,
    'Diabetes mellitus tipo 2 diagnosticada hace 2 años. Glicemia en ayunas 140-160 mg/dL. En tratamiento con Metformina'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678902'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'I10'),
    '2022-03-10',
    true,
    'Hipertensión arterial asociada a diabetes. Control parcial con Losartán 100mg'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678902'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'E66.9'),
    '2023-01-05',
    true,
    'Sobrepeso IMC 28.5. En programa de pérdida de peso. Derivación a nutricionista'
);

-- Paciente Patricia Sánchez (45678903) - Asma
INSERT INTO diagnosticos_paciente (paciente_id, codigo_cie10_id, fecha_diagnostico, activo, observaciones)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678903'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'J45.9'),
    '2015-09-12',
    true,
    'Asma leve intermitente desde la adolescencia. Crisis ocasionales en cambios de clima. Controlado con inhalador de salbutamol'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678903'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'J30.9'),
    '2023-11-08',
    true,
    'Alergia ambiental a ácaros y polen. Síntomas estacionales en primavera'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678903'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'K29.7'),
    '2024-01-15',
    true,
    'Gastritis por estrés relacionada a brotes de asma. Manejo con omeprazol'
);

-- Paciente Roberto Flores (45678904) - Múltiples comorbilidades
INSERT INTO diagnosticos_paciente (paciente_id, codigo_cie10_id, fecha_diagnostico, activo, observaciones)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678904'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'E11.9'),
    '2020-05-20',
    true,
    'Diabetes mellitus tipo 2 diagnosticada hace 4 años. Glicemia en ayunas 180-200 mg/dL. Requiere intensificación de tratamiento'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678904'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'I10'),
    '2020-05-20',
    true,
    'Hipertensión arterial estadio 2. Presión arterial 160/100 mmHg. En tratamiento con doble terapia'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678904'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'M54.5'),
    '2023-07-22',
    true,
    'Lumbalgia crónica debido a trabajos previos. Dolor moderado ocasional. Tratamiento con analgésicos'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678904'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'F41.1'),
    '2024-02-01',
    true,
    'Trastorno de ansiedad generalizada. Síntomas de estrés y preocupación excesiva por salud. En seguimiento psicológico'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678904'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'M19.9'),
    '2024-03-10',
    true,
    'Artrosis incipiente de rodilla izquierda. Radiografía con mínimos cambios degenerativos'
);

-- Paciente Lucía Quispe (45678905) - Problemas digestivos
INSERT INTO diagnosticos_paciente (paciente_id, codigo_cie10_id, fecha_diagnostico, activo, observaciones)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678905'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'K29.7'),
    '2021-11-03',
    true,
    'Gastritis crónica. Endoscopia previa sin úlceras. En tratamiento con omeprazol con buena tolerancia'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678905'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'K21.9'),
    '2022-06-18',
    true,
    'Reflujo gastroesofágico leve. Síntomas ocasionales post-prandiales. Control dietético y farmacológico'
),
(
    (SELECT id FROM pacientes WHERE dni = '45678905'),
    (SELECT id FROM codigos_cie10 WHERE codigo = 'F32.9'),
    '2024-01-20',
    true,
    'Episodio depresivo leve. Relacionado a estrés laboral prolongado. En tratamiento con Sertralina'
);

-- =====================================================
-- PASO 13.6: CITAS MÉDICAS (COHERENTES Y VARIADAS)
-- =====================================================

-- CITA 1: María García con Dr. Mendoza (Cardiología) - Hipertensión - COMPLETADA
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, diagnostico, tratamiento, costo, pagado, metodo_pago)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678901'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54321'),
    '2024-10-15',
    '10:00:00',
    'presencial',
    'completada',
    'Control de presión arterial. Revisión mensual de hipertensión',
    'Hipertensión esencial controlada',
    'Continuar con Losartán 50mg cada 24 horas. Realizar actividad física regular',
    150.00,
    true,
    'tarjeta'
);

-- CITA 2: Carlos Rodríguez con Dr. Vargas (Medicina General) - Diabetes - EN_CURSO
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, diagnostico, costo, pagado)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678902'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    '2024-12-03',
    '14:30:00',
    'presencial',
    'en_curso',
    'Control de diabetes mellitus tipo 2. Revisión de glicemia',
    'Diabetes mellitus tipo 2 - Control subóptimo',
    100.00,
    false
);

-- CITA 3: Patricia Sánchez con Dra. Torres (Pediatría) - Asma - COMPLETADA
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, diagnostico, tratamiento, costo, pagado, metodo_pago)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678903'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54322'),
    '2024-11-20',
    '09:00:00',
    'virtual',
    'completada',
    'Evaluación de crisis asmáticas. Cambio de inhalador',
    'Asma leve intermitente - Controlado',
    'Salbutamol inhalador según necesidad. Evitar desencadenantes',
    120.00,
    true,
    'billetera_digital'
);

-- CITA 4: Roberto Flores con Dr. Mendoza (Cardiología) - Hipertensión y Diabetes - PROGRAMADA
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, costo, pagado)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678904'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54321'),
    '2024-12-10',
    '11:00:00',
    'presencial',
    'programada',
    'Control integral de hipertensión y diabetes. Evaluación cardiaca',
    150.00,
    false
);

-- CITA 5: Lucía Quispe con Dra. Sofía (Ginecología) - Control general - COMPLETADA
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, diagnostico, tratamiento, costo, pagado, metodo_pago)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678905'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54324'),
    '2024-09-18',
    '15:30:00',
    'presencial',
    'completada',
    'Revisión ginecológica anual. Control de gastritis asociada',
    'Gastritis crónica. Reflujo gastroesofágico leve',
    'Continuar omeprazol. Derivación a gastroenterología',
    175.00,
    true,
    'efectivo'
);

-- CITA 6: María García con Dra. Torres (Pediatría) - CANCELADA
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, costo)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678901'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54322'),
    '2024-11-05',
    '16:00:00',
    'virtual',
    'cancelada',
    'Consulta por reflujo - CANCELADA por paciente',
    120.00
);

-- CITA 7: Carlos Rodríguez con Dr. Vargas (Medicina General) - Seguimiento - CONFIRMADA
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, costo, pagado)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678902'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    '2024-12-15',
    '10:30:00',
    'presencial',
    'confirmada',
    'Seguimiento post-consulta. Evaluación de tratamiento',
    100.00,
    false
);

-- CITA 8: Patricia Sánchez con Dr. Vargas (Medicina General) - Revisión - COMPLETADA
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, diagnostico, tratamiento, costo, pagado, metodo_pago)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678903'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    '2024-10-22',
    '13:00:00',
    'presencial',
    'completada',
    'Revisión general de salud. Evaluación de alergias',
    'Asma + Alergia ambiental',
    'Antihistamínico. Mantener inhalador',
    100.00,
    true,
    'tarjeta'
);

-- CITA 9: Roberto Flores con Dr. Vargas (Medicina General) - NO ASISTIÓ
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, costo)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678904'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    '2024-11-12',
    '09:30:00',
    'presencial',
    'no_asistio',
    'Control de ansiedad y dolor lumbar',
    100.00
);

-- CITA 10: Lucía Quispe con Dr. Vargas (Medicina General) - Síntomas digestivos - COMPLETADA
INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, tipo_cita, estado, motivo_consulta, diagnostico, tratamiento, costo, pagado, metodo_pago)
VALUES 
(
    (SELECT id FROM pacientes WHERE dni = '45678905'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    '2024-12-01',
    '11:00:00',
    'virtual',
    'completada',
    'Síntomas de gastritis y depresión leve',
    'Gastritis crónica + Episodio depresivo leve',
    'Omeprazol 20mg + Sertralina 50mg. Seguimiento psicológico',
    100.00,
    true,
    'billetera_digital'
);

-- =====================================================
-- PASO 13.7: RECETAS MÉDICAS (COHERENTES CON CITAS Y DIAGNÓSTICOS)
-- =====================================================

-- RECETA 1: Hipertensión María García (de CITA 1 - Completada)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, tipo_entrega)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678901') AND fecha_cita = '2024-10-15'),
    'REC-2024-001-MAG',
    1,
    'Hipertensión esencial',
    '2024-10-15',
    '2025-04-15',
    'dispensada',
    'recojo'
);

-- RECETA 2: Diabetes Carlos Rodríguez (de CITA 2 - En curso)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, tipo_entrega)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678902') AND fecha_cita = '2024-12-03'),
    'REC-2024-002-CRP',
    11,
    'Diabetes mellitus tipo 2',
    '2024-12-03',
    '2025-06-03',
    'en_proceso',
    'domicilio'
);

-- RECETA 3: Asma Patricia Sánchez (de CITA 3 - Completada)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, tipo_entrega)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678903') AND fecha_cita = '2024-11-20'),
    'REC-2024-003-PSM',
    21,
    'Asma leve intermitente',
    '2024-11-20',
    '2025-05-20',
    'dispensada',
    'recojo'
);

-- RECETA 4: Control integral Roberto Flores (de CITA 4 - Programada)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, tipo_entrega)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678904') AND fecha_cita = '2024-12-10'),
    'REC-2024-004-RFG',
    11,
    'Diabetes mellitus tipo 2 + Hipertensión',
    '2024-12-10',
    '2025-06-10',
    'activa',
    'domicilio'
);

-- RECETA 5: Gastritis Lucía Quispe (de CITA 5 - Completada)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, tipo_entrega)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678905') AND fecha_cita = '2024-09-18'),
    'REC-2024-005-LQR',
    28,
    'Gastritis crónica',
    '2024-09-18',
    '2025-03-18',
    'dispensada',
    'recojo'
);

-- RECETA 6: Alergias Patricia Sánchez (de CITA 8 - Completada)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, tipo_entrega)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678903') AND fecha_cita = '2024-10-22'),
    'REC-2024-006-PSM2',
    24,
    'Alergia ambiental',
    '2024-10-22',
    '2025-04-22',
    'dispensada',
    'recojo'
);

-- RECETA 7: Depresión y Gastritis Lucía Quispe (de CITA 10 - Completada)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, tipo_entrega)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678905') AND fecha_cita = '2024-12-01'),
    'REC-2024-007-LQR2',
    40,
    'Episodio depresivo leve',
    '2024-12-01',
    '2025-06-01',
    'dispensada',
    'recojo'
);

-- =====================================================
-- PASO 13.8: DETALLE DE RECETAS (MEDICAMENTOS EN CADA RECETA)
-- =====================================================

-- DETALLE RECETA 1: Hipertensión - Losartán
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-001-MAG'),
    1,
    30,
    '50 mg',
    'Una vez cada 24 horas',
    180,
    'Oral',
    'Tomar por la mañana. Mantener dieta baja en sodio. Monitorear presión arterial'
);

-- DETALLE RECETA 2: Diabetes - Metformina
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-002-CRP'),
    2,
    60,
    '850 mg',
    'Dos veces cada 24 horas',
    180,
    'Oral',
    'Tomar con alimentos. Realizar pruebas de glucosa semanales. Evitar alcoholismo'
);

-- DETALLE RECETA 2b: Diabetes - Amlodipino adicional
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-002-CRP'),
    8,
    30,
    '5 mg',
    'Una vez cada 24 horas',
    180,
    'Oral',
    'Para control de presión arterial. Combinado con Metformina'
);

-- DETALLE RECETA 3: Asma - Salbutamol
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-003-PSM'),
    16,
    1,
    '100 mcg',
    'Según necesidad',
    180,
    'Inhalada',
    'Usar en crisis de asma. Máximo 4 dosis diarias. Revisar técnica de inhalación'
);

-- DETALLE RECETA 4: Roberto - Metformina
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-004-RFG'),
    2,
    90,
    '850 mg',
    'Dos veces cada 24 horas',
    180,
    'Oral',
    'Control diabetes estricto. Realizar pruebas cada 3 meses'
);

-- DETALLE RECETA 4b: Roberto - Losartán
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-004-RFG'),
    1,
    30,
    '100 mg',
    'Una vez cada 24 horas',
    180,
    'Oral',
    'Dosis aumentada por presión elevada. Monitoreo regular'
);

-- DETALLE RECETA 4c: Roberto - Ibuprofeno
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-004-RFG'),
    6,
    20,
    '400 mg',
    'Cada 8 horas según dolor',
    180,
    'Oral',
    'Para lumbalgia crónica. Con alimentos. No exceder 1200mg diarios'
);

-- DETALLE RECETA 5: Gastritis - Omeprazol
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-005-LQR'),
    4,
    60,
    '20 mg',
    'Una vez cada 24 horas antes del desayuno',
    180,
    'Oral',
    'Antes de comer. No machacar cápsulas. Evitar comidas ácidas y picantes'
);

-- DETALLE RECETA 6: Alergias - Diazepam (ansiolítico)
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-006-PSM2'),
    12,
    20,
    '10 mg',
    'Una vez cada 24 horas en la noche si es necesario',
    30,
    'Oral',
    'Solo para crisis alérgicas severas. No conducir después de tomar'
);

-- DETALLE RECETA 7: Depresión - Sertralina
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-007-LQR2'),
    7,
    60,
    '50 mg',
    'Una vez cada 24 horas',
    180,
    'Oral',
    'Tomar siempre a la misma hora. Efectos terapéuticos en 2-4 semanas. Seguimiento psicológico'
);

-- DETALLE RECETA 7b: Depresión - Omeprazol adicional
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-007-LQR2'),
    4,
    60,
    '20 mg',
    'Una vez cada 24 horas antes del desayuno',
    180,
    'Oral',
    'Para gastritis concomitante'
);

-- =====================================================
-- PASO 13.9: MÁS RECETAS (DISPENSADAS Y RECHAZADAS - COHERENTES)
-- =====================================================

-- RECETA 8: María García - Seguimiento Hipertensión (RECHAZADA - Stock insuficiente)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, farmacia_seleccionada_id, estado_envio, motivo_rechazo)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678901') AND fecha_cita = '2024-10-15'),
    'REC-2024-008-MAG-2',
    1,
    'Hipertensión esencial - Seguimiento',
    '2024-11-10',
    '2025-05-10',
    'cancelada',
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    'rechazada',
    'Stock insuficiente de Losartán 100mg. Disponibilidad mínima'
);

-- RECETA 9: Carlos Rodríguez - Nueva receta (DISPENSADA - FarmaPlus)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, farmacia_seleccionada_id, estado_envio, fecha_aceptacion_farmacia, fecha_finalizacion_preparacion)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678902') AND fecha_cita = '2024-12-15'),
    'REC-2024-009-CRP-2',
    11,
    'Diabetes mellitus tipo 2 - Control estricto',
    '2024-12-15',
    '2025-06-15',
    'dispensada',
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    'dispensada',
    '2024-12-15 14:30:00',
    '2024-12-16 10:00:00'
);

-- RECETA 10: Patricia Sánchez - Revisión Asma (DISPENSADA - MediFarma)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, farmacia_seleccionada_id, estado_envio, fecha_aceptacion_farmacia, fecha_finalizacion_preparacion)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678903') AND fecha_cita = '2024-10-22'),
    'REC-2024-010-PSM-3',
    21,
    'Asma - Control aumentado de dosis',
    '2024-10-22',
    '2025-04-22',
    'dispensada',
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    'dispensada',
    '2024-10-22 15:45:00',
    '2024-10-22 16:30:00'
);

-- RECETA 11: Roberto Flores - Ansiedad y dolor (EN PROCESO - FarmaPlus)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, farmacia_seleccionada_id, estado_envio, fecha_aceptacion_farmacia, fecha_inicio_preparacion)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678904') AND fecha_cita = '2024-12-10'),
    'REC-2024-011-RFG-2',
    6,
    'Trastorno de ansiedad generalizada',
    '2024-12-10',
    '2025-06-10',
    'en_proceso',
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    'recibida',
    '2024-12-10 11:30:00',
    '2024-12-10 14:00:00'
);

-- RECETA 12: Lucía Quispe - Control gastritis (VENCIDA - No dispensada)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, farmacia_seleccionada_id, estado_envio)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678905') AND fecha_cita = '2024-09-18'),
    'REC-2024-012-LQR-OLD',
    28,
    'Gastritis - Control mensual antiguo',
    '2024-06-01',
    '2024-12-01',
    'vencida',
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    'no_enviada'
);

-- RECETA 13: Patricia Sánchez - Alergia severa (RECHAZADA - Medicamento sin stock)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, farmacia_seleccionada_id, estado_envio, motivo_rechazo)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678903') AND fecha_cita = '2024-11-20'),
    'REC-2024-013-PSM-EXTRA',
    24,
    'Alergia severa - Crisis de asma',
    '2024-11-21',
    '2025-05-21',
    'cancelada',
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    'rechazada',
    'Diazepam 10mg agotado. Próximo stock: 2024-12-10'
);

-- RECETA 14: Carlos Rodríguez - Lipidos (DISPENSADA - MediFarma)
INSERT INTO recetas (id_cita, codigo_receta, diagnostico_principal_id, diagnostico_principal_texto, fecha_emision, fecha_vencimiento, estado, farmacia_seleccionada_id, estado_envio, fecha_aceptacion_farmacia, fecha_finalizacion_preparacion)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678902') AND fecha_cita = '2024-12-03'),
    'REC-2024-014-CRP-LIPIDOS',
    2,
    'Enfermedad coronaria - Control preventivo',
    '2024-12-03',
    '2025-06-03',
    'dispensada',
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    'dispensada',
    '2024-12-03 16:00:00',
    '2024-12-04 09:30:00'
);

-- =====================================================
-- PASO 13.10: DETALLE DE NUEVAS RECETAS
-- =====================================================

-- DETALLE RECETA 9: Metformina XR (Control mejorado)
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-009-CRP-2'),
    26,
    30,
    '1000 mg',
    'Una vez cada 24 horas por la noche',
    180,
    'Oral',
    'Mejor tolerancia. Liberación extendida. No machacar o dividir'
);

-- DETALLE RECETA 10: Salbutamol aumentado
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-010-PSM-3'),
    16,
    2,
    '100 mcg',
    'Según necesidad - Máximo 8 dosis',
    180,
    'Inhalada',
    'Crisis frecuentes. Revisar también uso de corticoide'
);

-- DETALLE RECETA 11: Sertralina para ansiedad
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-011-RFG-2'),
    18,
    30,
    '100 mg',
    'Una vez cada 24 horas',
    180,
    'Oral',
    'Aumentar dosis respecto a inicial. Monitoreo psicológico'
);

-- DETALLE RECETA 11b: Ibuprofeno continuo
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-011-RFG-2'),
    17,
    30,
    '600 mg',
    'Cada 8 horas según dolor',
    180,
    'Oral',
    'Mayor dosis para lumbalgia crónica. Con alimentos'
);

-- DETALLE RECETA 14: Atorvastatina
INSERT INTO receta_detalle (id_receta, medicamento_id, cantidad, dosis, frecuencia, duracion_dias, via_administracion, instrucciones_especiales)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-014-CRP-LIPIDOS'),
    14,
    30,
    '40 mg',
    'Una vez cada 24 horas por la noche',
    180,
    'Oral',
    'Para control preventivo de infarto. Realizar lipidograma cada 6 meses'
);

-- =====================================================
-- PASO 13.11: BOLETAS DE DESPACHO (TRANSACCIONES DE MEDICAMENTOS)
-- =====================================================

-- 1. Primero desactivar el trigger
ALTER TABLE boletas_despacho DISABLE TRIGGER trigger_generar_numero_boleta;

-- BOLETA 1: Receta 1 - María García (Dispensada)
INSERT INTO boletas_despacho (id_receta, id_farmacia, numero_boleta, fecha_despacho, subtotal, igv, total, tipo_entrega, medicamentos_despachados, estado)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-001-MAG'),
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    'B-2024-100001',
    '2024-10-16 09:30:00',
    12.50,
    2.25,
    14.75,
    'recojo',
    '[{"medicamento_id": 1, "nombre": "Losartán 50mg", "cantidad": 30, "precio_unitario": 0.42, "subtotal": 12.50}]'::jsonb,
    'generada'
);

-- BOLETA 2: Receta 3 - Patricia Sánchez (Dispensada Virtual)
INSERT INTO boletas_despacho (id_receta, id_farmacia, numero_boleta, fecha_despacho, subtotal, igv, total, tipo_entrega, medicamentos_despachados, estado)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-003-PSM'),
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    'B-2024-100002',
    '2024-11-21 10:00:00',
    32.40,
    5.83,
    38.23,
    'domicilio',
    '[{"medicamento_id": 16, "nombre": "Salbutamol Inhalador", "cantidad": 1, "precio_unitario": 32.40, "subtotal": 32.40}]'::jsonb,
    'generada'
);

-- BOLETA 3: Receta 5 - Lucía Quispe (Dispensada)
INSERT INTO boletas_despacho (id_receta, id_farmacia, numero_boleta, fecha_despacho, subtotal, igv, total, tipo_entrega, medicamentos_despachados, estado)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-005-LQR'),
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    'B-2024-100003',
    '2024-09-19 14:15:00',
    10.50,
    1.89,
    12.39,
    'recojo',
    '[{"medicamento_id": 4, "nombre": "Omeprazol 20mg", "cantidad": 60, "precio_unitario": 0.18, "subtotal": 10.50}]'::jsonb,
    'generada'
);

-- BOLETA 4: Receta 6 - Patricia Sánchez (Dispensada - Recojo)
INSERT INTO boletas_despacho (id_receta, id_farmacia, numero_boleta, fecha_despacho, subtotal, igv, total, tipo_entrega, medicamentos_despachados, estado)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-006-PSM2'),
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    'B-2024-100004',
    '2024-10-23 16:45:00',
    12.30,
    2.21,
    14.51,
    'recojo',
    '[{"medicamento_id": 12, "nombre": "Diazepam 10mg", "cantidad": 20, "precio_unitario": 0.62, "subtotal": 12.30}]'::jsonb,
    'generada'
);

-- BOLETA 5: Receta 7 - Lucía Quispe (Dispensada - Combo)
INSERT INTO boletas_despacho (id_receta, id_farmacia, numero_boleta, fecha_despacho, subtotal, igv, total, tipo_entrega, medicamentos_despachados, estado)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-007-LQR2'),
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    'B-2024-100005',
    '2024-12-02 11:00:00',
    32.00,
    5.76,
    37.76,
    'recojo',
    '[{"medicamento_id": 7, "nombre": "Sertralina 50mg", "cantidad": 60, "precio_unitario": 0.37, "subtotal": 22.00}, {"medicamento_id": 4, "nombre": "Omeprazol 20mg", "cantidad": 60, "precio_unitario": 0.17, "subtotal": 10.00}]'::jsonb,
    'generada'
);

-- BOLETA 6: Receta 9 - Carlos Rodríguez (FarmaPlus - Precios competitivos)
INSERT INTO boletas_despacho (id_receta, id_farmacia, numero_boleta, fecha_despacho, subtotal, igv, total, tipo_entrega, direccion_entrega, medicamentos_despachados, estado)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-009-CRP-2'),
    (SELECT id FROM farmacias WHERE nombre_comercial = 'FarmaPlus - Centro Comercial La Molina'),
    'B-2024-200001',
    '2024-12-16 10:30:00',
    28.00,
    5.04,
    33.04,
    'domicilio',
    'Calle Los Olivos 567, San Isidro',
    '[{"medicamento_id": 26, "nombre": "Metformina XR 1000mg", "cantidad": 30, "precio_unitario": 0.93, "subtotal": 28.00}]'::jsonb,
    'generada'
);

-- BOLETA 7: Receta 10 - Patricia Sánchez (Aumento de dosis - MediFarma)
INSERT INTO boletas_despacho (id_receta, id_farmacia, numero_boleta, fecha_despacho, subtotal, igv, total, tipo_entrega, medicamentos_despachados, estado)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-010-PSM-3'),
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    'B-2024-100006',
    '2024-10-23 16:30:00',
    64.80,
    11.66,
    76.46,
    'recojo',
    '[{"medicamento_id": 16, "nombre": "Salbutamol Inhalador", "cantidad": 2, "precio_unitario": 32.40, "subtotal": 64.80}]'::jsonb,
    'generada'
);

-- BOLETA 8: Receta 14 - Carlos Rodríguez (Lipidos - MediFarma)
INSERT INTO boletas_despacho (id_receta, id_farmacia, numero_boleta, fecha_despacho, subtotal, igv, total, tipo_entrega, medicamentos_despachados, estado)
VALUES 
(
    (SELECT id FROM recetas WHERE codigo_receta = 'REC-2024-014-CRP-LIPIDOS'),
    (SELECT id FROM farmacias WHERE nombre_comercial = 'MediFarma - Sucursal Miraflores'),
    'B-2024-100007',
    '2024-12-04 10:00:00',
    24.50,
    4.41,
    28.91,
    'recojo',
    '[{"medicamento_id": 14, "nombre": "Atorvastatina 40mg", "cantidad": 30, "precio_unitario": 0.82, "subtotal": 24.50}]'::jsonb,
    'generada'
);

-- 2. Reactivar el trigger
ALTER TABLE boletas_despacho ENABLE TRIGGER trigger_generar_numero_boleta;

-- =====================================================
-- PASO 14: REGISTROS HISTÓRICOS PARA RECETAS (TODOS LOS CAMBIOS DE ESTADO)
-- =====================================================

-- Registros históricos de transición de estados para todas las recetas
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
    NULL::VARCHAR,
    r.estado_envio,
    r.farmacia_seleccionada_id,
    COALESCE(r.fecha_envio_farmacia, r.fecha_emision),
    CASE 
        WHEN r.estado_envio = 'enviada' THEN 'Receta enviada a farmacia'
        WHEN r.estado_envio = 'recibida' THEN 'Farmacia aceptó la receta'
        WHEN r.estado_envio = 'en_proceso' THEN 'Farmacia está preparando los medicamentos'
        WHEN r.estado_envio = 'dispensada' THEN 'Medicamentos dispensados y listos'
        WHEN r.estado_envio = 'rechazada' THEN 'Farmacia rechazó la receta'
        ELSE 'Estado inicial'
    END,
    jsonb_build_object(
        'codigo_receta', r.codigo_receta,
        'tipo_entrega', COALESCE(r.tipo_entrega, 'no_especificado'),
        'es_registro_inicial', true,
        'motivo_rechazo', r.motivo_rechazo
    ),
    true
FROM recetas r
WHERE r.estado_envio IS NOT NULL 
  AND r.estado_envio != 'no_enviada'
  AND NOT EXISTS (
    SELECT 1 FROM historial_cambios_estado_receta h 
    WHERE h.receta_id = r.id
  );

-- Registros adicionales: Transiciones de dispensada a posterior (boletas generadas)
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
    'dispensada',
    'entregada',
    r.farmacia_seleccionada_id,
    bd.fecha_despacho + INTERVAL '2 hours',
    'Medicamentos entregados al paciente',
    jsonb_build_object(
        'numero_boleta', bd.numero_boleta,
        'modo_entrega', bd.tipo_entrega,
        'total_pagado', bd.total
    ),
    true
FROM recetas r
INNER JOIN boletas_despacho bd ON r.id = bd.id_receta
WHERE r.estado = 'dispensada'
  AND NOT EXISTS (
    SELECT 1 FROM historial_cambios_estado_receta h 
    WHERE h.receta_id = r.id 
    AND h.estado_nuevo = 'entregada'
  );

-- Registros de auditoría: Recetas en proceso que aún no tienen boleta
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
    'recibida',
    'en_proceso',
    r.farmacia_seleccionada_id,
    r.fecha_inicio_preparacion,
    'Farmacia iniciando preparación de medicamentos',
    jsonb_build_object(
        'codigo_receta', r.codigo_receta,
        'medicamentos_a_preparar', (SELECT COUNT(*) FROM receta_detalle WHERE id_receta = r.id),
        'tecnico_farmacia', 'Sistema Automático'
    ),
    false
FROM recetas r
WHERE r.estado = 'en_proceso'
  AND r.fecha_inicio_preparacion IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM historial_cambios_estado_receta h 
    WHERE h.receta_id = r.id 
    AND h.estado_nuevo = 'en_proceso'
  );

-- Registros de auditoría: Recetas rechazadas con motivo
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
    'enviada',
    'rechazada',
    r.farmacia_seleccionada_id,
    r.fecha_emision + INTERVAL '4 hours',
    'Receta rechazada por farmacia',
    jsonb_build_object(
        'codigo_receta', r.codigo_receta,
        'motivo', r.motivo_rechazo,
        'timestamp_rechazo', NOW()
    ),
    true
FROM recetas r
WHERE r.estado = 'cancelada'
  AND r.estado_envio = 'rechazada'
  AND r.motivo_rechazo IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM historial_cambios_estado_receta h 
    WHERE h.receta_id = r.id 
    AND h.estado_nuevo = 'rechazada'
  );

-- =====================================================
-- PASO 15: EVALUACIONES DE PACIENTES A MÉDICOS (PANEL ADMIN)
-- =====================================================

-- EVALUACIÓN 1: María García evalúa al Dr. Mendoza (CITA 1 - 2024-10-15)
INSERT INTO evaluaciones (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678901') AND fecha_cita = '2024-10-15' LIMIT 1),
    (SELECT id FROM pacientes WHERE dni = '45678901'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54321'),
    5,
    'Excelente médico. Muy dedicado y me explicó todo claramente sobre mi hipertensión. Profesional y empático.',
    true
);

-- EVALUACIÓN 2: Patricia Sánchez evalúa a Dra. Torres (CITA 3 - 2024-11-20)
INSERT INTO evaluaciones (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678903') AND fecha_cita = '2024-11-20' LIMIT 1),
    (SELECT id FROM pacientes WHERE dni = '45678903'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54322'),
    4,
    'Muy buena atención. La doctora fue paciente con mis dudas sobre el asma. Solo demoró un poco más de lo esperado.',
    true
);

-- EVALUACIÓN 3: Lucía Quispe evalúa a Dra. Sofía (CITA 5 - 2024-09-18)
INSERT INTO evaluaciones (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678905') AND fecha_cita = '2024-09-18' LIMIT 1),
    (SELECT id FROM pacientes WHERE dni = '45678905'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54324'),
    5,
    'Doctora excelente. Me hizo sentir cómoda y confiada. Muy profesional y atenta en todos los detalles. Definitivamente volveré.',
    true
);

-- EVALUACIÓN 4: Patricia Sánchez evalúa a Dr. Vargas (CITA 8 - 2024-10-22)
INSERT INTO evaluaciones (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678903') AND fecha_cita = '2024-10-22' LIMIT 1),
    (SELECT id FROM pacientes WHERE dni = '45678903'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    4,
    'Buen médico, muy técnico y directo. Resolvió mis dudas rápidamente. Recomendado.',
    true
);

-- EVALUACIÓN 5: Lucía Quispe evalúa a Dr. Vargas (CITA 10 - 2024-12-01)
INSERT INTO evaluaciones (cita_id, paciente_id, medico_id, calificacion, comentarios, recomendaria)
VALUES 
(
    (SELECT id FROM citas WHERE id_paciente = (SELECT id FROM pacientes WHERE dni = '45678905') AND fecha_cita = '2024-12-01' LIMIT 1),
    (SELECT id FROM pacientes WHERE dni = '45678905'),
    (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323'),
    4,
    'Médico competente y profesional. Me brindó una buena orientación para los síntomas digestivos. Buen trato.',
    true
);

-- =====================================================
-- PASO 16: ACTUALIZACIÓN DE ESTADÍSTICAS DE MÉDICOS
-- =====================================================

-- Actualizar calificación promedio y total de consultas para Dr. Mendoza (CMP-54321)
UPDATE medicos 
SET 
    calificacion_promedio = (
        SELECT AVG(calificacion)::DECIMAL(3,2) 
        FROM evaluaciones 
        WHERE medico_id = (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54321')
    ),
    total_consultas = (
        SELECT COUNT(*) 
        FROM citas 
        WHERE id_medico = (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54321') 
        AND estado IN ('completada', 'en_curso')
    )
WHERE numero_colegiatura = 'CMP-54321';

-- Actualizar calificación promedio y total de consultas para Dra. Torres (CMP-54322)
UPDATE medicos 
SET 
    calificacion_promedio = (
        SELECT AVG(calificacion)::DECIMAL(3,2) 
        FROM evaluaciones 
        WHERE medico_id = (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54322')
    ),
    total_consultas = (
        SELECT COUNT(*) 
        FROM citas 
        WHERE id_medico = (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54322') 
        AND estado IN ('completada', 'en_curso')
    )
WHERE numero_colegiatura = 'CMP-54322';

-- Actualizar calificación promedio y total de consultas para Dr. Vargas (CMP-54323)
UPDATE medicos 
SET 
    calificacion_promedio = (
        SELECT AVG(calificacion)::DECIMAL(3,2) 
        FROM evaluaciones 
        WHERE medico_id = (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323')
    ),
    total_consultas = (
        SELECT COUNT(*) 
        FROM citas 
        WHERE id_medico = (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54323') 
        AND estado IN ('completada', 'en_curso')
    )
WHERE numero_colegiatura = 'CMP-54323';

-- Actualizar calificación promedio y total de consultas para Dra. Sofía (CMP-54324)
UPDATE medicos 
SET 
    calificacion_promedio = (
        SELECT AVG(calificacion)::DECIMAL(3,2) 
        FROM evaluaciones 
        WHERE medico_id = (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54324')
    ),
    total_consultas = (
        SELECT COUNT(*) 
        FROM citas 
        WHERE id_medico = (SELECT id FROM medicos WHERE numero_colegiatura = 'CMP-54324') 
        AND estado IN ('completada', 'en_curso')
    )
WHERE numero_colegiatura = 'CMP-54324';

-- =====================================================
-- PASO 17: VISTA PARA ESTADÍSTICAS DE MÉDICOS (PANEL ADMIN)
-- =====================================================

-- Vista consolidada de estadísticas de médicos con evaluaciones
CREATE OR REPLACE VIEW vista_estadisticas_medicos AS
SELECT 
    m.id,
    m.numero_colegiatura,
    u.nombre || ' ' || u.apellido AS nombre_completo,
    e.nombre AS especialidad,
    m.anos_experiencia,
    m.tarifa_consulta,
    m.calificacion_promedio,
    m.total_consultas,
    COALESCE(COUNT(ev.id), 0) AS total_evaluaciones,
    COALESCE(AVG(ev.calificacion), 0)::DECIMAL(3,2) AS calificacion_promedio_eval,
    COALESCE(SUM(CASE WHEN ev.recomendaria = true THEN 1 ELSE 0 END), 0)::INTEGER AS pacientes_recomendarian,
    ROUND(
        CASE 
            WHEN COUNT(ev.id) > 0 THEN (SUM(CASE WHEN ev.recomendaria = true THEN 1 ELSE 0 END)::NUMERIC / COUNT(ev.id) * 100)
            ELSE 0
        END, 2
    ) AS porcentaje_recomendacion,
    (SELECT COUNT(*) FROM citas c WHERE c.id_medico = m.id AND c.estado = 'programada') AS citas_pendientes,
    (SELECT COUNT(*) FROM citas c WHERE c.id_medico = m.id AND c.estado = 'completada') AS citas_completadas,
    (SELECT COUNT(*) FROM citas c WHERE c.id_medico = m.id AND c.estado = 'cancelada') AS citas_canceladas,
    u.activo,
    m.fecha_actualizacion
FROM 
    medicos m
    INNER JOIN usuarios u ON m.id_usuario = u.id
    INNER JOIN especialidades e ON m.id_especialidad = e.id
    LEFT JOIN evaluaciones ev ON m.id = ev.medico_id
GROUP BY 
    m.id, m.numero_colegiatura, u.nombre, u.apellido, e.nombre, m.anos_experiencia, 
    m.tarifa_consulta, m.calificacion_promedio, m.total_consultas, u.activo, m.fecha_actualizacion
ORDER BY 
    m.calificacion_promedio DESC, m.total_consultas DESC;

-- =====================================================
-- PASO 18: VISTA ALTERNATIVA - RESUMEN SIMPLE PARA DASHBOARD
-- =====================================================

CREATE OR REPLACE VIEW vista_dashboard_medicos AS
SELECT 
    m.numero_colegiatura,
    u.nombre || ' ' || u.apellido AS nombre_medico,
    e.nombre AS especialidad,
    m.calificacion_promedio::DECIMAL(3,2) AS rating,
    m.total_consultas,
    (SELECT COUNT(*) FROM citas c WHERE c.id_medico = m.id AND c.estado = 'programada') AS citas_hoy,
    m.tarifa_consulta,
    u.activo
FROM 
    medicos m
    INNER JOIN usuarios u ON m.id_usuario = u.id
    INNER JOIN especialidades e ON m.id_especialidad = e.id
ORDER BY m.calificacion_promedio DESC;

-- =====================================================
-- FIN: DATOS DE PRUEBA
-- =====================================================

-- INSTRUCCIONES DE USO:
-- 1. Primero ejecutar: 01-ESTRUCTURA_Y_LOGICA.sql
-- 2. Luego ejecutar: 02-DATOS_DE_PRUEBA.sql
-- 
-- EJEMPLO EN TERMINAL:
-- psql -U usuario -d telemedicina -f 01-ESTRUCTURA_Y_LOGICA.sql
-- psql -U usuario -d telemedicina -f 02-DATOS_DE_PRUEBA.sql
