export const productionStatuses = [
  "queued",
  "printing",
  "post_processing",
  "quality_check",
  "ready",
  "cancelled",
] as const;

export type ProductionStatus = (typeof productionStatuses)[number];

export const productionStatusLabels: Record<ProductionStatus, string> = {
  queued: "Queued",
  printing: "Printing",
  post_processing: "Post Processing",
  quality_check: "Quality Check",
  ready: "Ready",
  cancelled: "Cancelled",
};
