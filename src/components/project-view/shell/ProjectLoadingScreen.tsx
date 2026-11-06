import { useEffect, useState } from "react";

interface ProjectLoadingScreenProps {
  projectName: string;
  projectLocation?: string;
  logoUrl?: string;
  onFinish?: () => void;
  minDuration?: number;
  variant?: "default" | "dark-compact";
}

/** Brand entrance, slow typographic reveal */
export default function ProjectLoadingScreen({
  projectName,
  projectLocation,
  logoUrl,
  onFinish,
  minDuration = 2000,
  variant = "dark-compact",
}: ProjectLoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 0 : minDuration;
    const exitDuration = variant === "dark-compact" ? 600 : 400;

    const fadeTimer = window.setTimeout(() => {
      setLeaving(true);
      onFinish?.();
    }, duration);

    const removeTimer = window.setTimeout(
      () => setVisible(false),
      duration + (reduced ? 0 : exitDuration),
    );

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [minDuration, onFinish, variant]);

  if (!visible) return null;

  return (
    <div
      className={`project-intro${variant === "dark-compact" ? " project-intro--dark-compact" : ""}`}
      data-leaving={leaving}
      aria-hidden="true"
    >
      <div className="project-intro__content max-w-2xl px-6 flex flex-col items-center text-center">
        {logoUrl ? (
          <div className="mb-4 flex flex-col items-center gap-1.5 animate-in fade-in zoom-in-95 duration-1000">
            <img
              src={logoUrl}
              alt={projectName}
              className="h-12 sm:h-16 md:h-20 w-auto max-w-[280px] sm:max-w-[340px] object-contain brightness-0 invert drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]"
            />
            <span className="text-[7.5px] sm:text-[8px] uppercase tracking-[0.28em] text-white/50 font-medium">
              by AUTEM
            </span>
          </div>
        ) : (
          <p className="project-intro__eyebrow">AUTEM · Arquitectura y territorio</p>
        )}

        <h2 className="font-serif font-light tracking-tight text-white/95 leading-tight">
          {projectName.toLowerCase().includes("paraiso")
            ? "LA VIDA QUE SUEÑAS, EN EL PARAÍSO QUE MERECES"
            : projectName}
        </h2>

        <span className="project-intro__line" />

        {projectLocation && (
          <p className="project-intro__location text-white/60 tracking-[0.22em] text-[9.5px] uppercase">
            {projectLocation}
          </p>
        )}
      </div>
    </div>
  );
}
