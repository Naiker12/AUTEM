import { useState } from "react";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProjectGalleryProps } from "./project-types";

export default function ProjectGallery({ property, images: customImages }: ProjectGalleryProps) {
  const images = customImages || property.images || [property.image];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeImage = images[selectedIndex] || property.image;

  const nextImage = () => setSelectedIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-muted-warm group">
        <img
          src={activeImage}
          alt={`${property.name} - Vista ${selectedIndex + 1}`}
          width={1920}
          height={822}
          className="h-full w-full object-cover transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Overlay info */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <span className="inline-block rounded-full bg-accent px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
              {property.year === 2025 ? "Próximo lanzamiento" : "Disponible"}
            </span>
            <h1 className="mt-2 font-serif text-3xl text-white md:text-5xl drop-shadow-md">
              {property.name}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {property.location} · {property.m2} m²
            </p>
          </div>

          {/* Fullscreen button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground"
            aria-label="Ver pantalla completa"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {/* Prev / Next buttons if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground"
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails list */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative aspect-[3/2] w-28 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                selectedIndex === i
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`${property.name} thumbnail ${i + 1}`}
                width={160}
                height={107}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute right-6 top-6 z-10 flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div className="max-h-[85vh] max-w-[90vw]">
            <img
              src={activeImage}
              alt={property.name}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-4 text-center text-white/70 text-sm font-serif">
              {property.name} — Imagen {selectedIndex + 1} de {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
