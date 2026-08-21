import { useEffect, useRef } from "react";
import { ArrowRight, Mouse, Play } from "lucide-react";
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
      className="relative overflow-hidden bg-background text-foreground md:h-[165svh] md:min-h-[1240px] md:overflow-visible"
    >
      <div className="pointer-events-none absolute -left-40 top-1/2 size-[520px] -translate-y-1/2 rounded-full bg-accent/8 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[62%] bg-gradient-to-l from-accent/[0.07] via-accent/[0.025] to-transparent lg:w-[59%]" />
      <div className="pointer-events-none absolute right-[4%] top-[13%] hidden aspect-square w-[49vw] rounded-full border border-accent/18 md:block" />
      <div className="pointer-events-none absolute right-[11%] top-[30%] hidden h-[38%] w-[42%] rounded-[50%] border border-accent/16 [transform:rotate(-8deg)] md:block" />

      <div className="home-hero-scroll-stage relative mx-auto grid max-w-[1800px] px-6 pb-0 pt-44 md:sticky md:top-0 md:h-[100svh] md:min-h-0 md:grid-cols-12 md:items-center md:px-10 md:pb-8 md:pt-24 lg:px-14 xl:px-20">
        <div className="home-hero-copy relative z-30 md:col-span-6 lg:col-span-5">
          <svg
            className="home-copy-mesh pointer-events-none absolute -left-[38%] -top-[14%] z-0 hidden h-[92%] w-[178%] overflow-visible md:block"
            viewBox="0 0 760 430"
            fill="none"
            aria-hidden="true"
          >
            <g className="home-copy-mesh__surface">
              <path d="M-30 82C112 8 268 12 397 78C522 142 630 131 798 42" />
              <path d="M-42 132C105 60 265 63 396 127C526 190 654 177 805 92" />
              <path d="M-48 184C100 115 258 112 397 176C538 241 660 226 814 142" />
              <path d="M-42 238C108 167 263 164 401 226C544 290 671 275 814 195" />
              <path d="M-28 292C118 222 274 218 410 278C548 339 676 330 802 254" />
              <path d="M28 354C160 287 292 281 419 332C535 379 641 381 756 326" />
              <path d="M94 20C64 116 82 210 148 286C197 343 210 391 189 438" />
              <path d="M218 -12C185 100 209 214 278 292C323 342 340 389 325 443" />
              <path d="M360 -18C328 87 350 203 419 280C470 336 490 387 474 440" />
              <path d="M510 -14C483 80 500 184 566 258C620 318 641 373 625 434" />
            </g>
            <g className="home-copy-mesh__nodes">
              <circle cx="148" cy="286" r="3" />
              <circle cx="397" cy="176" r="3.5" />
              <circle cx="566" cy="258" r="3" />
            </g>
          </svg>
          <p
            className={`${entranceClass} home-entrance--eyebrow relative z-10 mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.28em] text-accent md:mb-7 md:text-[10px] md:tracking-[0.34em]`}
          >
            <span className="h-px w-8 bg-accent" />
            Vive el proyecto
          </p>
          <h1
            className={`${entranceClass} home-entrance--title relative z-10 max-w-3xl text-[clamp(3.25rem,14.5vw,4.25rem)] font-normal leading-[0.9] tracking-[-0.04em] md:text-[clamp(4rem,7.2vw,7.7rem)] md:leading-[0.86] md:tracking-[-0.045em]`}
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
            className={`${entranceClass} home-entrance--body relative z-10 mt-5 max-w-lg text-[17px] leading-7 text-muted-foreground md:mt-9 md:text-xl md:leading-9`}
          >
            Explora cada detalle del proyecto en 3D y descubre una nueva forma de invertir en
            espacios únicos.
          </p>
          <div
            className={`${entranceClass} home-entrance--action relative z-10 mt-6 flex flex-wrap items-center gap-2 sm:gap-4 md:mt-10`}
          >
            <Button
              asChild
              size="lg"
              className="group h-13 rounded-full bg-accent px-6 text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground shadow-[0_18px_45px_rgba(197,160,89,.24)] hover:bg-accent/90 md:h-14 md:px-7 md:tracking-[0.18em]"
            >
              <a href={`${import.meta.env.BASE_URL}proyecto/residencia-azure`}>
                Explorar proyecto <ArrowRight className="transition group-hover:translate-x-1" />
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="group h-13 rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground hover:bg-muted md:h-14 md:px-4 md:tracking-[0.18em]"
            >
              <a href="#tecnologia">
                <span className="flex size-11 items-center justify-center rounded-full border border-border bg-background shadow-lg transition group-hover:border-accent group-hover:text-accent">
                  <Play size={15} fill="currentColor" />
                </span>{" "}
                Ver recorrido aéreo
              </a>
            </Button>
          </div>
          <dl
            className={`${entranceClass} home-entrance--action relative z-10 mt-7 grid max-w-xl grid-cols-3 border-y border-border py-4 md:mt-12 md:py-5`}
          >
            {[
              ["Ubicación", "Cartagena"],
              ["Lotes", "Desde 1.080 m²"],
              ["Experiencia", "3D interactivo"],
            ].map(([label, value]) => (
              <div key={label} className="border-r border-border px-4 first:pl-0 last:border-0">
                <dt className="text-[9px] font-bold uppercase tracking-[0.15em] text-accent md:text-[8px] md:tracking-[0.18em]">
                  {label}
                </dt>
                <dd className="mt-2 text-xs font-medium text-foreground md:text-sm">{value}</dd>
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

        <img
          src={`${import.meta.env.BASE_URL}projects/lotes-360/lot-l07-entorno-verde.png`}
          alt=""
          aria-hidden="true"
          className="home-hero-scroll-card home-hero-scroll-card--left"
        />
        <img
          src={`${import.meta.env.BASE_URL}projects/lotes-360/lot-l12-quebrada.png`}
          alt=""
          aria-hidden="true"
          className="home-hero-scroll-card home-hero-scroll-card--right"
        />

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
