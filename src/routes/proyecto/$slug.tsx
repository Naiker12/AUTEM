import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info, PanelLeftOpen, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { getPropertyBySlug } from "@/data/properties";
import { getLotsByProject } from "@/data/lots";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import {
  AerialLotMap,
  Lot3DViewer,
  LotSelectionPanel,
  MapControls,
  ModeSwitcher,
  DEFAULT_PROJECT_VIEW_SETTINGS,
  PROJECT_VIEW_MODES,
  ProjectViewControlPanel,
  ProjectHeader,
  SelectedLotPanel,
  type ProjectViewSettings,
  type ViewMode,
} from "@/components/project-view";

export const Route = createFileRoute("/proyecto/$slug")({ component: ProjectView });

function ProjectView() {
  const { slug } = Route.useParams();
  const property = getPropertyBySlug(slug);
  const projectLots = useMemo(() => getLotsByProject(slug), [slug]);
  const [mode, setMode] = useState<ViewMode>("overview");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLotPanelVisible, setIsLotPanelVisible] = useState(true);
  const [isLotDetailVisible, setIsLotDetailVisible] = useState(true);
  const [isMobileLotPanelOpen, setIsMobileLotPanelOpen] = useState(false);
  const [viewSettings, setViewSettings] = useState<ProjectViewSettings>(
    DEFAULT_PROJECT_VIEW_SETTINGS,
  );
  const [selectedLotId, setSelectedLotId] = useState(
    projectLots[1]?.id ?? projectLots[0]?.id ?? "",
  );
  const selectedLot = projectLots.find((lot) => lot.id === selectedLotId) ?? projectLots[0];
  const hasLots = projectLots.length > 0;

  useEffect(() => {
    const storedSettings = localStorage.getItem("autem-project-view-settings");
    if (!storedSettings) return;
    try {
      setViewSettings({ ...DEFAULT_PROJECT_VIEW_SETTINGS, ...JSON.parse(storedSettings) });
    } catch {
      localStorage.removeItem("autem-project-view-settings");
    }
  }, []);

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">AUTEM</p>
          <h1 className="mt-4 text-4xl">Proyecto no encontrado</h1>
          <Button asChild variant="outline" className="mt-8">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  const masterplanImage =
    property.slug === "lotes-360" || property.slug === "residencia-azure"
      ? `${import.meta.env.BASE_URL}projects/lotes-360/masterplan-interactive-aerial.png`
      : property.floorPlanImage || property.image;

  const images = property.images && property.images.length > 0 ? property.images : [property.image];
  const activeGalleryImage = images[galleryIndex] || property.image;
  const lotViewImage = property.lotViewImage || property.floorPlanImage || property.image;
  const contactUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola AUTEM, me interesa el proyecto ${property.name}${selectedLot ? ` y el lote ${selectedLot.id}` : ""}.`)}`;
  const modeLabel = PROJECT_VIEW_MODES.find((item) => item.id === mode)?.label;

  const selectLot = (lot: (typeof projectLots)[number]) => {
    setSelectedLotId(lot.id);
    setIsLotDetailVisible(true);
    setIsMobileLotPanelOpen(false);
  };

  const updateViewSettings = (changes: Partial<ProjectViewSettings>) => {
    setViewSettings((currentSettings) => {
      const nextSettings = { ...currentSettings, ...changes };
      localStorage.setItem("autem-project-view-settings", JSON.stringify(nextSettings));
      return nextSettings;
    });
  };

  const resetViewSettings = () => {
    setViewSettings(DEFAULT_PROJECT_VIEW_SETTINGS);
    localStorage.setItem(
      "autem-project-view-settings",
      JSON.stringify(DEFAULT_PROJECT_VIEW_SETTINGS),
    );
    setIsLotPanelVisible(true);
    setIsLotDetailVisible(true);
  };

  return (
    <main className="h-[100svh] min-h-[680px] overflow-hidden bg-background font-sans text-foreground">
      <div className="relative h-full">
        {mode === "overview" && hasLots && selectedLot ? (
          <AerialLotMap
            image={masterplanImage}
            lots={projectLots}
            selectedLot={selectedLot}
            onSelect={selectLot}
            zoom={zoom}
            showLotBoundaries={viewSettings.showLotBoundaries}
            showLotLabels={viewSettings.showLotLabels}
            mapShade={viewSettings.mapShade}
            selectionOpacity={viewSettings.selectionOpacity}
          />
        ) : mode === "tour" && hasLots && selectedLot ? (
          <Lot3DViewer
            lots={projectLots}
            selectedLot={selectedLot}
            showHotspots={viewSettings.showMapControls}
            showNavigationHints={viewSettings.showNavigationHints}
          />
        ) : (
          <img
            src={
              mode === "gallery"
                ? activeGalleryImage
                : mode === "lot"
                  ? lotViewImage
                  : mode === "panorama" || mode === "tour"
                    ? images[1] || images[0] || property.image
                    : property.image
            }
            alt={property.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {mode !== "overview" && mode !== "tour" && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20" />
          </>
        )}

        <ProjectHeader
          currentSlug={slug}
          onOpenInfo={() => setIsPanelOpen(true)}
          contactUrl={contactUrl}
        />

        <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
          <ProjectViewControlPanel
            property={property}
            settings={viewSettings}
            onSettingsChange={updateViewSettings}
            onResetSettings={resetViewSettings}
            onSelectMode={(nextMode) => {
              setMode(nextMode);
              setIsPanelOpen(false);
            }}
          />
        </Sheet>

        {hasLots && viewSettings.showLotCatalog && (
          <Button
            type="button"
            onClick={() => setIsMobileLotPanelOpen(true)}
            className="absolute left-4 top-[86px] z-30 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 xl:hidden"
          >
            <PanelLeftOpen /> Elegir lote
          </Button>
        )}
        {isMobileLotPanelOpen && (
          <button
            type="button"
            aria-label="Cerrar catálogo de lotes"
            onClick={() => setIsMobileLotPanelOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 xl:hidden"
          />
        )}

        {viewSettings.showViewSwitcher && (
          <ModeSwitcher
            activeMode={mode}
            onChange={setMode}
            shifted={viewSettings.showLotCatalog && isLotPanelVisible && hasLots}
          />
        )}

        {hasLots && viewSettings.showLotCatalog && (isLotPanelVisible || isMobileLotPanelOpen) && (
          <LotSelectionPanel
            lots={projectLots}
            selectedId={selectedLot?.id ?? ""}
            mobileOpen={isMobileLotPanelOpen}
            onSelect={selectLot}
            onHide={() => {
              setIsLotPanelVisible(false);
              setIsMobileLotPanelOpen(false);
            }}
          />
        )}
        {hasLots && viewSettings.showLotCatalog && !isLotPanelVisible && (
          <Button
            type="button"
            onClick={() => setIsLotPanelVisible(true)}
            className="absolute bottom-5 left-5 z-30 hidden rounded-full bg-accent text-accent-foreground hover:bg-accent/90 xl:flex"
          >
            <PanelLeftOpen /> Mostrar lotes
          </Button>
        )}

        {selectedLot && viewSettings.showLotDetails && isLotDetailVisible && isLotPanelVisible && (
          <SelectedLotPanel
            lot={selectedLot}
            onClose={() => setIsLotDetailVisible(false)}
            onView3D={() => setMode("tour")}
          />
        )}
        {mode === "overview" && viewSettings.showMapControls && (
          <MapControls zoom={zoom} onZoomChange={setZoom} />
        )}

        {mode === "gallery" && images.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                setGalleryIndex((index) => (index - 1 + images.length) % images.length)
              }
              className="absolute left-5 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 text-white hover:bg-accent hover:text-accent-foreground xl:left-[390px]"
              aria-label="Imagen anterior"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setGalleryIndex((index) => (index + 1) % images.length)}
              className="absolute right-5 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 text-white hover:bg-accent hover:text-accent-foreground"
              aria-label="Imagen siguiente"
            >
              <ChevronRight />
            </Button>
          </>
        )}

        {mode === "ar" && (
          <div className="absolute left-1/2 top-1/2 z-20 w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-[22px] border border-border bg-background/90 p-7 text-center text-foreground shadow-2xl backdrop-blur-2xl">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
              <ScanLine size={27} />
            </span>
            <h2 className="mt-5 text-2xl font-semibold">Visualización AR</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Abre el proyecto desde un dispositivo compatible para ubicar el modelo sobre una
              superficie real.
            </p>
            <Button className="mt-6 w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
              Preparar experiencia AR
            </Button>
          </div>
        )}

        {mode !== "overview" && mode !== "tour" && mode !== "ar" && (
          <section className="absolute inset-x-0 bottom-0 z-20 px-5 pb-5 xl:pl-[390px]">
            <div className="mx-auto flex max-w-6xl flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <Badge className="border border-accent/40 bg-background/80 text-[9px] uppercase tracking-[0.18em] text-accent backdrop-blur-xl">
                  {modeLabel}
                </Badge>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
                  {property.name}
                </h1>
                <p className="mt-2 text-sm text-white/70">
                  {property.location} · {property.m2} m² · {property.price}
                </p>
              </div>
              {mode === "gallery" ? (
                <div className="flex max-w-full gap-2 overflow-x-auto">
                  {images.slice(0, 6).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setGalleryIndex(index)}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${galleryIndex === index ? "border-accent" : "border-transparent opacity-60"}`}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="max-w-sm rounded-2xl border border-border bg-background/85 p-4 text-xs leading-5 text-muted-foreground backdrop-blur-xl">
                  <strong className="mb-1 block text-accent">Explora el proyecto</strong>Consulta
                  las zonas, accesos y visuales clave antes de elegir tu lote.
                </div>
              )}
            </div>
          </section>
        )}

        {selectedLot && viewSettings.showLotDetails && (
          <div className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-background/88 px-4 py-3 text-foreground shadow-2xl backdrop-blur-xl md:bottom-4 2xl:hidden">
            <div>
              <span className="block text-[8px] uppercase tracking-[0.18em] text-accent">
                Lote seleccionado
              </span>
              <strong className="text-lg">{selectedLot.id}</strong>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setMode("tour")}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Ver en 3D
            </Button>
          </div>
        )}

        {viewSettings.showProjectBrand && (
          <div className="absolute bottom-4 right-4 z-20 hidden items-center gap-3 rounded-2xl border border-border bg-background/88 px-4 py-3 text-foreground shadow-2xl backdrop-blur-xl md:flex">
            <AutemBrandIcon size={28} />
            <div>
              <strong className="block text-sm">Proyecto AUTEM</strong>
              <span className="text-[8px] text-muted-foreground">
                Naturaleza · Bienestar · Futuro
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsPanelOpen(true)}
              className="ml-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Más información"
            >
              <Info />
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
