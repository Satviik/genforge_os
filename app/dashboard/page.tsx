"use client";

import { useEffect, useState } from "react";
import { OverviewDashboard } from "@/components/dashboard/OverviewDashboard";
import { Panel } from "@/components/ui/panel";
import { useReportingPeriod } from "@/components/layout/ReportingPeriodContext";
import type { OverviewDashboardData } from "@/lib/types/dashboard";

export default function OverviewPage() {
  const { range } = useReportingPeriod();
  const [data, setData] = useState<OverviewDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const query = range.kind === "all" ? "period=all" : `from=${range.from}&to=${range.to}`;
        const response = await fetch(`/api/overview?${query}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load overview data.");
        if (!cancelled) setData(payload as OverviewDashboardData);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load overview data.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [range]);

  if (error) return <Panel><p className="text-sm text-[#ff8b8b]">{error}</p></Panel>;
  if (!data) return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[1, 2, 3, 4, 5].map((item) => <Panel key={item} className="h-28 animate-pulse"><div className="h-3 w-24 rounded bg-gf-card-raised" /><div className="mt-5 h-6 w-32 rounded bg-gf-card-raised" /></Panel>)}</div>;
  return <OverviewDashboard data={data} />;
}
