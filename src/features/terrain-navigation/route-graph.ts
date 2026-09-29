import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
  RouteResult,
  TravelMode,
} from "./types";

interface TraversableEdge {
  edge: NavigationEdge;
  from: string;
  to: string;
}

function estimatedRemainingDistance(from: NavigationNode, to: NavigationNode) {
  return Math.hypot(from.point.x - to.point.x, from.point.y - to.point.y);
}

function reconstructRoute(
  cameFrom: Map<string, TraversableEdge>,
  originId: string,
  destinationId: string,
  distanceMeters: number,
): RouteResult {
  const nodeIds = [destinationId];
  const edgeIds: string[] = [];
  let currentId = destinationId;

  while (currentId !== originId) {
    const step = cameFrom.get(currentId);
    if (!step) return { nodeIds: [], edgeIds: [], distanceMeters: 0, status: "no_route" };
    edgeIds.unshift(step.edge.id);
    currentId = step.from;
    nodeIds.unshift(currentId);
  }

  return { nodeIds, edgeIds, distanceMeters, status: "found" };
}

/**
 * Finds the shortest allowed path through a validated internal-road graph.
 * It intentionally returns no route for unvalidated or empty graphs; callers must never
 * replace this outcome with a line drawn across lots or green areas.
 */
export function findInternalRoute(
  graph: NavigationGraph,
  originId: string,
  destinationId: string,
  mode: TravelMode,
): RouteResult {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const origin = nodesById.get(originId);
  const destination = nodesById.get(destinationId);
  if (!origin) return { nodeIds: [], edgeIds: [], distanceMeters: 0, status: "invalid_origin" };
  if (!destination)
    return { nodeIds: [], edgeIds: [], distanceMeters: 0, status: "invalid_destination" };
  if (originId === destinationId)
    return { nodeIds: [originId], edgeIds: [], distanceMeters: 0, status: "found" };
  if (graph.status !== "validated")
    return { nodeIds: [], edgeIds: [], distanceMeters: 0, status: "no_route" };

  const outgoing = new Map<string, TraversableEdge[]>();
  const append = (step: TraversableEdge) => {
    const current = outgoing.get(step.from) ?? [];
    current.push(step);
    outgoing.set(step.from, current);
  };
  for (const edge of graph.edges) {
    if (!edge.isOpen || !edge.modes.includes(mode)) continue;
    append({ edge, from: edge.from, to: edge.to });
    if (edge.isBidirectional) append({ edge, from: edge.to, to: edge.from });
  }

  const distances = new Map<string, number>([[originId, 0]]);
  const cameFrom = new Map<string, TraversableEdge>();
  const pending = new Set<string>([originId]);

  while (pending.size) {
    let currentId: string | undefined;
    let smallestEstimate = Number.POSITIVE_INFINITY;
    for (const candidateId of pending) {
      const candidate = nodesById.get(candidateId);
      const distance = distances.get(candidateId) ?? Number.POSITIVE_INFINITY;
      if (!candidate) continue;
      const estimate = distance + estimatedRemainingDistance(candidate, destination);
      if (estimate < smallestEstimate) {
        currentId = candidateId;
        smallestEstimate = estimate;
      }
    }
    if (!currentId) break;
    if (currentId === destinationId) {
      return reconstructRoute(cameFrom, originId, destinationId, distances.get(destinationId) ?? 0);
    }
    pending.delete(currentId);
    const currentDistance = distances.get(currentId) ?? Number.POSITIVE_INFINITY;
    for (const step of outgoing.get(currentId) ?? []) {
      const nextDistance = currentDistance + step.edge.lengthMeters;
      if (nextDistance >= (distances.get(step.to) ?? Number.POSITIVE_INFINITY)) continue;
      distances.set(step.to, nextDistance);
      cameFrom.set(step.to, step);
      pending.add(step.to);
    }
  }

  return { nodeIds: [], edgeIds: [], distanceMeters: 0, status: "no_route" };
}
