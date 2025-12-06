# Documentación de Despliegue

**Autor:** Jhampier Juarez Mauricio
**Año:** 2025  
**Plataforma de Despliegue:** Vercel

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración de Vercel](#configuración-de-vercel)
4. [Variables de Entorno](#variables-de-entorno)
5. [Proceso de Despliegue](#proceso-de-despliegue)
6. [Configuración de Build](#configuración-de-build)
7. [Configuración de Dominio](#configuración-de-dominio)
8. [Solución de Problemas](#solución-de-problemas)
9. [Mantenimiento y Actualizaciones](#mantenimiento-y-actualizaciones)

---

## Introducción

Este documento describe el proceso completo de despliegue de la aplicación **Federico Bot** en la plataforma Vercel. La aplicación es un sistema de gestión de inventario de equipos educativos construido con React, TypeScript, Vite y Supabase.

### Tecnologías Utilizadas

- **Frontend Framework:** React 18.3.1
- **Build Tool:** Vite 5.4.19
- **Lenguaje:** TypeScript 5.8.3
- **Base de Datos:** Supabase (PostgreSQL)
- **Estilos:** Tailwind CSS 3.4.17
- **UI Components:** shadcn/ui (Radix UI)
- **Routing:** React Router DOM 6.30.1

---

## Requisitos Previos

Antes de proceder con el despliegue, asegúrate de tener:

1. **Cuenta de Vercel:** Crea una cuenta en [vercel.com](https://vercel.com)
2. **Cuenta de Supabase:** La base de datos debe estar configurada y funcionando
3. **Repositorio Git:** El código debe estar en GitHub, GitLab o Bitbucket
4. **Node.js:** Versión 18 o superior (para builds locales)
5. **Variables de Entorno:** Credenciales de Supabase listas

---

## Configuración de Vercel

### 1. Conectar el Repositorio

1. Inicia sesión en tu cuenta de Vercel
2. Haz clic en **"Add New Project"**
3. Selecciona tu repositorio Git (GitHub/GitLab/Bitbucket)
4. Autoriza a Vercel para acceder a tu repositorio

### 2. Configuración del Proyecto

Vercel detectará automáticamente que es un proyecto Vite. La configuración básica será:

- **Framework Preset:** Vite
- **Root Directory:** `./` (raíz del proyecto)
- **Build Command:** `npm run build` o `pnpm build`
- **Output Directory:** `dist`
- **Install Command:** `npm install` o `pnpm install`

### 3. Archivo de Configuración `vercel.json`

El proyecto incluye un archivo `vercel.json` con la siguiente configuración:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Esta configuración es esencial para aplicaciones SPA (Single Page Application) con React Router, ya que redirige todas las rutas al `index.html` para que el enrutamiento del lado del cliente funcione correctamente.

---

## Variables de Entorno

### Variables Requeridas

Configura las siguientes variables de entorno en el panel de Vercel:

1. **VITE_SUPABASE_URL**
   - Descripción: URL de tu proyecto Supabase
   - Ejemplo: `https://zapgeipozaiufwcyhvfa.supabase.co`
   - Ubicación: Vercel Dashboard → Project Settings → Environment Variables

2. **VITE_SUPABASE_ANON_KEY**
   - Descripción: Clave pública (anon key) de Supabase
   - Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Importante:** Esta es la clave pública, no la service role key

### Configuración de Variables en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Environment Variables**
3. Agrega cada variable:
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** Tu URL de Supabase
   - **Environment:** Selecciona Production, Preview, y Development según necesites
4. Repite el proceso para `VITE_SUPABASE_ANON_KEY`

### Nota sobre Variables de Entorno

Las variables que comienzan con `VITE_` son expuestas al cliente en aplicaciones Vite. Asegúrate de que estas variables sean seguras para exponer públicamente. Nunca uses la **service role key** de Supabase en variables `VITE_*`.

---

## Proceso de Despliegue

### Despliegue Automático (Recomendado)

Vercel despliega automáticamente cuando:

1. **Push a la rama principal (main/master):** Despliega a producción
2. **Pull Request:** Crea un preview deployment
3. **Push a otras ramas:** Crea un preview deployment

### Pasos para Despliegue Manual

Si prefieres desplegar manualmente:

1. **Preparar el código:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Verificar build local (opcional):**
   ```bash
   npm install
   npm run build
   ```

3. **Desplegar desde Vercel CLI:**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

### Proceso de Build

Durante el despliegue, Vercel ejecutará:

1. **Instalación de dependencias:**
   ```bash
   npm install
   # o
   pnpm install
   ```

2. **Build de producción:**
   ```bash
   npm run build
   ```
   
   Este comando ejecuta `vite build`, que:
   - Compila TypeScript a JavaScript
   - Optimiza y minifica el código
   - Genera assets estáticos en la carpeta `dist/`
   - Aplica optimizaciones de Tree Shaking

3. **Despliegue:**
   - Vercel sirve los archivos de la carpeta `dist/`
   - Configura CDN global para entrega rápida
   - Aplica HTTPS automáticamente

---

## Configuración de Build

### Comandos de Build Personalizados

Si necesitas personalizar el proceso de build, puedes configurarlo en `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "build:dev": "vite build --mode development"
  }
}
```

### Configuración de Vite

El archivo `vite.config.ts` contiene la configuración del build:

```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

### Optimizaciones Aplicadas

- **Code Splitting:** Automático con Vite
- **Tree Shaking:** Eliminación de código no utilizado
- **Minificación:** JavaScript y CSS minificados
- **Asset Optimization:** Imágenes y recursos optimizados

---

## Configuración de Dominio

### Dominio Personalizado

Para conectar un dominio personalizado:

1. Ve a **Project Settings** → **Domains**
2. Ingresa tu dominio (ej: `app.tudominio.com`)
3. Sigue las instrucciones para configurar DNS:
   - Agrega un registro CNAME apuntando a `cname.vercel-dns.com`
   - O un registro A apuntando a la IP de Vercel

### Dominio de Vercel

Cada proyecto recibe automáticamente un dominio:
- Formato: `tu-proyecto.vercel.app`
- HTTPS habilitado automáticamente
- Certificado SSL gestionado por Vercel

---

## Solución de Problemas

### Error: Build Failed

**Problema:** El build falla durante el despliegue.

**Soluciones:**
1. Verifica los logs de build en Vercel Dashboard
2. Prueba el build localmente:
   ```bash
   npm run build
   ```
3. Verifica que todas las dependencias estén en `package.json`
4. Asegúrate de que las variables de entorno estén configuradas

### Error: Variables de Entorno No Definidas

**Problema:** La aplicación no puede conectarse a Supabase.

**Soluciones:**
1. Verifica que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas
2. Asegúrate de que las variables estén disponibles para el entorno correcto (Production/Preview)
3. Reinicia el deployment después de agregar variables

### Error: 404 en Rutas

**Problema:** Las rutas de React Router devuelven 404.

**Solución:**
- Verifica que el archivo `vercel.json` contenga la configuración de rewrites:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

### Error: CORS o Políticas de Supabase

**Problema:** Errores de CORS al conectar con Supabase.

**Soluciones:**
1. Verifica que la URL de tu aplicación esté en la lista de URLs permitidas en Supabase
2. Ve a Supabase Dashboard → Settings → API
3. Agrega tu dominio de Vercel a "Allowed Origins"

---

## Mantenimiento y Actualizaciones

### Actualización de Código

1. **Desarrollo local:**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   # Realiza cambios
   git commit -m "Descripción de cambios"
   git push origin feature/nueva-funcionalidad
   ```

2. **Merge a producción:**
   ```bash
   git checkout main
   git merge feature/nueva-funcionalidad
   git push origin main
   ```
   Vercel desplegará automáticamente.

### Rollback de Versión

Si necesitas revertir a una versión anterior:

1. Ve a **Deployments** en Vercel Dashboard
2. Encuentra el deployment que deseas restaurar
3. Haz clic en los tres puntos (⋯) → **Promote to Production**

### Monitoreo

Vercel proporciona:
- **Analytics:** Métricas de rendimiento
- **Logs:** Logs de runtime y build
- **Speed Insights:** Análisis de velocidad de la aplicación

### Actualización de Dependencias

Para actualizar dependencias:

1. **Localmente:**
   ```bash
   npm update
   # o
   pnpm update
   ```

2. **Verificar que todo funcione:**
   ```bash
   npm run build
   npm run test
   ```

3. **Commit y push:**
   ```bash
   git add package.json package-lock.json
   git commit -m "Actualizar dependencias"
   git push origin main
   ```

---

## Checklist de Despliegue

Antes de cada despliegue a producción, verifica:

- [ ] Variables de entorno configuradas correctamente
- [ ] Build local exitoso (`npm run build`)
- [ ] Tests pasando (`npm run test`)
- [ ] Código revisado y sin errores de linting
- [ ] Base de datos Supabase accesible
- [ ] URLs permitidas configuradas en Supabase
- [ ] Dominio personalizado configurado (si aplica)
- [ ] Documentación actualizada

---

## Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de Supabase](https://supabase.com/docs)
- [React Router Documentation](https://reactrouter.com/)

---

## Contacto y Soporte

Para problemas relacionados con el despliegue, contacta al equipo de desarrollo o revisa los logs en Vercel Dashboard.

**Última actualización:** 2025

