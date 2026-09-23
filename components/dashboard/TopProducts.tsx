import { Box } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatINR, formatNumber } from "@/lib/format";
import type { TopProduct } from "@/lib/types/dashboard";

export function TopProducts({ products }: { products: TopProduct[] }) {
  return (
    <Panel className="h-full">
      <PanelHeader title="Top Products" />
      <div className="space-y-1">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 rounded-md px-1 py-1.5"
          >
            <div className="flex size-8 items-center justify-center rounded-md border border-gf-border bg-gf-surface text-gf-orange">
              <Box className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] text-gf-text">{product.name}</p>
              <p className="text-[10px] text-gf-muted">
                {formatNumber(product.unitsSold)} sold
              </p>
            </div>
            <p className="text-[12px] font-medium text-gf-text">
              {formatINR(product.revenue)}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
