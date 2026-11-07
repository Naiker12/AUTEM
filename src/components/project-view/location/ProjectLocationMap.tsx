import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
if (typeof window !== "undefined") {
  (window as unknown as { L: typeof L }).L = L;
}
import "leaflet-rotate";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  EyeOff,
  Hash,
  Layers,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatLotArea,
  formatLotDetail,
  formatLotPrice,
  LOT_STYLE,
  type Lot,
} from "@/features/lots";
import cadReference from "@/data/villa-paraiso/cad-reference.json";
import villaParaisoGeoJson from "@/data/villa-paraiso/generated/geojson.json";
import {
  VILLA_PARAISO_SURROUNDINGS,
  POI_CATEGORIES,
  type PointOfInterest,
  type PoiCategoryFilter,
} from "@/data/villa-paraiso/surroundings";
import type { TravelMode } from "@/features/terrain-navigation/types";
import type { RenderableInternalRoute } from "@/features/terrain-navigation/route-graph";
import proj4 from "proj4";

// Setup EPSG:3116 (MAGNA-SIRGAS / Colombia Bogotá zone)
proj4.defs(
  "EPSG:3116",
  "+proj=tmerc +lat_0=4.596200417 +lon_0=-74.07750791 +k=1 +x_0=1000000 +y_0=1000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

const cadT = cadReference.transform;
const cadDet = cadT.a * cadT.e - cadT.b * cadT.d;

function svgToGpsLatLng(x: number, y: number): [number, number] {
  const dx = x - cadT.c;
  const dy = y - cadT.f;
  const cadX = (cadT.e * dx - cadT.b * dy) / cadDet;
  const cadY = (-cadT.d * dx + cadT.a * dy) / cadDet;
  const [lon, lat] = proj4("EPSG:3116", "EPSG:4326", [cadX, cadY]);
  return [lat, lon];
}

function parseSvgPathToLatLngs(pathStr: string): [number, number][] {
  const points: [number, number][] = [];
  const re = /([ML])\s*([\d.-]+)\s+([\d.-]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(pathStr)) !== null) {
    const x = parseFloat(match[2]);
    const y = parseFloat(match[3]);
    if (!isNaN(x) && !isNaN(y)) {
      points.push(svgToGpsLatLng(x, y));
    }
  }
  return points;
}

function getLotGpsLatLng(lot: Lot): [number, number] | null {
  if (!lot.centroid) return null;
  const [c0, c1] = lot.centroid;
  // If already GPS [lat, lon]: lat is ~10.4, lon is ~-75.3
  if (Math.abs(c0) <= 90 && Math.abs(c1) <= 180) {
    return [c0, c1];
  }
  // Otherwise, it's SVG CAD coordinates [x, y], so convert with svgToGpsLatLng:
  try {
    const [lat, lon] = svgToGpsLatLng(c0, c1);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return [lat, lon];
    }
  } catch {
    return null;
  }
  return null;
}

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
  projectSlug?: string;
  lots?: Lot[];
  selectedLotId?: string;
  onSelectLot?: (lot: Lot) => void;
  showMasterplanOverlayDefault?: boolean;
  defaultShowSurroundings?: boolean;
  route?: RenderableInternalRoute | null;
  fromGps?: boolean;
  userGpsPosition?: GeolocationCoordinates | null;
  userHeading?: number | null;
  enableHeadingRotation?: boolean;
  showRouteLine?: boolean;
  hideSurroundingsDrawer?: boolean;
  hideGeoreferenceBadge?: boolean;
  travelMode?: TravelMode;
  destinationLot?: Lot;
  focusRequest?: number;
}

function getPoiCategoryMeta(category: PointOfInterest["category"]) {
  switch (category) {
    case "nature":
      return {
        color: "#10b981",
        border: "rgba(16, 185, 129, 0.4)",
        bg: "rgba(16, 185, 129, 0.15)",
        emoji: "🌿",
        label: "Naturaleza",
      };
    case "airport":
      return {
        color: "#0ea5e9",
        border: "rgba(14, 165, 233, 0.4)",
        bg: "rgba(14, 165, 233, 0.15)",
        emoji: "✈️",
        label: "Aeropuerto",
      };
    case "transport":
      return {
        color: "#6366f1",
        border: "rgba(99, 102, 241, 0.4)",
        bg: "rgba(99, 102, 241, 0.15)",
        emoji: "🚗",
        label: "Movilidad",
      };
    case "beach":
      return {
        color: "#f59e0b",
        border: "rgba(245, 158, 11, 0.4)",
        bg: "rgba(245, 158, 11, 0.15)",
        emoji: "🏖️",
        label: "Playas",
      };
    case "leisure":
      return {
        color: "#a855f7",
        border: "rgba(168, 85, 247, 0.4)",
        bg: "rgba(168, 85, 247, 0.15)",
        emoji: "🛍️",
        label: "Ocio & Club",
      };
    case "town":
    default:
      return {
        color: "#94a3b8",
        border: "rgba(148, 163, 184, 0.4)",
        bg: "rgba(148, 163, 184, 0.15)",
        emoji: "🏙️",
        label: "Municipio",
      };
  }
}

