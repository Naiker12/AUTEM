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

// Coordenadas de los lotes disponibles dentro del plano maestro Villa Paraíso.
const LOT_MARKERS: Record<string, { x: number; y: number; label: string }> = {
  "L-01": { x: 44.1, y: 83, label: "1" },
  "L-02": { x: 42.6, y: 81.6, label: "2" },
  "L-03": { x: 41.1, y: 80.8, label: "3" },
  "L-04": { x: 45.1, y: 79.5, label: "4" },
  "L-05": { x: 40.1, y: 79.2, label: "5" },
  "L-06": { x: 39.1, y: 78.2, label: "6" },
  "L-07": { x: 38.6, y: 80.1, label: "7" },
  "L-08": { x: 37.6, y: 80.9, label: "8" },
  "L-09": { x: 34.5, y: 78.2, label: "9" },
  "L-10": { x: 35.3, y: 77.2, label: "10" },
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

  useEffect(() => {
    const marker = LOT_MARKERS[selectedLotId];
    if (!marker || frame.width === 0) return;

    const focusScale = 1.85;
    setScale(focusScale);
    setOffset({
      x: -(marker.x / 100 - 0.5) * frame.width * focusScale,
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
      className="absolute inset-0 overflow-hidden bg-[#f6f1eb] touch-none"
      onPointerDown={(event) => {
        if (event.button !== 0 || event.target !== event.currentTarget) return;
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
          return;
        }
        setOffset({
          x: drag.offsetX + event.clientX - drag.x,
          y: drag.offsetY + event.clientY - drag.y,
        });
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
      onLostPointerCapture={() => {
        dragRef.current = null;
      }}
      aria-label="Plano maestro interactivo de Villa Paraíso"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 origin-center transition-transform duration-300 ease-out"
        style={{
          width: frame.width,
          height: frame.height,
          transform: `translate(-50%, -50%) translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
        }}
      >
        <img src={image} alt={alt} draggable={false} className="h-full w-full select-none" />
        {visibleMarkers.map(({ lot, marker }) => {
          const selected = lot.id === selectedLotId;
          return (
            <button
              key={lot.id}
              type="button"
              onClick={() => onSelectLot(lot.id)}
              className={`pointer-events-auto absolute z-10 grid place-items-center rounded-full border-2 font-extrabold tabular-nums shadow-[0_2px_10px_rgba(0,0,0,.38)] transition-all ${
                selected
                  ? "size-9 border-[#403a34] bg-accent text-xs text-accent-foreground ring-2 ring-accent/35"
                  : "size-7 border-white bg-[#403a34] text-[10px] text-white hover:bg-accent hover:text-accent-foreground"
              }`}
              style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                transform: `translate(-50%, -50%) scale(${1 / scale})`,
              }}
              aria-label={`Ver lote ${lot.id}`}
              title={`Lote ${lot.id}`}
            >
              {marker.label}
            </button>
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
