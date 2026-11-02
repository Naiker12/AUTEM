export const PROJECT_ANCHOR = { lat: 10.436829, lng: -75.356179 };
export const UNITS_PER_METER = 3.0054; // SVG units per real meter (CAD scale factor)
export const WALK_M_PER_MIN = 75; // Walking speed: 4.5 km/h ≈ 75 m/min
export const DRIVE_M_PER_MIN = 350; // Driving speed: 21 km/h ≈ 350 m/min
export const GPS_MAX_ACCURACY_M = 25; // Maximum accuracy threshold to display blue dot
export const GPS_ROUTE_ACCURACY_M = 20; // Accuracy threshold to match and route
export const OFF_ROUTE_REROUTE_M = 25; // Reroute trigger distance
export const GPS_STALE_MS = 15_000;

export function estimateMinutes(
  distanceMeters: number,
  mode: "walking" | "driving" = "walking",
): number {
  const speed = mode === "driving" ? DRIVE_M_PER_MIN : WALK_M_PER_MIN;
  return Math.max(1, Math.round(distanceMeters / speed));
}
