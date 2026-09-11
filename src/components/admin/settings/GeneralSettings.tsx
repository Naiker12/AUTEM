import { Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export function GeneralSettings() {
  return (
    <Card id="general" className="scroll-mt-24 rounded-2xl">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Building2 className="size-5" />
        </div>
        <CardTitle className="font-serif text-2xl">General de AUTEM</CardTitle>
        <CardDescription>
          Información que identifica la organización en el panel y comunicaciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company-name">Nombre de la organización</Label>
          <Input id="company-name" defaultValue="AUTEM" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-email">Correo administrativo</Label>
          <Input id="company-email" type="email" defaultValue="administracion@autem.co" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-phone">Teléfono de contacto</Label>
          <Input id="company-phone" defaultValue="+57 300 000 0000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-city">Ciudad principal</Label>
          <Input id="company-city" defaultValue="Cartagena, Bolívar" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="company-description">Descripción institucional</Label>
          <Textarea
            id="company-description"
            defaultValue="Territorio, arquitectura y visualización inmobiliaria."
          />
        </div>
        <Button className="w-fit rounded-full bg-accent text-accent-foreground">
          <Save className="size-4" /> Guardar cambios
        </Button>
      </CardContent>
    </Card>
  );
}
