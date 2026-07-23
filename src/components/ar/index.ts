/**
 * Realidad Aumentada (AR) modular system in AUTEM.
 *
 * Folder structure:
 * - ar-types.ts              → TypeScript interfaces & model definitions
 * - ar-tutorial.tsx           → Smartphone tutorial modal & help tooltips
 * - ar-viewer.tsx             → WebGL model-viewer 3D component with material customizer
 * - ar-environment-toggle.tsx → Environment background mode selector (Dark / White / Green Terrain)
 * - ar-fullscreen-modal.tsx   → Fullscreen 3D model viewer modal
 * - ar-qr-modal.tsx           → Mobile QR code scanner modal
 * - ar-experience.tsx         → Main ARExperience component with 10-property support
 */

export { default } from "./ar-experience";
export { default as ARExperience } from "./ar-experience";
export { Desktop3DViewer } from "./ar-viewer";
export { ARFullscreenModal } from "./ar-fullscreen-modal";
export { AREnvironmentToggle } from "./ar-environment-toggle";
export { ARQrModal } from "./ar-qr-modal";
export { FirstTutorial, HelpTooltip } from "./ar-tutorial";
export * from "./ar-types";
