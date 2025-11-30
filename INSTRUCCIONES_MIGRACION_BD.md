INSTRUCCIONES DE EJECUCIÓN - MIGRACIONES DE BASE DE DATOS
=========================================================

## 🔥 PASO CRÍTICO ANTES DE USAR LA APLICACIÓN

Sin ejecutar este script, el sistema de notificaciones y protección de historial NO FUNCIONARÁ.

---

## OPCIÓN 1: Terminal (Recomendado para Linux/Mac)

```bash
# Ir al directorio del proyecto
cd /ruta/a/TRABAJO_TELEMEDICINA_INTEGRADOR_I

# Ejecutar el script
psql -U tu_usuario -d telemedicina_db -f scripts/migrations-notificaciones.sql

# Si te pide contraseña, ingresarla
# Esperar a que termine (sin errores)

# Verificar que se crearon las tablas
psql -U tu_usuario -d telemedicina_db -c "\dt notificaciones"
```

**Resultado esperado**:
```
       List of relations
 Schema |       Name       | Type  |  Owner
--------+------------------+-------+---------
 public | notificaciones   | table | tu_usuario
 public | historial_protecciones | table | tu_usuario
 public | acceso_historial_logs | table | tu_usuario
```

---

## OPCIÓN 2: Windows PowerShell

```powershell
# Ir al directorio del proyecto
cd "C:\Users\Lenovo Core i7\Documents\PROYECTOS\TRABAJO_TELEMEDICINA_INTEGRADOR_I"

# Ejecutar el script
psql -U tu_usuario -d telemedicina_db -f scripts/migrations-notificaciones.sql

# Verificar
psql -U tu_usuario -d telemedicina_db -c "\dt notificaciones"
```

---

## OPCIÓN 3: pgAdmin (GUI)

### Paso a Paso:

1. **Abrir pgAdmin**
   - Abrir navegador → http://localhost:5050 (o tu puerto)
   - Ingresa credenciales

2. **Conectar a la Base de Datos**
   - En el panel izquierdo: Servers → tu_servidor
   - Expandir: Databases
   - Click derecho en "telemedicina_db"
   - Seleccionar "Query Tool"

3. **Copiar el Script SQL**
   - Abrir archivo: `scripts/migrations-notificaciones.sql` (en tu editor)
   - Copiar TODO el contenido (Ctrl+A → Ctrl+C)

4. **Ejecutar en pgAdmin**
   - En la ventana "Query Tool" de pgAdmin
   - Pegar el contenido (Ctrl+V)
   - Click en el botón ▶️ "Execute" (o F5)

5. **Verificar Resultado**
   - Si sale "Query returned successfully" → ✅ ÉXITO
   - Si sale error → ❌ Ver sección de TROUBLESHOOTING

6. **Confirmar que existen las tablas**
   - En panel izquierdo, expandir: Schemas → public → Tables
   - Buscar:
     - `notificaciones` ✅
     - `historial_protecciones` ✅
     - `acceso_historial_logs` ✅

---

## OPCIÓN 4: DBeaver

1. Abrir DBeaver
2. Conectar a `telemedicina_db`
3. Click derecho en la conexión → SQL Editor → New SQL Script
4. Abrir archivo `scripts/migrations-notificaciones.sql`
5. Click en botón "Execute" o Ctrl+Enter
6. Esperar confirmación

---

## OPCIÓN 5: Docker (si usas PostgreSQL en Docker)

```bash
# Si tu PostgreSQL está en Docker:
docker exec -it tu_container_postgres psql -U tu_usuario -d telemedicina_db -f /scripts/migrations-notificaciones.sql

# O mejor, copiar el archivo primero:
docker cp scripts/migrations-notificaciones.sql tu_container_postgres:/tmp/
docker exec -it tu_container_postgres psql -U tu_usuario -d telemedicina_db -f /tmp/migrations-notificaciones.sql
```

---

## 🔍 VERIFICACIÓN

Después de ejecutar, verifica que todo está bien:

### Verificar Tablas Existen

