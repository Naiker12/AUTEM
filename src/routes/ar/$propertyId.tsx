import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";
import {
  ArrowLeft,
  Loader2,
  Smartphone,
  HelpCircle,
  X,
  MessageCircle,
  Camera,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
} from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { getARModel, hasUSDZFile } from "@/data/ar-models";
import { properties } from "@/data/properties";
import { FINISHES, WHATSAPP_BASE_URL } from "@/data/constants";

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
      title: "Vive la experiencia",
      desc: "Visualiza esta propiedad en 3D directo en tu pantalla.",
    },
    {
      icon: <Smartphone size={28} className="text-accent" />,
      title: "Explora en tu espacio",
      desc: 'En tu celular, presiona "Ver en tu espacio" para colocarla en tu hogar con realidad aumentada.',
    },
    {
      icon: <RotateCcw size={28} className="text-accent" />,
      title: "Interactúa",
      desc: "Arrastra para rotar, pellizca para zoom, y toca los acabados para personalizar.",
    },
  ];

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de realidad aumentada"
    >
      <div className="mx-4 w-full max-w-sm">
        <div className="rounded-3xl bg-background p-8 text-center shadow-2xl popup-enter">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-accent/10">
            {steps[step].icon}
          </div>
          <h3 className="font-serif text-xl">{steps[step].title}</h3>
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
                  className="w-full bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
                className="w-full bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                ¡Empezar!
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Contacto post AR"
    >
      <div className="mx-4 max-w-sm rounded-2xl bg-background p-8 text-center shadow-2xl popup-enter">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent/10">
          <Camera size={24} className="text-accent" />
        </div>
        <h3 className="font-serif text-xl">¿Te gustó lo que viste?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Agenda una visita presencial para conocer la propiedad en persona.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Permiso de cámara"
    >
      <div className="mx-4 max-w-sm rounded-2xl bg-background p-8 text-center shadow-2xl popup-enter">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-accent/10">
          <Camera size={24} className="text-accent" />
        </div>
        <h3 className="font-serif text-lg">Permiso de cámara</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Para ver la propiedad en tu espacio necesitamos acceso a tu cámara. Tu cámara{" "}
          <strong className="text-foreground">no se graba ni almacena</strong> — solo se usa en
          tiempo real para colocar el modelo.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onAccept}
            className="w-full bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Error de realidad aumentada"
    >
      <div className="mx-4 max-w-sm rounded-2xl bg-background p-8 text-center shadow-2xl popup-enter">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <h3 className="font-serif text-lg">No se pudo iniciar AR</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{error}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
  onLoaded,
  onProgress,
  onError,
  arSupported,
}: {
  src: string;
  iosSrc?: string;
  poster?: string;
  onLoaded: () => void;
  onProgress: (p: number) => void;
  onError: (msg: string) => void;
  arSupported: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    const init = async () => {
      const mv = await import("@google/model-viewer");

      if (cancelled || !container) return;

      void mv;

      const el = document.createElement("model-viewer");
      el.setAttribute("src", src);
      if (iosSrc) el.setAttribute("ios-src", iosSrc);
      if (poster) el.setAttribute("poster", poster);
      el.setAttribute("alt", "Modelo 3D interactivo de la propiedad");
      el.setAttribute("camera-controls", "");
      el.setAttribute("auto-rotate", "");
      el.setAttribute("shadow-intensity", "1");
      el.setAttribute("shadow-softness", "1");
      el.setAttribute("exposure", "1");
      el.setAttribute("camera-orbit", "45deg 55deg 4m");
      el.setAttribute("min-camera-orbit", "auto auto 1m");
      el.setAttribute("max-camera-orbit", "Infinity Infinity 10m");
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
      el.style.borderRadius = "1rem";
      el.style.backgroundColor = "transparent";

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
      if (viewer && container) {
        container.removeChild(viewer);
        viewerRef.current = null;
      }
    };
  }, [src, iosSrc, poster, onLoaded, onProgress, onError, arSupported]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted"
    >
      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-muted">
          <Loader2 size={24} className="animate-spin text-accent" />
          <span className="text-xs text-muted-foreground">Cargando modelo 3D…</span>
        </div>
      )}
    </div>
  );
}

