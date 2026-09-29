import { Globe2, Save } from "lucide-react";
import { useState } from "react";
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
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DomainSettings() {
  const [saved, setSaved] = useState(false);
  const markDirty = () => setSaved(false);
  return (
    <Card id="dominios" className="scroll-mt-24 rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl border bg-muted text-accent">
            <Globe2 className="size-5" />
          </span>
          <Badge variant="outline">Visibilidad pública</Badge>
        </div>
        <CardTitle className="mt-3 font-serif text-2xl">Dominios y SEO</CardTitle>
        <CardDescription>
          Define cómo se presenta AUTEM en su dirección web y en buscadores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="main-domain">Dominio principal</FieldLabel>
              <Input id="main-domain" placeholder="ejemplo.com" onChange={markDirty} />
              <FieldDescription>
                Se validará al conectar el dominio a la plataforma.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="project-url">Formato de proyectos</FieldLabel>
              <Input id="project-url" defaultValue="/proyecto/slug" onChange={markDirty} />
              <FieldDescription>La ruta que identifica cada proyecto público.</FieldDescription>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="seo-title">Título predeterminado</FieldLabel>
              <Input
                id="seo-title"
                defaultValue="AUTEM — Territorio y arquitectura"
                onChange={markDirty}
              />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="seo-description">Descripción predeterminada</FieldLabel>
              <Textarea
                id="seo-description"
                defaultValue="Proyectos inmobiliarios, arquitectura y visualización 3D en Cartagena."
                onChange={markDirty}
              />
              <FieldDescription>
                Se usará si un proyecto no tiene una descripción específica.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {saved
            ? "Dominio y SEO guardados en esta sesión."
            : "Los cambios aún no se han guardado."}
        </p>
        <Button onClick={() => setSaved(true)}>
          <Save data-icon="inline-start" /> Guardar cambios
        </Button>
      </CardFooter>
    </Card>
  );
}
