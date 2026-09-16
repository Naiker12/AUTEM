import { Compass, Expand, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Lot } from "@/data/lots";

interface MasterplanImageViewerProps {
  image: string;
  alt: string;
  lots: Lot[];
  selectedLotId: string;
  focusRequest: number;
  onSelectLot: (lotId: string) => void;
}

const MIN_SCALE = 0.55;
const MAX_SCALE = 3;
const IMAGE_WIDTH = 4200;
const IMAGE_HEIGHT = 4502;

// Coordenadas calibradas con precisión sobre el plano maestro Villa Paraíso (M1 y M2).
const LOT_MARKERS: Record<string, { x: number; y: number; label: string }> = {
  // Manzana 1
  "L-01": { x: 43.5, y: 84.6, label: "1" },
  "L-02": { x: 44.2, y: 82.3, label: "2" },
  "L-03": { x: 45.3, y: 80.0, label: "3" },
  "L-04": { x: 46.2, y: 77.5, label: "4" },
  "L-05": { x: 43.0, y: 76.5, label: "5" },
  "L-06": { x: 41.5, y: 74.5, label: "6" },
  // Manzana 2
  "L-07": { x: 40.2, y: 80.6, label: "7" },
  "L-08": { x: 38.8, y: 82.2, label: "8" },
  "L-09": { x: 34.7, y: 79.3, label: "9" },
  "L-10": { x: 36.0, y: 77.5, label: "10" },
};

