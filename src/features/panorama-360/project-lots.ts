import { gpsToCad, svgToCad } from "@/features/terrain-navigation/cad-gps";
import type { PanoramaCameraConfig, PanoramaLotOverridesMap, ProjectedPanoramaLot } from "./types";

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

  // Remove duplicate closing vertex if present
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
      // Compute spherical centroid via unit vectors on horizontal plane
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
