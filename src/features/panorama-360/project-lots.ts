import { gpsToCad, svgToCad } from "../terrain-navigation/cad-gps";
import type {
  PanoramaCameraConfig,
  PanoramaContextLayers,
  PanoramaLotOverride,
  PanoramaLotOverridesMap,
  ProjectedPanoramaLot,
  SouthwestTerrainPatchConfig,
} from "./types";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Configuración por defecto del parche de terreno de la entrada suroeste (L-1..L-45-A).
 * Documenta cada parámetro calibrado que compensa la pendiente ascendente hacia la linde SO.
 */
export const DEFAULT_SOUTHWEST_TERRAIN_PATCH: Required<SouthwestTerrainPatchConfig> = {
  enabled: true,
  /** Vector unitario longitudinal hacia el acceso suroeste (aprox. azimut 221°) */
  axisU: [-0.661, -0.751],
  /** Vector unitario transversal ortogonal hacia el noroeste */
  axisT: [-0.751, 0.661],
  /** Distancia desde el dron a partir de la cual inicia la rampa suroeste (metros) */
  sStartM: 215,
  /** Distancia de referencia donde la rampa alcanza su factor nominal (metros) */
  sEndM: 365,
  /** Ventana transversal activa [mínimo SE, máximo NO] en metros */
  tRangeM: [-260, 185],
  /** Término lineal de estiramiento longitudinal en metros */
  stretchLinear: 14,
  /** Término cuadrático de estiramiento longitudinal en metros */
  stretchQuadratic: 22,
  /** Corrección transversal hacia el sureste para alinear el borde de portería (metros) */
  seTransverseBoost: -12,
};

