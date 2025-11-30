# 🔔 DIAGRAMA VISUAL - FLUJO COMPLETO DE NOTIFICACIONES

## 📊 ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          NAVEGADOR DEL USUARIO                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  NotificacionesProvider (React Context)                         │  │
│  │  ├─ Estado: notificaciones[]                                    │  │
│  │  ├─ cargarNotificaciones(): GET /api/notificaciones cada 30s   │  │
│  │  ├─ playNotificationSound(): Web Audio API (800Hz + 1000Hz)    │  │
│  │  ├─ showNotificationToast(): Toast visual (esquina superior)    │  │
│  │  └─ useNotificaciones(): Hook para componentes                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Componentes que lo usan:                                       │  │
│  │  ├─ BotonNotificaciones: Muestra badge + abre modal            │  │
│  │  ├─ CentroNotificaciones: Modal con lista de todas             │  │
│  │  └─ Navbar: Badge con contador                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTP
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Node.js)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ POST /api/citas/route.ts                                        │  │
│  │ (Crear cita médica)                                             │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ 1. Verificar autenticación (JWT)                               │  │
│  │ 2. Validar datos (médico, fecha, hora)                         │  │
│  │ 3. INSERT cita en BD                                           │  │
│  │ 4. 🔔 POST /api/citas/crear-notificacion                       │  │
│  │    ├─ obtiene paciente_usuario_id                              │  │
│  │    ├─ INSERT notificaciones (tipo='cita')                      │  │
│  │    └─ ✅ Notificación guardada en BD                           │  │
│  │ 5. COMMIT transacción                                          │  │
│  │ 6. Retornar: {success, citaId}                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ POST /api/recetas/crear/route.ts                               │  │
│  │ (Crear receta médica con medicinas)                            │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ 1. Verificar autenticación (médico)                            │  │
│  │ 2. Validar datos (cita, medicamentos)                          │  │
│  │ 3. INSERT receta + medicinas en BD                             │  │
│  │ 4. 🔔 POST /api/recetas/crear-notificacion                     │  │
│  │    ├─ obtiene paciente_usuario_id (vía receta→cita→paciente)   │  │
│  │    ├─ INSERT notificaciones (tipo='receta')                    │  │
│  │    └─ ✅ Notificación guardada en BD                           │  │
│  │ 5. COMMIT transacción                                          │  │
│  │ 6. Retornar: {success, recetaId, codigoReceta}                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ GET /api/notificaciones (Polling cada 30s)                      │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ 1. Verificar JWT token                                         │  │
│  │ 2. SELECT * FROM notificaciones WHERE id_usuario = ?           │  │
│  │ 3. Map a formato frontend:                                     │  │
│  │    {id, titulo, mensaje, tipo, estado, timestamp, ...}         │  │
│  │ 4. Retornar: {notificaciones: [...]}                           │  │
│  │                                                                 │  │
│  │ Context detecta: count > previousCount?                        │  │
│  │ ├─ SÍ → playNotificationSound() + showNotificationToast()      │  │
│  │ └─ NO → Solo actualizar lista silenciosamente                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ PATCH /api/notificaciones/[id]                                  │  │
│  │ (Marcar notificación como leída)                                │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ 1. Verificar JWT token                                         │  │
│  │ 2. UPDATE notificaciones SET leida = true WHERE id = ?          │  │
│  │ 3. Verificar pertenencia al usuario                            │  │
│  │ 4. Retornar: {success: true}                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ DELETE /api/notificaciones/[id]                                 │  │
│  │ (Eliminar notificación)                                         │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ 1. Verificar JWT token                                         │  │
│  │ 2. DELETE FROM notificaciones WHERE id = ? AND id_usuario = ?   │  │
│  │ 3. Retornar: {success: true}                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕ SQL
┌─────────────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL DATABASE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Table: notificaciones                                                 │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ id (UUID)         | id_usuario (UUID) | titulo | mensaje       │   │
│  │ tipo (VARCHAR)    | leida (BOOLEAN)   | created_at (TIMESTAMP)│   │
│  │ id_relacionado (UUID) - FK a citas/recetas                     │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │ Row 1: cita_uuid  | paciente_uuid    | "📅 Nueva Cita..."     │   │
│  │        tipo='cita' | leida=false      | 2025-11-29 14:32:00   │   │
│  │ Row 2: receta_uuid| paciente_uuid    | "📋 Nueva Receta..."  │   │
│  │        tipo='receta'| leida=false     | 2025-11-29 14:33:15   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 SECUENCIA TEMPORAL - FLUJO COMPLETO

