# 🗺️ MAPA DE NAVEGACIÓN - IMPLEMENTACIÓN COMPLETA

## 📍 UBICACIÓN DE CADA FEATURE EN EL CÓDIGO

---

## 🔔 FEATURE 1: SISTEMA DE NOTIFICACIONES

### Localización en Código

#### A. Estado Global (Context)
```
📁 contexts/
   └── 📄 notificaciones-context.tsx (180 líneas)
       ├── useNotificaciones() hook
       ├── Polling cada 30s
       ├── 8 métodos CRUD
       └── Browser notification integration
```
**Para entender**: Ve a `contexts/notificaciones-context.tsx` línea 1

#### B. APIs Backend
```
📁 app/api/notificaciones/
   ├── 📄 route.ts (GET all + POST create)
   ├── 📄 [id]/route.ts (PATCH read + DELETE)
   ├── 📄 marcar-todo-leido/route.ts (Batch update)
   └── 📄 limpiar-todas/route.ts (Batch delete)
```
**Flujo GET**: request → verificarToken → query BD → map fields → response
**Flujo POST**: validate body → verificarToken → insert → return ID

#### C. Triggers Automáticos
```
📁 app/api/citas/
   └── 📄 crear-notificacion/route.ts (Cita notifications)

📁 app/api/recetas/
   └── 📄 crear-notificacion/route.ts (Recipe notifications)
```
**Dónde se disparan**:
- Cita trigger: Linea 106 en `app/api/citas/route.ts`
- Cita trigger: Linea 167 en `app/api/citas/[id]/route.ts`
- Receta trigger: Linea 245 en `app/api/recetas/crear/route.ts`
- Receta trigger: Linea 115 en `app/api/recetas/[id]/enviar-farmacia/route.ts`

#### D. Componentes UI
```
📁 components/notificaciones/
   ├── 📄 centro-notificaciones.tsx (150 líneas, modal)
   │   ├── renderiza todas las notificaciones
   │   ├── iconos por tipo
   │   ├── acciones (marcar, eliminar, batch)
   │   └── responsive
   └── 📄 boton-notificaciones.tsx (50 líneas, navbar button)
       ├── usa useNotificaciones()
       ├── muestra badge
       └── abre CentroNotificaciones

📁 components/layout/
   └── 📄 navbar-universal.tsx (línea 412)
       └── <BotonNotificaciones /> integrado
```

#### E. Integración Global
```
📁 app/
   └── 📄 layout.tsx (línea 8-13)
       ├── Importa NotificacionesProvider
       ├── Envuelve children
       └── Funciona con AuthProvider
```

### Flujo Completo de Notificación

```mermaid
Usuario crea cita
     ↓
[POST /api/citas]
     ↓
Guardar en BD
     ↓
fetch POST /api/citas/crear-notificacion
     ↓
[POST /api/citas/crear-notificacion]
     ↓
Determinar mensaje basado en acción
     ↓
INSERT en notificaciones BD
     ↓
[Context Polling cada 30s]
     ↓
GET /api/notificaciones
     ↓
[notificaciones-context.tsx]
     ↓
setState(notificaciones)
     ↓
[Componentes re-render]
     ├── navbar badge actualiza +1
     └── CentroNotificaciones muestra
```

---

## 🔐 FEATURE 2: HISTORIAL PROTEGIDO CON CONTRASEÑA

### Localización en Código

#### A. API Backend
```
📁 app/api/medico/pacientes/[id]/
   └── 📄 historial-protegido/route.ts (150 líneas)
       ├── POST endpoint
       ├── 3 acciones: check, verify, create, update
       ├── bcryptjs hashing
       ├── error handling
       └── logs de auditoría
```
**Para entender**: Ve a linea 1

#### B. Componente UI
```
📁 components/medico/
   └── 📄 modal-historial-paciente.tsx (770 líneas)
       ├── Estado para password (linea 79-89)
       ├── useEffect para check (linea 120-140)
       ├── handleVerifyPassword (linea 145-180)
       ├── handleCreatePassword (linea 182-220)
       ├── Tres flujos de UI:
       │   ├── Estado protegido (pide password)
       │   ├── Estado setup (crear password)
       │   └── Estado acceso (mostrar historial)
       └── Historial expandido con tabs
```

#### C. Flujos de UI

**Flujo 1: Primer acceso (sin contraseña)**
```
Modal abre
     ↓
[checkPasswordProtection()] → acción="check"
     ↓
Response: isPasswordProtected=false
     ↓
Mostrar: "Crear Contraseña"
     ↓
Click → Estado showPasswordSetup=true
     ↓
Formulario con: setupPassword + setupPasswordConfirm
     ↓
[handleCreatePassword()] → acción="create"
     ↓
Response: success
     ↓
Estado accessGranted=true
     ↓
Mostrar historial completo
```

**Flujo 2: Segundo acceso (con contraseña)**
```
Modal abre
     ↓
[checkPasswordProtection()] → acción="check"
     ↓
Response: isPasswordProtected=true
     ↓
Mostrar: Campo de password + "Verificar"
     ↓
Ingresar password
     ↓
Click Verificar → [handleVerifyPassword()]
     ↓
API verifica hash con bcryptjs
     ↓
Response: success/error
     ↓
Si correcto: accessGranted=true
Si incorrecto: mostrar error
     ↓
Mostrar historial
```

