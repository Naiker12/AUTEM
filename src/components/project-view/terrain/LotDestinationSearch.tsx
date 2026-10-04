import { useId, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import type { Lot } from "@/data/lots";
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
  const matches = useMemo(() => matchDestinationLots(lots, query), [lots, query]);
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
      <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
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
            ? `Lote ${destination.lotNumber ?? destination.id}`
            : "¿A qué lote quieres ir?"
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
        className="h-11 rounded-xl pl-10 pr-11"
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 size-11 rounded-xl"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            setQuery("");
            setActive(0);
            setOpen(true);
          }}
        >
          <X />
        </Button>
      )}
      {open && query.replace(/\D/g, "") && (
        <div
          id={`${id}-results`}
          role="listbox"
          aria-label="Lotes encontrados"
          className="absolute inset-x-0 top-12 z-40 max-h-64 overflow-auto rounded-xl border bg-popover p-1 shadow-xl"
        >
          {matches.map((lot, index) => (
            <button
              type="button"
              role="option"
              id={`${id}-${index}`}
              key={lot.id}
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(lot)}
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-sm hover:bg-muted aria-selected:bg-muted"
            >
              <span>
                Lote {lot.lotNumber ?? lot.id}
                <span className="ml-2 text-xs text-muted-foreground">{lot.manzana}</span>
              </span>
              {destination?.id === lot.id && <Check className="size-4 text-accent" />}
            </button>
          ))}
          {!matches.length && (
            <p role="status" className="p-3 text-sm text-muted-foreground">
              No encontramos ese lote.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
