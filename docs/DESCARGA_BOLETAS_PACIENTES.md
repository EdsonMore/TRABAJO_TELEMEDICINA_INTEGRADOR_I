# 📋 DESCARGA DE BOLETAS PARA PACIENTES - DOCUMENTACIÓN

## ✅ Cambios Implementados

### 1. **Nuevo Endpoint API**
**Archivo:** `/app/api/farmacia/recetas/[id]/obtener-boleta/route.ts`

#### GET - Obtener información de la boleta
```
GET /api/farmacia/recetas/{id}/obtener-boleta
Authorization: Bearer {token}
```

**Respuesta exitosa:**
```json
{
  "message": "Boleta obtenida correctamente",
  "boleta": {
    "id": "uuid",
    "numero_boleta": "BOL-xxxxx-timestamp",
    "fecha_despacho": "2024-01-15T10:30:00Z",
    "subtotal": 250.00,
    "igv": 45.00,
    "total": 295.00,
    "tipo_entrega": "domicilio",
    "direccion_entrega": "Jr. Bolognesi 123, Cusco",
    "medicamentos_despachados": [...],
    "nota_venta_pdf_path": "/notas-venta/nota-BOL-xxxxx.pdf",
    "boleta_pdf_path": "/boletas/boleta-BOL-xxxxx.pdf",
    "estado": "generada",
    "observaciones": null
  }
}
```

**Si aún no hay boleta:**
```json
{
  "message": "La boleta aún no ha sido generada",
  "boleta": null
}
```

#### POST - Descargar boleta específica
```
POST /api/farmacia/recetas/{id}/obtener-boleta
Authorization: Bearer {token}
Content-Type: application/json

{
  "tipo": "nota" | "boleta"
}
```

**Respuesta:**
```json
{
  "message": "Ruta del PDF obtenida",
  "pdfPath": "/notas-venta/nota-BOL-xxxxx.pdf",
  "nombre_archivo": "nota-venta-2024-01-15.pdf"
}
```

**Validaciones:**
- ✅ Token válido (Bearer)
- ✅ Usuario autenticado
- ✅ Solo el paciente propietario puede descargar su boleta
- ✅ Admins pueden descargar cualquier boleta
- ✅ Verifica que el archivo exista

### 2. **Actualización del Componente ModalDetallesReceta**
**Archivo:** `/components/paciente/ModalDetallesReceta.tsx`

#### Nuevos Estados
```typescript
const [descargandoBoleta, setDescargandoBoleta] = useState<"nota" | "boleta" | null>(null);
const [boletaInfo, setBoletaInfo] = useState<any>(null);
```

#### Nuevas Funciones

**`cargarInfoBoleta()`**
- Se ejecuta cuando se abre el modal
- Obtiene la información de la boleta si está disponible
- Almacena los datos en `boletaInfo`

**`descargarBoleta(tipo: "nota" | "boleta")`**
- Descarga la nota de venta o boleta
- Maneja estados de carga
- Muestra notificaciones de éxito/error
- Permite descargar directamente desde el navegador

#### Interfaz de Usuario

**Botones agregados en la sección "Acciones":**

1. **Nota de Venta** (Botón Emerald)
   - Color: 🟢 Emerald-600
   - Ícono: 🧾
   - Solo visible si `boletaInfo` existe y tiene `nota_venta_pdf_path`

2. **Boleta Farmacia** (Botón Amber)
   - Color: 🟠 Amber-600
   - Ícono: 📋
   - Solo visible si también existe `boleta_pdf_path`

3. **Mensaje informativo** (Cuando está cargando)
   - Muestra "La boleta será disponible después del despacho" si `boletaInfo` es null

```tsx
{boletaInfo && boletaInfo.nota_venta_pdf_path && (
  <>
    <button onClick={() => descargarBoleta("nota")} disabled={descargandoBoleta === "nota"}>
      🧾 Nota de Venta
    </button>
    {boletaInfo.boleta_pdf_path && (
      <button onClick={() => descargarBoleta("boleta")} disabled={descargandoBoleta === "boleta"}>
        📋 Boleta Farmacia
      </button>
    )}
  </>
)}

{boletaInfo === null && !cargando && (
  <div>La boleta será disponible después del despacho</div>
)}
```

## 🔄 Flujo Completo

### Para el Paciente:
1. Paciente abre el modal de receta en su dashboard
2. Sistema automáticamente carga la info de la boleta
3. Si el despacho se completó:
   - Botones de descarga aparecen
   - Paciente puede descargar:
     - **Nota de Venta**: Comprobante simple para el paciente
     - **Boleta Farmacia**: Documento formal (opcional)
