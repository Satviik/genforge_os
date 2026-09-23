import { Document, Model, Schema, Types, model, models } from "mongoose";

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderChannel = "direct" | "instagram" | "marketplace" | "website";

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  unitPrice: number;
}

export interface IOrder {
  orderNumber: string;
  customer: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  channel: OrderChannel;
  notes?: string;
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
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    items: { type: [orderItemSchema], required: true, validate: [(items: IOrderItem[]) => items.length > 0, "Order must include at least one item"] },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    channel: { type: String, enum: ["direct", "instagram", "marketplace", "website"], required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Order: OrderModel = models.Order || model<IOrder>("Order", orderSchema);

export default Order;
