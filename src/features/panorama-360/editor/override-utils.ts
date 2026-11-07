import {
  applyOverride,
  clampPitchRad,
  projectCadPointToPanoramaRad,
  roundRad,
  unprojectPanoramaRadToCadPoint,
  wrapYawRad,
} from "../project-lots";
import type {
  PanoramaCameraConfig,
  PanoramaControlPoint,
  PanoramaLotDelta,
  PanoramaLotOverridesMap,
  ProjectedPanoramaLot,
} from "../types";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export interface TransformLotsWithPerspectiveInput {
  targetLotIds: string[];
  baseLots: ProjectedPanoramaLot[];
  currentOverrides: PanoramaLotOverridesMap;
  config: PanoramaCameraConfig;
  dYawDeg?: number;
  dPitchDeg?: number;
  deltaEastM?: number;
  deltaNorthM?: number;
  scaleFactor?: number;
  scaleXFactor?: number;
  scaleYFactor?: number;
  rotateDeg?: number;
  usePerspectiveMeters?: boolean;
}

/**
 * Angular distance in degrees between two spherical points `[yawRad, pitchRad]`.
 */
export function sphericalAngularDistanceDeg(a: [number, number], b: [number, number]): number {
  const dYaw = wrapYawRad(a[0] - b[0]);
  const dPitch = a[1] - b[1];
  const cosP = Math.cos((a[1] + b[1]) * 0.5);
  return Math.hypot(dYaw * cosP, dPitch) * RAD_TO_DEG;
}

/**
 * Transforms one or more lots in ground-plane CAD meters (preserving perspective)
 * or in spherical screen angles, returning an updated `PanoramaLotOverridesMap`.
 */
