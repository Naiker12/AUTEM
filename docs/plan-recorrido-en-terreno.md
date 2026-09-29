# Plan técnico — Recorrido en terreno

**Proyecto:** Villa Paraíso / AUTEM
**Estado:** fases 0 y 2 implementadas como piloto local; fase 1 requiere validación física
**Objetivo:** que un visitante pueda abrir el plano, autorizar ubicación, seleccionar un lote o amenidad y seguir una ruta interna confiable.

> La posición se obtiene en el teléfono del visitante. La ruta se calcula sobre las vías privadas de Villa Paraíso; no se delega a Google Maps. Google/OSM solo pueden servir para llevar al visitante hasta la entrada del proyecto.

## 1. Decisiones de producto

### Lo que sí hará la primera versión (MVP)

1. Nueva pestaña **Recorrido en terreno** (ya visible en el frontend).
2. Explicar el permiso de ubicación y pedirlo únicamente al pulsar `Iniciar recorrido`.
3. Detectar si el usuario está dentro o cerca de Villa Paraíso.
4. Permitir elegir un lote, entrada, parqueadero, oficina de ventas o zona social.
5. Mostrar punto azul, precisión estimada, ruta dorada, distancia y tiempo estimado.
6. Recalcular si el visitante se desvía o cambia el destino.
7. Funcionar sin GPS: el usuario podrá explorar el plano y elegir el destino manualmente.

### Lo que no hará el MVP

- No guardará la ubicación exacta de los visitantes.
- No dará instrucciones por voz, navegación exterior, ni acceso a portería/cerraduras.
- No será una vista 3D en vivo. La vista 3D se trata como una fase posterior, cuando existan modelos o renders reales del proyecto.

## 2. Diagnóstico de AUTEM hoy

| Activo existente                        | Estado              | Uso en esta función                                                      |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| React 19 + TypeScript + TanStack Router | Disponible          | Pantalla, estado, rutas y separación por componentes.                    |
| `MasterplanSvgViewer`                   | Disponible          | Se reutiliza como plano principal; no se crea un mapa desde cero.        |
| `villa-paraiso-geometry.json`           | Disponible          | Ya contiene los 343 lotes, centroides y contornos SVG.                   |
| `villa-paraiso-layers.json`             | Disponible          | Ya contiene vías, calzadas, senderos y áreas verdes visuales.            |
| DWG/DXF de Villa Paraíso                | Disponible          | Fuente para validar o dibujar la red navegable de vías.                  |
| Leaflet                                 | Disponible          | Mapa exterior y contexto geográfico; no reemplaza el plano SVG interior. |
| Supabase Auth + roles                   | Conectado en código | Base para administración, RLS y datos editables.                         |

**Conclusión:** el frontend visual ya está avanzado. El trabajo crítico no es instalar otro mapa: es convertir las vías internas reales en una red de navegación y calibrarla con coordenadas GPS.

## 3. Arquitectura recomendada

```text
Teléfono / tablet del visitante
  └─ navigator.geolocation.watchPosition()
       ├─ precisión + latitud/longitud, solo en memoria
       ├─ geocerca de Villa Paraíso
       ├─ transformación GPS → coordenada del SVG
       ├─ ajuste al tramo de vía más cercano (map matching)
       └─ A* sobre red interna → ruta, distancia y ETA
                                      │
                                      ▼
                          MasterplanSvgViewer de AUTEM

Supabase (datos editables, no GPS crudo)
  ├─ destinos, lotes, geocerca y versión de plano
  ├─ nodos y tramos navegables de las vías
  ├─ restricciones: cerrado / peatonal / vehículo
  ├─ roles y auditoría de cambios
  └─ métricas agregadas y anónimas
```

### Regla importante

La ubicación del visitante se procesa **en el navegador**. Para el MVP no se necesita enviar cada punto al backend. Esto reduce riesgo de privacidad, costo y complejidad. El backend sirve para administrar el mapa y sus reglas, no para vigilar visitantes.

## 4. Algoritmos y datos geográficos

### 4.1 Sistemas de coordenadas

El SVG usa coordenadas propias (`x`, `y`); el GPS entrega WGS84 (`lat`, `lng`). Se requiere una calibración para que ambos hablen del mismo lugar.

