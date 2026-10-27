import * as React from "react";
import {
  Boxes,
  ClipboardList,
  FileImage,
  LayoutDashboard,
  MapPinned,
  PanelTop,
  Settings,
  ShieldAlert,
  UsersRound,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { canAccessAdminPath, type AdminAccess } from "@/lib/admin-auth";
import { requireSupabase } from "@/lib/supabase";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const teams = [{ name: "AUTEM", plan: "Administración" }];

const navBase = [
  { title: "Inicio", url: "/admin", icon: LayoutDashboard, isActive: true },
  {
    title: "Proyectos",
    url: "/admin/proyectos",
    icon: MapPinned,
    items: [
      { title: "Catálogo", url: "/admin/proyectos" },
      { title: "Lotes y unidades", url: "/admin/lotes-unidades" },
      { title: "Medios del proyecto", url: "/admin/galerias-planos-recorridos" },
    ],
  },
  {
    title: "Contenido y medios",
    url: "/admin/contenido/portada",
    icon: FileImage,
    isActive: true,
    items: [
      { title: "Portada e identidad", url: "/admin/contenido/portada" },
      { title: "Presentación", url: "/admin/contenido/presentacion" },
      { title: "Servicios", url: "/admin/contenido/servicios" },
      { title: "Áreas de trabajo", url: "/admin/contenido/areas-de-trabajo" },
      { title: "Proceso", url: "/admin/contenido/proceso" },
      { title: "Recursos del proyecto", url: "/admin/contenido/recursos-del-proyecto" },
      { title: "Contacto", url: "/admin/contenido/contacto" },
      { title: "Nosotros", url: "/admin/contenido/nosotros" },
      { title: "Navegación y pie", url: "/admin/contenido/navegacion-y-pie" },
      { title: "Privacidad", url: "/admin/contenido/privacidad" },
    ],
  },
  {
    title: "Experiencias del proyecto",
    url: "/admin/experiencias/visor-lotes",
    icon: Boxes,
    items: [
      { title: "Visor de lotes", url: "/admin/experiencias/visor-lotes" },
      { title: "Masterplan interactivo", url: "/admin/experiencias/masterplan" },
      { title: "Tour panorámico y 3D", disabled: true },
    ],
  },
  {
    title: "Páginas públicas",
    url: "/admin#contenido",
    icon: PanelTop,
    items: [
      { title: "Inicio", disabled: true },
      { title: "Catálogo", disabled: true },
      { title: "Detalle de propiedad", disabled: true },
    ],
  },
  {
    title: "Equipo y accesos",
    url: "/admin/equipo-accesos",
    icon: UsersRound,
  },
  {
    title: "Auditoría y monitoreo",
    url: "/admin/auditoria",
    icon: ShieldAlert,
  },
  {
    title: "Configuración",
    url: "/admin/configuracion",
    icon: Settings,
    items: [
      { title: "General de AUTEM", url: "/admin/configuracion/general" },
      { title: "Apariencia y tema", url: "/admin/configuracion/apariencia" },
      { title: "Dominios y SEO", url: "/admin/configuracion/dominios" },
      { title: "Notificaciones", url: "/admin/configuracion/notificaciones" },
      { title: "Integraciones", url: "/admin/configuracion/integraciones" },
    ],
  },
];

export function AppSidebar({
  access,
  ...props
}: React.ComponentProps<typeof Sidebar> & { access: AdminAccess }) {
  const role = access.role;
  const [projectItems, setProjectItems] = React.useState<
    Array<{ name: string; url: string; icon: typeof MapPinned }>
  >([]);

  React.useEffect(() => {
    let active = true;
    async function loadAuthorizedProjects() {
      try {
        const client = requireSupabase();
        let query = client.from("projects").select("id, name, slug").order("name");
        if (!access.isSuperAdmin) {
          if (!access.assignedProjectIds.length) {
            if (active) setProjectItems([]);
            return;
          }
          query = query.in("id", access.assignedProjectIds);
        }
        const { data } = await query;
        if (active && data) {
          setProjectItems(
            data.map((p) => ({
              name: p.name,
              url: `/admin/proyectos?slug=${p.slug}`,
              icon: MapPinned,
            })),
          );
        }
      } catch {
        // En caso de fallo de red, mantener estado silencioso
      }
    }
    void loadAuthorizedProjects();
    return () => {
      active = false;
    };
  }, [access.assignedProjectIds, access.isSuperAdmin]);

  const visibleNavItems = navBase
    .map((item) => ({
      ...item,
      items: item.items?.filter((child) => !child.url || canAccessAdminPath(role, child.url)),
    }))
    .filter((item) => canAccessAdminPath(role, item.url) || item.items?.length);

  const currentUser = {
    name: access.user.user_metadata?.full_name || access.user.email?.split("@")[0] || "Usuario",
    email: access.user.email || "Usuario autenticado",
    avatar: "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleNavItems} />
        {projectItems.length > 0 && <NavProjects projects={projectItems} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
