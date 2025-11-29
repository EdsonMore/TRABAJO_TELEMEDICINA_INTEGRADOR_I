# 🧪 Guía de Testing - Flujos de Farmacia

## Cómo Probar los Cambios Implementados

### 🔧 Requisitos
- Servidor ejecutándose: `npm run dev`
- Usuario autenticado como farmacia
- Base de datos sincronizada
- Token de autenticación válido

---

## ✅ Testing de RecetasRecibidas

### Caso 1: Aceptar Receta
**Objetivo**: Verificar que la receta se acepta sin alertas

**Pasos:**
1. Navega a `/dashboard/farmacia`
2. Ve a la sección "Recetas Recibidas"
3. Filtra por estado "Enviada"
4. Busca una receta en estado "enviada"
5. Haz click en botón "Aceptar"

**Resultado Esperado:**
- [ ] Aparece AlertDialog pidiendo confirmación
- [ ] No aparece alerta del navegador (`alert()`)
- [ ] Al hacer click en "Aceptar", muestra notificación verde
- [ ] Después de ~1.5 segundos, redirige a `/dashboard/farmacia/despacho-recetas`
- [ ] No aparecen alertas de error

**Evidencia Visual:**
```
✓ Dialog de confirmación
✓ Notificación verde: "Receta aceptada correctamente"
✓ Redirección automática
✓ Receta visible en DespachoRecetas
```

---

### Caso 2: Rechazar Receta
**Objetivo**: Verificar que el rechazo funciona con motivo

**Pasos:**
1. En RecetasRecibidas, haz click en "Rechazar"
2. En el modal que aparece, desplázate a la sección "Rechazar Receta"
3. Ingresa un motivo (ej: "Medicamento sin stock")
4. Haz click en "Confirmar Rechazo"

**Resultado Esperado:**
- [ ] Dialog de confirmación aparece
- [ ] Al confirmar, muestra notificación verde
- [ ] La receta cambia a estado "rechazada"
- [ ] Desaparece de la vista de "Enviada"
- [ ] Si filtras por "Rechazada", la ves allá
- [ ] No hay alertas del navegador

**Evidencia Visual:**
```
✓ Form de motivo con border rojo
✓ Dialog de confirmación
✓ Notificación de éxito
✓ Receta actualizada en lista
```

---

### Caso 3: Validación - Sin Motivo de Rechazo
**Objetivo**: Verificar que no permite rechazar sin motivo

**Pasos:**
1. Abre modal de receta
2. Intenta hacer click en "Confirmar Rechazo" SIN escribir motivo
3. Observa que el botón está deshabilitado

**Resultado Esperado:**
- [ ] Botón "Confirmar Rechazo" está gris (disabled)
- [ ] No se puede hacer click
- [ ] No aparece notificación de error
- [ ] Si escribes motivo, botón se activa

**Evidencia Visual:**
```
✓ Botón deshabilitado cuando textarea está vacío
✓ Botón habilitado cuando hay texto
```

---

## ✅ Testing de DespachoRecetas

### Caso 4: Preparar Receta
**Objetivo**: Verificar que el cambio de "preparar" funciona sin alertas

**Pasos:**
1. Navega a `/dashboard/farmacia/despacho-recetas`
2. Filtra por "Pendientes"
3. Haz click en una receta para verla en modal
4. Haz click en botón "Preparar"

**Resultado Esperado:**
- [ ] Dialog de confirmación aparece
- [ ] Al confirmar, muestra loader
- [ ] Notificación verde: "Receta marcada como en preparación"
- [ ] La receta desaparece de "Pendientes"
- [ ] Al cambiar a filtro "En Proceso", la receta aparece allá
- [ ] No hay alertas del navegador

**Evidencia Visual:**
```
✓ Dialog: "¿Está seguro de preparar esta receta?"
✓ Loader durante procesamiento
✓ Notificación verde
✓ Estado cambiado automáticamente
```

---

### Caso 5: Despachar Receta con Medicamentos
**Objetivo**: Verificar que el despacho funciona correctamente

**Pasos:**
1. Selecciona una receta en estado "En Proceso"
2. En el modal, selecciona medicamentos a despachar
3. Ingresa cantidades válidas (≤ stock disponible)
4. Haz click en "Despachar"

**Resultado Esperado:**
- [ ] Dialog de confirmación muestra resumen
- [ ] Al confirmar, procesa en background
- [ ] Notificación verde: "Receta dispensada correctamente"
- [ ] Receta desaparece de lista
- [ ] Al filtrar "Dispensadas", la ves allá
- [ ] Stock se actualiza en base de datos

**Evidencia Visual:**
```
✓ Dialog de confirmación con medicamentos
✓ Loader durante despacho
✓ Notificación de éxito
✓ Transición a "Dispensadas"
```

---

### Caso 6: Validación - Stock Insuficiente
**Objetivo**: Verificar que no permite despachar sin stock suficiente

**Pasos:**
1. Abre una receta
2. Ingresa una cantidad MAYOR al stock disponible
3. Intenta despachar

**Resultado Esperado:**
- [ ] Aparece notificación ROJA
- [ ] Mensaje específico: "Stock insuficiente para [medicamento]. Disponible: X, Solicitado: Y"
- [ ] Dialog de confirmación NO aparece
- [ ] Puedes corregir la cantidad y reintentar