```sql
-- En pgAdmin Query Tool o psql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notificaciones', 'historial_protecciones', 'acceso_historial_logs');
```

**Resultado esperado**: 3 filas

### Verificar Estructura de Tablas

```sql
-- Notificaciones
\d notificaciones

-- Historial Protecciones
\d historial_protecciones

-- Acceso Logs
\d acceso_historial_logs
```

### Verificar Índices

```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('notificaciones', 'historial_protecciones', 'acceso_historial_logs');
```

---

## ❌ TROUBLESHOOTING

### Error: "Table already exists"

**Causa**: Las tablas ya existen (posiblemente de una ejecución anterior)

**Solución**:
```sql
-- Si quieres mantener los datos:
-- (Las tablas ya están, no hacer nada)

-- Si quieres limpiar y empezar de nuevo:
DROP TABLE IF EXISTS acceso_historial_logs CASCADE;
DROP TABLE IF EXISTS historial_protecciones CASCADE;
DROP TABLE IF EXISTS notificaciones CASCADE;

-- Luego ejecutar el script nuevamente
```

### Error: "Permission denied"

**Causa**: Tu usuario de PostgreSQL no tiene permisos

**Solución**:
```sql
-- Conectar como superuser (postgres)
psql -U postgres -d telemedicina_db -f scripts/migrations-notificaciones.sql

-- O otorgar permisos:
ALTER USER tu_usuario CREATEDB;
```

### Error: "Role does not exist"

**Causa**: El usuario `tu_usuario` no existe

**Solución**:
```sql
-- Crear usuario (como superuser):
CREATE USER tu_usuario WITH PASSWORD 'tu_password';
CREATE DATABASE telemedicina_db OWNER tu_usuario;
```

### Error: "Database does not exist"

**Causa**: La BD `telemedicina_db` no existe

**Solución**:
```bash
# Crear primero la BD
createdb -U postgres telemedicina_db

# Luego ejecutar el script
psql -U postgres -d telemedicina_db -f scripts/migrations-notificaciones.sql
```

### Error: "File not found" o similar

**Causa**: Ruta del archivo incorrecta

**Solución**:
```bash
# Verificar que estés en el directorio correcto
pwd  # (en Mac/Linux)
cd /ruta/correcta/TRABAJO_TELEMEDICINA_INTEGRADOR_I

# Verificar que el archivo existe
ls scripts/migrations-notificaciones.sql
# o en Windows:
Get-ChildItem scripts/migrations-notificaciones.sql
```

---

## ✅ CONFIRMACIÓN DE ÉXITO

Si ves esto en la consola/pgAdmin:

```
CREATE TABLE
CREATE INDEX
(repetido varias veces)

Query returned successfully
```

**¡FELICIDADES!** ✨ Las migraciones se ejecutaron correctamente.

Ahora:
1. Cierra pgAdmin/psql
2. Reinicia la aplicación (`npm run dev` o `pnpm dev`)
3. Prueba las notificaciones y protección de historial

---

## 📝 DATOS IMPORTANTES

| Propiedad | Valor |
|-----------|-------|
| Base de Datos | telemedicina_db |
| Usuario | tu_usuario (ajustar) |
| Script | scripts/migrations-notificaciones.sql |
| Tablas Creadas | 3 |
| Índices Creados | 6 |
| Constraints | Múltiples |

---

## 🔐 NOTAS DE SEGURIDAD

- Las contraseñas se guardan hasheadas con bcryptjs
- Nunca en texto plano
- El script incluye ON DELETE CASCADE para integridad referencial
- Se crean índices para optimizar queries
- Se registra acceso a historiales en logs

---

## 📞 NEXT STEPS

Después de ejecutar las migraciones:

1. ✅ Reiniciar aplicación
2. ✅ Probar crear cita
3. ✅ Verificar que paciente recibe notificación
4. ✅ Probar proteger historial
5. ✅ Verificar que se pide contraseña

---

**¡LISTO PARA CONTINUAR!** 🚀

Si hay problemas, ver sección TROUBLESHOOTING o revisar logs de PostgreSQL.
