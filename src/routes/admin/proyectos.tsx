import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  FileText,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";

import { getLotsByProject } from "@/data/lots";
import { PROPERTY_TYPES, properties, type PropertyType } from "@/data/properties";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import AutemBrandIcon from "@/components/AutemBrandIcon";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/admin/proyectos")({ component: ProjectsPage });

type ProjectStatus = "Publicado" | "Borrador";
type ManagedProject = {
  id: string;
  slug: string;
  name: string;
  location: string;
  type: PropertyType;
  image: string;
  galleryCount: number;
  lotCount: number;
  status: ProjectStatus;
};
type ProjectDraft = {
  name: string;
  slug: string;
  type: PropertyType;
  location: string;
  price: string;
  area: string;
  description: string;
  tourUrl: string;
};
type MediaPreview = { name: string; type: string; preview?: string };
const emptyDraft: ProjectDraft = {
  name: "",
  slug: "",
  type: "terreno",
  location: "",
  price: "",
  area: "",
  description: "",
  tourUrl: "",
};
const catalogProjects: ManagedProject[] = properties.map((project) => ({
  id: project.id,
  slug: project.slug,
  name: project.name,
  location: project.location,
  type: project.type,
  image: project.image,
  galleryCount: project.images?.length ?? 0,
  lotCount: getLotsByProject(project.slug).length,
  status: "Publicado",
}));
const humanizeType = (type: PropertyType) =>
  PROPERTY_TYPES.find((item) => item.value === type)?.label ?? type;

function ProjectsPage() {
  const [projects, setProjects] = useState(catalogProjects);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"todos" | ProjectStatus>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ManagedProject | null>(null);
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);
  const [coverPreview, setCoverPreview] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [masterplanFiles, setMasterplanFiles] = useState<MediaPreview[]>([]);
  const [documentFiles, setDocumentFiles] = useState<MediaPreview[]>([]);
  const [mediaLoading, setMediaLoading] = useState<string | null>(null);
  const [mediaProgress, setMediaProgress] = useState(0);
  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-CO");
    return projects.filter(
      (project) =>
        (status === "todos" || project.status === status) &&
        (!normalizedQuery ||
          [project.name, project.location, project.slug].some((value) =>
            value.toLocaleLowerCase("es-CO").includes(normalizedQuery),
          )),
    );
  }, [projects, query, status]);
  const updateDraft = <Key extends keyof ProjectDraft>(key: Key, value: ProjectDraft[Key]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const openNewProject = () => {
    setEditingProject(null);
    setDraft(emptyDraft);
    setCoverPreview("");
    setGalleryPreviews([]);
    setMasterplanFiles([]);
    setDocumentFiles([]);
    setDialogOpen(true);
  };
  const openEditProject = (project: ManagedProject) => {
    setEditingProject(project);
    setDraft({
      ...emptyDraft,
      name: project.name,
      slug: project.slug,
      type: project.type,
      location: project.location,
    });
    setCoverPreview(project.image);
    setGalleryPreviews([]);
    setMasterplanFiles([]);
    setDocumentFiles([]);
    setDialogOpen(true);
  };
  const createPreviews = (
    event: ChangeEvent<HTMLInputElement>,
    target: "cover" | "gallery" | "masterplan" | "documents",
  ) => processMediaFiles(Array.from(event.target.files ?? []), target);
  const processMediaFiles = (
    files: File[],
    target: "cover" | "gallery" | "masterplan" | "documents",
  ) => {
    if (!files.length) return;
    setMediaLoading(target);
    setMediaProgress(12);
    const progressTimer = window.setInterval(() => {
      setMediaProgress((current) => Math.min(current + 18, 88));
    }, 90);
    window.setTimeout(() => {
      const previews = files.map((file) => URL.createObjectURL(file));
      if (target === "cover") setCoverPreview(previews[0] ?? "");
      else if (target === "gallery") setGalleryPreviews(previews);
      else {
        const media = files.map((file) => ({
          name: file.name,
          type: file.type,
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        }));
        if (target === "masterplan") setMasterplanFiles(media);
        else setDocumentFiles(media);
      }
      window.clearInterval(progressTimer);
      setMediaProgress(100);
      window.setTimeout(() => {
        setMediaLoading(null);
        setMediaProgress(0);
      }, 280);
    }, 620);
  };
  const saveProject = () => {
    if (!draft.name.trim() || !draft.location.trim()) return;
    const project: ManagedProject = {
      id: editingProject?.id ?? `session-${Date.now()}`,
      slug:
        draft.slug.trim() ||
        draft.name
          .trim()
          .toLocaleLowerCase("es-CO")
          .replaceAll(/[^a-z0-9]+/g, "-"),
      name: draft.name.trim(),
      location: draft.location.trim(),
      type: draft.type,
      image: coverPreview || editingProject?.image || "/images/autem-villa-paraiso-aerial-v2.png",
      galleryCount: galleryPreviews.length || editingProject?.galleryCount || 0,
      lotCount: editingProject?.lotCount ?? 0,
      status: editingProject?.status ?? "Borrador",
    };
    setProjects((current) =>
      editingProject
        ? current.map((item) => (item.id === editingProject.id ? project : item))
        : [project, ...current],
    );
    setDialogOpen(false);
  };
  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Administración</p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">Proyectos</h1>
            <p className="text-sm text-muted-foreground">
              {projects.length} proyecto{projects.length === 1 ? "" : "s"} en el catálogo
            </p>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Gestiona lo que se publica y los recursos visuales de cada desarrollo.
          </p>
        </div>
        <Button className="shrink-0 rounded-full" onClick={openNewProject}>
          <Plus data-icon="inline-start" /> Nuevo proyecto
        </Button>
      </section>
      <Card className="mt-7 rounded-2xl">
        <CardHeader className="gap-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="font-serif text-2xl">Catálogo de proyectos</CardTitle>
            <CardDescription>
              Cada proyecto reúne su ficha, portada, galería, plano urbanístico y experiencia
              digital.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Buscar por proyecto, ubicación o identificador"
                aria-label="Buscar proyectos"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as "todos" | ProjectStatus)}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Publicado">Publicado</SelectItem>
                  <SelectItem value="Borrador">Borrador</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectCatalog projects={filteredProjects} onEdit={openEditProject} />
        </CardContent>
      </Card>
      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        draft={draft}
        editingProject={editingProject}
        coverPreview={coverPreview}
        galleryPreviews={galleryPreviews}
        masterplanFiles={masterplanFiles}
        documentFiles={documentFiles}
        mediaLoading={mediaLoading}
        mediaProgress={mediaProgress}
        onDraftChange={updateDraft}
        onSelectMedia={createPreviews}
        onDropMedia={processMediaFiles}
        onSave={saveProject}
      />
    </main>
  );
}

