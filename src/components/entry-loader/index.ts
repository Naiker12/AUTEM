/**
 * entry-loader barrel exports.
 *
 * Usage:
 *   import EntryLoader3D from "@/components/entry-loader";
 *   import LoaderOverlay from "@/components/entry-loader/LoaderOverlay";
 *   import { SCENE_VISIBLE_DURATION_MS, LOADER_TEXT_DURATION_MS } from "@/components/entry-loader/3d-types";
 */
export { default } from "./EntryLoader3D";
export { default as LoaderOverlay } from "./LoaderOverlay";
export type { EntryLoader3DProps, LoaderOverlayProps } from "./3d-types";
export { SCENE_VISIBLE_DURATION_MS, LOADER_TEXT_DURATION_MS } from "./3d-types";
