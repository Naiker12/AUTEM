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
    const progress = Math.min(1, Math.max(0, -bounds.top / Math.max(innerHeight * 2.6, 1)));
    section.style.setProperty("--hero-scroll-progress", progress.toFixed(4));
    section.style.setProperty("--hero-scroll-opacity", "1");
    section.style.setProperty("--hero-scroll-y", `${(progress * -20).toFixed(2)}px`);
    section.style.setProperty("--hero-scroll-scale", "1");
  });

  return (
    <section
      ref={sectionRef}
      id="top"
      className="autem-scroll-hero relative h-[360svh] bg-transparent text-foreground"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <img
          src={heroScene}
          alt="Presentación de AUTEM: visión, territorio y proyectos"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        <img
          src={terrainReveal}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="autem-scroll-hero__terrain absolute inset-0 h-full w-full object-cover"
        />
        <img
          src={masterplan}
          alt="Plano general del proyecto AUTEM"
          decoding="async"
          className="autem-scroll-hero__masterplan absolute inset-0 h-full w-full object-cover"
        />

        <Container className="home-hero-scroll-stage relative h-[100svh] px-6 pb-8 pt-24 md:min-h-[720px] md:px-10 md:pt-24 lg:px-14 xl:px-20">
          <a
            href="#proyectos"
            className={`${entranceClass} home-entrance--scroll home-hero-scroll-cue absolute bottom-5 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-4 text-[8px] font-bold uppercase tracking-[0.28em] text-muted-foreground md:flex`}
          >
            <span className="home-scroll-line h-8 w-px bg-gradient-to-b from-accent to-transparent" />
            <Mouse size={18} className="home-scroll-mouse text-foreground" /> Desliza para descubrir
          </a>
        </Container>
      </div>
    </section>
  );
}
