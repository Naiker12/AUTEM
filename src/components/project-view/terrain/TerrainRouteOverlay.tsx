import type { Lot } from "@/data/lots";
import type { RenderableInternalRoute } from "@/features/terrain-navigation/route-graph";

export default function TerrainRouteOverlay({
  destination,
  route,
  entrancePoint,
}: {
  destination?: Lot;
  route: RenderableInternalRoute | null;
  entrancePoint?: { x: number; y: number } | null;
}) {
  if (!destination?.centroid) return null;
  const end = route?.destination.point ?? {
    x: destination.centroid[0],
    y: destination.centroid[1],
  };
  const originPoint = route?.origin.point ?? entrancePoint ?? null;
  const lotLabel = `Lote ${destination.lotNumber ?? destination.id.replace("L-", "")}`;

  return (
    <g
      className="pointer-events-none"
      aria-label={
        route ? "Recorrido validado por vías internas" : "Ubicación del lote seleccionado"
      }
    >
      {route?.svgPaths.map((path, index) => (
        <g key={`${index}-${path}`}>
          <path
            d={path}
            fill="none"
            stroke="white"
            strokeWidth="9"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.92"
          />
          <path
            d={path}
            fill="none"
            stroke="#1677ff"
            strokeWidth="5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}

      {originPoint && (
        <g transform={`translate(${originPoint.x} ${originPoint.y})`}>
          <circle r="18" fill="#1677ff" fillOpacity="0.18" />
          <circle r="10" fill="#1677ff" stroke="white" strokeWidth="3" />
          <g transform="translate(0, 26)">
            <rect
              x="-44"
              y="-10"
              width="88"
              height="20"
              rx="10"
              fill="#1c1917"
              fillOpacity="0.88"
              stroke="white"
              strokeWidth="1.2"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fafaf9"
              fontSize="10"
              fontWeight="700"
              letterSpacing="0.04em"
            >
              {route?.origin.id === "__gps_origin__" ? "TU UBICACIÓN" : "PORTERÍA"}
            </text>
          </g>
        </g>
      )}

      {/* Halo y marcador del lote destino */}
      <g transform={`translate(${end.x} ${end.y})`}>
        <circle r="28" fill="var(--accent)" fillOpacity="0.18" />
        <circle
          r="18"
          fill="var(--accent)"
          fillOpacity="0.28"
          stroke="var(--accent)"
          strokeWidth="1.5"
        />
      </g>

      <g transform={`translate(${end.x} ${end.y - 36})`}>
        <circle r="17" fill="var(--accent)" stroke="white" strokeWidth="3" />
        <path
          d="M0 -9c-5 0-8 4-8 8 0 6 8 12 8 12s8-6 8-12c0-4-3-8-8-8Z"
          fill="var(--accent-foreground)"
        />
        <circle cy="-1" r="2.5" fill="var(--accent)" />
        <g transform="translate(0, -28)">
          <rect
            x="-42"
            y="-11"
            width="84"
            height="22"
            rx="11"
            fill="var(--accent)"
            stroke="white"
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
      </g>
    </g>
  );
}
