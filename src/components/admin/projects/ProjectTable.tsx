import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { demoProjects } from "@/data/admin-dashboard"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function ProjectTable() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("todos")
  const visibleProjects = useMemo(() => demoProjects.filter((project) => project.name.toLowerCase().includes(query.toLowerCase()) && (status === "todos" || project.status === status)), [query, status])

  return <div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar proyecto" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="Publicado">Publicado</SelectItem><SelectItem value="Borrador">Borrador</SelectItem></SelectContent></Select></div><div className="overflow-hidden rounded-xl border border-border/70"><Table><TableHeader><TableRow><TableHead>Proyecto</TableHead><TableHead className="hidden md:table-cell">Ubicación</TableHead><TableHead className="hidden sm:table-cell">Lotes</TableHead><TableHead className="text-right">Estado</TableHead></TableRow></TableHeader><TableBody>{visibleProjects.map((project) => <TableRow key={project.name}><TableCell className="font-medium">{project.name}</TableCell><TableCell className="hidden text-muted-foreground md:table-cell">{project.city}</TableCell><TableCell className="hidden sm:table-cell">{project.lots}</TableCell><TableCell className="text-right"><Badge variant="outline" className={project.status === "Publicado" ? "border-accent/60 text-accent" : "text-muted-foreground"}>{project.status}</Badge></TableCell></TableRow>)}{visibleProjects.length === 0 && <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No hay proyectos con esos filtros.</TableCell></TableRow>}</TableBody></Table></div></div>
}
