# 🏗️ ARQUITECTURA DEL SISTEMA DE NOTIFICACIONES Y PROTECCIÓN

## 📐 DIAGRAMA DE FLUJO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          🏥 TELEMEDICINA INTEGRADOR I                        │
└─────────────────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════════════════╗
║                            FRONTEND (React/Next.js)                        ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────┐    ┌────────────────────────────┐        ║
║  │  Dashboard Médico          │    │  Dashboard Paciente        │        ║
║  │  - Ver pacientes           │    │  - Mis citas               │        ║
║  │  - Crear cita              │    │  - Mis recetas             │        ║
║  │  - Crear receta            │    │  - Mis exámenes            │        ║
║  │  - Ver historial           │    │  - Notificaciones          │        ║
║  └────────────┬────────────────┘    └────────────┬───────────────┘        ║
║               │                                  │                        ║
║  ┌────────────▼──────────────────────────────────▼───────────────┐        ║
║  │        🔔 CONTEXTO DE NOTIFICACIONES                           │        ║
║  │                                                                │        ║
║  │  NotificacionesProvider (contexts/notificaciones-context.tsx) │        ║
║  │  ├─ Estado: notificaciones[]                                  │        ║
║  │  ├─ Polling: Cada 30 segundos                                 │        ║
║  │  ├─ Sonido: Web Audio API (800Hz + 1000Hz)                    │        ║
║  │  └─ Toast: Alertas visuales por tipo                          │        ║
║  └───────────┬────────────────────────────────────────────────────┘        ║
║              │                                                              ║
║  ┌───────────▼────────────────────────────────────────────────────┐        ║
║  │         🔔 COMPONENTES DE UI                                   │        ║
║  │  ├─ BotonNotificaciones (navbar)                              │        ║
║  │  │   └─ Badge: Muestra cantidad no leídas                    │        ║
║  │  └─ CentroNotificaciones (modal)                              │        ║
║  │      ├─ Listar todas las notificaciones                       │        ║
║  │      ├─ Marcar como leída (individual/todas)                  │        ║
║  │      └─ Eliminar (individual/todas)                           │        ║
║  └────────────┬─────────────────────────────────────────────────┘        ║
║               │                                                            ║
║  ┌────────────▼─────────────────────────────────────────────────┐        ║
║  │  🔐 MODAL HISTORIAL PACIENTE                                  │        ║
║  │  (components/medico/modal-historial-paciente.tsx)            │        ║
║  │                                                                │        ║
║  │  FLUJO:                                                        │        ║
║  │  1️⃣  Médico abre modal                                         │        ║
║  │  2️⃣  Verifica si hay protección (API check)                   │        ║
║  │  3️⃣  Si no existe → Opción de crear contraseña               │        ║
║  │  4️⃣  Si existe → Pide contraseña                              │        ║
║  │  5️⃣  Tras verificar → Muestra historial completo            │        ║
║  │                                                                │        ║
║  │  TABS:                                                         │        ║
║  │  📋 Resumen        → Datos personales + Antecedentes          │        ║
║  │  🗓️  Citas          → Historia completa de citas             │        ║
║  │  💊 Recetas        → Todas las recetas con medicamentos      │        ║
║  │  🧪 Exámenes       → Resultados de laboratorio               │        ║
║  └──────────────────────────────────────────────────────────────┘        ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

                                      ▼
                            
