import { TrendingDown, TrendingUp } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import type { KpiMetric } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 1);
  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 64;
      const y = 22 - ((point - min) / range) * 18;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 64 24" className={cn("h-8 w-16", className)} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function KpiCard({ metric }: { metric: KpiMetric }) {
  const positive = metric.direction === "up";

  return (
    <Panel className="min-w-0">
      <p className="text-[11px] text-gf-secondary">{metric.label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-[22px] font-semibold tracking-tight text-gf-text">
          {metric.value}
        </p>
        <Sparkline points={metric.sparkline} className="text-gf-orange" />
      </div>
      <div
        className={cn(
          "mt-2 inline-flex items-center gap-1 text-[11px]",
          positive ? "text-gf-success" : "text-gf-danger",
        )}
      >
        {positive ? (
          <TrendingUp className="size-3" />
        ) : (
          <TrendingDown className="size-3" />
        )}
        {positive ? "+" : "-"}
        {metric.delta}%
      </div>
    </Panel>
  );
}
