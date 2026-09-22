import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Eye, ImagePlus, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { MediaUploadField } from "@/components/admin/content/MediaUploadField";
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/contenido/portada")({ component: CoverPage });

const defaultCover = {
  eyebrow: "AUTEM · Arquitectura y territorio",
  title: "Arquitectura que transforma el territorio.",
  description:
    "Diseñamos proyectos inmobiliarios y arquitectónicos que conectan el paisaje, la inversión y la forma de habitar.",
  primaryCta: "Ver proyectos",
  secondaryCta: "Agendar consulta",
  visible: true,
};

const defaultImage = `${import.meta.env.BASE_URL}images/autem-hero-approved-scene-v2.png`;

function CoverPage() {
  const [cover, setCover] = useState(defaultCover);
  const [image, setImage] = useState(defaultImage);
  const [imageName, setImageName] = useState("autem-hero-approved-scene-v2.png");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    return () => {
      if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    };
  }, [image]);

  function updateCover<Key extends keyof typeof defaultCover>(
    key: Key,
    value: (typeof cover)[Key],
  ) {
    setCover((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function handleImageFile(file: File) {
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImage(URL.createObjectURL(file));
    setImageName(file.name);
    setSaved(false);
  }

  function restoreDefaults() {
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setCover(defaultCover);
    setImage(defaultImage);
    setImageName("autem-hero-approved-scene-v2.png");
    setSaved(false);
  }

  function saveCover() {
    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
    }, 700);
  }

  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <section className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 border-l-2 border-accent pl-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Contenido y medios
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">Portada</h1>
            <Badge variant={cover.visible ? "secondary" : "outline"}>
              {cover.visible ? "Visible" : "Oculta"}
            </Badge>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Define la escena de entrada, el mensaje y las acciones principales de la página pública.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={restoreDefaults} disabled={isSaving}>
            <RotateCcw data-icon="inline-start" /> Restaurar
          </Button>
          <Button onClick={saveCover} disabled={isSaving}>
            {isSaving ? "Guardando…" : saved ? "Cambios guardados" : "Guardar cambios"}
          </Button>
        </div>
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,0.92fr)_minmax(32rem,1.08fr)]">
        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Mensaje principal</CardTitle>
              <CardDescription>
                Este contenido aparece sobre la imagen de apertura de AUTEM.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldSet>
                <FieldLegend className="sr-only">Contenido de la portada</FieldLegend>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="cover-eyebrow">Antetítulo</FieldLabel>
                    <Input
                      id="cover-eyebrow"
                      value={cover.eyebrow}
                      onChange={(event) => updateCover("eyebrow", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="cover-title">Titular</FieldLabel>
                    <Textarea
                      id="cover-title"
                      value={cover.title}
                      onChange={(event) => updateCover("title", event.target.value)}
                      rows={3}
                    />
                    <FieldDescription>
                      Procura una frase clara de máximo dos líneas.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="cover-description">Descripción</FieldLabel>
                    <Textarea
                      id="cover-description"
                      value={cover.description}
                      onChange={(event) => updateCover("description", event.target.value)}
                      rows={4}
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Acciones y visibilidad</CardTitle>
              <CardDescription>
                Configura las llamadas a la acción disponibles desde la portada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldSet>
                <FieldLegend className="sr-only">Acciones de la portada</FieldLegend>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="cover-primary-cta">Acción principal</FieldLabel>
                    <Input
                      id="cover-primary-cta"
                      value={cover.primaryCta}
                      onChange={(event) => updateCover("primaryCta", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="cover-secondary-cta">Acción secundaria</FieldLabel>
                    <Input
                      id="cover-secondary-cta"
                      value={cover.secondaryCta}
                      onChange={(event) => updateCover("secondaryCta", event.target.value)}
                    />
                  </Field>
                  <Field orientation="horizontal" className="sm:col-span-2">
                    <Switch
                      id="cover-visible"
                      checked={cover.visible}
                      onCheckedChange={(checked) => updateCover("visible", checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <FieldLabel htmlFor="cover-visible">Mostrar portada en el sitio</FieldLabel>
                      <FieldDescription>
                        Al desactivarla, el sitio comienza en la siguiente sección.
                      </FieldDescription>
                    </div>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Imagen de apertura</CardTitle>
              <CardDescription>
                Usa una imagen amplia y con espacio visual para que el mensaje siga siendo legible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldSet>
                <FieldLegend className="sr-only">Imagen de portada</FieldLegend>
                <FieldGroup>
                  <MediaUploadField
                    id="cover-image"
                    image={image}
                    fileName={imageName}
                    description="JPG, PNG o WebP. Recomendado: 2400 × 1350 px o superior."
                    onSelect={handleImageFile}
                  />
                </FieldGroup>
              </FieldSet>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              La imagen actual se actualiza en la vista previa al instante.
            </CardFooter>
          </Card>
        </div>

        <Card className="h-fit rounded-2xl 2xl:sticky 2xl:top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <Eye /> Vista previa
            </CardTitle>
            <CardDescription>Comprueba el resultado antes de publicar los cambios.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="desktop">
              <TabsList className="w-full">
                <TabsTrigger value="desktop" className="flex-1">
                  <Monitor /> Escritorio
                </TabsTrigger>
                <TabsTrigger value="tablet" className="flex-1">
                  <Tablet /> Tablet
                </TabsTrigger>
                <TabsTrigger value="mobile" className="flex-1">
                  <Smartphone /> Móvil
                </TabsTrigger>
              </TabsList>
              <TabsContent value="desktop" className="mt-5">
                <CoverPreview cover={cover} image={image} device="desktop" />
              </TabsContent>
              <TabsContent value="tablet" className="mt-5 flex justify-center">
                <div className="w-full max-w-xl overflow-hidden rounded-2xl border-4 border-foreground bg-background shadow-sm">
                  <CoverPreview cover={cover} image={image} device="tablet" />
                </div>
              </TabsContent>
              <TabsContent value="mobile" className="mt-5 flex justify-center">
                <div className="w-full max-w-72 overflow-hidden rounded-[1.75rem] border-8 border-foreground bg-background shadow-sm">
                  <CoverPreview cover={cover} image={image} device="mobile" />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Badge variant="outline">
              <ImagePlus /> Imagen lista para revisar
            </Badge>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

function CoverPreview({
  cover,
  image,
  device,
}: {
  cover: typeof defaultCover;
  image: string;
  device: "desktop" | "tablet" | "mobile";
}) {
  const mobile = device === "mobile";
  const compact = device !== "desktop";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-foreground text-background",
        mobile ? "aspect-[9/16]" : device === "tablet" ? "aspect-[4/3]" : "aspect-video",
      )}
    >
      <img
        src={image}
        alt="Vista previa de la portada"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div
        className={cn("relative flex h-full flex-col justify-end", compact ? "p-5" : "p-6 sm:p-8")}
      >
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/70">
          {cover.eyebrow}
        </p>
        <h2
          className={cn(
            "mt-3 font-serif leading-[0.95] text-white",
            mobile ? "text-3xl" : "max-w-xl text-3xl sm:text-5xl",
          )}
        >
          {cover.title}
        </h2>
        <p className={cn("mt-4 leading-5 text-white/80", mobile ? "text-xs" : "max-w-md text-sm")}>
          {cover.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-2 text-[10px] font-semibold text-foreground">
            {cover.primaryCta} <ArrowUpRight />
          </span>
          {!mobile ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/40 px-3 py-2 text-[10px] font-semibold text-white">
              {cover.secondaryCta} <ArrowUpRight />
            </span>
          ) : null}
        </div>
      </div>
      {!cover.visible ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/85 p-4 text-center text-sm font-medium text-foreground">
          Esta sección está oculta en el sitio público.
        </div>
      ) : null}
    </div>
  );
}
