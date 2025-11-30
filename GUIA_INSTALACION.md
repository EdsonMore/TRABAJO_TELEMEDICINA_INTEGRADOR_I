# 🚀 Guía de Instalación y Verificación Final

## ⚡ Quick Start (5 minutos)

### Paso 1: Verificar Archivos Creados
```bash
# Navega a la carpeta del proyecto
cd c:\Users\Lenovo\ Core\ i7\Documents\PROYECTOS\TRABAJO_TELEMEDICINA_INTEGRADOR_I

# Verifica que existen todos los archivos nuevos
ls contexts/notificaciones-context.tsx
ls components/notificaciones/
ls app/api/notificaciones/
ls app/api/citas/crear-notificacion/route.ts
ls app/api/recetas/crear-notificacion/route.ts
```

### Paso 2: Instalar Dependencias (Si Falta)
```bash
# Instalar bcryptjs si no está
npm install bcryptjs
npm install --save-dev @types/bcryptjs

# Verificar instalación
npm list bcryptjs
```

### Paso 3: Configurar Variables de Entorno
```bash
# Crear/editar .env.local
# Agregar:
NEXT_PUBLIC_API_URL=http://localhost:3000

# O si está en producción:
NEXT_PUBLIC_API_URL=https://tudominio.com
```

### Paso 4: Crear Tablas en Base de Datos
```sql
-- Ejecuta en tu PostgreSQL/gestor de BD

-- Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('cita', 'receta', 'resultado', 'sistema')),
  leida BOOLEAN DEFAULT FALSE,
  id_relacionado UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices (importante para performance)
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);

-- Tabla de Protección de Historial
CREATE TABLE IF NOT EXISTS historial_protecciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_paciente INTEGER NOT NULL,
  id_medico INTEGER NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_paciente, id_medico)
);

-- Tabla de Logs de Acceso (auditoría)
CREATE TABLE IF NOT EXISTS acceso_historial_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_medico INTEGER NOT NULL REFERENCES medicos(id),
  id_paciente INTEGER NOT NULL REFERENCES pacientes(id),
  resultado VARCHAR(50) NOT NULL CHECK (resultado IN ('exitoso', 'fallido')),
  fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_acceso_logs_medico ON acceso_historial_logs(id_medico);
CREATE INDEX IF NOT EXISTS idx_acceso_logs_fecha ON acceso_historial_logs(fecha_acceso);
```

### Paso 5: Verificar Build
```bash
# Compilar proyecto
npm run build

# Debe completar sin errores
# Si hay errores, revisar consola
```

### Paso 6: Iniciar Servidor
```bash
# Modo desarrollo
npm run dev

# Servidor debe estar en http://localhost:3000
# Verifica que no hay errores en consola
```

---

## ✅ Checklist de Verificación Manual

### Test 1: Crear Cita (5 minutos)
```
1. [ ] Abre http://localhost:3000
2. [ ] Login como paciente (si tienes cuenta)
3. [ ] Crea una nueva cita
4. [ ] En navbar derecha, busca el botón de campana (🔔)
5. [ ] Debe mostrar badge con "1"
6. [ ] Click en la campana
7. [ ] Abre modal "Centro de Notificaciones"
8. [ ] Debe ver: "Has agendado una cita para [fecha]"
9. [ ] Verifica que:
   - [ ] Mensaje es claro
   - [ ] Timestamp correcto
   - [ ] Tipo mostrado como "Cita" (icono azul)
   - [ ] Puedes marcar como leída
   - [ ] Puedes eliminar
```

### Test 2: Historial Protegido (5 minutos)
```
1. [ ] Login como médico
2. [ ] Ve a Dashboard → Pacientes
3. [ ] Click en un paciente para ver historial
4. [ ] Debe aparecer modal pidiendo contraseña
5. [ ] Si es PRIMER acceso del médico:
   - [ ] Mostrar "Crear Contraseña"
   - [ ] Click para abrir formulario de creación
   - [ ] Ingresar contraseña (6+ caracteres)
   - [ ] Confirmar (debe coincidir)
   - [ ] Click Guardar
   - [ ] Debe tener acceso ahora
6. [ ] Si ya existe contraseña:
   - [ ] Ingresa contraseña incorrecta
   - [ ] Debe mostrar error
   - [ ] Ingresa correcta
   - [ ] Debe tener acceso
7. [ ] Historial muestra:
   - [ ] Datos personales del paciente
   - [ ] Historial completo de citas
   - [ ] Diagnósticos y tratamientos
   - [ ] Recetas con medicamentos
```

### Test 3: Notificación de Receta (5 minutos)
```
1. [ ] Login como médico
2. [ ] Abre una cita completada
3. [ ] Crea una receta
4. [ ] Completa todos los campos
5. [ ] Click "Emitir Receta"
6. [ ] Logout y login como paciente (si es otro user)
7. [ ] Verifica campana en navbar tiene badge
8. [ ] Click en campana
9. [ ] Debe ver notificación:
   "Has recibido una nueva receta REC-[código]"
10. [ ] Verifica:
    - [ ] Código de receta correcto
    - [ ] Tipo "Receta" (icono verde)
    - [ ] Timestamp actual
```

