import { useState, useEffect, useRef } from "react";
import { X, RotateCcw, Eye, Maximize2 } from "lucide-react";
import { FINISHES } from "@/data/constants";
import { AREnvironmentToggle } from "./ar-environment-toggle";
import { LIGHTING_PRESETS } from "./ar-types";
import type { ARFullscreenModalProps, ViewerThemeMode } from "./ar-types";
import "@google/model-viewer";

export function ARFullscreenModal({
  isOpen,
  onClose,
  modelSrc,
  propertyName,
  selectedFinish,
  onFinishChange,
}: ARFullscreenModalProps) {
  const viewerRef = useRef<HTMLElement | null>(null);
  const [themeMode, setThemeMode] = useState<ViewerThemeMode>("day");
  const [ready, setReady] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Apply finish
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
  }, [ready, selectedFinish, isOpen]);

  const handleResetCamera = () => {
    const el = viewerRef.current as unknown as { cameraTarget?: string; cameraOrbit?: string };
    if (el) {
      el.cameraOrbit = "25deg 75deg 105%";
      el.cameraTarget = "auto auto auto";
    }
  };

  if (!isOpen) return null;

  const preset = LIGHTING_PRESETS[themeMode];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-stone-950/95 backdrop-blur-2xl text-white animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={`Vista ampliada 3D de ${propertyName}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-stone-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <Maximize2 className="size-5 text-accent" />
          <div>
            <h3 className="font-serif text-lg font-bold text-white">{propertyName}</h3>
            <p className="text-[11px] text-stone-400">Inspección 3D interactiva en terreno real</p>
          </div>
        </div>

        {/* Day / Night / Studio Switcher */}
        <div className="flex items-center gap-3">
          <AREnvironmentToggle currentTheme={themeMode} onThemeChange={setThemeMode} />

          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div
        className={`relative flex-1 transition-all duration-700 ${
          themeMode === "day"
            ? "bg-stone-950"
            : themeMode === "night"
              ? "bg-slate-950"
              : "bg-stone-950"
        }`}
      >
        {/* Subtle radial ground glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`size-[500px] rounded-full blur-[120px] transition-all duration-700 ${
              themeMode === "day"
                ? "bg-amber-500/10 opacity-70"
                : themeMode === "night"
                  ? "bg-indigo-500/10 opacity-70"
                  : "bg-accent/5 opacity-40"
            }`}
          />
        </div>

        <div className="h-full w-full">
          <model-viewer
            ref={viewerRef}
            src={modelSrc}
            alt={`Modelo 3D ampliado de ${propertyName}`}
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
                backgroundColor: "transparent",
                "--poster-color": "transparent",
              } as React.CSSProperties
            }
          />
        </div>

        {/* Reset Camera button */}
        <button
          onClick={handleResetCamera}
          className="absolute right-6 top-6 z-20 flex size-11 items-center justify-center rounded-full border border-stone-800 bg-stone-900/90 text-white backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground shadow-xl"
          title="Restablecer vista 3D"
        >
          <RotateCcw size={18} />
        </button>

        {/* Bottom finish toolbar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 rounded-full border border-stone-800/90 bg-stone-950/90 px-8 py-3 backdrop-blur-xl shadow-2xl">
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold">
            <Eye size={14} /> Acabado:
          </span>
          <div className="flex items-center gap-4">
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
                  className={`block size-8 rounded-full border-2 shadow-md transition-all ${
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
      </div>
    </div>
  );
}
