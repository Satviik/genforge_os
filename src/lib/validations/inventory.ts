import { z } from "zod";
import { inventoryTransactionReasons } from "@/src/lib/inventory-constants";

export const materialSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  sku: z.string().trim().min(1, "SKU is required.").max(50).transform((value) => value.toUpperCase()),
  unit: z.string().trim().min(1, "Unit is required.").max(30),
  currentQuantity: z.number().finite().min(0),
  minimumQuantity: z.number().finite().min(0),
  costPerUnit: z.number().finite().min(0),
  supplier: z.string().trim().max(120).optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export const materialUpdateSchema = materialSchema.partial();

export const inventoryAdjustmentSchema = z.object({
  material: z.string().min(1),
  quantityChange: z.number().finite().refine((value) => value !== 0, "Quantity change cannot be zero."),
  reason: z.enum(inventoryTransactionReasons),
  date: z.coerce.date(),
  user: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type MaterialInput = z.infer<typeof materialSchema>;
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
