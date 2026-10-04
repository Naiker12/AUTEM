import PanelResizeHandle from "./PanelResizeHandle";
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Car,
  Crosshair,
  Footprints,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";
import type { Lot } from "@/data/lots";
import { useTerrainNavigation } from "@/features/terrain-navigation/use-terrain-navigation";
import { Button } from "@/components/ui/button";

import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  useTerrainLocation,
  type ProjectAnchor,
} from "@/features/terrain-navigation/use-terrain-location";
import { cn } from "@/lib/utils";
import MasterplanSvgViewer from "./MasterplanSvgViewer";
import LotDestinationSearch from "./terrain/LotDestinationSearch";
import TerrainRouteOverlay from "./terrain/TerrainRouteOverlay";
import type { ProjectViewSettings } from "./types";

interface TerrainRouteViewProps {
  lots: Lot[];
  selectedLot?: Lot;
  onSelectLot: (lot: Lot) => void;
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
  const [detailsPercent, setDetailsPercent] = useState(50);
  const [focusRequest, setFocusRequest] = useState(0);
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
  const selectDestination = (lot: Lot) => {
    if (!lot.centroid || lot.isReserve) return;
    onSelectLot(lot);
    setFocusRequest((value) => value + 1);
    setExpanded(false);
  };
  const locating = location.status === "requesting";
  const tracking = location.status === "ready" || location.status === "low_accuracy";
  const lotLabel = destination
    ? `Lote ${destination.lotNumber ?? destination.id}`
    : "Elige tu destino";

