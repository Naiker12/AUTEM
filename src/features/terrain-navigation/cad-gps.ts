import proj4 from "proj4";
import cad from "@/data/villa-paraiso-cad-reference.json";
import { UNITS_PER_METER } from "./geo-constants";

// MAGNA-SIRGAS / Colombia Bogotá zone (EPSG:3116)
proj4.defs(
  "EPSG:3116",
  "+proj=tmerc +lat_0=4.596200417 +lon_0=-74.07750791 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

const t = cad.transform;

export function gpsToCad(lat: number, lon: number): { x: number; y: number } {
  const [e, n] = proj4("EPSG:4326", "EPSG:3116", [lon, lat]);
  return { x: e, y: n };
}

export function cadToGps(x: number, y: number): { latitude: number; longitude: number } {
  const [lon, lat] = proj4("EPSG:3116", "EPSG:4326", [x, y]);
  return { latitude: lat, longitude: lon };
}

export function cadToSvg(x: number, y: number): { x: number; y: number } {
  return {
    x: t.a * x + t.b * y + t.c,
    y: t.d * x + t.e * y + t.f,
  };
}

export function svgToCad(x: number, y: number): { x: number; y: number } {
  const det = t.a * t.e - t.b * t.d;
  const dx = x - t.c;
  const dy = y - t.f;
  return {
    x: (t.e * dx - t.b * dy) / det,
    y: (-t.d * dx + t.a * dy) / det,
  };
}

export function gpsToSvgViaCad(lat: number, lon: number): { x: number; y: number } {
  const cadPt = gpsToCad(lat, lon);
  return cadToSvg(cadPt.x, cadPt.y);
}

export function svgToGpsViaCad(x: number, y: number): { latitude: number; longitude: number } {
  const cadPt = svgToCad(x, y);
  return cadToGps(cadPt.x, cadPt.y);
}

export { UNITS_PER_METER };
