export type ReportingRange = { kind: "all" } | { kind: "range"; from: string; to: string };

function isDateString(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function getReportingRange(searchParams: URLSearchParams) {
  if (searchParams.get("period") === "all") return { kind: "all" as const };
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!isDateString(from) || !isDateString(to) || from > to) throw new Error("Invalid reporting period.");
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Invalid reporting period.");
  return { kind: "range" as const, from, to, start, end };
}

export function dateRangeFilter(range: { start: Date; end: Date }) {
  return { $gte: range.start, $lt: range.end };
}

export function getDateOnlyRange(from: string | null, to: string | null) {
  if ((!from && to) || (from && !to) || !isDateString(from) || !isDateString(to) || from > to) throw new Error("Invalid date range.");
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Invalid date range.");
  return { start, end };
}