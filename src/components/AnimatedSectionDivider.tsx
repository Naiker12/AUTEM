interface AnimatedSectionDividerProps {
  className?: string;
  withDot?: boolean;
  verticalHeight?: string;
}

export default function AnimatedSectionDivider({
  className = "",
  withDot = true,
  verticalHeight = "h-16",
}: AnimatedSectionDividerProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center my-6 opacity-90 ${className}`}>
      
      {/* Top Vertical Animated Laser Line */}
      <div className={`relative w-[1.5px] ${verticalHeight} bg-gradient-to-b from-transparent via-accent to-amber-400 overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 blur-[0.5px] animate-pulse" />
      </div>

      {/* Horizontal Gradient Gold Line Container */}
      <div className="relative flex items-center justify-center w-full max-w-5xl">
        <div className="relative h-[1px] w-full bg-gradient-to-r from-transparent via-amber-500/50 dark:via-accent/60 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 blur-[0.5px] animate-pulse" />
        </div>

        {/* Central Glowing Accent Dot */}
        {withDot && (
          <div className="absolute flex items-center justify-center">
            <span className="absolute h-4 w-4 rounded-full bg-amber-400/40 opacity-75 animate-ping" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_14px_rgba(197,160,89,0.9)]" />
          </div>
        )}
      </div>

    </div>
  );
}
