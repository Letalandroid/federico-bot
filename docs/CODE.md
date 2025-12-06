# Documentación del Código

**Autor:** Jhampier Juarez Mauricio
**Año:** 2025  
**Proyecto:** Federico Bot - Sistema de Gestión de Inventario

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Estructura de Directorios](#estructura-de-directorios)
4. [Tecnologías y Dependencias](#tecnologías-y-dependencias)
5. [Configuración del Proyecto](#configuración-del-proyecto)
6. [Componentes Principales](#componentes-principales)
7. [Páginas y Rutas](#páginas-y-rutas)
8. [Hooks Personalizados](#hooks-personalizados)
9. [Integración con Supabase](#integración-con-supabase)
10. [Estilos y UI](#estilos-y-ui)
11. [Testing](#testing)
12. [Convenciones de Código](#convenciones-de-código)
13. [Flujo de Datos](#flujo-de-datos)
14. [Manejo de Estado](#manejo-de-estado)
15. [Autenticación y Autorización](#autenticación-y-autorización)

---

## Introducción

**Federico Bot** es un sistema de gestión de inventario de equipos educativos desarrollado con React, TypeScript y Supabase. El sistema permite gestionar equipos, categorías, préstamos, usuarios, docentes, aulas y generar reportes.

### Características Principales

- ✅ Gestión completa de inventario de equipos
- ✅ Sistema de préstamos y devoluciones
- ✅ Gestión de usuarios y roles (Administrador/Técnico)
- ✅ Gestión de docentes y aulas
- ✅ Historial de movimientos y cambios
- ✅ Reportes exportables a Excel
- ✅ Dashboard con estadísticas
- ✅ Chatbot integrado
- ✅ Sistema de autenticación

---

## Arquitectura del Proyecto

### Stack Tecnológico

```
Frontend:
├── React 18.3.1 (UI Framework)
├── TypeScript 5.8.3 (Type Safety)
├── Vite 5.4.19 (Build Tool)
├── React Router 6.30.1 (Routing)
└── Tailwind CSS 3.4.17 (Styling)

Backend:
└── Supabase (BaaS - Backend as a Service)
    ├── PostgreSQL (Database)
    ├── Authentication
    └── Real-time Subscriptions

UI Components:
└── shadcn/ui (Radix UI primitives)
```

### Patrón de Arquitectura

El proyecto sigue una arquitectura **component-based** con separación de responsabilidades:

- **Pages:** Componentes de nivel superior que representan rutas
- **Components:** Componentes reutilizables y modales
- **Hooks:** Lógica reutilizable y estado compartido
- **Integrations:** Configuración de servicios externos (Supabase)
- **Lib:** Utilidades y helpers

---

## Estructura de Directorios

```
federico-bot/
├── public/                 # Archivos estáticos
│   ├── favicon.ico
│   ├── logo.png
│   └── robots.txt
├── src/
│   ├── components/        # Componentes React
│   │   ├── Categories/    # Componentes de categorías
│   │   ├── Chat/          # Componente de chatbot
│   │   ├── Inventory/     # Componentes de inventario
│   │   ├── Layout/        # Layout y navegación
│   │   └── ui/            # Componentes UI (shadcn/ui)
│   ├── hooks/             # Custom hooks
│   │   ├── useAuth.tsx    # Hook de autenticación
│   │   └── useRole.tsx    # Hook de roles
│   ├── integrations/      # Integraciones externas
│   │   └── supabase/      # Cliente de Supabase
│   ├── lib/               # Utilidades
│   │   └── utils.ts       # Funciones helper
│   ├── pages/             # Páginas/Views
│   │   ├── Auth.tsx       # Página de autenticación
│   │   ├── Dashboard.tsx # Dashboard principal
│   │   ├── Inventory.tsx  # Gestión de inventario
│   │   ├── Categories.tsx # Gestión de categorías
│   │   ├── Movements.tsx  # Historial de movimientos
│   │   ├── EquipmentLoans.tsx # Préstamos de equipos
│   │   ├── Users.tsx      # Gestión de usuarios
│   │   ├── Classrooms.tsx # Gestión de aulas
│   │   ├── Reports.tsx    # Reportes
│   │   └── Profile.tsx   # Perfil de usuario
│   ├── test/              # Configuración de tests
│   ├── App.tsx           # Componente raíz
│   ├── main.tsx          # Punto de entrada
│   └── index.css         # Estilos globales
├── supabase/             # Migraciones de base de datos
│   └── migrations/
├── docs/                  # Documentación
├── package.json          # Dependencias
├── vite.config.ts       # Configuración de Vite
├── tsconfig.json        # Configuración de TypeScript
└── vercel.json          # Configuración de Vercel
```

---

## Tecnologías y Dependencias

### Dependencias Principales

#### Core
- **react** (^18.3.1): Biblioteca UI
- **react-dom** (^18.3.1): Renderizado DOM
- **react-router-dom** (^6.30.1): Enrutamiento

#### UI y Estilos
- **@radix-ui/react-***: Componentes primitivos accesibles
- **tailwindcss** (^3.4.17): Framework CSS utility-first
- **lucide-react** (^0.462.0): Iconos
- **class-variance-authority**: Variantes de componentes
- **clsx** y **tailwind-merge**: Utilidades de clases CSS

#### Backend y Datos
- **@supabase/supabase-js** (^2.57.4): Cliente de Supabase
- **@tanstack/react-query** (^5.83.0): Gestión de estado del servidor

#### Utilidades
- **xlsx** (^0.18.5): Exportación a Excel
- **date-fns** (^3.6.0): Manipulación de fechas
- **zod** (^3.25.76): Validación de esquemas
- **react-hook-form** (^7.61.1): Formularios

#### Desarrollo
- **typescript** (^5.8.3): TypeScript
- **vite** (^5.4.19): Build tool
- **vitest** (^1.3.1): Framework de testing
- **eslint**: Linter

---

## Configuración del Proyecto

### Vite Configuration (`vite.config.ts`)

```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

**Características:**
- Alias `@` para imports desde `src/`
- Plugin React con SWC para compilación rápida
- Component tagger para desarrollo (Lovable)

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noImplicitAny": false,
    "skipLibCheck": true
  }
}
```

### Scripts Disponibles

```json
{
  "dev": "vite",                    // Servidor de desarrollo
  "build": "vite build",            // Build de producción
  "build:dev": "vite build --mode development",
  "preview": "vite preview",        // Preview del build
  "lint": "eslint .",               // Linter
  "test": "vitest",                 // Tests en modo watch
  "test:ui": "vitest --ui",         // Tests con UI
  "test:run": "vitest run",         // Tests una vez
  "test:coverage": "vitest run --coverage"
}
```

---

## Componentes Principales

### Layout Components

#### `AppLayout.tsx`
Componente de layout principal que envuelve todas las páginas con:
- Sidebar de navegación
- Header con información del usuario
- Área de contenido principal

#### `Sidebar.tsx`
Barra lateral de navegación con:
- Menú de navegación principal
- Indicador de ruta activa
- Iconos de Lucide React

#### `Header.tsx`
Header superior con:
- Información del usuario actual
- Botón de logout
- Notificaciones (si aplica)

### UI Components (shadcn/ui)

Todos los componentes UI están en `src/components/ui/` y son basados en Radix UI:

- **Button:** Botones con variantes
- **Card:** Tarjetas de contenido
- **Dialog/Modal:** Modales y diálogos
- **Table:** Tablas de datos
- **Form:** Componentes de formulario
- **Select:** Selectores desplegables
- **Badge:** Etiquetas y badges
- **Toast:** Notificaciones toast
- Y muchos más...

### Componentes de Dominio

#### `ProductModal.tsx`
Modal para crear/editar equipos con:
- Formulario completo de datos del equipo
- Validación de campos
- Integración con Supabase

#### `CategoryModal.tsx`
Modal para gestionar categorías de equipos.

#### `ChatBot.tsx`
Componente de chatbot integrado para asistencia.

---

## Páginas y Rutas

### Configuración de Rutas (`App.tsx`)

```typescript
<Routes>
  <Route path="/auth" element={<Auth />} />
  <Route element={<AppLayout />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/inventory" element={<Inventory />} />
    <Route path="/categories" element={<Categories />} />
    <Route path="/movements" element={<Movements />} />
    <Route path="/equipment-loans" element={<EquipmentLoans />} />
    <Route path="/users" element={<Users />} />
    <Route path="/classrooms" element={<Classrooms />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/chat" element={<ChatBot />} />
  </Route>
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Páginas Principales

#### `Dashboard.tsx`
- Estadísticas generales del sistema
- Gráficos y métricas
- Movimientos recientes
- Resumen de inventario

#### `Inventory.tsx`
- Lista completa de equipos
- Filtros por estado y búsqueda
- Crear/editar/eliminar equipos
- Vista detallada de cada equipo

#### `Categories.tsx`
- Gestión de categorías
- CRUD completo de categorías

#### `Movements.tsx`
- Historial de todos los movimientos
- Filtros por acción, fecha, usuario
- Detalles de cambios realizados

#### `EquipmentLoans.tsx`
- Gestión de préstamos de equipos
- Asignación a docentes y aulas
- Devoluciones
- Estado de préstamos activos

#### `Users.tsx`
- Gestión de usuarios del sistema
- Gestión de docentes
- Roles y permisos
- Exportación a Excel

#### `Classrooms.tsx`
- Gestión de aulas
- Ubicaciones predefinidas
- Capacidad y descripción

#### `Reports.tsx`
- Reportes de productos con bajo stock
- Historial de movimientos
- Reporte de usuarios
- Exportación a Excel

---

## Hooks Personalizados

### `useAuth.tsx`

Hook para gestión de autenticación:

```typescript
const { user, loading, signIn, signOut } = useAuth();
```

**Funcionalidades:**
- Estado del usuario actual
- Función de login
- Función de logout
- Loading state

### `useRole.tsx`

Hook para verificación de roles:

```typescript
const { isAdmin, loading } = useRole();
```

**Funcionalidades:**
- Verificación de rol de administrador
- Protección de rutas basada en roles

### `useToast.ts`

Hook para mostrar notificaciones toast:

```typescript
const { toast } = useToast();

toast({
  title: "Éxito",
  description: "Operación completada",
  variant: "default" | "destructive"
});
```

---

## Integración con Supabase

### Cliente de Supabase (`integrations/supabase/client.ts`)

```typescript
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

### Uso en Componentes

```typescript
// Consulta
const { data, error } = await supabase
  .from('equipment')
  .select('*, categories(name)')
  .eq('state', 'disponible');

// Inserción
const { error } = await supabase
  .from('equipment')
  .insert({
    name: 'Proyector',
    category_id: '...',
    // ...
  });

// Actualización
const { error } = await supabase
  .from('equipment')
  .update({ state: 'en_uso' })
  .eq('id', equipmentId);

// Eliminación
const { error } = await supabase
  .from('equipment')
  .delete()
  .eq('id', equipmentId);
```

### Tablas Principales

- **equipment:** Equipos del inventario
- **categories:** Categorías de equipos
- **profiles:** Perfiles de usuarios
- **teachers:** Docentes
- **classrooms:** Aulas
- **movements:** Préstamos de equipos
- **equipment_history:** Historial de cambios
- **user_roles:** Roles de usuarios

---

## Estilos y UI

### Tailwind CSS

El proyecto usa Tailwind CSS para estilos. Configuración en `tailwind.config.ts`:

```typescript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Colores personalizados
      // Espaciado, tipografía, etc.
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
```

### Sistema de Diseño

- **Colores:** Sistema de colores de shadcn/ui
- **Tipografía:** Inter (por defecto)
- **Espaciado:** Escala de Tailwind
- **Componentes:** Basados en Radix UI para accesibilidad

### Temas

El proyecto soporta temas claro/oscuro usando `next-themes` (si está configurado).

---

## Testing

### Configuración (`vitest.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

### Estructura de Tests

```
src/
├── components/ui/__tests__/  # Tests de componentes UI
├── hooks/__tests__/          # Tests de hooks
├── lib/__tests__/            # Tests de utilidades
├── pages/__tests__/          # Tests de páginas
└── test/                     # Configuración y mocks
    ├── mocks/
    └── utils/
```

### Ejecutar Tests

```bash
npm run test          # Modo watch
npm run test:run      # Una vez
npm run test:coverage # Con cobertura
npm run test:ui       # Con interfaz visual
```

---

## Convenciones de Código

### Nomenclatura

- **Componentes:** PascalCase (`ProductModal.tsx`)
- **Hooks:** camelCase con prefijo `use` (`useAuth.tsx`)
- **Utilidades:** camelCase (`utils.ts`)
- **Constantes:** UPPER_SNAKE_CASE
- **Variables:** camelCase

### Estructura de Componentes

```typescript
// 1. Imports
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Interfaces/Types
interface Props {
  title: string;
}

// 3. Componente
export const MyComponent: React.FC<Props> = ({ title }) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Funciones
  const handleClick = () => {
    // ...
  };
  
  // 6. Render
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
};
```

### Imports

Orden preferido:
1. React y librerías externas
2. Componentes UI
3. Hooks personalizados
4. Utilidades
5. Tipos/interfaces
6. Estilos

---

## Flujo de Datos

### Flujo General

```
Usuario → Componente → Hook/Function → Supabase → Database
                ↓
         Estado Local (useState)
                ↓
         Actualización UI
```

### Ejemplo: Crear Equipo

1. Usuario completa formulario en `ProductModal`
2. Submit ejecuta `handleSubmit`
3. Función llama a `supabase.from('equipment').insert()`
4. On success: actualiza estado local y cierra modal
5. On error: muestra toast con error
6. Lista de equipos se actualiza automáticamente

---

## Manejo de Estado

### Estado Local (useState)

Para estado de componente:

```typescript
const [equipment, setEquipment] = useState<Equipment[]>([]);
const [loading, setLoading] = useState(false);
```

### Estado Global

No se usa Redux/Zustand. El estado se maneja con:
- **useState** para estado local
- **Supabase** como fuente de verdad
- **React Query** (opcional) para cache de servidor

### Sincronización

Los datos se sincronizan mediante:
- Refetch después de mutaciones
- useEffect para carga inicial
- Eventos de Supabase (si se configuran)

---

## Autenticación y Autorización

### Flujo de Autenticación

1. Usuario ingresa credenciales en `/auth`
2. `useAuth.signIn()` llama a `supabase.auth.signInWithPassword()`
3. Supabase valida y retorna sesión
4. Sesión se guarda en localStorage
5. Usuario redirigido a dashboard

### Protección de Rutas

```typescript
// En App.tsx
<Route element={<ProtectedRoute />}>
  <Route path="/inventory" element={<Inventory />} />
</Route>
```

### Roles y Permisos

- **Administrador:** Acceso completo
- **Técnico:** Acceso limitado (definido por `useRole`)

Verificación en componentes:

```typescript
const { isAdmin } = useRole();

if (!isAdmin) {
  return <Navigate to="/" replace />;
}
```

---

## Exportación de Datos

### Exportación a Excel

El proyecto usa la librería `xlsx` para exportar datos:

```typescript
import * as XLSX from 'xlsx';

const exportToExcel = (data: any[]) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'reporte.xlsx');
};
```

**Implementado en:**
- `Reports.tsx`: Exportación de reportes
- `Users.tsx`: Exportación de usuarios y docentes

---

## Mejores Prácticas

### 1. Manejo de Errores

Siempre maneja errores en llamadas a Supabase:

```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  // Usar data
} catch (error) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  });
}
```

### 2. Loading States

Siempre muestra estados de carga:

```typescript
const [loading, setLoading] = useState(false);

if (loading) {
  return <Loader />;
}
```

### 3. Validación

Valida datos antes de enviar:

```typescript
if (!formData.name || !formData.category_id) {
  toast({
    title: "Error",
    description: "Campos requeridos",
    variant: "destructive"
  });
  return;
}
```

### 4. TypeScript

Usa tipos siempre:

```typescript
interface Equipment {
  id: string;
  name: string;
  // ...
}
```

---

## Recursos Adicionales

- [Documentación de React](https://react.dev/)
- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de shadcn/ui](https://ui.shadcn.com/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/)

---

## Contacto

**Autor:** Jhampier Juarez Mauricio
**Año:** 2025

Para preguntas sobre el código, consulta la documentación o contacta al equipo de desarrollo.

**Última actualización:** 2025

