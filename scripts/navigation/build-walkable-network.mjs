import fs from "fs";
import path from "path";
import crypto from "crypto";
import proj4 from "proj4";

// Setup EPSG:3116 (MAGNA-SIRGAS / Colombia Bogotá zone)
proj4.defs(
  "EPSG:3116",
  "+proj=tmerc +lat_0=4.596200417 +lon_0=-74.07750791 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

const UNITS_PER_METER = 3.0054;

const baseDir = "D:/AUTEM";
const layersPath = path.resolve(baseDir, "src/data/villa-paraiso-layers.json");
const lotsPath = path.resolve(baseDir, "src/data/villa-paraiso-lots.json");
const cadPath = path.resolve(baseDir, "src/data/villa-paraiso-cad-reference.json");

const layers = JSON.parse(fs.readFileSync(layersPath, "utf8"));
const lots = JSON.parse(fs.readFileSync(lotsPath, "utf8"));
const cadRef = JSON.parse(fs.readFileSync(cadPath, "utf8"));

const t = cadRef.transform;

function cadToSvg(x, y) {
  return {
    x: t.a * x + t.b * y + t.c,
    y: t.d * x + t.e * y + t.f,
  };
}

function svgToCad(x, y) {
  const det = t.a * t.e - t.b * t.d;
  const dx = x - t.c;
  const dy = y - t.f;
  return {
    x: (t.e * dx - t.b * dy) / det,
    y: (-t.d * dx + t.a * dy) / det,
  };
}

function svgToGpsViaProj4(x, y) {
  const cadPt = svgToCad(x, y);
  const [lon, lat] = proj4("EPSG:3116", "EPSG:4326", [cadPt.x, cadPt.y]);
  return { latitude: lat, longitude: lon };
}

// 1. Base junctions across all road corridors
const JUNCTIONS = {
  entrance: [1014.7, 2148.5],
  acceso_main: [1070.0, 2135.0],
  acceso_split: [1085.0, 2080.0],

  // Calle 1 Sur y Este
  e_c1_1: [1145.0, 2050.0],
  e_c1_2: [1205.0, 2020.0],
  e_c1_317: [1270.0, 1990.0],
  e_c1_314: [1340.0, 1950.0],
  e_c1_311: [1415.0, 1890.0],
  e_c1_m10: [1460.0, 1850.0],
  e_c1_sports: [1520.0, 1780.0],
  e_c1_3: [1570.0, 1720.0],
  e_c1_4: [1630.0, 1640.0],
  e_c1_5: [1680.0, 1570.0],
  e_c1_6: [1740.0, 1480.0],
  e_c1_7: [1800.0, 1370.0],
  e_c1_8: [1880.0, 1230.0],
  e_c1_9: [1970.0, 1090.0],
  e_c1_10: [2040.0, 990.0],
  e_c1_11: [2120.0, 890.0],
  e_c1_12: [2190.0, 814.0],
  e_c1_13: [2270.0, 680.0],
  e_c1_14: [2336.0, 540.0],

  // Carrera 1 y 2 (Occidente: M1 a M7)
  w_c2_1: [1050.0, 1877.0],
  w_c2_2: [942.0, 1928.0],
  w_c1_1: [980.0, 1980.0],
  w_c1_2: [808.0, 1886.0],
  w_c1_3: [670.0, 1756.0],
  w_c1_4: [520.0, 1614.0],
  w_c1_5: [380.0, 1470.0],
  w_c1_6: [260.0, 1330.0],
  w_c2_3: [822.0, 1622.0],
  w_c2_4: [676.0, 1478.0],
  w_c2_5: [509.0, 1526.0],
  w_c2_6: [386.0, 1173.0],

  w_calle2_mid: [960.0, 1954.0],
  w_calle3_c1: [793.0, 1798.0],
  w_calle4_c1: [647.0, 1658.0],
  w_calle5_c1: [450.0, 1542.0],

  // Transversal 1 (Paso norte entre los lagos)
  nw_trans_1: [819.0, 1264.0],
  nw_trans_2: [701.0, 1171.0],
  nw_trans_3: [573.0, 1070.0],
  nw_m7_bank1: [880.0, 1320.0],
  nw_m7_bank2: [940.0, 1330.0],
  nw_m8_bank: [1007.0, 1290.0],

  // Carrera 3 (Eje Central entre lagos)
  c_c3_1: [1549.0, 1573.0],
  c_c3_2: [1396.0, 1456.0],
  c_c3_3: [1343.0, 1294.0],
  c_c3_4: [1216.0, 1222.0],
  c_c3_5: [1144.0, 1027.0],

  // Manzanas Centrales y Norte (Calles 3, 4, 5, 6, 7 y Carreras 4 a 10)
  c_c3_east: [1261.0, 1436.0],
  c_c4_east: [1480.0, 1265.0],
  n_c4_1: [1307.0, 1073.0],
  n_c4_2: [1363.0, 1122.0],
  n_c4_3: [1582.0, 928.0],
  n_c4_4: [1777.0, 828.0],
  n_c4_5: [1932.0, 844.0],
  n_c4_6: [2072.0, 851.0],

  n_c5_1: [1242.0, 898.0],
  n_c5_2: [1487.0, 786.0],
  n_c5_3: [1541.0, 650.0],
  n_c5_4: [1769.0, 592.0],
  n_c5_5: [1831.0, 412.0],
  n_c5_6: [1980.0, 255.0],
  n_c5_7: [2181.0, 220.0],

  n_c6_1: [1999.0, 536.0],
  n_c6_2: [2147.0, 420.0],
  n_c6_3: [2260.0, 440.0],

  n_c5_mid1: [1532.0, 1060.0],
  n_c6_mid1: [1698.0, 991.0],
  n_c7_mid1: [1856.0, 914.0],
  n_c8_mid1: [2039.0, 880.0],
  n_c9_mid1: [1992.0, 340.0],
  n_c10_mid1: [2222.0, 302.0],

  // Sector Norte Cruzando Arroyo (Manzanas 24, 26, 27)
  n_bridge_west: [780.0, 991.0],
  n_m24_1: [806.0, 1017.0],
  n_m24_2: [852.0, 955.0],
  n_m24_3: [861.0, 1032.0],
  n_m24_4: [899.0, 961.0],

  n_bridge_mid: [1062.0, 946.0],
  n_m26_1: [954.0, 781.0],
  n_m26_2: [1129.0, 750.0],
  n_m26_3: [1227.0, 763.0],
  n_m26_4: [1269.0, 751.0],
  n_m26_5: [1367.0, 364.0],
  n_m27_1: [1485.0, 212.0],
  n_m27_2: [1539.0, 175.0],
  n_m27_3: [1637.0, 175.0],
};

const BASE_EDGES = [
  // Acceso y Portería
  ["entrance", "acceso_main"],
  ["acceso_main", "acceso_split"],
  ["acceso_split", "e_c1_1"],
  ["acceso_split", "w_c1_1"],
  ["acceso_split", "w_c2_1"],

  // Calle 1 Sur y Este
  ["e_c1_1", "e_c1_2"],
  ["e_c1_2", "e_c1_317"],
  ["e_c1_317", "e_c1_314"],
  ["e_c1_314", "e_c1_311"],
  ["e_c1_311", "e_c1_m10"],
  ["e_c1_m10", "e_c1_sports"],
  ["e_c1_sports", "e_c1_3"],
  ["e_c1_3", "e_c1_4"],
  ["e_c1_4", "e_c1_5"],
  ["e_c1_5", "e_c1_6"],
  ["e_c1_6", "e_c1_7"],
  ["e_c1_7", "e_c1_8"],
  ["e_c1_8", "e_c1_9"],
  ["e_c1_9", "e_c1_10"],
  ["e_c1_10", "e_c1_11"],
  ["e_c1_11", "e_c1_12"],
  ["e_c1_12", "e_c1_13"],
  ["e_c1_13", "e_c1_14"],

  // Carrera 1 y 2
  ["w_c1_1", "w_calle2_mid"],
  ["w_c2_1", "w_calle2_mid"],
  ["w_calle2_mid", "w_c2_2"],
  ["w_c2_2", "w_c1_2"],
  ["w_c1_2", "w_calle3_c1"],
  ["w_calle3_c1", "w_c2_3"],
  ["w_c2_3", "w_c1_3"],
  ["w_c1_3", "w_calle4_c1"],
  ["w_calle4_c1", "w_c2_4"],
  ["w_c2_4", "w_c1_4"],
  ["w_c1_4", "w_calle5_c1"],
  ["w_calle5_c1", "w_c2_5"],
  ["w_c2_5", "w_c1_5"],
  ["w_c1_5", "w_c2_6"],
  ["w_c2_6", "w_c1_6"],

  // Transversal 1
  ["w_c2_4", "nw_trans_1"],
  ["nw_trans_1", "nw_trans_2"],
  ["nw_trans_2", "nw_trans_3"],
  ["nw_trans_1", "nw_m7_bank1"],
  ["nw_m7_bank1", "nw_m7_bank2"],
  ["nw_m7_bank2", "nw_m8_bank"],
  ["nw_m8_bank", "c_c3_4"],

  // Carrera 3 Central
  ["e_c1_sports", "c_c3_1"],
  ["c_c3_1", "c_c3_2"],
  ["c_c3_2", "c_c3_3"],
  ["c_c3_3", "c_c3_4"],
  ["c_c3_4", "c_c3_5"],

  // North Connections (Calles 3, 4, 5, 6)
  ["c_c3_2", "c_c3_east"],
  ["c_c3_east", "c_c4_east"],
  ["c_c4_east", "e_c1_5"],

  ["c_c3_4", "n_c4_1"],
  ["n_c4_1", "n_c4_2"],
  ["n_c4_2", "c_c4_east"],
  ["n_c4_1", "n_c4_3"],
  ["n_c4_3", "n_c4_4"],
  ["n_c4_4", "n_c4_5"],
  ["n_c4_5", "n_c4_6"],
  ["n_c4_6", "e_c1_11"],

  ["c_c3_5", "n_c5_1"],
  ["n_c5_1", "n_c5_2"],
  ["n_c5_2", "n_c5_3"],
  ["n_c5_3", "n_c5_4"],
  ["n_c5_4", "n_c5_5"],
  ["n_c5_5", "n_c5_6"],
  ["n_c5_6", "n_c5_7"],

  ["n_c4_3", "n_c5_mid1"],
  ["n_c5_mid1", "n_c5_2"],
  ["n_c4_4", "n_c6_mid1"],
  ["n_c6_mid1", "n_c5_3"],
  ["n_c4_5", "n_c7_mid1"],
  ["n_c7_mid1", "n_c5_4"],
  ["n_c4_6", "n_c8_mid1"],
  ["n_c8_mid1", "n_c5_5"],

  ["n_c5_5", "n_c6_1"],
  ["n_c6_1", "n_c6_2"],
  ["n_c6_2", "n_c6_3"],
  ["n_c6_3", "e_c1_14"],
  ["n_c6_2", "n_c9_mid1"],
  ["n_c9_mid1", "n_c5_6"],
  ["n_c6_3", "n_c10_mid1"],
  ["n_c10_mid1", "n_c5_7"],

  // Northern creek crossing / Manzanas 24, 26, 27
  ["nw_trans_2", "n_bridge_west"],
  ["n_bridge_west", "n_m24_1"],
  ["n_m24_1", "n_m24_2"],
  ["n_m24_2", "n_m24_3"],
  ["n_m24_3", "n_m24_4"],

  ["c_c3_5", "n_bridge_mid"],
  ["n_bridge_mid", "n_m26_1"],
  ["n_m26_1", "n_m26_2"],
  ["n_m26_2", "n_m26_3"],
  ["n_m26_3", "n_m26_4"],
  ["n_m26_4", "n_m26_5"],
  ["n_m26_5", "n_m27_1"],
  ["n_m27_1", "n_m27_2"],
  ["n_m27_2", "n_m27_3"],
];

// Helper: parse polygon vertices from SVG path
function parseSvgPoints(d) {
  const points = [];
  const commands = d.match(/[MLZ][^MLZ]*/gi) || [];
  for (const cmd of commands) {
    const type = cmd[0].toUpperCase();
    if (type === "Z") continue;
    const nums = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    for (let i = 0; i < nums.length; i += 2) {
      if (!isNaN(nums[i]) && !isNaN(nums[i + 1])) {
        points.push([nums[i], nums[i + 1]]);
      }
    }
  }
  return points;
}

// 2. Controls & Checkpoints for GPS Calibration
const controlSvgPoints = [
  { label: "Portería / Acceso", x: 1014.7, y: 2148.5 },
  { label: "Manzana 1 Oeste", x: 670.0, y: 1756.0 },
  { label: "Lago Principal Sur", x: 1415.0, y: 1890.0 },
  { label: "Sector Deportivo", x: 1520.0, y: 1780.0 },
  { label: "Eje Central Carrera 3", x: 1216.0, y: 1222.0 },
  { label: "Calle 4 Norte", x: 1777.0, y: 828.0 },
  { label: "Manzana 24 Arroyo", x: 852.0, y: 955.0 },
  { label: "Límite Este Calle 1", x: 2190.0, y: 814.0 },
];

const controls = controlSvgPoints.map((pt) => {
  const gps = svgToGpsViaProj4(pt.x, pt.y);
  return {
    label: pt.label,
    source: { x: gps.longitude, y: gps.latitude }, // Longitude is source.x, Latitude is source.y
    target: { x: pt.x, y: pt.y },
    accuracy: 0,
  };
});

// Fit affine transform from controls
function fitAffineTransform(ctrls) {
  let sxx = 0,
    sxy = 0,
    sx = 0;
  let syy = 0,
    sy = 0,
    n = ctrls.length;
  let sxtx = 0,
    sytx = 0,
    stx = 0;
  let sxty = 0,
    syty = 0,
    sty = 0;

  for (const c of ctrls) {
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

  const mx = [
    [sxx, sxy, sx, sxtx],
    [sxy, syy, sy, sytx],
    [sx, sy, n, stx],
  ];
  for (let i = 0; i < 3; i++) {
    let pivot = i;
    for (let j = i + 1; j < 3; j++) {
      if (Math.abs(mx[j][i]) > Math.abs(mx[pivot][i])) pivot = j;
    }
    [mx[i], mx[pivot]] = [mx[pivot], mx[i]];
    const div = mx[i][i];
    for (let k = i; k <= 3; k++) mx[i][k] /= div;
    for (let j = 0; j < 3; j++) {
      if (j === i) continue;
      const factor = mx[j][i];
      for (let k = i; k <= 3; k++) mx[j][k] -= factor * mx[i][k];
    }
  }
  const a = mx[0][3],
    b = mx[1][3],
    c = mx[2][3];

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
    for (let k = i; k <= 3; k++) my[i][k] /= div;
    for (let j = 0; j < 3; j++) {
      if (j === i) continue;
      const factor = my[j][i];
      for (let k = i; k <= 3; k++) my[j][k] -= factor * my[i][k];
    }
  }
  const d = my[0][3],
    e = my[1][3],
    f = my[2][3];

  return { a, b, c, d, e, f };
}

const affine = fitAffineTransform(controls);

function svgToGps(p, t) {
  const det = t.a * t.e - t.b * t.d;
  const x = p.x - t.c;
  const y = p.y - t.f;
  return {
    longitude: (t.e * x - t.b * y) / det,
    latitude: (t.a * y - t.d * x) / det,
  };
}

function gpsDistance(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(Math.min(1, h)));
}

