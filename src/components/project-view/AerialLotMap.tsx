import type { Lot } from "@/data/lots";

const LOT_SHAPES: Record<string, { points: string; label: [number, number] }> = {
  "L-01": { points: "470,305 650,276 705,392 565,448 430,377", label: [568, 365] },
  "L-07": { points: "735,300 885,280 950,382 845,462 700,395", label: [823, 368] },
  "L-12": { points: "420,500 605,476 660,590 555,665 375,596", label: [520, 566] },
  "L-18": { points: "1035,525 1225,500 1305,618 1210,718 1020,655", label: [1148, 604] },
  "L-24": { points: "1130,305 1345,280 1415,390 1320,470 1145,430", label: [1268, 374] },
};

interface AerialLotMapProps {
  image: string;
  lots: Lot[];
  selectedLot: Lot;
  onSelect: (lot: Lot) => void;
  zoom: number;
  showLotBoundaries: boolean;
  showLotLabels: boolean;
  mapShade: number;
  selectionOpacity: number;
}

export default function AerialLotMap({
  image,
  lots,
  selectedLot,
  onSelect,
  zoom,
  showLotBoundaries,
  showLotLabels,
  mapShade,
  selectionOpacity,
}: AerialLotMapProps) {
  return (
    <div id="project-map" className="absolute inset-0 overflow-hidden bg-background">
      <div
        className="absolute inset-0 origin-center transition-transform duration-700 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        <img
          src={image}
          alt="Vista aérea del masterplan y sus lotes"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-300"
          style={{ opacity: mapShade / 100 }}
        />
        {showLotBoundaries && (
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1536 1024"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <filter id="selectedGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {lots.map((lot) => {
              const shape = LOT_SHAPES[lot.id];
              if (!shape) return null;
              const selected = lot.id === selectedLot.id;
              return (
                <polygon
                  key={lot.id}
                  points={shape.points}
                  fill={
                    selected ? `rgba(197,160,89,${selectionOpacity / 100})` : "rgba(5,14,8,.06)"
                  }
                  stroke={selected ? "#c5a059" : "rgba(255,255,255,.72)"}
                  strokeWidth={selected ? 4 : 1.7}
                  vectorEffect="non-scaling-stroke"
                  filter={selected ? "url(#selectedGlow)" : undefined}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
        )}
        {showLotLabels &&
          lots.map((lot) => {
            const shape = LOT_SHAPES[lot.id];
            if (!shape) return null;
            const selected = lot.id === selectedLot.id;
            return (
              <button
                key={lot.id}
                type="button"
                onClick={() => onSelect(lot)}
                aria-label={`Seleccionar lote ${lot.id}, ${lot.status}`}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs font-extrabold shadow-lg backdrop-blur-md transition hover:scale-105 ${selected ? "border-accent bg-accent text-accent-foreground" : "border-white/25 bg-black/45 text-white hover:border-accent"}`}
                style={{
                  left: `${(shape.label[0] / 1536) * 100}%`,
                  top: `${(shape.label[1] / 1024) * 100}%`,
                }}
              >
                {lot.id}
              </button>
            );
          })}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/10" />
    </div>
  );
}
