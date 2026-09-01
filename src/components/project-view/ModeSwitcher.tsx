import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PROJECT_VIEW_MODES, type ViewMode } from "./types";

interface ModeSwitcherProps {
  activeMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  inHeader?: boolean;
}

export default function ModeSwitcher({
  activeMode,
  onChange,
  inHeader = false,
}: ModeSwitcherProps) {
  return (
    <nav
      aria-label="Modos de vista"
      className={
        inHeader
          ? "min-w-0 flex-1"
          : "absolute left-1/2 top-[84px] z-30 max-w-[calc(100vw-2rem)] -translate-x-1/2"
      }
    >
      <ToggleGroup
        type="single"
        value={activeMode}
        onValueChange={(value) => value && onChange(value as ViewMode)}
        className={`flex max-w-full gap-1 overflow-x-auto text-foreground ${inHeader ? "mx-auto w-fit" : "rounded-[20px] border border-border bg-background/90 p-1.5 shadow-[0_20px_55px_rgba(0,0,0,.3)] backdrop-blur-2xl"}`}
      >
        {PROJECT_VIEW_MODES.map(({ id, label, icon: Icon }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            aria-label={label}
            className={`group shrink-0 flex-col gap-1.5 rounded-[14px] px-3 text-muted-foreground transition hover:bg-muted hover:text-foreground data-[state=on]:bg-accent/15 data-[state=on]:text-accent ${inHeader ? "h-12 min-w-[64px]" : "h-[58px] min-w-[66px] md:min-w-[86px]"}`}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span className="text-[8px] font-bold leading-none tracking-wide">{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </nav>
  );
}
