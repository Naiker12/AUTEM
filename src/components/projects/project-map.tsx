import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ProjectMapProps } from "./project-types";

function createProjectPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: #C5A059;
        border: 3px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: #FFFFFF;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

export default function ProjectMap({ property, className = "", zoom = 14 }: ProjectMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [property.lat, property.lng],
      zoom,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const icon = createProjectPinIcon();
    const marker = L.marker([property.lat, property.lng], { icon }).addTo(map);

    const imgSrc = typeof property.image === "string" ? property.image : "";

    marker.bindPopup(
      `
      <div style="min-width: 220px; font-family: Inter, sans-serif; padding: 4px;">
        ${
          imgSrc
            ? `<img src="${imgSrc}" alt="${property.name}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />`
            : ""
        }
        <div style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.1em;">${property.location}</div>
        <div style="font-size: 15px; font-weight: 600; color: #1A1A1A; margin: 2px 0;">${property.name}</div>
        <div style="font-size: 13px; color: #C5A059; font-weight: 500;">${property.price}</div>
      </div>
    `,
      { maxWidth: 260 },
    );

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [property, zoom]);

  return (
    <div className={`relative z-0 isolate overflow-hidden rounded-2xl border border-border shadow-sm ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full min-h-[320px] z-0" />
    </div>
  );
}
