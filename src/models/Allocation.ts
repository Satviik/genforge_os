import { Document, Model, Schema, Types, model, models } from "mongoose";

export const allocationStatuses = ["active", "partially_settled", "settled", "cancelled"] as const;
export type AllocationStatus = (typeof allocationStatuses)[number];
export type AllocationPersonType = "customer" | "reseller" | "influencer" | "business" | "distributor" | "partner";

export interface IAllocationProduct {
  productId: Types.ObjectId;
  quantity: number;
  unitValue: number;
  totalValue: number;
  quantitySold: number;
  quantityReturned: number;
}

export interface IAllocation {
  personId: Types.ObjectId;
  personType: AllocationPersonType;
  status: AllocationStatus;
  products: IAllocationProduct[];
  moneyGiven: number;
  moneyReturned: number;
  notes?: string;
  allocatedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AllocationDocument = IAllocation & Document;
export type AllocationModel = Model<IAllocation>;

const allocationProductSchema = new Schema<IAllocationProduct>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitValue: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, required: true, min: 0 },
    quantitySold: { type: Number, required: true, min: 0, default: 0 },
    quantityReturned: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const allocationSchema = new Schema<IAllocation>(
  {
    personId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    personType: { type: String, enum: ["customer", "reseller", "influencer", "business", "distributor", "partner"], required: true },
    status: { type: String, enum: allocationStatuses, required: true, default: "active", index: true },
    products: { type: [allocationProductSchema], required: true, validate: [(items: IAllocationProduct[]) => items.length > 0, "Allocation must include at least one product"] },
    moneyGiven: { type: Number, required: true, min: 0, default: 0 },
    moneyReturned: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, trim: true },
    allocatedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

export const Allocation: AllocationModel = models.Allocation || model<IAllocation>("Allocation", allocationSchema);
export default Allocation;