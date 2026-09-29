export type LotStatus =
  "Disponible" | "Últimas unidades" | "Reservado" | "Vendido" | "Por confirmar";

export interface Lot {
  id: string;
  projectSlug: string;
  area: number;
  price: number;
  status: LotStatus;
  detail: string;
  terrainPosition: [number, number];
  /** Vertices in pixels over the equirectangular panorama. */
  panoramaPolygon?: [number, number][];
  houseModel?: string;
  recordingVideo?: string;
  houseGallery?: string[];
  centroid?: [number, number];
  manzana?: string;
  lotNumber?: number;
  pathD?: string;
  isReserve?: boolean;
}

export function formatLotPrice(price: number): string {
  if (price <= 0) return "Por definir";
  return `$${Math.round(price / 1_000_000)}M`;
}

export function formatLotArea(area: number): string {
  return `${area.toLocaleString("es-CO")} m²`;
}
