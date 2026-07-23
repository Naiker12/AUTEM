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
  className?: string;
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
