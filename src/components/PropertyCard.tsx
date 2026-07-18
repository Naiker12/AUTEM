import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import type { Property } from "@/data/properties";

interface PropertyCardProps {
  property: Property;
  className?: string;
}

function getTagStyle(tag: string): string {
  switch (tag) {
    case "Nuevo lanzamiento":
      return "bg-accent text-primary-foreground";
    case "3D Tour":
    case "AR Ready":
    default:
      return "bg-white/90 text-foreground backdrop-blur-sm";
  }
}

export default function PropertyCard({ property, className = "" }: PropertyCardProps) {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("autem_favorites") || "[]");
      setIsFav(stored.includes(property.id));
    } catch {
      /* ignore */
    }
  }, [property.id]);

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFav((prev) => {
      const next = !prev;
      try {
        const stored: string[] = JSON.parse(localStorage.getItem("autem_favorites") || "[]");
        if (next) {
          localStorage.setItem("autem_favorites", JSON.stringify([...stored, property.id]));
        } else {
          localStorage.setItem(
            "autem_favorites",
            JSON.stringify(stored.filter((id) => id !== property.id)),
          );
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <Link
      to="/properties/$id"
      params={{ id: property.slug }}
      className={`group relative block overflow-hidden rounded-2xl ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.image}
          alt={property.name}
          width={800}
          height={600}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <button
          onClick={toggleFav}
          aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-all hover:bg-black/50"
        >
          <Heart
            size={16}
            className={`transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-white"}`}
          />
        </button>

        {property.tags.length > 0 && (
          <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
            {property.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${getTagStyle(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 z-10">
          <p className="text-[10px] uppercase tracking-widest text-white/60">{property.location}</p>
          <h3 className="mt-1 font-serif text-xl text-white md:text-2xl">{property.name}</h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-medium text-accent">{property.price}</span>
            <span className="text-xs text-white/60">{property.m2} m²</span>
          </div>
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
          <span className="rounded-full border border-white/40 bg-black/30 px-6 py-2 text-xs uppercase tracking-widest text-white backdrop-blur-sm">
            Ver detalles
          </span>
        </div>
      </div>
    </Link>
  );
}
