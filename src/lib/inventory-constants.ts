export const inventoryTransactionReasons = [
  "Purchase",
  "Production Usage",
  "Manual Adjustment",
  "Damaged",
  "Other",
] as const;

export type InventoryTransactionReason = (typeof inventoryTransactionReasons)[number];
