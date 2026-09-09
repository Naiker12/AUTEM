import * as React from "react"
import {
  ClipboardList,
  FileImage,
  LayoutDashboard,
  MapPinned,
  Settings,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Equipo AUTEM",
    email: "administracion@autem.co",
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
        { title: "Todos los proyectos", url: "/admin/proyectos" },
        { title: "Nuevo proyecto", url: "/admin/proyectos/nuevo" },
      ],
    },
    { title: "Clientes", url: "#clientes", icon: Users },
    { title: "Contenido y medios", url: "#contenido", icon: FileImage },
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
  projects: [
    { name: "Campos del Sol", url: "/admin/proyectos", icon: MapPinned },
    { name: "Lotes 360°", url: "/admin/proyectos", icon: ClipboardList },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
