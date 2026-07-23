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
  { skybox?: string; environment?: string; exposure: string; shadowIntensity: string; label: string }
> = {
  day: {
    environment: "neutral",
    exposure: "1.25",
    shadowIntensity: "1.3",
    label: "Día (Sol)",
  },
  night: {
    environment: "neutral",
    exposure: "0.6",
    shadowIntensity: "0.6",
    label: "Noche (Luces)",
  },
  studio: {
    environment: "neutral",
    exposure: "1.0",
    shadowIntensity: "1.1",
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

