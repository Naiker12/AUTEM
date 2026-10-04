> Actualización del 4 de octubre de 2026: la sesión de superadmin confirmó 0 nodos y 0 tramos para Villa Paraíso. Se preparó la conexión de versiones, validación, GPS y publicación descrita en `puesta-en-marcha-recorridos.md`. El diagnóstico siguiente conserva el estado previo a esa implementación; no hay una ruta de campo publicada.

# Auditoría de backend y navegación real — Villa Paraíso

Fecha: 4 de octubre de 2026. Alcance: código local, migraciones y consulta de solo lectura con la clave pública ya configurada en D:/AUTEM. No se modificaron datos, permisos o esquema del backend. No se usó una cuenta administrativa para consultar navegación.

## Resultado principal

El catálogo público funciona. La navegación operativa todavía no está conectada: el frontend utiliza un grafo estático vacío y la calibración administrativa permanece como borrador local. No basta con mostrar una ruta sobre el SVG.

### Evidencia de la consulta pública

| Recurso | Resultado | Interpretación |
| --- | --- | --- |
| projects, villa-paraiso | HTTP 200, proyecto publicado | El proyecto está disponible públicamente |
| Coordenada del proyecto | 10.436829, -75.356179 | Referencia general, no una calibración de todo el plano |
| masterplan_version | null | No hay versión de plano registrada en este campo del proyecto |
| lots | HTTP 200, 343 filas, 343 con centroides | Se puede buscar y señalar cada lote en el SVG |
| project_navigation_nodes | HTTP 200, 0 filas visibles | No hay nodos accesibles para el visitante en esta consulta |
| project_navigation_edges | HTTP 200, 0 filas visibles | No hay tramos accesibles para el visitante en esta consulta |

Las respuestas vacías de navegación no prueban que las tablas estén vacías: las políticas RLS pueden ocultar las filas. Las migraciones del repositorio permiten lectura a miembros de la organización, pero no contienen una política pública equivalente para navegación validada. No se inspeccionaron las políticas efectivas con credenciales administrativas.

## Qué está ordenado

- Supabase/Postgres ya administra proyectos, lotes y medios, con acceso público al inventario y permisos de administración separados.
- Existen tablas de nodos y tramos, con longitudes positivas, estado draft/validated, modos, sentidos y aperturas.
- El plano y las rutas están separados: MasterplanSvgViewer presenta; TerrainRouteOverlay dibuja el resultado; route-graph calcula caminos.
- La búsqueda exacta tiene su función independiente. El GPS temporal vive en use-terrain-location y se detiene al ocultar la página o desmontar.
- Dijkstra calcula por metros y ya no mezcla costos con unidades del SVG.
- La ausencia de vías aprobadas no se reemplaza por una línea que atraviese parcelas.

## Desconexiones que bloquean el recorrido real

1. TerrainRouteView importa villaParaisoNavigation, con nodes/edges vacíos. No consulta las tablas de navegación de Supabase.
2. No hay una configuración publicada que agrupe versión del SVG, transformación GPS, geocerca y red navegable. masterplan_version es null en el proyecto consultado.
3. La página administrativa de recorrido guarda las capturas en localStorage y copia un JSON. No publica una calibración que pueda consumir el visitante.
4. Los contratos son diferentes: SQL usa kind junction/lot_access/landmark; TypeScript usa intersection/destination/amenity. SQL referencia UUID; el motor y la búsqueda usan identificadores externos. Hace falta un adaptador explícito y validación en ejecución.
5. El destino calculado es un identificador derivado del lote y su centroide. Falta un vínculo persistente lote → nodo de acceso sobre la vía. El centroide permite destacar el terreno, pero no es una portería.
6. El origen del cálculo sigue siendo main-entrance. El GPS captura posición y proximidad; no genera un nodo temporal sobre un tramo.
7. No hay map matching, avance sobre el recorrido, instrucciones por maniobra, detección de desvío, recálculo o llegada.
8. La consulta pública no ve datos de navegación. Se debe publicar exclusivamente la red aprobada del proyecto publicado, conservando borradores y mediciones administrativas fuera del acceso público.

## Riesgos concretos que conviene resolver

- Las foreign keys de cada tramo verifican que los nodos existan, pero la definición SQL revisada no garantiza que ambos pertenezcan al mismo project_id del tramo. Añadir integridad por proyecto, por ejemplo mediante claves compuestas o validación transaccional.
- Los campos JSON necesitan comprobar estructura, coordenadas finitas, modos admitidos, nodos únicos y continuidad. Los tipos TypeScript no validan respuestas de la base de datos.
- Antes de importar una red, comprobar longitudes finitas/positivas, referencias existentes y componentes conectados. Un tramo aislado no debe habilitar una ruta.
- Las 119 polilíneas candidatas del CAD contienen bordes y contornos; no son por sí solas ejes navegables conectados. Identificar cruces y dividir tramos correctamente antes de publicarlos.
- El error de ajuste actualmente se expresa en unidades SVG. Hace falta convertirlo a metros y comprobarlo con puntos independientes, no solo con los puntos usados para ajustar.
- La precisión de 60 m del GPS del visitante sirve para proximidad aproximada y no necesariamente para distinguir dos vías cercanas. El umbral de navegación debe definirse con la geometría y pruebas del sitio.
- El hook del GPS todavía no aplica una política de antigüedad de mediciones para navegación. Antes de seguir rutas, gestionar timestamp, posiciones obsoletas y reanudación del seguimiento.
- El catálogo público convierte coordenadas ausentes del proyecto en 0. Para navegación debe existir un estado explícito sin referencia, evitando interpretar 0,0 como una ubicación real.
- El panel de calibración no debe identificar una transformación calculada como publicación aprobada: separar capturada, revisada y publicada.

