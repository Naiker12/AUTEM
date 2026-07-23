import { useState, useEffect, useRef } from "react";
import { Loader2, Eye, RotateCcw } from "lucide-react";
import { FINISHES } from "@/data/constants";
import type { Desktop3DViewerProps } from "./ar-types";

export function Desktop3DViewer({
  modelSrc,
  selectedFinish,
  onFinishChange,
  className = "",
}: Desktop3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!modelSrc || !containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;

    const init = async () => {
      const mv = await import("@google/model-viewer");
      if (cancelled || !container) return;
      void mv;

      const el = document.createElement("model-viewer");
      el.setAttribute("src", modelSrc);
      el.setAttribute("alt", "Modelo 3D interactivo de la propiedad");
      el.setAttribute("camera-controls", "");
      el.setAttribute("auto-rotate", "");
      el.setAttribute("shadow-intensity", "1.2");
      el.setAttribute("shadow-softness", "0.8");
      el.setAttribute("exposure", "1.1");
      el.setAttribute("camera-orbit", "45deg 55deg 4m");
      el.setAttribute("min-camera-orbit", "auto auto 1m");
      el.setAttribute("max-camera-orbit", "Infinity Infinity 10m");
      el.setAttribute("interaction-prompt", "none");
      el.setAttribute("touch-action", "pan-y");

      el.style.width = "100%";
      el.style.height = "100%";
      el.style.borderRadius = "1.5rem";
      el.style.backgroundColor = "transparent";

      el.addEventListener("load", () => {
        if (!cancelled) setReady(true);
      });

      container.appendChild(el);
      viewerRef.current = el;
    };

    init();

    return () => {
      cancelled = true;
      const viewer = viewerRef.current;
      if (viewer && container) {
        container.removeChild(viewer);
        viewerRef.current = null;
      }
    };
  }, [modelSrc]);

  const handleResetCamera = () => {
    const el = viewerRef.current as unknown as { cameraTarget?: string; cameraOrbit?: string };
    if (el) {
      el.cameraOrbit = "45deg 55deg 4m";
      el.cameraTarget = "auto auto auto";
    }
  };

  return (
    <div className={`relative aspect-square w-full overflow-hidden rounded-3xl border border-stone-800 bg-stone-900 shadow-2xl ${className}`}>
      {modelSrc ? (
        <>
          {!ready && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-stone-950/80 backdrop-blur-sm text-stone-300">
              <Loader2 size={32} className="animate-spin text-accent" />
              <span className="text-xs uppercase tracking-widest">Cargando modelo 3D...</span>
            </div>
          )}

          <div ref={containerRef} className="h-full w-full" />

          {/* Reset Camera Floating Button */}
          {ready && (
            <button
              onClick={handleResetCamera}
              className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-full bg-stone-950/80 text-white backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground shadow-md"
              aria-label="Restablecer cámara"
            >
              <RotateCcw size={16} />
            </button>
          )}

          {/* Material Finishes Customizer Bar */}
          {ready && (
            <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center gap-2.5 rounded-2xl bg-stone-950/85 p-3 backdrop-blur-md border border-stone-800 text-white shadow-xl">
              <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold flex items-center gap-1.5">
                <Eye size={12} /> Acabados en tiempo real
              </span>
              <div className="flex gap-3">
                {FINISHES.map((finish, i) => (
                  <button
                    key={finish.name}
                    onClick={() => onFinishChange(i)}
                    className={`group relative size-9 rounded-full border-2 transition-all ${
                      selectedFinish === i
                        ? "border-accent ring-2 ring-accent/40 scale-110"
                        : "border-stone-700 opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: finish.color }}
                    title={finish.name}
                  >
                    <span className="sr-only">{finish.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-stone-500 text-xs uppercase tracking-widest">
          Modelo 3D no disponible
        </div>
      )}
    </div>
  );
}