export function transformLotsWithPerspective(
  input: TransformLotsWithPerspectiveInput,
): PanoramaLotOverridesMap {
  const {
    targetLotIds,
    baseLots,
    currentOverrides,
    config,
    dYawDeg = 0,
    dPitchDeg = 0,
    deltaEastM = 0,
    deltaNorthM = 0,
    scaleFactor = 1,
    scaleXFactor,
    scaleYFactor,
    rotateDeg = 0,
    usePerspectiveMeters = true,
  } = input;

  if (targetLotIds.length === 0) return currentOverrides;

  const sx = (scaleXFactor ?? 1) * scaleFactor;
  const sy = (scaleYFactor ?? 1) * scaleFactor;
  const rotRad = rotateDeg * DEG_TO_RAD;
  const dYawRad = dYawDeg * DEG_TO_RAD;
  const dPitchRad = dPitchDeg * DEG_TO_RAD;

  const lotMap = new Map<string, ProjectedPanoramaLot>();
  for (const l of baseLots) {
    lotMap.set(l.id, l);
  }

  const targetLots = targetLotIds
    .map((id) => lotMap.get(id))
    .filter((l): l is ProjectedPanoramaLot => Boolean(l && l.verticesRad.length >= 3));

  if (targetLots.length === 0) return currentOverrides;

  const nowIso = new Date().toISOString();
  const nextOverrides: PanoramaLotOverridesMap = { ...currentOverrides };

  if (!usePerspectiveMeters) {
    let sumSin = 0;
    let sumCos = 0;
    let sumPitch = 0;
    let totalPts = 0;

    for (const lot of targetLots) {
      const verts = currentOverrides[lot.id]?.verticesRad ?? lot.verticesRad;
      for (const [y, p] of verts) {
        sumSin += Math.sin(y);
        sumCos += Math.cos(y);
        sumPitch += p;
        totalPts++;
      }
    }
    if (totalPts === 0) return currentOverrides;

    const groupYaw = Math.atan2(sumSin / totalPts, sumCos / totalPts);
    const groupPitch = sumPitch / totalPts;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);

    for (const lot of targetLots) {
      const prevOv = currentOverrides[lot.id];
      const currentVerts = prevOv?.verticesRad ?? lot.verticesRad;
      const newVerts: [number, number][] = currentVerts.map(([yaw, pitch]) => {
        const dy = wrapYawRad(yaw - groupYaw) * sx;
        const dp = (pitch - groupPitch) * sy;
        const ry = dy * cosR - dp * sinR;
        const rp = dy * sinR + dp * cosR;
        return [
          roundRad(wrapYawRad(groupYaw + ry + dYawRad)),
          roundRad(clampPitchRad(groupPitch + rp + dPitchRad)),
        ];
      });

      const prevDelta: PanoramaLotDelta = prevOv?.delta ?? {
        dYawRad: 0,
        dPitchRad: 0,
        scale: 1,
        rotateRad: 0,
      };

      nextOverrides[lot.id] = {
        ...prevOv,
        verticesRad: newVerts,
        delta: {
          ...prevDelta,
          dYawRad: roundRad(prevDelta.dYawRad + dYawRad),
          dPitchRad: roundRad(prevDelta.dPitchRad + dPitchRad),
          scale: Math.round(prevDelta.scale * scaleFactor * 10000) / 10000,
          scaleX: Math.round((prevDelta.scaleX ?? prevDelta.scale) * sx * 10000) / 10000,
          scaleY: Math.round((prevDelta.scaleY ?? prevDelta.scale) * sy * 10000) / 10000,
          rotateRad: roundRad(prevDelta.rotateRad + rotRad),
        },
        updatedAt: nowIso,
      };
    }

    return nextOverrides;
  }

  // Ground-plane perspective-aware transformation in CAD meters (EPSG:3116)
  const lotsCadVerts = new Map<string, [number, number][]>();
  let sumE = 0;
  let sumN = 0;
  let sumSin = 0;
  let sumCos = 0;
  let sumPitch = 0;
  let countPts = 0;

  for (const lot of targetLots) {
    const vertsRad = currentOverrides[lot.id]?.verticesRad ?? lot.verticesRad;
    const cadVerts = vertsRad.map(([y, p]) => unprojectPanoramaRadToCadPoint(y, p, config));
    lotsCadVerts.set(lot.id, cadVerts);
    for (let i = 0; i < cadVerts.length; i++) {
      sumE += cadVerts[i][0];
      sumN += cadVerts[i][1];
      sumSin += Math.sin(vertsRad[i][0]);
      sumCos += Math.cos(vertsRad[i][0]);
      sumPitch += vertsRad[i][1];
      countPts++;
    }
  }

  if (countPts === 0) return currentOverrides;

  const centerE = sumE / countPts;
  const centerN = sumN / countPts;
  const avgYaw = Math.atan2(sumSin / countPts, sumCos / countPts);
  const avgPitch = sumPitch / countPts;

  let shiftEastM = deltaEastM;
  let shiftNorthM = deltaNorthM;

  if (Math.abs(dYawRad) > 1e-7 || Math.abs(dPitchRad) > 1e-7) {
    const [origE, origN] = unprojectPanoramaRadToCadPoint(avgYaw, avgPitch, config);
    const [destE, destN] = unprojectPanoramaRadToCadPoint(
      wrapYawRad(avgYaw + dYawRad),
      clampPitchRad(avgPitch + dPitchRad),
      config,
    );
    shiftEastM += destE - origE;
    shiftNorthM += destN - origN;
  }

  const nadirPt = unprojectPanoramaRadToCadPoint(avgYaw, -Math.PI / 2 + 0.01, config);
  const rayAngle = Math.atan2(centerE - nadirPt[0], centerN - nadirPt[1]);
  const uRightE = Math.cos(rayAngle);
  const uRightN = -Math.sin(rayAngle);
  const uFwdE = Math.sin(rayAngle);
  const uFwdN = Math.cos(rayAngle);

  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  for (const lot of targetLots) {
    const cadVerts = lotsCadVerts.get(lot.id);
    if (!cadVerts) continue;

    const newVertsRad: [number, number][] = cadVerts.map(([e, n]) => {
      const relE = e - centerE;
      const relN = n - centerN;

      const localX = (relE * uRightE + relN * uRightN) * sx;
      const localY = (relE * uFwdE + relN * uFwdN) * sy;

      const rotX = localX * cosR - localY * sinR;
      const rotY = localX * sinR + localY * cosR;

      const finalE = centerE + rotX * uRightE + rotY * uFwdE + shiftEastM;
      const finalN = centerN + rotX * uRightN + rotY * uFwdN + shiftNorthM;

      return projectCadPointToPanoramaRad(finalE, finalN, config);
    });

    const prevOv = currentOverrides[lot.id];
    const prevDelta: PanoramaLotDelta = prevOv?.delta ?? {
      dYawRad: 0,
      dPitchRad: 0,
      scale: 1,
      rotateRad: 0,
      offsetEastM: 0,
      offsetNorthM: 0,
    };

    nextOverrides[lot.id] = {
      ...prevOv,
      verticesRad: newVertsRad,
      delta: {
        dYawRad: roundRad(prevDelta.dYawRad + dYawRad),
        dPitchRad: roundRad(prevDelta.dPitchRad + dPitchRad),
        scale: Math.round(prevDelta.scale * scaleFactor * 10000) / 10000,
        scaleX: Math.round((prevDelta.scaleX ?? prevDelta.scale) * sx * 10000) / 10000,
        scaleY: Math.round((prevDelta.scaleY ?? prevDelta.scale) * sy * 10000) / 10000,
        rotateRad: roundRad(prevDelta.rotateRad + rotRad),
        offsetEastM: Math.round(((prevDelta.offsetEastM ?? 0) + shiftEastM) * 100) / 100,
        offsetNorthM: Math.round(((prevDelta.offsetNorthM ?? 0) + shiftNorthM) * 100) / 100,
      },
      updatedAt: nowIso,
    };
  }

  return nextOverrides;
}

