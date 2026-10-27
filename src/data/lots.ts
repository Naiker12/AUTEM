export type LotStatus =
  "Disponible" | "Últimas unidades" | "Reservado" | "Vendido" | "Por confirmar";

export interface LotMetadata {
  descripcion_lindero?: string;
  ubicacion?: string;
  color?: string;
  valor_m2?: number;
  prem2?: number;
  precio_venta?: number;
  precio_preventa?: number;
  cuota_ini_20?: number;
  cuotas_3_ini?: number;
  cuotas_48?: number;
  cuota_ini_pre_20?: number;
  cuotas_3_ini_pre?: number;
  cuotas_48_pre?: number;
  isReserve?: boolean;
  buyer?: string;
  advisor?: string;
  [key: string]: unknown;
}

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
  metadata?: LotMetadata;
}

export function formatLotPrice(price: number): string {
  if (price <= 0) return "Por definir";
  return `$${Math.round(price / 1_000_000)}M`;
}

export function formatLotArea(area: number): string {
  return `${area.toLocaleString("es-CO")} m²`;
}
