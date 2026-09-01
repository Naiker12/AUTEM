<div align="center">

# AUTEM — Real Estate & Visualización Arquitectónica de Vanguardia

<p align="center">
  <strong>Propiedades con renders 3D, tours virtuales y realidad aumentada (AR) para recorrerlas y personalizarlas antes de la primera piedra.</strong>
</p>

<p align="center">
  <img src="./public/images/autem-hero-approved-scene-v2.png" alt="AUTEM Landing Page Hero" width="100%" />
</p>

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![TanStack Router](https://img.shields.io/badge/TanStack-Router%20%26%20Start-FF4154?logo=tanstack&logoColor=white&style=flat-square)](https://tanstack.com/router)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Rendering-black?logo=threedotjs&logoColor=white&style=flat-square)](https://threejs.org/)
[![WebAR](https://img.shields.io/badge/WebAR-Model_Viewer-E37400?logo=google&logoColor=white&style=flat-square)](https://modelviewer.dev/)

---

</div>

## 🌟 Descripción General

**AUTEM** es una plataforma web de inversión y desarrollo inmobiliario de alto nivel que fusiona arquitectura de lujo con tecnologías inmersivas de última generación. Permite a los clientes e inversionistas explorar terrenos, masterplans y villas exclusivas en 3D interactivo y Realidad Aumentada (AR) desde cualquier dispositivo y navegador.

---

## ✨ Características Principales

- 🏛️ **Hero Scroll & Masterplan Reveal**: Experiencia visual dinámica con transiciones de scroll que revelan capas topográficas y de zonificación territorial.
- 🕶️ **Modelos 3D & Realidad Aumentada (AR)**: Integración con `@google/model-viewer` y `Three.js` para inspeccionar propiedades a escala real directamente en el navegador y en dispositivos móviles con WebAR.
- 🗺️ **Cartografía y Mapas Interactivos**: Integración con `Leaflet` / `React Leaflet` para geolocalización de lotes, amenidades y áreas de interés.
- 📐 **Planos y Masterplans Interactivos**: Visualización de planos arquitectónicos detallados con cotizador y selector de unidades.
- 🌗 **Diseño Editorial & Modo Oscuro / Claro**: Paleta de colores curada inspirada en materiales nobles (piedra, lino, mármol y oro sutil) con soporte nativo para temas claro y oscuro.
- ⚡ **Rendimiento Ultrarrápido**: Creado sobre TanStack Start y Vite con optimización progresiva de imágenes y componentes Radix UI.

---

## 🛠️ Stack Tecnológico

| Capa                   | Tecnología                                                                                    |
| :--------------------- | :-------------------------------------------------------------------------------------------- |
| **Framework & Router** | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| **UI Library**         | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)                |
| **Estilos & Diseño**   | [Tailwind CSS v4](https://tailwindcss.com/) + CSS Variables & Modern Glassmorphism            |
| **3D & AR**            | [Three.js](https://threejs.org/) + [@google/model-viewer](https://modelviewer.dev/)           |
| **Mapas & Geo**        | [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/)            |
| **Componentes Base**   | [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/)                   |
| **Bundler & Tooling**  | [Vite 8](https://vitejs.dev/) + ESLint + Prettier + Sharp                                     |

---

## 📂 Estructura del Proyecto

```text
AUTEM/
├── public/                     # Archivos estáticos y modelos
│   ├── images/                 # Renders, texturas y capturas del proyecto
│   ├── models/                 # Modelos 3D (.glb / .gltf) y assets AR
│   └── projects/               # Recursos multimedia por proyecto
├── src/
│   ├── assets/                 # Imágenes y assets importados en código
│   ├── components/             # Componentes modulares y reutilizables
│   │   ├── ar/                 # Componentes para visualización WebAR y 3D
│   │   ├── catalog/            # Catálogo interactivo y filtros de propiedades
│   │   ├── home/               # Hero interactivo, carrusel y secciones de inicio
│   │   ├── layout/             # Header, Footer, Contenedores y Navegación
│   │   ├── map/                # Mapas interactivos con Leaflet
│   │   └── ui/                 # Sistema de diseño y primitivas de UI (Radix)
│   ├── data/                   # Datos estáticos de propiedades, zonas y servicios
│   ├── hooks/                  # Custom hooks (scroll, tema, viewport)
│   ├── routes/                 # Enrutamiento basado en archivos (TanStack Router)
│   │   ├── __root.tsx          # Shell y layout principal de la aplicación
│   │   ├── index.tsx           # Página principal (Home)
│   │   ├── nosotros.tsx        # Página sobre la visión y equipo
│   │   ├── catalogo.tsx        # Explorador general de propiedades
│   │   └── proyecto/           # Detalle inmersivo de cada desarrollo
│   ├── styles.css              # Sistema de diseño global y tokens Tailwind
│   └── main.tsx                # Entrada de la aplicación
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Instalación y Desarrollo Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Naiker12/AUTEM.git
cd AUTEM
```

### 2. Instalar dependencias

```bash
npm install
# o con pnpm / bun
pnpm install
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

El servidor local se iniciará típicamente en `http://localhost:5173`.

---

## 📜 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con Vite y TanStack Router.
- `npm run build`: Compila la aplicación optimizada para producción.
- `npm run preview`: Previsualiza el build de producción localmente.
- `npm run typecheck`: Ejecuta la verificación estricta de tipos con TypeScript.
- `npm run lint`: Analiza el código fuente con ESLint.
- `npm run format`: Formatea el código con Prettier.
- `npm run images:home`: Optimiza las imágenes del home mediante Sharp.

---

## 📄 Licencia

Desarrollado para **AUTEM**. Todos los derechos reservados.
