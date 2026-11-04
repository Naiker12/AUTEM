#!/usr/bin/env node
/**
 * Projects the 338 lots of Villa Paraíso onto the 360° equirectangular panorama
 * using calibrated camera parameters (yawOffsetDeg, heightAboveGroundM, tilt,
 * and drone horizontal refinement) and outputs:
 *   src/data/generated/villa-paraiso-panorama-lots.json
 *
 * Uses adaptive angular densification: edges are only subdivided when their
 * spherical angle subtended from the drone exceeds ~3.5° (0.06 rad), keeping
 * distant lots lightweight (4–6 vertices) while curving edges smoothly near nadir.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import proj4 from "proj4";

proj4.defs(
  "EPSG:3116",
  "+proj=tmerc +lat_0=4.596200417 +lon_0=-74.07750791 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const cadRef = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/villa-paraiso-cad-reference.json"), "utf8"),
);
const lots = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/villa-paraiso-lots.json"), "utf8"),
);
const rawLayers = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/villa-paraiso-layers.json"), "utf8"),
);
const outPath = path.join(ROOT, "src/data/generated/villa-paraiso-panorama-lots.json");

const t = cadRef.transform;
const det = t.a * t.e - t.b * t.d;
const DEG_TO_RAD = Math.PI / 180;

function roundRad(v) {
  return Math.round(v * 1e4) / 1e4;
}

function round6(v) {
  return Math.round(v * 1e6) / 1e6;
}

function svgToCad(x, y) {
  const dx = x - t.c;
  const dy = y - t.f;
  return [(t.e * dx - t.b * dy) / det, (-t.d * dx + t.a * dy) / det];
}

function svgToGps(x, y) {
  const [e, n] = svgToCad(x, y);
  const [lng, lat] = proj4("EPSG:3116", "EPSG:4326", [e, n]);
  return [round6(lng), round6(lat)];
}

function parseSvgPath(d) {
  const pts = [];
  const re = /([ML])\s*([\d.-]+)\s+([\d.-]+)/gi;
  let m;
  while ((m = re.exec(d)) !== null) {
    pts.push([parseFloat(m[2]), parseFloat(m[3])]);
  }
  return pts;
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
    defaultZoomLvl: 22,
  },
};

const [camBaseE, camBaseN] = proj4("EPSG:4326", "EPSG:3116", [
  config.camera.lng,
  config.camera.lat,
]);

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function projectCadToRad(eastM, northM) {
  const camE = camBaseE + (config.camera.offsetEastM || 0);
  const camN = camBaseN + (config.camera.offsetNorthM || 0);
  let dE = eastM - camE;
  let dN = northM - camN;
  let dU = -config.camera.heightAboveGroundM;

  // SW Entrance & Lago Principal shoreline terrain/radial elongation correction
  const ux = -0.661;
  const uy = -0.751;
  const tx = -0.751;
  const ty = 0.661;
  const s = dE * ux + dN * uy;
  const t = dE * tx + dN * ty;

  if (s > 215 && t > -260 && t < 185) {
    const wSE = smoothstep(-255, -195, t);
    const wNW = 1 - 0.42 * smoothstep(-15, 75, t) - 0.58 * smoothstep(75, 175, t);
    const wT = wSE * Math.max(0, wNW);

    const u = Math.max(0, (s - 215) / (365 - 215));
    const stretchS = (24 * Math.pow(u, 1.35) + 46 * Math.pow(u, 2.5)) * wT;
    const riseU = (12 * Math.pow(u, 1.35) + 25 * Math.pow(u, 2.35)) * wT;
    const seBoost = smoothstep(-70, -195, t) * Math.pow(u, 1.15) * wSE;
    const stretchT = -18 * seBoost;

    dE += ux * stretchS + tx * stretchT;
    dN += uy * stretchS + ty * stretchT;
    dU += riseU;
  }

  const az0 = config.yawOffsetDeg * DEG_TO_RAD;
  let fwd = dE * Math.sin(az0) + dN * Math.cos(az0);
  let right = dE * Math.cos(az0) - dN * Math.sin(az0);
  let up = dU;

  const pitchRad = (config.tilt.pitchDeg || 0) * DEG_TO_RAD;
  const rollRad = (config.tilt.rollDeg || 0) * DEG_TO_RAD;

  if (pitchRad !== 0) {
    const f1 = fwd * Math.cos(pitchRad) - up * Math.sin(pitchRad);
    const u1 = fwd * Math.sin(pitchRad) + up * Math.cos(pitchRad);
    fwd = f1;
    up = u1;
  }
  if (rollRad !== 0) {
    const r1 = right * Math.cos(rollRad) - up * Math.sin(rollRad);
    const u1 = right * Math.sin(rollRad) + up * Math.cos(rollRad);
    right = r1;
    up = u1;
  }

  const yaw = Math.atan2(right, fwd);
  const horiz = Math.hypot(right, fwd);
  const pitch = Math.atan2(up, horiz);
  return [roundRad(yaw), roundRad(pitch)];
}

/**
 * Adaptive densification: only subdivides edges based on their 3D distance to the
 * camera so distant lots stay at 4-6 vertices and nadir lots get smooth curves.
 */