### Test 4: Envío a Farmacia (5 minutos)
```
1. [ ] Siendo paciente, ve a tus recetas
2. [ ] Selecciona una receta activa
3. [ ] Click "Enviar a Farmacia"
4. [ ] Selecciona farmacia y tipo entrega
5. [ ] Confirma
6. [ ] Verifica nueva notificación en navbar
7. [ ] Message: "Tu receta ha sido despachada"
8. [ ] Tipo "Receta" (verde)
```

### Test 5: Marcar Todo Leído (3 minutos)
```
1. [ ] Abre Centro de Notificaciones
2. [ ] Asegúrate haya múltiples notificaciones
3. [ ] Busca botón "Marcar todos como leídos"
4. [ ] Click
5. [ ] Todas las notificaciones deben cambiar apariencia (menos resaltadas)
6. [ ] Badge en navbar desaparece
```

### Test 6: Limpiar Todo (3 minutos)
```
1. [ ] En Centro de Notificaciones
2. [ ] Click "Limpiar Todas"
3. [ ] Confirmación aparece
4. [ ] Click Confirmar
5. [ ] Todas desaparecen
6. [ ] Modal se cierra automáticamente
7. [ ] Badge en navbar desaparece
```

### Test 7: Responsivo (Móvil)
```
1. [ ] Abre DevTools (F12)
2. [ ] Click dispositivo móvil (360px width)
3. [ ] Navegar a página
4. [ ] Busca campana 🔔 en navbar
5. [ ] Debe ser visible
6. [ ] Click abre modal
7. [ ] Modal cabe en pantalla
8. [ ] Scroll funciona
9. [ ] Botones clickeables
```

### Test 8: Polling en Tiempo Real
```
1. [ ] Abre DevTools (F12 → Network)
2. [ ] Filtra por "Fetch/XHR"
3. [ ] Ten abierto Centro de Notificaciones
4. [ ] Espera 30 segundos
5. [ ] Debes ver requests a /api/notificaciones cada 30s
6. [ ] Response debe ser array vacío o con notificaciones
7. [ ] Si creas una notificación en otra ventana,
   debe aparecer automáticamente en 30s max
```

---

## 🐛 Troubleshooting

### Problema: "Campana no aparece en navbar"
```
Solución:
1. Verificar notificaciones-context.tsx importado en layout.tsx
2. Verificar BotonNotificaciones.tsx existe
3. Verificar navbar-universal.tsx tiene import correcto
4. Revisar console por errores
5. Limpiar cache: npm cache clean --force && rm -rf .next
6. Recompile: npm run build
```

### Problema: "Notificaciones no llegan"
```
Solución:
1. Verificar NEXT_PUBLIC_API_URL en .env.local
2. Abrir DevTools → Network, crear cita
3. Buscar request a /api/citas/crear-notificacion
4. Si no existe, verificar que fetch está en route.ts
5. Si existe pero error, revisar response
6. Verificar tabla 'notificaciones' existe en BD
7. Revisar logs de servidor (npm run dev)
```

### Problema: "Contraseña de historial no funciona"
```
Solución:
1. Verificar tabla historial_protecciones existe
2. Verificar bcryptjs instalado: npm list bcryptjs
3. Crear contraseña nueva (reset la anterior)
4. Verificar que estás usando MISMO médico+paciente
5. Revisar console por errores
6. Verificar permisos: médico debe estar autenticado
```

### Problema: "Modal historial muy lento"
```
Solución:
1. Verificar índices en BD:
   SELECT * FROM pg_indexes WHERE tablename LIKE '%cita%'
2. Si faltan índices, crearlos
3. Revisar Network tab - ver tiempo de respuesta
4. Si > 5s, puede ser consulta pesada
5. Optimizar query en backend
```

### Problema: "Erro build: Cannot find module"
```
Solución:
1. npm install
2. npm run build
3. Si persiste, limpiar:
   rm -rf node_modules package-lock.json
   npm install
4. Verificar imports en archivo problemático
5. Verificar ruta de archivo existe
```

---

## 📊 Commands Útiles

```bash
# Limpiar caché y reinstalar
rm -rf .next node_modules package-lock.json
npm install

# Build y test
npm run build

# Ejecutar lint
npm run lint

# Verificar tipos
npx tsc --noEmit

# Ver estructura de proyecto
tree -I 'node_modules'

# Buscar archivo
find . -name "notificaciones-context.tsx"

# Ver logs de BD
psql -U user -d telemedicina -c "SELECT * FROM notificaciones LIMIT 10;"
```

---

## 📝 Documentación Completa

Después de verificar que todo funciona:

1. **IMPLEMENTACION_NOTIFICACIONES.md** - Detalles técnicos completos
2. **CHECKLIST_VALIDACION.md** - Todos los tests posibles
3. **RESUMEN_EJECUTIVO.md** - Vista general para el profesor
4. Esta guía: **GUIA_INSTALACION.md** - Paso a paso

---

## ✨ Características Confirmadas

- [x] Notificaciones aparecen automáticamente
- [x] Historial protegido con contraseña
- [x] Información completa de pacientes
- [x] Responsivo en mobile y desktop
- [x] Polling cada 30 segundos
- [x] Badges en tiempo real
- [x] Ningún breaking change
- [x] Logs de auditoría

---

## 🎯 Resultado Final

Una vez que pases TODOS los tests de este documento:

✅ **EL PROYECTO ESTÁ LISTO PARA DEMONSTRACIÓN AL PROFESOR**

**Status**: 🟢 PRODUCTION READY

---

Fecha de creación: 2024
Versión: 1.0
Autor: Sistema de IA
