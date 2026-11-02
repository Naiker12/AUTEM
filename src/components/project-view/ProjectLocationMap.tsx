import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Check, Eye, EyeOff, Hash, Layers, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLotArea, formatLotDetail, formatLotPrice, type Lot } from "@/data/lots";
import cadReference from "@/data/villa-paraiso-cad-reference.json";
import villaParaisoGeoJson from "@/data/generated/villa-paraiso-geojson.json";
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
  route?: RenderableInternalRoute | null;
  fromGps?: boolean;
  userGpsPosition?: GeolocationCoordinates | null;
  travelMode?: TravelMode;
  destinationLot?: Lot;
  focusRequest?: number;
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
  route,
  fromGps = false,
  userGpsPosition,
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

  const [activeLayer, setActiveLayer] = useState<MapLayerType>("satellite");
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [showMasterplan, setShowMasterplan] = useState(showMasterplanOverlayDefault);
  const [showLotNumbers, setShowLotNumbers] = useState(true);
  const [masterplanOpacity, setMasterplanOpacity] = useState<number>(0.85);

  const isParaiso =
    projectSlug === "villa-paraiso" ||
    projectSlug === "lotes-360" ||
    projectName.toLowerCase().includes("paraiso");

  // Center coordinates fallback to Santa Rosa de Lima
  const centerLat = lat !== 0 ? lat : 10.436829;
  const centerLng = lng !== 0 ? lng : -75.356179;

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
      let fillColor = "#10b981"; // Disponible
      let strokeColor = "#059669";
      let fillOpacity = 0.22 * opacityMultiplier;

      if (s.includes("vend")) {
        fillColor = "#ef4444"; // Vendido
        strokeColor = "#dc2626";
        fillOpacity = 0.25 * opacityMultiplier;
      } else if (s.includes("res")) {
        fillColor = "#f59e0b"; // Reservado
        strokeColor = "#d97706";
        fillOpacity = 0.28 * opacityMultiplier;
      } else if (s.includes("conf") || s.includes("hid")) {
        fillColor = "#94a3b8"; // Por confirmar
        strokeColor = "#64748b";
        fillOpacity = 0.16 * opacityMultiplier;
      }

      return {
        fillColor,
        fillOpacity: Math.min(1, fillOpacity),
        color: strokeColor,
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
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Default base layer: Esri World Imagery (High-res satellite)
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
      map.remove();
      mapInstanceRef.current = null;
      masterplanLayerRef.current = null;
      lotNumbersLayerRef.current = null;
      routeLayerGroupRef.current = null;
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

    // Start Marker (Origin: GPS Blue Dot or Portería)
    const startPt = allPts[0];
    if (fromGps && userGpsPosition) {
      const gpsIcon = L.divIcon({
        className: "autem-gps-marker",
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <span class="autem-gps-ping" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #3b82f6;"></span>
            <span style="position: relative; width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
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

    // Frame the active route
    const bounds = L.latLngBounds(allPts);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17.5 });
    }
  }, [route, fromGps, userGpsPosition, destinationLot]);

  // Recenter / Focus handler
  useEffect(() => {
    if (!focusRequest) return;
    const map = mapInstanceRef.current;
    if (!map) return;

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

    if (destinationLot?.centroid) {
      const pt = svgToGpsLatLng(destinationLot.centroid[0], destinationLot.centroid[1]);
      map.setView(pt, 17.5, { animate: true });
    }
  }, [focusRequest, route, destinationLot]);

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
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-wrap items-center gap-2 max-w-[calc(100%-80px)]">
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
      </div>

      {/* Map floating controls (right side) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 lg:top-20 lg:translate-y-0 z-20 flex flex-col items-center gap-2 select-none">
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
                    ? "bg-accent/20 text-accent font-semibold"
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
                    ? "bg-accent/20 text-accent font-semibold"
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
                    ? "bg-accent/20 text-accent font-semibold"
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
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
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
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Hash className="size-3.5" />
                    <span>Números de lote</span>
                  </span>
                  <span className="text-[10px] font-bold">{showLotNumbers ? "ON" : "OFF"}</span>
                </button>

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
                              ? "bg-primary text-primary-foreground shadow-xs"
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
          className={`flex flex-col items-center gap-1 rounded-full p-1.5 shadow-2xl backdrop-blur-xl transition-colors ${
            isDark
              ? "border border-white/10 bg-stone-900/85 text-stone-200"
              : "border border-white/35 bg-white/70 text-foreground/80"
          }`}
        >
          {/* Base layers toggle button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsLayerMenuOpen((prev) => !prev)}
            className="size-8 rounded-full hover:bg-muted cursor-pointer"
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
              className={`size-8 rounded-full cursor-pointer transition-colors ${
                showMasterplan
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30"
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
              className={`size-8 rounded-full cursor-pointer transition-colors ${
                showLotNumbers
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              title={showLotNumbers ? "Ocultar números de lote" : "Mostrar números de lote"}
              aria-label="Números de lote"
            >
              <Hash className="size-4" />
            </Button>
          )}

          <div className="h-px w-4 bg-border/60" />

          {/* Zoom controls */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="size-8 rounded-full hover:bg-muted cursor-pointer"
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
            className="size-8 rounded-full hover:bg-muted cursor-pointer"
            title="Alejar"
            aria-label="Alejar mapa"
          >
            <span className="text-base font-bold">−</span>
          </Button>

          <div className="h-px w-4 bg-border/60" />

          {/* Recenter */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRecenter}
            className="size-8 rounded-full hover:bg-muted cursor-pointer"
            title="Centrar en el recorrido"
            aria-label="Centrar en el recorrido"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
