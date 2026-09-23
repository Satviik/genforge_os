import type { IOrderItem } from "@/src/models/Order";

export type OrderFinancialInputs = {
  items: Pick<IOrderItem, "quantity" | "unitPrice">[];
  discount: number;
  shipping: number;
};

export function calculateOrderTotals(order: OrderFinancialInputs) {
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - order.discount + order.shipping);
  return { subtotal, total };
}
