import { Document, Model, Schema, model, models } from "mongoose";

export interface IProduct {
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price: number;
  cost: number;
  stockQuantity: number;
  isActive: boolean;
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
    category: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product: ProductModel =
  models.Product || model<IProduct>("Product", productSchema);

export default Product;
