import { Document, Model, Schema, model, models } from "mongoose";

export interface IMaterial {
  name: string;
  sku: string;
  unit: string;
  currentQuantity: number;
  minimumQuantity: number;
  costPerUnit: number;
  supplier?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MaterialDocument = IMaterial & Document;
export type MaterialModel = Model<IMaterial>;

const materialSchema = new Schema<IMaterial>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    unit: { type: String, required: true, trim: true },
    currentQuantity: { type: Number, required: true, min: 0, default: 0 },
    minimumQuantity: { type: Number, required: true, min: 0, default: 0 },
    costPerUnit: { type: Number, required: true, min: 0 },
    supplier: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Material: MaterialModel =
  models.Material || model<IMaterial>("Material", materialSchema);

export default Material;
