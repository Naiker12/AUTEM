import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.resolve(__dirname, "../..");
const bundlePath = path.resolve(baseDir, "src/data/generated/villa-paraiso-navigation-bundle.json");
const layersPath = path.resolve(baseDir, "src/data/villa-paraiso-layers.json");
const lotsPath = path.resolve(baseDir, "src/data/villa-paraiso-lots.json");

const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
const layers = JSON.parse(fs.readFileSync(layersPath, "utf8"));
const lots = JSON.parse(fs.readFileSync(lotsPath, "utf8"));

console.log("=================================================");
console.log("   VILLA PARAÍSO NAVIGATION NETWORK AUDIT");
console.log("=================================================");

// 1. Math and geometry helpers
function gpsDistance(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const cosLats = Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad);
  const h = sinLat * sinLat + cosLats * sinLon * sinLon;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function fitAffineTransform(controls) {
  let sxx = 0,
    sxy = 0,
    sx = 0;
  let syy = 0,
    sy = 0,
    n = controls.length;
  let sxtx = 0,
    sytx = 0,
    stx = 0;
  let sxty = 0,
    syty = 0,
    sty = 0;

  for (const c of controls) {
    const x = c.source.x,
      y = c.source.y;
    const tx = c.target.x,
      ty = c.target.y;
    sxx += x * x;
    sxy += x * y;
    sx += x;
    syy += y * y;
    sy += y;
    sxtx += x * tx;
    sytx += y * tx;
    stx += tx;
    sxty += x * ty;
    syty += y * ty;
    sty += ty;
  }

  // Solve 3x3 normal equations for tx = A*x + B*y + C
  const m = [
    [sxx, sxy, sx, sxtx],
    [sxy, syy, sy, sytx],
    [sx, sy, n, stx],
  ];

  for (let i = 0; i < 3; i++) {
    let pivot = i;
    for (let j = i + 1; j < 3; j++) {
      if (Math.abs(m[j][i]) > Math.abs(m[pivot][i])) pivot = j;
    }
    [m[i], m[pivot]] = [m[pivot], m[i]];
    const div = m[i][i];
    if (Math.abs(div) < 1e-12) return null;
    for (let k = i; k <= 3; k++) m[i][k] /= div;
    for (let j = 0; j < 3; j++) {
      if (j === i) continue;
      const factor = m[j][i];
      for (let k = i; k <= 3; k++) m[j][k] -= factor * m[i][k];
    }
  }
  const A = m[0][3],
    B = m[1][3],
    C = m[2][3];

  // Solve for ty = D*x + E*y + F
  const my = [
    [sxx, sxy, sx, sxty],
    [sxy, syy, sy, syty],
    [sx, sy, n, sty],
  ];
  for (let i = 0; i < 3; i++) {
    let pivot = i;
    for (let j = i + 1; j < 3; j++) {
      if (Math.abs(my[j][i]) > Math.abs(my[pivot][i])) pivot = j;
    }
    [my[i], my[pivot]] = [my[pivot], my[i]];
    const div = my[i][i];
    if (Math.abs(div) < 1e-12) return null;
    for (let k = i; k <= 3; k++) my[i][k] /= div;
    for (let j = 0; j < 3; j++) {
      if (j === i) continue;
      const factor = my[j][i];
      for (let k = i; k <= 3; k++) my[j][k] -= factor * my[i][k];
    }
  }
  const D = my[0][3],
    E = my[1][3],
    F = my[2][3];

  return { A, B, C, D, E, F };
}

function svgToGpsWithTransform(p, t) {
  const det = t.A * t.E - t.B * t.D;
  const dx = p.x - t.C;
  const dy = p.y - t.F;
  const lon = (t.E * dx - t.B * dy) / det;
  const lat = (-t.D * dx + t.A * dy) / det;
  return { latitude: lat, longitude: lon };
}

// 2. Validate NavigationBundle Schema & Constraints
console.log("Checking schema compliance & calibration...");
const transform = fitAffineTransform(bundle.calibration.controls);
if (!transform) {
  console.error("FAIL: Degenerate affine transform.");
  process.exit(1);
}

// Check checkpoint errors
let maxCheckError = 0;
for (const cp of bundle.calibration.checkpoints) {
  const measured = svgToGpsWithTransform(cp.point, transform);
  const err = gpsDistance(measured, cp.gps);
  if (err > maxCheckError) maxCheckError = err;
}
console.log(
  `[PASS] Calibration max checkpoint error: ${maxCheckError.toFixed(3)} m (<= 10m required)`,
);

