import { ImagePlus, Palette, Save } from "lucide-react";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function AppearanceSettings() {
  const [darkTheme, setDarkTheme] = useState(true);
  const [saved, setSaved] = useState(false);
  const markDirty = () => setSaved(false);

  return (
    <Card id="apariencia" className="scroll-mt-24 rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl border bg-muted text-accent">
            <Palette className="size-5" />
          </span>
          <Badge variant="outline">Identidad visual</Badge>
        </div>
        <CardTitle className="mt-3 font-serif text-2xl">Apariencia y tema</CardTitle>
        <CardDescription>
          Define los colores y las preferencias visuales de las páginas públicas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel>Color principal</FieldLabel>
              <div className="flex items-center gap-3">
                <Input
                  aria-label="Selector de color principal"
                  className="size-10 shrink-0 p-1"
                  defaultValue="#403A34"
                  onChange={markDirty}
                  type="color"
                />
                <Input
                  aria-label="Código de color principal"
                  defaultValue="#403A34"
                  onChange={markDirty}
                />
              </div>
              <FieldDescription>Usado en encabezados y elementos de marca.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Color de acento</FieldLabel>
              <div className="flex items-center gap-3">
                <Input
                  aria-label="Selector de color de acento"
                  className="size-10 shrink-0 p-1"
                  defaultValue="#C5A059"
                  onChange={markDirty}
                  type="color"
                />
                <Input
                  aria-label="Código de color de acento"
                  defaultValue="#C5A059"
                  onChange={markDirty}
                />
              </div>
              <FieldDescription>Reservado para acciones y detalles destacados.</FieldDescription>
            </Field>
          </FieldGroup>
          <Field orientation="responsive" className="rounded-xl border p-4">
            <ImagePlus className="text-muted-foreground" />
            <FieldContent>
              <FieldLabel htmlFor="brand-logo">Logotipo de AUTEM</FieldLabel>
              <FieldDescription>
                SVG o PNG con fondo transparente. La carga se habilitará al conectar el repositorio
                de medios.
              </FieldDescription>
            </FieldContent>
            <Button id="brand-logo" type="button" variant="outline" disabled>
              Reemplazar logo
            </Button>
          </Field>
          <Field orientation="responsive" className="rounded-xl border p-4">
            <FieldContent>
              <FieldLabel htmlFor="dark-theme">Permitir tema oscuro</FieldLabel>
              <FieldDescription>
                Habilita la preferencia visual para visitantes cuando esté disponible en el sitio
                público.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="dark-theme"
              checked={darkTheme}
              onCheckedChange={(value) => {
                setDarkTheme(value);
                markDirty();
              }}
            />
          </Field>
        </FieldSet>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {saved ? "Apariencia guardada en esta sesión." : "Los cambios aún no se han guardado."}
        </p>
        <Button onClick={() => setSaved(true)}>
          <Save data-icon="inline-start" /> Guardar apariencia
        </Button>
      </CardFooter>
    </Card>
  );
}
