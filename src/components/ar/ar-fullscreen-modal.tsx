import { useState, useEffect, useRef } from "react";
import { X, RotateCcw, Eye, Maximize2 } from "lucide-react";
import { FINISHES } from "@/data/constants";
import { AREnvironmentToggle } from "./ar-environment-toggle";
import type { ARFullscreenModalProps, ViewerThemeMode } from "./ar-types";

export function ARFullscreenModal({
  isOpen,
  onClose,
  modelSrc,
  propertyName,
  selectedFinish,
  onFinishChange,
}: ARFullscreenModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Init model viewer inside modal
  useEffect(() => {
    if (!isOpen || !modelSrc || !containerRef.current) return;

    let cancelled = false;
    setReady(false);
    const container = containerRef.current;
    container.innerHTML = "";

    const init = async () => {
      try {
        await import("@google/model-viewer");
      } catch (err) {
        console.warn("Could not import model-viewer:", err);
      }

      if (cancelled || !container) return;

      const el = document.createElement("model-viewer");
      el.setAttribute("src", modelSrc);
      el.setAttribute("alt", `Modelo 3D ampliado de ${propertyName}`);
      el.setAttribute("camera-controls", "");
      el.setAttribute("environment-image", "neutral");
      el.setAttribute("tone-mapping", "neutral");
      el.setAttribute("shadow-intensity", themeMode === "day" ? "1.5" : "1.2");
      el.setAttribute("shadow-softness", "0.5");
      el.setAttribute(
        "exposure",
        themeMode === "day" ? "1.15" : themeMode === "night" ? "0.75" : "1.05",
      );
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
      if (viewerRef.current && container.contains(viewerRef.current)) {
        container.removeChild(viewerRef.current);
      }
      viewerRef.current = null;
    };
  }, [isOpen, modelSrc, propertyName, themeMode]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-stone-950/95 backdrop-blur-2xl popup-enter text-white"
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

        <div ref={containerRef} className="h-full w-full" />

        {/* Reset Camera button */}
        <button
          onClick={handleResetCamera}
          className="absolute right-6 top-6 z-20 flex size-11 items-center justify-center rounded-full border border-stone-800 bg-stone-900/90 text-white backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground shadow-xl"
          title="Restablecer vista 3D"
        >
          <RotateCcw size={18} />
        </button>

        {/* Bottom finish toolbar */}
        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 flex items-center gap-4 rounded-full border border-stone-800 bg-stone-900/95 px-6 py-3 backdrop-blur-xl shadow-2xl">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
            <Eye size={14} /> Acabados
          </span>
          <div className="h-4 w-px bg-stone-800" />
          <div className="flex items-center gap-3">
            {FINISHES.map((finish, i) => (
              <button
                key={finish.id}
                onClick={() => onFinishChange(i)}
                className={`group relative flex items-center gap-2 rounded-full px-3 py-1.5 transition-all ${
                  selectedFinish === i
                    ? "bg-stone-800 text-white font-bold ring-1 ring-accent"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                <span
                  className="size-5 rounded-full border border-stone-600 shadow"
                  style={{ backgroundColor: finish.color }}
                />
                <span className="text-xs">{finish.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
