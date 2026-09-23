export type ProductCostInputs = {
  sellingPrice: number;
  materialCost: number;
  productionCost: number;
  packagingCost: number;
  otherCost: number;
};

export type ProductMetrics = {
  totalCost: number;
  profitPerUnit: number;
  profitMargin: number;
};

export function calculateProductMetrics(product: ProductCostInputs): ProductMetrics {
  const totalCost =
    product.materialCost +
    product.productionCost +
    product.packagingCost +
    product.otherCost;
  const profitPerUnit = product.sellingPrice - totalCost;
  const profitMargin = product.sellingPrice > 0
    ? (profitPerUnit / product.sellingPrice) * 100
    : 0;

  return { totalCost, profitPerUnit, profitMargin };
}
