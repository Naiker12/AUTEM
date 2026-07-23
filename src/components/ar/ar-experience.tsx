import { useState, useCallback } from "react";
import {
  HelpCircle,
  Smartphone,
  Monitor,
  Sparkles,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Building2,
  ArrowRight,
  Cuboid,
} from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { getARModel, AR_READY_PROPERTIES } from "@/data/ar-models";
import { formatCOP, type Property } from "@/data/properties";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FirstTutorial, HelpTooltip } from "./ar-tutorial";
import { Desktop3DViewer } from "./ar-viewer";
import { ARQrModal } from "./ar-qr-modal";
import { ARFullscreenModal } from "./ar-fullscreen-modal";
import type { ARExperienceProps } from "./ar-types";

/* ─── Property stat pill row ─── */
function PropertyStats({ property }: { property: Property }) {
  const stats = [
    { icon: BedDouble, value: property.bedrooms, label: "Hab." },
    { icon: Bath, value: property.bathrooms, label: "Baños" },
    { icon: Maximize2, value: `${property.m2}`, label: "m²" },
    {
      icon: Building2,
      value: property.type.charAt(0).toUpperCase() + property.type.slice(1),
      label: "",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((s) => (
        <div
          key={s.value + s.label}
          className="flex flex-col items-center gap-1 rounded-xl border border-stone-800 bg-stone-900/90 py-2.5 transition-colors hover:border-accent/30"
        >
          <s.icon size={16} className="text-accent" />
          <span className="text-xs font-bold text-white">{s.value}</span>
          {s.label && (
            <span className="text-[9px] font-medium uppercase tracking-wider text-stone-400">
              {s.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ARExperience({
  initialPropertySlug = "the-horizon-suite",
  className = "",
}: ARExperienceProps) {
  const [selectedSlug, setSelectedSlug] = useState(initialPropertySlug);
  const [selectedFinish, setSelectedFinish] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const { isMobile } = useDeviceDetection();

  const currentProperty =
    AR_READY_PROPERTIES.find((p) => p.slug === selectedSlug) || AR_READY_PROPERTIES[0];

  const arModel = getARModel(currentProperty.slug);

  const handleLaunchAR = useCallback(() => {
    const hasSeenTutorial = localStorage.getItem("autem-ar-tutorial-seen");
    if (!hasSeenTutorial) {
      setShowTutorial(true);
      localStorage.setItem("autem-ar-tutorial-seen", "true");
    }
  }, []);

  return (
    <section
      id="tecnologia"
      className={`relative overflow-hidden bg-background text-foreground py-20 md:py-28 ${className}`}
    >
      {/* ── Ambient background glow ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/3 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8">
        {/* ── Section Header ── */}
        <div className="mb-12 max-w-xl">
          <h2 className="font-serif text-3xl leading-tight text-foreground md:text-5xl">
            Explora en{" "}
            <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">
              Realidad Aumentada
            </span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-stone-400 md:text-base">
            Selecciona un proyecto, visualiza la maqueta 3D interactiva y escanea el código QR para
            ver la propiedad a escala real en tu espacio.
          </p>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* Left: 3D Viewer */}
          <div className="lg:col-span-7">
            <Desktop3DViewer
              modelSrc={arModel.glb}
              selectedFinish={selectedFinish}
              onFinishChange={setSelectedFinish}
              propertyName={currentProperty.name}
              onOpenFullscreen={() => setShowFullscreen(true)}
            />
          </div>

          {/* Right: Controls Panel */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* ── Project Selector ── */}
            <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-5 backdrop-blur-md shadow-lg">
              <label className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                Seleccionar proyecto
              </label>

              <Select value={selectedSlug} onValueChange={setSelectedSlug}>
                <SelectTrigger className="h-12 w-full rounded-xl border-stone-700 bg-stone-800/80 px-4 text-sm font-medium text-white shadow-inner transition-all hover:border-accent/50 focus:ring-1 focus:ring-accent/30 [&>svg]:text-accent">
                  <SelectValue placeholder="Elige un proyecto" />
                </SelectTrigger>

                <SelectContent className="rounded-xl border-stone-700 bg-stone-900/98 shadow-2xl backdrop-blur-xl max-h-72">
                  {AR_READY_PROPERTIES.map((p) => (
                    <SelectItem
                      key={p.slug}
                      value={p.slug}
                      className="cursor-pointer rounded-lg px-3 py-3 text-sm text-stone-300 transition-colors focus:bg-accent/10 focus:text-white data-[state=checked]:text-accent"
                    >
                      <span className="flex flex-col">
                        <span className="font-medium text-white">{p.name}</span>
                        <span className="text-[10px] text-stone-500">
                          {p.location} · {p.m2} m² · {p.bedrooms} hab.
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Dynamic Project Card ── */}
            <div className="rounded-2xl border border-stone-800 bg-gradient-to-b from-stone-900/90 to-stone-950/90 p-6 backdrop-blur-md shadow-lg">
              {/* Name + location */}
              <h3 className="font-serif text-2xl leading-tight text-white md:text-3xl">
                {currentProperty.name}
              </h3>
              <div className="mt-2 flex items-center gap-1.5">
                <MapPin size={13} className="text-accent" />
                <span className="text-xs text-stone-400">{currentProperty.location}</span>
              </div>

              {/* Description */}
              <p className="mt-4 text-sm leading-relaxed text-stone-400 line-clamp-2">
                {currentProperty.description}
              </p>

              {/* Stat grid */}
              <div className="mt-5">
                <PropertyStats property={currentProperty} />
              </div>

              {/* Price bar */}
              <div className="mt-5 flex items-center justify-between rounded-xl border border-accent/15 bg-accent/5 px-4 py-3">
                <div>
                  <span className="block text-[9px] uppercase tracking-widest text-stone-500">
                    Precio desde
                  </span>
                  <span className="text-lg font-bold text-accent">{currentProperty.price}</span>
                </div>
                <span className="text-[10px] text-stone-500">
                  {formatCOP(currentProperty.priceNumeric)}
                </span>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="space-y-3">
              {isMobile ? (
                <button
                  onClick={handleLaunchAR}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-accent px-6 py-4 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:shadow-accent/30 hover:brightness-110 active:scale-[0.98]"
                >
                  <Smartphone size={18} /> Iniciar Realidad Aumentada
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-accent px-6 py-4 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:shadow-accent/30 hover:brightness-110 active:scale-[0.98]"
                  >
                    <Smartphone size={18} /> Escanear Código QR
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>
                  <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500">
                    <Monitor size={14} />
                    <span>Estás en escritorio — escanea el código con tu celular</span>
                  </div>
                </>
              )}

              {/* Help toggle */}
              <div className="relative pt-1">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-stone-500 transition-colors hover:text-accent"
                >
                  <HelpCircle size={14} /> ¿Cómo funciona la realidad aumentada?
                </button>
                {showHelp && <HelpTooltip onClose={() => setShowHelp(false)} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTutorial && <FirstTutorial onDismiss={() => setShowTutorial(false)} />}
      <ARQrModal
        propertySlug={currentProperty.slug}
        propertyName={currentProperty.name}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />

      {/* Fullscreen 3D Modal */}
      <ARFullscreenModal
        isOpen={showFullscreen}
        onClose={() => setShowFullscreen(false)}
        modelSrc={arModel.glb}
        propertyName={currentProperty.name}
        selectedFinish={selectedFinish}
        onFinishChange={setSelectedFinish}
      />
    </section>
  );
}
