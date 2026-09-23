import { z } from "zod";

export const orderChannels = ["website", "instagram", "direct", "whatsapp", "marketplace", "other"] as const;
export const orderStatuses = ["new", "confirmed", "production", "ready", "shipped", "delivered", "cancelled"] as const;
export const paymentStatuses = ["pending", "partial", "paid", "refunded"] as const;
export const paymentMethods = ["upi", "cash", "bank_transfer", "card", "other"] as const;

const money = z.number().finite().min(0);

export const orderItemSchema = z.object({
  product: z.string().min(1),
  quantity: z.number().int().min(1).max(10000),
});

export const orderSchema = z.object({
  customer: z.string().min(1),
  teamMember: z.string().min(1),
  channel: z.enum(orderChannels),
  items: z.array(orderItemSchema).min(1, "Add at least one product."),
  discount: money.default(0),
  shipping: money.default(0),
  paymentStatus: z.enum(paymentStatuses).default("pending"),
  paymentMethod: z.enum(paymentMethods).optional(),
  paidAmount: money.default(0),
  status: z.enum(orderStatuses).default("new"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const orderUpdateSchema = orderSchema.partial();
export type OrderInput = z.infer<typeof orderSchema>;
export type OrderUpdate = z.infer<typeof orderUpdateSchema>;
