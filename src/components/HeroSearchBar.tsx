import { useState } from "react";
import { Search, MapPin, DollarSign, Building2 } from "lucide-react";
import { ZONAS, PROPERTY_TYPES } from "@/data/properties";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function HeroSearchBar() {
  const [selectedZona, setSelectedZona] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<string>("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedZona && selectedZona !== "all") params.set("zona", selectedZona);
    if (selectedType && selectedType !== "all") params.set("tipo", selectedType);
    if (selectedPrice && selectedPrice !== "all") params.set("precioMax", selectedPrice);

    const query = params.toString();
    const targetUrl = `${import.meta.env.BASE_URL}catalogo${query ? `?${query}` : ""}`;
    window.location.href = targetUrl;
  };

  return (
    <div className="animate-fade-up delay-300 mx-auto w-full max-w-4xl px-3">
      {/* Container: Luxury Dark Obsidian Glassmorphic Capsule */}
      <div className="relative rounded-2xl border border-accent/35 bg-black/85 p-2 md:pl-6 md:pr-2.5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all duration-300 hover:border-accent/60 md:rounded-full">
        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between">

          {/* Field 1: UBICACIÓN */}
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-left transition-all hover:bg-white/10 md:border-0 md:rounded-none md:bg-transparent md:hover:bg-transparent">
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
              <MapPin size={11} className="text-accent" /> Ubicación
            </span>
            <Select
              value={selectedZona || "all"}
              onValueChange={(val) => setSelectedZona(val === "all" ? "" : val)}
            >
              <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-xs md:text-sm font-medium text-stone-200 focus:ring-0 focus:ring-offset-0 shadow-none [&>span]:truncate">
                <SelectValue placeholder="Todas las zonas" />
              </SelectTrigger>
              <SelectContent className="border border-stone-800 bg-stone-950/95 text-stone-100 backdrop-blur-2xl shadow-2xl z-[99999]">
                <SelectItem value="all" className="cursor-pointer hover:bg-accent/20 hover:text-accent text-xs md:text-sm">
                  Todas las zonas (Caribe)
                </SelectItem>
                {ZONAS.map((z) => (
                  <SelectItem key={z} value={z} className="cursor-pointer hover:bg-accent/20 hover:text-accent text-xs md:text-sm">
                    {z}, Bolívar
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden h-7 w-px bg-white/15 md:block" />

          {/* Field 2: PROPIEDAD */}
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-left transition-all hover:bg-white/10 md:border-0 md:rounded-none md:bg-transparent md:hover:bg-transparent">
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
              <Building2 size={11} className="text-accent" /> Propiedad
            </span>
            <Select
              value={selectedType || "all"}
              onValueChange={(val) => setSelectedType(val === "all" ? "" : val)}
            >
              <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-xs md:text-sm font-medium text-stone-200 focus:ring-0 focus:ring-offset-0 shadow-none [&>span]:truncate">
                <SelectValue placeholder="Cualquier inmueble" />
              </SelectTrigger>
              <SelectContent className="border border-stone-800 bg-stone-950/95 text-stone-100 backdrop-blur-2xl shadow-2xl z-[99999]">
                <SelectItem value="all" className="cursor-pointer hover:bg-accent/20 hover:text-accent text-xs md:text-sm">
                  Cualquier inmueble
                </SelectItem>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="cursor-pointer hover:bg-accent/20 hover:text-accent text-xs md:text-sm">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden h-7 w-px bg-white/15 md:block" />

          {/* Field 3: PRESUPUESTO */}
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-left transition-all hover:bg-white/10 md:border-0 md:rounded-none md:bg-transparent md:hover:bg-transparent">
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
              <DollarSign size={11} className="text-accent" /> Presupuesto
            </span>
            <Select
              value={selectedPrice || "all"}
              onValueChange={(val) => setSelectedPrice(val === "all" ? "" : val)}
            >
              <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-xs md:text-sm font-medium text-stone-200 focus:ring-0 focus:ring-offset-0 shadow-none [&>span]:truncate">
                <SelectValue placeholder="$180K – $3.2M+ USD" />
              </SelectTrigger>
              <SelectContent className="border border-stone-800 bg-stone-950/95 text-stone-100 backdrop-blur-2xl shadow-2xl z-[99999]">
                <SelectItem value="all" className="cursor-pointer hover:bg-accent/20 hover:text-accent text-xs md:text-sm">
                  Cualquier presupuesto ($180K – $3.2M+)
                </SelectItem>
                <SelectItem value="500000" className="cursor-pointer hover:bg-accent/20 hover:text-accent text-xs md:text-sm">
                  Hasta $500K USD
                </SelectItem>
                <SelectItem value="1000000" className="cursor-pointer hover:bg-accent/20 hover:text-accent text-xs md:text-sm">
                  Hasta $1.0M USD
                </SelectItem>
                <SelectItem value="2000000" className="cursor-pointer hover:bg-accent/20 hover:text-accent text-xs md:text-sm">
                  Hasta $2.0M USD
                </SelectItem>
                <SelectItem value="3500000" className="cursor-pointer hover:bg-accent/20 hover:text-accent text-xs md:text-sm">
                  Proyectos Premium ($2M+)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action CTA Button: Sleek Golden Circular Button */}
          <div className="shrink-0 flex justify-center pt-2 md:pt-0">
            <button
              onClick={handleSearch}
              aria-label="Buscar proyectos"
              className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_0_18px_rgba(197,160,89,0.35)] transition-all hover:bg-accent/90 hover:shadow-[0_0_25px_rgba(197,160,89,0.6)] hover:scale-105 active:scale-95 shrink-0"
            >
              <Search size={18} strokeWidth={2.5} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
