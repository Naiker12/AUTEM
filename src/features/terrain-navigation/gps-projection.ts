import { applyAffineTransform, type AffineTransform } from "./coordinate-transform";
import type { SvgPoint } from "./types";
export interface GpsPoint {
  latitude: number;
  longitude: number;
}
export function gpsDistance(a: GpsPoint, b: GpsPoint) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function gpsToSvg(gps: GpsPoint, transform: AffineTransform) {
  return applyAffineTransform({ x: gps.longitude, y: gps.latitude }, transform);
}
export function svgToGps(p: SvgPoint, t: AffineTransform): GpsPoint {
  const det = t.a * t.e - t.b * t.d;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12)
    throw new Error("La calibración no tiene inversa.");
  const x = p.x - t.c,
    y = p.y - t.f;
  return { longitude: (t.e * x - t.b * y) / det, latitude: (t.a * y - t.d * x) / det };
}
export function insideGeofence(p: SvgPoint, polygon: SvgPoint[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      inside = !inside;
  }
  return inside;
}