function ProjectCatalog({
  projects,
  onEdit,
}: {
  projects: ManagedProject[];
  onEdit: (project: ManagedProject) => void;
}) {
  if (!projects.length)
    return (
      <Alert>
        <Search />
        <AlertTitle>No hay proyectos con ese criterio</AlertTitle>
        <AlertDescription>Prueba con otro nombre, ubicación o estado.</AlertDescription>
      </Alert>
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Proyecto</TableHead>
          <TableHead className="hidden lg:table-cell">Ubicación</TableHead>
          <TableHead className="hidden md:table-cell">Recursos</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <div className="flex min-w-64 items-center gap-3">
                <img src={project.image} alt="" className="size-12 rounded-lg object-cover" />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate font-medium text-foreground">{project.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {humanizeType(project.type)} · {project.slug}
                  </p>
                  <p className="text-xs text-muted-foreground lg:hidden">{project.location}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" />
                {project.location}
              </span>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>{project.galleryCount} imágenes en galería</span>
                <span>{project.lotCount} lotes configurados</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={project.status === "Publicado" ? "secondary" : "outline"}>
                {project.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Editar ${project.name}`}
                onClick={() => onEdit(project)}
              >
                <Pencil />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type MediaSelectorProps = {
  id: string;
  accept: string;
  multiple?: boolean;
  title: string;
  description: string;
  loading: boolean;
  progress: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDropFiles: (files: File[]) => void;
};

function MediaSelector({
  id,
  accept,
  multiple,
  title,
  description,
  loading,
  progress,
  onChange,
  onDropFiles,
}: MediaSelectorProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="sr-only"
      />
      <FieldLabel
        htmlFor={id}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          onDropFiles(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "group flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-5 py-4 text-center transition-colors hover:border-accent hover:bg-accent/5",
          isDragging && "border-accent bg-accent/10",
        )}
      >
        <span className="admin-upload-mark flex size-12 items-center justify-center rounded-full border bg-background shadow-sm">
          {loading ? <Spinner className="size-5 text-accent" /> : <AutemBrandIcon size={28} />}
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {loading ? "Preparando vista previa" : title}
          </span>
          <span className="max-w-72 text-xs font-normal leading-5 text-muted-foreground">
            {loading
              ? "Procesando el archivo seleccionado…"
              : `${description} Arrastra o selecciona.`}
          </span>
        </span>
        {loading ? (
          <Progress value={progress} className="mt-1 max-w-56" />
        ) : (
          <span className="text-xs font-medium text-accent">
            Seleccionar {multiple ? "archivos" : "archivo"}
          </span>
        )}
      </FieldLabel>
    </div>
  );
}

function FilePreviews({ files }: { files: MediaPreview[] }) {
  if (!files.length) return null;

  return (
    <div className="mt-2 grid gap-2">
      {files.map((file) => (
        <div
          key={`${file.name}-${file.type}`}
          className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2"
        >
          {file.preview ? (
            <img
              src={file.preview}
              alt={`Vista previa de ${file.name}`}
              className="size-12 rounded-md object-cover"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-md bg-background text-muted-foreground">
              <FileText className="size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {file.type === "application/pdf"
                ? "Documento PDF"
                : file.type.startsWith("image/")
                  ? "Imagen de plano"
                  : "Documento seleccionado"}
            </p>
          </div>
          {file.preview ? (
            <ImageIcon className="size-4 text-muted-foreground" />
          ) : (
            <Badge variant="outline">PDF</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

type ProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ProjectDraft;
  editingProject: ManagedProject | null;
  coverPreview: string;
  galleryPreviews: string[];
  masterplanFiles: MediaPreview[];
  documentFiles: MediaPreview[];
  mediaLoading: string | null;
  mediaProgress: number;
  onDraftChange: <Key extends keyof ProjectDraft>(key: Key, value: ProjectDraft[Key]) => void;
  onSelectMedia: (
    event: ChangeEvent<HTMLInputElement>,
    target: "cover" | "gallery" | "masterplan" | "documents",
  ) => void;
  onDropMedia: (files: File[], target: "cover" | "gallery" | "masterplan" | "documents") => void;
  onSave: () => void;
};
function ProjectDialog({
  open,
  onOpenChange,
  draft,
  editingProject,
  coverPreview,
  galleryPreviews,
  masterplanFiles,
  documentFiles,
  mediaLoading,
  mediaProgress,
  onDraftChange,
  onSelectMedia,
  onDropMedia,
  onSave,
}: ProjectDialogProps) {
  const isIncomplete = !draft.name.trim() || !draft.location.trim();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle>
            {editingProject ? `Editar ${editingProject.name}` : "Nuevo proyecto"}
          </DialogTitle>
          <DialogDescription>
            Completa la ficha y organiza los recursos que verán los visitantes en la experiencia
            pública.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex max-h-[calc(100svh-14rem)] flex-col gap-5 overflow-y-auto px-6 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <Tabs defaultValue="informacion" className="flex flex-col gap-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="informacion">Información</TabsTrigger>
              <TabsTrigger value="medios">Medios y galería</TabsTrigger>
              <TabsTrigger value="experiencia">Experiencia</TabsTrigger>
            </TabsList>
            <TabsContent value="informacion">
              <FieldSet>
                <FieldLegend>Ficha del proyecto</FieldLegend>
                <FieldGroup className="grid gap-5 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="project-name">Nombre del proyecto</FieldLabel>
                    <Input
                      id="project-name"
                      value={draft.name}
                      onChange={(event) => onDraftChange("name", event.target.value)}
                      placeholder="Ej. Villa Paraíso"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="project-slug">Identificador URL</FieldLabel>
                    <Input
                      id="project-slug"
                      value={draft.slug}
                      onChange={(event) => onDraftChange("slug", event.target.value)}
                      placeholder="villa-paraiso"
                    />
                    <FieldDescription>
                      Se usará en la dirección pública del proyecto.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel>Tipo de proyecto</FieldLabel>
                    <Select
                      value={draft.type}
                      onValueChange={(value) => onDraftChange("type", value as PropertyType)}
                    >
                      <SelectTrigger aria-label="Tipo de proyecto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="project-location">Ubicación</FieldLabel>
                    <Input
                      id="project-location"
                      value={draft.location}
                      onChange={(event) => onDraftChange("location", event.target.value)}
                      placeholder="Municipio, departamento"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="project-price">Precio de referencia</FieldLabel>
                    <Input
                      id="project-price"
                      value={draft.price}
                      onChange={(event) => onDraftChange("price", event.target.value)}
                      placeholder="Lotes desde $161M COP"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="project-area">Área o tipología</FieldLabel>
                    <Input
                      id="project-area"
                      value={draft.area}
                      onChange={(event) => onDraftChange("area", event.target.value)}
                      placeholder="240 – 1.080 m²"
                    />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel htmlFor="project-description">Descripción breve</FieldLabel>
                    <Textarea
                      id="project-description"
                      value={draft.description}
                      onChange={(event) => onDraftChange("description", event.target.value)}
                      placeholder="Resume la propuesta de valor, entorno y características del proyecto."
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </TabsContent>
            <TabsContent value="medios">
              <FieldSet>
                <FieldLegend>Portada, galería y planos</FieldLegend>
                <Alert>
                  <Upload />
                  <AlertTitle>Previsualización local</AlertTitle>
                  <AlertDescription>
                    Los archivos se ven en esta sesión; se guardarán permanentemente cuando se
                    conecte el almacenamiento.
                  </AlertDescription>
                </Alert>
                <FieldGroup className="grid gap-5 md:grid-cols-2">
                  <Field>
                    <MediaSelector
                      id="project-cover"
                      accept="image/*"
                      title="Imagen de portada"
                      description="Usa una imagen horizontal de alta calidad para el catálogo y la ficha pública."
                      loading={mediaLoading === "cover"}
                      progress={mediaLoading === "cover" ? mediaProgress : 0}
                      onChange={(event) => onSelectMedia(event, "cover")}
                      onDropFiles={(files) => onDropMedia(files, "cover")}
                    />
                    {coverPreview && (
                      <img
                        src={coverPreview}
                        alt="Previsualización de portada"
                        className="mt-2 aspect-video rounded-lg object-cover"
                      />
                    )}
                  </Field>
                  <Field>
                    <MediaSelector
                      id="project-gallery"
                      accept="image/*"
                      multiple
                      title="Galería del proyecto"
                      description="Selecciona renders, fotografías de avance, zonas comunes y detalles."
                      loading={mediaLoading === "gallery"}
                      progress={mediaLoading === "gallery" ? mediaProgress : 0}
                      onChange={(event) => onSelectMedia(event, "gallery")}
                      onDropFiles={(files) => onDropMedia(files, "gallery")}
                    />
                    {galleryPreviews.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {galleryPreviews.map((image, index) => (
                          <img
                            key={image}
                            src={image}
                            alt={`Imagen de galería ${index + 1}`}
                            className="aspect-square rounded-md object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field>
                    <MediaSelector
                      id="project-masterplan"
                      accept="image/*,.pdf"
                      title="Plano urbanístico o masterplan"
                      description="Admite imagen o PDF para la vista de Plano Urbanístico."
                      loading={mediaLoading === "masterplan"}
                      progress={mediaLoading === "masterplan" ? mediaProgress : 0}
                      onChange={(event) => onSelectMedia(event, "masterplan")}
                      onDropFiles={(files) => onDropMedia(files, "masterplan")}
                    />
                    <FilePreviews files={masterplanFiles} />
                  </Field>
                  <Field>
                    <MediaSelector
                      id="project-floorplan"
                      accept="image/*,.pdf"
                      multiple
                      title="Planos y documentos"
                      description="Planos de tipologías, fichas comerciales y documentos descargables."
                      loading={mediaLoading === "documents"}
                      progress={mediaLoading === "documents" ? mediaProgress : 0}
                      onChange={(event) => onSelectMedia(event, "documents")}
                      onDropFiles={(files) => onDropMedia(files, "documents")}
                    />
                    <FilePreviews files={documentFiles} />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </TabsContent>
            <TabsContent value="experiencia">
              <FieldSet>
                <FieldLegend>Recorridos y disponibilidad</FieldLegend>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="project-tour">Enlace de recorrido 3D o 360°</FieldLabel>
                    <Input
                      id="project-tour"
                      type="url"
                      value={draft.tourUrl}
                      onChange={(event) => onDraftChange("tourUrl", event.target.value)}
                      placeholder="https://"
                    />
                    <FieldDescription>
                      Opcional. Se habilitará al conectar el visor o proveedor de recorridos.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <Alert>
                  <CheckCircle2 />
                  <AlertTitle>Qué podrás administrar al conectar datos</AlertTitle>
                  <AlertDescription>
                    Inventario de lotes y unidades, disponibilidad, planos, publicaciones, galería,
                    experiencias 3D y solicitudes comerciales.
                  </AlertDescription>
                </Alert>
              </FieldSet>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-1 gap-3 border-t pt-5 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isIncomplete}>
              <CheckCircle2 data-icon="inline-start" />{" "}
              {editingProject ? "Guardar cambios" : "Crear borrador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
