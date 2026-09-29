import { fitAffineTransform, type AffineTransform } from "./coordinate-transform";

export interface CalibrationPointInput {
  id: string;
  label: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  svgX: string;
  svgY: string;
}

export interface CalibrationBounds {
  width: number;
  height: number;
}

export const MIN_CONTROL_POINT_DISTANCE_METERS = 25;
export const MAX_GPS_ACCURACY_METERS = 20;

export function hasValidSvgPoint(point: CalibrationPointInput, bounds: CalibrationBounds) {
  const x = Number(point.svgX);
  const y = Number(point.svgY);
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    x <= bounds.width &&
    y >= 0 &&
    y <= bounds.height
  );
}

export function hasUsableGpsCapture(point: CalibrationPointInput) {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Number.isFinite(point.accuracy) &&
    (point.accuracy ?? Number.POSITIVE_INFINITY) <= MAX_GPS_ACCURACY_METERS
  );
}

export function distanceBetweenGpsCaptures(
  first: CalibrationPointInput,
  second: CalibrationPointInput,
) {
  if (
    first.latitude === undefined ||
    first.longitude === undefined ||
    second.latitude === undefined ||
    second.longitude === undefined
  ) {
    return 0;
  }

  const latitudeScale = 111_320;
  const longitudeScale =
    latitudeScale * Math.cos(((first.latitude + second.latitude) / 2) * (Math.PI / 180));
  return Math.hypot(
    (first.latitude - second.latitude) * latitudeScale,
    (first.longitude - second.longitude) * longitudeScale,
  );
}

export interface CalibrationReadiness {
  completedSvg: number;
  completedGps: number;
  hasAccurateGps: boolean;
  hasSeparatedGps: boolean;
  canCalculate: boolean;
  transform: AffineTransform | null;
}

/**
 * Keeps field measurements separate from a draft drawn on the SVG. A transform is only
 * returned when every point is accurate, spatially independent and tied to the same plan.
 */
export function evaluateCalibration(
  points: CalibrationPointInput[],
  bounds: CalibrationBounds,
): CalibrationReadiness {
  const completedSvg = points.filter((point) => hasValidSvgPoint(point, bounds)).length;
  const completedGps = points.filter((point) => point.latitude !== undefined).length;
  const hasAccurateGps = points.every(hasUsableGpsCapture);
  const hasSeparatedGps = points.every((point, index) =>
    points
      .slice(index + 1)
      .every(
        (nextPoint) =>
          distanceBetweenGpsCaptures(point, nextPoint) >= MIN_CONTROL_POINT_DISTANCE_METERS,
      ),
  );
  const canCalculate =
    completedSvg === points.length &&
    completedGps === points.length &&
    hasAccurateGps &&
    hasSeparatedGps;
  const transform = canCalculate
    ? fitAffineTransform(
        points.map((point) => ({
          label: point.label,
          source: { x: point.longitude ?? 0, y: point.latitude ?? 0 },
          target: { x: Number(point.svgX), y: Number(point.svgY) },
        })),
      )
    : null;

  return {
    completedSvg,
    completedGps,
    hasAccurateGps,
    hasSeparatedGps,
    canCalculate: canCalculate && transform !== null,
    transform,
  };
}
