import type { Lot } from "@/data/lots";
import type { RenderableInternalRoute } from "@/features/terrain-navigation/route-graph";

export default function TerrainRouteOverlay({
  destination,
  route,
}: {
  destination?: Lot;
  route: RenderableInternalRoute | null;
}) {
  if (!destination?.centroid) return null;
  const end = route?.destination.point ?? {
    x: destination.centroid[0],
    y: destination.centroid[1],
  };
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
            strokeWidth="8"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            stroke="#1677ff"
            strokeWidth="4"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
      {route && (
        <g transform={`translate(${route.origin.point.x} ${route.origin.point.y})`}>
          <circle r="12" fill="#1677ff" stroke="white" strokeWidth="3" />
        </g>
      )}
      <g transform={`translate(${end.x} ${end.y - 36})`}>
        <circle r="17" fill="var(--accent)" stroke="white" strokeWidth="3" />
        <path
          d="M0 -9c-5 0-8 4-8 8 0 6 8 12 8 12s8-6 8-12c0-4-3-8-8-8Z"
          fill="var(--accent-foreground)"
        />
        <circle cy="-1" r="2.5" fill="var(--accent)" />
      </g>
    </g>
  );
}
