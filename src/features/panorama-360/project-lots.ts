import { gpsToCad, svgToCad } from "../terrain-navigation/cad-gps";
import type {
  PanoramaCameraConfig,
  PanoramaContextLayers,
  PanoramaLotOverridesMap,
  ProjectedPanoramaLot,
} from "./types";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function roundRad(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

export function radToDegPair([yawRad, pitchRad]: [number, number]): [number, number] {
  return [
    Math.round(yawRad * RAD_TO_DEG * 100) / 100,
    Math.round(pitchRad * RAD_TO_DEG * 100) / 100,
  ];
}

export function degToRadPair([yawDeg, pitchDeg]: [number, number]): [number, number] {
  return [roundRad(yawDeg * DEG_TO_RAD), roundRad(pitchDeg * DEG_TO_RAD)];
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Corrección de terreno para la entrada suroeste y Lago Principal.
 * Mantiene la proyección fotogramétrica pura y calibrada sin deformaciones artificiales
 * que desplacen lotes (ej. L-42..L-45-A) fuera de sus linderos reales sobre construcciones vecinas.
 */
export function applySouthwestEntranceTerrainPatch(
  dE: number,
  dN: number,
  dU: number,
): { dE: number; dN: number; dU: number } {
  return { dE, dN, dU };
}

/**
 * Projects a ground point in EPSG:3116 (East, North) meters to spherical
 * panorama coordinates [yawRad, pitchRad] in radians:
 *   - yawRad in [-PI, PI] (0 at panorama center, positive to the right/clockwise)
 *   - pitchRad in [-PI/2, PI/2] (0 at horizon, negative looking down)
 */
export function projectCadPointToPanoramaRad(
  eastM: number,
  northM: number,
  config: PanoramaCameraConfig,
): [number, number] {
  const camCad = gpsToCad(config.camera.lat, config.camera.lng);
  const camE = camCad.x + (config.camera.offsetEastM ?? 0);
  const camN = camCad.y + (config.camera.offsetNorthM ?? 0);

  let dE = eastM - camE;
  let dN = northM - camN;
  let dU = -Math.max(1, config.camera.heightAboveGroundM);

  const patched = applySouthwestEntranceTerrainPatch(dE, dN, dU);
  dE = patched.dE;
  dN = patched.dN;
  dU = patched.dU;

  const az0 = config.yawOffsetDeg * DEG_TO_RAD;
  let fwd = dE * Math.sin(az0) + dN * Math.cos(az0);
  let right = dE * Math.cos(az0) - dN * Math.sin(az0);
  let up = dU;

  const pitchRad = (config.tilt?.pitchDeg ?? 0) * DEG_TO_RAD;
  const rollRad = (config.tilt?.rollDeg ?? 0) * DEG_TO_RAD;

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
 * Projects a GPS [lng, lat] point to spherical [yawRad, pitchRad].
 */
export function projectGpsPointToPanoramaRad(
  lng: number,
  lat: number,
  config: PanoramaCameraConfig,
): [number, number] {
  const cad = gpsToCad(lat, lng);
  return projectCadPointToPanoramaRad(cad.x, cad.y, config);
}

/**
 * Projects an SVG masterplan [svgX, svgY] point to spherical [yawRad, pitchRad].
 */
export function projectSvgPointToPanoramaRad(
  svgX: number,
  svgY: number,
  config: PanoramaCameraConfig,
): [number, number] {
  const cad = svgToCad(svgX, svgY);
  return projectCadPointToPanoramaRad(cad.x, cad.y, config);
}

/**
 * Subdivides a closed polygon in EPSG:3116 meters so no segment exceeds `maxStepM`
 * meters before spherical projection. This ensures straight ground lines curve
 * naturally in the equirectangular / spherical view, especially near the nadir.
 */
export function densifyCadPolygon(ringEN: [number, number][], maxStepM = 2.5): [number, number][] {
  if (ringEN.length < 3) return ringEN;

  const pts =
    ringEN.length > 3 &&
    Math.hypot(
      ringEN[0][0] - ringEN[ringEN.length - 1][0],
      ringEN[0][1] - ringEN[ringEN.length - 1][1],
    ) < 1e-3
      ? ringEN.slice(0, -1)
      : ringEN;

  const out: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    out.push(p1);
    const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(1, Math.ceil(dist / maxStepM));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      out.push([p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t]);
    }
  }
  return out;
}

/**
 * Adaptive densification: only subdivides edges based on their 3D distance to the
 * camera so distant lots stay at 4-6 vertices and nadir lots get smooth curves.
 */
export function densifyCadPolygonAdaptive(
  ringEN: [number, number][],
  config: PanoramaCameraConfig,
): [number, number][] {
  if (ringEN.length < 3) return ringEN;
  const camCad = gpsToCad(config.camera.lat, config.camera.lng);
  const camE = camCad.x + (config.camera.offsetEastM ?? 0);
  const camN = camCad.y + (config.camera.offsetNorthM ?? 0);
  const H = Math.max(1, config.camera.heightAboveGroundM);

  const pts =
    ringEN.length > 3 &&
    Math.hypot(
      ringEN[0][0] - ringEN[ringEN.length - 1][0],
      ringEN[0][1] - ringEN[ringEN.length - 1][1],
    ) < 1e-3
      ? ringEN.slice(0, -1)
      : ringEN;

  const out: [number, number][] = [];
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

/**
 * Parses SVG path data string (commands M and L) into [[x, y], ...] coordinates.
 */
export function parseSvgPath(d: string): [number, number][] {
  const pts: [number, number][] = [];
  const re = /([ML])\s*([\d.-]+)\s+([\d.-]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    pts.push([parseFloat(m[2]), parseFloat(m[3])]);
  }
  return pts;
}

export interface RawMasterplanLotInput {
  id: string;
  lotNumber: number;
  label?: string;
  manzana?: string;
  pathD?: string;
  centroid?: [number, number] | number[];
}

/**
 * Projects an array of raw masterplan lots into equirectangular spherical lots.
 */
export function projectMasterplanLots(
  rawLots: RawMasterplanLotInput[],
  config: PanoramaCameraConfig,
): ProjectedPanoramaLot[] {
  const projectedLots: ProjectedPanoramaLot[] = [];

  for (const lot of rawLots) {
    if (!lot.pathD) continue;
    const svgPts = parseSvgPath(lot.pathD);
    if (svgPts.length < 3) continue;

    const cadPts = svgPts.map(([x, y]) => {
      const c = svgToCad(x, y);
      return [c.x, c.y] as [number, number];
    });
    const verticesRad = cadPts.map(([e, n]) => projectCadPointToPanoramaRad(e, n, config));
    const denseCad = densifyCadPolygonAdaptive(cadPts, config);
    const polygonRad = denseCad.map(([e, n]) => projectCadPointToPanoramaRad(e, n, config));

    let labelRad: [number, number];
    if (lot.centroid) {
      const cCad = svgToCad(lot.centroid[0], lot.centroid[1]);
      labelRad = projectCadPointToPanoramaRad(cCad.x, cCad.y, config);
    } else {
      labelRad = verticesRad[0];
    }

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

  return projectedLots;
}

/**
 * Projects masterplan context layers (water areas and roads) into spherical coordinates.
 */
export function projectMasterplanLayers(
  rawLayers: { waterAreas?: string[]; calzadas?: string[] },
  config: PanoramaCameraConfig,
): PanoramaContextLayers {
  const waterPolygonsRad: [number, number][][] = [];
  for (const w of rawLayers.waterAreas || []) {
    const subPaths = String(w).split(/(?=[M])/gi);
    for (const sp of subPaths) {
      const svgPts = parseSvgPath(sp);
      if (svgPts.length < 3) continue;
      const cadPts = svgPts.map(([x, y]) => {
        const c = svgToCad(x, y);
        return [c.x, c.y] as [number, number];
      });
      waterPolygonsRad.push(cadPts.map(([e, n]) => projectCadPointToPanoramaRad(e, n, config)));
    }
  }

  const roadPolygonsRad: [number, number][][] = [];
  for (const r of rawLayers.calzadas || []) {
    const svgPts = parseSvgPath(r);
    if (svgPts.length < 3) continue;
    const cadPts = svgPts.map(([x, y]) => {
      const c = svgToCad(x, y);
      return [c.x, c.y] as [number, number];
    });
    roadPolygonsRad.push(cadPts.map(([e, n]) => projectCadPointToPanoramaRad(e, n, config)));
  }

  return {
    water: waterPolygonsRad,
    roads: roadPolygonsRad,
  };
}

/**
 * Densifies a polygon defined by corner vertices in spherical radians [yawRad, pitchRad]
 * by projecting rays onto a horizontal ground plane (z = -1), interpolating linearly
 * on the ground plane, and converting back to [yawRad, pitchRad].
 */
export function densifySphericalVerticesRad(
  verticesRad: [number, number][],
  subdivisionsPerEdge = 4,
): [number, number][] {
  if (verticesRad.length < 3 || subdivisionsPerEdge <= 1) return verticesRad;

  const groundPts = verticesRad.map(([yaw, pitch]) => {
    const clampedPitch = Math.min(-0.02, pitch);
    const r = 1 / Math.tan(-clampedPitch);
    return [r * Math.sin(yaw), r * Math.cos(yaw)] as [number, number];
  });

  const out: [number, number][] = [];
  for (let i = 0; i < groundPts.length; i++) {
    const g1 = groundPts[i];
    const g2 = groundPts[(i + 1) % groundPts.length];
    out.push([roundRad(verticesRad[i][0]), roundRad(verticesRad[i][1])]);
    for (let s = 1; s < subdivisionsPerEdge; s++) {
      const t = s / subdivisionsPerEdge;
      const gx = g1[0] + (g2[0] - g1[0]) * t;
      const gy = g1[1] + (g2[1] - g1[1]) * t;
      const yaw = Math.atan2(gx, gy);
      const horiz = Math.hypot(gx, gy);
      const pitch = Math.atan2(-1, horiz);
      out.push([roundRad(yaw), roundRad(pitch)]);
    }
  }
  return out;
}

/**
 * Applies manual per-lot vertex overrides on top of projected lots.
 */
export function mergePanoramaLotsWithOverrides(
  lots: ProjectedPanoramaLot[],
  overrides?: PanoramaLotOverridesMap | null,
): ProjectedPanoramaLot[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return lots;
  }

  return lots.map((lot) => {
    const ov = overrides[lot.id];
    if (!ov || !Array.isArray(ov.verticesRad) || ov.verticesRad.length < 3) {
      return lot;
    }

    const polygonRad = densifySphericalVerticesRad(ov.verticesRad, 2);
    let labelRad = ov.labelRad;
    if (!labelRad) {
      let sumX = 0;
      let sumY = 0;
      let sumZ = 0;
      for (const [yaw, pitch] of ov.verticesRad) {
        const cosP = Math.cos(pitch);
        sumX += cosP * Math.sin(yaw);
        sumY += cosP * Math.cos(yaw);
        sumZ += Math.sin(pitch);
      }
      const avgYaw = Math.atan2(sumX, sumY);
      const avgPitch = Math.atan2(sumZ, Math.hypot(sumX, sumY));
      labelRad = [roundRad(avgYaw), roundRad(avgPitch)];
    }

    return {
      ...lot,
      verticesRad: ov.verticesRad,
      polygonRad,
      labelRad,
    };
  });
}
