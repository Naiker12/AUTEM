import type { NavigationNode, TravelMode } from "./types";
import type { RenderableInternalRoute } from "./route-graph";

// Nodos y corredores viales reales trazados sobre las calzadas asfaltadas de Villa Paraíso
const ROAD_JUNCTIONS: Record<string, [number, number]> = {
  // Portería y acceso
  entrance: [1014.7, 2148.5],
  acceso_main: [1070.0, 2135.0],
  acceso_split: [1085.0, 2080.0],

  // Arteria Occidental (Carrera 1 y Carrera 2 - Costado Oeste)
  w_m1: [980.0, 2000.0],
  w_c2_m1_m2: [900.0, 1940.0], // Calle 2 (frente a M1 y M2)
  w_c3_m2_m3: [780.0, 1840.0], // Calle 3 (frente a M2 y M3)
  w_c4_m3_m4: [650.0, 1720.0], // Calle 4 (frente a M3 y M4)
  w_c5_m4_m5: [530.0, 1630.0], // Calle 5 (frente a M4 y M5)
  w_m5_end: [450.0, 1550.0],
  w_loop_1: [380.0, 1420.0],
  w_loop_2: [290.0, 1280.0],
  w_loop_3: [370.0, 1180.0],
  w_loop_4: [480.0, 1110.0],
  w_c7_junc: [620.0, 1020.0],

  // Transversal 1 y margen norte del lago inferior (frente a M7 y M8)
  nw_trans_1: [820.0, 1260.0],
  nw_trans_2: [700.0, 1170.0],
  nw_trans_3: [570.0, 1070.0],
  nw_m7_bank1: [910.0, 1330.0], // frente a lotes 57-60
  nw_m7_bank2: [1000.0, 1290.0], // frente a lotes 61-63
  nw_m8_bank: [1120.0, 1340.0], // frente a lotes 64-67

  // Sector Isla M 24
  m24_isle: [840.0, 1000.0],

  // Arteria Oriental (Calle 1 - Sur del lago grande inferior hasta lotes 311-317)
  e_c1_1: [1205.0, 2020.0],
  e_c1_2: [1320.0, 1880.0],
  e_c1_317: [1415.0, 1720.0], // Vía asfaltada directa frente al Lote 317
  e_c1_314: [1520.0, 1640.0], // Frente a lotes 314-316
  e_c1_311: [1640.0, 1580.0], // Frente a lotes 311-313
  e_c1_m10: [1740.0, 1450.0],
  e_c1_m11: [1770.0, 1310.0],
  e_c1_m12: [1900.0, 1160.0],
  e_c1_m13: [2030.0, 1010.0],
  e_c1_m14: [2190.0, 810.0],
  e_c1_far: [2335.0, 540.0],

  // Eje Central entre lagos (Carrera 3 y rotonda)
  mid_lake_south: [1440.0, 1600.0],
  mid_lake_roundabout: [1395.0, 1460.0],
  mid_lake_c3: [1340.0, 1300.0],
  mid_lake_c3_n: [1216.0, 1220.0],
  mid_lake_n: [1140.0, 1030.0],

  // Sector Canal central (Manzanas 12 y 19)
  canal_m12_1: [1270.0, 960.0],
  canal_m12_2: [1330.0, 860.0],
  m26_road: [1214.0, 622.0],

  // Sector Norte (Manzanas 15 a 23)
  n_c4_1: [1300.0, 1070.0],
  n_c4_2: [1530.0, 1060.0],
  n_c4_3: [1580.0, 930.0],
  n_c4_4: [1770.0, 830.0],
  n_c4_5: [1930.0, 840.0],
  n_c4_6: [2070.0, 850.0],

  n_c5_1: [1540.0, 650.0],
  n_c5_2: [1770.0, 590.0],
  n_c5_3: [1830.0, 410.0],
  n_c5_4: [1980.0, 255.0],
  n_c5_5: [2180.0, 220.0],

  n_c6_1: [2000.0, 540.0],
  n_c6_2: [2150.0, 420.0],
  n_c6_3: [2260.0, 440.0],

  n_far_c7: [1366.0, 364.0],
  n_far_c12: [1485.0, 212.0],
  m27_road: [1556.0, 175.0],
};

