"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ReportingRange } from "@/src/lib/reporting-period";

type ReportingPeriodContextValue = { range: ReportingRange; setRange: (range: ReportingRange) => void; label: string };
const ReportingPeriodContext = createContext<ReportingPeriodContextValue | null>(null);

function localDateValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

function initialRange(): ReportingRange {
  return { kind: "all" };
}

export function formatReportingDate(value: string) { return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); }

export function ReportingPeriodProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<ReportingRange>(initialRange);
  const label = range.kind === "all" ? "All time" : `${formatReportingDate(range.from)} - ${formatReportingDate(range.to)}`;
  const value = useMemo(() => ({ range, setRange, label }), [label, range]);
  return <ReportingPeriodContext.Provider value={value}>{children}</ReportingPeriodContext.Provider>;
}

export function useReportingPeriod() {
  const value = useContext(ReportingPeriodContext);
  if (!value) throw new Error("useReportingPeriod must be used within ReportingPeriodProvider");
  return value;
}

export function getLocalDateValue(date: Date) { return localDateValue(date); }