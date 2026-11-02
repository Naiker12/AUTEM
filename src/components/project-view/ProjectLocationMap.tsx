import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, MapPin, Navigation, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ProjectLocationMapProps {
  lat: number;
  lng: number;
  projectName: string;
  locationName?: string;
  isDark?: boolean;
  georeferenceStatus?: "missing" | "draft" | "validated";
  boundsGeo?: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  } | null;
  className?: string;
}

type MapLayerType = "satellite" | "streets" | "hybrid";

export default function ProjectLocationMap({
  lat,
  lng,
  projectName,
  locationName = "Santa Rosa · Villanueva, Bolívar",
  isDark = false,
  georeferenceStatus = "missing",
  boundsGeo,
  className = "",
}: ProjectLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>("satellite");
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  // Initial center coordinates with fallback to Santa Rosa, Bolívar if 0
  const centerLat = lat !== 0 ? lat : 10.436829;
  const centerLng = lng !== 0 ? lng : -75.356179;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 16,
      zoomControl: false, // We render our own sleek control buttons
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Default tile layer: Esri World Imagery (High-res satellite)
    const baseTile = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Esri, Maxar, Earthstar Geographics",
      },
    ).addTo(map);
    tileLayerRef.current = baseTile;

    // Custom marker icon with AUTEM gold styling
    const customIcon = L.divIcon({
      className: "autem-leaflet-pin",
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: #c5a059;
          color: white;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.95);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          transform: translateY(-8px);
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span style="
            position: absolute;
            bottom: -6px;
            width: 8px;
            height: 8px;
            background: #c5a059;
            transform: rotate(45deg);
          "></span>
        </div>
      `,
      iconSize: [40, 48],
      iconAnchor: [20, 46],
      popupAnchor: [0, -42],
    });

    const marker = L.marker([centerLat, centerLng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: inherit; padding: 4px 6px; font-size: 13px; line-height: 1.4;">
        <strong style="display: block; font-size: 14px; font-weight: 700; color: #1c1917; margin-bottom: 2px;">
          ${projectName}
        </strong>
        <span style="color: #78716c; font-size: 12px;">${locationName}</span>
      </div>
    `);

    // If georeference boundary polygon or box is provided
    if (boundsGeo) {
      const bounds = L.latLngBounds(
        [boundsGeo.minLat, boundsGeo.minLng],
        [boundsGeo.maxLat, boundsGeo.maxLng],
      );
      L.rectangle(bounds, {
        color: "#c5a059",
        weight: 2,
        fillColor: "#c5a059",
        fillOpacity: 0.15,
        dashArray: "4, 6",
      }).addTo(map);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [centerLat, centerLng, projectName, locationName, boundsGeo]);

  // Update base tile layers when activeLayer changes
  const switchLayer = (type: MapLayerType) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (type === "satellite") {
      tileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 },
      ).addTo(map);
    } else if (type === "streets") {
      tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
    } else if (type === "hybrid") {
      tileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 },
      ).addTo(map);
      labelsLayerRef.current = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 },
      ).addTo(map);
    }

    setActiveLayer(type);
    setIsLayerMenuOpen(false);
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centerLat, centerLng], 16, { animate: true });
    }
  };

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {/* Map DOM target */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Georeference status badge */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3 py-1.5 shadow-lg backdrop-blur-md">
          <span className="relative flex size-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                georeferenceStatus === "validated" ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex size-2 rounded-full ${
                georeferenceStatus === "validated" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
          <span className="text-[11px] font-medium text-foreground">
            {georeferenceStatus === "validated"
              ? "Georreferenciación validada (SRID 3116)"
              : "Ubicación satelital del proyecto"}
          </span>
          <Badge
            variant="outline"
            className="text-[9px] uppercase tracking-wider py-0 px-1.5 border-border"
          >
            {activeLayer === "satellite"
              ? "Satélite"
              : activeLayer === "hybrid"
                ? "Híbrido"
                : "Calles"}
          </Badge>
        </div>
      </div>

      {/* Map floating controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 lg:top-20 lg:translate-y-0 z-20 flex flex-col items-center gap-2 select-none">
        {/* Layer picker popover */}
        {isLayerMenuOpen && (
          <div className="absolute right-12 top-0 w-44 rounded-xl border border-border bg-background p-2 text-foreground shadow-2xl backdrop-blur-xl">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
              Capa de mapa
            </span>
            <div className="flex flex-col gap-1 mt-1">
              <button
                type="button"
                onClick={() => switchLayer("satellite")}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeLayer === "satellite"
                    ? "bg-accent/20 text-accent font-semibold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span>Satélite HD</span>
                {activeLayer === "satellite" && <span className="text-xs">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => switchLayer("hybrid")}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeLayer === "hybrid"
                    ? "bg-accent/20 text-accent font-semibold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span>Híbrido (Calles)</span>
                {activeLayer === "hybrid" && <span className="text-xs">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => switchLayer("streets")}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeLayer === "streets"
                    ? "bg-accent/20 text-accent font-semibold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span>Mapa vectorial</span>
                {activeLayer === "streets" && <span className="text-xs">✓</span>}
              </button>
            </div>
          </div>
        )}

        <div
          className={`flex flex-col items-center gap-1 rounded-full p-1.5 shadow-2xl backdrop-blur-xl transition-colors ${
            isDark
              ? "border border-white/10 bg-stone-900/85 text-stone-200"
              : "border border-white/35 bg-white/70 text-foreground/80"
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsLayerMenuOpen((prev) => !prev)}
            className="size-8 rounded-full hover:bg-muted"
            title="Cambiar capa de mapa (Satélite, Híbrido, Calles)"
            aria-label="Capas de mapa"
          >
            <Layers className="size-4" />
          </Button>
          <div className="h-px w-4 bg-border/60" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="size-8 rounded-full hover:bg-muted"
            title="Acercar"
            aria-label="Acercar mapa"
          >
            <span className="text-base font-bold">+</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="size-8 rounded-full hover:bg-muted"
            title="Alejar"
            aria-label="Alejar mapa"
          >
            <span className="text-base font-bold">−</span>
          </Button>
          <div className="h-px w-4 bg-border/60" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRecenter}
            className="size-8 rounded-full hover:bg-muted"
            title="Centrar en el proyecto"
            aria-label="Centrar en el proyecto"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