function ARViewerPage() {
  const { propertyId } = Route.useParams();
  const device = useDeviceDetection();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPostCTA, setShowPostCTA] = useState(false);
  const [showPermissionExplainer, setShowPermissionExplainer] = useState(false);
  const [showARError, setShowARError] = useState(false);
  const [arErrorMessage, setArErrorMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [selectedFinish, setSelectedFinish] = useState("nordic");

  const property = properties.find((p) => p.slug === propertyId);
  const arModel = getARModel(propertyId);

  const isIOS = device.isIOS;
  const hasUSDZ = hasUSDZFile(propertyId);
  const canDoAR = device.supportsAR && (isIOS ? hasUSDZ : true);

  useEffect(() => {
    document.title = property ? `AR: ${property.name} | AUTEM` : "Experiencia AR | AUTEM";
  }, [property]);

  useEffect(() => {
    const hasSeen = localStorage.getItem("autem_ar_onboarding_v2");
    if (!hasSeen) {
      const timer = setTimeout(() => setShowOnboarding(true), 800);
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
          "Tu iPhone requiere un archivo USDZ para AR. Este modelo aún no está disponible en ese formato. Mientras tanto, puedes explorar el modelo 3D en tu pantalla.",
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
          "No se pudo activar la cámara. Verifica los permisos de cámara en la configuración de tu dispositivo.",
        );
      });
    }
  }, [handleARError]);

  const declineAR = useCallback(() => {
    setShowPermissionExplainer(false);
  }, []);

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="mt-4 text-muted-foreground">Propiedad no encontrada.</p>
          <Link
            to="/catalogo"
            className="mt-6 inline-block border-b border-accent pb-1 text-sm font-medium text-accent"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!arModel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
            <Smartphone size={24} className="text-muted-foreground" />
          </div>
          <h1 className="font-serif text-2xl">Modelo AR no disponible</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            El modelo 3D de <span className="font-medium text-foreground">{property.name}</span> aún
            no está disponible. Próximamente podrás verlo en tu espacio.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/properties/$id"
              params={{ id: property.slug }}
              className="inline-block bg-primary px-6 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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

      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/properties/$id"
              params={{ id: property.slug }}
              className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="font-serif text-sm md:text-base">{property.name}</h1>
              <p className="text-[10px] text-muted-foreground">{property.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canDoAR && (
              <span className="flex items-center gap-1.5 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-2.5 py-1 text-[10px] font-medium text-[#25D366]">
                <span className="size-1.5 rounded-full bg-[#25D366] animate-pulse" />
                AR disponible
              </span>
            )}
            {isIOS && !hasUSDZ && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-500">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Solo 3D
              </span>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-6">
        {modelError ? (
          <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-border bg-muted/50">
            <div className="text-center">
              <AlertTriangle size={32} className="mx-auto mb-3 text-amber-500" />
              <p className="text-sm text-muted-foreground">No se pudo cargar el modelo 3D</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs font-medium text-accent hover:underline"
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
              onLoaded={handleLoaded}
              onProgress={handleProgress}
              onError={handleModelError}
              arSupported={canDoAR}
            />

            {loadingProgress < 100 && (
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 px-4 py-3 backdrop-blur-md">
                  <Loader2 size={14} className="animate-spin text-accent" />
                  <div className="flex-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-300"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {loadingProgress}%
                  </span>
                </div>
              </div>
            )}

            {modelLoaded && (
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 backdrop-blur-md">
                <Volume2 size={10} className="text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground">
                  Toca y arrastra para explorar
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Acabados
          </p>
          <div className="flex gap-3">
            {FINISHES.map((swatch) => (
              <button
                key={swatch.id}
                aria-label={`Acabado ${swatch.label}`}
                onClick={() => setSelectedFinish(swatch.id)}
                className={`relative size-10 rounded-full border-2 transition-all hover:scale-110 ${
                  selectedFinish === swatch.id
                    ? "border-accent ring-2 ring-accent/30 scale-110"
                    : "border-border hover:border-accent/50"
                }`}
                style={{ backgroundColor: swatch.color }}
              >
                {selectedFinish === swatch.id && (
                  <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-accent" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[10px] font-medium text-foreground">{selected.label}</span>
            <span className="text-[10px] text-muted-foreground">· {selected.material}</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Superficie", value: `${property.m2} m²` },
            { label: "Habitaciones", value: `${property.bedrooms}` },
            { label: "Baños", value: `${property.bathrooms}` },
            { label: "Precio", value: property.price },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 font-serif text-base">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {canDoAR ? (
            <button
              onClick={activateAR}
              className="flex items-center justify-center gap-3 bg-primary px-8 py-4 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <Smartphone size={18} />
              Ver en tu espacio
            </button>
          ) : (
            <div className="rounded-xl border border-border bg-muted/50 px-6 py-4 text-center">
              {isIOS && !hasUSDZ ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    La experiencia AR para iPhone próximamente.
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    Explora el modelo 3D deslizando en la pantalla.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Abre esta página desde tu celular para experimentar la realidad aumentada.
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    Compatible con iPhone (iOS 12+) y Android con ARCore
                  </p>
                </>
              )}
            </div>
          )}

          <a
            href={`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(
              `Hola AUTEM, me interesa "${property.name}" que vi en la experiencia AR. ¿Podría agendar una visita?`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-border px-8 py-4 text-xs font-medium uppercase tracking-widest transition-all hover:border-accent hover:text-accent"
          >
            <MessageCircle size={16} />
            Agendar visita
          </a>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            No necesitas descargar ninguna app. La experiencia AR funciona directo en tu navegador.
          </p>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <Link
            to="/properties/$id"
            params={{ id: property.slug }}
            className="flex items-center justify-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={12} />
            Volver a la ficha de {property.name}
          </Link>
        </div>
      </main>
    </div>
  );
}
