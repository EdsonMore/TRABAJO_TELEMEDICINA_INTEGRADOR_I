# 🔧 Cambios Realizados: Pago y Opciones de Entrega - 28/11/2025

## 📋 Problema Identificado

**Antes:**
- ❌ Pago en **UNA SOLA farmacia** NO guardaba opciones de entrega (tipo_entrega, direccion_entrega, costo_entrega)
- ✅ Pago en **MÚLTIPLES farmacias** SÍ guardaba estas opciones (pero no requería pago)
- El paciente NO veía opción de elegir recojo vs delivery en modo de una farmacia

**Raíz del problema:**
- Endpoint `/api/recetas/pagar` recibía solo: `receta_id`, `farmacia_id`, `metodo_pago`, `monto`
- Faltaban los 3 parámetros de entrega
- Modal de pago NO capturaba la selección de tipo de entrega

---

## ✅ Soluciones Implementadas

### 1. **Endpoint `/api/recetas/pagar/route.ts`** ✨
**Cambios:**
```typescript
// ANTES: Faltaban estos parámetros
const {
  receta_id,
  farmacia_id,
  metodo_pago,
  monto,
} = await request.json();

// AHORA: Se reciben 3 parámetros adicionales
const {
  receta_id,
  farmacia_id,
  metodo_pago,
  monto,
  tipo_entrega,          // ✨ NUEVO
  direccion_entrega,     // ✨ NUEVO
  costo_entrega,         // ✨ NUEVO
} = await request.json();
```

**Validaciones agregadas:**
- ✅ Valida que `tipo_entrega` sea "recojo" o "domicilio"
- ✅ Exige dirección si es domicilio
- ✅ Guarda estos datos en el UPDATE de la receta

**SQL actualizado:**
```sql
UPDATE recetas 
SET farmacia_seleccionada_id = $1,
    fecha_envio_farmacia = NOW(),
    estado_envio = 'enviada',
    tipo_entrega = $3,              -- ✨ NUEVO
    direccion_entrega = $4,         -- ✨ NUEVO
    costo_entrega = $5              -- ✨ NUEVO
WHERE id = $2
```

---

### 2. **Página `/app/dashboard/paciente/farmacias/[recetaId]/page.tsx`** 🎯

#### **Estados Agregados:**
```tsx
const [mostrarModalEntrega, setMostrarModalEntrega] = useState(false);
const [tipoEntregaSeleccionado, setTipoEntregaSeleccionado] = useState<"recojo" | "domicilio">("recojo");
const [direccionEntrega, setDireccionEntrega] = useState("");
const [costoEntrega, setCostoEntrega] = useState(0);
```

#### **Flujo Actualizado:**

**ANTES:**
```
Confirmar Carrito 
    ↓
(Si 1 farmacia) → Modal Pago → API Pagar
(Si múltiples)  → Enviar a todas
```

**AHORA - Flujo Unificado:** ✨
```
Confirmar Carrito 
    ↓
Modal de Selección de Entrega (PARA TODOS)
    ├─ Opción: Recoger en Farmacia (Gratis)
    └─ Opción: Envío a Domicilio (S/ 15.00)
         └─ Campo dirección (si selecciona domicilio)
    ↓
(Si 1 farmacia) → Modal Pago → API Pagar (con entrega)
(Si múltiples)  → Enviar a todas (con entrega)
```

#### **Método `procesarPagoExitoso` Actualizado:**
```tsx
// ANTES: NO enviaba datos de entrega
fetch("/api/recetas/pagar", {
  body: JSON.stringify({
    receta_id,
    farmacia_id,
    metodo_pago,
    monto,
    referencia_pago,
  })
})

// AHORA: Envía los 3 parámetros de entrega
fetch("/api/recetas/pagar", {
  body: JSON.stringify({
    receta_id,
    farmacia_id,
    metodo_pago,
    monto,
    referencia_pago,
    tipo_entrega: tipoEntregaSeleccionado,                    // ✨ NUEVO
    direccion_entrega: tipoEntregaSeleccionado === "domicilio" 
      ? direccionEntrega : null,                              // ✨ NUEVO
    costo_entrega: costoEntrega,                              // ✨ NUEVO
  })
})
```

#### **Método `confirmarEntregaYProceder` (NUEVO):** 🆕
```tsx
// Separa la lógica en dos pasos:
// 1. Captura tipo_entrega y dirección
// 2. Decide si mostrar modal de pago (1 farmacia) 
//    o enviar directo a todas (múltiples)

const confirmarEntregaYProceder = async () => {
  // Validar dirección si es domicilio
  if (tipoEntregaSeleccionado === "domicilio" && !direccionEntrega.trim()) {
    setError("Ingresa una dirección para envío a domicilio");
    return;
  }

  setMostrarModalEntrega(false);

  if (carrito.length === 1) {
    // 1 farmacia → Mostrar modal de pago
    setMostrarModalPago(true);
  } else {
    // Múltiples → Enviar a todas con entrega
    for (const item of carrito) {
      await fetch(`/api/recetas/${recetaId}/enviar-farmacia`, {
        body: JSON.stringify({
          farmacia_id: item.farmacia_id,
          medicamentos: item.medicamentos,
          tipo_entrega: tipoEntregaSeleccionado,              // ✨ NUEVO
          direccion_entrega: tipoEntregaSeleccionado === "domicilio" 
            ? direccionEntrega : null,                        // ✨ NUEVO
          costo_entrega: costoEntrega,                        // ✨ NUEVO
        })
      })
    }
  }
}
```

