import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation,
  MapPin,
  Layers,
  ExternalLink,
  Compass,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

// Coordenadas oficiales y georreferenciadas de AUTEM Villa Paraíso
const AUTEM_COORDINATES = {
  lat: 10.436829,
  lng: -75.356179,
  dms: "10°26'16.9\"N 75°21'20.9\"W",
  label: "Parcelación Villa Paraíso",
  municipality: "Santa Rosa de Lima · Villanueva, Bolívar",
};

interface LandmarkPOI {
  id: string;
  name: string;
  time: string;
  category: string;
  code: string;
  lat: number;
  lng: number;
}

const LANDMARKS: LandmarkPOI[] = [
  {
    id: "santa-rosa",
    name: "Santa Rosa de Lima",
    time: "4 min",
    category: "Casco Urbano & Comercio",
    code: "R",
    lat: 10.4965,
    lng: -75.3622,
  },
  {
    id: "villanueva",
    name: "Villanueva",
    time: "6 min",
    category: "Conexión Departamental",
    code: "V",
    lat: 10.4412,
    lng: -75.2758,
  },
  {
    id: "serena",
    name: "Serena del Mar",
    time: "15 min",
    category: "Zona Norte & Hospital",
    code: "S",
    lat: 10.5182,
    lng: -75.4854,
  },
  {
    id: "aeropuerto",
    name: "Aeropuerto Rafael Núñez",
    time: "20 min",
    category: "Terminal Aérea",
    code: "✈",
    lat: 10.4428,
    lng: -75.5135,
  },
  {
    id: "centro",
    name: "Centro Histórico",
    time: "25 min",
    category: "Ciudad Amurallada · Cartagena",
    code: "C",
    lat: 10.4236,
    lng: -75.5482,
  },
  {
    id: "turbaco",
    name: "Turbaco",
    time: "20 min",
    category: "Eje Campestre",
    code: "T",
    lat: 10.3294,
    lng: -75.4121,
  },
];

