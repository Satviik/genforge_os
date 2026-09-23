import { Document, Model, Schema, Types, model, models } from "mongoose";
import { inventoryTransactionReasons, type InventoryTransactionReason } from "@/src/lib/inventory-constants";

export { inventoryTransactionReasons };

export interface IInventoryTransaction {
  material: Types.ObjectId;
  quantityChange: number;
  reason: InventoryTransactionReason;
  date: Date;
  user?: Types.ObjectId;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type InventoryTransactionDocument = IInventoryTransaction & Document;
export type InventoryTransactionModel = Model<IInventoryTransaction>;

const inventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    material: { type: Schema.Types.ObjectId, ref: "Material", required: true },
    quantityChange: { type: Number, required: true },
    reason: { type: String, enum: inventoryTransactionReasons, required: true },
    date: { type: Date, required: true, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: "TeamMember" },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const InventoryTransaction: InventoryTransactionModel =
  models.InventoryTransaction || model<IInventoryTransaction>("InventoryTransaction", inventoryTransactionSchema);

export default InventoryTransaction;
