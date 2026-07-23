import { useState, useEffect, useRef } from "react";
import { Loader2, Eye, RotateCcw } from "lucide-react";
import { FINISHES } from "@/data/constants";
import { LIGHTING_PRESETS } from "./ar-types";
import type { Desktop3DViewerProps, LightingMode } from "./ar-types";
import { AREnvironmentToggle } from "./ar-environment-toggle";

export function Desktop3DViewer({
  modelSrc,
  selectedFinish,
  onFinishChange,
  lightingMode,
  onLightingChange,
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
      el.setAttribute("environment-image", "neutral");
      el.setAttribute("tone-mapping", "neutral");
      el.setAttribute("shadow-intensity", "1.2");
      el.setAttribute("shadow-softness", "0.8");
      el.setAttribute("exposure", "1.1");
      el.setAttribute("camera-orbit", "25deg 70deg 40%");
      el.setAttribute("camera-target", "auto auto auto");
      el.setAttribute("bounds", "tight");
      el.setAttribute("field-of-view", "20deg");
      el.setAttribute("min-field-of-view", "8deg");
      el.setAttribute("max-field-of-view", "45deg");
      el.setAttribute("min-camera-orbit", "auto 10deg 10%");
      el.setAttribute("max-camera-orbit", "auto 88deg 200%");
      el.setAttribute("interaction-prompt", "none");
      el.setAttribute("touch-action", "pan-y");

      el.style.width = "100%";
      el.style.height = "100%";
      el.style.borderRadius = "1.5rem";
      el.style.backgroundColor = "transparent";
      el.style.setProperty("--poster-color", "transparent");

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

  // Aplica el preset de iluminación (Día / Noche / Estudio) sin recrear el <model-viewer>
  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !ready) return;
    const preset = LIGHTING_PRESETS[lightingMode];

    if (preset.skybox) {
      el.setAttribute("skybox-image", preset.skybox);
      el.removeAttribute("environment-image");
    } else {
      el.removeAttribute("skybox-image");
      el.setAttribute("environment-image", preset.environment ?? "neutral");
    }
    el.setAttribute("exposure", preset.exposure);
    el.setAttribute("shadow-intensity", preset.shadowIntensity);
  }, [lightingMode, ready]);

  const handleResetCamera = () => {
    const el = viewerRef.current as unknown as { cameraTarget?: string; cameraOrbit?: string };
    if (el) {
      el.cameraOrbit = "25deg 70deg 40%";
      el.cameraTarget = "auto auto auto";
    }
  };

  return (
    <div
      className={`relative aspect-[4/3] sm:aspect-[16/11] min-h-[460px] md:min-h-[540px] w-full overflow-hidden rounded-3xl border border-stone-800 bg-stone-950 text-white shadow-2xl ${className}`}
    >
      {/* Fondo de Resplandor Reflejado para terreno */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={`size-[380px] rounded-full blur-[90px] transition-all duration-700 ${lightingMode === "day"
              ? "bg-amber-500/10 opacity-80"
              : lightingMode === "night"
                ? "bg-indigo-500/10 opacity-80"
                : "bg-accent/5 opacity-50"
            }`}
        />
      </div>

      {modelSrc ? (
        <>
          {!ready && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-stone-950/90 backdrop-blur-md text-stone-300">
              <Loader2 size={32} className="animate-spin text-accent" />
              <span className="text-xs uppercase tracking-widest text-accent font-bold">
                Cargando maqueta 3D...
              </span>
            </div>
          )}

          <div ref={containerRef} className="relative z-[1] h-full w-full" />

          {/* Lighting Mode Toggle (Día / Noche / Estudio) */}
          {ready && (
            <div className="absolute left-6 top-6 z-20">
              <AREnvironmentToggle currentTheme={lightingMode} onThemeChange={onLightingChange} />
            </div>
          )}

          {/* Reset Camera Floating Button */}
          {ready && (
            <button
              onClick={handleResetCamera}
              className="absolute right-6 top-6 z-20 flex size-10 items-center justify-center rounded-full border border-stone-700/80 bg-stone-950/80 text-white backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground shadow-lg"
              aria-label="Restablecer vista 3D"
              title="Restablecer cámara"
            >
              <RotateCcw size={16} />
            </button>
          )}

          {/* Active Lighting Status Label - Centered */}
          {ready && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full border border-stone-800/80 bg-stone-950/90 px-4 py-1.5 text-[10px] text-stone-300 backdrop-blur-md shadow-lg whitespace-nowrap">
              {lightingMode === "day" && "☀️ Día · Iluminación natural y sombras de terreno"}
              {lightingMode === "night" && "🌙 Noche · Ambiente nocturno e iluminación interior"}
              {lightingMode === "studio" && "◻ Estudio 3D · Maqueta arquitectónica interactiva"}
            </div>
          )}

          {/* Material Finishes Customizer Bar - Centered Floating Island */}
          {ready && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 rounded-full border border-stone-800/90 bg-stone-950/95 px-6 py-2.5 backdrop-blur-xl shadow-2xl text-white">
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-accent font-semibold whitespace-nowrap">
                <Eye size={12} /> Acabados en tiempo real
              </span>
              <div className="hidden sm:block h-4 w-px bg-stone-800" />
              <div className="flex items-center gap-3">
                {FINISHES.map((finish, i) => (
                  <button
                    key={finish.id}
                    onClick={() => onFinishChange(i)}
                    className={`group relative flex items-center justify-center transition-all ${
                      selectedFinish === i ? "scale-110" : "opacity-60 hover:opacity-100"
                    }`}
                    title={finish.label}
                  >
                    <span
                      className={`block size-7 rounded-full border-2 shadow-md transition-all ${
                        selectedFinish === i
                          ? "border-accent ring-2 ring-accent/40"
                          : "border-stone-700 hover:border-stone-400"
                      }`}
                      style={{ backgroundColor: finish.color }}
                    />
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
