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
      className={`absolute top-1/2 z-20 -translate-y-1/2 ${shifted ? "left-[30.25rem]" : "left-5 md:left-8"}`}
    >
      <div className="flex flex-col gap-1 rounded-[1.15rem] border border-white/15 bg-[#17200f]/92 p-2 shadow-[0_20px_55px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        {PROJECT_VIEW_MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`group flex size-11 items-center justify-center gap-2 rounded-xl transition duration-300 md:h-[3.35rem] md:w-[9.6rem] md:justify-start md:px-3 ${
              activeMode === id
                ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            aria-label={label}
            aria-pressed={activeMode === id}
          >
            <Icon size={19} strokeWidth={1.8} className="shrink-0" />
            <span className="hidden text-left text-[9px] font-bold uppercase leading-tight tracking-wide md:block">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
