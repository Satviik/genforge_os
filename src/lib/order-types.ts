import type { OrderChannel, OrderStatus, PaymentMethod, PaymentStatus } from "@/src/models/Order";

export type OrderResponse = {
  id: string;
  orderNumber: string;
  customer: { id: string; name: string; phone: string };
  teamMember: { id: string; name: string };
  items: { productId: string; name: string; sku: string; quantity: number; unitPrice: number }[];
  channel: OrderChannel;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount: number;
  status: OrderStatus;
  notes: string;
  timeline: { status: OrderStatus; at: string }[];
  createdAt?: string;
  updatedAt?: string;
};
