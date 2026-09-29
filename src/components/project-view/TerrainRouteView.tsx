import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  AlertTriangle,
  Check,
  CircleDot,
  Crosshair,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import type { Lot } from "@/data/lots";
import { villaParaisoNavigation } from "@/data/villa-paraiso-navigation";
import { Button } from "@/components/ui/button";
import { findRenderableInternalRoute } from "@/features/terrain-navigation/route-graph";
import { createLotRouteDestination } from "@/features/terrain-navigation/lot-destinations";
import MasterplanSvgViewer from "./MasterplanSvgViewer";
import type { ProjectViewSettings } from "./types";

type LocationState = "idle" | "requesting" | "ready" | "low_accuracy" | "denied" | "unavailable";

const PROJECT_ANCHOR = { lat: 10.436829, lng: -75.356179 };
const DEMO_START: [number, number] = [1050, 2150];

function distanceInMeters(lat: number, lng: number) {
  const rad = Math.PI / 180;
  const earth = 6_371_000;
  const dLat = (lat - PROJECT_ANCHOR.lat) * rad;
  const dLng = (lng - PROJECT_ANCHOR.lng) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(PROJECT_ANCHOR.lat * rad) * Math.cos(lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface TerrainRouteViewProps {
  lots: Lot[];
  selectedLot?: Lot;
  onSelectLot: (lot: Lot) => void;
  settings: ProjectViewSettings;
  isDark: boolean;
  isRightPanelOpen: boolean;
}

export default function TerrainRouteView({
  lots,
  selectedLot,
  onSelectLot,
  settings,
  isDark,
  isRightPanelOpen,
}: TerrainRouteViewProps) {
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [mobilePanelPercent, setMobilePanelPercent] = useState(56);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [isDestinationPickerOpen, setIsDestinationPickerOpen] = useState(false);
  const watchId = useRef<number | null>(null);
  const dragStartY = useRef(0);
  const dragStartPercent = useRef(56);
  const pendingPanelPercent = useRef(56);
  const panelResizeFrame = useRef<number | null>(null);
  const destinationPickerRef = useRef<HTMLDivElement>(null);

  const stopLocation = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation)
      navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setLocationState("idle");
    setAccuracy(null);
    setDistance(null);
  }, []);

  useEffect(
    () => () => {
      if (watchId.current !== null && navigator.geolocation)
        navigator.geolocation.clearWatch(watchId.current);
    },
    [],
  );

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.visibilityState === "hidden" && watchId.current !== null) stopLocation();
    };
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => document.removeEventListener("visibilitychange", stopWhenHidden);
  }, [stopLocation]);

  useEffect(
    () => () => {
      if (panelResizeFrame.current !== null) cancelAnimationFrame(panelResizeFrame.current);
    },
    [],
  );

  useEffect(() => {
    const closeDestinationPicker = (event: PointerEvent) => {
      if (!destinationPickerRef.current?.contains(event.target as Node)) {
        setIsDestinationPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeDestinationPicker);
    return () => document.removeEventListener("pointerdown", closeDestinationPicker);
  }, []);

  const requestLocation = useCallback(() => {
    if (!window.isSecureContext || !("geolocation" in navigator)) {
      setLocationState("unavailable");
      return;
    }
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setLocationState("requesting");
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextAccuracy = Math.round(position.coords.accuracy);
        setAccuracy(nextAccuracy);
        setDistance(
          Math.round(distanceInMeters(position.coords.latitude, position.coords.longitude)),
        );
        setLocationState(nextAccuracy > 60 ? "low_accuracy" : "ready");
      },
      (error) => {
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
        setLocationState(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  }, []);

  const destination = selectedLot?.centroid ? selectedLot : lots.find((lot) => lot.centroid);
  const destinationLots = useMemo(
    () => lots.filter((lot) => lot.centroid && !lot.isReserve),
    [lots],
  );
  const destinationMatches = useMemo(() => {
    const number = destinationQuery.replace(/\D/g, "");
    if (!number) return [];
    return destinationLots
      .filter((lot) => String(lot.lotNumber ?? lot.id.replace("L-", "")).includes(number))
      .slice(0, 6);
  }, [destinationLots, destinationQuery]);

  useEffect(() => {
    if (destination)
      setDestinationQuery(String(destination.lotNumber ?? destination.id.replace("L-", "")));
  }, [destination]);

  const selectDestination = (lot: Lot) => {
    onSelectLot(lot);
    setDestinationQuery(String(lot.lotNumber ?? lot.id.replace("L-", "")));
    setIsDestinationPickerOpen(false);
  };
  const hasReliableLocation = accuracy !== null && accuracy <= 75;
  const isOutsideProject = hasReliableLocation && distance !== null && distance > 750;
  const usesReferenceOrigin = !hasReliableLocation || isOutsideProject;
  const validatedRoute = useMemo(() => {
    if (!destination) return null;
    const destinationNode = createLotRouteDestination(destination);
    if (!destinationNode) return null;
    return findRenderableInternalRoute(
      villaParaisoNavigation,
      "main-entrance",
      destinationNode.id,
      "walking",
    );
  }, [destination]);
  const overlay = useMemo(() => {
    if (!destination?.centroid) return null;
    const [endX, endY] = validatedRoute
      ? [validatedRoute.destination.point.x, validatedRoute.destination.point.y]
      : destination.centroid;
    const [startX, startY] = DEMO_START;
    const controlX = Math.min(startX + 180, endX - 100);
    const controlY = Math.max(900, (startY + endY) / 2);
    const routePaths = validatedRoute?.svgPaths;
    return (
      <g
        className="pointer-events-none"
        aria-label={
          routePaths
            ? "Ruta interna validada"
            : "Ruta de demostración pendiente de validación en obra"
        }
      >
        {routePaths ? (
          routePaths.map((path, index) => (
            <g key={`${path}-${index}`}>
              <path d={path} fill="none" stroke="#ffffff" strokeWidth="18" opacity="0.9" />
              <path d={path} fill="none" stroke="#1677ff" strokeWidth="10" strokeLinecap="round" />
            </g>
          ))
        ) : (
          <>
            <path
              d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="18"
              opacity="0.9"
            />
            <path
              d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
              fill="none"
              stroke="#1677ff"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="22 15"
            />
          </>
        )}
        <g transform={`translate(${startX} ${startY})`}>
          <circle r="28" fill="#1677ff" stroke="#ffffff" strokeWidth="8" />
          <circle r="8" fill="#ffffff" />
        </g>
        <g transform={`translate(${endX} ${endY})`}>
          <circle r="25" fill="#1c2c1e" stroke="#ffffff" strokeWidth="7" />
          <path
            d="M 0 -13 C -10 -13 -15 -5 -15 3 C -15 13 0 24 0 24 C 0 24 15 13 15 3 C 15 -5 10 -13 0 -13 Z"
            fill="#c5a059"
            transform="translate(0 -4) scale(.72)"
          />
        </g>
      </g>
    );
  }, [destination, validatedRoute]);

  const distanceCopy =
    distance === null || !hasReliableLocation
      ? null
      : isOutsideProject
        ? `Estás fuera del proyecto · a ${(distance / 1000).toFixed(1)} km de la referencia.`
        : `Estás dentro o muy cerca del proyecto · a ${distance < 1000 ? `${distance} m` : `${(distance / 1000).toFixed(1)} km`} de la referencia.`;
  const locationCopy = {
    idle: "Tu ubicación permanece apagada.",
    requesting: "Solicitando permiso de ubicación…",
    ready: `GPS activo${accuracy ? ` · precisión aprox. ±${accuracy} m` : ""}.`,
    low_accuracy: "No se pudo confirmar tu ubicación con precisión. Muévete a una zona despejada.",
    denied: "No diste permiso. Puedes seguir revisando el plano.",
    unavailable: "Este navegador no puede obtener ubicación. Usa HTTPS y GPS activo.",
  }[locationState];

  const handlePanelDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 1024) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartY.current = event.clientY;
    dragStartPercent.current = mobilePanelPercent;
    setIsDraggingPanel(true);
  };

  const handlePanelDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPanel) return;
    const height = window.innerHeight || 1;
    const deltaPercent = ((dragStartY.current - event.clientY) / height) * 100;
    pendingPanelPercent.current = Math.max(
      34,
      Math.min(70, dragStartPercent.current + deltaPercent),
    );
    if (panelResizeFrame.current !== null) return;
    panelResizeFrame.current = requestAnimationFrame(() => {
      panelResizeFrame.current = null;
      setMobilePanelPercent(pendingPanelPercent.current);
    });
  };

  const handlePanelDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPanel) return;
    setIsDraggingPanel(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (panelResizeFrame.current !== null) {
      cancelAnimationFrame(panelResizeFrame.current);
      panelResizeFrame.current = null;
      setMobilePanelPercent(pendingPanelPercent.current);
    }
  };

  return (
    <div
      style={{ "--terrain-panel-height": `${mobilePanelPercent}%` } as CSSProperties}
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#e8e3da] lg:block"
    >
      <div className="relative h-[calc(100%-var(--terrain-panel-height))] min-h-[160px] w-full lg:absolute lg:inset-0 lg:h-full">
        <MasterplanSvgViewer
          settings={settings}
          lots={lots}
          selectedLotId={destination?.id ?? ""}
          focusRequest={0}
          onSelectLot={(id) => {
            const lot = lots.find(
              (item) => item.id === id || item.id.replace("L-", "") === id.replace("L-", ""),
            );
            if (lot) onSelectLot(lot);
          }}
          isDesktopSidebarOpen={false}
          isRightPanelOpen={isRightPanelOpen}
          isDark={isDark}
          overlay={overlay}
        />
      </div>

      <section className="relative z-30 h-[var(--terrain-panel-height)] w-full shrink-0 overflow-y-auto rounded-t-[28px] border-t border-white/80 bg-background/98 p-4 pb-5 shadow-[0_-18px_45px_rgba(35,31,25,.14)] backdrop-blur-xl lg:absolute lg:left-5 lg:top-[88px] lg:h-auto lg:w-[360px] lg:max-w-[380px] lg:rounded-[24px] lg:border lg:p-4 lg:pb-4 lg:shadow-[0_18px_55px_rgba(35,31,25,.18)]">
        <div
          className="-mx-4 -mt-4 mb-3 flex h-9 touch-none items-center border-b border-border/75 bg-muted/45 px-3 lg:hidden"
          onPointerDown={handlePanelDragStart}
          onPointerMove={handlePanelDragMove}
          onPointerUp={handlePanelDragEnd}
          onPointerCancel={handlePanelDragEnd}
          aria-label="Arrastra para ajustar el tamaño del panel"
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMobilePanelPercent(38);
            }}
            className="min-w-0 flex-1 text-left text-[9px] font-semibold text-muted-foreground"
          >
            Más mapa
          </button>
          <div className="flex flex-1 cursor-ns-resize flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
            <span className="h-1 w-7 rounded-full bg-muted-foreground/35" />
            Recorrido ↑
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMobilePanelPercent(68);
            }}
            className="min-w-0 flex-1 text-right text-[9px] font-semibold text-muted-foreground"
          >
            Más detalles
          </button>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              <span className="flex size-5 items-center justify-center rounded-full bg-accent/12">
                <Navigation className="size-3" />
              </span>
              Navegación interna
            </div>
            <h2 className="mt-1.5 text-[21px] font-bold tracking-tight">¿A dónde quieres ir?</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Elige un lote y prepara tu recorrido.
            </p>
          </div>
          {locationState !== "idle" && (
            <button
              onClick={stopLocation}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Detener ubicación"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-border/80 bg-muted/35 px-3 py-2.5">
          <div className="flex gap-3">
            <div className="flex w-5 flex-col items-center pt-0.5">
              <CircleDot className="size-4 text-[#1677ff]" />
              <span className="my-1 h-5 border-l border-dashed border-border" />
              <MapPin className="size-4 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Origen
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                {usesReferenceOrigin ? "Acceso principal · referencia" : "Tu ubicación"}
              </p>
              <label
                className="mt-3 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor="terrain-destination"
              >
                Buscar destino
              </label>
              <div ref={destinationPickerRef} className="relative">
                <Search className="pointer-events-none absolute left-0 top-3 size-4 text-muted-foreground" />
                <input
                  id="terrain-destination"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={destinationQuery}
                  placeholder="Escribe el número del lote"
                  onFocus={(event) => {
                    event.currentTarget.select();
                    setIsDestinationPickerOpen(true);
                  }}
                  onChange={(event) => {
                    setDestinationQuery(event.target.value);
                    setIsDestinationPickerOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && destinationMatches[0]) {
                      event.preventDefault();
                      selectDestination(destinationMatches[0]);
                    }
                    if (event.key === "Escape") setIsDestinationPickerOpen(false);
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-transparent bg-transparent py-1 pl-6 pr-2 text-sm font-bold outline-none placeholder:text-xs placeholder:font-medium placeholder:text-muted-foreground focus:border-accent/30 focus:bg-background focus:text-accent"
                />
                {isDestinationPickerOpen && destinationQuery.replace(/\D/g, "") && (
                  <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-border bg-background p-1 shadow-xl">
                    {destinationMatches.length > 0 ? (
                      destinationMatches.map((lot) => (
                        <button
                          key={lot.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectDestination(lot)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted"
                        >
                          <span>
                            <strong>Lote {lot.lotNumber}</strong>{" "}
                            <span className="text-muted-foreground">· {lot.manzana}</span>
                          </span>
                          {destination?.id === lot.id && <Check className="size-3.5 text-accent" />}
                        </button>
                      ))
                    ) : (
                      <p className="px-2.5 py-2 text-xs text-muted-foreground">
                        No encontramos ese lote.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Destino actual · Lote {destination?.lotNumber ?? "—"}
                {destination?.manzana ? ` · Manzana ${destination.manzana}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`mt-3 rounded-2xl border p-3 text-xs ${
            isOutsideProject || locationState === "low_accuracy"
              ? "border-amber-200 bg-amber-50/85 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100"
              : "border-sky-200/70 bg-sky-50/80 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-100"
          }`}
        >
          <div className="flex gap-2">
            <LocateFixed
              className={`mt-0.5 size-4 shrink-0 ${
                isOutsideProject || locationState === "low_accuracy"
                  ? "text-amber-600"
                  : "text-sky-600"
              }`}
            />
            <span>{locationCopy}</span>
          </div>
          {distanceCopy && <p className="mt-1 pl-6 text-[11px] opacity-80">{distanceCopy}</p>}
        </div>

        {locationState === "idle" ? (
          <Button
            type="button"
            onClick={requestLocation}
            className="mt-3 h-11 w-full rounded-xl bg-[#1c2c1e] text-white shadow-lg shadow-[#1c2c1e]/15 hover:bg-[#304734]"
          >
            <Crosshair className="mr-2 size-4" /> Activar mi ubicación
          </Button>
        ) : null}
        <div className="mt-3 flex gap-2 border-t border-border/70 pt-3 text-[10px] leading-relaxed text-muted-foreground">
          <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
          <span>
            {validatedRoute
              ? "Ruta interna validada: verifica siempre la señalización en obra."
              : "Ruta ilustrativa: verifica siempre la señalización en obra."}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-muted-foreground lg:hidden">
          <ShieldCheck className="size-3.5 text-emerald-600" /> GPS no se guarda ni se envía en esta
          fase
        </div>
      </section>

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden items-center gap-2 rounded-full border border-white/60 bg-background/90 px-3 py-2 text-[10px] font-medium shadow-lg backdrop-blur lg:flex">
        <ShieldCheck className="size-3.5 text-emerald-600" /> GPS no se guarda ni se envía en esta
        fase
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 z-20 hidden items-center gap-1.5 rounded-full border border-white/60 bg-background/90 px-3 py-2 text-[10px] font-semibold shadow-lg backdrop-blur lg:flex">
        <MapPin className="size-3.5 text-accent" /> Lote {destination?.lotNumber ?? "—"}
      </div>
    </div>
  );
}
