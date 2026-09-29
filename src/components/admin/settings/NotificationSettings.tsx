import { Bell, Save } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

const options = [
  {
    id: "new-contact",
    title: "Nuevo contacto",
    description: "Avisa al equipo cuando llega un lead desde la web.",
  },
  {
    id: "project-published",
    title: "Proyecto publicado",
    description: "Confirma cuando un proyecto queda visible al público.",
  },
  {
    id: "availability",
    title: "Cambios de disponibilidad",
    description: "Notifica modificaciones de lotes y reservas.",
  },
];

export function NotificationSettings() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "new-contact": true,
    "project-published": true,
    availability: true,
  });
  const [saved, setSaved] = useState(false);
  return (
    <Card id="notificaciones" className="scroll-mt-24 rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl border bg-muted text-accent">
            <Bell className="size-5" />
          </span>
          <Badge variant="outline">Preferencias del equipo</Badge>
        </div>
        <CardTitle className="mt-3 font-serif text-2xl">Notificaciones</CardTitle>
        <CardDescription>Decide qué eventos deben avisar al equipo administrativo.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            {options.map((option) => (
              <Field key={option.id} orientation="responsive" className="rounded-xl border p-4">
                <FieldContent>
                  <FieldLabel htmlFor={option.id}>{option.title}</FieldLabel>
                  <FieldDescription>{option.description}</FieldDescription>
                </FieldContent>
                <Switch
                  id={option.id}
                  checked={enabled[option.id]}
                  onCheckedChange={(value) => {
                    setEnabled((current) => ({ ...current, [option.id]: value }));
                    setSaved(false);
                  }}
                />
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {saved ? "Preferencias guardadas en esta sesión." : "Los cambios aún no se han guardado."}
        </p>
        <Button onClick={() => setSaved(true)}>
          <Save data-icon="inline-start" /> Guardar preferencias
        </Button>
      </CardFooter>
    </Card>
  );
}
