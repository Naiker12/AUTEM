import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import proj4 from "proj4";

// Setup EPSG:3116 (MAGNA-SIRGAS / Colombia Bogotá zone)
proj4.defs(
  "EPSG:3116",
  "+proj=tmerc +lat_0=4.596200417 +lon_0=-74.07750791 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

const UNITS_PER_METER = 3.0054;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.resolve(__dirname, "../..");
const layersPath = path.resolve(baseDir, "src/data/villa-paraiso-layers.json");
const lotsPath = path.resolve(baseDir, "src/data/villa-paraiso-lots.json");
const cadPath = path.resolve(baseDir, "src/data/villa-paraiso-cad-reference.json");

const layers = JSON.parse(fs.readFileSync(layersPath, "utf8"));
const lots = JSON.parse(fs.readFileSync(lotsPath, "utf8"));
const cadRef = JSON.parse(fs.readFileSync(cadPath, "utf8"));

const t = cadRef.transform;

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

function parseSvgPath(d) {
  const points = [];
  const re = /([ML])\s*([\d.-]+)\s+([\d.-]+)/gi;
  let match;
  while ((match = re.exec(d)) !== null) {
    points.push({ x: parseFloat(match[2]), y: parseFloat(match[3]) });
  }
  return points;
}

function ccw(A, B, C) {
  return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

function segmentsIntersect(A, B, C, D) {
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
}

function edgeIntersectsPolygon(p1, p2, poly) {
  for (let i = 0; i < poly.length; i++) {
    const next = (i + 1) % poly.length;
    if (segmentsIntersect(p1, p2, poly[i], poly[next])) return true;
  }
  return false;
}

function insetPolygon(poly, dist = 0.6) {
  let cx = 0,
    cy = 0;
  poly.forEach((p) => {
    cx += p.x;
    cy += p.y;
  });
  cx /= poly.length;
  cy /= poly.length;
  return poly.map((p) => {
    const dx = cx - p.x,
      dy = cy - p.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / len) * dist, y: p.y + (dy / len) * dist };
  });
}

function projectPointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return { x: x1, y: y1, dist: Math.hypot(px - x1, py - y1), t: 0 };
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return {
    x: x1 + t * dx,
    y: y1 + t * dy,
    dist: Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)),
    t,
  };
}

function findClosestPointOnPolygon(pt, poly) {
  let bestDist = Infinity;
  let bestPt = poly[0];
  for (let i = 0; i < poly.length; i++) {
    const v1 = poly[i];
    const v2 = poly[(i + 1) % poly.length];
    const proj = projectPointToSegment(pt.x, pt.y, v1.x, v1.y, v2.x, v2.y);
    if (proj.dist < bestDist) {
      bestDist = proj.dist;
      bestPt = { x: proj.x, y: proj.y };
    }
  }
  return { point: bestPt, dist: bestDist };
}

