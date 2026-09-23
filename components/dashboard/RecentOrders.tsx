import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatINR } from "@/lib/format";
import type { RecentOrder } from "@/lib/types/dashboard";

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <Panel className="h-full">
      <PanelHeader
        title="Recent Orders"
        action={
          <Link
            href="/dashboard/orders"
            className="text-[11px] text-gf-orange hover:text-[#ff8a33]"
          >
            View All
          </Link>
        }
      />
      <div className="space-y-1">
        {orders.map((order) => (
          <div
            key={order.id}
            className="grid grid-cols-[72px_1fr_auto_auto] items-center gap-3 rounded-md px-1 py-1.5 text-[12px]"
          >
            <span className="font-mono text-[11px] text-gf-muted">{order.id}</span>
            <span className="truncate text-gf-text">{order.customerName}</span>
            <span className="text-right text-gf-text">{formatINR(order.amount)}</span>
            <div className="flex min-w-[108px] items-center justify-end gap-2">
              <Badge tone={order.status === "Paid" ? "success" : "warning"}>
                {order.status}
              </Badge>
              <span className="w-[62px] text-right text-[10px] text-gf-muted">
                {order.relativeTime}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
