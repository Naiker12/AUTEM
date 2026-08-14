import { Compass, Layers3, LocateFixed, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export default function MapControls({ zoom, onZoomChange }: MapControlsProps) {
  return (
    <div className="absolute right-4 top-24 z-30 hidden flex-col items-center gap-3 md:flex">
      <div className="relative flex size-20 items-center justify-center rounded-full border border-border bg-background/85 text-foreground shadow-2xl backdrop-blur-xl">
        <Compass className="size-9 text-accent" strokeWidth={1.4} />
        <span className="absolute top-1 text-[8px] font-bold">N</span>
        <span className="absolute bottom-1 text-[8px]">S</span>
        <span className="absolute left-2 text-[8px]">O</span>
        <span className="absolute right-2 text-[8px]">E</span>
      </div>
      <div className="grid overflow-hidden rounded-2xl border border-border bg-background/90 shadow-2xl backdrop-blur-xl">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onZoomChange(Math.min(1.35, zoom + 0.08))}
          className="size-11 rounded-none border-b border-border text-foreground hover:bg-muted hover:text-accent"
          aria-label="Acercar"
        >
          <Plus />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onZoomChange(Math.max(1, zoom - 0.08))}
          className="size-11 rounded-none border-b border-border text-foreground hover:bg-muted hover:text-accent"
          aria-label="Alejar"
        >
          <Minus />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onZoomChange(1)}
          className="size-11 rounded-none border-b border-border text-foreground hover:bg-muted hover:text-accent"
          aria-label="Centrar mapa"
        >
          <LocateFixed />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-none text-foreground hover:bg-muted hover:text-accent"
          aria-label="Ver capas"
        >
          <Layers3 />
        </Button>
      </div>
    </div>
  );
}
