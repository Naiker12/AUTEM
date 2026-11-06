import { createFileRoute } from "@tanstack/react-router";
import {
  Bird,
  CheckCircle2,
  CloudUpload,
  Compass,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Trees,
  Upload,
  Waves,
  X,
} from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";

import {
  PROPERTY_TYPES,
  type PropertyType,
  type ProjectDossierMetadata,
  type ProjectEcology,
  type ProjectMetrics,
} from "@/data/properties";
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
import AutemBrandIcon from "@/components/brand/AutemBrandIcon";
import { Spinner } from "@/components/ui/spinner";
import { getCurrentAdminAccess } from "@/lib/admin-auth";
import {
  createManagedProject,
  deleteProjectMedia,
  listManagedProjects,
  listProjectMedia,
  parseRawDossierText,
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
  logo: string;
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
  metadata?: ProjectDossierMetadata;
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
  metadata: undefined,
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
    logo: record.logo_path ? (publicProjectMediaUrl(record.logo_path) ?? "") : "",
    galleryCount: record.gallery_count ?? 0,
    lotCount: record.lot_count ?? 0,
    status: record.status === "published" ? "Publicado" : "Borrador",
    raw: record,
  };
}

function ProjectsPage() {
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
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
        const allowedIds = access.isSuperAdmin ? undefined : access.assignedProjectIds;
        const records = await listManagedProjects(access.organizationId, allowedIds);
        if (!isActive) return;
        setOrganizationId(access.organizationId);
        setIsSuperAdmin(access.isSuperAdmin);
        setAssignedProjectIds(access.assignedProjectIds);
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
    setLogoFile(null);
    setLogoPreview("");
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
      metadata: project.raw.metadata,
    });
    setCoverFile(null);
    setCoverPreview(project.image);
    setLogoFile(null);
    setLogoPreview(project.logo);
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
        metadata: draft.metadata,
      };

      const saved = editingProject
        ? await updateManagedProject(editingProject.id, input)
        : await createManagedProject(organizationId, input);

      // 1. Subida de portada a Supabase Storage
      if (coverFile) {
        setSaveStatus("Subiendo portada a Supabase Storage…");
        await uploadProjectMedia(saved.id, coverFile, "cover", 0);
      }

      // 1b. Subida de logotipo a Supabase Storage
      if (logoFile) {
        setSaveStatus("Subiendo logotipo a Supabase Storage…");
        await uploadProjectMedia(saved.id, logoFile, "logo", 0);
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
      const allowedIds = isSuperAdmin ? undefined : assignedProjectIds;
      const records = await listManagedProjects(organizationId, allowedIds);
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
              {projects.length} proyecto{projects.length === 1 ? "" : "s"} disponible
              {projects.length === 1 ? "" : "s"}
            </p>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {isSuperAdmin
              ? "Gestiona los desarrollos y los recursos multimedia almacenados en Supabase Storage."
              : "Consulta y administra la información de los proyectos que tienes asignados."}
          </p>
        </div>
        {isSuperAdmin && (
          <Button className="shrink-0 rounded-full" onClick={openNewProject}>
            <Plus data-icon="inline-start" /> Nuevo proyecto
          </Button>
        )}
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
        logoPreview={logoPreview}
        pendingGalleryFiles={pendingGalleryFiles}
        pendingMasterplanFile={pendingMasterplanFile}
        pendingDocumentFiles={pendingDocumentFiles}
        onDraftChange={updateDraft}
        onSelectCover={(file) => {
          setCoverFile(file);
          setCoverPreview((prev) => {
            if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
          });
        }}
        onRemoveCover={async () => {
          if (coverFile) {
            setCoverFile(null);
            setCoverPreview((prev) => {
              if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
              return editingProject?.image ?? "";
            });
            return;
          }
          // Si es una portada existente en Supabase, la eliminamos físicamente de Storage y BD
          const existingCover = existingMedia.find((m) => m.media_type === "cover");
          if (existingCover && editingProject) {
            await handleDeleteExistingMedia(existingCover);
          } else {
            setCoverPreview("");
          }
        }}
        onSelectLogo={(file) => {
          setLogoFile(file);
          setLogoPreview((prev) => {
            if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
          });
        }}
        onRemoveLogo={async () => {
          if (logoFile) {
            setLogoFile(null);
            setLogoPreview((prev) => {
              if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
              return editingProject?.logo ?? "";
            });
            return;
          }
          const existingLogo = existingMedia.find((m) => m.media_type === "logo");
          if (existingLogo && editingProject) {
            await handleDeleteExistingMedia(existingLogo);
          }
          setLogoPreview("");
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
  logoPreview: string;
  pendingGalleryFiles: File[];
  pendingMasterplanFile: File | null;
  pendingDocumentFiles: File[];
  onDraftChange: <Key extends keyof ProjectDraft>(key: Key, value: ProjectDraft[Key]) => void;
  onSelectCover: (file: File) => void;
  onRemoveCover: () => void | Promise<void>;
  onSelectLogo: (file: File) => void;
  onRemoveLogo: () => void | Promise<void>;
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
  logoPreview,
  pendingGalleryFiles,
  pendingMasterplanFile,
  pendingDocumentFiles,
  onDraftChange,
  onSelectCover,
  onRemoveCover,
  onSelectLogo,
  onRemoveLogo,
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
  const [pendingGalleryPreviews, setPendingGalleryPreviews] = useState<string[]>([]);
  const [rawDossierText, setRawDossierText] = useState(draft.metadata?.rawDossierText || "");
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  useEffect(() => {
    setRawDossierText(draft.metadata?.rawDossierText || "");
    setParseNotice(null);
  }, [editingProject?.id, draft.metadata?.rawDossierText]);

  const handleParseDossier = () => {
    if (!rawDossierText.trim()) return;
    const parsed = parseRawDossierText(rawDossierText);
    const updatedMeta: ProjectDossierMetadata = {
      ...draft.metadata,
      ...parsed,
      rawDossierText,
    };
    onDraftChange("metadata", updatedMeta);
    setParseNotice(
      `✓ Dossier procesado con éxito: ${updatedMeta.metrics?.totalLots || 340} parcelas, ${updatedMeta.amenities?.length || 27} amenidades y ${updatedMeta.whyBuyReasons?.length || 10} razones detectadas. Haz clic en "Guardar cambios" para persistirlo en la base de datos.`,
    );
  };

  useEffect(() => {
    const urls = pendingGalleryFiles.map((file) => URL.createObjectURL(file));
    setPendingGalleryPreviews(urls);
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [pendingGalleryFiles]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle>
            {editingProject ? `Editar ${editingProject.name}` : "Nuevo proyecto"}
          </DialogTitle>
          <DialogDescription>
            Configura la ficha técnica, logotipo, planos y recursos visuales del proyecto.
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
              <TabsTrigger value="dossier">Dossier y Ficha</TabsTrigger>
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

            <TabsContent value="dossier">
              <FieldSet className="space-y-6">
                <FieldLegend>Dossier Oficial y Ficha del Proyecto</FieldLegend>

                {/* 1. Herramienta de Pegar Texto / Importar PDF */}
                <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-accent shrink-0" />
                      <span className="font-semibold text-xs text-foreground">
                        Pegar contenido de la ficha técnica o PDF
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-accent/40 text-accent">
                      Importador inteligente
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pega el texto del documento o folleto oficial del proyecto. Nuestro analizador
                    identificará automáticamente el concepto ecológico, número de lotes, amenidades,
                    razones de compra y servicios para guardarlos en la base de datos de Supabase.
                  </p>
                  <Textarea
                    rows={6}
                    value={rawDossierText}
                    onChange={(e) => setRawDossierText(e.target.value)}
                    placeholder="Pega aquí el texto completo del proyecto: descripción, hectáreas, lagos, aves, amenidades, por qué comprar, servicios..."
                    className="font-mono text-xs bg-background/80"
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleParseDossier}
                      className="gap-1.5 font-medium text-xs rounded-lg cursor-pointer"
                    >
                      <Sparkles className="size-3.5" />
                      Analizar y estructurar información
                    </Button>
                    {draft.metadata && (
                      <span className="text-[11px] text-muted-foreground">
                        Metadatos cargados en el borrador
                      </span>
                    )}
                  </div>
                  {parseNotice && (
                    <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 py-2 text-xs">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <AlertDescription>{parseNotice}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 2. Visualización y Edición de Secciones Estructuradas */}
                <div className="grid gap-5 md:grid-cols-2">
                  <Field className="space-y-1.5">
                    <FieldLabel>Nombre de la Reserva Natural</FieldLabel>
                    <Input
                      value={draft.metadata?.ecology?.reserveName ?? "Reserva Natural La Ciénaga"}
                      onChange={(e) => {
                        const eco = {
                          ...draft.metadata?.ecology,
                          reserveName: e.target.value,
                        } as unknown as ProjectEcology;
                        onDraftChange("metadata", { ...draft.metadata, ecology: eco });
                      }}
                      placeholder="Reserva Natural La Ciénaga"
                    />
                  </Field>

                  <Field className="space-y-1.5">
                    <FieldLabel>Especies de aves registradas</FieldLabel>
                    <Input
                      type="number"
                      value={draft.metadata?.ecology?.birdSpeciesCount ?? 130}
                      onChange={(e) => {
                        const eco = {
                          ...draft.metadata?.ecology,
                          birdSpeciesCount: Number(e.target.value),
                        } as unknown as ProjectEcology;
                        onDraftChange("metadata", { ...draft.metadata, ecology: eco });
                      }}
                      placeholder="130"
                    />
                  </Field>

                  <Field className="space-y-1.5">
                    <FieldLabel>Extensión total (Hectáreas)</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={draft.metadata?.metrics?.totalAreaHa ?? 25.45}
                      onChange={(e) => {
                        const m = {
                          ...draft.metadata?.metrics,
                          totalAreaHa: Number(e.target.value),
                        } as unknown as ProjectMetrics;
                        onDraftChange("metadata", { ...draft.metadata, metrics: m });
                      }}
                      placeholder="25.45"
                    />
                  </Field>

                  <Field className="space-y-1.5">
                    <FieldLabel>Área de zonas verdes (m²)</FieldLabel>
                    <Input
                      type="number"
                      value={draft.metadata?.metrics?.greenAreasM2 ?? 106322}
                      onChange={(e) => {
                        const m = {
                          ...draft.metadata?.metrics,
                          greenAreasM2: Number(e.target.value),
                        } as unknown as ProjectMetrics;
                        onDraftChange("metadata", { ...draft.metadata, metrics: m });
                      }}
                      placeholder="106322"
                    />
                  </Field>

                  <Field className="space-y-1.5">
                    <FieldLabel>Superficie en 3 lagos (m²)</FieldLabel>
                    <Input
                      type="number"
                      value={draft.metadata?.metrics?.lakesAreaM2 ?? 33128}
                      onChange={(e) => {
                        const m = {
                          ...draft.metadata?.metrics,
                          lakesAreaM2: Number(e.target.value),
                        } as unknown as ProjectMetrics;
                        onDraftChange("metadata", { ...draft.metadata, metrics: m });
                      }}
                      placeholder="33128"
                    />
                  </Field>

                  <Field className="space-y-1.5">
                    <FieldLabel>Senderos totales (Metros lineales)</FieldLabel>
                    <Input
                      type="number"
                      value={draft.metadata?.metrics?.trailsTotalM ?? 3479}
                      onChange={(e) => {
                        const m = {
                          ...draft.metadata?.metrics,
                          trailsTotalM: Number(e.target.value),
                        } as unknown as ProjectMetrics;
                        onDraftChange("metadata", { ...draft.metadata, metrics: m });
                      }}
                      placeholder="3479"
                    />
                  </Field>

                  <Field className="space-y-1.5 md:col-span-2">
                    <FieldLabel>Fauna silvestre protegida (separada por comas)</FieldLabel>
                    <Input
                      value={(
                        draft.metadata?.ecology?.fauna || [
                          "Osos Perezosos",
                          "Osos Hormigueros",
                          "Monos Aulladores",
                          "Ardillas",
                          "Iguanas",
                          "Puerco Espín",
                          "Loros",
                          "Guacamayos Azules y Rojos",
                          "Conejos",
                          "Armadillos",
                          "Tortugas",
                          "Guartinajas",
                        ]
                      ).join(", ")}
                      onChange={(e) => {
                        const fauna = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const eco = {
                          ...draft.metadata?.ecology,
                          fauna,
                        } as unknown as ProjectEcology;
                        onDraftChange("metadata", { ...draft.metadata, ecology: eco });
                      }}
                    />
                  </Field>

                  <Field className="space-y-1.5 md:col-span-2">
                    <FieldLabel>Amenidades Florida Country Club (una por línea)</FieldLabel>
                    <Textarea
                      rows={6}
                      value={(
                        draft.metadata?.amenities || [
                          "Portería de Lujo y vigilancia 24 Horas",
                          "Recepción y Salón de Reuniones",
                          "Casa Club - Mirador",
                          "Piscina para Adultos y Piscina para Niños",
                          "Solárium",
                          "Baños sociales",
                          "Parque infantil",
                          "Gimnasio de mascotas (Pet Park)",
                          "Cancha múltiple de Microfútbol y Basquetbol",
                          "Senderismo ecológico",
                          "Ciclorrutas",
                          "Gran Kiosco Social",
                          "Lago para Kayaking",
                          "Lago para Canotaje",
                          "Lago para Pesca Deportiva",
                          "Cancha para Tenis, Pádel y Voleibol",
                          "Capilla",
                          "Zona de lectura y meditación",
                          "Zona de BBQ",
                          "Puente Mirador en el Arroyo",
                          "Senderos para Bicicross",
                          "Bio gimnasio al aire libre",
                          "Jardines y senderos florales",
                          "Bosque de árboles frutales",
                          "Observación de aves",
                          "Amplias zonas verdes (106.322 m²)",
                          "Copiosa vegetación y reserva boscosa protegida de 4 ha",
                        ]
                      ).join("\n")}
                      onChange={(e) => {
                        const amenities = e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        onDraftChange("metadata", { ...draft.metadata, amenities });
                      }}
                    />
                  </Field>

                  <Field className="space-y-1.5 md:col-span-2">
                    <FieldLabel>¿Por qué comprar? - Razones clave (una por línea)</FieldLabel>
                    <Textarea
                      rows={5}
                      value={(
                        draft.metadata?.whyBuyReasons || [
                          "Fácil acceso a solo 1 km del Municipio en la vía Santa Rosa - Villanueva, con servicios públicos y viabilidad de gas domiciliario.",
                          "Excelente topografía alta con tanque de 250.000 litros existente que suministra agua por gravedad garantizando gran ahorro energético.",
                          "Estudio hidrológico radicado en Planeación que garantiza cero inundaciones gracias al arroyo natural que no se desborda y lagunas de amortiguación.",
                          "Conjunto cerrado con portería de lujo 24 horas, cerramiento en limoncillo y malla galvanizada plastificada en PVC con tubos de 2”.",
                          "Tres grandes lagos con 33.128 m² de espejo de agua para pesca deportiva y deportes náuticos.",
                          "Más de 3.400 metros de senderos bajo frondosos árboles nativos escuchando el lindo canto de los pájaros.",
                          "Hábitat natural protegido con más de 130 especies de aves y fauna silvestre libre (osos perezosos, monos aulladores, armadillos, etc.).",
                          "5 senderos peatonales internos de 3 metros entre manzanas comunicando directamente con los senderos perimetrales.",
                          "Alta valorización garantizada a solo 10 minutos de donde se construirá el nuevo Aeropuerto Internacional de Cartagena de Indias.",
                          "Libertad de construcción con asesoría en conceptos bioclimáticos y sustentables que armonizan con la reserva.",
                        ]
                      ).join("\n")}
                      onChange={(e) => {
                        const whyBuyReasons = e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        onDraftChange("metadata", { ...draft.metadata, whyBuyReasons });
                      }}
                    />
                  </Field>

                  <Field className="space-y-1.5 md:col-span-2">
                    <FieldLabel>Servicios e Infraestructura (uno por línea)</FieldLabel>
                    <Textarea
                      rows={4}
                      value={(
                        draft.metadata?.services || [
                          "Servicio de agua domiciliaria proveniente de pozos profundos o empresa operadora con tanques de reserva (250.000 L)",
                          "Servicio de energía eléctrica y alumbrado público ecológico",
                          "Parqueadero para visitantes y accesibilidad total",
                          "Servicio permanente de jardinería y mantenimiento de áreas comunes",
                          "Probabilidad y viabilidad de gas domiciliario",
                          "Circuito Cerrado de Televisión (CCTV) y vigilancia privada 24 horas",
                          "Vías internas en zahorra compactada con cunetas y bordillos",
                          "Cercas vivas con limoncillo y malla galvanizada plastificada en PVC con tubos de 2”",
                        ]
                      ).join("\n")}
                      onChange={(e) => {
                        const services = e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        onDraftChange("metadata", { ...draft.metadata, services });
                      }}
                    />
                  </Field>
                </div>
              </FieldSet>
            </TabsContent>

            <TabsContent value="medios">
              <FieldSet>
                <FieldLegend>Identidad visual y recursos multimedia</FieldLegend>

                {loadingMedia && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Spinner className="size-4 text-accent" /> Cargando archivos existentes del
                    proyecto…
                  </div>
                )}

                <FieldGroup className="grid gap-6 md:grid-cols-2">
                  {/* Logotipo del proyecto */}
                  <Field className="flex flex-col gap-2">
                    <FieldLabel>Logotipo del proyecto</FieldLabel>
                    {logoPreview ? (
                      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/30 p-6">
                        <img
                          src={logoPreview}
                          alt="Vista previa del logotipo"
                          className="max-h-24 max-w-[85%] object-contain"
                        />
                        <div className="absolute right-2 top-2 flex gap-1">
                          <label
                            htmlFor="project-logo-replace"
                            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full bg-background/90 px-2.5 text-xs font-medium shadow-md hover:bg-background"
                            title="Reemplazar logotipo"
                          >
                            <RefreshCw className="size-3" /> Reemplazar
                            <input
                              id="project-logo-replace"
                              type="file"
                              accept="image/png,image/svg+xml,image/webp"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onSelectLogo(f);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="rounded-full shadow-md"
                            onClick={onRemoveLogo}
                            title="Eliminar logotipo"
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <MediaDropzone
                        id="project-logo"
                        accept="image/png,image/svg+xml,image/webp"
                        title="Logotipo oficial"
                        description="Formato PNG o SVG con fondo transparente."
                        onFilesSelected={(files) => files[0] && onSelectLogo(files[0])}
                      />
                    )}
                  </Field>

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
                                src={pendingGalleryPreviews[index] ?? ""}
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
                              rel="noopener noreferrer"
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
                              accept=".svg,.png,.jpg,.jpeg,.webp,.pdf,.dxf,.dwg,.geojson,.json"
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
                        accept=".svg,.png,.jpg,.jpeg,.webp,.pdf,.dxf,.dwg,.geojson,.json"
                        title="Plano general"
                        description="SVG, GeoJSON, CAD (.dxf, .dwg), imagen o PDF del urbanismo."
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
                                  rel="noopener noreferrer"
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
                    <div className="pt-1.5">
                      <Button asChild variant="outline" size="sm">
                        <a href="/admin/experiencias/panorama-360">Visor 360°</a>
                      </Button>
                    </div>
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