  return (
    <div className="terrain-navigation relative flex h-full min-h-0 flex-col overflow-hidden bg-background pt-14 sm:pt-16 lg:pt-[72px]">
      <div className="flex shrink-0 flex-col gap-2 border-b bg-background px-3 py-2 md:hidden">
        <LotDestinationSearch lots={lots} destination={destination} onSelect={selectDestination} />
      </div>
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col",
          alternatePanel ? "lg:flex-row" : "md:flex-row",
        )}
      >
        <div
          className="relative order-1 min-h-[120px] flex-1 md:order-2"
          aria-label="Plano del proyecto"
        >
          <MasterplanSvgViewer
            settings={settings}
            lots={lots}
            selectedLotId={destination?.id ?? ""}
            focusRequest={focusRequest}
            focusContextSize={800}
            selectedLotTone="gold"
            onSelectLot={(id) => {
              const lot = lots.find((item) => item.id.replace("L-", "") === id.replace("L-", ""));
              if (lot) selectDestination(lot);
            }}
            isDesktopSidebarOpen={false}
            isRightPanelOpen={isRightPanelOpen}
            isDark={isDark}
            overlay={<TerrainRouteOverlay destination={destination} route={validatedRoute} />}
          />
          {destination && (
            <div className="pointer-events-none absolute bottom-3 left-3 flex max-w-[calc(100%-5rem)] items-center gap-2 rounded-full border bg-background/95 px-3 py-2 text-xs shadow-sm">
              <MapPin className="size-4 shrink-0 text-accent" />
              <span className="truncate">
                {lotLabel}
                {destination.manzana ? ` · ${destination.manzana}` : ""}
              </span>
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
        <section
          style={
            {
              "--terrain-panel-height": `${expanded ? detailsPercent : Math.min(detailsPercent, 50)}%`,
            } as CSSProperties
          }
          aria-labelledby="terrain-title"
          className={cn(
            alternatePanel && "!hidden",
            "terrain-panel-scroll relative order-2 flex shrink-0 flex-col gap-2 overflow-y-auto overscroll-contain rounded-t-3xl border-t bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-lg",
            "md:order-1 md:h-full md:w-[300px] md:max-h-full md:gap-3 md:rounded-none md:border-r md:border-t-0 md:p-5 lg:w-[340px] lg:p-6",
            "max-h-[var(--terrain-panel-height)]",
          )}
        >
          <div className="md:hidden">
            <PanelResizeHandle
              label="Detalles del recorrido"
              value={detailsPercent}
              max={65}
              onChange={(value) => {
                setDetailsPercent(value);
                setExpanded(value > 50);
              }}
            />
          </div>
          <div className="hidden flex-col gap-2 md:flex">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Navigation className="size-4 text-accent" /> Recorrido en terreno
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">¿A dónde quieres ir?</h2>
            <p className="text-sm text-muted-foreground">Busca por número o toca el plano.</p>
            <div className="mt-2">
              <LotDestinationSearch
                lots={lots}
                destination={destination}
                onSelect={selectDestination}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <MapPin className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 id="terrain-title" className="truncate text-lg font-semibold">
                  {lotLabel}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {destination?.manzana ?? "Busca por número de lote"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 rounded-xl md:hidden"
              aria-label={expanded ? "Ocultar detalles" : "Ver detalles"}
              aria-expanded={expanded}
              aria-controls="terrain-details"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <ChevronDown /> : <ChevronUp />}
            </Button>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Footprints className="size-4 shrink-0" />
            {validatedRoute ? navigation.message : "Explora tu lote"}
          </p>
          <ToggleGroup
            type="single"
            value={travelMode}
            onValueChange={(value) => {
              if (value === "walking" || value === "driving") setTravelMode(value);
            }}
            aria-label="Tipo de recorrido"
            className="rounded-xl border bg-muted/40 p-1"
          >
            <ToggleGroupItem
              value="walking"
              className="h-11 flex-1 rounded-lg"
              aria-label="Recorrido a pie"
            >
              <Footprints className="size-4" /> A pie
            </ToggleGroupItem>
            <ToggleGroupItem
              value="driving"
              disabled={!navigation.available}
              className="h-11 flex-1 rounded-lg"
              aria-label="Recorrido en vehículo"
              title="Pendiente de validar vías para vehículos"
            >
              <Car className="size-4" /> Vehículo
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            type="button"
            disabled={!destination}
            className="h-11 w-full rounded-xl"
            onClick={() => setFocusRequest((value) => value + 1)}
          >
            <LocateFixed data-icon="inline-start" /> Ver lote en el plano
          </Button>
          <div
            id="terrain-details"
            className={cn("flex-col gap-3 md:flex-1", expanded ? "flex" : "hidden md:flex")}
          >
            <Separator />
            <p className="flex items-center gap-2 text-sm">
              <Navigation className="size-4 shrink-0 text-accent" />{" "}
              {navigation.fromGps ? "Desde mi ubicación" : "Desde el acceso principal"}
            </p>
            {!validatedRoute && (
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" /> {navigation.message}
              </p>
            )}
            <div className="flex flex-col gap-2">
              {location.status !== "idle" && (
                <p
                  role="status"
                  aria-live="polite"
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  {navigation.available && location.status === "ready"
                    ? navigation.message
                    : location.message}
                </p>
              )}
              {location.distance !== null && (
                <p className="text-xs text-muted-foreground">
                  A{" "}
                  {location.distance < 1000
                    ? `${location.distance} m`
                    : `${(location.distance / 1000).toFixed(1)} km`}{" "}
                  de la referencia · no es la distancia al lote.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl"
                disabled={locating}
                onClick={tracking ? location.stop : location.request}
              >
                <Crosshair data-icon="inline-start" />{" "}
                {locating
                  ? "Obteniendo ubicación…"
                  : tracking
                    ? "Desactivar ubicación"
                    : "Usar mi ubicación"}
              </Button>
              {locating && (
                <Button type="button" variant="ghost" className="h-11" onClick={location.stop}>
                  Cancelar
                </Button>
              )}
            </div>
            <details className="rounded-xl border px-3 py-2 text-xs text-muted-foreground">
              <summary className="flex min-h-8 cursor-pointer items-center gap-2">
                <Info className="size-4" /> Sobre el recorrido
              </summary>
              <div className="flex flex-col gap-2 pt-2 leading-relaxed">
                <p>
                  {validatedRoute
                    ? "Sigue las vías indicadas y verifica la señalización en terreno."
                    : "Puedes localizar tu lote. La ruta y su distancia requieren vías, accesos y calibración GPS validados."}
                </p>
                <p>
                  {navigation.available
                    ? "El GPS se ajusta a las vías aprobadas. La ruta se actualiza con cada posición precisa."
                    : "El GPS consulta tu proximidad; posicionar el origen requiere una red y calibración publicadas."}
                </p>
              </div>
            </details>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0" /> GPS privado · solo en este dispositivo
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
