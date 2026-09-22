import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Eye, ImagePlus, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { useEffect, useState } from "react";

import { MediaUploadField } from "@/components/admin/content/MediaUploadField";
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

export const Route = createFileRoute("/admin/contenido/$section")({
  component: ContentSectionPage,
});

type SectionKey =
  | "presentacion"
  | "servicios"
  | "areas-de-trabajo"
  | "proceso"
  | "recursos-del-proyecto"
  | "contacto"
  | "nosotros"
  | "navegacion-y-pie"
  | "privacidad";

type SectionDefinition = {
  title: string;
  publicLabel: string;
  description: string;
  image: string;
  imageAlt: string;
  eyebrow: string;
  heading: string;
  copy: string;
  action: string;
  support?: string;
};

const sections: Record<SectionKey, SectionDefinition> = {
  presentacion: {
    title: "Presentación",
    publicLabel: "Introducción",
    description: "El bloque que introduce el enfoque y la propuesta de valor de AUTEM.",
    image: `${import.meta.env.BASE_URL}images/autem-proceso-territorio.png`,
    imageAlt: "Ilustración territorial de AUTEM",
    eyebrow: "Nuestra visión",
    heading: "Diseñamos espacios atemporales con propósito.",
    copy: "Ofrecemos arquitectura, interiorismo y visualización para crear espacios con identidad.",
    action: "Conocer AUTEM",
  },
  servicios: {
    title: "Servicios",
    publicLabel: "Servicios",
    description: "La propuesta de servicios que se muestra en la página principal.",
    image: `${import.meta.env.BASE_URL}images/carousel-modern-lounge.jpg`,
    imageAlt: "Interior contemporáneo",
    eyebrow: "Soluciones integrales",
    heading: "Desde el concepto hasta la entrega.",
    copy: "Arquitectura, interiorismo, visualización y planeación para decisiones mejor informadas.",
    action: "Ver servicios",
  },
  "areas-de-trabajo": {
    title: "Áreas de trabajo",
    publicLabel: "Especialidades",
    description: "Los ámbitos de diseño y desarrollo que la marca comunica públicamente.",
    image: `${import.meta.env.BASE_URL}images/carousel-forest-pavilion.jpg`,
    imageAlt: "Pabellón en el paisaje",
    eyebrow: "Especialidades",
    heading: "Diseño residencial, comercial y territorial.",
    copy: "Cada proyecto articula programa, paisaje y experiencia para construir valor duradero.",
    action: "Explorar áreas",
  },
  proceso: {
    title: "Proceso",
    publicLabel: "Metodología",
    description: "La sección que explica cómo AUTEM acompaña cada proyecto.",
    image: `${import.meta.env.BASE_URL}images/autem-proceso-territorio.png`,
    imageAlt: "Proceso de diseño territorial",
    eyebrow: "Metodología",
    heading: "Un proceso claro para avanzar con confianza.",
    copy: "Escuchamos, definimos, diseñamos y acompañamos cada decisión importante del proyecto.",
    action: "Conocer el proceso",
  },
  "recursos-del-proyecto": {
    title: "Recursos del proyecto",
    publicLabel: "Recursos",
    description:
      "Documentos, planos, visualizaciones y materiales que apoyan la decisión comercial.",
    image: `${import.meta.env.BASE_URL}projects/lotes-360/masterplan-panorama-360.jpg`,
    imageAlt: "Masterplan de Villa Paraíso",
    eyebrow: "Información para decidir",
    heading: "Explora cada proyecto con más detalle.",
    copy: "Planos, recorridos, fichas y recursos preparados para entender el desarrollo completo.",
    action: "Ver recursos",
  },
  contacto: {
    title: "Contacto",
    publicLabel: "Contacto",
    description: "La invitación principal a iniciar una conversación con el equipo AUTEM.",
    image: `${import.meta.env.BASE_URL}images/carousel-sunset-terrace.jpg`,
    imageAlt: "Terraza al atardecer",
    eyebrow: "Hablemos de tu proyecto",
    heading: "Conversemos sobre el próximo paso.",
    copy: "Cuéntanos qué estás imaginando y encontraremos la mejor forma de acompañarte.",
    action: "Agendar consulta",
  },
  nosotros: {
    title: "Nosotros",
    publicLabel: "Estudio",
    description: "La historia, perspectiva y equipo que representan a AUTEM.",
    image: `${import.meta.env.BASE_URL}images/provencal-architecture-stone.jpg`,
    imageAlt: "Arquitectura en piedra",
    eyebrow: "AUTEM",
    heading: "Arquitectura que escucha el lugar.",
    copy: "Somos un estudio que une sensibilidad territorial, estrategia y diseño contemporáneo.",
    action: "Conocer el estudio",
  },
  "navegacion-y-pie": {
    title: "Navegación y pie",
    publicLabel: "Navegación",
    description: "Los mensajes de cierre, enlaces globales y accesos persistentes del sitio.",
    image: `${import.meta.env.BASE_URL}images/provencal-oak-detail.jpg`,
    imageAlt: "Detalle de material natural",
    eyebrow: "Siempre cerca",
    heading: "Información clara en cada recorrido.",
    copy: "Mantén accesibles los proyectos, servicios, contacto y canales principales de AUTEM.",
    action: "Ir al contacto",
  },
  privacidad: {
    title: "Privacidad",
    publicLabel: "Confianza y transparencia",
    description: "La información legal y el mensaje de manejo responsable de datos personales.",
    image: `${import.meta.env.BASE_URL}images/territory-masterplan-nature.jpg`,
    imageAlt: "Territorio y naturaleza",
    eyebrow: "Tus datos protegidos",
    heading: "Una relación basada en confianza.",
    copy: "Explicamos con claridad cómo se tratan los datos y cómo puedes ejercer tus derechos.",
    action: "Leer política",
  },
};

