#!/usr/bin/env node
/**
 * Projects the 338 lots of Villa Paraíso onto the 360° equirectangular panorama
 * using calibrated camera parameters (yawOffsetDeg, heightAboveGroundM, tilt,
 * and drone horizontal refinement) and outputs:
 *   src/data/generated/villa-paraiso-panorama-lots.json
 *
 * Uses the unified projection & adaptive densification logic from:
 *   src/features/panorama-360/project-lots.ts
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import proj4 from "proj4";

proj4.defs(
  "EPSG:3116",
  "+proj=tmerc +lat_0=4.596200417 +lon_0=-74.07750791 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// If executed by plain `node` without TypeScript loader, delegate transparently to `npx tsx`
if (!process.env.AUTEM_TSX_ACTIVE && !process.execArgv.some((a) => a.includes("tsx"))) {
  const result = spawnSync("npx", ["tsx", __filename, ...process.argv.slice(2)], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, AUTEM_TSX_ACTIVE: "1" },
  });
  process.exit(result.status ?? 0);
}

const {
  projectMasterplanLots,
  projectMasterplanLayers,
  projectGpsPointToPanoramaRad,
  radToDegPair,
  roundRad,
} = await import("../src/features/panorama-360/project-lots.ts");

const lots = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/villa-paraiso-lots.json"), "utf8"),
);
const rawLayers = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/villa-paraiso-layers.json"), "utf8"),
);
const cadRef = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/villa-paraiso-cad-reference.json"), "utf8"),
);
const outPath = path.join(ROOT, "src/data/generated/villa-paraiso-panorama-lots.json");

const t = cadRef.transform;
const det = t.a * t.e - t.b * t.d;

function svgToGps(x, y) {
  const dx = x - t.c;
  const dy = y - t.f;
  const cadX = (t.e * dx - t.b * dy) / det;
  const cadY = (-t.d * dx + t.a * dy) / det;
  const [lng, lat] = proj4("EPSG:3116", "EPSG:4326", [cadX, cadY]);
  return [Math.round(lng * 1e6) / 1e6, Math.round(lat * 1e6) / 1e6];
}

const config = {
  camera: {
    lat: 10.437897,
    lng: -75.356053,
    heightAboveGroundM: 204.1,
    offsetEastM: -9.2,
    offsetNorthM: 37.0,
  },
  yawOffsetDeg: 176.3,
  tilt: {
    pitchDeg: -5.25,
    rollDeg: 0.08,
  },
  panoDataDesktop: {
    fullWidth: 8192,
    fullHeight: 4096,
    croppedWidth: 8192,
    croppedHeight: 2790,
    croppedX: 0,
    croppedY: 1294,
  },
  panoDataMobile: {
    fullWidth: 4096,
    fullHeight: 2048,
    croppedWidth: 4096,
    croppedHeight: 1395,
    croppedX: 0,
    croppedY: 647,
  },
  limits: {
    minPitchDeg: -89.5,
    maxPitchDeg: 33.1,
    defaultYawDeg: -16,
    defaultPitchDeg: -45,
    defaultZoomLvl: 26,
  },
};

const DEG_TO_RAD = Math.PI / 180;

const controlPointsRaw = [
  {
    id: "CP-1",
    label: "Isla Lago 2 - Punta SE",
    svg: [1075.6, 1598.6],
    deg: [28.5, -42.5],
    weight: 2.5,
  },
  {
    id: "CP-2",
    label: "Isla Lago 2 - Punta NO",
    svg: [1149.9, 1739.4],
    deg: [16.5, -37.8],
    weight: 2.5,
  },
  {
    id: "CP-3",
    label: "Isla Lago 2 - Centro",
    svg: [1111.6, 1668.5],
    deg: [22.8, -40.2],
    weight: 2.5,
  },
  {
    id: "CP-4",
    label: "Lago 2 - Esquina Oeste",
    svg: [839.8, 1547.0],
    deg: [43.0, -39.5],
    weight: 2.0,
  },
  {
    id: "CP-5",
    label: "Lago 2 - Vértice Sur",
    svg: [1128.8, 1880.4],
    deg: [16.0, -33.0],
    weight: 2.0,
  },
  {
    id: "CP-6",
    label: "Lago 2 - Dique Este",
    svg: [1450.3, 1576.0],
    deg: [-5.5, -45.5],
    weight: 2.2,
  },
  {
    id: "CP-7",
    label: "Lago 2 - Bahía Norte",
    svg: [1328.9, 1431.6],
    deg: [2.0, -52.5],
    weight: 2.0,
  },
  {
    id: "CP-8",
    label: "Lago 3 - Canal Norte",
    svg: [1414.6, 1254.5],
    deg: [-3.0, -61.5],
    weight: 2.0,
  },
  {
    id: "CP-9",
    label: "Lago 3 - Punta Este",
    svg: [1695.9, 1479.8],
    deg: [-27.5, -46.5],
    weight: 2.2,
  },
  {
    id: "CP-10",
    label: "L-310 - Límite SE",
    svg: [1795.0, 1345.0],
    deg: [-43.0, -47.5],
    weight: 2.5,
  },
  {
    id: "CP-11",
    label: "L-250 - Límite SE",
    svg: [2065.0, 960.0],
    deg: [-76.0, -41.5],
    weight: 2.5,
  },
  {
    id: "CP-12",
    label: "Bifurcación Vía L-269/L-270",
    svg: [1830.0, 1025.0],
    deg: [-67.5, -52.0],
    weight: 2.5,
  },
  {
    id: "CP-13",
    label: "Lago 4 - Extremo Norte",
    svg: [2273.7, 483.3],
    deg: [-112.0, -27.5],
    weight: 2.2,
  },
  {
    id: "CP-14",
    label: "L-01 - Esquina Sur",
    svg: [1082.9, 2094.4],
    deg: [12.0, -28.0],
    weight: 1.5,
  },
];

const controlPoints = controlPointsRaw.map((cp) => ({
  id: cp.id,
  label: cp.label,
  worldGps: svgToGps(cp.svg[0], cp.svg[1]),
  worldSvg: cp.svg,
  panoDeg: cp.deg,
  panoRad: [roundRad(cp.deg[0] * DEG_TO_RAD), roundRad(cp.deg[1] * DEG_TO_RAD)],
  weight: cp.weight,
}));

// Project lots using unified logic (same densification as admin and runtime visitor)
const projectedLots = projectMasterplanLots(lots, config);
const layers = projectMasterplanLayers(rawLayers, config);

let totalVertices = 0;
for (const l of projectedLots) {
  totalVertices += l.polygonRad.length;
}

const payload = {
  projectSlug: "villa-paraiso",
  version: 1,
  generatedAt: new Date().toISOString(),
  config,
  controlPoints,
  lots: projectedLots,
  layers,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload), "utf8");

const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(
  `Generated ${projectedLots.length} projected lots (${totalVertices} total vertices) -> ${outPath} (${sizeKb} kB)`,
);