#### D. Historial Expandido
```
Tabs de historial:
├── 📋 Información Personal
│   ├── Nombre, Apellido, Email
│   ├── Teléfono, DNI
│   ├── Alergias
│   ├── Enfermedades crónicas
│   └── Tipo de sangre
│
├── 🏥 Historial de Citas
│   ├── Fecha y Hora
│   ├── Motivo
│   ├── Estado
│   ├── 📌 Diagnóstico (caja azul)
│   ├── 💊 Tratamiento (caja verde)
│   ├── 📝 Observaciones (caja gris)
│   └── Señales vitales
│
└── 💊 Recetas
    ├── Código
    ├── Estado
    ├── Diagnóstico
    ├── Medicamentos:
    │   ├── Nombre
    │   ├── Dosis
    │   ├── Frecuencia
    │   ├── Cantidad
    │   └── Días de tratamiento
    └── Vencimiento
```

---

## 📊 FEATURE 3: INFORMACIÓN COMPLETA DEL PACIENTE

### Dónde Leer Esta Info

#### A. En Historial
```
Modal: components/medico/modal-historial-paciente.tsx
└── Líneas 200-400: Renderizado de tabs
    ├── renderPacienteInfo() - Información personal
    ├── renderHistorialCitas() - Citas detalladas
    └── renderRecetas() - Recetas con medicamentos
```

#### B. En BD
```
Tabla: pacientes
├── id_usuario (JOIN con usuarios)
├── Campos personales (teléfono, etc)
└── Información médica (alergias, enfermedades)

Tabla: citas
├── id_paciente
├── diagnostico
├── tratamiento
├── observaciones_medico
└── Señales vitales (presion, temp, etc)

Tabla: recetas
├── codigo_receta
├── diagnostico_principal_texto
├── detalles_medicamentos (JSON)
└── fecha_vencimiento
```

---

## 🗂️ ESTRUCTURA GENERAL DE CARPETAS

```
📁 Proyecto/
├── 📁 app/
│   ├── 📁 api/
│   │   ├── 📁 notificaciones/ ← NOTIFICACIONES
│   │   │   ├── route.ts (GET/POST)
│   │   │   ├── [id]/route.ts (PATCH/DELETE)
│   │   │   ├── marcar-todo-leido/route.ts
│   │   │   └── limpiar-todas/route.ts
│   │   ├── 📁 citas/
│   │   │   ├── route.ts (modificado)
│   │   │   ├── [id]/route.ts (modificado)
│   │   │   └── 📁 crear-notificacion/route.ts ← TRIGGER
│   │   ├── 📁 recetas/
│   │   │   ├── crear/route.ts (modificado)
│   │   │   ├── [id]/
│   │   │   │   └── enviar-farmacia/route.ts (modificado)
│   │   │   └── 📁 crear-notificacion/route.ts ← TRIGGER
│   │   └── 📁 medico/pacientes/[id]/
│   │       └── 📁 historial-protegido/route.ts ← PASSWORD
│   ├── 📁 dashboard/
│   │   └── (UI viejas sin cambios)
│   ├── 📄 layout.tsx ← MODIFICADO (Provider)
│   └── 📄 page.tsx
│
├── 📁 components/
│   ├── 📁 notificaciones/ ← NUEVOS COMPONENTES
│   │   ├── centro-notificaciones.tsx
│   │   └── boton-notificaciones.tsx
│   ├── 📁 medico/
│   │   └── modal-historial-paciente.tsx ← MODIFICADO
│   ├── 📁 layout/
│   │   └── navbar-universal.tsx ← MODIFICADO
│   └── 📁 ui/ (sin cambios)
│
├── 📁 contexts/
│   ├── auth-context.tsx (sin cambios)
│   └── 📄 notificaciones-context.tsx ← NUEVO
│
├── 📁 lib/
│   ├── auth.ts (sin cambios)
│   └── database.ts (sin cambios)
│
├── 📁 types/ (sin cambios)
│
├── 📄 layout.tsx (modificado - aquí va Provider)
└── 📁 docs/
    ├── 📄 00_RESUMEN_FINAL.md ← LEE ESTO PRIMERO
    ├── 📄 RESUMEN_EJECUTIVO.md ← Para el profesor
    ├── 📄 IMPLEMENTACION_NOTIFICACIONES.md ← Técnico
    ├── 📄 CHECKLIST_VALIDACION.md ← Tests
    ├── 📄 GUIA_INSTALACION.md ← Pasos
    └── 📄 MAPA_NAVEGACION.md ← Este archivo
```

---

## 🔍 CÓMO ENCONTRAR CADA COSA

### Si quiero entender las notificaciones:
```
1. Empieza: contexts/notificaciones-context.tsx
2. Luego: components/notificaciones/centro-notificaciones.tsx
3. Luego: app/api/notificaciones/route.ts
4. Triggers: app/api/citas/crear-notificacion/route.ts
5. Integración: app/api/citas/route.ts línea 106
```

