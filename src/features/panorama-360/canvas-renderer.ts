import { LOT_STYLE, SELECTED_LOT_STYLE, type Lot, type LotStatus } from "@/features/lots";
import type { PanoramaContextLayers, ProjectedPanoramaLot } from "./types";

const PSV_SPHERE_RADIUS = 10;
const DEG_TO_RAD = Math.PI / 180;

/**
 * Umbral mínimo de altura en pantalla (px) para dibujar el polígono completo de un lote.
 * Por debajo de este umbral (salvo lote seleccionado/hover), se muestra un pin ligero con
 * el color de estado para evitar micro-polígonos ilegibles en el horizonte (Fase B2).
 */
export const MIN_LOT_SCREEN_HEIGHT_PX = 14;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface WaterQuad3D {
  v: [Vec3, Vec3, Vec3, Vec3];
}

export interface PreparedContextLayers {
  waterLakes3D: Vec3[][];
  riverQuads3D: WaterQuad3D[];
  riverBanks3D: Vec3[][];
  roads3D: Vec3[][];
}

export interface PreparedCanvasLot {
  id: string;
  label: string;
  manzana?: string;
  status: LotStatus;
  area: number;
  price: number;
  vertices3D: Vec3[];
  center3D: Vec3;
  labelRad: [number, number];
  polygonRad: [number, number][];
}

export interface VisibleScreenLot {
  id: string;
  label: string;
  manzana?: string;
  status: LotStatus;
  area: number;
  price: number;
  points: [number, number][];
  centerX: number;
  centerY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  inscribedWidth: number;
  screenHeight: number;
  isTinyOnScreen: boolean;
}

export interface ControlPointOverlayItem {
  id: string;
  label: string;
  yawRad: number;
  pitchRad: number;
  errorDeg?: number;
  errorMeters?: number;
}

interface LandmarkPin {
  title: string;
  vec3: Vec3;
}

const LANDMARKS: LandmarkPin[] = [
  { title: "Lago Principal", vec3: sphericalToVec3(21 * DEG_TO_RAD, -40.5 * DEG_TO_RAD) },
  { title: "Portería / Acceso", vec3: sphericalToVec3(12.5 * DEG_TO_RAD, -28.5 * DEG_TO_RAD) },
  {
    title: "Canchas de Tenis / Club",
    vec3: sphericalToVec3(11.7 * DEG_TO_RAD, -32.6 * DEG_TO_RAD),
  },
  { title: "Ronda del Río / Arroyo", vec3: sphericalToVec3(76 * DEG_TO_RAD, -48 * DEG_TO_RAD) },
  { title: "Reserva Norte", vec3: sphericalToVec3(-115 * DEG_TO_RAD, -32 * DEG_TO_RAD) },
];

export function sphericalToVec3(yaw: number, pitch: number): Vec3 {
  const cosP = Math.cos(pitch);
  return {
    x: PSV_SPHERE_RADIUS * -cosP * Math.sin(yaw),
    y: PSV_SPHERE_RADIUS * Math.sin(pitch),
    z: PSV_SPHERE_RADIUS * cosP * Math.cos(yaw),
  };
}

export function vec3ToSphericalRad(v: Vec3): [number, number] {
  const r = Math.hypot(v.x, v.y, v.z) || 1;
  const pitch = Math.asin(Math.max(-1, Math.min(1, v.y / r)));
  const yaw = Math.atan2(-v.x, v.z);
  return [yaw, pitch];
}

/**
 * Converts viewport pixel coordinates `(vx, vy)` inside the PSV container to
 * spherical `[yawRad, pitchRad]` in radians.
 */
export function screenPointToPanoramaRad(
  vx: number,
  vy: number,
  viewer: unknown,
): [number, number] | null {
  const v = viewer as {
    dataHelper?: {
      viewerCoordsToSphericalCoords?: (pos: { x: number; y: number }) => {
        yaw?: number;
        pitch?: number;
      } | null;
    };
    state?: { size?: { width: number; height: number } };
    renderer?: {
      camera?: {
        matrixWorld?: { elements: number[] };
        projectionMatrix?: { elements: number[] };
      };
    };
  } | null;

  if (!v) return null;

  if (typeof v.dataHelper?.viewerCoordsToSphericalCoords === "function") {
    try {
      const res = v.dataHelper.viewerCoordsToSphericalCoords({ x: vx, y: vy });
      if (res && typeof res.yaw === "number" && typeof res.pitch === "number") {
        let yaw = res.yaw;
        while (yaw > Math.PI) yaw -= Math.PI * 2;
        while (yaw < -Math.PI) yaw += Math.PI * 2;
        return [yaw, res.pitch];
      }
    } catch {
      // Fallback to matrix unprojection below
    }
  }

  const width = v.state?.size?.width ?? 0;
  const height = v.state?.size?.height ?? 0;
  const proj = v.renderer?.camera?.projectionMatrix?.elements;
  const world = v.renderer?.camera?.matrixWorld?.elements;
  if (width <= 0 || height <= 0 || !proj || !world || proj[0] === 0 || proj[5] === 0) {
    return null;
  }

  const ndcX = (vx / width) * 2 - 1;
  const ndcY = 1 - (vy / height) * 2;
  const camX = ndcX / proj[0];
  const camY = ndcY / proj[5];
  const camZ = -1;

  const wx = world[0] * camX + world[4] * camY + world[8] * camZ;
  const wy = world[1] * camX + world[5] * camY + world[9] * camZ;
  const wz = world[2] * camX + world[6] * camY + world[10] * camZ;

  return vec3ToSphericalRad({ x: wx, y: wy, z: wz });
}

