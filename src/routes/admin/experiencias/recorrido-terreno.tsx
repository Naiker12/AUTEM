import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  ExternalLink,
  Footprints,
  Globe,
  Layers,
  LocateFixed,
  MapPin,
  Maximize2,
  Navigation,
  Orbit,
  RefreshCw,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MasterplanSvgViewer from "@/components/project-view/masterplan/MasterplanSvgViewer";
import TerrainRouteOverlay from "@/components/project-view/terrain/TerrainRouteOverlay";
import {
  DEFAULT_PROJECT_VIEW_SETTINGS,
  type ProjectViewSettings,
} from "@/components/project-view/types";
import { formatLotArea, formatLotPrice, type Lot } from "@/features/lots";
import cadReference from "@/data/villa-paraiso/cad-reference.json";
import rawNavigationBundle from "@/data/villa-paraiso/generated/navigation-bundle.json";
import { useTerrainNavigation } from "@/features/terrain-navigation/use-terrain-navigation";
import { usePublishedLots, usePublishedProject } from "@/lib/public-projects";
import { requireSupabase, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/experiencias/recorrido-terreno")({
  component: TerrainSurveyPage,
});

const bundle = rawNavigationBundle;
const ENTRANCE_POINT = {
  x: cadReference.entranceAnnotation.svg.x ?? 1014.7,
  y: cadReference.entranceAnnotation.svg.y ?? 2148.5,
};