// 4 independent checkpoints separated by >= 10 m from each other and controls
const checkpointSvgPoints = [
  { label: "Check 1 - Carrera 2 Sur", x: 822.0, y: 1622.0 },
  { label: "Check 2 - Lago Central", x: 1396.0, y: 1456.0 },
  { label: "Check 3 - Calle 5 Norte", x: 1541.0, y: 650.0 },
  { label: "Check 4 - Entrada Interior", x: 1085.0, y: 2080.0 },
];

const checkpoints = checkpointSvgPoints.map((pt) => {
  const gps = svgToGps(pt, affine);
  return {
    label: pt.label,
    gps,
    point: { x: pt.x, y: pt.y },
    accuracy: 0,
  };
});

// 3. Connect lots to the nearest street segment
const nodes = [];
const edges = [];
const destinations = [];

// Add base junctions as nodes
for (const [id, [x, y]] of Object.entries(JUNCTIONS)) {
  nodes.push({
    id,
    label: id === "entrance" ? "Portería - Acceso Principal" : id,
    kind: id === "entrance" ? "entrance" : "intersection",
    point: { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) },
  });
}

function calcEdgeLength(p1, p2) {
  const g1 = svgToGps(p1, affine);
  const g2 = svgToGps(p2, affine);
  return Math.max(0.5, Number(gpsDistance(g1, g2).toFixed(2)));
}

