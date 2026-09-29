import type { SvgPoint } from "./types";

export interface PlanRoadRoute {
  points: SvgPoint[];
  svgPath: string;
  distanceSvg: number;
}

interface ParsedPlanPath {
  points: SvgPoint[];
  isClosed: boolean;
}

interface QueueItem {
  key: string;
  priority: number;
}

const GRID_SIZE = 12;
const DEFAULT_MAX_ACCESS_DISTANCE = 180;

function distance(first: SvgPoint, second: SvgPoint) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function pointKey(column: number, row: number) {
  return `${column}:${row}`;
}

function parsePointKey(key: string) {
  const [column, row] = key.split(":").map(Number);
  return { column, row };
}

function cellCenter(column: number, row: number): SvgPoint {
  return { x: (column + 0.5) * GRID_SIZE, y: (row + 0.5) * GRID_SIZE };
}

function isPointInPolygon(point: SvgPoint, polygon: SvgPoint[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const prior = polygon[previous];
    const intersects =
      current.y > point.y !== prior.y > point.y &&
      point.x < ((prior.x - current.x) * (point.y - current.y)) / (prior.y - current.y) + current.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Parses the M/L/Z-only paths exported by the Villa Paraíso masterplan. */
export function parsePlanPath(path: string): ParsedPlanPath {
  const tokens = path.match(/[MLZ]|-?(?:\d+\.?\d*|\.\d+)/gi) ?? [];
  const points: SvgPoint[] = [];
  let command = "";
  let isClosed = false;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index].toUpperCase();
    if (token === "M" || token === "L") {
      command = token;
      continue;
    }
    if (token === "Z") {
      isClosed = true;
      continue;
    }
    if (!command) continue;
    const x = Number(tokens[index]);
    const y = Number(tokens[index + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    points.push({ x, y });
    index += 1;
  }
  return { points, isClosed };
}

function pushQueue(queue: QueueItem[], item: QueueItem) {
  queue.push(item);
  let index = queue.length - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (queue[parent].priority <= item.priority) break;
    queue[index] = queue[parent];
    index = parent;
  }
  queue[index] = item;
}

function popQueue(queue: QueueItem[]) {
  const first = queue[0];
  const last = queue.pop();
  if (!first || !last || queue.length === 0) return first;

  let index = 0;
  while (true) {
    const left = index * 2 + 1;
    const right = left + 1;
    let smallest = index;
    if (left < queue.length && queue[left].priority < last.priority) smallest = left;
    if (right < queue.length && queue[right].priority < queue[smallest].priority) smallest = right;
    if (smallest === index) break;
    queue[index] = queue[smallest];
    index = smallest;
  }
  queue[index] = last;
  return first;
}

function simplifyPath(points: SvgPoint[]) {
  if (points.length < 3) return points;
  const simplified = [points[0]];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = simplified[simplified.length - 1];
    const current = points[index];
    const next = points[index + 1];
    const cross =
      (current.x - previous.x) * (next.y - current.y) -
      (current.y - previous.y) * (next.x - current.x);
    if (Math.abs(cross) > 0.001) simplified.push(current);
  }
  simplified.push(points[points.length - 1]);
  return simplified;
}

/**
 * Finds routes over filled road surfaces, rather than on the outlines of their SVG paths.
 * This gives A* proper intersections while preventing paths from crossing lots or green areas.
 */