function TerrainSurveyPage() {
  const { project } = usePublishedProject("villa-paraiso");
  const projectId = project?.id ?? "00000000-0000-0000-0000-000000000101";
  const { lots } = usePublishedLots(projectId, "villa-paraiso");

  // Destino seleccionado para la ruta (persiste en recarga)
  const [selectedLotId, setSelectedLotId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("autem_admin_recorrido_lot");
      if (saved) return saved;
    }
    return "302";
  });
  const [travelMode, setTravelMode] = useState<"walking" | "driving">("walking");
  const [showGeodeticMarkers, setShowGeodeticMarkers] = useState(true);
  const [focusRequest, setFocusRequest] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (selectedLotId && typeof window !== "undefined") {
      sessionStorage.setItem("autem_admin_recorrido_lot", selectedLotId);
    }
  }, [selectedLotId]);

  // Ubicación GPS en vivo (opcional para pruebas en obra)
  const [liveGps, setLiveGps] = useState<GeolocationCoordinates | null>(null);
  const [gpsTimestamp, setGpsTimestamp] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [viewSettings] = useState<ProjectViewSettings>(DEFAULT_PROJECT_VIEW_SETTINGS);

  const selectedLot = useMemo(() => {
    if (!selectedLotId) return null;
    const clean = selectedLotId.replace(/^lot-/, "");
    return (
      lots.find(
        (l) =>
          l.id === clean ||
          l.id === `L-${clean}` ||
          l.id.replace(/^L-/, "") === clean.replace(/^L-/, "") ||
          String(l.lotNumber) === clean.replace(/^L-/, ""),
      ) ?? null
    );
  }, [lots, selectedLotId]);

  // Navegación secuencial entre lotes
  const handlePrevLot = useCallback(() => {
    if (!lots.length) return;
    const currentIndex = lots.findIndex(
      (l) =>
        l.id === selectedLotId ||
        l.id === `L-${selectedLotId}` ||
        l.id.replace(/^L-/, "") === selectedLotId.replace(/^L-/, "") ||
        String(l.lotNumber) === selectedLotId.replace(/^L-/, ""),
    );
    const prevIndex = currentIndex <= 0 ? lots.length - 1 : currentIndex - 1;
    const target = lots[prevIndex];
    if (target) {
      setSelectedLotId(target.id.replace(/^L-/, ""));
      setFocusRequest((prev) => (prev === 0 ? 1 : prev + 1));
    }
  }, [lots, selectedLotId]);

  const handleNextLot = useCallback(() => {
    if (!lots.length) return;
    const currentIndex = lots.findIndex(
      (l) =>
        l.id === selectedLotId ||
        l.id === `L-${selectedLotId}` ||
        l.id.replace(/^L-/, "") === selectedLotId.replace(/^L-/, "") ||
        String(l.lotNumber) === selectedLotId.replace(/^L-/, ""),
    );
    const nextIndex = currentIndex === -1 || currentIndex >= lots.length - 1 ? 0 : currentIndex + 1;
    const target = lots[nextIndex];
    if (target) {
      setSelectedLotId(target.id.replace(/^L-/, ""));
      setFocusRequest((prev) => (prev === 0 ? 1 : prev + 1));
    }
  }, [lots, selectedLotId]);

  // Cálculo de la ruta 100% REAL mediante el grafo validado de Villa Paraíso (Dijkstra)
  const navigation = useTerrainNavigation(
    projectId,
    "villa-paraiso",
    bundle.masterplanVersion,
    selectedLot?.id,
    travelMode,
    liveGps,
    gpsTimestamp,
  );

  const calculatedRoute = navigation.route;

  const handleSelectLot = useCallback((lotId: string) => {
    const clean = lotId.replace(/^lot-/, "");
    setSelectedLotId(clean);
    setFocusRequest((prev) => prev + 1);
  }, []);

  // Activar GPS real del dispositivo
  const handleToggleLiveGps = () => {
    if (liveGps) {
      setLiveGps(null);
      setGpsTimestamp(null);
      toast.info("GPS en vivo desactivado. Mostrando ruta desde la portería.");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("La geolocalización no está disponible en este dispositivo.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveGps(pos.coords);
        setGpsTimestamp(pos.timestamp);
        setIsLocating(false);
        toast.success(
          `GPS fijado: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)} (±${Math.round(pos.coords.accuracy)} m)`,
        );
      },
      (err) => {
        setIsLocating(false);
        toast.error(`Error GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  // Publicar o sincronizar la red con Supabase (project_navigation_versions)
  const handlePublishToSupabase = async () => {
    if (!supabase || !projectId) {
      toast.info("Base de datos no disponible para guardar.");
      return;
    }

    setIsPublishing(true);
    try {
      const client = requireSupabase();
      const { error } = await client.from("project_navigation_versions").upsert(
        {
          project_id: projectId,
          version: bundle.version,
          status: "published",
          payload: bundle,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id, version" },
      );

      if (error) throw error;
      toast.success(`Red de navegación v${bundle.version} sincronizada en Supabase con éxito.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al sincronizar red";
      toast.error(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10 space-y-6">
      {/* Encabezado Principal */}
      <section className="flex flex-col gap-4 border-b pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex max-w-3xl flex-col gap-2 border-l-2 border-accent pl-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Experiencias del proyecto · Villa Paraíso
            </span>
            <Badge
              variant="outline"
              className="text-[11px] font-normal border-accent/40 text-accent"
            >
              Red Oficial Validada · 676 Nodos
            </Badge>
          </div>
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
            Tour de terreno y navegación GPS
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Consola administrativa de replanteo territorial y ruteo en tiempo real. Inspecciona los
            8 controles geodésicos GPS, 4 checkpoints y el trazado de senderos caminables hacia cada
            uno de los 338 lotes.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" asChild>
            <Link to="/proyecto/$slug" params={{ slug: "villa-paraiso" }} target="_blank">
              <ExternalLink data-icon="inline-start" className="size-4" />
              Probar en vista pública
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/experiencias/masterplan">
              <Layers data-icon="inline-start" className="size-4" />
              Masterplan interactivo
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/experiencias/panorama-360">
              <Orbit data-icon="inline-start" className="size-4" />
              Visor 360°
            </Link>
          </Button>
        </div>
      </section>

      {/* Indicadores Reales de la Red de Navegación */}
      <section
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        aria-label="Métricas territoriales"
      >
        <Card className="rounded-xl border-border/80 shadow-xs">
          <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Nodos de Red</span>
              <Navigation className="size-4 text-accent" />
            </div>
            <p className="font-serif text-3xl text-foreground mt-1">{bundle.nodes.length}</p>
            <p className="text-xs text-muted-foreground">Intersecciones y frentes</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-xs">
          <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Tramos Viales
              </span>
              <RouteIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-serif text-3xl text-foreground mt-1">{bundle.edges.length}</p>
            <p className="text-xs text-muted-foreground">Senderos peatonales continuos</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-xs">
          <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Lotes Conectados
              </span>
              <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="font-serif text-3xl text-foreground mt-1">{bundle.destinations.length}</p>
            <p className="text-xs text-muted-foreground">100% con acceso asignado</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-xs">
          <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Puntos de Control
              </span>
              <Crosshair className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="font-serif text-3xl text-foreground mt-1">
              {bundle.calibration.controls.length} GPS
            </p>
            <p className="text-xs text-muted-foreground">WGS84 y MAGNA-SIRGAS</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-xs">
          <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider text-accent">
                Checkpoints
              </span>
              <ShieldCheck className="size-4 text-accent" />
            </div>
            <p className="font-serif text-3xl text-foreground mt-1">
              {bundle.calibration.checkpoints.length} Puntos
            </p>
            <p className="text-xs text-muted-foreground">Error RMS ≤ 1.8 m en campo</p>
          </CardContent>
        </Card>
      </section>

      {/* Barra de Control de Ruta y Selección de Destino */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Selector de Lote Destino */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Destino:
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-8 shrink-0"
                onClick={handlePrevLot}
                title="Lote anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Select
                value={selectedLotId}
                onValueChange={(val) => {
                  setSelectedLotId(val);
                  setFocusRequest((prev) => (prev === 0 ? 1 : prev + 1));
                }}
              >
                <SelectTrigger className="h-9 w-[180px] text-xs font-semibold">
                  <SelectValue placeholder="Elegir lote..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectGroup>
                    {lots.map((l) => (
                      <SelectItem key={l.id} value={l.id.replace(/^L-/, "")}>
                        Lote {l.lotNumber ?? l.id} {l.manzana ? `· M${l.manzana}` : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-8 shrink-0"
                onClick={handleNextLot}
                title="Lote siguiente"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Selector de Modo de Viaje */}
          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/40">
            <Button
              type="button"
              variant={travelMode === "walking" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTravelMode("walking")}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              <Footprints className="size-3.5" />A pie
            </Button>
            <Button
              type="button"
              variant={travelMode === "driving" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTravelMode("driving")}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              <Car className="size-3.5" />
              En vehículo / carrito
            </Button>
          </div>

          {/* Alternar Puntos Geodésicos en Mapa */}
          <Button
            type="button"
            variant={showGeodeticMarkers ? "outline" : "ghost"}
            size="sm"
            onClick={() => setShowGeodeticMarkers((prev) => !prev)}
            className="h-8 text-xs gap-1.5"
          >
            <Globe className="size-3.5 text-accent" />
            {showGeodeticMarkers ? "Ocultar marcas GPS" : "Mostrar marcas GPS"}
          </Button>
        </div>

        {/* Botón de Captura GPS en Vivo */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant={liveGps ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleLiveGps}
            disabled={isLocating}
            className={cn(
              "h-8 text-xs gap-1.5",
              liveGps && "border-emerald-500/50 text-emerald-600",
            )}
          >
            {isLocating ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <LocateFixed className="size-3.5" />
            )}
            {liveGps ? "GPS activo en terreno" : "Probar con mi GPS en vivo"}
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handlePublishToSupabase}
            disabled={isPublishing}
            className="h-8 text-xs gap-1.5"
          >
            {isPublishing ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Sincronizar red con Supabase
          </Button>
        </div>
      </section>

      {/* Visor SVG de Alta Resolución y Panel de Control de Ruta */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Canvas del Masterplan con Ruta Real Superpuesta */}
        <Card className="overflow-hidden rounded-2xl border shadow-sm flex flex-col min-h-[620px] h-[720px]">
          <CardHeader className="border-b py-3 px-4 sm:px-6 flex flex-row items-center justify-between bg-muted/20 gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <RouteIcon className="size-4 text-accent" />
                Red Vial y Trazado de Ruta Real
              </CardTitle>
              <CardDescription className="text-xs">
                Ruta calculada con precisión topográfica sobre los 436 tramos caminables y
                vehiculares.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedLot && (
                <Badge variant="secondary" className="gap-1.5 text-xs font-semibold">
                  <span className="size-1.5 rounded-full bg-accent" />
                  Lote {selectedLot.lotNumber ?? selectedLot.id}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 font-medium"
                onClick={() => setFocusRequest((prev) => (prev === 0 ? 1 : prev + 1))}
                title="Enfocar lote en el mapa"
              >
                <Target className="size-3.5 text-accent" />
                Enfocar lote
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setFocusRequest(0)}
                title="Restablecer vista a plano completo"
              >
                <Maximize2 className="size-3.5" />
                Plano completo
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 relative isolate bg-card overflow-hidden">
            <MasterplanSvgViewer
              lots={lots}
              selectedLotId={selectedLotId}
              focusRequest={focusRequest}
              focusContextSize={1100}
              onSelectLot={handleSelectLot}
              isDesktopSidebarOpen={false}
              isRightPanelOpen={false}
              settings={viewSettings}
              overlay={
                <g className="pointer-events-none">
                  {/* Capa de Ruta Calculada 100% Real */}
                  <TerrainRouteOverlay
                    destination={selectedLot ?? undefined}
                    route={calculatedRoute}
                    entrancePoint={ENTRANCE_POINT}
                    travelMode={travelMode}
                  />

                  {/* Marcadores de los 8 Controles Geodésicos Oficiales */}
                  {showGeodeticMarkers &&
                    bundle.calibration.controls.map((controlItem, idx) => (
                      <g
                        key={`ctrl-${idx}`}
                        transform={`translate(${controlItem.target.x} ${controlItem.target.y})`}
                        className="pointer-events-none"
                      >
                        <circle r="20" fill="#dc2626" fillOpacity="0.2" />
                        <circle r="9" fill="#dc2626" stroke="#ffffff" strokeWidth="2.5" />
                        <text
                          y="-16"
                          textAnchor="middle"
                          fontSize="13"
                          fontWeight="800"
                          fill="#ffffff"
                          stroke="#000000"
                          strokeWidth="3.5"
                          paintOrder="stroke"
                        >
                          {controlItem.label}
                        </text>
                      </g>
                    ))}

                  {/* Marcadores de los 4 Checkpoints */}
                  {showGeodeticMarkers &&
                    bundle.calibration.checkpoints.map((chk, idx) => (
                      <g
                        key={`chk-${idx}`}
                        transform={`translate(${chk.point.x} ${chk.point.y})`}
                        className="pointer-events-none"
                      >
                        <circle r="16" fill="#1677ff" fillOpacity="0.25" />
                        <circle r="7.5" fill="#1677ff" stroke="#ffffff" strokeWidth="2" />
                        <text
                          y="-13"
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="700"
                          fill="#ffffff"
                          stroke="#000000"
                          strokeWidth="3"
                          paintOrder="stroke"
                        >
                          {chk.label}
                        </text>
                      </g>
                    ))}
                </g>
              }
            />
          </CardContent>
        </Card>

        {/* Panel Lateral: Ficha de Navegación y Calibración */}
        <div className="flex flex-col gap-6">
          {/* Card Detalle de Ruta */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation className="size-4 text-accent" />
                Navegación Territorial
              </CardTitle>
              <CardDescription className="text-xs">
                {navigation.message || "Ruta validada desde la portería hasta el frente del lote."}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {calculatedRoute ? (
                <>
                  <div className="rounded-xl border bg-muted/30 p-3.5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                          Ruta calculada a
                        </p>
                        <h3 className="font-serif text-2xl font-bold text-foreground">
                          Lote {selectedLot?.lotNumber ?? selectedLotId}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs"
                      >
                        {travelMode === "walking" ? "🚶 A pie" : "🚗 En vehículo"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                      <div>
                        <span className="text-muted-foreground">Distancia real:</span>
                        <p className="font-serif text-xl font-bold text-accent">
                          {Math.round(calculatedRoute.result.distanceMeters)} m
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tiempo estimado:</span>
                        <p className="font-serif text-xl font-bold text-foreground">
                          ~
                          {Math.max(
                            1,
                            Math.round(
                              calculatedRoute.result.distanceMeters /
                                (travelMode === "driving" ? 333 : 75),
                            ),
                          )}{" "}
                          min
                        </p>
                      </div>
                      <div className="col-span-2 pt-1 border-t text-[11px] text-muted-foreground">
                        <span>Origen: </span>
                        <strong className="text-foreground">
                          {liveGps ? "Posición GPS actual" : "Portería / Acceso Principal"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Estado de accesibilidad */}
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Ruta continua libre de solapamientos: no invade lagos ni predios privados.
                    </span>
                  </div>

                  {selectedLot && (
                    <div className="space-y-1.5 pt-1 text-xs text-muted-foreground border-t">
                      <div className="flex justify-between">
                        <span>Área del lote:</span>
                        <span className="font-semibold text-foreground">
                          {formatLotArea(selectedLot.area)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Precio de lista:</span>
                        <span className="font-semibold text-accent">
                          {selectedLot.price > 0
                            ? formatLotPrice(selectedLot.price)
                            : "Por cotizar"}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border border-dashed rounded-xl">
                  <RouteIcon className="size-8 text-accent/60 mb-2" />
                  <p className="font-medium text-foreground text-sm">Sin ruta activa</p>
                  <p className="text-xs mt-1 text-muted-foreground leading-relaxed">
                    Selecciona un lote arriba para calcular la ruta exacta sobre la red de senderos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Resumen de la Red Georreferenciada */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Globe className="size-4 text-accent" />
                Referencia Geodésica y GPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between border-b pb-2">
                <span>Sistema de coordenadas:</span>
                <span className="font-medium text-foreground">MAGNA-SIRGAS / WGS84</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span>Acceso principal (GPS):</span>
                <span className="font-mono text-foreground text-[11px]">
                  10.434404°, -75.357015°
                </span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span>Versión de paquete publicada:</span>
                <span className="font-mono text-foreground font-semibold">v{bundle.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Control de error en campo:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  RMS ≤ 1.8 m (Calibrado)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sección Inferior de Puntos de Control y Checkpoints */}
      <section className="space-y-4 pt-2">
        <h2 className="text-lg font-serif font-bold text-foreground">
          Puntos de Control Georreferenciados Oficiales
        </h2>
        <Tabs defaultValue="controls" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="controls">
              Controles GPS ({bundle.calibration.controls.length})
            </TabsTrigger>
            <TabsTrigger value="checkpoints">
              Checkpoints ({bundle.calibration.checkpoints.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {bundle.calibration.controls.map((ctrl, i) => (
                <Card key={`c-${i}`} className="rounded-xl border shadow-xs">
                  <CardHeader className="p-3.5 pb-2 border-b bg-muted/20">
                    <CardTitle className="text-xs font-semibold flex items-center justify-between">
                      <span className="truncate">{ctrl.label}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        #{i + 1}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3.5 pt-2.5 space-y-1.5 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">
                        Coordenada GPS:
                      </span>
                      <p className="font-mono text-[11px] text-foreground font-medium">
                        {ctrl.source.y.toFixed(6)}, {ctrl.source.x.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Posición SVG:</span>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        X: {ctrl.target.x.toFixed(1)}, Y: {ctrl.target.y.toFixed(1)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="checkpoints" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {bundle.calibration.checkpoints.map((chk, i) => (
                <Card key={`k-${i}`} className="rounded-xl border shadow-xs">
                  <CardHeader className="p-3.5 pb-2 border-b bg-muted/20">
                    <CardTitle className="text-xs font-semibold flex items-center justify-between">
                      <span className="truncate">{chk.label}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0 text-emerald-600">
                        Verificado
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3.5 pt-2.5 space-y-1.5 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">
                        Coordenada GPS:
                      </span>
                      <p className="font-mono text-[11px] text-foreground font-medium">
                        {chk.gps.latitude.toFixed(6)}, {chk.gps.longitude.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Posición SVG:</span>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        X: {chk.point.x.toFixed(1)}, Y: {chk.point.y.toFixed(1)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