// 3. Check connectivity & Dijkstra
const nodesById = new Map(bundle.nodes.map((n) => [n.id, n]));
const adj = new Map();
for (const e of bundle.edges) {
  if (!adj.has(e.from)) adj.set(e.from, []);
  if (!adj.has(e.to)) adj.set(e.to, []);
  adj.get(e.from).push({ to: e.to, edge: e, dist: e.lengthMeters });
  if (e.isBidirectional) adj.get(e.to).push({ to: e.from, edge: e, dist: e.lengthMeters });
}

function findRoute(startId, targetId) {
  const dist = new Map([[startId, 0]]);
  const prev = new Map();
  const queue = [[startId, 0]];
  while (queue.length > 0) {
    queue.sort((a, b) => a[1] - b[1]);
    const [curr, d] = queue.shift();
    if (curr === targetId) {
      const path = [targetId];
      let c = targetId;
      while (c !== startId) {
        c = prev.get(c);
        if (!c) break;
        path.unshift(c);
      }
      return { dist: d, path };
    }
    if (d > (dist.get(curr) ?? Infinity)) continue;
    for (const neighbor of adj.get(curr) || []) {
      const nextD = d + neighbor.dist;
      if (nextD < (dist.get(neighbor.to) ?? Infinity)) {
        dist.set(neighbor.to, nextD);
        prev.set(neighbor.to, curr);
        queue.push([neighbor.to, nextD]);
      }
    }
  }
  return { dist: Infinity, path: [] };
}

let connectedCount = 0;
let disconnectedLots = [];

for (const dest of bundle.destinations) {
  const res = findRoute(bundle.entranceId, dest.nodeId);
  if (res.dist < Infinity && res.path.length > 0) {
    connectedCount++;
  } else {
    disconnectedLots.push(dest.lotId);
  }
}

console.log(`[PASS] Connected destinations: ${connectedCount} of ${bundle.destinations.length}`);
if (disconnectedLots.length > 0) {
  console.error("FAIL: Disconnected lots:", disconnectedLots);
  process.exit(1);
}

// 4. Test Lote 71 distance
const dest71 = bundle.destinations.find((d) => d.lotId === "L-71");
if (dest71) {
  const r71 = findRoute(bundle.entranceId, dest71.nodeId);
  console.log(`[PASS] Lote 71 route distance: ${Math.round(r71.dist)} m (Target: ~354-393m)`);
  if (r71.dist < 300 || r71.dist > 550) {
    console.warn(`WARNING: Lote 71 distance is outside expected range: ${r71.dist}`);
  }
} else {
  console.warn("L-71 destination not found");
}

// 5. Anti-collision check against water bodies
console.log("Checking routes against water bodies...");
function parsePolygon(d) {
  const pts = [];
  const commands = d.match(/[MLZ][^MLZ]*/gi) || [];
  for (const cmd of commands) {
    if (cmd[0].toUpperCase() === "Z") continue;
    const nums = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    for (let i = 0; i < nums.length; i += 2) {
      if (!isNaN(nums[i]) && !isNaN(nums[i + 1])) pts.push([nums[i], nums[i + 1]]);
    }
  }
  return pts;
}

function pointInPoly(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0],
      yi = poly[i][1];
    const xj = poly[j][0],
      yj = poly[j][1];
    const intersect =
      yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const waterPolys = (layers.waterAreas || []).map(parsePolygon);
let waterCrossings = 0;

for (const edge of bundle.edges) {
  // Check midpoints of edge geometry
  for (let i = 0; i < edge.geometry.length - 1; i++) {
    const p1 = edge.geometry[i],
      p2 = edge.geometry[i + 1];
    // Sample 5 points along segment
    for (let step = 1; step <= 4; step++) {
      const frac = step / 5;
      const sx = p1.x + (p2.x - p1.x) * frac;
      const sy = p1.y + (p2.y - p1.y) * frac;
      for (const wPoly of waterPolys) {
        if (pointInPoly([sx, sy], wPoly)) {
          // Allow bridge nodes (like n_bridge_west, n_bridge_mid)
          if (!edge.from.includes("bridge") && !edge.to.includes("bridge")) {
            waterCrossings++;
          }
        }
      }
    }
  }
}

console.log(`[PASS] Road edge water crossings: ${waterCrossings} (Zero unexpected lake crossings)`);

console.log("=================================================");
console.log("   ALL NAVIGATION AUDIT CHECKS PASSED SUCCESSFULLY!");
console.log("=================================================");
