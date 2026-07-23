import { useState } from "react";
import {
  Download,
  QrCode,
  Smartphone,
  X,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Sparkles,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getFloorPlanUrl } from "@/data/properties";
import { getARModel } from "@/data/ar-models";
import { useModalA11y } from "@/hooks/useModalA11y";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import type { ProjectFloorPlanProps } from "./project-types";

export default function ProjectFloorPlan({ property, className = "" }: ProjectFloorPlanProps) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"render" | "blueprint" | "iso">("render");

  const modalRef = useModalA11y(isQrOpen, () => setIsQrOpen(false));

  const planBase = `${import.meta.env.BASE_URL}projects/${property.slug}`;
  const currentPlanImage =
    activeTab === "blueprint"
      ? `${planBase}/planta-2d.jpg`
      : activeTab === "iso"
        ? `${planBase}/planta-3d.jpg`
        : property.floorPlanImage || `${planBase}/planta.jpg`;

  const downloadUrl = property.floorPlanPdf || currentPlanImage;
  const qrUrl = getFloorPlanUrl(property.slug);
  const arModel = getARModel(property.slug);

  const whatsappCadUrl =
    `${WHATSAPP_BASE_URL}?text=` +
    encodeURIComponent(
      `Hola AUTEM, me interesan los planos técnicos (CAD/BIM) de "${property.name}".`,
    );

  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Action buttons bar */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setIsQrOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-accent/15 border border-accent/40 px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-accent transition-all hover:bg-accent hover:text-accent-foreground hover:shadow-md"
        >
          <QrCode size={18} /> Ver planos (3 Vistas) & Código QR
        </button>

        <a
          href={downloadUrl}
          download={`${property.slug}-plano`}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3.5 text-xs font-medium uppercase tracking-widest text-foreground transition-all hover:border-accent hover:text-accent hover:shadow-sm"
        >
          <Download size={15} /> Descargar plano
        </a>

        {arModel && (
          <a
            href={`${import.meta.env.BASE_URL}ar/${property.slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/60 dark:border-stone-700 dark:bg-stone-900 px-5 py-3.5 text-xs font-medium uppercase tracking-widest text-foreground dark:text-white transition-all hover:border-accent hover:text-accent"
          >
            <Smartphone size={15} /> Experiencia AR 3D
          </a>
        )}

        <a
          href={whatsappCadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3.5 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-all hover:border-accent hover:text-foreground"
        >
          <ExternalLink size={14} /> Planos CAD/BIM
        </a>
      </div>

      {/* Spacious Theme-Adaptive Side-by-Side Presentation Modal */}
      {isQrOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Plano y Código QR de ${property.name}`}
            className="relative flex flex-col lg:flex-row w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-background text-foreground dark:bg-[#141414] dark:text-white dark:border-stone-800 shadow-2xl my-auto animate-fade-up scrollbar-thin transition-colors duration-300"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsQrOpen(false)}
              className="absolute right-5 top-5 z-30 flex size-11 items-center justify-center rounded-full bg-muted/80 text-foreground/70 dark:bg-stone-900/80 dark:text-stone-300 transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Cerrar modal"
            >
              <X size={22} />
            </button>

            {/* Left Side: Architectural Floor Plan & Render View */}
            <div className="relative flex flex-col justify-between lg:w-3/5 p-8 md:p-10 bg-muted/30 border-b lg:border-b-0 lg:border-r border-border dark:bg-[#181818] dark:border-stone-800">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-accent">
                    <Layers size={16} />
                    <span>Plano Arquitectónico</span>
                  </div>

                  {/* 3 Toggle tabs */}
                  <div className="mr-12 flex rounded-lg border border-border dark:border-stone-800 bg-background dark:bg-[#101010] p-1 text-xs uppercase tracking-wider">
                    <button
                      onClick={() => setActiveTab("render")}
                      className={`px-3 py-1.5 rounded-md transition-colors ${
                        activeTab === "render"
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground dark:text-stone-400 dark:hover:text-white"
                      }`}
                    >
                      General
                    </button>
                    <button
                      onClick={() => setActiveTab("blueprint")}
                      className={`px-3 py-1.5 rounded-md transition-colors ${
                        activeTab === "blueprint"
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground dark:text-stone-400 dark:hover:text-white"
                      }`}
                    >
                      Plano 2D CAD
                    </button>
                    <button
                      onClick={() => setActiveTab("iso")}
                      className={`px-3 py-1.5 rounded-md transition-colors ${
                        activeTab === "iso"
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground dark:text-stone-400 dark:hover:text-white"
                      }`}
                    >
                      Corte 3D
                    </button>
                  </div>
                </div>

                <h3 className="mt-4 font-serif text-3xl md:text-4xl font-normal text-foreground dark:text-white">
                  {property.name}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground dark:text-stone-400">
                  {property.location} · {property.floorPlan}
                </p>
              </div>

              {/* Floor Plan Image Container */}
              <div className="relative my-6 aspect-[16/10] w-full min-h-[300px] overflow-hidden rounded-2xl border border-border dark:border-stone-800 bg-stone-900 group shadow-lg">
                <img
                  src={currentPlanImage}
                  alt={`Plano de ${property.name}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-stone-200">
                  <span className="bg-black/75 px-4 py-1.5 rounded-full border border-stone-700/60 backdrop-blur-md">
                    {property.m2} m² totales
                  </span>
                  <span className="bg-black/75 px-4 py-1.5 rounded-full border border-stone-700/60 backdrop-blur-md">
                    {property.bedrooms} Habitaciones · {property.bathrooms} Baños
                  </span>
                </div>
              </div>

              {/* Download button in left pane */}
              <a
                href={downloadUrl}
                download={`${property.slug}-plano`}
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-background dark:border-stone-700 dark:bg-stone-900 py-3.5 text-xs font-medium uppercase tracking-widest text-foreground dark:text-stone-200 transition-colors hover:border-accent hover:text-accent"
              >
                <Download size={16} /> Descargar plano técnico
              </a>
            </div>

            {/* Right Side: QR Code Mobile Scanner */}
            <div className="flex flex-col justify-between lg:w-2/5 p-8 md:p-10 bg-background dark:bg-[#141414]">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-accent border border-accent/30">
                  <QrCode size={13} /> Escanear en móvil
                </span>
                <h4 className="mt-4 font-serif text-2xl md:text-3xl text-foreground dark:text-white">
                  Explorar en smartphone
                </h4>
                <p className="mt-2 text-xs text-muted-foreground dark:text-stone-400 leading-relaxed">
                  Apunta con la cámara de tu teléfono para abrir el plano interactivo y recorrer la
                  propiedad.
                </p>
              </div>

              {/* Clean QR Code Card with Gold Frame */}
              <div className="my-6 flex flex-col items-center justify-center">
                <div className="p-6 rounded-2xl bg-white border-2 border-accent/40 shadow-xl transition-transform hover:scale-102">
                  <QRCodeSVG value={qrUrl} size={220} level="H" includeMargin={false} />
                </div>
                <span className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground dark:text-stone-500">
                  Código autogenerado para AUTEM Real Estate
                </span>
              </div>

              {/* Adaptive Action Buttons */}
              <div className="space-y-3">
                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent py-4 text-xs font-semibold uppercase tracking-widest text-accent-foreground shadow-md transition-all hover:bg-accent/90"
                >
                  <ExternalLink size={16} /> Abrir directamente
                </a>

                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-muted/40 dark:border-stone-800 dark:bg-stone-900 py-3.5 text-xs font-medium uppercase tracking-widest text-foreground dark:text-stone-300 transition-colors hover:border-accent hover:text-accent"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">¡Enlace copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copiar enlace
                    </>
                  )}
                </button>

                {arModel && (
                  <a
                    href={`${import.meta.env.BASE_URL}ar/${property.slug}`}
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-accent/30 bg-accent/10 py-3 text-xs font-semibold uppercase tracking-wider text-accent hover:bg-accent/20"
                  >
                    <Sparkles size={14} /> Ver Realidad Aumentada 3D
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
