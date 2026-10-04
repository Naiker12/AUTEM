import type { AffineTransform } from "./coordinate-transform";
import { gpsDistance, gpsToSvg, svgToGps, type GpsPoint } from "./gps-projection";
import { polylinePath, type NavigationBundle } from "./navigation-schema";
import type { NavigationGraph, SvgPoint, TravelMode } from "./types";

/** Match in meters, splitting only the selected permitted road. Direction is preserved. */
export function matchRoad(
  bundle: NavigationBundle,
  transform: AffineTransform,
  gps: GpsPoint,
  mode: TravelMode,
  accuracy: number,
) {
  const candidates = bundle.edges
    .filter((e) => e.isOpen && e.modes.includes(mode))
    .flatMap((edge) => {
      const metric = edge.geometry.map((p) => svgToGps(p, transform));
      const lengths = metric.slice(1).map((p, i) => gpsDistance(metric[i], p));
      const total = lengths.reduce((a, b) => a + b, 0);
      let before = 0;
      return metric.slice(1).map((b, i) => {
        const a = metric[i],
          scale = 111320 * Math.cos((gps.latitude * Math.PI) / 180);
        const ax = (a.longitude - gps.longitude) * scale,
          ay = (a.latitude - gps.latitude) * 111320;
        const dx = (b.longitude - a.longitude) * scale,
          dy = (b.latitude - a.latitude) * 111320;
        const fraction = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
        const matchGps = {
          longitude: a.longitude + (b.longitude - a.longitude) * fraction,
          latitude: a.latitude + (b.latitude - a.latitude) * fraction,
        };
        const result = {
          edge,
          segment: i,
          point: gpsToSvg(matchGps, transform),
          distance: gpsDistance(gps, matchGps),
          fraction: (before + lengths[i] * fraction) / total,
        };
        before += lengths[i];
        return result;
      });
    })
    .sort((a, b) => a.distance - b.distance);
  const best = candidates[0];
  if (!best || best.distance > Math.min(20, Math.max(8, accuracy)))
    return { status: "off_road" as const };
  const other = candidates.find(
    (c) =>
      c.edge.id !== best.edge.id &&
      ![c.edge.from, c.edge.to].some((id) => id === best.edge.from || id === best.edge.to),
  );
  if (other && other.distance - best.distance < Math.max(3, accuracy))
    return { status: "ambiguous" as const };
  const originId = "__gps_origin__";
  const graph: NavigationGraph = {
    projectSlug: bundle.projectSlug,
    version: bundle.version,
    status: "validated",
    nodes: [
      ...bundle.nodes,
      { id: originId, label: "Mi ubicación", kind: "intersection", point: best.point },
    ],
    edges: bundle.edges
      .filter((e) => e.id !== best.edge.id)
      .map((e) => ({ ...e, svgPath: polylinePath(e.geometry) })),
  };
  const prefix = [...best.edge.geometry.slice(0, best.segment + 1), best.point];
  const suffix = [best.point, ...best.edge.geometry.slice(best.segment + 1)];
  graph.edges.push(
    {
      ...best.edge,
      id: `${best.edge.id}:before`,
      to: originId,
      lengthMeters: Math.max(0.001, best.edge.lengthMeters * best.fraction),
      svgPath: polylinePath(prefix),
    },
    {
      ...best.edge,
      id: `${best.edge.id}:after`,
      from: originId,
      lengthMeters: Math.max(0.001, best.edge.lengthMeters * (1 - best.fraction)),
      svgPath: polylinePath(suffix),
    },
  );
  return { status: "matched" as const, graph, originId, point: best.point };
}
export function pointDistanceMeters(first: SvgPoint, second: SvgPoint, transform: AffineTransform) {
  return gpsDistance(svgToGps(first, transform), svgToGps(second, transform));
}
