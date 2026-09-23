import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatINR } from "@/lib/format";
import type { ExpenseItem } from "@/lib/types/dashboard";

export function ExpensesPanel({
  items,
  total,
}: {
  items: ExpenseItem[];
  total: number;
}) {
  return (
    <Panel className="h-full">
      <PanelHeader title="Expenses" subtitle="Selected period" />
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] text-gf-text">{item.label}</p>
              <p className="text-[10px] text-gf-muted">{item.category}</p>
            </div>
            <p className="text-[12px] text-gf-text">{formatINR(item.amount)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-gf-border pt-3 text-[12px]">
        <span className="text-gf-muted">Total</span>
        <span className="font-medium text-gf-orange">{formatINR(total)}</span>
      </div>
    </Panel>
  );
}
