import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PROJECT_VIEW_MODES, type ViewMode } from "./types";

interface ModeSwitcherProps {
  activeMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  inHeader?: boolean;
  compact?: boolean;
}

export default function ModeSwitcher({
  activeMode,
  onChange,
  inHeader = false,
  compact = false,
}: ModeSwitcherProps) {
  if (compact) {
    return (
      <nav aria-label="Modos de vista" className="w-fit select-none">
        <ToggleGroup
          type="single"
          value={activeMode}
          onValueChange={(value) => value && onChange(value as ViewMode)}
          className="flex gap-0.5 rounded-full border border-border/80 dark:border-white/10 bg-background/95 p-1 shadow-lg backdrop-blur-xl"
        >
          {PROJECT_VIEW_MODES.map(({ id, label, shortLabel, icon: Icon, badge }) => (
            <ToggleGroupItem
              key={id}
              value={id}
              aria-label={label}
              title={badge ? `${label} (${badge})` : label}
              className="relative group flex flex-col items-center justify-center gap-0.5 rounded-full px-2 py-0.5 h-8.5 min-w-[48px] text-muted-foreground transition hover:bg-muted hover:text-foreground dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-white/5 data-[state=on]:bg-accent/15 data-[state=on]:text-accent dark:data-[state=on]:bg-[#c5a059]/20 dark:data-[state=on]:text-[#c5a059] dark:data-[state=on]:border dark:data-[state=on]:border-[#c5a059]/30"
            >
              <Icon size={13} strokeWidth={1.8} />
              <span className="text-[7px] font-bold leading-none tracking-tight whitespace-nowrap">
                {shortLabel ?? label}
              </span>
              {badge && (
                <span className="absolute -top-0.5 -right-0.5 flex size-2 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                </span>
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Modos de vista"
      className={
        inHeader
          ? "min-w-0 flex-1"
          : "fixed bottom-5 left-1/2 z-30 max-w-[calc(100vw-1.5rem)] -translate-x-1/2"
      }
    >
      <ToggleGroup
        type="single"
        value={activeMode}
        onValueChange={(value) => value && onChange(value as ViewMode)}
        className={`flex max-w-full gap-1 overflow-x-auto text-foreground ${inHeader ? "mx-auto w-fit" : "rounded-full border border-border/80 dark:border-white/10 bg-background/90 p-1.5 shadow-[0_16px_48px_rgba(0,0,0,.35)] backdrop-blur-2xl"}`}
      >
        {PROJECT_VIEW_MODES.map(({ id, label, icon: Icon, badge }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            aria-label={label}
            title={badge ? `${label} (${badge})` : label}
            className={`relative group shrink-0 flex-col gap-1 rounded-full px-2.5 sm:px-3.5 text-muted-foreground transition hover:bg-muted hover:text-foreground dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-white/5 data-[state=on]:bg-accent/15 data-[state=on]:text-accent dark:data-[state=on]:bg-[#c5a059]/20 dark:data-[state=on]:text-[#c5a059] dark:data-[state=on]:border dark:data-[state=on]:border-[#c5a059]/30 ${inHeader ? "h-12 min-w-[82px] sm:min-w-[90px]" : "h-[50px] sm:h-[56px] min-w-[68px] sm:min-w-[84px]"}`}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span className="text-[7.5px] sm:text-[8px] font-bold leading-none tracking-tight whitespace-nowrap">
              {label}
            </span>
            {badge && (
              <span className="absolute top-1 right-1 rounded-full bg-accent/20 border border-accent/40 px-1 py-0.5 text-[6.5px] font-extrabold uppercase tracking-wider text-accent leading-none">
                {badge}
              </span>
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </nav>
  );
}
