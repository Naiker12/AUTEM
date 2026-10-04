import { useRef } from "react";

export const PANEL_DRAG_SENSITIVITY = 1.4;

interface PanelResizeHandleProps {
  value: number;
  label?: string;
  max?: number;
  onChange: (value: number) => void;
}

export default function PanelResizeHandle({
  value,
  onChange,
  label = "Configuración de la vista",
  max = 84,
}: PanelResizeHandleProps) {
  const drag = useRef<{ y: number; value: number; height: number } | null>(null);
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={`Altura del panel: ${label}`}
      aria-valuemin={30}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-orientation="vertical"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          y: event.clientY,
          value,
          height: event.currentTarget.closest("main")?.clientHeight || window.innerHeight,
        };
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        onChange(
          Math.max(
            30,
            Math.min(
              max,
              drag.current.value +
                ((drag.current.y - event.clientY) / drag.current.height) *
                  100 *
                  PANEL_DRAG_SENSITIVITY,
            ),
          ),
        );
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onKeyDown={(event) => {
        const next =
          event.key === "ArrowUp"
            ? value + 5
            : event.key === "ArrowDown"
              ? value - 5
              : event.key === "Home"
                ? 30
                : event.key === "End"
                  ? max
                  : null;
        if (next === null) return;
        event.preventDefault();
        onChange(Math.max(30, Math.min(max, next)));
      }}
      className="flex h-10 shrink-0 cursor-row-resize touch-none select-none items-center justify-center gap-2 border-t bg-card text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title="Arrastra hacia arriba o abajo para ajustar el panel"
    >
      <span className="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
      {label} ↕
    </div>
  );
}