// 1. Definition of Network Junctions
const JUNCTIONS = {
  entrance: [1014.7, 2148.5],
  acceso_main: [1070.0, 2135.0],
  acceso_split: [1085.0, 2080.0],

  // Calle 1 Sur y Este (Perímetro Sur)
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
  w_c1_1: [980.0, 1980.0],
  w_c1_2: [808.0, 1886.0],
  w_c1_3: [670.0, 1756.0],
  w_c1_4: [520.0, 1614.0],
  w_c1_5: [461.2, 1566.5],

  w_c2_1: [1050.0, 1877.0],
  w_c2_2: [942.0, 1928.0],
  w_c2_3: [822.0, 1622.0],
  w_c2_4: [676.0, 1478.0],
  w_c2_5: [602.0, 1441.0],

  w_calle2_mid: [960.0, 1954.0],
  w_calle3_c1: [793.0, 1798.0],
  w_calle4_c1: [647.0, 1658.0],
  w_calle5_c1: [490.0, 1558.0],

  // Anillo Manzana 3 (calzadasStroked 1)
  m3_nw_mid: [746.1, 1821.1],
  m3_se_mid: [874.7, 1704.3],
  m3_ne_mid: [759.9, 1576.5],

  // Anillo Manzana 11 (calzadasStroked 5)
  m11_node1: [1453.8, 993.1],
  m11_node2: [1657.9, 1275.4],
  m11_node3: [1574.0, 1293.6],
  m11_node4: [1474.2, 1251.8],
  m11_node5: [1343.5, 1082.6],

  // Manzana 15 (CAD Polyline 9)
  m15_node1: [1463.7, 990.7],
  m15_node2: [1522.9, 940.8],
  m15_node3: [1625.4, 953.0],
  m15_node4: [1802.6, 1226.9],
  m15_node5: [1728.4, 1328.4],
  m15_node6: [1680.2, 1325.4],

  // Manzana 16 / 17 (CAD Polyline 8)
  m16_node1: [1643.0, 947.0],
  m16_node2: [1765.0, 847.7],
  m16_node3: [1919.0, 1101.5],
  m16_node4: [1810.7, 1206.2],

  // Zona Social y Corredor Central hacia Lagos
  c_social_1: [1180.0, 1980.0],
  c_social_2: [1320.0, 1870.0],
  c_lake_s1: [1448.7, 1617.6],
  c_lake_s2: [1465.9, 1576.8],
  c_lake_s3: [1461.1, 1550.7],
  c_lake_s4: [1436.7, 1511.7],
  c_lake_s5: [1395.8, 1470.3],
  c_lake_s6: [1349.8, 1434.6],
  c_lake_nw: [1337.0, 1425.3],

  c_c3_3: [1343.0, 1294.0],
  c_c3_4: [1216.0, 1222.0],
  c_c3_5: [1144.0, 1027.0],

  // Transversal entre lagos
  nw_trans_1: [776.0, 1238.0],
  nw_m7_bank1: [880.0, 1320.0],
  nw_m7_bank2: [940.0, 1330.0],
  nw_m8_bank: [1007.0, 1290.0],

  // Sector Norte Sur del 3er lago (Calle 4)
  n_c4_1: [1307.0, 1073.0],
  n_c4_2: [1363.0, 1122.0],
  n_c4_3: [1582.0, 928.0],
  n_c4_4: [1777.0, 828.0],
  n_c4_5: [1932.0, 844.0],
  n_c4_6: [2072.0, 851.0],

  // Sector Norte Norte del 3er lago (Calle 5 curvada con calzadasStroked 4)
  n_c5_1: [1242.0, 898.0],
  n_c5_2: [1487.0, 786.0],
  n_c5_curv1: [1529.7, 681.5],
  n_c5_curv2: [1565.2, 652.7],
  n_c5_curv3: [1630.5, 602.7],
  n_c5_curv4: [1686.8, 571.5],
  n_c5_curv5: [1769.3, 607.7],
  n_c5_5: [1831.0, 412.0],
  n_c5_6: [1980.0, 255.0],
  n_c5_7: [2181.0, 220.0],

  // Conexiones transversales norte
  n_c5_mid1: [1532.0, 1060.0],
  n_c6_mid1: [1698.0, 991.0],
  n_c7_mid1: [1856.0, 914.0],
  n_c8_mid1: [2039.0, 880.0],
  n_c9_mid1: [1992.0, 340.0],
  n_c10_mid1: [2222.0, 302.0],

  // Sector Este del 3er lago
  n_c6_1: [1999.0, 536.0],
  n_c6_2: [2147.0, 420.0],
  n_c6_3: [2260.0, 440.0],

  // Puentes y Manzanas 24, 26, 27
  n_bridge_west: [780.0, 991.0],
  n_m24_1: [806.0, 1017.0],
  n_m24_2: [852.0, 955.0],
  n_m24_3: [861.0, 1032.0],
  n_m24_4: [899.0, 961.0],

  n_bridge_mid: [1062.0, 946.0],
  n_m26_cad1: [956.4, 793.0],
  n_m26_cad2: [1212.4, 615.4],
  n_m26_cad3: [1281.2, 523.3],
  n_m26_cad4: [1348.1, 517.6],
  n_m26_cad5: [1382.4, 416.7],
  n_m26_back: [883.4, 936.1],
  n_m27_1: [1447.1, 205.2],
  n_m27_2: [1539.1, 205.2],
  n_m27_3: [1601.4, 214.3],
};

