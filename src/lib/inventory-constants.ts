export const inventoryTransactionReasons = [
  "Purchase",
  "Production Usage",
  "Manual Adjustment",
  "Damaged",
  "Other",
  "Partner Allocation",
  "Partner Sale",
  "Partner Return",
] as const;

export type InventoryTransactionReason = (typeof inventoryTransactionReasons)[number];
