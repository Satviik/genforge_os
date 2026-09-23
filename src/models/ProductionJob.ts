import { Document, Model, Schema, Types, model, models } from "mongoose";
import { productionStatuses, type ProductionStatus } from "@/src/lib/production-constants";

export interface IProductionTimelineEvent {
  status: ProductionStatus;
  at: Date;
}

export interface IProductionJob {
  order: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  printer: string;
  material?: Types.ObjectId;
  materialUsed: number;
  estimatedPrintTime: number;
  actualPrintTime?: number;
  status: ProductionStatus;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  timeline: IProductionTimelineEvent[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductionJobDocument = IProductionJob & Document;
export type ProductionJobModel = Model<IProductionJob>;

const productionJobSchema = new Schema<IProductionJob>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    printer: { type: String, required: true, trim: true, default: "Manual / Unassigned" },
    material: { type: Schema.Types.ObjectId, ref: "Material" },
    materialUsed: { type: Number, min: 0, default: 0 },
    estimatedPrintTime: { type: Number, required: true, min: 0 },
    actualPrintTime: { type: Number, min: 0 },
    status: { type: String, enum: productionStatuses, default: "queued" },
    startedAt: Date,
    completedAt: Date,
    notes: { type: String, trim: true },
    timeline: {
      type: [{ status: { type: String, enum: productionStatuses, required: true }, at: { type: Date, required: true } }],
      default: [],
    },
  },
  { timestamps: true },
);

export const ProductionJob: ProductionJobModel =
  models.ProductionJob || model<IProductionJob>("ProductionJob", productionJobSchema);

export default ProductionJob;
