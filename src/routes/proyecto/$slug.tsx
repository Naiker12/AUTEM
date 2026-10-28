import PanelResizeHandle, {
  PANEL_DRAG_SENSITIVITY,
} from "@/components/project-view/PanelResizeHandle";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Orbit, PanelLeftOpen, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublishedLots, usePublishedProject } from "@/lib/public-projects";
import { filterAndSortLots, formatLotPrice, formatLotArea } from "@/data/lots";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import { useTheme } from "@/hooks/use-theme";
import "@/components/project-view/project-editorial.css";
import {
  MasterplanSvgViewer,
  LotSelectionPanel,
  DEFAULT_PROJECT_VIEW_SETTINGS,
  ProjectViewControlPanelContent,
  ProjectHeader,
  ProjectLoadingScreen,
  TerrainRouteView,
  type ProjectViewSettings,
  type ViewMode,
} from "@/components/project-view";

const InteractivePanorama = lazy(() => import("@/components/project-view/InteractivePanorama"));

export const Route = createFileRoute("/proyecto/$slug")({
  head: () => {
    return {
      meta: [
        {
          title: "Proyecto | AUTEM",
        },
        {
          property: "og:title",
          content: "Proyecto | AUTEM",
        },
      ],
    };
  },
  component: ProjectView,
});

