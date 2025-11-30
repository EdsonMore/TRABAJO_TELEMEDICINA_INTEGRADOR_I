README - SISTEMA DE NOTIFICACIONES Y PROTECCIÓN DE HISTORIAL
=============================================================

## 🚀 INICIO RÁPIDO

### 1. Ejecutar Migraciones de Base de Datos

```bash
# En tu cliente PostgreSQL (psql, pgAdmin, etc)
psql -U tu_usuario -d telemedicina_db -f scripts/migrations-notificaciones.sql
```

**O manualmente en pgAdmin**:
1. Abrir pgAdmin
2. Conectar a la base de datos `telemedicina_db`
3. Abrir "Query Tool"
4. Copiar contenido de `scripts/migrations-notificaciones.sql`
5. Ejecutar

### 2. Reiniciar la Aplicación

```bash
npm run dev
# o
pnpm dev
```

### 3. ¡Listo! La aplicación ahora tiene:

✅ Sistema de notificaciones completo
✅ Protección de historial médico
✅ Alertas sonoras y visuales
✅ Centro de notificaciones

---

## 📱 CÓMO USAR

### Para Médicos:

**Ver Historial Protegido**:
1. Dashboard → Pacientes
2. Seleccionar paciente
3. "Ver Historial"
4. Si es primera vez: opción para "Proteger con contraseña"
5. Próximas veces: ingresa la contraseña

**Recibir Notificaciones**:
- Se crea automáticamente cuando:
  - Un paciente agenda una cita
  - Un paciente envía una receta a farmacia
  - Cambios en estado de citas/recetas
- Verlas en la campana (🔔) en la esquina superior derecha

### Para Pacientes:

**Ver Notificaciones**:
1. Click en campana (🔔) en navbar
2. Ver todas las notificaciones
3. Click para marcar como leído
4. "Limpiar todas" para eliminar todas

**Recibir Notificaciones**:
- Aparece un toast (popup) en esquina superior derecha
- Escuchas un sonido (dos tonos)
- Si has permitido, notificación del navegador
- Se guarda en "Centro de Notificaciones"

---

## 📊 CARACTERÍSTICAS

### Protección de Historial
```
Primera vez que médico accede:
  Opción: "Proteger con contraseña"
         ↓
  Crea contraseña (6+ caracteres)
         ↓
  Se hashea y guarda en BD
         ↓
  Próxima vez (cualquier médico):
  Debe ingresar contraseña
  (se valida contra el hash)
```

### Notificaciones
```
Tipos de notificaciones:
  - Cita (Azul)
  - Receta (Verde)
  - Resultado de Examen (Naranja)
  - Despacho de Farmacia (Púrpura)
  - Laboratorio (Rosa)
  - Sistema (Gris)

Alertas:
  1. Sonido (dos tonos sintetizados)
  2. Toast visual (popup animado)
  3. Notificación del navegador
  4. Badge contador en campana
```

---

## 🔧 ENDPOINTS API

```
GET    /api/notificaciones              - Obtener todas
POST   /api/notificaciones              - Crear nueva
PATCH  /api/notificaciones/[id]         - Marcar como leída
DELETE /api/notificaciones/[id]         - Eliminar
POST   /api/notificaciones/marcar-todo-leido    - Marcar todas leídas
POST   /api/notificaciones/limpiar-todas        - Eliminar todas

POST   /api/medico/pacientes/[id]/historial-protegido
  - Acciones: check, verify, create, update (protección)

POST   /api/citas/crear-notificacion           - Trigger para citas
POST   /api/recetas/crear-notificacion         - Trigger para recetas
```

---

## 📋 ESTRUCTURA DE ARCHIVOS

