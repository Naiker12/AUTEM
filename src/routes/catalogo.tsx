import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, Suspense, lazy } from "react";
import { MapPin, Grid3X3, List } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import CatalogFilters, { type CatalogFiltersState } from "@/components/CatalogFilters";
import SkeletonCard from "@/components/SkeletonCard";
import { properties, type Property } from "@/data/properties";

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

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent/30">
      <Navbar variant="inner" />

      <section className="px-6 pt-28 pb-8 md:px-8 md:pt-32">
        <div className="mx-auto max-w-7xl">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">Explorar</span>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">
            <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "propiedad disponible" : "propiedades disponibles"}
          </p>
        </div>
      </section>

      <section className="sticky top-[72px] z-40 border-b border-border bg-background/90 px-6 backdrop-blur-md md:px-8">
        <div className="mx-auto max-w-7xl py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CatalogFilters
                filters={filters}
                onChange={handleFiltersChange}
                totalResults={filtered.length}
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex size-8 items-center justify-center rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Vista cuadrícula"
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex size-8 items-center justify-center rounded-md transition-all ${
                  viewMode === "map"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label="Vista mapa"
              >
                <MapPin size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        {viewMode === "grid" ? (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
                  <List size={24} className="text-muted-foreground" />
                </div>
                <h3 className="font-serif text-2xl">No encontramos propiedades</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  No hay propiedades que coincidan con estos filtros. Intenta ajustar los criterios
                  de búsqueda.
                </p>
                <button
                  onClick={() =>
                    handleFiltersChange({
                      zona: "all",
                      tipo: [],
                      precioMin: 0,
                      precioMax: 5000000,
                      habitaciones: null,
                      techTags: [],
                      sort: "relevancia",
                    })
                  }
                  className="mt-6 border-b border-accent pb-1 text-sm font-medium text-accent transition-colors hover:text-foreground"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-12 flex justify-center">
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
      </section>

      <section className="border-t border-border bg-muted/30 px-6 py-20 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            Asesoría personalizada
          </span>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl">¿No encuentras lo que buscas?</h2>
          <p className="mt-4 text-muted-foreground">
            Agenda una consulta privada con nuestro equipo y te ayudamos a encontrar la propiedad
            perfecta para tu inversión.
          </p>
          <a
            href="https://wa.me/34600000000?text=Hola%20AUTEM%2C%20me%20gustar%C3%ADa%20una%20asesor%C3%ADa%20personalizada."
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