export interface MoveLotVertexWithSnapInput {
  lotId: string;
  vertexIndex: number;
  newYawRad: number;
  newPitchRad: number;
  baseLots: ProjectedPanoramaLot[];
  currentOverrides: PanoramaLotOverridesMap;
  enableSnap?: boolean;
  snapRadiusRad?: number;
}

/**
 * Moves a single corner vertex of `lotId` to `[newYawRad, newPitchRad]`.
 * When `enableSnap` is true, any vertex of neighboring lots within `snapRadiusRad`
 * of the original vertex position is moved together so shared boundaries remain seamless.
 */
export function moveLotVertexWithSnap(input: MoveLotVertexWithSnapInput): PanoramaLotOverridesMap {
  const {
    lotId,
    vertexIndex,
    newYawRad,
    newPitchRad,
    baseLots,
    currentOverrides,
    enableSnap = true,
    snapRadiusRad = 0.0045,
  } = input;

  const targetLot = baseLots.find((l) => l.id === lotId);
  if (!targetLot) return currentOverrides;

  const baseVerts = currentOverrides[lotId]?.verticesRad ?? targetLot.verticesRad;
  if (vertexIndex < 0 || vertexIndex >= baseVerts.length) return currentOverrides;

  const origVertex = baseVerts[vertexIndex];
  const clampedNew: [number, number] = [
    roundRad(wrapYawRad(newYawRad)),
    roundRad(clampPitchRad(newPitchRad)),
  ];

  const nowIso = new Date().toISOString();
  const nextOverrides: PanoramaLotOverridesMap = { ...currentOverrides };

  const updatedTargetVerts = baseVerts.map((v, idx) => (idx === vertexIndex ? clampedNew : v));
  nextOverrides[lotId] = {
    ...currentOverrides[lotId],
    verticesRad: updatedTargetVerts,
    updatedAt: nowIso,
  };

  if (!enableSnap) {
    return nextOverrides;
  }

  for (const other of baseLots) {
    if (other.id === lotId) continue;
    const otherVerts = currentOverrides[other.id]?.verticesRad ?? other.verticesRad;
    let touched = false;
    const nextOtherVerts = otherVerts.map((v) => {
      const dYaw = wrapYawRad(v[0] - origVertex[0]);
      const dPitch = v[1] - origVertex[1];
      const dist = Math.hypot(dYaw, dPitch);
      if (dist <= snapRadiusRad) {
        touched = true;
        return clampedNew;
      }
      return v;
    });

    if (touched) {
      nextOverrides[other.id] = {
        ...currentOverrides[other.id],
        verticesRad: nextOtherVerts,
        updatedAt: nowIso,
      };
    }
  }

  return nextOverrides;
}

export interface LotConfidenceInfo {
  id: string;
  lotId: string;
  nearestControlPointId: string | null;
  nearestControlPointDeg: number;
  locked: boolean;
  hasOverride: boolean;
  isDoubtful: boolean;
}

/**
 * Evaluates angular distance to nearest control point for every lot.
 * Marks a lot as "doubtful" (`isDoubtful = true`) if its distance to the nearest control
 * point is >= `doubtfulThresholdDeg` (default 20°) AND it is not `locked`.
 */
