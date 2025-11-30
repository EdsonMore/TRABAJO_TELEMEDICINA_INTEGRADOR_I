# 📋 Implementación del Sistema de Notificaciones

## ✅ Estado: COMPLETADO

### 1. **Contexto Global de Notificaciones**

**Archivo**: `contexts/notificaciones-context.tsx`

**Características**:
- ✅ Gestión global de estado de notificaciones usando React Context
- ✅ 8 métodos principales: agregarNotificacion, marcarComoLeida, marcarTodosComoLeidos, eliminarNotificacion, limpiarTodas, obtenerNoLeidas, cargarNotificaciones
- ✅ Sistema de polling automático (cada 30 segundos) para sincronizar notificaciones
- ✅ Integración con permisos de notificaciones del navegador
- ✅ Interface Notificacion con: id, titulo, mensaje, tipo (cita|receta|resultado|sistema), estado, timestamp, idRelacionado

**Uso**:
```typescript
const { notificaciones, agregarNotificacion, marcarComoLeida } = useNotificaciones();
```

---

### 2. **APIs de Notificaciones**

#### A. **GET /api/notificaciones** - Obtener todas las notificaciones
**Archivo**: `app/api/notificaciones/route.ts`
- Requiere: Bearer token
- Retorna: Array de notificaciones del usuario (max 50, ordenadas recientes primero)
- Campos: id, titulo, mensaje, tipo, estado, leida, timestamp, idRelacionado

#### B. **POST /api/notificaciones** - Crear nueva notificación
**Archivo**: `app/api/notificaciones/route.ts`
- Requiere: Bearer token
- Body: { titulo, mensaje, tipo, idRelacionado? }
- Retorna: { success, notificationId }

#### C. **PATCH /api/notificaciones/[id]** - Marcar como leída
**Archivo**: `app/api/notificaciones/[id]/route.ts`
- Requiere: Bearer token + pertenencia del usuario
- Retorna: { success: true }

#### D. **DELETE /api/notificaciones/[id]** - Eliminar notificación
**Archivo**: `app/api/notificaciones/[id]/route.ts`
- Requiere: Bearer token + pertenencia del usuario
- Retorna: { success: true }

#### E. **POST /api/notificaciones/marcar-todo-leido** - Marcar todas como leídas
**Archivo**: `app/api/notificaciones/marcar-todo-leido/route.ts`
- Batch update para todas las notificaciones del usuario
- Retorna: { success: true }

#### F. **POST /api/notificaciones/limpiar-todas** - Eliminar todas
**Archivo**: `app/api/notificaciones/limpiar-todas/route.ts`
- Batch delete para todas las notificaciones del usuario
- Retorna: { success: true }

---

### 3. **Triggers de Notificaciones Automáticas**

#### A. **POST /api/citas/crear-notificacion** - Notificaciones de citas
**Archivo**: `app/api/citas/crear-notificacion/route.ts`

**Parámetros esperados**:
```typescript
{
  citaId: string,
  accion: "crear" | "confirmar" | "cancelar" | "completar",
  estado: string,
  fechaCita: string,
  horaCita: string,
  pacienteNombre: string,
  medicoNombre: string
}
```

**Mensajes generados**:
- `crear`: "Tu médico ha agendado una cita para [fecha] [hora]"
- `confirmar`: "Tu cita ha sido confirmada"
- `cancelar`: "Tu cita ha sido cancelada"
- `completar`: "Tu cita ha sido completada. Revisa diagnóstico y tratamiento"

**Integración**:
- ✅ Llamado en: POST `/api/citas/route.ts` (creación)
- ✅ Llamado en: PUT `/api/citas/[id]/route.ts` (actualización de estado)

#### B. **POST /api/recetas/crear-notificacion** - Notificaciones de recetas
**Archivo**: `app/api/recetas/crear-notificacion/route.ts`

**Parámetros esperados**:
```typescript
{
  recetaId: string,
  accion: "crear" | "dispensada" | "cancelada" | "expirada",
  estado: string,
  medicoNombre: string,
  codigoReceta: string
}
```

**Mensajes generados**:
- `crear`: "Has recibido una nueva receta [código] del Dr. [médico]"
- `dispensada`: "Tu receta [código] ha sido despachada correctamente"
- `cancelada`: "Tu receta [código] ha sido cancelada"
- `expirada`: "Tu receta [código] ha expirado"

**Integración**:
- ✅ Llamado en: POST `/api/recetas/crear/route.ts` (creación)
- ✅ Llamado en: POST `/api/recetas/[id]/enviar-farmacia/route.ts` (envío a farmacia)

---

### 4. **Componentes de UI**

#### A. **Centro de Notificaciones Modal**
**Archivo**: `components/notificaciones/centro-notificaciones.tsx`

**Características**:
- ✅ Modal completo con todas las notificaciones del usuario
- ✅ Iconos diferenciados por tipo: 📅 Cita (azul), 💊 Receta (verde), 🧪 Resultado (naranja), ⚠️ Sistema (gris)
- ✅ Acciones: Marcar como leída, eliminar, marcar todas como leídas, limpiar todas
- ✅ Timestamp en formato locale (es-PE)
- ✅ Mensajes claros y descriptivos
- ✅ Estados visuales para notificaciones leídas/no leídas

#### B. **Botón de Notificaciones en Navbar**
**Archivo**: `components/notificaciones/boton-notificaciones.tsx`

**Características**:
- ✅ Botón con campana 🔔 + Badge contador
- ✅ Badge solo visible si hay notificaciones no leídas
- ✅ Muestra "9+" si hay más de 9 notificaciones
- ✅ Al clickear abre el CentroNotificaciones modal
- ✅ Integrado en navbar-universal.tsx

