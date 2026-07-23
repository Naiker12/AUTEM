import "react";

interface ModelViewerAttributes {
  src?: string;
  alt?: string;
  poster?: string;
  loading?: string;
  reveal?: string;

  // Camera & interaction
  "camera-controls"?: string;
  "camera-orbit"?: string;
  "camera-target"?: string;
  "field-of-view"?: string;
  "min-field-of-view"?: string;
  "max-field-of-view"?: string;
  "min-camera-orbit"?: string;
  "max-camera-orbit"?: string;
  "interpolation-decay"?: string;
  "interaction-prompt"?: string;
  "touch-action"?: string;
  bounds?: string;
  "auto-rotate"?: string;
  "auto-rotate-delay"?: string;
  "rotation-per-second"?: string;

  // Lighting & environment
  "environment-image"?: string;
  "skybox-image"?: string;
  "tone-mapping"?: string;
  "shadow-intensity"?: string | number;
  "shadow-softness"?: string | number;
  exposure?: string | number;

  // AR
  ar?: string;
  "ar-modes"?: string;
  "ar-scale"?: string;
  "ar-placement"?: string;
  "ios-src"?: string;

  // Events (React-style)
  onLoad?: () => void;
  onError?: (event: Event) => void;
  onProgress?: (event: Event) => void;
}

type ModelViewerProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> &
  ModelViewerAttributes;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}
