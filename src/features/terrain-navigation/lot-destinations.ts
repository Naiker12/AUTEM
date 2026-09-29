import type { Lot } from "@/data/lots";
import type { SvgPoint } from "./types";

export interface LotRouteDestination {
  id: string;
  label: string;
  lotId: string;
  point: SvgPoint;
  status: "requires_validated_road_snap" | "validated";
}

/**
 * A lot centroid is useful for search and display, but it is never treated as an entrance.
 * Once urbanism validates the road graph, every destination is snapped to its fronting road.
 */
export function createLotRouteDestination(lot: Lot): LotRouteDestination | null {
  if (!lot.centroid || lot.isReserve) return null;
  return {
    id: `lot-${lot.id.toLowerCase()}`,
    label: `Lote ${lot.lotNumber ?? lot.id}`,
    lotId: lot.id,
    point: { x: lot.centroid[0], y: lot.centroid[1] },
    status: "requires_validated_road_snap",
  };
}

export function createLotRouteDestinations(lots: Lot[]) {
  return lots.flatMap((lot) => {
    const destination = createLotRouteDestination(lot);
    return destination ? [destination] : [];
  });
}
