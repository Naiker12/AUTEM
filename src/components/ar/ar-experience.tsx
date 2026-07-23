import { useState, useCallback } from "react";
import { HelpCircle, Smartphone, Monitor, Sparkles } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { getARModel, AR_READY_PROPERTIES } from "@/data/ar-models";
import { FirstTutorial, HelpTooltip } from "./ar-tutorial";
import { Desktop3DViewer } from "./ar-viewer";
import { ARQrModal } from "./ar-qr-modal";
import type { ARExperienceProps } from "./ar-types";

export default function ARExperience({
  initialPropertySlug = "the-horizon-suite",
  showSelector = false,
  className = "",
}: ARExperienceProps) {
  const [selectedSlug, setSelectedSlug] = useState(initialPropertySlug);
  const [selectedFinish, setSelectedFinish] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

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
    <div className={`space-y-8 ${className}`}>
      {/* Property Selector Bar (only shown if explicitly enabled) */}
      {showSelector && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-background p-4 shadow-sm">
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
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column: 3D Viewer / Interactive Model */}
        <div className="lg:col-span-7">
          <Desktop3DViewer
            modelSrc={arModel.glb}
            selectedFinish={selectedFinish}
            onFinishChange={setSelectedFinish}
          />
        </div>

        {/* Right Column: Info & Action Controls */}
        <div className="flex flex-col justify-between space-y-6 lg:col-span-5">
          <div>
            <span className="inline-block rounded-full bg-accent/15 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent border border-accent/30">
              Realidad Aumentada 3D
            </span>
            <h3 className="mt-3 font-serif text-3xl md:text-4xl text-foreground">
              {currentProperty.name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Visualiza esta propiedad a escala real (1:1) directamente en tu espacio. Cambia acabados, rota la maqueta y recorre cada rincón antes de la construcción.
            </p>
          </div>

          {/* Device Actions */}
          <div className="space-y-4 pt-4 border-t border-border">
            {isMobile ? (
              <button
                onClick={handleLaunchAR}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-accent px-6 py-4 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-lg transition-all hover:bg-accent/90"
              >
                <Smartphone size={18} /> Iniciar Realidad Aumentada
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-accent px-6 py-4 text-xs font-bold uppercase tracking-widest text-accent-foreground shadow-lg transition-all hover:bg-accent/90"
                >
                  <Smartphone size={18} /> Escanear Código QR para móvil
                </button>
                <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                  <Monitor size={14} />
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

      {/* Tutorial Popup */}
      {showTutorial && <FirstTutorial onDismiss={() => setShowTutorial(false)} />}

      {/* QR Code Modal for Desktop */}
      <ARQrModal
        propertySlug={currentProperty.slug}
        propertyName={currentProperty.name}
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </div>
  );
}
