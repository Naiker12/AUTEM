import { ChevronRight } from "lucide-react";

interface AdminBreadcrumbsProps {
  items: string[];
}

export function AdminBreadcrumbs({ items }: AdminBreadcrumbsProps) {
  return (
    <nav
      aria-label="Ruta de navegación"
      className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
    >
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="size-3" />}
          {index === items.length - 1 ? (
            <span className="font-medium text-foreground">{item}</span>
          ) : (
            item
          )}
        </span>
      ))}
    </nav>
  );
}
