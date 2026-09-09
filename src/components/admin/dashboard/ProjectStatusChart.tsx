import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartData = [
  { month: "Abr", contacts: 18 },
  { month: "May", contacts: 27 },
  { month: "Jun", contacts: 24 },
  { month: "Jul", contacts: 39 },
  { month: "Ago", contacts: 46 },
  { month: "Sep", contacts: 58 },
]

const chartConfig = { contacts: { label: "Contactos", color: "#c5a059" } } satisfies ChartConfig

export function ProjectStatusChart() {
  return <Card className="overflow-hidden rounded-2xl">
    <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div><CardTitle className="font-serif text-2xl">Interés por proyectos</CardTitle><CardDescription>Contactos recibidos durante los últimos seis meses.</CardDescription></div>
      <p className="text-sm font-medium text-accent">+26% <span className="font-normal text-muted-foreground">vs. periodo anterior</span></p>
    </CardHeader>
    <CardContent className="px-2 pb-3 sm:px-5">
      <ChartContainer config={chartConfig} className="h-[240px] w-full aspect-auto sm:h-[300px]">
        <AreaChart data={chartData} margin={{ left: -16, right: 8, top: 12 }}>
          <defs><linearGradient id="autemContacts" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="var(--color-contacts)" stopOpacity={0.35} /><stop offset="95%" stopColor="var(--color-contacts)" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis width={34} tickLine={false} axisLine={false} tickMargin={8} className="hidden sm:block" />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
          <Area dataKey="contacts" type="natural" fill="url(#autemContacts)" fillOpacity={1} stroke="var(--color-contacts)" strokeWidth={2.5} />
        </AreaChart>
      </ChartContainer>
    </CardContent>
  </Card>
}
