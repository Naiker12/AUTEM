import type { Lot, LotStatus } from "@/data/lots";
import type { PanoramaContextLayers, ProjectedPanoramaLot } from "./types";

const PSV_SPHERE_RADIUS = 10;
const DEG_TO_RAD = Math.PI / 180;

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
        // River / arroyo channel: split into quads and two bank lines
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
        // Lakes (closed water bodies)
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

/**
 * Computes the true 2D screen polygon area centroid and rotation-invariant
 * minor width (2 * Area / maxEdgeLen). Eliminates perspective foreshortening shifts
 * and prevents diagonal narrow lots from drawing oversized badges.
 */
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

  // Ensure centroid stays strictly inside concave/L-shaped polygons
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
  statusFilter: "ALL" | "Disponible" | "Reservado" | "Vendido";
  selectedLotId?: string;
  hoveredLotId?: string | null;
  highlightManzana?: string;
  highlightLotIds?: string[];
  liveDragOffset?: LiveDragOffset | null;
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

  if (!showLots || lots.length === 0) return [];

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
  const baseLineWidth = zoomLevel > 60 ? 1.6 : zoomLevel > 35 ? 1.3 : 1.05;

  const dirLen = Math.hypot(camDir.x, camDir.y, camDir.z) || 1;
  const dx = camDir.x / dirLen;
  const dy = camDir.y / dirLen;
  const dz = camDir.z / dirLen;

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Render water (rivers and lakes) and road context layers (matching Recorrido de Terreno)
  if (contextLayers && (showContextLayers || showRoadsOnly)) {
    // 1a. Lakes (Closed water bodies) - only if full context is requested
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

        ctx.fillStyle = "rgba(2, 132, 199, 0.18)";
        ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.fill(lakePath);
        ctx.stroke(lakePath);
      }
    }

    // 1b. River Channel Quads (Smooth Water Ribbon)
    if (showContextLayers && !showRoadsOnly && contextLayers.riverQuads3D?.length) {
      ctx.fillStyle = "rgba(2, 132, 199, 0.16)";
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

    // 1c. River Banks (Crisp Shoreline Outline)
    if (showContextLayers && !showRoadsOnly && contextLayers.riverBanks3D?.length) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
      ctx.lineWidth = 1.1;

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

    // 1d. Roads (Vías) - Visualización arquitectónica clara de calles
    if (contextLayers.roads3D?.length) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
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

  const pathAllWhite = new Path2D();
  const pathAvailable = new Path2D();
  const pathReserved = new Path2D();
  const pathSold = new Path2D();
  const pathManzanaHighlight = new Path2D();
  let hasAnyLot = false;
  let hasAvailable = false;
  let hasReserved = false;
  let hasSold = false;
  let hasManzanaHighlight = false;

  let selectedScreenLot: VisibleScreenLot | null = null;
  let hoveredScreenLot: VisibleScreenLot | null = null;
  const visibleList: VisibleScreenLot[] = [];

  for (let i = 0; i < lots.length; i++) {
    const lot = lots[i];
    if (statusFilter !== "ALL" && lot.status !== statusFilter) continue;

    // Verificar si aplica offset de arrastre en vivo a este lote
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
    };
    visibleList.push(screenLot);

    if (lot.id === selectedLotId) {
      selectedScreenLot = screenLot;
      continue;
    }
    if (lot.id === hoveredLotId) {
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

    hasAnyLot = true;
    pathAllWhite.moveTo(pts[0][0], pts[0][1]);
    for (let v = 1; v < pts.length; v++) pathAllWhite.lineTo(pts[v][0], pts[v][1]);
    pathAllWhite.closePath();

    const target =
      lot.status === "Vendido"
        ? ((hasSold = true), pathSold)
        : lot.status === "Reservado"
          ? ((hasReserved = true), pathReserved)
          : ((hasAvailable = true), pathAvailable);
    target.moveTo(pts[0][0], pts[0][1]);
    for (let v = 1; v < pts.length; v++) target.lineTo(pts[v][0], pts[v][1]);
    target.closePath();
  }

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (visualStyle === "pins") {
    if (hasAvailable) {
      ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
      ctx.fill(pathAvailable);
    }
    if (hasReserved) {
      ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
      ctx.fill(pathReserved);
    }
    if (hasSold) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.12)";
      ctx.fill(pathSold);
    }
    if (hasAnyLot) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.20)";
      ctx.lineWidth = baseLineWidth + 0.6;
      ctx.stroke(pathAllWhite);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.70)";
      ctx.lineWidth = baseLineWidth;
      ctx.stroke(pathAllWhite);
    }
  } else {
    ctx.lineWidth = Math.max(0.9, baseLineWidth * 0.9);
    if (hasAvailable) {
      ctx.fillStyle = "rgba(16, 185, 129, 0.11)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fill(pathAvailable);
      ctx.stroke(pathAvailable);
    }
    if (hasReserved) {
      ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
      ctx.strokeStyle = "rgba(253, 224, 71, 0.75)";
      ctx.fill(pathReserved);
      ctx.stroke(pathReserved);
    }
    if (hasSold) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
      ctx.strokeStyle = "rgba(252, 165, 165, 0.70)";
      ctx.fill(pathSold);
      ctx.stroke(pathSold);
    }
  }

  if (hasManzanaHighlight) {
    ctx.fillStyle = "rgba(250, 204, 21, 0.12)";
    ctx.strokeStyle = "rgba(250, 204, 21, 0.85)";
    ctx.lineWidth = baseLineWidth + 0.8;
    ctx.fill(pathManzanaHighlight);
    ctx.stroke(pathManzanaHighlight);
  }

  if (hoveredScreenLot && hoveredScreenLot.id !== selectedLotId) {
    const hPath = new Path2D();
    const pts = hoveredScreenLot.points;
    hPath.moveTo(pts[0][0], pts[0][1]);
    for (let v = 1; v < pts.length; v++) hPath.lineTo(pts[v][0], pts[v][1]);
    hPath.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = baseLineWidth + 0.8;
    ctx.fill(hPath);
    ctx.stroke(hPath);
  }

  if (selectedScreenLot) {
    const sPath = new Path2D();
    const pts = selectedScreenLot.points;
    sPath.moveTo(pts[0][0], pts[0][1]);
    for (let v = 1; v < pts.length; v++) sPath.lineTo(pts[v][0], pts[v][1]);
    sPath.closePath();
    ctx.fillStyle = "rgba(250, 204, 21, 0.36)";
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 2.4;
    ctx.fill(sPath);
    ctx.stroke(sPath);
  }

  // Lot labels:
  // - In "filled" mode (Recorrido de Terreno style, default): clean bold white numbers with dark halo,
  //   fitting comfortably inside even narrow lots without bulky circles.
  // - In "pins" mode: compact circular badges colored by status.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const maxBadgeR = zoomLevel >= 60 ? 7.8 : 6.6;
  const placed: [number, number, number][] = [];

  for (let i = 0; i < visibleList.length; i++) {
    const vl = visibleList[i];
    if (vl.id === selectedLotId) continue;

    const { centerX: cx, centerY: cy, inscribedWidth } = vl;
    if (cx < -16 || cx > width + 16 || cy < -16 || cy > height + 16) continue;

    const isHovered = vl.id === hoveredLotId;

    if (visualStyle === "filled") {
      // Recorrido de Terreno style: crisp white lot number with dark outline halo
      const minW = zoomLevel >= 50 ? 6.5 : 8.2;
      if (!isHovered && inscribedWidth < minW) continue;

      const textRadius = isHovered ? 8.5 : Math.min(7.5, Math.max(4.8, inscribedWidth * 0.32));
      let canPlace = true;
      if (!isHovered) {
        for (let b = 0; b < placed.length; b++) {
          const ddx = cx - placed[b][0];
          const ddy = cy - placed[b][1];
          const minDist = (textRadius + placed[b][2]) * 1.05;
          if (ddx * ddx + ddy * ddy < minDist * minDist) {
            canPlace = false;
            break;
          }
        }
      }
      if (!canPlace) continue;

      placed.push([cx, cy, textRadius]);
      const fontSize = isHovered
        ? 10.5
        : inscribedWidth >= 18
          ? 9.5
          : inscribedWidth >= 12
            ? 8.5
            : 7.5;
      ctx.font = `800 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = "rgba(12, 18, 14, 0.92)";
      ctx.strokeText(vl.label, cx, cy + 0.5);
      ctx.fillStyle = isHovered ? "#fef08a" : "#ffffff";
      ctx.fillText(vl.label, cx, cy + 0.5);
      continue;
    }

    const bgFill =
      vl.status === "Vendido" ? "#dc2626" : vl.status === "Reservado" ? "#d97706" : "#16a34a";

    // Scale badge radius so it never crowds the polygon's white borders
    const badgeR = Math.min(maxBadgeR, Math.max(5.5, inscribedWidth * 0.34));
    const minWidthForBadge = zoomLevel >= 50 ? 11.5 : 13.5;
    let showNum = isHovered || inscribedWidth >= minWidthForBadge;

    if (showNum && !isHovered) {
      for (let b = 0; b < placed.length; b++) {
        const ddx = cx - placed[b][0];
        const ddy = cy - placed[b][1];
        const minDist = (badgeR + placed[b][2]) * 1.28;
        if (ddx * ddx + ddy * ddy < minDist * minDist) {
          showNum = false;
          break;
        }
      }
    }

    if (showNum) {
      placed.push([cx, cy, badgeR]);
      const r = isHovered ? badgeR + 1.4 : badgeR;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = bgFill;
      ctx.fill();
      ctx.lineWidth = isHovered ? 1.6 : 1.1;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      const fontSize =
        r < 6.2 ? (vl.label.length >= 3 ? 6.6 : 7.2) : vl.label.length >= 3 ? 7.2 : 8.0;
      ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillText(vl.label, cx, cy + 0.4);
    } else if (inscribedWidth >= 5.0) {
      // Sleek status dot dead-center inside narrow or distant lots
      ctx.beginPath();
      ctx.arc(cx, cy, inscribedWidth >= 9 ? 3.1 : 2.4, 0, Math.PI * 2);
      ctx.fillStyle = bgFill;
      ctx.fill();
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
      ctx.stroke();
    }
  }

  // Compact landmark pins
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

  // Selected lot badge
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

  return visibleList;
}
