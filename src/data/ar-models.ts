import { properties } from "./properties";

export interface ARModel {
  glb: string;
  usdz?: string;
  poster?: string;
}

const AR_MODELS: Record<string, ARModel> = {
  "the-horizon-suite": {
    glb: `${import.meta.env.BASE_URL}models/the-horizon-suite.glb`,
  },
  "casa-campestre": {
    glb: `${import.meta.env.BASE_URL}models/export.glb`,
  },
};

export function getARModel(propertySlug: string): ARModel | null {
  return AR_MODELS[propertySlug] || null;
}

export function hasUSDZFile(propertySlug: string): boolean {
  const model = AR_MODELS[propertySlug];
  return Boolean(model?.usdz);
}

export function getFullARUrl(propertySlug: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${import.meta.env.BASE_URL}ar/${propertySlug}`;
}

export const AR_READY_PROPERTIES = properties.filter((p) => p.tags.includes("AR Ready"));
