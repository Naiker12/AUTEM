import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const DXF_PATH = path.resolve("cad/ACAD-PRY_VILLA PARAISO_U-001_30102026.dxf");
const OUTPUT_LAYERS = path.resolve("src/data/villa-paraiso/layers.json");
const OUTPUT_LOTS = path.resolve("src/data/villa-paraiso/lots.json");
const OUTPUT_SQL = path.resolve(
  "supabase/migrations/202610310001_update_villa_paraiso_masterplan_338_lots.sql",
);

// Transformación exacta calibrada CAD (MAGNA-SIRGAS Origen Nacional) -> SVG Pixels
const A = 3.0054330531487263;
const C = -2583313.5796809415;
const E = -3.0054477738607925;
const F = 4948975.025786634;
const SVG_WIDTH = 2400;
const SVG_HEIGHT = 2324;

function toSvgX(cadX) {
  return Math.round((A * cadX + C) * 10) / 10;
}

function toSvgY(cadY) {
  return Math.round((E * cadY + F) * 10) / 10;
}

function pointsToPath(pts, close = true) {
  if (!pts || pts.length < 2) return "";
  let d = `M ${toSvgX(pts[0].x)} ${toSvgY(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${toSvgX(pts[i].x)} ${toSvgY(pts[i].y)}`;
  }
  if (close) d += " Z";
  return d;
}

// Algoritmo Ray Casting para punto en polígono
function pointInPolygon(pt, vs) {
  const x = pt.x;
  const y = pt.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x;
    const yi = vs[i].y;
    const xj = vs[j].x;
    const yj = vs[j].y;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Cálculo de área y centroide por fórmula Shoelace
function polygonMetrics(pts) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const f = pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    area += f;
    cx += (pts[i].x + pts[j].x) * f;
    cy += (pts[i].y + pts[j].y) * f;
  }
  area = area / 2;
  const absArea = Math.abs(area);
  if (absArea < 1e-6) {
    let sx = 0;
    let sy = 0;
    for (const p of pts) {
      sx += p.x;
      sy += p.y;
    }
    return { area: 0, cx: sx / n, cy: sy / n };
  }
  cx = cx / (6 * area);
  cy = cy / (6 * area);
  return { area: absArea, cx, cy };
}

