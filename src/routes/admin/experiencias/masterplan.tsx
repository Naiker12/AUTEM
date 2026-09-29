import { createFileRoute } from "@tanstack/react-router";
import {
  FileUp,
  ImagePlus,
  Link2,
  MapPin,
  MousePointer2,
  Orbit,
  Play,
  Plus,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { publicProjectMediaUrl } from "@/lib/project-repository";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/experiencias/masterplan")({
  component: MasterplanExperiencePage,
});

type SceneKind = "Panorama 360" | "Video 360" | "Tour 3D";
type Scene = {
  id: string;
  name: string;
  kind: SceneKind;
  description: string;
  enabled: boolean;
  hasMedia: boolean;
  sourceUrl: string;
  hotspotCount: number;
};

type Hotspot = { id: string; label: string; x: string; y: string; destination: string };
type SourceMethod = "link" | "file";
type SceneDraft = {
  name: string;
  kind: SceneKind;
  sourceUrl: string;
  sourceMethod: SourceMethod;
  file: File | null;
};

const initialScenes: Scene[] = [
  {
    id: "aerea",
    name: "Vista aérea del proyecto",
    kind: "Panorama 360",
    description: "Escena de entrada para ubicar al visitante en Villa Paraíso.",
    enabled: true,
    hasMedia: true,
    sourceUrl:
      publicProjectMediaUrl(
        "00000000-0000-0000-0000-000000000101/tour/masterplan-panorama-360.jpg",
      ) ?? "",
    hotspotCount: 4,
  },
  {
    id: "acceso",
    name: "Acceso principal",
    kind: "Video 360",
    description: "Recorrido de llegada y conexión con la vía principal.",
    enabled: true,
    hasMedia: false,
    sourceUrl: "",
    hotspotCount: 1,
  },
  {
    id: "zona-social",
    name: "Zona social",
    kind: "Panorama 360",
    description: "Punto inmersivo para presentar la amenidad principal.",
    enabled: false,
    hasMedia: false,
    sourceUrl: "",
    hotspotCount: 0,
  },
  {
    id: "entorno",
    name: "Entorno natural",
    kind: "Tour 3D",
    description: "Vista de paisaje y relación con las zonas verdes.",
    enabled: true,
    hasMedia: false,
    sourceUrl: "",
    hotspotCount: 0,
  },
];

const hotspots: Hotspot[] = [
  { id: "acceso", label: "Acceso principal", x: "22%", y: "53%", destination: "acceso" },
  { id: "social", label: "Zona social", x: "57%", y: "47%", destination: "zona-social" },
  { id: "naturaleza", label: "Entorno natural", x: "76%", y: "32%", destination: "entorno" },
  { id: "lotes", label: "Explorar lotes", x: "46%", y: "71%", destination: "visor-lotes" },
];

