import PanelResizeHandle from "../shell/PanelResizeHandle";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Car,
  Compass,
  Crosshair,
  ExternalLink,
  FileText,
  Footprints,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  ShieldCheck,
  Globe,
  Map as MapIcon,
} from "lucide-react";
import { formatLotArea, formatLotPrice, formatManzanaLabel, type Lot } from "@/data/lots";
import cadReference from "@/data/villa-paraiso-cad-reference.json";
import { useTerrainNavigation } from "@/features/terrain-navigation/use-terrain-navigation";
import { estimateMinutes, PROJECT_ANCHOR } from "@/features/terrain-navigation/geo-constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  useTerrainLocation,
  type ProjectAnchor,
} from "@/features/terrain-navigation/use-terrain-location";
import { cn } from "@/lib/utils";
import MasterplanSvgViewer from "../masterplan/MasterplanSvgViewer";
import ProjectLocationMap from "../location/ProjectLocationMap";
import LotDestinationSearch from "./LotDestinationSearch";
import TerrainRouteOverlay from "./TerrainRouteOverlay";
import type { ProjectViewSettings } from "../types";

interface TerrainRouteViewProps {
  lots: Lot[];
  selectedLot?: Lot;
  onSelectLot: (lot: Lot) => void;
  onInspectLotDetails?: (lot: Lot) => void;
  settings: ProjectViewSettings;
  isDark: boolean;
  isRightPanelOpen: boolean;
  projectAnchor: ProjectAnchor;
  projectId?: string;
  projectSlug: string;
  masterplanVersion?: string;
  alternatePanel?: ReactNode;
  panelPercent?: number;
  onPanelPercentChange?: (value: number) => void;
}

