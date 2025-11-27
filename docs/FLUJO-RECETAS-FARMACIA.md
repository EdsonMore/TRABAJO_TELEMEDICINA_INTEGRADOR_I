# 📋 Flujo de Recetas en Farmacia - Diferencias y Funciones

## 📊 Diagrama de Flujo General

```
PACIENTE                           FARMACIA                         BD
   │                                 │                               │
   ├──→ Crea Receta ─────────────────┼───────────────────────────────→ recetas (estado='activa')
   │                                 │                               │
   ├──→ Envía a Farmacia ────────────┼───────────────────────────────→ estado_envio='enviada'
   │                                 │
   │                             (RECETAS-RECIBIDAS)                │
   │                                 │
   │                        ┌────────┴────────┐                     │
   │                        │  ¿Aceptar?      │                     │
   │                        └────────┬────────┘                     │
   │                                 │
   │                            ↙         ↖
   │                      ACEPTAR      RECHAZAR
   │                        │             │
   │                        └─────┬───────┘
   │                              │
   │                   estado_envio='recibida'  o  'rechazada'
   │                              │
   │                     ┌────────┴────────┐
   │                     │  (DESPACHO)     │
   │                     │  activa→        │
   │                     │  en_proceso→    │
   │                     │  dispensada→    │
   │                     └────────┬────────┘
   │                              │
   │    ←───────────────────────  ↙
   └─ Recibe Medicamentos
                            ↓ (stock descuento)
                        BD actualizado
```

---

## 🔄 Componente 1: `RECETAS-RECIBIDAS` (Recepción/Aceptación)

### **Propósito Principal**
Gestionar la **aceptación o rechazo** de recetas que los pacientes envían a la farmacia.

### **Estado Relevante**
- **Campo:** `estado_envio` (en tabla `recetas`)
- **Valores:** 
  - `no_enviada` → Receta creada pero no enviada
  - `enviada` → Paciente la envió a la farmacia
  - **`recibida`** ← Farmacista aceptó (AQUÍ SE MARCA)
  - `rechazada` → Farmacista rechazó
  - `dispensada` → Ya fue despachada

### **Endpoint Principal**
```
GET  /api/farmacia/recetas-recibidas
     ?estado=enviada&pagina=1&busqueda=

PATCH /api/farmacia/recetas-recibidas/[id]/responder
     {
       accion: "aceptar" | "rechazar",
       motivo_rechazo: "..." (si rechaza)
     }
```

### **Responsabilidades**
1. ✅ Ver recetas que pacientes enviaron
2. ✅ Validar disponibilidad de medicamentos
3. ✅ **Aceptar** la receta → `estado_envio='recibida'`
4. ✅ **Rechazar** la receta → `estado_envio='rechazada'`
5. ✅ Notificar al paciente de su decisión
6. ✅ Crear **reservas de medicamentos** cuando acepta

### **Flujo de Estados**
```
Recetas enviadas (estado_envio='enviada')
          ↓
    Farmacista revisa
          ↓
    ┌─────┴─────┐
    ↓           ↓
 ACEPTAR     RECHAZAR
    ↓           ↓
recibida    rechazada
    ↓
Pasa a DESPACHO
```

### **Datos que Muestra**
- Código de receta
- Nombre paciente/teléfono/email
- Médico que prescribió
- Medicamentos solicitados
- Stock disponible en la farmacia
- Estado de disponibilidad

### **Información que Recibe de BD**
```sql
FROM recetas r
JOIN citas c ON r.id_cita = c.id
JOIN pacientes p ON c.id_paciente = p.id
JOIN usuarios u_paciente ON p.id_usuario = u_paciente.id
JOIN medicos m ON c.id_medico = m.id
JOIN usuarios u_medico ON m.id_usuario = u_medico.id
LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
LEFT JOIN inventario_farmacia inv ON...
WHERE r.farmacia_seleccionada_id = :farmacia_id
AND r.estado_envio = 'enviada'  ← CLAVE
```

---

## 💊 Componente 2: `DESPACHO-RECETAS` (Procesamiento/Despacho)

