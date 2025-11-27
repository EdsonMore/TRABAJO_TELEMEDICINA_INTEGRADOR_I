# 🏥 Flujo Completo de Compra de Receta - Perspectiva del Paciente

## 📱 ¿Qué ve y hace el PACIENTE?

```
DASHBOARD PACIENTE
       │
       ├─ MIS RECETAS
       │    ├─ Receta #001 (Estado: NO ENVIADA)
       │    ├─ Receta #002 (Estado: ENVIADA)
       │    └─ Receta #003 (Estado: DISPENSADA) ✓
       │
       ├─ COTIZAR RECETA
       │    ├─ Ver farmacias disponibles
       │    ├─ Ver precio de medicamentos
       │    └─ Elegir farmacia
       │
       ├─ COMPRAR / ENVIAR A FARMACIA
       │    │
       │    └─ PRIMERA VEZ QUE CAMBIA A "ENVIADA"
       │
       └─ ESPERAR RESPUESTA DE FARMACIA
            ├─ ¿Aceptó? → Pasa a DESPACHO
            └─ ¿Rechazó? → Puede enviar a otra farmacia
```

---

## 🔄 FLUJO COMPLETO (Paso a Paso)

### **PASO 1: COTIZAR (Opcional pero Recomendado)**

**¿Qué hace el paciente?**
```
Dashboard Paciente → Mis Recetas → Receta #001 → COTIZAR
```

**¿Qué pasa en BD?**
```sql
-- NO cambia nada aún en la tabla recetas
-- Solo se calcula y muestra información:
SELECT 
  f.nombre as farmacia,
  f.telefono,
  f.ubicacion,
  SUM(m.precio_venta * rd.cantidad) as total_estimado
FROM farmacias f
JOIN inventario_farmacia inv ON f.id = inv.id_farmacia
JOIN medicamentos m ON inv.id_medicamento = m.id
JOIN receta_detalle rd ON m.id = rd.medicamento_id
WHERE rd.id_receta = :receta_id
GROUP BY f.id
-- Resultado: Lista de farmacias con precios
```

**Responsabilidad:** 
- ✅ Component: `ListaRecetasPaciente` o similar
- ✅ Endpoint: `/api/farmacia/buscar-recetas` (búsqueda)
- ✅ NO modifica BD, solo consulta

**Resultado:**
```
Farmacias disponibles:
─────────────────────
Farmacia San José
  └─ Total: S/ 125.50
  └─ Ubicación: Av. Principal 123

Farmacia Salud Vital
  └─ Total: S/ 132.00
  └─ Ubicación: Jr. Comercio 456

Farmacia del Dr.
  └─ Total: S/ 119.99
  └─ Ubicación: Av. Este 789
```

---

### **PASO 2: ENVIAR A FARMACIA (COMPRA REAL)**

**¿Qué hace el paciente?**
```
Dashboard Paciente → Mis Recetas → Receta #001 → ENVIAR A FARMACIA
                                                  ↓
                                        Selecciona farmacia
                                        Confirma compra
                                        CLIC: "ENVIAR"
```

**¿Qué pasa en BD?**
```sql
UPDATE recetas 
SET 
  estado_envio = 'enviada',           ← CAMBIO CRÍTICO
  farmacia_seleccionada_id = :farmacia_id,
  fecha_envio_farmacia = NOW()
WHERE id = :receta_id;

-- Resultado: Receta ahora es visible para la farmacia
```

**Responsabilidad:**
- ✅ Component: `ListaRecetasPaciente` 
- ✅ Endpoint: `/api/paciente/recetas/:id/enviar-farmacia` (POST)
- ✅ **MODIFICA BD**: estado_envio = 'enviada'

**¿Qué ve el paciente ahora?**
```
Receta #001
├─ Estado: ENVIADA ✓
├─ Farmacia: San José
├─ Total: S/ 125.50
└─ ⏳ Esperando respuesta...
```

**¿Qué ve la FARMACIA ahora?**
```
← Notificación nueva en RECETAS-RECIBIDAS

Receta #001 (ENVIADA)
├─ Paciente: Juan Pérez
├─ Medicamentos: 3
├─ Total: S/ 125.50
└─ [ACEPTAR] [RECHAZAR]
```

---

### **PASO 3: FARMACIA RESPONDE**

**Escenario A: FARMACIA ACEPTA**
```
Farmacista en RECETAS-RECIBIDAS
         ↓
    Revisa stock
         ↓
  "Tengo todos los medicamentos"
         ↓
    CLIC: [ACEPTAR]
         ↓
BD actualiza:
  estado_envio = 'recibida'
  
Crea RESERVAS en inventario_farmacia
para prevenir venta a otros clientes
```

**¿Qué ve el PACIENTE?**
```
Receta #001
├─ Estado: ACEPTADA ✓
├─ Farmacia: San José
├─ Total: S/ 125.50
└─ 📦 Su receta está siendo preparada
   └─ [VER DETALLES] [RASTREAR]
```