export default function TerrainRouteView({
  lots,
  selectedLot,
  onSelectLot,
  onInspectLotDetails,
  settings,
  isDark,
  isRightPanelOpen,
  projectAnchor,
  projectId,
  projectSlug,
  masterplanVersion,
  alternatePanel,
  panelPercent = 48,
  onPanelPercentChange,
}: TerrainRouteViewProps) {
  const [expanded, setExpanded] = useState(false);
  const [terrainViewMode, setTerrainViewMode] = useState<"satellite" | "vector">("satellite");
  const [detailsPercent, setDetailsPercent] = useState(50);
  const [focusRequest, setFocusRequest] = useState(1);
  const [isDesktopPanelOpen, setIsDesktopPanelOpen] = useState(true);
  const location = useTerrainLocation(projectAnchor);
  const destination = selectedLot?.centroid && !selectedLot.isReserve ? selectedLot : undefined;
  const [travelMode, setTravelMode] = useState<"walking" | "driving">("walking");
  const navigation = useTerrainNavigation(
    projectId,
    projectSlug,
    masterplanVersion,
    destination?.id,
    travelMode,
    location.position,
    location.timestamp,
  );
  const validatedRoute = navigation.route;

  const lotLabel = destination
    ? `Lote ${destination.lotNumber ?? destination.id.replace("L-", "")}`
    : "Elige tu destino";
  const manzanaLabel = destination ? formatManzanaLabel(destination.manzana) : "";

  const entrancePoint =
    projectSlug === "villa-paraiso" ? cadReference.entranceAnnotation.svg : null;

  // Ruta activa sobre la red caminable/vial validada
  const effectiveRoute =
    validatedRoute && validatedRoute.svgPaths && validatedRoute.svgPaths.length > 0
      ? validatedRoute
      : null;

  const selectDestination = (lot: Lot) => {
    if (!lot.centroid || lot.isReserve) return;
    onSelectLot(lot);
    setFocusRequest((value) => value + 1);
    setExpanded(false);
  };

  const locating = location.status === "requesting";
  const tracking = location.status === "ready" || location.status === "low_accuracy";

  const isSold = destination?.status === "Vendido";
  const isReserved = destination?.status === "Reservado";
  const statusBadgeClass = isSold
    ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700/60 dark:bg-rose-950/70 dark:text-rose-300"
    : isReserved
      ? "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700/60 dark:bg-orange-950/70 dark:text-orange-300"
      : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/70 dark:text-emerald-300";
  const statusDotClass = isSold ? "bg-rose-500" : isReserved ? "bg-orange-500" : "bg-emerald-500";

  const estimatedMinutes = effectiveRoute
    ? estimateMinutes(effectiveRoute.result.distanceMeters, travelMode)
    : null;

  return (
    <div className="terrain-navigation relative flex h-full min-h-0 flex-col overflow-hidden bg-background pt-14 sm:pt-16 lg:pt-0">
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col",
          alternatePanel ? "lg:flex-row" : "md:flex-row",
        )}
      >
        {/* Lienzo del plano maestro / satélite */}
        <div
          className="relative order-1 min-h-[120px] flex-1 md:order-2"
          aria-label="Plano del proyecto"
        >
          {/* Selector de modo Satélite HD / Plano Vectorial */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 md:top-20 md:left-auto md:right-16 z-30 select-none">
            <div className="flex items-center gap-1 rounded-full border border-border/80 bg-background/95 p-1 shadow-xl backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setTerrainViewMode("satellite")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  terrainViewMode === "satellite"
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="size-3.5" />
                <span>Satélite HD</span>
              </button>
              <button
                type="button"
                onClick={() => setTerrainViewMode("vector")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  terrainViewMode === "vector"
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MapIcon className="size-3.5" />
                <span>Plano Vectorial</span>
              </button>
            </div>
          </div>

          {terrainViewMode === "satellite" ? (
            <ProjectLocationMap
              lat={projectAnchor.lat}
              lng={projectAnchor.lng}
              projectName="Villa Paraíso"
              locationName="Santa Rosa · Villanueva, Bolívar"
              isDark={isDark}
              georeferenceStatus="validated"
              projectSlug={projectSlug}
              lots={lots}
              selectedLotId={destination?.id}
              destinationLot={destination}
              onSelectLot={selectDestination}
              route={effectiveRoute}
              fromGps={navigation.fromGps}
              userGpsPosition={location.position}
              userHeading={location.heading}
              enableHeadingRotation={true}
              showRouteLine={false}
              hideSurroundingsDrawer={true}
              hideGeoreferenceBadge={true}
              travelMode={travelMode}
              focusRequest={focusRequest}
              className="h-full w-full"
            />
          ) : (
            <MasterplanSvgViewer
              settings={settings}
              lots={lots}
              selectedLotId={destination?.id ?? ""}
              focusRequest={focusRequest}
              focusContextSize={760}
              selectedLotTone="gold"
              onSelectLot={(id) => {
                const lot = lots.find((item) => item.id.replace("L-", "") === id.replace("L-", ""));
                if (lot) selectDestination(lot);
              }}
              isDesktopSidebarOpen={isDesktopPanelOpen}
              isRightPanelOpen={isRightPanelOpen}
              isDark={isDark}
              overlay={
                <TerrainRouteOverlay
                  destination={destination}
                  route={effectiveRoute}
                  entrancePoint={entrancePoint}
                  travelMode={travelMode}
                />
              }
            />
          )}

          {/* Botón flotante para reabrir el panel lateral en escritorio cuando está oculto */}
          {!isDesktopPanelOpen && !alternatePanel && (
            <div className="absolute bottom-5 left-5 z-30 hidden items-center gap-2.5 md:flex">
              <Button
                type="button"
                onClick={() => setIsDesktopPanelOpen(true)}
                className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-xl hover:bg-accent/90"
              >
                <PanelLeftOpen className="mr-1.5 size-4" /> Mostrar panel de recorrido
              </Button>
            </div>
          )}
        </div>

        {alternatePanel && (
          <section
            aria-label="Configuración del recorrido"
            className="order-2 flex shrink-0 flex-col overflow-hidden rounded-t-3xl border-t bg-card"
            style={{ height: `${panelPercent}%` }}
          >
            {onPanelPercentChange && (
              <PanelResizeHandle value={panelPercent} onChange={onPanelPercentChange} />
            )}
            <div className="min-h-0 flex-1">{alternatePanel}</div>
          </section>
        )}

        {/* Panel de Recorrido en Terreno (Flotante editorial en escritorio, Bottom Sheet en móvil) */}
        <aside
          style={
            {
              "--terrain-panel-height": expanded ? `${detailsPercent}%` : "auto",
            } as CSSProperties
          }
          aria-labelledby="terrain-title"
          className={cn(
            alternatePanel && "!hidden",
            !isDesktopPanelOpen && "md:hidden",
            "relative order-2 flex shrink-0 flex-col transition-all duration-300",
            expanded
              ? "max-h-[var(--terrain-panel-height)] rounded-t-3xl border-t bg-background/95 shadow-2xl backdrop-blur-2xl"
              : "rounded-t-2xl border-t bg-background/95 shadow-xl backdrop-blur-xl",
            "md:absolute md:bottom-3 md:left-3 md:top-[76px] md:z-30 md:order-1 md:max-h-none md:w-[356px] md:rounded-[22px] md:border md:border-border md:bg-background/94 md:shadow-[20px_20px_70px_rgba(0,0,0,.32)] lg:w-[376px]",
          )}
        >
          {/* Mobile compact header bar when collapsed */}
          {!expanded && (
            <div className="flex md:hidden items-center justify-between gap-2.5 px-3.5 py-2.5">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex items-center gap-2.5 min-w-0 text-left flex-1 cursor-pointer"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <MapPin className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground truncate">{lotLabel}</span>
                    {destination && (
                      <span className={`size-2 rounded-full shrink-0 ${statusDotClass}`} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                    {effectiveRoute ? (
                      <>
                        <span className="font-semibold text-accent">
                          {Math.round(effectiveRoute.result.distanceMeters)} m
                        </span>
                        <span>•</span>
                        <span>{estimatedMinutes} min</span>
                      </>
                    ) : (
                      <span>Toca para elegir lote y ver ruta</span>
                    )}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFocusRequest((v) => v + 1)}
                  className="size-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
                  title="Centrar en el mapa"
                >
                  <LocateFixed className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(true)}
                  className="size-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Expandir detalles"
                >
                  <ChevronUp className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Expanded mobile panel resize handle */}
          {expanded && (
            <div className="md:hidden px-4 pt-2">
              <PanelResizeHandle
                label="Detalles del recorrido"
                value={detailsPercent}
                max={65}
                onChange={(value) => {
                  setDetailsPercent(value);
                  setExpanded(value > 25);
                }}
              />
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsDesktopPanelOpen(false)}
            className="hidden md:flex absolute -right-3 top-1/2 z-40 size-8 -translate-y-1/2 rounded-full border border-border bg-background/95 text-foreground shadow-md hover:bg-muted hover:text-accent"
            aria-label="Ocultar panel de recorrido"
            title="Ocultar panel de recorrido"
          >
            <PanelLeftClose className="size-4" />
          </Button>

          {/* Full content (always visible on desktop, or on mobile when expanded) */}
          <div
            className={cn(
              "terrain-panel-scroll flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:p-5",
              expanded ? "flex" : "hidden md:flex",
            )}
          >
            {/* Search and header inside mobile expanded sheet */}
            <div className="flex flex-col gap-2 md:hidden pb-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent flex items-center gap-1.5">
                  <Navigation className="size-3.5" /> Buscar Lote
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(false)}
                  className="h-6 px-2 text-[10.5px] text-muted-foreground"
                >
                  <ChevronDown className="size-3.5 mr-1" /> Minimizar
                </Button>
              </div>
              <LotDestinationSearch
                lots={lots}
                destination={destination}
                onSelect={selectDestination}
              />
            </div>

            {/* Cabecera en escritorio */}
            <div className="hidden flex-col gap-1.5 md:flex">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                  <Navigation className="size-3.5" /> Recorrido en terreno
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {lots.filter((l) => !l.isReserve && l.status === "Disponible").length} disponibles
                </span>
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                ¿A dónde quieres ir?
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Elige un lote por número o selecciónalo directamente sobre el plano.
              </p>
              <div className="mt-1.5">
                <LotDestinationSearch
                  lots={lots}
                  destination={destination}
                  onSelect={selectDestination}
                />
              </div>
            </div>

            {/* Tarjeta del Lote Destino Seleccionado */}
            <div className="rounded-2xl border border-border/80 bg-card/85 p-3.5 shadow-xs">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <MapPin className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        id="terrain-title"
                        className="truncate text-base font-bold text-foreground"
                      >
                        {lotLabel}
                      </h3>
                      {destination && (
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${statusBadgeClass}`}
                        >
                          <span
                            className={`mr-1 inline-block size-1.5 rounded-full ${statusDotClass}`}
                          />
                          {destination.status}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                      {destination
                        ? `${manzanaLabel} · ${destination.metadata?.ubicacion ?? "Vía interna"}`
                        : "Selecciona un lote para ver su ubicación"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 rounded-xl md:hidden"
                  aria-label={expanded ? "Ocultar detalles" : "Ver detalles"}
                  aria-expanded={expanded}
                  aria-controls="terrain-details"
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                </Button>
              </div>

              {destination && (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Área del lote
                      </span>
                      <strong className="mt-0.5 block text-sm font-bold text-foreground">
                        {formatLotArea(destination.area)}
                      </strong>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Precio total
                      </span>
                      <strong className="mt-0.5 block text-sm font-bold text-foreground">
                        {formatLotPrice(destination.price)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <Button
                      type="button"
                      className="h-9 flex-1 rounded-xl text-xs font-semibold"
                      onClick={() => setFocusRequest((value) => value + 1)}
                    >
                      <LocateFixed data-icon="inline-start" className="size-3.5" />
                      Ver lote en el plano
                    </Button>
                    {onInspectLotDetails && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-xl px-3 text-xs font-semibold"
                        onClick={() => onInspectLotDetails(destination)}
                        title="Abrir ficha técnica y financiera del lote"
                      >
                        <FileText className="mr-1.5 size-3.5" />
                        Ficha
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modo de desplazamiento (A pie / Vehículo) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Modo de desplazamiento
              </span>
              <ToggleGroup
                type="single"
                value={travelMode}
                onValueChange={(value) => {
                  if (value === "walking" || value === "driving") setTravelMode(value);
                }}
                aria-label="Tipo de recorrido"
                className="grid grid-cols-2 rounded-xl border border-border/80 bg-muted/40 p-1"
              >
                <ToggleGroupItem
                  value="walking"
                  className="h-9 rounded-lg text-xs font-semibold data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                  aria-label="Recorrido a pie"
                >
                  <Footprints className="mr-1.5 size-3.5" /> A pie
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="driving"
                  className="h-9 rounded-lg text-xs font-semibold data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                  aria-label="Recorrido en vehículo"
                >
                  <Car className="mr-1.5 size-3.5" /> Vehículo
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Detalles de ruta, Origen y GPS */}
            <div
              id="terrain-details"
              className={cn("flex-col gap-3", expanded ? "flex" : "hidden md:flex")}
            >
              {/* Resumen de Tramo Origen -> Destino */}
              <div className="rounded-2xl border border-border/80 bg-card/65 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Punto de partida
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
                    <Route className="size-3.5" />
                    {effectiveRoute ? "Ruta trazada" : "Ubicación en plano"}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="size-2.5 shrink-0 rounded-full bg-[#1677ff] ring-4 ring-[#1677ff]/15" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {navigation.fromGps ? "Mi ubicación GPS" : "Portería · Acceso principal"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {navigation.fromGps
                          ? "Origen dinámico en terreno"
                          : "Entrada principal del proyecto"}
                      </p>
                    </div>
                  </div>
                </div>

                {effectiveRoute ? (
                  <>
                    <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
                      <div className="rounded-xl border border-border/60 bg-background/70 px-2 py-1.5">
                        <span className="block text-[9px] font-bold uppercase text-muted-foreground">
                          Distancia
                        </span>
                        <strong className="text-xs font-bold text-foreground">
                          {Math.round(effectiveRoute.result.distanceMeters)} m
                        </strong>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/70 px-2 py-1.5">
                        <span className="block text-[9px] font-bold uppercase text-muted-foreground">
                          Tiempo est.
                        </span>
                        <strong className="text-xs font-bold text-foreground">
                          ~{estimatedMinutes} min
                        </strong>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/70 px-2 py-1.5">
                        <span className="block text-[9px] font-bold uppercase text-muted-foreground">
                          Modo
                        </span>
                        <strong className="text-xs font-bold text-foreground">
                          {travelMode === "driving" ? "Vehículo" : "A pie"}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                      <p className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        Ruta trazada hacia {lotLabel}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Trazado continuo por vías internas conectando el Acceso Principal con el
                        frente del lote.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="mt-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    <p className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Info className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      {navigation.message}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Selecciona un lote en el plano o en el buscador para trazar la ruta de
                      recorrido.
                    </p>
                  </div>
                )}

                {/* Sección: Llegar al proyecto en carretera (Google Maps / Waze) */}
                <div className="mt-3.5 flex flex-col gap-2 rounded-xl border border-border/70 bg-background/60 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Compass className="size-3.5 text-accent" /> Cómo llegar al proyecto
                    </span>
                    <Badge
                      variant="outline"
                      className="border-accent/40 bg-accent/10 px-1.5 py-0 text-[9px] font-semibold text-accent"
                    >
                      Carretera
                    </Badge>
                  </div>

                  <p className="text-[11px] leading-tight text-foreground font-medium">
                    Santa Rosa de Lima a 1 km vía a Villanueva, Bolívar
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Coordenadas: 10.436829, -75.356179
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-blue-600/30 bg-blue-50/50 px-2 text-[10.5px] font-bold text-blue-700 hover:bg-blue-100/60 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-300"
                    >
                      <a
                        href="https://www.google.com/maps/dir/?api=1&destination=10.436829,-75.356179"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 size-3 text-blue-600 dark:text-blue-400" />
                        Google Maps
                      </a>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-cyan-600/30 bg-cyan-50/50 px-2 text-[10.5px] font-bold text-cyan-700 hover:bg-cyan-100/60 dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-300"
                    >
                      <a
                        href="https://waze.com/ul?ll=10.436829,-75.356179&navigate=yes"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="mr-1 size-3 text-cyan-600 dark:text-cyan-400" />
                        Waze
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Controles de GPS en terreno */}
                <div className="mt-3 flex flex-col gap-2">
                  {location.status !== "idle" && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="rounded-lg bg-muted/60 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground"
                    >
                      {navigation.available && location.status === "ready"
                        ? navigation.message
                        : location.message}
                    </p>
                  )}
                  {location.distance !== null && (
                    <div className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-2 text-[11px] text-foreground">
                      <p>
                        Estás a{" "}
                        <strong className="font-bold text-foreground">
                          {location.distance < 1000
                            ? `${location.distance} m`
                            : `${(location.distance / 1000).toFixed(1)} km`}
                        </strong>{" "}
                        de Villa Paraíso.
                      </p>
                      {location.position && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${location.position.latitude},${location.position.longitude}&destination=10.436829,-75.356179`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 font-bold text-accent hover:underline text-[10.5px]"
                        >
                          <ExternalLink className="size-3" />
                          Ruta en carretera desde mi GPS →
                        </a>
                      )}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full rounded-xl text-xs font-semibold"
                    disabled={locating}
                    onClick={tracking ? location.stop : location.request}
                  >
                    <Crosshair data-icon="inline-start" className="size-3.5" />{" "}
                    {locating
                      ? "Obteniendo ubicación GPS…"
                      : tracking
                        ? "Desactivar ubicación GPS"
                        : "Usar mi ubicación GPS"}
                  </Button>
                  {locating && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={location.stop}
                    >
                      Cancelar solicitud
                    </Button>
                  )}
                </div>
              </div>

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0 text-accent" /> GPS privado · procesado
                solo en tu dispositivo
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
