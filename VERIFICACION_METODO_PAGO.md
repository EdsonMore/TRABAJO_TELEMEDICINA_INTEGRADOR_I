# ✅ VERIFICACIÓN: MÉTODO DE PAGO EN CITAS

**Fecha:** 30 de noviembre 2025  
**Cambios Implementados:** Guardar método de pago en citas y crear registro en tabla pagos  
**Status:** 🟢 **IMPLEMENTADO**

---

## 📋 Cambios Realizados

### 1️⃣ Frontend (`app/dashboard/citas/page.tsx`)
- **Línea 569:** Agregado `metodo_pago: pagoData.metodo_pago` a `citaData`
- **Efecto:** El método de pago se envía al backend cuando se crea la cita

### 2️⃣ Backend - Aceptar Parámetro (`app/api/citas/paciente/route.ts`)
- **Línea 134:** Destructuring incluye ahora `metodo_pago` del body
- **Efecto:** El backend puede recibir y procesar el método de pago

### 3️⃣ Backend - Guardar en BD (`app/api/citas/paciente/route.ts`)
- **Línea 287-289:** INSERT actualizado para incluir columna `metodo_pago`
- **Línea 301:** Parámetro 10 pasado con `metodo_pago || null`
- **Efecto:** El método de pago se guarda en la tabla `citas`

### 4️⃣ Backend - Tabla Pagos (`app/api/citas/paciente/route.ts`)
- **Línea 308-320:** Nuevo bloque que crea registro en tabla `pagos`
- **Datos Guardados:**
  - `usuario_id`: ID del paciente
  - `entidad_tipo`: 'cita'
  - `entidad_id`: ID de la cita creada
  - `monto`: Costo final de la cita
  - `metodo_pago`: Método elegido
  - `estado`: 'pendiente' (hasta que se procese pago real)

---

## 🧪 PRUEBA DE VALIDACIÓN

### Paso 1: Verificar Tabla Citas
```sql
SELECT id, metodo_pago, costo, estado, fecha_creacion 
FROM citas 
ORDER BY fecha_creacion DESC 
LIMIT 5;
```

**Resultado Esperado:**
```
                  id                  | metodo_pago |  costo  |  estado   |     fecha_creacion
--------------------------------------+-------------+---------+-----------+---------------------
 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | tarjeta     | 150.00  | programada | 2025-11-30 10:30:00
 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | yape        | 130.00  | programada | 2025-11-30 10:28:00
```

✅ **DEBE HABER:** metodo_pago con valor distinto de NULL

---

### Paso 2: Verificar Tabla Pagos
```sql
SELECT id, usuario_id, entidad_tipo, monto, metodo_pago, estado, created_at 
FROM pagos 
WHERE entidad_tipo = 'cita'
ORDER BY created_at DESC 
LIMIT 5;
```

**Resultado Esperado:**
```
                  id                  |           usuario_id           | entidad_tipo | monto  | metodo_pago |  estado   |       created_at
--------------------------------------+--------------------------------+--------------+--------+-------------+-----------+---------------------
 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | yyyyyy-yyyy-yyyy-yyyy-yyyyyyyy | cita         | 150.00 | tarjeta     | pendiente | 2025-11-30 10:30:00
 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | yyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyy | cita         | 130.00 | yape        | pendiente | 2025-11-30 10:28:00
```

✅ **DEBE HABER:** Registros con entidad_tipo='cita' y estado='pendiente'

---

### Paso 3: Verificar Integridad (Relación citas ↔ pagos)
```sql
SELECT 
  c.id as cita_id,
  c.metodo_pago,
  c.costo,
  p.id as pago_id,
  p.monto,
  p.estado
FROM citas c
LEFT JOIN pagos p ON p.entidad_id = c.id AND p.entidad_tipo = 'cita'
WHERE c.estado = 'programada'
ORDER BY c.fecha_creacion DESC
LIMIT 5;
```

**Resultado Esperado:**
```
                 cita_id                |  metodo_pago  |  costo  |              pago_id               | monto  |  estado
--------------------------------------+--------------+---------+--------------------------------------+--------+----------
 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | tarjeta      | 150.00  | zzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz | 150.00 | pendiente
 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | yape         | 130.00  | zzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz | 130.00 | pendiente
```

✅ **DEBE HABER:**
- Cada cita tiene un método_pago
- Existe registro correlativo en tabla pagos
- Los montos coinciden
- El estado del pago es 'pendiente'

---

## 🔄 FLUJO COMPLETO (Usuario)

1. **Paciente llena formulario cita** (pasos 1-3)
   - Médico ✓
   - Fecha/Hora ✓
   - Motivo/Síntomas ✓

2. **Paciente selecciona método de pago** (paso 4)
   - Tarjeta de crédito/débito
   - Yape
   - Efectivo (si aplica)

3. **Click "Confirmar y Pagar"**
   ```
   Frontend: Envía citaData incluyendo metodo_pago
   Backend: Crea cita CON metodo_pago
   Backend: Crea registro en pagos con estado='pendiente'
   ```

4. **Resultado en BD:**
   ```
   Tabla citas:
     - Nuevo registro con metodo_pago guardado
   
   Tabla pagos:
     - Nuevo registro vinculado a cita
     - Estado = 'pendiente' (esperando procesamiento real)
   ```

---

## 📊 RESUMEN

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Método pago en citas** | NULL | ✅ Guardado |
| **Registro en tabla pagos** | No existe | ✅ Creado |
| **Integridad datos** | ❌ Incompleta | ✅ Completa |
| **Auditoría pagos** | ❌ Imposible | ✅ Posible |

---

## ⚠️ NOTAS IMPORTANTES

1. **Estado 'pendiente' en pagos:** Indica que el pago está registrado pero no procesado aún
   - Cuando procesarPago() completa, debe actualizar estado a 'completado'

2. **metodo_pago en tabla citas:** Ahora es un registro histórico de qué método usó el paciente

3. **Relación citas ↔ pagos:**
   - Una cita PUEDE tener múltiples registros de pago (reintentos)
   - El último registro con estado='completado' es el válido

4. **Próximo paso:** Actualizar `procesarPago()` para cambiar estado a 'completado' después de validación exitosa

---

## ✅ CHECKLIST ANTES DE PRODUCCIÓN

- [ ] Ejecutar Paso 1 (Verificar citas con metodo_pago)
- [ ] Ejecutar Paso 2 (Verificar pagos con estado='pendiente')
- [ ] Ejecutar Paso 3 (Verificar integridad relaciones)
- [ ] Crear 2-3 citas de prueba con diferentes métodos
- [ ] Verificar que aparecen en ambas tablas
- [ ] Verificar que montos coinciden
- [ ] ✅ Listo para producción

---

**Documento de Validación:** LISTO PARA TESTING ✅
