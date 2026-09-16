import villaParaisoGeometry from "./villa-paraiso-geometry.json";

const BASE = import.meta.env.BASE_URL ?? "/";

export type LotStatus = "Disponible" | "Últimas unidades" | "Reservado" | "Vendido" | "Por confirmar";

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

export const PANORAMA_360 = {
  image: `${BASE}projects/lotes-360/masterplan-panorama-360.jpg`,
  width: 2048,
  height: 1024,
} as const;

// Base inicial con datos de render 360 específicos para los primeros lotes
const INITIAL_360_LOTS: Record<string, Partial<Lot>> = {
  "L-01": {
    terrainPosition: [-10, 8],
    panoramaPolygon: [
      [90, 305],
      [205, 278],
      [285, 322],
      [260, 395],
      [125, 390],
    ],
  },
  "L-02": {
    terrainPosition: [-10, 0],
    panoramaPolygon: [
      [315, 285],
      [425, 270],
      [485, 325],
      [440, 400],
      [340, 375],
    ],
  },
  "L-03": {
    terrainPosition: [5, 4],
    panoramaPolygon: [
      [490, 315],
      [615, 290],
      [700, 345],
      [665, 422],
      [530, 410],
    ],
  },
  "L-04": {
    terrainPosition: [10, 0],
    panoramaPolygon: [
      [710, 286],
      [820, 265],
      [905, 325],
      [865, 395],
      [755, 385],
    ],
  },
  "L-05": {
    terrainPosition: [10, -8],
    panoramaPolygon: [
      [805, 315],
      [925, 295],
      [1000, 350],
      [980, 425],
      [850, 408],
    ],
  },
};

// Generar catálogo real a partir de la geometría exacta del plano maestro
export const lots: Lot[] = (villaParaisoGeometry as Array<{
  id: string;
  lotNumber: number;
  label: string;
  manzana: string;
  areaM2: number;
  centroid: [number, number];
  pathD: string;
  isReserve: boolean;
}>).map((item) => {
  const initial = INITIAL_360_LOTS[item.id];
  
  // Asignar estado comercial realista para catálogo
  let status: LotStatus = "Disponible";
  if (item.isReserve) {
    status = "Reservado";
  } else if (item.lotNumber % 11 === 0) {
    status = "Vendido";
  } else if (item.lotNumber % 7 === 0) {
    status = "Reservado";
  } else if (item.lotNumber % 5 === 0 && item.lotNumber % 2 !== 0) {
    status = "Últimas unidades";
  }

  const manzanaLabel = item.manzana.replace(/^M\s*/i, "Manzana ");

  return {
    id: item.id,
    projectSlug: "lotes-360",
    area: item.areaM2,
    price: item.isReserve ? 0 : Math.round(item.areaM2 * 580_000), // Precio estimado por m2
    status,
    detail: `${manzanaLabel} · ${item.isReserve ? "Zona de reserva" : "Vía interna"}`,
    terrainPosition: initial?.terrainPosition ?? [0, 0],
    panoramaPolygon: initial?.panoramaPolygon,
    houseModel: initial?.houseModel,
    recordingVideo: initial?.recordingVideo,
    houseGallery: initial?.houseGallery,
    centroid: item.centroid,
    manzana: item.manzana,
    lotNumber: item.lotNumber,
    pathD: item.pathD,
    isReserve: item.isReserve,
  };
});

export function getLotsByProject(projectSlug: string): Lot[] {
  return lots.filter(
    (lot) =>
      lot.projectSlug === projectSlug ||
      (projectSlug === "lotes-360" && (lot.projectSlug === "villa-paraiso" || lot.projectSlug === "residencia-azure")) ||
      (projectSlug === "villa-paraiso" && lot.projectSlug === "lotes-360") ||
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