// Add base edges
let edgeIdx = 1;
for (const [u, v] of BASE_EDGES) {
  const p1 = { x: Number(JUNCTIONS[u][0].toFixed(2)), y: Number(JUNCTIONS[u][1].toFixed(2)) };
  const p2 = { x: Number(JUNCTIONS[v][0].toFixed(2)), y: Number(JUNCTIONS[v][1].toFixed(2)) };
  const lengthMeters = calcEdgeLength(p1, p2);
  edges.push({
    id: `edge_${edgeIdx++}`,
    from: u,
    to: v,
    lengthMeters,
    modes: ["walking", "driving"],
    isBidirectional: true,
    isOpen: true,
    geometry: [p1, p2],
  });
}

// Helper: project point onto line segment [p1, p2]
function projectPointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return { x: x1, y: y1, dist: Math.hypot(px - x1, py - y1), t: 0 };
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const qx = x1 + t * dx;
  const qy = y1 + t * dy;
  return { x: qx, y: qy, dist: Math.hypot(px - qx, py - qy), t };
}

function findClosestPointOnPolygon(pt, poly) {
  let bestDist = Infinity;
  let bestPt = { x: poly[0][0], y: poly[0][1] };
  for (let i = 0; i < poly.length; i++) {
    const v1 = poly[i];
    const v2 = poly[(i + 1) % poly.length];
    const proj = projectPointToSegment(pt.x, pt.y, v1[0], v1[1], v2[0], v2[1]);
    if (proj.dist < bestDist) {
      bestDist = proj.dist;
      bestPt = { x: proj.x, y: proj.y };
    }
  }
  return { point: bestPt, dist: bestDist };
}

