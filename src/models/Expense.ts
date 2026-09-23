import { Document, Model, Schema, model, models } from "mongoose";

export type ExpenseStatus = "pending" | "paid" | "cancelled";

export interface IExpense {
  description: string;
  amount: number;
  category: string;
  date: Date;
  status: ExpenseStatus;
  vendor?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ExpenseDocument = IExpense & Document;
export type ExpenseModel = Model<IExpense>;

const expenseSchema = new Schema<IExpense>(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["pending", "paid", "cancelled"], default: "paid" },
    vendor: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Expense: ExpenseModel =
  models.Expense || model<IExpense>("Expense", expenseSchema);

export default Expense;
