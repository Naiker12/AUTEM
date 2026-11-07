import type { LotStatus } from "./index";

export interface LotStatusStyleToken {
  label: string;
  baseHex: string;
  fillAlpha: number;
  fillHoverAlpha: number;
  fillRgba: string;
  fillHoverRgba: string;
  strokeColor: string;
  badgeBgHex: string;
  dotColor: string;
}

/**
 * Tokens visuales compartidos entre "Recorrido de terreno" (`ProjectLocationMap`)
 * y "Localización 360°" (`canvas-renderer.ts` + `PanoramaViewer.tsx`).
 *
 * - Disponible: verde esmeralda (#10b981), relleno 30% opacidad, borde blanco 85%
 * - Reservado: ámbar (#f59e0b), relleno 35% opacidad, borde #fde68a
 * - Vendido: rojo (#ef4444), relleno 35% opacidad, borde #fecaca
 * - Por confirmar: gris neutro (#94a3b8), relleno 23% opacidad, borde blanco 55%
 */
export const LOT_STYLE: Record<LotStatus, LotStatusStyleToken> = {
  Disponible: {
    label: "Disponible",
    baseHex: "#10b981",
    fillAlpha: 0.31,
    fillHoverAlpha: 0.39,
    fillRgba: "rgba(16, 185, 129, 0.31)",
    fillHoverRgba: "rgba(16, 185, 129, 0.39)",
    strokeColor: "rgba(255, 255, 255, 0.85)",
    badgeBgHex: "#10b981",
    dotColor: "#10b981",
  },
  "Últimas unidades": {
    label: "Disponible",
    baseHex: "#10b981",
    fillAlpha: 0.31,
    fillHoverAlpha: 0.39,
    fillRgba: "rgba(16, 185, 129, 0.31)",
    fillHoverRgba: "rgba(16, 185, 129, 0.39)",
    strokeColor: "rgba(255, 255, 255, 0.85)",
    badgeBgHex: "#10b981",
    dotColor: "#10b981",
  },
  Reservado: {
    label: "Reservado",
    baseHex: "#f59e0b",
    fillAlpha: 0.35,
    fillHoverAlpha: 0.43,
    fillRgba: "rgba(245, 158, 11, 0.35)",
    fillHoverRgba: "rgba(245, 158, 11, 0.43)",
    strokeColor: "#fde68a",
    badgeBgHex: "#f59e0b",
    dotColor: "#f59e0b",
  },
  Vendido: {
    label: "Vendido",
    baseHex: "#ef4444",
    fillAlpha: 0.35,
    fillHoverAlpha: 0.43,
    fillRgba: "rgba(239, 68, 68, 0.35)",
    fillHoverRgba: "rgba(239, 68, 68, 0.43)",
    strokeColor: "#fecaca",
    badgeBgHex: "#ef4444",
    dotColor: "#ef4444",
  },
  "Por confirmar": {
    label: "Por confirmar",
    baseHex: "#94a3b8",
    fillAlpha: 0.23,
    fillHoverAlpha: 0.31,
    fillRgba: "rgba(148, 163, 184, 0.23)",
    fillHoverRgba: "rgba(148, 163, 184, 0.31)",
    strokeColor: "rgba(255, 255, 255, 0.55)",
    badgeBgHex: "#64748b",
    dotColor: "#94a3b8",
  },
};

export const SELECTED_LOT_STYLE = {
  fillRgba: "rgba(250, 204, 21, 0.40)",
  strokeColor: "#fef08a",
  strokeWidth: 2.4,
  glowColor: "rgba(250, 204, 21, 0.65)",
  glowBlur: 8,
};

export function getLotStyleToken(
  status: LotStatus | string | null | undefined,
): LotStatusStyleToken {
  if (status && status in LOT_STYLE) {
    return LOT_STYLE[status as LotStatus];
  }
  return LOT_STYLE.Disponible;
}
