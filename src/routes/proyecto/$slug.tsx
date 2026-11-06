import PanelResizeHandle, {
  PANEL_DRAG_SENSITIVITY,
} from "@/components/project-view/shell/PanelResizeHandle";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPinned,
  Orbit,
  PanelLeftOpen,
  Route as RouteIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  usePublishedLots,
  usePublishedProject,
  useProjectGeoreference,
} from "@/lib/public-projects";
import { filterAndSortLots, formatLotPrice, formatLotArea, type Lot } from "@/features/lots";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import { useTheme } from "@/hooks/use-theme";
import "@/components/project-view/project-editorial.css";
import {
  MasterplanSvgViewer,
  ProjectLocationMap,
  LotSelectionPanel,
  DEFAULT_PROJECT_VIEW_SETTINGS,
  ProjectViewControlPanelContent,
  ProjectHeader,
  ProjectLoadingScreen,
  ReserveLotDialog,
  TerrainRouteView,
  type ProjectViewSettings,
  type ViewMode,
} from "@/components/project-view";

const InteractivePanorama = lazy(
  () => import("@/components/project-view/panorama/InteractivePanorama"),
);

type ProjectSearch = {
  vista?: string;
  mode?: string;
  lote?: string;
  lot?: string;
};

function modeToVistaParam(m: ViewMode): string {
  switch (m) {
    case "perspective":
      return "localizacion";
    case "terrain":
      return "recorrido";
    case "gallery":
      return "galeria";
    case "lot":
    default:
      return "plano";
  }
}

function normalizeMode(val?: string | null): ViewMode | null {
  if (!val) return null;
  const lower = val.toLowerCase().trim();
  if (lower === "localizacion" || lower === "perspective" || lower === "360" || lower === "tour") {
    return "perspective";
  }
  if (lower === "recorrido" || lower === "terreno" || lower === "terrain") {
    return "terrain";
  }
  if (lower === "galeria" || lower === "conoce" || lower === "gallery") {
    return "gallery";
  }
  if (lower === "plano" || lower === "urbanistico" || lower === "lot") {
    return "lot";
  }
  return null;
}

