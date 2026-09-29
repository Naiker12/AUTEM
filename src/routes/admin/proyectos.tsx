import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";

import { PROPERTY_TYPES, type PropertyType } from "@/data/properties";
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
import { Spinner } from "@/components/ui/spinner";
import { getCurrentAdminAccess } from "@/lib/admin-auth";
import {
  createManagedProject,
  deleteProjectMedia,
  listManagedProjects,
  listProjectMedia,
  publicProjectMediaUrl,
  updateManagedProject,
  uploadProjectMedia,
  type ManagedProjectRecord,
  type ProjectMediaRecord,
} from "@/lib/project-repository";

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
  raw: ManagedProjectRecord;
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

const humanizeType = (type: PropertyType) =>
  PROPERTY_TYPES.find((item) => item.value === type)?.label ?? type;

function mapProjectRecord(record: ManagedProjectRecord): ManagedProject {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    location: record.location,
    type: record.property_type,
    image: publicProjectMediaUrl(record.cover_path) ?? "",
    galleryCount: record.gallery_count ?? 0,
    lotCount: record.lot_count ?? 0,
    status: record.status === "published" ? "Publicado" : "Borrador",
    raw: record,
  };
}

function ProjectsPage() {
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">("loading");
  const [dataError, setDataError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"todos" | ProjectStatus>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ManagedProject | null>(null);
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);

  // Archivos reales y medios en Supabase
  const [existingMedia, setExistingMedia] = useState<ProjectMediaRecord[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [pendingGalleryFiles, setPendingGalleryFiles] = useState<File[]>([]);
  const [pendingMasterplanFile, setPendingMasterplanFile] = useState<File | null>(null);
  const [pendingDocumentFiles, setPendingDocumentFiles] = useState<File[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadProjects = async () => {
      try {
        const access = await getCurrentAdminAccess();
        if (!access) throw new Error("Tu sesión no tiene acceso a la organización.");
        const records = await listManagedProjects(access.organizationId);
        if (!isActive) return;
        setOrganizationId(access.organizationId);
        setProjects(records.map(mapProjectRecord));
        setDataState("ready");
      } catch (error) {
        if (!isActive) return;
        setDataState("error");
        setDataError(
          error instanceof Error ? error.message : "No fue posible cargar los proyectos.",
        );
      }
    };
    void loadProjects();
    return () => {
      isActive = false;
    };
  }, []);

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
    setCoverFile(null);
    setCoverPreview("");
    setPendingGalleryFiles([]);
    setPendingMasterplanFile(null);
    setPendingDocumentFiles([]);
    setExistingMedia([]);
    setDialogOpen(true);
  };

  const openEditProject = async (project: ManagedProject) => {
    setEditingProject(project);
    setDraft({
      name: project.name,
      slug: project.slug,
      type: project.type,
      location: project.location,
      price: project.raw.price_label ?? "",
      area: project.raw.area_label ?? "",
      description: project.raw.description ?? "",
      tourUrl: project.raw.tour_url ?? "",
    });
    setCoverFile(null);
    setCoverPreview(project.image);
    setPendingGalleryFiles([]);
    setPendingMasterplanFile(null);
    setPendingDocumentFiles([]);
    setExistingMedia([]);
    setDialogOpen(true);

    setLoadingMedia(true);
    try {
      const media = await listProjectMedia(project.id);
      setExistingMedia(media);
    } catch (error) {
      console.warn("No fue posible cargar los medios existentes del proyecto:", error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleDeleteExistingMedia = async (item: ProjectMediaRecord) => {
    if (!editingProject) return;
    try {
      await deleteProjectMedia(item.id, item.storage_path, editingProject.id, item.media_type);
      setExistingMedia((prev) => prev.filter((m) => m.id !== item.id));
      if (item.media_type === "cover") {
        setCoverPreview("");
      }
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "No fue posible eliminar el archivo multimedia.",
      );
    }
  };

  const saveProject = async () => {
    if (!draft.name.trim() || !draft.location.trim() || !organizationId) return;
    setIsSaving(true);
    setSaveStatus("Guardando información base…");
    setDataError(null);
    try {
      const input = {
        slug: draft.slug,
        name: draft.name,
        propertyType: draft.type,
        location: draft.location,
        status:
          editingProject?.status === "Publicado" ? ("published" as const) : ("draft" as const),
        priceLabel: draft.price,
        areaLabel: draft.area,
        description: draft.description,
        tourUrl: draft.tourUrl,
      };

      const saved = editingProject
        ? await updateManagedProject(editingProject.id, input)
        : await createManagedProject(organizationId, input);

      // 1. Subida de portada a Supabase Storage
      if (coverFile) {
        setSaveStatus("Subiendo portada a Supabase Storage…");
        await uploadProjectMedia(saved.id, coverFile, "cover", 0);
      }

      // 2. Subida de galería
      if (pendingGalleryFiles.length > 0) {
        const existingGalleryCount = existingMedia.filter((m) => m.media_type === "gallery").length;
        for (let i = 0; i < pendingGalleryFiles.length; i++) {
          setSaveStatus(`Subiendo imagen ${i + 1} de ${pendingGalleryFiles.length} a la galería…`);
          await uploadProjectMedia(
            saved.id,
            pendingGalleryFiles[i],
            "gallery",
            existingGalleryCount + i,
          );
        }
      }

      // 3. Subida de plano urbanístico / masterplan
      if (pendingMasterplanFile) {
        setSaveStatus("Subiendo plano urbanístico a Supabase Storage…");
        await uploadProjectMedia(saved.id, pendingMasterplanFile, "masterplan", 0);
      }

      // 4. Subida de documentos
      if (pendingDocumentFiles.length > 0) {
        const existingDocCount = existingMedia.filter((m) => m.media_type === "document").length;
        for (let i = 0; i < pendingDocumentFiles.length; i++) {
          setSaveStatus(`Subiendo documento ${i + 1} de ${pendingDocumentFiles.length}…`);
          await uploadProjectMedia(
            saved.id,
            pendingDocumentFiles[i],
            "document",
            existingDocCount + i,
          );
        }
      }

      // Recargar lista actualizada
      const records = await listManagedProjects(organizationId);
      setProjects(records.map(mapProjectRecord));
      setDialogOpen(false);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "No fue posible guardar el proyecto.");
    } finally {
      setIsSaving(false);
      setSaveStatus(null);
    }
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
            Gestiona los desarrollos y los recursos multimedia almacenados en Supabase Storage.
          </p>
        </div>
        <Button className="shrink-0 rounded-full" onClick={openNewProject}>
          <Plus data-icon="inline-start" /> Nuevo proyecto
        </Button>
      </section>

      {dataError && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Ocurrió un error</AlertTitle>
          <AlertDescription>{dataError}</AlertDescription>
        </Alert>
      )}

      <Card className="mt-7 rounded-2xl">
        <CardHeader className="gap-5">
          <div className="flex flex-col gap-1">
            <CardTitle className="font-serif text-2xl">Catálogo de proyectos</CardTitle>
            <CardDescription>
              Cada proyecto reúne su ficha técnica, portada, galería, plano urbanístico y
              experiencia digital con persistencia en Supabase.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Buscar por nombre, ubicación o slug…"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as "todos" | ProjectStatus)}
              >
                <SelectTrigger aria-label="Filtrar por estado">
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
          </div>
        </CardHeader>
        <CardContent>
          {dataState === "loading" ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-8 text-accent" />
            </div>
          ) : (
            <ProjectCatalog projects={filteredProjects} onEdit={openEditProject} />
          )}
        </CardContent>
      </Card>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        draft={draft}
        editingProject={editingProject}
        existingMedia={existingMedia}
        loadingMedia={loadingMedia}
        coverPreview={coverPreview}
        pendingGalleryFiles={pendingGalleryFiles}
        pendingMasterplanFile={pendingMasterplanFile}
        pendingDocumentFiles={pendingDocumentFiles}
        onDraftChange={updateDraft}
        onSelectCover={(file) => {
          setCoverFile(file);
          setCoverPreview(URL.createObjectURL(file));
        }}
        onRemoveCover={() => {
          setCoverFile(null);
          setCoverPreview(editingProject?.image ?? "");
        }}
        onAddGalleryFiles={(files) => setPendingGalleryFiles((prev) => [...prev, ...files])}
        onRemovePendingGalleryFile={(index) =>
          setPendingGalleryFiles((prev) => prev.filter((_, i) => i !== index))
        }
        onSelectMasterplan={(file) => setPendingMasterplanFile(file)}
        onRemovePendingMasterplan={() => setPendingMasterplanFile(null)}
        onAddDocumentFiles={(files) => setPendingDocumentFiles((prev) => [...prev, ...files])}
        onRemovePendingDocumentFile={(index) =>
          setPendingDocumentFiles((prev) => prev.filter((_, i) => i !== index))
        }
        onDeleteExistingMedia={handleDeleteExistingMedia}
        onSave={saveProject}
        isSaving={isSaving}
        saveStatus={saveStatus}
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
          <TableHead className="hidden md:table-cell">Referencia</TableHead>
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
                {project.image ? (
                  <img
                    src={project.image}
                    alt=""
                    className="size-12 rounded-lg border object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </div>
                )}
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate font-medium text-foreground">{project.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {humanizeType(project.type)} ·{" "}
                    {project.lotCount > 0 ? `${project.lotCount} lotes` : "Sin lotes"} ·{" "}
                    {project.galleryCount > 0 ? `${project.galleryCount} fotos` : "Sin fotos"}
                  </p>
                  <p className="text-xs text-muted-foreground lg:hidden">
                    {project.location} ·{" "}
                    {project.lotCount > 0 ? `${project.lotCount} lotes` : "Sin lotes"}
                  </p>
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
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {project.raw.price_label || "Sin precio asignado"}
                </span>
                <span>{project.raw.area_label || "Área por definir"}</span>
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

