import { useState, useEffect, useRef } from "react";
import { Compass, Layers, Cpu } from "lucide-react";

export default function DroneScanSection() {
  const [altitude, setAltitude] = useState(120.4);
  const [speed, setSpeed] = useState(6.4);
  const [coverage, setCoverage] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Intersection Observer for scroll activation & video autoplay
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Animated counter for Coverage (0% -> 72%) when scrolled into view
  useEffect(() => {
    if (!isIntersecting) return;
    let start = 0;
    const target = 72;
    const duration = 2000;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCoverage(target);
        clearInterval(timer);
      } else {
        setCoverage(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isIntersecting]);

  // Subtle telemetry jitter for altitude & speed every ~1.8s
  useEffect(() => {
    if (!isIntersecting) return;
    const timer = setInterval(() => {
      setAltitude(+(120 + (Math.random() * 1.6 - 0.8)).toFixed(1));
      setSpeed(+(6.4 + (Math.random() * 0.6 - 0.3)).toFixed(1));
    }, 1800);

    return () => clearInterval(timer);
  }, [isIntersecting]);

  return (
    <section
      id="dron"
      ref={containerRef}
      data-animate
      className="relative overflow-hidden bg-[#0B0B0C] py-24 text-white opacity-0 md:py-32"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-accent/5 blur-[140px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 md:grid-cols-5 md:px-8">
        {/* Left Column: Text & Quantitative Technical Metrics */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="font-serif text-4xl leading-tight md:text-5xl lg:text-6xl text-white">
              Drones que <span className="italic text-accent">cartografían</span> tu terreno.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white/70 md:text-base">
              Cada proyecto inicia con un vuelo LiDAR de precisión centimétrica. Reconstruimos el
              sitio en 3D, detectamos zonas de valor y proyectamos el edificio final sobre la
              topografía real.
            </p>
          </div>

          {/* Quantitative Analysis Metrics Block */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-accent font-semibold">
                <Layers size={11} /> Mapeado
              </div>
              <div className="mt-1 text-lg font-bold text-white">100%</div>
              <div className="text-[9px] text-white/50">2.400 m²</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-accent font-semibold">
                <Compass size={11} /> Zonas
              </div>
              <div className="mt-1 text-lg font-bold text-white">3</div>
              <div className="text-[9px] text-white/50">Analizadas</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-accent font-semibold">
                <Cpu size={11} /> LiDAR
              </div>
              <div className="mt-1 text-lg font-bold text-white">1.2M</div>
              <div className="text-[9px] text-white/50">pts/seg</div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Video Panel + Interactive HUD & Animated Flight Map */}
        <div className="relative md:col-span-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#101015] to-[#050506] border border-white/15 shadow-2xl shadow-black/80">
            {/* Background Video */}
            <video
              ref={videoRef}
              loop
              muted
              playsInline
              preload="none"
              poster={`${import.meta.env.BASE_URL}antes.png`}
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            >
              <source src={`${import.meta.env.BASE_URL}video-del-panel.mp4`} type="video/mp4" />
            </video>

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            {/* Topography Grid Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none grid-pulse"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(197,160,89,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(197,160,89,.3) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* ── ANIMATED SVG FLIGHT MAP & RADAR ── */}
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none z-10"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Polygon Perimeter of the lot */}
              <polygon
                points="60,50 340,70 320,240 80,220"
                stroke="#C5A059"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                className="draw-stroke opacity-70"
              />

              {/* Radar Sweep Arc */}
              <g transform="translate(200, 150)">
                <circle
                  r="70"
                  stroke="#C5A059"
                  strokeWidth="0.75"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />
                <circle r="120" stroke="#C5A059" strokeWidth="0.5" opacity="0.2" />
                <g className="scan-sweep">
                  <path
                    d="M 0 0 L 70 0 A 70 70 0 0 1 0 70 Z"
                    fill="url(#radarGradient)"
                    opacity="0.35"
                  />
                </g>
              </g>

              {/* SVG Radar Gradient Definition */}
              <defs>
                <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#C5A059" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#C5A059" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Target Zone Blips */}
              {/* Zone 1: Vista Panorámica */}
              <g transform="translate(120, 90)">
                <circle r="12" fill="#C5A059" opacity="0.25" className="zone-blip" />
                <circle r="4" fill="#C5A059" />
                <text
                  x="10"
                  y="-8"
                  fill="#FFFFFF"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  01 VISTA PANORÁMICA
                </text>
              </g>

              {/* Zone 2: Insolación Máxima */}
              <g transform="translate(280, 130)">
                <circle r="12" fill="#C5A059" opacity="0.25" className="zone-blip" />
                <circle r="4" fill="#C5A059" />
                <text
                  x="10"
                  y="-8"
                  fill="#FFFFFF"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  02 INSOLACIÓN MÁXIMA
                </text>
              </g>

              {/* Zone 3: Acceso Vial */}
              <g transform="translate(160, 210)">
                <circle r="12" fill="#C5A059" opacity="0.25" className="zone-blip" />
                <circle r="4" fill="#C5A059" />
                <text
                  x="10"
                  y="-8"
                  fill="#FFFFFF"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  03 ACCESO VIAL
                </text>
              </g>
            </svg>

            {/* Bottom Live Telemetry Bar */}
            <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between rounded-xl border border-white/10 bg-black/70 px-4 py-2.5 backdrop-blur-md text-[10px] uppercase tracking-widest text-white/70">
              <div className="flex gap-6 font-mono">
                <span>
                  Altitud <strong className="text-accent font-bold">{altitude.toFixed(1)}m</strong>
                </span>
                <span>
                  Vel <strong className="text-accent font-bold">{speed.toFixed(1)}m/s</strong>
                </span>
                <span>
                  Cobertura <strong className="text-accent font-bold">{coverage}%</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
