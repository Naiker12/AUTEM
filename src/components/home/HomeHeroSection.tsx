import { useRef } from "react";
import { Mouse } from "lucide-react";
import Container from "@/components/layout/Container";
import { useScrollFrame } from "@/hooks/useScrollFrame";

interface HomeHeroSectionProps {
  visible: boolean;
}

export default function HomeHeroSection({ visible }: HomeHeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const entranceClass = visible ? "home-entrance" : "opacity-0";
  const heroScene = `${import.meta.env.BASE_URL}images/autem-hero-approved-scene-v2.png`;
  const terrainReveal = `${import.meta.env.BASE_URL}images/autem-hero-terrain-reveal.png`;
  const masterplan = `${import.meta.env.BASE_URL}images/autem-masterplan-lots-v1.png`;

  useScrollFrame(() => {
    const section = sectionRef.current;
    if (!section) return;
    const bounds = section.getBoundingClientRect();
    const scrollDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
    const progress = Math.min(1, Math.max(0, -bounds.top / scrollDistance));
    section.style.setProperty("--hero-scroll-progress", progress.toFixed(4));
    section.style.setProperty("--hero-scroll-opacity", "1");
    section.style.setProperty("--hero-scroll-y", `${(progress * -20).toFixed(2)}px`);
    section.style.setProperty("--hero-scroll-scale", "1");
  });

  return (
    <section
      ref={sectionRef}
      id="top"
      className="autem-scroll-hero relative h-[340svh] bg-[#f6f1eb] text-foreground"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Base Layer: Founder in Atelier */}
        <img
          src={heroScene}
          alt="Presentación de AUTEM: visión, territorio y proyectos"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Middle Layer: Curved Landscape Reveal */}
        <div className="autem-scroll-hero__terrain-wrapper absolute inset-0 h-full w-full pointer-events-none">
          <img
            src={terrainReveal}
            alt="Paisaje y territorio natural AUTEM"
            aria-hidden="true"
            decoding="async"
            className="autem-scroll-hero__terrain absolute inset-0 h-full w-full object-cover object-[center_35%]"
          />
        </div>

        {/* Top Layer: Architectural Masterplan Line-art */}
        <img
          src={masterplan}
          alt="Plano general del proyecto AUTEM"
          decoding="async"
          className="autem-scroll-hero__masterplan absolute inset-0 h-full w-full object-cover object-[center_35%]"
        />

        {/* Elegant Scroll Cue for Desktop & Mobile */}
        <Container className="home-hero-scroll-stage relative h-[100svh] px-6 pb-8 pt-24 md:min-h-[720px] md:px-10 md:pt-24 lg:px-14 xl:px-20 pointer-events-none">
          <a
            href="#proyectos"
            className={`${entranceClass} home-entrance--scroll home-hero-scroll-cue pointer-events-auto absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#403a34]/20 bg-[#f6f1eb]/90 px-4 py-2 text-[8.5px] font-bold uppercase tracking-[0.22em] text-[#403a34] shadow-md backdrop-blur-md transition-all hover:bg-[#f6f1eb] hover:border-[#403a34]/40 md:border-0 md:bg-transparent md:shadow-none md:backdrop-blur-none md:text-muted-foreground md:px-0 md:py-0 md:gap-4 md:tracking-[0.28em]`}
          >
            <span className="home-scroll-line hidden md:block h-8 w-px bg-gradient-to-b from-accent to-transparent" />
            <Mouse
              size={16}
              className="home-scroll-mouse text-[#403a34] md:text-foreground shrink-0"
            />
            <span>Desliza para descubrir</span>
          </a>
        </Container>
      </div>
    </section>
  );
}
