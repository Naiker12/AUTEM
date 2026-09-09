import { createFileRoute } from "@tanstack/react-router"
import { LeadSourceChart } from "@/components/admin/dashboard/LeadSourceChart"
import { LotAvailabilityChart } from "@/components/admin/dashboard/LotAvailabilityChart"
import { MetricCard } from "@/components/admin/dashboard/MetricCard"
import { ProjectStatusChart } from "@/components/admin/dashboard/ProjectStatusChart"
import { QuickActions } from "@/components/admin/dashboard/QuickActions"
import { dashboardMetrics } from "@/data/admin-dashboard"

export const Route = createFileRoute("/admin/")({ component: AdminDashboard })
function AdminDashboard() { return <main className="w-full space-y-8 p-5 md:p-8 xl:p-10"><section className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resumen general</p><h1 className="mt-2 font-serif text-3xl text-foreground">Buenos días, equipo.</h1></div><p className="max-w-md text-sm leading-relaxed text-muted-foreground">Esta vista usa datos de muestra locales.</p></section><section className="grid gap-4 md:grid-cols-3">{dashboardMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section><QuickActions /><ProjectStatusChart /><section className="grid gap-5 xl:grid-cols-2"><LotAvailabilityChart /><LeadSourceChart /></section></main> }
