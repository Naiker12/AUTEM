import { Globe2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export function DomainSettings() {
  return (
    <Card id="dominios" className="scroll-mt-24 rounded-2xl">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Globe2 className="size-5" />
        </div>
        <CardTitle className="font-serif text-2xl">Dominios y SEO</CardTitle>
        <CardDescription>
          Controla el dominio principal y la información de búsqueda de AUTEM.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="main-domain">Dominio principal</Label>
          <Input id="main-domain" defaultValue="autem.co" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-url">Formato de proyectos</Label>
          <Input id="project-url" defaultValue="autem.co/proyecto/slug" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="seo-title">Título predeterminado</Label>
          <Input id="seo-title" defaultValue="AUTEM — Territorio y arquitectura" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="seo-description">Descripción predeterminada</Label>
          <Textarea
            id="seo-description"
            defaultValue="Proyectos inmobiliarios, arquitectura y visualización 3D en Cartagena."
          />
        </div>
        <Button className="w-fit rounded-full bg-accent text-accent-foreground">
          <Save className="size-4" /> Guardar dominio y SEO
        </Button>
      </CardContent>
    </Card>
  );
}
