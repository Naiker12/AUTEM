import { properties } from "./properties";

export interface ARModel {
  glb: string;
  usdz?: string;
  poster?: string;
}

const HORIZON_GLB = `${import.meta.env.BASE_URL}models/the-horizon-suite.glb`;
const PROJECT_ASSETS = `${import.meta.env.BASE_URL}projects`;

// Nota: no se sirve ningún archivo .usdz (iOS). En iOS, model-viewer genera el
// USDZ sobre la marcha al activar AR, así que omitir `ios-src` es intencional.
const AR_MODELS: Record<string, ARModel> = {
  "the-horizon-suite": {
    glb: HORIZON_GLB,
    poster: `${PROJECT_ASSETS}/the-horizon-suite/fachada.jpg`,
  },
};

export function getARModel(propertySlug: string): ARModel | undefined {
  return AR_MODELS[propertySlug];
}

export function hasUSDZFile(propertySlug: string): boolean {
  const model = getARModel(propertySlug);
  return Boolean(model?.usdz);
}

export function getFullARUrl(propertySlug: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${import.meta.env.BASE_URL}ar/${propertySlug}`;
}

export const AR_READY_PROPERTIES = properties.filter((property) =>
  Boolean(AR_MODELS[property.slug]),
);
