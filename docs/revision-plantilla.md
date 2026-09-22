# Revisión de la plantilla y adaptación de AUTEM

Referencia: https://interesting-pizza-392843.framer.app/

Se revisaron los HTML exportados de inicio, proyectos, contacto y 404, además de vercel.json. La configuración de Vercel corresponde al export estático; no se trasladó al enrutado React de AUTEM. Los HTML dependen del módulo remoto de Framer para parte del movimiento, por lo que se contrastó también el inicio publicado mediante scroll y mediciones del DOM.

## Diferencias encontradas y cambios

| Zona | Referencia y diferencia anterior | Adaptación |
| --- | --- | --- |
| Cabecera | Barra de unos 65 px, marca centrada; la versión anterior cambiaba a una cápsula flotante. | Barra clara, centrado, márgenes y subrayado al pasar el cursor. |
| Hero | Imagen de unos 90svh dentro de una escena de 140svh; al bajar se reduce hasta aproximadamente 45% y aparecen dos imágenes laterales. Antes solo había una imagen estática. | Escena sticky con escala continua reversible, imágenes laterales y desvanecimiento del texto. En móvil se reduce la amplitud. |
| Tipografía | Sans serif; AUTEM heredaba serif en el titular. | Tipografía sans consistente en la portada. |
| Espaciado | Marco exterior de 12px, contenido próximo al 92% del ancho y separación de 112px entre secciones en escritorio. | Anchos y separaciones compartidos; 72px entre secciones en móvil. |
| Títulos | Aparición escalonada por caracteres con desenfoque. | Componente de título accesible con revelado por letras y activación al entrar en pantalla. |
| Proyectos | Tres columnas en escritorio amplio, una en tablet; imágenes de alturas distintas. Antes había nombres ficticios con el mismo destino. | Datos de properties.ts, nombre e imagen y destino propio. Actualmente solo existe Villa Paraíso: se muestra una tarjeta amplia. El diseño admite más proyectos. |
| Servicios | Entrada por fila, imagen flotante al interactuar y flecha animada. | Revelado independiente, vista previa al pasar el cursor o enfocar y animación de flecha. |
| Especialidades y proceso | Tarjetas con tratamiento individual en lugar de una sección entera apareciendo a la vez. | Escala vinculada al scroll, zoom de imagen, elevación y expansión horizontal de la tarjeta del proceso activa en escritorio. |
| Testimonios | Cambio de contenido con transición. | Transición del título y controles accesibles. Los textos heredados se identifican como muestras, pendientes de testimonios reales. |
| Contacto y pie | Persistían etiquetas inglesas, unidades imperiales y otra marca. | Texto español, campos con nombres accesibles, metros cuadrados, mensaje de WhatsApp en español y marca AUTEM. |

Las medidas y curvas constituyen una adaptación React, no una copia del runtime propietario de Framer. Las fotografías editoriales de referencia se conservan; la ficha de proyecto usa la imagen real existente de Villa Paraíso.

## Limpieza

Eliminados tras comprobar que no tenían importaciones ni referencias de uso: HeroCarousel.tsx, HeroSearchBar.tsx, ModernContactSection.tsx, TestimonialsCarousel.tsx, home/SelectedProjectsSection.tsx y home/TerritoryLocationMap.tsx. Se pueden recuperar desde Git. También se retiró el CSS del antiguo hero de terreno y el revelado global que ocultaba secciones completas. Se conserva la documentación, los modelos, CAD y recursos usados por las páginas de proyecto.

## Validación

TypeScript y compilación de producción correctos. Comprobación visual en escritorio de 1905px y móvil de 390px: hero, reducción durante scroll, títulos, ausencia de desbordamiento horizontal y navegación móvil al formulario. Los campos y opciones se inspeccionaron sin enviar datos. Se respeta movimiento reducido mediante CSS y detección de la preferencia del sistema.

## Contenido pendiente de datos reales

Solo hay un proyecto en el catálogo actual. Los testimonios y perfiles sociales de la plantilla requieren datos propios antes de publicar. No se han inventado proyectos, clientes, premios ni cifras de trayectoria. No se ha publicado ni enviado ningún cambio al repositorio remoto.