```
contexts/
  ├── notificaciones-context.tsx        (State management)

components/
  ├── notificaciones/
  │   ├── boton-notificaciones.tsx      (Botón en navbar)
  │   └── centro-notificaciones.tsx     (Modal)
  ├── medico/
  │   └── modal-historial-paciente.tsx  (Historial con protección)

app/api/
  ├── notificaciones/
  │   ├── route.ts                      (GET/POST)
  │   ├── [id]/route.ts                 (PATCH/DELETE)
  │   ├── marcar-todo-leido/route.ts
  │   └── limpiar-todas/route.ts
  ├── citas/
  │   ├── crear-notificacion/route.ts   (Trigger)
  ├── recetas/
  │   ├── crear-notificacion/route.ts   (Trigger)
  ├── medico/pacientes/
  │   └── [id]/historial-protegido/route.ts

scripts/
  └── migrations-notificaciones.sql     (BD)

app/
  └── layout.tsx                        (NotificacionesProvider agregado)
```

---

## ✅ CHECKLIST DE TESTING

Después de ejecutar las migraciones, verifica:

### Protección de Historial
- [ ] Médico abre historial de paciente por primera vez
- [ ] Aparece opción "Proteger con contraseña"
- [ ] Ingresa contraseña (6+ caracteres)
- [ ] Se confirma
- [ ] Próxima vez que accede: pide contraseña
- [ ] Otro médico también debe ingresar contraseña

### Notificaciones - Crear Cita
- [ ] Médico crea cita
- [ ] Paciente recibe notificación
- [ ] Se escucha sonido (si volumen está activado)
- [ ] Aparece toast animado en esquina superior derecha
- [ ] Badge en campana muestra "1"
- [ ] Notificación visible en Centro (click en campana)

### Notificaciones - Cambiar Estado Cita
- [ ] Médico marca cita como "Completada"
- [ ] Ambos (médico y paciente) reciben notificación
- [ ] Sonido suena
- [ ] Toast aparece

### Notificaciones - Crear Receta
- [ ] Médico crea receta
- [ ] Paciente recibe notificación
- [ ] Campana muestra contador actualizado

### Notificaciones - Enviar a Farmacia
- [ ] Paciente envía receta a farmacia
- [ ] Farmacia recibe notificación
- [ ] Sonido y toast aparecen para farmacia

### Centro de Notificaciones
- [ ] Click en campana abre modal
- [ ] Todas las notificaciones aparecen listadas
- [ ] Click en notificación puede marcar como leído
- [ ] "Marcar todo como leído" funciona
- [ ] "Limpiar todas" borra todas
- [ ] Colores diferentes por tipo

---

## 🐛 TROUBLESHOOTING

### Las notificaciones no llegan
- ✅ Verificar que las tablas existen: `SELECT * FROM notificaciones;` en BD
- ✅ Verificar la consola del navegador (F12) para errores
- ✅ Verificar que estés logueado correctamente
- ✅ Verificar que el token Bearer es válido

### No se escucha sonido
- ✅ Verificar volumen del navegador
- ✅ Verificar que `Notification.permission` es "granted"
- ✅ Algunos navegadores requieren interacción del usuario antes

### La campana no muestra contador
- ✅ Recargar la página (F5)
- ✅ Verificar que el hook `useNotificaciones()` está siendo usado
- ✅ Verificar en consola si hay errores

### Contraseña de historial no funciona
- ✅ Verificar que tabla `historial_protecciones` existe
- ✅ Contraseña debe tener 6+ caracteres
- ✅ Verificar que el usuario es médico (rol='medico')

---

## 📞 SOPORTE

Si necesitas ayuda:

1. **Revisar logs**: `console.log()` en navegador (F12)
2. **Revisar BD**: `psql` → SELECT queries
3. **Revisar API**: Usar Postman con Bearer token
4. **Revisar componentes**: Verificar que estén importados correctamente

---

## 📚 DOCUMENTACIÓN COMPLETA

Para más detalles, ver:
- `IMPLEMENTACION_COMPLETA.md` - Guía técnica detallada
- `RESUMEN_FINAL_IMPLEMENTACION.md` - Resumen ejecutivo
- Comentarios en el código fuente

---

## 🎉 ¡LISTO!

El sistema está completamente implementado y listo para usar.

Solo requiere:
1. ✅ Ejecutar el script SQL
2. ✅ Reiniciar la aplicación
3. ✅ ¡Disfrutar!

**Estado**: PRODUCCIÓN LISTA ✨
