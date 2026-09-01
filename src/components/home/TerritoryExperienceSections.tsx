import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  MapPin,
  MoveUpRight,
  ShieldCheck,
  SunMedium,
} from "lucide-react";
import Container from "@/components/layout/Container";

const carouselSlides = [
  {
    id: "pavilion",
    title: "Pabellón de Bosque & Vidrio",
    subtitle: "Integración total con la naturaleza nativa",
    image: `${import.meta.env.BASE_URL}images/carousel-forest-pavilion.jpg`,
    tag: "Arquitectura 360°",
  },
  {
    id: "bedroom",
    title: "Suite Caliza & Roble",
    subtitle: "Atmósfera provenzal en piedra y lino",
    image: `${import.meta.env.BASE_URL}images/carousel-stone-bedroom.jpg`,
    tag: "Interiorismo",
  },
  {
    id: "lounge",
    title: "Lounge Contemporáneo",
    subtitle: "Elegancia en tonos grafito y luz cálida",
    image: `${import.meta.env.BASE_URL}images/carousel-modern-lounge.jpg`,
    tag: "Espacio Social",
  },
  {
    id: "garden",
    title: "Jardín Mediterráneo & Patio",
    subtitle: "Senderos de piedra y microclima nocturno",
    image: `${import.meta.env.BASE_URL}images/carousel-mediterranean-garden.jpg`,
    tag: "Paisajismo",
  },
  {
    id: "terrace",
    title: "Terraza & Pérgola al Atardecer",
    subtitle: "Visuales abiertas al horizonte y horizonte marino",
    image: `${import.meta.env.BASE_URL}images/carousel-sunset-terrace.jpg`,
    tag: "Visuales Panorámicas",
  },
];

const metrics = [
  {
    number: "01",
    icon: MapPin,
    value: "05",
    label: "Ubicaciones para explorar",
  },
  {
    number: "02",
    icon: MoveUpRight,
    value: "1.080+",
    label: "m² por lote",
  },
  {
    number: "03",
    icon: Eye,
    value: "360°",
    label: "Lectura del paisaje",
  },
  {
    number: "04",
    icon: ShieldCheck,
    value: "24/7",
    label: "Acompañamiento digital",
  },
];

const principles = [
  {
    icon: Compass,
    title: "Orientación",
    description: "Entiende la relación entre el lote, el acceso y las visuales protegidas.",
  },
  {
    icon: SunMedium,
    title: "Luz natural",
    description: "Compara recorridos solares y ventilación antes de tomar una decisión.",
  },
  {
    icon: Eye,
    title: "Perspectiva",
    description: "Visualiza la escala del proyecto y la topografía desde cada coordenada.",
  },
];

