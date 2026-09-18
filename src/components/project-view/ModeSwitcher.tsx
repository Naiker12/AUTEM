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
          className="flex gap-0.5 rounded-full border border-border/80 bg-background/95 p-1 shadow-lg backdrop-blur-xl"
        >
          {PROJECT_VIEW_MODES.map(({ id, label, icon: Icon }) => (
            <ToggleGroupItem
              key={id}
              value={id}
              aria-label={label}
              className="group flex flex-col items-center justify-center gap-0.5 rounded-full px-2 py-0.5 h-8 min-w-[42px] text-muted-foreground transition hover:bg-muted hover:text-foreground data-[state=on]:bg-accent/15 data-[state=on]:text-accent"
            >
              <Icon size={13} strokeWidth={1.8} />
              <span className="text-[7px] font-bold leading-none tracking-wide">
                {label}
              </span>
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
        className={`flex max-w-full gap-1 overflow-x-auto text-foreground ${inHeader ? "mx-auto w-fit" : "rounded-full border border-border/80 bg-background/90 p-1.5 shadow-[0_16px_48px_rgba(0,0,0,.35)] backdrop-blur-2xl"}`}
      >
        {PROJECT_VIEW_MODES.map(({ id, label, icon: Icon }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            aria-label={label}
            className={`group shrink-0 flex-col gap-1 rounded-full px-2.5 sm:px-3 text-muted-foreground transition hover:bg-muted hover:text-foreground data-[state=on]:bg-accent/15 data-[state=on]:text-accent ${inHeader ? "h-12 min-w-[64px]" : "h-[50px] sm:h-[56px] min-w-[58px] sm:min-w-[78px]"}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span className="text-[7.5px] sm:text-[8px] font-bold leading-none tracking-wide">
              {label}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </nav>
  );
}
