import { MessageCircleMore, Save, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
export function IntegrationSettings() {
  return (
    <Card id="integraciones" className="scroll-mt-24 rounded-2xl">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Workflow className="size-5" />
        </div>
        <CardTitle className="font-serif text-2xl">Integraciones</CardTitle>
        <CardDescription>Conecta los canales que usará la plataforma.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-border/70 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MessageCircleMore className="size-5 text-[#25d366]" />
              <div>
                <p className="text-sm font-medium">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Canal principal de contacto.</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="whatsapp-number">Número de WhatsApp</Label>
            <Input id="whatsapp-number" defaultValue="573000000000" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
          <div>
            <p className="text-sm font-medium">Analítica web</p>
            <p className="text-xs text-muted-foreground">
              Mide visitas y conversiones de proyectos.
            </p>
          </div>
          <Switch />
        </div>
        <Button className="rounded-full bg-accent text-accent-foreground">
          <Save className="size-4" /> Guardar integraciones
        </Button>
      </CardContent>
    </Card>
  );
}