export function createPlanRoadRouter(
  roadPaths: string[],
  maxAccessDistance = DEFAULT_MAX_ACCESS_DISTANCE,
) {
  const traversable = new Set<string>();
  const addCell = (column: number, row: number) => traversable.add(pointKey(column, row));

  const addSegment = (start: SvgPoint, end: SvgPoint) => {
    const steps = Math.max(1, Math.ceil(distance(start, end) / (GRID_SIZE / 2)));
    for (let step = 0; step <= steps; step += 1) {
      const ratio = step / steps;
      const column = Math.floor((start.x + (end.x - start.x) * ratio) / GRID_SIZE);
      const row = Math.floor((start.y + (end.y - start.y) * ratio) / GRID_SIZE);
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) addCell(column + offsetX, row + offsetY);
      }
    }
  };

  for (const roadPath of roadPaths) {
    const { points, isClosed } = parsePlanPath(roadPath);
    if (points.length < 2) continue;
    for (let index = 1; index < points.length; index += 1)
      addSegment(points[index - 1], points[index]);
    if (isClosed) addSegment(points[points.length - 1], points[0]);
    if (!isClosed || points.length < 3) continue;

    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    for (let row = Math.floor(minY / GRID_SIZE); row <= Math.floor(maxY / GRID_SIZE); row += 1) {
      for (
        let column = Math.floor(minX / GRID_SIZE);
        column <= Math.floor(maxX / GRID_SIZE);
        column += 1
      ) {
        if (isPointInPolygon(cellCenter(column, row), points)) addCell(column, row);
      }
    }
  }

  const nearestRoadCell = (point: SvgPoint) => {
    let nearestKey: string | null = null;
    let nearestDistance = maxAccessDistance;
    for (const key of traversable) {
      const { column, row } = parsePointKey(key);
      const candidateDistance = distance(point, cellCenter(column, row));
      if (candidateDistance < nearestDistance) {
        nearestKey = key;
        nearestDistance = candidateDistance;
      }
    }
    return nearestKey;
  };

  const findRoute = (origin: SvgPoint, destination: SvgPoint): PlanRoadRoute | null => {
    const startKey = nearestRoadCell(origin);
    const endKey = nearestRoadCell(destination);
    if (!startKey || !endKey) return null;

    const endCoordinates = parsePointKey(endKey);
    const end = cellCenter(endCoordinates.column, endCoordinates.row);
    const costs = new Map<string, number>([[startKey, 0]]);
    const cameFrom = new Map<string, string>();
    const visited = new Set<string>();
    const queue: QueueItem[] = [];
    const startCoordinates = parsePointKey(startKey);
    pushQueue(queue, {
      key: startKey,
      priority: distance(cellCenter(startCoordinates.column, startCoordinates.row), end),
    });

    while (queue.length) {
      const current = popQueue(queue);
      if (!current || visited.has(current.key)) continue;
      if (current.key === endKey) break;
      visited.add(current.key);
      const { column, row } = parsePointKey(current.key);
      const currentCost = costs.get(current.key) ?? Number.POSITIVE_INFINITY;

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue;
          const nextKey = pointKey(column + offsetX, row + offsetY);
          if (!traversable.has(nextKey) || visited.has(nextKey)) continue;
          const nextCost =
            currentCost + (offsetX === 0 || offsetY === 0 ? GRID_SIZE : GRID_SIZE * Math.SQRT2);
          if (nextCost >= (costs.get(nextKey) ?? Number.POSITIVE_INFINITY)) continue;
          costs.set(nextKey, nextCost);
          cameFrom.set(nextKey, current.key);
          const nextPoint = cellCenter(column + offsetX, row + offsetY);
          pushQueue(queue, { key: nextKey, priority: nextCost + distance(nextPoint, end) });
        }
      }
    }

    const routeCost = costs.get(endKey);
    if (routeCost === undefined) return null;
    const keys = [endKey];
    let currentKey = endKey;
    while (currentKey !== startKey) {
      const previous = cameFrom.get(currentKey);
      if (!previous) return null;
      keys.unshift(previous);
      currentKey = previous;
    }
    const points = simplifyPath(
      keys.map((key) => {
        const { column, row } = parsePointKey(key);
        return cellCenter(column, row);
      }),
    );
    return {
      points,
      distanceSvg: routeCost,
      svgPath: `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")}`,
    };
  };

  return { findRoute, nodeCount: traversable.size };
}
