import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  FileImage,
  FileText,
  ImageIcon,
  Link2,
  Map,
  Play,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";

import AutemBrandIcon from "@/components/AutemBrandIcon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/galerias-planos-recorridos")({
  component: MediaLibraryPage,
});

type AssetKind = "Imagen" | "Plano" | "Recorrido";
type MediaAsset = {
  id: string;
  name: string;
  kind: AssetKind;
  source: string;
  published: boolean;
  description: string;
  fileType: string;
};

const BASE = import.meta.env.BASE_URL ?? "/";
const baseAssets: MediaAsset[] = [
  {
    id: "aerial",
    name: "Vista aérea principal",
    kind: "Imagen",
    source: `${BASE}images/autem-villa-paraiso-aerial-v2.png`,
    published: true,
    description: "Portada del proyecto",
    fileType: "PNG",
  },
  {
    id: "access",
    name: "Acceso al proyecto",
    kind: "Imagen",
    source: `${BASE}projects/lotes-360/acceso-render.png`,
    published: true,
    description: "Galería pública",
    fileType: "PNG",
  },
  {
    id: "green",
    name: "Entorno verde",
    kind: "Imagen",
    source: `${BASE}projects/lotes-360/lot-l07-entorno-verde.png`,
    published: true,
    description: "Galería pública",
    fileType: "PNG",
  },
  {
    id: "masterplan",
    name: "Plano urbanístico",
    kind: "Plano",
    source: `${BASE}projects/villa-paraiso/masterplan-clean.svg`,
    published: true,
    description: "Masterplan interactivo",
    fileType: "SVG",
  },
  {
    id: "panorama",
    name: "Recorrido panorámico",
    kind: "Recorrido",
    source: `${BASE}projects/lotes-360/masterplan-panorama-360.jpg`,
    published: true,
    description: "Visor 360°",
    fileType: "Panorama",
  },
];

function MediaLibraryPage() {
  const [assets, setAssets] = useState(baseAssets);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"todos" | AssetKind>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadKind, setUploadKind] = useState<AssetKind>("Imagen");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [title, setTitle] = useState("");
  const [tourUrl, setTourUrl] = useState("");
  const filteredAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          (kind === "todos" || asset.kind === kind) &&
          (!query.trim() ||
            `${asset.name} ${asset.description}`
              .toLocaleLowerCase("es-CO")
              .includes(query.trim().toLocaleLowerCase("es-CO"))),
      ),
    [assets, kind, query],
  );
  const metrics = useMemo(
    () => ({
      images: assets.filter((asset) => asset.kind === "Imagen").length,
      plans: assets.filter((asset) => asset.kind === "Plano").length,
      tours: assets.filter((asset) => asset.kind === "Recorrido").length,
    }),
    [assets],
  );
  const reset = () => {
    setUploadKind("Imagen");
    setFile(null);
    setFilePreview("");
    setTitle("");
    setTourUrl("");
    setProgress(0);
    setLoading(false);
  };
  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) reset();
  };
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) return;
    setFile(selected);
    setFilePreview(selected.type.startsWith("image/") ? URL.createObjectURL(selected) : "");
    if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ""));
  };
  const submit = () => {
    if (uploadKind === "Recorrido" ? !title.trim() || !tourUrl.trim() : !file || !title.trim())
      return;
    setLoading(true);
    setProgress(12);
    const interval = window.setInterval(() => setProgress((value) => Math.min(value + 17, 90)), 90);
    window.setTimeout(() => {
      window.clearInterval(interval);
      setProgress(100);
      setAssets((current) => [
        {
          id: `session-${Date.now()}`,
          name: title.trim(),
          kind: uploadKind,
          source:
            uploadKind === "Recorrido"
              ? `${BASE}projects/lotes-360/masterplan-panorama-360.jpg`
              : filePreview || `${BASE}projects/villa-paraiso/masterplan-clean.svg`,
          published: false,
          description:
            uploadKind === "Recorrido" ? tourUrl.trim() : "Recurso pendiente de publicación",
          fileType:
            uploadKind === "Plano"
              ? "Documento"
              : uploadKind === "Recorrido"
                ? "Enlace externo"
                : (file?.type.split("/")[1]?.toUpperCase() ?? "Archivo"),
        },
        ...current,
      ]);
      window.setTimeout(() => closeDialog(false), 320);
    }, 650);
  };
  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Villa Paraíso · Biblioteca
          </p>
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
            Galerías, planos y recorridos
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Organiza los recursos visuales que alimentan el catálogo, el plano y la experiencia
            inmersiva del proyecto.
          </p>
        </div>
        <Button className="shrink-0 rounded-full" onClick={() => setDialogOpen(true)}>
          <Plus data-icon="inline-start" /> Añadir recurso
        </Button>
      </section>
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <MediaMetric icon={ImageIcon} label="Galería" value={metrics.images} />
        <MediaMetric icon={Map} label="Planos" value={metrics.plans} />
        <MediaMetric icon={Play} label="Recorridos" value={metrics.tours} />
      </section>
      <Card className="mt-6 rounded-2xl">
        <CardHeader className="gap-5">
          <div>
            <CardTitle className="font-serif text-2xl">Recursos del proyecto</CardTitle>
            <CardDescription>
              Cada recurso tiene tipo, contexto y estado de publicación para evitar archivos sueltos
              o duplicados.
            </CardDescription>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o uso"
                aria-label="Buscar recursos"
              />
            </div>
            <Select value={kind} onValueChange={(value) => setKind(value as "todos" | AssetKind)}>
              <SelectTrigger aria-label="Filtrar recursos">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="Imagen">Imágenes</SelectItem>
                  <SelectItem value="Plano">Planos</SelectItem>
                  <SelectItem value="Recorrido">Recorridos</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAssets.map((asset) => (
              <MediaCard key={asset.id} asset={asset} />
            ))}
          </div>
        </CardContent>
      </Card>
      <MediaUploadDialog
        open={dialogOpen}
        onOpenChange={closeDialog}
        loading={loading}
        progress={progress}
        uploadKind={uploadKind}
        file={file}
        filePreview={filePreview}
        title={title}
        tourUrl={tourUrl}
        onKind={setUploadKind}
        onFile={onFile}
        onTitle={setTitle}
        onTourUrl={setTourUrl}
        onSubmit={submit}
      />
    </main>
  );
}

function MediaMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ImageIcon;
  label: string;
  value: number;
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Icon className="size-4 text-accent" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-serif text-2xl text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
function MediaCard({ asset }: { asset: MediaAsset }) {
  const isImage = asset.kind !== "Plano" || asset.fileType === "SVG";
  return (
    <Card className="overflow-hidden rounded-xl">
      <CardHeader className="p-0">
        <div className="relative aspect-[16/10] bg-muted">
          {isImage ? (
            <img src={asset.source} alt={asset.name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <FileText className="size-10 text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute left-3 top-3" variant="secondary">
            {asset.kind}
          </Badge>
          {asset.kind === "Recorrido" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-background/90 shadow">
                <Play className="size-4" />
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{asset.name}</CardTitle>
            <CardDescription className="mt-1 truncate">{asset.description}</CardDescription>
          </div>
          <Badge variant={asset.published ? "secondary" : "outline"}>
            {asset.published ? "Publicado" : "Borrador"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>{asset.fileType}</span>
        <Button variant="ghost" size="sm">
          Ver recurso
        </Button>
      </CardFooter>
    </Card>
  );
}

type UploadProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  progress: number;
  uploadKind: AssetKind;
  file: File | null;
  filePreview: string;
  title: string;
  tourUrl: string;
  onKind: (kind: AssetKind) => void;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onTitle: (value: string) => void;
  onTourUrl: (value: string) => void;
  onSubmit: () => void;
};
function MediaUploadDialog({
  open,
  onOpenChange,
  loading,
  progress,
  uploadKind,
  file,
  filePreview,
  title,
  tourUrl,
  onKind,
  onFile,
  onTitle,
  onTourUrl,
  onSubmit,
}: UploadProps) {
  const ready =
    uploadKind === "Recorrido" ? !!title.trim() && !!tourUrl.trim() : !!title.trim() && !!file;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle>Añadir recurso</DialogTitle>
          <DialogDescription>
            Clasifica cada archivo antes de publicarlo para mantener la biblioteca organizada.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex max-h-[calc(100svh-14rem)] flex-col gap-5 overflow-y-auto px-6 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Tabs value={uploadKind} onValueChange={(value) => onKind(value as AssetKind)}>
            <TabsList className="w-full">
              <TabsTrigger className="flex-1" value="Imagen">
                Galería
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="Plano">
                Plano
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="Recorrido">
                Recorrido
              </TabsTrigger>
            </TabsList>
            <TabsContent value="Imagen">
              <UploadFields
                kind="Imagen"
                file={file}
                filePreview={filePreview}
                title={title}
                loading={loading}
                progress={progress}
                onFile={onFile}
                onTitle={onTitle}
              />
            </TabsContent>
            <TabsContent value="Plano">
              <UploadFields
                kind="Plano"
                file={file}
                filePreview={filePreview}
                title={title}
                loading={loading}
                progress={progress}
                onFile={onFile}
                onTitle={onTitle}
              />
            </TabsContent>
            <TabsContent value="Recorrido">
              <FieldSet className="mt-4">
                <FieldLegend>Enlace de recorrido</FieldLegend>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="tour-title">Nombre del recorrido</FieldLabel>
                    <Input
                      id="tour-title"
                      value={title}
                      onChange={(event) => onTitle(event.target.value)}
                      placeholder="Tour 360° del masterplan"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tour-url">Enlace del visor</FieldLabel>
                    <Input
                      id="tour-url"
                      type="url"
                      value={tourUrl}
                      onChange={(event) => onTourUrl(event.target.value)}
                      placeholder="https://"
                    />
                    <FieldDescription>
                      Usa el enlace público del proveedor del recorrido (360°, 3D o video).
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </TabsContent>
          </Tabs>
          <Alert>
            <CheckCircle2 />
            <AlertTitle>Publicación controlada</AlertTitle>
            <AlertDescription>
              La carga se previsualiza en esta sesión. Al conectar almacenamiento, el recurso deberá
              procesarse y aprobarse antes de salir en el sitio público.
            </AlertDescription>
          </Alert>
          <DialogFooter className="gap-3 border-t pt-5 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!ready || loading}>
              {loading ? <Spinner data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
              {loading ? "Preparando recurso" : "Añadir a biblioteca"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function UploadFields({
  kind,
  file,
  filePreview,
  title,
  loading,
  progress,
  onFile,
  onTitle,
}: {
  kind: AssetKind;
  file: File | null;
  filePreview: string;
  title: string;
  loading: boolean;
  progress: number;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onTitle: (value: string) => void;
}) {
  const isPlan = kind === "Plano";
  return (
    <FieldSet className="mt-4">
      <FieldLegend>{isPlan ? "Plano o documento técnico" : "Imagen de galería"}</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="media-title">Nombre visible</FieldLabel>
          <Input
            id="media-title"
            value={title}
            onChange={(event) => onTitle(event.target.value)}
            placeholder={isPlan ? "Plano de implantación" : "Vista exterior al atardecer"}
          />
        </Field>
        <Field>
          <Input
            id="media-file"
            type="file"
            accept={isPlan ? "image/*,.pdf" : "image/*"}
            onChange={onFile}
            className="sr-only"
          />
          <FieldLabel
            htmlFor="media-file"
            className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 p-4 text-center"
          >
            <span className="admin-upload-mark flex size-12 items-center justify-center rounded-full border bg-background">
              {loading ? <Spinner className="size-5 text-accent" /> : <AutemBrandIcon size={28} />}
            </span>
            <span className="text-sm font-medium">
              {loading ? "Preparando vista previa" : "Arrastra o selecciona un archivo"}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {isPlan ? "PDF, SVG, PNG o JPG" : "JPG, PNG o WEBP"}
            </span>
            {loading && <Progress value={progress} className="max-w-56" />}
          </FieldLabel>
          <FieldDescription>
            {file
              ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`
              : "El archivo se conservará como borrador hasta publicarlo."}
          </FieldDescription>
          {filePreview && (
            <img
              src={filePreview}
              alt="Previsualización del recurso"
              className="aspect-video rounded-xl border object-cover"
            />
          )}
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
