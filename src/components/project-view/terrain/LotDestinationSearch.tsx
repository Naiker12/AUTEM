import { useId, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { formatLotArea, formatManzanaLabel, type Lot } from "@/data/lots";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { matchDestinationLots } from "@/features/terrain-navigation/destination-search";

interface Props {
  lots: Lot[];
  destination?: Lot;
  onSelect: (lot: Lot) => void;
}

export default function LotDestinationSearch({ lots, destination, onSelect }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const hasDigits = Boolean(query.replace(/\D/g, ""));

  const suggestedLots = useMemo(() => {
    const valid = lots.filter((lot) => lot.centroid && !lot.isReserve);
    const available = valid.filter((lot) => lot.status === "Disponible");
    const source = available.length > 0 ? available : valid;
    return [...source].sort((a, b) => (a.lotNumber ?? 9999) - (b.lotNumber ?? 9999)).slice(0, 8);
  }, [lots]);

  const matches = useMemo(
    () => (hasDigits ? matchDestinationLots(lots, query) : suggestedLots),
    [hasDigits, lots, query, suggestedLots],
  );

  const select = (lot: Lot) => {
    onSelect(lot);
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Buscar lote por número
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-results`}
        aria-activedescendant={open && matches[active] ? `${id}-${active}` : undefined}
        inputMode="numeric"
        autoComplete="off"
        placeholder={
          destination
            ? `Cambiar destino (actual: Lote ${destination.lotNumber ?? destination.id})...`
            : "Escribe el número de lote (ej. 45)..."
        }
        value={query}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActive((value) =>
              Math.max(
                0,
                Math.min(matches.length - 1, value + (event.key === "ArrowDown" ? 1 : -1)),
              ),
            );
          }
          if (event.key === "Enter" && open && matches[active]) {
            event.preventDefault();
            select(matches[active]);
          }
        }}
        className="h-11 rounded-xl border-border/80 bg-background/80 pl-10 pr-10 text-sm shadow-xs transition-colors focus-visible:border-accent"
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-0.5 size-10 rounded-xl text-muted-foreground hover:text-foreground"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            setQuery("");
            setActive(0);
            setOpen(true);
          }}
        >
          <X className="size-4" />
        </Button>
      )}
      {open && (
        <div
          id={`${id}-results`}
          role="listbox"
          aria-label="Lotes encontrados"
          className="absolute inset-x-0 top-12 z-40 max-h-68 overflow-auto rounded-2xl border border-border/80 bg-popover/98 p-1.5 shadow-2xl backdrop-blur-xl"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {hasDigits
              ? `Resultados para "${query.replace(/\D/g, "")}"`
              : "Sugerencias · Lotes disponibles"}
          </div>
          {matches.map((lot, index) => {
            const isSold = lot.status === "Vendido";
            const isReserved = lot.status === "Reservado";
            const statusDot = isSold
              ? "bg-rose-500"
              : isReserved
                ? "bg-orange-500"
                : "bg-emerald-500";
            return (
              <button
                type="button"
                role="option"
                id={`${id}-${index}`}
                key={lot.id}
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(lot)}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted/80 aria-selected:bg-muted"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      Lote {lot.lotNumber ?? lot.id}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      <span className={`size-1.5 rounded-full ${statusDot}`} />
                      {lot.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatManzanaLabel(lot.manzana)} · {formatLotArea(lot.area)}
                  </p>
                </div>
                {destination?.id === lot.id && <Check className="size-4 shrink-0 text-accent" />}
              </button>
            );
          })}
          {!matches.length && (
            <p role="status" className="p-3 text-center text-sm text-muted-foreground">
              No encontramos un lote con ese número.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
