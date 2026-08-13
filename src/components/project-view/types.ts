import { Images, Map, MapPinned, Mountain, Route, type LucideIcon } from "lucide-react";

export type ViewMode = "overview" | "lot" | "tour" | "panorama" | "gallery";

export interface ProjectViewMode {
  id: ViewMode;
  label: string;
  icon: LucideIcon;
}

export const PROJECT_VIEW_MODES: ProjectViewMode[] = [
  { id: "overview", label: "Vista general", icon: Map },
  { id: "lot", label: "Vista del lote", icon: MapPinned },
  { id: "tour", label: "Recorrido", icon: Route },
  { id: "panorama", label: "Vista panorámica", icon: Mountain },
  { id: "gallery", label: "Galería", icon: Images },
];