// Tramos viales reales que siguen estrictamente las calzadas (nunca atraviesan manzanas ni lagos)
const STREET_EDGES: [string, string][] = [
  // Acceso y portería
  ["entrance", "acceso_main"],
  ["acceso_main", "acceso_split"],

  // Arteria Occidental (Carrera 1 y 2)
  ["acceso_split", "w_m1"],
  ["w_m1", "w_c2_m1_m2"],
  ["w_c2_m1_m2", "w_c3_m2_m3"],
  ["w_c3_m2_m3", "w_c4_m3_m4"],
  ["w_c4_m3_m4", "w_c5_m4_m5"],
  ["w_c5_m4_m5", "w_m5_end"],
  ["w_m5_end", "w_loop_1"],
  ["w_loop_1", "w_loop_2"],
  ["w_loop_2", "w_loop_3"],
  ["w_loop_3", "w_loop_4"],
  ["w_loop_4", "w_c7_junc"],
  ["w_c7_junc", "nw_trans_3"],

  // Transversal 1 y margen del lago inferior
  ["w_c3_m2_m3", "nw_trans_1"],
  ["nw_trans_1", "nw_trans_2"],
  ["nw_trans_2", "nw_trans_3"],
  ["nw_trans_1", "nw_m7_bank1"],
  ["nw_m7_bank1", "nw_m7_bank2"],
  ["nw_m7_bank2", "nw_m8_bank"],
  ["nw_m8_bank", "mid_lake_roundabout"],
  ["nw_m7_bank2", "mid_lake_c3_n"],

  // Sector Isla M24
  ["nw_trans_2", "m24_isle"],

  // Arteria Oriental (Calle 1 - Sur del lago inferior directo a M9, lotes 311-317)
  ["acceso_split", "e_c1_1"],
  ["e_c1_1", "e_c1_2"],
  ["e_c1_2", "e_c1_317"],
  ["e_c1_317", "e_c1_314"],
  ["e_c1_314", "e_c1_311"],
  ["e_c1_311", "e_c1_m10"],
  ["e_c1_m10", "e_c1_m11"],
  ["e_c1_m11", "e_c1_m12"],
  ["e_c1_m12", "e_c1_m13"],
  ["e_c1_m13", "e_c1_m14"],
  ["e_c1_m14", "e_c1_far"],

  // Conexión del eje central entre lagos
  ["e_c1_317", "mid_lake_south"],
  ["e_c1_314", "mid_lake_south"],
  ["mid_lake_south", "mid_lake_roundabout"],
  ["mid_lake_roundabout", "mid_lake_c3"],
  ["mid_lake_c3", "mid_lake_c3_n"],
  ["mid_lake_c3_n", "mid_lake_n"],

  // Canal central hacia manzanas 12 y 19
  ["mid_lake_n", "canal_m12_1"],
  ["canal_m12_1", "canal_m12_2"],
  ["canal_m12_2", "n_c5_1"],
  ["canal_m12_1", "m26_road"],

  // Cuadrícula del Sector Norte (Manzanas 15 a 23)
  ["mid_lake_n", "n_c4_1"],
  ["n_c4_1", "n_c4_2"],
  ["n_c4_2", "n_c4_3"],
  ["n_c4_3", "n_c4_4"],
  ["n_c4_4", "n_c4_5"],
  ["n_c4_5", "n_c4_6"],
  ["n_c4_6", "e_c1_m14"],

  ["n_c4_2", "n_c5_1"],
  ["n_c5_1", "n_c5_2"],
  ["n_c5_2", "n_c5_3"],
  ["n_c5_3", "n_c5_4"],
  ["n_c5_4", "n_c5_5"],
  ["n_c5_5", "e_c1_far"],

  ["n_c5_3", "n_c6_1"],
  ["n_c6_1", "n_c6_2"],
  ["n_c6_2", "n_c6_3"],
  ["n_c6_3", "n_c5_5"],

  ["n_c5_1", "n_far_c7"],
  ["n_far_c7", "n_far_c12"],
  ["n_far_c12", "m27_road"],
  ["m27_road", "n_c5_4"],
];

const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Grafo de adyacencia
const ADJ_MAP = new Map<string, { to: string; d: number }[]>();
Object.keys(ROAD_JUNCTIONS).forEach((k) => ADJ_MAP.set(k, []));

STREET_EDGES.forEach(([u, v]) => {
  const d = dist(ROAD_JUNCTIONS[u], ROAD_JUNCTIONS[v]);
  ADJ_MAP.get(u)!.push({ to: v, d });
  ADJ_MAP.get(v)!.push({ to: u, d });
});

