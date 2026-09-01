import { useRef } from "react";
import { useScrollFrame } from "@/hooks/useScrollFrame";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useScrollFrame(() => {
    if (!barRef.current) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    barRef.current.style.transform = `scaleX(${progress})`;
  });

  return <div ref={barRef} className="scroll-progress" aria-hidden="true" />;
}
