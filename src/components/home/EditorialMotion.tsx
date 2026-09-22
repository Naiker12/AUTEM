import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** Per-element reveals: short blocks trigger independently, including on mobile. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (
      !el ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    el.dataset.motion = "pending";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.motion = "visible";
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`editorial-reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function AnimatedHeading({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  let index = 0;
  return (
    <Reveal className={`editorial-heading ${className}`}>
      <h2 aria-label={children}>
        <span aria-hidden="true">
          {children.split(" ").map((word, wordIndex) => (
            <span className="editorial-word" key={wordIndex}>
              {[...word].map((letter) => (
                <span
                  className="editorial-letter"
                  key={index}
                  style={{ "--letter-delay": `${index++ * 12}ms` } as CSSProperties}
                >
                  {letter}
                </span>
              ))}{" "}
            </span>
          ))}
        </span>
      </h2>
    </Reveal>
  );
}