export default function TerritoryExperienceSections() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(2); // Center on 3rd slide initially

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-revealed");
        });
      },
      { threshold: 0.12 },
    );
    root
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : carouselSlides.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < carouselSlides.length - 1 ? prev + 1 : 0));
  };

  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartXRef.current = null;
  };

  return (
    <div
      ref={rootRef}
      className="territory-experience bg-[#f6f1eb] text-[#403a34] font-sans antialiased"
    >
      {/* =========================================================================
          SECTION: ANTES DE DECIDIR — 3D PERSPECTIVE CAROUSEL & METRIC STRIP
          ========================================================================= */}
      <section className="relative overflow-hidden bg-[#f6f1eb] px-4 py-20 sm:px-8 md:py-28 lg:px-14">
        {/* Subtle topographical linework background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(64,58,52,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(64,58,52,.15)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/4 size-[550px] -translate-x-1/2 rounded-full bg-[#c5a059]/[0.05] blur-[160px]" />

        <div className="relative mx-auto max-w-[1560px]">
          {/* Header Title Block */}
          <div data-reveal className="reveal-up mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#a47c3a] dark:text-[#c5a059]">
              Antes de decidir
            </p>
            <h2 className="mt-4 text-[clamp(2.5rem,5.5vw,5.5rem)] font-normal leading-[1.04] tracking-[-0.035em] text-[#403a34]">
              Una inversión que
              <br />
              <span className="font-serif italic text-[#c5a059]">puede recorrer.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[15px] sm:text-[16px] leading-relaxed text-[#555555] font-light">
              Accede al masterplan, compara cada entorno y entiende cómo se relaciona tu lote con el
              paisaje antes de visitarlo.
            </p>
          </div>

          {/* Curved Perspective Carousel */}
          <div className="relative mt-10 sm:mt-16">
            {/* Mobile Carousel View (< md) */}
            <div className="block md:hidden">
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative mx-auto flex h-[430px] w-full max-w-[360px] items-center justify-center overflow-hidden px-4 touch-pan-y"
              >
                {carouselSlides.map((slide, index) => {
                  const offset = index - activeIndex;
                  const isCenter = offset === 0;
                  const isAdjacent = Math.abs(offset) === 1;

                  let transform = "translateX(0%) scale(1)";
                  let opacity = 0;
                  let pointerEvents: "auto" | "none" = "none";

                  if (isCenter) {
                    transform = "translateX(0%) scale(1)";
                    opacity = 1;
                    pointerEvents = "auto";
                  } else if (offset === -1) {
                    transform = "translateX(-104%) scale(0.92)";
                    opacity = 0.35;
                    pointerEvents = "auto";
                  } else if (offset === 1) {
                    transform = "translateX(104%) scale(0.92)";
                    opacity = 0.35;
                    pointerEvents = "auto";
                  } else {
                    transform = `translateX(${offset > 0 ? "200%" : "-200%"}) scale(0.85)`;
                    opacity = 0;
                    pointerEvents = "none";
                  }

                  return (
                    <div
                      key={slide.id}
                      onClick={() => setActiveIndex(index)}
                      style={{
                        transform,
                        opacity,
                        pointerEvents,
                        zIndex: isCenter ? 20 : isAdjacent ? 10 : 0,
                        transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                      className="absolute inset-x-4 top-2 bottom-2 mx-auto flex w-[calc(100%-2rem)] max-w-[320px] flex-col overflow-hidden rounded-3xl border border-[#403a34]/20 bg-[#23201d] shadow-[0_20px_45px_rgba(40,32,24,0.22)]"
                    >
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                      {/* Slide Content Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <span className="inline-block rounded-full border border-white/30 bg-black/50 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#e5c278] backdrop-blur-md">
                          {slide.tag}
                        </span>
                        <h3 className="mt-2.5 font-serif text-[20px] font-normal leading-snug text-white">
                          {slide.title}
                        </h3>
                        <p className="mt-1 text-[12px] leading-relaxed text-white/75 font-light">
                          {slide.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Left Floating Arrow on Mobile */}
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Diapositiva anterior"
                  className="absolute left-1 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#403a34]/20 bg-white/95 text-[#403a34] shadow-md backdrop-blur-md transition-all active:scale-95"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Right Floating Arrow on Mobile */}
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Diapositiva siguiente"
                  className="absolute right-1 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#403a34]/20 bg-white/95 text-[#403a34] shadow-md backdrop-blur-md transition-all active:scale-95"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Mobile Progress Bar & Counter */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <span className="text-[11px] font-mono font-medium tracking-wider text-[#403a34]/60">
                  0{activeIndex + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  {carouselSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`Ir a slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeIndex ? "w-7 bg-[#c5a059]" : "w-1.5 bg-[#403a34]/20"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono font-medium tracking-wider text-[#403a34]/60">
                  0{carouselSlides.length}
                </span>
              </div>
            </div>

            {/* Desktop / Tablet 3D Curved Perspective Carousel (hidden on mobile, block on md+) */}
            <div className="hidden md:block">
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative mx-auto flex items-center justify-center overflow-visible py-6 touch-pan-y"
                style={{ perspective: "1400px" }}
              >
                <div className="flex items-center justify-center gap-4 lg:gap-5 w-full max-w-[1480px]">
                  {carouselSlides.map((slide, index) => {
                    const offset = index - activeIndex;
                    const isCenter = offset === 0;

                    // Compute 3D cylinder rotation & scale for curved spread effect
                    const rotateY = offset * 11;
                    const scale = isCenter ? 1 : Math.max(0.82, 1 - Math.abs(offset) * 0.08);
                    const translateY = Math.abs(offset) * 14;
                    const opacity = Math.abs(offset) > 2 ? 0.3 : isCenter ? 1 : 0.85;

                    return (
                      <div
                        key={slide.id}
                        onClick={() => setActiveIndex(index)}
                        style={{
                          transform: `rotateY(${rotateY}deg) translateY(${translateY}px) scale(${scale})`,
                          transformStyle: "preserve-3d",
                          opacity,
                          zIndex: 10 - Math.abs(offset),
                          transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
                        }}
                        className={`group relative cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl border border-[#403a34]/20 bg-[#23201d] shadow-[0_20px_50px_rgba(40,32,24,0.18)] transition-all ${
                          isCenter
                            ? "w-[280px] lg:w-[340px] xl:w-[360px] h-[400px] lg:h-[460px] xl:h-[480px] ring-1 ring-[#c5a059]/40"
                            : "w-[200px] lg:w-[240px] xl:w-[270px] h-[350px] lg:h-[410px] xl:h-[430px]"
                        }`}
                      >
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                        {/* Slide Content Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
                          <span className="inline-block rounded-full border border-white/25 bg-black/40 px-3 py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.16em] text-[#e5c278] backdrop-blur-md">
                            {slide.tag}
                          </span>
                          <h3 className="mt-2.5 font-serif text-[18px] lg:text-[21px] font-normal leading-tight text-white">
                            {slide.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-[11px] lg:text-[12px] text-white/70 font-light">
                            {slide.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Left Floating Circular Navigation Arrow */}
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Diapositiva anterior"
                  className="absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 z-30 flex size-12 sm:size-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#403a34]/20 bg-white/90 text-[#403a34] shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-[#403a34] hover:text-[#f6f1eb]"
                >
                  <ChevronLeft size={22} />
                </button>

                {/* Right Floating Circular Navigation Arrow */}
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Diapositiva siguiente"
                  className="absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 z-30 flex size-12 sm:size-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#403a34]/20 bg-white/90 text-[#403a34] shadow-lg backdrop-blur-md transition-all hover:scale-110 hover:bg-[#403a34] hover:text-[#f6f1eb]"
                >
                  <ChevronRight size={22} />
                </button>
              </div>

              {/* Bottom Progress Track Bar */}
              <div className="mx-auto mt-8 flex max-w-[200px] items-center justify-center gap-2">
                {carouselSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Ir a slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === activeIndex
                        ? "w-8 bg-[#c5a059]"
                        : "w-2 bg-[#403a34]/20 hover:bg-[#403a34]/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles & Territorial Dialogue Section — Asymmetric Split */}
      <section className="border-t border-[#403a34]/15 px-6 py-24 md:px-12 md:py-32 xl:px-20 max-w-[1560px] mx-auto">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-stretch">
          <div data-reveal className="reveal-up lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#403a34]">
                <span className="size-1 rounded-full bg-[#403a34]" />
                <span>Diseñado con el Territorio</span>
              </div>
              <h2 className="text-[clamp(2.4rem,4.5vw,50px)] font-medium leading-[1.1] tracking-[-0.056em] text-[#403a34] uppercase">
                El proyecto empieza antes del plano.
              </h2>
              <p className="mt-6 text-[18px] leading-[1.5] text-[#333333]">
                Cada lote se analiza a partir de su luz, vegetación nativa, topografía y relación
                con el paisaje para maximizar la habitabilidad bioclimática.
              </p>
            </div>

            <div className="mt-10 divide-y divide-[#403a34]/15 border-y border-[#403a34]/15">
              {principles.map(({ icon: Icon, title, description }, index) => (
                <div key={title} className="group flex items-start gap-4 py-4 sm:py-5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-[#403a34] text-[#403a34] transition group-hover:bg-[#403a34] group-hover:text-[#f6f1eb]">
                    <Icon size={14} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="text-[17px] font-medium tracking-[-0.02em] text-[#403a34]">
                      {title}
                    </h3>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[#555555]">
                      {description}
                    </p>
                  </div>
                  <span className="ml-auto text-[11px] font-medium tracking-[0.1em] text-[#403a34]">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            data-reveal
            className="reveal-up reveal-up--late relative lg:col-span-7 h-full flex flex-col"
          >
            {/* 0px radius architectural photograph frame in 1px Walnut Ink border aligned with left column */}
            <div className="border border-[#403a34] bg-[#f6f1eb] overflow-hidden h-full flex flex-col justify-between">
              <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[440px] overflow-hidden bg-[#e8e0d5]">
                <img
                  src={`${import.meta.env.BASE_URL}images/territory-masterplan-nature.jpg`}
                  alt="Acceso y Paisajismo Lotes 360°"
                  className="absolute inset-0 h-full w-full object-cover object-center block transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4 sm:p-5 border-t border-[#403a34] flex items-center justify-between text-[10px] uppercase tracking-[0.1em] text-[#555555] shrink-0">
                <span>Lotes 360° · Acceso Privado & Paisajismo Nativo</span>
                <span>Cartagena · Turbaco</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
