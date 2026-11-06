import { CircleCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link
          to="/admin/perfil"
          className="flex items-center gap-3 rounded-lg border bg-sidebar-accent/40 p-2 transition-colors hover:bg-sidebar-accent"
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg">AU</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
          <CircleCheck className="size-4 shrink-0 text-accent" aria-label="Entorno local activo" />
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
