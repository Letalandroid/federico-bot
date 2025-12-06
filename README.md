# Sistema Web de Gestión de Inventario con Chatbot Inteligente

**Autor:** Jhampier Juarez Mauricio  
**Año:** 2025

## 📋 Descripción General del Proyecto

El proyecto consiste en un sistema web para la gestión del inventario de equipos tecnológicos de la institución educativa, integrado con un asistente virtual inteligente (chatbot) que permite realizar consultas automáticas sobre la disponibilidad, movimientos, categorías y ubicación de los equipos.

El sistema está compuesto por tres partes principales:

- **Aplicación web (Frontend)**: Interfaz de usuario desarrollada con React y TypeScript
- **Base de datos (Backend)**: PostgreSQL gestionado a través de Supabase
- **Chatbot inteligente**: Implementado con n8n y Google Gemini (IA)

### Funcionalidades Principales

- ✅ Registro y control de equipos tecnológicos
- ✅ Gestión de préstamos y devoluciones
- ✅ Consulta de información mediante chatbot inteligente
- ✅ Automatización de atención de consultas
- ✅ Gestión de usuarios y roles (Administrador/Técnico)
- ✅ Gestión de docentes y aulas
- ✅ Historial completo de movimientos y cambios
- ✅ Reportes exportables a Excel
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Sistema de notificaciones

---

## 🛠️ Tecnologías Utilizadas

### Frontend (Aplicación Web)

- **React** 18.3.1 - Biblioteca de UI
- **TypeScript** 5.8.3 - Lenguaje de programación tipado
- **Vite** 5.4.19 - Build tool y servidor de desarrollo
- **Tailwind CSS** 3.4.17 - Framework de estilos
- **shadcn/ui** - Componentes UI basados en Radix UI
- **React Router DOM** 6.30.1 - Enrutamiento
- **xlsx** 0.18.5 - Exportación a Excel
- **date-fns** 3.6.0 - Manipulación de fechas

### Backend (Base de Datos)

- **Supabase** - Backend as a Service (BaaS)
- **PostgreSQL** - Base de datos relacional
- **Row Level Security (RLS)** - Seguridad a nivel de fila

### Chatbot

- **n8n** - Plataforma de automatización de flujos de trabajo
- **Google Gemini** - Modelo de IA para procesamiento de lenguaje natural
- **Webhooks HTTP** - Comunicación entre sistemas
- **PostgreSQL** - Memoria de conversación

### Despliegue

- **Vercel** - Plataforma de hosting y despliegue
- **GitHub** - Control de versiones

---

## 🏗️ Estructura General del Sistema

```
┌─────────────────┐
│   Usuario Web   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Aplicación Web │◄────►│   Supabase   │
│   (React/Vite)  │      │  PostgreSQL  │
└────────┬────────┘      └──────────────┘
         │
         │ (Webhook)
         ▼
┌─────────────────┐      ┌──────────────┐
│   Chatbot n8n   │◄────►│ Google Gemini│
│   (Webhook)     │      │     (IA)     │
└─────────────────┘      └──────────────┘
```

### Flujo de Funcionamiento

1. El usuario accede a la aplicación web desde el navegador
2. La aplicación se conecta a la base de datos Supabase
3. El chatbot recibe consultas mediante un Webhook HTTP
4. El agente de IA procesa la consulta usando Google Gemini
5. El agente consulta las tablas del sistema:
   - `equipment` - Equipos del inventario
   - `categories` - Categorías de equipos
   - `movements` - Préstamos y movimientos
   - `classrooms` - Aulas
   - `equipment_history` - Historial de cambios
   - `teachers` - Docentes
6. La respuesta es enviada de regreso al usuario en tiempo real

---

## 📦 Requisitos del Sistema

### Para Desarrollo

- **Node.js** versión 18 o superior
- **npm** o **pnpm** como gestor de paquetes
- **Git** para control de versiones
- Navegador web actualizado (Chrome, Firefox, Edge, Safari)

### Para Producción

- Cuenta en **Supabase** (gratuita o de pago)
- Cuenta en **Vercel** (gratuita o de pago)
- Repositorio Git (GitHub, GitLab o Bitbucket)
- Conexión a Internet

---

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd federico-bot
```

### 2. Instalar Dependencias

```bash
npm install
# o
pnpm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_key
```

### 4. Configurar la Base de Datos

Ejecuta el archivo `base_de_datos.sql` en tu instancia de Supabase:

1. Accede al SQL Editor en Supabase Dashboard
2. Copia el contenido de `base_de_datos.sql`
3. Ejecuta el script completo

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
# o
pnpm dev
```

La aplicación estará disponible en `http://localhost:8080`

---

## 📚 Estructura del Proyecto

