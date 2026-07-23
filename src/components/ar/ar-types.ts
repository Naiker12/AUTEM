import type { Property } from "@/data/properties";

export interface ARModelDefinition {
  glb: string;
  usdz?: string;
  poster?: string;
}

export interface FinishSwatch {
  name: string;
  color: string;
}

export interface ARExperienceProps {
  initialPropertySlug?: string;
  showSelector?: boolean;
  className?: string;
}

export interface Desktop3DViewerProps {
  modelSrc: string;
  selectedFinish: number;
  onFinishChange: (index: number) => void;
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  className?: string;
}

export type LightingMode = "day" | "night" | "studio";
export type ViewerThemeMode = LightingMode;

export const LIGHTING_PRESETS: Record<
  LightingMode,
  {
    environment?: string;
    exposure: string;
    shadowIntensity: string;
    shadowSoftness: string;
    label: string;
  }
> = {
  day: {
    environment: "neutral",
    exposure: "1.4",
    shadowIntensity: "1.6",
    shadowSoftness: "0.2",
    label: "Día (Sol)",
  },
  night: {
    environment: "neutral",
    exposure: "0.35",
    shadowIntensity: "0.5",
    shadowSoftness: "0.8",
    label: "Noche (Luces)",
  },
  studio: {
    environment: "neutral",
    exposure: "1.05",
    shadowIntensity: "1.1",
    shadowSoftness: "0.5",
    label: "Estudio 3D",
  },
};

export interface ARQrModalProps {
  propertySlug: string;
  propertyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface ARTutorialProps {
  onDismiss: () => void;
}

export interface ARFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelSrc: string;
  propertyName: string;
  selectedFinish: number;
  onFinishChange: (index: number) => void;
}
