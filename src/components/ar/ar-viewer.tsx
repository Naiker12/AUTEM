import { useState, useEffect, useRef } from "react";
import { Loader2, Eye, RotateCcw, Move3D, Maximize2, Sun, Moon, Building2 } from "lucide-react";
import { FINISHES } from "@/data/constants";
import { AREnvironmentToggle } from "./ar-environment-toggle";
import type { Desktop3DViewerProps, ViewerThemeMode } from "./ar-types";

export interface EnhancedDesktop3DViewerProps extends Desktop3DViewerProps {
  onOpenFullscreen?: () => void;
}

export function Desktop3DViewer({
  modelSrc,
  selectedFinish,
  onFinishChange,
  className = "",
  propertyName = "Propiedad",
  onOpenFullscreen,
}: EnhancedDesktop3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [themeMode, setThemeMode] = useState<ViewerThemeMode>("day");

  // Initialize model-viewer Custom Element with ground shadow & fixed isometric perspective
  useEffect(() => {
    if (!modelSrc || !containerRef.current) return;

    let cancelled = false;
    setReady(false);
    const container = containerRef.current;
    container.innerHTML = "";

    const init = async () => {
      try {
        await import("@google/model-viewer");
      } catch (err) {
        console.warn("Could not import @google/model-viewer:", err);
      }

      if (cancelled || !container) return;

      const el = document.createElement("model-viewer");
      el.setAttribute("src", modelSrc);
      el.setAttribute("alt", `Modelo 3D interactivo de ${propertyName}`);
      el.setAttribute("camera-controls", "");
      // Disabled auto-rotate so the model stays anchored on its ground plane without spinning
      el.setAttribute("environment-image", "neutral");
      el.setAttribute("tone-mapping", "neutral");
      el.setAttribute("shadow-intensity", themeMode === "day" ? "1.5" : "1.2");
      el.setAttribute("shadow-softness", "0.5");
      el.setAttribute(
        "exposure",
        themeMode === "day" ? "1.15" : themeMode === "night" ? "0.75" : "1.05",
      );
      // 75deg pitch angle ensures the camera looks DOWN at the building grounded on its shadow floor
      el.setAttribute("camera-orbit", "30deg 75deg auto");
      el.setAttribute("camera-target", "auto auto auto");
      el.setAttribute("bounds", "tight");
      el.setAttribute("field-of-view", "30deg");
      el.setAttribute("min-camera-orbit", "auto 10deg 5%");
      el.setAttribute("max-camera-orbit", "auto 88deg 500%");
      el.setAttribute("interaction-prompt", "none");
      el.setAttribute("touch-action", "pan-y");

      el.style.width = "100%";
      el.style.height = "100%";
      el.style.borderRadius = "1.5rem";
      el.style.backgroundColor = "transparent";
      el.style.setProperty("--poster-color", "transparent");

      const handleLoad = () => {
        if (!cancelled) setReady(true);
      };

      el.addEventListener("load", handleLoad);

      container.appendChild(el);
      viewerRef.current = el;
    };

    init();

    return () => {
      cancelled = true;
      const viewer = viewerRef.current;
      if (viewer && container.contains(viewer)) {
        container.removeChild(viewer);
      }
      viewerRef.current = null;
    };
  }, [modelSrc, propertyName, themeMode]);

  // Apply selected material finish to 3D model
  useEffect(() => {
    if (!ready || !viewerRef.current) return;
    const finish = FINISHES[selectedFinish];
    if (!finish) return;

    try {
      const mv = viewerRef.current as unknown as {
        model?: {
          materials?: Array<{
            pbrMetallicRoughness?: {
              setBaseColorFactor?: (color: string | number[]) => void;
            };
          }>;
        };
      };

      if (mv.model?.materials?.[0]?.pbrMetallicRoughness?.setBaseColorFactor) {
        mv.model.materials[0].pbrMetallicRoughness.setBaseColorFactor(finish.color);
      }
    } catch {
      // Ignored
    }
  }, [ready, selectedFinish]);

  const handleResetCamera = () => {
    const el = viewerRef.current as unknown as {
      cameraTarget?: string;
      cameraOrbit?: string;
    };
    if (el) {
      el.cameraOrbit = "30deg 75deg auto";
      el.cameraTarget = "auto auto auto";
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border shadow-2xl transition-all duration-700 ${
        themeMode === "day"
          ? "border-amber-400/20 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900"
          : themeMode === "night"
            ? "border-indigo-900/40 bg-gradient-to-b from-stone-950 via-slate-950 to-stone-950"
            : "border-stone-800 bg-stone-950"
      } ${className}`}
      style={{ aspectRatio: "4 / 3" }}
    >
      {/* Ground spotlight reflection pool effect behind 3D model */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={`size-[380px] rounded-full blur-[90px] transition-all duration-700 ${
            themeMode === "day"
              ? "bg-amber-500/10 opacity-80"
              : themeMode === "night"
                ? "bg-indigo-500/10 opacity-80"
                : "bg-accent/5 opacity-50"
          }`}
        />
      </div>

      {modelSrc ? (
        <>
          {/* Loading state */}
          {!ready && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-stone-950/90 backdrop-blur-md">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
                <div className="relative flex size-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10 backdrop-blur-sm">
                  <Loader2 size={28} className="animate-spin text-accent" />
                </div>
              </div>
              <div className="text-center">
                <span className="block text-xs font-bold uppercase tracking-[0.2em] text-accent">
                  Cargando maqueta 3D
                </span>
                <span className="mt-1 block text-[10px] text-stone-400">
                  Estableciendo terreno y sombras reales...
                </span>
              </div>
            </div>
          )}

          {/* Model viewer element */}
          <div ref={containerRef} className="relative z-[1] h-full w-full" />

          {/* Top Controls Bar */}
          {ready && (
            <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between pointer-events-none">
              {/* Day / Night / Studio Toggle */}
              <div className="pointer-events-auto">
                <AREnvironmentToggle currentTheme={themeMode} onThemeChange={setThemeMode} />
              </div>

              {/* Actions: Reset Camera & Fullscreen */}
              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  onClick={handleResetCamera}
                  className="flex size-9 items-center justify-center rounded-full border border-stone-700/80 bg-stone-900/90 text-stone-200 backdrop-blur-md transition-all hover:border-accent hover:text-accent shadow-lg"
                  aria-label="Restablecer vista 3D"
                  title="Restablecer vista 3D"
                >
                  <RotateCcw size={14} />
                </button>

                {onOpenFullscreen && (
                  <button
                    onClick={onOpenFullscreen}
                    className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-lg backdrop-blur-md transition-all hover:bg-accent/90 hover:scale-105"
                    title="Ver más grande en pantalla completa"
                  >
                    <Maximize2 size={13} />
                    <span className="hidden sm:inline">Ver más grande</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Day/Night Indicator Pill */}
          {ready && (
            <div className="absolute left-4 bottom-20 z-20 flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900/90 px-3.5 py-1.5 text-[10px] font-medium text-stone-200 backdrop-blur-md shadow-lg">
              {themeMode === "day" ? (
                <>
                  <Sun size={13} className="text-amber-400" />
                  <span>Día · Iluminación natural y sombras de terreno</span>
                </>
              ) : themeMode === "night" ? (
                <>
                  <Moon size={13} className="text-indigo-300" />
                  <span>Noche · Ambiente nocturno e iluminación interior</span>
                </>
              ) : (
                <>
                  <Building2 size={13} className="text-accent" />
                  <span>Estudio 3D · Maqueta arquitectónica interactiva</span>
                </>
              )}
            </div>
          )}

          {/* Material Finishes Bar */}
          {ready && (
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-2xl border border-stone-800 bg-stone-900/95 px-4 py-2.5 backdrop-blur-xl shadow-2xl">
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-accent font-semibold">
                <Eye size={12} /> Acabados
              </span>
              <div className="flex items-center gap-2 mx-auto sm:mx-0">
                {FINISHES.map((finish, i) => (
                  <button
                    key={finish.id}
                    onClick={() => onFinishChange(i)}
                    className={`group relative flex flex-col items-center gap-0.5 transition-all ${
                      selectedFinish === i ? "scale-105" : "opacity-60 hover:opacity-100"
                    }`}
                    title={finish.label}
                  >
                    <span
                      className={`block size-7 rounded-full border-2 shadow-md transition-all ${
                        selectedFinish === i
                          ? "border-accent ring-2 ring-accent/40"
                          : "border-stone-600 hover:border-stone-400"
                      }`}
                      style={{ backgroundColor: finish.color }}
                    />
                    <span
                      className={`text-[8px] uppercase tracking-wider transition-colors ${
                        selectedFinish === i ? "text-accent font-bold" : "text-stone-300"
                      }`}
                    >
                      {finish.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-3 text-stone-500">
          <Move3D size={32} className="opacity-30" />
          <span className="text-xs uppercase tracking-widest">Modelo 3D no disponible</span>
        </div>
      )}
    </div>
  );
}
