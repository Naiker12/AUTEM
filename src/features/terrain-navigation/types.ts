export type TravelMode = "walking" | "driving" | "accessible";

export type NavigationNodeKind = "entrance" | "intersection" | "destination" | "amenity";

export interface SvgPoint {
  x: number;
  y: number;
}

/** A verified point over the masterplan SVG coordinate system. */
export interface NavigationNode {
  id: string;
  kind: NavigationNodeKind;
  point: SvgPoint;
  label: string;
}

/** A field-validated, walkable or driveable section between two nodes. */
export interface NavigationEdge {
  id: string;
  from: string;
  to: string;
  lengthMeters: number;
  modes: TravelMode[];
  isBidirectional: boolean;
  isOpen: boolean;
  svgPath?: string;
}

export interface NavigationGraph {
  projectSlug: string;
  version: string;
  status: "pending_field_validation" | "validated";
  nodes: NavigationNode[];
  edges: NavigationEdge[];
}

export interface RouteResult {
  nodeIds: string[];
  edgeIds: string[];
  distanceMeters: number;
  status: "found" | "no_route" | "invalid_origin" | "invalid_destination";
}
