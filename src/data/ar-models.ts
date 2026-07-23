import { properties } from "./properties";

export interface ARModel {
  glb: string;
  usdz?: string;
  poster?: string;
}

const DEFAULT_GLB_1 = `${import.meta.env.BASE_URL}models/the-horizon-suite.glb`;
const DEFAULT_GLB_2 = `${import.meta.env.BASE_URL}models/export.glb`;

const AR_MODELS: Record<string, ARModel> = {
  "the-horizon-suite": { glb: DEFAULT_GLB_1 },
  "casa-campestre": { glb: DEFAULT_GLB_2 },
  "residencia-azure": { glb: DEFAULT_GLB_1 },
  "eco-villa-sierra": { glb: DEFAULT_GLB_2 },
  "villa-del-carmen": { glb: DEFAULT_GLB_1 },
  "penthouse-solemar": { glb: DEFAULT_GLB_1 },
  "terreno-vista-alta": { glb: DEFAULT_GLB_2 },
  "altos-de-san-pedro": { glb: DEFAULT_GLB_1 },
  "palacio-de-manga": { glb: DEFAULT_GLB_2 },
  "villa-marina-baru": { glb: DEFAULT_GLB_2 },
};

export function getARModel(propertySlug: string): ARModel {
  return (
    AR_MODELS[propertySlug] || {
      glb: DEFAULT_GLB_1,
    }
  );
}

export function hasUSDZFile(propertySlug: string): boolean {
  const model = AR_MODELS[propertySlug];
  return Boolean(model?.usdz);
}

export function getFullARUrl(propertySlug: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${import.meta.env.BASE_URL}ar/${propertySlug}`;
}

export const AR_READY_PROPERTIES = properties;
