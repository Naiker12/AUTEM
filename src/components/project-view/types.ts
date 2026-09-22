import { Images, MapPinned, Orbit, Route, type LucideIcon } from "lucide-react";

export type ViewMode = "lot" | "perspective" | "tour" | "gallery";

export interface ProjectViewMode {
  id: ViewMode;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  badge?: string;
  available?: boolean;
}

export interface ProjectViewSettings {
  showLotCatalog: boolean;
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
  {
    id: "lot",
    label: "Localización",
    shortLabel: "Ubicación",
    icon: MapPinned,
    available: true,
  },
  {
    id: "perspective",
    label: "Plano Urbanístico",
    shortLabel: "Plano",
    icon: Orbit,
    badge: "Próx.",
    available: false,
  },
  {
    id: "tour",
    label: "Galería",
    shortLabel: "Galería",
    icon: Route,
    badge: "Próx.",
    available: false,
  },
  {
    id: "gallery",
    label: "Conoce el proyecto",
    shortLabel: "Proyecto",
    icon: Images,
    available: true,
  },
];
