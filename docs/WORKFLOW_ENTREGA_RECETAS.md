# 📦 Flujo Completo de Entrega de Recetas en MediLink+

## Visión General

El sistema de telemedicina ahora implementa un flujo completo de entrega de recetas que permite al **paciente elegir cómo desea recibir su medicamento** (recojo en farmacia o envío a domicilio) al momento de pedir la receta, y permite al **paciente mantenerse informado** del estado de su entrega en tiempo real.

---

## 1️⃣ FASE 1: PACIENTE SOLICITA LA RECETA

### 📍 Ubicación: `/app/dashboard/paciente` → Tab "Recetas"

**Flujo:**
1. Paciente ve lista de recetas emitidas
2. Selecciona una receta y hace clic en "Enviar a Farmacia"
3. Se abre `SeleccionFarmaciasView` con opciones de farmacias
4. Selecciona medicamentos disponibles en cada farmacia
5. **NUEVO**: Antes de confirmar, aparece modal de **selección de tipo de entrega**

### 🎯 Modal de Selección de Entrega

**Opciones disponibles:**

#### Opción 1: Recoger en Farmacia (Gratis)
- ✅ Sin costo adicional
- ✅ Paciente recoge en farmacia seleccionada
- ✅ Disponible inmediatamente

#### Opción 2: Envío a Domicilio (S/ 15.00)
- 🚚 Costo fijo: **S/ 15.00**
- 📍 Requiere dirección de entrega
- ⏱️ Entrega en 24-48 horas aprox.

### 💾 Datos Guardados en BD

```sql
-- Columnas agregadas a tabla recetas
tipo_entrega VARCHAR(50)        -- 'recojo' | 'domicilio'
direccion_entrega TEXT          -- Dirección del paciente (solo si domicilio)
costo_entrega DECIMAL(10, 2)   -- S/ 0.00 para recojo, S/ 15.00 para domicilio
```

### 📤 Endpoint Actualizado

**POST** `/api/recetas/[id]/enviar-farmacia`

**Body:**
```json
{
  "farmacia_id": "uuid-farmacia",
  "medicamentos": [...],
  "tipo_entrega": "domicilio|recojo",
  "direccion_entrega": "Av. Principal 123, Apt 4B",
  "costo_entrega": 15
}
```

---

## 2️⃣ FASE 2: FARMACIA RECIBE Y PREPARA

### 📍 Ubicación: `/app/dashboard/farmacia` → Tab "Despacho"

**Flujo:**
1. Farmacia ve receta en "Despacho Recetas"
2. Abre modal con detalles completos
3. **NUEVO**: Ve información de entrega elegida por paciente
   - ✅ Modalidad: Recojo en Farmacia / Envío a Domicilio
   - ✅ Si es domicilio: dirección de entrega
   - ✅ Costo total: medicamentos + delivery

### 📦 Información de Entrega Mostrada

```
┌─────────────────────────────────────────┐
│ 📦 INFORMACIÓN DE ENTREGA               │
├─────────────────────────────────────────┤
│                                         │
│ ✓ Seleccionado: Envío a Domicilio     │
│                                         │
│ 📍 Dirección de Entrega:               │
│    Av. Principal 123, Apt 4B           │
│                                         │
│ 💰 Costo Total:                        │
│    Medicamentos:  S/ 450.00            │
│    Envío:        S/ 15.00             │
│    ─────────────────────────          │
│    TOTAL:        S/ 465.00            │
└─────────────────────────────────────────┘
```

### ✅ Acciones de Farmacia

1. **Preparar**: Farmacia marca receta como "En Preparación"
2. **Validar Stock**: Confirma disponibilidad de medicamentos
3. **Despachar**: Marca como "Lista para Entrega/Recojo"
4. **Si es domicilio**: Prepara envío con dirección del paciente
5. **Si es recojo**: Notifica que está lista para retiro

---

## 3️⃣ FASE 3: PACIENTE SEGUIMIENTO EN TIEMPO REAL

