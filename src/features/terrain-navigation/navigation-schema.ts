import { z } from "zod";
import { applyAffineTransform, fitAffineTransform } from "./coordinate-transform";
import { findInternalRoute } from "./route-graph";
import { gpsDistance, svgToGps } from "./gps-projection";

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite });
const gps = z.object({ latitude: finite.min(-90).max(90), longitude: finite.min(-180).max(180) });
const control = z.object({
  label: z.string().min(1),
  source: point,
  target: point,
  accuracy: finite.min(0).max(20),
});
export const navigationBundleSchema = z.object({
  projectSlug: z.string().min(1),
  version: z.string().min(1),
  masterplanVersion: z.string().min(1),
  entranceId: z.string().min(1),
  bounds: z.object({ width: finite.positive(), height: finite.positive() }),
  geofence: z.array(point).min(3).max(1000),
  calibration: z.object({
    controls: z.array(control).min(4).max(100),
    checkpoints: z
      .array(z.object({ label: z.string().min(1), gps, point, accuracy: finite.min(0).max(20) }))
      .min(2)
      .max(100),
  }),
  nodes: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        kind: z.enum(["entrance", "intersection", "destination", "amenity"]),
        point,
      }),
    )
    .min(2)
    .max(5000),
  edges: z
    .array(
      z.object({
        id: z.string().min(1),
        from: z.string().min(1),
        to: z.string().min(1),
        lengthMeters: finite.positive(),
        modes: z.array(z.enum(["walking", "driving", "accessible"])).min(1),
        isBidirectional: z.boolean(),
        isOpen: z.boolean(),
        geometry: z.array(point).min(2).max(1000),
      }),
    )
    .min(1)
    .max(10000),
  destinations: z
    .array(z.object({ lotId: z.string().min(1), nodeId: z.string().min(1) }))
    .min(1)
    .max(5000),
});
export type NavigationBundle = z.infer<typeof navigationBundleSchema>;
export function validateNavigationBundle(input: unknown, projectSlug?: string) {
  const bundle = navigationBundleSchema.parse(input);
  if (projectSlug && bundle.projectSlug !== projectSlug)
    throw new Error("La red pertenece a otro proyecto.");
  const transform = fitAffineTransform(bundle.calibration.controls);
  if (!transform) throw new Error("Calibración degenerada.");
  const inBounds = (p: { x: number; y: number }) =>
    p.x >= 0 && p.y >= 0 && p.x <= bundle.bounds.width && p.y <= bundle.bounds.height;
  if (
    [
      ...bundle.geofence,
      ...bundle.nodes.map((n) => n.point),
      ...bundle.edges.flatMap((e) => e.geometry),
      ...bundle.calibration.controls.map((c) => c.target),
      ...bundle.calibration.checkpoints.map((c) => c.point),
    ].some((p) => !inBounds(p))
  )
    throw new Error("Coordenada fuera del plano.");
  const controls = bundle.calibration.controls;
  if (
    controls.some(
      (c, i) =>
        Math.abs(c.source.x) > 180 ||
        Math.abs(c.source.y) > 90 ||
        controls
          .slice(i + 1)
          .some(
            (d) =>
              gpsDistance(
                { latitude: c.source.y, longitude: c.source.x },
                { latitude: d.source.y, longitude: d.source.x },
              ) < 25,
          ),
    )
  )
    throw new Error("Los controles GPS deben estar separados al menos 25 m.");
  const area = bundle.geofence.reduce((sum, p, i) => {
    const q = bundle.geofence[(i + 1) % bundle.geofence.length];
    return sum + p.x * q.y - q.x * p.y;
  }, 0);
  if (Math.abs(area) < 1) throw new Error("Geocerca degenerada.");
  const checks = bundle.calibration.checkpoints;
  if (checks.some((c, i) => checks.slice(i + 1).some((d) => gpsDistance(c.gps, d.gps) < 10)))
    throw new Error("Los puntos de comprobación deben estar separados al menos 10 m.");
  const errors = bundle.calibration.checkpoints.map((c) => {
    if (
      controls.some((p) => gpsDistance(c.gps, { latitude: p.source.y, longitude: p.source.x }) < 10)
    )
      throw new Error("Los puntos de comprobación deben ser independientes de los controles.");
    const measured = svgToGps(c.point, transform);
    return gpsDistance(measured, c.gps);
  });
  if (Math.max(...errors) > 10)
    throw new Error("El error de comprobación supera 10 m; revisar calibración.");
  if (
    bundle.nodes.some((n) => n.id.startsWith("__gps_")) ||
    bundle.edges.some((e) => e.id.startsWith("__gps_"))
  )
    throw new Error("Identificador reservado para el GPS.");
  if (
    new Set(bundle.nodes.map((n) => n.id)).size !== bundle.nodes.length ||
    new Set(bundle.edges.map((e) => e.id)).size !== bundle.edges.length ||
    new Set(bundle.destinations.map((d) => d.lotId)).size !== bundle.destinations.length
  )
    throw new Error("Identificadores duplicados.");
  const nodes = new Map(bundle.nodes.map((n) => [n.id, n]));
  if (nodes.get(bundle.entranceId)?.kind !== "entrance")
    throw new Error("Falta la entrada validada.");
  for (const edge of bundle.edges) {
    const from = nodes.get(edge.from),
      to = nodes.get(edge.to);
    if (!from || !to || from.id === to.id) throw new Error("Tramo con extremos inválidos.");
    if (
      Math.hypot(edge.geometry[0].x - from.point.x, edge.geometry[0].y - from.point.y) > 0.01 ||
      Math.hypot(edge.geometry.at(-1)!.x - to.point.x, edge.geometry.at(-1)!.y - to.point.y) > 0.01
    )
      throw new Error("La geometría no coincide con los extremos del tramo.");
    const length = edge.geometry
      .slice(1)
      .reduce(
        (sum, p, i) =>
          sum + gpsDistance(svgToGps(edge.geometry[i], transform), svgToGps(p, transform)),
        0,
      );
    if (length <= 0 || Math.abs(length - edge.lengthMeters) > Math.max(2, length * 0.15))
      throw new Error("Longitud del tramo inconsistente con la calibración.");
  }
  const graph = {
    ...bundle,
    status: "validated" as const,
    edges: bundle.edges.map((e) => ({ ...e, svgPath: polylinePath(e.geometry) })),
  };
  for (const d of bundle.destinations) {
    if (
      nodes.get(d.nodeId)?.kind !== "destination" ||
      findInternalRoute(graph, bundle.entranceId, d.nodeId, "walking").status !== "found"
    )
      throw new Error("Destino sin acceso peatonal conectado a la entrada.");
  }
  // Force a finite forward projection before exposing a loaded version.
  const projected = applyAffineTransform(controls[0].source, transform);
  if (![projected.x, projected.y].every(Number.isFinite))
    throw new Error("Transformación no válida.");
  return { bundle, graph, transform, maxErrorMeters: Math.max(...errors) };
}
export function polylinePath(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
}
