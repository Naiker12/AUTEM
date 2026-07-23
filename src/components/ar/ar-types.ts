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

export type ViewerThemeMode = "day" | "night" | "studio";

export interface ARExperienceProps {
  initialPropertySlug?: string;
  className?: string;
}

export interface Desktop3DViewerProps {
  modelSrc: string;
  selectedFinish: number;
  onFinishChange: (index: number) => void;
  className?: string;
  propertyName?: string;
}

export interface ARFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelSrc: string;
  propertyName: string;
  selectedFinish: number;
  onFinishChange: (index: number) => void;
}

export interface ARQrModalProps {
  propertySlug: string;
  propertyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface ARTutorialProps {
  onDismiss: () => void;
}