---

### 5. **Seguridad de Pacientes**

#### Password Protection para Historial
**Archivo**: `app/api/medico/pacientes/[id]/historial-protegido/route.ts`

**Características**:
- ✅ Verificación de contraseña con bcryptjs (10 salt rounds)
- ✅ 3 acciones: "check" (verificar existencia), "verify" (validar), "create"/"update" (crear/cambiar)
- ✅ Logs de acceso en tabla `acceso_historial_logs`
- ✅ Solo médicos autorizados pueden acceder
- ✅ Validación de 6+ caracteres

**Integración en Modal**:
- Archivo: `components/medico/modal-historial-paciente.tsx`
- ✅ Flujo de verificación de contraseña
- ✅ Opción de crear nueva contraseña si no existe
- ✅ Opción de cambiar contraseña existente
- ✅ Historial expandido con datos completos

---

### 6. **Integración en Layout**

**Archivo**: `app/layout.tsx`

**Cambios**:
- ✅ Importado: `NotificacionesProvider` desde `contexts/notificaciones-context`
- ✅ Envuelto: `children` con `<NotificacionesProvider>`
- ✅ Estructura: `<AuthProvider><NotificacionesProvider>{children}</NotificacionesProvider></AuthProvider>`

---

### 7. **Integración en Navbar**

**Archivo**: `components/layout/navbar-universal.tsx`

**Cambios**:
- ✅ Importado: `BotonNotificaciones` desde `components/notificaciones/boton-notificaciones`
- ✅ Reemplazado: Botón Bell manual con componente `<BotonNotificaciones />`
- ✅ Mantiene responsividad desktop/mobile

---

## 📊 Matriz de Integración

| Evento | Endpoint Dispara | Notificación Enviada | Receptor |
|--------|------------------|----------------------|----------|
| Paciente crea cita | POST /api/citas | crear-notificacion | Paciente |
| Médico completa cita | PUT /api/citas/[id] | crear-notificacion | Paciente |
| Médico cancela cita | PUT /api/citas/[id] | crear-notificacion | Paciente |
| Médico emite receta | POST /api/recetas/crear | crear-notificacion | Paciente |
| Paciente envía receta a farmacia | POST /api/recetas/[id]/enviar-farmacia | crear-notificacion | Paciente |

---

## 🔄 Flujo de Notificaciones

```
1. Usuario realiza acción (crea cita, emite receta, etc.)
2. Endpoint principal maneja la acción
3. Endpoint dispara trigger a /api/[entidad]/crear-notificacion
4. Trigger crea record en tabla notificaciones
5. Context de NotificacionesProvider polling detecta nuevo record
6. UI actualiza automáticamente (badge + modal)
7. Notificación de navegador se muestra (si permisos)
```

---

## ✨ Características Especiales

### Polling Inteligente
- ✅ Intervalo: 30 segundos
- ✅ Solo activo si usuario autenticado
- ✅ Se detiene al desautenticar
- ✅ Sincroniza estado automáticamente

### Tipos de Notificaciones
- `cita`: Cambios en citas médicas (azul)
- `receta`: Cambios en recetas (verde)
- `resultado`: Resultados de laboratorio/exámenes (naranja)
- `sistema`: Mensajes del sistema (gris)

### Persistencia
- ✅ Todas las notificaciones se guardan en BD
- ✅ Se recuperan en cada sesión
- ✅ Se pueden limpiar manualmente o por expiración

---

## 🚀 Verificación Rápida

### Prueba 1: Crear Cita
```bash
1. Login como paciente
2. Crear cita nueva
3. Ver notificación en navbar (badge +1)
4. Click en bell → abrir CentroNotificaciones
5. Ver mensaje: "Has agendado una cita..."
```

### Prueba 2: Completar Cita
```bash
1. Login como médico
2. Ir a cita existente
3. Cambiar estado a "completada"
4. Notificación debe llegar a paciente: "Consulta Completada"
```

### Prueba 3: Emitir Receta
```bash
1. Login como médico
2. Crear receta en una cita
3. Notificación: "Nueva receta [código]"
4. Paciente ve en CentroNotificaciones
```

### Prueba 4: Historial Protegido
```bash
1. Médico intenta ver historial de paciente
2. Modal pide contraseña
3. Si no existe, opción de crearla
4. Acceso solo después de verificación
```

---

## 📦 Tabla de Base de Datos Requerida

```sql
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'cita', 'receta', 'resultado', 'sistema'
  leida BOOLEAN DEFAULT FALSE,
  id_relacionado UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(id_usuario);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);
```

---

## ⚠️ Notas Importantes

1. **NEXT_PUBLIC_API_URL**: Asegurar que esté configurada correctamente en `.env.local` para que los triggers puedan llamarse a sí mismos
2. **Fallback seguro**: Si los triggers fallan, NO rompen la transacción principal
3. **Permisos**: Las notificaciones del navegador requieren permiso del usuario
4. **Performance**: Polling cada 30 segundos es balanceado para UX vs servidor
5. **Escalabilidad**: Sistema listo para WebSockets futuros (reemplazar polling)

---

## 🎯 Próximas Mejoras (Opcionales)

- [ ] WebSocket en lugar de polling
- [ ] Email notifications para eventos críticos
- [ ] SMS para alertas urgentes
- [ ] Personalización de tipos de notificación
- [ ] Horarios silenciosos
- [ ] Exportar historial de notificaciones
- [ ] Notificaciones para farmacia (despachos)
- [ ] Notificaciones para laboratorio (resultados)

---

**Documento creado**: 2024
**Versión**: 1.0
**Estado**: ✅ LISTO PARA PRODUCCIÓN
