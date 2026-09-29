import * as React from "react";
import {
  Boxes,
  ClipboardList,
  FileImage,
  LayoutDashboard,
  MapPinned,
  PanelTop,
  Settings,
  UsersRound,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { canAccessAdminPath, type OrganizationRole } from "@/lib/admin-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Equipo AUTEM",
    email: "Administración local",
    avatar: "",
  },
  teams: [{ name: "AUTEM", plan: "Administración" }],
  navMain: [
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
  ],
  projects: [{ name: "Villa Paraíso", url: "/admin/proyectos", icon: MapPinned }],
};

export function AppSidebar({
  role,
  ...props
}: React.ComponentProps<typeof Sidebar> & { role: OrganizationRole }) {
  const visibleNavItems = data.navMain
    .map((item) => ({
      ...item,
      items: item.items?.filter((child) => !child.url || canAccessAdminPath(role, child.url)),
    }))
    .filter((item) => canAccessAdminPath(role, item.url) || item.items?.length);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleNavItems} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
