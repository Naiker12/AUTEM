import { useEffect, useState } from "react";
import AutemBrandIcon from "@/components/AutemBrandIcon";

interface ProjectLoadingScreenProps {
  projectName: string;
  projectLocation?: string;
  onFinish?: () => void;
  minDuration?: number;
}

export default function ProjectLoadingScreen({
  projectName,
  projectLocation,
  onFinish,
  minDuration = 850,
}: ProjectLoadingScreenProps) {
  const [progress, setProgress] = useState(12);
  const [statusText, setStatusText] = useState("Conectando con el territorio...");
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const startTime = performance.now();
    let animFrame: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(100, Math.round((elapsed / minDuration) * 100));

      setProgress(rawProgress);

      if (rawProgress < 30) {
        setStatusText("Conectando con el territorio...");
      } else if (rawProgress < 65) {
        setStatusText("Cargando cartografía y parcelación...");
      } else if (rawProgress < 92) {
        setStatusText("Calibrando masterplan interactivo...");
      } else {
        setStatusText("Territorio preparado");
      }

      if (elapsed < minDuration) {
        animFrame = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setStatusText("Territorio preparado");
        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
          const removeTimer = setTimeout(() => {
            setIsVisible(false);
            onFinish?.();
          }, 480);
          return () => clearTimeout(removeTimer);
        }, 120);
        return () => clearTimeout(fadeTimer);
      }
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [minDuration, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#141210] text-[#f7f3ec] select-none transition-all duration-500 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none scale-[1.02]" : "opacity-100"
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 45%, rgba(228, 194, 115, 0.12) 0%, rgba(20, 18, 16, 0.98) 75%),
          linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 48px 48px, 48px 48px",
      }}
    >
      {/* Subtle top architectural tag */}
      <div className="absolute top-8 flex items-center gap-2 text-[10px] font-mono tracking-[0.26em] uppercase text-[#C5A059]/80">
        <span className="size-1 rounded-full bg-[#C5A059] animate-ping" />
        AUTEM · ESTUDIO DE ARQUITECTURA &amp; TERRITORIO
      </div>

      {/* Main center focal point */}
      <div className="relative flex flex-col items-center px-6 text-center max-w-md w-full">
        {/* Glow halo behind icon */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute size-36 rounded-full bg-[#C5A059]/15 blur-2xl animate-pulse" />
          <div className="absolute size-28 rounded-full border border-[#C5A059]/20" />
          <div className="absolute size-28 rounded-full border border-dashed border-[#C5A059]/25 animate-[spin_24s_linear_infinite]" />

          {/* Coordinate crosshairs */}
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-[#C5A059]/40 font-mono">
            +
          </span>
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-[#C5A059]/40 font-mono">
            +
          </span>
          <span className="absolute left-[-12px] top-1/2 -translate-y-1/2 text-[9px] text-[#C5A059]/40 font-mono">
            +
          </span>
          <span className="absolute right-[-12px] top-1/2 -translate-y-1/2 text-[9px] text-[#C5A059]/40 font-mono">
            +
          </span>

          <AutemBrandIcon
            size={76}
            className="relative z-10 drop-shadow-[0_0_24px_rgba(228,194,115,0.4)]"
          />
        </div>

        {/* Project Name */}
        <h2 className="font-serif text-2xl sm:text-3xl font-light tracking-tight text-[#fbf8f3]">
          {projectName}
        </h2>

        {projectLocation && (
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#C5A059]/90 font-medium">
            {projectLocation}
          </p>
        )}

        {/* Minimalist Architectural Progress Bar */}
        <div className="mt-8 w-64 max-w-full">
          <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8E682B] via-[#E4C273] to-[#8E682B] transition-all duration-150 ease-out shadow-[0_0_12px_rgba(228,194,115,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#a39a8c]">
            <span className="truncate pr-2">{statusText}</span>
            <span className="tabular-nums font-semibold text-[#E4C273]">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom coordinate aesthetic indicator */}
      <div className="absolute bottom-7 text-[10px] font-mono tracking-[0.2em] text-[#7a7267] uppercase">
        CARTOGRAFÍA DIGITAL · EXPERIENCIA ESPACIAL
      </div>
    </div>
  );
}