export const Route = createFileRoute("/proyecto/$slug")({
  validateSearch: (search: Record<string, unknown>): ProjectSearch => ({
    vista: typeof search.vista === "string" ? search.vista : undefined,
    mode: typeof search.mode === "string" ? search.mode : undefined,
    lote: typeof search.lote === "string" ? search.lote : undefined,
    lot: typeof search.lot === "string" ? search.lot : undefined,
  }),
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
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { project: property, loading: isProjectLoading } = usePublishedProject(slug);
  const { lots: projectLots, loading: areLotsLoading } = usePublishedLots(
    property?.id,
    property?.slug ?? slug,
  );

  // Modo de visualización: URL search param explícito > "perspective" (360°) por defecto
  const [mode, setMode] = useState<ViewMode>(() => {
    const fromSearch = normalizeMode(search.vista || search.mode);
    if (fromSearch) return fromSearch;
    return "perspective";
  });

  // Mantener mode sincronizado si cambia el search param exterior (ej. historial del navegador)
  useEffect(() => {
    const parsed = normalizeMode(search.vista || search.mode);
    if (parsed && parsed !== mode) {
      setMode(parsed);
    }
  }, [search.vista, search.mode, mode]);

  const [mapLayer, setMapLayer] = useState<"vector" | "satellite">("vector");
  const { georeference } = useProjectGeoreference(property?.slug ?? slug);

  // Mostrar siempre la intro animada al abrir un nuevo enlace limpio para generar el efecto WAOOO
  const [introReady, setIntroReady] = useState(() => {
    return Boolean(search.vista || search.mode);
  });

  const finishIntro = useCallback(() => {
    setIntroReady(true);
  }, []);

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1024,
  );
  const [isLotPanelVisible, setIsLotPanelVisible] = useState(true);
  const [viewSettings, setViewSettings] = useState<ProjectViewSettings>(
    DEFAULT_PROJECT_VIEW_SETTINGS,
  );

  // Lote seleccionado: únicamente si viene en la URL (?lote= / ?lot=) para enlaces limpios
  const [selectedLotId, setSelectedLotId] = useState<string>(() => {
    return (search.lote || search.lot || "").trim();
  });

  // Precarga del panorama 360 durante la intro para que al terminar esté listo de inmediato
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    const preloadUrl = isMobile
      ? "/panoramas/villa-paraiso/pano-4096.v1.webp"
      : "/panoramas/villa-paraiso/pano-8192.v1.webp";
    const img = new Image();
    img.src = preloadUrl;
  }, []);

  const [lotFocusRequest, setLotFocusRequest] = useState(0);
  const selectedLot = useMemo(
    () =>
      selectedLotId
        ? (projectLots.find(
            (lot) =>
              lot.id === selectedLotId ||
              lot.id === `L-${selectedLotId}` ||
              lot.id.replace(/^L-/, "") === selectedLotId.replace(/^L-/, ""),
          ) ?? null)
        : null,
    [projectLots, selectedLotId],
  );

  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [reserveLotTarget, setReserveLotTarget] = useState<Lot | null>(null);

  const handleOpenReserve = useCallback((lot: Lot) => {
    setReserveLotTarget(lot);
    setReserveDialogOpen(true);
  }, []);

  // Auto-focalizar lote al recargar si venía en la URL o sesión
  useEffect(() => {
    if (selectedLotId && projectLots.length > 0) {
      setLotFocusRequest((prev) => (prev === 0 ? 1 : prev));
    }
  }, [selectedLotId, projectLots.length]);
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
    if (mode !== "lot") {
      setIsPanelOpen(false);
    }
  }, [mode]);

  const galleryImages = useMemo(() => {
    const list =
      property?.images && property.images.length > 0
        ? property.images
        : property?.image
          ? [property.image]
          : [];
    return list.filter((url): url is string => Boolean(url && url.trim()));
  }, [property]);
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
  const gallerySwipeStartXRef = useRef<number | null>(null);

  useEffect(() => {
    setGalleryIndex(0);
  }, [slug]);

  // Precargar imágenes de la galería de forma diferida para no saturar el CPU/red del móvil al abrir el plano
  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const timer = window.setTimeout(
      () => {
        for (const url of galleryImages) {
          if (!url) continue;
          const img = new Image();
          img.decoding = "async";
          img.src = url;
        }
      },
      mode === "gallery" ? 0 : 2500,
    );
    return () => window.clearTimeout(timer);
  }, [galleryImages, mode]);

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

  const [sheetPercent, setSheetPercent] = useState(50);
  const [controlPanelPercent, setControlPanelPercent] = useState(50);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartPercentRef = useRef(50);
  const currentDragPercentRef = useRef(50);
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
    const nextPercent = Math.min(84, Math.max(32, dragStartPercentRef.current + deltaPercent));
    currentDragPercentRef.current = nextPercent;

    // Rendimiento extremo 60-120fps alineado con RAF sin layout thrashing
    if (!sheetRafPendingRef.current) {
      sheetRafPendingRef.current = true;
      requestAnimationFrame(() => {
        sheetRafPendingRef.current = false;
        if (mapWrapperRef.current) {
          mapWrapperRef.current.style.height = `${100 - currentDragPercentRef.current}%`;
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
      const cleanId = lot.id.replace(/^L-/, "");
      setSelectedLotId(lot.id);
      setLotFocusRequest((request) => request + 1);
      if (!isMobile && mode === "lot") {
        setIsPanelOpen(true);
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`autem_selected_lot_${slug}`, lot.id);
      }
      void navigate({
        search: (prev: ProjectSearch) => ({
          ...prev,
          lote: cleanId,
          lot: undefined,
        }),
        replace: true,
      });
    },
    [isMobile, mode, navigate, slug],
  );

  const handleClearSelectedLot = useCallback(() => {
    setSelectedLotId("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`autem_selected_lot_${slug}`);
    }
    void navigate({
      search: (prev: ProjectSearch) => ({
        ...prev,
        lote: undefined,
        lot: undefined,
      }),
      replace: true,
    });
  }, [navigate, slug]);

  const handleModeChange = useCallback(
    (nextMode: ViewMode) => {
      setMode(nextMode);
      setIsPanelOpen(false);
      const vistaParam = modeToVistaParam(nextMode);
      void navigate({
        search: (prev: ProjectSearch) => ({
          ...prev,
          // 360° ("perspective") es la vista principal por defecto. El plano urbanístico lleva ?vista=plano explícito.
          vista: nextMode === "perspective" ? undefined : vistaParam,
          mode: undefined,
        }),
        replace: true,
      });
    },
    [navigate],
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

  const images = galleryImages;
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
      onSelectMode={handleModeChange}
      isMobile={isMobile}
      selectedLot={mode === "lot" ? selectedLot : null}
      onClearSelectedLot={handleClearSelectedLot}
    />
  );

  return (
    <main
      data-theme={isDark ? "dark" : "light"}
      data-ready={introReady}
      className="project-editorial fixed inset-0 h-[100dvh] w-full overflow-hidden bg-background font-sans text-foreground"
    >
      <ProjectLoadingScreen
        key={slug}
        projectName={property.name}
        projectLocation={property.location}
        logoUrl={property.logoUrl}
        onFinish={finishIntro}
        variant="dark-compact"
        minDuration={1800}
      />

      {/* Header fijo e intacto al 100% de ancho de la pantalla, sin encogerse ni moverse */}
      <ProjectHeader
        propertyName={property.name}
        logoUrl={property.logoUrl}
        showProjectBrand={viewSettings.showProjectBrand}
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
              className="relative w-full min-h-[130px] shrink-0 lg:!h-full lg:absolute lg:inset-0"
            >
              {/* Selector de capa: Plano Vectorial vs Mapa Satelital */}
              <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-30 select-none">
                <div className="flex items-center gap-0.5 sm:gap-1 rounded-full border border-border/80 bg-background/90 p-0.5 sm:p-1 shadow-lg backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapLayer("vector");
                    }}
                    className={`rounded-full px-2.5 py-1 sm:px-3 text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      mapLayer === "vector"
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Plano Vectorial
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapLayer("satellite");
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 sm:px-3 text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      mapLayer === "satellite"
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Satélite HD</span>
                    {georeference?.status === "validated" && (
                      <span
                        className="inline-block size-1.5 rounded-full bg-emerald-400"
                        title="Georreferenciación validada"
                      />
                    )}
                  </button>
                </div>
              </div>

              {mapLayer === "satellite" ? (
                <ProjectLocationMap
                  lat={property.lat}
                  lng={property.lng}
                  projectName={property.name}
                  locationName={property.location}
                  isDark={isDark}
                  georeferenceStatus={georeference?.status}
                  boundsGeo={georeference?.bounds_geo}
                  projectSlug={property?.slug ?? slug}
                  lots={projectLots}
                  selectedLotId={selectedLot?.id}
                  onSelectLot={selectLot}
                  hideSurroundingsDrawer={true}
                  hideGeoreferenceBadge={true}
                />
              ) : (
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
              )}
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
                onClick={handleToggleSheetSize}
                className="relative z-30 flex h-5 w-full shrink-0 cursor-row-resize touch-none items-center justify-center bg-background/95 border-t border-border/80 shadow-xs backdrop-blur-xl select-none hover:bg-muted/30 transition-colors lg:hidden"
                title="Desliza para ajustar la vista del catálogo de lotes"
              >
                <span className="h-1 w-9 rounded-full bg-muted-foreground/35 hover:w-12 hover:bg-accent transition-all" />
              </div>
            )}

            {/* Mitad inferior en móvil: Catálogo de lotes dinámico que llena hasta el borde inferior real */}
            {((hasLots && viewSettings.showLotCatalog) || mobileControlOpen) && (
              <div
                ref={sheetWrapperRef}
                className="relative min-h-0 w-full flex-1 overflow-hidden lg:hidden"
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
                    onInspectLot={(lot) => {
                      selectLot(lot);
                      setIsPanelOpen(true);
                    }}
                    onReserveLot={handleOpenReserve}
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
                  onReserveLot={handleOpenReserve}
                  onHide={handleHideDesktopPanel}
                />
              </div>
            )}
          </div>
        ) : mode === "perspective" || mode === "tour" ? (
          <div className="h-full w-full pt-14 sm:pt-16 lg:pt-[72px]">
            <Suspense
              fallback={
                <div className="grid h-full place-items-center bg-[#121811] text-sm text-white/70">
                  Cargando localización 360°…
                </div>
              }
            >
              <InteractivePanorama
                sourceUrl={
                  property.tourUrl ||
                  (property.slug === "villa-paraiso"
                    ? "/panoramas/villa-paraiso/pano-8192.v1.webp"
                    : property.tourImage || "/images/villa-paraiso-360.jpg")
                }
                projectName={property.name}
                projectSlug={property.slug}
                lots={projectLots}
                selectedLotId={selectedLot?.id}
                onSelectLot={(lotId) => {
                  const clean = lotId.trim().replace(/^L-?/i, "");
                  const found = projectLots.find(
                    (l) =>
                      l.id === lotId ||
                      l.id === `L-${clean}` ||
                      l.id.replace(/^L-?/i, "") === clean ||
                      String(l.lotNumber) === clean ||
                      String((l as { numero?: number }).numero) === clean,
                  );
                  if (found) selectLot(found);
                }}
                onInspectLot={(lot) => {
                  if (lot) selectLot(lot);
                  setIsPanelOpen(true);
                }}
                onSwitchToPlan={() => handleModeChange("lot")}
              />
            </Suspense>
          </div>
        ) : mode === "terrain" ? (
          <TerrainRouteView
            lots={projectLots}
            selectedLot={selectedLot ?? projectLots[0]}
            onSelectLot={selectLot}
            onInspectLotDetails={(lot) => {
              selectLot(lot);
              handleModeChange("lot");
              setIsPanelOpen(true);
            }}
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
            {images.length === 0 ? (
              <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white/70">
                <p className="font-serif text-3xl text-white">Galería en preparación</p>
                <p className="mt-2 text-sm max-w-md text-white/60">
                  Las fotografías y perspectivas de {property.name} se cargarán desde la base de
                  datos.
                </p>
              </div>
            ) : (
              images.map((imageUrl, index) => {
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
              })
            )}
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
              className="absolute left-2.5 sm:left-5 top-1/2 z-20 size-9 sm:size-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 text-white hover:bg-accent hover:text-accent-foreground"
              aria-label="Imagen anterior"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setGalleryIndex((index) => (index + 1) % images.length)}
              className="absolute right-2.5 sm:right-5 top-1/2 z-20 size-9 sm:size-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 text-white hover:bg-accent hover:text-accent-foreground"
              aria-label="Imagen siguiente"
            >
              <ChevronRight />
            </Button>
          </>
        )}

        {mode === "gallery" && !mobileControlOpen && (
          <section className="absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pb-6">
            <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3.5 sm:gap-5 lg:flex-row lg:items-end">
              <div className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
                {images.length > 1 && (
                  <div className="mb-1.5 sm:mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-[11px] font-medium text-white/90 backdrop-blur-md">
                    <span>
                      {safeGalleryIndex + 1} / {images.length}
                    </span>
                    <span className="hidden sm:inline text-white/60">· Usa ← → para recorrer</span>
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
                  {property.name}
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/85">
                  {property.location} ·{" "}
                  {property.metadata?.metrics?.totalAreaHa
                    ? `${property.metadata.metrics.totalAreaHa} hectáreas`
                    : property.m2 < 100
                      ? `${property.m2} hectáreas`
                      : `${property.m2.toLocaleString("es-CO")} m²`}{" "}
                  · {property.price}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-xs sm:text-sm text-amber-300 font-serif italic max-w-xl">
                    {safeGalleryIndex === 0
                      ? "Despierta cada día rodeado de naturaleza. Tres grandes lagos, senderos y paisajes extraordinarios."
                      : safeGalleryIndex === images.length - 1
                        ? "Tu paraíso existe. ¡Ven a conocerlo! Descubre Villa Paraíso Reserva Campestre."
                        : "Donde la naturaleza se vuelve hogar."}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleModeChange("lot")}
                    className="rounded-full bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90 shadow-lg cursor-pointer"
                  >
                    Explorar plano y reservar lote
                  </Button>
                </div>
              </div>
              {images.length > 0 && (
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
              )}
            </div>
          </section>
        )}
      </div>

      {/* Panel lateral flotante en PC (estrictamente por debajo del header y oculto en Conoce el proyecto) */}
      <aside
        className={`fixed top-14 sm:top-16 lg:top-[72px] bottom-0 right-0 z-30 hidden w-[365px] xl:w-[380px] flex-col p-3 transition-transform duration-300 ease-out lg:flex ${
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
            onSelectMode={handleModeChange}
            isMobile={false}
            selectedLot={mode === "lot" ? selectedLot : null}
            onClearSelectedLot={handleClearSelectedLot}
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

      <ReserveLotDialog
        open={reserveDialogOpen}
        onOpenChange={setReserveDialogOpen}
        lot={reserveLotTarget}
        projectName={property.name}
        projectId={property.id}
        source={mode}
      />
    </main>
  );
}
