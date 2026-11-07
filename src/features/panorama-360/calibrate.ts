import { projectGpsPointToPanoramaRad, radToDegPair } from "./project-lots";
import type { PanoramaCameraConfig, PanoramaControlPoint } from "./types";

export interface CalibrationFitOptions {
  fitDroneOffset?: boolean;
  fitTilt?: boolean;
  fitGroundSlope?: boolean;
  maxIterations?: number;
}

export interface CalibrationFitResult {
  config: PanoramaCameraConfig;
  rmsErrorDeg: number;
  rmsErrorMeters: number;
  meanErrorMeters: number;
  pointErrorsDeg: {
    id: string;
    label: string;
    yawErrorDeg: number;
    pitchErrorDeg: number;
    angularErrorDeg: number;
    errorMeters: number;
  }[];
}

export interface LeaveOneOutResult {
  looRmsErrorDeg: number;
  looMeanErrorMeters: number;
}

function wrapAngleDeg(deg: number): number {
  let d = deg;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/**
 * Estimates ground-plane error in meters from angular error (degrees) at a given
 * downward pitch angle and camera height above ground.
 */
export function estimateGroundErrorMeters(
  angularErrorDeg: number,
  pitchDeg: number,
  heightAboveGroundM: number,
): number {
  const clampedPitchDeg = Math.min(-4, Math.max(-88, pitchDeg));
  const sinDepr = Math.sin(Math.abs(clampedPitchDeg) * (Math.PI / 180));
  const slantDistanceM = Math.max(heightAboveGroundM, heightAboveGroundM / Math.max(0.08, sinDepr));
  const angularErrorRad = (angularErrorDeg * Math.PI) / 180;
  return Math.round(slantDistanceM * angularErrorRad * 10) / 10;
}

/**
 * Computes per-control-point angular errors (in degrees and meters) and RMS error for a given config.
 */
export function evaluateCalibration(
  config: PanoramaCameraConfig,
  controlPoints: PanoramaControlPoint[],
): CalibrationFitResult {
  if (controlPoints.length === 0) {
    return {
      config,
      rmsErrorDeg: 0,
      rmsErrorMeters: 0,
      meanErrorMeters: 0,
      pointErrorsDeg: [],
    };
  }

  let weightedSqSum = 0;
  let weightedSqSumMeters = 0;
  let weightedSumMeters = 0;
  let totalWeight = 0;
  const pointErrorsDeg: CalibrationFitResult["pointErrorsDeg"] = [];
  const heightM = Math.max(10, config.camera.heightAboveGroundM);

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
    const errorMeters = estimateGroundErrorMeters(angularErrorDeg, obsPitchDeg, heightM);

    const w = cp.weight ?? 1;
    weightedSqSum += w * angularErrorDeg * angularErrorDeg;
    weightedSqSumMeters += w * errorMeters * errorMeters;
    weightedSumMeters += w * errorMeters;
    totalWeight += w;

    pointErrorsDeg.push({
      id: cp.id,
      label: cp.label,
      yawErrorDeg: Math.round(yawErrorDeg * 100) / 100,
      pitchErrorDeg: Math.round(pitchErrorDeg * 100) / 100,
      angularErrorDeg: Math.round(angularErrorDeg * 100) / 100,
      errorMeters,
    });
  }

  const rmsErrorDeg =
    totalWeight > 0 ? Math.round(Math.sqrt(weightedSqSum / totalWeight) * 100) / 100 : 0;
  const rmsErrorMeters =
    totalWeight > 0 ? Math.round(Math.sqrt(weightedSqSumMeters / totalWeight) * 10) / 10 : 0;
  const meanErrorMeters =
    totalWeight > 0 ? Math.round((weightedSumMeters / totalWeight) * 10) / 10 : 0;

  return {
    config,
    rmsErrorDeg,
    rmsErrorMeters,
    meanErrorMeters,
    pointErrorsDeg,
  };
}

/**
 * Fits camera parameters (`yawOffsetDeg`, `heightAboveGroundM`, `tilt`, optional
 * horizontal drone offset `offsetEastM`/`offsetNorthM`, and optional ground slope)
 * from control points using coordinate-descent with step decay and mild regularization.
 */
