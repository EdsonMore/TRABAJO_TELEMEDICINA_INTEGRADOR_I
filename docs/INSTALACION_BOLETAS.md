# 🔧 GUÍA DE INSTALACIÓN - Sistema de Boletas

## ✅ Errores Corregidos

Se han corregido dos errores críticos en el sistema:

### 1. **Error NextJS: params debe ser awaited**
```
Error: Route "/api/farmacia/recetas/[id]/obtener-boleta" used `params.id`. 
`params` should be awaited before using its properties.
```

**Solución aplicada en:**
- `/app/api/farmacia/recetas/[id]/obtener-boleta/route.ts`

**Cambio:**
```typescript
// ❌ ANTES
{ params }: { params: { id: string } }
const recetaId = params.id;

// ✅ DESPUÉS
{ params }: { params: Promise<{ id: string }> }
const { id: recetaId } = await params;
```

### 2. **Error SQL: Columna `r.paciente_id` no existe**
```
Error: error: no existe la columna r.paciente_id
```

**Problema:**
- La tabla `recetas` NO tiene columna `paciente_id` directamente
- El paciente se accede mediante: `recetas → citas → pacientes`

**Solución aplicada:**
- Cambiar queries SQL para usar JOIN correcto
- De: `SELECT r.paciente_id FROM recetas r`
- A: `SELECT c.id_paciente as paciente_id FROM recetas r JOIN citas c ON r.id_cita = c.id`

---

## 📋 PASOS A SEGUIR

### Paso 1: Ejecutar el script SQL

```bash
# Conectarse a la BD
psql -U postgres -d telemedicina_db

# Ejecutar el script completo
\i /ruta/a/scripts/setup-boletas-completo.sql

# O ejecutar por partes:
\i /ruta/a/scripts/crear-tabla-boletas-despacho.sql
\i /ruta/a/scripts/agregar-boleta-recetas.sql
```

**Alternativa: Desde línea de comandos (Windows)**
```powershell
psql -U postgres -d telemedicina_db -f "C:\...\scripts\setup-boletas-completo.sql"
```

### Paso 2: Verificar que las tablas estén creadas

```sql
-- Conectarse a psql
psql -U postgres -d telemedicina_db

-- Verificar tabla boletas_despacho
\d boletas_despacho

-- Verificar columna en recetas
\d recetas

-- Debe mostrar:
-- boleta_despacho_id | uuid | default NULL
```

### Paso 3: Reiniciar el servidor de Next.js

```bash
# Presionar Ctrl+C para detener
# Luego reiniciar
npm run dev
```

---

## 🧪 VERIFICACIÓN

Después de aplicar los cambios, verificar que:

### 1. **Las tablas existen:**
```sql
SELECT to_regclass('boletas_despacho');
-- Debe retornar: boletas_despacho

SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name='recetas' AND column_name='boleta_despacho_id'
);
-- Debe retornar: true
```

### 2. **Los endpoints no tienen errores:**

En consola del navegador (F12), al abrir una receta dispensada:
```
✅ "Cargando información de boleta para receta: {id}"
📡 "Respuesta del servidor: 200"
📥 "Datos recibidos: {data}"
```

Si falla:
```
❌ "Error en respuesta: 404" → Receta no encontrada
❌ "Error en respuesta: 403" → Permiso denegado
❌ "Error en respuesta: 500" → Error en servidor
```

### 3. **Descargar boleta funciona:**
- Click en botón 🧾 "Nota de Venta" → Descarga PDF
- Click en botón 📋 "Boleta Farmacia" → Descarga PDF
- Toast de confirmación aparece

---

## 📊 Base de Datos - Estructura Aplicada

