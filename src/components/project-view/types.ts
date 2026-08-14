import { Box, Images, Map, MapPinned, Mountain, Route, type LucideIcon } from "lucide-react";

export type ViewMode = "overview" | "lot" | "tour" | "panorama" | "gallery" | "ar";

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
  { id: "overview", label: "Vista general", icon: Map },
  { id: "lot", label: "Zonas", icon: MapPinned },
  { id: "tour", label: "Recorrido 3D", icon: Route },
  { id: "panorama", label: "Vista panorámica", icon: Mountain },
  { id: "gallery", label: "Galería", icon: Images },
  { id: "ar", label: "AR", icon: Box },
];
