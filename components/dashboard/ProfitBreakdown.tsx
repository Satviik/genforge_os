"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatINR } from "@/lib/format";
import type { ProfitBreakdown as ProfitBreakdownData } from "@/lib/types/dashboard";

export function ProfitBreakdown({ data }: { data: ProfitBreakdownData }) {
  const slices = data.slices;

  return (
    <Panel className="h-full">
      <PanelHeader
        title="Profit Breakdown"
        action={<span className="text-[11px] text-gf-muted">This Month</span>}
      />
      <div className="flex items-center gap-4">
        <div className="relative h-[140px] w-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="amount"
                nameKey="label"
                innerRadius={46}
                outerRadius={64}
                stroke="none"
              >
                {slices.map((slice) => (
                  <Cell key={slice.id} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold text-gf-text">{data.profitPercent}%</span>
            <span className="text-[10px] text-gf-muted">Profit</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {slices.map((slice) => (
            <li key={slice.id} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="flex items-center gap-2 text-gf-secondary">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
              <span className="text-gf-text">{formatINR(slice.amount)}</span>
            </li>
          ))}
          <li className="flex items-center justify-between border-t border-gf-border pt-2 text-[11px]">
            <span className="text-gf-muted">Total Costs</span>
            <span className="text-gf-text">{formatINR(data.totalCosts)}</span>
          </li>
        </ul>
      </div>
    </Panel>
  );
}