**Evidencia Visual:**
```
✓ Notificación roja con mensaje específico
✓ No se bloquea la UI
✓ Usuario puede corregir y reintentar
```

---

### Caso 7: Rechazar Receta en Despacho
**Objetivo**: Verificar rechazo en DespachoRecetas

**Pasos:**
1. Abre una receta
2. Desplázate a sección "Rechazar"
3. Ingresa motivo (ej: "Medicamento vencido")
4. Haz click en "Rechazar"

**Resultado Esperado:**
- [ ] Dialog de confirmación
- [ ] Notificación verde
- [ ] Receta marcada como "rechazada"
- [ ] Desaparece de lista actual
- [ ] Motivo se guarda en base de datos

---

## 🔄 Testing de Integración

### Caso 8: Flujo Completo Aceptar → Preparar → Despachar
**Objetivo**: Verificar que el flujo completo funciona

**Pasos:**
1. En RecetasRecibidas, acepta una receta
2. Se redirige automáticamente a DespachoRecetas
3. Hace click en "Preparar"
4. Receta se mueve a "En Proceso"
5. Hace click en "Despachar" con medicamentos seleccionados
6. Receta se mueve a "Dispensadas"

**Resultado Esperado:**
- [ ] Cada paso muestra diálogos de confirmación
- [ ] Cada paso muestra notificación de éxito
- [ ] Estados se actualizan automáticamente
- [ ] Lista se recarga sin refrescar la página
- [ ] No hay alertas del navegador en ningún momento
- [ ] El paciente ve cambios en su dashboard

---

## 🐛 Testing de Errores

### Caso 9: Error de Conexión
**Objetivo**: Verificar manejo de errores de red

**Pasos:**
1. Desconecta la red o simula error en DevTools
2. Intenta hacer una acción (aceptar/rechazar)
3. Observa el comportamiento

**Resultado Esperado:**
- [ ] Notificación ROJA con mensaje de error
- [ ] No se actualiza el estado local
- [ ] El usuario puede reintentar sin afectar datos
- [ ] No hay alertas de JavaScript

---

### Caso 10: Token Expirado
**Objetivo**: Verificar manejo de autenticación

**Pasos:**
1. Abre DevTools → Application → Cookies
2. Elimina el token de autenticación
3. Intenta hacer una acción

**Resultado Esperado:**
- [ ] Notificación de error
- [ ] Redirige a `/auth/login` después del error
- [ ] No hay datos corruptos en base de datos

---

## 📊 Checklist de Pruebas Completas

### Componente RecetasRecibidas
- [ ] Caso 1: Aceptar receta
- [ ] Caso 2: Rechazar receta
- [ ] Caso 3: Validación motivo
- [ ] Notificaciones se cierran al hacer click en X
- [ ] Tabla se actualiza automáticamente
- [ ] Filtros funcionan correctamente
- [ ] Búsqueda funciona

### Componente DespachoRecetas
- [ ] Caso 4: Preparar receta
- [ ] Caso 5: Despachar con medicamentos
- [ ] Caso 6: Validación stock
- [ ] Caso 7: Rechazar receta
- [ ] Estados se actualizan correctamente
- [ ] Medicamentos se deseleccionan después de despacho

### Integración
- [ ] Caso 8: Flujo completo
- [ ] Redirecciones automáticas funcionan
- [ ] Datos se sincronizan entre componentes

### Errores
- [ ] Caso 9: Manejo de errores de conexión
- [ ] Caso 10: Manejo de token expirado
- [ ] Mensajes de error son claros

### UI/UX
- [ ] No hay alertas del navegador (`alert()`)
- [ ] Las notificaciones son claras y visibles
- [ ] Los diálogos de confirmación son obvios
- [ ] Los iconos son coherentes
- [ ] Los colores son diferenciados (verde/rojo)
- [ ] Responsive en móvil

---

## 🎯 Performance

### Medir con DevTools:

**Tiempo de respuesta esperado:**
- Aceptar receta: < 2 segundos
- Preparar receta: < 2 segundos
- Despachar receta: < 3 segundos
- Actualización de lista: < 1 segundo

**Memory leaks:**
- [ ] Abre y cierra modales 10 veces
- [ ] Observa memoria en DevTools (no debe crecer)

---

## 📝 Reporte de Bugs

Si encuentras problemas, reporta con:

```
Componente: [RecetasRecibidas / DespachoRecetas]
Caso: [Número del caso]
Descripción: [Lo que sucedió]
Esperado: [Lo que debería suceder]
Pasos para reproducir:
1. ...
2. ...
3. ...
Captura de pantalla: [Si es posible]
```

---

## ✨ Conclusión

Después de pasar todos estos casos de prueba, el sistema debe:
- ✅ No tener alertas del navegador
- ✅ Mostrar notificaciones visuales claras
- ✅ Tener confirmaciones para acciones críticas
- ✅ Mantener estados coherentes
- ✅ Actualizar automáticamente
- ✅ Manejar errores gracefully
- ✅ Ser responsive

**Si todos los casos pasan, el proyecto está listo para producción.** 🚀