function interpRad(p1: [number, number], p2: [number, number], f: number): [number, number] {
  return [p1[0] + (p2[0] - p1[0]) * f, p1[1] + (p2[1] - p1[1]) * f];
}

export function prepareCanvasContextLayers(layers?: PanoramaContextLayers): PreparedContextLayers {
  const waterLakes3D: Vec3[][] = [];
  const riverQuads3D: WaterQuad3D[] = [];
  const riverBanks3D: Vec3[][] = [];
  const roads3D: Vec3[][] = [];

  if (layers?.water) {
    for (const ring of layers.water) {
      if (ring.length < 3) continue;

      if (ring.length > 100) {
        const bank1 = ring.slice(0, 71);
        const bank2 = ring.slice(71).reverse();
        riverBanks3D.push(bank1.map(([y, p]) => sphericalToVec3(y, p)));
        riverBanks3D.push(bank2.map(([y, p]) => sphericalToVec3(y, p)));

        const N = 85;
        for (let s = 0; s < N; s++) {
          const t0 = s / N;
          const t1 = (s + 1) / N;
          const i1_0 = t0 * (bank1.length - 1);
          const i1_1 = t1 * (bank1.length - 1);
          const i2_0 = t0 * (bank2.length - 1);
          const i2_1 = t1 * (bank2.length - 1);

          const p1_0 = interpRad(bank1[Math.floor(i1_0)], bank1[Math.ceil(i1_0)], i1_0 % 1);
          const p1_1 = interpRad(bank1[Math.floor(i1_1)], bank1[Math.ceil(i1_1)], i1_1 % 1);
          const p2_0 = interpRad(bank2[Math.floor(i2_0)], bank2[Math.ceil(i2_0)], i2_0 % 1);
          const p2_1 = interpRad(bank2[Math.floor(i2_1)], bank2[Math.ceil(i2_1)], i2_1 % 1);

          riverQuads3D.push({
            v: [
              sphericalToVec3(p1_0[0], p1_0[1]),
              sphericalToVec3(p1_1[0], p1_1[1]),
              sphericalToVec3(p2_1[0], p2_1[1]),
              sphericalToVec3(p2_0[0], p2_0[1]),
            ],
          });
        }
      } else {
        waterLakes3D.push(ring.map(([y, p]) => sphericalToVec3(y, p)));
      }
    }
  }

  if (layers?.roads) {
    for (const ring of layers.roads) {
      if (ring.length >= 3) {
        roads3D.push(ring.map(([y, p]) => sphericalToVec3(y, p)));
      }
    }
  }

  return { waterLakes3D, riverQuads3D, riverBanks3D, roads3D };
}

export function prepareCanvasLots(
  projectedLots: ProjectedPanoramaLot[],
  lotById: Map<string, Lot>,
): PreparedCanvasLot[] {
  const out: PreparedCanvasLot[] = [];
  for (const pLot of projectedLots) {
    if (!pLot.polygonRad || pLot.polygonRad.length < 3) continue;
    const live = lotById.get(pLot.id);
    out.push({
      id: pLot.id,
      label: pLot.label.replace(/^L-/i, ""),
      manzana: pLot.manzana,
      status: live?.status ?? "Disponible",
      area: live?.area ?? 0,
      price: live?.price ?? 0,
      vertices3D: pLot.polygonRad.map(([y, p]) => sphericalToVec3(y, p)),
      center3D: sphericalToVec3(pLot.labelRad[0], pLot.labelRad[1]),
      labelRad: pLot.labelRad,
      polygonRad: pLot.polygonRad,
    });
  }
  return out;
}

function isPointInPolygon2D(x: number, y: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function computeScreenPolygonMetrics(pts: [number, number][]): {
  centerX: number;
  centerY: number;
  inscribedWidth: number;
} {
  const n = pts.length;
  let signedArea2 = 0;
  let cxAcc = 0;
  let cyAcc = 0;
  let avgX = 0;
  let avgY = 0;
  let maxEdgeSq = 1;

  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const cross = x0 * y1 - x1 * y0;
    signedArea2 += cross;
    cxAcc += (x0 + x1) * cross;
    cyAcc += (y0 + y1) * cross;
    avgX += x0;
    avgY += y0;
    const edSq = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
    if (edSq > maxEdgeSq) maxEdgeSq = edSq;
  }

  avgX /= n;
  avgY /= n;

  const area2D = Math.abs(signedArea2) * 0.5;
  let centerX = avgX;
  let centerY = avgY;

  if (area2D > 1e-2) {
    const factor = 1 / (3 * signedArea2);
    centerX = cxAcc * factor;
    centerY = cyAcc * factor;
  }

  if (!isPointInPolygon2D(centerX, centerY, pts)) {
    const half = Math.floor(n / 2);
    const mx = (pts[0][0] + pts[half][0]) * 0.5;
    const my = (pts[0][1] + pts[half][1]) * 0.5;
    if (isPointInPolygon2D(mx, my, pts)) {
      centerX = mx;
      centerY = my;
    } else {
      centerX = avgX;
      centerY = avgY;
    }
  }

  const maxEdgeLen = Math.sqrt(maxEdgeSq);
  const inscribedWidth = (2 * area2D) / Math.max(1, maxEdgeLen);

  return { centerX, centerY, inscribedWidth };
}