### 📍 Ubicación: `/app/dashboard/paciente` → Tab "Seguimiento" ✨ NUEVO

**Características:**

#### Vista Resumen
- Lista de todas las recetas enviadas a farmacias
- Estado actual de cada receta
- Modalidad de entrega elegida
- Costo total con desglose

#### Estados de Receta

```
Enviada → Recibida → En Preparación → Lista para Entrega/Recojo
```

**Visualización Timeline:**
```
✓ Enviada ──── ✓ Recibida ──── ✓ Preparando ──── ◉ En Camino/Lista
```

#### Información Detallada por Receta

```
┌──────────────────────────────────────────────────┐
│ Receta #REC-2025-001234                          │
│ Dr. Juan Pérez - Cardiología                     │
│                                                   │
│ Estado: Envío a Domicilio ✓                      │
│                                                   │
│ MODALIDAD DE ENTREGA:                            │
│ 🚚 Envío a Domicilio                            │
│ 📍 Av. Principal 123, Apt 4B                    │
│                                                   │
│ MEDICAMENTOS:                                    │
│ • Atorvastatina 20mg x30          S/ 45.00      │
│ • Losartán 50mg x30               S/ 38.00      │
│ • Aspirina 100mg x60              S/ 25.00      │
│                                                   │
│ COSTO DESGLOSADO:                                │
│ Subtotal Medicamentos:            S/ 450.00     │
│ Costo de Envío:                   S/ 15.00      │
│ ──────────────────────────────────────────────  │
│ TOTAL A PAGAR:                    S/ 465.00     │
│                                                   │
│ ESTADO:                                          │
│ ✓ Enviada → ✓ Recibida → ✓ Preparando → ◉ En Camino
│                                                   │
│ [Ver Detalles Completos]                        │
└──────────────────────────────────────────────────┘
```

#### Modal de Detalles Completos

- Información completa de medicamentos
- Desglose de costos
- Información del médico que recetó
- Historial de cambios de estado
- Instrucciones de entrega

---

## 📊 Tabla de Estados

| Estado | Significado | Paciente Ve | Farmacia Ve |
|--------|-----------|-----------|-----------|
| no_enviada | Receta creada pero no enviada | ❌ Oculta | ❌ No ve |
| enviada | Receta enviada a farmacia | 📤 Pendiente | 🔔 Nueva |
| recibida | Farmacia aceptó la receta | ⏳ En farmacia | ✓ Aceptada |
| en_proceso | Farmacia preparando | 🔄 Preparando | 👷 En preparación |
| dispensada | Listo para retirar/enviar | ✅ Lista | 📦 Listo |
| rechazada | Farmacia rechazó | ❌ Rechazada | ⚠️ Rechazada |

---

## 💳 Cálculo de Costo

**Fórmula Total:**
```
Total = (Medicamento1 × Cantidad1 × Precio) + 
        (Medicamento2 × Cantidad2 × Precio) + 
        ... +
        (Costo Entrega: 0 si recojo, 15 si domicilio)
```

**Ejemplo:**
```
Medicamentos:
  - Atorvastatina 20mg × 30 unidades @ S/ 1.50 = S/ 45.00
  - Losartán 50mg × 30 unidades @ S/ 1.27 = S/ 38.00
                                 Subtotal = S/ 83.00

Entrega: Domicilio                           = S/ 15.00
                                    TOTAL = S/ 98.00
```

---

## 🔄 Flujo de Datos

```
PACIENTE                    SISTEMA                 FARMACIA
   │                          │                        │
   │─ Elige farmacia ────────→│                        │
   │                          │← Guarda tipo_entrega  │
   │                          │← Guarda dirección     │
   │                          │← Guarda costo         │
   │                          │                        │
   │                          │─ Notifica nueva ──────→│
   │                          │                        │
   │                    [Modal de entrega]             │
   │                          │                        │
   │                          │← Receta disponible     │
   │                          │← Ve modalidad entrega  │
   │                          │← Ve dirección         │
   │                          │                        │
   │← Aparece en seguimiento   │                        │
   │← Ve estado               │                        │
   │← Ve costo total          │                        │
   │← Ve modalidad           │                        │
```

