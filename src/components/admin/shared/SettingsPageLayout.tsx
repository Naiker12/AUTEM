import { type ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
export function SettingsPageLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <main className="w-full space-y-8 p-5 md:p-8 xl:p-10"><div><Button variant="ghost" size="sm" asChild className="mb-5 -ml-2 text-muted-foreground"><Link to="/admin/configuracion"><ArrowLeft className="size-4" /> Todas las configuraciones</Link></Button><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sistema AUTEM</p><h1 className="mt-2 font-serif text-3xl text-foreground">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p></div><div className="w-full">{children}</div></main> }