function densifyCadRingAdaptive(ringEN) {
  if (ringEN.length < 3) return ringEN;
  const camE = camBaseE + (config.camera.offsetEastM || 0);
  const camN = camBaseN + (config.camera.offsetNorthM || 0);
  const H = config.camera.heightAboveGroundM;

  const pts =
    ringEN.length > 3 &&
    Math.hypot(
      ringEN[0][0] - ringEN[ringEN.length - 1][0],
      ringEN[0][1] - ringEN[ringEN.length - 1][1],
    ) < 1e-3
      ? ringEN.slice(0, -1)
      : ringEN;

  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    out.push(p1);

    const edgeLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const midE = (p1[0] + p2[0]) * 0.5 - camE;
    const midN = (p1[1] + p2[1]) * 0.5 - camN;
    const dist3D = Math.hypot(midE, midN, H);

    // Subdivide only if the edge subtends > ~0.085 rad (~5 deg) on the sphere
    const maxStepM = Math.max(8, dist3D * 0.085);
    const steps = Math.min(4, Math.max(1, Math.ceil(edgeLen / maxStepM)));
    for (let s = 1; s < steps; s++) {
      const f = s / steps;
      out.push([p1[0] + (p2[0] - p1[0]) * f, p1[1] + (p2[1] - p1[1]) * f]);
    }
  }
  return out;
}

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

const projectedLots = [];
let totalVertices = 0;

for (const lot of lots) {
  if (!lot.pathD) continue;
  const svgPts = parseSvgPath(lot.pathD);
  if (svgPts.length < 3) continue;

  const cadPts = svgPts.map(([x, y]) => svgToCad(x, y));
  const verticesRad = cadPts.map(([e, n]) => projectCadToRad(e, n));
  const denseCad = densifyCadRingAdaptive(cadPts);
  const polygonRad = denseCad.map(([e, n]) => projectCadToRad(e, n));
  totalVertices += polygonRad.length;

  const [cE, cN] = lot.centroid ? svgToCad(lot.centroid[0], lot.centroid[1]) : cadPts[0];
  const labelRad = projectCadToRad(cE, cN);

  projectedLots.push({
    id: lot.id,
    lotNumber: lot.lotNumber,
    label: lot.id === "L-45-A" ? "45-A" : lot.label || String(lot.lotNumber),
    manzana: lot.manzana,
    polygonRad,
    verticesRad,
    labelRad,
  });
}

// Project water and road context polygons (matching Recorrido de Terreno / ProjectLocationMap)
const waterPolygonsRad = [];
for (const w of rawLayers.waterAreas || []) {
  const subPaths = String(w).split(/(?=[M])/gi);
  for (const sp of subPaths) {
    const svgPts = parseSvgPath(sp);
    if (svgPts.length < 3) continue;
    const cadPts = svgPts.map(([x, y]) => svgToCad(x, y));
    waterPolygonsRad.push(cadPts.map(([e, n]) => projectCadToRad(e, n)));
  }
}

const roadPolygonsRad = [];
for (const r of rawLayers.calzadas || []) {
  const svgPts = parseSvgPath(r);
  if (svgPts.length < 3) continue;
  const cadPts = svgPts.map(([x, y]) => svgToCad(x, y));
  roadPolygonsRad.push(cadPts.map(([e, n]) => projectCadToRad(e, n)));
}

const payload = {
  projectSlug: "villa-paraiso",
  version: 1,
  generatedAt: new Date().toISOString(),
  config,
  controlPoints,
  lots: projectedLots,
  layers: {
    water: waterPolygonsRad,
    roads: roadPolygonsRad,
  },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload), "utf8");

const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(
  `Generated ${projectedLots.length} projected lots (${totalVertices} total vertices) -> ${outPath} (${sizeKb} kB)`,
);