function ProjectView() {
  const { slug } = Route.useParams();
  const { project: property, loading: isProjectLoading } = usePublishedProject(slug);
  const { lots: projectLots, loading: areLotsLoading } = usePublishedLots(
    property?.id,
    property?.slug ?? slug,
  );
  const [mode, setMode] = useState<ViewMode>("lot");
  const [introReady, setIntroReady] = useState(false);
  const finishIntro = useCallback(() => setIntroReady(true), []);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1024,
  );
  const [isLotPanelVisible, setIsLotPanelVisible] = useState(true);
  const [viewSettings, setViewSettings] = useState<ProjectViewSettings>(
    DEFAULT_PROJECT_VIEW_SETTINGS,
  );
  const [selectedLotId, setSelectedLotId] = useState("");
  const [lotFocusRequest, setLotFocusRequest] = useState(0);
  const selectedLot = useMemo(
    () => (selectedLotId ? (projectLots.find((lot) => lot.id === selectedLotId) ?? null) : null),
    [projectLots, selectedLotId],
  );
  const hasLots = projectLots.length > 0;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1024,
  );
  const { isDark, toggleTheme: handleToggleTheme } = useTheme();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setIsPanelOpen(!isMobile && mode === "lot");
  }, [isMobile, mode]);

  const galleryImages = useMemo(
    () =>
      property?.images && property.images.length > 0
        ? property.images
        : property?.image
          ? [property.image]
          : [],
    [property],
  );
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
  const gallerySwipeStartXRef = useRef<number | null>(null);

  useEffect(() => {
    setGalleryIndex(0);
  }, [slug]);

  // Precargar todas las imágenes de la galería en segundo plano para transiciones instantáneas sin parpadeo
  useEffect(() => {
    if (galleryImages.length <= 1) return;
    for (const url of galleryImages) {
      if (!url) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    }
  }, [galleryImages]);

  // Navegación por teclado (← / → / Inicio / Fin) en modo "Conoce el proyecto" (gallery)
  useEffect(() => {
    if (mode !== "gallery" || galleryImages.length <= 1) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setGalleryIndex((prev) => (prev + 1) % galleryImages.length);
      } else if (event.key === "Home") {
        event.preventDefault();
        setGalleryIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setGalleryIndex(galleryImages.length - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, galleryImages.length]);

  // Mantener visible la miniatura activa al recorrer con el teclado
  useEffect(() => {
    if (mode !== "gallery" || !thumbnailsContainerRef.current) return;
    const activeThumb = thumbnailsContainerRef.current.querySelector<HTMLElement>(
      `[data-thumb-index="${galleryIndex}"]`,
    );
    activeThumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [galleryIndex, mode]);

  // Estados de filtrado sincronizados para el mapa interactivo y el catálogo
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterMinArea, setFilterMinArea] = useState("all");
  const [filterMaxPrice, setFilterMaxPrice] = useState("all");
  const [filterSort, setFilterSort] = useState("lot-asc");
  const [filterRequest, setFilterRequest] = useState(0);

  const handleStatusChange = useCallback((newStatus: string) => {
    setFilterStatus(newStatus);
    setFilterRequest((prev) => prev + 1);
  }, []);

  const handleMinAreaChange = useCallback((newArea: string) => {
    setFilterMinArea(newArea);
    setFilterRequest((prev) => prev + 1);
  }, []);

  const handleMaxPriceChange = useCallback((newPrice: string) => {
    setFilterMaxPrice(newPrice);
    setFilterRequest((prev) => prev + 1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterMinArea("all");
    setFilterMaxPrice("all");
    setFilterSort("lot-asc");
    setFilterStatus("Todos");
    setFilterRequest((prev) => prev + 1);
  }, []);

  const isFilterActive =
    filterStatus !== "Todos" || filterMinArea !== "all" || filterMaxPrice !== "all";

  const filteredLots = useMemo(
    () =>
      filterAndSortLots(projectLots, {
        status: filterStatus,
        minArea: filterMinArea,
        maxPrice: filterMaxPrice,
        sort: filterSort,
      }),
    [projectLots, filterStatus, filterMinArea, filterMaxPrice, filterSort],
  );

  useEffect(() => {
    const storedSettings = localStorage.getItem("autem-project-view-settings-v2");
    if (!storedSettings) return;
    try {
      setViewSettings({ ...DEFAULT_PROJECT_VIEW_SETTINGS, ...JSON.parse(storedSettings) });
    } catch {
      localStorage.removeItem("autem-project-view-settings-v2");
    }
  }, []);

  const [sheetPercent, setSheetPercent] = useState(48);
  const [controlPanelPercent, setControlPanelPercent] = useState(48);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartPercentRef = useRef(48);
  const currentDragPercentRef = useRef(48);
  const containerHeightRef = useRef(0);
  const sheetRafPendingRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const sheetWrapperRef = useRef<HTMLDivElement>(null);

  const handleSheetDragStart = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }
    containerHeightRef.current = splitContainerRef.current?.clientHeight || window.innerHeight;
    dragStartYRef.current = e.clientY;
    dragStartPercentRef.current = sheetPercent;
    currentDragPercentRef.current = sheetPercent;
    setIsDraggingSheet(true);
  };

  const handleSheetDragMove = (e: React.PointerEvent) => {
    if (!isDraggingSheet) return;
    const totalHeight = containerHeightRef.current;
    if (totalHeight <= 0) return;

    // Arrastrar hacia arriba (clientY disminuye) aumenta la altura del catálogo
    const deltaY = dragStartYRef.current - e.clientY;
    const deltaPercent = (deltaY / totalHeight) * 100 * PANEL_DRAG_SENSITIVITY;
    const nextPercent = Math.min(84, Math.max(34, dragStartPercentRef.current + deltaPercent));
    currentDragPercentRef.current = nextPercent;

    // Rendimiento extremo 60-120fps alineado con RAF sin layout thrashing
    if (!sheetRafPendingRef.current) {
      sheetRafPendingRef.current = true;
      requestAnimationFrame(() => {
        sheetRafPendingRef.current = false;
        if (mapWrapperRef.current) {
          mapWrapperRef.current.style.height = `${100 - currentDragPercentRef.current}%`;
        }
        if (sheetWrapperRef.current) {
          sheetWrapperRef.current.style.height = `calc(${currentDragPercentRef.current}% - 32px)`;
        }
      });
    }
  };

  const handleSheetDragEnd = (e: React.PointerEvent) => {
    if (!isDraggingSheet) return;
    setIsDraggingSheet(false);
    sheetRafPendingRef.current = false;
    // Sincronizar una sola vez con React al soltar
    setSheetPercent(currentDragPercentRef.current);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar
    }
  };

  const handleToggleSheetSize = useCallback(() => {
    setSheetPercent((prev) => (prev > 62 ? 42 : 76));
  }, []);

  const selectLot = useCallback(
    (lot: (typeof projectLots)[number]) => {
      setSelectedLotId(lot.id);
      setLotFocusRequest((request) => request + 1);
      if (!isMobile && mode === "lot") {
        setIsPanelOpen(true);
      }
    },
    [isMobile, mode],
  );

  const handleModeChange = useCallback(
    (nextMode: ViewMode) => {
      setMode(nextMode);
      setIsPanelOpen((prev) => (nextMode === "lot" ? prev || !isMobile : false));
    },
    [isMobile],
  );
  const handleView3D = useCallback(() => handleModeChange("perspective"), [handleModeChange]);
  const handleHideDesktopPanel = useCallback(() => setIsLotPanelVisible(false), []);

  const updateViewSettings = (changes: Partial<ProjectViewSettings>) => {
    setViewSettings((currentSettings) => {
      const nextSettings = { ...currentSettings, ...changes };
      localStorage.setItem("autem-project-view-settings-v2", JSON.stringify(nextSettings));
      return nextSettings;
    });
  };

  const resetViewSettings = () => {
    setViewSettings(DEFAULT_PROJECT_VIEW_SETTINGS);
    localStorage.setItem(
      "autem-project-view-settings-v2",
      JSON.stringify(DEFAULT_PROJECT_VIEW_SETTINGS),
    );
    setIsLotPanelVisible(true);
  };

  if (!property && isProjectLoading) {
    return <div className="min-h-screen bg-background" aria-label="Cargando proyecto" />;
  }

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

  if (areLotsLoading) {
    return (
      <div className="min-h-screen bg-background" aria-label="Cargando inventario del proyecto" />
    );
  }

  const images = galleryImages.length > 0 ? galleryImages : [property.image];
  const safeGalleryIndex = galleryIndex < images.length ? galleryIndex : 0;
  const contactUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola AUTEM, me interesa el proyecto ${property.name}${selectedLot ? ` y el lote ${selectedLot.id}` : ""}.`)}`;
  const isRightPanelVisible = mode !== "gallery" && isPanelOpen;
  const mobileControlOpen = isMobile && isRightPanelVisible;
  const effectiveSheetPercent = mobileControlOpen ? controlPanelPercent : sheetPercent;
  const controlPanel = (
    <ProjectViewControlPanelContent
      property={property}
      lots={projectLots}
      settings={viewSettings}
      onSettingsChange={updateViewSettings}
      onResetSettings={resetViewSettings}
      onClose={() => setIsPanelOpen(false)}
      onSelectMode={(nextMode) => {
        setMode(nextMode);
        setIsPanelOpen(false);
      }}
      isMobile={isMobile}
      selectedLot={mode === "lot" ? selectedLot : null}
      onClearSelectedLot={() => setSelectedLotId("")}
    />
  );

  return (
    <main
      data-theme={isDark ? "dark" : "light"}
      data-ready={introReady}
      className="project-editorial h-[100svh] overflow-hidden bg-background font-sans text-foreground"
    >
      <ProjectLoadingScreen
        key={slug}
        projectName={property.name}
        projectLocation={property.location}
        onFinish={finishIntro}
        variant={property.id === "lotes-360" ? "dark-compact" : "default"}
        minDuration={property.id === "lotes-360" ? 2000 : 650}
      />

      {/* Header fijo e intacto al 100% de ancho de la pantalla, sin encogerse ni moverse */}
      <ProjectHeader
        propertyName={property.name}
        onOpenInfo={() => {
          setIsPanelOpen((prev) => !prev);
        }}
        contactUrl={contactUrl}
        activeMode={mode}
        onModeChange={handleModeChange}
        showViewSwitcher={viewSettings.showViewSwitcher}
        isPanelOpen={isRightPanelVisible}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      <div
        key={mode}
        className="project-view-stage relative h-full w-full"
        style={
          mobileControlOpen && mode !== "lot" && mode !== "terrain"
            ? { height: `${100 - controlPanelPercent}%` }
            : undefined
        }
      >
        {mode === "lot" ? (
          <div
            ref={splitContainerRef}
            className="relative flex h-full flex-col pt-14 sm:pt-16 lg:block lg:pt-0"
          >
            {/* Mitad superior en móvil / Pantalla completa en escritorio */}
            <div
              ref={mapWrapperRef}
              style={{
                height: `${100 - effectiveSheetPercent}%`,
                transition:
                  isDraggingSheet || mobileControlOpen
                    ? "none"
                    : "height 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className="relative w-full min-h-[140px] lg:!h-full lg:absolute lg:inset-0"
            >
              <MasterplanSvgViewer
                settings={viewSettings}
                lots={projectLots}
                filteredLots={filteredLots}
                isFilterActive={isFilterActive}
                filterRequest={filterRequest}
                onClearFilter={handleClearFilters}
                selectedLotId={selectedLot?.id ?? ""}
                focusRequest={lotFocusRequest}
                onSelectLot={(lotId) => {
                  const cleanId = lotId.replace(/^lot-/, "");
                  const lot = projectLots.find(
                    (item) =>
                      item.id === cleanId ||
                      item.id === `L-${cleanId}` ||
                      item.id.replace(/^L-/, "") === cleanId.replace(/^L-/, "") ||
                      String(item.lotNumber) === cleanId.replace(/^L-/, ""),
                  );
                  if (lot) {
                    selectLot(lot);
                    setIsLotPanelVisible(true);
                  }
                }}
                isDesktopSidebarOpen={isLotPanelVisible}
                isRightPanelOpen={!isMobile && isRightPanelVisible}
                isDark={isDark}
              />
            </div>

            {/* Barra divisora táctil y dinámica para ajustar tamaño (solo móvil) */}
            {mobileControlOpen && (
              <PanelResizeHandle value={controlPanelPercent} onChange={setControlPanelPercent} />
            )}
            {hasLots && viewSettings.showLotCatalog && !mobileControlOpen && (
              <div
                onPointerDown={handleSheetDragStart}
                onPointerMove={handleSheetDragMove}
                onPointerUp={handleSheetDragEnd}
                onPointerCancel={handleSheetDragEnd}
                className="relative z-30 flex h-8 w-full shrink-0 cursor-row-resize touch-none items-center justify-between px-3 bg-background/95 border-t border-border/80 shadow-md backdrop-blur-xl select-none hover:bg-muted/30 transition-colors lg:hidden"
                title="Desliza para ajustar la división entre mapa y catálogo"
              >
                {/* Botón rápido: Más Mapa (con límite seguro para no cortar el catálogo) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheetPercent(36);
                  }}
                  className={`rounded-full px-2 py-0.5 text-[8px] font-semibold transition-all ${sheetPercent <= 40 ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                >
                  Más mapa
                </button>

                {/* Tirador central táctil con etiqueta destacada de Plano Urbanístico */}
                <div
                  className="flex items-center justify-center py-1 cursor-row-resize px-2 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSheetSize();
                  }}
                >
                  <div className="h-1 w-6 rounded-full bg-muted-foreground/40 hover:w-9 hover:bg-accent transition-all" />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-foreground/80">
                    Plano Urbanístico ↕
                  </span>
                </div>

                {/* Botón rápido: Más Lotes */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheetPercent(76);
                  }}
                  className={`rounded-full px-2 py-0.5 text-[8px] font-semibold transition-all ${sheetPercent >= 65 ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                >
                  Más lotes
                </button>
              </div>
            )}

            {/* Mitad inferior en móvil: Catálogo de lotes dinámico con altura mínima segura */}
            {((hasLots && viewSettings.showLotCatalog) || mobileControlOpen) && (
              <div
                ref={sheetWrapperRef}
                style={{
                  height: `calc(${effectiveSheetPercent}% - ${mobileControlOpen ? 40 : 32}px)`,
                  minHeight: "175px",
                  transition:
                    isDraggingSheet || mobileControlOpen
                      ? "none"
                      : "height 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="relative w-full overflow-hidden lg:hidden"
              >
                {mobileControlOpen && controlPanel}
                <div className={mobileControlOpen ? "hidden" : "h-full"}>
                  <LotSelectionPanel
                    lots={projectLots}
                    filteredLots={filteredLots}
                    status={filterStatus}
                    onStatusChange={handleStatusChange}
                    minArea={filterMinArea}
                    onMinAreaChange={handleMinAreaChange}
                    maxPrice={filterMaxPrice}
                    onMaxPriceChange={handleMaxPriceChange}
                    sort={filterSort}
                    onSortChange={setFilterSort}
                    onClearAdvanced={handleClearFilters}
                    selectedId={selectedLot?.id ?? ""}
                    onSelect={selectLot}
                    onView3D={handleView3D}
                    onHide={() => {}}
                    isMobileSplit
                  />
                </div>
              </div>
            )}

            {/* Panel lateral flotante en escritorio */}
            {hasLots && viewSettings.showLotCatalog && isLotPanelVisible && (
              <div className="hidden lg:block">
                <LotSelectionPanel
                  lots={projectLots}
                  filteredLots={filteredLots}
                  status={filterStatus}
                  onStatusChange={handleStatusChange}
                  minArea={filterMinArea}
                  onMinAreaChange={handleMinAreaChange}
                  maxPrice={filterMaxPrice}
                  onMaxPriceChange={handleMaxPriceChange}
                  sort={filterSort}
                  onSortChange={setFilterSort}
                  onClearAdvanced={handleClearFilters}
                  selectedId={selectedLot?.id ?? ""}
                  onSelect={selectLot}
                  onView3D={handleView3D}
                  onHide={handleHideDesktopPanel}
                />
              </div>
            )}
          </div>
        ) : mode === "tour" ? (
          property.tourImage ? (
            <Suspense
              fallback={
                <div className="grid h-full place-items-center bg-black text-sm text-white/70">
                  Cargando recorrido 360°…
                </div>
              }
            >
              <InteractivePanorama sourceUrl={property.tourImage} />
            </Suspense>
          ) : (
            <div className="relative flex h-full w-full items-center justify-center bg-black/75">
              <img
                src={property.image}
                alt={property.name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm"
              />
              <div className="relative z-20 mx-4 max-w-md rounded-[24px] border border-border bg-background/95 p-8 text-center shadow-2xl backdrop-blur-2xl">
                <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <RouteIcon size={30} />
                </span>
                <Badge className="mt-4 border border-accent/40 bg-accent/10 text-[9px] font-semibold uppercase tracking-wider text-accent">
                  Próximamente
                </Badge>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                  Tour 360° en creación
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Estamos preparando la experiencia inmersiva en 360° para este proyecto. Puedes
                  explorar todos los lotes en el Plano Urbanístico.
                </p>
                <Button
                  type="button"
                  onClick={() => handleModeChange("lot")}
                  className="mt-6 w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Ver Plano Urbanístico
                </Button>
              </div>
            </div>
          )
        ) : mode === "perspective" ? (
          <div className="relative flex h-full w-full items-center justify-center bg-black/80">
            <img
              src={property.image}
              alt={`Perspectiva 3D ${property.name}`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-35 filter blur-[2px] transition-all duration-700"
            />
            <div className="relative z-20 mx-4 max-w-lg rounded-[28px] border border-border/80 bg-background/95 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-2xl">
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Orbit size={32} />
              </span>
              <Badge className="mt-4 border border-accent/40 bg-accent/10 text-[9px] font-semibold uppercase tracking-wider text-accent">
                Perspectiva 3D · Próximamente
              </Badge>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Perspectiva 3D en desarrollo
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Estamos preparando la maqueta topográfica y volumétrica interactiva de{" "}
                {property.name}. Próximamente podrás rotar la vista aérea del proyecto, inspeccionar
                cotas y desniveles del terreno y proyectar construcciones.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="rounded-full border border-border/80 bg-muted/40 px-3 py-1">
                  Topografía real
                </span>
                <span className="rounded-full border border-border/80 bg-muted/40 px-3 py-1">
                  Volumetría de lotes
                </span>
                <span className="rounded-full border border-border/80 bg-muted/40 px-3 py-1">
                  Orientación solar
                </span>
              </div>
              <Button
                type="button"
                onClick={() => handleModeChange("lot")}
                className="mt-6 w-full rounded-xl bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
              >
                Ver Plano Urbanístico
              </Button>
            </div>
          </div>
        ) : mode === "terrain" ? (
          <TerrainRouteView
            lots={projectLots}
            selectedLot={selectedLot ?? projectLots[0]}
            onSelectLot={selectLot}
            settings={viewSettings}
            isDark={isDark}
            isRightPanelOpen={false}
            projectId={property.id}
            projectSlug={property.slug}
            masterplanVersion={property.masterplanVersion}
            projectAnchor={{ lat: property.lat, lng: property.lng }}
            alternatePanel={mobileControlOpen ? controlPanel : undefined}
            panelPercent={controlPanelPercent}
            onPanelPercentChange={setControlPanelPercent}
          />
        ) : (
          <div
            className="relative h-full w-full overflow-hidden bg-neutral-950 select-none"
            onPointerDown={(e) => {
              gallerySwipeStartXRef.current = e.clientX;
            }}
            onPointerUp={(e) => {
              if (gallerySwipeStartXRef.current === null || images.length <= 1) return;
              const deltaX = e.clientX - gallerySwipeStartXRef.current;
              gallerySwipeStartXRef.current = null;
              if (Math.abs(deltaX) > 45) {
                setGalleryIndex((prev) =>
                  deltaX < 0
                    ? (prev + 1) % images.length
                    : (prev - 1 + images.length) % images.length,
                );
              }
            }}
          >
            {images.map((imageUrl, index) => {
              const isActive = index === safeGalleryIndex;
              return (
                <img
                  key={`${imageUrl}-${index}`}
                  src={imageUrl}
                  alt={`${property.name} - Vista ${index + 1}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={isActive ? "high" : "auto"}
                  decoding={isActive ? "sync" : "async"}
                  draggable={false}
                  className={`absolute inset-0 h-full w-full object-cover object-center contrast-[1.03] saturate-[1.04] transform-gpu transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] ${
                    isActive
                      ? "z-10 scale-100 opacity-100"
                      : "z-0 scale-[1.02] opacity-0 pointer-events-none"
                  }`}
                />
              );
            })}
          </div>
        )}

        {mode === "gallery" && !mobileControlOpen && (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/40 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </>
        )}

        {/* Botón flotante para restaurar Plano Urbanístico en móvil si está oculto */}
        {hasLots && mode === "lot" && (!viewSettings.showLotCatalog || !isLotPanelVisible) && (
          <div className="absolute bottom-4 left-3 z-30 flex items-center gap-2 lg:hidden animate-in fade-in zoom-in-95 duration-200">
            <Button
              type="button"
              onClick={() => {
                updateViewSettings({ showLotCatalog: true });
                setIsLotPanelVisible(true);
                setSheetPercent(48);
              }}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-accent-foreground shadow-xl hover:bg-accent/90 cursor-pointer"
            >
              <PanelLeftOpen className="size-3.5 mr-1.5" /> Mostrar Plano Urbanístico
            </Button>
          </div>
        )}

        {hasLots && mode === "lot" && viewSettings.showLotCatalog && !isLotPanelVisible && (
          <div className="absolute bottom-5 left-5 z-30 hidden items-center gap-2.5 lg:flex">
            <Button
              type="button"
              onClick={() => setIsLotPanelVisible(true)}
              className="rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
            >
              <PanelLeftOpen className="size-4 mr-1.5" /> Mostrar lotes
            </Button>
            {selectedLot && (
              <button
                type="button"
                onClick={() => setIsLotPanelVisible(true)}
                className="group flex items-center gap-2 rounded-full border border-border/80 bg-background/95 px-3.5 py-1.5 shadow-lg backdrop-blur-xl transition-all hover:bg-muted hover:border-accent cursor-pointer"
                title="Clic para ver detalles en el catálogo"
              >
                <span className="font-bold text-foreground text-xs">Lote {selectedLot.id}</span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-xs font-semibold text-accent">
                  {formatLotPrice(selectedLot.price)}
                </span>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">
                  {formatLotArea(selectedLot.area)}
                </span>
                <span className="ml-1 text-[10px] text-muted-foreground/80 group-hover:text-foreground">
                  →
                </span>
              </button>
            )}
          </div>
        )}
        {mode === "gallery" && images.length > 1 && !mobileControlOpen && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                setGalleryIndex((index) => (index - 1 + images.length) % images.length)
              }
              className="absolute left-5 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 text-white hover:bg-accent hover:text-accent-foreground"
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

        {mode === "gallery" && !mobileControlOpen && (
          <section className="absolute inset-x-0 bottom-0 z-20 px-5 pb-24 lg:px-10 lg:pb-6">
            <div className="mx-auto flex max-w-6xl flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
                {images.length > 1 && (
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
                    <span>
                      {safeGalleryIndex + 1} / {images.length}
                    </span>
                    <span className="hidden sm:inline text-white/60">· Usa ← → para recorrer</span>
                  </div>
                )}
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
                  {property.name}
                </h1>
                <p className="mt-2 text-sm text-white/85">
                  {property.location} · {property.m2} m² · {property.price}
                </p>
              </div>
              <div
                ref={thumbnailsContainerRef}
                className="flex max-w-full gap-2.5 overflow-x-auto pb-1 scrollbar-none"
              >
                {images.map((image, index) => {
                  const isCurrent = safeGalleryIndex === index;
                  return (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      data-thumb-index={index}
                      onClick={() => setGalleryIndex(index)}
                      aria-label={`Ver imagen ${index + 1} de ${images.length}`}
                      aria-current={isCurrent ? "true" : undefined}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                        isCurrent
                          ? "scale-105 border-white shadow-[0_4px_16px_rgba(0,0,0,0.5)] opacity-100"
                          : "border-white/20 opacity-65 hover:opacity-95"
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        loading="eager"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Panel lateral flotante en PC (estrictamente por debajo del header y oculto en Conoce el proyecto) */}
      <aside
        className={`fixed top-14 sm:top-16 lg:top-[72px] bottom-0 right-0 z-30 hidden w-[340px] flex-col p-3 transition-transform duration-300 ease-out lg:flex ${
          isRightPanelVisible ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-border dark:border-white/10 bg-background/94 text-foreground shadow-[20px_20px_70px_rgba(0,0,0,.32)] dark:shadow-[20px_20px_70px_rgba(0,0,0,.5)] backdrop-blur-2xl">
          <ProjectViewControlPanelContent
            property={property}
            lots={projectLots}
            settings={viewSettings}
            onSettingsChange={updateViewSettings}
            onResetSettings={resetViewSettings}
            onClose={() => setIsPanelOpen(false)}
            onSelectMode={(nextMode) => {
              setMode(nextMode);
              setIsPanelOpen(false);
            }}
            isMobile={false}
            selectedLot={mode === "lot" ? selectedLot : null}
            onClearSelectedLot={() => setSelectedLotId("")}
          />
        </div>
      </aside>

      {mobileControlOpen && mode !== "lot" && mode !== "terrain" && (
        <section
          aria-label="Configuración de la vista"
          className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-3xl border-t bg-card lg:hidden"
          style={{ height: `${controlPanelPercent}%` }}
        >
          <PanelResizeHandle value={controlPanelPercent} onChange={setControlPanelPercent} />
          <div className="min-h-0 flex-1">{controlPanel}</div>
        </section>
      )}
    </main>
  );
}
