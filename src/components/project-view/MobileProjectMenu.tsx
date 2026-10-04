import { Menu, MessageCircle, Moon, Settings2, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECT_VIEW_MODES, type ViewMode } from "./types";

interface Props {
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  showViews: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenInfo: () => void;
  contactUrl: string;
}

export default function MobileProjectMenu({
  activeMode,
  onModeChange,
  showViews,
  isDark,
  onToggleTheme,
  onOpenInfo,
  contactUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-xl"
          aria-label="Abrir menú del proyecto"
        >
          <Menu />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        collisionPadding={12}
        data-theme={isDark ? "dark" : "light"}
        className="project-editorial w-[min(320px,calc(100vw-24px))] max-h-[calc(100dvh-88px)] overflow-y-auto rounded-2xl p-2 shadow-xl"
      >
        {showViews && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-3 py-2">Vistas del proyecto</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={activeMode}
              onValueChange={(value) => onModeChange(value as ViewMode)}
            >
              {PROJECT_VIEW_MODES.map(({ id, label, icon: Icon, badge }) => (
                <DropdownMenuRadioItem
                  key={id}
                  value={id}
                  onSelect={() => setOpen(false)}
                  className="min-h-12 gap-3 rounded-xl py-3 pr-3 data-[state=checked]:bg-accent/15"
                >
                  <Icon />
                  <span className="flex-1">{label}</span>
                  {badge && <span className="text-[10px] text-muted-foreground">Próximamente</span>}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        )}
        {showViews && <DropdownMenuSeparator />}
        <DropdownMenuGroup>
          <DropdownMenuItem className="min-h-11 gap-3 rounded-xl px-3" onSelect={onToggleTheme}>
            {isDark ? <Sun /> : <Moon />} {isDark ? "Cambiar a día" : "Cambiar a noche"}
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="min-h-11 gap-3 rounded-xl px-3">
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Contacto
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11 gap-3 rounded-xl px-3" onSelect={onOpenInfo}>
            <Settings2 /> Centro de control
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
