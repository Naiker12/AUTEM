import { Sun, Moon, Building2 } from "lucide-react";
import type { LightingMode } from "./ar-types";

interface AREnvironmentToggleProps {
  currentTheme: LightingMode;
  onThemeChange: (theme: LightingMode) => void;
  className?: string;
}

export function AREnvironmentToggle({
  currentTheme,
  onThemeChange,
  className = "",
}: AREnvironmentToggleProps) {
  const options: { id: LightingMode; label: string; shortLabel: string; icon: typeof Sun }[] = [
    { id: "day", label: "Día (Sol)", shortLabel: "Día", icon: Sun },
    { id: "night", label: "Noche (Luces)", shortLabel: "Noche", icon: Moon },
    { id: "studio", label: "Estudio 3D", shortLabel: "Estudio", icon: Building2 },
  ];

  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-stone-700/60 bg-stone-950/90 p-1 backdrop-blur-md shadow-xl ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = currentTheme === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onThemeChange(opt.id)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              isActive
                ? opt.id === "day"
                  ? "bg-amber-400 text-amber-950 shadow-md scale-105"
                  : opt.id === "night"
                    ? "bg-indigo-600 text-white shadow-md scale-105"
                    : "bg-accent text-accent-foreground shadow-md scale-105"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
            }`}
            title={`Ver entorno en modo ${opt.label}`}
          >
            <Icon size={13} className="shrink-0" />
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="inline sm:hidden">{opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
