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
        const speed = Math.max(65, (target - previous) * 5.5);
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
    modelVisible || currentPercent >= 90
      ? "Estructura completada"
      : currentPercent > 50
        ? "Cargando espacio 3D"
        : "Iniciando AUTEM";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ease-out ${
        modelVisible ? "-translate-y-2 opacity-0 scale-98" : "translate-y-0 opacity-100 scale-100"
      }`}
    >
      {/* Cinematic subtle vignette backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.75)_65%,rgba(0,0,0,0.92)_100%)]" />

      {/* Main Centered Content: AUTEM Logo & Progress Bar */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-md w-full">
        {/* Geometric Architectural 'A' Logo Mark */}
        <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl border border-[#c5a059]/40 bg-[#12110f]/80 p-3 text-[#c5a059] shadow-[0_0_35px_rgba(197,160,89,0.25)] backdrop-blur-md transition-transform duration-700 animate-pulse">
          <svg
            viewBox="0 0 48 48"
            className="h-full w-full"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 39 24 8l16 31M14 28h20M24 8v31" strokeWidth="1.75" />
            <path d="M5 42h38" strokeWidth="0.8" opacity="0.4" />
          </svg>
        </div>

        {/* Monumental AUTEM Logo Title */}
        <h1 className="mt-4 font-serif text-[28px] sm:text-[34px] font-normal tracking-[0.32em] text-[#f6f1eb] uppercase leading-none">
          AUTEM
        </h1>
        <p className="mt-2 text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.3em] text-[#c5a059]">
          Arquitectura · Paisaje · Territorio
        </p>

        {/* Centered Minimalist Progress Line */}
        <div className="mt-8 w-full max-w-[240px]">
          <div className="mb-2 flex items-center justify-between text-[9px] font-mono uppercase text-[#f6f1eb]/60">
            <span className="tracking-[0.14em]">{status}</span>
            <span className="tabular-nums tracking-[0.08em] text-[#c5a059]">
              {currentPercent.toString().padStart(2, "0")}%
            </span>
          </div>

          <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/10">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#8f6b30] via-[#c5a059] to-[#f0d69a] shadow-[0_0_12px_rgba(197,160,89,0.7)] transition-[width] duration-150"
              style={{ width: `${currentPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
