import type { Property } from "@/data/properties";

export interface ProjectComponentProps {
  property: Property;
}

export interface ProjectMapProps {
  property: Property;
  className?: string;
  zoom?: number;
}

export interface ProjectGalleryProps {
  property: Property;
  images?: string[];
}

export interface ProjectFloorPlanProps {
  property: Property;
  className?: string;
}