export function calibratePanoramaCamera(
  initialConfig: PanoramaCameraConfig,
  controlPoints: PanoramaControlPoint[],
  options: CalibrationFitOptions = {},
): CalibrationFitResult {
  if (controlPoints.length < 2) {
    return evaluateCalibration(initialConfig, controlPoints);
  }

  const {
    fitDroneOffset = false,
    fitTilt = true,
    fitGroundSlope = false,
    maxIterations = 250,
  } = options;

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
    groundSlope: fitGroundSlope
      ? {
          enabled: true,
          slopeEast: initialConfig.groundSlope?.slopeEast ?? 0,
          slopeNorth: initialConfig.groundSlope?.slopeNorth ?? 0,
          curvature: initialConfig.groundSlope?.curvature ?? 0,
        }
      : initialConfig.groundSlope,
  };

  function objective(cfg: PanoramaCameraConfig): number {
    const evalRes = evaluateCalibration(cfg, controlPoints);
    const dE = cfg.camera.offsetEastM ?? 0;
    const dN = cfg.camera.offsetNorthM ?? 0;
    const pitch = cfg.tilt.pitchDeg;
    const roll = cfg.tilt.rollDeg;
    const se = cfg.groundSlope?.enabled ? (cfg.groundSlope.slopeEast ?? 0) : 0;
    const sn = cfg.groundSlope?.enabled ? (cfg.groundSlope.slopeNorth ?? 0) : 0;
    const reg =
      0.0025 * (dE * dE + dN * dN) +
      0.04 * (pitch * pitch + roll * roll) +
      12.0 * (se * se + sn * sn);
    return evalRes.rmsErrorDeg * evalRes.rmsErrorDeg + reg;
  }

  const steps = {
    yawOffsetDeg: 2.0,
    heightAboveGroundM: 5.0,
    pitchDeg: 0.5,
    rollDeg: 0.5,
    offsetEastM: 2.0,
    offsetNorthM: 2.0,
    slopeEast: 0.015,
    slopeNorth: 0.015,
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
    if (key === "slopeEast" || key === "slopeNorth") {
      const prevSlope = cfg.groundSlope ?? {
        enabled: true,
        slopeEast: 0,
        slopeNorth: 0,
        curvature: 0,
      };
      const nextVal = Math.max(-0.15, Math.min(0.15, (prevSlope[key] ?? 0) + delta));
      return {
        ...cfg,
        groundSlope: {
          ...prevSlope,
          enabled: true,
          [key]: Math.round(nextVal * 10000) / 10000,
        },
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
  if (fitGroundSlope && controlPoints.length >= 6) {
    activeKeys.push("slopeEast", "slopeNorth");
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    let improved = false;
    for (const k of activeKeys) {
      const curLoss = objective(best);
      const step = steps[k];
      if (step < 1e-4) continue;
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

/**
 * Leave-One-Out (LOO) cross-validation to check whether adding extra model degrees
 * of freedom (like ground slope) genuinely improves out-of-sample accuracy.
 */
export function evaluateLeaveOneOutCalibration(
  initialConfig: PanoramaCameraConfig,
  controlPoints: PanoramaControlPoint[],
  options: CalibrationFitOptions = {},
): LeaveOneOutResult {
  if (controlPoints.length < 4) {
    const evalRes = evaluateCalibration(initialConfig, controlPoints);
    return {
      looRmsErrorDeg: evalRes.rmsErrorDeg,
      looMeanErrorMeters: evalRes.meanErrorMeters,
    };
  }

  let sqDegSum = 0;
  let metersSum = 0;

  for (let i = 0; i < controlPoints.length; i++) {
    const train = controlPoints.filter((_, idx) => idx !== i);
    const heldOut = controlPoints[i];
    const fitted = calibratePanoramaCamera(initialConfig, train, {
      ...options,
      maxIterations: 120,
    });
    const heldEval = evaluateCalibration(fitted.config, [heldOut]);
    const errDeg = heldEval.pointErrorsDeg[0]?.angularErrorDeg ?? 0;
    const errMeters = heldEval.pointErrorsDeg[0]?.errorMeters ?? 0;
    sqDegSum += errDeg * errDeg;
    metersSum += errMeters;
  }

  return {
    looRmsErrorDeg: Math.round(Math.sqrt(sqDegSum / controlPoints.length) * 100) / 100,
    looMeanErrorMeters: Math.round((metersSum / controlPoints.length) * 10) / 10,
  };
}
