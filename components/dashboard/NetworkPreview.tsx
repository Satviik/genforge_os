import Link from "next/link";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { NetworkPreviewNode } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

const nodePositions: Record<string, string> = {
  products: "top-[6%] left-1/2 -translate-x-1/2",
  orders: "top-[22%] right-[8%]",
  production: "bottom-[28%] right-[10%]",
  profit: "bottom-[6%] left-1/2 -translate-x-1/2",
  expenses: "bottom-[28%] left-[10%]",
  channels: "top-[46%] left-[4%]",
  customers: "top-[22%] left-[8%]",
};

export function NetworkPreview({
  nodes,
  hubValue,
}: {
  nodes: NetworkPreviewNode[];
  hubValue: string;
}) {
  return (
    <Panel className="h-full">
      <PanelHeader
        title="Business Network"
        subtitle="Everything is connected"
        action={
          <Link
            href="/dashboard/network"
            className="text-[11px] text-gf-orange hover:text-[#ff8a33]"
          >
            Open
          </Link>
        }
      />
      <div className="relative mx-auto h-[240px] max-w-[320px]">
        <div className="absolute left-1/2 top-1/2 size-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gf-orange/25" />
        <div className="absolute left-1/2 top-1/2 size-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gf-orange/10" />
        <div className="gf-orange-glow absolute left-1/2 top-1/2 z-10 flex size-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-gf-orange/70 bg-[#1a0f08]">
          <span className="text-[9px] uppercase tracking-[0.16em] text-gf-orange">
            genforge
          </span>
          <span className="text-[13px] font-semibold text-gf-text">{hubValue}</span>
          <span className="text-[9px] text-gf-muted">Revenue</span>
        </div>
        {nodes.map((node) => (
          <div
            key={node.id}
            className={cn(
              "absolute z-10 flex min-w-[86px] flex-col items-center rounded-full border bg-gf-surface/95 px-2.5 py-1.5 text-center",
              node.accent === "green"
                ? "border-gf-success/50 shadow-[0_0_16px_rgba(103,211,145,0.18)]"
                : "border-gf-orange/40",
              nodePositions[node.id],
            )}
          >
            <span className="text-[10px] font-medium text-gf-text">{node.label}</span>
            <span
              className={cn(
                "text-[9px]",
                node.accent === "green" ? "text-gf-success" : "text-gf-muted",
              )}
            >
              {node.meta}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
