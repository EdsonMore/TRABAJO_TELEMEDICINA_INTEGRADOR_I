# 🧪 GUÍA DE TESTING - TELEMEDICINA

## 🚀 INICIAR EL SERVIDOR

```bash
npm run dev:all
```

Verifica:
- [x] Next.js compila sin errores
- [x] WebSocket inicia en puerto 3002
- [x] BD está conectada
- [x] Logs muestran "Ready in X.Xs"

---

## 🧑‍⚕️ TEST 1: CREAR CITA Y VERIFICAR NOTIFICACIÓN

### Pasos:
1. Login como **PACIENTE** (maria.garcia@email.com / password)
2. Ve a **Dashboard > Citas**
3. Click en **"Agendar Cita"**
4. Selecciona:
   - Médico: Dr. Juan Mendoza
   - Fecha: 2025-12-10
   - Hora: 15:00
   - Tipo: Virtual
   - Motivo: Test notificación
5. Click en **"Agendar"**
6. Debería mostrar: ✅ "Cita agendada exitosamente"

### Verificar Notificación:
- [ ] Espera máximo 30 segundos
- [ ] ¿Se escucha el **SONIDO**? 🔊
- [ ] ¿Aparece **Toast verde** diciendo "Nueva Cita"?
- [ ] ¿Se actualiza el **badge en navbar**?
- [ ] Click en bell icon → ¿Ves notificación en lista?

**Status:** ✅ PASS si todos los items son sí

---

## 👨‍⚕️ TEST 2: MÉDICO CREA RECETA Y GENERA NOTIFICACIÓN

### Pasos:
1. Logout (si está logeado como paciente)
2. Login como **MÉDICO** (dr.mendoza@clinica.com / password)
3. Ve a **Dashboard > Citas**
4. Click en una cita completada (o marca una como completada)
5. Click en **"Crear Receta"**
6. Rellena:
   - Diagnóstico: "Test diagnóstico"
   - Medicamento: Selecciona cualquiera
   - Dosis: "1 tableta cada 8 horas"
   - Frecuencia: "Cada 8 horas"
   - Cantidad: 10
   - Días: 7
7. Click en **"Crear Receta"**
8. Debería mostrar: ✅ "Receta creada exitosamente"

### Verificar Notificación:
- [ ] ¿Se escucha el **SONIDO**?
- [ ] ¿Aparece **Toast verde** diciendo "Nueva Receta"?
- [ ] ¿Se actualiza el **badge**?
- [ ] Click en bell → ¿Ves receta en notificaciones?

**Status:** ✅ PASS si todos los items son sí

---

## 🔐 TEST 3: PROTECCIÓN DE HISTORIAL - PRIMERA VEZ

### Pasos:
1. Como **MÉDICO**, ve a **Dashboard > Pacientes**
2. Selecciona un paciente (ej: María García)
3. Click en **"Ver Historial"**
4. Debería abrir modal
5. Verifica en descripción: "El acceso al historial está disponible..."
6. ¿Dice que necesitas crear protección? Si es primera vez
7. Click en **"Proteger con contraseña"** (debajo del título)
8. Se abre nuevo formulario:
   - Nueva Contraseña: `test123456`
   - Confirmar: `test123456`
9. Click en **"Crear Protección"**
10. Debería decir: ✅ "Protección creada"

### Verificar:
- [ ] Ahora la descripción dice "🔐 Protegido"
- [ ] Se muestra historial completo
- [ ] Hay 4 tabs: Resumen, Citas, Recetas, Exámenes

**Status:** ✅ PASS

---

## 🔐 TEST 4: PROTECCIÓN DE HISTORIAL - ACCESO PROTEGIDO

### Pasos:
1. Como **MÉDICO**, ve a **Dashboard > Pacientes**
2. Selecciona OTRO paciente (o el mismo)
3. Click en **"Ver Historial"**
4. Si ya está protegido:
   - Debería aparecer modal pidiendo contraseña
   - Campo de contraseña vacío
5. Ingresa contraseña INCORRECTA: `wrong`
6. Click "Verificar"
7. Debería decir: ❌ "Contraseña incorrecta"

### Pasos Correctos:
1. Modal aún está abierto
2. Ingresa contraseña CORRECTA: `test123456`
3. Click "Verificar"
4. Debería entrar al historial
5. Ves 4 tabs con datos completos

