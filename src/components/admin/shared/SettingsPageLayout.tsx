import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export function SettingsPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 2xl:p-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 border-b pb-6">
          <Button variant="ghost" size="sm" asChild className="w-fit -ml-2 text-muted-foreground">
            <Link to="/admin/configuracion">
              <ArrowLeft data-icon="inline-start" /> Todas las configuraciones
            </Link>
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex max-w-2xl flex-col gap-2 border-l-2 border-accent pl-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Sistema AUTEM
              </p>
              <h1 className="font-serif text-3xl text-foreground">{title}</h1>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <Badge variant="outline">
              <CircleCheck /> Edición local
            </Badge>
          </div>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}
