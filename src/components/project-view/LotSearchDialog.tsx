import { useMemo, useState } from "react";
import { ArrowRight, Hash, MapPin, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatLotArea, formatLotPrice, type Lot } from "@/data/lots";

interface LotSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lots: Lot[];
  onSelectLot: (lot: Lot) => void;
}

export default function LotSearchDialog({
  open,
  onOpenChange,
  lots,
  onSelectLot,
}: LotSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Búsqueda inteligente en tiempo real por número de lote o manzana
  const filteredResults = useMemo(() => {
    const raw = searchTerm.trim().toLowerCase();
    if (!raw) {
      // Mostrar solo 4 sugerencias compactas si aún no ha buscado
      return lots.slice(0, 4);
    }

    const numericOnly = raw.replace(/\D/g, "");

    const exactMatches: Lot[] = [];
    const prefixMatches: Lot[] = [];
    const partialMatches: Lot[] = [];

    for (const lot of lots) {
      const lotNumStr = String(lot.lotNumber ?? "");
      const lotIdLower = lot.id.toLowerCase();
      const manzanaLower = lot.manzana?.toLowerCase() ?? "";

      // Coincidencia exacta por número o ID
      if (
        (numericOnly && lotNumStr === numericOnly) ||
        lotIdLower === raw ||
        lotIdLower === `l-${numericOnly}`
      ) {
        exactMatches.push(lot);
      }
      // Coincidencia que inicia con el término
      else if (
        (numericOnly && lotNumStr.startsWith(numericOnly)) ||
        lotIdLower.startsWith(raw) ||
        manzanaLower.startsWith(raw)
      ) {
        prefixMatches.push(lot);
      }
      // Coincidencia parcial
      else if (
        (numericOnly && lotNumStr.includes(numericOnly)) ||
        lotIdLower.includes(raw) ||
        manzanaLower.includes(raw)
      ) {
        partialMatches.push(lot);
      }
    }

    return [...exactMatches, ...prefixMatches, ...partialMatches].slice(0, 30);
  }, [lots, searchTerm]);

  const handleSelect = (lot: Lot) => {
    onSelectLot(lot);
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-[380px] max-h-[82vh] p-3.5 sm:p-4 rounded-3xl flex flex-col gap-2.5 overflow-hidden border-border/80 bg-background/98 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="space-y-0 text-left pr-6">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
            <span className="flex size-6 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Search className="size-3.5" />
            </span>
            Buscar Lote por Número
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ingresa el número de lote para localizarlo y hacer zoom directo sin desplazarte.
          </DialogDescription>
        </DialogHeader>

        {/* Formulario de Búsqueda con soporte para tecla Enter */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (filteredResults.length > 0) {
              handleSelect(filteredResults[0]);
            }
          }}
          className="relative flex items-center"
        >
          <Hash className="absolute left-2.5 size-3.5 text-muted-foreground/70 pointer-events-none" />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ej: 116, 25, 4, M 12..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="h-9 w-full rounded-2xl border border-border/80 bg-muted/40 pl-8 pr-8 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:bg-background focus:outline-none focus:ring-1.5 focus:ring-accent/25 transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 flex size-5 items-center justify-center rounded-full text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="size-3" />
            </button>
          )}
        </form>

        {/* Encabezado de Lista de Resultados */}
        <div className="flex items-center justify-between px-1 text-[10px] font-medium text-muted-foreground">
          <span>{searchTerm ? `Resultados para "${searchTerm}":` : "Lotes sugeridos"}</span>
          <span className="text-[9.5px] font-semibold text-accent">
            {filteredResults.length} {searchTerm ? "encontrados" : "sugeridos"}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto space-y-1.5 pr-0.5 max-h-[290px] sm:max-h-[310px] [scrollbar-width:thin] [scrollbar-color:oklch(var(--muted-foreground)/0.2)_transparent]">
          {filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Search className="size-7 text-muted-foreground/40 mb-1.5" />
              <p className="text-xs font-semibold text-foreground">
                No encontramos el lote "{searchTerm}"
              </p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                Intenta con un número entre 1 y 343 o el nombre de una manzana.
              </p>
            </div>
          ) : (
            filteredResults.map((lot) => {
              const isSold = lot.status === "Vendido";
              const isReserved = lot.status === "Reservado";
              const isLastUnits = lot.status === "Últimas unidades";

              let badgeClass =
                "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300";
              let dotClass = "bg-emerald-500";
              if (isSold) {
                badgeClass =
                  "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300";
                dotClass = "bg-rose-500";
              } else if (isReserved) {
                badgeClass =
                  "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-300";
                dotClass = "bg-orange-500";
              } else if (isLastUnits) {
                badgeClass =
                  "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300";
                dotClass = "bg-amber-500";
              }

              return (
                <button
                  key={lot.id}
                  type="button"
                  onClick={() => handleSelect(lot)}
                  className="group flex w-full items-center justify-between rounded-2xl border border-border/70 dark:border-white/10 bg-card/90 dark:bg-stone-900/80 px-3 py-2 text-left transition-all hover:border-accent/80 hover:bg-accent/5 dark:hover:bg-white/5 hover:shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">
                        {lot.id}
                      </strong>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-1.5 py-0 text-[7.5px] font-semibold flex items-center gap-1 ${badgeClass}`}
                      >
                        <span className={`size-1 rounded-full ${dotClass}`} />
                        {lot.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-muted-foreground truncate">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="size-2.5 text-accent" /> {lot.manzana}
                      </span>
                      <span>·</span>
                      <span>{formatLotArea(lot.area)}</span>
                      {lot.price > 0 && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-foreground">
                            {formatLotPrice(lot.price)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center pl-2 shrink-0 text-muted-foreground group-hover:text-accent transition-colors">
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
