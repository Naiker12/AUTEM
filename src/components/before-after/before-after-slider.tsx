import { useState, useEffect, useRef, useCallback } from "react";
import { SlidersHorizontal, MoveHorizontal } from "lucide-react";
import type { BeforeAfterSliderProps } from "./before-after-types";

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = "Imagen del estado anterior",
  afterAlt = "Imagen del estado final proyectado",
  beforeLabel = "Antes",
  afterLabel = "Después",
  initialPosition = 50,
  autoSweep = true,
  className = "",
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimateTransition, setIsAnimateTransition] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const autoSweepCancelled = useRef(false);

  // Mark user interaction to dismiss hints & cancel auto-sweep
  const markInteracted = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      autoSweepCancelled.current = true;
    }
  }, [hasInteracted]);

  // Update slider position based on pointer event coordinates
  const updatePositionFromPointer = useCallback((clientX: number, smooth = false) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const rawPercentage = (x / rect.width) * 100;
    const clamped = Math.max(0, Math.min(100, rawPercentage));

    if (smooth) {
      setIsAnimateTransition(true);
    } else {
      setIsAnimateTransition(false);
    }

    setPosition(clamped);
  }, []);

  // Pointer Down (Mouse / Touch / Pen)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    markInteracted();
    setIsDragging(true);
    setIsAnimateTransition(false);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if pointer capture isn't supported
    }

    updatePositionFromPointer(e.clientX, false);
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePositionFromPointer(e.clientX, false);
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  // Click anywhere to jump smoothly
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    markInteracted();
    updatePositionFromPointer(e.clientX, true);
  };

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    markInteracted();
    let step = 5;
    if (e.shiftKey) step = 12;

    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        setIsAnimateTransition(true);
        setPosition((prev) => Math.max(0, prev - step));
        break;
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        setIsAnimateTransition(true);
        setPosition((prev) => Math.min(100, prev + step));
        break;
      case "Home":
        e.preventDefault();
        setIsAnimateTransition(true);
        setPosition(0);
        break;
      case "End":
        e.preventDefault();
        setIsAnimateTransition(true);
        setPosition(100);
        break;
      default:
        break;
    }
  };

  // Auto-sweep animation on first viewport entrance
  useEffect(() => {
    if (!autoSweep || hasInteracted || !containerRef.current) return;

    const el = containerRef.current;
    const timeoutIds: NodeJS.Timeout[] = [];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !autoSweepCancelled.current) {
            observer.disconnect();

            // Run sweep animation sequence: 50% -> 24% -> 76% -> 50%
            setIsAnimateTransition(true);

            const t1 = setTimeout(() => {
              if (!autoSweepCancelled.current) setPosition(24);
            }, 500);

            const t2 = setTimeout(() => {
              if (!autoSweepCancelled.current) setPosition(76);
            }, 1400);

            const t3 = setTimeout(() => {
              if (!autoSweepCancelled.current) setPosition(50);
            }, 2300);

            timeoutIds.push(t1, t2, t3);
          }
        });
      },
      { threshold: 0.3 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      timeoutIds.forEach(clearTimeout);
    };
  }, [autoSweep, hasInteracted]);

  const isFullyLoaded = beforeLoaded && afterLoaded;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="slider"
      aria-label="Comparación interactiva de antes y después"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      onKeyDown={handleKeyDown}
      onClick={handleContainerClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`group relative aspect-[16/9] w-full select-none overflow-hidden rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isDragging ? "cursor-ew-resize" : "cursor-pointer"
      } ${className}`}
    >
      {/* Skeleton Shimmer while loading */}
      {!isFullyLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-900">
          <div className="flex flex-col items-center gap-3 text-stone-500">
            <div className="h-full w-full animate-pulse bg-stone-800" />
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">
              Cargando comparación...
            </span>
          </div>
        </div>
      )}

      {/* BEFORE IMAGE (Base Layer) */}
      <img
        src={beforeSrc}
        alt={beforeAlt}
        loading="lazy"
        onLoad={() => setBeforeLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-700 ${
          beforeLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* AFTER IMAGE (Clipped Layer) */}
      <div
        className={`absolute inset-0 overflow-hidden ${
          isAnimateTransition ? "transition-[clip-path] duration-700 ease-out" : ""
        }`}
        style={{
          clipPath: `inset(0 ${100 - position}% 0 0)`,
        }}
      >
        <img
          src={afterSrc}
          alt={afterAlt}
          loading="lazy"
          onLoad={() => setAfterLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            afterLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* SLIDER HANDLE LINE */}
      <div
        className={`absolute top-0 bottom-0 z-20 w-0.5 bg-accent shadow-[0_0_12px_rgba(197,160,89,0.8)] ${
          isAnimateTransition ? "transition-[left] duration-700 ease-out" : ""
        }`}
        style={{ left: `${position}%` }}
      >
        {/* Pulsing ring around handle (only shown until first interaction) */}
        {!hasInteracted && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-16 rounded-full border-2 border-accent/40 animate-ping pointer-events-none" />
        )}

        {/* Center Drag Handle Button */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full border-2 border-accent-foreground/20 bg-accent text-accent-foreground shadow-2xl backdrop-blur-md transition-transform group-hover:scale-110 active:scale-95">
          <MoveHorizontal size={20} className="stroke-[2.5]" />
        </div>
      </div>

      {/* FLOATING HINT BUBBLE (only visible before first interaction) */}
      {!hasInteracted && isFullyLoaded && (
        <div
          className={`pointer-events-none absolute top-1/2 z-30 -translate-y-16 -translate-x-1/2 rounded-full border border-stone-700 bg-stone-950/90 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent shadow-xl backdrop-blur-md transition-all duration-700 ${
            isAnimateTransition ? "transition-[left] duration-700 ease-out" : ""
          }`}
          style={{ left: `${position}%` }}
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal size={12} />
            Arrastra ↔
          </span>
        </div>
      )}

      {/* BADGE LABELS */}
      <div className="pointer-events-none absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md shadow-lg">
        <span className="size-1.5 rounded-full bg-stone-400" />
        {beforeLabel}
      </div>

      <div className="pointer-events-none absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full border border-accent/30 bg-accent/90 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-foreground backdrop-blur-md shadow-lg">
        <span className="size-1.5 rounded-full bg-accent-foreground" />
        {afterLabel}
      </div>
    </div>
  );
}
