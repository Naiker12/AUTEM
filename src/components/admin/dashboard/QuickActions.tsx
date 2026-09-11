import { ArrowUpRight, FilePlus2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button className="rounded-full bg-accent text-accent-foreground hover:bg-accent/85">
        <FilePlus2 className="size-4" /> Crear proyecto
      </Button>
      <Button variant="outline" className="rounded-full">
        <MapPinned className="size-4" /> Gestionar lotes
      </Button>
      <Button variant="ghost" className="rounded-full text-accent">
        Ver página pública <ArrowUpRight className="size-4" />
      </Button>
    </div>
  );
}
