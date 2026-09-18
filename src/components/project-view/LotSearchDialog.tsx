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

// Chips de accesos rápidos para saltar velozmente a lotes representativos
const QUICK_SEARCH_CHIPS = ["1", "15", "50", "116", "200", "280", "343"];

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
      // Mostrar primeros 15 lotes por defecto cuando no hay búsqueda
      return lots.slice(0, 15);
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
      <DialogContent className="w-[94vw] max-w-md max-h-[85vh] p-4 sm:p-5 rounded-2xl flex flex-col gap-3 overflow-hidden border-border bg-background/98 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-foreground">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Search className="size-4" />
            </span>
            Buscar Lote por Número
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
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
          <Hash className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ejemplo: 116, 25, 4, M 12..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="h-10.5 w-full rounded-xl border border-border/90 bg-muted/40 pl-9 pr-9 text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:border-accent focus:bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>

        {/* Accesos rápidos de números */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar text-xs">
          <span className="text-[10px] font-semibold text-muted-foreground shrink-0">Accesos:</span>
          {QUICK_SEARCH_CHIPS.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setSearchTerm(num)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all shrink-0 cursor-pointer ${
                searchTerm === num
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              L-{num}
            </button>
          ))}
        </div>

        {/* Lista de Resultados Filtrados */}
        <div className="flex items-center justify-between px-1 text-[11px] font-medium text-muted-foreground">
          <span>{searchTerm ? `Resultados para "${searchTerm}":` : "Lotes sugeridos:"}</span>
          <span className="text-[10px] font-bold text-accent">
            {filteredResults.length} encontrados
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[340px]">
          {filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Search className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-foreground">
                No encontramos el lote "{searchTerm}"
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
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
                  className="group flex w-full items-center justify-between rounded-xl border border-border/70 bg-card/80 p-2.5 text-left transition-all hover:border-accent hover:bg-accent/5 hover:shadow-sm active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#403a34] font-bold text-sm text-[#f6f1eb] shadow-xs group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      {lot.lotNumber ?? lot.id.replace(/^L-/, "")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs sm:text-sm font-bold text-foreground">
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
                      <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-muted-foreground">
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
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground group-hover:text-accent transition-colors pl-2 shrink-0">
                    <span className="hidden sm:inline text-[10px]">Ir</span>
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