function dijkstra(from: string, to: string): { path: string[]; distance: number } {
  const distances = new Map<string, number>();
  const prev = new Map<string, string>();
  const pq = new Set(Object.keys(ROAD_JUNCTIONS));

  Object.keys(ROAD_JUNCTIONS).forEach((k) => distances.set(k, Number.POSITIVE_INFINITY));
  distances.set(from, 0);

  while (pq.size > 0) {
    let u: string | null = null;
    let minD = Number.POSITIVE_INFINITY;
    for (const k of pq) {
      const d = distances.get(k) ?? Number.POSITIVE_INFINITY;
      if (d < minD) {
        minD = d;
        u = k;
      }
    }
    if (!u || minD === Number.POSITIVE_INFINITY) break;
    if (u === to) break;
    pq.delete(u);

    for (const edge of ADJ_MAP.get(u) || []) {
      const alt = (distances.get(u) ?? 0) + edge.d;
      if (alt < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, alt);
        prev.set(edge.to, u);
      }
    }
  }

  const path: string[] = [];
  let curr: string | undefined = to;
  while (curr) {
    path.unshift(curr);
    curr = prev.get(curr);
  }
  return { path, distance: distances.get(to) ?? Number.POSITIVE_INFINITY };
}

export interface ComputedRoadRoute {
  svgPath: string;
  waypoints: [number, number][];
  distanceMeters: number;
  estimatedMinutes: number;
  streetSequence: string[];
}

export function computeInternalRoadRoute(
  origin: { x: number; y: number; label?: string },
  destinationCentroid: [number, number],
  mode: TravelMode = "walking",
): ComputedRoadRoute {
  // Encuentra la unión vial más cercana al punto de origen (Portería o GPS)
  let originNode = "entrance";
  let minOriginD = dist([origin.x, origin.y], ROAD_JUNCTIONS.entrance);

  if (minOriginD > 50) {
    for (const [k, pt] of Object.entries(ROAD_JUNCTIONS)) {
      const d = dist([origin.x, origin.y], pt);
      if (d < minOriginD) {
        minOriginD = d;
        originNode = k;
      }
    }
  }

  // Encuentra la unión vial más cercana al lote destino
  let destNode = "acceso_split";
  let minDestD = Number.POSITIVE_INFINITY;
  for (const [k, pt] of Object.entries(ROAD_JUNCTIONS)) {
    const d = dist(destinationCentroid, pt);
    if (d < minDestD) {
      minDestD = d;
      destNode = k;
    }
  }

  const { path: routeJunctions } = dijkstra(originNode, destNode);

  const rawWaypoints: [number, number][] = [
    [origin.x, origin.y],
    ...routeJunctions.map((k) => ROAD_JUNCTIONS[k]),
    destinationCentroid,
  ];

  // Limpia waypoints duplicados o extremadamente cercanos (< 5m)
  const waypoints: [number, number][] = [];
  for (let i = 0; i < rawWaypoints.length; i++) {
    if (i === 0 || dist(rawWaypoints[i], waypoints[waypoints.length - 1]) > 5) {
      waypoints.push(rawWaypoints[i]);
    }
  }

  let distanceMeters = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    distanceMeters += dist(waypoints[i], waypoints[i + 1]);
  }

  const svgPath = waypoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");

  const speedMetersPerMinute = mode === "driving" ? 350 : 75;
  const estimatedMinutes = Math.max(1, Math.round(distanceMeters / speedMetersPerMinute));

  return {
    svgPath,
    waypoints,
    distanceMeters: Math.round(distanceMeters),
    estimatedMinutes,
    streetSequence: routeJunctions,
  };
}

export function createFallbackInternalRoute(
  origin: { x: number; y: number; id?: string; label?: string },
  destinationCentroid: [number, number],
  lotLabel: string,
  mode: TravelMode = "walking",
): RenderableInternalRoute {
  const computed = computeInternalRoadRoute(origin, destinationCentroid, mode);

  const originNode: NavigationNode = {
    id: origin.id || "entrance",
    kind: "entrance",
    point: { x: origin.x, y: origin.y },
    label: origin.label || "Portería · Acceso Principal",
  };

  const destNode: NavigationNode = {
    id: "destination",
    kind: "destination",
    point: { x: destinationCentroid[0], y: destinationCentroid[1] },
    label: lotLabel,
  };

  return {
    result: {
      nodeIds: ["origin", ...computed.streetSequence, "dest"],
      edgeIds: computed.streetSequence.map((_, i) => `seg-${i}`),
      distanceMeters: computed.distanceMeters,
      status: "found",
    },
    origin: originNode,
    destination: destNode,
    svgPaths: [computed.svgPath],
  };
}
