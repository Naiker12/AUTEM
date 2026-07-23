import { useEffect, useState } from "react";

export default function LineaScrollAnimada() {
  const [scrollPos, setScrollPos] = useState(0);
  const [proyectosRange, setProyectosRange] = useState<{ start: number; end: number } | null>(null);
  const [dronPos, setDronPos] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePositions = () => {
      const proyectosElem = document.getElementById("proyectos");
      const dronElem = document.getElementById("dron");

      if (proyectosElem) {
        const rect = proyectosElem.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        setProyectosRange({ start: top, end: top + rect.height });
      }

      if (dronElem) {
        const rect = dronElem.getBoundingClientRect();
        setDronPos(rect.top + window.scrollY);
      }
    };

    updatePositions();
    window.addEventListener("resize", updatePositions);
    return () => window.removeEventListener("resize", updatePositions);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollPos(currentScroll);
      setIsVisible(currentScroll > 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  // Determinar si la línea ha llegado a la sección del dron
  const maxReach = dronPos ? dronPos + 100 : 99999;
  const isPastDron = scrollPos > maxReach;

  // Determinar si está pasando por la cuadrícula de Proyectos
  const isInsideProyectos =
    proyectosRange &&
    scrollPos + window.innerHeight / 2 >= proyectosRange.start &&
    scrollPos + window.innerHeight / 2 <= proyectosRange.end;

  if (isPastDron) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 bottom-0 z-30 hidden md:block"
    >
      {/* ── MODO 1: Línea Central (Fuera de la grilla de proyectos) ── */}
      {!isInsideProyectos && (
        <div className="absolute left-1/2 -translate-x-1/2 inset-y-0 w-8">
          <div className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-stone-300/20 dark:bg-stone-800/40" />
          <div className="absolute top-0 left-1/2 w-[1.5px] -translate-x-1/2 h-full bg-gradient-to-b from-accent via-amber-400 to-amber-500 shadow-[0_0_8px_rgba(197,160,89,0.7)]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <span className="absolute h-5 w-5 rounded-full bg-amber-400/40 opacity-75 animate-ping" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_rgba(197,160,89,0.9)]" />
          </div>
        </div>
      )}

      {/* ── MODO 2: División Lateral en Dos Líneas (Bordeando las Tarjetas de Proyectos) ── */}
      {isInsideProyectos && (
        <div className="relative mx-auto max-w-7xl h-full px-4 md:px-8 flex justify-between">
          {/* Hilo Lateral Izquierdo */}
          <div className="relative w-8 h-full flex flex-col items-center">
            <div className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-stone-300/20 dark:bg-stone-800/40" />
            <div className="absolute top-0 left-1/2 w-[1.5px] -translate-x-1/2 h-full bg-gradient-to-b from-accent via-amber-400 to-amber-500 shadow-[0_0_8px_rgba(197,160,89,0.7)]" />
            <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center">
              <span className="absolute h-5 w-5 rounded-full bg-amber-400/40 opacity-75 animate-ping" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_rgba(197,160,89,0.9)]" />
            </div>
          </div>

          {/* Hilo Lateral Derecho */}
          <div className="relative w-8 h-full flex flex-col items-center">
            <div className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-stone-300/20 dark:bg-stone-800/40" />
            <div className="absolute top-0 left-1/2 w-[1.5px] -translate-x-1/2 h-full bg-gradient-to-b from-accent via-amber-400 to-amber-500 shadow-[0_0_8px_rgba(197,160,89,0.7)]" />
            <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center">
              <span className="absolute h-5 w-5 rounded-full bg-amber-400/40 opacity-75 animate-ping" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_12px_rgba(197,160,89,0.9)]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
