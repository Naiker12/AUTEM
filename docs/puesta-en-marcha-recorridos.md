# Puesta en marcha del recorrido al lote 45

## Estado comprobado

El 4 de octubre de 2026, la sesión de superadmin de AUTEM permitió consultar las tablas de Villa Paraíso: 0 nodos, 0 tramos y masterplan_version sin asignar. La consulta administrativa confirmó que no era solamente una restricción de lectura pública. El usuario indicó que todavía no hay mediciones GPS verificadas.

El usuario aplicó la migración en el editor SQL de Supabase y mostró su resultado satisfactorio. La aplicación reconoció la tabla y se guardó un borrador privado piloto-45-v1 desde la sesión administrativa. La consulta anónima confirmó 0 versiones visibles después del guardado. No hay un recorrido real publicado; siguen pendientes las mediciones y geometrías de campo.

## Implementación preparada

- NavigationAdminPanel consulta los registros existentes, muestra rol y referencias entre proyectos y permite crear una plantilla piloto, guardar borradores y recuperar versiones guardadas.
- La captura de terreno conserva cuatro controles y añade dos puntos independientes. Los borradores locales anteriores se conservan al añadir esas tarjetas.
- project_navigation_versions almacena snapshots completos. Esto mantiene red, accesos y calibración en una misma versión inmutable; las tablas anteriores permanecen intactas como fuente de captura/importación. El panel distingue esas tablas de las versiones guardadas.
- Solo los administradores autorizados insertan borradores. Los visitantes leen únicamente snapshots publicados de proyectos publicados. No hay UPDATE directo para usuarios autenticados. La función de publicación verifica datos y reemplaza la versión pública en una transacción, archivando la anterior.
- La calibración se calcula tanto en TypeScript como en PostgreSQL. El servidor comprueba puntos independientes y error en metros, longitudes, extremos, pertenencia de los lotes y conexión peatonal con la entrada.
- El frontend compara la versión de la base de datos con el SHA-256 del plano vectorial que realmente renderiza; las dimensiones también deben coincidir.
- El GPS se proyecta al plano y se asocia a una vía permitida. Se divide ese tramo con un nodo temporal para calcular la ruta mínima respetando sus sentidos. No se utiliza el centroide del lote como acceso.
- Cada posición aceptada recalcula distancia y camino; se muestra llegada cerca del acceso. Posición antigua, fuera de geocerca, precisión insuficiente, vía ambigua, modo sin camino o destino sin acceso detienen la ruta GPS.
- El GPS del visitante permanece en memoria; no se guarda ni se envía al backend. Las capturas técnicas de campo solo se envían cuando el administrador guarda explícitamente una versión.

## Pasos pendientes

1. Migración aplicada y borrador privado guardado. No volver a ejecutar el mismo archivo; los siguientes cambios del esquema deben usar una nueva migración.
2. En /admin/experiencias/recorrido-terreno capturar cuatro controles distribuidos y no colineales. Cada control enlaza GPS y marca exacta en el SVG. Precisión de captura <=20 m y separación entre controles >=25 m.
3. Capturar dos puntos independientes, distintos de los controles y separados al menos 10 m entre sí. Sirven para comprobar el error, no para ajustar la transformación. El umbral inicial del piloto es un error máximo de 10 m; debe revisarse con la separación real de las vías y el trabajo de campo.
4. Crear la plantilla del lote 45. Conserva las mediciones existentes y deja null o arrays vacíos donde faltan datos. No inventa la portería, cruces, acceso ni longitudes.
5. Completar el JSON técnico: geocerca del proyecto, entrada, cruces necesarios, acceso físico al lote 45 y polilíneas por los ejes transitables. Cada tramo empieza y termina exactamente en su nodo; longitud en metros, sentidos, modos y cierres deben verificarse en obra. La plantilla con un cruce es solo un esquema: añadir todos los cruces necesarios para el recorrido real.
6. Guardar el borrador privado. Al recargar, recuperarlo en Versiones guardadas. Modificar el JSON requiere guardar otro borrador; las versiones publicadas permanecen inmutables.
7. Recorrer y comprobar el piloto físicamente. Confirmar la casilla de revisión de campo y publicar únicamente cuando las comprobaciones pasen. La función asigna la primera versión del plano al proyecto; una discrepancia posterior bloquea la publicación.
8. Probar como visitante: lote 45, preview desde entrada, permiso GPS, desplazamiento real, cambio de vía y llegada. Repetir con GPS denegado, baja precisión, señal antigua, fuera del proyecto, vía cerrada y vehículo sin vías autorizadas.

## Separación del código

- navigation-repository.ts: Supabase, auditoría y publicación.
- navigation-schema.ts: contrato y validación de red/calibración.
- masterplan-version.ts: identidad del plano realmente renderizado.
- gps-projection.ts: proyección, inversa, distancia y geocerca.
- road-matching.ts: asociación métrica y nodo temporal; conserva sentido de circulación.
- navigation-session.ts: decisión pura de preview/GPS/ruta/llegada.
- use-terrain-navigation.ts: carga y coordinación del estado React.
- use-terrain-location.ts: permiso y ciclo de vida GPS, timestamp y descarte de callbacks anteriores.
- route-graph.ts: Dijkstra; TerrainRouteOverlay dibuja la geometría aprobada.

La publicación inicial utiliza snapshots completos en lugar de permitir que ediciones parciales de las tablas de captura alteren una ruta activa. No importa automáticamente los bordes del CAD como ejes navegables.

## Verificación reproducible

```powershell
node scripts/check-terrain-navigation.mjs
node scripts/check-navigation-pilot.mjs
node scripts/check-navigation-publication.mjs
# O ejecutar las tres comprobaciones con pnpm run test:navigation
pnpm exec tsc --noEmit
pnpm build
```

Los tests del piloto usan mediciones sintéticas identificadas como test-project; no se suben a Supabase. PostgreSQL se prueba localmente con PGlite, incluyendo RLS, rechazo de publicaciones incorrectas, permisos, borradores privados y reemplazo atómico. Esa prueba no sustituye la comprobación del esquema remoto ni la aceptación física en terreno.

El piloto implementa ruta, distancia, actualización y llegada. No incluye aún navegación por voz, maniobras detalladas, mapas externos hasta la entrada ni navegación sin conexión.
## Referencia CAD preparada automáticamente

Se registraron 2.311 vértices de A-VIA, A-CALZADA y A-SENDEROS contra el SVG actual. El ajuste CAD→SVG tiene un RMS de 0,0406 unidades SVG. La anotación ACCESO PRINCIPAL se sitúa aproximadamente en X 1014,73 / Y 2148,51 del SVG y aparece como referencia ámbar en el panel administrativo.

Esta correspondencia no convierte el CAD a GPS. En la revisión del DXF no se encontró una declaración geográfica utilizable para una conversión confiable; la posición de una anotación tampoco certifica la posición física de la portería. Por ello no se rellenaron controles GPS ni se publicó la ruta.

Archivos: src/data/villa-paraiso-cad-reference.json y docs/navigation/referencia-cad-svg.json. Para regenerar: node scripts/register-navigation-cad.mjs. El script comprueba el número de polígonos y vértices y rechaza un ajuste con RMS mayor a 0,1 unidades SVG.