4. PDFs se descargan desde `/notas-venta/` o `/boletas/`

### Para la Farmacia:
1. Cuando completa despacho (acción = "dispensada")
2. Sistema genera automáticamente:
   - Nota de Venta (para paciente) → `/notas-venta/nota-BOL-xxxxx.pdf`
   - Boleta Farmacia (para records) → `/boletas/boleta-BOL-xxxxx.pdf`
3. Guarda referencias en BD (`boletas_despacho` y `recetas`)
4. Disponible inmediatamente para descarga del paciente

## 🔐 Seguridad

### Validaciones Implementadas:
- ✅ Autenticación requerida (Bearer token)
- ✅ Autorización por paciente (solo su receta) o admin
- ✅ Verificación de existencia de archivo
- ✅ Manejo seguro de rutas
- ✅ Logs de errores para debugging

### Restricciones:
- Solo pacientes propietarios + admins pueden descargar
- Token debe ser válido y usuario debe estar activo en BD
- Archivos deben existir antes de permitir descarga

## 📊 Base de Datos

### Tabla: `boletas_despacho` (Creada anteriormente)
```sql
- id (UUID)
- id_receta (FK)
- id_farmacia (FK)
- numero_boleta (UNIQUE)
- fecha_despacho
- subtotal, igv, total
- tipo_entrega, direccion_entrega
- medicamentos_despachados (JSONB)
- nota_venta_pdf_path
- boleta_pdf_path
- estado (generada, impresa, entregada)
- observaciones
```

### Tabla: `recetas` (Columna agregada)
```sql
- boleta_despacho_id (FK a boletas_despacho)
```

## 🎨 UI/UX

### Flujo Visual en ModalDetallesReceta:

```
┌─ Panel de Acciones ─────────────────────────┐
│                                             │
│  📄 Descargar PDF        [Receta Original]  │
│  🧾 Nota de Venta        [Después Despacho]│
│  📋 Boleta Farmacia      [Después Despacho]│
│  📱 Mostrar/Ocultar QR                      │
│  🚚 Enviar a Farmacia    [Si aplica]       │
│                                             │
│  ℹ️ "La boleta será disponible              │
│     después del despacho" [Estado: Vacío]   │
└─────────────────────────────────────────────┘
```

### Estados:
- **Cargando**: Spinner `Loader2` 
- **Descargando**: Estado deshabilitado con spinner
- **Error**: Toast notification roja
- **Éxito**: Toast notification verde

## 🧪 Testing

### Casos de Prueba:

1. **Sin boleta generada:**
   - ✅ Modal muestra mensaje "La boleta será disponible..."
   - ✅ Botones de descarga NO aparecen

2. **Con boleta generada:**
   - ✅ Botones aparecen
   - ✅ Click en botón descarga archivo correcto
   - ✅ Nombre archivo es correcto

3. **Seguridad:**
   - ✅ Usuario diferente NO puede descargar
   - ✅ Sin token retorna 401
   - ✅ Admin SÍ puede descargar cualquier boleta

4. **Errores:**
   - ✅ Archivo no existe → Error 404
   - ✅ Receta no existe → Error 404
   - ✅ Token inválido → Error 401

## 📝 Notas Técnicas

### Integración con Sistema Existente:

**Boleta ya se genera en:**
- `/app/api/farmacia/recetas/[id]/generar-boleta/route.ts`
- Se llama automáticamente desde `despacho-recetas.tsx`
- Genera dos versiones (farmacia + paciente)

**Este endpoint CONSUME esa información:**
- Lee rutas de PDFs de BD
- Proporciona acceso seguro al paciente
- Permite descargas controladas

### Performance:
- Queries optimizadas con LEFT JOIN
- Caching potencial de info de boleta (localStorage)
- Descarga desde `/public/` es rápida

### Limitaciones Actuales:
- Los PDFs se sirven desde `/public/` (considera usar CDN para producción)
- No hay vista de historial de boletas
- No hay opción de re-enviar boleta por email

## 🚀 Próximas Mejoras (Futuro)

1. **Email de notificación**
   - Enviar boleta automáticamente cuando se genera
   - Link directo de descarga en email

2. **Historial de Boletas**
   - Vista para paciente de todas sus boletas
   - Filtros por fecha, farmacia, estado

3. **Admin Panel**
   - Gestión de boletas
   - Reporte de despachos
   - Re-generación de boletas

4. **Autenticación adicional**
   - PIN o contraseña para descargar
   - Confirmación de correo

---

**Autor:** Sistema de Telemedicina MediLink+  
**Fecha:** 2024  
**Estado:** ✅ Completado y Testeable
