import { Box, Download, Heart, Map, Ruler, ScanLine, Trees, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatLotArea, formatLotPrice, type Lot } from "@/data/lots";

interface SelectedLotPanelProps {
  lot: Lot;
  onClose: () => void;
  onView3D: () => void;
}

export default function SelectedLotPanel({ lot, onClose, onView3D }: SelectedLotPanelProps) {
  const [saved, setSaved] = useState(false);

  return (
    <aside className="absolute bottom-4 left-[390px] top-[86px] z-30 hidden w-[310px] flex-col overflow-hidden rounded-[22px] border border-border bg-background/94 text-foreground shadow-[0_30px_80px_rgba(0,0,0,.34)] backdrop-blur-2xl 2xl:flex">
      <div className="relative h-36 shrink-0 overflow-hidden">
        <img
          src={lot.previewImage}
          alt={`Vista del lote ${lot.id}`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/25" />
        <Badge className="absolute left-4 top-4 border-white/15 bg-black/45 text-[9px] text-white backdrop-blur-md">
          Vista 01 / 03
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/45 text-white hover:bg-black/70 hover:text-white"
          aria-label="Cerrar ficha"
        >
          <X />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">{lot.id}</h2>
              <Badge className="rounded-full bg-accent/15 text-[9px] text-accent hover:bg-accent/20">
                {lot.status}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Proyecto AUTEM · Vida que inspira</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSaved((value) => !value)}
            className={`mt-1 rounded-full hover:bg-muted ${saved ? "text-accent" : "text-muted-foreground"}`}
            aria-label="Guardar lote"
          >
            <Heart fill={saved ? "currentColor" : "none"} />
          </Button>
        </div>

        <Separator className="my-4 bg-border" />
        <dl className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex gap-2">
            <Ruler className="mt-0.5 size-4 text-accent" />
            <div>
              <dt className="text-muted-foreground">Área</dt>
              <dd className="mt-1 font-semibold">{formatLotArea(lot.area)}</dd>
            </div>
          </div>
          <div className="flex gap-2">
            <ScanLine className="mt-0.5 size-4 text-accent" />
            <div>
              <dt className="text-muted-foreground">Precio</dt>
              <dd className="mt-1 font-semibold">{formatLotPrice(lot.price)}</dd>
            </div>
          </div>
          <div className="flex gap-2">
            <Map className="mt-0.5 size-4 text-accent" />
            <div>
              <dt className="text-muted-foreground">Frente</dt>
              <dd className="mt-1 font-semibold">50 m</dd>
            </div>
          </div>
          <div className="flex gap-2">
            <Trees className="mt-0.5 size-4 text-accent" />
            <div>
              <dt className="text-muted-foreground">Entorno</dt>
              <dd className="mt-1 font-semibold">Natural</dd>
            </div>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Vista panorámica", "Acceso vial", "Zona social"].map((feature) => (
            <Badge
              key={feature}
              variant="outline"
              className="border-border bg-muted/60 text-[8px] font-medium text-muted-foreground"
            >
              {feature}
            </Badge>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          {lot.detail}. Ubicación privilegiada, conexión directa con la naturaleza y alto potencial
          de valorización.
        </p>

        <div className="mt-auto space-y-2 pt-4">
          <Button
            type="button"
            onClick={onView3D}
            className="h-11 w-full rounded-full border border-[#403a34] bg-[#403a34] text-[11px] font-medium uppercase tracking-[0.1em] text-[#f6f1eb] hover:bg-transparent hover:text-[#403a34] transition-all duration-300 dark:border-white/20 dark:bg-[#c5a059] dark:text-[#151413] dark:hover:bg-[#f6f1eb]"
          >
            <Box /> Ver en 3D / Recorrido
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-full border border-[#403a34]/30 bg-transparent text-[11px] font-medium uppercase tracking-[0.08em] text-[#403a34] hover:bg-[#403a34] hover:text-[#f6f1eb] transition-all duration-300 dark:border-white/20 dark:text-white dark:hover:bg-white dark:hover:text-[#151413]"
          >
            <ScanLine /> Ver en AR
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full rounded-full text-[10px] uppercase tracking-[0.08em] text-[#555555] hover:bg-[#403a34]/5 hover:text-[#403a34] transition-all dark:text-white/60 dark:hover:text-white"
          >
            <Download /> Descargar ficha
          </Button>
        </div>
      </div>
    </aside>
  );
}
