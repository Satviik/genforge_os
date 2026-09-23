import { Document, Model, Schema, Types, model, models } from "mongoose";

export type NotificationType =
  | "team_member_created"
  | "team_member_deactivated"
  | "product_created"
  | "order_created"
  | "order_status_changed"
  | "payment_received"
  | "expense_created"
  | "inventory_adjusted"
  | "inventory_low_stock"
  | "production_job_created"
  | "production_job_completed"
  | "allocation_created"
  | "allocation_sale"
  | "allocation_return"
  | "allocation_payment"
  | "allocation_settlement";

export type NotificationEntityType = "team" | "product" | "order" | "expense" | "inventory" | "production" | "allocation";

export interface INotification {
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: Types.ObjectId;
  read: boolean;
  metadata?: Record<string, string | number>;
  dedupeKey: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationDocument = INotification & Document;
export type NotificationModel = Model<INotification>;

const notificationSchema = new Schema<INotification>(
  {
    type: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
    dedupeKey: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true },
);

export const Notification: NotificationModel = models.Notification || model<INotification>("Notification", notificationSchema);
export default Notification;