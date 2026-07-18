import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, Suspense, lazy } from "react";
import { MapPin, Grid3X3 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import CatalogFilters, {
  type CatalogFiltersState,
  type FilterCounts,
} from "@/components/CatalogFilters";
import SkeletonCard from "@/components/SkeletonCard";
import {
  properties,
  ZONAS,
  PROPERTY_TYPES,
  TECH_TAGS,
  type Property,
  type PropertyType,
  type TechTag,
} from "@/data/properties";

const MapView = lazy(() => import("@/components/MapView"));

const defaultFilters: CatalogFiltersState = {
  zona: "all",
  tipo: [],
  precioMin: 0,
  precioMax: 5000000,
  habitaciones: null,
  techTags: [],
  sort: "relevancia",
};

function parseFiltersFromURL(search: Record<string, unknown>): CatalogFiltersState {
  const validTipos: PropertyType[] = ["villa", "apartamento", "penthouse", "terreno"];
  const validTech: TechTag[] = ["3D Tour", "AR Ready", "Nuevo lanzamiento"];

  const rawTipo = search.tipo ? (search.tipo as string).split(",") : [];
  const rawTech = search.tech ? (search.tech as string).split(",") : [];

  return {
    zona: (search.zona as string) || "all",
    tipo: rawTipo.filter((t): t is PropertyType => validTipos.includes(t as PropertyType)),
    precioMin: search.precio_min ? Number(search.precio_min) : 0,
    precioMax: search.precio_max ? Number(search.precio_max) : 5000000,
    habitaciones: search.habitaciones ? Number(search.habitaciones) : null,
    techTags: rawTech.filter((t): t is TechTag => validTech.includes(t as TechTag)),
    sort: (search.sort as string) || "relevancia",
  };
}

function filtersToURL(filters: CatalogFiltersState): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.zona !== "all") params.zona = filters.zona;
  if (filters.tipo.length > 0) params.tipo = filters.tipo.join(",");
  if (filters.precioMin > 0) params.precio_min = String(filters.precioMin);
  if (filters.precioMax < 5000000) params.precio_max = String(filters.precioMax);
  if (filters.habitaciones !== null) params.habitaciones = String(filters.habitaciones);
  if (filters.techTags.length > 0) params.tech = filters.techTags.join(",");
  if (filters.sort !== "relevancia") params.sort = filters.sort;
  return params;
}

function applyFilters(all: Property[], filters: CatalogFiltersState): Property[] {
  let result = [...all];

  if (filters.zona !== "all") {
    result = result.filter((p) => p.zona === filters.zona);
  }
  if (filters.tipo.length > 0) {
    result = result.filter((p) => filters.tipo.includes(p.type));
  }
  result = result.filter(
    (p) => p.priceNumeric >= filters.precioMin && p.priceNumeric <= filters.precioMax,
  );
  if (filters.habitaciones !== null) {
    const min = filters.habitaciones >= 5 ? 5 : filters.habitaciones;
    result = result.filter((p) => p.bedrooms >= min);
  }
  if (filters.techTags.length > 0) {
    result = result.filter((p) => filters.techTags.every((t) => p.tags.includes(t)));
  }

  switch (filters.sort) {
    case "precio-asc":
      result.sort((a, b) => a.priceNumeric - b.priceNumeric);
      break;
    case "precio-desc":
      result.sort((a, b) => b.priceNumeric - a.priceNumeric);
      break;
    case "recientes":
      result.sort((a, b) => b.year - a.year);
      break;
    default:
      break;
  }

  return result;
}

function computeFilterCounts(filters: CatalogFiltersState): FilterCounts {
  return {
    tipo: Object.fromEntries(
      PROPERTY_TYPES.map((t) => [
        t.value,
        applyFilters(properties, { ...filters, tipo: [t.value] }).length,
      ]),
    ) as Record<PropertyType, number>,
    zona: Object.fromEntries(
      ZONAS.map((z) => [z, applyFilters(properties, { ...filters, zona: z }).length]),
    ) as Record<string, number>,
    habitaciones: Object.fromEntries(
      [1, 2, 3, 4, 5].map((n) => [
        n,
        applyFilters(properties, { ...filters, habitaciones: n }).length,
      ]),
    ) as Record<number, number>,
    tech: Object.fromEntries(
      TECH_TAGS.map((t) => [
        t.value,
        applyFilters(properties, { ...filters, techTags: [t.value] }).length,
      ]),
    ) as Record<TechTag, number>,
  };
}

const ITEMS_PER_PAGE = 6;

export const Route = createFileRoute("/catalogo")({
  component: CatalogoPage,
  validateSearch: (search: Record<string, unknown>) => ({
    zona: search.zona || "all",
    tipo: search.tipo || "",
    precio_min: search.precio_min || "",
    precio_max: search.precio_max || "",
    habitaciones: search.habitaciones || "",
    tech: search.tech || "",
    sort: search.sort || "relevancia",
  }),
});

function ViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: "grid" | "map";
  onChange: (mode: "grid" | "map") => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
      <button
        onClick={() => onChange("grid")}
        className={`flex size-7 items-center justify-center rounded-md transition-all ${
          viewMode === "grid"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Vista cuadrícula"
      >
        <Grid3X3 size={14} />
      </button>
      <button
        onClick={() => onChange("map")}
        className={`flex size-7 items-center justify-center rounded-md transition-all ${
          viewMode === "map"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Vista mapa"
      >
        <MapPin size={14} />
      </button>
    </div>
  );
}

