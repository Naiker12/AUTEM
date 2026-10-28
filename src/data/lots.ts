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
  cuota_inicial_20?: number;
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

export interface LotFilterCriteria {
  status: string;
  minArea: string;
  maxPrice: string;
  sort: string;
}

export interface LotFinancingBreakdown {
  initialPayment: number;
  threeInstallments: number;
  monthlyPayment48: number;
  pricePerM2: number;
}

export interface LotsSummary {
  totalCount: number;
  availableCount: number;
  areaRangeLabel: string;
}

const DB_TO_UI_LOT_STATUS: Record<string, LotStatus> = {
  available: "Disponible",
  last_units: "Últimas unidades",
  reserved: "Reservado",
  sold: "Vendido",
};

const UI_TO_DB_LOT_STATUS: Record<LotStatus, string> = {
  Disponible: "available",
  "Últimas unidades": "last_units",
  Reservado: "reserved",
  Vendido: "sold",
  "Por confirmar": "available",
};

const PUBLIC_LOT_METADATA_KEYS: ReadonlyArray<keyof LotMetadata> = [
  "descripcion_lindero",
  "ubicacion",
  "color",
  "valor_m2",
  "prem2",
  "precio_venta",
  "precio_preventa",
  "cuota_ini_20",
  "cuota_inicial_20",
  "cuotas_3_ini",
  "cuotas_48",
  "cuota_ini_pre_20",
  "cuotas_3_ini_pre",
  "cuotas_48_pre",
  "isReserve",
];

export function mapDatabaseLotStatus(status: string | null | undefined): LotStatus {
  if (!status) return "Disponible";
  return DB_TO_UI_LOT_STATUS[status] ?? "Disponible";
}

export function mapUiLotStatusToDb(status: LotStatus): string {
  return UI_TO_DB_LOT_STATUS[status] ?? "available";
}

export function formatManzanaLabel(manzana: string | null | undefined): string {
  if (!manzana) return "Manzana por confirmar";
  const cleaned = manzana
    .trim()
    .replace(/^M\s*/i, "")
    .replace(/^Manzana\s*/i, "");
  return cleaned ? `Manzana ${cleaned}` : "Manzana por confirmar";
}

export function formatLotDetail(manzana: string | null | undefined, isReserve: boolean): string {
  return `${formatManzanaLabel(manzana)} · ${isReserve ? "Zona de reserva" : "Vía interna"}`;
}

export function sanitizePublicLotMetadata(
  metadata: LotMetadata | null | undefined,
): LotMetadata | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;

  const sanitized: LotMetadata = {};
  for (const key of PUBLIC_LOT_METADATA_KEYS) {
    if (key in metadata && metadata[key] !== undefined) {
      sanitized[key] = metadata[key];
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function formatLotPrice(price: number): string {
  if (price <= 0) return "Por definir";
  return `$${Math.round(price / 1_000_000)}M`;
}

export function formatLotArea(area: number): string {
  return `${area.toLocaleString("es-CO")} m²`;
}

export function getLotFinancing(
  lot: Pick<Lot, "price" | "area" | "metadata"> | null | undefined,
): LotFinancingBreakdown {
  if (!lot || lot.price <= 0) {
    return {
      initialPayment: 0,
      threeInstallments: 0,
      monthlyPayment48: 0,
      pricePerM2: 0,
    };
  }

  const meta = lot.metadata;
  const initialPayment =
    Number(meta?.cuota_inicial_20 ?? meta?.cuota_ini_20) || Math.round(lot.price * 0.2);
  const threeInstallments = Number(meta?.cuotas_3_ini) || Math.round(initialPayment / 3);
  const monthlyPayment48 = Number(meta?.cuotas_48) || Math.round((lot.price * 0.8) / 48);
  const pricePerM2 =
    Number(meta?.valor_m2 ?? meta?.prem2) || (lot.area > 0 ? Math.round(lot.price / lot.area) : 0);

  return {
    initialPayment,
    threeInstallments,
    monthlyPayment48,
    pricePerM2,
  };
}

export function filterAndSortLots(lots: Lot[], criteria: LotFilterCriteria): Lot[] {
  const { status, minArea, maxPrice, sort } = criteria;

  const statusLots =
    status === "Todos"
      ? lots
      : status === "Reservados"
        ? lots.filter((lot) => lot.status === "Reservado")
        : status === "Vendidos"
          ? lots.filter((lot) => lot.status === "Vendido")
          : lots.filter((lot) => lot.status === "Disponible" || lot.status === "Últimas unidades");

  return statusLots
    .filter((lot) => minArea === "all" || lot.area >= Number(minArea))
    .filter((lot) => maxPrice === "all" || lot.price <= Number(maxPrice) * 1_000_000)
    .sort((first, second) => {
      if (sort === "lot-asc") return (first.lotNumber ?? 0) - (second.lotNumber ?? 0);
      if (sort === "lot-desc") return (second.lotNumber ?? 0) - (first.lotNumber ?? 0);
      if (sort === "area-desc") return second.area - first.area;
      if (sort === "area-asc") return first.area - second.area;
      if (sort === "price-asc") return first.price - second.price;
      if (sort === "price-desc") return second.price - first.price;
      return (first.lotNumber ?? 0) - (second.lotNumber ?? 0);
    });
}

export function getLotsSummary(lots: Lot[]): LotsSummary {
  const totalCount = lots.length;
  const availableCount = lots.filter(
    (lot) => lot.status === "Disponible" || lot.status === "Últimas unidades",
  ).length;

  const validAreas = lots.map((lot) => lot.area).filter((area) => area > 0);
  if (validAreas.length === 0) {
    return {
      totalCount,
      availableCount,
      areaRangeLabel: "Por definir",
    };
  }

  const minArea = Math.round(Math.min(...validAreas));
  const maxArea = Math.round(Math.max(...validAreas));
  const areaRangeLabel =
    minArea === maxArea
      ? `${minArea.toLocaleString("es-CO")} m²`
      : `${minArea.toLocaleString("es-CO")} - ${maxArea.toLocaleString("es-CO")} m²`;

  return {
    totalCount,
    availableCount,
    areaRangeLabel,
  };
}
