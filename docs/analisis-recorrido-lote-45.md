# Análisis y propuesta: recorrido al lote 45

Fecha: 4 de octubre de 2026. Alcance: revisión del código local y propuesta visual; no se modificó la aplicación ni se publicó una red vial.

## Qué tenemos y qué falta

El plano SVG, los centroides de lotes, un motor de rutas, la captura GPS y una pantalla administrativa de calibración ya existen. No están conectados todavía como navegación operativa.

- `src/data/villa-paraiso-navigation.ts`: grafo vacío, con estado `pending_field_validation`. No hay nodos ni tramos por los que calcular una ruta.
- `cad/villa-paraiso-navigation-candidates.json`: 119 polilíneas candidatas extraídas del DXF: 50 de A-VIA, 41 de A-CALZADA y 28 de A-SENDEROS. Son geometrías de dibujo, no una red conectada y aprobada. Algunos contornos están cerrados; no equivalen al eje transitable de una vía.
- `src/data/villa-paraiso-navigation-survey.ts`: entrada identificada en coordenadas CAD; no hay puntos de control registrados en esta configuración.
- `src/components/project-view/TerrainRouteView.tsx`: captura precisión y distancia a una referencia, pero no conserva latitud/longitud como origen del recorrido. La llamada al motor usa siempre `main-entrance`. La etiqueta puede pasar a «Tu ubicación» sin que cambie ese origen.
- `src/features/terrain-navigation/lot-destinations.ts`: el centroide identifica y señala el lote; no constituye un acceso validado desde la vía.
- `/admin/experiencias/recorrido-terreno`: permite capturar cuatro puntos y generar un borrador de transformación. Guarda en localStorage y copia el resultado; el visitante no consume esa calibración.

No se inspeccionaron capturas guardadas en otros navegadores ni datos privados de producción. Las conclusiones describen el repositorio revisado.

## La ubicación actual del proyecto

La pantalla usa `10.436829, -75.356179` como referencia exterior fija. Un único punto no permite conocer escala, orientación y deformación del plano, ni ubicar con precisión al visitante frente al lote 45.

El plan anterior del repositorio documenta además otra referencia recibida en grados/minutos/segundos que no coincide con este punto decimal. Se debe confirmar la referencia oficial y medir la entrada por separado.

Propuesta: obtener el ancla desde la configuración del proyecto, publicar el contorno real del terreno y asociar a la misma versión del plano su calibración, vías y destinos. El radio actual de 750 m solo indica proximidad aproximada; no demuestra estar dentro del predio.

## Flujo recomendado para «quiero ir al lote 45»

1. Escribir 45 o tocar el lote en el plano. La coincidencia exacta debe aparecer primero; hoy el filtro por `includes` puede favorecer coincidencias parciales según el orden de los lotes.
2. Mostrar «Lote 45», su manzana y el acceso de destino. Si no existe acceso aprobado, permitir localizar el lote sin ofrecer navegación.
3. Elegir origen: «Mi ubicación» o «Acceso principal». El segundo permite preparar el recorrido sin GPS.
4. Elegir «A pie»; habilitar vehículo u otros perfiles únicamente donde existan tramos y restricciones comprobados.
5. Al pulsar «Usar mi ubicación», obtener coordenadas, antigüedad y precisión. Transformarlas al plano con la calibración publicada.
6. Asociar la posición al tramo transitable cercano con tolerancia acorde al error de GPS. No saltar al otro lado de una manzana o a una vía separada por un obstáculo.
7. Crear un origen temporal en ese tramo y calcular el camino de menor distancia permitida hasta el acceso del lote. No mover el origen automáticamente a un cruce lejano.
8. Encuadrar toda la ruta entre el origen y el acceso, respetando el espacio ocupado por los paneles. Mostrar distancia real de los tramos y tiempo aproximado claramente etiquetado.
9. Iniciar seguimiento: punto azul y círculo de precisión, siguiente maniobra, distancia restante y botón para terminar. Recalcular ante un desvío sostenido, evitando reaccionar a cada oscilación de GPS.
10. Confirmar llegada con una tolerancia ajustada a la precisión y opción manual «Ya llegué». No afirmar entrada al lote solo por acercarse a su centroide.

