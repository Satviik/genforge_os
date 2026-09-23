import type { ProductCostInputs, ProductMetrics } from "@/src/lib/product-calculations";

export type ProductResponse = ProductCostInputs &
  ProductMetrics & {
    id: string;
    name: string;
    sku: string;
    description: string;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
