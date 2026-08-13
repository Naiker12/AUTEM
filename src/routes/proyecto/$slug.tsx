import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Compass, Menu, PanelLeftOpen } from "lucide-react";
import { getPropertyBySlug } from "@/data/properties";
import {
  ModeSwitcher,
  Lot3DViewer,
  LotSelectionPanel,
  PROJECT_VIEW_MODES,
  ProjectDetailsDrawer,
  type ViewMode,
} from "@/components/project-view";

export const Route = createFileRoute("/proyecto/$slug")({
  component: ProjectView,
});

function ProjectView() {
  const { slug } = Route.useParams();
  const property = getPropertyBySlug(slug);
  const [mode, setMode] = useState<ViewMode>("overview");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLotPanelVisible, setIsLotPanelVisible] = useState(true);
  const showOverviewMarkers = false;

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-center text-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">AUTEM</p>
          <h1 className="mt-4 font-serif text-4xl">Proyecto no encontrado</h1>
          <Link
            to="/"
            className="mt-8 inline-flex border border-white/30 px-5 py-3 text-xs font-bold uppercase tracking-widest transition hover:border-accent hover:text-accent"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const images = property.lotViewImage
    ? [
        property.lotViewImage,
        `${import.meta.env.BASE_URL}projects/lotes-360/acceso-render.png`,
        `${import.meta.env.BASE_URL}projects/lotes-360/panoramica-render.png`,
      ]
    : property.images || [property.image];
  const activeGalleryImage = images[galleryIndex] || property.image;
  const lotViewImage =
    property.lotViewImage ||
    property.floorPlanImage ||
    `${import.meta.env.BASE_URL}projects/${property.slug}/planta.jpg`;
  const uses3DModel = mode === "overview" || mode === "tour";
  const activeImage =
    mode === "gallery"
      ? activeGalleryImage
      : mode === "lot"
        ? lotViewImage
        : mode === "tour"
          ? images[1] || property.image
          : property.image;
  const previousImage = () =>
    setGalleryIndex((index) => (index - 1 + images.length) % images.length);
  const nextImage = () => setGalleryIndex((index) => (index + 1) % images.length);
  const modeLabel =
    mode === "overview"
      ? "Maqueta del proyecto"
      : PROJECT_VIEW_MODES.find((item) => item.id === mode)?.label;

  return (
    <main className="min-h-screen overflow-hidden bg-stone-950 font-sans text-white">
      <div className="relative min-h-screen">
        {uses3DModel ? (
          <Lot3DViewer />
        ) : (
          <img
            src={activeImage}
            alt={property.name}
            className="absolute inset-0 h-full w-full scale-[1.02] object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/5 to-[#090807]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/30" />

        <header className="relative z-20 flex items-center justify-between gap-4 px-5 py-5 md:px-8 md:py-7">
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-black/25 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-xl backdrop-blur-xl transition hover:border-accent hover:text-accent"
            aria-label="Abrir información y opciones del proyecto"
          >
            <Menu size={17} /> <span className="hidden sm:inline">Explorar lotes</span>
          </button>
          <div className="hidden items-center gap-3 rounded-full border border-white/15 bg-black/25 px-4 py-2 text-xs text-white/85 shadow-xl backdrop-blur-xl sm:flex">
            <Compass size={16} className="text-accent" /> Norte
          </div>
        </header>

        {isPanelOpen && (
          <div
            className="absolute inset-0 z-30 bg-black/55 backdrop-blur-sm"
            onClick={() => setIsPanelOpen(false)}
          >
            <ProjectDetailsDrawer
              property={property}
              onClose={() => setIsPanelOpen(false)}
              onSelectMode={(selectedMode) => {
                setMode(selectedMode);
                setIsPanelOpen(false);
              }}
            />
          </div>
        )}

        <ModeSwitcher
          activeMode={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
          }}
          shifted={isLotPanelVisible}
        />
        {isLotPanelVisible && <LotSelectionPanel onHide={() => setIsLotPanelVisible(false)} />}
        {!isLotPanelVisible && (
          <button
            type="button"
            onClick={() => setIsLotPanelVisible(true)}
            className="absolute bottom-8 left-5 z-20 hidden items-center gap-2 rounded-full bg-accent px-4 py-3 text-[11px] font-bold text-accent-foreground shadow-xl transition hover:scale-[1.02] hover:bg-accent/90 xl:flex"
          >
            <PanelLeftOpen size={16} /> Mostrar lotes
          </button>
        )}
        {mode === "overview" && showOverviewMarkers && (
          <div className="absolute inset-0 z-10 hidden pointer-events-none xl:block">
            <button
              type="button"
              onClick={() => setMode("lot")}
              className="pointer-events-auto absolute left-[48%] top-[32%] rounded-xl border border-white/30 bg-white/95 px-3 py-2 text-left text-[#222] shadow-xl transition hover:-translate-y-0.5 hover:border-accent"
            >
              <strong className="block text-xs">Lote L-12</strong>
              <span className="mt-0.5 block text-[10px] text-[#666]">1.360 m² · Disponible</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("lot")}
              className="pointer-events-auto absolute left-[70%] top-[43%] rounded-xl border border-white/30 bg-white/95 px-3 py-2 text-left text-[#222] shadow-xl transition hover:-translate-y-0.5 hover:border-accent"
            >
              <strong className="block text-xs">Lote L-24</strong>
              <span className="mt-0.5 block text-[10px] text-[#666]">
                1.420 m² · Vista al valle
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("lot")}
              className="pointer-events-auto absolute left-[58%] top-[62%] rounded-xl border border-white/30 bg-white/95 px-3 py-2 text-left text-[#222] shadow-xl transition hover:-translate-y-0.5 hover:border-accent"
            >
              <strong className="block text-xs">Zona social</strong>
              <span className="mt-0.5 block text-[10px] text-[#666]">Piscina · Club · Cancha</span>
            </button>
          </div>
        )}

        {mode === "gallery" && images.length > 1 && (
          <>
            <button
              type="button"
              onClick={previousImage}
              className="absolute left-24 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-xl backdrop-blur-xl transition hover:border-accent hover:bg-accent hover:text-accent-foreground"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-5 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-xl backdrop-blur-xl transition hover:border-accent hover:bg-accent hover:text-accent-foreground md:right-8"
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {mode !== "lot" && mode !== "overview" && (
          <section className="absolute inset-x-0 bottom-0 z-20 px-5 pb-6 md:px-8 md:pb-8">
            <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl drop-shadow-2xl">
                <span className="inline-flex rounded-full border border-accent/55 bg-[#16170f]/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent shadow-lg backdrop-blur-xl">
                  {modeLabel}
                </span>
                <h1 className="mt-3 font-serif text-4xl leading-[0.92] tracking-tight text-white md:text-6xl">
                  {property.name}
                </h1>
                <p className="mt-3 text-sm text-white/75 md:text-base">
                  {property.location} · {property.m2} m² · {property.price}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/85">
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-2 backdrop-blur-md">
                    Desde 1.080 m²
                  </span>
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-2 backdrop-blur-md">
                    Desde $210M COP
                  </span>
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-2 backdrop-blur-md">
                    5 ubicaciones
                  </span>
                </div>
              </div>

              {mode === "gallery" ? (
                <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setGalleryIndex(index)}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 shadow-lg transition ${galleryIndex === index ? "border-accent" : "border-transparent opacity-65 hover:opacity-100"}`}
                      aria-label={`Ver imagen ${index + 1}`}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="max-w-md rounded-2xl border border-white/15 bg-[#11140e]/75 p-5 text-sm leading-relaxed text-white/85 shadow-2xl backdrop-blur-xl">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                    Lotes 360°
                  </span>
                  {mode === "tour"
                    ? "Recorre visualmente los puntos clave del terreno y su entorno."
                    : mode === "panorama"
                      ? "Revisa la distribución, límites y zonas principales del lote."
                      : mode === "gallery"
                        ? "Recorre visualmente los puntos clave del terreno y su entorno."
                        : "Explora la distribución del proyecto. Los hotspots se añadirán cuando estén definidas las coordenadas reales de cada zona."}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