type MediaDropzoneProps = {
  id: string;
  accept: string;
  multiple?: boolean;
  title: string;
  description: string;
  onFilesSelected: (files: File[]) => void;
};

function MediaDropzone({
  id,
  accept,
  multiple,
  title,
  description,
  onFilesSelected,
}: MediaDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFilesSelected(Array.from(files));
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
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
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "group flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-5 py-4 text-center transition-colors hover:border-accent hover:bg-accent/5",
          isDragging && "border-accent bg-accent/10",
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full border bg-background shadow-sm">
          <AutemBrandIcon size={24} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="max-w-72 text-xs font-normal leading-4 text-muted-foreground">
            {description} Arrastra o selecciona.
          </span>
        </span>
        <span className="text-xs font-medium text-accent">
          Seleccionar {multiple ? "archivos" : "archivo"}
        </span>
      </FieldLabel>
    </div>
  );
}

type ProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ProjectDraft;
  editingProject: ManagedProject | null;
  existingMedia: ProjectMediaRecord[];
  loadingMedia: boolean;
  coverPreview: string;
  pendingGalleryFiles: File[];
  pendingMasterplanFile: File | null;
  pendingDocumentFiles: File[];
  onDraftChange: <Key extends keyof ProjectDraft>(key: Key, value: ProjectDraft[Key]) => void;
  onSelectCover: (file: File) => void;
  onRemoveCover: () => void;
  onAddGalleryFiles: (files: File[]) => void;
  onRemovePendingGalleryFile: (index: number) => void;
  onSelectMasterplan: (file: File) => void;
  onRemovePendingMasterplan: () => void;
  onAddDocumentFiles: (files: File[]) => void;
  onRemovePendingDocumentFile: (index: number) => void;
  onDeleteExistingMedia: (item: ProjectMediaRecord) => void;
  onSave: () => void;
  isSaving: boolean;
  saveStatus: string | null;
};