export default function MasterplanImageViewer({
  image,
  alt,
  lots,
  selectedLotId,
  focusRequest,
  onSelectLot,
}: MasterplanImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const initialScale = 1;
  const [scale, setScale] = useState(initialScale);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setScale(initialScale);
    setOffset({ x: 0, y: 0 });
  };
  const zoom = (amount: number) =>
    setScale((value) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value + amount)));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const width = Math.min(
        container.clientWidth,
        (container.clientHeight * IMAGE_WIDTH) / IMAGE_HEIGHT,
      );
      setFrame({ width, height: (width * IMAGE_HEIGHT) / IMAGE_WIDTH });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Zoom suave y elegante enfocado en el lote seleccionado
  useEffect(() => {
    const marker = LOT_MARKERS[selectedLotId];
    if (!marker || frame.width === 0) return;

    const focusScale = 2.4;
    setScale(focusScale);

    // Compensar el espacio del panel izquierdo de lotes (370px en pantallas grandes xl)
    const container = containerRef.current;
    const isDesktop = (container?.clientWidth ?? 0) >= 1200;
    const desktopPanelShift = isDesktop ? 120 : 0;

    setOffset({
      x: -(marker.x / 100 - 0.5) * frame.width * focusScale + desktopPanelShift,
      y: -(marker.y / 100 - 0.5) * frame.height * focusScale,
    });
  }, [focusRequest, frame, selectedLotId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoom(event.deltaY > 0 ? -0.12 : 0.12);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const visibleMarkers = lots
    .map((lot) => ({ lot, marker: LOT_MARKERS[lot.id] }))
    .filter((item): item is { lot: Lot; marker: { x: number; y: number; label: string } } =>
      Boolean(item.marker),
    );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-[#f6f1eb] touch-none select-none"
      onPointerDown={(event) => {
        if (event.button !== 0 || event.target !== event.currentTarget) return;
        setIsDragging(true);
        dragRef.current = {
          x: event.clientX,
          y: event.clientY,
          offsetX: offset.x,
          offsetY: offset.y,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        if ((event.buttons & 1) === 0) {
          dragRef.current = null;
          setIsDragging(false);
          return;
        }
        setOffset({
          x: drag.offsetX + event.clientX - drag.x,
          y: drag.offsetY + event.clientY - drag.y,
        });
      }}
      onPointerUp={() => {
        dragRef.current = null;
        setIsDragging(false);
      }}
      onPointerCancel={() => {
        dragRef.current = null;
        setIsDragging(false);
      }}
      onLostPointerCapture={() => {
        dragRef.current = null;
        setIsDragging(false);
      }}
      aria-label="Plano maestro interactivo de Villa Paraíso"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 origin-center"
        style={{
          width: frame.width,
          height: frame.height,
          transform: `translate(-50%, -50%) translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          transition: isDragging
            ? "none"
            : "transform 750ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <img src={image} alt={alt} draggable={false} className="h-full w-full select-none" />
        {visibleMarkers.map(({ lot, marker }) => {
          const selected = lot.id === selectedLotId;
          const pinScale = Math.max(0.65, Math.min(1.2, 1.4 / Math.sqrt(scale)));
          return (
            <div
              key={lot.id}
              className={`absolute transition-transform duration-300 ${selected ? "z-30" : "z-10"}`}
              style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                transform: `translate(-50%, -50%) scale(${pinScale})`,
                transformOrigin: "center center",
              }}
            >
              {/* Badge flotante elegante arriba del lote seleccionado */}
              {selected && (
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-40 flex flex-col items-center animate-in fade-in zoom-in-90 duration-300">
                  <div className="flex items-center gap-2.5 whitespace-nowrap rounded-2xl border border-accent/60 bg-[#1f1b16]/95 px-3.5 py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.55)] backdrop-blur-md">
                    <span className="text-[11px] font-black uppercase tracking-wider text-accent">
                      {lot.id}
                    </span>
                    <span className="h-3 w-[1px] bg-white/20" />
                    <span className="text-xs font-semibold text-stone-100">
                      {lot.area.toLocaleString("es-CO")} m²
                    </span>
                    <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  </div>
                  <div className="-mt-1 size-2 rotate-45 border-b border-r border-accent/60 bg-[#1f1b16]" />
                </div>
              )}

              {/* Halo y pulso elegante del lote activo */}
              {selected && (
                <>
                  <span className="pointer-events-none absolute -inset-3.5 animate-ping rounded-full border-2 border-accent/80 opacity-60" />
                  <span className="pointer-events-none absolute -inset-2 rounded-full bg-accent/30 blur-[4px]" />
                </>
              )}

              <button
                type="button"
                onClick={() => onSelectLot(lot.id)}
                className={`pointer-events-auto relative grid place-items-center rounded-full font-sans font-black tabular-nums transition-all duration-300 ${
                  selected
                    ? "size-10 border-2 border-[#f6f1eb] bg-accent text-sm text-accent-foreground shadow-[0_4px_20px_rgba(217,161,74,0.7)] ring-4 ring-accent/40"
                    : "size-8 border-2 border-white/90 bg-[#2b2621]/95 text-[11px] text-white shadow-[0_3px_12px_rgba(0,0,0,0.45)] hover:scale-110 hover:border-accent hover:bg-accent hover:text-accent-foreground"
                }`}
                aria-label={`Ver lote ${lot.id}`}
                title={`Lote ${lot.id} (${lot.area} m²)`}
              >
                {marker.label}
              </button>
            </div>
          );
        })}
      </div>

      <div className="absolute right-5 top-24 z-20 flex flex-col items-center gap-3 md:right-8">
        <button
          type="button"
          onClick={reset}
          className="relative flex size-20 items-center justify-center rounded-full border border-[#403a34]/25 bg-[#403a34]/90 text-[#f6f1eb] shadow-xl backdrop-blur-xl"
          aria-label="Centrar plano"
        >
          <Compass className="size-9 text-accent" />
          <span className="absolute top-1.5 text-[8px] font-bold">N</span>
        </button>
        <div className="grid overflow-hidden rounded-2xl border border-[#403a34]/20 bg-[#403a34]/90 shadow-xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => zoom(0.2)}
            className="grid size-11 place-items-center border-b border-white/15 text-white hover:bg-white/15"
            aria-label="Acercar"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={() => zoom(-0.2)}
            className="grid size-11 place-items-center border-b border-white/15 text-white hover:bg-white/15"
            aria-label="Alejar"
          >
            <Minus size={18} />
          </button>
          <button
            type="button"
            onClick={reset}
            className="grid size-11 place-items-center border-b border-white/15 text-white hover:bg-white/15"
            aria-label="Restablecer plano"
          >
            <RotateCcw size={17} />
          </button>
          <button
            type="button"
            onClick={() => containerRef.current?.requestFullscreen?.()}
            className="grid size-11 place-items-center text-white hover:bg-white/15"
            aria-label="Pantalla completa"
          >
            <Expand size={17} />
          </button>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-[#403a34]/20 bg-[#f6f1eb]/90 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#403a34]/70 shadow-lg backdrop-blur-xl md:block">
        Elige un lote para ubicarlo · Rueda para acercar o alejar
      </div>
    </div>
  );
}
