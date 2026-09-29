import type { NavigationGraph } from "@/features/terrain-navigation/types";

/**
 * Deliberately empty until urbanism/topography validates the entry, junctions and roads.
 * Keeping this separate from the visual SVG prevents a demonstration line from becoming
 * an operational route by accident.
 */
export const villaParaisoNavigation: NavigationGraph = {
  projectSlug: "lotes-360",
  version: "0.1.0",
  status: "pending_field_validation",
  nodes: [],
  edges: [],
};
