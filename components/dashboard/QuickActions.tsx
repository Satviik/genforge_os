import Link from "next/link";
import { Plus } from "lucide-react";
import { ForgeDragon } from "@/components/dashboard/ForgeDragon";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { QuickAction } from "@/lib/types/dashboard";

export function QuickActions({
  actions,
  quote,
}: {
  actions: QuickAction[];
  quote: string;
}) {
  return (
    <Panel className="relative h-full overflow-hidden">
      <PanelHeader title="Quick Actions" />
      <div className="relative z-10 space-y-2">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="flex items-center gap-2 rounded-md border border-gf-border bg-gf-surface/70 px-3 py-2 text-[12px] text-gf-text transition-colors hover:border-gf-orange/50 hover:text-gf-orange"
          >
            <Plus className="size-3.5 text-gf-orange" />
            {action.label}
          </Link>
        ))}
      </div>
      <div className="pointer-events-none absolute -bottom-2 -right-2 w-[46%] max-w-[180px] opacity-90">
        <ForgeDragon />
      </div>
      <p className="relative z-10 mt-8 max-w-[58%] text-[11px] italic leading-relaxed text-gf-secondary">
        “{quote}”
      </p>
    </Panel>
  );
}
