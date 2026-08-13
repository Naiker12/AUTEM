import { properties } from "./properties";

export interface ARModel {
  glb: string;
  usdz?: string;
  poster?: string;
}

// Nota: no se sirve ningún archivo .usdz (iOS). En iOS, model-viewer genera el
// USDZ sobre la marcha al activar AR, así que omitir `ios-src` es intencional.
const AR_MODELS: Record<string, ARModel> = {};

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
