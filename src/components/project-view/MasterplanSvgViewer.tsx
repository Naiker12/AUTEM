import {
  Compass,
  Expand,
  Minus,
  Plus,
  RotateCcw,
  Shrink,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lot } from "@/data/lots";
import { formatLotArea, formatLotPrice } from "@/data/lots";
import layersData from "@/data/villa-paraiso-layers.json";

interface MasterplanSvgViewerProps {
  lots: Lot[];
  filteredLots?: Lot[];
  isFilterActive?: boolean;
  filterRequest?: number;
  selectedLotId: string;
  focusRequest: number;
  onSelectLot: (lotId: string) => void;
  isDesktopSidebarOpen?: boolean;
  onClearFilter?: () => void;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 8.5;
const SVG_WIDTH = layersData.dimensions.width;
const SVG_HEIGHT = layersData.dimensions.height;

export default function MasterplanSvgViewer({
  lots,
  filteredLots,
  isFilterActive = false,
  filterRequest = 0,
  selectedLotId,
  focusRequest,
  onSelectLot,
  isDesktopSidebarOpen = true,
  onClearFilter,
}: MasterplanSvgViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initOffsetX: number;
    initOffsetY: number;
  } | null>(null);
  const pointersMapRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const pinchStateRef = useRef<{
    initDist: number;
    initScale: number;
    initOffset: { x: number; y: number };
    midX: number;
    midY: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  // Referencias para detección precisa de toque/clic en lotes sin interferencia de arrastre
  const pointerDownLotRef = useRef<string | null>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDragConfirmedRef = useRef(false);
  const lastSelectTimeRef = useRef<number>(0);
  const lastHandledFocusRef = useRef<number>(0);
  const lastHandledFilterRef = useRef<number>(0);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const isDraggingRef = useRef(false);
  const cachedContainerRectRef = useRef<DOMRect | null>(null);
  const isTouchDeviceRef = useRef(false);
  const rafPendingRef = useRef(false);
  const latestTransformRef = useRef<{ x: number; y: number; scale: number } | null>(null);
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Referencias para manipulación directa en GPU (evita re-renders en cada pixel de arrastre)
  const viewportGroupRef = useRef<SVGGElement>(null);
  const transformRef = useRef({ scale: 1, offset: { x: 0, y: 0 } });
  transformRef.current = { scale, offset };

  useEffect(() => {
    if (typeof window !== "undefined") {
      isTouchDeviceRef.current = window.matchMedia("(pointer: coarse)").matches;
    }
    return () => {
      rafPendingRef.current = false;
    };
  }, []);

  const applyPendingTransform = useCallback(() => {
    rafPendingRef.current = false;
    if (!viewportGroupRef.current || !latestTransformRef.current) return;
    const { x, y, scale: s } = latestTransformRef.current;
    viewportGroupRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
  }, []);

  // Handlers de hover protegidos para dispositivos táctiles y durante arrastre
  const handleLotPointerEnter = useCallback((e: React.PointerEvent, lotId: string) => {
    if (e.pointerType === "touch" || isDraggingRef.current || isTouchDeviceRef.current) return;
    setHoveredLotId(lotId);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleLotPointerLeave = useCallback(() => {
    if (isDraggingRef.current || isTouchDeviceRef.current) return;
    setHoveredLotId(null);
    setTooltipPos(null);
  }, []);

  // Memorizar elementos estáticos de fondo para evitar re-cálculos en cada frame
  const staticBackgroundElements = useMemo(
    () => (
      <>
        <g id="svg-linderos" opacity={0.95}>
          {layersData.linderos.map((d, i) => (
            <path
              key={`lindero-${i}`}
              d={d}
              fill="#ede4cf"
              stroke="#9e8d72"
              strokeWidth={3.2}
              className="pointer-events-none"
            />
          ))}
        </g>
        <g id="svg-green-areas">
          {layersData.greenAreas.map((d, i) => (
            <path
              key={`green-${i}`}
              d={d}
              fill="#b8e0a2"
              stroke="#5e8f42"
              strokeWidth={1.8}
              className="pointer-events-none"
            />
          ))}
        </g>
        <g id="svg-roads">
          {layersData.roads.map((d, i) => (
            <path
              key={`road-${i}`}
              d={d}
              fill="#ded6c2"
              stroke="#998a72"
              strokeWidth={1.8}
              className="pointer-events-none"
            />
          ))}
          {layersData.calzadas.map((d, i) => (
            <path
              key={`calzada-${i}`}
              d={d}
              fill="#d5cbba"
              stroke="#8f7e65"
              strokeWidth={2}
              className="pointer-events-none"
            />
          ))}
          {layersData.senderos.map((d, i) => (
            <path
              key={`sendero-${i}`}
              d={d}
              fill="none"
              stroke="#8a7a63"
              strokeWidth={2.2}
              strokeDasharray="6 4"
              className="pointer-events-none"
            />
          ))}
        </g>
      </>
    ),
    [],
  );

  // Mapa rápido de lotes por ID para consultas O(1)
  const lotMap = useMemo(() => {
    const map = new Map<string, Lot>();
    for (const lot of lots) {
      map.set(lot.id, lot);
    }
    return map;
  }, [lots]);

  const selectedLot = useMemo(() => lotMap.get(selectedLotId), [lotMap, selectedLotId]);
  const hoveredLot = useMemo(
    () => (hoveredLotId ? lotMap.get(hoveredLotId) : null),
    [lotMap, hoveredLotId],
  );

  // Conjunto de IDs de lotes filtrados para consultas instantáneas O(1)
  const filteredLotIds = useMemo(() => {
    if (!isFilterActive || !filteredLots) return null;
    const set = new Set<string>();
    for (const lot of filteredLots) {
      set.add(lot.id);
    }
    return set;
  }, [filteredLots, isFilterActive]);

  // Escala inicial ajustada al tamaño del contenedor
  const calculateFitTransform = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { scale: 0.9, offset: { x: 0, y: 0 } };

    const cWidth = container.clientWidth;
    const cHeight = container.clientHeight;
    if (!cWidth || !cHeight) return { scale: 0.9, offset: { x: 0, y: 0 } };

    const fitScale = Math.min(cWidth / SVG_WIDTH, cHeight / SVG_HEIGHT) * 0.96;
    const isDesktop = cWidth >= 1280;
    const desktopShift = isDesktop && isDesktopSidebarOpen ? 90 : 0;

    return {
      scale: fitScale,
      offset: {
        x: (cWidth - SVG_WIDTH * fitScale) / 2 + desktopShift,
        y: (cHeight - SVG_HEIGHT * fitScale) / 2,
      },
    };
  }, [isDesktopSidebarOpen]);

  const reset = useCallback(() => {
    const { scale: initialScale, offset: initialOffset } = calculateFitTransform();
    setScale(initialScale);
    setOffset(initialOffset);
    transformRef.current = { scale: initialScale, offset: initialOffset };
    if (viewportGroupRef.current) {
      viewportGroupRef.current.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)";
      viewportGroupRef.current.style.transform = `translate3d(${initialOffset.x}px, ${initialOffset.y}px, 0) scale(${initialScale})`;
    }
  }, [calculateFitTransform]);

