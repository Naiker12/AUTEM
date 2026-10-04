import { Eye, FileText, Layers3, MessageCircle, RotateCcw, Settings2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WHATSAPP_BASE_URL } from "@/data/constants";
import type { Property } from "@/data/properties";
import type { ProjectViewSettings, ViewMode } from "./types";

export interface ProjectViewControlPanelProps {
  property: Property;
  settings: ProjectViewSettings;
  onSettingsChange: (changes: Partial<ProjectViewSettings>) => void;
  onResetSettings: () => void;
  onSelectMode: (mode: ViewMode) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

interface SettingRowProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingRow({ title, description, checked, onCheckedChange }: SettingRowProps) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 rounded-xl border bg-card px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={title}
        className="shrink-0"
      />
    </div>
  );
}

/**
 * Contenido interno estilizado, delgado y modular del Centro de Control
 */
export function ProjectViewControlPanelContent({
  property,
  settings,
  onSettingsChange,
  onResetSettings,
  onClose,
  isMobile = false,
}: ProjectViewControlPanelProps) {
  const contactUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola AUTEM, me interesa ${property.name}.`)}`;
  const [activeTab, setActiveTab] = useState(isMobile ? "interface" : "project");

  return (
    <div className="project-control-panel flex h-full min-h-0 w-full flex-col overflow-hidden bg-card text-foreground">
      {/* Cabecera compacta y estilizada */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="text-lg font-semibold tracking-tight leading-snug">
            Configura tu experiencia
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {isMobile
              ? "Personaliza esta vista y vuelve a tu panel."
              : `Personaliza ${property.name}.`}
          </p>
        </div>
        {onClose && (
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-xl"
            aria-label="Cerrar configuración y volver a la vista"
          >
            <X />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-3 grid h-11 shrink-0 grid-cols-3 rounded-xl p-1">
          <TabsTrigger value="project" className="h-full gap-2 rounded-lg text-xs">
            <FileText size={12} /> Proyecto
          </TabsTrigger>
          <TabsTrigger value="interface" className="h-full gap-2 rounded-lg text-xs">
            <Eye size={12} /> Interfaz
          </TabsTrigger>
          <TabsTrigger value="layers" className="h-full gap-2 rounded-lg text-xs">
            <Layers3 size={12} /> Capas
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="min-h-0 flex-1 px-3 sm:px-3.5">
          <TabsContent value="project" className="m-0 flex flex-col gap-3 py-3 pr-1">
            {/* Render aéreo real del masterplan */}
            <div className="relative overflow-hidden rounded-xl border border-border dark:border-white/10 shadow-xs">
              <img
                src={property.image}
                alt={`Vista real aérea de ${property.name}`}
                className={
                  isMobile ? "h-28 w-full object-cover" : "aspect-[16/9] w-full object-cover"
                }
              />
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[8px] font-semibold text-white/95 backdrop-blur-md">
                Masterplan Aéreo Real
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-xl leading-none text-foreground">{property.name}</h4>
                <Badge
                  variant="outline"
                  className="border-accent/40 bg-accent/10 text-[8.5px] font-semibold text-accent uppercase py-0 px-1.5"
                >
                  343 Lotes
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{property.location}</p>
            </div>

            {/* Fichas compactas de datos reales del proyecto */}
            <div className="grid grid-cols-2 gap-1.5 text-left">
              <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5 transition-colors hover:border-accent/40">
                <span className="block text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">
                  Lotes totales
                </span>
                <span className="mt-0.5 block font-serif text-sm text-foreground dark:text-stone-100">
                  343 parcelas
                </span>
              </div>
              <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5 transition-colors hover:border-accent/40">
                <span className="block text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">
                  Precios desde
                </span>
                <span className="mt-0.5 block font-serif text-sm text-accent dark:text-[#c5a059] font-medium">
                  {property.price}
                </span>
              </div>
              <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5 transition-colors hover:border-accent/40">
                <span className="block text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">
                  Áreas
                </span>
                <span className="mt-0.5 block font-serif text-sm text-foreground dark:text-stone-100">
                  240 - 1.080 m²
                </span>
              </div>
              <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-2.5 transition-colors hover:border-accent/40">
                <span className="block text-[7.5px] font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">
                  Tipología
                </span>
                <span className="mt-0.5 block font-serif text-sm text-foreground dark:text-stone-100">
                  Campestre
                </span>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-stone-300">
              {property.longDescription}
            </p>

            {/* Características del desarrollo */}
            <div className="rounded-xl border border-border/80 dark:border-white/10 bg-card/90 dark:bg-stone-900/85 p-3 space-y-2">
              <p className="text-[8.5px] font-bold uppercase tracking-wider text-muted-foreground dark:text-stone-400">
                Características del desarrollo
              </p>
              <div className="grid grid-cols-1 gap-1 text-[10.5px] text-foreground/80 dark:text-stone-200">
                {property.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-accent shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interface" className="m-0 flex flex-col gap-3 py-3 pr-1">
            <div className={isMobile ? "sr-only" : "mb-2"}>
              <h4 className="font-serif text-base">Elementos visibles</h4>
              <p className="text-[10px] text-muted-foreground">
                Oculta o muestra paneles para mayor amplitud de visualización.
              </p>
            </div>
            <SettingRow
              title="Catálogo de lotes"
              description="Panel de lotes con filtros, búsqueda y cotización."
              checked={settings.showLotCatalog}
              onCheckedChange={(showLotCatalog) => onSettingsChange({ showLotCatalog })}
            />
            <SettingRow
              title="Selector de vistas"
              description="Navegación entre plano urbanístico, 3D y galería."
              checked={settings.showViewSwitcher}
              onCheckedChange={(showViewSwitcher) => onSettingsChange({ showViewSwitcher })}
            />
            <SettingRow
              title="Controles del mapa"
              description="Botones de zoom, pantalla completa y restablecer."
              checked={settings.showMapControls}
              onCheckedChange={(showMapControls) => onSettingsChange({ showMapControls })}
            />
            <SettingRow
              title="Identidad del proyecto"
              description="Nombre de Villa Paraíso y badge en cabecera."
              checked={settings.showProjectBrand}
              onCheckedChange={(showProjectBrand) => onSettingsChange({ showProjectBrand })}
            />
            <SettingRow
              title="Ayudas visuales"
              description="Instrucciones táctiles para interactuar en pantalla."
              checked={settings.showNavigationHints}
              onCheckedChange={(showNavigationHints) => onSettingsChange({ showNavigationHints })}
            />
          </TabsContent>

          <TabsContent value="layers" className="m-0 flex flex-col gap-3 py-3 pr-1">
            <div className={isMobile ? "sr-only" : "mb-2"}>
              <h4 className="font-serif text-base">Capas del masterplan</h4>
              <p className="text-[10px] text-muted-foreground">
                Controla la información gráfica que se dibuja sobre el plano.
              </p>
            </div>
            <SettingRow
              title="Límites de lotes"
              description="Polígonos y linderos precisos de cada propiedad."
              checked={settings.showLotBoundaries}
              onCheckedChange={(showLotBoundaries) => onSettingsChange({ showLotBoundaries })}
            />
            <SettingRow
              title="Nombres y números de lote"
              description="Etiquetas legibles de L-01, L-30 y demás coordenadas."
              checked={settings.showLotLabels}
              onCheckedChange={(showLotLabels) => onSettingsChange({ showLotLabels })}
            />

            <Separator className="my-2" />

            <div className="rounded-xl border border-border/70 dark:border-white/10 bg-card/60 dark:bg-stone-900/60 px-3 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground dark:text-stone-200 leading-tight">
                    Oscurecer plano
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground dark:text-stone-400">
                    Ajusta el contraste de fondo del masterplan.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-accent">
                  {settings.mapShade}%
                </span>
              </div>
              <Slider
                value={[settings.mapShade]}
                min={0}
                max={45}
                step={1}
                onValueChange={([mapShade]) => onSettingsChange({ mapShade })}
                className="mt-2.5"
              />
            </div>

            <div className="rounded-xl border border-border/70 dark:border-white/10 bg-card/60 dark:bg-stone-900/60 px-3 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground dark:text-stone-200 leading-tight">
                    Intensidad de selección
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground dark:text-stone-400">
                    Transparencia y resalte del lote activo.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-accent">
                  {settings.selectionOpacity}%
                </span>
              </div>
              <Slider
                value={[settings.selectionOpacity]}
                min={10}
                max={55}
                step={1}
                onValueChange={([selectionOpacity]) => onSettingsChange({ selectionOpacity })}
                className="mt-2.5"
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Pie de acción fijado al fondo: siempre visible sin obligar a hacer scroll incómodo */}
      {isMobile ? (
        <div className="grid shrink-0 grid-cols-2 gap-2 border-t bg-card px-3 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={onResetSettings}
          >
            <RotateCcw /> Restaurar
          </Button>
          <Button type="button" className="h-11 rounded-xl" onClick={onClose}>
            Volver a la vista
          </Button>
        </div>
      ) : activeTab === "project" ? (
        <div className="border-t border-border dark:border-white/10 p-2.5 sm:px-3 sm:py-2.5 bg-background/90 backdrop-blur-xl">
          <Button
            asChild
            className="h-8.5 sm:h-9 w-full rounded-full border border-[#403a34] bg-[#403a34] font-medium uppercase tracking-[0.08em] text-[#f6f1eb] transition-all duration-300 hover:bg-[#2b2723] dark:border-transparent dark:bg-gradient-to-r dark:from-[#d4af37] dark:via-[#c5a059] dark:to-[#b38e44] dark:text-[#151413] dark:font-bold dark:shadow-[0_4px_16px_rgba(197,160,89,0.3)] dark:hover:brightness-110 text-[10px] sm:text-[10.5px]"
          >
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={14} className="mr-1.5" /> Solicitar asesoría por WhatsApp
            </a>
          </Button>
        </div>
      ) : (
        <div className="border-t border-border dark:border-white/10 p-2.5 bg-background/90 backdrop-blur-xl">
          <Button
            type="button"
            variant="ghost"
            onClick={onResetSettings}
            className="h-8 w-full rounded-xl text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <RotateCcw size={12} className="mr-1.5" /> Restaurar configuración
          </Button>
          <p className="mt-0.5 text-center text-[8.5px] text-muted-foreground">
            <Settings2 className="mr-1 inline size-2.5" /> Las preferencias se guardan en este
            dispositivo.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Componente principal utilizado para Sheet (móvil abajo, escritorio vertical a la derecha)
 */
export default function ProjectViewControlPanel(props: ProjectViewControlPanelProps) {
  const isMobile = props.isMobile ?? false;

  return (
    <SheetContent
      side={isMobile ? "bottom" : "right"}
      className={
        isMobile
          ? "flex h-[60vh] sm:h-[64vh] w-full flex-col gap-0 rounded-t-[28px] border-t border-border bg-background/95 p-0 text-foreground shadow-2xl backdrop-blur-2xl"
          : "flex h-full w-[320px] max-w-[320px] flex-col gap-0 border-l border-border bg-background/95 p-0 text-foreground shadow-2xl backdrop-blur-2xl"
      }
    >
      {/* Tirador táctil solo para pantalla dividida en móvil */}
      {isMobile && (
        <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
      )}
      <ProjectViewControlPanelContent {...props} isMobile={isMobile} />
    </SheetContent>
  );
}
