import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import TerrainMediaViewer from "./home/TerrainMediaViewer";
import SectionMeasureLine from "@/components/SectionMeasureLine";

export default function DroneScanSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.unobserve(section);
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const startAerialTour = () => {
    const video = document.querySelector<HTMLIFrameElement>("#recorrido-aereo iframe");
    video?.scrollIntoView({ behavior: "smooth", block: "center" });
    video?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "playVideo", args: [] }),
      "https://www.youtube-nocookie.com",
    );
  };

  return (
    <section
      id="tecnologia"
      ref={sectionRef}
      className={`terrain-intelligence relative isolate overflow-hidden border-y border-border bg-background py-20 text-foreground md:py-28 ${isVisible ? "terrain-intelligence--visible" : ""}`}
    >
      <SectionMeasureLine index={2} total={4} label="Terreno" />
      <div className="terrain-contours pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-40 top-1/3 size-[460px] rounded-full bg-accent/[0.08] blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-[420px] rounded-full bg-accent/[0.07] blur-[140px]" />

      <div className="section-scroll-content relative z-10 mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="terrain-intelligence__copy lg:col-span-4">
            <p className="mb-5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
              <ScanLine size={13} /> Inteligencia del terreno
            </p>
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Precisión desde el origen / 01
            </p>
            <h2 className="max-w-lg text-[clamp(3rem,5vw,5rem)] leading-[0.92] tracking-[-0.045em]">
              Diseñamos con el terreno,
              <span className="mt-2 block font-serif italic text-accent">no contra él.</span>
            </h2>
            <span className="mt-4 block h-px w-36 rotate-[-4deg] bg-accent" />
            <p className="mt-7 max-w-md text-sm leading-7 text-muted-foreground md:text-base">
              Antes de trazar el primer muro, un vuelo LiDAR convierte cada pendiente, vista y
              recorrido solar en información precisa para tomar mejores decisiones de diseño.
            </p>
            <Button
              type="button"
              variant="ghost"
              className="group mt-8 h-auto gap-4 rounded-full p-0 pr-4 hover:bg-transparent"
              onClick={startAerialTour}
            >
              <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_12px_28px_rgba(197,160,89,.28)] transition-transform group-hover:scale-105">
                <Play size={16} fill="currentColor" />
              </span>
              <span className="text-left">
                <span className="block text-[9px] font-bold uppercase tracking-[0.15em]">
                  Ver recorrido aéreo
                </span>
                <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
                  Video aéreo del proyecto
                </span>
              </span>
              <ArrowRight
                size={14}
                className="text-accent transition-transform group-hover:translate-x-1"
              />
            </Button>
          </div>

          <div className="terrain-intelligence__viewer lg:col-span-8">
            <TerrainMediaViewer />
          </div>
        </div>
      </div>
    </section>
  );
}