╔════════════════════════════════════════════════════════════════════════════╗
║                         🔗 SERVIDOR (Next.js API Routes)                   ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌──────────────────────────────────────────────────────────────┐        ║
║  │         🔔 NOTIFICACIONES (CRUD)                              │        ║
║  │                                                                │        ║
║  │  📍 GET  /api/notificaciones                                   │        ║
║  │      └─ Obtener todas (max 50, ordenadas por fecha DESC)     │        ║
║  │      └─ Response: {notificaciones: [...]}                     │        ║
║  │                                                                │        ║
║  │  📍 POST /api/notificaciones                                   │        ║
║  │      └─ Crear notificación                                    │        ║
║  │      └─ Body: {titulo, mensaje, tipo, idRelacionado}         │        ║
║  │      └─ Retorna: {id, createdAt}                              │        ║
║  │                                                                │        ║
║  │  📍 PATCH /api/notificaciones/[id]                            │        ║
║  │      └─ Marcar como leída                                     │        ║
║  │      └─ Actualiza leida = true                                │        ║
║  │                                                                │        ║
║  │  📍 DELETE /api/notificaciones/[id]                           │        ║
║  │      └─ Eliminar notificación                                 │        ║
║  │                                                                │        ║
║  │  📍 POST /api/notificaciones/marcar-todo-leido                │        ║
║  │      └─ Batch: marca todas como leídas                        │        ║
║  │                                                                │        ║
║  │  📍 POST /api/notificaciones/limpiar-todas                    │        ║
║  │      └─ Batch: elimina todas                                  │        ║
║  └──────────────────────────────────────────────────────────────┘        ║
║                                                                            ║
║  ┌──────────────────────────────────────────────────────────────┐        ║
║  │         🔔 TRIGGERS DE NOTIFICACIONES                          │        ║
║  │                                                                │        ║
║  │  📍 POST /api/citas/crear-notificacion                         │        ║
║  │      Called by: POST /api/citas/route.ts                      │        ║
║  │               PUT  /api/citas/[id]/route.ts                   │        ║
║  │      Acciones: crear, confirmar, completar, cancelar          │        ║
║  │      Notifica: Paciente + Médico                              │        ║
║  │                                                                │        ║
║  │  📍 POST /api/recetas/crear-notificacion                       │        ║
║  │      Called by: POST /api/recetas/crear/route.ts              │        ║
║  │               POST /api/recetas/[id]/enviar-farmacia           │        ║
║  │      Acciones: crear, enviar_farmacia, dispensada             │        ║
║  │      Notifica: Paciente + Farmacia                            │        ║
║  └──────────────────────────────────────────────────────────────┘        ║
║                                                                            ║
║  ┌──────────────────────────────────────────────────────────────┐        ║
║  │         🔐 PROTECCIÓN DE HISTORIAL                             │        ║
║  │                                                                │        ║
║  │  📍 POST /api/medico/pacientes/[id]/historial-protegido        │        ║
║  │                                                                │        ║
║  │  Action: "check"                                              │        ║
║  │      └─ Verifica si paciente tiene contraseña                 │        ║
║  │      └─ Response: {isProtected: boolean}                      │        ║
║  │                                                                │        ║
║  │  Action: "verify"                                             │        ║
║  │      └─ Valida contraseña ingresada                           │        ║
║  │      └─ Compara con hash bcryptjs                             │        ║
║  │      └─ Response: {success: boolean}                          │        ║
║  │      └─ Registra en acceso_historial_logs                     │        ║
║  │                                                                │        ║
║  │  Action: "create"                                             │        ║
║  │      └─ Crea nueva contraseña (6+ caracteres)                 │        ║
║  │      └─ Hashea con bcryptjs (10 rounds)                       │        ║
║  │      └─ Inserta en historial_protecciones                     │        ║
║  │      └─ Response: {success: boolean}                          │        ║
║  │                                                                │        ║
║  │  Action: "update"                                             │        ║
║  │      └─ Cambia contraseña existente                           │        ║
║  │      └─ Verifica contraseña anterior                          │        ║
║  │      └─ Hashea nueva y actualiza                              │        ║
║  │      └─ Response: {success: boolean}                          │        ║
║  └──────────────────────────────────────────────────────────────┘        ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

                                      ▼

