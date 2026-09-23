"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatCompactINR } from "@/lib/format";
import type { ChannelRevenue } from "@/lib/types/dashboard";

export function RevenueByChannel({ data }: { data: ChannelRevenue[] }) {
  return (
    <Panel className="h-full">
      <PanelHeader
        title="Revenue by Channel"
        action={<span className="text-[11px] text-gf-muted">Selected period</span>}
      />
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={28}>
            <XAxis
              dataKey="channel"
              tick={{ fill: "#9B9188", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(255,106,0,0.06)" }}
              contentStyle={{
                background: "#15110D",
                border: "1px solid #2A1D14",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [formatCompactINR(Number(value ?? 0)), "Revenue"]}
            />
            <Bar dataKey="revenue" fill="#FF6A00" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 grid grid-cols-5 gap-2">
        {data.map((item) => (
          <div key={item.channel} className="text-center">
            <p className="text-[12px] font-medium text-gf-text">
              {formatCompactINR(item.revenue)}
            </p>
            <p className="text-[10px] text-gf-muted">{item.channel}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
