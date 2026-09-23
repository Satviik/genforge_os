import { z } from "zod";

export const customerTypes = ["customer", "reseller", "influencer", "business", "distributor", "partner"] as const;

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  type: z.enum(customerTypes),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address.").max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const customerUpdateSchema = customerSchema.partial().extend({
  status: z.enum(["active", "inactive"]).optional(),
});
