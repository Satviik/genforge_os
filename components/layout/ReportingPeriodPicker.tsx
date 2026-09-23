"use client";

import { useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocalDateValue, useReportingPeriod } from "@/components/layout/ReportingPeriodContext";

type Preset = "all" | "today" | "yesterday" | "thisWeek" | "thisMonth" | "lastMonth" | "thisYear";
type CustomRange = { from: string; to: string };
const presets: { value: Preset; label: string }[] = [{ value: "all", label: "All time" }, { value: "today", label: "Today" }, { value: "yesterday", label: "Yesterday" }, { value: "thisWeek", label: "This week" }, { value: "thisMonth", label: "This month" }, { value: "lastMonth", label: "Last month" }, { value: "thisYear", label: "This year" }];

function boundedPresetRange(preset: Exclude<Preset, "all">): CustomRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "today") return { from: getLocalDateValue(today), to: getLocalDateValue(today) };
  if (preset === "yesterday") { const date = new Date(today); date.setDate(date.getDate() - 1); return { from: getLocalDateValue(date), to: getLocalDateValue(date) }; }
  if (preset === "thisWeek") { const start = new Date(today); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); return { from: getLocalDateValue(start), to: getLocalDateValue(today) }; }
  if (preset === "lastMonth") return { from: getLocalDateValue(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: getLocalDateValue(new Date(today.getFullYear(), today.getMonth(), 0)) };
  if (preset === "thisYear") return { from: getLocalDateValue(new Date(today.getFullYear(), 0, 1)), to: getLocalDateValue(today) };
  return { from: getLocalDateValue(new Date(today.getFullYear(), today.getMonth(), 1)), to: getLocalDateValue(today) };
}

function presetRange(preset: Preset) {
  return preset === "all" ? { kind: "all" as const } : { kind: "range" as const, ...boundedPresetRange(preset) };
}

export function ReportingPeriodPicker() {
  const { range, label, setRange } = useReportingPeriod();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState<CustomRange>(() => range.kind === "range" ? { from: range.from, to: range.to } : boundedPresetRange("thisMonth"));
  return <div className="relative hidden lg:block">
    <Button type="button" variant="outline" size="sm" onClick={() => { setCustom(range.kind === "range" ? { from: range.from, to: range.to } : boundedPresetRange("thisMonth")); setOpen((current) => !current); }} aria-expanded={open} aria-label="Select reporting period" className="gap-1.5 font-normal"><CalendarRange className="size-3.5 text-gf-muted" />{label}<ChevronDown className="size-3 text-gf-muted" /></Button>
    {open ? <div className="absolute right-0 top-11 z-40 w-64 rounded-md border border-gf-border bg-gf-card p-2 shadow-2xl"><div className="grid grid-cols-2 gap-1">{presets.map((preset) => <button key={preset.value} type="button" onClick={() => { setRange(presetRange(preset.value)); setOpen(false); }} className="rounded px-2 py-1.5 text-left text-[11px] text-gf-secondary hover:bg-white/5 hover:text-gf-text">{preset.label}</button>)}</div><div className="mt-2 border-t border-gf-border pt-2"><p className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-gf-muted">Custom range</p><div className="grid gap-2"><input type="date" value={custom.from} max={custom.to} onChange={(event) => setCustom((current) => ({ ...current, from: event.target.value }))} className="h-8 rounded border border-gf-border bg-gf-surface px-2 text-[11px] text-gf-secondary" /><input type="date" value={custom.to} min={custom.from} onChange={(event) => setCustom((current) => ({ ...current, to: event.target.value }))} className="h-8 rounded border border-gf-border bg-gf-surface px-2 text-[11px] text-gf-secondary" /></div><Button type="button" size="sm" className="mt-2 w-full" disabled={!custom.from || !custom.to} onClick={() => { setRange({ kind: "range", ...custom }); setOpen(false); }}>Apply range</Button></div></div> : null}
  </div>;
}