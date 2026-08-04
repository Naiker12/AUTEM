/**
 * Branding overlay shown on top of the 3D scene during loading.
 *
 * - Smooth progress interpolation (smooth 0 -> 100% even on cached reload)
 * - Circular SVG progress ring with glowing gold trail
 * - Percentage indicator + dynamic status subtitle
 * - AUTEM gold aura logo + luxury tagline
 * - Staggered fade-out on completion
 */
import { useEffect, useState, useRef } from "react";
import type { LoaderOverlayProps } from "./3d-types";

const CIRCUMFERENCE = 2 * Math.PI * 22;

export default function LoaderOverlay({
  showLoader,
  modelVisible,
  loadProgress,
}: LoaderOverlayProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  // Smoothly interpolate displayProgress towards target loadProgress
  useEffect(() => {
    let lastTime = performance.now();

    const updateProgress = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setDisplayProgress((prev) => {
        const target = Math.max(loadProgress, 10); // Start at least at 10% for immediate visual feedback
        if (prev >= target && target >= 100) {
          return 100;
        }

        // Speed up if target is higher, but ensure smooth minimum rate (~80% per sec max)
        const diff = target - prev;
        const speed = Math.max(40, diff * 4); // smooth lerp speed
        const next = Math.min(target, prev + speed * delta);
        return next;
      });

      animFrameRef.current = requestAnimationFrame(updateProgress);
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [loadProgress]);

  if (!showLoader) return null;

  const currentPercent = Math.round(displayProgress);

  const getStatusText = () => {
    if (modelVisible || currentPercent >= 100) return "Preparando experiencia 3D...";
    if (currentPercent > 70) return "Sincronizando entorno...";
    if (currentPercent > 35) return "Cargando arquitectura 3D...";
    return "Iniciando experiencia AUTEM...";
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-end transition-all duration-700 ease-out ${
        modelVisible ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Subtle bottom gradient for text readability */}
      <div
        className="absolute bottom-0 left-0 right-0 h-80"
        style={{
          background:
            "linear-gradient(to top, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.4) 60%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mb-16 flex flex-col items-center text-center md:mb-20">
        {/* Progress ring + percentage container */}
        <div
          className={`relative mb-6 flex items-center justify-center transition-all duration-500 ${
            modelVisible ? "opacity-0 scale-90" : "opacity-100 scale-100"
          }`}
        >
          {/* Subtle pulse glow around ring */}
          <div className="absolute inset-0 rounded-full bg-accent/20 blur-md animate-pulse" />

          <svg width="56" height="56" viewBox="0 0 52 52" className="-rotate-90">
            {/* Background track */}
            <circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              stroke="rgba(197,160,89,0.12)"
              strokeWidth="1.5"
            />
            {/* Animated progress ring */}
            <circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              stroke="#c5a059"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={`${CIRCUMFERENCE * (1 - displayProgress / 100)}`}
              style={{ transition: "stroke-dashoffset 0.15s ease-out" }}
            />
          </svg>

          {/* Percentage display in ring center */}
          <span className="absolute text-[10px] font-medium tracking-tight text-accent/90">
            {currentPercent}%
          </span>
        </div>

        {/* Logo with gold aura glow */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
          <span className="relative logo-glow font-serif text-4xl italic tracking-tight text-white/95 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] md:text-5xl">
            AUTEM
          </span>
        </div>

        {/* Tagline */}
        <p className="mt-3 text-[9px] uppercase tracking-[0.4em] text-white/50 font-medium">
          Bienes raíces en Cartagena
        </p>

        {/* Dynamic status text */}
        <p className="mt-2 text-[10px] tracking-widest text-accent/70 font-mono transition-all duration-300">
          {getStatusText()}
        </p>

        {/* Decorative gold laser line */}
        <div className="relative mx-auto mt-5 h-px w-16 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      </div>
    </div>
  );
}
