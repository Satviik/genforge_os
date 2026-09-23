import { Document, Model, Schema, model, models } from "mongoose";

export interface IProduct {
  name: string;
  sku: string;
  description?: string;
  sellingPrice: number;
  materialCost: number;
  productionCost: number;
  packagingCost: number;
  otherCost: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductDocument = IProduct & Document;
export type ProductModel = Model<IProduct>;

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    materialCost: { type: Number, required: true, min: 0 },
    productionCost: { type: Number, required: true, min: 0 },
    packagingCost: { type: Number, required: true, min: 0 },
    otherCost: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product: ProductModel =
  models.Product || model<IProduct>("Product", productSchema);

export default Product;