  const zoom = useCallback((factor: number, clientCenter?: { x: number; y: number }) => {
    setScale((prevScale) => {
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prevScale * factor));
      if (Math.abs(nextScale - prevScale) < 0.0001) return prevScale;

      const container = containerRef.current;
      if (!container) return nextScale;

      const rect = container.getBoundingClientRect();
      const originX = clientCenter ? clientCenter.x - rect.left : rect.width / 2;
      const originY = clientCenter ? clientCenter.y - rect.top : rect.height / 2;

      // Mantener el punto bajo el cursor / centro quieto durante el zoom
      setOffset((prevOffset) => {
        const ratio = nextScale / prevScale;
        const nextOffset = {
          x: originX - (originX - prevOffset.x) * ratio,
          y: originY - (originY - prevOffset.y) * ratio,
        };
        transformRef.current = { scale: nextScale, offset: nextOffset };
        if (viewportGroupRef.current) {
          viewportGroupRef.current.style.transition = "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)";
          viewportGroupRef.current.style.transform = `translate3d(${nextOffset.x}px, ${nextOffset.y}px, 0) scale(${nextScale})`;
        }
        return nextOffset;
      });

      return nextScale;
    });
  }, []);

  // Selección segura de lotes con prevención de doble disparo (pointerup + click)
  const handleSelectLotSafe = useCallback(
    (lotId: string) => {
      const now = Date.now();
      if (now - lastSelectTimeRef.current < 120) return;
      lastSelectTimeRef.current = now;
      setHoveredLotId(null);
      setTooltipPos(null);
      onSelectLot(lotId);
    },
    [onSelectLot],
  );

  // Observador de redimensionamiento del contenedor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Inicializar encuadre cuando el contenedor esté listo
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0 && focusRequest === 0) {
      const { scale: initialScale, offset: initialOffset } = calculateFitTransform();
      setScale(initialScale);
      setOffset(initialOffset);
      transformRef.current = { scale: initialScale, offset: initialOffset };
    }
  }, [containerSize.width, containerSize.height, calculateFitTransform, focusRequest]);

  // Centrado suave y zoom potente sobre el centroide del lote seleccionado
  useEffect(() => {
    if (!selectedLot?.centroid || containerSize.width === 0 || focusRequest === 0) return;
    if (focusRequest === lastHandledFocusRef.current) return;
    lastHandledFocusRef.current = focusRequest;

    const [cx, cy] = selectedLot.centroid;
    const isDesktop = containerSize.width >= 1024;
    // Escala balanceada: zoom cercano (3.4 en desktop, 2.6 en móvil) para ver el lote en primer plano
    const targetScale = isDesktop ? 3.4 : 2.6;

    // En escritorio, con panel lateral visible de 360px, centrar en el área libre visible
    const targetCenterX = isDesktop
      ? containerSize.width / 2 + (isDesktopSidebarOpen ? 180 : 0)
      : containerSize.width / 2;
    // Considerar el espacio de la barra de navegación superior (56-64px) en escritorio
    const targetCenterY = isDesktop
      ? (containerSize.height + 36) / 2
      : containerSize.height / 2;

    const targetOffset = {
      x: targetCenterX - cx * targetScale,
      y: targetCenterY - cy * targetScale,
    };

    setScale(targetScale);
    setOffset(targetOffset);
    transformRef.current = { scale: targetScale, offset: targetOffset };

    if (viewportGroupRef.current) {
      viewportGroupRef.current.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)";
      viewportGroupRef.current.style.transform = `translate3d(${targetOffset.x}px, ${targetOffset.y}px, 0) scale(${targetScale})`;
    }
  }, [focusRequest, selectedLot, containerSize.width, containerSize.height, isDesktopSidebarOpen]);

  // Encuadre automático y zoom fluido cuando se aplica o cambia un filtro
  useEffect(() => {
    if (filterRequest === 0) return;
    if (filterRequest === lastHandledFilterRef.current) return;
    lastHandledFilterRef.current = filterRequest;

    if (containerSize.width === 0 || containerSize.height === 0) return;

    // Si se desactivó el filtro o se volvió a "Todos" sin filtros extra
    if (!isFilterActive || !filteredLots || filteredLots.length === 0) {
      reset();
      return;
    }

    // Calcular la caja envolvente de todos los lotes filtrados
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let count = 0;

    for (const lot of filteredLots) {
      if (lot.centroid) {
        const [cx, cy] = lot.centroid;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        count++;
      }
    }

    if (count === 0) {
      reset();
      return;
    }

    // Margen de seguridad dinámico según la cantidad de lotes
    const pad = count === 1 ? 90 : 130;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(SVG_WIDTH, maxX + pad);
    maxY = Math.min(SVG_HEIGHT, maxY + pad);

    const boxWidth = Math.max(180, maxX - minX);
    const boxHeight = Math.max(180, maxY - minY);
    const boxCenterX = (minX + maxX) / 2;
    const boxCenterY = (minY + maxY) / 2;

    const isDesktop = containerSize.width >= 1024;
    const sidebarWidth = isDesktop && isDesktopSidebarOpen ? 360 : 0;
    const availableWidth = Math.max(200, containerSize.width - sidebarWidth);
    const availableHeight = Math.max(200, isDesktop ? containerSize.height - 40 : containerSize.height);

    // Ajustar escala para que quepan todos los lotes con 12% de holgura visual
    const scaleX = (availableWidth * 0.88) / boxWidth;
    const scaleY = (availableHeight * 0.88) / boxHeight;
    let targetScale = Math.min(scaleX, scaleY);

    const minReasonableScale = isDesktop ? 0.35 : 0.22;
    const maxAllowedScale = count <= 2 ? 3.4 : 2.8;
    targetScale = Math.min(maxAllowedScale, Math.max(minReasonableScale, targetScale));

    const targetCenterX = isDesktop
      ? sidebarWidth + availableWidth / 2
      : containerSize.width / 2;
    const targetCenterY = isDesktop
      ? (containerSize.height + 36) / 2
      : containerSize.height / 2;

    const targetOffsetX = targetCenterX - boxCenterX * targetScale;
    const targetOffsetY = targetCenterY - boxCenterY * targetScale;

    setScale(targetScale);
    setOffset({ x: targetOffsetX, y: targetOffsetY });
    transformRef.current = { scale: targetScale, offset: { x: targetOffsetX, y: targetOffsetY } };

    if (viewportGroupRef.current) {
      viewportGroupRef.current.style.transition = "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)";
      viewportGroupRef.current.style.transform = `translate3d(${targetOffsetX}px, ${targetOffsetY}px, 0) scale(${targetScale})`;
    }
  }, [
    filterRequest,
    isFilterActive,
    filteredLots,
    containerSize.width,
    containerSize.height,
    isDesktopSidebarOpen,
    reset,
  ]);

  // Zoom con la rueda del ratón
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.18 : 1 / 1.18;
      zoom(factor, { x: event.clientX, y: event.clientY });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [zoom]);

  // Gestor de eventos táctiles y de arrastre (pan + pinch-to-zoom con fluidez extrema en GPU y RAF)
  const handlePointerDown = (event: React.PointerEvent) => {
    const target = event.target as HTMLElement;
    // Si se hizo clic sobre un botón o control interactivo, NO capturar ni arrastrar
    if (target.closest("button") || target.closest("a") || target.closest(".no-drag")) {
      return;
    }

    // Cachear bounding client rect para evitar layout thrashing en pointermove
    if (containerRef.current) {
      cachedContainerRectRef.current = containerRef.current.getBoundingClientRect();
      containerRef.current.style.cursor = "grabbing";
    }

    // Desactivar temporalmente transiciones y punteros en el SVG para arrastre instantáneo a 120fps
    if (viewportGroupRef.current) {
      viewportGroupRef.current.style.transition = "none";
      viewportGroupRef.current.style.pointerEvents = "none";
    }

    // Detectar si el puntero se posó sobre un lote
    const lotElement = (event.target as Element | null)?.closest('[id^="lot-"]');
    if (lotElement) {
      pointerDownLotRef.current = lotElement.id.replace(/^lot-/, "");
    } else {
      pointerDownLotRef.current = null;
    }

    pointerDownPosRef.current = { x: event.clientX, y: event.clientY };
    isDragConfirmedRef.current = false;
    isDraggingRef.current = true;

    // Registrar puntero activo para soporte multi-touch
    pointersMapRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (pointersMapRef.current.size === 1) {
      // Arrastre simple (un dedo o mouse)
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        initOffsetX: transformRef.current.offset.x,
        initOffsetY: transformRef.current.offset.y,
      };
    } else if (pointersMapRef.current.size === 2) {
      // Pinch-to-zoom (dos dedos)
      const points = Array.from(pointersMapRef.current.values());
      const p1 = points[0];
      const p2 = points[1];
      const dist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
      const midX = (p1.clientX + p2.clientX) / 2;
      const midY = (p1.clientY + p2.clientY) / 2;

      pinchStateRef.current = {
        initDist: dist,
        initScale: transformRef.current.scale,
        initOffset: { ...transformRef.current.offset },
        midX,
        midY,
      };
    }

    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Ignorar si el navegador no permite captura
    }
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (pointersMapRef.current.has(event.pointerId)) {
      pointersMapRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    }

    // Verificar si el puntero se ha movido más de 6px para distinguir clic de arrastre
    if (!isDragConfirmedRef.current && pointerDownPosRef.current) {
      const distMoved = Math.hypot(
        event.clientX - pointerDownPosRef.current.x,
        event.clientY - pointerDownPosRef.current.y,
      );
      if (distMoved > 6) {
        isDragConfirmedRef.current = true;
      }
    }

    if (!isDraggingRef.current) return;

    if (pointersMapRef.current.size === 2 && pinchStateRef.current) {
      // Gestionar pellizco suave sin layout thrashing utilizando el rect cacheado
      const points = Array.from(pointersMapRef.current.values());
      const p1 = points[0];
      const p2 = points[1];
      const dist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
      const ratio = dist / pinchStateRef.current.initDist;

      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, pinchStateRef.current.initScale * ratio),
      );

      const rect = cachedContainerRectRef.current || containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const originX = pinchStateRef.current.midX - rect.left;
      const originY = pinchStateRef.current.midY - rect.top;

      const scaleRatio = nextScale / pinchStateRef.current.initScale;
      const nextOffset = {
        x: originX - (originX - pinchStateRef.current.initOffset.x) * scaleRatio,
        y: originY - (originY - pinchStateRef.current.initOffset.y) * scaleRatio,
      };

      transformRef.current = { scale: nextScale, offset: nextOffset };
      latestTransformRef.current = { x: nextOffset.x, y: nextOffset.y, scale: nextScale };

      if (!rafPendingRef.current) {
        rafPendingRef.current = true;
        requestAnimationFrame(applyPendingTransform);
      }
      return;
    }

    // Arrastre simple (pan) optimizado en RAF directamente en GPU mediante CSS translate3d
    if (dragRef.current && pointersMapRef.current.size === 1) {
      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;

      const nextOffset = {
        x: dragRef.current.initOffsetX + dx,
        y: dragRef.current.initOffsetY + dy,
      };

      transformRef.current.offset = nextOffset;
      latestTransformRef.current = {
        x: nextOffset.x,
        y: nextOffset.y,
        scale: transformRef.current.scale,
      };

      if (!rafPendingRef.current) {
        rafPendingRef.current = true;
        requestAnimationFrame(applyPendingTransform);
      }
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    pointersMapRef.current.delete(event.pointerId);

    if (pointersMapRef.current.size === 0) {
      isDraggingRef.current = false;
      dragRef.current = null;
      pinchStateRef.current = null;

      if (containerRef.current) {
        containerRef.current.style.cursor = "grab";
      }
      if (viewportGroupRef.current) {
        viewportGroupRef.current.style.pointerEvents = "auto";
      }

      // Aplicar de inmediato cualquier transformación pendiente
      if (latestTransformRef.current && viewportGroupRef.current) {
        const { x, y, scale: s } = latestTransformRef.current;
        viewportGroupRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
      }

      // Sincronizar estado React al soltar
      setScale(transformRef.current.scale);
      setOffset(transformRef.current.offset);

      // Si no hubo arrastre y se soltó sobre un lote, seleccionarlo
      if (!isDragConfirmedRef.current && pointerDownLotRef.current) {
        handleSelectLotSafe(pointerDownLotRef.current);
      }
    } else if (pointersMapRef.current.size === 1) {
      // Pasar a arrastre con el dedo restante
      const remaining = Array.from(pointersMapRef.current.values())[0];
      dragRef.current = {
        startX: remaining.clientX,
        startY: remaining.clientY,
        initOffsetX: transformRef.current.offset.x,
        initOffsetY: transformRef.current.offset.y,
      };
      pinchStateRef.current = null;
    }

    pointerDownLotRef.current = null;
    pointerDownPosRef.current = null;
    isDragConfirmedRef.current = false;
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Tamaño de fuente optimizado para que desde lejos se vea el número de lote pequeño pero perfectamente visible
  const baseLabelFontSize = scale < 0.28 ? 16 : scale < 0.55 ? 14 : scale < 1.0 ? 12.5 : 11;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-[#f7f4ed] touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ cursor: "grab" }}
    >
      {/* Lienzo SVG con pan & zoom sincronizado en <g> (sin viewBox para coincidencia directa de píxeles) */}
      <svg
        className="h-full w-full pointer-events-none"
        style={{
          overflow: "visible",
        }}
      >
        <g
          ref={viewportGroupRef}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
            transformOrigin: "0 0",
            transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
            willChange: "transform",
          }}
          className="pointer-events-auto"
        >
          {/* Capas 1, 2 y 3: Linderos, Zonas Verdes y Red Vial (Memorizadas para rendimiento nativo) */}
          {staticBackgroundElements}

          {/* Capa 4: Rótulos de Manzanas */}
          <g id="svg-manzanas" className="pointer-events-none">
            {layersData.manzanas.map((m, i) => (
              <text
                key={`mz-${i}`}
                x={m.x}
                y={m.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#78716c"
                opacity={scale < 1 ? 0.55 : 0.28}
                fontSize={scale < 1 ? 32 : 24}
                fontWeight={900}
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {m.name}
              </text>
            ))}
          </g>

          {/* Capa 5: Polígonos interactivos de cada Lote */}
          <g id="svg-lots">
            {lots.map((lot) => {
              if (!lot.pathD) return null;
              const isSelected = lot.id === selectedLotId;
              const isHovered = lot.id === hoveredLotId;
              const isReserved = lot.status === "Reservado";
              const isSold = lot.status === "Vendido";
              const isLastUnits = lot.status === "Últimas unidades";
              const isMatch = !isFilterActive || (filteredLotIds ? filteredLotIds.has(lot.id) : true);

              // Si hay filtro activo y el lote NO coincide con el filtro:
              // SE DEBEN VER TODOS LOS LOTES con total claridad (fondo blanco limpio y borde perimetral slate definido),
              // pero sin color comercial para que solo resalten los filtrados
              if (isFilterActive && !isMatch) {
                return (
                  <path
                    key={lot.id}
                    id={`lot-${lot.id}`}
                    d={lot.pathD}
                    fill={isHovered ? "#f1f5f9" : "#ffffff"}
                    stroke={isHovered ? "#475569" : "#cbd5e1"}
                    strokeWidth={isHovered ? 1.8 : 1.15}
                    opacity={1}
                    style={{
                      transition: "fill 0.15s ease, stroke 0.15s ease",
                      cursor: "pointer",
                    }}
                    onPointerEnter={(e) => handleLotPointerEnter(e, lot.id)}
                    onPointerLeave={handleLotPointerLeave}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLotSafe(lot.id);
                    }}
                  />
                );
              }

              // Estilos por estado según especificación:
              // - Vendido: ROJO
              // - Disponible: VERDE CLARO
              // - Reservado: NARANJA
              // - Seleccionado: AZUL CIELO
              let fill = "#dcfce7"; // Verde claro visible y vibrante
              let stroke = "#16a34a"; // Borde verde definido
              let strokeWidth = isFilterActive ? 2.2 : 1.5;

              if (isSold) {
                // Vendido en ROJO
                fill = isHovered ? "#fca5a5" : "#fee2e2";
                stroke = "#dc2626";
                strokeWidth = isHovered ? 2.8 : isFilterActive ? 2.4 : 1.5;
              } else if (isReserved) {
                // Reservado en NARANJA
                fill = isHovered ? "#fdba74" : "#ffedd5";
                stroke = "#ea580c";
                strokeWidth = isHovered ? 2.8 : isFilterActive ? 2.4 : 1.5;
              } else if (isLastUnits) {
                fill = isHovered ? "#fde047" : "#fef9c3";
                stroke = "#ca8a04";
                strokeWidth = isHovered ? 2.8 : isFilterActive ? 2.4 : 1.5;
              } else if (isHovered) {
                fill = "#bbf7d0";
                stroke = "#15803d";
                strokeWidth = 2.8;
              }

              if (isSelected) {
                fill = "#7dd3fc";
                stroke = "#0284c7";
                strokeWidth = 3.6;
              }

              return (
                <path
                  key={lot.id}
                  id={`lot-${lot.id}`}
                  d={lot.pathD}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  style={{
                    transition: "fill 0.12s ease, stroke 0.12s ease, stroke-width 0.12s ease",
                    cursor: "pointer",
                  }}
                  onPointerEnter={(e) => handleLotPointerEnter(e, lot.id)}
                  onPointerLeave={handleLotPointerLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectLotSafe(lot.id);
                  }}
                />
              );
            })}
          </g>

          {/* Capa 6: Números de Lote en sus Centroides Matemáticos Exactos (Siempre visibles, incluso desde lejos) */}
          <g id="svg-labels" className="pointer-events-none">
            {lots.map((lot) => {
              if (!lot.centroid || lot.isReserve) return null;
              const [cx, cy] = lot.centroid;
              const isSelected = lot.id === selectedLotId;
              const isHovered = lot.id === hoveredLotId;
              const isMatch = !isFilterActive || (filteredLotIds ? filteredLotIds.has(lot.id) : true);
              const isFaded = isFilterActive && !isMatch;

              const label = lot.lotNumber ?? lot.id.replace("L-", "");

              if (isSelected) {
                const markerR = scale < 0.28 ? 18 : 15;
                const markerFontSize = scale < 0.28 ? 12 : 11;
                return (
                  <g key={`marker-selected-${lot.id}`} transform={`translate(${cx}, ${cy})`}>
                    <circle
                      r={markerR}
                      fill="#0284c7"
                      stroke="#ffffff"
                      strokeWidth={2.2}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize={markerFontSize}
                      fontWeight={800}
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {label}
                    </text>
                  </g>
                );
              }

              const fontSize = isHovered
                ? baseLabelFontSize + 2.5
                : isFaded
                  ? Math.max(9, baseLabelFontSize - 1.5)
                  : baseLabelFontSize;

              return (
                <text
                  key={`label-${lot.id}`}
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isHovered ? "#0f172a" : isFaded ? "#64748b" : "#1e293b"}
                  fontSize={fontSize}
                  fontWeight={isHovered ? 800 : isFaded ? 600 : 700}
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {label}
                </text>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Tooltip flotante en hover de lote */}
      {hoveredLot && tooltipPos && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full pb-3 text-left transition-all duration-75 ease-out"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
          }}
        >
          <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">
                Lote {hoveredLot.lotNumber ?? hoveredLot.id}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                  hoveredLot.status === "Disponible"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : hoveredLot.status === "Reservado"
                      ? "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300"
                      : hoveredLot.status === "Vendido"
                        ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300"
                        : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300"
                }`}
              >
                {hoveredLot.status}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <MapPin className="size-3 text-accent" /> {hoveredLot.manzana}
              </span>
              <span>·</span>
              <span>{formatLotArea(hoveredLot.area)}</span>
            </div>
            {hoveredLot.price > 0 && (
              <div className="mt-1.5 font-bold text-xs text-primary">
                {formatLotPrice(hoveredLot.price)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Píldora Flotante Informativa de Filtros Activos con botón de restablecer */}
      {isFilterActive && filteredLots && (
        <div
          className="no-drag absolute top-14 left-2.5 lg:left-4 lg:top-4 z-20 flex items-center gap-2 rounded-full border border-border/80 bg-background/95 px-2.5 py-1 lg:px-3 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          <span className="text-[10px] lg:text-xs font-semibold text-foreground whitespace-nowrap">
            {filteredLots.length} {filteredLots.length === 1 ? "lote filtrado" : "lotes filtrados"}
          </span>
          {onClearFilter && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearFilter();
              }}
              className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              title="Restablecer filtros y ver todos los lotes"
              aria-label="Restablecer filtros"
            >
              <RotateCcw className="size-3" />
            </button>
          )}
        </div>
      )}

      {/* Botones de Control Flotantes Integrados (Brújula + Zoom + Reset + Pantalla Completa) */}
      <div
        className="no-drag absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 lg:top-[92px] lg:translate-y-0 flex flex-col items-center gap-2 z-30 select-none"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Brújula Norte */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          className="relative flex size-8 lg:size-9.5 items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-muted active:scale-90 cursor-pointer"
          title="Orientación Norte (Clic para restablecer vista)"
          aria-label="Norte - Restablecer vista"
        >
          <Compass className="size-4 lg:size-4.5 text-accent" />
          <span className="absolute -bottom-1 text-[6.5px] lg:text-[7.5px] font-bold text-muted-foreground">N</span>
        </button>

        {/* Barra de Controles de Zoom */}
        <div className="flex flex-col items-center gap-1 rounded-full border border-border/70 bg-background/95 p-1 lg:p-1.5 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              zoom(1.35);
            }}
            className="flex size-7 lg:size-8.5 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
            title="Acercar (Zoom In)"
            aria-label="Acercar"
          >
            <Plus className="size-3.5 lg:size-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              zoom(1 / 1.35);
            }}
            className="flex size-7 lg:size-8.5 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
            title="Alejar (Zoom Out)"
            aria-label="Alejar"
          >
            <Minus className="size-3.5 lg:size-4" />
          </button>
          <div className="h-px w-4 lg:w-5 bg-border/60" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="flex size-7 lg:size-8.5 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
            title="Restablecer vista inicial"
            aria-label="Restablecer vista"
          >
            <RotateCcw className="size-3.5 lg:size-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="flex size-7 lg:size-8.5 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            aria-label="Pantalla completa"
          >
            {isFullscreen ? <Shrink className="size-3.5 lg:size-4" /> : <Expand className="size-3.5 lg:size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