1. Elegir al menos 4 puntos físicos inequívocos: entrada, esquina de vía, rotonda y zona social.
2. Medir sus coordenadas reales con GPS de buena precisión o levantamiento topográfico.
3. Registrar también su coordenada dentro del SVG.
4. Calcular la transformación GPS → SVG y validarla en puntos no usados para calibrar.
5. Aceptar el punto azul solo cuando `accuracy` sea razonable; si no, informar “precisión baja”.

No se debe inventar la transformación basándose solo en la imagen. El DXF/DWG y una visita de validación son obligatorios.

### 4.2 Red de navegación

La red es un **grafo**:

- **Nodo:** entrada, cruce, giro, parqueadero, amenidad o acceso a lote.
- **Tramo/arista:** parte transitable entre dos nodos.
- **Costo:** metros; puede añadir penalización por vía cerrada, acceso solo peatonal o pendiente.
- **Perfil:** `walking`, `driving`, `accessible`.

El algoritmo **A\*** encuentra el camino de menor costo desde el tramo donde está el visitante hasta el nodo de destino. Antes de rutear, se hace _map matching_: se proyecta el GPS al tramo válido más cercano para evitar que el punto azul “salte” al interior de un lote o área verde.

### 4.3 Cuándo usar PostGIS

No es indispensable para el primer prototipo local porque Villa Paraíso es un único plano pequeño y A* puede correr en el cliente. Sí se recomienda al llevar los datos a producción para geocercas, validación espacial, consultas por cercanía e importaciones GIS. PostGIS ofrece `Point`, `Polygon` y `LineString` indexables; debe instalarse en un esquema dedicado, no en `public`. [Documentación de PostGIS en Supabase](https://supabase.com/docs/guides/database/extensions/postgis)

## 5. Backend: qué se usará y qué no

### Recomendación

Usar **Supabase/Postgres** como backend de configuración y administración. No crear un servidor Node separado en la primera etapa.

| Necesidad                                   | Solución                                                       |
| ------------------------------------------- | -------------------------------------------------------------- |
| Datos del plano, destinos y red vial        | Postgres/Supabase.                                             |
| Archivos DXF, SVG, renders y versiones      | Supabase Storage o repositorio/CDN según tamaño.               |
| Panel de administración                     | Rutas `/admin` existentes y roles actuales.                    |
| Ubicación en vivo                           | API del navegador en el dispositivo; no base de datos.         |
| Cálculo de ruta MVP                         | Cliente TypeScript, A*.                                        |
| Validación sensible o futuras integraciones | Supabase Edge Function/RPC, sin exponer secretos al navegador. |
| Analítica                                   | Eventos agregados, sin coordenadas crudas.                     |

### Modelo de datos propuesto

| Tabla                     | Campos principales                                                                      | Finalidad                                       |
| ------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `project_maps`            | `id`, `project_id`, `version`, `svg_url`, `transform`, `is_active`                      | Versionar el plano y su calibración.            |
| `project_geofences`       | `project_id`, `boundary`, `near_radius_m`                                               | Define “en proyecto” y “cerca”.                 |
| `navigation_destinations` | `id`, `project_id`, `type`, `label`, `lot_id`, `node_id`, `svg_x`, `svg_y`, `is_active` | Lotes, entrada, parqueadero y amenidades.       |
| `navigation_nodes`        | `id`, `map_id`, `svg_x`, `svg_y`, `location`, `kind`                                    | Cruces, accesos y destinos.                     |
| `navigation_edges`        | `id`, `map_id`, `from_node_id`, `to_node_id`, `path`, `length_m`, `modes`, `status`     | Tramos transitables para A*.                    |
| `navigation_restrictions` | `edge_id`, `starts_at`, `ends_at`, `reason`, `is_closed`                                | Obras, cierres o cambios temporales.            |
| `guided_tours`            | `id`, `project_id`, `name`, `stops`, `is_active`                                        | Recorrido comercial: entrada → amenidad → lote. |
| `navigation_events`       | `project_id`, `event_type`, `destination_type`, `duration_bucket`, `created_at`         | Métricas sin ubicación cruda.                   |
| `map_change_audit`        | `actor_id`, `entity`, `before`, `after`, `created_at`                                   | Trazabilidad de cambios administrativos.        |

`location`, `boundary` y `path` podrán ser datos PostGIS/GeoJSON según la fase. Todas las tablas expuestas tendrán RLS. Supabase indica que una tabla expuesta sin RLS puede quedar accesible para roles con permisos; el `service_role` nunca va al navegador. [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

## 6. Estructura de código propuesta

```text
src/
  components/project-view/
    TerrainRouteView.tsx          # pantalla principal
    TerrainRoutePanel.tsx         # permiso, destino, pasos y CTA
    TerrainMiniMap.tsx            # minimapa de lotes
    TerrainRouteLayer.tsx         # punto azul, ruta y pines sobre SVG
  features/terrain-navigation/
    types.ts                      # contratos de dominio, sin React
    constants.ts                  # umbrales y etiquetas
    route-graph.ts                # grafo y A*
    coordinate-transform.ts       # GPS ↔ SVG
    map-matching.ts               # GPS al tramo válido
    route-estimate.ts             # distancia y ETA
    destination-repository.ts     # lectura de datos
    telemetry.ts                  # eventos agregados
  hooks/
    useGeolocation.ts             # permiso, watchPosition y cleanup
    useTerrainRoute.ts            # orquesta ubicación, destino y A*
  data/
    villa-paraiso-navigation.json # solo prototipo, luego Supabase
  routes/admin/experiencias/
    recorrido-terreno.tsx         # editor de destinos, vías y cierres
supabase/
  migrations/                     # SQL versionado
  seed/                           # red inicial de Villa Paraíso
```

### Reglas de código limpio

- TypeScript estricto; sin `any` en datos geográficos.
- Componentes visuales no contienen SQL, A* ni permisos del navegador.
- Las funciones de cálculo son puras, deterministas y testeables.
- Unidades explícitas: `Meters`, `LatLng`, `SvgPoint`, `RouteEdge`.
- IDs estables; nunca usar el texto visible como clave de negocio.
- Estados explícitos: `idle | requesting-permission | locating | ready | low-accuracy | denied | outside-geofence | error`.
- No duplicar los lotes: el destino de un lote referencia su `lot_id` actual.
- Versionar migraciones y datos semilla; no editar producción manualmente.
- Mantener el `.env` fuera de Git; el navegador solo usa `VITE_SUPABASE_URL` y la clave publicable.

## 7. Fases de implementación

### Registro de ejecución — 28 de septiembre de 2026

| Fase                         | Estado                            | Entregable / límite actual                                                                                                                                                                                                                                |
| ---------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Alcance y seguridad      | Implementada                      | Permiso solicitado solo con el botón, parada manual/automática al ocultar la pestaña, precisión visible y aviso de que no se guarda GPS.                                                                                                                  |
| 1 — Datos de terreno y plano | En extracción, pendiente de campo | Se reutilizan los 343 lotes y el plano SVG existentes. El CAD `VILLA PARAISO_05092026_CAMPO.dxf` aporta las capas candidatas `A-VIA`, `A-CALZADA` y `A-SENDEROS`; falta confirmar la entrada, levantar 4–8 puntos GPS↔SVG y validar 10 recorridos reales. |
| 2 — Prototipo local          | Implementado como demo honesta    | Nueva pestaña, selector de lote, GPS con `watchPosition`, estados de permiso/error y capa azul sobre el plano. La ruta es conceptual, no calcula A* ni se declara navegable hasta terminar fase 1.                                                        |

**Lo que queda bloqueado conscientemente:** una ruta confiable, el punto azul convertido a coordenadas del SVG, distancia/ETA interna y recálculo. Todos dependen de la calibración y de la red transitable real; inventarlos sería riesgoso para visitantes y vehículos.

### Hallazgo CAD — 29 de septiembre de 2026

La extracción reproducible del archivo `cad/VILLA PARAISO_05092026_CAMPO.dxf` encontró **119 polilíneas candidatas**: 50 en `A-VIA`, 41 en `A-CALZADA` y 28 en `A-SENDEROS`. También localizó la anotación **`ACCESO PRINCIPAL`** en la capa `A-VIA`, coordenada CAD **X 859894.9872612, Y 1645954.774992162**.

Ese punto se registró como candidato en `src/data/villa-paraiso-navigation-survey.ts`. Aún no es un punto navegable: se debe comprobar en campo que corresponde a la portería usada por visitantes y tomar su coordenada GPS junto con al menos otros tres puntos de control antes de transformarlo al SVG.

### Fase 0 — Alcance y seguridad (1–2 días)

**Decidir:** destinos iniciales, perfiles (a pie/carro), radio “cerca”, política de ubicación, responsable de actualizar vías y cierres.

**Salida:** documento de alcance aprobado y texto de privacidad/permiso.

**Criterio de aceptación:** el usuario entiende qué se solicita, por qué y cómo detenerlo.

### Fase 1 — Datos de terreno y plano (3–7 días)

1. Revisar DXF/DWG con urbanismo/topografía.
2. Extraer vías, cruces, portería, parqueaderos, zona social y accesos a lotes.
3. Definir 4–8 puntos de control GPS ↔ SVG.
4. Dibujar el grafo inicial y medir longitudes.
5. Validar físicamente 10 rutas de muestra.

**Salida:** `villa-paraiso-navigation.json` validado y una lista de discrepancias de obra.

**Bloqueador:** sin puntos reales de control no se debe prometer posición precisa en el plano.

### Fase 2 — Prototipo funcional sin backend (4–6 días)

1. Implementar `useGeolocation` con inicio/parada seguros.
2. Añadir selección de destino y capa de punto azul/ruta sobre el SVG actual.
3. Implementar A*, distancia y ETA para caminata.
4. Añadir estados: permiso denegado, mala precisión, fuera del proyecto y sin conexión.
5. Probar en Android e iPhone dentro del terreno.

**Salida:** demo navegable para Villa Paraíso usando datos locales.
**Objetivo:** validar experiencia y calidad del GPS antes de construir administración.

### Fase 3 — Backend y administración (5–8 días)

1. Crear migraciones Supabase, Storage y RLS.
2. Migrar destinos y red desde JSON a Postgres.
3. Construir módulo admin para activar/desactivar destinos y cerrar tramos.
4. Agregar auditoría y publicación de una versión de mapa.
5. Guardar analítica agregada de uso; no trazas GPS.

**Salida:** el equipo puede cambiar rutas sin desplegar código.

### Fase 4 — Calidad, seguridad y lanzamiento piloto (4–7 días)

1. Pruebas unitarias de A*, transformación y map matching.
2. Pruebas de componente: permisos, rutas, fallbacks y accesibilidad.
3. Recorridos reales con 5–10 personas y varios móviles.
4. Corregir vías, radios, tiempos y etiquetas.
5. Activar para un grupo controlado por QR en portería.

**Salida:** piloto listo para clientes reales.

### Fase 5 — Mejora comercial (posterior)

- Tour guiado de ventas con varias paradas.
- Rutas por carro, a pie y accesibles.
- Mensajes de llegada y QR por lote.
- Fotos, 360° y ficha comercial al llegar al destino.
- Tablero de destinos más consultados y rutas fallidas.

### Fase 6 — Vista 3D real (posterior, independiente)

**Prerequisito:** modelo 3D/GLB, ortofoto o renders verificados de entrada y vías.
**Tecnología:** Three.js ya existe en AUTEM, pero debe mostrar activos reales; no usar imágenes IA como representación operacional.
**Salida:** modo opcional “Vista 3D”, siempre con el plano 2D como respaldo.

## 8. Privacidad, permisos y seguridad

- Usar HTTPS. La API de geolocalización solo está disponible en contextos seguros y requiere consentimiento explícito. [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- Pedir ubicación después de una acción clara, no al cargar la página.
- Usar `watchPosition()` únicamente mientras el recorrido esté activo; ejecutar `clearWatch()` al detener, cambiar de pestaña o desmontar el componente. [MDN: watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition)
- Mostrar precisión estimada y no forzar una ruta si es mala.
- No guardar latitud/longitud individual por defecto. Si en el futuro se necesita, exigir consentimiento independiente, retención corta y justificación legal.
- Configurar `Permissions-Policy: geolocation=(self)` y revisar iframes/embeds. [MDN: Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)
- RLS por proyecto/organización; solo roles autorizados editan vías, geocercas y destinos.
- Ninguna clave `service_role` ni secreto de proveedor de mapas entra al bundle frontend.

## 9. Pruebas y métricas de aceptación

### Pruebas mínimas

| Área          | Casos                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Rutas         | Ruta corta, ruta larga, tramo cerrado, destino inaccesible y origen fuera del grafo.            |
| GPS           | Permiso aceptado/negado, precisión alta/baja, señal perdida, cambio de pestaña y parada manual. |
| Plano         | Transformación GPS→SVG en al menos 10 puntos reales; error medido y documentado.                |
| Dispositivos  | Android Chrome, iPhone Safari, tablet y escritorio sin GPS.                                     |
| Accesibilidad | Navegación por teclado, contraste, estados anunciados y controles táctiles.                     |
| Seguridad     | RLS, permisos de rol, auditoría de cambios y secretos fuera del cliente.                        |

### Indicadores de piloto

- % de usuarios que autorizan ubicación.
- % que inicia una ruta.
- % que llega al destino sin cambiar manualmente de ruta.
- precisión GPS media y cantidad de “precisión baja”.
- destinos más seleccionados.
- rutas que requieren corrección de la red.

## 10. Orden de trabajo inmediato

1. Confirmar que la primera experiencia será **a pie** y no para carro.
2. Nombrar los destinos iniciales: entrada, oficina, parqueadero, zona social y lote piloto.
3. Reunir el plano civil/topográfico o validar el DXF/DWG con la persona de obra.
4. Hacer una visita corta para capturar puntos de control y probar señal GPS.
5. Implementar la Fase 2 con un lote piloto antes de crear todas las 343 rutas.

## 11. Decisiones que requieren validación del equipo

- ¿La ruta guía caminando, en carro o ambos?
- ¿Cuál es la entrada/portería real y dónde queda el parqueadero de visitantes?
- ¿Qué amenidades y lotes se exponen al público?
- ¿El recorrido será público, por QR o solo para clientes con cita?
- ¿Quién actualiza una vía cerrada, obra o cambio de acceso?
- ¿Qué precisión mínima se considera aceptable en el sitio?

## 12. Referencia geográfica inicial recibida

Se recibió esta ubicación para Villa Paraíso:

| Fuente                           | Latitud         | Longitud        | Uso propuesto                                                             |
| -------------------------------- | --------------- | --------------- | ------------------------------------------------------------------------- |
| Decimal                          | `10.436829`     | `-75.356179`    | **Ancla inicial del proyecto**; ya coincide con `src/data/properties.ts`. |
| Grados/minutos/segundos recibida | `10°26'16.9" N` | `75°21'20.9" W` | Referencia a verificar en visita de campo.                                |

### Hallazgo importante: las dos formas no son exactamente el mismo punto

La conversión de la coordenada DMS recibida es `10.438028, -75.355806`. Está aproximadamente **140 m** al noreste de `10.436829, -75.356179`.

La conversión correcta de la coordenada decimal es:

```text
10.436829, -75.356179
= 10°26'12.6" N, 75°21'22.2" W
```

Por ahora se usará el punto decimal como **centro/referencia exterior** porque ya está configurado en AUTEM. No se debe usar como la posición de la portería ni como el origen de una ruta interna hasta confirmar cuál punto representa realmente la entrada.

### Cómo se incorpora en el recorrido

1. El punto decimal crea una geocerca amplia de llegada al proyecto (por ejemplo, radio temporal de 250–350 m durante pruebas).
2. La portería se registra como un destino separado: `Entrada principal`, con su propia coordenada GPS y coordenada SVG.
3. Los puntos de control de Fase 1 calibran el plano: el centro del proyecto por sí solo no permite convertir GPS a posiciones exactas de los lotes.
4. Tras la visita de campo se conserva una sola coordenada oficial por elemento: proyecto, portería, parqueadero, oficina, zona social y cada acceso de lote.

**Enlace de inspección:** [abrir coordenada decimal en OpenStreetMap](https://www.openstreetmap.org/?mlat=10.436829&mlon=-75.356179#map=17/10.436829/-75.356179). El entorno cartográfico debe validarse con el equipo de obra; los resultados públicos no identifican de forma inequívoca el proyecto por nombre.

---

Este plan propone una primera versión útil y segura sin sobrediseñar: plano real + rutas internas + GPS temporal en el dispositivo. La base queda preparada para administración, analítica y una vista 3D real en fases posteriores.