function ContentSectionPage() {
  const { section } = Route.useParams();
  const definition = sections[section as SectionKey] ?? sections.presentacion;
  const [content, setContent] = useState(definition);
  const [image, setImage] = useState(definition.image);
  const [imageName, setImageName] = useState(definition.image.split("/").at(-1) ?? "imagen.jpg");
  const [visible, setVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(definition);
    setImage(definition.image);
    setImageName(definition.image.split("/").at(-1) ?? "imagen.jpg");
    setVisible(true);
    setSaved(false);
  }, [definition]);

  useEffect(() => {
    return () => {
      if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    };
  }, [image]);

  function updateContent<Key extends keyof SectionDefinition>(
    key: Key,
    value: SectionDefinition[Key],
  ) {
    setContent((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function replaceImage(file: File) {
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setImage(URL.createObjectURL(file));
    setImageName(file.name);
    setSaved(false);
  }

  function restore() {
    if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    setContent(definition);
    setImage(definition.image);
    setImageName(definition.image.split("/").at(-1) ?? "imagen.jpg");
    setVisible(true);
    setSaved(false);
  }

  function save() {
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
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">{definition.title}</h1>
            <Badge variant={visible ? "secondary" : "outline"}>
              {visible ? "Visible" : "Oculta"}
            </Badge>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {definition.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={restore} disabled={isSaving}>
            <RotateCcw data-icon="inline-start" /> Restaurar
          </Button>
          <Button onClick={save} disabled={isSaving}>
            {isSaving ? "Guardando…" : saved ? "Cambios guardados" : "Guardar cambios"}
          </Button>
        </div>
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,0.92fr)_minmax(32rem,1.08fr)]">
        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Contenido de la sección</CardTitle>
              <CardDescription>
                Actualiza el mensaje que verá la audiencia en {definition.publicLabel.toLowerCase()}
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldSet>
                <FieldLegend className="sr-only">Contenido público</FieldLegend>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="section-eyebrow">Antetítulo</FieldLabel>
                    <Input
                      id="section-eyebrow"
                      value={content.eyebrow}
                      onChange={(event) => updateContent("eyebrow", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="section-heading">Titular</FieldLabel>
                    <Textarea
                      id="section-heading"
                      value={content.heading}
                      onChange={(event) => updateContent("heading", event.target.value)}
                      rows={3}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="section-copy">Descripción</FieldLabel>
                    <Textarea
                      id="section-copy"
                      value={content.copy}
                      onChange={(event) => updateContent("copy", event.target.value)}
                      rows={4}
                    />
                    <FieldDescription>
                      Un texto breve ayuda a conservar una lectura ágil en móvil.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="section-action">Llamada a la acción</FieldLabel>
                    <Input
                      id="section-action"
                      value={content.action}
                      onChange={(event) => updateContent("action", event.target.value)}
                    />
                  </Field>
                  <Field orientation="horizontal">
                    <Switch id="section-visible" checked={visible} onCheckedChange={setVisible} />
                    <div className="grid gap-1.5 leading-none">
                      <FieldLabel htmlFor="section-visible">
                        Mostrar esta sección en el sitio
                      </FieldLabel>
                      <FieldDescription>
                        Podrás conservar el borrador aunque permanezca oculta.
                      </FieldDescription>
                    </div>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Medio destacado</CardTitle>
              <CardDescription>
                Reemplaza la imagen editorial que acompaña el bloque.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldSet>
                <FieldLegend className="sr-only">Imagen destacada</FieldLegend>
                <FieldGroup>
                  <MediaUploadField
                    id="section-image"
                    image={image}
                    fileName={imageName}
                    onSelect={replaceImage}
                  />
                  <Field>
                    <FieldLabel htmlFor="section-image-alt">Descripción de la imagen</FieldLabel>
                    <Input
                      id="section-image-alt"
                      value={content.imageAlt}
                      onChange={(event) => updateContent("imageAlt", event.target.value)}
                    />
                    <FieldDescription>
                      Ayuda a las personas que usan lectores de pantalla.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              La miniatura y todas las vistas previas se actualizan al seleccionar un archivo.
            </CardFooter>
          </Card>
        </div>

        <Card className="h-fit rounded-2xl 2xl:sticky 2xl:top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <Eye /> Vista previa
            </CardTitle>
            <CardDescription>Así se integrará este bloque en la página pública.</CardDescription>
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
                <SectionPreview
                  content={content}
                  image={image}
                  visible={visible}
                  device="desktop"
                />
              </TabsContent>
              <TabsContent value="tablet" className="mt-5 flex justify-center">
                <div className="w-full max-w-xl overflow-hidden rounded-2xl border-4 border-foreground bg-background shadow-sm">
                  <SectionPreview
                    content={content}
                    image={image}
                    visible={visible}
                    device="tablet"
                  />
                </div>
              </TabsContent>
              <TabsContent value="mobile" className="mt-5 flex justify-center">
                <div className="w-full max-w-72 overflow-hidden rounded-[1.75rem] border-8 border-foreground bg-background shadow-sm">
                  <SectionPreview
                    content={content}
                    image={image}
                    visible={visible}
                    device="mobile"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Badge variant="outline">
              <ImagePlus /> Medio listo para revisar
            </Badge>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}

function SectionPreview({
  content,
  image,
  visible,
  device,
}: {
  content: SectionDefinition;
  image: string;
  visible: boolean;
  device: "desktop" | "tablet" | "mobile";
}) {
  const compact = device !== "desktop";

  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted/20">
      <div
        className={cn(
          "grid",
          device === "desktop"
            ? "min-h-80 md:grid-cols-2"
            : device === "tablet"
              ? "min-h-[30rem]"
              : "min-h-[38rem]",
        )}
      >
        <img
          src={image}
          alt={content.imageAlt}
          className={cn("w-full object-cover", compact ? "h-56" : "h-full min-h-56")}
        />
        <div className={cn("flex flex-col justify-center", compact ? "p-5" : "p-6 sm:p-8")}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            {content.eyebrow}
          </p>
          <h2
            className={cn(
              "mt-3 font-serif leading-tight text-foreground",
              compact ? "text-2xl" : "text-3xl",
            )}
          >
            {content.heading}
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{content.copy}</p>
          <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold text-foreground">
            {content.action} <ArrowUpRight />
          </span>
        </div>
      </div>
      {!visible ? (
        <div className="border-t bg-muted/50 px-5 py-3 text-center text-sm text-muted-foreground">
          Esta sección está oculta en el sitio público.
        </div>
      ) : null}
    </div>
  );
}
