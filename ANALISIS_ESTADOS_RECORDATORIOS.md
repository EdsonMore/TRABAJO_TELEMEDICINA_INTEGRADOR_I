# 🔍 ANÁLISIS: ESTADOS DE CITAS Y RECORDATORIOS

**Fecha:** 30 de noviembre 2025  
**Problema Identificado:** 
1. Estados de citas confusos (programada vs confirmada)
2. `recordatorio_enviado` siempre FALSE
3. Falta coherencia entre notificaciones y recordatorios

---

## 📊 ESTADO ACTUAL (Según BD)

```
Estado de cita          | Significado
-----------------------|------------------------------------
programada (DEFAULT)    | Cita creada, pago pendiente
confirmada              | Pago completado, cita confirmada
en_curso                | Se está realizando la cita
completada              | Cita finalizada
cancelada               | Cita cancelada por paciente/médico
no_asistio              | Paciente no asistió
```

**Columna `recordatorio_enviado`:** SIEMPRE FALSE (nunca se actualiza)

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. `recordatorio_enviado` NUNCA se actualiza a TRUE
**Ubicación:** Tabla `citas` - línea 220 en script-completo.sql  
**Estado Actual:** Siempre `DEFAULT false`  
**Problema:** No hay UPDATE que lo cambie a TRUE  
**Debería:** Cambiar a TRUE cuando se envía la notificación de la cita

### 2. Estados sin coherencia
**Flujo actual:**
```
1. Paciente crea cita → estado = 'programada' (creada en BD)
2. Notificación se envía → recordatorio_enviado = FALSE ❌
3. Paciente paga → estado = 'confirmada' ✅
```

**Problema:** Notificación se envía cuando aún `recordatorio_enviado = false`

### 3. Lógica de notificaciones sin referencia al estado
**Archivo:** `/app/api/citas/crear-notificacion/route.ts`  
**Problema:** Crea notificación pero NO actualiza `recordatorio_enviado`

---

## ✅ SOLUCIÓN PROPUESTA

### Cambio #1: Actualizar `recordatorio_enviado` al crear notificación

**Archivo:** `app/api/citas/crear-notificacion/route.ts`  
**Línea:** Después de INSERT en notificaciones (aproximadamente línea 80)

```typescript
// Después de crear la notificación, actualizar recordatorio_enviado
const updateResult = await client.query(
  `UPDATE citas SET recordatorio_enviado = true WHERE id = $1`,
  [citaId]
);
```

### Cambio #2: Coherencia de estados

**Estado actual - CORRECTO:**
```
1. Crear cita → estado = 'programada'
2. Enviar notificación → recordatorio_enviado = true ✅ (con cambio)
3. Procesar pago → estado = 'confirmada' + pagado = true ✅
4. Realizar cita → estado = 'completada' (si médico marca)
5. Cancelar → estado = 'cancelada'
6. No asistió → estado = 'no_asistio'
```

### Cambio #3: Auditar otros endpoints de notificaciones

**Verificar que en TODOS estos archivos se actualice `recordatorio_enviado`:**
- ✅ `app/api/citas/crear-notificacion/route.ts` - Notif de cita creada
- `app/api/citas/[id]/route.ts` - Notif de cambio de estado
- `app/api/recetas/crear-notificacion/route.ts` - Notif de receta (NO aplica a citas)

---

## 📋 RESUMEN DE CAMBIOS NECESARIOS

| Archivo | Cambio | Razón |
|---------|--------|-------|
| `app/api/citas/crear-notificacion/route.ts` | Agregar UPDATE recordatorio_enviado = true | Marcar que recordatorio fue enviado |
| `app/api/citas/[id]/route.ts` (PUT) | Revisar si hay cambios de estado que necesiten marcar recordatorio | Coherencia |

---

## 🎯 RESULTADO ESPERADO

**Después de los cambios:**

```
Tabla citas:
┌──────────┬─────────────────────┬───────────────────┬─────────────────────┐
│ id       │ estado              │ pagado            │ recordatorio_enviado│
├──────────┼─────────────────────┼───────────────────┼─────────────────────┤
│ cita-001 │ programada          │ false             │ true ✅             │
│ cita-002 │ confirmada          │ true              │ true ✅             │
│ cita-003 │ completada          │ true              │ true ✅             │
└──────────┴─────────────────────┴───────────────────┴─────────────────────┘
```

---

## ✅ IMPACTO

- ✅ `recordatorio_enviado` ahora refleja la realidad
- ✅ Estados coherentes con flujo de pagos
- ✅ Sin romper funcionalidad existente
- ✅ Auditoría correcta de notificaciones

