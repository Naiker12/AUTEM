import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  HelpCircle,
  Smartphone,
  Monitor,
  X,
  Camera,
  MessageCircle,
  Loader2,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useDeviceDetection, type DeviceInfo } from "@/hooks/useDeviceDetection";

const ModelViewer = lazy(() =>
  import("@google/model-viewer").then(() => ({
    default: (props: Record<string, unknown>) => {
      void props;
      return null;
    },
  })),
);

const FINISHES = [
  { id: "nordic", label: "Nórdico", color: "#E5E4E2", material: "Marmol blanco" },
  { id: "walnut", label: "Nogal", color: "#4A3728", material: "Madera oscura" },
  { id: "stone", label: "Piedra", color: "#8D918D", material: "Concreto pulido" },
  { id: "gold", label: "Dorado", color: "#8A6A3B", material: "Latón cepillado" },
];

const PILOT_PROPERTY = "the-horizon-suite";

function getFullARUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${import.meta.env.BASE_URL}ar/${PILOT_PROPERTY}`;
}

function FirstTutorial({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 max-w-sm rounded-2xl bg-background p-8 text-center shadow-2xl">
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
    `Hola AUTEM, me interesa la propiedad "${propertyName}" que vi en realidad aumentada. Me gustaría agendar una visita.`,
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
    <div className="absolute bottom-full left-0 z-30 mb-3 w-72 rounded-xl border border-border bg-background p-5 shadow-xl">
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
          <span>Toca el botón para iniciar la experiencia AR</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>Apunta al suelo — el modelo se colocará solo</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>Arrastra para mover, dos dedos para rotar</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-accent" />
          <span>Toca los swatches para cambiar acabados en tiempo real</span>
        </li>
      </ul>
      <p className="mt-3 text-[10px] text-muted-foreground">
        No necesitas descargar ninguna app — funciona directo en tu navegador.
      </p>
    </div>
  );
}

function Desktop3DViewer({
  modelSrc,
  onFinishChange,
  selectedFinish,
}: {
  modelSrc: string;
  onFinishChange: (i: number) => void;
  selectedFinish: number;
}) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
      {modelSrc ? (
        <Suspense
          fallback={
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 size={24} className="animate-spin text-accent" />
              <span className="text-xs text-muted-foreground">Cargando modelo 3D…</span>
            </div>
          }
        >
          <ModelViewer
            src={modelSrc}
            alt="Modelo 3D de la propiedad"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            shadow-softness="1"
            exposure="1"
            style={{ width: "100%", height: "100%" }}
          />
        </Suspense>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
          <RotateCcw size={32} className="text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">Visor 3D interactivo</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gira, acerca y explora el modelo con tu mouse. Los acabados se actualizarán en tiempo
              real.
            </p>
          </div>
          <div className="flex gap-2">
            {FINISHES.map((f, i) => (
              <button
                key={f.id}
                onClick={() => onFinishChange(i)}
                className={`size-8 rounded-full border-2 transition-all ${
                  selectedFinish === i
                    ? "border-accent scale-110"
                    : "border-white/20 hover:border-accent/60"
                }`}
                style={{ backgroundColor: f.color }}
                aria-label={`Acabado ${f.label}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ARExperience() {
  const device = useDeviceDetection();
  const [selectedFinish, setSelectedFinish] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPostCTA, setShowPostCTA] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem("autem_ar_tutorial_seen");
    if (!hasSeen && device.supportsAR) {
      const timer = setTimeout(() => setShowTutorial(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [device.supportsAR]);

  const dismissTutorial = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem("autem_ar_tutorial_seen", "1");
  }, []);

  const handleSwatchClick = useCallback((index: number) => {
    setSelectedFinish(index);
    const video = document.getElementById("ar-main-video") as HTMLVideoElement | null;
    if (video) {
      video.src = `${import.meta.env.BASE_URL}set-de-4-renders.mp4`;
      video.play();
    }
  }, []);

  const handleARExit = useCallback(() => {
    setShowPostCTA(true);
  }, []);

  return (
    <section
      id="tecnologia"
      data-animate
      className="section-bridge overflow-hidden bg-primary py-24 text-primary-foreground opacity-0 md:py-32"
    >
      {showTutorial && <FirstTutorial onDismiss={dismissTutorial} />}
      {showPostCTA && (
        <PostARCTA propertyName="Villa Atlántico" onClose={() => setShowPostCTA(false)} />
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 md:grid-cols-2 md:gap-20 md:px-8">
        {/* Left: Copy + controls */}
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            Realidad Aumentada
          </span>
          <h2 className="mt-6 font-serif text-4xl leading-tight md:text-6xl lg:text-7xl">
            Coloca el proyecto en tu sala antes de comprarlo.
          </h2>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-white/60 md:text-lg">
            No imagines tu próximo hogar, camina en él. Coloca el modelo en tu espacio real con
            realidad aumentada — sin descargar nada, directo en tu navegador.
          </p>

          {/* Badges */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
              <Smartphone size={12} className="text-accent" />
              {device.supportsAR
                ? "Tu dispositivo es compatible"
                : "iPhone (iOS 12+) · Android con ARCore"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
              Sin app · Directo en el navegador
            </span>
          </div>

          {/* Capabilities */}
          <div className="mt-10 flex gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex size-12 items-center justify-center rounded-full border border-white/20 font-serif italic text-accent">
                3D
              </div>
              <span className="text-[10px] uppercase tracking-widest">Visor 4K</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex size-12 items-center justify-center rounded-full border border-white/20 font-serif italic text-accent">
                AR
              </div>
              <span className="text-[10px] uppercase tracking-widest">WebAR</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex size-12 items-center justify-center rounded-full border border-white/20 font-serif italic text-accent">
                360°
              </div>
              <span className="text-[10px] uppercase tracking-widest">Tour virtual</span>
            </div>
          </div>

          {/* Finish swatches */}
          <div className="mt-12">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Personaliza acabados — {FINISHES[selectedFinish].material}
            </p>
            <div className="flex gap-3">
              {FINISHES.map((swatch, i) => (
                <button
                  key={swatch.id}
                  aria-label={`Acabado ${swatch.label}`}
                  onClick={() => handleSwatchClick(i)}
                  className={`size-10 rounded-full border-2 transition-all hover:scale-110 ${
                    selectedFinish === i
                      ? "border-accent scale-110 shadow-[0_0_12px_rgba(197,160,89,0.4)]"
                      : "border-white/20"
                  }`}
                  style={{ backgroundColor: swatch.color }}
                />
              ))}
            </div>
          </div>

          {/* Device-aware CTA */}
          <div className="relative mt-10">
            <div className="flex items-center gap-3">
              {device.supportsAR ? (
                <button
                  onClick={() => {
                    setModelLoading(true);
                    handleARExit();
                  }}
                  className="flex items-center gap-3 bg-accent px-8 py-4 text-xs font-bold uppercase tracking-widest text-accent-foreground transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/20"
                >
                  <Eye size={18} />
                  Ver en tu espacio
                </button>
              ) : device.isDesktop ? (
                <button
                  onClick={() => setModelLoading(true)}
                  className="flex items-center gap-3 bg-accent px-8 py-4 text-xs font-bold uppercase tracking-widest text-accent-foreground transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/20"
                >
                  <Monitor size={18} />
                  Girar en 3D
                </button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/60">
                    Tu navegador no soporta AR. Prueba con{" "}
                    <span className="font-medium text-white/80">Chrome</span> o{" "}
                    <span className="font-medium text-white/80">Safari</span> actualizado.
                  </p>
                  <button
                    onClick={() => setModelLoading(true)}
                    className="mt-3 flex items-center gap-2 border-b border-accent pb-0.5 text-xs font-medium text-accent"
                  >
                    <Monitor size={14} />
                    Ver modelo 3D en su lugar
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowHelp(!showHelp)}
                className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white/40 transition-colors hover:border-accent hover:text-accent"
                aria-label="Cómo funciona la experiencia AR"
              >
                <HelpCircle size={16} />
              </button>
            </div>

            {showHelp && <HelpTooltip onClose={() => setShowHelp(false)} />}
          </div>
        </div>

        {/* Right: Visual + QR */}
        <div className="relative">
          <div className="absolute -inset-10 rounded-full bg-accent/10 blur-3xl" />

          {device.isDesktop && modelLoading ? (
            <Desktop3DViewer
              modelSrc=""
              onFinishChange={setSelectedFinish}
              selectedFinish={selectedFinish}
            />
          ) : (
            <video
              id="ar-main-video"
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="relative z-10 aspect-square w-full rounded-2xl object-cover outline-1 -outline-offset-1 outline-white/10"
            >
              <source
                src={`${import.meta.env.BASE_URL}video-de-realidad-aumentada.mp4`}
                type="video/mp4"
              />
            </video>
          )}

          {/* QR Code (desktop only) */}
          {device.isDesktop && (
            <div className="absolute -bottom-6 -right-6 z-20 hidden rounded-lg bg-accent p-6 shadow-2xl md:block">
              <p className="max-w-[14ch] text-xs font-bold leading-tight text-accent-foreground">
                Escanea para verlo en tu sala
              </p>
              <div className="mt-3 rounded-md bg-white p-2">
                <QRCodeSVG
                  value={getFullARUrl()}
                  size={96}
                  bgColor="#ffffff"
                  fgColor="#1A1A1A"
                  level="M"
                />
              </div>
              <p className="mt-2 text-[9px] text-accent-foreground/60">
                Abre la cámara de tu celular
              </p>
            </div>
          )}

          {/* AR status indicator */}
          {device.supportsAR && (
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
              <span className="size-2 rounded-full bg-[#25D366] animate-pulse" />
              <span className="text-[10px] font-medium text-white/80">AR disponible</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
