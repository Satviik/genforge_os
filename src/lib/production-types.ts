import type { ProductionStatus } from "@/src/lib/production-constants";

export type ProductionJobResponse = {
  id: string;
  order: { id: string; orderNumber: string; customerName: string };
  product: { id: string; name: string; sku: string };
  quantity: number;
  printer: string;
  material: { id: string; name: string; unit: string } | null;
  materialUsed: number;
  estimatedPrintTime: number;
  actualPrintTime?: number;
  status: ProductionStatus;
  startedAt?: string;
  completedAt?: string;
  notes: string;
  timeline: { status: ProductionStatus; at: string }[];
  createdAt?: string;
  updatedAt?: string;
};
