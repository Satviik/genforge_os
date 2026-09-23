import { z } from "zod";
import { allocationStatuses } from "@/src/models/Allocation";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id.");

export const allocationPersonTypes = ["customer", "reseller", "influencer", "business", "distributor", "partner"] as const;

export const allocationSchema = z.object({
  personId: objectId,
  personType: z.enum(allocationPersonTypes),
  products: z.array(z.object({ productId: objectId, quantity: z.number().int().positive() })).min(1),
  moneyGiven: z.number().finite().nonnegative().default(0),
  notes: z.string().trim().max(2000).optional(),
  allocatedAt: z.coerce.date().optional(),
});

export const allocationPatchSchema = z.object({
  status: z.enum(allocationStatuses).optional(),
  notes: z.string().trim().max(2000).optional(),
});