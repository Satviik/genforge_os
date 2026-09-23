import { z } from "zod";

const nonNegativeAmount = z.number().finite().min(0);

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  sku: z.string().trim().min(1, "SKU is required.").max(50).transform((value) => value.toUpperCase()),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  sellingPrice: nonNegativeAmount,
  materialCost: nonNegativeAmount,
  productionCost: nonNegativeAmount,
  packagingCost: nonNegativeAmount,
  otherCost: nonNegativeAmount,
  active: z.boolean().default(true),
});

export const productUpdateSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
