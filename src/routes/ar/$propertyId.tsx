import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";
import {
  ArrowLeft,
  Loader2,
  Smartphone,
  MessageCircle,
  Camera,
  AlertTriangle,
  RotateCcw,
  Eye,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Check,
} from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { getARModel, hasUSDZFile } from "@/data/ar-models";
import { properties } from "@/data/properties";
import { FINISHES, WHATSAPP_BASE_URL } from "@/data/constants";
import { AREnvironmentToggle } from "@/components/ar/ar-environment-toggle";
import type { ViewerThemeMode } from "@/components/ar/ar-types";

export const Route = createFileRoute("/ar/$propertyId")({
  component: ARViewerPage,
  validateSearch: (search: Record<string, unknown>) => ({
    finish: (search.finish as string) || "nordic",
  }),
});

function OnboardingOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const modalRef = useModalA11y(true, onDismiss);
  const steps = [
    {
      icon: <Camera size={28} className="text-accent" />,
      title: "Vive la experiencia 3D",
      desc: "Visualiza la propiedad a escala real directamente en tu pantalla.",
    },
    {
      icon: <Smartphone size={28} className="text-accent" />,
      title: "Explora en tu espacio",
      desc: 'En tu celular, presiona "Ver en tu espacio" para colocarla en tu lote con realidad aumentada.',
    },
    {
      icon: <RotateCcw size={28} className="text-accent" />,
      title: "Personaliza acabados",
      desc: "Rota 360°, acerca con zoom y selecciona acabados de mármol, nogal, piedra y dorado en tiempo real.",
    },
  ];

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md popup-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de realidad aumentada"
    >
      <div className="mx-4 w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-2xl text-card-foreground">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
            {steps[step].icon}
          </div>
          <h3 className="font-serif text-xl font-bold">{steps[step].title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{steps[step].desc}</p>

          <div className="mt-6 flex items-center justify-center gap-2">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`size-2 rounded-full transition-all ${
                  i === step ? "w-6 bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {step < steps.length - 1 ? (
              <>
                <button
                  onClick={() => setStep(step + 1)}
                  className="w-full rounded-2xl bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-accent-foreground transition-all hover:bg-accent/90"
                >
                  Siguiente
                </button>
                <button
                  onClick={onDismiss}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Saltar
                </button>
              </>
            ) : (
              <button
                onClick={onDismiss}
                className="w-full rounded-2xl bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-accent-foreground transition-all hover:bg-accent/90"
              >
                ¡Empezar a explorar!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostARCTA({ propertyName, onClose }: { propertyName: string; onClose: () => void }) {
  const whatsappUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(
    `Hola AUTEM, me interesa "${propertyName}" que vi en realidad aumentada. Me gustaría agendar una visita.`,
  )}`;
  const modalRef = useModalA11y(true, onClose);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md popup-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Contacto post AR"
    >
      <div className="mx-4 max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-2xl text-card-foreground">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
          <Camera size={24} className="text-accent" />
        </div>
        <h3 className="font-serif text-xl font-bold">¿Te gustó lo que viste?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Agenda una visita privada para conocer la propiedad en persona.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 shadow-lg"
          >
            <MessageCircle size={16} />
            Agendar por WhatsApp
          </a>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ARPermissionExplainer({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  const modalRef = useModalA11y(true, onDecline);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md popup-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Permiso de cámara"
    >
      <div className="mx-4 max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-2xl text-card-foreground">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
          <Camera size={24} className="text-accent" />
        </div>
        <h3 className="font-serif text-xl font-bold">Permiso de cámara</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Para ver la propiedad en tu lote con AR necesitamos acceso a tu cámara. Tu cámara{" "}
          <strong className="text-foreground">no se graba ni almacena</strong> — solo proyecta la
          maqueta en tiempo real.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onAccept}
            className="w-full rounded-2xl bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-accent-foreground transition-all hover:bg-accent/90"
          >
            Permitir cámara
          </button>
          <button
            onClick={onDecline}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Solo ver en 3D
          </button>
        </div>
      </div>
    </div>
  );
}

function ARErrorMessage({
  error,
  onRetry,
  onFallback,
}: {
  error: string;
  onRetry: () => void;
  onFallback: () => void;
}) {
  const modalRef = useModalA11y(true, onFallback);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md popup-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Error de realidad aumentada"
    >
      <div className="mx-4 max-w-sm rounded-3xl border border-red-500/20 bg-card p-8 text-center shadow-2xl text-card-foreground">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <h3 className="font-serif text-xl font-bold">No se pudo iniciar AR</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{error}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full rounded-2xl bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-accent-foreground transition-all hover:bg-accent/90"
          >
            Intentar de nuevo
          </button>
          <button
            onClick={onFallback}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Seguir en 3D
          </button>
        </div>
      </div>
    </div>
  );
}