---

## 🗄️ Cambios en la Base de Datos

### Tabla: recetas
```sql
ALTER TABLE recetas
ADD COLUMN tipo_entrega VARCHAR(50) 
  CHECK (tipo_entrega IN ('recojo', 'domicilio')) 
  DEFAULT 'recojo';

ADD COLUMN direccion_entrega TEXT;

ADD COLUMN costo_entrega DECIMAL(10, 2) DEFAULT 0;

CREATE INDEX idx_recetas_tipo_entrega ON recetas(tipo_entrega);
```

### Migration Script
**Ubicación:** `scripts/migration-delivery-options.js`
- ✅ Agregó columnas a tabla recetas
- ✅ Creó índices para optimización
- ✅ Permite valores NULL para dirección (no requerida si recojo)

---

## 🛠️ Cambios en Componentes

### 1. SeleccionFarmaciasView.tsx
- ✅ Importó Dialog components
- ✅ Agregó modal de selección de entrega
- ✅ Estados para `tipoEntregaSeleccionado`, `direccionEntrega`, `costoEntrega`
- ✅ Validación: dirección requerida si domicilio
- ✅ Envía datos a endpoint actualizado

### 2. despacho-recetas.tsx
- ✅ Carga tipo_entrega desde receta seleccionada
- ✅ Muestra información de entrega como READ-ONLY
- ✅ Farmacia ve opción elegida por paciente
- ✅ No puede cambiar (fue elegida por paciente)
- ✅ Calcula costo total incluyendo delivery

### 3. SeguimientoRecetasPaciente.tsx ✨ NUEVO
- ✅ Componente nuevo para paciente
- ✅ Muestra todas recetas enviadas
- ✅ Timeline visual de estados
- ✅ Desglose de costos
- ✅ Información de entrega (dirección si aplica)
- ✅ Modal de detalles completos
- ✅ Botón de actualizar estado

### 4. app/dashboard/paciente/page.tsx
- ✅ Importó SeguimientoRecetasPaciente
- ✅ Agregó tab "Seguimiento" (nueva)
- ✅ Grid de tabs ahora 7 columnas

---

## 🔌 Cambios en APIs

### PUT/POST `/api/recetas/[id]/enviar-farmacia`
**Ahora acepta:**
```typescript
{
  farmacia_id: string;
  medicamentos: Array;
  tipo_entrega?: "recojo" | "domicilio";    // ✨ NUEVO
  direccion_entrega?: string;                // ✨ NUEVO
  costo_entrega?: number;                    // ✨ NUEVO
}
```

**Valida:**
- `tipo_entrega` debe ser "recojo" o "domicilio"
- Si `tipo_entrega === "domicilio"`, requiere `direccion_entrega`
- Guarda todo en BD

### GET `/api/paciente/recetas`
**Ahora incluye:**
```typescript
{
  tipo_entrega: "recojo" | "domicilio";
  direccion_entrega: string | null;
  costo_entrega: number;
}
```

---

## 🎯 Beneficios para el Usuario

### Paciente
✅ Elige modalidad de entrega que prefiere
✅ Ve costo total incluyendo delivery
✅ Seguimiento en tiempo real del estado
✅ Sabe exactamente dónde irá su pedido
✅ Puede cambiar modalidad antes de enviar

### Farmacia
✅ Sabe cómo debe entregar (recojo o domicilio)
✅ Tiene dirección si es envío
✅ Ve costo total para registro
✅ Puede preparar envío de antemano si aplica

### Sistema
✅ Flujo completo de entrega documentado
✅ Información centralizada y accesible
✅ Datos consistentes entre paciente y farmacia
✅ Base para automatización de envíos futuros

---

## 📱 Interfaces Mejoradas

