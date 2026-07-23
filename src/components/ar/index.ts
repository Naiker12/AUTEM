/**
 * Realidad Aumentada (AR) modular system in AUTEM.
 *
 * Folder structure:
 * - ar-types.ts      → TypeScript interfaces & model definitions
 * - ar-tutorial.tsx   → Smartphone tutorial modal & help tooltips
 * - ar-viewer.tsx     → WebGL model-viewer 3D component with material customizer
 * - ar-qr-modal.tsx   → Mobile QR code scanner modal
 * - ar-experience.tsx → Main ARExperience component with 10-property support
 */

export { default } from "./ar-experience";
export { default as ARExperience } from "./ar-experience";
export { Desktop3DViewer } from "./ar-viewer";
export { ARQrModal } from "./ar-qr-modal";
export { FirstTutorial, HelpTooltip } from "./ar-tutorial";
export * from "./ar-types";