function createPoiPopupHtml(poi: PointOfInterest, originLat: number, originLng: number) {
  const meta = getPoiCategoryMeta(poi.category);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${poi.lat},${poi.lng}`;
  const benefitsHtml = poi.keyBenefits
    .map(
      (b) => `
        <li style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 4px; font-size: 11px; line-height: 1.35; color: #cbd5e1;">
          <span style="color: ${meta.color}; font-weight: bold;">•</span>
          <span>${b}</span>
        </li>
      `,
    )
    .join("");

  return `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; color: #f8fafc; padding: 2px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 2px 8px;
          border-radius: 9999px;
          background: ${meta.bg};
          color: ${meta.color};
          border: 1px solid ${meta.border};
        ">
          <span>${meta.emoji}</span>
          <span>${poi.categoryLabel}</span>
        </span>
        <span style="
          font-size: 10.5px;
          font-weight: 700;
          color: #facc15;
          background: rgba(250, 204, 21, 0.12);
          border: 1px solid rgba(250, 204, 21, 0.3);
          padding: 2px 7px;
          border-radius: 9999px;
        ">
          ${poi.travelTime}
        </span>
      </div>

      <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">
        ${poi.name}
      </h3>

      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 600; color: #94a3b8;">
          Distancia: <strong style="color: #e2e8f0;">${poi.distanceKm} km</strong>
        </span>
        <span style="font-size: 10px; color: #64748b;">•</span>
        <span style="font-size: 10.5px; font-weight: 600; color: #38bdf8;">
          ${poi.highlightTag}
        </span>
      </div>

      <p style="margin: 0 0 10px; font-size: 11.5px; line-height: 1.45; color: #94a3b8;">
        ${poi.description}
      </p>

      <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 8px; margin-bottom: 10px;">
        <span style="display: block; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 5px;">
          Ventajas y conectividad
        </span>
        <ul style="margin: 0; padding: 0; list-style: none;">
          ${benefitsHtml}
        </ul>
      </div>

      <a
        href="${googleMapsUrl}"
        target="_blank"
        rel="noopener noreferrer"
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 7px 12px;
          border-radius: 8px;
          background: #2563eb;
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
        "
      >
        <span>Cómo llegar con Google Maps</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </a>
    </div>
  `;
}

type MapLayerType = "satellite" | "streets" | "hybrid";

interface MasterplanProperties {
  kind: "lot" | "water" | "road";
  id?: string;
  lotNumber?: number;
  label?: string;
  manzana?: string;
  areaM2?: number;
  ubicacion?: string;
  price?: number;
  pricePreVenta?: number;
  cuotaInicial?: number;
  cuotaMensual?: number;
  status?: string;
  name?: string;
  centroid?: [number, number];
}

function getStatusBadgeHtml(status: string) {
  const s = status.toLowerCase();
  let bg = "rgba(16, 185, 129, 0.15)";
  let color = "#059669";
  let border = "rgba(16, 185, 129, 0.35)";
  let text = "Disponible";

  if (s.includes("vend")) {
    bg = "rgba(239, 68, 68, 0.15)";
    color = "#dc2626";
    border = "rgba(239, 68, 68, 0.35)";
    text = "Vendido";
  } else if (s.includes("res")) {
    bg = "rgba(245, 158, 11, 0.15)";
    color = "#d97706";
    border = "rgba(245, 158, 11, 0.35)";
    text = "Reservado";
  } else if (s.includes("conf") || s.includes("hid")) {
    bg = "rgba(148, 163, 184, 0.15)";
    color = "#475569";
    border = "rgba(148, 163, 184, 0.35)";
    text = "Por confirmar";
  }

  return `
    <span style="
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      background: ${bg};
      color: ${color};
      border: 1px solid ${border};
    ">
      ${text}
    </span>
  `;
}

export default function ProjectLocationMap({
  lat,
  lng,
  projectName,
  locationName = "Santa Rosa · Villanueva, Bolívar",
  isDark = false,
  georeferenceStatus = "missing",
  boundsGeo,
  className = "",
  projectSlug = "villa-paraiso",
  lots = [],
  selectedLotId,
  onSelectLot,
  showMasterplanOverlayDefault = true,
  defaultShowSurroundings = false,
  route,
  fromGps = false,
  userGpsPosition,
  userHeading = null,
  enableHeadingRotation = true,
  showRouteLine = false,
  hideSurroundingsDrawer = false,
  hideGeoreferenceBadge = false,
  destinationLot,
  focusRequest,
}: ProjectLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const masterplanLayerRef = useRef<L.GeoJSON | null>(null);
  const lotNumbersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const surroundingsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const connectionLineLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>("satellite");
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [showMasterplan, setShowMasterplan] = useState(showMasterplanOverlayDefault);
  const [showLotNumbers, setShowLotNumbers] = useState(true);
  const [masterplanOpacity, setMasterplanOpacity] = useState<number>(0.85);

  const [showSurroundings, setShowSurroundings] = useState(defaultShowSurroundings);
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null);
  const [poiCategory, setPoiCategory] = useState<PoiCategoryFilter>("all");
  const [isPoiPanelCollapsed, setIsPoiPanelCollapsed] = useState(true);

  const [navBearingMode, setNavBearingMode] = useState<"heading" | "north">("heading");
  const [isUserPanning, setIsUserPanning] = useState(false);
  const currentBearingRef = useRef<number>(0);

  const isParaiso =
    projectSlug === "villa-paraiso" ||
    projectSlug === "lotes-360" ||
    projectName.toLowerCase().includes("paraiso");

  // Center coordinates fallback to Santa Rosa de Lima
  const centerLat = lat !== 0 ? lat : 10.436829;
  const centerLng = lng !== 0 ? lng : -75.356179;

  const filteredPois = useMemo(() => {
    return VILLA_PARAISO_SURROUNDINGS.filter((p) =>
      poiCategory === "all" ? true : p.category === poiCategory,
    );
  }, [poiCategory]);

  // Map of live lots for dynamic price/status binding
  const lotsMap = useMemo(() => {
    const map = new Map<string, Lot>();
    for (const lot of lots) {
      map.set(lot.id, lot);
    }
    return map;
  }, [lots]);

  // Global callback for Leaflet popup button clicks
  useEffect(() => {
    (window as unknown as { __AUTEM_SELECT_LOT__?: (id: string) => void }).__AUTEM_SELECT_LOT__ = (
      id: string,
    ) => {
      const matched = lotsMap.get(id);
      if (matched) {
        onSelectLot?.(matched);
      }
    };
    return () => {
      delete (window as unknown as { __AUTEM_SELECT_LOT__?: (id: string) => void })
        .__AUTEM_SELECT_LOT__;
    };
  }, [lotsMap, onSelectLot]);

  // Helper to compute style for each feature
  const getFeatureStyle = useCallback(
    (
      feature: GeoJSON.Feature<GeoJSON.Geometry, MasterplanProperties>,
      isSelected: boolean,
      opacityMultiplier: number,
    ): L.PathOptions => {
      const props = feature.properties;
      if (props.kind === "water") {
        return {
          fillColor: "#0284c7",
          fillOpacity: Math.min(1, 0.42 * opacityMultiplier),
          color: "#38bdf8",
          weight: 1.8,
          opacity: Math.min(1, 0.9 * opacityMultiplier),
        };
      }

      if (props.kind === "road") {
        return {
          fillColor: "#64748b",
          fillOpacity: Math.min(1, 0.18 * opacityMultiplier),
          color: "#f8fafc",
          weight: 1.2,
          opacity: Math.min(1, 0.75 * opacityMultiplier),
          dashArray: "3, 4",
        };
      }

      // Kind === "lot"
      const lotId = props.id || "";
      const liveLot = lotsMap.get(lotId);
      const status = liveLot?.status ?? props.status ?? "Disponible";

      if (isSelected) {
        return {
          fillColor: "#c5a059",
          fillOpacity: Math.min(1, 0.65 * opacityMultiplier),
          color: "#ffffff",
          weight: 3.5,
          opacity: 1,
        };
      }

      const s = status.toLowerCase();
      let token = LOT_STYLE.Disponible;
      if (s.includes("vend")) {
        token = LOT_STYLE.Vendido;
      } else if (s.includes("res")) {
        token = LOT_STYLE.Reservado;
      } else if (s.includes("conf") || s.includes("hid")) {
        token = LOT_STYLE["Por confirmar"];
      }

      return {
        fillColor: token.baseHex,
        fillOpacity: Math.min(1, token.fillAlpha * opacityMultiplier),
        color: token.strokeColor,
        weight: 1.3,
        opacity: Math.min(1, 0.85 * opacityMultiplier),
      };
    },
    [lotsMap],
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 16.5,
      minZoom: 11,
      maxZoom: 19,
      maxBounds: [
        [10.2, -75.65],
        [10.65, -75.15],
      ],
      maxBoundsViscosity: 0.5,
      preferCanvas: true,
      rotate: true,
      bearing: 0,
      rotateControl: false,
      touchRotate: true,
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
    });
    mapInstanceRef.current = map;

    // Observe container resizing to keep tiles sharp and coordinates perfectly synced
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    map.on("dragstart", () => {
      setIsUserPanning(true);
    });

    // Default base layer: Satélite de alta resolución con soporte de zoom profundo hasta nivel 20
    const baseTile = L.tileLayer("https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
      subdomains: ["0", "1", "2", "3"],
      maxZoom: 20,
      maxNativeZoom: 19,
      attribution: "Google Satellite",
    }).addTo(map);
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
          width: 38px;
          height: 38px;
          background: #c5a059;
          color: white;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.95);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          transform: translateY(-8px);
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span style="
            position: absolute;
            bottom: -5px;
            width: 8px;
            height: 8px;
            background: #c5a059;
            transform: rotate(45deg);
          "></span>
        </div>
      `,
      iconSize: [38, 46],
      iconAnchor: [19, 44],
      popupAnchor: [0, -40],
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

    // Masterplan GeoJSON Layer for Villa Paraíso
    if (isParaiso && villaParaisoGeoJson) {
      const geoLayer = L.geoJSON(villaParaisoGeoJson as GeoJSON.GeoJsonObject, {
        style: (feature) => {
          if (!feature) return {};
          const isSelected = (feature.properties as MasterplanProperties)?.id === selectedLotId;
          return getFeatureStyle(
            feature as GeoJSON.Feature<GeoJSON.Geometry, MasterplanProperties>,
            isSelected,
            masterplanOpacity,
          );
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties as MasterplanProperties;
          if (props.kind === "water") {
            layer.bindTooltip(props.name || "Lago", {
              sticky: true,
              className: "autem-map-tooltip",
            });
            return;
          }
          if (props.kind === "road") {
            return;
          }

          const lotId = props.id || "";
          const liveLot = lotsMap.get(lotId);
          const status = liveLot?.status ?? props.status ?? "Disponible";
          const area = liveLot?.area ?? props.areaM2 ?? 0;
          const price = liveLot?.price ?? props.price ?? 0;
          const manzana = liveLot?.manzana ?? props.manzana ?? "";
          const lotNumber = liveLot?.lotNumber ?? props.lotNumber ?? "";

          // Fast hover tooltip
          layer.bindTooltip(`Lote ${lotNumber} · ${status} · ${formatLotArea(area)}`, {
            sticky: true,
            className: "autem-map-tooltip",
          });

          // Interactive hover & click
          layer.on({
            mouseover: (e) => {
              const target = e.target as L.Path;
              target.setStyle({
                weight: 2.8,
                color: "#ffffff",
                fillOpacity: Math.min(0.7, 0.48 * masterplanOpacity),
              });
              target.bringToFront();
            },
            mouseout: (e) => {
              const isSelected = lotId === selectedLotId;
              const target = e.target as L.Path;
              target.setStyle(
                getFeatureStyle(
                  feature as GeoJSON.Feature<GeoJSON.Geometry, MasterplanProperties>,
                  isSelected,
                  masterplanOpacity,
                ),
              );
            },
            click: () => {
              setIsUserPanning(false);
              const lotToSelect: Lot = liveLot ?? {
                id: lotId,
                projectSlug,
                area,
                price,
                status: status as Lot["status"],
                detail: formatLotDetail(manzana ? manzana.replace(/^M\s*/i, "") : undefined, false),
                terrainPosition: [0, 0],
                centroid: props.centroid ? [props.centroid[1], props.centroid[0]] : undefined,
                manzana,
                lotNumber:
                  typeof lotNumber === "number" ? lotNumber : parseInt(String(lotNumber), 10) || 0,
                isReserve: false,
              };
              onSelectLot?.(lotToSelect);
            },
          });

          // Rich popup on click
          const popupHtml = `
            <div style="font-family: inherit; min-width: 200px; padding: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 15px; font-weight: 700; color: #1c1917; letter-spacing: -0.01em;">
                  Lote ${lotNumber}
                </span>
                ${getStatusBadgeHtml(status)}
              </div>
              <div style="font-size: 11px; color: #78716c; margin-bottom: 8px;">
                ${manzana ? manzana + " · " : ""}${props.ubicacion || "Lote Campestre"}
              </div>
              <div style="background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 8px 10px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                  <span style="color: #78716c;">Área:</span>
                  <strong style="color: #1c1917;">${formatLotArea(area)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                  <span style="color: #78716c;">Precio total:</span>
                  <strong style="color: #c5a059; font-weight: 700;">${formatLotPrice(price)}</strong>
                </div>
              </div>
              <button
                type="button"
                onclick="window.__AUTEM_SELECT_LOT__ && window.__AUTEM_SELECT_LOT__('${lotId}')"
                style="
                  width: 100%;
                  border: none;
                  background: #c5a059;
                  color: white;
                  padding: 7px 12px;
                  border-radius: 7px;
                  font-size: 11px;
                  font-weight: 600;
                  cursor: pointer;
                  box-shadow: 0 2px 8px rgba(197, 160, 89, 0.35);
                  transition: opacity 0.15s ease;
                "
              >
                Ver lote en panel
              </button>
            </div>
          `;
          layer.bindPopup(popupHtml, {
            className: "autem-leaflet-popup",
            offset: [0, -8],
            autoPan: true,
            autoPanPaddingTopLeft: L.point(40, 90),
            autoPanPaddingBottomRight: L.point(40, 40),
          });
        },
      });

      masterplanLayerRef.current = geoLayer;
      if (showMasterplan) {
        geoLayer.addTo(map);
      }

      // Initial framing: fit bounds to masterplan with comfortable margins
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
      }
    } else if (boundsGeo) {
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
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      masterplanLayerRef.current = null;
      lotNumbersLayerRef.current = null;
      routeLayerGroupRef.current = null;
      surroundingsLayerGroupRef.current = null;
      connectionLineLayerGroupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLat, centerLng, projectName, locationName, boundsGeo, isParaiso, projectSlug]);

  // Synchronize masterplan layer visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    const geoLayer = masterplanLayerRef.current;
    if (!map || !geoLayer) return;

    if (showMasterplan) {
      if (!map.hasLayer(geoLayer)) {
        geoLayer.addTo(map);
      }
    } else {
      if (map.hasLayer(geoLayer)) {
        map.removeLayer(geoLayer);
      }
    }
  }, [showMasterplan]);

  // Synchronize selection and opacity dynamically without rebuilding the layer
  useEffect(() => {
    const geoLayer = masterplanLayerRef.current;
    if (!geoLayer) return;

    geoLayer.eachLayer((layer) => {
      const pathLayer = layer as L.Path & {
        feature?: GeoJSON.Feature<GeoJSON.Geometry, MasterplanProperties>;
      };
      const feature = pathLayer.feature;
      if (!feature) return;

      const isSelected = feature.properties?.id === selectedLotId;
      pathLayer.setStyle(getFeatureStyle(feature, isSelected, masterplanOpacity));
      if (isSelected) {
        pathLayer.bringToFront();
      }
    });
  }, [selectedLotId, masterplanOpacity, getFeatureStyle]);

  // Synchronize lot numbers overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isParaiso || !villaParaisoGeoJson) return;

    if (!lotNumbersLayerRef.current) {
      lotNumbersLayerRef.current = L.layerGroup();
    }
    const group = lotNumbersLayerRef.current;
    group.clearLayers();

    if (showMasterplan && showLotNumbers) {
      const features = (
        villaParaisoGeoJson as {
          features: GeoJSON.Feature<GeoJSON.Geometry, MasterplanProperties>[];
        }
      ).features;
      for (const f of features) {
        if (f.properties?.kind !== "lot" || !f.properties?.centroid) continue;
        const [lon, lat] = f.properties.centroid;
        const isSelected = f.properties.id === selectedLotId;
        const num = f.properties.lotNumber;
        if (!num) continue;

        const icon = L.divIcon({
          className: "autem-lot-number-marker",
          html: `<span class="autem-lot-num ${isSelected ? "selected" : ""}">${num}</span>`,
          iconSize: [26, 16],
          iconAnchor: [13, 8],
        });
        L.marker([lat, lon], { icon, interactive: false }).addTo(group);
      }

      if (!map.hasLayer(group)) {
        group.addTo(map);
      }
    } else {
      if (map.hasLayer(group)) {
        map.removeLayer(group);
      }
    }
  }, [showMasterplan, showLotNumbers, selectedLotId, isParaiso]);

  // Synchronize Navigation Route on the roads
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!routeLayerGroupRef.current) {
      routeLayerGroupRef.current = L.layerGroup().addTo(map);
    }
    const group = routeLayerGroupRef.current;
    group.clearLayers();

    if (!route || !route.svgPaths || route.svgPaths.length === 0) return;

    const allPts: [number, number][] = [];
    for (const segStr of route.svgPaths) {
      const segPts = parseSvgPathToLatLngs(segStr);
      for (const pt of segPts) {
        if (
          allPts.length === 0 ||
          allPts[allPts.length - 1][0] !== pt[0] ||
          allPts[allPts.length - 1][1] !== pt[1]
        ) {
          allPts.push(pt);
        }
      }
    }

    if (allPts.length < 2) return;

    // Connect from user GPS location if live GPS is active
    if (fromGps && userGpsPosition) {
      allPts.unshift([userGpsPosition.latitude, userGpsPosition.longitude]);
    }

    if (showRouteLine) {
      // 1. Outer Glow Polyline
      L.polyline(allPts, {
        color: "#1d4ed8",
        weight: 9,
        opacity: 0.5,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(group);

      // 2. Main Navigation Blue Polyline
      L.polyline(allPts, {
        color: "#2563eb",
        weight: 5.5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(group);

      // 3. Inner White Dashed Core
      L.polyline(allPts, {
        color: "#ffffff",
        weight: 2.2,
        dashArray: "6, 8",
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(group);
    }

    // Start Marker (Origin: GPS Blue Dot or Portería)
    const startPt = allPts[0];
    if (fromGps && userGpsPosition) {
      const headingConeHtml =
        userHeading !== null && userHeading !== undefined
          ? `<div style="
              position: absolute;
              top: 50%;
              left: 50%;
              width: 0;
              height: 0;
              border-left: 18px solid transparent;
              border-right: 18px solid transparent;
              border-top: 42px solid rgba(37, 99, 235, 0.42);
              transform-origin: 50% 0%;
              transform: translate(-50%, -50%) rotate(${userHeading}deg) translateY(-22px);
              pointer-events: none;
            "></div>`
          : "";

      const gpsIcon = L.divIcon({
        className: "autem-gps-marker",
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            ${headingConeHtml}
            <span class="autem-gps-ping" style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(59, 130, 246, 0.45);"></span>
            <span style="position: relative; width: 15px; height: 15px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.5);"></span>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      L.marker(startPt, { icon: gpsIcon, zIndexOffset: 1000 }).addTo(group);

      if (userGpsPosition.accuracy && userGpsPosition.accuracy <= 40) {
        L.circle(startPt, {
          radius: userGpsPosition.accuracy,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(group);
      }
    } else {
      const porteriaIcon = L.divIcon({
        className: "autem-porteria-marker",
        html: `
          <div style="display: flex; align-items: center; gap: 5px; background: #0f172a; color: #f8fafc; border: 2px solid #ffffff; padding: 4px 9px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.45); font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #38bdf8;"></span>
            <span>Portería</span>
          </div>
        `,
        iconSize: [86, 26],
        iconAnchor: [43, 13],
      });
      L.marker(startPt, { icon: porteriaIcon, zIndexOffset: 900 }).addTo(group);
    }

    // Destination Marker
    const endPt = allPts[allPts.length - 1];
    const lotNum = destinationLot?.lotNumber ?? route.destination.label.replace("Lote ", "");
    const distanceFormatted = `${Math.round(route.result.distanceMeters)} m`;
    const destIcon = L.divIcon({
      className: "autem-destination-marker",
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-100%);">
          <div style="display: flex; align-items: center; gap: 6px; background: #c5a059; color: #ffffff; border: 2px solid #ffffff; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 6px 18px rgba(0,0,0,0.5); font-size: 11.5px; font-weight: 800; white-space: nowrap;">
            <span>Lote ${lotNum}</span>
            <span style="background: rgba(0,0,0,0.22); padding: 1px 6px; border-radius: 9999px; font-size: 10px; font-weight: 700;">${distanceFormatted}</span>
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #c5a059;"></div>
        </div>
      `,
      iconSize: [120, 36],
      iconAnchor: [60, 0],
    });
    L.marker(endPt, { icon: destIcon, zIndexOffset: 950 }).addTo(group);

    // Frame the active route if not user panning
    if (!isUserPanning) {
      const bounds = L.latLngBounds(allPts);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17.5 });
      }
    }
  }, [route, fromGps, userGpsPosition, userHeading, destinationLot, showRouteLine, isUserPanning]);

  // Uber-style auto-rotation (heading up) or fixed north
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (navBearingMode === "north") {
      if (currentBearingRef.current !== 0) {
        currentBearingRef.current = 0;
        map.setBearing(0);
      }
      return;
    }

    if (
      enableHeadingRotation &&
      !isUserPanning &&
      userHeading !== null &&
      userHeading !== undefined &&
      Number.isFinite(userHeading)
    ) {
      const targetBearing = (-userHeading + 360) % 360;
      const diff = Math.abs(currentBearingRef.current - targetBearing);
      if (diff > 2 && diff < 358) {
        currentBearingRef.current = targetBearing;
        map.setBearing(targetBearing);
      }
    }
  }, [userHeading, navBearingMode, isUserPanning, enableHeadingRotation]);

  // Auto-center on live GPS position while user is walking
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || isUserPanning || !fromGps || !userGpsPosition) return;
    map.panTo([userGpsPosition.latitude, userGpsPosition.longitude], {
      animate: true,
      duration: 0.6,
    });
  }, [userGpsPosition, fromGps, isUserPanning]);

  // Recenter / Focus handler
  useEffect(() => {
    if (!focusRequest) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsUserPanning(false);

    if (route && route.svgPaths && route.svgPaths.length > 0) {
      const allPts: [number, number][] = [];
      for (const segStr of route.svgPaths) {
        const segPts = parseSvgPathToLatLngs(segStr);
        for (const pt of segPts) allPts.push(pt);
      }
      if (allPts.length >= 2) {
        map.fitBounds(L.latLngBounds(allPts), { padding: [60, 60], maxZoom: 17.5 });
        return;
      }
    }

    if (destinationLot) {
      const pt = getLotGpsLatLng(destinationLot);
      if (pt && Number.isFinite(pt[0]) && Number.isFinite(pt[1])) {
        map.setView(pt, 17.5, { animate: true });
      }
    }
  }, [focusRequest, route, destinationLot]);

  // Synchronize POIs / Surroundings layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!surroundingsLayerGroupRef.current) {
      surroundingsLayerGroupRef.current = L.layerGroup().addTo(map);
    }
    if (!connectionLineLayerGroupRef.current) {
      connectionLineLayerGroupRef.current = L.layerGroup().addTo(map);
    }

    const group = surroundingsLayerGroupRef.current;
    const lineGroup = connectionLineLayerGroupRef.current;
    group.clearLayers();
    lineGroup.clearLayers();

    if (!showSurroundings || !isParaiso) {
      return;
    }

    // Filter POIs by category
    const listToRender = VILLA_PARAISO_SURROUNDINGS.filter((poi) =>
      poiCategory === "all" ? true : poi.category === poiCategory,
    );

    for (const poi of listToRender) {
      const isSelected = selectedPoi?.id === poi.id;
      const meta = getPoiCategoryMeta(poi.category);

      const poiIcon = L.divIcon({
        className: "autem-poi-container",
        html: `
          <div class="autem-poi-marker ${isSelected ? "is-selected" : ""}" data-poi-id="${poi.id}">
            <div class="autem-poi-badge" style="border-color: ${isSelected ? "#facc15" : meta.color};">
              <span class="autem-poi-icon">${meta.emoji}</span>
              <span class="autem-poi-label">${poi.shortName}</span>
              <span class="autem-poi-tag">${poi.travelTime}</span>
            </div>
            <div class="autem-poi-pin" style="background: ${isSelected ? "#facc15" : meta.color};"></div>
            <div class="autem-poi-dot" style="background: ${isSelected ? "#facc15" : meta.color};"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([poi.lat, poi.lng], {
        icon: poiIcon,
        zIndexOffset: isSelected ? 1200 : 800,
      });

      const popupContent = createPoiPopupHtml(poi, centerLat, centerLng);
      marker.bindPopup(popupContent, {
        className: "autem-leaflet-popup",
        offset: [0, -28],
        autoPan: true,
        autoPanPaddingTopLeft: L.point(40, 100),
        autoPanPaddingBottomRight: L.point(40, 40),
        maxWidth: 320,
      });

      marker.on("click", () => {
        setSelectedPoi(poi);
      });

      marker.addTo(group);

      if (isSelected) {
        marker.openPopup();
      }
    }

    // If a POI is selected, draw direct geodesic line with distance pill
    if (selectedPoi) {
      const meta = getPoiCategoryMeta(selectedPoi.category);
      const startPt: [number, number] = [centerLat, centerLng];
      const endPt: [number, number] = [selectedPoi.lat, selectedPoi.lng];

      const polyline = L.polyline([startPt, endPt], {
        color: meta.color,
        weight: 2.5,
        opacity: 0.85,
        dashArray: "6, 8",
      });
      polyline.addTo(lineGroup);

      // Midpoint distance pill
      const midLat = (startPt[0] + endPt[0]) / 2;
      const midLng = (startPt[1] + endPt[1]) / 2;
      const midIcon = L.divIcon({
        className: "autem-poi-line-container",
        html: `
          <div style="transform: translate(-50%, -50%); pointer-events: none;">
            <div style="display: flex; align-items: center; gap: 4px; background: rgba(15, 23, 42, 0.94); color: #f8fafc; border: 1.5px solid ${meta.color}; padding: 2px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); font-size: 10px; font-weight: 700; white-space: nowrap;">
              <span>${selectedPoi.distanceKm} km directos</span>
              <span style="opacity: 0.5;">·</span>
              <span style="color: #facc15;">${selectedPoi.travelTime}</span>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([midLat, midLng], { icon: midIcon, zIndexOffset: 850 }).addTo(lineGroup);
    }
  }, [showSurroundings, isParaiso, poiCategory, selectedPoi, centerLat, centerLng]);

  const handleSelectPoi = (poi: PointOfInterest) => {
    setSelectedPoi(poi);
    const map = mapInstanceRef.current;
    if (!map) return;
    const bounds = L.latLngBounds([
      [centerLat, centerLng],
      [poi.lat, poi.lng],
    ]);
    map.fitBounds(bounds, {
      padding: [100, 100],
      maxZoom: 14,
      animate: true,
      duration: 1.2,
    });
  };

  const handleFitAllSurroundings = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const coords: [number, number][] = [
      [centerLat, centerLng],
      ...VILLA_PARAISO_SURROUNDINGS.map((p) => [p.lat, p.lng] as [number, number]),
    ];
    map.fitBounds(L.latLngBounds(coords), {
      padding: [60, 60],
      animate: true,
      duration: 1.2,
    });
  };

  const handleFocusVillaParaiso = () => {
    setSelectedPoi(null);
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([centerLat, centerLng], 17, { animate: true, duration: 1 });
  };

  // Switch base tile layers
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
      tileLayerRef.current = L.tileLayer("https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        subdomains: ["0", "1", "2", "3"],
        maxZoom: 20,
        maxNativeZoom: 19,
      }).addTo(map);
    } else if (type === "streets") {
      tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
    } else if (type === "hybrid") {
      tileLayerRef.current = L.tileLayer("https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        subdomains: ["0", "1", "2", "3"],
        maxZoom: 20,
        maxNativeZoom: 19,
      }).addTo(map);
    }

    if (masterplanLayerRef.current && showMasterplan && map.hasLayer(masterplanLayerRef.current)) {
      masterplanLayerRef.current.bringToFront();
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
    if (!mapInstanceRef.current) return;
    if (route && route.svgPaths && route.svgPaths.length > 0) {
      const allPts: [number, number][] = [];
      for (const segStr of route.svgPaths) {
        const segPts = parseSvgPathToLatLngs(segStr);
        for (const pt of segPts) allPts.push(pt);
      }
      if (allPts.length >= 2) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(allPts), {
          padding: [60, 60],
          maxZoom: 17.5,
        });
        return;
      }
    }
    if (masterplanLayerRef.current) {
      const bounds = masterplanLayerRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
        return;
      }
    }
    mapInstanceRef.current.setView([centerLat, centerLng], 16.5, { animate: true });
  };

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {/* Map DOM target */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Georeference & Layer status badge (top-left) */}
      {!hideGeoreferenceBadge && !hideSurroundingsDrawer && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none hidden sm:flex flex-wrap items-center gap-2 max-w-[calc(100%-80px)]">
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
                ? "Georreferenciación validada"
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

          {/* Masterplan overlay active pill */}
          {isParaiso && showMasterplan && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 shadow-md backdrop-blur-md text-emerald-700 dark:text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold tracking-wide">
                Plano activo (338 lotes)
              </span>
            </div>
          )}

          {/* Route active badge */}
          {route && (
            <div className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 shadow-md backdrop-blur-md text-blue-700 dark:text-blue-300">
              <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-wide">
                Ruta: {Math.round(route.result.distanceMeters)} m
              </span>
            </div>
          )}

          {/* Surroundings active badge */}
          {isParaiso && showSurroundings && (
            <div className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 shadow-md backdrop-blur-md text-purple-700 dark:text-purple-300">
              <Compass className="size-3" />
              <span className="text-[10px] font-bold tracking-wide">
                Lugares cercanos ({filteredPois.length})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Floating pill to recenter when user manually panned away */}
      {isUserPanning && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 z-30 animate-in fade-in slide-in-from-bottom-2">
          <Button
            type="button"
            onClick={() => {
              setIsUserPanning(false);
              if (fromGps && userGpsPosition && mapInstanceRef.current) {
                mapInstanceRef.current.setView(
                  [userGpsPosition.latitude, userGpsPosition.longitude],
                  17.5,
                  { animate: true },
                );
              } else {
                handleRecenter();
              }
            }}
            className="flex items-center gap-2 rounded-full bg-slate-900/95 text-white dark:bg-white/95 dark:text-slate-950 px-4 py-2 text-xs font-bold shadow-2xl backdrop-blur-md hover:opacity-90 transition-all border border-white/20 cursor-pointer"
          >
            <Compass className="size-3.5 text-blue-400" />
            <span>Recentrar navegación</span>
          </Button>
        </div>
      )}

      {/* Map floating controls (right side) */}
      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 lg:top-20 lg:translate-y-0 z-20 flex flex-col items-center gap-2 select-none">
        {/* Layer picker popover */}
        {isLayerMenuOpen && (
          <div className="absolute right-12 top-0 w-56 rounded-2xl border border-border bg-background/95 p-3 text-foreground shadow-2xl backdrop-blur-2xl">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 pb-1.5">
              Capa de satélite
            </span>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => switchLayer("satellite")}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeLayer === "satellite"
                    ? "bg-muted text-foreground font-semibold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span>Satélite HD</span>
                {activeLayer === "satellite" && <Check className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => switchLayer("hybrid")}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeLayer === "hybrid"
                    ? "bg-muted text-foreground font-semibold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span>Híbrido (Calles)</span>
                {activeLayer === "hybrid" && <Check className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => switchLayer("streets")}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeLayer === "streets"
                    ? "bg-muted text-foreground font-semibold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span>Mapa vectorial</span>
                {activeLayer === "streets" && <Check className="size-3.5" />}
              </button>
            </div>

            {/* Masterplan overlay toggles */}
            {isParaiso && (
              <>
                <div className="my-2.5 h-px bg-border/60" />
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 pb-1.5">
                  Plano Urbanístico
                </span>
                <button
                  type="button"
                  onClick={() => setShowMasterplan((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    showMasterplan
                      ? "bg-muted text-foreground font-semibold"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {showMasterplan ? (
                      <Eye className="size-3.5" />
                    ) : (
                      <EyeOff className="size-3.5" />
                    )}
                    <span>Lotes y vías</span>
                  </span>
                  <span className="text-[10px] font-bold">{showMasterplan ? "ON" : "OFF"}</span>
                </button>

                {/* Lot numbers toggle in menu */}
                <button
                  type="button"
                  onClick={() => setShowLotNumbers((prev) => !prev)}
                  className={`mt-1 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    showLotNumbers
                      ? "bg-muted text-foreground font-semibold"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Hash className="size-3.5" />
                    <span>Números de lote</span>
                  </span>
                  <span className="text-[10px] font-bold">{showLotNumbers ? "ON" : "OFF"}</span>
                </button>

                {/* Surroundings toggle in menu */}
                {!hideSurroundingsDrawer && (
                  <button
                    type="button"
                    onClick={() => setShowSurroundings((prev) => !prev)}
                    className={`mt-1 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      showSurroundings
                        ? "bg-muted text-foreground font-semibold"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Compass className="size-3.5" />
                      <span>Lugares cercanos</span>
                    </span>
                    <span className="text-[10px] font-bold">{showSurroundings ? "ON" : "OFF"}</span>
                  </button>
                )}

                {showMasterplan && (
                  <div className="mt-2 px-1">
                    <span className="block text-[10px] font-medium text-muted-foreground mb-1.5">
                      Intensidad del plano
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { label: "Suave", val: 0.45 },
                        { label: "Medio", val: 0.75 },
                        { label: "Vivo", val: 1.0 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setMasterplanOpacity(preset.val)}
                          className={`rounded-md py-1 text-[10px] font-semibold transition-all ${
                            Math.abs(masterplanOpacity - preset.val) < 0.1
                              ? "bg-foreground text-background shadow-xs"
                              : "bg-muted/60 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Toolbar buttons */}
        <div
          className={`flex flex-col items-center gap-1 rounded-xl p-1 sm:p-1.5 shadow-lg backdrop-blur-xl transition-colors ${
            isDark
              ? "border border-white/10 bg-stone-900/90 text-stone-200"
              : "border border-border/80 bg-background/95 text-foreground/80"
          }`}
        >
          {/* Compass / Heading toggle (Uber mode vs North up) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsUserPanning(false);
              setNavBearingMode((prev) => (prev === "heading" ? "north" : "heading"));
            }}
            className={`size-7 sm:size-8 rounded-lg cursor-pointer transition-colors ${
              navBearingMode === "heading"
                ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                : "hover:bg-muted text-muted-foreground"
            }`}
            title={
              navBearingMode === "heading"
                ? "Rumbo arriba (rotación con tu marcha) · Clic para fijar Norte arriba"
                : "Norte arriba · Clic para girar con tu rumbo"
            }
            aria-label="Orientación del mapa"
          >
            <Compass
              className="size-4 transition-transform duration-300"
              style={{ transform: `rotate(${-currentBearingRef.current}deg)` }}
            />
          </Button>

          {/* Base layers toggle button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsLayerMenuOpen((prev) => !prev)}
            className={`size-7 sm:size-8 rounded-lg cursor-pointer transition-colors ${
              isLayerMenuOpen
                ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                : "hover:bg-muted text-muted-foreground"
            }`}
            title="Capas del mapa"
            aria-label="Capas del mapa"
          >
            <Layers className="size-4" />
          </Button>

          {/* Quick toggle for masterplan layer */}
          {isParaiso && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowMasterplan((prev) => !prev)}
              className={`size-7 sm:size-8 rounded-lg cursor-pointer transition-colors ${
                showMasterplan
                  ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              title={
                showMasterplan
                  ? "Ocultar plano de lotes sobre satélite"
                  : "Mostrar plano de lotes sobre satélite"
              }
              aria-label="Plano de lotes sobre satélite"
            >
              {showMasterplan ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </Button>
          )}

          {/* Quick toggle for lot numbers */}
          {isParaiso && showMasterplan && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowLotNumbers((prev) => !prev)}
              className={`size-7 sm:size-8 rounded-lg cursor-pointer transition-colors ${
                showLotNumbers
                  ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              title={showLotNumbers ? "Ocultar números de lote" : "Mostrar números de lote"}
              aria-label="Números de lote"
            >
              <Hash className="size-4" />
            </Button>
          )}

          {/* Quick toggle for surroundings */}
          {isParaiso && !hideSurroundingsDrawer && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowSurroundings((prev) => !prev)}
              className={`size-7 sm:size-8 rounded-lg cursor-pointer transition-colors ${
                showSurroundings
                  ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              title={
                showSurroundings
                  ? "Ocultar lugares cercanos y atractivos"
                  : "Mostrar lugares cercanos y puntos de interés"
              }
              aria-label="Lugares cercanos y puntos de interés"
            >
              <Compass className="size-4" />
            </Button>
          )}

          {/* Zoom controls (hidden on mobile to keep interface ultra clean) */}
          <div className="hidden md:flex flex-col items-center gap-1">
            <div className="h-px w-4 bg-border/60" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="size-8 rounded-lg hover:bg-muted cursor-pointer"
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
              className="size-8 rounded-lg hover:bg-muted cursor-pointer"
              title="Alejar"
              aria-label="Alejar mapa"
            >
              <span className="text-base font-bold">−</span>
            </Button>
          </div>

          <div className="h-px w-4 bg-border/60" />

          {/* Recenter */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsUserPanning(false);
              handleRecenter();
            }}
            className="size-7 sm:size-8 rounded-lg hover:bg-muted cursor-pointer"
            title="Centrar en el recorrido"
            aria-label="Centrar en el recorrido"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Surroundings interactive explorer drawer */}
      {!hideSurroundingsDrawer && isParaiso && showSurroundings && (
        <div
          className={`absolute z-30 transition-all duration-300 ${
            route
              ? "bottom-24 left-3 right-3 sm:left-6 sm:right-20 md:left-96 md:right-16"
              : "bottom-3 left-3 right-3 sm:left-6 sm:right-6 lg:left-8 lg:right-8"
          }`}
        >
          <div className="rounded-xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between gap-2 pb-2">
              <div className="min-w-0">
                <strong className="block truncate text-xs sm:text-sm font-semibold text-foreground">
                  Lugares cercanos y puntos de interés
                </strong>
                <span className="text-[10.5px] text-muted-foreground">
                  {filteredPois.length} sitios clave alrededor de Villa Paraíso
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFitAllSurroundings}
                  className="hidden sm:inline-flex h-7 px-2.5 text-[10.5px] font-semibold rounded-lg"
                >
                  Ver todo el mapa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFocusVillaParaiso}
                  className="hidden sm:inline-flex h-7 px-2.5 text-[10.5px] font-semibold rounded-lg"
                >
                  Volver a Villa Paraíso
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPoiPanelCollapsed((prev) => !prev)}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                  aria-label={
                    isPoiPanelCollapsed ? "Expandir lugares cercanos" : "Colapsar lugares cercanos"
                  }
                >
                  {isPoiPanelCollapsed ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            {!isPoiPanelCollapsed && (
              <>
                {/* Category filter pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                  {POI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPoiCategory(cat.id)}
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-all ${
                        poiCategory === cat.id
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Cards carousel */}
                <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                  {filteredPois.map((poi) => {
                    const meta = getPoiCategoryMeta(poi.category);
                    const isSelected = selectedPoi?.id === poi.id;
                    return (
                      <button
                        key={poi.id}
                        type="button"
                        onClick={() => handleSelectPoi(poi)}
                        className={`group flex min-w-[210px] sm:min-w-[230px] max-w-[260px] shrink-0 flex-col rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-400/80 bg-amber-500/10 shadow-lg ring-1 ring-amber-400/50"
                            : "border-border/60 bg-muted/30 hover:border-border hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            <span>{meta.emoji}</span>
                            <span>{meta.label}</span>
                          </span>
                          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                            {poi.travelTime}
                          </span>
                        </div>

                        <strong className="mt-1.5 line-clamp-1 text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {poi.shortName}
                        </strong>

                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>{poi.distanceKm} km</span>
                          <span>•</span>
                          <span className="truncate text-foreground/80 font-medium">
                            {poi.highlightTag}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
