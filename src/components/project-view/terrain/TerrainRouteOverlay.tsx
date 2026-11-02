import { useMemo } from "react";
import type { Lot } from "@/data/lots";
import type { RenderableInternalRoute } from "@/features/terrain-navigation/route-graph";

export default function TerrainRouteOverlay({
  destination,
  route,
  entrancePoint,
  travelMode = "walking",
}: {
  destination?: Lot;
  route: RenderableInternalRoute | null;
  entrancePoint?: { x: number; y: number } | null;
  travelMode?: "walking" | "driving";
}) {
  const centroid = destination?.centroid;
  const lotLabel = destination
    ? `Lote ${destination.lotNumber ?? destination.id.replace("L-", "")}`
    : "";

  const entranceX = entrancePoint?.x ?? 1014.7;
  const entranceY = entrancePoint?.y ?? 2148.5;
  const routeOriginX = route?.origin.point.x;
  const routeOriginY = route?.origin.point.y;

  const originPoint = useMemo(() => {
    if (routeOriginX !== undefined && routeOriginY !== undefined) {
      return { x: routeOriginX, y: routeOriginY };
    }
    return { x: entranceX, y: entranceY };
  }, [routeOriginX, routeOriginY, entranceX, entranceY]);

  // Usa la ruta interna validada sobre la red caminable/vial
  const effectiveRoute = route && route.svgPaths && route.svgPaths.length > 0 ? route : null;

  if (!destination || !centroid || !effectiveRoute) return null;

  const end = effectiveRoute.destination.point ?? {
    x: centroid[0],
    y: centroid[1],
  };

  const distanceMeters = effectiveRoute.result.distanceMeters ?? 0;

  return (
    <g className="pointer-events-none" aria-label={`Ruta hacia ${lotLabel}`}>
      <defs>
        <filter id="route-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      <style>{`
        @keyframes dashFlow {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -32;
          }
        }
        .route-dash-animated {
          animation: dashFlow 1.2s linear infinite;
        }
        @keyframes rippleRing {
          0% {
            r: 16px;
            opacity: 0.9;
          }
          50% {
            r: 34px;
            opacity: 0.15;
          }
          100% {
            r: 16px;
            opacity: 0.9;
          }
        }
        .pulse-ring {
          animation: rippleRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Trazo completo de la ruta interna conectando origen y lote */}
      {effectiveRoute?.svgPaths.map((path: string, index: number) => (
        <g key={`route-segment-${index}-${path}`}>
          {/* 1. Sombra amplia para separación sobre vegetación o lagos */}
          <path
            d={path}
            fill="none"
            stroke="#0b0f19"
            strokeWidth="11"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
          {/* 2. Borde blanco brillante para máximo contraste */}
          <path
            d={path}
            fill="none"
            stroke="#ffffff"
            strokeWidth="7.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
          {/* 3. Línea central azul de navegación */}
          <path
            d={path}
            fill="none"
            stroke="#1677ff"
            strokeWidth="4.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* 4. Efecto de flujo animado guiando visualmente al visitante */}
          <path
            d={path}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeDasharray="7 9"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="route-dash-animated"
          />
        </g>
      ))}

      {/* Marcador del punto de partida (Portería o GPS) */}
      {originPoint && (
        <g transform={`translate(${originPoint.x} ${originPoint.y})`} filter="url(#route-shadow)">
          <circle r="22" fill="#1677ff" fillOpacity="0.22" className="pulse-ring" />
          <circle r="11" fill="#1677ff" stroke="#ffffff" strokeWidth="3" />
          <circle r="3.5" fill="#ffffff" />
          <g transform="translate(0, 28)">
            <rect
              x="-46"
              y="-10"
              width="92"
              height="20"
              rx="10"
              fill="#0f172a"
              fillOpacity="0.92"
              stroke="#ffffff"
              strokeWidth="1.2"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              fontSize="9.5"
              fontWeight="800"
              letterSpacing="0.05em"
            >
              {route?.origin.id === "__gps_origin__" ? "TU GPS" : "PORTERÍA"}
            </text>
          </g>
        </g>
      )}

      {/* Halo y marcador animado del lote destino */}
      <g transform={`translate(${end.x} ${end.y})`} filter="url(#route-shadow)">
        <circle r="30" fill="var(--accent)" fillOpacity="0.2" className="pulse-ring" />
        <circle
          r="16"
          fill="var(--accent)"
          fillOpacity="0.32"
          stroke="var(--accent)"
          strokeWidth="1.5"
        />
      </g>

      <g transform={`translate(${end.x} ${end.y - 36})`} filter="url(#route-shadow)">
        <circle r="17" fill="var(--accent)" stroke="#ffffff" strokeWidth="3" />
        <path
          d="M0 -9c-5 0-8 4-8 8 0 6 8 12 8 12s8-6 8-12c0-4-3-8-8-8Z"
          fill="var(--accent-foreground)"
        />
        <circle cy="-1" r="2.5" fill="var(--accent)" />
        <g transform="translate(0, -28)">
          <rect
            x="-44"
            y="-11"
            width="88"
            height="22"
            rx="11"
            fill="var(--accent)"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--accent-foreground)"
            fontSize="10.5"
            fontWeight="800"
            letterSpacing="0.03em"
          >
            {lotLabel}
          </text>
        </g>
        {distanceMeters > 0 && (
          <g transform="translate(0, 16)">
            <rect
              x="-34"
              y="-8"
              width="68"
              height="16"
              rx="8"
              fill="#0f172a"
              fillOpacity="0.9"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#38bdf8"
              fontSize="9"
              fontWeight="800"
            >
              {distanceMeters} m
            </text>
          </g>
        )}
      </g>
    </g>
  );
}