export default function TerritoryLocationMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const [mapMode, setMapMode] = useState<"satellite" | "editorial">("satellite");
  const [activePoi, setActivePoi] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(12);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Inicializar mapa centrado en Villa Paraíso
    const map = L.map(mapContainerRef.current, {
      center: [AUTEM_COORDINATES.lat, AUTEM_COORDINATES.lng],
      zoom: 12,
      minZoom: 9,
      maxZoom: 18,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    // Escuchar cambios de zoom para actualizar estado
    map.on("zoomend", () => {
      setZoomLevel(map.getZoom());
    });

    // Capa base satelital de alta resolución (Esri World Imagery)
    const initialTileUrl =
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    const tileLayer = L.tileLayer(initialTileUrl, {
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a> Satellite',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // 1. Perímetro Territorial Circular de Villa Paraíso (Zona de Reserva y Parcelación)
    L.circle([AUTEM_COORDINATES.lat, AUTEM_COORDINATES.lng], {
      radius: 850,
      color: "#c5a059",
      fillColor: "#c5a059",
      fillOpacity: 0.18,
      weight: 2,
      dashArray: "5, 5",
    }).addTo(map);

    // 2. PIN HERO CENTRAL AUTEM (Icono Diamante Facetado con Pulso Radar e Iluminación Dorada)
    const autemHeroIcon = L.divIcon({
      className: "autem-hero-marker",
      html: `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;">
          <!-- Ondas de Pulso Radar -->
          <div style="position:absolute;width:80px;height:80px;border-radius:50%;border:2px solid #e5c278;opacity:0.7;animation:ping 2.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:absolute;width:54px;height:54px;border-radius:50%;background:rgba(197,160,89,0.25);border:1px dashed #ffffff;"></div>
          
          <!-- Placa Diamante Central Estilo ERA Estate -->
          <div style="position:relative;z-index:10;width:38px;height:38px;background:linear-gradient(135deg, #2b231c 0%, #151413 100%);border:2.5px solid #e5c278;border-radius:10px;transform:rotate(45deg);box-shadow:0 8px 24px rgba(0,0,0,0.7), 0 0 16px rgba(197,160,89,0.5);display:flex;align-items:center;justify-content:center;">
            <span style="transform:rotate(-45deg);font-family:serif;font-size:11px;font-weight:800;letter-spacing:0.1em;color:#e5c278;">A</span>
          </div>

          <!-- Etiqueta Flotante Siempre Visible -->
          <div style="margin-top:12px;background:rgba(21,20,19,0.92);backdrop-filter:blur(8px);border:1px solid #c5a059;padding:4px 10px;border-radius:20px;box-shadow:0 4px 15px rgba(0,0,0,0.6);white-space:nowrap;display:flex;align-items:center;gap:5px;">
            <span style="width:6px;height:6px;border-radius:50%;background:#e5c278;box-shadow:0 0 6px #e5c278;"></span>
            <span style="font-family:serif;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#f6f1eb;text-transform:uppercase;">VILLA PARAÍSO</span>
          </div>
        </div>
      `,
      iconSize: [140, 90],
      iconAnchor: [70, 45],
    });

    const marker = L.marker([AUTEM_COORDINATES.lat, AUTEM_COORDINATES.lng], {
      icon: autemHeroIcon,
      zIndexOffset: 2000,
    }).addTo(map);

    marker.bindPopup(
      `<div style="font-family:serif;padding:8px;color:#403a34;min-width:220px;">
        <div style="font-size:9.5px;color:#c5a059;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">PROYECTO AUTEM · 2026</div>
        <div style="font-size:18px;font-weight:600;margin:4px 0;letter-spacing:0.04em;">VILLA PARAÍSO</div>
        <div style="font-size:11.5px;color:#666;font-family:sans-serif;margin-bottom:8px;">Santa Rosa de Lima · Villanueva</div>
        <div style="font-family:monospace;font-size:10.5px;background:#f6f1eb;padding:6px 8px;border-radius:6px;border:1px solid #c5a05940;color:#151413;">
          ${AUTEM_COORDINATES.dms}
        </div>
      </div>`,
    );

    // 3. Hitos Territoriales con Alta Visibilidad
    LANDMARKS.forEach((poi) => {
      const poiIcon = L.divIcon({
        className: "poi-marker-wrapper",
        html: `
          <div style="display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;">
            <div style="width:26px;height:26px;border-radius:50%;background:#151413;border:2px solid #e5c278;box-shadow:0 4px 12px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#e5c278;">
              ${poi.code}
            </div>
            <div style="background:rgba(21,20,19,0.88);backdrop-filter:blur(6px);padding:3px 9px;border-radius:14px;border:1px solid rgba(229,194,120,0.4);box-shadow:0 4px 12px rgba(0,0,0,0.4);">
              <span style="font-size:10.5px;font-weight:600;color:#f6f1eb;text-transform:uppercase;letter-spacing:0.08em;">${poi.name}</span>
              <span style="font-size:9px;color:#e5c278;font-weight:700;margin-left:5px;">${poi.time}</span>
            </div>
          </div>
        `,
        iconSize: [130, 26],
        iconAnchor: [13, 13],
      });

      const m = L.marker([poi.lat, poi.lng], { icon: poiIcon }).addTo(map);
      m.on("click", () => {
        setActivePoi(poi.id);
        map.flyTo([poi.lat, poi.lng], 13, { duration: 1.2 });
      });
    });

    // 4. Líneas Geodésicas de Conexión Doradas y Luminosas
    const polylines: L.Polyline[] = [];
    LANDMARKS.forEach((poi) => {
      const line = L.polyline(
        [
          [AUTEM_COORDINATES.lat, AUTEM_COORDINATES.lng],
          [poi.lat, poi.lng],
        ],
        {
          color: "#e5c278",
          weight: 2,
          opacity: 0.7,
          dashArray: "6, 8",
        },
      ).addTo(map);
      polylines.push(line);
    });
    polylinesRef.current = polylines;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Cambiar entre Satélite Real y Plano Editorial
  const toggleMapMode = (mode: "satellite" | "editorial") => {
    setMapMode(mode);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl =
      mode === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const newLayer = L.tileLayer(tileUrl, {
      attribution:
        mode === "satellite"
          ? '&copy; <a href="https://www.esri.com/">Esri</a> Satellite'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: mode === "editorial" ? "editorial-map-tile" : "",
    }).addTo(map);

    tileLayerRef.current = newLayer;

    // Actualizar color de líneas de enlace según la capa
    polylinesRef.current.forEach((line) => {
      line.setStyle({
        color: mode === "satellite" ? "#e5c278" : "#403a34",
        opacity: mode === "satellite" ? 0.75 : 0.4,
      });
    });
  };

  // Enfoque cercano al lote vs visión regional
  const focusOnLot = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([AUTEM_COORDINATES.lat, AUTEM_COORDINATES.lng], 15, { duration: 1.5 });
    setActivePoi(null);
  };

  const focusRegional = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([AUTEM_COORDINATES.lat, AUTEM_COORDINATES.lng], 11, { duration: 1.5 });
    setActivePoi(null);
  };

  return (
    <section
      id="ubicacion"
      data-scroll-scene
      aria-label="Mapa territorial de ubicación real"
      className="relative w-full h-[90vh] min-h-[680px] max-h-[960px] overflow-hidden bg-[#151413] text-[#f6f1eb] border-t border-white/10 select-none"
    >
      {/* Medallón Superior "UBICACIÓN" (Estilo Art Deco / Arquitectónico) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
        <div className="relative flex items-center justify-center rounded-b-2xl bg-[#151413]/95 px-10 sm:px-14 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-b border-x border-[#c5a059]/40 backdrop-blur-md">
          <span className="font-serif text-[12px] sm:text-[13px] font-bold tracking-[0.3em] text-[#e5c278] uppercase">
            UBICACIÓN TERRITORIAL
          </span>
          <div className="absolute -top-1 size-2 rounded-full bg-[#e5c278]" />
        </div>
      </div>

      {/* Contenedor del Mapa Real de Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Selector de Capas & Nivel de Zoom */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
        {/* Toggle Satélite vs Editorial */}
        <div className="flex items-center gap-1 rounded-full border border-white/20 bg-[#151413]/90 p-1 backdrop-blur-md shadow-2xl">
          <button
            type="button"
            onClick={() => toggleMapMode("satellite")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all ${
              mapMode === "satellite"
                ? "bg-[#c5a059] text-[#151413] font-bold shadow-md"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Compass size={13} />
            <span>Satélite Real</span>
          </button>
          <button
            type="button"
            onClick={() => toggleMapMode("editorial")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all ${
              mapMode === "editorial"
                ? "bg-[#c5a059] text-[#151413] font-bold shadow-md"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Layers size={13} />
            <span>Plano Editorial</span>
          </button>
        </div>

        {/* Quick View Presets: Lote vs Región */}
        <div className="flex items-center gap-1 rounded-full border border-white/15 bg-[#151413]/85 p-1 backdrop-blur-md shadow-xl text-[10px] font-mono">
          <button
            type="button"
            onClick={focusOnLot}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-white/80 hover:text-[#e5c278] hover:bg-white/5 transition-colors"
          >
            <ZoomIn size={12} />
            <span>Acercar Terreno (1:1)</span>
          </button>
          <span className="text-white/20">|</span>
          <button
            type="button"
            onClick={focusRegional}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-white/80 hover:text-[#e5c278] hover:bg-white/5 transition-colors"
          >
            <ZoomOut size={12} />
            <span>Vista Regional</span>
          </button>
        </div>
      </div>

      {/* Bottom Left: Cockpit de Ubicación con Render Miniatura de Villa Paraíso */}
      <div className="absolute bottom-6 left-6 sm:left-8 z-20 max-w-sm rounded-2xl border border-white/20 bg-[#151413]/92 p-5 backdrop-blur-xl shadow-2xl text-[#f6f1eb]">
        {/* Header con Miniatura del Masterplan */}
        <div className="flex items-center gap-3.5 border-b border-white/15 pb-3.5 mb-3">
          <div className="size-12 rounded-xl overflow-hidden border border-[#c5a059] shrink-0 bg-black">
            <img
              src={`${import.meta.env.BASE_URL}images/autem-villa-paraiso-aerial-v2.png`}
              alt="Villa Paraíso"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#c5a059] animate-pulse" />
              <h3 className="font-serif text-[16px] font-bold uppercase tracking-wider text-[#f6f1eb] truncate">
                Villa Paraíso
              </h3>
            </div>
            <p className="text-[11px] text-white/70 font-sans truncate">
              {AUTEM_COORDINATES.municipality}
            </p>
          </div>
          <button
            type="button"
            onClick={focusOnLot}
            className="text-[10px] font-mono text-[#e5c278] hover:underline uppercase tracking-wider font-semibold shrink-0"
            title="Centrar mapa en el proyecto"
          >
            [ Centrar ]
          </button>
        </div>

        {/* Ficha Técnica de Coordenadas Oficiales */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[10.5px] space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-white/50">COORDENADAS GPS:</span>
            <span className="font-bold text-[#e5c278]">{AUTEM_COORDINATES.dms}</span>
          </div>
          <div className="flex justify-between items-center text-[9.5px]">
            <span className="text-white/40">SISTEMA SIG:</span>
            <span className="text-white/80">
              {AUTEM_COORDINATES.lat}, {AUTEM_COORDINATES.lng}
            </span>
          </div>
          <div className="flex justify-between items-center text-[9.5px] pt-1 border-t border-white/10">
            <span className="text-white/40">LOTES DISPONIBLES:</span>
            <span className="text-[#e5c278] font-bold">343 Lotes Campestres</span>
          </div>
        </div>

        {/* Botones de Navegación GPS Directa */}
        <div className="mt-3.5 flex items-center gap-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${AUTEM_COORDINATES.lat},${AUTEM_COORDINATES.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#c5a059] py-2 px-3 text-[11px] font-bold text-[#151413] hover:bg-[#e5c278] transition-colors shadow-lg"
          >
            <MapPin size={13} />
            <span>Google Maps</span>
            <ExternalLink size={11} className="opacity-70" />
          </a>
          <a
            href={`https://waze.com/ul?ll=${AUTEM_COORDINATES.lat},${AUTEM_COORDINATES.lng}&navigate=yes`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 py-2 px-3 text-[11px] font-medium text-white hover:bg-white/15 transition-colors"
          >
            <Navigation size={13} />
            <span>Abrir en Waze</span>
          </a>
        </div>
      </div>

      {/* Bottom Right: Panel de Conectividad y Tiempos Reales */}
      <div className="hidden lg:flex absolute bottom-6 right-6 z-20 flex-col gap-2 rounded-2xl border border-white/20 bg-[#151413]/92 p-4 backdrop-blur-xl shadow-2xl max-w-xs text-[#f6f1eb]">
        <div className="flex items-center justify-between border-b border-white/15 pb-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#e5c278] font-bold">
            Conectividad & Distancias
          </span>
          <span className="text-[9px] font-mono text-white/50">Desde Villa Paraíso</span>
        </div>

        <div className="space-y-1 mt-1">
          {LANDMARKS.map((poi) => (
            <button
              key={poi.id}
              type="button"
              onClick={() => {
                setActivePoi(poi.id);
                mapInstanceRef.current?.flyTo([poi.lat, poi.lng], 13, { duration: 1.2 });
              }}
              className={`w-full text-left flex items-center justify-between text-[11px] py-1.5 px-2.5 rounded-lg transition-all ${
                activePoi === poi.id
                  ? "bg-[#c5a059] text-[#151413] font-bold shadow-md"
                  : "hover:bg-white/10 text-white/80"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`size-4 rounded-full flex items-center justify-center text-[8.5px] font-bold ${
                    activePoi === poi.id
                      ? "bg-[#151413] text-[#e5c278]"
                      : "bg-white/15 text-[#e5c278]"
                  }`}
                >
                  {poi.code}
                </span>
                <span className="truncate">{poi.name}</span>
              </div>
              <span
                className={`font-mono text-[10px] font-bold ml-2 shrink-0 ${
                  activePoi === poi.id ? "text-[#151413]" : "text-[#e5c278]"
                }`}
              >
                {poi.time}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
