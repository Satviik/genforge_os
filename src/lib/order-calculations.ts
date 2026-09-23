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

export function paymentValidationMessage(total: number, paymentStatus: string, paidAmount: number): string | null {
  if (paidAmount > total) return "Paid amount cannot exceed the order total.";
  if (paymentStatus === "paid" && paidAmount < total) return "A paid order must include the full order amount.";
  if (paymentStatus === "pending" && paidAmount > 0) return "A pending order cannot have a paid amount.";
  if (paymentStatus === "refunded" && paidAmount !== 0) return "A refunded order must have a paid amount of zero.";
  return null;
}