### Vista Paciente: Selección de Farmacia
```
┌────────────────────────────────────────────┐
│ [Modal] Seleccionar Tipo de Entrega       │
├────────────────────────────────────────────┤
│                                            │
│ ◉ 🏪 Recoger en Farmacia       ✓ Gratis   │
│   El paciente retira en instalaciones      │
│                                            │
│ ○ 🚚 Envío a Domicilio         S/ 15.00   │
│   Entrega en dirección del paciente        │
│   [Ingrese dirección]                      │
│   Av. Principal 123, Apt 4B               │
│                                            │
│  [Cancelar]           [Confirmar Entrega] │
└────────────────────────────────────────────┘
```

### Vista Farmacia: Despacho
```
┌───────────────────────────────────────────────────┐
│ 📦 INFORMACIÓN DE ENTREGA                         │
├───────────────────────────────────────────────────┤
│                                                   │
│ ✓ Recoger en Farmacia         (Seleccionado)    │
│   El paciente retira en nuestras instalaciones    │
│                                                   │
│ ✗ Envío a Domicilio           (No seleccionado) │
│   Entrega en dirección del paciente              │
│                                                   │
│ Costo Total: S/ 465.00                           │
│  - Medicamentos: S/ 450.00                       │
│  - Envío: S/ 0.00                               │
└───────────────────────────────────────────────────┘
```

### Vista Paciente: Seguimiento
```
┌──────────────────────────────────────────────────┐
│ 📦 Seguimiento de Recetas                        │
│                                          [↻]    │
├──────────────────────────────────────────────────┤
│                                                  │
│ Receta #REC-2025-001234                         │
│ Dr. Juan Pérez - Cardiología                    │
│ Estado: En Preparación  [BADGES]                │
│                                                  │
│ MODALIDAD: 🚚 Envío a Domicilio                 │
│ 📍 Av. Principal 123, Apt 4B                   │
│                                                  │
│ COSTO: S/ 465.00 (Medicamentos + Envío)        │
│                                                  │
│ PROGRESO:                                        │
│ ✓ Enviada ──── ✓ Recibida ──── ✓ Preparando ──── ◉ En Camino
│                                                  │
│ [Ver Detalles Completos]                        │
└──────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [x] Agregar columnas a tabla recetas (migration)
- [x] Crear modal de selección de entrega
- [x] Validar datos de entrega
- [x] Actualizar endpoint `/api/recetas/[id]/enviar-farmacia`
- [x] Guardar datos en BD
- [x] Mostrar información en despacho-recetas (read-only)
- [x] Crear componente SeguimientoRecetasPaciente
- [x] Agregar tab "Seguimiento" en dashboard
- [x] Mostrar costo total con delivery
- [x] Mostrar dirección de entrega si aplica
- [x] Timeline visual de estados
- [x] Modal de detalles completos
- [x] Actualizar API para incluir campos de entrega

---

## 🚀 Próximos Pasos (Futuro)

1. **Integración con Courier**
   - Conectar con sistema de envíos
   - Tracking automático de paquetes
   - Notificaciones SMS/Email

2. **Pagos en Línea**
   - Integrar pasarela de pagos
   - Incluir costo de delivery en total
   - Cobrar al paciente directamente

3. **Asignación de Repartidores**
   - Dashboard de repartidores
   - GPS de entregas en tiempo real
   - Foto de confirmación de entrega

4. **Notificaciones Automáticas**
   - SMS cuando está lista
   - Email con tracking
   - Recordatorio de recojo

5. **Historial de Entregas**
   - Guardar cada entrega
   - Análisis de tiempos
   - Reportes por zona

---

## 📞 Soporte

Para preguntas sobre el flujo de entrega:
- Revisar componentes: `components/paciente/` y `components/farmacia/`
- Revisar endpoints: `app/api/recetas/` y `app/api/paciente/`
- Revisar BD: tabla `recetas` con campos `tipo_entrega`, `direccion_entrega`, `costo_entrega`

---

**Última actualización:** 22 de noviembre de 2025
**Versión:** 1.0