### **Propósito Principal**
Procesar la **preparación y despacho físico** de medicamentos para recetas ya aceptadas.

### **Estado Relevante**
- **Campo:** `estado` (en tabla `recetas`)
- **Valores:**
  - `activa` → Receta aceptada, lista para preparar
  - **`en_proceso`** → Farmacista está preparando
  - **`dispensada`** → Ya se entregó al paciente (AQUÍ SE MARCA)
  - `vencida` → Expiró
  - `cancelada` → Cancelada por rechazo

### **Endpoint Principal**
```
GET  /api/farmacia/recetas
     ?estado=pendientes|en_proceso|dispensadas&page=1&limit=50

PATCH /api/farmacia/recetas/[id]/procesar
     {
       accion: "en_proceso" | "dispensada" | "rechazada",
       medicamentos_procesados: [{
         medicamento_id: 123,
         cantidad_dispensada: 2,
         lote: "ABC123",
         precio_unitario: 25.50
       }],
       observaciones: "..."
     }
```

### **Responsabilidades**
1. ✅ Ver recetas aceptadas (`estado='activa'`)
2. ✅ **Preparar** receta → `estado='en_proceso'`
3. ✅ Seleccionar cantidad de medicamentos a despachar
4. ✅ **Despachar** receta → `estado='dispensada'`
5. ✅ **Descontar stock** de `inventario_farmacia`
6. ✅ Crear auditoría de la transacción

### **Flujo de Estados**
```
Recetas aceptadas (estado='activa')
          ↓
  Farmacista selecciona
          ↓
    PREPARAR
          ↓
estado='en_proceso'
          ↓
    DESPACHAR
          ↓
estado='dispensada'
          ↓
STOCK DESCUENTO ✓
```

### **Datos que Muestra**
- Código de receta
- Paciente (nombre, DNI, edad, sexo)
- Médico y especialidad
- Diagnóstico
- Medicamentos necesarios
- Stock disponible por medicamento
- Precio unitario y total

### **Información que Recibe de BD**
```sql
FROM recetas r
JOIN citas c ON r.id_cita = c.id
JOIN pacientes p ON c.id_paciente = p.id
JOIN usuarios up ON p.id_usuario = up.id
JOIN medicos m ON c.id_medico = m.id
JOIN usuarios um ON m.id_usuario = um.id
JOIN especialidades e ON m.id_especialidad = e.id
LEFT JOIN receta_detalle rd ON r.id = rd.id_receta
LEFT JOIN inventario_farmacia inv ON...
WHERE r.estado IN ('activa', 'pendiente', 'en_proceso') ← CLAVE
```

---

## 🔑 Principales Diferencias

| Aspecto | RECETAS-RECIBIDAS | DESPACHO-RECETAS |
|---------|------------------|------------------|
| **Función** | Aceptar/Rechazar recetas | Preparar/Despachar medicamentos |
| **Estado Usado** | `estado_envio` | `estado` |
| **Transiciones** | enviada → recibida/rechazada | activa → en_proceso → dispensada |
| **Aciones** | Aceptar, Rechazar | Preparar, Despachar, Rechazar |
| **Stock Impact** | **Crea reservas** | **Descuenta stock** |
| **Medicamentos** | Muestra si hay stock | Permite seleccionar cantidad a despachar |
| **Entrada** | Recetas enviadas por pacientes | Recetas aceptadas por farmacia |
| **Salida** | Receta aceptada o rechazada | Receta completamente procesada |
| **Auditoría** | Aceptación/Rechazo | Dispensación con lote y cantidad |

---

## 🔄 Ciclo Completo de una Receta

