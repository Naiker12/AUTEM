import proj4 from "proj4";
import cadReference from "@/data/villa-paraiso/cad-reference.json";

// MAGNA-SIRGAS / Colombia Bogotá zone (sistema de coordenadas del plano CAD)
proj4.defs(
  "EPSG:3116",
  "+proj=tmerc +lat_0=4.596200417 +lon_0=-74.07750791 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

const t = cadReference.transform;
const det = t.a * t.e - t.b * t.d;

/** Convierte un punto del plano SVG a [lat, lng] WGS84. */
export function svgToLatLng(x: number, y: number): [number, number] {
  const dx = x - t.c;
  const dy = y - t.f;
  const cadX = (t.e * dx - t.b * dy) / det;
  const cadY = (-t.d * dx + t.a * dy) / det;
  const [lon, lat] = proj4("EPSG:3116", "EPSG:4326", [cadX, cadY]);
  return [lat, lon];
}

/** Portería / acceso principal en coordenadas geográficas. */
export const ENTRANCE_LATLNG: [number, number] = svgToLatLng(
  cadReference.entranceAnnotation.svg.x,
  cadReference.entranceAnnotation.svg.y,
);

const R = 6_371_000;
const rad = Math.PI / 180;

export function metersBetween(a: [number, number], b: [number, number]) {
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rumbo (0 = norte, sentido horario) de a hacia b en grados. */
export function bearingBetween(a: [number, number], b: [number, number]) {
  const y = Math.sin((b[1] - a[1]) * rad) * Math.cos(b[0] * rad);
  const x =
    Math.cos(a[0] * rad) * Math.sin(b[0] * rad) -
    Math.sin(a[0] * rad) * Math.cos(b[0] * rad) * Math.cos((b[1] - a[1]) * rad);
  return (Math.atan2(y, x) / rad + 360) % 360;
}

/** Interpola ángulos por el camino más corto (evita saltos 359° → 0°). */
export function lerpAngle(from: number, to: number, factor: number) {
  const delta = ((((to - from) % 360) + 540) % 360) - 180;
  return (from + delta * factor + 360) % 360;
}
