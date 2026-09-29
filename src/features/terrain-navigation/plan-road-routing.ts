import type { SvgPoint } from "./types";

interface RoadNode {
  id: string;
  point: SvgPoint;
  edges: Map<string, number>;
}

export interface PlanRoadRoute {
  points: SvgPoint[];
  svgPath: string;
  distanceSvg: number;
}

const DEFAULT_SNAP_RADIUS = 18;
const DEFAULT_MAX_ACCESS_DISTANCE = 180;

function distance(first: SvgPoint, second: SvgPoint) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

/** Parses the M/L/Z-only paths exported by the Villa Paraíso masterplan. */
export function parsePlanPath(path: string) {
  const tokens = path.match(/[MLZ]|-?(?:\d+\.?\d*|\.\d+)/gi) ?? [];
  const points: SvgPoint[] = [];
  let command = "";
  let start: SvgPoint | undefined;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index].toUpperCase();
    if (token === "M" || token === "L") {
      command = token;
      continue;
    }
    if (token === "Z") {
      if (start && points.length > 1) points.push({ ...start });
      continue;
    }
    if (!command) continue;
    const x = Number(tokens[index]);
    const y = Number(tokens[index + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const point = { x, y };
    points.push(point);
    if (!start) start = point;
    index += 1;
  }
  return points;
}

/**
 * Builds a graph strictly from the road surfaces exported in the SVG. Vertices are snapped only
 * within a small tolerance, so no edge is ever introduced through lots or green areas.
 */
export function createPlanRoadRouter(
  roadPaths: string[],
  snapRadius = DEFAULT_SNAP_RADIUS,
  maxAccessDistance = DEFAULT_MAX_ACCESS_DISTANCE,
) {
  const nodes = new Map<string, RoadNode>();
  const buckets = new Map<string, string[]>();
  const cellSize = snapRadius;

  const bucketKey = (x: number, y: number) =>
    `${Math.floor(x / cellSize)}:${Math.floor(y / cellSize)}`;
  const addNode = (point: SvgPoint) => {
    const cellX = Math.floor(point.x / cellSize);
    const cellY = Math.floor(point.y / cellSize);
    let nearest: RoadNode | undefined;
    let nearestDistance = snapRadius;

    for (let y = cellY - 1; y <= cellY + 1; y += 1) {
      for (let x = cellX - 1; x <= cellX + 1; x += 1) {
        for (const id of buckets.get(`${x}:${y}`) ?? []) {
          const candidate = nodes.get(id);
          if (!candidate) continue;
          const candidateDistance = distance(point, candidate.point);
          if (candidateDistance < nearestDistance) {
            nearest = candidate;
            nearestDistance = candidateDistance;
          }
        }
      }
    }
    if (nearest) return nearest.id;

    const id = `road-${nodes.size}`;
    nodes.set(id, { id, point, edges: new Map() });
    const key = bucketKey(point.x, point.y);
    buckets.set(key, [...(buckets.get(key) ?? []), id]);
    return id;
  };

  const connect = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = nodes.get(fromId);
    const to = nodes.get(toId);
    if (!from || !to) return;
    const length = distance(from.point, to.point);
    if (length === 0) return;
    const existing = from.edges.get(toId);
    if (!existing || length < existing) {
      from.edges.set(toId, length);
      to.edges.set(fromId, length);
    }
  };

  for (const roadPath of roadPaths) {
    const points = parsePlanPath(roadPath);
    let previousId: string | undefined;
    for (const point of points) {
      const currentId = addNode(point);
      if (previousId) connect(previousId, currentId);
      previousId = currentId;
    }
  }

  const nearestNode = (point: SvgPoint) => {
    let closest: RoadNode | undefined;
    let closestDistance = maxAccessDistance;
    for (const node of nodes.values()) {
      const nextDistance = distance(point, node.point);
      if (nextDistance < closestDistance) {
        closest = node;
        closestDistance = nextDistance;
      }
    }
    return closest;
  };

  const findRoute = (origin: SvgPoint, destination: SvgPoint): PlanRoadRoute | null => {
    const start = nearestNode(origin);
    const end = nearestNode(destination);
    if (!start || !end) return null;

    const distances = new Map<string, number>([[start.id, 0]]);
    const cameFrom = new Map<string, string>();
    const pending = new Set<string>([start.id]);

    while (pending.size) {
      let currentId: string | undefined;
      let lowestScore = Number.POSITIVE_INFINITY;
      for (const candidateId of pending) {
        const candidate = nodes.get(candidateId);
        if (!candidate) continue;
        const score =
          (distances.get(candidateId) ?? Number.POSITIVE_INFINITY) +
          distance(candidate.point, end.point);
        if (score < lowestScore) {
          currentId = candidateId;
          lowestScore = score;
        }
      }
      if (!currentId) return null;
      if (currentId === end.id) break;
      pending.delete(currentId);
      const current = nodes.get(currentId);
      if (!current) continue;
      const currentDistance = distances.get(currentId) ?? Number.POSITIVE_INFINITY;
      for (const [nextId, edgeLength] of current.edges) {
        const nextDistance = currentDistance + edgeLength;
        if (nextDistance >= (distances.get(nextId) ?? Number.POSITIVE_INFINITY)) continue;
        distances.set(nextId, nextDistance);
        cameFrom.set(nextId, currentId);
        pending.add(nextId);
      }
    }

    if (!distances.has(end.id)) return null;
    const nodeIds = [end.id];
    let currentId = end.id;
    while (currentId !== start.id) {
      const previousId = cameFrom.get(currentId);
      if (!previousId) return null;
      nodeIds.unshift(previousId);
      currentId = previousId;
    }
    const points = nodeIds.flatMap((id) => {
      const node = nodes.get(id);
      return node ? [node.point] : [];
    });
    if (points.length < 2) return null;
    return {
      points,
      distanceSvg: distances.get(end.id) ?? 0,
      svgPath: `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")}`,
    };
  };

  return { findRoute, nodeCount: nodes.size };
}