```
1. PACIENTE CREA RECETA
   BD: estado='activa', estado_envio='no_enviada'

2. PACIENTE ENVÍA A FARMACIA
   BD: estado_envio='enviada'
   → Visible en: RECETAS-RECIBIDAS

3. FARMACISTA ACEPTA EN RECETAS-RECIBIDAS
   BD: estado_envio='recibida'
   BD: Crea RESERVAS en inventario_farmacia
   → Visible en: DESPACHO-RECETAS (como 'activa')

4. FARMACISTA PREPARA EN DESPACHO-RECETAS
   BD: estado='en_proceso'
   Acción: "Preparar"

5. FARMACISTA DESPACHA EN DESPACHO-RECETAS
   BD: estado='dispensada'
   BD: DESCUENTA STOCK de inventario_farmacia
   Acción: "Dispensada"
   
6. PACIENTE RECIBE MEDICAMENTOS ✓
   Receta completada
```

---

## 📊 Relación de Campos

### En RECETAS-RECIBIDAS
```javascript
receta {
  id,
  codigo_receta,
  estado_envio,        ← CLAVE (enviada, recibida, rechazada)
  fecha_envio,
  fecha_emision,
  fecha_vencimiento,
  paciente { nombre, apellido, email, telefono },
  medico { nombre, apellido },
  medicamentos [{ nombre, cantidad, stock, disponibilidad }],
  disponibilidad_completa
}
```

### En DESPACHO-RECETAS
```javascript
receta {
  id,
  codigo_receta,
  estado,              ← CLAVE (activa, en_proceso, dispensada)
  paciente_nombre,
  paciente_apellido,
  paciente_dni,
  paciente_edad,
  paciente_sexo,
  medico_nombre,
  medico_apellido,
  especialidad,
  diagnostico_principal_texto,
  fecha_emision,
  fecha_vencimiento,
  medicamentos [{ id, nombre, cantidad, stock, precio }],
  tiene_stock_completo
}
```

---

## 🔐 Seguridad y Validaciones

### RECETAS-RECIBIDAS
- ✅ Verifica que el usuario sea FARMACIA
- ✅ Valida que la receta pertenece a su farmacia
- ✅ Verifica stock antes de aceptar
- ✅ Crea reservas para prevenir sobreventa

### DESPACHO-RECETAS
- ✅ Verifica que el usuario sea FARMACIA
- ✅ Valida que la receta pertenece a su farmacia
- ✅ Verifica cantidad ≤ stock disponible
- ✅ Descuenta stock en transacción atómica
- ✅ Crea auditoría de cada despacho

---

## 💡 Casos de Uso

### RECETAS-RECIBIDAS
1. **Revisar stock antes de aceptar**
   - Paciente solicita 10 pastillas, tengo 5
   - Decido rechazar y notificar

2. **Aceptar y reservar**
   - Confirmo que tengo los medicamentos
   - Se reservan para este paciente

3. **Cambiar de farmacia (rechazar)**
   - Paciente puede enviar a otra farmacia

### DESPACHO-RECETAS
1. **Preparación en pasos**
   - Marcar como "en preparación"
   - El personal prepara los medicamentos

2. **Despacho parcial**
   - Tenía 10 pastillas solicitadas, pero solo despacho 8
   - Se descuenta stock de lo que se despachó

3. **Auditoría completa**
   - Quién despachó, cuándo, qué lote, cantidad exacta

---

## 🛠️ Integración con Otros Componentes

### Flujo Paciente
```
recetas-paciente-section (enviar a farmacia)
         ↓
estado_envio='enviada'
         ↓
RECETAS-RECIBIDAS (acepta)
         ↓
estado_envio='recibida', estado='activa'
         ↓
DESPACHO-RECETAS (despacha)
         ↓
estado='dispensada'
         ↓
Paciente notificado
```

### Flujo Farmacia
```
dashboard/farmacia
  ├─ recetas-recibidas (tab 1: Envíos de pacientes)
  └─ despacho-recetas (tab 2: Procesamiento físico)
```

---

## ✅ Resumen Rápido

- **RECETAS-RECIBIDAS**: "¿Aceptamos esta receta?"
- **DESPACHO-RECETAS**: "¿Despachamos esta receta?"

La diferencia clave es que `recetas-recibidas` maneja la **decisión inicial** (aceptación), mientras que `despacho-recetas` maneja la **ejecución final** (entrega).