**¿Qué pasa DENTRO de la FARMACIA?**
```
RECETAS-RECIBIDAS → DESPACHO-RECETAS
      │                    │
  (ACEPTADA)          (En preparación)
      │                    │
      └──→ Pasa automáticamente
           
Farmacista ve en DESPACHO:
├─ Receta #001 (Estado: ACTIVA/PENDIENTE)
├─ Medicamentos a preparar
├─ Stock disponible
└─ [PREPARAR] [DESPACHAR]
```

---

**Escenario B: FARMACIA RECHAZA**
```
Farmacista en RECETAS-RECIBIDAS
         ↓
    "No tengo stock"
         ↓
    CLIC: [RECHAZAR]
         ↓
    Ingresa motivo: "Solo tengo 2, se necesitan 5"
         ↓
BD actualiza:
  estado_envio = 'rechazada'
  motivo_rechazo = "Solo tengo 2, se necesitan 5"
```

**¿Qué ve el PACIENTE?**
```
Receta #001
├─ Estado: RECHAZADA ❌
├─ Farmacia: San José
├─ Motivo: "Solo tengo 2, se necesitan 5"
└─ 🔄 Puede enviar a otra farmacia
   └─ [ENVIAR A OTRA FARMACIA]
```

**Vuelve al PASO 1 → Buscar otra farmacia**

---

### **PASO 4: FARMACIA PREPARA Y DESPACHA**

**¿Qué hace el FARMACISTA?**
```
DESPACHO-RECETAS
       │
    Abre Receta #001
       │
  1. PREPARAR
     └─ Estado: en_proceso
     └─ Farmacista comienza a juntar medicamentos
     │
  2. DESPACHAR
     └─ Estado: dispensada
     └─ Entrega medicamentos al paciente
     └─ DESCUENTA STOCK de inventario
```

**¿Qué pasa en BD?**
```sql
-- PASO 1: Preparar
UPDATE recetas 
SET estado = 'en_proceso' 
WHERE id = :receta_id;

-- PASO 2: Despachar
UPDATE recetas 
SET estado = 'dispensada', 
    fecha_dispensacion = NOW()
WHERE id = :receta_id;

-- DESCUENTA STOCK
UPDATE inventario_farmacia
SET stock_actual = stock_actual - :cantidad
WHERE id_farmacia = :farmacia_id 
  AND id_medicamento = :med_id;
```

**¿Qué ve el PACIENTE EN TIEMPO REAL?**
```
Receta #001
├─ Estado: EN PREPARACIÓN ⏳
├─ Farmacia: San José
├─ Medicamentos: 3
├─ Total: S/ 125.50
└─ 📍 Rastreo:
   └─ 14:30 - Recibida
   └─ 14:45 - En preparación
   └─ 15:00 - Lista para retirar/enviar ✓
```

---

### **PASO 5: PACIENTE RECIBE**

**¿Qué sucede?**
```
Opciones:
1. RETIRA EN FARMACIA
   └─ Farmacista entrega medicamentos
   └─ Paciente firma comprobante

2. ENTREGA A DOMICILIO
   └─ Repartidor entrega en casa
   └─ Paciente firma comprobante
```

**¿Qué ve el PACIENTE?**
```
Receta #001
├─ Estado: DISPENSADA ✓
├─ Farmacia: San José
├─ Total PAGADO: S/ 125.50
├─ Fecha: 22/11/2025 15:00
└─ 🎉 Entrega completada
   └─ [DESCARGAR COMPROBANTE]
```

---

## 🎯 RESUMEN DEL FLUJO COMPLETO

```
PACIENTE                    ESTADO BD                    FARMACIA
   │                            │                           │
1. Crea receta             activa, no_enviada
   │
2. Cotiza                  (No cambia)                    ← Busca precios
   │
3. Envía a farmacia        enviada ←────────────────────→ Notificación
   │                                                          │
   ├─ Espera...                                         4. Revisa stock
   │                                                          │
   │                                    ┌──────────────────┬─┘
   │                                    │                  │
   │                      ACEPTAR    RECHAZAR
   │                          │          │
   │                      recibida   rechazada
   │                          │          │
   ├─ Ve: ACEPTADA            │          └─ Ve: RECHAZADA
   │                          │               (Vuelve al paso 2)
   │                    5. PREPARA
   ├─ Ve: PREPARANDO      en_proceso
   │
   │                    6. DESPACHA
   ├─ Ve: LISTO          dispensada
   │
   │                 STOCK DESCUENTO ✓
   │
7. Retira/Recibe        (Compra completada)
   │
   └─ Ve: ENTREGADO      ✓ Comprobante
```

---

## ❓ PREGUNTAS FRECUENTES

