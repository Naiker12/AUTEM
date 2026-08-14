import { Link } from "@tanstack/react-router";
import {
  Eye,
  FileText,
  Images,
  LayoutTemplate,
  Layers3,
  MessageCircle,
  RotateCcw,
  Settings2,
} from "lucide-react";
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

interface ProjectViewControlPanelProps {
  property: Property;
  settings: ProjectViewSettings;
  onSettingsChange: (changes: Partial<ProjectViewSettings>) => void;
  onResetSettings: () => void;
  onSelectMode: (mode: ViewMode) => void;
}

interface SettingRowProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingRow({ title, description, checked, onCheckedChange }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-5 rounded-xl border border-border bg-card/65 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  );
}

export default function ProjectViewControlPanel({
  property,
  settings,
  onSettingsChange,
  onResetSettings,
  onSelectMode,
}: ProjectViewControlPanelProps) {
  const contactUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(`Hola AUTEM, me interesa ${property.name}.`)}`;

  return (
    <SheetContent
      side="right"
      className="flex h-full w-full flex-col gap-0 border-border bg-background p-0 text-foreground sm:max-w-[460px]"
    >
      <SheetHeader className="border-b border-border px-6 pb-5 pt-7 text-left">
        <Badge
          variant="outline"
          className="mb-3 w-fit border-accent/35 text-[9px] uppercase tracking-[0.22em] text-accent"
        >
          AUTEM / Centro de control
        </Badge>
        <SheetTitle className="font-serif text-3xl font-normal tracking-[-0.035em]">
          Configura tu experiencia
        </SheetTitle>
        <SheetDescription>
          Consulta el proyecto y decide qué elementos quieres mantener visibles.
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="interface" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-6 mt-5 grid h-11 grid-cols-3 bg-muted p-1">
          <TabsTrigger value="project" className="gap-1.5 text-[10px]">
            <FileText size={13} /> Proyecto
          </TabsTrigger>
          <TabsTrigger value="interface" className="gap-1.5 text-[10px]">
            <Eye size={13} /> Interfaz
          </TabsTrigger>
          <TabsTrigger value="layers" className="gap-1.5 text-[10px]">
            <Layers3 size={13} /> Capas
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="project" className="m-0 space-y-6 p-6">
            <div className="overflow-hidden rounded-2xl border border-border">
              <img
                src={property.image}
                alt={`Vista de ${property.name}`}
                className="aspect-[16/8] w-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-serif text-4xl leading-none">{property.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{property.location}</p>
            </div>
            <dl className="grid grid-cols-2 divide-x divide-border rounded-2xl border border-border bg-muted/45">
              <div className="p-4">
                <dt className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Área
                </dt>
                <dd className="mt-2 font-serif text-2xl">{property.m2} m²</dd>
              </div>
              <div className="p-4">
                <dt className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Precio desde
                </dt>
                <dd className="mt-2 font-serif text-lg text-accent">{property.price}</dd>
              </div>
            </dl>
            <p className="text-sm leading-7 text-muted-foreground">{property.longDescription}</p>
            <div className="space-y-2">
              <Button
                type="button"
                onClick={() => onSelectMode("lot")}
                className="h-11 w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <LayoutTemplate /> Ver vista del lote
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onSelectMode("gallery")}
                className="h-11 w-full rounded-xl"
              >
                <Images /> Ver galería
              </Button>
              <Button asChild variant="outline" className="h-11 w-full rounded-xl">
                <a href={contactUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> Solicitar información
                </a>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="h-10 w-full rounded-xl text-muted-foreground"
              >
                <Link to="/properties/$id" params={{ id: property.slug }}>
                  <FileText /> Ficha completa
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="interface" className="m-0 space-y-3 p-6">
            <div className="mb-5">
              <h3 className="font-serif text-2xl">Elementos visibles</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Oculta paneles para ganar espacio o simplificar la presentación.
              </p>
            </div>
            <SettingRow
              title="Catálogo de lotes"
              description="Panel lateral con filtros y disponibilidad."
              checked={settings.showLotCatalog}
              onCheckedChange={(showLotCatalog) => onSettingsChange({ showLotCatalog })}
            />
            <SettingRow
              title="Ficha del lote"
              description="Datos y acciones del lote seleccionado."
              checked={settings.showLotDetails}
              onCheckedChange={(showLotDetails) => onSettingsChange({ showLotDetails })}
            />
            <SettingRow
              title="Selector de vistas"
              description="Navegación entre mapa, recorrido, galería y AR."
              checked={settings.showViewSwitcher}
              onCheckedChange={(showViewSwitcher) => onSettingsChange({ showViewSwitcher })}
            />
            <SettingRow
              title="Controles del mapa"
              description="Brújula, zoom, ubicación y capas."
              checked={settings.showMapControls}
              onCheckedChange={(showMapControls) => onSettingsChange({ showMapControls })}
            />
            <SettingRow
              title="Identidad del proyecto"
              description="Tarjeta AUTEM ubicada en la esquina inferior."
              checked={settings.showProjectBrand}
              onCheckedChange={(showProjectBrand) => onSettingsChange({ showProjectBrand })}
            />
            <SettingRow
              title="Ayudas del recorrido"
              description="Instrucciones para orbitar y acercar en 3D."
              checked={settings.showNavigationHints}
              onCheckedChange={(showNavigationHints) => onSettingsChange({ showNavigationHints })}
            />
          </TabsContent>

          <TabsContent value="layers" className="m-0 space-y-3 p-6">
            <div className="mb-5">
              <h3 className="font-serif text-2xl">Capas del masterplan</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Controla la información que aparece directamente sobre el terreno.
              </p>
            </div>
            <SettingRow
              title="Límites de lotes"
              description="Polígonos y contornos sobre la vista aérea."
              checked={settings.showLotBoundaries}
              onCheckedChange={(showLotBoundaries) => onSettingsChange({ showLotBoundaries })}
            />
            <SettingRow
              title="Nombres de lotes"
              description="Etiquetas L-01, L-07, L-12 y demás ubicaciones."
              checked={settings.showLotLabels}
              onCheckedChange={(showLotLabels) => onSettingsChange({ showLotLabels })}
            />
            <Separator className="my-5" />
            <div className="rounded-xl border border-border bg-card/65 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Oscurecer fotografía</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mejora el contraste de las capas.
                  </p>
                </div>
                <span className="font-mono text-xs text-accent">{settings.mapShade}%</span>
              </div>
              <Slider
                value={[settings.mapShade]}
                min={0}
                max={45}
                step={1}
                onValueChange={([mapShade]) => onSettingsChange({ mapShade })}
                className="mt-5"
              />
            </div>
            <div className="rounded-xl border border-border bg-card/65 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Intensidad de selección</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Transparencia del lote activo.
                  </p>
                </div>
                <span className="font-mono text-xs text-accent">{settings.selectionOpacity}%</span>
              </div>
              <Slider
                value={[settings.selectionOpacity]}
                min={10}
                max={55}
                step={1}
                onValueChange={([selectionOpacity]) => onSettingsChange({ selectionOpacity })}
                className="mt-5"
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <div className="border-t border-border p-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onResetSettings}
          className="w-full rounded-xl text-muted-foreground hover:text-foreground"
        >
          <RotateCcw /> Restaurar configuración
        </Button>
        <p className="mt-2 text-center text-[9px] text-muted-foreground">
          <Settings2 className="mr-1 inline size-3" /> Las preferencias se guardan en este
          dispositivo.
        </p>
      </div>
    </SheetContent>
  );
}
