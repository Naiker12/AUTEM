import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
}

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-serif text-4xl text-foreground">{value}</div>
        <p className="mt-2 text-xs text-accent">{detail}</p>
      </CardContent>
    </Card>
  );
}