async function extract() {
  console.log("Iniciando extracción profunda desde:", DXF_PATH);
  if (!fs.existsSync(DXF_PATH)) {
    throw new Error(`No se encontró el archivo DXF en: ${DXF_PATH}`);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(DXF_PATH),
    crlfDelay: Infinity,
  });

  let inEntities = false;
  let prevCode = null;
  let currentEntity = null;
  let currentPoly2d = null;

  const lotPolylines = [];
  const lotTexts = [];
  const mzPolylines = [];
  const mzTexts = [];
  const viaPolylines = [];
  const calzadaPolylines = [];
  const senderoPolylines = [];
  const greenPolylines = [];
  const waterPolylines = [];
  const linderoPolylines = [];
  const amenityPolylines = [];
  const streetTexts = [];
  const treePoints = [];
  const amenityPoints = [];

  for await (const line of rl) {
    const val = line.trim();
    if (prevCode === null) {
      prevCode = val;
      continue;
    }
    const code = prevCode;
    prevCode = null;

    if (code === "2" && val === "ENTITIES") inEntities = true;
    if (code === "0" && val === "ENDSEC") inEntities = false;
    if (!inEntities) continue;

    if (code === "0") {
      if (currentEntity) {
        saveEntity(currentEntity);
      }
      if (val === "POLYLINE") {
        currentPoly2d = { layer: "", points: [], closed: false };
      } else if (val === "SEQEND") {
        if (currentPoly2d && currentPoly2d.points.length >= 2) {
          savePoly2d(currentPoly2d);
        }
        currentPoly2d = null;
      }

      currentEntity = {
        type: val,
        layer: "",
        color: null,
        pattern: "",
        points: [],
        text: "",
        x: null,
        y: null,
        closed: false,
      };
    } else if (currentEntity) {
      if (code === "8") {
        currentEntity.layer = val;
        if (currentPoly2d && !currentPoly2d.layer) currentPoly2d.layer = val;
      } else if (code === "62") {
        currentEntity.color = parseInt(val, 10);
      } else if (code === "2" && !currentEntity.pattern) {
        currentEntity.pattern = val;
      } else if (code === "1" || code === "3") {
        currentEntity.text += val;
      } else if (code === "70" && currentEntity.type === "LWPOLYLINE") {
        currentEntity.closed = (parseInt(val, 10) & 1) === 1;
      } else if (code === "10") {
        const x = parseFloat(val);
        if (currentEntity.type === "LWPOLYLINE" || currentEntity.type === "HATCH") {
          currentEntity.points.push({ x, y: 0 });
        } else if (currentEntity.type === "VERTEX" && currentPoly2d) {
          currentPoly2d.points.push({ x, y: 0 });
        } else if (currentEntity.x === null) {
          currentEntity.x = x;
        }
      } else if (code === "20") {
        const y = parseFloat(val);
        if (
          (currentEntity.type === "LWPOLYLINE" || currentEntity.type === "HATCH") &&
          currentEntity.points.length > 0
        ) {
          currentEntity.points[currentEntity.points.length - 1].y = y;
        } else if (
          currentEntity.type === "VERTEX" &&
          currentPoly2d &&
          currentPoly2d.points.length > 0
        ) {
          currentPoly2d.points[currentPoly2d.points.length - 1].y = y;
        } else if (currentEntity.y === null) {
          currentEntity.y = y;
        }
      }
    }
  }

  if (currentEntity) saveEntity(currentEntity);

  function savePoly2d(p) {
    // Canals are open drainage lines and should not be closed as filled water areas
  }

  function saveEntity(e) {
    // 1. Textos
    if ((e.type === "TEXT" || e.type === "MTEXT") && e.text && e.x && e.y) {
      const clean = e.text
        .replace(/\\.*?;/g, "")
        .replace(/[{}]/g, "")
        .trim();
      if (e.layer === "A_ENUMERACION_F") {
        lotTexts.push(e);
      } else if (e.layer === "A-MZ_6") {
        mzTexts.push(e);
      } else if (
        e.layer === "A-VIA" ||
        clean === "VIA SANTARROSA-VILLANUEVA" ||
        clean.startsWith("CARRERA") ||
        clean.startsWith("CALLE") ||
        clean.startsWith("TRASVERSAL") ||
        clean.startsWith("ACCESO")
      ) {
        streetTexts.push({ text: clean, x: toSvgX(e.x), y: toSvgY(e.y) });
      }
    }

    // 2. Puntos (árboles y palmeras)
    if (e.type === "POINT" && e.x && e.y) {
      if (e.layer === "palmeras" || e.layer === "arbol" || e.layer === "Arboles entrada") {
        treePoints.push({
          type: e.layer === "palmeras" ? "palm" : "tree",
          x: toSvgX(e.x),
          y: toSvgY(e.y),
        });
      }
    }

    // 3. Polilíneas y Hatches
    if (e.layer === "A-PREDIOS_5" && e.points.length >= 3) {
      lotPolylines.push(e);
    } else if (e.layer === "A-MZ_6" && e.points.length >= 3) {
      mzPolylines.push(e);
    } else if (e.layer === "A-VIA" && e.points.length >= 2) {
      viaPolylines.push(e);
    } else if (e.layer === "A-CALZADA" && e.points.length >= 2) {
      calzadaPolylines.push(e);
    } else if (e.layer === "A-SENDEROS" && e.points.length >= 2) {
      senderoPolylines.push(e);
    } else if (e.layer === "_LINDERO" && e.points.length >= 3) {
      linderoPolylines.push(e);
    } else if (e.layer === "A-CUERPO DE AGUA" && e.points.length >= 3) {
      waterPolylines.push(e);
    } else if (
      e.layer === "A-ZONA VERDE" ||
      e.layer === "zonas verdes" ||
      e.layer === "A-JARDINERIA" ||
      (e.layer === "AA_HATCH TEXTURES" && [85, 114, 116, 142, 152].includes(e.color))
    ) {
      if (e.points.length >= 3) greenPolylines.push(e);
    } else if (
      ["PISO", "U-PROY_1", "A-MUROS_F", "A-PALMA_CUBIERTA", "A-ACCESORIOS", "A-COLS-ACHU"].includes(
        e.layer,
      )
    ) {
      if (e.points.length >= 2) amenityPolylines.push(e);
    }
  }

  console.log("Entidades procesadas:");
  console.log(`- Polilíneas de lotes (A-PREDIOS_5): ${lotPolylines.length}`);
  console.log(`- Textos de lotes: ${lotTexts.length}`);
  console.log(`- Zonas verdes (incluye parques centrales): ${greenPolylines.length}`);
  console.log(`- Cuerpos de agua (2 lagos + río + canales): ${waterPolylines.length}`);
  console.log(`- Calzadas: ${calzadaPolylines.length}`);
  console.log(`- Senderos peatonales: ${senderoPolylines.length}`);
  console.log(`- Estructuras y amenidades: ${amenityPolylines.length}`);
  console.log(`- Rótulos de calles/vías/amenidades: ${streetTexts.length}`);
  console.log(`- Puntos de árboles/palmeras: ${treePoints.length}`);
  console.log(`- Puntos de amenidades deportivas/acuáticas: ${amenityPoints.length}`);

  // 1. Deduplicar polígonos de lotes
  const uniqueLots = [];
  for (const poly of lotPolylines) {
    const validPts = poly.points.filter((pt) => pt.x > 850000 && pt.y > 1640000);
    if (validPts.length < 3) continue;
    const m = polygonMetrics(validPts);
    if (m.area < 25 || m.area > 20000) continue;
    const exists = uniqueLots.find(
      (u) =>
        Math.abs(u.cx - m.cx) < 0.25 &&
        Math.abs(u.cy - m.cy) < 0.25 &&
        Math.abs(u.area - m.area) < 1.0,
    );
    if (!exists) {
      uniqueLots.push({ ...m, poly: { ...poly, points: validPts } });
    }
  }

  // 2. Asociar Manzanas
  const mzMetrics = mzPolylines.map((poly) => {
    const validPts = poly.points.filter((pt) => pt.x > 850000 && pt.y > 1640000);
    return {
      ...polygonMetrics(validPts),
      poly: { ...poly, points: validPts },
      name: "",
    };
  });

  const validMzTexts = mzTexts
    .map((t) => ({
      name: t.text
        .replace(/\\.*?;/g, "")
        .replace(/[{}]/g, "")
        .trim(),
      x: t.x,
      y: t.y,
    }))
    .filter((m) => /^M\s*\d+$/i.test(m.name));

  for (const text of validMzTexts) {
    const pt = { x: text.x, y: text.y };
    const mzPoly = mzMetrics.find((m) => pointInPolygon(pt, m.poly.points));
    if (mzPoly) {
      mzPoly.name = text.name;
    } else {
      let nearest = null;
      let minD = Infinity;
      for (const m of mzMetrics) {
        const d = Math.hypot(m.cx - pt.x, m.cy - pt.y);
        if (d < minD) {
          minD = d;
          nearest = m;
        }
      }
      if (nearest && minD < 40) nearest.name = text.name;
    }
  }

  const uniqueManzanasMap = new Map();
  for (const m of validMzTexts) {
    const norm = m.name.replace(/\s+/g, " ");
    if (!uniqueManzanasMap.has(norm)) {
      uniqueManzanasMap.set(norm, {
        name: norm,
        x: toSvgX(m.x),
        y: toSvgY(m.y),
      });
    }
  }
  const exportableManzanas = Array.from(uniqueManzanasMap.values()).sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });

  // 3. Emparejar lotes 1 a 1
  const cleanedLotTexts = [];
  for (const lt of lotTexts) {
    const clean = lt.text
      .replace(/\\.*?;/g, "")
      .replace(/[{}]/g, "")
      .trim();
    if (
      !clean ||
      clean.toLowerCase().includes("via") ||
      clean.toLowerCase().includes("villanueva")
    ) {
      continue;
    }
    const normalized = clean.replace(/\s+/g, "-");
    const num = parseInt(normalized, 10);
    cleanedLotTexts.push({
      raw: clean,
      label: normalized,
      num: isNaN(num) ? 999 : num,
      x: lt.x,
      y: lt.y,
    });
  }

  const matchedLots = [];
  for (const lt of cleanedLotTexts) {
    const pt = { x: lt.x, y: lt.y };
    let polyMatch = uniqueLots.find((l) => pointInPolygon(pt, l.poly.points));

    if (!polyMatch) {
      let nearest = null;
      let minD = Infinity;
      for (const l of uniqueLots) {
        if (l.assigned) continue;
        const d = Math.hypot(l.cx - pt.x, l.cy - pt.y);
        if (d < minD) {
          minD = d;
          nearest = l;
        }
      }
      if (nearest && minD < 25) {
        polyMatch = nearest;
      }
    }

    if (polyMatch) {
      let manzanaName = "";
      const containingMz = mzMetrics.find((m) =>
        pointInPolygon({ x: polyMatch.cx, y: polyMatch.cy }, m.poly.points),
      );
      if (containingMz && containingMz.name) {
        manzanaName = containingMz.name;
      } else {
        let nearestMz = null;
        let minMzDist = Infinity;
        for (const m of mzMetrics) {
          if (!m.name) continue;
          const d = Math.hypot(m.cx - polyMatch.cx, m.cy - polyMatch.cy);
          if (d < minMzDist) {
            minMzDist = d;
            nearestMz = m;
          }
        }
        if (nearestMz && minMzDist < 60) {
          manzanaName = nearestMz.name;
        }
      }

      const padNum = String(lt.num).padStart(2, "0");
      const id =
        lt.label.includes("-") || /[a-zA-Z]/.test(lt.label) ? `L-${lt.label}` : `L-${padNum}`;

      matchedLots.push({
        id,
        lotNumber: lt.num,
        label: lt.label,
        manzana: manzanaName || "M 1",
        areaM2: Math.round(polyMatch.area * 100) / 100,
        cadCx: polyMatch.cx,
        cadCy: polyMatch.cy,
        svgCx: toSvgX(polyMatch.cx),
        svgCy: toSvgY(polyMatch.cy),
        pathD: pointsToPath(polyMatch.poly.points, true),
      });
      polyMatch.assigned = true;
    }
  }

  matchedLots.sort((a, b) => {
    if (a.lotNumber !== b.lotNumber) return a.lotNumber - b.lotNumber;
    return a.label.localeCompare(b.label);
  });
  console.log(`Lotes finales procesados: ${matchedLots.length} de 338 esperados`);

  // 4. Preparar capas geométricas con correcta separación de abiertos y cerrados
  const filterValidPoints = (polys) =>
    polys
      .map((p) => ({
        closed: Boolean(p.closed),
        layer: p.layer,
        points: p.points.filter((pt) => pt.x > 850000 && pt.y > 1640000),
      }))
      .filter((p) => p.points.length >= 2);

  const linderoPaths = filterValidPoints(linderoPolylines).map((p) => pointsToPath(p.points, true));

  // Separar calzadas cerradas (superficie de rodamiento) de calzadas abiertas (bordillos/ejes)
  const validCalzadas = filterValidPoints(calzadaPolylines);
  const calzadasFilled = validCalzadas
    .filter((p) => p.closed)
    .map((p) => pointsToPath(p.points, true));
  const calzadasStroked = validCalzadas
    .filter((p) => !p.closed)
    .map((p) => pointsToPath(p.points, false));

  // La vía externa (Santa Rosa - Villanueva) queda fuera del lindero y se dibujaba como
  // dos líneas sueltas fuera del plano: se separa en externalRoads y no se pinta.
  const linderoRings = filterValidPoints(linderoPolylines).map((p) => p.points);
  const isInsideLindero = (pt) => linderoRings.some((ring) => pointInPolygon(pt, ring));
  const validVias = filterValidPoints(viaPolylines);
  const isInternalVia = (p) => p.points.filter(isInsideLindero).length / p.points.length >= 0.5;
  const viaPaths = validVias.filter(isInternalVia).map((p) => pointsToPath(p.points, false));
  const externalRoadPaths = validVias
    .filter((p) => !isInternalVia(p))
    .map((p) => pointsToPath(p.points, false));
  const senderoPaths = filterValidPoints(senderoPolylines).map((p) =>
    pointsToPath(p.points, false),
  );

  // Cuerpos de agua: 2 lagos + río meándrico + canales
  // Algunas polilíneas CAD unen dos lagos con un salto largo: se separan en anillos independientes
  const waterPaths = filterValidPoints(waterPolylines).map((p) => {
    const rings = [[]];
    p.points.forEach((pt, i) => {
      rings[rings.length - 1].push(pt);
      const next = p.points[i + 1];
      if (next && Math.hypot(toSvgX(pt.x) - toSvgX(next.x), toSvgY(pt.y) - toSvgY(next.y)) > 300) {
        rings.push([]);
      }
    });
    return rings
      .filter((r) => r.length > 2)
      .map((r) => pointsToPath(r, true))
      .join(" ");
  });

  // Áreas verdes (incluye los grandes parques centrales y corredores ecológicos)
  const greenPaths = filterValidPoints(greenPolylines).map((p) => pointsToPath(p.points, true));

  // Estructuras de amenidades (club house, portería, quioscos, columnas)
  const amenityPaths = filterValidPoints(amenityPolylines).map((p) => ({
    layer: p.layer,
    closed: p.closed,
    d: pointsToPath(p.points, p.closed),
  }));

  // Deduplicar rótulos de calles para evitar saturación visual
  const filteredStreetLabels = [];
  for (const st of streetTexts) {
    const isNearby = filteredStreetLabels.some(
      (s) => s.text === st.text && Math.hypot(s.x - st.x, s.y - st.y) < 60,
    );
    if (!isNearby) {
      filteredStreetLabels.push(st);
    }
  }

  const layersData = {
    dimensions: { width: SVG_WIDTH, height: SVG_HEIGHT },
    linderos: linderoPaths,
    greenAreas: greenPaths,
    roads: viaPaths,
    externalRoads: externalRoadPaths,
    calzadas: [...calzadasFilled, ...calzadasStroked],
    calzadasFilled,
    calzadasStroked,
    senderos: senderoPaths,
    waterAreas: waterPaths,
    amenities: amenityPaths,
    streetLabels: filteredStreetLabels,
    trees: treePoints,
    amenityPoints,
    manzanas: exportableManzanas,
  };

  fs.writeFileSync(OUTPUT_LAYERS, JSON.stringify(layersData, null, 2), "utf8");
  console.log(`Capas de fondo completas guardadas en: ${OUTPUT_LAYERS}`);

  // 5. Guardar dataset de 338 lotes
  const exportableLots = matchedLots.map((l) => ({
    id: l.id,
    lotNumber: l.lotNumber,
    label: l.label,
    manzana: l.manzana,
    areaM2: l.areaM2,
    centroid: [l.svgCx, l.svgCy],
    pathD: l.pathD,
  }));

  fs.writeFileSync(OUTPUT_LOTS, JSON.stringify(exportableLots, null, 2), "utf8");
  console.log(`Dataset de 338 lotes guardado en: ${OUTPUT_LOTS}`);

  // 6. Generar migración SQL
  const sqlStatements = [
    `-- Migración automática: Actualización de Masterplan Villa Paraíso a 338 lotes`,
    `-- Archivo CAD fuente: ACAD-PRY_VILLA PARAISO_U-001_30102026.dxf`,
    `-- Fecha: ${new Date().toISOString()}`,
    ``,
    `DO $$`,
    `DECLARE`,
    `  v_project_id uuid := '00000000-0000-0000-0000-000000000101';`,
    `BEGIN`,
    `  -- 1. Ocultar o archivar los 7 lotes retirados del nuevo plano (318, 319, 339, 340, 341, 342, 343)`,
    `  UPDATE public.lots`,
    `  SET status = 'hidden', updated_at = now()`,
    `  WHERE project_id = v_project_id`,
    `    AND external_id IN ('L-318', 'L-319', 'L-339', 'L-340', 'L-341', 'L-342', 'L-343');`,
    ``,
  ];

  for (const lot of exportableLots) {
    const escapedManzana = lot.manzana.replace(/'/g, "''");
    const jsonCentroid = JSON.stringify(lot.centroid);
    const jsonGeometry = JSON.stringify({ pathD: lot.pathD }).replace(/'/g, "''");

    sqlStatements.push(`  INSERT INTO public.lots (
    project_id,
    external_id,
    lot_number,
    manzana,
    status,
    area_m2,
    centroid,
    geometry,
    updated_at
  ) VALUES (
    v_project_id,
    '${lot.id}',
    ${lot.lotNumber},
    '${escapedManzana}',
    'available',
    ${lot.areaM2},
    '${jsonCentroid}'::jsonb,
    '${jsonGeometry}'::jsonb,
    now()
  )
  ON CONFLICT (project_id, external_id) DO UPDATE SET
    lot_number = EXCLUDED.lot_number,
    manzana = EXCLUDED.manzana,
    area_m2 = EXCLUDED.area_m2,
    centroid = EXCLUDED.centroid,
    geometry = EXCLUDED.geometry,
    updated_at = now();
`);
  }

  sqlStatements.push(`END $$;`);

  fs.writeFileSync(OUTPUT_SQL, sqlStatements.join("\n"), "utf8");
  console.log(`Migración SQL generada en: ${OUTPUT_SQL}`);
}

extract().catch((err) => {
  console.error("Error durante la extracción:", err);
  process.exit(1);
});