╔════════════════════════════════════════════════════════════════════════════╗
║                      🗄️  BASE DE DATOS (PostgreSQL)                        ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  TABLE: notificaciones                                                    ║
║  ┌──────────────────────────────────────────────────────────┐            ║
║  │ id (UUID) PRIMARY KEY                                    │            ║
║  │ id_usuario (INT) REFERENCES usuarios(id) - INDEXED       │            ║
║  │ titulo (VARCHAR 255)                                     │            ║
║  │ mensaje (TEXT)                                           │            ║
║  │ tipo (VARCHAR 50) - INDEXED                              │            ║
║  │   └─ Valores: cita, receta, resultado, sistema, farmacia │            ║
║  │ leida (BOOLEAN) DEFAULT FALSE - INDEXED                  │            ║
║  │ created_at (TIMESTAMP) DEFAULT NOW() - INDEXED           │            ║
║  │ id_relacionado (UUID) - FK opcional                      │            ║
║  └──────────────────────────────────────────────────────────┘            ║
║                                                                            ║
║  TABLE: historial_protecciones                                            ║
║  ┌──────────────────────────────────────────────────────────┐            ║
║  │ id (UUID) PRIMARY KEY                                    │            ║
║  │ id_paciente (INT) UNIQUE - INDEXED - REFERENCES pacientes│            ║
║  │ id_medico (INT) - INDEXED - REFERENCES medicos (nullable)│            ║
║  │ password_hash (VARCHAR 255) - bcryptjs hash              │            ║
║  │ created_at (TIMESTAMP)                                   │            ║
║  │ updated_at (TIMESTAMP)                                   │            ║
║  └──────────────────────────────────────────────────────────┘            ║
║                                                                            ║
║  TABLE: acceso_historial_logs                                             ║
║  ┌──────────────────────────────────────────────────────────┐            ║
║  │ id (UUID) PRIMARY KEY                                    │            ║
║  │ id_medico (INT) - INDEXED - REFERENCES medicos(id)       │            ║
║  │ id_paciente (INT) - INDEXED - REFERENCES pacientes(id)   │            ║
║  │ fecha_acceso (TIMESTAMP) DEFAULT NOW() - INDEXED         │            ║
║  │ tipo_acceso (VARCHAR 50) DEFAULT 'visualizar'            │            ║
║  │ ip_address (VARCHAR 45) - IPv4 o IPv6                    │            ║
║  │ descripcion (TEXT)                                       │            ║
║  └──────────────────────────────────────────────────────────┘            ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 🔄 FLUJOS DE DATOS

### 📋 FLUJO 1: Crear Cita → Notificación

```
Paciente en Dashboard
    ↓
[Agendar Cita]
    ↓
POST /api/citas/paciente
    ↓ (verificaciones, inserta en DB)
    ├─→ INSERT INTO citas (...)
    └─→ CALL fetch POST /api/citas/crear-notificacion
        ↓
        ├─→ Obtiene datos del paciente y médico
        ├─→ Genera título y mensaje
        └─→ INSERT INTO notificaciones
            ├─ Para paciente: "Nueva cita agendada"
            └─ Para médico: "Nueva cita de María García"
                ↓
    ↓
[30 segundos después]
    ↓
Polling: GET /api/notificaciones
    ├─→ Detecta notificación nueva
    ├─→ Reproduce sonido (Web Audio)
    ├─→ Muestra Toast visual
    └─→ Actualiza badge en navbar
```

### 💊 FLUJO 2: Crear Receta → Notificación

```
Médico en Dashboard
    ↓
[Ver paciente y crear receta]
    ↓
POST /api/recetas/crear
    ↓ (validaciones, inserta datos)
    ├─→ Genera código: REC-20251129-932593
    ├─→ INSERT INTO recetas
    ├─→ INSERT INTO receta_detalles (medicamentos)
    └─→ CALL fetch POST /api/recetas/crear-notificacion
        ↓
        ├─→ Obtiene datos del paciente
        ├─→ Obtiene datos del médico
        ├─→ Genera: "Nueva receta: código REC-..."
        └─→ INSERT INTO notificaciones (para paciente)
                ↓
    ↓
[30 segundos después]
    ↓
Polling: GET /api/notificaciones
    ├─→ Detecta notificación
    ├─→ ¡SONIDO! 🔊 (800Hz + 1000Hz)
    ├─→ Toast: "Nueva Receta" en verde
    └─→ Badge: +1 en navbar
```

### 🔐 FLUJO 3: Ver Historial Protegido

```
Médico en Dashboard/Paciente
    ↓
[Click en "Ver Historial"]
    ↓
Modal abre
    ↓
POST /api/medico/pacientes/[id]/historial-protegido (action: "check")
    ↓
¿Existe protección?
    ├─ NO → Mostrar opción de crear contraseña
    │       ↓
    │       Usuario ingresa contraseña (6+ caracteres)
    │       ↓
    │       POST action: "create"
    │       ├─→ Hash con bcryptjs (10 rounds)
    │       └─→ INSERT INTO historial_protecciones
    │
    └─ SÍ → Pedir contraseña
            ↓
            Usuario ingresa contraseña
            ↓
            POST action: "verify"
            ├─→ Compara con bcryptjs.compare()
            ├─→ Si válida: acceso otorgado
            ├─→ INSERT INTO acceso_historial_logs
            └─→ Mostrar historial completo
                ├─ Datos personales
                ├─ Antecedentes médicos
                ├─ Historial de citas
                ├─ Recetas activas
                └─ Exámenes de laboratorio
```

### 🔄 FLUJO 4: Cambio de Estado de Cita

