import { Property } from "@/data/properties";
import { getARModel } from "@/data/ar-models";
import { QrCode, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface ProjectCardProps {
  property: Property;
  className?: string;
}

export default function ProjectCard({ property, className = "" }: ProjectCardProps) {
  const arModel = getARModel(property.slug);

  return (
    <Link
      to="/properties/$id"
      params={{ id: property.slug }}
      className={`group block cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted-warm">
        <img
          src={property.image}
          alt={property.name}
          width={800}
          height={600}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Tags */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {property.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* AR Badge if model exists */}
        {arModel && (
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-md">
            <Sparkles size={12} />
            <span>AR 3D</span>
            <QrCode size={12} className="ml-0.5" />
          </div>
        )}

        {/* Bottom Card Header */}
        <div className="absolute bottom-4 left-4 right-4">
          <span className="text-[10px] uppercase tracking-widest text-white/70">
            {property.location}
          </span>
          <h3 className="font-serif text-xl font-medium text-white drop-shadow-sm">
            {property.name}
          </h3>
          <div className="mt-1 flex items-center justify-between text-xs text-white/90">
            <span className="font-serif text-accent font-semibold">{property.price}</span>
            <span>{property.m2} m²</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
