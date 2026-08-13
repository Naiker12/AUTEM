import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HelpCircle, Smartphone, Monitor, Sparkles, Eye, Cpu } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { getARModel, AR_READY_PROPERTIES } from "@/data/ar-models";
import { HelpTooltip } from "./ar-tutorial";
import { ThreePropertyViewer } from "./ThreePropertyViewer";
import { ARQrModal } from "./ar-qr-modal";
import { ArchitecturalAtmosphere } from "./ArchitecturalAtmosphere";
import type { ARExperienceProps, LightingMode } from "./ar-types";

export default function ARExperience({
  initialPropertySlug = "the-horizon-suite",
  showSelector = false,
  className = "",
}: ARExperienceProps) {
  const [selectedSlug, setSelectedSlug] = useState(initialPropertySlug);
  const [selectedFinish, setSelectedFinish] = useState<number | null>(null);
  const [lightingMode, setLightingMode] = useState<LightingMode>("studio");
  const [showHelp, setShowHelp] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const { isMobile } = useDeviceDetection();

  const currentProperty =
    AR_READY_PROPERTIES.find((p) => p.slug === selectedSlug) || AR_READY_PROPERTIES[0];

  if (!currentProperty) return null;

  const arModel = getARModel(currentProperty.slug);

  if (!arModel) return null;

  return (
    <section
      id="tecnologia"
      className={`relative scroll-mt-28 overflow-hidden py-24 md:py-32 ${className}`}
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-accent/5 blur-[120px]" />
      </div>
      <div className="pointer-events-none absolute -right-24 top-20 hidden h-[540px] w-[540px] opacity-70 lg:block">
        <ArchitecturalAtmosphere />
      </div>

      <div className="relative mx-auto max-w-[90rem] px-6 md:px-10 lg:px-16">
        {/* Section Header */}
        <div className="mb-12 grid gap-6 border-b border-border/70 pb-10 md:mb-16 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)] md:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-accent">
              <Cpu size={14} /> Tecnología inmersiva
            </span>
            <h2 className="mt-4 font-serif text-4xl leading-[0.95] text-foreground md:text-6xl lg:text-7xl">
              Arquitectura que puedes <span className="italic text-accent">explorar</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Examina la maqueta 3D, cambia la atmósfera de la escena y abre la experiencia en tu
            teléfono para verla en tu propio espacio.
          </p>
        </div>

        {/* Property Selector Bar (only shown if explicitly enabled) */}
        {showSelector && (
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-background p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
              <Sparkles size={16} />
              <span>Seleccionar Proyecto AR</span>
            </div>

            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:border-accent focus:border-accent focus:outline-none"
            >
              {AR_READY_PROPERTIES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} — {p.location}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Main Experience Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10 xl:gap-14">
          {/* Left Column: 3D Viewer / Interactive Model */}
          <div className="lg:col-span-1">
            <ThreePropertyViewer
              modelSrc={arModel.glb}
              selectedFinish={selectedFinish}
              onFinishChange={setSelectedFinish}
              lightingMode={lightingMode}
              onLightingChange={setLightingMode}
            />
          </div>

          {/* Right Column: Info & Action Controls — full-height card */}
          <div className="flex flex-col lg:col-span-1">
            <div className="flex flex-1 flex-col justify-between rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-8 md:p-10 lg:p-12 shadow-xl">
              {/* Property Info */}
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                  <Eye size={12} />
                  Vista previa interactiva
                </div>

                <h3 className="font-serif text-3xl md:text-4xl lg:text-3xl xl:text-4xl text-foreground leading-tight">
                  {currentProperty.name}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  Gira, acerca y explora la maqueta con sus materiales originales. Prueba una paleta
                  de acabados como referencia visual y continúa en tu teléfono para verla en tu
                  espacio.
                </p>
              </div>

              {/* Device Actions */}
              <div className="mt-8 space-y-5 border-t border-border pt-8">
                {isMobile ? (
                  <Link
                    to="/ar/$propertyId"
                    params={{ propertyId: currentProperty.slug }}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-accent px-6 py-4.5 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.98]"
                  >
                    <Smartphone size={18} /> Abrir experiencia AR
                  </Link>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-accent px-6 py-4.5 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.98]"
                    >
                      <Smartphone size={18} /> Escanear Código QR para móvil
                    </button>
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5 text-[11px] text-muted-foreground">
                      <Monitor size={14} className="shrink-0" />
                      <span>Estás en escritorio — escanea el código con tu celular</span>
                    </div>
                  </div>
                )}

                {/* Help Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-accent"
                  >
                    <HelpCircle size={15} /> ¿Cómo funciona la realidad aumentada?
                  </button>

                  {showHelp && <HelpTooltip onClose={() => setShowHelp(false)} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal for Desktop */}
      <ARQrModal
        propertySlug={currentProperty.slug}
        propertyName={currentProperty.name}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </section>
  );
}
