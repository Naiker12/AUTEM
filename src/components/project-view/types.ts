import { Box, Images, MapPinned, Route, type LucideIcon } from "lucide-react";

export type ViewMode = "lot" | "tour" | "gallery" | "ar";

export interface ProjectViewMode {
  id: ViewMode;
  label: string;
  icon: LucideIcon;
}

export interface ProjectViewSettings {
  showLotCatalog: boolean;
  showLotDetails: boolean;
  showViewSwitcher: boolean;
  showMapControls: boolean;
  showLotBoundaries: boolean;
  showLotLabels: boolean;
  showProjectBrand: boolean;
  showNavigationHints: boolean;
  mapShade: number;
  selectionOpacity: number;
}

export const DEFAULT_PROJECT_VIEW_SETTINGS: ProjectViewSettings = {
  showLotCatalog: true,
  showLotDetails: true,
  showViewSwitcher: true,
  showMapControls: true,
  showLotBoundaries: true,
  showLotLabels: true,
  showProjectBrand: true,
  showNavigationHints: true,
  mapShade: 16,
  selectionOpacity: 30,
};

export const PROJECT_VIEW_MODES: ProjectViewMode[] = [
  { id: "lot", label: "Zonas", icon: MapPinned },
  { id: "tour", label: "Tour 360°", icon: Route },
  { id: "gallery", label: "Galería", icon: Images },
  { id: "ar", label: "AR", icon: Box },
];
