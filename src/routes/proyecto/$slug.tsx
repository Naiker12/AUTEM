import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Orbit, PanelLeftOpen, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { getPropertyBySlug } from "@/data/properties";
import { getLotsByProject, formatLotPrice, formatLotArea } from "@/data/lots";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import "@/components/project-view/project-editorial.css";
import {
  InteractivePanorama,
  MasterplanSvgViewer,
  LotSelectionPanel,
  ModeSwitcher,
  DEFAULT_PROJECT_VIEW_SETTINGS,
  PROJECT_VIEW_MODES,
  ProjectViewControlPanel,
  ProjectViewControlPanelContent,
  ProjectHeader,
  ProjectLoadingScreen,
  type ProjectViewSettings,
  type ViewMode,
} from "@/components/project-view";

export const Route = createFileRoute("/proyecto/$slug")({
  head: ({ params }) => {
    const prop = getPropertyBySlug(params.slug);
    return {
      meta: [
        {
          title: prop ? `${prop.name} | AUTEM` : "Proyecto | AUTEM",
        },
        {
          property: "og:title",
          content: prop ? `${prop.name} | AUTEM` : "Proyecto | AUTEM",
        },
      ],
    };
  },
  component: ProjectView,
});

function ProjectView() {
  const { slug } = Route.useParams();
  const property = getPropertyBySlug(slug);
  const projectLots = useMemo(() => getLotsByProject(slug), [slug]);
  const [mode, setMode] = useState<ViewMode>("lot");
  const [introReady, setIntroReady] = useState(false);
  const finishIntro = useCallback(() => setIntroReady(true), []);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLotPanelVisible, setIsLotPanelVisible] = useState(true);
  const [viewSettings, setViewSettings] = useState<ProjectViewSettings>(
    DEFAULT_PROJECT_VIEW_SETTINGS,
  );
  const [selectedLotId, setSelectedLotId] = useState(
    projectLots[1]?.id ?? projectLots[0]?.id ?? "",
  );
  const [lotFocusRequest, setLotFocusRequest] = useState(0);
  const selectedLot = projectLots.find((lot) => lot.id === selectedLotId) ?? projectLots[0];
  const hasLots = projectLots.length > 0;
  const [isMobile, setIsMobile] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      const stored = localStorage.getItem("autem-theme");
      if (stored) return stored === "dark";
      return (
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    }
    return false;
  });

  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("autem-theme", next ? "dark" : "light");
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDark);
      localStorage.setItem("autem-theme", isDark ? "dark" : "light");
    }
  }, [isDark]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const filteredLots = useMemo(() => {
    const statusLots =
      filterStatus === "Todos"
        ? projectLots
        : filterStatus === "Reservados"
          ? projectLots.filter((lot) => lot.status === "Reservado")
          : filterStatus === "Vendidos"
            ? projectLots.filter((lot) => lot.status === "Vendido")
            : projectLots.filter(
                (lot) => lot.status === "Disponible" || lot.status === "Últimas unidades",
              );

    return statusLots
      .filter((lot) => filterMinArea === "all" || lot.area >= Number(filterMinArea))
      .filter((lot) => filterMaxPrice === "all" || lot.price <= Number(filterMaxPrice) * 1_000_000)
      .sort((first, second) => {
        if (filterSort === "lot-asc") return (first.lotNumber ?? 0) - (second.lotNumber ?? 0);
        if (filterSort === "lot-desc") return (second.lotNumber ?? 0) - (first.lotNumber ?? 0);
        if (filterSort === "area-desc") return second.area - first.area;
        if (filterSort === "area-asc") return first.area - second.area;
        if (filterSort === "price-asc") return first.price - second.price;
        if (filterSort === "price-desc") return second.price - first.price;
        return (first.lotNumber ?? 0) - (second.lotNumber ?? 0);
      });
  }, [projectLots, filterStatus, filterMinArea, filterMaxPrice, filterSort]);

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
    const deltaPercent = (deltaY / totalHeight) * 100;
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
          sheetWrapperRef.current.style.height = `calc(${currentDragPercentRef.current}% - 30px)`;
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

  const selectLot = useCallback((lot: (typeof projectLots)[number]) => {
    setSelectedLotId(lot.id);
    setLotFocusRequest((request) => request + 1);
  }, []);

  const handleView3D = useCallback(() => setMode("tour"), []);
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

  const images = property.images && property.images.length > 0 ? property.images : [property.image];
  const activeGalleryImage = images[galleryIndex] || property.image;
  const lotViewImage = property.lotViewImage || property.floorPlanImage || property.image;
  const contactUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola AUTEM, me interesa el proyecto ${property.name}${selectedLot ? ` y el lote ${selectedLot.id}` : ""}.`)}`;
  const modeLabel = PROJECT_VIEW_MODES.find((item) => item.id === mode)?.label;

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
      />

      {/* Header fijo e intacto al 100% de ancho de la pantalla, sin encogerse ni moverse */}
      <ProjectHeader
        propertyName={property.name}
        onOpenInfo={() => setIsPanelOpen((prev) => !prev)}
        contactUrl={contactUrl}
        activeMode={mode}
        onModeChange={setMode}
        showViewSwitcher={viewSettings.showViewSwitcher}
        isPanelOpen={isPanelOpen}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      <div key={mode} className="project-view-stage relative h-full w-full">
        {mode === "lot" ? (
          <div
            ref={splitContainerRef}
            className="relative flex h-full flex-col pt-14 sm:pt-16 lg:block lg:pt-0"
          >
            {/* Mitad superior en móvil / Pantalla completa en escritorio */}
            <div
              ref={mapWrapperRef}
              style={{
                height: `${100 - sheetPercent}%`,
                transition: isDraggingSheet ? "none" : "height 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
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
                isRightPanelOpen={isPanelOpen}
                isDark={isDark}
              />
              {viewSettings.showViewSwitcher && (
                <div className="absolute top-2.5 left-2.5 z-20 lg:hidden">
                  <ModeSwitcher activeMode={mode} onChange={setMode} compact />
                </div>
              )}
            </div>

            {/* Barra divisora táctil y dinámica para ajustar tamaño (solo móvil) */}
            {hasLots && viewSettings.showLotCatalog && (
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
            {hasLots && viewSettings.showLotCatalog && (
              <div
                ref={sheetWrapperRef}
                style={{
                  height: `calc(${sheetPercent}% - 32px)`,
                  minHeight: "175px",
                  transition: isDraggingSheet
                    ? "none"
                    : "height 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="relative w-full overflow-hidden lg:hidden"
              >
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
                onClick={() => setMode("lot")}
                className="mt-6 w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Ver Plano Urbanístico
              </Button>
            </div>
          </div>
        ) : mode === "perspective" ? (
          <div className="relative flex h-full w-full items-center justify-center bg-black/80">
            <img
              src={property.image}
              alt="Perspectiva 3D Villa Paraíso"
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
                onClick={() => setMode("lot")}
                className="mt-6 w-full rounded-xl bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
              >
                Ver Plano Urbanístico
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full bg-black/20">
            <img
              key={mode === "gallery" ? activeGalleryImage : property.image}
              src={mode === "gallery" ? activeGalleryImage : property.image}
              alt={property.name}
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
            />
          </div>
        )}

        {mode === "gallery" && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20" />
          </>
        )}

        {viewSettings.showViewSwitcher && mode !== "lot" && (
          <div className="lg:hidden">
            <ModeSwitcher activeMode={mode} onChange={setMode} />
          </div>
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

        {hasLots && viewSettings.showLotCatalog && !isLotPanelVisible && (
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
        {mode === "gallery" && images.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                setGalleryIndex((index) => (index - 1 + images.length) % images.length)
              }
              className="absolute left-5 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 text-white hover:bg-accent hover:text-accent-foreground lg:left-[380px]"
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

        {mode === "gallery" && (
          <section className="absolute inset-x-0 bottom-0 z-20 px-5 pb-24 lg:pb-5 lg:pl-[380px]">
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
      </div>

      {/* Panel lateral flotante en PC (estrictamente por debajo del header, sin moverlo ni achicarlo) */}
      <aside
        className={`fixed top-14 sm:top-16 lg:top-[72px] bottom-0 right-0 z-30 hidden w-[340px] flex-col p-3 transition-transform duration-300 ease-out md:flex ${
          isPanelOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-border dark:border-white/10 bg-background/94 text-foreground shadow-[20px_20px_70px_rgba(0,0,0,.32)] dark:shadow-[20px_20px_70px_rgba(0,0,0,.5)] backdrop-blur-2xl">
          <ProjectViewControlPanelContent
            property={property}
            settings={viewSettings}
            onSettingsChange={updateViewSettings}
            onResetSettings={resetViewSettings}
            onClose={() => setIsPanelOpen(false)}
            onSelectMode={(nextMode) => {
              setMode(nextMode);
              setIsPanelOpen(false);
            }}
            isMobile={false}
          />
        </div>
      </aside>

      {/* Modal Sheet en móvil (solo para celulares pequeños < 768px) */}
      <div className="md:hidden">
        <Sheet open={isPanelOpen && isMobile} onOpenChange={setIsPanelOpen}>
          <ProjectViewControlPanel
            property={property}
            settings={viewSettings}
            onSettingsChange={updateViewSettings}
            onResetSettings={resetViewSettings}
            onClose={() => setIsPanelOpen(false)}
            onSelectMode={(nextMode) => {
              setMode(nextMode);
              setIsPanelOpen(false);
            }}
            isMobile={true}
          />
        </Sheet>
      </div>
    </main>
  );
}
