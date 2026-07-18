import { properties } from "./properties";

export interface ARModel {
  glb: string;
  usdz: string;
  poster?: string;
}

const AR_MODELS: Record<string, ARModel> = {
  "the-horizon-suite": {
    glb: `${import.meta.env.BASE_URL}models/the-horizon-suite.glb`,
    usdz: `${import.meta.env.BASE_URL}models/the-horizon-suite.usdz`,
  },
  "villa-atlantico": {
    glb: `${import.meta.env.BASE_URL}models/villa-atlantico.glb`,
    usdz: `${import.meta.env.BASE_URL}models/villa-atlantico.usdz`,
  },
  "penthouse-solemar": {
    glb: `${import.meta.env.BASE_URL}models/penthouse-solemar.glb`,
    usdz: `${import.meta.env.BASE_URL}models/penthouse-solemar.usdz`,
  },
  "the-summit-penthouse": {
    glb: `${import.meta.env.BASE_URL}models/the-summit-penthouse.glb`,
    usdz: `${import.meta.env.BASE_URL}models/the-summit-penthouse.usdz`,
  },
  "casa-campestre": {
    glb: `${import.meta.env.BASE_URL}models/export.glb`,
    usdz: `${import.meta.env.BASE_URL}models/casa-campestre.usdz`,
  },
};

export function getARModel(propertySlug: string): ARModel | null {
  return AR_MODELS[propertySlug] || null;
}

export function getARModelUrl(propertySlug: string): string {
  return `${import.meta.env.BASE_URL}ar/${propertySlug}`;
}

export const AR_READY_PROPERTIES = properties.filter((p) => p.tags.includes("AR Ready"));
