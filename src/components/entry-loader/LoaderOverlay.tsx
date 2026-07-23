/**
 * Branding overlay shown on top of the 3D scene during loading.
 *
 * - Circular SVG progress ring (gold)
 * - AUTEM logo + tagline
 * - Bottom-aligned so the 3D model stays fully visible
 * - "Enter" hint that appears after model is loaded
 */
import type { LoaderOverlayProps } from "./3d-types";

const CIRCUMFERENCE = 2 * Math.PI * 20;

export default function LoaderOverlay({
  showLoader,
  modelVisible,
  loadProgress,
}: LoaderOverlayProps) {
  if (!showLoader) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-end">
      {/* Subtle bottom gradient for text readability */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64"
        style={{
          background:
            "linear-gradient(to top, rgba(5,5,5,0.7) 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mb-16 flex flex-col items-center text-center md:mb-20">
        {/* Circular progress ring */}
        <div
          className={`mb-8 transition-opacity duration-500 ${
            modelVisible ? "opacity-0" : "opacity-100"
          }`}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            className="-rotate-90"
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="rgba(197,160,89,0.15)"
              strokeWidth="1"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#c5a059"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={`${CIRCUMFERENCE * (1 - loadProgress / 100)}`}
              style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
            />
          </svg>
        </div>

        {/* Logo */}
        <span className="logo-glow font-serif text-4xl italic tracking-tight text-white/90 drop-shadow-2xl md:text-5xl">
          AUTEM
        </span>

        {/* Tagline */}
        <p className="mt-3 text-[9px] uppercase tracking-[0.35em] text-white/40">
          Bienes raíces en Cartagena
        </p>

        {/* Decorative line */}
        <div className="mx-auto mt-6 h-px w-12 bg-accent/30" />
      </div>
    </div>
  );
}
