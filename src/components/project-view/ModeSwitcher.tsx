import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PROJECT_VIEW_MODES, type ViewMode } from "./types";

interface ModeSwitcherProps {
  activeMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  shifted?: boolean;
}

export default function ModeSwitcher({ activeMode, onChange, shifted = false }: ModeSwitcherProps) {
  return (
    <nav
      aria-label="Modos de vista"
      className={`absolute bottom-4 top-auto z-30 max-w-[calc(100vw-2rem)] transition-[left] duration-500 md:bottom-auto md:top-[86px] ${shifted ? "left-1/2 xl:left-[calc(50%+180px)] 2xl:left-[calc(50%+335px)]" : "left-1/2"} -translate-x-1/2`}
    >
      <ToggleGroup
        type="single"
        value={activeMode}
        onValueChange={(value) => value && onChange(value as ViewMode)}
        className="flex max-w-full gap-1 overflow-x-auto rounded-[20px] border border-border bg-background/90 p-1.5 text-foreground shadow-[0_20px_55px_rgba(0,0,0,.3)] backdrop-blur-2xl"
      >
        {PROJECT_VIEW_MODES.map(({ id, label, icon: Icon }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            aria-label={label}
            className="group h-[58px] min-w-[66px] shrink-0 flex-col gap-1.5 rounded-[14px] px-3 text-muted-foreground transition hover:bg-muted hover:text-foreground data-[state=on]:bg-accent/15 data-[state=on]:text-accent md:min-w-[86px]"
          >
            <Icon size={19} strokeWidth={1.8} />
            <span className="text-[8px] font-bold leading-none tracking-wide">{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </nav>
  );
}
