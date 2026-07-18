import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Loader2, Smartphone, HelpCircle, X, MessageCircle, Camera } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { getARModel, getARModelUrl } from "@/data/ar-models";
import { properties } from "@/data/properties";

const FINISHES = [
  { id: "nordic", label: "Nórdico", color: "#E5E4E2", material: "Marmol blanco" },
  { id: "walnut", label: "Nogal", color: "#4A3728", material: "Madera oscura" },
  { id: "stone", label: "Piedra", color: "#8D918D", material: "Concreto pulido" },
  { id: "gold", label: "Dorado", color: "#8A6A3B", material: "Latón cepillado" },
];

export const Route = createFileRoute("/ar/$propertyId")({
  component: ARViewerPage,
  validateSearch: (search: Record<string, unknown>) => ({
    finish: (search.finish as string) || "nordic",
  }),
});

function FirstTutorial({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 max-w-sm rounded-2xl bg-background p-8 text-center shadow-2xl popup-enter">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-accent/10">
          <div className="relative">
            <Smartphone size={32} className="text-accent" />
            <div className="absolute -right-1 -top-1 size-3 rounded-full bg-accent animate-ping" />
          </div>
        </div>
        <h3 className="font-serif text-xl">Mueve tu celular</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Apunta hacia el suelo para detectar el espacio. El modelo se colocará automáticamente
          cuando encuentre el piso.
        </p>
        <button
          onClick={onDismiss}
          className="mt-6 w-full bg-primary px-6 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

function PostARCTA({ propertyName, onClose }: { propertyName: string; onClose: () => void }) {
  const whatsappUrl = `https://wa.me/573007200894?text=${encodeURIComponent(
    `Hola AUTEM, me interesa "${propertyName}" que vi en realidad aumentada. Me gustaría agendar una visita.`,
  )}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
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
            className="flex items-center justify-center gap-2 bg-[#25D366] px-6 py-3 text-xs font-medium uppercase tracking-widest text-white transition-opacity hover:opacity-90"
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

function HelpTooltip({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute bottom-full left-1/2 z-30 mb-3 w-64 -translate-x-1/2 rounded-xl border border-border bg-background p-5 shadow-xl">
      <button
        onClick={onClose}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
      >
        <X size={14} />
      </button>
      <p className="text-xs font-bold uppercase tracking-widest text-accent">¿Cómo funciona?</p>
      <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
        <li className="flex gap-2">
          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>Toca el botón AR para iniciar</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>Apunta al suelo — el modelo se coloca solo</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>Arrastra para mover, dos dedos para rotar</span>
        </li>
      </ul>
    </div>
  );
}

function ModelViewerElement({
  src,
  iosSrc,
  poster,
  onLoaded,
  onProgress,
}: {
  src: string;
  iosSrc?: string;
  poster?: string;
  onLoaded: () => void;
  onProgress: (p: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await import("@google/model-viewer");

      if (cancelled || !containerRef.current) return;

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
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.borderRadius = "1rem";

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

      containerRef.current.appendChild(el);
      viewerRef.current = el;
    };

    init();

    return () => {
      cancelled = true;
      const container = containerRef.current;
      const viewer = viewerRef.current;
      if (viewer && container) {
        container.removeChild(viewer);
        viewerRef.current = null;
      }
    };
  }, [src, iosSrc, poster, onLoaded, onProgress]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted"
    >
      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPostCTA, setShowPostCTA] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);

  const property = properties.find((p) => p.slug === propertyId);
  const arModel = getARModel(propertyId);
  const arUrl = getARModelUrl(propertyId);

  useEffect(() => {
    document.title = property ? `AR: ${property.name} | AUTEM` : "Experiencia AR | AUTEM";
  }, [property]);

  useEffect(() => {
    const hasSeen = localStorage.getItem("autem_ar_tutorial_seen");
    if (!hasSeen && device.supportsAR) {
      const timer = setTimeout(() => setShowTutorial(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [device.supportsAR]);

  const dismissTutorial = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem("autem_ar_tutorial_seen", "1");
  }, []);

  const handleLoaded = useCallback(() => {
    setModelLoaded(true);
    setLoadingProgress(100);
  }, []);

  const handleProgress = useCallback((p: number) => {
    setLoadingProgress(p);
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

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/30">
      {showTutorial && <FirstTutorial onDismiss={dismissTutorial} />}
      {showPostCTA && (
        <PostARCTA propertyName={property.name} onClose={() => setShowPostCTA(false)} />
      )}

      {/* Header */}
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
            {device.supportsAR && (
              <span className="flex items-center gap-1.5 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-2.5 py-1 text-[10px] font-medium text-[#25D366]">
                <span className="size-1.5 rounded-full bg-[#25D366] animate-pulse" />
                AR disponible
              </span>
            )}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Cómo funciona"
            >
              <HelpCircle size={14} />
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="border-t border-border px-4 py-4">
            <HelpTooltip onClose={() => setShowHelp(false)} />
          </div>
        )}
      </header>

      {/* Model viewer */}
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-6">
        <div className="relative">
          <ModelViewerElement
            src={arModel.glb}
            iosSrc={arModel.usdz}
            onLoaded={handleLoaded}
            onProgress={handleProgress}
          />

          {/* Loading progress bar */}
          {modelLoaded && (
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className="h-1 overflow-hidden rounded-full bg-black/20 backdrop-blur-sm">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Finish swatches */}
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Personaliza acabados
          </p>
          <div className="flex gap-3">
            {FINISHES.map((swatch) => (
              <button
                key={swatch.id}
                aria-label={`Acabado ${swatch.label}`}
                className="size-10 rounded-full border-2 border-border bg-[#E5E4E2] transition-all hover:scale-110 hover:border-accent"
                style={{ backgroundColor: swatch.color }}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">{FINISHES[0].material}</p>
        </div>

        {/* Property info */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Superficie", value: `${property.m2} m²` },
            { label: "Habitaciones", value: `${property.bedrooms}` },
            { label: "Baños", value: `${property.bathrooms}` },
            { label: "Precio", value: property.price },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 font-serif text-lg">{item.value}</p>
            </div>
          ))}
        </div>

        {/* AR action area */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          {device.supportsAR ? (
            <button
              onClick={() => {
                const viewer = document.querySelector("model-viewer") as HTMLElement & {
                  activateAR?: () => Promise<void>;
                };
                if (viewer?.activateAR) {
                  viewer.activateAR();
                }
              }}
              className="flex flex-1 items-center justify-center gap-3 bg-primary px-8 py-4 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <Smartphone size={18} />
              Ver en tu espacio
            </button>
          ) : (
            <div className="flex-1 rounded-xl border border-border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Abre esta página desde tu celular para experimentar la realidad aumentada.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/60">
                Compatible con iPhone (iOS 12+) y Android con ARCore
              </p>
            </div>
          )}

          <a
            href={`https://wa.me/573007200894?text=${encodeURIComponent(
              `Hola AUTEM, me interesa "${property.name}" que vi en la experiencia AR.`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-border px-8 py-4 text-xs font-medium uppercase tracking-widest transition-all hover:border-accent hover:text-accent"
          >
            <MessageCircle size={16} />
            Agendar visita
          </a>
        </div>

        {/* Compatibility note */}
        <p className="mt-6 text-center text-[10px] text-muted-foreground/60">
          No necesitas descargar ninguna app. La experiencia AR funciona directo en tu navegador.
        </p>
      </main>
    </div>
  );
}
