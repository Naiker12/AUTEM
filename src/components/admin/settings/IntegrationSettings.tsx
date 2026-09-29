import { MessageCircleMore, Save, Workflow } from "lucide-react";
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

export function IntegrationSettings() {
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const markDirty = () => setSaved(false);
  return (
    <Card id="integraciones" className="scroll-mt-24 rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl border bg-muted text-accent">
            <Workflow className="size-5" />
          </span>
          <Badge variant="outline">Canales externos</Badge>
        </div>
        <CardTitle className="mt-3 font-serif text-2xl">Integraciones</CardTitle>
        <CardDescription>
          Prepara los servicios externos autorizados para el sitio público.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field orientation="responsive" className="rounded-xl border p-4">
              <MessageCircleMore className="text-muted-foreground" />
              <FieldContent>
                <FieldLabel htmlFor="whatsapp-enabled">WhatsApp</FieldLabel>
                <FieldDescription>
                  Canal principal de contacto. Solo se activará tras validar el número.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="whatsapp-enabled"
                checked={whatsAppEnabled}
                onCheckedChange={(value) => {
                  setWhatsAppEnabled(value);
                  markDirty();
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="whatsapp-number">Número de WhatsApp</FieldLabel>
              <Input
                id="whatsapp-number"
                defaultValue="573007200894"
                disabled={!whatsAppEnabled}
                onChange={markDirty}
              />
              <FieldDescription>
                Incluye prefijo de país, sin espacios ni símbolos.
              </FieldDescription>
            </Field>
            <Field orientation="responsive" className="rounded-xl border p-4">
              <FieldContent>
                <FieldLabel htmlFor="analytics-enabled">Analítica web</FieldLabel>
                <FieldDescription>
                  Mide visitas y conversiones cuando se conecte una propiedad de analítica
                  autorizada.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="analytics-enabled"
                checked={analyticsEnabled}
                onCheckedChange={(value) => {
                  setAnalyticsEnabled(value);
                  markDirty();
                }}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {saved
            ? "Integraciones guardadas en esta sesión."
            : "Los cambios aún no se han guardado."}
        </p>
        <Button onClick={() => setSaved(true)}>
          <Save data-icon="inline-start" /> Guardar integraciones
        </Button>
      </CardFooter>
    </Card>
  );
}