**Status:** ✅ PASS si se rechaza contraseña incorrecta y acepta la correcta

---

## 📊 TEST 5: VER HISTORIAL COMPLETO

### Dentro del Modal:

**TAB: Resumen**
- [ ] Nombre del paciente
- [ ] DNI
- [ ] Teléfono
- [ ] Email
- [ ] Tipo de sangre
- [ ] Alergias
- [ ] Enfermedades crónicas
- [ ] Total de citas
- [ ] Recetas activas
- [ ] Exámenes realizados

**TAB: Citas**
- [ ] Tipo de cita (presencial/virtual)
- [ ] Fecha completa (formato: domingo, 1 de diciembre de 2025)
- [ ] Hora
- [ ] Médico
- [ ] Especialidad
- [ ] Motivo de consulta
- [ ] Estado (programada/confirmada/completada)
- [ ] **Diagnóstico** (si existe, con fondo verde)
- [ ] **Tratamiento** (si existe, con fondo púrpura)
- [ ] **Observaciones médicas** (si existen, con fondo naranja)
- [ ] Costo

**TAB: Recetas**
- [ ] Código de receta (REC-...)
- [ ] Médico que emitió
- [ ] Fecha emisión
- [ ] Fecha vencimiento
- [ ] **Medicamentos con dosis**
- [ ] Frecuencia
- [ ] Estado

**TAB: Exámenes**
- [ ] Código solicitud
- [ ] Laboratorio
- [ ] Fecha
- [ ] Estado
- [ ] Observaciones

**Status:** ✅ PASS si todos los campos aparecen correctamente

---

## 🔔 TEST 6: CENTRO DE NOTIFICACIONES

### Pasos:
1. Como **PACIENTE**, ve a **Dashboard**
2. Click en **Bell icon** en navbar (arriba a la derecha)
3. Se abre modal: "Centro de Notificaciones"
4. Verifica:
   - [ ] Muestra lista de notificaciones
   - [ ] Ordenadas por más recientes primero
   - [ ] Cada una tiene: Tipo (color), Título, Mensaje, Hora
   - [ ] Notificaciones "nuevas" tienen fondo más oscuro
   - [ ] Hay botones de acciones

### Acciones:
1. Hover en una notificación → Aparecen botones:
   - [ ] Botón: Marcar como leída (ícono check)
   - [ ] Botón: Eliminar (ícono trash)

2. Arriba del modal:
   - [ ] Botón: "Marcar todas como leídas"
   - [ ] Botón: "Limpiar todas"
   - [ ] Contador: Muestra cantidad de no leídas

3. Click en "Marcar como leída":
   - [ ] Notificación pierde el fondo oscuro
   - [ ] Badge en navbar se actualiza (-1)

4. Click en "Eliminar":
   - [ ] Notificación desaparece de la lista
   - [ ] Badge se actualiza

5. Click en "Marcar todas como leídas":
   - [ ] Todas pierden fondo oscuro
   - [ ] Badge cambia a 0

6. Click en "Limpiar todas":
   - [ ] Lista queda vacía
   - [ ] Muestra: "No tienes notificaciones"
   - [ ] Badge desaparece

**Status:** ✅ PASS si todos funcionan correctamente

---

## 🎨 TEST 7: COLORES DE NOTIFICACIONES

