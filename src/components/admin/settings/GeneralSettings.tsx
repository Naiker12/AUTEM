import { Building2, Save } from "lucide-react";
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

export function GeneralSettings() {
  const [saved, setSaved] = useState(false);
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl border bg-muted text-accent">
            <Building2 className="size-5" />
          </span>
          <Badge variant="outline">Identidad institucional</Badge>
        </div>
        <CardTitle className="mt-3 font-serif text-2xl">Datos generales</CardTitle>
        <CardDescription>
          Información que identifica a AUTEM dentro del panel y en comunicaciones públicas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="company-name">Nombre de la organización</FieldLabel>
              <Input id="company-name" defaultValue="AUTEM" onChange={() => setSaved(false)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-email">Correo administrativo</FieldLabel>
              <Input
                id="company-email"
                type="email"
                placeholder="administracion@autem.co"
                onChange={() => setSaved(false)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-phone">Teléfono de contacto</FieldLabel>
              <Input
                id="company-phone"
                defaultValue="+57 300 720 0894"
                onChange={() => setSaved(false)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-city">Ciudad principal</FieldLabel>
              <Input
                id="company-city"
                defaultValue="Cartagena, Bolívar"
                onChange={() => setSaved(false)}
              />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="company-description">Descripción institucional</FieldLabel>
              <Textarea
                id="company-description"
                defaultValue="Territorio, arquitectura y visualización inmobiliaria."
                onChange={() => setSaved(false)}
              />
              <FieldDescription>
                Se usará como texto de apoyo cuando la experiencia lo requiera.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {saved ? "Cambios guardados en esta sesión." : "Los cambios aún no se han guardado."}
        </p>
        <Button onClick={() => setSaved(true)}>
          <Save data-icon="inline-start" /> Guardar cambios
        </Button>
      </CardFooter>
    </Card>
  );
}