function ModelViewerElement({
  src,
  iosSrc,
  poster,
  selectedFinishId,
  themeMode,
  onLoaded,
  onProgress,
  onError,
  arSupported,
}: {
  src: string;
  iosSrc?: string;
  poster?: string;
  selectedFinishId: string;
  themeMode: ViewerThemeMode;
  onLoaded: () => void;
  onProgress: (p: number) => void;
  onError: (msg: string) => void;
  arSupported: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize model-viewer Custom Element
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const init = async () => {
      try {
        await import("@google/model-viewer");
      } catch (err) {
        console.warn("Could not import @google/model-viewer:", err);
      }

      if (cancelled || !container) return;

      const el = document.createElement("model-viewer");
      el.setAttribute("src", src);
      if (iosSrc) el.setAttribute("ios-src", iosSrc);
      if (poster) el.setAttribute("poster", poster);
      el.setAttribute("alt", "Modelo 3D interactivo de la propiedad");
      el.setAttribute("camera-controls", "");
      el.setAttribute("environment-image", "neutral");
      el.setAttribute("tone-mapping", "neutral");
      el.setAttribute("shadow-intensity", themeMode === "day" ? "1.5" : "1.2");
      el.setAttribute("shadow-softness", "0.5");
      el.setAttribute(
        "exposure",
        themeMode === "day" ? "1.15" : themeMode === "night" ? "0.75" : "1.05",
      );
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

      if (arSupported) {
        el.setAttribute("ar", "");
        el.setAttribute("ar-modes", "scene-viewer webxr quick-look");
        el.setAttribute("ar-scale", "fixed");
        el.style.setProperty("--ar-button-width", "0px");
        el.style.setProperty("--ar-button-height", "0px");
        el.style.setProperty("--ar-button-display", "none");
      }

      el.style.width = "100%";
      el.style.height = "100%";
      el.style.borderRadius = "1.5rem";
      el.style.backgroundColor = "transparent";
      el.style.setProperty("--poster-color", "transparent");

      el.addEventListener("load", () => {
        if (!cancelled) {
          setReady(true);
          onLoaded();
        }
      });

      el.addEventListener("progress", (e: Event) => {
        const ev = e as { detail?: { totalProgress?: number } };
        if (ev.detail?.totalProgress !== undefined && !cancelled) {
          onProgress(Math.round(ev.detail.totalProgress * 100));
        }
      });

      el.addEventListener("error", () => {
        if (!cancelled) {
          onError("No se pudo cargar el modelo 3D. Verifica tu conexión e intenta de nuevo.");
        }
      });

      el.addEventListener("ar-status", (e: Event) => {
        const ev = e as { detail?: { status?: string } };
        if (!cancelled && ev.detail?.status === "failed") {
          onError(
            "La sesión de AR no se pudo iniciar. Asegúrate de tener una superficie plana cerca y que tu cámara esté habilitada.",
          );
        }
      });

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
  }, [src, iosSrc, poster, themeMode, arSupported, onLoaded, onProgress, onError]);

  // Synchronize material finish color
  useEffect(() => {
    if (!ready || !viewerRef.current) return;
    const finish = FINISHES.find((f) => f.id === selectedFinishId) || FINISHES[0];

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
  }, [ready, selectedFinishId]);

  const handleResetCamera = () => {
    const el = viewerRef.current as unknown as {
      cameraTarget?: string;
      cameraOrbit?: string;
    };
    if (el) {
      el.cameraOrbit = "25deg 70deg 40%";
      el.cameraTarget = "auto auto auto";
    }
  };

  const bgStyles: Record<ViewerThemeMode, string> = {
    day: "border-stone-800 bg-stone-950",
    night: "border-indigo-950 bg-slate-950",
    studio: "border-stone-800 bg-stone-900",
  };

  return (
    <div
      className={`relative aspect-[4/3] sm:aspect-[16/11] min-h-[460px] md:min-h-[540px] w-full overflow-hidden rounded-3xl border shadow-2xl transition-all duration-700 ${bgStyles[themeMode]}`}
    >
      {/* Ambient background glow inside the 3D card */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={`size-[450px] rounded-full blur-[110px] transition-all duration-700 ${
            themeMode === "day"
              ? "bg-amber-500/10 opacity-70"
              : themeMode === "night"
                ? "bg-indigo-500/10 opacity-70"
                : "bg-accent/5 opacity-40"
          }`}
        />
      </div>

      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-stone-950/90 backdrop-blur-md text-white">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
            <div className="relative flex size-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
              <Loader2 size={28} className="animate-spin text-accent" />
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Cargando modelo 3D...
          </span>
        </div>
      )}

      <div ref={containerRef} className="relative z-[1] h-full w-full" />

      {ready && (
        <button
          onClick={handleResetCamera}
          className="absolute right-6 top-6 z-20 flex size-9 items-center justify-center rounded-full border border-stone-700/80 bg-stone-900/90 text-stone-200 backdrop-blur-md transition-all hover:border-accent hover:text-accent shadow-lg"
          title="Restablecer vista 3D"
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  );
}

function ARViewerPage() {
  const { propertyId } = Route.useParams();
  const search = Route.useSearch();
  const device = useDeviceDetection();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPostCTA, setShowPostCTA] = useState(false);
  const [showPermissionExplainer, setShowPermissionExplainer] = useState(false);
  const [showARError, setShowARError] = useState(false);
  const [arErrorMessage, setArErrorMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [themeMode, setThemeMode] = useState<ViewerThemeMode>("day");

  // Read URL search param ?finish=nordic
  const [selectedFinish, setSelectedFinish] = useState(search.finish || "nordic");

  const property = properties.find((p) => p.slug === propertyId);
  const arModel = getARModel(propertyId);

  const isIOS = device.isIOS;
  const hasUSDZ = hasUSDZFile(propertyId);
  const canDoAR = device.supportsAR && (isIOS ? hasUSDZ : true);

  // Sync title
  useEffect(() => {
    document.title = property ? `AR: ${property.name} | AUTEM` : "Experiencia AR | AUTEM";
  }, [property]);

  useEffect(() => {
    const hasSeen = localStorage.getItem("autem_ar_onboarding_v2");
    if (!hasSeen) {
      const timer = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem("autem_ar_onboarding_v2", "1");
  }, []);

  const handleLoaded = useCallback(() => {
    setModelLoaded(true);
    setLoadingProgress(100);
  }, []);

  const handleProgress = useCallback((p: number) => {
    setLoadingProgress(p);
  }, []);

  const handleModelError = useCallback((_msg: string) => {
    setModelError(true);
  }, []);

  const handleARError = useCallback((msg: string) => {
    setArErrorMessage(msg);
    setShowARError(true);
  }, []);

  const activateAR = useCallback(() => {
    if (!canDoAR) {
      if (isIOS && !hasUSDZ) {
        handleARError(
          "Tu iPhone requiere un archivo USDZ para AR. Este modelo está disponible en 3D en pantalla.",
        );
      } else {
        handleARError(
          "Tu navegador no soporta realidad aumentada. Prueba con Chrome en Android o Safari en iPhone.",
        );
      }
      return;
    }

    setShowPermissionExplainer(true);
  }, [canDoAR, isIOS, hasUSDZ, handleARError]);

  const confirmAR = useCallback(() => {
    setShowPermissionExplainer(false);
    const viewer = document.querySelector("model-viewer") as HTMLElement & {
      activateAR?: () => Promise<void>;
    };
    if (viewer?.activateAR) {
      viewer.activateAR().catch(() => {
        handleARError(
          "No se pudo activar la cámara. Verifica los permisos de cámara en tu dispositivo.",
        );
      });
    }
  }, [handleARError]);

  const declineAR = useCallback(() => {
    setShowPermissionExplainer(false);
  }, []);

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-5xl font-bold text-accent">404</h1>
          <p className="mt-4 text-muted-foreground">Propiedad no encontrada.</p>
          <Link
            to="/catalogo"
            className="mt-6 inline-block border-b border-accent pb-1 text-sm font-medium text-accent"
          >
            Ver catálogo completo
          </Link>
        </div>
      </div>
    );
  }

  if (!arModel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-border bg-muted">
            <Smartphone size={24} className="text-muted-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-bold">Modelo AR no disponible</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            El modelo 3D de <span className="font-medium text-foreground">{property.name}</span> aún
            no está listo. Próximamente podrás verlo en tu espacio.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/properties/$id"
              params={{ id: property.slug }}
              className="inline-block rounded-2xl bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-accent-foreground transition-all hover:bg-accent/90"
            >
              Ver ficha de propiedad
            </Link>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selected = FINISHES.find((f) => f.id === selectedFinish) || FINISHES[0];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/30">
      {showOnboarding && <OnboardingOverlay onDismiss={dismissOnboarding} />}
      {showPostCTA && (
        <PostARCTA propertyName={property.name} onClose={() => setShowPostCTA(false)} />
      )}
      {showPermissionExplainer && (
        <ARPermissionExplainer onAccept={confirmAR} onDecline={declineAR} />
      )}
      {showARError && (
        <ARErrorMessage
          error={arErrorMessage}
          onRetry={() => {
            setShowARError(false);
            activateAR();
          }}
          onFallback={() => setShowARError(false)}
        />
      )}

      {/* Header bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/properties/$id"
              params={{ id: property.slug }}
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-accent hover:text-accent shadow-sm"
              title="Volver a la ficha de propiedad"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="font-serif text-base font-bold text-foreground md:text-lg">
                {property.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPin size={12} className="text-accent" />
                <span>{property.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Day / Night / Studio Switcher (Controls 3D Canvas environment) */}
            <AREnvironmentToggle currentTheme={themeMode} onThemeChange={setThemeMode} />

            {canDoAR && (
              <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#25D366]">
                <span className="size-1.5 rounded-full bg-[#25D366] animate-pulse" />
                AR Activo
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {modelError ? (
          <div className="flex aspect-[4/3] items-center justify-center rounded-3xl border border-border bg-muted/50 p-8">
            <div className="text-center">
              <AlertTriangle size={36} className="mx-auto mb-3 text-amber-500" />
              <p className="text-sm font-medium text-foreground">No se pudo cargar el modelo 3D</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-accent-foreground hover:bg-accent/90"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <ModelViewerElement
              src={arModel.glb}
              iosSrc={hasUSDZ ? arModel.usdz : undefined}
              selectedFinishId={selectedFinish}
              themeMode={themeMode}
              onLoaded={handleLoaded}
              onProgress={handleProgress}
              onError={handleModelError}
              arSupported={canDoAR}
            />

            {loadingProgress < 100 && (
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 backdrop-blur-xl shadow-2xl text-card-foreground">
                  <Loader2 size={16} className="animate-spin text-accent" />
                  <div className="flex-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-300"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-accent">{loadingProgress}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Material Finishes Customizer */}
        <div className="rounded-3xl border border-border bg-card p-6 backdrop-blur-md shadow-sm space-y-4 text-card-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              <Eye size={14} /> Personalizar Acabado
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {selected.label}{" "}
              <span className="text-muted-foreground/70">· {selected.material}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FINISHES.map((swatch) => {
              const isSelected = selectedFinish === swatch.id;
              return (
                <button
                  key={swatch.id}
                  onClick={() => setSelectedFinish(swatch.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-accent bg-accent/10 ring-1 ring-accent/40 scale-[1.02]"
                      : "border-border bg-muted/40 hover:border-accent/40"
                  }`}
                >
                  <span
                    className="size-8 shrink-0 rounded-full border border-black/10 dark:border-white/20 shadow-md"
                    style={{ backgroundColor: swatch.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-foreground truncate">
                      {swatch.label}
                    </span>
                    <span className="block text-[10px] text-muted-foreground truncate">
                      {swatch.material}
                    </span>
                  </div>
                  {isSelected && <Check size={14} className="text-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Property Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Maximize2, label: "Superficie", value: `${property.m2} m²` },
            { icon: BedDouble, label: "Habitaciones", value: `${property.bedrooms} hab.` },
            { icon: Bath, label: "Baños", value: `${property.bathrooms} baños` },
            { icon: Building2, label: "Precio", value: property.price },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-card p-4 backdrop-blur-sm shadow-sm text-card-foreground"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                <item.icon size={13} />
                <span>{item.label}</span>
              </div>
              <p className="mt-2 font-serif text-lg font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 pt-2">
          {canDoAR ? (
            <button
              onClick={activateAR}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-accent px-8 py-4 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.98]"
            >
              <Smartphone size={18} />
              Ver en tu espacio con Realidad Aumentada
            </button>
          ) : (
            <div className="rounded-2xl border border-border bg-card px-6 py-4 text-center text-card-foreground shadow-sm">
              <p className="text-sm font-medium text-foreground">
                Abre esta página en tu celular para experimentar la realidad aumentada en tu espacio
                real.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Compatible con iPhone (iOS 12+) y Android con ARCore
              </p>
            </div>
          )}

          <a
            href={`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(
              `Hola AUTEM, me interesa "${property.name}" (Acabado: ${selected.label}) que vi en la experiencia AR. ¿Podría agendar una visita?`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-8 py-4 text-xs font-bold uppercase tracking-widest text-foreground transition-all hover:border-accent hover:text-accent shadow-sm"
          >
            <MessageCircle size={16} className="text-[#25D366]" />
            Agendar visita con un asesor
          </a>
        </div>

        {/* Footer Link */}
        <div className="border-t border-border pt-6 text-center">
          <Link
            to="/properties/$id"
            params={{ id: property.slug }}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowLeft size={14} />
            Volver a la ficha de {property.name}
          </Link>
        </div>
      </main>
    </div>
  );
}
