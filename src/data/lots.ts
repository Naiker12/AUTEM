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
  /** Vertices in pixels over the equirectangular panorama. */
  panoramaPolygon?: [number, number][];
  houseModel?: string;
  recordingVideo?: string;
  houseGallery?: string[];
}

export const PANORAMA_360 = {
  image: `${BASE}projects/lotes-360/masterplan-panorama-360.jpg`,
  width: 2048,
  height: 1024,
} as const;

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
    panoramaPolygon: [
      [90, 305],
      [205, 278],
      [285, 322],
      [260, 395],
      [125, 390],
    ],
  },
  {
    id: "L-07",
    projectSlug: "residencia-azure",
    area: 1080,
    price: 225_000_000,
    status: "Disponible",
    detail: "Entorno verde",
    previewImage: `${BASE}projects/lotes-360/lot-l07-entorno-verde.jpg`,
    terrainPosition: [-10, 0],
    panoramaPolygon: [
      [315, 285],
      [425, 270],
      [485, 325],
      [440, 400],
      [340, 375],
    ],
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
    panoramaPolygon: [
      [490, 315],
      [615, 290],
      [700, 345],
      [665, 422],
      [530, 410],
    ],
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
    panoramaPolygon: [
      [710, 286],
      [820, 265],
      [905, 325],
      [865, 395],
      [755, 385],
    ],
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
    panoramaPolygon: [
      [805, 315],
      [925, 295],
      [1000, 350],
      [980, 425],
      [850, 408],
    ],
  },
];

export function getLotsByProject(projectSlug: string): Lot[] {
  return lots.filter(
    (lot) =>
      lot.projectSlug === projectSlug ||
      (projectSlug === "lotes-360" && lot.projectSlug === "residencia-azure") ||
      (projectSlug === "residencia-azure" && lot.projectSlug === "lotes-360"),
  );
}

export function formatLotPrice(price: number): string {
  return `$${Math.round(price / 1_000_000)}M`;
}

export function formatLotArea(area: number): string {
  return `${area.toLocaleString("es-CO")} m²`;
}
