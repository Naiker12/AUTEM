import { Cell, Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { source: "WhatsApp", value: 52, fill: "#c5a059" },
  { source: "Web", value: 31, fill: "#403a34" },
  { source: "Referidos", value: 17, fill: "#a5682b" },
];
const chartConfig = { value: { label: "Contactos" } } satisfies ChartConfig;

export function LeadSourceChart() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Origen de contactos</CardTitle>
        <CardDescription>Distribución del mes actual.</CardDescription>
      </CardHeader>
      <CardContent className="grid items-center gap-5 pb-6 sm:grid-cols-[minmax(190px,0.85fr)_1.15fr]">
        <ChartContainer config={chartConfig} className="mx-auto h-[210px] w-[210px] aspect-square">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="source" hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="source"
              innerRadius={61}
              outerRadius={88}
              paddingAngle={4}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.source} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-2xl font-semibold"
                      >
                        100%
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 20}
                        className="fill-muted-foreground text-[10px]"
                      >
                        contactos
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="grid gap-2.5">
          {chartData.map((item) => (
            <div
              key={item.source}
              className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/25 px-3.5 py-3"
            >
              <span className="flex items-center gap-2.5 text-sm text-foreground">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                {item.source}
              </span>
              <span className="text-sm font-semibold text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
