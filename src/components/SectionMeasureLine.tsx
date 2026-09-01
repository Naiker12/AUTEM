import { useRef } from "react";
import { useScrollFrame } from "@/hooks/useScrollFrame";

interface SectionMeasureLineProps {
  index: number;
  total: number;
  label: string;
}

export default function SectionMeasureLine({ index, total, label }: SectionMeasureLineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);

  useScrollFrame(() => {
    const root = rootRef.current;
    const fill = fillRef.current;
    const marker = markerRef.current;
    const section = root?.closest("section");
    if (!root || !fill || !marker || !section) return;
    const bounds = section.getBoundingClientRect();
    const distance = window.innerHeight + bounds.height;
    const progress = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / distance));

    fill.style.transform = `scaleX(${progress})`;
    marker.style.left = `${progress * 100}%`;
  });

  const number = String(index).padStart(2, "0");
  const totalNumber = String(total).padStart(2, "0");

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-30"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-border/75" />
      <div
        ref={fillRef}
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-accent/45 via-accent to-accent/55 shadow-[0_0_12px_color-mix(in_oklab,var(--accent)_45%,transparent)]"
      />
      <span
        ref={markerRef}
        className="absolute top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent bg-background shadow-[0_0_0_4px_color-mix(in_oklab,var(--background)_82%,transparent),0_0_14px_color-mix(in_oklab,var(--accent)_55%,transparent)]"
      />

      <div className="absolute left-5 top-3 flex items-center gap-2 sm:left-8 lg:left-12 xl:left-20">
        <span className="grid size-7 place-items-center rounded-full border border-accent/45 bg-background font-mono text-[8px] font-bold tabular-nums text-accent">
          {number}
        </span>
        <span className="hidden text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:block">
          {label}
        </span>
      </div>

      <span className="absolute right-5 top-4 font-mono text-[8px] tabular-nums tracking-[0.16em] text-muted-foreground sm:right-8 lg:right-12 xl:right-20">
        {number} / {totalNumber}
      </span>
    </div>
  );
}
