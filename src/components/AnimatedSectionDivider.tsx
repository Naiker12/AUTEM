interface AnimatedSectionDividerProps {
  className?: string;
}

export default function AnimatedSectionDivider({ className = "" }: AnimatedSectionDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto h-px w-[calc(100%-3rem)] max-w-7xl overflow-hidden bg-gradient-to-r from-transparent via-accent/45 to-transparent ${className}`}
    >
      <div className="absolute inset-y-0 left-1/2 w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent to-transparent opacity-70" />
    </div>
  );
}
