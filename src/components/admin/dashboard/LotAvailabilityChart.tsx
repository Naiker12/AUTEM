import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartData = [
  { project: "Campos", available: 38, reserved: 12 },
  { project: "Lotes 360", available: 16, reserved: 4 },
  { project: "Punta Arena", available: 11, reserved: 7 },
]

const chartConfig = {
  available: { label: "Disponibles", color: "#c5a059" },
  reserved: { label: "Reservados", color: "#8e682b" },
} satisfies ChartConfig

export function LotAvailabilityChart() {
  return <Card className="rounded-2xl"><CardHeader><CardTitle className="font-serif text-2xl">Disponibilidad de lotes</CardTitle><CardDescription>Inventario actual por proyecto.</CardDescription></CardHeader><CardContent className="px-2 pb-4 sm:px-5"><ChartContainer config={chartConfig} className="h-[250px] w-full aspect-auto"><BarChart data={chartData} margin={{ left: -12, right: 8 }}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="project" tickLine={false} axisLine={false} tickMargin={10} /><ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent indicator="dot" />} /><Bar dataKey="available" stackId="inventory" fill="var(--color-available)" radius={[5, 5, 0, 0]} /><Bar dataKey="reserved" stackId="inventory" fill="var(--color-reserved)" radius={[5, 5, 0, 0]} /></BarChart></ChartContainer></CardContent></Card>
}
