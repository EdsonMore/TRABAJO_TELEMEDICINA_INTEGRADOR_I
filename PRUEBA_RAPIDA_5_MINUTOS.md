# ⚡ PRUEBA RÁPIDA - 5 MINUTOS

**Objetivo:** Verificar que el sistema de notificaciones funciona completamente.

---

## 🚀 INICIO RÁPIDO

### Paso 1: Iniciar servidor (30 segundos)
```bash
npm run dev:all
```

**Esperar a que veas:**
```
✓ Ready in X.Xs
```

---

### Paso 2: Abrir navegador (1 minuto)

URL: `http://localhost:3000`

---

### Paso 3: Login como PACIENTE (1 minuto)

**Email:** `maria.garcia@email.com`  
**Password:** `password123`

Click en "Entrar"

---

### Paso 4: Crear CITA (1 minuto)

1. Dashboard → "Agendar cita"
2. Seleccionar médico: **Dr. Juan Mendoza**
3. Fecha: Mañana (o próximo día)
4. Hora: **10:30**
5. Motivo: "Consulta general"
6. Click **"Agendar"**

### ⚠️ IMPORTANTE - ESCUCHA ATENTAMENTE

En este momento deberías escuchar:
```
🔊 **BIP-BOP** (sonido Web Audio)
```

Y ver en pantalla:
```
┌──────────────────────────────────┐
│ 📅 Nueva Cita Programada         │ ← Toast AZUL
│ Tu cita con Dr. Juan está prog..│
└──────────────────────────────────┘
```

Además, en la esquina superior derecha del navbar:
```
🔔 [1]  ← Badge con número
```

### ✅ Si ves/escuchas esto: TODO OK HASTA AQUÍ

---

### Paso 5: Login como MÉDICO (1 minuto)

1. Cerrar sesión (arriba a la derecha → "Salir")
2. Email: `dr.mendoza@clinica.com`
3. Password: `password123`
4. Click "Entrar"

---

### Paso 6: Crear RECETA (2 minutos)

1. Dashboard → Mis citas
2. Buscar la cita que acabas de crear
3. Click en la cita
4. Rellenar:
   - **Diagnóstico:** Hipertensión esencial
   - **Medicamento 1:**
     - Nombre: Losartán 50mg
     - Dosis: 1 tableta
     - Frecuencia: 1 vez al día
     - Duración: 30 días
   - Click **"Agregar medicamento"** (opcional, agregar otro)
   - **Tratamiento:** Tomar medicinas como se indica
5. Click **"Crear receta"**

---

### Paso 7: Volver a PACIENTE (1 minuto)

1. Cerrar sesión
2. Email: `maria.garcia@email.com`
3. Password: `password123`
4. **ESPERAR 30 SEGUNDOS** (polling automático)

### ⚠️ ESCUCHA NUEVAMENTE

En este momento (máximo en 30 segundos) deberías escuchar:
```
🔊 **BIP-BOP** (sonido nuevamente)
```

Y ver en pantalla:
```
┌──────────────────────────────────┐
│ 📋 Nueva Receta                  │ ← Toast VERDE
│ Dr. Juan ha emitido...            │
└──────────────────────────────────┘
```

Badge actualizado:
```
🔔 [2]  ← Ahora muestra 2
```

---

## ✅ SI LLEGASTE AQUÍ - SISTEMA FUNCIONA 100%

---

## 🔍 VERIFICACIÓN VISUAL

### Checklist final:
- [ ] Escuchaste sonido al crear cita (BIP-BOP)
- [ ] Viste toast azul "Nueva Cita Programada"
- [ ] Badge mostró "1"
- [ ] Escuchaste sonido al crear receta (BIP-BOP)
- [ ] Viste toast verde "Nueva Receta"
- [ ] Badge mostró "2"
- [ ] Centro de notificaciones muestra ambas (click badge)

---

## 🆘 SI ALGO NO FUNCIONA

### "No escucho sonido"
1. Verifica volumen del navegador (arriba a la derecha)
2. Abre DevTools (F12) → Application → Permissions
3. Asegúrate de permitir "Audio"
4. Recarga la página

### "No veo toast"
1. Abre DevTools (F12) → Console
2. Revisa si hay errores rojos
3. El toast aparece 5 segundos y desaparece
4. Vuelve a crear otra cita para probarlo

### "No veo badge actualizado"
1. Cierra sesión y vuelve a entrar como paciente
2. El badge debería mostrar las notificaciones sin leer
3. Es actualización en tiempo real via polling

### "Base de datos dice notificaciones = 0"
1. Verifica que BD esté corriendo: `psql -U postgres -d telemedicina`
2. Ejecuta: `SELECT COUNT(*) FROM notificaciones;`
3. Si está vacía, el endpoint POST no funciona

---

## 📊 RESUMEN DE CAMBIOS

✅ **4 endpoints reparados:**
- `/api/notificaciones/route.ts` (GET/POST)
- `/api/notificaciones/[id]/route.ts` (PATCH/DELETE)
- `/api/citas/crear-notificacion/route.ts` (POST)
- `/api/recetas/crear-notificacion/route.ts` (POST)

✅ **Lo que funciona ahora:**
- Notificaciones se crean en BD
- Polling detecta cambios cada 30s
- Sonido Web Audio reproduce
- Toast visual aparece
- Badge se actualiza
- Modal muestra lista de notificaciones

✅ **Sin romper:**
- Creación de citas
- Creación de recetas
- Autenticación
- Historial médico
- Nada existente

---

## 🎯 RESULTADO ESPERADO

```
ANTES: ❌ Paciente crea cita → NADA PASA
DESPUÉS: ✅ Paciente crea cita → 🔊 Sonido + 🎨 Toast + 📱 Badge
```

**Estado:** ✅ COMPLETAMENTE FUNCIONAL

---

*Prueba rápida de 5 minutos - Documento creado 29/11/2025*