El recorrido más corto debe ser el más corto entre los caminos permitidos para el perfil elegido; nunca una línea directa que atraviese lotes, zonas verdes o vías cerradas.

## Cómo debe verse el plano

- Ruta azul con borde blanco, flechas de sentido y grosor visual estable al cambiar el zoom.
- Punto azul para ubicación real; entrada identificada explícitamente cuando ese sea el origen. Círculo de incertidumbre visible cuando corresponda.
- Lote 45 destacado con borde dorado y etiqueta legible. Pin final en el acceso junto a la vía; la parcela continúa resaltada para identificarla.
- Atenuar discretamente los elementos ajenos al recorrido conservando cruces, vías y números cercanos.
- Acciones «Ver toda la ruta», «Centrar en mí» y zoom; si la persona mueve el plano, pausar el seguimiento de cámara y ofrecer retomarlo.
- Orientación fija del plano en la primera versión. No girarlo según brújula sin una fuente de rumbo fiable.
- Distancias y tiempos solo a partir de geometría calibrada. Las imágenes de propuesta no acreditan un recorrido medido.

## Interfaz por dispositivo

| Dispositivo | Preparar recorrido | Durante navegación |
| --- | --- | --- |
| Computador | Panel de 320–360 px a la izquierda; plano en el espacio restante; origen, destino y perfil visibles | Resumen compacto, pasos desplegables y ruta completa encuadrada |
| Tablet horizontal | Panel lateral compacto si el ancho útil lo permite | Mantener mapa y próxima indicación simultáneamente visibles |
| Tablet vertical | Hoja inferior similar a móvil; detalles expandibles | Panel reducido y controles fuera de su área |
| Móvil | Buscador arriba y hoja inferior de aproximadamente 25–30 %, ajustada al contenido | Mapa prioritario, próxima indicación arriba y destino/distancia/terminar abajo |

Hoy el panel móvil parte de 56 % de altura y permite 34–70 %. Deja poco espacio para orientarse. Recomiendo estados discretos: compacto, resumen y detalles, con arrastre y botones accesibles. Al abrir el teclado, preservar el buscador y los resultados; al elegir un lote, cerrar el selector y volver al resumen.

Sustituir la navegación superior extensa por un encabezado corto en móvil. Objetivos táctiles de aproximadamente 44 px, texto de lectura cómoda, contraste suficiente, márgenes del área segura y controles utilizables con teclado. La información principal no debe depender del color.

## Estados que necesita la experiencia

- Sin GPS: «Ver recorrido desde el acceso», si existe red aprobada.
- Fuera del terreno: indicar cómo llegar al acceso; distinguir trayecto exterior y recorrido interior.
- Permiso rechazado: continuar con origen manual sin bloquear la exploración.
- GPS impreciso: conservar un estado explícito de precisión baja y evitar instrucciones que aparenten exactitud.
- Red sin publicar: «Puedes localizar el lote; el recorrido estará disponible al validar las vías». No presentar un botón de inicio operativo.
- Sin conexión: anunciarlo; si se implementa caché, mostrar la versión de plano y advertir sobre restricciones no actualizadas.
- Vía cerrada o destino inaccesible: recalcular sobre tramos habilitados o explicar que no hay recorrido disponible.

## Correcciones técnicas antes de habilitarlo