const BASE_EDGES = [
  // Acceso
  ["entrance", "acceso_main"],
  ["acceso_main", "acceso_split"],
  ["acceso_split", "e_c1_1"],
  ["acceso_split", "w_c1_1"],
  ["acceso_split", "w_c2_1"],
  ["acceso_split", "c_social_1"],

  // Calle 1 Sur (Perímetro Sur)
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

  // Carrera 1 (Occidental)
  ["w_c1_1", "w_c1_2"],
  ["w_c1_2", "w_c1_3"],
  ["w_c1_3", "w_c1_4"],
  ["w_c1_4", "w_c1_5"],
  ["w_c1_5", "nw_trans_1"],

  // Carrera 2 (Oriental de Occidente)
  ["w_c2_1", "w_c2_2"],
  ["w_c2_2", "w_c2_3"],
  ["w_c2_3", "w_c2_4"],
  ["w_c2_4", "w_c2_5"],
  ["w_c2_5", "nw_trans_1"],

  // Conexiones transversales entre C1 y C2
  ["w_c1_1", "w_c2_1"],
  ["w_c1_2", "w_calle2_mid"],
  ["w_calle2_mid", "w_c2_2"],
  ["w_c1_3", "w_calle3_c1"],
  ["w_calle3_c1", "w_c2_3"],
  ["w_c1_4", "w_calle4_c1"],
  ["w_calle4_c1", "w_c2_4"],
  ["w_c1_5", "w_calle5_c1"],
  ["w_calle5_c1", "w_c2_5"],

  // Calles internas Manzana 3
  ["w_c1_3", "m3_nw_mid"],
  ["m3_nw_mid", "w_calle3_c1"],
  ["w_calle3_c1", "m3_se_mid"],
  ["m3_se_mid", "w_c2_3"],
  ["w_c1_4", "m3_ne_mid"],
  ["m3_ne_mid", "w_calle4_c1"],

  // Calles internas Manzana 11 (calzadasStroked 5)
  ["n_c4_1", "m11_node1"],
  ["m11_node1", "m11_node5"],
  ["m11_node5", "c_c3_4"],
  ["m11_node1", "m11_node2"],
  ["m11_node2", "m11_node3"],
  ["m11_node3", "m11_node4"],
  ["m11_node4", "c_c3_4"],
  ["m11_node2", "n_c4_2"],

  // Calles internas Manzana 15 (CAD Polyline 9)
  ["m11_node1", "m15_node1"],
  ["m15_node1", "m15_node2"],
  ["m15_node2", "m15_node3"],
  ["m15_node3", "m15_node4"],
  ["m15_node4", "e_c1_8"],
  ["m15_node4", "m15_node5"],
  ["m15_node5", "m15_node6"],
  ["m15_node6", "m11_node2"],

  // Calles internas Manzana 16 / 17 (CAD Polyline 8)
  ["m15_node3", "m16_node1"],
  ["m16_node1", "n_c6_mid1"],
  ["n_c6_mid1", "m16_node2"],
  ["m16_node2", "n_c4_4"],
  ["m16_node2", "m16_node3"],
  ["m16_node3", "n_c4_5"],
  ["m16_node3", "m16_node4"],
  ["m16_node4", "m15_node4"],

  // Zona Social hacia Lago
  ["c_social_1", "c_social_2"],
  ["c_social_2", "c_lake_s1"],
  ["e_c1_m10", "c_social_2"],

  // Curva del lago (calzadasStroked 25 - exacta)
  ["c_lake_s1", "c_lake_s2"],
  ["c_lake_s2", "c_lake_s3"],
  ["c_lake_s3", "c_lake_s4"],
  ["c_lake_s4", "c_lake_s5"],
  ["c_lake_s5", "c_lake_s6"],
  ["c_lake_s6", "c_lake_nw"],
  ["c_lake_nw", "c_c3_3"],

  // Carrera 3 Central
  ["c_c3_3", "c_c3_4"],
  ["c_c3_4", "c_c3_5"],

  // Transversal entre lagos
  ["nw_trans_1", "nw_m7_bank1"],
  ["nw_m7_bank1", "nw_m7_bank2"],
  ["nw_m7_bank2", "nw_m8_bank"],
  ["nw_m8_bank", "c_c3_4"],

  // Sector Norte Sur del 3er lago
  ["c_c3_4", "n_c4_1"],
  ["n_c4_1", "n_c4_2"],
  ["n_c4_2", "n_c4_3"],
  ["n_c4_3", "n_c4_4"],
  ["n_c4_4", "n_c4_5"],
  ["n_c4_5", "n_c4_6"],
  ["n_c4_6", "e_c1_11"],

  // Sector Norte Norte del 3er lago (Curva calzadasStroked 4)
  ["c_c3_5", "n_c5_1"],
  ["n_c5_1", "n_c5_2"],
  ["n_c5_2", "n_c5_curv1"],
  ["n_c5_curv1", "n_c5_curv2"],
  ["n_c5_curv2", "n_c5_curv3"],
  ["n_c5_curv3", "n_c5_curv4"],
  ["n_c5_curv4", "n_c5_curv5"],
  ["n_c5_curv5", "n_c5_5"],
  ["n_c5_5", "n_c5_6"],
  ["n_c5_6", "n_c5_7"],

  // Conexiones transversales norte
  ["n_c4_3", "n_c5_mid1"],
  ["n_c5_mid1", "n_c5_2"],
  ["n_c4_4", "n_c6_mid1"],
  ["n_c4_5", "n_c7_mid1"],
  ["n_c4_6", "n_c8_mid1"],

  // Este del 3er lago
  ["n_c5_5", "n_c6_1"],
  ["n_c6_1", "n_c6_2"],
  ["n_c6_2", "n_c6_3"],
  ["n_c6_3", "e_c1_14"],
  ["n_c6_2", "n_c9_mid1"],
  ["n_c9_mid1", "n_c5_6"],
  ["n_c6_3", "n_c10_mid1"],
  ["n_c10_mid1", "n_c5_7"],

  // Puentes y Manzanas 24, 26, 27
  ["nw_trans_1", "n_bridge_west"],
  ["n_bridge_west", "n_m24_1"],
  ["n_m24_1", "n_m24_2"],
  ["n_m24_2", "n_m24_3"],
  ["n_m24_3", "n_m24_4"],

  ["c_c3_5", "n_bridge_mid"],
  ["n_bridge_mid", "n_m26_cad1"],
  ["n_m26_cad1", "n_m26_back"],
  ["n_m26_cad1", "n_m26_cad2"],
  ["n_m26_cad2", "n_m26_cad3"],
  ["n_m26_cad3", "n_m26_cad4"],
  ["n_m26_cad4", "n_m26_cad5"],
  ["n_m26_cad5", "n_m27_1"],
  ["n_m27_1", "n_m27_2"],
  ["n_m27_2", "n_m27_3"],
];

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
    source: { x: gps.longitude, y: gps.latitude },
    target: { x: pt.x, y: pt.y },
    accuracy: 0,
  };
});

