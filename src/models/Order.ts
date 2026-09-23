import { Document, Model, Schema, Types, model, models } from "mongoose";

export type OrderStatus = "new" | "confirmed" | "production" | "ready" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "partial" | "paid" | "refunded";
export type PaymentMethod = "upi" | "cash" | "bank_transfer" | "card" | "other";
export type OrderChannel = "website" | "instagram" | "direct" | "whatsapp" | "marketplace" | "other";

export interface IOrderTimelineEvent {
  status: OrderStatus;
  at: Date;
}

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  productName: string;
  sku: string;
}

export interface IOrder {
  orderNumber: string;
  customer: Types.ObjectId;
  teamMember: Types.ObjectId;
  items: IOrderItem[];
  discount: number;
  shipping: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAmount: number;
  channel: OrderChannel;
  notes?: string;
  timeline: IOrderTimelineEvent[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderDocument = IOrder & Document;
export type OrderModel = Model<IOrder>;

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    teamMember: { type: Schema.Types.ObjectId, ref: "TeamMember", required: true },
    items: { type: [orderItemSchema], required: true, validate: [(items: IOrderItem[]) => items.length > 0, "Order must include at least one item"] },
    discount: { type: Number, required: true, min: 0, default: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["new", "confirmed", "production", "ready", "shipped", "delivered", "cancelled"],
      default: "new",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "refunded"],
      default: "pending",
    },
    paymentMethod: { type: String, enum: ["upi", "cash", "bank_transfer", "card", "other"] },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    channel: { type: String, enum: ["website", "instagram", "direct", "whatsapp", "marketplace", "other"], required: true },
    notes: { type: String, trim: true },
    timeline: {
      type: [{ status: { type: String, required: true }, at: { type: Date, required: true } }],
      default: [],
    },
  },
  { timestamps: true },
);

export const Order: OrderModel = models.Order || model<IOrder>("Order", orderSchema);

export default Order;