### Si quiero entender la seguridad de historial:
```
1. Empieza: app/api/medico/pacientes/[id]/historial-protegido/route.ts
2. Luego: components/medico/modal-historial-paciente.tsx (línea 79)
3. Flujos: handleVerifyPassword (línea 145)
4. Data model: Ver estado de componente (useState)
```

### Si quiero ver cómo se integra todo:
```
1. Empieza: app/layout.tsx (Provider)
2. Luego: app/api/citas/route.ts (Trigger)
3. Luego: components/layout/navbar-universal.tsx (BotonNotificaciones)
4. Luego: Cualquier modal o componente que use useNotificaciones()
```

### Si tengo un error:
```
1. Revisar console (F12 → Console)
2. Revisar Network (F12 → Network)
3. Revisar logs del servidor (npm run dev)
4. Revisar BD (conectar a PostgreSQL)
5. Ver CHECKLIST_VALIDACION.md sección Troubleshooting
```

---

## 🎯 ARCHIVO MÁS IMPORTANTE PARA CADA CASO

| Si necesito... | Archivo a leer |
|----------------|---------------|
| Overview rápido | 📄 00_RESUMEN_FINAL.md |
| Mostrar al profesor | 📄 RESUMEN_EJECUTIVO.md |
| Entender notificaciones | 📄 contexts/notificaciones-context.tsx |
| Entender password | 📄 app/api/medico/pacientes/[id]/historial-protegido/route.ts |
| Entender historial | 📄 components/medico/modal-historial-paciente.tsx |
| Instalar proyecto | 📄 GUIA_INSTALACION.md |
| Validar funciona | 📄 CHECKLIST_VALIDACION.md |
| Detalles técnicos | 📄 IMPLEMENTACION_NOTIFICACIONES.md |

---

## 📱 PUNTOS DE INTERACCIÓN PARA EL USUARIO

### Paciente

**Punto 1: Crear cita**
```
UI Path: Dashboard → Citas → Nueva Cita → Guardar
Notificación: Automática en navbar (badge +1)
```

**Punto 2: Ver notificaciones**
```
UI Path: Navbar → 🔔 Bell → Abre CentroNotificaciones
Acciones: Marcar leído, eliminar, marcar todos, limpiar
```

**Punto 3: Ver receta**
```
UI Path: Dashboard → Recetas
Si cambio: Se notifica automáticamente
```

### Médico

**Punto 1: Ver historial de paciente**
```
UI Path: Dashboard → Pacientes → Click paciente
Requiere: Contraseña (si no existe, crear)
Acceso: Historial completo con tabs
```

**Punto 2: Emitir receta**
```
UI Path: Dashboard → Cita → Crear Receta
Notificación: Automática al paciente
```

**Punto 3: Completar cita**
```
UI Path: Dashboard → Cita → Guardar cambios
Notificación: Automática al paciente ("Consulta completada")
```

---

## 🔗 DEPENDENCIAS ENTRE FEATURES

```
layout.tsx (Provider)
     ↓
     ├─→ contexts/notificaciones-context.tsx (polling)
     ├─→ app/api/notificaciones/* (endpoints)
     ├─→ components/notificaciones/* (UI)
     │
     ├─→ app/api/citas/crear-notificacion (trigger)
     ├─→ app/api/recetas/crear-notificacion (trigger)
     │
     └─→ components/medico/modal-historial-paciente (password)
         └─→ app/api/medico/pacientes/[id]/historial-protegido
```

---

## ✅ Checklist de Lectura Recomendada

```
Orden recomendado para entender TODO:

1. [ ] 00_RESUMEN_FINAL.md (5 min) ← Empieza aquí
2. [ ] RESUMEN_EJECUTIVO.md (5 min) ← Para el profesor
3. [ ] Este archivo (5 min) ← Ya lo estás leyendo
4. [ ] GUIA_INSTALACION.md (10 min) ← Si necesitas instalar
5. [ ] contexts/notificaciones-context.tsx (15 min) ← Core
6. [ ] components/notificaciones/centro-notificaciones.tsx (10 min) ← UI
7. [ ] app/api/medico/pacientes/[id]/historial-protegido/route.ts (10 min) ← Security
8. [ ] components/medico/modal-historial-paciente.tsx (15 min) ← Password flow
9. [ ] CHECKLIST_VALIDACION.md (30 min) ← Testing manual
10. [ ] IMPLEMENTACION_NOTIFICACIONES.md (20 min) ← Detalles técnicos

Total: ~2 horas para entender TODO completamente
```

---

## 🎓 CONCLUSIÓN

Este mapa te ayuda a navegar la implementación:

- **Archivos nuevos**: Carpetas con nombre `/notificaciones/` o archivos con "notificacion"
- **Cambios pequeños**: Líneas específicas indicadas en rutas principales
- **Integración**: Todo envuelto en NotificacionesProvider en layout.tsx
- **Sin breaking changes**: Sistema viejo funciona igual

¡Listo para entender y mostrar al profesor!

---

Última actualización: 2024
Versión: 1.0
