import { Document, Model, Schema, Types, model, models } from "mongoose";

export const allocationEventTypes = ["sale", "return", "payment"] as const;
export type AllocationEventType = (typeof allocationEventTypes)[number];

export interface IAllocationEvent {
  allocation: Types.ObjectId;
  type: AllocationEventType;
  product?: Types.ObjectId;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
  date: Date;
  channel?: string;
  customer?: Types.ObjectId;
  teamMember?: Types.ObjectId;
  order?: Types.ObjectId;
  paymentMethod?: string;
  reference?: string;
  reason?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AllocationEventDocument = IAllocationEvent & Document;
export type AllocationEventModel = Model<IAllocationEvent>;

const allocationEventSchema = new Schema<IAllocationEvent>(
  {
    allocation: { type: Schema.Types.ObjectId, ref: "Allocation", required: true, index: true },
    type: { type: String, enum: allocationEventTypes, required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, min: 1 },
    unitPrice: { type: Number, min: 0 },
    amount: { type: Number, min: 0 },
    date: { type: Date, required: true, index: true },
    channel: { type: String, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    teamMember: { type: Schema.Types.ObjectId, ref: "TeamMember" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    paymentMethod: { type: String, trim: true },
    reference: { type: String, trim: true },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const AllocationEvent: AllocationEventModel = models.AllocationEvent || model<IAllocationEvent>("AllocationEvent", allocationEventSchema);
export default AllocationEvent;
