import { z } from "zod";
import { productionStatuses } from "@/src/lib/production-constants";

export const productionJobSchema = z.object({
  order: z.string().min(1),
  product: z.string().min(1),
  quantity: z.number().int().min(1),
  printer: z.string().trim().min(1).max(100),
  material: z.string().optional().or(z.literal("")),
  materialUsed: z.number().finite().min(0),
  estimatedPrintTime: z.number().finite().min(0),
  actualPrintTime: z.number().finite().min(0).optional(),
  status: z.enum(productionStatuses).default("queued"),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const productionJobUpdateSchema = productionJobSchema.partial();
export type ProductionJobInput = z.infer<typeof productionJobSchema>;
