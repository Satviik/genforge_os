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
  unitCost: number;
  productName: string;
  sku: string;
}

export interface IOrder {
  orderNumber: string;
  customer: Types.ObjectId;
  teamMember: Types.ObjectId;
  partner?: Types.ObjectId;
  allocation?: Types.ObjectId;
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
    unitCost: { type: Number, required: true, min: 0, default: 0 },
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
    partner: { type: Schema.Types.ObjectId, ref: "Customer" },
    allocation: { type: Schema.Types.ObjectId, ref: "Allocation" },
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

orderSchema.pre("validate", function validatePaymentState() {
  const total = Math.max(0, this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) - this.discount + this.shipping);
  if (this.paidAmount > total) this.invalidate("paidAmount", "Paid amount cannot exceed the order total.");
  if (this.paymentStatus === "paid" && this.paidAmount < total) this.invalidate("paymentStatus", "A paid order must include the full order amount.");
  if (this.paymentStatus === "pending" && this.paidAmount > 0) this.invalidate("paidAmount", "A pending order cannot have a paid amount.");
  if (this.paymentStatus === "refunded" && this.paidAmount !== 0) this.invalidate("paidAmount", "A refunded order must have a paid amount of zero.");
});

orderSchema.pre("findOneAndUpdate", async function validateUpdatedPaymentState() {
  const current = await this.model.findOne(this.getQuery()).lean();
  if (!current) return;
  const rawUpdate = this.getUpdate() as Record<string, unknown>;
  const update = rawUpdate.$set && typeof rawUpdate.$set === "object" ? rawUpdate.$set as Record<string, unknown> : rawUpdate;
  const items = Array.isArray(update.items) ? update.items : current.items;
  const discount = typeof update.discount === "number" ? update.discount : current.discount;
  const shipping = typeof update.shipping === "number" ? update.shipping : current.shipping;
  const paymentStatus = typeof update.paymentStatus === "string" ? update.paymentStatus : current.paymentStatus;
  const paidAmount = typeof update.paidAmount === "number" ? update.paidAmount : current.paidAmount;
  const total = Math.max(0, (items as Array<{ quantity?: number; unitPrice?: number }>).reduce((sum: number, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0), 0) - discount + shipping);
  if (paidAmount > total) throw new Error("Paid amount cannot exceed the order total.");
  if (paymentStatus === "paid" && paidAmount < total) throw new Error("A paid order must include the full order amount.");
  if (paymentStatus === "pending" && paidAmount > 0) throw new Error("A pending order cannot have a paid amount.");
  if (paymentStatus === "refunded" && paidAmount !== 0) throw new Error("A refunded order must have a paid amount of zero.");
});

export const Order: OrderModel = models.Order || model<IOrder>("Order", orderSchema);

export default Order;
