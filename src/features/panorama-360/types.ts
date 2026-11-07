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

/**
 * Parámetros configurables del parche de terreno para la entrada suroeste (L-1..L-45-A).
 * Por defecto reproduce exactamente el comportamiento calibrado actual.
 */
export interface SouthwestTerrainPatchConfig {
  enabled: boolean;
  /** Eje principal hacia el suroeste [ux, uy] */
  axisU?: [number, number];
  /** Eje transversal [tx, ty] */
  axisT?: [number, number];
  /** Distancia umbral de inicio en el eje S (m) */
  sStartM?: number;
  /** Distancia de normalización en el eje S (m) */
  sEndM?: number;
  /** Rango transversal [tMinM, tMaxM] */
  tRangeM?: [number, number];
  /** Coeficientes de estiramiento longitudinal [linear, quadratic] */
  stretchLinear?: number;
  stretchQuadratic?: number;
  /** Empuje transversal hacia el sureste (m) */
  seTransverseBoost?: number;
}

/**
 * Modelo opcional de pendiente suave de terreno (Fase A5).
 */
export interface PanoramaGroundSlopeConfig {
  enabled: boolean;
  /** Pendiente este-oeste (m de elevación por m horizontal) */
  slopeEast?: number;
  /** Pendiente norte-sur (m de elevación por m horizontal) */
  slopeNorth?: number;
  /** Curvatura cuadrática radial (1/m) */
  curvature?: number;
}

export interface PanoramaCameraConfig {
  camera: PanoramaCameraPosition;
  yawOffsetDeg: number;
  tilt: PanoramaCameraTilt;
  panoDataDesktop: PanoramaPanoData;
  panoDataMobile: PanoramaPanoData;
  limits: PanoramaCameraLimits;
  /** Factor de expansión visual global de lotes alrededor de su centroide (ej. 1.00 - 1.25) */
  visualScale?: number;
  /** Configuración explícita y desactivable del parche de terreno suroeste */
  terrainPatch?: SouthwestTerrainPatchConfig;
  /** Modelo opcional de terreno inclinado */
  groundSlope?: PanoramaGroundSlopeConfig;
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
  /** True if the lot has a locked/validated override */
  locked?: boolean;
  /** Angular distance (degrees) to the nearest control point */
  nearestControlPointDeg?: number;
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

export interface PanoramaLotDelta {
  dYawRad: number;
  dPitchRad: number;
  scale: number;
  rotateRad: number;
  scaleX?: number;
  scaleY?: number;
  /** Desplazamiento en metros en el plano del suelo CAD (Este) */
  offsetEastM?: number;
  /** Desplazamiento en metros en el plano del suelo CAD (Norte) */
  offsetNorthM?: number;
}

export interface PanoramaLotOverride {
  /** Overridden corner vertices in spherical radians [[yawRad, pitchRad], ...] */
  verticesRad?: [number, number][];
  /** Parametric delta transformation (ground-plane or spherical) */
  delta?: PanoramaLotDelta;
  /** Optional overridden label position [yawRad, pitchRad] */
  labelRad?: [number, number];
  /** Marks that this lot has been visually verified by the admin */
  locked?: boolean;
  /** Optional note from admin */
  note?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type PanoramaLotOverridesMap = Record<string, PanoramaLotOverride>;

export interface PanoramaVersionSnapshot {
  version: number;
  savedAt: string;
  savedBy?: string;
  note?: string;
  config: PanoramaCameraConfig;
  controlPoints: PanoramaControlPoint[];
  overridesCount: number;
  overrides: PanoramaLotOverridesMap;
}
