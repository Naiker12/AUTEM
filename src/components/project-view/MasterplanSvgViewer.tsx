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
  selectedLotId: string;
  focusRequest: number;
  onSelectLot: (lotId: string) => void;
}

const MIN_SCALE = 0.15;
const MAX_SCALE = 8.5;
const SVG_WIDTH = layersData.dimensions.width;
const SVG_HEIGHT = layersData.dimensions.height;

export default function MasterplanSvgViewer({
  lots,
  selectedLotId,
  focusRequest,
  onSelectLot,
}: MasterplanSvgViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initOffsetX: number;
    initOffsetY: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

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

  // Escala inicial ajustada al tamaño del contenedor
  const calculateFitTransform = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { scale: 0.9, offset: { x: 0, y: 0 } };

    const cWidth = container.clientWidth;
    const cHeight = container.clientHeight;
    if (!cWidth || !cHeight) return { scale: 0.9, offset: { x: 0, y: 0 } };

    const fitScale = Math.min(cWidth / SVG_WIDTH, cHeight / SVG_HEIGHT) * 0.96;
    const isDesktop = cWidth >= 1200;
    const desktopShift = isDesktop ? 60 : 0;

    return {
      scale: fitScale,
      offset: {
        x: (cWidth - SVG_WIDTH * fitScale) / 2 + desktopShift,
        y: (cHeight - SVG_HEIGHT * fitScale) / 2,
      },
    };
  }, []);

  const reset = useCallback(() => {
    const { scale: initialScale, offset: initialOffset } = calculateFitTransform();
    setScale(initialScale);
    setOffset(initialOffset);
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
        return {
          x: originX - (originX - prevOffset.x) * ratio,
          y: originY - (originY - prevOffset.y) * ratio,
        };
      });

      return nextScale;
    });
  }, []);

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
    if (containerSize.width > 0 && containerSize.height > 0) {
      const { scale: initialScale, offset: initialOffset } = calculateFitTransform();
      setScale(initialScale);
      setOffset(initialOffset);
    }
  }, [containerSize.width, containerSize.height, calculateFitTransform]);

  // Centrado suave sobre el centroide del lote seleccionado con zoom profundo
  useEffect(() => {
    if (!selectedLot?.centroid || containerSize.width === 0) return;

    const [cx, cy] = selectedLot.centroid;
    // Zoom profundo e inmersivo para apreciar con detalle los linderos del lote y su entorno
    const focusScale = 4.5;
    setScale(focusScale);

    const isDesktop = containerSize.width >= 1200;
    const panelOffset = isDesktop ? 140 : 0;

    setOffset({
      x: containerSize.width / 2 - cx * focusScale + panelOffset,
      y: containerSize.height / 2 - cy * focusScale,
    });
  }, [focusRequest, selectedLot, containerSize.width, containerSize.height]);

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

  // Gestor de eventos de arrastre / pan
  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    // Si se hizo clic sobre un botón o control interactivo, NO capturar ni arrastrar
    if (target.closest("button") || target.closest("a") || target.closest(".no-drag")) {
      return;
    }
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initOffsetX: offset.x,
      initOffsetY: offset.y,
    };
    setIsDragging(false);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragRef.current) {
      if (hoveredLotId) {
        setTooltipPos({ x: event.clientX, y: event.clientY });
      }
      return;
    }

    const clientX = event.clientX;
    const clientY = event.clientY;

    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!dragRef.current) return;
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;

      if (Math.hypot(dx, dy) > 2) {
        setIsDragging(true);
        setOffset({
          x: dragRef.current.initOffsetX + dx,
          y: dragRef.current.initOffsetY + dy,
        });
      }
    });
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    dragRef.current = null;
    setIsDragging(false);
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Ignore if not captured
    }
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

  // Nivel de detalle semántico
  const showDetailedLabels = scale >= 0.72;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-[#f7f4ed] touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Lienzo SVG unificado con pan & zoom sincronizado en <g> */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-full w-full pointer-events-none"
        style={{
          overflow: "visible",
        }}
      >
        <g
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
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

              // Estilos por estado según especificación:
              // - Vendido: ROJO
              // - Disponible: VERDE CLARO
              // - Reservado: NARANJA
              // - Seleccionado: AZUL CIELO
              let fill = "#dcfce7"; // Verde claro visible y vibrante
              let stroke = "#16a34a"; // Borde verde definido
              let strokeWidth = 1.5;

              if (isSold) {
                // Vendido en ROJO
                fill = isHovered ? "#fca5a5" : "#fee2e2";
                stroke = "#dc2626";
                strokeWidth = isHovered ? 2.6 : 1.5;
              } else if (isReserved) {
                // Reservado en NARANJA
                fill = isHovered ? "#fdba74" : "#ffedd5";
                stroke = "#ea580c";
                strokeWidth = isHovered ? 2.6 : 1.5;
              } else if (isLastUnits) {
                fill = isHovered ? "#fde047" : "#fef9c3";
                stroke = "#ca8a04";
                strokeWidth = isHovered ? 2.6 : 1.5;
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
                  onPointerEnter={(e) => {
                    setHoveredLotId(lot.id);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onPointerLeave={() => {
                    setHoveredLotId(null);
                    setTooltipPos(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLot(lot.id);
                  }}
                />
              );
            })}
          </g>

          {/* Capa 6: Números de Lote en sus Centroides Matemáticos Exactos */}
          <g id="svg-labels" className="pointer-events-none">
            {lots.map((lot) => {
              if (!lot.centroid || lot.isReserve) return null;
              const [cx, cy] = lot.centroid;
              const isSelected = lot.id === selectedLotId;
              const isHovered = lot.id === hoveredLotId;

              // En zoom alejado solo mostramos el seleccionado o hover
              if (!showDetailedLabels && !isSelected && !isHovered) return null;

              const label = lot.lotNumber ?? lot.id.replace("L-", "");

              if (isSelected) {
                return (
                  <g key={`marker-selected-${lot.id}`} transform={`translate(${cx}, ${cy})`}>
                    <circle
                      r={14 / Math.min(scale, 2.5)}
                      fill="#0284c7"
                      stroke="#ffffff"
                      strokeWidth={2.5 / Math.min(scale, 2.5)}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize={11 / Math.min(scale, 2.5)}
                      fontWeight={800}
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {label}
                    </text>
                  </g>
                );
              }

              return (
                <text
                  key={`label-${lot.id}`}
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isHovered ? "#0f172a" : "#334155"}
                  fontSize={isHovered ? 12.5 : 10.5}
                  fontWeight={isHovered ? 800 : 700}
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

      {/* Botones de Control Flotantes (Zoom, Pan, Reset, Fullscreen) */}
      <div
        className="no-drag absolute right-4 top-20 flex flex-col items-center gap-1.5 rounded-full border border-border/70 bg-background/95 p-1.5 shadow-xl backdrop-blur-md z-30 select-none"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            zoom(1.35);
          }}
          className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
          title="Acercar (Zoom In)"
          aria-label="Acercar"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            zoom(1 / 1.35);
          }}
          className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
          title="Alejar (Zoom Out)"
          aria-label="Alejar"
        >
          <Minus className="size-4" />
        </button>
        <div className="h-px w-5 bg-border/60" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
          title="Restablecer vista inicial"
          aria-label="Restablecer vista"
        >
          <RotateCcw className="size-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-all hover:bg-muted hover:text-foreground active:scale-90 cursor-pointer"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          aria-label="Pantalla completa"
        >
          {isFullscreen ? <Shrink className="size-4" /> : <Expand className="size-4" />}
        </button>
      </div>

      {/* Brújula Norte en esquina superior derecha */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          reset();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="no-drag absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-md backdrop-blur-sm z-30 transition-all hover:bg-muted active:scale-90 cursor-pointer"
        title="Orientación Norte (Clic para restablecer vista)"
        aria-label="Norte - Restablecer vista"
      >
        <Compass className="size-5 text-accent" />
        <span className="absolute -bottom-1 text-[8px] font-bold text-muted-foreground">N</span>
      </button>
    </div>
  );
}