## Correcciones realizadas en esta revisión

- Panel de recorrido reducido: un origen breve, un aviso de disponibilidad y GPS; explicaciones largas dentro de Sobre el recorrido.
- Barra de desplazamiento invisible mediante scrollbar-width y ::-webkit-scrollbar, conservando overflow-y:auto y desplazamiento táctil/rueda.
- Coordenadas SVG vacías ya no equivalen a 0,0 en la calibración.
- Capturas GPS rechazan latitudes/longitudes fuera de rango y precisión negativa.
- La evaluación requiere al menos cuatro puntos de control.
- Ajuste afín con coordenadas centradas y normalizadas para mejorar estabilidad con GPS o coordenadas CAD grandes; rechazo de valores no finitos y geometrías degeneradas.
- Pruebas añadidas para captura inválida, cuatro puntos, coordenada independiente interpolada y puntos colineales, además de ruta mínima, sentidos, cierres y búsqueda.

Estas correcciones no publican ni certifican la calibración; preparan una base verificable.

## Diseño técnico recomendado para completar la función

### Backend de configuración

Reutilizar project_navigation_nodes y project_navigation_edges. Añadir un registro de versión de navegación por proyecto con SVG/version/hash, geocerca, calibración, estado, responsable y fecha de aprobación. Cada versión debe relacionar nodos, tramos y destinos; cambiar la versión activa de forma atómica.

Registrar destinos con lot_id y access_node_id. Para amenidades, usar un destino independiente. La publicación debe impedir referencias entre proyectos y comprobar continuidad, escala y accesos antes de activar el conjunto.

Publicar mediante políticas/RPC controladas solo información de una versión aprobada asociada a un proyecto publicado. Administradores autorizados editan borradores. No abrir las tablas completas a anon ni usar una clave de servicio en el frontend.

### Frontend y archivos

- src/lib/navigation-repository.ts: lectura de una versión publicada y adaptación de filas a contrato del motor; no geometría de rutas dentro de componentes.
- src/features/terrain-navigation/navigation-schema.ts: validación en ejecución de red y calibración.
- src/features/terrain-navigation/gps-projection.ts: GPS → coordenadas del plano usando la transformación publicada.
- src/features/terrain-navigation/road-matching.ts: asociación a tramo permitido y creación de origen temporal, con tolerancia acorde a precisión.
- src/features/terrain-navigation/route-graph.ts: cálculo por metros y restricciones.
- src/features/terrain-navigation/route-progress.ts: distancia restante, siguiente maniobra, desvío y llegada.
- src/features/terrain-navigation/use-terrain-navigation.ts: coordina posición, destino y estados; no envía el GPS crudo al backend.
- src/components/project-view/terrain: buscador, panel y overlay presentacionales.

Estos nombres son una propuesta de distribución, no archivos ya creados. La página pública puede mantenerse como orquestadora; evitar crecer en ella con lógica geográfica o SQL.

### Recorrido de una posición real a un lote

GPS con permiso → comprobar precisión/antigüedad y geocerca → proyectar al SVG → asociar al tramo transitable → origen temporal → nodo de acceso del lote → Dijkstra → geometría orientada → distancia y seguimiento.

Si la persona está fuera, ofrecer trayecto hasta la entrada por separado. Si falla GPS, permitir previsualizar desde un acceso validado. Si no hay acceso del lote o red aprobada, permitir localizarlo sin prometer una ruta.

## Orden para avanzar

1. Revisar con una cuenta administrativa si existen nodos/tramos y cuáles políticas efectivas están aplicadas. Esta auditoría pública no puede decidirlo.
2. Completar registro/versionado, adaptador, integridad por proyecto y publicación controlada. Preparar migraciones revisables; no cambiar permisos en producción sin validar el resultado.
3. Capturar y revisar puntos de campo; construir una zona piloto con entrada, cruces y accesos de algunos lotes, incluido el 45 si es adecuado.
4. Publicar una versión piloto, leerla desde frontend y comprobar rutas desde el acceso.
5. Conectar GPS real, map matching, seguimiento y recálculo; aceptación física en sitio y ampliación gradual a todo el proyecto.

## Aceptación

Una ruta no debe habilitarse hasta comprobar versión consistente, acceso real del lote, longitudes métricas, GPS alineado en puntos independientes y caminos permitidos. Verificar visitantes anónimos, miembros y administradores por separado. Probar denegación de permiso, baja precisión, posición fuera del terreno, vía cerrada, destino sin acceso y pérdida de señal.
