import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

export interface HeroSlide {
  image: string;
  title: string;
  location: string;
  tagline: string;
  slug: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    image: "/projects/residencia-azure/fachada.jpg",
    title: "Residencia Azure",
    location: "Bocagrande, CO",
    tagline: "Villa contemporánea frente al Mar Caribe",
    slug: "residencia-azure",
  },
  {
    image: "/projects/the-horizon-suite/fachada.jpg",
    title: "The Horizon Suite",
    location: "Manga, CO",
    tagline: "Penthouse de lujo con spa y rooftop panorámico 180°",
    slug: "the-horizon-suite",
  },
  {
    image: "/projects/eco-refugio-turbaco/fachada.jpg",
    title: "Eco-Refugio Turbaco",
    location: "Turbaco, Bolívar, CO",
    tagline: "Casa de campo entre colinas verdes y clima de altura",
    slug: "eco-refugio-turbaco",
  },
  {
    image: "/projects/casa-campestre/fachada.jpg",
    title: "Casa Campestre AUTEM",
    location: "Barú, CO",
    tagline: "Residencia estilo farmhouse con piscina rectangular y jardines",
    slug: "casa-campestre",
  },
  {
    image: "/projects/eco-villa-sierra/fachada.jpg",
    title: "Eco-Villa Sierra",
    location: "Castillogrande, CO",
    tagline: "Arquitectura sostenible e integración bioclimática",
    slug: "eco-villa-sierra",
  },
];

const SLIDE_INTERVAL_MS = 6000;

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-stone-950 select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides with Crossfade and Ken Burns Effect */}
      {HERO_SLIDES.map((slide, idx) => {
        const isActive = idx === currentIndex;
        return (
          <div
            key={slide.slug}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
                isActive ? "scale-105" : "scale-100"
              }`}
            />

            {/* Dark Golden Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
          </div>
        );
      })}

      {/* Slide Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Anterior proyecto"
        className="absolute left-6 top-1/2 z-30 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-black/40 text-white/80 border border-white/10 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground hover:border-accent hover:scale-110"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Siguiente proyecto"
        className="absolute right-6 top-1/2 z-30 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-black/40 text-white/80 border border-white/10 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground hover:border-accent hover:scale-110"
      >
        <ChevronRight size={22} />
      </button>

      {/* Top Right Project Tagline Badge */}
      <div className="absolute top-28 right-8 z-30 hidden md:block">
        <a
          href={`#proyectos`}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md transition-all hover:border-accent hover:text-accent"
        >
          <MapPin size={13} className="text-accent" />
          <span>
            {HERO_SLIDES[currentIndex].title} · {HERO_SLIDES[currentIndex].location}
          </span>
        </a>
      </div>

      {/* Bottom Slider Indicators with Animated Golden Progress */}
      <div className="absolute bottom-6 left-8 z-30 flex items-center gap-3">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={slide.slug}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-500 ${
                isActive ? "w-12 bg-white/30" : "w-3 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Ir a ${slide.title}`}
            >
              {isActive && (
                <div
                  key={currentIndex}
                  className="h-full bg-accent animate-hero-progress origin-left"
                  style={{
                    animationDuration: `${SLIDE_INTERVAL_MS}ms`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
