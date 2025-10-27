# 🏥 MEDILINK-PLUS

> Sistema de gestión médica con videoconsultas en tiempo real

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

---

## 📋 Tabla de Contenidos

- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#%EF%B8%8F-configuración)
- [Uso](#-uso)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías](#-tecnologías)
- [Troubleshooting](#-troubleshooting)
- [Contribución](#-contribución)

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta | Versión Mínima | Recomendada |
|-------------|----------------|-------------|
| **Node.js** | v18.0.0 | v22.17.0 |
| **npm** | 9.0.0 | 10.9.2 |
| **PostgreSQL** | 14+ | 15+ |
| **Git** | 2.0+ | Última |

### Verificar instalaciones:
```bash
node --version   # v22.17.0
npm --version    # 10.9.2
psql --version   # PostgreSQL 15.x
```

---

## 🚀 Instalación

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/medilink-plus.git
cd medilink-plus
```

### 2️⃣ Instalar dependencias
```bash
npm install
```

> ⏱️ **Tiempo estimado:** 2-3 minutos

---

## ⚙️ Configuración

### 🗄️ Base de Datos

#### **Opción A: PostgreSQL Local**

1. **Crear la base de datos:**
```sql
CREATE DATABASE Medilink_Plus;
```

2. **Importar el schema:**
```bash
psql -U postgres -d Medilink_Plus -f database/schema.sql
```

#### **Opción B: Docker (Recomendado para desarrollo)**
```bash
docker run --name medilink-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -e POSTGRES_DB=Medilink_Plus \
  -p 5432:5432 \
  -d postgres:15-alpine
```

**Verificar conexión:**
```bash
docker ps | grep medilink-postgres
```

---

### 🔐 Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=1234
POSTGRES_DB=Medilink_Plus
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# ===========================================
# WEBSOCKET SERVER
# ===========================================
WS_PORT=3002
NEXT_PUBLIC_WS_SERVER=ws://localhost:3002

# ===========================================
# WEBRTC CONFIGURATION
# ===========================================
NEXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302

# ===========================================
# DAILY.CO VIDEO CALLS
# ===========================================
# Obtén tu API key en: https://dashboard.daily.co/developers
DAILY_API_KEY=tu_daily_api_key_aqui

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=genera_una_clave_segura_minimo_32_caracteres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera_otra_clave_segura_diferente

# ===========================================
# OTROS
# ===========================================
API_KEY=tu_api_key_opcional
NODE_ENV=development
```

#### 🔑 Generar Claves Seguras

**En Linux/Mac:**
```bash
openssl rand -base64 32
```

**En Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

### 🎥 Configuración de Daily.co (Videollamadas)

1. **Crear cuenta:** [https://www.daily.co/signup](https://www.daily.co/signup)
2. **Obtener API Key:**
   - Ve a [Dashboard → Developers](https://dashboard.daily.co/developers)
   - Copia tu API Key
3. **Agregar al `.env.local`:**
   ```env
   DAILY_API_KEY=tu_api_key_copiada_aqui
   ```

---

## 🎯 Uso

### Modo Desarrollo

#### **Opción 1: Todo en uno (Recomendado)**
```bash
npm run dev:all
```
✅ Inicia Next.js + WebSocket simultáneamente

#### **Opción 2: Servidores separados**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - WebSocket Server
npm run websocket
```

### Modo Producción

```bash
# 1. Construir la aplicación
npm run build

# 2. Iniciar servidor
npm start
```

---

## 🔗 Acceso a la Aplicación

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Aplicación Web** | http://localhost:3000 | Interfaz principal |
| **WebSocket Server** | ws://localhost:3002 | Chat y notificaciones en tiempo real |
| **Documentación** | http://localhost:3001 | Docs generadas con TypeDoc |

---

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia Next.js en modo desarrollo |
| `npm run dev:all` | Inicia Next.js + WebSocket simultáneamente |
| `npm run build` | Construye la aplicación para producción |
| `npm start` | Inicia servidor de producción |
| `npm run websocket` | Inicia solo el servidor WebSocket |
| `npm run docs` | Genera documentación técnica |
| `npm run docs:watch` | Regenera docs automáticamente |
| `npm run docs:serve` | Sirve documentación en puerto 3001 |
| `npm run docs:open` | Abre documentación en navegador |

---

## 📁 Estructura del Proyecto

```
medilink-plus/
├── 📂 app/                    # App Router de Next.js
├── 📂 components/             # Componentes React reutilizables
│   ├── ui/                   # Componentes de UI (shadcn)
│   └── ...
├── 📂 contexts/               # Context API de React
├── 📂 hooks/                  # Custom React Hooks
├── 📂 lib/                    # Utilidades y helpers
├── 📂 public/                 # Assets estáticos
├── 📂 scripts/                # Scripts de Node.js
│   └── start-websocket.js    # Servidor WebSocket
├── 📂 database/               # Scripts SQL y migraciones
├── 📄 .env.local              # Variables de entorno (no commiteado)
├── 📄 package.json
├── 📄 tsconfig.json
└── 📄 tailwind.config.ts
```

---

## 🛠️ Tecnologías

### Frontend
- **Next.js 15** - Framework React con SSR
- **React 19** - Biblioteca UI
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 4** - Estilos utilitarios
- **shadcn/ui** - Componentes UI (Radix UI)
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos

### Backend
- **PostgreSQL** - Base de datos relacional
- **WebSocket (ws)** - Comunicación en tiempo real
- **Socket.io Client** - Cliente WebSocket
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas

### Videollamadas
- **Daily.co** - Plataforma de videollamadas WebRTC

### Herramientas
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de schemas
- **date-fns** - Manejo de fechas
- **jsPDF** - Generación de PDFs
- **QRCode** - Generación de códigos QR

---

## 🐛 Troubleshooting

### ❌ Error: "Cannot connect to database"

**Causa:** PostgreSQL no está corriendo

**Solución:**
```bash
# Windows
net start postgresql-x64-15

# Linux/Mac
sudo systemctl start postgresql

# Docker
docker start medilink-postgres
```

---

### ❌ Error: "Port 3000 already in use"

**Solución:**
```bash
# Ver proceso usando el puerto
netstat -ano | findstr :3000

# Cambiar puerto en package.json
"dev": "next dev -p 3001"
```

---

### ❌ Error: "WebSocket connection failed"

**Verificar:**
1. ✅ El servidor WebSocket está corriendo (`npm run websocket`)
2. ✅ Variable `NEXT_PUBLIC_WS_SERVER` está configurada
3. ✅ Puerto 3002 no está bloqueado por firewall

---

### ❌ Error: "Module not found"

**Solución:**
```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install

# O con npm cache
npm cache clean --force
npm install
```

---

### ❌ Error: "Daily.co API key invalid"

**Verificar:**
1. ✅ API Key copiada correctamente (sin espacios)
2. ✅ Cuenta Daily.co activa
3. ✅ Variable `DAILY_API_KEY` en `.env.local`

---

## 📝 Notas Importantes

> ⚠️ **Seguridad en Producción:**
> - Cambia **TODAS** las claves secretas
> - Usa contraseñas fuertes para PostgreSQL
> - Nunca commitees el archivo `.env.local`
> - Habilita HTTPS en producción
> - Configura CORS apropiadamente

> 🔄 **Dependencias:**
> - PostgreSQL debe estar corriendo **antes** de iniciar la app
> - El WebSocket server es **necesario** para chat y notificaciones
> - Daily.co API Key es **requerido** para videollamadas

> 📊 **Base de Datos:**
> - Ejecuta migraciones después de actualizaciones
> - Haz backups periódicos de la base de datos
> - En producción, usa connection pooling

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

---

## 👥 Autores

- **Tu Nombre** - *Desarrollo Inicial* - [@tu-usuario](https://github.com/tu-usuario)

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Daily.co](https://www.daily.co/)
- [Vercel](https://vercel.com/)

---

<div align="center">

**[⬆ Volver arriba](#-medilink-plus)**

Hecho con ❤️ para mejorar la atención médica

</div>