#### **Modal de Selección de Entrega (NUEVO UI):** 🆕
```tsx
{mostrarModalEntrega && (
  <div className="fixed inset-0 bg-black/50 ...">
    <Card>
      <CardContent>
        {/* Opción Recojo */}
        <div 
          onClick={() => {
            setTipoEntregaSeleccionado("recojo");
            setCostoEntrega(0);
          }}
          className="p-4 border-2 ..."
        >
          🏪 Recoger en Farmacia - GRATIS
        </div>
        
        {/* Opción Domicilio */}
        <div 
          onClick={() => {
            setTipoEntregaSeleccionado("domicilio");
            setCostoEntrega(15);
          }}
          className="p-4 border-2 ..."
        >
          🚚 Envío a Domicilio - S/ 15.00
          {/* Input de dirección si selecciona domicilio */}
          {tipoEntregaSeleccionado === "domicilio" && (
            <Input placeholder="Ej: Calle Principal 123..." />
          )}
        </div>

        {/* Botones */}
        <Button onClick={() => confirmarEntregaYProceder()}>
          Confirmar Entrega
        </Button>
      </CardContent>
    </Card>
  </div>
)}
```

---

### 3. **Endpoint `/api/recetas/[id]/enviar-farmacia/route.ts`** (Ya existía ✅)
- ✅ YA recibía `tipo_entrega`, `direccion_entrega`, `costo_entrega`
- ✅ Ahora también se usará en el flujo de múltiples farmacias
- ✅ Valida los mismos datos que `/api/recetas/pagar`

---

## 🎯 Flujos Finales (Resumen)

### **Caso 1: Una Sola Farmacia (con Pago)**
```
1. Paciente elige medicamentos → Carrito (1 item)
2. Click "Confirmar Pedido"
   ↓
3. Modal: "Selecciona Tipo de Entrega"
   - Recojo (Gratis)
   - Domicilio (S/ 15.00 + dirección)
   ↓
4. Confirma entrega → Modal de Pago
   - Métodos: Yape, Plin, Tarjeta, Transferencia
   ↓
5. Procesa pago ✓
   - POST /api/recetas/pagar
   - Incluye: tipo_entrega, direccion_entrega, costo_entrega
   ↓
6. Receta enviada a farmacia (con opciones de entrega guardadas)
```

### **Caso 2: Múltiples Farmacias (sin Pago)**
```
1. Paciente elige medicamentos en diferentes farmacias
2. Click "Confirmar Carrito" (múltiples items)
   ↓
3. Modal: "Selecciona Tipo de Entrega"
   (Mismas opciones que Caso 1)
   ↓
4. Confirma entrega
   ↓
5. Envía a TODAS las farmacias
   - POST /api/recetas/[id]/enviar-farmacia (1 por farmacia)
   - Incluye: tipo_entrega, direccion_entrega, costo_entrega
   ↓
6. Todas las recetas enviadas (con opciones de entrega guardadas)
```

---

## 🧪 Verificación

✅ **Proyecto compila sin errores**
```
> npm run build
Compiled successfully
```

✅ **Cambios unificados:**
- Una sola farmacia: ANTES no guardaba entrega → AHORA sí ✓
- Múltiples farmacias: ANTES guardaba → AHORA también ✓

✅ **Flujo UI mejorado:**
- Modal de entrega aparece SIEMPRE (antes faltaba para 1 farmacia)
- Paciente ve opción clara: recojo o delivery
- Si delivery, requiere dirección (validado)

---

## 📝 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `/app/api/recetas/pagar/route.ts` | ✨ Recibe + valida + guarda tipo_entrega, direccion_entrega, costo_entrega |
| `/app/dashboard/paciente/farmacias/[recetaId]/page.tsx` | ✨ Modal de entrega, estados, lógica `confirmarEntregaYProceder` |
| `/app/api/recetas/[id]/enviar-farmacia/route.ts` | ✅ YA existía, ahora se usa también para múltiples |

---

## 🎓 Próximos Pasos (Recomendado)

1. **Testing en UI:**
   - Probar 1 farmacia con recojo
   - Probar 1 farmacia con delivery + dirección
   - Probar múltiples farmacias con ambas opciones

2. **Verificar en BD:**
   - Confirmar que `tipo_entrega`, `direccion_entrega`, `costo_entrega` se guardan correctamente
   - Verificar en farmacia que ve la opción de entrega seleccionada

3. **Complementar Farmacia:**
   - Verificar que componente `DespachoRecetas` muestre correctamente:
     - "Recojo en Farmacia" o "Domicilio"
     - Dirección si es domicilio
     - Costo correcto en total

---

**Estado:** ✅ COMPLETADO Y COMPILADO - 28 de Noviembre de 2025