```
TIMELINE: Cuando un paciente crea cita y médico crea receta

T+0s   PACIENTE abre navegador
       └─ NotificacionesProvider se monta
          └─ Inicia polling GET /api/notificaciones cada 30s
          └─ previousCount = 0

T+5s   PACIENTE clica "Agendar cita"
       └─ POST /api/citas
          └─ Cita insertada ✅
          └─ Llama POST /api/citas/crear-notificacion
             ├─ INSERT notificaciones tabla
             ├─ titulo: "📅 Nueva Cita Programada"
             ├─ mensaje: "Tu cita con Dr. Juan..."
             └─ ✅ Notificación en BD

T+6s   MÉDICO abre su dashboard
       └─ Accede a cita pendiente
       └─ Agrega diagnóstico + medicamentos
       └─ POST /api/recetas/crear
          └─ Receta + medicinas insertadas ✅
          └─ Llama POST /api/recetas/crear-notificacion
             ├─ INSERT notificaciones tabla
             ├─ tipo: "receta"
             ├─ titulo: "📋 Nueva Receta"
             └─ ✅ Notificación en BD (ahora hay 2)

T+30s  (POLLING AUTOMÁTICO) 
       GET /api/notificaciones
       ├─ SELECT * FROM notificaciones WHERE id_usuario = paciente_id
       ├─ result.rows = 2 notificaciones
       ├─ currentCount = 2, previousCount = 0
       ├─ 2 > 0 → TRUE
       ├─ 🔊 playNotificationSound()
       │  ├─ Frequency 800Hz por 100ms
       │  ├─ Frequency 1000Hz por 100ms
       │  └─ Fade out 300ms
       ├─ 🎨 showNotificationToast()
       │  ├─ Toast azul (cita)
       │  └─ Toast verde (receta)
       ├─ Estado actualizado: notificaciones = [2 items]
       └─ Badge muestra "2"

T+31s  USUARIO ve en pantalla:
       ├─ 🔊 Escucha sonido
       ├─ 🎨 Ve dos toasts (azul + verde)
       ├─ 📱 Badge muestra "2"
       ├─ Click badge → abre modal
       ├─ Centro de notificaciones muestra:
       │  1. 📅 Nueva Cita Programada (2025-11-29 14:32:00)
       │  2. 📋 Nueva Receta (2025-11-29 14:33:15)
       └─ Click en notificación → PATCH /api/notificaciones/[id]
          ├─ UPDATE leida = true
          └─ Badge actualiza a "1"
```

---

## 🎨 INTERFAZ VISUAL DEL USUARIO

```
NAVBAR
┌─────────────────────────────────────────────────────────────────┐
│ 🔔 [2]  👤 María García                                    Salir │
└─────────────────────────────────────────────────────────────────┘
                    ↓ CLICK
         ┌─────────────────────────┐
         │ CENTRO DE NOTIFICACIONES │
         ├─────────────────────────┤
         │                         │
         │ ❌ Marcar todo leído    │
         │                         │
         │ ┌───────────────────────┐
         │ │ 📅 Nueva Cita...     │
         │ │ Tu cita con Dr. Juan │
         │ │ 29 nov, 14:32        │ ← Click = Marcar leída
         │ └───────────────────────┘
         │ ┌───────────────────────┐
         │ │ 📋 Nueva Receta...   │
         │ │ Dr. Juan ha emitido  │
         │ │ 29 nov, 14:33        │ ← Click = Marcar leída
         │ └───────────────────────┘
         │                         │
         └─────────────────────────┘
```

---

## 📱 TOASTS VISUALES

### Cuando se crea una CITA (Azul)
```
┌─────────────────────────────┐
│ 📅 Nueva Cita Programada    │  ← Azul (#3b82f6)
│ Tu cita con Dr. Juan...      │
│                              │  ← Auto-desaparece en 5s
└─────────────────────────────┘
Posición: Top-right, fixed
```

### Cuando se crea una RECETA (Verde)
```
┌─────────────────────────────┐
│ 📋 Nueva Receta             │  ← Verde (#10b981)
│ Dr. Juan ha emitido...      │
│                              │  ← Auto-desaparece en 5s
└─────────────────────────────┘
Posición: Top-right, fixed
```

---

## 🔊 SONIDO - ESPECIFICACIONES TÉCNICAS

```
Web Audio API Implementation
┌──────────────────────────────────┐
│ AudioContext creado              │
│                                  │
│ Oscillator 1:                    │
│  ├─ Frequency: 800 Hz            │
│  ├─ Duración: 100ms              │
│  ├─ Gain: 0.3 (volumen)         │
│  └─ Timeline: T+0ms → T+100ms    │
│                                  │
│ Oscillator 2:                    │
│  ├─ Frequency: 1000 Hz           │
│  ├─ Duración: 100ms              │
│  ├─ Gain: 0.3 (volumen)         │
│  └─ Timeline: T+100ms → T+200ms  │
│                                  │
│ Fade out:                        │
│  ├─ Gain: 0.3 → 0               │
│  └─ Timeline: T+100ms → T+400ms  │
└──────────────────────────────────┘

Resultado: "Bip-bop" distintivo sin archivos externos
```

---

## 💾 ESTRUCTURA DE BASE DE DATOS

```
TABLE: notificaciones
┌────────────────────┬──────────────┬─────────────────────┐
│ Column             │ Type         │ Notes               │
├────────────────────┼──────────────┼─────────────────────┤
│ id                 │ UUID         │ PK                  │
│ id_usuario         │ UUID         │ FK → usuarios(id)   │
│ titulo             │ VARCHAR(255) │ Ej: "📅 Nueva Cita" │
│ mensaje            │ TEXT         │ Descripción larga   │
│ tipo               │ VARCHAR(50)  │ cita|receta|...     │
│ leida              │ BOOLEAN      │ false por defecto   │
│ id_relacionado     │ UUID         │ FK a cita/receta    │
│ created_at         │ TIMESTAMP    │ NOW()               │
└────────────────────┴──────────────┴─────────────────────┘

ÍNDICES
├─ idx_notificaciones_usuario (id_usuario, leida)
├─ idx_notificaciones_created_at (created_at DESC)
└─ idx_notificaciones_tipo (tipo)
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Endpoints GET/POST/PATCH/DELETE funcionan
- [x] Conexiones a BD se liberan correctamente
- [x] Notificaciones se insertan en tabla
- [x] Polling detecta cambios cada 30s
- [x] Web Audio API reproduce sonido
- [x] Toast visual aparece y desaparece
- [x] Badge se actualiza correctamente
- [x] Marcar como leído funciona
- [x] 0 errores de compilación
- [x] Sin joder el código existente

---

**Diagrama creado:** 29 de noviembre de 2025  
**Estado:** ✅ Sistema 100% operacional