function ProjectDialog({
  open,
  onOpenChange,
  draft,
  editingProject,
  existingMedia,
  loadingMedia,
  coverPreview,
  pendingGalleryFiles,
  pendingMasterplanFile,
  pendingDocumentFiles,
  onDraftChange,
  onSelectCover,
  onRemoveCover,
  onAddGalleryFiles,
  onRemovePendingGalleryFile,
  onSelectMasterplan,
  onRemovePendingMasterplan,
  onAddDocumentFiles,
  onRemovePendingDocumentFile,
  onDeleteExistingMedia,
  onSave,
  isSaving,
  saveStatus,
}: ProjectDialogProps) {
  const isIncomplete = !draft.name.trim() || !draft.location.trim();

  const existingGallery = existingMedia.filter((m) => m.media_type === "gallery");
  const existingMasterplan = existingMedia.find((m) => m.media_type === "masterplan");
  const existingDocuments = existingMedia.filter((m) => m.media_type === "document");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle>
            {editingProject ? `Editar ${editingProject.name}` : "Nuevo proyecto"}
          </DialogTitle>
          <DialogDescription>
            Configura la ficha y sube los recursos visuales que se almacenan directamente en
            Supabase Storage.
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
                    <FieldLabel htmlFor="project-slug">Identificador URL (slug)</FieldLabel>
                    <Input
                      id="project-slug"
                      value={draft.slug}
                      onChange={(event) => onDraftChange("slug", event.target.value)}
                      placeholder="villa-paraiso"
                    />
                    <FieldDescription>
                      Identificador único en minúsculas y guiones.
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
                <FieldLegend>Portada, galería y planos (Supabase Storage)</FieldLegend>
                <Alert className="border-accent/30 bg-accent/5">
                  <CloudUpload className="size-4 text-accent" />
                  <AlertTitle>Almacenamiento persistente en Supabase</AlertTitle>
                  <AlertDescription>
                    Los archivos se suben al bucket <code>project-media</code> y se vinculan
                    permanentemente al proyecto.
                  </AlertDescription>
                </Alert>

                {loadingMedia && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Spinner className="size-4 text-accent" /> Cargando archivos existentes del
                    proyecto…
                  </div>
                )}

                <FieldGroup className="grid gap-6 md:grid-cols-2">
                  {/* Portada */}
                  <Field className="flex flex-col gap-2">
                    <FieldLabel>Imagen de portada</FieldLabel>
                    {coverPreview ? (
                      <div className="relative overflow-hidden rounded-xl border bg-muted">
                        <img
                          src={coverPreview}
                          alt="Vista previa de portada"
                          className="aspect-video w-full object-cover"
                        />
                        <div className="absolute right-2 top-2 flex gap-1">
                          <label
                            htmlFor="project-cover-replace"
                            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full bg-background/90 px-2.5 text-xs font-medium shadow-md hover:bg-background"
                            title="Reemplazar portada"
                          >
                            <RefreshCw className="size-3" /> Reemplazar
                            <input
                              id="project-cover-replace"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onSelectCover(f);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="rounded-full shadow-md"
                            onClick={onRemoveCover}
                            title="Eliminar portada"
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <MediaDropzone
                        id="project-cover"
                        accept="image/*"
                        title="Portada principal"
                        description="Usa una imagen horizontal nítida. Arrastra o selecciona."
                        onFilesSelected={(files) => files[0] && onSelectCover(files[0])}
                      />
                    )}
                  </Field>

                  {/* Galería */}
                  <Field className="flex flex-col gap-2">
                    <FieldLabel>Galería del proyecto</FieldLabel>

                    {/* Existentes en Supabase */}
                    {existingGallery.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Imágenes guardadas ({existingGallery.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {existingGallery.map((item) => (
                            <div
                              key={item.id}
                              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                            >
                              <img
                                src={item.url || ""}
                                alt={item.title || "Foto galería"}
                                className="size-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() => onDeleteExistingMedia(item)}
                                title="Eliminar de Supabase"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pendientes por subir */}
                    {pendingGalleryFiles.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-medium text-accent">
                          Pendientes por guardar ({pendingGalleryFiles.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {pendingGalleryFiles.map((file, index) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="group relative aspect-square overflow-hidden rounded-lg border border-accent/40 bg-accent/5"
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt=""
                                className="size-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 bg-background/80"
                                onClick={() => onRemovePendingGalleryFile(index)}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Agregar más fotos – siempre visible al final */}
                    {existingGallery.length > 0 || pendingGalleryFiles.length > 0 ? (
                      <label
                        htmlFor="project-gallery-more"
                        className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full border border-dashed px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                      >
                        <Plus className="size-3.5" /> Agregar más fotos
                        <input
                          id="project-gallery-more"
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files) onAddGalleryFiles(Array.from(e.target.files));
                            e.target.value = "";
                          }}
                        />
                      </label>
                    ) : (
                      <MediaDropzone
                        id="project-gallery"
                        accept="image/*"
                        multiple
                        title="Fotos y renders"
                        description="Agrega vistas aéreas, renders y avances."
                        onFilesSelected={onAddGalleryFiles}
                      />
                    )}
                  </Field>

                  {/* Plano / Masterplan */}
                  <Field className="flex flex-col gap-2">
                    <FieldLabel>Plano urbanístico (Masterplan)</FieldLabel>

                    {pendingMasterplanFile ? (
                      <div className="flex items-center justify-between rounded-lg border border-accent/40 bg-accent/5 p-2 text-xs">
                        <span className="flex items-center gap-2 truncate font-medium text-accent">
                          <Upload className="size-4" />
                          <span className="truncate">{pendingMasterplanFile.name} (pendiente)</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={onRemovePendingMasterplan}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ) : existingMasterplan ? (
                      <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-2 text-xs">
                        <span className="flex items-center gap-2 truncate font-medium">
                          <FileText className="size-4 text-accent" />
                          <span className="truncate">
                            {existingMasterplan.title || "Plano guardado"}
                          </span>
                        </span>
                        <div className="flex items-center gap-1">
                          {existingMasterplan.url && (
                            <a
                              href={existingMasterplan.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                              title="Ver plano"
                            >
                              <ExternalLink className="size-3.5 text-muted-foreground" />
                            </a>
                          )}
                          <label
                            htmlFor="project-masterplan-replace"
                            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md hover:bg-muted"
                            title="Reemplazar plano"
                          >
                            <RefreshCw className="size-3.5 text-muted-foreground" />
                            <input
                              id="project-masterplan-replace"
                              type="file"
                              accept="image/*,.pdf,.svg"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onSelectMasterplan(f);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteExistingMedia(existingMasterplan)}
                            title="Eliminar plano de Supabase"
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <MediaDropzone
                        id="project-masterplan"
                        accept="image/*,.pdf,.svg"
                        title="Plano general"
                        description="SVG, imagen o PDF del urbanismo."
                        onFilesSelected={(files) => files[0] && onSelectMasterplan(files[0])}
                      />
                    )}
                  </Field>

                  {/* Documentos */}
                  <Field className="flex flex-col gap-2">
                    <FieldLabel>Documentos descargables</FieldLabel>
                    <MediaDropzone
                      id="project-documents"
                      accept=".pdf,image/*"
                      multiple
                      title="Brochure o documentos"
                      description="Fichas comerciales y anexos PDF."
                      onFilesSelected={onAddDocumentFiles}
                    />

                    {/* Existentes */}
                    {existingDocuments.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {existingDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between rounded-lg border bg-muted/30 p-2 text-xs"
                          >
                            <span className="flex items-center gap-2 truncate font-medium">
                              <FileText className="size-3.5 text-muted-foreground" />
                              <span className="truncate">{doc.title || "Documento"}</span>
                            </span>
                            <div className="flex items-center gap-1">
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex size-6 items-center justify-center rounded hover:bg-muted"
                                >
                                  <ExternalLink className="size-3 text-muted-foreground" />
                                </a>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeleteExistingMedia(doc)}
                              >
                                <Trash2 className="size-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pendientes */}
                    {pendingDocumentFiles.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {pendingDocumentFiles.map((doc, idx) => (
                          <div
                            key={`${doc.name}-${idx}`}
                            className="flex items-center justify-between rounded-lg border border-accent/40 bg-accent/5 p-2 text-xs"
                          >
                            <span className="truncate font-medium text-accent">
                              {doc.name} (pendiente)
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemovePendingDocumentFile(idx)}
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                </FieldGroup>
              </FieldSet>
            </TabsContent>

            <TabsContent value="experiencia">
              <FieldSet>
                <FieldLegend>Recorridos y enlaces 3D</FieldLegend>
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
                      Introduce el enlace a Matterport, visor 360° o experiencia interactiva.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <Alert>
                  <CheckCircle2 />
                  <AlertTitle>Conexión a Supabase activa</AlertTitle>
                  <AlertDescription>
                    La ficha y los archivos multimedia asociados quedan disponibles tanto en la
                    administración como en el catálogo y vistas públicas del proyecto.
                  </AlertDescription>
                </Alert>
              </FieldSet>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-1 flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between sm:space-x-0">
            {saveStatus ? (
              <span className="flex items-center gap-2 text-xs text-accent">
                <Loader2 className="size-3.5 animate-spin" />
                {saveStatus}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Los cambios se guardan directamente en Supabase.
              </span>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isIncomplete || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 data-icon="inline-start" className="animate-spin" /> Guardando…
                  </>
                ) : (
                  <>
                    <CheckCircle2 data-icon="inline-start" />{" "}
                    {editingProject ? "Guardar cambios" : "Crear proyecto"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
