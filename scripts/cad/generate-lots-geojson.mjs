import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import proj4 from "proj4";

// Setup EPSG:3116 (MAGNA-SIRGAS / Colombia Bogotá zone)
proj4.defs(
  "EPSG:3116",
  "+proj=tmerc +lat_0=4.596200417 +lon_0=-74.07750791 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.resolve(__dirname, "../..");
const cadRefPath = path.resolve(baseDir, "src/data/villa-paraiso/cad-reference.json");
const lotsPath = path.resolve(baseDir, "src/data/villa-paraiso/lots.json");
const layersPath = path.resolve(baseDir, "src/data/villa-paraiso/layers.json");
const cuadroAreasPath = path.resolve(baseDir, "cad/tablas/villa-paraiso_cuadro-areas.json");
const outputPath = path.resolve(baseDir, "src/data/villa-paraiso/generated/geojson.json");

const cadRef = JSON.parse(fs.readFileSync(cadRefPath, "utf8"));
const lots = JSON.parse(fs.readFileSync(lotsPath, "utf8"));
const layers = JSON.parse(fs.readFileSync(layersPath, "utf8"));
const cuadroAreas = fs.existsSync(cuadroAreasPath)
  ? JSON.parse(fs.readFileSync(cuadroAreasPath, "utf8"))
  : [];

const t = cadRef.transform;
const det = t.a * t.e - t.b * t.d;

function round6(val) {
  return Math.round(val * 1e6) / 1e6;
}

function svgToGps(x, y) {
  const dx = x - t.c;
  const dy = y - t.f;
  const cadX = (t.e * dx - t.b * dy) / det;
  const cadY = (-t.d * dx + t.a * dy) / det;
  const [lon, lat] = proj4("EPSG:3116", "EPSG:4326", [cadX, cadY]);
  return [round6(lon), round6(lat)];
}

function parseSvgPath(d) {
  const points = [];
  const re = /([ML])\s*([\d.-]+)\s+([\d.-]+)/gi;
  let match;
  while ((match = re.exec(d)) !== null) {
    points.push({ x: parseFloat(match[2]), y: parseFloat(match[3]) });
  }
  return points;
}

// Map cuadro_areas by lot number
const cuadroMap = new Map();
for (const item of cuadroAreas) {
  const num = parseInt(item.lot, 10);
  if (!isNaN(num)) {
    cuadroMap.set(num, item);
  }
}

const features = [];

// 1. Water areas (lakes)
let waterFeatureIndex = 0;
layers.waterAreas.forEach((w) => {
  // Soporte para caminos multi-polígono (ej. varios lagos separados por 'M')
  const commands = w.split(/(?=[M])/gi);
  for (const cmd of commands) {
    const pts = parseSvgPath(cmd);
    if (pts.length < 3) continue;
    const coords = pts.map((p) => svgToGps(p.x, p.y));
    // Ensure closed ring
    if (
      coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1]
    ) {
      coords.push(coords[0]);
    }
    waterFeatureIndex++;
    features.push({
      type: "Feature",
      id: `water-${waterFeatureIndex}`,
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
      properties: {
        kind: "water",
        name: waterFeatureIndex === 1 ? "Lago Principal" : `Lago ${waterFeatureIndex}`,
      },
    });
  }
});

// 2. Calzadas (roads/streets)
layers.calzadas.forEach((c, index) => {
  const pts = parseSvgPath(c);
  if (pts.length < 3) return;
  const coords = pts.map((p) => svgToGps(p.x, p.y));
  if (
    coords[0][0] !== coords[coords.length - 1][0] ||
    coords[0][1] !== coords[coords.length - 1][1]
  ) {
    coords.push(coords[0]);
  }
  features.push({
    type: "Feature",
    id: `road-${index + 1}`,
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
    properties: {
      kind: "road",
    },
  });
});

// 3. Lots
let convertedLots = 0;
for (const lot of lots) {
  if (!lot.pathD) continue;
  const pts = parseSvgPath(lot.pathD);
  if (pts.length < 3) continue;

  const coords = pts.map((p) => svgToGps(p.x, p.y));
  if (
    coords[0][0] !== coords[coords.length - 1][0] ||
    coords[0][1] !== coords[coords.length - 1][1]
  ) {
    coords.push(coords[0]);
  }

  const info = cuadroMap.get(lot.lotNumber);
  const centroidGps = lot.centroid ? svgToGps(lot.centroid[0], lot.centroid[1]) : coords[0];

  let status = "Disponible";
  if (info?.estado) {
    const raw = String(info.estado).toUpperCase();
    if (raw.includes("VEND")) status = "Vendido";
    else if (raw.includes("RES")) status = "Reservado";
    else if (raw.includes("CONF")) status = "Por confirmar";
    else status = "Disponible";
  }

  features.push({
    type: "Feature",
    id: lot.id,
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
    properties: {
      kind: "lot",
      id: lot.id,
      lotNumber: lot.lotNumber,
      label: lot.label || String(lot.lotNumber),
      manzana: lot.manzana || (info?.manzana ? `M ${info.manzana}` : undefined),
      areaM2: lot.areaM2 || info?.area || 0,
      ubicacion: info?.ubicacion || undefined,
      price: info?.venta || 0,
      pricePreVenta: info?.preVenta || undefined,
      cuotaInicial: info?.cuotaIni20 || undefined,
      cuotaMensual: info?.cuotas48 || undefined,
      status,
      centroid: centroidGps,
    },
  });
  convertedLots++;
}

const geoJson = {
  type: "FeatureCollection",
  properties: {
    projectSlug: "villa-paraiso",
    crs: "EPSG:4326",
    totalFeatures: features.length,
    lotsCount: convertedLots,
    waterCount: layers.waterAreas.length,
    roadsCount: layers.calzadas.length,
    generatedAt: new Date().toISOString(),
  },
  features,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(geoJson), "utf8");

const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
console.log(`Generated GeoJSON at ${outputPath}`);
console.log(
  `Total features: ${features.length} (Lots: ${convertedLots}, Roads: ${layers.calzadas.length}, Water: ${layers.waterAreas.length})`,
);
console.log(`File size: ${sizeKb} KB`);
