/**
 * Modular components for projects system in AUTEM.
 *
 * Folder structure:
 * - project-types.ts       → TypeScript interfaces
 * - project-map.tsx        → Interactive Leaflet map component with single property location
 * - project-floor-plan.tsx → Floor plan download + QR modal popover component
 * - project-gallery.tsx   → Multi-image gallery carousel with fullscreen lightbox
 * - project-card.tsx      → Project card for listings and catalog grid
 */

export { default as ProjectMap } from "./project-map";
export { default as ProjectFloorPlan } from "./project-floor-plan";
export { default as ProjectGallery } from "./project-gallery";
export { default as ProjectCard } from "./project-card";
export * from "./project-types";