export function roundRad(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

export function wrapYawRad(yawRad: number): number {
  let y = yawRad;
  while (y > Math.PI) y -= 2 * Math.PI;
  while (y < -Math.PI) y += 2 * Math.PI;
  return y;
}

export function clampPitchRad(pitchRad: number): number {
  return Math.max(-Math.PI / 2 + 1e-4, Math.min(Math.PI / 2 - 1e-4, pitchRad));
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
 * Corrección de terreno para la elevación de la entrada suroeste (L-1..L-45-A).
 * Compensa la pendiente ascendente del terreno real hacia la linde suroccidental
 * para que los lotes alcancen su cerca/línea de árboles natural sin dejar franjas vacías.
 * Puede desactivarse o ajustarse mediante `config.terrainPatch`.
 */
export function applySouthwestEntranceTerrainPatch(
  dE: number,
  dN: number,
  dU: number,
  patchConfig?: SouthwestTerrainPatchConfig,
): { dE: number; dN: number; dU: number } {
  if (patchConfig && patchConfig.enabled === false) {
    return { dE, dN, dU };
  }

  const cfg = {
    ...DEFAULT_SOUTHWEST_TERRAIN_PATCH,
    ...patchConfig,
  };

  const [ux, uy] = cfg.axisU;
  const [tx, ty] = cfg.axisT;
  const [tMin, tMax] = cfg.tRangeM;
  const s = dE * ux + dN * uy;
  const t = dE * tx + dN * ty;

  if (s > cfg.sStartM && t > tMin && t < tMax) {
    const wSE = smoothstep(-255, -195, t);
    const wNW = 1 - 0.42 * smoothstep(-15, 75, t) - 0.58 * smoothstep(75, 175, t);
    const wT = wSE * Math.max(0, wNW);

    const spanS = Math.max(1, cfg.sEndM - cfg.sStartM);
    const u = Math.max(0, (s - cfg.sStartM) / spanS);
    const stretchS =
      (cfg.stretchLinear * Math.pow(u, 1.2) + cfg.stretchQuadratic * Math.pow(u, 2.0)) * wT;
    const seBoost = smoothstep(-70, -195, t) * Math.pow(u, 1.15) * wSE;
    const stretchT = cfg.seTransverseBoost * seBoost;

    return {
      dE: dE + ux * stretchS + tx * stretchT,
      dN: dN + uy * stretchS + ty * stretchT,
      dU,
    };
  }

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

  if (config.groundSlope?.enabled) {
    const se = config.groundSlope.slopeEast ?? 0;
    const sn = config.groundSlope.slopeNorth ?? 0;
    const curv = config.groundSlope.curvature ?? 0;
    const distSq = dE * dE + dN * dN;
    dU += dE * se + dN * sn + curv * distSq;
  }

  const patched = applySouthwestEntranceTerrainPatch(dE, dN, dU, config.terrainPatch);
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
 * Inverse projection: Given spherical [yawRad, pitchRad] on the panorama, intersects
 * the viewing ray with the ground plane at `-heightAboveGroundM` and returns the
 * corresponding CAD [eastM, northM] coordinates in EPSG:3116 meters.
 */
export function unprojectPanoramaRadToCadPoint(
  yawRad: number,
  pitchRad: number,
  config: PanoramaCameraConfig,
): [number, number] {
  const camCad = gpsToCad(config.camera.lat, config.camera.lng);
  const camE = camCad.x + (config.camera.offsetEastM ?? 0);
  const camN = camCad.y + (config.camera.offsetNorthM ?? 0);
  const H = Math.max(1, config.camera.heightAboveGroundM);

  const clampedPitch = Math.min(-0.015, pitchRad);
  const cosP = Math.cos(clampedPitch);
  let right = cosP * Math.sin(yawRad);
  let fwd = cosP * Math.cos(yawRad);
  let up = Math.sin(clampedPitch);

  const tiltPitchRad = (config.tilt?.pitchDeg ?? 0) * DEG_TO_RAD;
  const tiltRollRad = (config.tilt?.rollDeg ?? 0) * DEG_TO_RAD;

  // Invert roll
  if (tiltRollRad !== 0) {
    const r0 = right * Math.cos(-tiltRollRad) - up * Math.sin(-tiltRollRad);
    const u0 = right * Math.sin(-tiltRollRad) + up * Math.cos(-tiltRollRad);
    right = r0;
    up = u0;
  }

  // Invert pitch
  if (tiltPitchRad !== 0) {
    const f0 = fwd * Math.cos(-tiltPitchRad) - up * Math.sin(-tiltPitchRad);
    const u0 = fwd * Math.sin(-tiltPitchRad) + up * Math.cos(-tiltPitchRad);
    fwd = f0;
    up = u0;
  }

  const scale = -H / Math.min(-1e-4, up);
  const fwdM = fwd * scale;
  const rightM = right * scale;

  const az0 = config.yawOffsetDeg * DEG_TO_RAD;
  const dE = fwdM * Math.sin(az0) + rightM * Math.cos(az0);
  const dN = fwdM * Math.cos(az0) - rightM * Math.sin(az0);

  return [camE + dE, camN + dN];
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
 * meters before spherical projection.
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
 * Scales a CAD polygon around its centroid by `scaleFactor`.
 */
export function scaleCadPolygonAroundCentroid(
  cadPts: [number, number][],
  scaleFactor: number,
): [number, number][] {
  if (Math.abs(scaleFactor - 1) < 1e-4 || cadPts.length < 3) return cadPts;
  let cx = 0;
  let cy = 0;
  for (const [x, y] of cadPts) {
    cx += x;
    cy += y;
  }
  cx /= cadPts.length;
  cy /= cadPts.length;
  return cadPts.map(([x, y]) => [cx + (x - cx) * scaleFactor, cy + (y - cy) * scaleFactor]);
}

/**
 * Projects an array of raw masterplan lots into equirectangular spherical lots.
 * Respects `config.visualScale` (Fase B) when != 1.
 */
export function projectMasterplanLots(
  rawLots: RawMasterplanLotInput[],
  config: PanoramaCameraConfig,
): ProjectedPanoramaLot[] {
  const projectedLots: ProjectedPanoramaLot[] = [];
  const visualScale = config.visualScale && config.visualScale !== 1 ? config.visualScale : 1;

  for (const lot of rawLots) {
    if (!lot.pathD) continue;
    const svgPts = parseSvgPath(lot.pathD);
    if (svgPts.length < 3) continue;

    const baseCadPts = svgPts.map(([x, y]) => {
      const c = svgToCad(x, y);
      return [c.x, c.y] as [number, number];
    });
    const cadPts =
      visualScale !== 1 ? scaleCadPolygonAroundCentroid(baseCadPts, visualScale) : baseCadPts;

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
 * Pure function (Fase A1): computes the overridden corner vertices `[yawRad, pitchRad][]`
 * from `baseVertices` and a `PanoramaLotOverride`.
 * - If `override` has explicit `verticesRad` and no `delta`, returns `override.verticesRad` (100% backward compatible).
 * - If `override` has `delta`, applies parametric `scaleX/scaleY/scale`, `rotateRad`, and `(dYawRad, dPitchRad)`
 *   around the polygon centroid.
 */
export function applyOverride(
  baseVertices: [number, number][],
  override?: PanoramaLotOverride | null,
): [number, number][] {
  if (!override) return baseVertices;

  const startVerts =
    Array.isArray(override.verticesRad) && override.verticesRad.length >= 3
      ? override.verticesRad
      : baseVertices;

  if (!override.delta) {
    return startVerts;
  }

  const { dYawRad = 0, dPitchRad = 0, scale = 1, rotateRad = 0, scaleX, scaleY } = override.delta;

  const sx = scaleX ?? scale;
  const sy = scaleY ?? scale;

  const isIdentity =
    Math.abs(dYawRad) < 1e-7 &&
    Math.abs(dPitchRad) < 1e-7 &&
    Math.abs(sx - 1) < 1e-7 &&
    Math.abs(sy - 1) < 1e-7 &&
    Math.abs(rotateRad) < 1e-7;

  if (isIdentity) {
    return startVerts;
  }

  const count = startVerts.length;
  if (count === 0) return startVerts;

  // Compute centroid with circular mean for yaw to handle +-PI wrap
  let sumSin = 0;
  let sumCos = 0;
  let sumPitch = 0;
  for (const [y, p] of startVerts) {
    sumSin += Math.sin(y);
    sumCos += Math.cos(y);
    sumPitch += p;
  }
  const avgYaw = Math.atan2(sumSin / count, sumCos / count);
  const avgPitch = sumPitch / count;

  const cosR = Math.cos(rotateRad);
  const sinR = Math.sin(rotateRad);

  return startVerts.map(([yaw, pitch]) => {
    const dy = wrapYawRad(yaw - avgYaw) * sx;
    const dp = (pitch - avgPitch) * sy;
    const rotY = dy * cosR - dp * sinR;
    const rotP = dy * sinR + dp * cosR;
    const finalYaw = wrapYawRad(avgYaw + rotY + dYawRad);
    const finalPitch = clampPitchRad(avgPitch + rotP + dPitchRad);
    return [roundRad(finalYaw), roundRad(finalPitch)];
  });
}

/**
 * Computes spherical centroid `[yawRad, pitchRad]` of a vertex ring.
 */
export function computeSphericalCentroidRad(verticesRad: [number, number][]): [number, number] {
  if (verticesRad.length === 0) return [0, 0];
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (const [yaw, pitch] of verticesRad) {
    const cosP = Math.cos(pitch);
    sumX += cosP * Math.sin(yaw);
    sumY += cosP * Math.cos(yaw);
    sumZ += Math.sin(pitch);
  }
  const avgYaw = Math.atan2(sumX, sumY);
  const avgPitch = Math.atan2(sumZ, Math.hypot(sumX, sumY));
  return [roundRad(avgYaw), roundRad(avgPitch)];
}

/**
 * Applies manual per-lot vertex overrides (both absolute `verticesRad` and parametric `delta`)
 * on top of projected lots. Preserves 100% exact output for existing overrides.
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
    if (!ov) return lot;

    const hasVertices = Array.isArray(ov.verticesRad) && ov.verticesRad.length >= 3;
    const hasDelta = Boolean(ov.delta);

    if (!hasVertices && !hasDelta) {
      if (ov.locked !== undefined) {
        return { ...lot, locked: ov.locked };
      }
      return lot;
    }

    const finalVerticesRad = applyOverride(lot.verticesRad, ov);
    if (finalVerticesRad.length < 3) return lot;

    const polygonRad = densifySphericalVerticesRad(finalVerticesRad, 2);
    const labelRad = ov.labelRad ?? computeSphericalCentroidRad(finalVerticesRad);

    return {
      ...lot,
      verticesRad: finalVerticesRad,
      polygonRad,
      labelRad,
      locked: ov.locked,
    };
  });
}
