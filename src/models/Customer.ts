import { Document, Model, Schema, model, models } from "mongoose";

export type CustomerStatus = "active" | "inactive";
export type CustomerType = "customer" | "reseller" | "influencer" | "business" | "distributor" | "partner";

export interface ICustomer {
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  status: CustomerStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CustomerDocument = ICustomer & Document;
export type CustomerModel = Model<ICustomer>;

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["customer", "reseller", "influencer", "business", "distributor", "partner"], default: "customer" },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    address: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Customer: CustomerModel =
  models.Customer || model<ICustomer>("Customer", customerSchema);

export default Customer;