// For each lot, create a frontage destination node and connect to the best street edge
for (const lot of lots) {
  if (!lot.pathD || !lot.centroid) continue;
  const poly = parseSvgPoints(lot.pathD);
  if (poly.length < 3) continue;

  let bestDist = Infinity;
  let bestJunction = null;

  // Check closest junction
  for (const [jId, [jx, jy]] of Object.entries(JUNCTIONS)) {
    const d = Math.hypot(lot.centroid[0] - jx, lot.centroid[1] - jy);
    if (d < bestDist) {
      bestDist = d;
      bestJunction = jId;
    }
  }

  // Also check segments for closer perpendicular frontage
  for (const [u, v] of BASE_EDGES) {
    const p1 = JUNCTIONS[u],
      p2 = JUNCTIONS[v];
    const proj = projectPointToSegment(
      lot.centroid[0],
      lot.centroid[1],
      p1[0],
      p1[1],
      p2[0],
      p2[1],
    );
    if (proj.dist < bestDist) {
      bestDist = proj.dist;
      const d1 = Math.hypot(lot.centroid[0] - p1[0], lot.centroid[1] - p1[1]);
      const d2 = Math.hypot(lot.centroid[0] - p2[0], lot.centroid[1] - p2[1]);
      bestJunction = d1 <= d2 ? u : v;
    }
  }

  if (bestJunction) {
    const jPt = {
      x: Number(JUNCTIONS[bestJunction][0].toFixed(2)),
      y: Number(JUNCTIONS[bestJunction][1].toFixed(2)),
    };

    // Find the frontage of the lot closest to this road junction
    const closest = findClosestPointOnPolygon(jPt, poly);
    let frontPt = closest.point;

    // Ensure frontage is at least 3 SVG units (~1 meter) away from the junction node
    if (closest.dist < 3) {
      const dx = lot.centroid[0] - jPt.x || 1;
      const dy = lot.centroid[1] - jPt.y || 1;
      const dLen = Math.hypot(dx, dy);
      frontPt = {
        x: jPt.x + (dx / dLen) * 3,
        y: jPt.y + (dy / dLen) * 3,
      };
    }

    const destNodeId = `dest_${lot.id}`;
    const lotLabel = `Lote ${lot.lotNumber ?? lot.id.replace("L-", "")}`;

    const destX = Number(frontPt.x.toFixed(2));
    const destY = Number(frontPt.y.toFixed(2));
    const destPt = { x: destX, y: destY };

    nodes.push({
      id: destNodeId,
      label: lotLabel,
      kind: "destination",
      point: destPt,
    });

    const connLenMeters = calcEdgeLength(jPt, destPt);

    edges.push({
      id: `edge_acc_${lot.id}`,
      from: bestJunction,
      to: destNodeId,
      lengthMeters: connLenMeters,
      modes: ["walking", "driving"],
      isBidirectional: true,
      isOpen: true,
      geometry: [jPt, destPt],
    });

    destinations.push({
      lotId: lot.id,
      nodeId: destNodeId,
    });
  }
}

