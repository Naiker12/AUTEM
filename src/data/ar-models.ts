import { properties } from "./properties";

export interface ARModel {
  glb: string;
  usdz?: string;
  poster?: string;
}

const DEFAULT_GLB_1 = `${import.meta.env.BASE_URL}models/the-horizon-suite.glb`;
const DEFAULT_GLB_2 = `${import.meta.env.BASE_URL}models/export.glb`;

// Nota: no se sirve ningún archivo .usdz (iOS). En iOS, model-viewer genera el
// USDZ sobre la marcha al activar AR, así que omitir `ios-src` es intencional.
const AR_MODELS: Record<string, ARModel> = {
  "residencia-azure": { glb: DEFAULT_GLB_1 },
  "eco-villa-sierra": { glb: DEFAULT_GLB_2 },
  "the-horizon-suite": { glb: DEFAULT_GLB_1 },
};

export function getARModel(propertySlug: string): ARModel {
  return (
    AR_MODELS[propertySlug] || {
      glb: DEFAULT_GLB_1,
    }
  );
}

export function hasUSDZFile(propertySlug: string): boolean {
  const model = getARModel(propertySlug);
  return Boolean(model?.usdz);
}

export function getFullARUrl(propertySlug: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${import.meta.env.BASE_URL}ar/${propertySlug}`;
}

export const AR_READY_PROPERTIES = properties;