### **P1: ¿Es necesario COTIZAR antes de ENVIAR?**
**R:** NO. Es opcional. El paciente puede:
- ✅ Cotizar primero (recomendado)
- ✅ O directamente enviar a una farmacia que conoce

### **P2: ¿Qué pasa si la farmacia NO RESPONDE?**
**R:** 
- La receta queda en estado "enviada"
- Después de X días (24-48h), el paciente puede enviar a otra farmacia
- O notificar a soporte

### **P3: ¿El paciente PAGA ANTES O DESPUÉS?**
**R:** Depende de la política:
- **Opción 1:** Paga al cotizar (prepago)
- **Opción 2:** Paga al retirar (contraentrega)
- **Opción 3:** Paga al envío (a domicilio)

El flujo actual NO incluye pago (eso es otro módulo).

### **P4: ¿Qué pasa con una receta RECHAZADA?**
**R:** 
- Vuelve a estado "no_enviada" (sin guardar el rechazo)
- O se marca como "rechazada" permanentemente
- Paciente DEBE crear nueva receta o enviar a otra farmacia

### **P5: ¿Se puede CANCELAR una compra?**
**R:**
- Si está en "enviada": Sí, se puede enviar a otra farmacia
- Si está en "en_proceso": Depende de política
- Si está en "dispensada": No, ya está completada

### **P6: ¿Qué es lo que realmente COMPRA el paciente?**
**R:** El paciente COMPRA cuando:
- ✅ **ENVÍA LA RECETA** (Paso 2)
- Esta es la **orden de compra real**
- La farmacia acepta o rechaza
- Si acepta → se procesa el pago y despacho

---

## 💡 LO MÁS IMPORTANTE

**Para el PACIENTE:**
1. **COTIZAR** (Opcional): Ver precios en diferentes farmacias
2. **ENVIAR** (Obligatorio): Esto es la compra real, farmacia lo ve
3. **ESPERAR**: Farmacia acepta/rechaza (24-48 horas típicamente)
4. **RECIBIR**: Retira o recibe a domicilio

**Para la FARMACIA:**
1. **RECETAS-RECIBIDAS**: Aceptar o rechazar la orden
2. **DESPACHO-RECETAS**: Preparar y entregar

**Lo que SÍ necesitas:** Ambos componentes son necesarios
- RECETAS-RECIBIDAS: Para que farmacia acepte/rechace
- DESPACHO-RECETAS: Para que se prepare y despache

---

## 🔄 ¿CUÁNDO SE ACTUALIZA CADA ESTADO?

```
Estado           Dónde cambia            Quién          Cuándo
─────────────────────────────────────────────────────────────────
no_enviada    → Creación de receta      Médico         Inmediato
enviada       → Paciente envía          Paciente       Paso 3
recibida      → RECETAS-RECIBIDAS       Farmacista     Acepta
rechazada     → RECETAS-RECIBIDAS       Farmacista     Rechaza
─────────────────────────────────────────────────────────────────
activa        → Después de aceptar      Sistema        Auto
en_proceso    → DESPACHO-RECETAS        Farmacista     Prepara
dispensada    → DESPACHO-RECETAS        Farmacista     Despacha
─────────────────────────────────────────────────────────────────
```

---

## 📊 CAMPOS CLAVE EN CADA PASO

```
PASO 1: COTIZAR
└─ NO se actualiza BD, solo lectura

PASO 2: ENVIAR
└─ UPDATE recetas SET 
     estado_envio = 'enviada'
     farmacia_seleccionada_id = ?
     fecha_envio_farmacia = NOW()

PASO 3: FARMACIA ACEPTA/RECHAZA
└─ UPDATE recetas SET 
     estado_envio = 'recibida' / 'rechazada'
   
   Si ACEPTA:
   INSERT INTO inventario_farmacia (reservas_activas) += cantidad

PASO 4-5: DESPACHO
└─ UPDATE recetas SET 
     estado = 'en_proceso'
   
   UPDATE recetas SET 
     estado = 'dispensada'
   
   UPDATE inventario_farmacia SET 
     stock_actual -= cantidad
```

---

## ✅ CONCLUSIÓN

**El flujo COMPLETO es:**

```
PACIENTE                    FARMACIA
   │                            │
   ├─ COTIZA        ────────→  (Busca precios, no cambia BD)
   │
   ├─ ENVÍA (COMPRA) ───────→  RECETAS-RECIBIDAS
   │                                │
   │                          ┌─────┴─────┐
   │                     ACEPTA       RECHAZA
   │                          │            │
   │                          │        (Vuelve a cotizar)
   │                          │
   │                    DESPACHO-RECETAS
   │                     (Preparar/Despachar)
   │                          │
   ├─ RECIBE (RETIRA) ←────────┘
```

**Ambos componentes SON NECESARIOS:**
- ✅ RECETAS-RECIBIDAS: Primera validación (¿tengo stock?)
- ✅ DESPACHO-RECETAS: Ejecución física (preparación y entrega)
