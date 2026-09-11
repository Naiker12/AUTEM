const BASE = import.meta.env.BASE_URL ?? "/";

export type LotStatus = "Disponible" | "Últimas unidades" | "Reservado" | "Por confirmar";

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
}

export const PANORAMA_360 = {
  image: `${BASE}projects/lotes-360/masterplan-panorama-360.jpg`,
  width: 2048,
  height: 1024,
} as const;

export const lots: Lot[] = [
  {
    id: "L-01",
    projectSlug: "lotes-360",
    area: 350.21,
    price: 0,
    status: "Por confirmar",
    detail: "Manzana 1 · Acceso principal",
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
    id: "L-02",
    projectSlug: "lotes-360",
    area: 371.64,
    price: 0,
    status: "Por confirmar",
    detail: "Manzana 1 · Acceso principal",
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
    id: "L-03",
    projectSlug: "lotes-360",
    area: 432.97,
    price: 0,
    status: "Por confirmar",
    detail: "Manzana 1 · Vía interna",
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
    id: "L-04",
    projectSlug: "lotes-360",
    area: 475.45,
    price: 0,
    status: "Por confirmar",
    detail: "Manzana 1 · Vía interna",
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
    id: "L-05",
    projectSlug: "lotes-360",
    area: 479.86,
    price: 0,
    status: "Por confirmar",
    detail: "Manzana 1 · Vía interna",
    terrainPosition: [10, -8],
    panoramaPolygon: [
      [805, 315],
      [925, 295],
      [1000, 350],
      [980, 425],
      [850, 408],
    ],
  },
  {
    id: "L-06",
    projectSlug: "lotes-360",
    area: 427.72,
    price: 0,
    status: "Por confirmar",
    detail: "Manzana 2 · Vía interna",
    terrainPosition: [10, -8],
  },
  {
    id: "L-07",
    projectSlug: "lotes-360",
    area: 301.67,
    price: 0,
    status: "Por confirmar",
    detail: "Manzana 2 · Vía interna",
    terrainPosition: [10, -8],
  },
  {
    id: "L-08",
    projectSlug: "lotes-360",
    area: 300.48,
    price: 0,
    status: "Por confirmar",
    detail: "Manzana 2 · Vía interna",
    terrainPosition: [10, -8],
  },
  {
    id: "L-09",
    projectSlug: "lotes-360",
    area: 288.07,
    price: 0,
    status: "Por confirmar",
    detail: "Manzana 2 · Vía interna",
    terrainPosition: [10, -8],
  },
  {
    id: "L-10",
    projectSlug: "lotes-360",
    area: 300,
    price: 0,
    status: "Por confirmar",
    detail: "Manzana 2 · Vía interna",
    terrainPosition: [10, -8],
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
  if (price <= 0) return "Por definir";
  return `$${Math.round(price / 1_000_000)}M`;
}

export function formatLotArea(area: number): string {
  return `${area.toLocaleString("es-CO")} m²`;
}
