import { useState, useEffect, useRef } from "react";
import { Loader2, Eye, RotateCcw } from "lucide-react";
import { FINISHES } from "@/data/constants";
import { LIGHTING_PRESETS } from "./ar-types";
import type { Desktop3DViewerProps, LightingMode } from "./ar-types";
import { AREnvironmentToggle } from "./ar-environment-toggle";
import "@google/model-viewer";

export function Desktop3DViewer({
  modelSrc,
  selectedFinish,
  onFinishChange,
  lightingMode,
  onLightingChange,
  className = "",
}: Desktop3DViewerProps) {
  const viewerRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  // Synchronize material finish color
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
    const el = viewerRef.current as unknown as { cameraTarget?: string; cameraOrbit?: string };
    if (el) {
      el.cameraOrbit = "25deg 75deg 105%";
      el.cameraTarget = "auto auto auto";
    }
  };

  const preset = LIGHTING_PRESETS[lightingMode];

  const bgStyles: Record<LightingMode, string> = {
    day: "border-stone-800 bg-gradient-to-b from-amber-950/30 via-stone-950 to-stone-950",
    night: "border-indigo-950 bg-gradient-to-b from-indigo-950/60 via-slate-950 to-slate-950",
    studio: "border-stone-800 bg-stone-950",
  };

  return (
    <div
      className={`relative aspect-[4/3] sm:aspect-[16/11] min-h-[380px] sm:min-h-[460px] md:min-h-[540px] w-full overflow-hidden rounded-3xl border text-white shadow-2xl transition-all duration-700 ${bgStyles[lightingMode]} ${className}`}
    >
      {/* Fondo de Resplandor Reflejado para terreno */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={`size-[320px] sm:size-[450px] rounded-full blur-[90px] sm:blur-[100px] transition-all duration-700 ${
            lightingMode === "day"
              ? "bg-amber-500/20 opacity-80"
              : lightingMode === "night"
                ? "bg-indigo-500/25 opacity-80"
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

          {/* Model Viewer Component directly in JSX */}
          <div className="relative z-[1] h-full w-full">
            <model-viewer
              ref={viewerRef}
              src={modelSrc}
              alt="Modelo 3D interactivo de la propiedad"
              camera-controls=""
              environment-image={preset.environment ?? "neutral"}
              tone-mapping="neutral"
              shadow-intensity={preset.shadowIntensity}
              shadow-softness={preset.shadowSoftness}
              exposure={preset.exposure}
              camera-orbit="25deg 75deg 105%"
              camera-target="auto auto auto"
              bounds="tight"
              field-of-view="18deg"
              min-field-of-view="14deg"
              max-field-of-view="25deg"
              min-camera-orbit="auto 45deg 70%"
              max-camera-orbit="auto 85deg 140%"
              interpolation-decay="200"
              interaction-prompt="none"
              touch-action="pan-y"
              onLoad={() => setReady(true)}
              style={
                {
                  width: "100%",
                  height: "100%",
                  borderRadius: "1.5rem",
                  backgroundColor: "transparent",
                  "--poster-color": "transparent",
                } as React.CSSProperties
              }
            />
          </div>

          {/* Lighting Mode Toggle (Día / Noche / Estudio) */}
          {ready && (
            <div className="absolute left-3 sm:left-6 top-3 sm:top-6 z-20">
              <AREnvironmentToggle currentTheme={lightingMode} onThemeChange={onLightingChange} />
            </div>
          )}

          {/* Reset Camera Floating Button */}
          {ready && (
            <button
              onClick={handleResetCamera}
              className="absolute right-3 sm:right-6 top-3 sm:top-6 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full border border-stone-700/80 bg-stone-950/80 text-white backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground shadow-lg"
              aria-label="Restablecer vista 3D"
              title="Restablecer cámara"
            >
              <RotateCcw size={15} />
            </button>
          )}

          {/* Active Lighting Status Label - Centered (Responsive on mobile) */}
          {ready && (
            <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-20 hidden xs:flex items-center gap-1.5 rounded-full border border-stone-800/80 bg-stone-950/90 px-3 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[10px] text-stone-300 backdrop-blur-md shadow-lg max-w-[90%] truncate">
              {lightingMode === "day" && "☀️ Día · Iluminación solar natural"}
              {lightingMode === "night" && "🌙 Noche · Iluminación nocturna"}
              {lightingMode === "studio" && "◻ Estudio 3D · Maqueta interactiva"}
            </div>
          )}

          {/* Material Finishes Customizer Bar - Centered Floating Island */}
          {ready && (
            <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 sm:gap-4 rounded-full border border-stone-800/90 bg-stone-950/95 px-4 sm:px-6 py-2 sm:py-2.5 backdrop-blur-xl shadow-2xl text-white max-w-[95%]">
              <span className="hidden md:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-accent font-semibold whitespace-nowrap">
                <Eye size={12} /> Acabados
              </span>
              <div className="hidden md:block h-4 w-px bg-stone-800" />
              <div className="flex items-center gap-2.5 sm:gap-3">
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
                      className={`block size-6 sm:size-7 rounded-full border-2 shadow-md transition-all ${
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
