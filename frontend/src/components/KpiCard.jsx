import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function KpiCard({ label, value, delta, icon: Icon, tone = "default", testId }) {
  const toneMap = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-500",
    warn: "bg-amber-500/10 text-amber-500",
    danger: "bg-rose-500/10 text-rose-500",
    info: "bg-sky-500/10 text-sky-500",
  };
  return (
    <Card className="p-5 transition-shadow hover:shadow-md" data-testid={testId}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl md:text-3xl font-bold tracking-tight truncate">{value}</div>
          {delta !== undefined && (
            <div className={cn(
              "mt-2 flex items-center gap-1 text-xs font-medium",
              delta >= 0 ? "text-emerald-600" : "text-rose-600",
            )}>
              {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(delta)}% vs last month
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneMap[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
