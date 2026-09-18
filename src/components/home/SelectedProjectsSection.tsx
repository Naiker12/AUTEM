import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import Container from "@/components/layout/Container";
import { getLotsByProject } from "@/data/lots";
import MasterplanSvgViewer from "@/components/project-view/MasterplanSvgViewer";

export default function SelectedProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const lots = useMemo(() => getLotsByProject("lotes-360"), []);
  const [selectedLotId, setSelectedLotId] = useState(lots[1]?.id ?? lots[0]?.id ?? "");

  const selectedLot = useMemo(
    () => lots.find((l) => l.id === selectedLotId) ?? lots[0],
    [lots, selectedLotId],
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="proyectos"
      className="selected-projects relative z-20 overflow-hidden border-t border-[#403a34]/15 bg-[#f6f1eb] px-4 py-14 text-[#403a34] sm:px-8 md:px-12 md:py-20 xl:px-16"
    >
      <Container className="max-w-[1680px]">
        <header
          className="border-b border-[#403a34]/15 pb-6 sm:pb-8"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: `translate3d(0, ${isVisible ? "0" : "28px"}, 0)`,
            transition:
              "opacity 700ms cubic-bezier(.19,1,.22,1), transform 700ms cubic-bezier(.19,1,.22,1)",
          }}
        >
          <div className="mb-3 sm:mb-4 flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.1em]">
            <span className="size-1 rounded-full bg-[#c5a059]" />
            <span>Proyecto destacado</span>
          </div>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="max-w-4xl text-[clamp(2.2rem,4.2vw,48px)] font-medium leading-[1.1] tracking-[-0.056em] uppercase">
                Villa Paraíso.
              </h2>
              <p className="mt-3 sm:mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[#776d62]">
                Santa Rosa · Villanueva, Bolívar <span className="mx-2 text-[#c5a059]">—</span>{" "}
                Parcelación campestre · 343 lotes
              </p>
            </div>
            <Link
              to="/proyecto/$slug"
              params={{ slug: "lotes-360" }}
              className="inline-flex shrink-0 items-center gap-2.5 rounded-full border border-[#403a34] bg-[#403a34] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f6f1eb] shadow-md transition-all duration-300 hover:bg-[#c5a059] hover:border-[#c5a059] hover:text-[#1c1917] hover:scale-105 active:scale-95"
            >
              Ir al proyecto <ArrowUpRight size={16} strokeWidth={2} />
            </Link>
          </div>
        </header>

        <article
          className="relative mt-6 sm:mt-8 overflow-hidden rounded-3xl"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: `translate3d(0, ${isVisible ? "0" : "40px"}, 0)`,
            transition:
              "opacity 900ms 130ms cubic-bezier(.19,1,.22,1), transform 900ms 130ms cubic-bezier(.19,1,.22,1)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(255,255,255,.18),transparent_33%),linear-gradient(110deg,rgba(246,241,235,.08),transparent_45%)]" />

          {/* Masterplan en formato panorámico: horizontalmente más largo y verticalmente más corto */}
          <div className="relative h-[400px] sm:h-[460px] md:h-[500px] lg:h-[540px] xl:h-[580px]">
            <MasterplanSvgViewer
              lots={lots}
              selectedLotId={selectedLotId}
              focusRequest={0}
              onSelectLot={setSelectedLotId}
              isDesktopSidebarOpen={false}
              initialScaleMultiplier={1.05}
              transparentCanvas
              disableWheelZoom={true}
            />
          </div>

          {/* Indicador flotante translúcido y elegante del lote seleccionado */}
          {selectedLot && (
            <div className="absolute top-5 left-5 z-30 flex flex-wrap items-center gap-3 rounded-2xl border border-white/50 bg-white/40 dark:bg-black/40 px-4 py-2.5 shadow-[0_8px_32px_rgba(71,55,35,.10)] backdrop-blur-xl transition-all sm:top-6 sm:left-6">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#403a34] dark:text-white">
                  Lote {selectedLot.lotNumber ?? selectedLot.id}
                </span>
                <span className="text-[11px] text-[#776d62] dark:text-stone-300">
                  {selectedLot.area} m² · {selectedLot.manzana}
                </span>
              </div>
              <Link
                to="/proyecto/$slug"
                params={{ slug: "lotes-360" }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#403a34] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#f6f1eb] backdrop-blur-md transition-all duration-300 hover:bg-[#c5a059] hover:text-[#1c1917] active:scale-95"
              >
                Ver en proyecto <ArrowUpRight size={13} strokeWidth={2} />
              </Link>
            </div>
          )}
        </article>
      </Container>
    </section>
  );
}