// 4. Geofence
const geofence = [
  { x: 100, y: 1200 },
  { x: 750, y: 950 },
  { x: 1350, y: 200 },
  { x: 1750, y: 100 },
  { x: 2350, y: 500 },
  { x: 2350, y: 900 },
  { x: 1700, y: 1800 },
  { x: 1100, y: 2280 },
  { x: 950, y: 2200 },
  { x: 300, y: 1550 },
];

const layersHash =
  "sha256:" + crypto.createHash("sha256").update(JSON.stringify(layers)).digest("hex");

const bundle = {
  projectSlug: "villa-paraiso",
  version: "2026.11.02.1",
  masterplanVersion: layersHash,
  entranceId: "entrance",
  bounds: { width: 2400, height: 2324 },
  geofence,
  calibration: {
    controls,
    checkpoints,
  },
  nodes,
  edges,
  destinations,
};

const outputPath = path.resolve(baseDir, "src/data/generated/villa-paraiso-navigation-bundle.json");
fs.writeFileSync(outputPath, JSON.stringify(bundle, null, 2), "utf8");

console.log(`NavigationBundle generated successfully!`);
console.log(`Nodes: ${nodes.length}, Edges: ${edges.length}, Destinations: ${destinations.length}`);
console.log(`Saved to: ${outputPath}`);