function solveLinearSystem(matrix, values) {
  const augmented = matrix.map((row, index) => [...row, values[index]]);
  const size = values.length;

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    if (Math.abs(augmented[pivot][column]) < 1e-10) return null;
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const factor = augmented[column][column];
    for (let item = column; item <= size; item += 1) augmented[column][item] /= factor;
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const ratio = augmented[row][column];
      for (let item = column; item <= size; item += 1) {
        augmented[row][item] -= ratio * augmented[column][item];
      }
    }
  }

  return augmented.map((row) => row[size]);
}

function fitAffineTransform(controlPoints) {
  if (controlPoints.length < 3) return null;
  const centerX =
    controlPoints.reduce((sum, point) => sum + point.source.x, 0) / controlPoints.length;
  const centerY =
    controlPoints.reduce((sum, point) => sum + point.source.y, 0) / controlPoints.length;
  const scaleX = Math.max(...controlPoints.map((point) => Math.abs(point.source.x - centerX)));
  const scaleY = Math.max(...controlPoints.map((point) => Math.abs(point.source.y - centerY)));
  if (!scaleX || !scaleY) return null;
  const normal = Array.from({ length: 3 }, () => [0, 0, 0]);
  const targetX = [0, 0, 0];
  const targetY = [0, 0, 0];

  for (const point of controlPoints) {
    const row = [(point.source.x - centerX) / scaleX, (point.source.y - centerY) / scaleY, 1];
    for (let column = 0; column < 3; column += 1) {
      targetX[column] += row[column] * point.target.x;
      targetY[column] += row[column] * point.target.y;
      for (let inner = 0; inner < 3; inner += 1) normal[column][inner] += row[column] * row[inner];
    }
  }

  const xParameters = solveLinearSystem(normal, targetX);
  const yParameters = solveLinearSystem(normal, targetY);
  if (!xParameters || !yParameters) return null;
  return {
    a: xParameters[0] / scaleX,
    b: xParameters[1] / scaleY,
    c: xParameters[2] - (xParameters[0] / scaleX) * centerX - (xParameters[1] / scaleY) * centerY,
    d: yParameters[0] / scaleX,
    e: yParameters[1] / scaleY,
    f: yParameters[2] - (yParameters[0] / scaleX) * centerX - (yParameters[1] / scaleY) * centerY,
  };
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

function calcEdgeLength(p1, p2) {
  const g1 = svgToGps(p1, affine);
  const g2 = svgToGps(p2, affine);
  return Number(gpsDistance(g1, g2).toFixed(2));
}

const checkpointSvgPoints = [
  { label: "Check 1 - Carrera 2 Sur", x: 822.0, y: 1622.0 },
  { label: "Check 2 - Lago Central", x: 1436.7, y: 1511.7 },
  { label: "Check 3 - Calle 5 Norte", x: 1529.7, y: 681.5 },
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

// 3. Subdivide base edges and attach lot frontages
const nodes = [];
const edges = [];
const destinations = [];
let edgeIdx = 1;

for (const [id, pt] of Object.entries(JUNCTIONS)) {
  nodes.push({
    id,
    label: id,
    kind: id === "entrance" ? "entrance" : "intersection",
    point: { x: Number(pt[0].toFixed(2)), y: Number(pt[1].toFixed(2)) },
  });
}

const segmentSplits = new Map();
function getSegKey(u, v) {
  return [u, v].sort().join("|");
}

for (const [u, v] of BASE_EDGES) {
  segmentSplits.set(getSegKey(u, v), []);
}

const lotPolysObj = {};
for (const l of lots) {
  if (l.pathD) lotPolysObj[l.id] = parseSvgPath(l.pathD);
}

for (const lot of lots) {
  if (!lot.pathD || !lot.centroid) continue;
  const poly = lotPolysObj[lot.id];
  if (!poly || poly.length < 3) continue;

  let bestCandidate = null;
  let fallbackCandidate = null;

  for (const [u, v] of BASE_EDGES) {
    const p1 = { x: JUNCTIONS[u][0], y: JUNCTIONS[u][1] };
    const p2 = { x: JUNCTIONS[v][0], y: JUNCTIONS[v][1] };
    const proj = projectPointToSegment(lot.centroid[0], lot.centroid[1], p1.x, p1.y, p2.x, p2.y);
    const roadPt = { x: Number(proj.x.toFixed(2)), y: Number(proj.y.toFixed(2)) };

    const closest = findClosestPointOnPolygon(roadPt, poly);
    let frontPt = { x: Number(closest.point.x.toFixed(2)), y: Number(closest.point.y.toFixed(2)) };

    if (Math.hypot(roadPt.x - frontPt.x, roadPt.y - frontPt.y) < 3) {
      const dx = lot.centroid[0] - roadPt.x || 1;
      const dy = lot.centroid[1] - roadPt.y || 1;
      const dLen = Math.hypot(dx, dy);
      frontPt = {
        x: Number((roadPt.x + (dx / dLen) * 3).toFixed(2)),
        y: Number((roadPt.y + (dy / dLen) * 3).toFixed(2)),
      };
    }

    let crossesOther = false;
    for (const [otherId, otherPoly] of Object.entries(lotPolysObj)) {
      if (otherId !== lot.id) {
        const inset = insetPolygon(otherPoly, 0.6);
        if (edgeIntersectsPolygon(roadPt, frontPt, inset)) {
          crossesOther = true;
          break;
        }
      }
    }

    const dist = Math.hypot(roadPt.x - frontPt.x, roadPt.y - frontPt.y);
    const cand = { u, v, roadPt, frontPt, dist, t: proj.t };

    if (!fallbackCandidate || dist < fallbackCandidate.dist) {
      fallbackCandidate = cand;
    }

    if (!crossesOther) {
      if (!bestCandidate || dist < bestCandidate.dist) {
        bestCandidate = cand;
      }
    }
  }

  const chosen = bestCandidate || fallbackCandidate;
  if (chosen) {
    const key = getSegKey(chosen.u, chosen.v);
    segmentSplits.get(key).push({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      roadPt: chosen.roadPt,
      frontPt: chosen.frontPt,
      u: chosen.u,
      v: chosen.v,
    });
  }
}

for (const [u, v] of BASE_EDGES) {
  const p1 = { x: Number(JUNCTIONS[u][0].toFixed(2)), y: Number(JUNCTIONS[u][1].toFixed(2)) };
  const p2 = { x: Number(JUNCTIONS[v][0].toFixed(2)), y: Number(JUNCTIONS[v][1].toFixed(2)) };
  const key = getSegKey(u, v);
  const splits = segmentSplits.get(key) || [];

  if (splits.length === 0) {
    const lengthMeters = Math.max(0.5, calcEdgeLength(p1, p2));
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
  } else {
    const segTotalDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const intermediateSplits = [];

    for (const split of splits) {
      const distFromP1 = Math.hypot(split.roadPt.x - p1.x, split.roadPt.y - p1.y);
      const distFromP2 = Math.hypot(split.roadPt.x - p2.x, split.roadPt.y - p2.y);

      if (distFromP1 < 1.0) {
        split.roadNodeId = u;
        split.roadPt = p1;
      } else if (distFromP2 < 1.0 || distFromP1 >= segTotalDist - 1.0) {
        split.roadNodeId = v;
        split.roadPt = p2;
      } else {
        split.distFromP1 = distFromP1;
        intermediateSplits.push(split);
      }
    }

    intermediateSplits.sort((a, b) => a.distFromP1 - b.distFromP1);

    const intermediateNodes = [];
    for (const s of intermediateSplits) {
      if (
        intermediateNodes.length > 0 &&
        s.distFromP1 - intermediateNodes.at(-1).distFromP1 < 1.0
      ) {
        s.roadNodeId = intermediateNodes.at(-1).id;
        s.roadPt = intermediateNodes.at(-1).pt;
      } else {
        const roadNodeId = `r_${s.lotId}`;
        nodes.push({
          id: roadNodeId,
          label: `Acceso Vía ${s.lotId}`,
          kind: "intersection",
          point: s.roadPt,
        });
        s.roadNodeId = roadNodeId;
        intermediateNodes.push({
          id: roadNodeId,
          pt: s.roadPt,
          distFromP1: s.distFromP1,
        });
      }
    }

    const chain = [{ id: u, pt: p1 }, ...intermediateNodes, { id: v, pt: p2 }];
    for (let i = 0; i < chain.length - 1; i++) {
      const curr = chain[i];
      const next = chain[i + 1];
      const segLen = Math.max(0.5, calcEdgeLength(curr.pt, next.pt));
      edges.push({
        id: `edge_${edgeIdx++}`,
        from: curr.id,
        to: next.id,
        lengthMeters: segLen,
        modes: ["walking", "driving"],
        isBidirectional: true,
        isOpen: true,
        geometry: [curr.pt, next.pt],
      });
    }

    for (const split of splits) {
      const destNodeId = `dest_${split.lotId}`;
      const lotLabel = `Lote ${split.lotNumber ?? split.lotId.replace("L-", "")}`;
      nodes.push({
        id: destNodeId,
        label: lotLabel,
        kind: "destination",
        point: split.frontPt,
      });

      const accLen = Math.max(0.5, calcEdgeLength(split.roadPt, split.frontPt));
      edges.push({
        id: `edge_acc_${split.lotId}`,
        from: split.roadNodeId,
        to: destNodeId,
        lengthMeters: accLen,
        modes: ["walking", "driving"],
        isBidirectional: true,
        isOpen: true,
        geometry: [split.roadPt, split.frontPt],
      });

      destinations.push({
        lotId: split.lotId,
        nodeId: destNodeId,
      });
    }
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

const bundle = {
  projectSlug: "villa-paraiso",
  version: "2026.11.02.1",
  masterplanVersion: "sha256:b409559d6c69a0b806575496199faea30a74fd30a25753878331b6421081af6f",
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
