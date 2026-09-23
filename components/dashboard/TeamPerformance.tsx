import { Panel, PanelHeader } from "@/components/ui/panel";
import { formatINR } from "@/lib/format";
import type { TeamMemberPerformance } from "@/lib/types/dashboard";

export function TeamPerformance({ members }: { members: TeamMemberPerformance[] }) {
  return (
    <Panel className="h-full">
      <PanelHeader
        title="Team Performance"
        subtitle="Internal sales and marketing operators"
      />
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-md border border-gf-border/80 bg-gf-surface/50 px-2.5 py-2"
          >
            <div className="flex size-8 items-center justify-center rounded-full border border-gf-border bg-[#2a1408] text-[10px] font-semibold text-gf-orange">
              {member.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] text-gf-text">{member.name}</p>
              <p className="text-[10px] text-gf-muted">
                {member.role} · {member.metricValue} {member.metricLabel.toLowerCase()}
              </p>
            </div>
            <p className="text-[12px] font-medium text-gf-text">
              {formatINR(member.attributedRevenue)}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