### Tabla: `boletas_despacho`
```sql
Column                  | Type       | Constraints
------------------------+------------+-----------------------------------
id                      | uuid       | PRIMARY KEY, DEFAULT gen_random_uuid()
id_receta              | uuid       | NOT NULL, FK → recetas(id)
id_farmacia            | uuid       | NOT NULL, FK → farmacias(id)
numero_boleta          | varchar    | NOT NULL, UNIQUE
fecha_despacho         | timestamp  | NOT NULL, DEFAULT CURRENT_TIMESTAMP
subtotal               | decimal    | NOT NULL (10,2)
igv                    | decimal    | NOT NULL (10,2)
total                  | decimal    | NOT NULL (10,2)
tipo_entrega           | varchar    | NOT NULL, 'recojo' | 'domicilio'
direccion_entrega      | text       | NULL
medicamentos_despacha  | jsonb      | NOT NULL (array de meds)
boleta_pdf_path        | varchar    | NULL
nota_venta_pdf_path    | varchar    | NULL
estado                 | varchar    | 'generada', 'impresa', 'entregada'
observaciones          | text       | NULL
created_at             | timestamp  | DEFAULT CURRENT_TIMESTAMP
updated_at             | timestamp  | DEFAULT CURRENT_TIMESTAMP
```

### Columna agregada a `recetas`:
```sql
Column                 | Type       | Constraints
-----------------------+------------+-----------------------------------
boleta_despacho_id     | uuid       | FK → boletas_despacho(id), NULL
```

---

## 🔍 Troubleshooting

### Error: "Columna boleta_despacho_id no existe"
```sql
-- Ejecutar:
ALTER TABLE recetas ADD COLUMN IF NOT EXISTS boleta_despacho_id UUID;

-- Verificar:
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name='recetas' AND column_name='boleta_despacho_id'
);
```

### Error: "Tabla boletas_despacho no existe"
```sql
-- Ejecutar el script:
\i scripts/crear-tabla-boletas-despacho.sql

-- Verificar:
\d boletas_despacho
```

### Error: "Foreign key constraint fails"
```sql
-- Verificar que existen las tablas padre:
\d recetas
\d farmacias

-- Si no existen, crear primero esas tablas
```

### Error: "no existe la columna r.paciente_id"
✅ **YA CORREGIDO en:**
- `/app/api/farmacia/recetas/[id]/obtener-boleta/route.ts`

Ahora usa JOIN correctamente:
```typescript
FROM recetas r
JOIN citas c ON r.id_cita = c.id
```

---

## 📁 Archivos Modificados

**Corregidos (Errores Fixed):**
- ✅ `/app/api/farmacia/recetas/[id]/obtener-boleta/route.ts`
  - NextJS params ahora awaited
  - Queries SQL usan joins correctos
  - Verificación de permisos usa `user.userId`

**Creados:**
- ✅ `/scripts/setup-boletas-completo.sql`
- ✅ `/components/farmacia/gestion-boletas.tsx`
- ✅ `/app/api/farmacia/boletas/listar/route.ts`

**Modificados:**
- ✅ `/app/dashboard/farmacia/page.tsx`
- ✅ `/components/paciente/ModalDetallesReceta.tsx`

---

## ✨ Después de aplicar los cambios

**Funcionalidad que debería funcionar:**

1. **Paciente descarga boleta:**
   - ✅ Abre modal de receta dispensada
   - ✅ Ve botones 🧾 y 📋
   - ✅ Descarga PDF funciona
   - ✅ Toast de confirmación

2. **Farmacia gestiona boletas:**
   - ✅ Dashboard muestra tarjeta "Gestión de Boletas"
   - ✅ Click abre tabla con todas las boletas
   - ✅ Filtros por estado/fecha funcionan
   - ✅ Descarga de PDFs funciona
   - ✅ Estadísticas se calculan

3. **Sin errores en consola:**
   - ✅ No aparece error de `params` no awaited
   - ✅ No aparece error de columna no existe
   - ✅ Logs detallados en consola para debugging

---

## 📞 Soporte

Si tienes problemas:

1. **Verificar logs del servidor:**
   ```
   Buscar en terminal: "Error obteniendo boleta:"
   Ver el error específico
   ```

2. **Verificar consola del navegador (F12):**
   ```
   Busca logs que empiezan con:
   🔄 = Cargando
   ✅ = Éxito
   ❌ = Error
   ```

3. **Ejecutar validación SQL:**
   ```sql
   -- Ver todas las boletas
   SELECT COUNT(*) FROM boletas_despacho;
   
   -- Ver recetas con boleta
   SELECT COUNT(*) FROM recetas WHERE boleta_despacho_id IS NOT NULL;
   
   -- Ver estructura
   \d boletas_despacho
   ```

---

**Estado:** 🟢 **LISTO PARA DEPLOYAR**

Todos los errores han sido corregidos y el sistema está lista para usar.
