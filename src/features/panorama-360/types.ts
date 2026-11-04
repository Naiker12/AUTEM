export interface PanoramaPanoData {
  fullWidth: number;
  fullHeight: number;
  croppedWidth: number;
  croppedHeight: number;
  croppedX: number;
  croppedY: number;
}

export interface PanoramaCameraPosition {
  lat: number;
  lng: number;
  heightAboveGroundM: number;
  offsetEastM?: number;
  offsetNorthM?: number;
}

export interface PanoramaCameraTilt {
  pitchDeg: number;
  rollDeg: number;
}

export interface PanoramaCameraLimits {
  minPitchDeg: number;
  maxPitchDeg: number;
  defaultYawDeg: number;
  defaultPitchDeg: number;
  defaultZoomLvl?: number;
}

export interface PanoramaCameraConfig {
  camera: PanoramaCameraPosition;
  yawOffsetDeg: number;
  tilt: PanoramaCameraTilt;
  panoDataDesktop: PanoramaPanoData;
  panoDataMobile: PanoramaPanoData;
  limits: PanoramaCameraLimits;
}

export interface PanoramaControlPoint {
  id: string;
  label: string;
  /** [lng, lat] in EPSG:4326 */
  worldGps: [number, number];
  /** [svgX, svgY] in masterplan SVG space */
  worldSvg?: [number, number];
  /** [yawRad, pitchRad] in spherical radians */
  panoRad: [number, number];
  /** [yawDeg, pitchDeg] in spherical degrees */
  panoDeg: [number, number];
  weight?: number;
}

export interface ProjectedPanoramaLot {
  id: string;
  lotNumber: number;
  label: string;
  manzana?: string;
  /**
   * Densified polygon vertices in spherical radians [[yawRad, pitchRad], ...].
   * Used directly by Photo Sphere Viewer MarkersPlugin (`polygonRad`).
   */
  polygonRad: [number, number][];
  /**
   * Undensified original corner vertices in spherical radians [[yawRad, pitchRad], ...].
   * Used in the admin vertex editor for manual per-lot adjustments.
   */
  verticesRad: [number, number][];
  /** Centroid position in spherical radians [yawRad, pitchRad] for label/camera focus */
  labelRad: [number, number];
}

export interface PanoramaContextLayers {
  water?: [number, number][][];
  roads?: [number, number][][];
}

export interface PanoramaLotsData {
  projectSlug: string;
  version: number;
  generatedAt: string;
  config: PanoramaCameraConfig;
  controlPoints: PanoramaControlPoint[];
  lots: ProjectedPanoramaLot[];
  layers?: PanoramaContextLayers;
}

export interface PanoramaLotOverride {
  /** Overridden corner vertices in spherical radians [[yawRad, pitchRad], ...] */
  verticesRad: [number, number][];
  /** Optional overridden label position [yawRad, pitchRad] */
  labelRad?: [number, number];
  updatedAt?: string;
}

export type PanoramaLotOverridesMap = Record<string, PanoramaLotOverride>;