function MasterplanExperiencePage() {
  const [scenes, setScenes] = useState(initialScenes);
  const [isAddSceneOpen, setIsAddSceneOpen] = useState(false);
  const [sceneDraft, setSceneDraft] = useState<SceneDraft>({
    name: "",
    kind: "Panorama 360",
    sourceUrl: "",
    sourceMethod: "link",
    file: null,
  });
  const [configuredHotspots, setConfiguredHotspots] = useState(hotspots);
  const [selectedSceneId, setSelectedSceneId] = useState("aerea");
  const [selectedHotspotId, setSelectedHotspotId] = useState("acceso");
  const [showLabels, setShowLabels] = useState(true);
  const [showCompass, setShowCompass] = useState(true);
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0];
  const selectedHotspot =
    configuredHotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? configuredHotspots[0];
  const enabledScenes = scenes.filter((scene) => scene.enabled).length;
  const readyScenes = scenes.filter((scene) => scene.hasMedia).length;
  const sceneDestinations = useMemo(() => scenes.filter((scene) => scene.id !== "aerea"), [scenes]);

  const updateScene = (id: string, patch: Partial<Scene>) =>
    setScenes((current) =>
      current.map((scene) => (scene.id === id ? { ...scene, ...patch } : scene)),
    );
  const updateHotspotDestination = (destination: string) => {
    setConfiguredHotspots((current) =>
      current.map((hotspot) =>
        hotspot.id === selectedHotspot.id ? { ...hotspot, destination } : hotspot,
      ),
    );
    if (destination !== "visor-lotes") setSelectedSceneId(destination);
  };
  const updateHotspotLabel = (label: string) => {
    setConfiguredHotspots((current) =>
      current.map((hotspot) =>
        hotspot.id === selectedHotspot.id ? { ...hotspot, label } : hotspot,
      ),
    );
  };
  const openAddSceneDialog = () => {
    setSceneDraft({
      name: "",
      kind: "Panorama 360",
      sourceUrl: "",
      sourceMethod: "link",
      file: null,
    });
    setIsAddSceneOpen(true);
  };
  const addScene = () => {
    if (!sceneDraft.name.trim()) return;
    const number = scenes.length + 1;
    const scene: Scene = {
      id: `escena-${number}`,
      name: sceneDraft.name.trim(),
      kind: sceneDraft.kind,
      description: getDraftDescription(sceneDraft.kind),
      enabled: false,
      hasMedia:
        sceneDraft.sourceMethod === "file"
          ? Boolean(sceneDraft.file)
          : Boolean(sceneDraft.sourceUrl.trim()),
      sourceUrl:
        sceneDraft.sourceMethod === "file" && sceneDraft.file
          ? URL.createObjectURL(sceneDraft.file)
          : sceneDraft.sourceUrl.trim(),
      hotspotCount: 0,
    };
    setScenes((current) => [...current, scene]);
    setSelectedSceneId(scene.id);
    setIsAddSceneOpen(false);
  };

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <section className="flex flex-col gap-5 border-b pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex max-w-3xl flex-col gap-2 border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Experiencias del proyecto · Borrador local
          </p>
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">Masterplan 360</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Construye el recorrido inmersivo: panorama aéreo, videos 360, escenas de destino y
            puntos interactivos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">Villa Paraíso · Sin publicar</Badge>
          <Button variant="outline" onClick={openAddSceneDialog}>
            <Plus data-icon="inline-start" /> Añadir escena
          </Button>
        </div>
      </section>
      <Dialog open={isAddSceneOpen} onOpenChange={setIsAddSceneOpen}>
        <DialogContent>
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              addScene();
            }}
          >
            <DialogHeader>
              <DialogTitle>Crear escena 360</DialogTitle>
              <DialogDescription>
                Define el medio y la ubicación de la nueva parada dentro del recorrido.
              </DialogDescription>
            </DialogHeader>
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="new-scene-name">Nombre de la escena</FieldLabel>
                  <Input
                    id="new-scene-name"
                    value={sceneDraft.name}
                    onChange={(event) =>
                      setSceneDraft((draft) => ({ ...draft, name: event.target.value }))
                    }
                    placeholder="Ej. Mirador del bosque"
                    autoFocus
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-scene-kind">Tipo de medio</FieldLabel>
                  <Select
                    value={sceneDraft.kind}
                    onValueChange={(kind) =>
                      setSceneDraft((draft) => ({ ...draft, kind: kind as SceneKind }))
                    }
                  >
                    <SelectTrigger id="new-scene-kind">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Panorama 360">Panorama 360</SelectItem>
                        <SelectItem value="Video 360">Video 360</SelectItem>
                        <SelectItem value="Tour 3D">Tour 3D</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Origen del medio</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={sceneDraft.sourceMethod}
                    onValueChange={(sourceMethod) => {
                      if (sourceMethod) {
                        setSceneDraft((draft) => ({
                          ...draft,
                          sourceMethod: sourceMethod as SourceMethod,
                        }));
                      }
                    }}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="link">
                      <Link2 /> Enlace externo
                    </ToggleGroupItem>
                    <ToggleGroupItem value="file">
                      <FileUp /> Adjuntar archivo
                    </ToggleGroupItem>
                  </ToggleGroup>
                  {sceneDraft.sourceMethod === "link" ? (
                    <>
                      <Input
                        id="new-scene-source"
                        type="url"
                        value={sceneDraft.sourceUrl}
                        onChange={(event) =>
                          setSceneDraft((draft) => ({ ...draft, sourceUrl: event.target.value }))
                        }
                        placeholder={getSourcePlaceholder(sceneDraft.kind)}
                      />
                      <FieldDescription>
                        Usa un enlace público del proveedor o del archivo alojado.
                      </FieldDescription>
                    </>
                  ) : (
                    <>
                      <Input
                        id="new-scene-file"
                        type="file"
                        accept={getFileAccept(sceneDraft.kind)}
                        className="sr-only"
                        onChange={(event) =>
                          setSceneDraft((draft) => ({
                            ...draft,
                            file: event.target.files?.[0] ?? null,
                          }))
                        }
                      />
                      <FieldLabel
                        htmlFor="new-scene-file"
                        className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 p-4 text-center"
                      >
                        <FileUp className="size-5 text-accent" />
                        <span className="text-sm font-medium">
                          {sceneDraft.file ? sceneDraft.file.name : "Selecciona un archivo"}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {getFileHint(sceneDraft.kind)}
                        </span>
                      </FieldLabel>
                      <FieldDescription>
                        {sceneDraft.file
                          ? `${(sceneDraft.file.size / 1024 / 1024).toFixed(1)} MB · Se adjunta como borrador local.`
                          : "El archivo se podrá publicar cuando se conecte el almacenamiento."}
                      </FieldDescription>
                    </>
                  )}
                </Field>
              </FieldGroup>
            </FieldSet>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!sceneDraft.name.trim()}>
                <Plus data-icon="inline-start" /> Crear escena
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Resumen del masterplan 360">
        <Metric
          label="Escenas activas"
          value={enabledScenes}
          description={`de ${scenes.length} configuradas`}
        />
        <Metric
          label="Medios conectados"
          value={readyScenes}
          description="panorama, video o tour 3D"
        />
        <Metric
          label="Puntos interactivos"
          value={configuredHotspots.length}
          description="en la escena de entrada"
        />
      </section>
      <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.75fr)]">
        <Card className="min-w-0 overflow-hidden rounded-2xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <Orbit className="size-5 text-accent" /> Escena de entrada
            </CardTitle>
            <CardDescription>
              Previsualización de la panorámica aérea y sus destinos navegables.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="relative isolate aspect-[16/9] overflow-hidden rounded-xl bg-foreground">
              <img
                src={
                  publicProjectMediaUrl(
                    "00000000-0000-0000-0000-000000000101/tour/masterplan-panorama-360.jpg",
                  ) ?? ""
                }
                alt="Panorámica aérea de Villa Paraíso"
                className="size-full object-cover opacity-90"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-foreground/20" />
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <Badge className="bg-background/90 text-foreground hover:bg-background/90">
                  <Orbit className="size-3.5" /> Panorama 360°
                </Badge>
                <Badge
                  variant="outline"
                  className="border-background/40 bg-foreground/30 text-background"
                >
                  Arrastra para explorar
                </Badge>
              </div>
              {showCompass && (
                <div className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-background/45 bg-foreground/35 text-xs font-semibold text-background backdrop-blur-sm">
                  N
                </div>
              )}
              {configuredHotspots.map((hotspot) => (
                <Button
                  key={hotspot.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 gap-2 border-background/70 bg-background/90 text-foreground shadow-lg hover:bg-background",
                    selectedHotspotId === hotspot.id &&
                      "ring-2 ring-accent ring-offset-2 ring-offset-transparent",
                  )}
                  style={{ left: hotspot.x, top: hotspot.y }}
                  onClick={() => setSelectedHotspotId(hotspot.id)}
                >
                  <MapPin data-icon="inline-start" />
                  <span className={cn(!showLabels && "sr-only")}>{hotspot.label}</span>
                </Button>
              ))}
              <div className="absolute bottom-4 left-4 max-w-sm text-background">
                <p className="text-xs uppercase tracking-[0.18em] text-background/75">
                  Escena principal
                </p>
                <p className="mt-1 font-serif text-2xl">Villa Paraíso desde el aire</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointer2 className="size-4" /> Punto seleccionado
            </CardTitle>
            <CardDescription>
              Define qué verá el visitante al tocar un punto del panorama.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="hotspot-name">Etiqueta visible</FieldLabel>
                  <Input
                    id="hotspot-name"
                    value={selectedHotspot.label}
                    onChange={(event) => updateHotspotLabel(event.target.value)}
                  />
                  <FieldDescription>
                    El texto que acompaña al punto dentro de la vista 360.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="hotspot-destination">Al seleccionar, abrir</FieldLabel>
                  <Select
                    value={selectedHotspot.destination}
                    onValueChange={updateHotspotDestination}
                  >
                    <SelectTrigger id="hotspot-destination">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {sceneDestinations.map((scene) => (
                          <SelectItem key={scene.id} value={scene.id}>
                            {scene.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="visor-lotes">Visor de lotes</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <ToggleField
                  label="Mostrar etiqueta"
                  description="Mantiene el texto visible sobre el punto."
                  checked={showLabels}
                  onCheckedChange={setShowLabels}
                />
                <ToggleField
                  label="Brújula de orientación"
                  description="Ayuda a interpretar la vista panorámica."
                  checked={showCompass}
                  onCheckedChange={setShowCompass}
                />
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImagePlus className="size-4" /> Escenas del recorrido
            </CardTitle>
            <CardDescription>
              Cada escena puede usar una imagen equirectangular, un video 360 o un enlace a tour 3D.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => setSelectedSceneId(scene.id)}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50",
                  selectedSceneId === scene.id && "border-accent bg-muted/40 ring-1 ring-accent",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <SceneIcon kind={scene.kind} />
                  <Badge variant={scene.enabled ? "secondary" : "outline"}>
                    {scene.enabled ? "Activa" : "Borrador"}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-foreground">{scene.name}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {scene.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{scene.kind}</Badge>
                  <Badge variant="outline">
                    {scene.hasMedia ? "Medio conectado" : "Medio pendiente"}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Play className="size-4" /> Configurar escena
            </CardTitle>
            <CardDescription>
              Datos de la escena seleccionada para la experiencia pública.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="contenido" className="flex flex-col gap-5">
              <TabsList className="w-full">
                <TabsTrigger value="contenido" className="flex-1">
                  Contenido
                </TabsTrigger>
                <TabsTrigger value="visibilidad" className="flex-1">
                  Visibilidad
                </TabsTrigger>
              </TabsList>
              <TabsContent value="contenido" className="mt-0">
                <FieldSet>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="scene-name">Nombre de escena</FieldLabel>
                      <Input
                        id="scene-name"
                        value={selectedScene.name}
                        onChange={(event) =>
                          updateScene(selectedScene.id, { name: event.target.value })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="scene-kind">Tipo de medio</FieldLabel>
                      <Select
                        value={selectedScene.kind}
                        onValueChange={(value) =>
                          updateScene(selectedScene.id, { kind: value as SceneKind })
                        }
                      >
                        <SelectTrigger id="scene-kind">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="Panorama 360">Panorama 360</SelectItem>
                            <SelectItem value="Video 360">Video 360</SelectItem>
                            <SelectItem value="Tour 3D">Tour 3D</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="scene-source">Archivo o enlace del recorrido</FieldLabel>
                      <Input
                        id="scene-source"
                        type="url"
                        value={selectedScene.sourceUrl}
                        placeholder={getSourcePlaceholder(selectedScene.kind)}
                        onChange={(event) =>
                          updateScene(selectedScene.id, {
                            sourceUrl: event.target.value,
                            hasMedia: Boolean(event.target.value.trim()),
                          })
                        }
                      />
                      <FieldDescription>
                        {getSourceDescription(selectedScene.kind)}
                      </FieldDescription>
                    </Field>
                    <ToggleField
                      label="Medio listo"
                      description="Marca la escena cuando el archivo o enlace ya esté conectado."
                      checked={selectedScene.hasMedia}
                      onCheckedChange={(hasMedia) => updateScene(selectedScene.id, { hasMedia })}
                    />
                  </FieldGroup>
                </FieldSet>
              </TabsContent>
              <TabsContent value="visibilidad" className="mt-0">
                <FieldSet>
                  <FieldGroup>
                    <ToggleField
                      label="Escena activa"
                      description="Puede abrirse desde la experiencia pública."
                      checked={selectedScene.enabled}
                      onCheckedChange={(enabled) => updateScene(selectedScene.id, { enabled })}
                    />
                    <p className="text-sm leading-6 text-muted-foreground">
                      Esta vista es un borrador local: al conectar almacenamiento, aquí se asociará
                      el archivo 360 o el enlace del proveedor.
                    </p>
                  </FieldGroup>
                </FieldSet>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-serif text-3xl text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
function SceneIcon({ kind }: { kind: SceneKind }) {
  const Icon = kind === "Video 360" ? Video : kind === "Tour 3D" ? Orbit : ImagePlus;
  return (
    <span className="flex size-9 items-center justify-center rounded-lg border bg-muted text-accent">
      <Icon className="size-4" />
    </span>
  );
}

function getSourcePlaceholder(kind: SceneKind) {
  if (kind === "Video 360") return "https://…/recorrido-360.mp4";
  if (kind === "Tour 3D") return "https://…/tour-3d";
  return "https://…/panorama-equirectangular.jpg";
}

function getSourceDescription(kind: SceneKind) {
  if (kind === "Video 360") return "Pega la URL del video esférico alojado o del proveedor.";
  if (kind === "Tour 3D") return "Pega la URL pública del recorrido 3D o visor externo.";
  return "Usa una imagen equirectangular 2:1 para una exploración panorámica fluida.";
}

function getFileAccept(kind: SceneKind) {
  if (kind === "Video 360") return "video/mp4,video/webm,video/quicktime";
  if (kind === "Tour 3D") return ".glb,.gltf,application/octet-stream";
  return "image/jpeg,image/png,image/webp";
}

function getFileHint(kind: SceneKind) {
  if (kind === "Video 360") return "MP4, WebM o MOV";
  if (kind === "Tour 3D") return "GLB o GLTF";
  return "JPG, PNG o WebP equirectangular 2:1";
}

function getDraftDescription(kind: SceneKind) {
  if (kind === "Video 360") return "Recorrido inmersivo en video para conectar desde un hotspot.";
  if (kind === "Tour 3D") return "Enlace a una experiencia 3D externa dentro del recorrido.";
  return "Escena panorámica inmersiva para explorar desde el masterplan.";
}

function ToggleField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Field orientation="horizontal">
      <div className="flex flex-1 flex-col gap-1">
        <FieldLabel>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </Field>
  );
}