export function computeLotsConfidence(
  lots: ProjectedPanoramaLot[],
  controlPoints: PanoramaControlPoint[],
  overrides: PanoramaLotOverridesMap,
  doubtfulThresholdDeg = 20,
): LotConfidenceInfo[] {
  const result: LotConfidenceInfo[] = [];

  for (const lot of lots) {
    const ov = overrides[lot.id];
    const locked = Boolean(ov?.locked);

    let minDeg = Infinity;
    let nearestId: string | null = null;

    for (const cp of controlPoints) {
      const cpRad: [number, number] = cp.panoRad ?? [
        (cp.panoDeg[0] * Math.PI) / 180,
        (cp.panoDeg[1] * Math.PI) / 180,
      ];
      const distDeg = sphericalAngularDistanceDeg(lot.labelRad, cpRad);
      if (distDeg < minDeg) {
        minDeg = distDeg;
        nearestId = cp.id;
      }
    }

    const nearestControlPointDeg = Number.isFinite(minDeg) ? Math.round(minDeg * 10) / 10 : 180;
    const isDoubtful = nearestControlPointDeg >= doubtfulThresholdDeg && !locked;

    result.push({
      id: lot.id,
      lotId: lot.id,
      nearestControlPointId: nearestId,
      nearestControlPointDeg,
      locked,
      hasOverride: Boolean(ov?.verticesRad || ov?.delta),
      isDoubtful,
    });
  }

  return result;
}

export interface YawSectorCoverage {
  sectorIndex: number;
  startDeg: number;
  endDeg: number;
  count: number;
  controlPointCount: number;
  lotCount: number;
  needsControlPoints: boolean;
}

export interface YawCoverageSummary {
  sectors: YawSectorCoverage[];
  coveragePercent: number;
  suggestionText: string;
  missingSuggestions: string[];
}

/**
 * Computes 360° coverage across 12 sectors of 30° yaw each (-180° to +180°).
 */
export function computeControlPointYawCoverage(
  controlPoints: PanoramaControlPoint[],
  lots: ProjectedPanoramaLot[] = [],
): YawCoverageSummary {
  const sectors: YawSectorCoverage[] = Array.from({ length: 12 }, (_, idx) => ({
    sectorIndex: idx,
    startDeg: -180 + idx * 30,
    endDeg: -150 + idx * 30,
    count: 0,
    controlPointCount: 0,
    lotCount: 0,
    needsControlPoints: false,
  }));

  for (const lot of lots) {
    if (!lot?.labelRad) continue;
    const yawDeg = wrapYawRad(lot.labelRad[0]) * RAD_TO_DEG;
    const idx = Math.min(11, Math.max(0, Math.floor((yawDeg + 180) / 30)));
    sectors[idx].lotCount++;
  }

  for (const cp of controlPoints) {
    const yawRad = cp.panoRad ? cp.panoRad[0] : (cp.panoDeg[0] * Math.PI) / 180;
    const yawDeg = wrapYawRad(yawRad) * RAD_TO_DEG;
    const idx = Math.min(11, Math.max(0, Math.floor((yawDeg + 180) / 30)));
    sectors[idx].count++;
    sectors[idx].controlPointCount++;
  }

  const coveredCount = sectors.filter((s) => s.count > 0).length;
  const coveragePercent = Math.round((coveredCount / 12) * 100);

  const missingSuggestions: string[] = [];
  for (const s of sectors) {
    if (s.count === 0) {
      s.needsControlPoints = true;
      missingSuggestions.push(`${s.startDeg}°..${s.endDeg}°`);
    }
  }

  const suggestionText =
    missingSuggestions.length > 0
      ? `Faltan puntos de control en yaw ${missingSuggestions.slice(0, 4).join(", ")}${
          missingSuggestions.length > 4 ? "…" : ""
        }`
      : "Cobertura completa en los 12 sectores de 30°";

  return {
    sectors,
    coveragePercent,
    suggestionText,
    missingSuggestions,
  };
}

/**
 * Safely merges remote overrides from Supabase with local overrides in memory,
 * preserving newer `updatedAt` timestamps and never wiping out untouched lots.
 */
export function mergeOverridesSafe(
  remote: PanoramaLotOverridesMap | null | undefined,
  local: PanoramaLotOverridesMap,
  deletedLotIds: Set<string> = new Set(),
): PanoramaLotOverridesMap {
  const merged: PanoramaLotOverridesMap = {};

  if (remote) {
    for (const [id, rOv] of Object.entries(remote)) {
      if (!deletedLotIds.has(id)) {
        merged[id] = rOv;
      }
    }
  }

  for (const [id, lOv] of Object.entries(local)) {
    if (deletedLotIds.has(id)) continue;
    const existing = merged[id];
    if (!existing) {
      merged[id] = lOv;
      continue;
    }
    const rTime = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;
    const lTime = lOv.updatedAt ? Date.parse(lOv.updatedAt) : Date.now();
    if (lTime >= rTime) {
      merged[id] = lOv;
    }
  }

  return merged;
}

export { applyOverride };