```
federico-bot/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/         # Componentes React
│   │   ├── Categories/    # Componentes de categorías
│   │   ├── Chat/          # Componente de chatbot
│   │   ├── Inventory/     # Componentes de inventario
│   │   ├── Layout/        # Layout y navegación
│   │   └── ui/            # Componentes UI (shadcn/ui)
│   ├── hooks/             # Custom hooks
│   ├── integrations/      # Integraciones externas
│   │   └── supabase/      # Cliente de Supabase
│   ├── lib/               # Utilidades
│   ├── pages/             # Páginas/Views
│   └── test/              # Configuración de tests
├── supabase/
│   └── migrations/        # Migraciones de base de datos
├── docs/                  # Documentación
│   ├── DEPLOYMENT.md      # Documentación de despliegue
│   └── CODE.md            # Documentación del código
├── base_de_datos.sql      # Backup completo de la base de datos
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **equipment**: Equipos del inventario
- **categories**: Categorías de equipos
- **profiles**: Perfiles de usuarios
- **user_roles**: Roles de usuarios (administrador/tecnico)
- **teachers**: Docentes
- **classrooms**: Aulas
- **movements**: Préstamos y movimientos de equipos
- **equipment_history**: Historial de cambios
- **equipment_registry**: Registro de incidencias
- **notifications**: Notificaciones del sistema
- **user_notifications**: Preferencias de notificaciones
- **n8n_chat_histories**: Historial de conversaciones del chatbot

### Tipos ENUM

- **user_role**: `administrador`, `tecnico`
- **equipment_state**: `disponible`, `en_uso`, `mantenimiento`, `dañado`, `baja`
- **movement_type**: `asignacion`, `devolucion`, `mantenimiento`, `baja`
- **app_role**: `administrador`, `tecnico`

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo

# Build
npm run build            # Build de producción
npm run build:dev        # Build en modo desarrollo
npm run preview          # Preview del build

# Testing
npm run test            # Ejecuta tests en modo watch
npm run test:run        # Ejecuta tests una vez
npm run test:coverage   # Tests con cobertura
npm run test:ui         # Tests con interfaz visual

# Linting
npm run lint            # Ejecuta ESLint
```

---

## 📖 Documentación Adicional

- **[Documentación de Despliegue](docs/DEPLOYMENT.md)**: Guía completa para desplegar en Vercel
- **[Documentación del Código](docs/CODE.md)**: Documentación técnica detallada del código

---

## 🔐 Configuración de Seguridad

### Variables de Entorno

**Nunca** expongas las siguientes variables:
- Service Role Key de Supabase
- Claves privadas
- Tokens de autenticación

Solo usa variables que comienzan con `VITE_` para datos públicos del cliente.

### Row Level Security (RLS)

El sistema utiliza RLS de Supabase para:
- Proteger datos sensibles
- Controlar acceso basado en roles
- Asegurar integridad de datos

---

## 🤖 Configuración del Chatbot en n8n

### Flujo General

1. El usuario envía un mensaje desde la aplicación web
2. El Webhook de n8n recibe el mensaje
3. El Agente de IA analiza el mensaje usando Google Gemini
4. La IA consulta la base de datos Supabase
5. Se genera una respuesta automática
6. La respuesta se envía al usuario en formato JSON

### Componentes del Chatbot

- **Google Gemini**: Modelo de IA para procesamiento de lenguaje
- **PostgreSQL**: Memoria de conversación (tabla `n8n_chat_histories`)
- **Supabase**: Fuente de datos para consultas

### Exportar/Importar el Chatbot

**Exportar:**
1. Abrir el workflow en n8n
2. Presionar Export o Download
3. Guardar el archivo JSON

**Importar:**
1. Crear nuevo workflow en n8n
2. Importar archivo JSON
3. Configurar nuevamente las credenciales
4. Guardar el workflow

---

## 🧪 Pruebas del Sistema

### Checklist de Pruebas

- [ ] Pruebas de conexión con Supabase
- [ ] Pruebas de carga de datos
- [ ] Pruebas de consultas al chatbot
- [ ] Pruebas de despliegue en Vercel
- [ ] Pruebas de rutas del sistema web
- [ ] Pruebas de autenticación y autorización
- [ ] Pruebas de exportación a Excel
- [ ] Pruebas de creación/edición/eliminación de registros

---

## 📝 Licencia

Este proyecto es de uso interno de la institución educativa.

---

## 👤 Autor

**Jhampier Juarez Mauricio**  
Año: 2025

---

## 📞 Soporte

Para problemas o consultas:
1. Revisa la documentación en `docs/`
2. Consulta los logs en Vercel Dashboard
3. Revisa los logs en Supabase Dashboard
4. Contacta al equipo de desarrollo

---

## 🔄 Actualizaciones

### Versión Actual
- React 18.3.1
- TypeScript 5.8.3
- Vite 5.4.19
- Supabase (última versión)

### Próximas Mejoras
- [ ] Mejoras en el chatbot
- [ ] Optimizaciones de rendimiento
- [ ] Nuevas funcionalidades de reportes
- [ ] Integración con más servicios

---

**Última actualización:** 2025