function CatalogoPage() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const [filters, setFilters] = useState<CatalogFiltersState>(() =>
    parseFiltersFromURL(searchParams),
  );
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setFilters(parseFiltersFromURL(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => applyFilters(properties, filters), [filters]);
  const filterCounts = useMemo(() => computeFilterCounts(filters), [filters]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleFiltersChange = (newFilters: CatalogFiltersState) => {
    setFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
    const urlParams = filtersToURL(newFilters);
    navigate({ search: urlParams, replace: true });
  };

  const title = useMemo(() => {
    if (filters.zona !== "all" && filters.tipo.length === 1) {
      const tipoLabel = filters.tipo[0].charAt(0).toUpperCase() + filters.tipo[0].slice(1) + "s";
      return `${tipoLabel} en ${filters.zona}`;
    }
    if (filters.zona !== "all") return `Propiedades en ${filters.zona}`;
    if (filters.tipo.length === 1) {
      const tipoLabel = filters.tipo[0].charAt(0).toUpperCase() + filters.tipo[0].slice(1) + "s";
      return `Todas las ${tipoLabel}`;
    }
    return "Catálogo completo";
  }, [filters.zona, filters.tipo]);

  useEffect(() => {
    document.title = title !== "Catálogo completo" ? `${title} | AUTEM` : "Catálogo | AUTEM";
  }, [title]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/30">
      <Navbar variant="inner" />

      <main id="main-content">
        <section className="px-6 pt-28 pb-6 md:px-8 md:pt-32">
          <div className="mx-auto max-w-7xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
              Explorar
            </span>
            <h1 className="mt-2 font-serif text-3xl md:text-4xl lg:text-5xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "propiedad disponible" : "propiedades disponibles"}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="flex gap-0 lg:gap-10">
            {/* ── Desktop sidebar ── */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-[72px] max-h-[calc(100vh-72px)] overflow-y-auto pt-6 pb-8 pr-6 border-r border-border/30">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Filtros
                </p>
                <CatalogFilters
                  mode="sidebar"
                  filters={filters}
                  onChange={handleFiltersChange}
                  counts={filterCounts}
                />
              </div>
            </aside>

            {/* ── Content ── */}
            <div className="flex-1 min-w-0">
              {/* Mobile controls bar */}
              <div className="lg:hidden sticky top-[72px] z-40 -mx-6 border-b border-border/40 bg-background/90 px-6 py-3 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <CatalogFilters
                    mode="sheet"
                    filters={filters}
                    onChange={handleFiltersChange}
                    totalResults={filtered.length}
                    counts={filterCounts}
                  />
                  <ViewToggle viewMode={viewMode} onChange={setViewMode} />
                </div>
              </div>

              {/* Desktop content header */}
              <div className="hidden lg:flex items-center justify-between border-b border-border/30 py-5">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? "propiedad" : "propiedades"}
                </p>
                <ViewToggle viewMode={viewMode} onChange={setViewMode} />
              </div>

              {/* Grid / Map */}
              <div className="py-8">
                {viewMode === "grid" ? (
                  <>
                    {isLoading ? (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <SkeletonCard key={i} />
                        ))}
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-muted">
                          <MapPin size={20} className="text-muted-foreground" />
                        </div>
                        <h3 className="font-serif text-2xl">No encontramos propiedades</h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                          No hay propiedades que coincidan con estos filtros. Intenta ajustar los
                          criterios de búsqueda.
                        </p>
                        <button
                          onClick={() => handleFiltersChange(defaultFilters)}
                          className="mt-6 border-b border-accent pb-1 text-sm font-medium text-accent transition-colors hover:text-foreground"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                          {visible.map((p) => (
                            <PropertyCard key={p.id} property={p} />
                          ))}
                        </div>

                        {hasMore && (
                          <div className="mt-10 flex justify-center">
                            <button
                              onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                              className="border border-border px-10 py-3 text-xs font-medium uppercase tracking-widest transition-all hover:border-accent hover:text-accent"
                            >
                              Cargar más ({filtered.length - visibleCount} restantes)
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="h-[600px] overflow-hidden rounded-2xl border border-border">
                    <Suspense
                      fallback={
                        <div className="flex h-full items-center justify-center bg-muted">
                          <div className="text-sm text-muted-foreground">Cargando mapa…</div>
                        </div>
                      }
                    >
                      <MapView properties={filtered} />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="border-t border-border bg-muted/30 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Asesoría personalizada
          </span>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl">¿No encuentras lo que buscas?</h2>
          <p className="mt-4 text-muted-foreground">
            Agenda una consulta privada con nuestro equipo y te ayudamos a encontrar la propiedad
            perfecta para tu inversión.
          </p>
          <a
            href="https://wa.me/573007200894?text=Hola%20AUTEM%2C%20me%20gustar%C3%ADa%20una%20asesor%C3%ADa%20personalizada."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block bg-primary px-10 py-4 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-all hover:bg-accent hover:text-accent-foreground"
          >
            Agendar asesoría
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