export function hitTestPanoramaLots(
  vx: number,
  vy: number,
  visibleLots: VisibleScreenLot[],
): VisibleScreenLot | null {
  for (let i = visibleLots.length - 1; i >= 0; i--) {
    const vl = visibleLots[i];
    const dx = vx - vl.centerX;
    const dy = vy - vl.centerY;
    if (dx * dx + dy * dy <= 169) return vl;
  }
  for (let i = visibleLots.length - 1; i >= 0; i--) {
    const vl = visibleLots[i];
    if (
      vx >= vl.minX &&
      vx <= vl.maxX &&
      vy >= vl.minY &&
      vy <= vl.maxY &&
      isPointInPolygon2D(vx, vy, vl.points)
    ) {
      return vl;
    }
  }
  return null;
}

/**
 * Hit-tests the vertex handles of the currently selected lot in the editor.
 * Returns the vertex index `[0..n-1]` if within `radiusPx`, or `null`.
 */
export function hitTestLotVertexHandle(
  vx: number,
  vy: number,
  selectedLot: VisibleScreenLot | null | undefined,
  radiusPx = 11,
): number | null {
  if (!selectedLot || !selectedLot.points.length) return null;
  const rSq = radiusPx * radiusPx;
  let bestIdx: number | null = null;
  let bestDistSq = rSq;

  for (let i = 0; i < selectedLot.points.length; i++) {
    const [px, py] = selectedLot.points[i];
    const dSq = (vx - px) * (vx - px) + (vy - py) * (vy - py);
    if (dSq <= bestDistSq) {
      bestDistSq = dSq;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export interface LiveDragOffset {
  deltaYawRad: number;
  deltaPitchRad: number;
  scope: "global" | "manzana" | "piece" | "lot";
  activeManzana?: string;
  selectedPieceIds?: string[];
  selectedLotId?: string;
}

export interface RenderLotsOptions {
  canvas: HTMLCanvasElement;
  viewer: unknown;
  lots: PreparedCanvasLot[];
  contextLayers?: PreparedContextLayers;
  showLots: boolean;
  showContextLayers?: boolean;
  showRoadsOnly?: boolean;
  visualStyle: "pins" | "filled";
  statusFilter: "ALL" | "Disponible" | "Reservado" | "Vendido" | "Por confirmar";
  selectedLotId?: string;
  hoveredLotId?: string | null;
  highlightManzana?: string;
  highlightLotIds?: string[];
  liveDragOffset?: LiveDragOffset | null;
  /** Opacidad global del overlay de lotes (0..1, por defecto 1). */
  overlayOpacity?: number;
  /** Modo solo contorno para alinear viendo el terreno real debajo (Fase A4). */
  outlineOnly?: boolean;
  /** Conjunto de IDs de lotes dudosos (>=20° del punto de control más cercano y !locked). */
  doubtfulLotIds?: ReadonlySet<string>;
  /** Si true, resalta lotes dudosos con borde discontinuo ámbar (Fase A4). */
  highlightDoubtfulLots?: boolean;
  /** Si true, en zonas de baja confianza muestra pin + contorno punteado (Fase B3). */
  lowConfidencePinMode?: boolean;
  /** Si true, dibuja handles circulares en los vértices del lote seleccionado (Fase A2). */
  editableVertices?: boolean;
  /** Índice del vértice actualmente arrastrado o bajo hover en el editor. */
  activeVertexIndex?: number | null;
  /** Puntos de control para superponer en el modo admin con su error en ° y m (Fase A4). */
  controlPointsOverlay?: ControlPointOverlayItem[];
  /** Si true (durante drag de cámara), omite sombras/halos costosos para mantener 60fps (Fase D1). */
  isInteracting?: boolean;
}

export function renderPanoramaLotsCanvas(opts: RenderLotsOptions): VisibleScreenLot[] {
  const {
    canvas,
    lots,
    contextLayers,
    showLots,
    showContextLayers = false,
    showRoadsOnly = false,
    visualStyle,
    statusFilter,
    selectedLotId,
    hoveredLotId,
    highlightManzana,
    highlightLotIds,
    liveDragOffset,
    overlayOpacity = 1,
    outlineOnly = false,
    doubtfulLotIds,
    highlightDoubtfulLots = false,
    lowConfidencePinMode = false,
    editableVertices = false,
    activeVertexIndex = null,
    controlPointsOverlay,
    isInteracting = false,
  } = opts;

  const viewer = opts.viewer as {
    state?: { size?: { width: number; height: number }; direction?: Vec3 };
    renderer?: {
      camera?: {
        matrixWorldInverse?: { elements: number[] };
        projectionMatrix?: { elements: number[] };
      };
    };
    getZoomLevel?: () => number;
  } | null;

  if (!canvas || !viewer?.state?.size || !viewer?.renderer?.camera) return [];

  const width = viewer.state.size.width;
  const height = viewer.state.size.height;
  if (width <= 0 || height <= 0) return [];

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(width * dpr);
  const targetH = Math.round(height * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const clampedOpacity = Math.max(0, Math.min(1, overlayOpacity));
  if (!showLots || lots.length === 0 || clampedOpacity <= 0.01) return [];

  const viewMat = viewer.renderer.camera.matrixWorldInverse?.elements;
  const projMat = viewer.renderer.camera.projectionMatrix?.elements;
  const camDir = viewer.state.direction;
  if (!viewMat || !projMat || !camDir) return [];

  const m = new Float64Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      m[c * 4 + r] =
        projMat[0 * 4 + r] * viewMat[c * 4 + 0] +
        projMat[1 * 4 + r] * viewMat[c * 4 + 1] +
        projMat[2 * 4 + r] * viewMat[c * 4 + 2] +
        projMat[3 * 4 + r] * viewMat[c * 4 + 3];
    }
  }

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const zoomLevel = viewer.getZoomLevel ? viewer.getZoomLevel() : 30;
  // Trazo interior 1.2–1.6 px escalado con el zoom (clamp 0.8..2.4 px) — Fase C2
  const innerStrokeWidth = Math.min(2.4, Math.max(0.8, 1.2 + (zoomLevel / 100) * 0.45));

  const dirLen = Math.hypot(camDir.x, camDir.y, camDir.z) || 1;
  const dx = camDir.x / dirLen;
  const dy = camDir.y / dirLen;
  const dz = camDir.z / dirLen;

  ctx.save();
  ctx.globalAlpha = clampedOpacity;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Render water (rivers and lakes) and road context layers
  if (contextLayers && (showContextLayers || showRoadsOnly)) {
    if (showContextLayers && !showRoadsOnly && contextLayers.waterLakes3D?.length) {
      for (let lIdx = 0; lIdx < contextLayers.waterLakes3D.length; lIdx++) {
        const lake = contextLayers.waterLakes3D[lIdx];
        if (lake.length < 3) continue;
        let allInFront = true;
        const pts: [number, number][] = [];
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (let v = 0; v < lake.length; v++) {
          const pt = lake[v];
          const w = m[3] * pt.x + m[7] * pt.y + m[11] * pt.z + m[15];
          if (w <= 0.05) {
            allInFront = false;
            break;
          }
          const invW = 1 / w;
          const sx = ((m[0] * pt.x + m[4] * pt.y + m[8] * pt.z + m[12]) * invW + 1) * halfW;
          const sy = (1 - (m[1] * pt.x + m[5] * pt.y + m[9] * pt.z + m[13]) * invW) * halfH;
          pts.push([sx, sy]);
          if (sx < minX) minX = sx;
          if (sx > maxX) maxX = sx;
          if (sy < minY) minY = sy;
          if (sy > maxY) maxY = sy;
        }

        if (
          !allInFront ||
          pts.length < 3 ||
          maxX < 0 ||
          minX > width ||
          maxY < 0 ||
          minY > height
        ) {
          continue;
        }

        const lakePath = new Path2D();
        lakePath.moveTo(pts[0][0], pts[0][1]);
        for (let v = 1; v < pts.length; v++) {
          lakePath.lineTo(pts[v][0], pts[v][1]);
        }
        lakePath.closePath();

        ctx.fillStyle = "rgba(2, 132, 199, 0.20)";
        ctx.strokeStyle = "rgba(56, 189, 248, 0.62)";
        ctx.lineWidth = 1.25;
        if (!outlineOnly) ctx.fill(lakePath);
        ctx.stroke(lakePath);
      }
    }

    if (showContextLayers && !showRoadsOnly && contextLayers.riverQuads3D?.length && !outlineOnly) {
      ctx.fillStyle = "rgba(2, 132, 199, 0.17)";
      for (let qIdx = 0; qIdx < contextLayers.riverQuads3D.length; qIdx++) {
        const quad = contextLayers.riverQuads3D[qIdx].v;
        let inFront = true;
        const qPts: [number, number][] = [];

        for (let v = 0; v < 4; v++) {
          const pt = quad[v];
          const w = m[3] * pt.x + m[7] * pt.y + m[11] * pt.z + m[15];
          if (w <= 0.1) {
            inFront = false;
            break;
          }
          const invW = 1 / w;
          const sx = ((m[0] * pt.x + m[4] * pt.y + m[8] * pt.z + m[12]) * invW + 1) * halfW;
          const sy = (1 - (m[1] * pt.x + m[5] * pt.y + m[9] * pt.z + m[13]) * invW) * halfH;
          qPts.push([sx, sy]);
        }
        if (!inFront || qPts.length < 4) continue;

        const maxDiag = Math.max(
          Math.hypot(qPts[0][0] - qPts[2][0], qPts[0][1] - qPts[2][1]),
          Math.hypot(qPts[1][0] - qPts[3][0], qPts[1][1] - qPts[3][1]),
        );
        if (maxDiag > Math.min(width, height) * 0.45) continue;

        ctx.beginPath();
        ctx.moveTo(qPts[0][0], qPts[0][1]);
        ctx.lineTo(qPts[1][0], qPts[1][1]);
        ctx.lineTo(qPts[2][0], qPts[2][1]);
        ctx.lineTo(qPts[3][0], qPts[3][1]);
        ctx.closePath();
        ctx.fill();
      }
    }

    if (showContextLayers && !showRoadsOnly && contextLayers.riverBanks3D?.length) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.58)";
      ctx.lineWidth = 1.15;

      for (let bIdx = 0; bIdx < contextLayers.riverBanks3D.length; bIdx++) {
        const bank = contextLayers.riverBanks3D[bIdx];
        let prevSx = 0;
        let prevSy = 0;
        let hasPrev = false;

        for (let v = 0; v < bank.length; v++) {
          const pt = bank[v];
          const w = m[3] * pt.x + m[7] * pt.y + m[11] * pt.z + m[15];
          if (w <= 0.1) {
            hasPrev = false;
            continue;
          }
          const invW = 1 / w;
          const sx = ((m[0] * pt.x + m[4] * pt.y + m[8] * pt.z + m[12]) * invW + 1) * halfW;
          const sy = (1 - (m[1] * pt.x + m[5] * pt.y + m[9] * pt.z + m[13]) * invW) * halfH;

          if (
            sx < -width * 0.25 ||
            sx > width * 1.25 ||
            sy < -height * 0.25 ||
            sy > height * 1.25
          ) {
            hasPrev = false;
            continue;
          }

          if (hasPrev) {
            const stepDist = Math.hypot(sx - prevSx, sy - prevSy);
            if (stepDist < Math.min(width, height) * 0.25) {
              ctx.beginPath();
              ctx.moveTo(prevSx, prevSy);
              ctx.lineTo(sx, sy);
              ctx.stroke();
            }
          }
          prevSx = sx;
          prevSy = sy;
          hasPrev = true;
        }
      }
    }

    if (contextLayers.roads3D?.length) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
      ctx.lineWidth = 1.3;

      for (let rIdx = 0; rIdx < contextLayers.roads3D.length; rIdx++) {
        const road = contextLayers.roads3D[rIdx];
        let prevSx = 0;
        let prevSy = 0;
        let hasPrev = false;

        for (let v = 0; v < road.length; v++) {
          const pt = road[v];
          const w = m[3] * pt.x + m[7] * pt.y + m[11] * pt.z + m[15];
          if (w <= 0.12) {
            hasPrev = false;
            continue;
          }
          const invW = 1 / w;
          const sx = ((m[0] * pt.x + m[4] * pt.y + m[8] * pt.z + m[12]) * invW + 1) * halfW;
          const sy = (1 - (m[1] * pt.x + m[5] * pt.y + m[9] * pt.z + m[13]) * invW) * halfH;

          if (sx < -width * 0.2 || sx > width * 1.2 || sy < -height * 0.2 || sy > height * 1.2) {
            hasPrev = false;
            continue;
          }

          if (hasPrev) {
            const stepDist = Math.hypot(sx - prevSx, sy - prevSy);
            if (stepDist < Math.min(width, height) * 0.25) {
              ctx.beginPath();
              ctx.moveTo(prevSx, prevSy);
              ctx.lineTo(sx, sy);
              ctx.stroke();
            }
          }
          prevSx = sx;
          prevSy = sy;
          hasPrev = true;
        }
      }
      ctx.restore();
    }
  }

  const pathAllPolygons = new Path2D();
  const pathAvailable = new Path2D();
  const pathReserved = new Path2D();
  const pathSold = new Path2D();
  const pathUnconfirmed = new Path2D();
  const pathManzanaHighlight = new Path2D();
  const pathDoubtfulLots = new Path2D();

  let hasAnyPolygon = false;
  let hasAvailable = false;
  let hasReserved = false;
  let hasSold = false;
  let hasUnconfirmed = false;
  let hasManzanaHighlight = false;
  let hasDoubtfulLots = false;

  let selectedScreenLot: VisibleScreenLot | null = null;
  let hoveredScreenLot: VisibleScreenLot | null = null;
  const visibleList: VisibleScreenLot[] = [];

  for (let i = 0; i < lots.length; i++) {
    const lot = lots[i];
    if (statusFilter !== "ALL") {
      if (statusFilter === "Disponible") {
        if (lot.status !== "Disponible" && lot.status !== "Últimas unidades") continue;
      } else if (lot.status !== statusFilter) {
        continue;
      }
    }

    let isOffset = false;
    if (
      liveDragOffset &&
      (Math.abs(liveDragOffset.deltaYawRad) > 1e-6 || Math.abs(liveDragOffset.deltaPitchRad) > 1e-6)
    ) {
      if (liveDragOffset.scope === "global") {
        isOffset = true;
      } else if (
        liveDragOffset.scope === "piece" &&
        liveDragOffset.selectedPieceIds &&
        liveDragOffset.selectedPieceIds.includes(lot.id)
      ) {
        isOffset = true;
      } else if (
        liveDragOffset.scope === "manzana" &&
        lot.manzana &&
        lot.manzana === liveDragOffset.activeManzana
      ) {
        isOffset = true;
      } else if (liveDragOffset.scope === "lot" && lot.id === liveDragOffset.selectedLotId) {
        isOffset = true;
      }
    }

    const center3D = isOffset
      ? sphericalToVec3(
          lot.labelRad[0] + liveDragOffset!.deltaYawRad,
          lot.labelRad[1] + liveDragOffset!.deltaPitchRad,
        )
      : lot.center3D;

    const cDot = (center3D.x * dx + center3D.y * dy + center3D.z * dz) / PSV_SPHERE_RADIUS;
    if (cDot < 0.08) continue;

    const verts = isOffset
      ? (lot.polygonRad || []).map(([y, p]) =>
          sphericalToVec3(y + liveDragOffset!.deltaYawRad, p + liveDragOffset!.deltaPitchRad),
        )
      : lot.vertices3D;
    if (verts.length < 3) continue;

    const pts: [number, number][] = [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let behind = false;

    for (let v = 0; v < verts.length; v++) {
      const pt = verts[v];
      const w = m[3] * pt.x + m[7] * pt.y + m[11] * pt.z + m[15];
      if (w <= 0.05) {
        behind = true;
        break;
      }
      const invW = 1 / w;
      const sx = ((m[0] * pt.x + m[4] * pt.y + m[8] * pt.z + m[12]) * invW + 1) * halfW;
      const sy = (1 - (m[1] * pt.x + m[5] * pt.y + m[9] * pt.z + m[13]) * invW) * halfH;
      pts.push([sx, sy]);
      if (sx < minX) minX = sx;
      if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy;
      if (sy > maxY) maxY = sy;
    }

    if (
      behind ||
      pts.length < 3 ||
      maxX < 0 ||
      minX > width ||
      maxY < 0 ||
      minY > height ||
      maxX - minX > width * 0.78
    ) {
      continue;
    }

    const { centerX, centerY, inscribedWidth } = computeScreenPolygonMetrics(pts);
    const screenHeight = maxY - minY;
    const isSelected = lot.id === selectedLotId;
    const isHovered = lot.id === hoveredLotId;
    const isDoubtful = Boolean(doubtfulLotIds?.has(lot.id));

    // Fase B2: Si un lote mide < 14 px de alto en pantalla (y no está seleccionado/hover),
    // no dibujamos el polígono microscópico sino únicamente su pin de estado.
    const isTinyOnScreen =
      !isSelected &&
      !isHovered &&
      (screenHeight < MIN_LOT_SCREEN_HEIGHT_PX || (lowConfidencePinMode && isDoubtful));

    const screenLot: VisibleScreenLot = {
      id: lot.id,
      label: lot.label,
      manzana: lot.manzana,
      status: lot.status,
      area: lot.area,
      price: lot.price,
      points: pts,
      centerX,
      centerY,
      minX,
      maxX,
      minY,
      maxY,
      inscribedWidth,
      screenHeight,
      isTinyOnScreen,
    };
    visibleList.push(screenLot);

    if (isSelected) {
      selectedScreenLot = screenLot;
      continue;
    }
    if (isHovered) {
      hoveredScreenLot = screenLot;
    }

    const isHighlighted =
      (highlightLotIds && highlightLotIds.includes(lot.id)) ||
      (highlightManzana && lot.manzana === highlightManzana);

    if (isHighlighted) {
      hasManzanaHighlight = true;
      pathManzanaHighlight.moveTo(pts[0][0], pts[0][1]);
      for (let v = 1; v < pts.length; v++) pathManzanaHighlight.lineTo(pts[v][0], pts[v][1]);
      pathManzanaHighlight.closePath();
    }

    if ((highlightDoubtfulLots || lowConfidencePinMode) && isDoubtful) {
      hasDoubtfulLots = true;
      pathDoubtfulLots.moveTo(pts[0][0], pts[0][1]);
      for (let v = 1; v < pts.length; v++) pathDoubtfulLots.lineTo(pts[v][0], pts[v][1]);
      pathDoubtfulLots.closePath();
    }

    if (isTinyOnScreen) {
      continue;
    }

    hasAnyPolygon = true;
    pathAllPolygons.moveTo(pts[0][0], pts[0][1]);
    for (let v = 1; v < pts.length; v++) pathAllPolygons.lineTo(pts[v][0], pts[v][1]);
    pathAllPolygons.closePath();

    const target =
      lot.status === "Vendido"
        ? ((hasSold = true), pathSold)
        : lot.status === "Reservado"
          ? ((hasReserved = true), pathReserved)
          : lot.status === "Por confirmar"
            ? ((hasUnconfirmed = true), pathUnconfirmed)
            : ((hasAvailable = true), pathAvailable);
    target.moveTo(pts[0][0], pts[0][1]);
    for (let v = 1; v < pts.length; v++) target.lineTo(pts[v][0], pts[v][1]);
    target.closePath();
  }

  // 2. Render Lot Polygons (Fase C1 + C2: Paleta Recorrido de Terreno + Halo oscuro + Trazo interior)
  if (hasAnyPolygon) {
    // 2a. Rellenos semitransparentes (salvo si está activo outlineOnly)
    if (!outlineOnly) {
      const pinScale = visualStyle === "pins" ? 0.55 : 1;
      ctx.save();
      ctx.globalAlpha = clampedOpacity * pinScale;
      if (hasAvailable) {
        ctx.fillStyle = LOT_STYLE.Disponible.fillRgba;
        ctx.fill(pathAvailable);
      }
      if (hasReserved) {
        ctx.fillStyle = LOT_STYLE.Reservado.fillRgba;
        ctx.fill(pathReserved);
      }
      if (hasSold) {
        ctx.fillStyle = LOT_STYLE.Vendido.fillRgba;
        ctx.fill(pathSold);
      }
      if (hasUnconfirmed) {
        ctx.fillStyle = LOT_STYLE["Por confirmar"].fillRgba;
        ctx.fill(pathUnconfirmed);
      }
      ctx.restore();
    }

    // 2b. Halo exterior oscuro (0.22 alpha, +1 px de ancho) para separar lotes sobre césped/tierra
    if (!isInteracting) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
      ctx.lineWidth = innerStrokeWidth + 1.0;
      ctx.stroke(pathAllPolygons);
    }

    // 2c. Trazo interior por estado (1.2–1.6 px escalado con zoom)
    ctx.lineWidth = innerStrokeWidth;
    if (hasAvailable) {
      ctx.strokeStyle = LOT_STYLE.Disponible.strokeColor;
      ctx.stroke(pathAvailable);
    }
    if (hasReserved) {
      ctx.strokeStyle = LOT_STYLE.Reservado.strokeColor;
      ctx.stroke(pathReserved);
    }
    if (hasSold) {
      ctx.strokeStyle = LOT_STYLE.Vendido.strokeColor;
      ctx.stroke(pathSold);
    }
    if (hasUnconfirmed) {
      ctx.strokeStyle = LOT_STYLE["Por confirmar"].strokeColor;
      ctx.stroke(pathUnconfirmed);
    }
  }

  // 2d. Borde discontinuo ámbar para lotes dudosos (Fase A4 / B3)
  if (hasDoubtfulLots) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.92)";
    ctx.lineWidth = innerStrokeWidth + 0.6;
    ctx.stroke(pathDoubtfulLots);
    ctx.restore();
  }

  // 2e. Resaltado de selección múltiple / manzana
  if (hasManzanaHighlight) {
    if (!outlineOnly) {
      ctx.fillStyle = "rgba(250, 204, 21, 0.18)";
      ctx.fill(pathManzanaHighlight);
    }
    ctx.strokeStyle = "rgba(250, 204, 21, 0.90)";
    ctx.lineWidth = innerStrokeWidth + 0.8;
    ctx.stroke(pathManzanaHighlight);
  }

  // 2f. Lote en Hover (+8% opacidad de relleno, borde blanco vivo) — Fase C2
  if (hoveredScreenLot && hoveredScreenLot.id !== selectedLotId) {
    const hPath = new Path2D();
    const pts = hoveredScreenLot.points;
    hPath.moveTo(pts[0][0], pts[0][1]);
    for (let v = 1; v < pts.length; v++) hPath.lineTo(pts[v][0], pts[v][1]);
    hPath.closePath();

    const hStyle = LOT_STYLE[hoveredScreenLot.status] ?? LOT_STYLE.Disponible;
    if (!outlineOnly) {
      ctx.fillStyle = hStyle.fillHoverRgba;
      ctx.fill(hPath);
    }
    if (!isInteracting) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
      ctx.lineWidth = innerStrokeWidth + 1.4;
      ctx.stroke(hPath);
    }
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = innerStrokeWidth + 0.6;
    ctx.stroke(hPath);
  }

  // 2g. Lote Seleccionado: relleno vivo, borde 2.4 px #fef08a y glow suave (shadowBlur 8) — Fase C2
  if (selectedScreenLot) {
    const sPath = new Path2D();
    const pts = selectedScreenLot.points;
    sPath.moveTo(pts[0][0], pts[0][1]);
    for (let v = 1; v < pts.length; v++) sPath.lineTo(pts[v][0], pts[v][1]);
    sPath.closePath();

    ctx.save();
    if (!isInteracting) {
      ctx.shadowColor = SELECTED_LOT_STYLE.glowColor;
      ctx.shadowBlur = SELECTED_LOT_STYLE.glowBlur;
    }
    if (!outlineOnly) {
      ctx.fillStyle = SELECTED_LOT_STYLE.fillRgba;
      ctx.fill(sPath);
    }
    ctx.strokeStyle = SELECTED_LOT_STYLE.strokeColor;
    ctx.lineWidth = SELECTED_LOT_STYLE.strokeWidth;
    ctx.stroke(sPath);
    ctx.restore();

    // Fase A2: Handles circulares para arrastrar vértices individuales en el Calibrador
    if (editableVertices) {
      ctx.save();
      for (let v = 0; v < pts.length; v++) {
        const [vx, vy] = pts[v];
        const isActiveV = activeVertexIndex === v;
        ctx.beginPath();
        ctx.arc(vx, vy, isActiveV ? 6.8 : 5.2, 0, Math.PI * 2);
        ctx.fillStyle = isActiveV ? "#f59e0b" : "#ffffff";
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = "#0f172a";
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 3. Etiquetas y pines de lotes (Fase C3 + B2: Chip oscuro redondeado + culling de colisiones)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const placedBoxes: [number, number, number, number][] = [];

  // Reservar espacio prioritario para el lote seleccionado y el lote en hover
  if (selectedScreenLot) {
    placedBoxes.push([
      selectedScreenLot.centerX - 24,
      selectedScreenLot.centerY - 12,
      selectedScreenLot.centerX + 24,
      selectedScreenLot.centerY + 12,
    ]);
  }

  for (let i = 0; i < visibleList.length; i++) {
    const vl = visibleList[i];
    if (vl.id === selectedLotId) continue;

    const { centerX: cx, centerY: cy, inscribedWidth, screenHeight, isTinyOnScreen } = vl;
    if (cx < -16 || cx > width + 16 || cy < -16 || cy > height + 16) continue;

    const isHovered = vl.id === hoveredLotId;
    const styleToken = LOT_STYLE[vl.status] ?? LOT_STYLE.Disponible;

    // Determinar si el lote tiene espacio suficiente para el chip redondeado oscuro (Fase C3)
    const minChipInscribedW = zoomLevel >= 55 ? 11.5 : 13.5;
    const fitsChip =
      isHovered ||
      (!isTinyOnScreen &&
        visualStyle === "filled" &&
        inscribedWidth >= minChipInscribedW &&
        screenHeight >= 15);

    if (fitsChip) {
      const fontSize = isHovered ? 10.5 : inscribedWidth >= 19 ? 9.5 : 8.5;
      ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      const textW = ctx.measureText(vl.label).width;
      const chipW = Math.max(18, textW + (isHovered ? 11 : 8));
      const chipH = isHovered ? 16 : 13.5;
      const boxMinX = cx - chipW * 0.5;
      const boxMaxX = cx + chipW * 0.5;
      const boxMinY = cy - chipH * 0.5;
      const boxMaxY = cy + chipH * 0.5;

      let collides = false;
      if (!isHovered) {
        for (let b = 0; b < placedBoxes.length; b++) {
          const [bMinX, bMinY, bMaxX, bMaxY] = placedBoxes[b];
          if (
            boxMaxX + 2 >= bMinX &&
            boxMinX - 2 <= bMaxX &&
            boxMaxY + 2 >= bMinY &&
            boxMinY - 2 <= bMaxY
          ) {
            collides = true;
            break;
          }
        }
      }

      if (!collides) {
        placedBoxes.push([boxMinX, boxMinY, boxMaxX, boxMaxY]);
        ctx.fillStyle = isHovered ? "rgba(15, 23, 17, 0.92)" : "rgba(15, 23, 17, 0.78)";
        ctx.strokeStyle = isHovered ? "#fef08a" : "rgba(255, 255, 255, 0.68)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxMinX, boxMinY, chipW, chipH, chipH * 0.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isHovered ? "#fef08a" : "#ffffff";
        ctx.fillText(vl.label, cx, cy + 0.5);
        continue;
      }
    }

    // Lote pequeño o en modo "pins": punto/pin discreto con color de estado
    const dotRadius = isHovered ? 5.2 : isTinyOnScreen ? 3.0 : inscribedWidth >= 9 ? 3.5 : 2.7;
    if (inscribedWidth >= 3.8 || isTinyOnScreen || isHovered) {
      ctx.beginPath();
      ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = styleToken.dotColor;
      ctx.fill();
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.90)";
      ctx.stroke();
    }
  }

  // 4. Compact landmark pins
  for (let i = 0; i < LANDMARKS.length; i++) {
    const lm = LANDMARKS[i];
    const lDot = (lm.vec3.x * dx + lm.vec3.y * dy + lm.vec3.z * dz) / PSV_SPHERE_RADIUS;
    if (lDot < 0.15) continue;

    const lw = m[3] * lm.vec3.x + m[7] * lm.vec3.y + m[11] * lm.vec3.z + m[15];
    if (lw <= 0.05) continue;
    const invW = 1 / lw;
    const lx =
      ((m[0] * lm.vec3.x + m[4] * lm.vec3.y + m[8] * lm.vec3.z + m[12]) * invW + 1) * halfW;
    const ly =
      (1 - (m[1] * lm.vec3.x + m[5] * lm.vec3.y + m[9] * lm.vec3.z + m[13]) * invW) * halfH;
    if (lx < 40 || lx > width - 40 || ly < 45 || ly > height - 35) continue;

    const topY = ly - 20;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx, topY);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();

    ctx.font = "700 10px ui-sans-serif, system-ui, sans-serif";
    const tw = ctx.measureText(lm.title).width;
    const bw = tw + 14;
    const bh = 18;
    ctx.fillStyle = "rgba(15, 23, 17, 0.8)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(lx - bw * 0.5, topY - bh, bw, bh, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(lm.title, lx, topY - bh * 0.5 + 0.5);
  }

  // 5. Puntos de control con error en ° y m (Fase A4: Calibrador Admin)
  if (controlPointsOverlay && controlPointsOverlay.length > 0) {
    for (let i = 0; i < controlPointsOverlay.length; i++) {
      const cp = controlPointsOverlay[i];
      const cpVec = sphericalToVec3(cp.yawRad, cp.pitchRad);
      const cpDot = (cpVec.x * dx + cpVec.y * dy + cpVec.z * dz) / PSV_SPHERE_RADIUS;
      if (cpDot < 0.1) continue;

      const cw = m[3] * cpVec.x + m[7] * cpVec.y + m[11] * cpVec.z + m[15];
      if (cw <= 0.05) continue;
      const invW = 1 / cw;
      const cx = ((m[0] * cpVec.x + m[4] * cpVec.y + m[8] * cpVec.z + m[12]) * invW + 1) * halfW;
      const cy = (1 - (m[1] * cpVec.x + m[5] * cpVec.y + m[9] * cpVec.z + m[13]) * invW) * halfH;
      if (cx < 12 || cx > width - 12 || cy < 12 || cy > height - 12) continue;

      const isHighError = (cp.errorDeg ?? 0) > 4.0;
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = isHighError ? "#f43f5e" : "#22d3ee";
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();

      const errLabel =
        cp.errorDeg !== undefined
          ? `${cp.label} · ${cp.errorDeg.toFixed(1)}° (${(cp.errorMeters ?? 0).toFixed(1)}m)`
          : cp.label;
      ctx.font = "700 9.5px ui-sans-serif, system-ui, sans-serif";
      const tw = ctx.measureText(errLabel).width;
      const bw = tw + 10;
      const bh = 16;
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.strokeStyle = isHighError ? "rgba(244, 63, 94, 0.8)" : "rgba(34, 211, 238, 0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - bw * 0.5, cy - 22, bw, bh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.fillText(errLabel, cx, cy - 14);
    }
  }

  // 6. Selected lot badge (siempre visible y prioritario)
  if (selectedScreenLot) {
    const text = `L-${selectedScreenLot.label}`;
    ctx.font = "800 11px ui-sans-serif, system-ui, sans-serif";
    const pw = Math.max(42, ctx.measureText(text).width + 14);
    const ph = 20;
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(
      selectedScreenLot.centerX - pw * 0.5,
      selectedScreenLot.centerY - ph * 0.5,
      pw,
      ph,
      10,
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#121811";
    ctx.fillText(text, selectedScreenLot.centerX, selectedScreenLot.centerY + 0.5);
  }

  ctx.restore();
  return visibleList;
}