```
Médico en Dashboard
    ↓
[Marca cita como completada]
    ↓
PUT /api/citas/[id]
    ├─→ UPDATE citas SET estado='completada'
    └─→ CALL fetch POST /api/citas/crear-notificacion
        │   (accion: "completar")
        ├─→ Notifica al paciente: "Tu cita fue completada"
        └─→ INSERT INTO notificaciones
                ↓
    ↓
[Polling detecta]
    ↓
Toast + Sonido + Badge se actualiza
```

---

## 🎯 RUTAS DE NOTIFICACIONES POR TIPO

```
┌─────────────────────────────────────────────────────────────────┐
│                   MAPA DE NOTIFICACIONES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🗓️  CITA                                                        │
│  ├─ Evento: Nueva cita creada                                   │
│  │  └─ Receptores: Paciente + Médico                            │
│  │  └─ Tipo: 'cita' (color azul)                               │
│  │                                                              │
│  ├─ Evento: Cita confirmada                                     │
│  │  └─ Receptor: Paciente                                      │
│  │  └─ Tipo: 'cita' (color azul)                               │
│  │                                                              │
│  ├─ Evento: Cita completada                                     │
│  │  └─ Receptor: Paciente                                      │
│  │  └─ Tipo: 'cita' (color azul)                               │
│  │                                                              │
│  └─ Evento: Cita cancelada                                      │
│     └─ Receptor: Paciente                                      │
│     └─ Tipo: 'cita' (color azul)                               │
│                                                                 │
│  💊 RECETA                                                      │
│  ├─ Evento: Nueva receta creada                                │
│  │  └─ Receptor: Paciente                                      │
│  │  └─ Tipo: 'receta' (color verde)                            │
│  │                                                              │
│  ├─ Evento: Receta enviada a farmacia                          │
│  │  └─ Receptores: Paciente + Farmacia                         │
│  │  └─ Tipo: 'farmacia' (color púrpura)                        │
│  │                                                              │
│  └─ Evento: Receta dispensada                                   │
│     └─ Receptor: Paciente                                      │
│     └─ Tipo: 'farmacia' (color púrpura)                        │
│                                                                 │
│  📋 RESULTADO                                                   │
│  ├─ Evento: Resultado disponible                               │
│  │  └─ Receptor: Paciente                                      │
│  │  └─ Tipo: 'resultado' (color naranja)                       │
│  │                                                              │
│  🧪 LABORATORIO                                                │
│  ├─ Evento: Examen completado                                  │
│  │  └─ Receptor: Paciente                                      │
│  │  └─ Tipo: 'laboratorio' (color rosa)                        │
│  │                                                              │
│  ⚙️  SISTEMA                                                     │
│  └─ Evento: Avisos del sistema                                 │
│     └─ Receptor: Depende del contexto                          │
│     └─ Tipo: 'sistema' (color gris)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 DETALLES TÉCNICOS

### Seguridad en Contraseña
```javascript
// Crear
const hash = await bcryptjs.hash(password, 10);
// Hash con 10 rounds (iteraciones)

// Verificar
const isValid = await bcryptjs.compare(inputPassword, storedHash);
```

### Sonido Generado
```javascript
// Web Audio API
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

// Primer tono: 800Hz por 100ms
oscillator.frequency.value = 800;
oscillator.start(currentTime);
oscillator.stop(currentTime + 0.1);

// Segundo tono: 1000Hz por 100ms (después)
oscillator2.frequency.value = 1000;
oscillator2.start(currentTime + 0.1);
oscillator2.stop(currentTime + 0.2);

// Fade out suave
gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.3);
```

### Polling
```javascript
// Cada 30 segundos
setInterval(() => {
  fetch("/api/notificaciones", {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    if (newCount > previousCount) {
      playSound();
      showToast();
    }
  });
}, 30000);
```

---

## ✅ LISTA DE VERIFICACIÓN ARQUITECTÓNICA

- [x] Frontend conecta con Backend vía HTTP
- [x] Backend conecta con BD vía PostgreSQL
- [x] Notificaciones se guardan en BD
- [x] Polling sincroniza estado del cliente
- [x] Sonido se genera sin dependencias externas
- [x] Alertas visuales aparecen correctamente
- [x] Contraseña se hashea antes de guardar
- [x] Logs de acceso se registran correctamente
- [x] No hay race conditions
- [x] No hay memory leaks
- [x] No hay SQL injection
- [x] Validaciones en cliente y servidor

---

*Última actualización: 29 de noviembre de 2025*
