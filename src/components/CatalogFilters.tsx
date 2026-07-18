import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
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

interface CatalogFiltersProps {
  filters: CatalogFiltersState;
  onChange: (filters: CatalogFiltersState) => void;
  totalResults: number;
}

const PRECIO_MIN = 0;
const PRECIO_MAX = 5000000;
const PRECIO_STEP = 50000;

function formatPrice(val: number): string {
  if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `€${(val / 1000).toFixed(0)}k`;
  return `€${val}`;
}

function FiltersContent({
  filters,
  onChange,
}: {
  filters: CatalogFiltersState;
  onChange: (f: CatalogFiltersState) => void;
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
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Tipo de propiedad
        </label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => toggleTipo(t.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                filters.tipo.includes(t.value)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Rango de precio
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{formatPrice(filters.precioMin)}</span>
          <input
            type="range"
            min={PRECIO_MIN}
            max={PRECIO_MAX}
            step={PRECIO_STEP}
            value={filters.precioMin}
            onChange={(e) =>
              onChange({
                ...filters,
                precioMin: Math.min(Number(e.target.value), filters.precioMax - PRECIO_STEP),
              })
            }
            className="h-1 flex-1 cursor-pointer accent-accent"
          />
          <input
            type="range"
            min={PRECIO_MIN}
            max={PRECIO_MAX}
            step={PRECIO_STEP}
            value={filters.precioMax}
            onChange={(e) =>
              onChange({
                ...filters,
                precioMax: Math.max(Number(e.target.value), filters.precioMin + PRECIO_STEP),
              })
            }
            className="h-1 flex-1 cursor-pointer accent-accent"
          />
          <span className="text-xs text-muted-foreground">{formatPrice(filters.precioMax)}</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Habitaciones
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() =>
                onChange({
                  ...filters,
                  habitaciones: filters.habitaciones === n ? null : n,
                })
              }
              className={`flex size-10 items-center justify-center rounded-full border text-xs font-medium transition-all ${
                filters.habitaciones === n
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
              }`}
            >
              {n === 5 ? "5+" : n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Tecnología
        </label>
        <div className="flex flex-wrap gap-2">
          {TECH_TAGS.map((t) => (
            <button
              key={t.value}
              onClick={() => toggleTechTag(t.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                filters.techTags.includes(t.value)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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

export default function CatalogFilters({ filters, onChange, totalResults }: CatalogFiltersProps) {
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

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          <FiltersContent filters={filters} onChange={onChange} />
        </div>
      </div>

      {/* Mobile */}
      <div className="flex items-center justify-between md:hidden">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{totalResults}</span> propiedades
        </p>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
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
            <FiltersContent filters={filters} onChange={onChange} />
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setMobileOpen(false)}>
                Ver {totalResults} resultados
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active filter chips (desktop) */}
      {hasActiveFilters && (
        <div className="mt-4 hidden flex-wrap items-center gap-2 md:flex">
          {filters.zona !== "all" && (
            <FilterChip
              label={filters.zona}
              onRemove={() => onChange({ ...filters, zona: "all" })}
            />
          )}
          {filters.tipo.map((t) => (
            <FilterChip
              key={t}
              label={PROPERTY_TYPES.find((p) => p.value === t)?.label || t}
              onRemove={() => toggleTipo(t)}
            />
          ))}
          {filters.habitaciones !== null && (
            <FilterChip
              label={`${filters.habitaciones}+ hab.`}
              onRemove={() => onChange({ ...filters, habitaciones: null })}
            />
          )}
          {filters.techTags.map((t) => (
            <FilterChip key={t} label={t} onRemove={() => toggleTechTag(t)} />
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-accent underline-offset-2 hover:underline"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </>
  );

  function toggleTipo(t: PropertyType) {
    const next = filters.tipo.includes(t)
      ? filters.tipo.filter((x) => x !== t)
      : [...filters.tipo, t];
    onChange({ ...filters, tipo: next });
  }

  function toggleTechTag(t: TechTag) {
    const next = filters.techTags.includes(t)
      ? filters.techTags.filter((x) => x !== t)
      : [...filters.techTags, t];
    onChange({ ...filters, techTags: next });
  }
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs">
      {label}
      <button onClick={onRemove} className="ml-0.5 text-muted-foreground hover:text-foreground">
        <X size={12} />
      </button>
    </span>
  );
}