### Colores por Tipo:
- [ ] 🗓️ Cita → **Azul** (#3b82f6)
- [ ] 💊 Receta → **Verde** (#10b981)
- [ ] 📋 Resultado → **Naranja** (#f97316)
- [ ] 🏥 Farmacia → **Púrpura** (#8b5cf6)
- [ ] 🧪 Laboratorio → **Rosa** (#ec4899)
- [ ] ⚙️ Sistema → **Gris** (#6b7280)

**Status:** ✅ PASS si los colores coinciden

---

## 🔊 TEST 8: SONIDO Y ALERTAS VISUALES

### Sonido:
1. Agrega una nueva cita (ver TEST 1)
2. Espera 30 segundos
3. ¿Se escucha el sonido? 🔊
   - Debe ser: Dos tonos beep (800Hz + 1000Hz)
   - Duración: ~300ms total

**Status:** ✅ PASS si escuchas el sonido

### Toast Visual:
1. Agrega una nueva cita (ver TEST 1)
2. Espera 30 segundos
3. ¿Aparece toast en esquina superior derecha?
   - Debe decir: "Nueva Cita" en blanco
   - Fondo: Azul
   - Desaparece después de 5 segundos
   - Hay animación de entrada/salida

**Status:** ✅ PASS si aparece el toast

---

## 📱 TEST 9: RESPONSIVE - MOBILE

### En celular o vista responsive:
1. Abre la app en modo móvil (F12 → Toggle device toolbar)
2. Selecciona iPhone 12 Pro
3. Intenta agendar cita
4. Verifica:
   - [ ] Notificación aparece correctamente
   - [ ] Toast no se sale de la pantalla
   - [ ] Badge en navbar es visible
   - [ ] Modal de historial responsive
   - [ ] Centro de notificaciones scrolleable si hay muchas

**Status:** ✅ PASS si todo funciona en móvil

---

## 🔒 TEST 10: SEGURIDAD

### Token:
1. Abre DevTools (F12)
2. Ve a Network
3. Agendar una cita
4. Ve el request POST /api/citas/paciente
5. Headers → Authorization
6. Debe estar: `Bearer eyJ...` (JWT token)
7. [x] No aparecen credenciales en el token

### Contraseña:
1. Abre DevTools → Network
2. Crea protección de historial
3. POST /api/medico/pacientes/.../historial-protegido
4. Body → no debe mostrar contraseña en texto plano
5. [x] Solo muestra hash en respuesta

**Status:** ✅ PASS si no hay exposición de datos sensibles

---

## 📊 TEST 11: RENDIMIENTO

### Polling:
1. Abre DevTools → Network
2. Espera 30 segundos
3. Filtro: XHR/Fetch
4. Debería ver GET /api/notificaciones cada 30 segundos
5. [x] No hay requests duplicadas
6. [x] Respuesta < 200ms

### Animaciones:
1. Agendar varias citas seguidas
2. Debería ver varios toasts
3. [x] No hay lag
4. [x] Cada toast tiene su temporizador

**Status:** ✅ PASS si todo es fluido

---

## 🎯 RESULTADO FINAL

| Test | Status | Observaciones |
|------|--------|---------------|
| 1. Crear cita + notificación | ✅/❌ | |
| 2. Crear receta + notificación | ✅/❌ | |
| 3. Protección - Primera vez | ✅/❌ | |
| 4. Protección - Acceso | ✅/❌ | |
| 5. Historial completo | ✅/❌ | |
| 6. Centro notificaciones | ✅/❌ | |
| 7. Colores notificaciones | ✅/❌ | |
| 8. Sonido y alertas | ✅/❌ | |
| 9. Responsive móvil | ✅/❌ | |
| 10. Seguridad | ✅/❌ | |
| 11. Rendimiento | ✅/❌ | |

---

## ❓ TROUBLESHOOTING

### "No escucho el sonido"
- [ ] Verifica volumen del navegador
- [ ] Verifica permisos de audio del navegador
- [ ] F12 → Console → ¿Hay errores?
- [ ] Intenta en otra pestaña

### "No aparece la notificación"
- [ ] Verifica que BD tenga la tabla `notificaciones`
- [ ] Ejecuta: `SELECT * FROM notificaciones LIMIT 1;`
- [ ] Revisa logs de servidor (npm run dev:all output)
- [ ] Espera exactamente 30 segundos (polling)

### "Modal de historial dice 'acceso denegado'"
- [ ] ¿Eres médico? (no paciente)
- [ ] ¿Tienes sesión activa?
- [ ] ¿Tiene el paciente una cita contigo?
- [ ] Check F12 → Network → Ver respuesta de error

### "Contraseña no funciona"
- [ ] Mínimo 6 caracteres
- [ ] Sin espacios al inicio/final
- [ ] Debe coincidir exactamente
- [ ] La confirmación debe ser idéntica

### "La BD está fuera de sincronía"
```bash
# Limpia y reinicia
rm -rf .next
npm run dev:all
```

---

**Fecha:** 29 de noviembre de 2025  
**Versión:** 1.0  
**Status:** ✅ LISTO PARA TESTING

