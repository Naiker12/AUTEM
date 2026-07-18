import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Property } from "@/data/properties";

interface MapViewProps {
  properties: Property[];
}

const DEFAULT_CENTER: L.LatLngExpression = [36.5, -4.9];
const DEFAULT_ZOOM = 10;

function createIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;
      background:#C5A059;
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    "><div style="width:8px;height:8px;background:#fff;border-radius:50%;"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -18],
  });
}

export default function MapView({ properties }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const icon = createIcon();
    const bounds: L.LatLngExpression[] = [];

    properties.forEach((p) => {
      const pos: L.LatLngExpression = [p.lat, p.lng];
      bounds.push(pos);

      const marker = L.marker(pos, { icon }).addTo(map);

      const imgSrc = typeof p.image === "string" ? p.image : "";

      marker.bindPopup(
        `<div style="min-width:200px;font-family:Inter,sans-serif;">
          ${
            imgSrc
              ? `<img src="${imgSrc}" alt="${p.name}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
              : ""
          }
          <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.05em;">${p.location}</div>
          <div style="font-size:16px;font-weight:500;margin:2px 0;">${p.name}</div>
          <div style="font-size:14px;color:#C5A059;font-weight:500;">${p.price}</div>
          <div style="font-size:12px;color:#888;margin-top:4px;">${p.m2} m² · ${p.bedrooms} hab.</div>
          <a href="/properties/${p.slug}" style="display:inline-block;margin-top:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#1A1A1A;border-bottom:1px solid #C5A059;padding-bottom:2px;">Ver detalles →</a>
        </div>`,
        { maxWidth: 260 },
      );
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [properties]);

  return <div ref={mapRef} className="h-full w-full" />;
}
