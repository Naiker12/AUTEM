import { projectGpsPointToPanoramaRad, radToDegPair } from "./project-lots";
import type { PanoramaCameraConfig, PanoramaControlPoint } from "./types";

export interface CalibrationFitOptions {
  fitDroneOffset?: boolean;
  fitTilt?: boolean;
  maxIterations?: number;
}

export interface CalibrationFitResult {
  config: PanoramaCameraConfig;
  rmsErrorDeg: number;
  pointErrorsDeg: {
    id: string;
    label: string;
    yawErrorDeg: number;
    pitchErrorDeg: number;
    angularErrorDeg: number;
  }[];
}

function wrapAngleDeg(deg: number): number {
  let d = deg;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/**
 * Computes per-control-point angular errors (in degrees) and RMS error for a given config.
 */
export function evaluateCalibration(
  config: PanoramaCameraConfig,
  controlPoints: PanoramaControlPoint[],
): CalibrationFitResult {
  if (controlPoints.length === 0) {
    return { config, rmsErrorDeg: 0, pointErrorsDeg: [] };
  }

  let weightedSqSum = 0;
  let totalWeight = 0;
  const pointErrorsDeg: CalibrationFitResult["pointErrorsDeg"] = [];

  for (const cp of controlPoints) {
    const [predYawRad, predPitchRad] = projectGpsPointToPanoramaRad(
      cp.worldGps[0],
      cp.worldGps[1],
      config,
    );
    const [predYawDeg, predPitchDeg] = radToDegPair([predYawRad, predPitchRad]);
    const [obsYawDeg, obsPitchDeg] = cp.panoDeg ?? radToDegPair(cp.panoRad);

    const yawErrorDeg = wrapAngleDeg(predYawDeg - obsYawDeg);
    const pitchErrorDeg = predPitchDeg - obsPitchDeg;
    const cosPitch = Math.cos((obsPitchDeg * Math.PI) / 180);
    const angularErrorDeg = Math.hypot(yawErrorDeg * cosPitch, pitchErrorDeg);

    const w = cp.weight ?? 1;
    weightedSqSum += w * angularErrorDeg * angularErrorDeg;
    totalWeight += w;

    pointErrorsDeg.push({
      id: cp.id,
      label: cp.label,
      yawErrorDeg: Math.round(yawErrorDeg * 100) / 100,
      pitchErrorDeg: Math.round(pitchErrorDeg * 100) / 100,
      angularErrorDeg: Math.round(angularErrorDeg * 100) / 100,
    });
  }

  const rmsErrorDeg =
    totalWeight > 0 ? Math.round(Math.sqrt(weightedSqSum / totalWeight) * 100) / 100 : 0;

  return {
    config,
    rmsErrorDeg,
    pointErrorsDeg,
  };
}

/**
 * Fits camera parameters (`yawOffsetDeg`, `heightAboveGroundM`, `tilt`, and optional
 * horizontal drone offset `offsetEastM`/`offsetNorthM`) from control points using
 * coordinate-descent with step decay and mild regularization.
 */
export function calibratePanoramaCamera(
  initialConfig: PanoramaCameraConfig,
  controlPoints: PanoramaControlPoint[],
  options: CalibrationFitOptions = {},
): CalibrationFitResult {
  if (controlPoints.length < 2) {
    return evaluateCalibration(initialConfig, controlPoints);
  }

  const { fitDroneOffset = false, fitTilt = true, maxIterations = 250 } = options;

  let best: PanoramaCameraConfig = {
    ...initialConfig,
    camera: {
      ...initialConfig.camera,
      offsetEastM: initialConfig.camera.offsetEastM ?? 0,
      offsetNorthM: initialConfig.camera.offsetNorthM ?? 0,
    },
    tilt: {
      pitchDeg: initialConfig.tilt?.pitchDeg ?? 0,
      rollDeg: initialConfig.tilt?.rollDeg ?? 0,
    },
  };

  function objective(cfg: PanoramaCameraConfig): number {
    const evalRes = evaluateCalibration(cfg, controlPoints);
    const dE = cfg.camera.offsetEastM ?? 0;
    const dN = cfg.camera.offsetNorthM ?? 0;
    const pitch = cfg.tilt.pitchDeg;
    const roll = cfg.tilt.rollDeg;
    const reg = 0.0025 * (dE * dE + dN * dN) + 0.04 * (pitch * pitch + roll * roll);
    return evalRes.rmsErrorDeg * evalRes.rmsErrorDeg + reg;
  }

  const steps = {
    yawOffsetDeg: 2.0,
    heightAboveGroundM: 5.0,
    pitchDeg: 0.5,
    rollDeg: 0.5,
    offsetEastM: 2.0,
    offsetNorthM: 2.0,
  };

  function mutate(
    cfg: PanoramaCameraConfig,
    key: keyof typeof steps,
    delta: number,
  ): PanoramaCameraConfig {
    if (key === "yawOffsetDeg") {
      let nextYaw = (cfg.yawOffsetDeg + delta) % 360;
      if (nextYaw < 0) nextYaw += 360;
      return { ...cfg, yawOffsetDeg: Math.round(nextYaw * 100) / 100 };
    }
    if (key === "heightAboveGroundM") {
      const nextH = Math.max(20, Math.min(600, cfg.camera.heightAboveGroundM + delta));
      return {
        ...cfg,
        camera: { ...cfg.camera, heightAboveGroundM: Math.round(nextH * 10) / 10 },
      };
    }
    if (key === "pitchDeg" || key === "rollDeg") {
      const nextTilt = Math.max(-12, Math.min(12, cfg.tilt[key] + delta));
      return {
        ...cfg,
        tilt: { ...cfg.tilt, [key]: Math.round(nextTilt * 100) / 100 },
      };
    }
    const nextOff = Math.max(-45, Math.min(45, (cfg.camera[key] ?? 0) + delta));
    return {
      ...cfg,
      camera: { ...cfg.camera, [key]: Math.round(nextOff * 10) / 10 },
    };
  }

  const activeKeys: (keyof typeof steps)[] = ["yawOffsetDeg", "heightAboveGroundM"];
  if (fitTilt && controlPoints.length >= 4) {
    activeKeys.push("pitchDeg", "rollDeg");
  }
  if (fitDroneOffset && controlPoints.length >= 6) {
    activeKeys.push("offsetEastM", "offsetNorthM");
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    let improved = false;
    for (const k of activeKeys) {
      const curLoss = objective(best);
      const step = steps[k];
      if (step < 1e-3) continue;
      const cPlus = mutate(best, k, step);
      const cMinus = mutate(best, k, -step);
      const lPlus = objective(cPlus);
      const lMinus = objective(cMinus);

      if (lPlus < curLoss && lPlus <= lMinus) {
        best = cPlus;
        improved = true;
      } else if (lMinus < curLoss && lMinus < lPlus) {
        best = cMinus;
        improved = true;
      }
    }
    if (!improved) {
      for (const k of activeKeys) {
        steps[k] *= 0.65;
      }
      if (steps.yawOffsetDeg < 0.01 && steps.heightAboveGroundM < 0.05) {
        break;
      }
    }
  }

  return evaluateCalibration(best, controlPoints);
}