1. Publicar una red con cruces conectados, ejes de vías, longitudes métricas y acceso de cada lote. Verificar en campo la portería, vías transitables y cierres.
2. Calibrar CAD/SVG/GPS con puntos distribuidos y evaluar error en puntos independientes. Usar coordenadas locales en metros para un ajuste numéricamente estable y comprobar la escala.
3. Conectar esa calibración a la vista pública. Conservar ubicación del visitante en memoria y borrar al terminar; mantener separada la información topográfica del administrador.
4. Corregir el origen fijo y la discordancia de umbrales: hoy el estado considera baja precisión por encima de 60 m, pero otro cálculo la considera fiable hasta 75 m. Incluso 60 m puede ser demasiado para distinguir vías próximas; definir el criterio con las medidas reales del proyecto.
5. Corregir el criterio de menor recorrido: el motor suma longitudes en metros con una heurística de distancia en unidades SVG. Sin escala garantizada, esa estimación puede sobreestimar y no asegura la ruta más corta. Para el primer grafo, usar Dijkstra; alternativamente A* con una heurística admisible en metros.
6. Representar origen temporal sobre un tramo, accesos y sentido de los segmentos para poder generar maniobras y flechas correctas. El contrato actual almacena un `svgPath` por tramo, pero no implementa instrucciones.
7. Priorizar búsqueda exacta y hacer que cualquier selección, desde buscador o plano, enfoque el destino o la ruta. Actualmente `focusRequest` se pasa con valor 0.
8. Separar las pruebas de validación: cálculo de caminos y restricciones; transformación y error espacial; seguimiento con GPS simulado; recorrido físico de aceptación.

## Orden de implementación

**Primero:** aprobar el diseño y construir la experiencia de búsqueda, origen explícito, panel adaptable y selección enfocada, conservando el estado real de disponibilidad.

**Segundo:** validar datos de campo, publicar calibración y red, conectar cada acceso y comprobar distancias. Para un piloto, comenzar con una zona que incluya el lote 45 y ampliar tras validarla.

**Tercero:** conectar GPS real, origen sobre tramo, ruta mínima, encuadre, instrucciones y recálculo. Probar en computador, tablet y teléfonos sobre el terreno.

**Después:** recorrido comercial con varias paradas y descarga del plano para uso sin conexión. No son necesarios para resolver el trayecto inicial a un lote.

## Criterios de aceptación

- Al buscar 45 se selecciona exactamente el lote 45 y el mapa lo muestra.
- La ruta termina en su acceso aprobado y utiliza únicamente tramos abiertos del perfil elegido.
- Cambiar la ubicación cambia el origen calculado, y la etiqueta coincide con el origen utilizado.
- El resultado de distancia mínima se verifica con un grafo de referencia; la escala SVG no altera la decisión.
- No hay líneas de recorrido que crucen parcelas o áreas no transitables.
- Móvil conserva suficiente mapa con el panel compacto y el teclado no impide seleccionar un resultado.
- Permiso rechazado, precisión baja, fuera del predio y red incompleta muestran estados comprensibles.
- La calibración se acepta con error espacial definido por el equipo técnico y comprobado en puntos independientes.

## Propuesta visual

Se solicita una lámina de mockups con computador, tablet y móvil, basada en la captura del proyecto. Prompt: «Villa Paraíso, recorrido al lote 45, plano original reconocible, panel compacto, ruta azul siguiendo vías, lote dorado, ubicación azul, hoja inferior móvil de 25 %, tonos marfil y verde bosque; ruta ilustrativa y sin inventar distancias o tiempos».

Generación mediante la herramienta integrada imagegen. La lámina es una propuesta de interfaz, no un levantamiento topográfico ni una captura de funcionalidades ya implementadas.

Imagen: propuestas/recorrido-lote-45-responsive.png. La generación modificó algunos números y geometrías de parcelas y añadió una ramificación visual; debe evaluarse solo la distribución de la interfaz. La implementación conservará el SVG original y dibujará exclusivamente el trayecto calculado, sin ramificaciones ajenas a la ruta.

## Estado posterior a la propuesta

Este análisis documenta el estado inicial. La implementación posterior y los requisitos de validación en terreno se describen en puesta-en-marcha-recorridos.md. El frontend y la preparación de navegación se publicaron en el commit 79445dc; las rutas reales siguen pendientes de validación en campo.
