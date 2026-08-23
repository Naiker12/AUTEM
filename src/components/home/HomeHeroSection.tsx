import { useEffect, useRef } from "react";
import { ArrowRight, Compass, Mouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroBuildingScene from "./HeroBuildingScene";

interface HomeHeroSectionProps {
  visible: boolean;
}

export default function HomeHeroSection({ visible }: HomeHeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const entranceClass = visible ? "home-entrance" : "opacity-0";
  const portraitImage = `${import.meta.env.BASE_URL}images/jaime-buelvas-founder-presenting-cutout-v6.png`;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frameId = 0;
    const updateProgress = () => {
      frameId = 0;
      const bounds = section.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -bounds.top / Math.max(innerHeight * 0.62, 1)));
      section.style.setProperty("--hero-scroll-progress", progress.toFixed(4));
      section.style.setProperty("--hero-scroll-opacity", "1");
      section.style.setProperty("--hero-scroll-y", `${(progress * -20).toFixed(2)}px`);
      section.style.setProperty("--hero-scroll-scale", "1");
    };
    const onScroll = () => {
      if (!frameId) frameId = requestAnimationFrame(updateProgress);
    };
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative overflow-hidden bg-background text-foreground min-h-[92svh] md:min-h-[100svh]"
    >
      <div className="pointer-events-none absolute -left-40 top-1/2 size-[520px] -translate-y-1/2 rounded-full bg-accent/8 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[62%] bg-gradient-to-l from-accent/[0.07] via-accent/[0.025] to-transparent lg:w-[59%]" />

      <div className="home-hero-scroll-stage relative mx-auto grid max-w-[1800px] px-6 pb-12 pt-36 md:h-[100svh] md:min-h-[720px] md:grid-cols-12 md:items-center md:px-10 md:pb-8 md:pt-24 lg:px-14 xl:px-20">
        <div className="home-hero-copy relative z-30 md:col-span-6 lg:col-span-5">
          <h1
            className={`${entranceClass} home-entrance--title relative z-10 max-w-3xl text-[clamp(3rem,13vw,4rem)] font-normal leading-[1.04] tracking-[-0.015em] md:text-[clamp(3.8rem,6.6vw,7rem)] md:leading-[0.98] md:tracking-[-0.02em]`}
          >
            <span className="home-hero-title-primary flex items-baseline">
              <span className="home-hero-title-word">Tu</span>
              <span className="home-hero-title-word">lugar</span>
              <span className="home-hero-title-word">en</span>
            </span>
            <span className="home-hero-title-accent mt-3 flex items-baseline font-serif italic">
              <span className="home-hero-title-word">la</span>
              <span className="home-hero-title-word">naturaleza</span>
            </span>
          </h1>
          <div className="home-hero-mobile-visual relative z-10 mt-5 h-[176px] overflow-hidden rounded-2xl border border-accent/20 bg-[linear-gradient(120deg,#e8ddca,#f8f5ef_55%,#d9e0d7)] md:hidden">
            <div className="absolute -bottom-10 right-0 h-[120%] w-[58%]">
              <img
                src={portraitImage}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain object-bottom opacity-90"
              />
            </div>
            <div className="absolute bottom-2 left-3 h-[78%] w-[54%]">
              <HeroBuildingScene />
            </div>
            <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-background/78 px-3 py-1.5 text-[7px] font-bold uppercase tracking-[.15em] text-accent backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-accent shadow-[0_0_0_3px_rgba(197,160,89,.16)]" />
              Modelo 3D interactivo
            </span>
          </div>
          <p
            className={`${entranceClass} home-entrance--body relative z-10 mt-5 max-w-lg text-[16px] leading-7 text-muted-foreground font-light md:mt-8 md:text-lg md:leading-8`}
          >
            Parcelaciones campestres exclusivas y arquitectura de autor en el Caribe. Recorre cada
            lote en 3D interactivo y proyecta tu inversión en armonía con el paisaje.
          </p>
          <div
            className={`${entranceClass} home-entrance--action relative z-10 mt-6 flex flex-wrap items-center gap-3 md:mt-9`}
          >
            <Button
              asChild
              size="lg"
              className="group h-12 rounded-full bg-[#161719] px-7 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#fbf7ee] border border-[#b5863c]/40 shadow-[0_14px_34px_rgba(0,0,0,0.12)] transition-all duration-300 hover:bg-[#b5863c] hover:text-black hover:border-[#b5863c] md:h-13 md:px-8"
            >
              <a href={`${import.meta.env.BASE_URL}proyecto/lotes-360`}>
                Explorar proyectos <ArrowRight className="transition group-hover:translate-x-1" />
              </a>
            </Button>
          </div>

          <dl
            className={`${entranceClass} home-entrance--action relative z-10 mt-7 grid max-w-2xl grid-cols-2 gap-y-3 rounded-xl border border-black/10 bg-white/70 p-3.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/40 sm:grid-cols-4 sm:p-4 md:mt-9`}
          >
            {[
              ["Ubicación", "Cartagena · Turbaco"],
              ["Lotes", "Desde 1.080 m²"],
              ["Masterplan", "128 parcelas"],
              ["Experiencia", "3D interactivo"],
            ].map(([label, value], idx) => (
              <div
                key={label}
                className={`px-3 ${idx !== 3 ? "sm:border-r sm:border-black/10 dark:sm:border-white/10" : ""}`}
              >
                <dt className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#986e29] dark:text-[#ddb66d]">
                  {label}
                </dt>
                <dd className="mt-0.5 text-xs font-semibold text-[#1a1a1a] dark:text-white md:text-[13px]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className={`${visible ? "hero-visual-enter" : "opacity-0"} home-hero-visual relative z-10 mt-6 hidden min-h-[410px] sm:min-h-[480px] md:absolute md:bottom-0 md:right-0 md:top-[72px] md:block md:mt-0 md:min-h-[540px] md:w-[58%] lg:w-[68%]`}
        >
          <div className="absolute bottom-0 right-[-13%] z-10 h-[96%] w-[115%] sm:right-[-4%] sm:h-full sm:w-[86%] lg:right-[-1%] lg:h-[103%] lg:w-[74%]">
            <img
              src={portraitImage}
              alt="Jaime Buelvas presentando un modelo arquitectónico AUTEM sobre su mano"
              className="home-founder-portrait h-full w-full object-contain object-bottom"
            />
          </div>
          <div className="absolute bottom-[50%] left-[3%] z-20 aspect-[1.3/1] h-auto w-[38%] sm:bottom-[26%] sm:left-[19%] sm:h-[42%] sm:w-[51%] sm:aspect-auto lg:bottom-[26%] lg:left-[25%] lg:h-[42%] lg:w-[43%]">
            <HeroBuildingScene />
          </div>
        </div>

        <a
          href="#proyectos"
          className={`${entranceClass} home-entrance--scroll home-hero-scroll-cue absolute bottom-5 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-4 text-[8px] font-bold uppercase tracking-[0.28em] text-muted-foreground md:flex`}
        >
          <span className="home-scroll-line h-8 w-px bg-gradient-to-b from-accent to-transparent" />
          <Mouse size={18} className="home-scroll-mouse text-foreground" /> Desliza para descubrir
        </a>
      </div>
    </section>
  );
}
