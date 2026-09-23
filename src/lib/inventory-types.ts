import type { InventoryTransactionReason } from "@/src/lib/inventory-constants";

export type MaterialResponse = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentQuantity: number;
  minimumQuantity: number;
  costPerUnit: number;
  inventoryValue: number;
  supplier: string;
  active: boolean;
  status: "In Stock" | "Low Stock" | "Out of Stock";
};

export type InventoryTransactionResponse = {
  id: string;
  material: { id: string; name: string; sku: string };
  quantityChange: number;
  reason: InventoryTransactionReason;
  date: string;
  user: { id: string; name: string } | null;
  notes: string;
};
