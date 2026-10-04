# Menú unificado de Villa Paraíso

Se implementó un único menú en el encabezado para móvil y tablet. Las cinco vistas comparten la misma navegación y muestran la vista actual bajo el nombre del proyecto. Se eliminaron los selectores flotantes de la ruta pública y del componente de recorrido. En PC se mantienen las pestañas del encabezado.

El menú reutiliza DropdownMenu de shadcn/Radix, con opciones de selección exclusiva, navegación por teclado, cierre al elegir una vista y acciones de tema, contacto y centro de control. Los estados Próximamente conservan el comportamiento de las vistas existentes.

Validación: las cinco vistas en 320, 390 y 768 px; ausencia de navegación móvil duplicada, sin desbordamiento horizontal, cierre al seleccionar; pestañas visibles a 1440 px. Sin errores de página. TypeScript, ESLint de los componentes y build verificados.

Imágenes reales: `propuestas/header-menu-abierto.png` y `propuestas/header-vista-1.png` a `header-vista-5.png`.

Propuesta generada: `propuestas/header-menu-cinco-vistas-concepto.png`. Herramienta integrada imagegen. Prompt: «Villa Paraíso AUTEM, tema oscuro cálido y dorado, un solo menú para las cinco vistas, encabezado compacto idéntico con nombre del proyecto, subtítulo de vista activa y botón hamburguesa, cinco pantallas con menú cerrado y una con menú abierto; opciones Localización, Plano Urbanístico, Galería, Recorrido en terreno y Conoce el proyecto, más tema, contacto y centro de control; sin barras flotantes ni navegación inferior».

La propuesta generada es conceptual y alteró contenidos de las vistas. Las capturas reales reflejan el frontend implementado y conservan las funciones existentes; no se añadió navegación GPS ni una vista 3D.

Los cambios de código están sincronizados también en D:/AUTEM, desde donde corre el servidor local que utiliza el usuario. No se publicó ni se empujó código al remoto.

Actualización: los cambios de código se subieron y desplegaron en el commit 79445dc.
