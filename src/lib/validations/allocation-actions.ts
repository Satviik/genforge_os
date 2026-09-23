import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id.");
const date = z.coerce.date().optional();

export const allocationSaleSchema = z.object({
  productId: objectId,
  quantity: z.number().int().positive(),
  unitPrice: z.number().finite().nonnegative(),
  saleDate: date,
  channel: z.enum(["website", "instagram", "direct", "whatsapp", "marketplace", "other"]),
  customerId: objectId.optional().or(z.literal("")),
  teamMemberId: objectId.optional().or(z.literal("")),
  paymentStatus: z.enum(["pending", "partial", "paid", "refunded"]).default("pending"),
  paymentMethod: z.enum(["upi", "cash", "bank_transfer", "card", "other"]).optional(),
  paidAmount: z.number().finite().nonnegative().default(0),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const allocationReturnSchema = z.object({
  productId: objectId,
  quantity: z.number().int().positive(),
  returnDate: date,
  reason: z.string().trim().min(1).max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const allocationPaymentSchema = z.object({
  amount: z.number().finite().positive(),
  paymentDate: date,
  paymentMethod: z.enum(["upi", "cash", "bank_transfer", "card", "other"]),
  reference: z.string().trim().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
