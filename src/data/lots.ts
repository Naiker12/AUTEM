const BASE = import.meta.env.BASE_URL ?? "/";

export type LotStatus = "Disponible" | "Últimas unidades" | "Reservado";

export interface Lot {
  id: string;
  projectSlug: string;
  area: number;
  price: number;
  status: LotStatus;
  detail: string;
  previewImage: string;
  terrainPosition: [number, number];
  houseModel?: string;
  recordingVideo?: string;
  houseGallery?: string[];
}

export const lots: Lot[] = [
  {
    id: "L-01",
    projectSlug: "residencia-azure",
    area: 1240,
    price: 210_000_000,
    status: "Disponible",
    detail: "Acceso principal",
    previewImage: `${BASE}projects/lotes-360/acceso-render.png`,
    terrainPosition: [-10, 8],
  },
  {
    id: "L-07",
    projectSlug: "residencia-azure",
    area: 1080,
    price: 225_000_000,
    status: "Disponible",
    detail: "Entorno verde",
    previewImage: `${BASE}projects/lotes-360/lot-l07-entorno-verde.png`,
    terrainPosition: [-10, 0],
  },
  {
    id: "L-12",
    projectSlug: "residencia-azure",
    area: 1360,
    price: 285_000_000,
    status: "Últimas unidades",
    detail: "Frente a quebrada",
    previewImage: `${BASE}projects/lotes-360/lot-l12-quebrada.png`,
    terrainPosition: [5, 4],
  },
  {
    id: "L-18",
    projectSlug: "residencia-azure",
    area: 1150,
    price: 245_000_000,
    status: "Disponible",
    detail: "Cerca a zona social",
    previewImage: `${BASE}projects/lotes-360/lot-l18-zona-social.png`,
    terrainPosition: [10, 0],
  },
  {
    id: "L-24",
    projectSlug: "residencia-azure",
    area: 1420,
    price: 360_000_000,
    status: "Disponible",
    detail: "Punto panorámico",
    previewImage: `${BASE}projects/lotes-360/panoramica-render.png`,
    terrainPosition: [10, -8],
  },
];

export function getLotsByProject(projectSlug: string): Lot[] {
  return lots.filter((lot) => lot.projectSlug === projectSlug);
}

export function formatLotPrice(price: number): string {
  return `$${Math.round(price / 1_000_000)}M`;
}

export function formatLotArea(area: number): string {
  return `${area.toLocaleString("es-CO")} m²`;
}
