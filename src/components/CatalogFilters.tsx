import { SlidersHorizontal, X, Link2, Check } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { ZONAS, PROPERTY_TYPES, TECH_TAGS } from "@/data/properties";
import type { PropertyType, TechTag } from "@/data/properties";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export interface CatalogFiltersState {
  zona: string;
  tipo: PropertyType[];
  precioMin: number;
  precioMax: number;
  habitaciones: number | null;
  techTags: TechTag[];
  sort: string;
}

export interface FilterCounts {
  tipo: Record<PropertyType, number>;
  zona: Record<string, number>;
  habitaciones: Record<number, number>;
  tech: Record<TechTag, number>;
}

interface CatalogFiltersProps {
  mode: "sidebar" | "sheet";
  filters: CatalogFiltersState;
  onChange: (filters: CatalogFiltersState) => void;
  totalResults?: number;
  counts?: FilterCounts;
}

const PRECIO_MIN = 0;
const PRECIO_MAX = 5000000;
const PRECIO_STEP = 50000;

function formatPrice(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${val}`;
}

/* ─── Custom dual-thumb price slider ──────────────────────── */

function PriceRange({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<"min" | "max" | null>(null);

  const pct = (val: number) => ((val - min) / (max - min)) * 100;

  const getValue = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      return Math.round((min + p * (max - min)) / step) * step;
    },
    [min, max, step],
  );

  useEffect(() => {
    if (!active) return;
    const onMove = (e: PointerEvent) => {
      const val = getValue(e.clientX);
      if (active === "min") {
        onChange(Math.min(val, valueMax - step), valueMax);
      } else {
        onChange(valueMin, Math.max(val, valueMin + step));
      }
    };
    const onUp = () => setActive(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [active, valueMin, valueMax, step, getValue, onChange]);

  const minP = pct(valueMin);
  const maxP = pct(valueMax);
  const minLabel = formatPrice(valueMin);
  const maxLabel = formatPrice(valueMax);

  return (
    <div className="relative select-none pt-7 pb-2">
      <div
        className="absolute top-0 z-10 transition-opacity duration-150"
        style={{
          left: `${minP}%`,
          transform: "translateX(-50%)",
          opacity: active === "min" ? 1 : 0.7,
        }}
      >
        <span className="inline-block rounded-md bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-wide text-background whitespace-nowrap shadow-sm">
          {minLabel}
        </span>
      </div>
      <div
        className="absolute top-0 z-10 transition-opacity duration-150"
        style={{
          left: `${maxP}%`,
          transform: "translateX(-50%)",
          opacity: active === "max" ? 1 : 0.7,
        }}
      >
        <span className="inline-block rounded-md bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-wide text-background whitespace-nowrap shadow-sm">
          {maxLabel}
        </span>
      </div>

      <div ref={trackRef} className="relative h-1 cursor-pointer rounded-full bg-border/80">
        <div
          className="absolute h-full rounded-full bg-accent"
          style={{ left: `${minP}%`, width: `${maxP - minP}%` }}
        />
        <div
          className={`absolute top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-md transition-transform duration-150 ${
            active === "min" ? "bg-accent scale-125" : "bg-accent"
          }`}
          style={{ left: `${minP}%`, touchAction: "none" }}
          onPointerDown={(e) => {
            e.preventDefault();
            setActive("min");
          }}
        />
        <div
          className={`absolute top-1/2 z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-md transition-transform duration-150 ${
            active === "max" ? "bg-accent scale-125" : "bg-accent"
          }`}
          style={{ left: `${maxP}%`, touchAction: "none" }}
          onPointerDown={(e) => {
            e.preventDefault();
            setActive("max");
          }}
        />
      </div>
    </div>
  );
}

/* ─── Filter content (shared between sidebar & sheet) ──────── */

function FiltersContent({
  filters,
  onChange,
  counts,
}: {
  filters: CatalogFiltersState;
  onChange: (f: CatalogFiltersState) => void;
  counts?: FilterCounts;
}) {
  const toggleTipo = (t: PropertyType) => {
    const next = filters.tipo.includes(t)
      ? filters.tipo.filter((x) => x !== t)
      : [...filters.tipo, t];
    onChange({ ...filters, tipo: next });
  };

  const toggleTechTag = (t: TechTag) => {
    const next = filters.techTags.includes(t)
      ? filters.techTags.filter((x) => x !== t)
      : [...filters.techTags, t];
    onChange({ ...filters, techTags: next });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Zona
        </label>
        <Select value={filters.zona} onValueChange={(v) => onChange({ ...filters, zona: v })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todas las zonas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las zonas</SelectItem>
            {ZONAS.map((z) => (
              <SelectItem key={z} value={z}>
                {z}
                {counts?.zona[z] !== undefined && (
                  <span className="ml-1.5 text-muted-foreground">({counts.zona[z]})</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Tipo de propiedad
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => toggleTipo(t.value)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                filters.tipo.includes(t.value)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-accent/60 hover:text-foreground"
              }`}
            >
              {t.label}
              {counts?.tipo[t.value] !== undefined && (
                <span className="ml-1 opacity-70">{counts.tipo[t.value]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Rango de precio
        </label>
        <PriceRange
          min={PRECIO_MIN}
          max={PRECIO_MAX}
          step={PRECIO_STEP}
          valueMin={filters.precioMin}
          valueMax={filters.precioMax}
          onChange={(min, max) => onChange({ ...filters, precioMin: min, precioMax: max })}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Habitaciones
        </label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() =>
                onChange({
                  ...filters,
                  habitaciones: filters.habitaciones === n ? null : n,
                })
              }
              className={`flex h-9 items-center gap-1 rounded-full border px-3 text-[11px] font-medium transition-all ${
                filters.habitaciones === n
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-accent/60 hover:text-foreground"
              }`}
            >
              {n === 5 ? "5+" : n}
              {counts?.habitaciones[n] !== undefined && (
                <span className="opacity-70">{counts.habitaciones[n]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Tecnología
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TECH_TAGS.map((t) => (
            <button
              key={t.value}
              onClick={() => toggleTechTag(t.value)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                filters.techTags.includes(t.value)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-accent/60 hover:text-foreground"
              }`}
            >
              {t.label}
              {counts?.tech[t.value] !== undefined && (
                <span className="ml-1 opacity-70">{counts.tech[t.value]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-1" />

      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Ordenar por
        </label>
        <Select value={filters.sort} onValueChange={(v) => onChange({ ...filters, sort: v })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevancia">Relevancia</SelectItem>
            <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
            <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
            <SelectItem value="recientes">Más recientes</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/* ─── Active filter chips ──────────────────────────────────── */

function ActiveChips({
  filters,
  onChange,
  onClearAll,
}: {
  filters: CatalogFiltersState;
  onChange: (f: CatalogFiltersState) => void;
  onClearAll: () => void;
}) {
  const hasActive =
    filters.zona !== "all" ||
    filters.tipo.length > 0 ||
    filters.precioMin > PRECIO_MIN ||
    filters.precioMax < PRECIO_MAX ||
    filters.habitaciones !== null ||
    filters.techTags.length > 0;

  if (!hasActive) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {filters.zona !== "all" && (
        <Chip label={filters.zona} onRemove={() => onChange({ ...filters, zona: "all" })} />
      )}
      {filters.tipo.map((t) => (
        <Chip
          key={t}
          label={PROPERTY_TYPES.find((p) => p.value === t)?.label || t}
          onRemove={() => onChange({ ...filters, tipo: filters.tipo.filter((x) => x !== t) })}
        />
      ))}
      {filters.habitaciones !== null && (
        <Chip
          label={`${filters.habitaciones}+ hab.`}
          onRemove={() => onChange({ ...filters, habitaciones: null })}
        />
      )}
      {filters.techTags.map((t) => (
        <Chip
          key={t}
          label={t}
          onRemove={() =>
            onChange({ ...filters, techTags: filters.techTags.filter((x) => x !== t) })
          }
        />
      ))}
      <button
        onClick={onClearAll}
        className="text-[11px] text-accent underline-offset-2 hover:underline"
      >
        Limpiar todo
      </button>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px]">
      {label}
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground">
        <X size={10} />
      </button>
    </span>
  );
}

/* ─── Copy search link ─────────────────────────────────────── */

function CopyLink() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? <Check size={12} className="text-accent" /> : <Link2 size={12} />}
      {copied ? "Enlace copiado" : "Copiar enlace de búsqueda"}
    </button>
  );
}

/* ─── Main component ───────────────────────────────────────── */

export default function CatalogFilters({
  mode,
  filters,
  onChange,
  totalResults = 0,
  counts,
}: CatalogFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasActiveFilters =
    filters.zona !== "all" ||
    filters.tipo.length > 0 ||
    filters.precioMin > PRECIO_MIN ||
    filters.precioMax < PRECIO_MAX ||
    filters.habitaciones !== null ||
    filters.techTags.length > 0;

  const clearFilters = () => {
    onChange({
      zona: "all",
      tipo: [],
      precioMin: PRECIO_MIN,
      precioMax: PRECIO_MAX,
      habitaciones: null,
      techTags: [],
      sort: "relevancia",
    });
  };

  /* ── Sidebar mode (desktop) ── */
  if (mode === "sidebar") {
    return (
      <>
        <FiltersContent filters={filters} onChange={onChange} counts={counts} />
        <ActiveChips filters={filters} onChange={onChange} onClearAll={clearFilters} />
        <CopyLink />
      </>
    );
  }

  /* ── Sheet mode (mobile) ── */
  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <SlidersHorizontal size={14} />
          Filtros
          {hasActiveFilters && (
            <span className="flex size-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground">
              !
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filtros
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-normal text-accent">
                Limpiar todo
              </button>
            )}
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        <FiltersContent filters={filters} onChange={onChange} counts={counts} />
        <ActiveChips filters={filters} onChange={onChange} onClearAll={clearFilters} />
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setMobileOpen(false)}>
            Ver {totalResults} {totalResults === 1 ? "resultado" : "resultados"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
