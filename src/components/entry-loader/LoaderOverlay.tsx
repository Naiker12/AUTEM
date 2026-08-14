import { useEffect, useRef, useState } from "react";
import type { LoaderOverlayProps } from "./3d-types";

export default function LoaderOverlay({
  showLoader,
  modelVisible,
  loadProgress,
}: LoaderOverlayProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();

    const updateProgress = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      setDisplayProgress((previous) => {
        const target = Math.max(loadProgress, 10);
        if (previous >= target) return target;
        const speed = Math.max(34, (target - previous) * 3.2);
        return Math.min(target, previous + speed * delta);
      });
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
    return () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [loadProgress]);

  if (!showLoader) return null;

  const currentPercent = Math.round(displayProgress);
  const status =
    modelVisible || currentPercent >= 94
      ? "Completando la estructura"
      : currentPercent > 64
        ? "Elevando los niveles"
        : currentPercent > 30
          ? "Trazando el territorio"
          : "Preparando el modelo";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-0 z-[9999] transition-all duration-700 ease-out ${
        modelVisible ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_12%,rgba(4,4,4,.1)_52%,rgba(2,2,2,.58)_100%)]" />

      <div className="relative flex h-full flex-col items-center justify-between px-6 py-8 text-center sm:py-10">
        <div className="flex items-center gap-4 text-[#d2ad64]">
          <svg
            viewBox="0 0 48 48"
            className="size-8"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 39 24 8l16 31M14 28h20M24 8v31" strokeWidth="1.25" />
            <path d="M5 42h38" strokeWidth="0.7" opacity="0.45" />
          </svg>
          <div className="text-left">
            <p className="text-[15px] font-semibold tracking-[0.36em] text-white/92">AUTEM</p>
            <p className="mt-1 text-[7px] uppercase tracking-[0.3em] text-white/38">
              Arquitectura · territorio
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm pb-2 sm:max-w-md">
          <div className="mb-3 flex items-end justify-between gap-6 font-mono uppercase">
            <div className="text-left">
              <p className="text-[8px] tracking-[0.28em] text-[#d2ad64]">Lotes 360° / Cartagena</p>
              <p className="mt-1.5 text-[9px] tracking-[0.16em] text-white/48">{status}</p>
            </div>
            <span className="text-sm tabular-nums tracking-[0.08em] text-white/78">
              {currentPercent.toString().padStart(2, "0")}
            </span>
          </div>

          <div className="relative h-px overflow-hidden bg-white/14">
            <span
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#8f6b30] via-[#d2ad64] to-[#f0d69a] shadow-[0_0_16px_rgba(210,173,100,.55)] transition-[width] duration-150"
              style={{ width: `${currentPercent}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between text-[7px] uppercase tracking-[0.26em] text-white/26">
            <span>Modelo arquitectónico</span>
            <span>Visualización 3D</span>
          </div>
        </div>
      </div>
    </div>
  );
}
