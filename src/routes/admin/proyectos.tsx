import { createFileRoute } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { ProjectTable } from "@/components/admin/projects/ProjectTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/admin/proyectos")({ component: ProjectsPage })
function ProjectsPage() { return <main className="w-full space-y-8 p-5 md:p-8 xl:p-10"><section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Administración</p><h1 className="mt-2 font-serif text-3xl text-foreground">Proyectos</h1><p className="mt-3 text-sm text-muted-foreground">Consulta el estado, disponibilidad y publicación de cada proyecto.</p></div><Button className="rounded-full bg-accent text-accent-foreground"><Plus className="size-4" /> Nuevo proyecto</Button></section><Card className="rounded-2xl"><CardHeader><CardTitle className="font-serif text-2xl">Todos los proyectos</CardTitle><CardDescription>Datos locales de demostración para el frontend.</CardDescription></CardHeader><CardContent><ProjectTable /></CardContent></Card></main> }
